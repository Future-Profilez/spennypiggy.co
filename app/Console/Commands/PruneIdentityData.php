<?php

namespace App\Console\Commands;

use App\Uploadcare;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Retention for locally-held identity / KYC data — the one class of personal
 * data on this platform that had no prune at all.
 *
 * `item-views:prune`, `help:prune`, `signup-leads:prune`, `notification-logs:prune`
 * and the activity-feed sweep all bound their tables. Identity data — the most
 * sensitive rows the platform holds — was kept forever, and the single deletion
 * anyone ever wrote for it is COMMENTED OUT in `ProfileController::deleteAccount`.
 *
 * ## What is actually stored locally
 *
 * Verification is Stripe-hosted end to end. `StripeController::createVerificationSession()`
 * mints the session, the document never touches this server, and on a pass
 * `StripeWebhookController` calls `identity->verificationSessions->redact()` so
 * Stripe drops the images too. Two local residues survive that:
 *
 *  - **`user_documents`** — legacy SumSub-era rows holding bare 36-character
 *    UUIDs in `front`/`back`. admin.spennypiggy.co's `UserDocuments` model turns
 *    each one into `https://ucarecdn.com/{value}/` — an unsigned, non-expiring,
 *    public CDN URL for a photo ID. Nothing writes new rows any more: the only
 *    writer is `Auth\TestController::reviewWebhook()`, which instantiates
 *    `App\SumSubClient` — a class that no longer exists in this codebase, so the
 *    path fatals before it can insert.
 *  - **free-text identity payload columns on `users`** — see PAYLOAD_COLUMNS.
 *
 * ## What this command deliberately does NOT clear
 *
 * `identity_status`, `identity_verified_at`, `identity_admin_status`,
 * `identity_admin_reviewed_at` and `kyc_verification_status` are the OUTCOME of
 * a check, not evidence from it. Nulling them would silently un-verify a live
 * creator and destroy the platform's own proof that a check was ever run.
 * Retention removes the evidence and keeps the attestation.
 *
 * Stripe is never called. This command only ever touches local rows.
 */
class PruneIdentityData extends Command
{
    protected $signature = 'identity:prune
                            {--days= : Override the retention window; floored at MIN_RETENTION_DAYS}
                            {--dry-run : Report and change nothing, regardless of the arming flag}
                            {--keep-files : Delete the rows but leave the CDN objects alone (leaves a public, unreferenced ID photo — use only to debug)}
                            {--details : List every affected and every excluded user}';

    protected $description = 'Report (and, when armed, delete) identity/KYC data past its retention window';

    /**
     * ⚠️ An accident guard, not a policy. It exists so a mistyped `--days=0`
     * cannot empty the table in one keystroke.
     */
    public const MIN_RETENTION_DAYS = 90;

    /**
     * Free-text / payload columns describing a person's identity check. These
     * are evidence and are cleared. The status + timestamp columns beside them
     * are the outcome and are kept — see the class docblock.
     *
     * `kyc_error` is not named `identity_*` but is the same class of data: the
     * raw failure payload from the retired SumSub integration.
     */
    private const PAYLOAD_COLUMNS = [
        'identity_verification_details',
        'identity_verification_error',
        'identity_admin_notes',
        'kyc_error',
    ];

    /**
     * A dispute in any of these states is finished. Anything else — including a
     * status this platform has never seen — is treated as OPEN and holds the
     * creator's identity data. Verified against the live `disputes` table, whose
     * only two statuses are `lost` (all with `resolved_at` set) and
     * `needs_response` (all with `resolved_at` null).
     */
    private const CLOSED_DISPUTE_STATUSES = ['won', 'lost', 'warning_closed'];

    /**
     * A payout that reached one of these is settled. `failed` is NOT here on
     * purpose: `StripeWebhookController::requeueFailedRunPayout()` clears
     * `payout_run_id` and retries the payment in the next run, so a failed
     * payout is money still owed.
     */
    private const SETTLED_PAYOUT_STATUSES = ['paid', 'zero_payout'];

    /**
     * `payments.status` values where the money is not finished moving. Taken
     * from the column's own enum definition minus `succeeded` and `refunded`.
     */
    private const UNSETTLED_PAYMENT_STATUSES = [
        'initiated', 'step_up', 'review_hold', 'processing', 'disputed', 'blocked', 'failed',
    ];

    public function handle(): int
    {
        if (! Schema::hasTable('users')) {
            $this->warn('users table not present — nothing to do.');

            return self::SUCCESS;
        }

        $days = max(self::MIN_RETENTION_DAYS, (int) ($this->option('days') ?: config('identity_retention.retention_days', 1825)));
        $cutoff = now()->subDays($days);

        $dryRun = (bool) $this->option('dry-run');
        $armed = ! $dryRun && (bool) config('identity_retention.enabled', false);

        $this->line(sprintf('Retention window: %d days (cutoff %s)', $days, $cutoff->toDateTimeString()));

        if ($dryRun) {
            $this->line('Mode: DRY RUN — nothing will be changed.');
        } elseif (! $armed) {
            $this->warn('Mode: REPORT ONLY — identity_retention.enabled is false, so nothing will be deleted.');
            $this->warn('Set IDENTITY_RETENTION_ENABLED=true to arm real deletion.');
        } else {
            $this->line('Mode: ARMED — matching rows will be deleted.');
        }

        $documents = $this->agedDocuments($cutoff);
        $payloadUsers = $this->agedPayloadUsers($cutoff);

        $candidateIds = $documents->pluck('user_id')
            ->merge($payloadUsers->pluck('id'))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($candidateIds->isEmpty()) {
            $this->info('Nothing past the retention window.');

            return self::SUCCESS;
        }

        $held = $this->heldUsers($candidateIds);

        $deletableDocs = $documents->reject(fn ($row) => isset($held[(int) $row->user_id]));
        $clearableUsers = $payloadUsers->reject(fn ($row) => isset($held[(int) $row->id]));

        $this->report($documents, $payloadUsers, $deletableDocs, $clearableUsers, $held);

        if (! $armed) {
            return self::SUCCESS;
        }

        $this->purge($deletableDocs->pluck('id')->all(), $clearableUsers->pluck('id')->all());

        return self::SUCCESS;
    }

    /**
     * `user_documents` rows past the window. `created_at` is nullable on this
     * table, so a row with no timestamp cannot be aged — it is left alone and
     * counted separately rather than guessed at.
     */
    private function agedDocuments(Carbon $cutoff): Collection
    {
        if (! Schema::hasTable('user_documents')) {
            return collect();
        }

        return DB::table('user_documents')
            ->select('id', 'user_id', 'created_at')
            ->whereNotNull('created_at')
            ->where('created_at', '<', $cutoff)
            ->get();
    }

    /**
     * Users whose identity payload is past the window.
     *
     * Aged against the identity timestamps rather than `users.updated_at` —
     * `updated_at` moves every time somebody edits their bio, which would keep
     * identity evidence alive forever on any active account. A user carrying a
     * payload with NEITHER timestamp set cannot be aged at all and is skipped.
     */
    private function agedPayloadUsers(Carbon $cutoff): Collection
    {
        $columns = $this->presentPayloadColumns();

        if ($columns === []) {
            return collect();
        }

        $hasReviewed = Schema::hasColumn('users', 'identity_admin_reviewed_at');
        $hasVerified = Schema::hasColumn('users', 'identity_verified_at');

        if (! $hasReviewed && ! $hasVerified) {
            return collect();
        }

        $query = DB::table('users')->select('id')->where(function ($q) use ($columns) {
            foreach ($columns as $column) {
                $q->orWhere(fn ($inner) => $inner->whereNotNull($column)->where($column, '!=', ''));
            }
        });

        $query->where(function ($q) use ($cutoff, $hasReviewed, $hasVerified) {
            if ($hasReviewed) {
                $q->orWhere('identity_admin_reviewed_at', '<', $cutoff);
            }

            if ($hasVerified) {
                $q->orWhere(function ($inner) use ($cutoff, $hasReviewed) {
                    if ($hasReviewed) {
                        $inner->whereNull('identity_admin_reviewed_at');
                    }

                    $inner->whereNotNull('identity_verified_at')->where('identity_verified_at', '<', $cutoff);
                });
            }
        });

        return $query->get();
    }

    private function presentPayloadColumns(): array
    {
        return array_values(array_filter(
            self::PAYLOAD_COLUMNS,
            fn (string $column) => Schema::hasColumn('users', $column),
        ));
    }

    /**
     * 🚨 THE SAFETY GATE. Returns [user_id => reason] for every candidate whose
     * identity data must be kept regardless of age.
     *
     * Every rule below is derived from a marker verified to exist in this
     * schema. The one class of hold that CANNOT be expressed is a legal /
     * regulatory hold: there is no `legal_hold` column, flag, model or table
     * anywhere in either app. That gap is why `identity_retention.enabled`
     * defaults to false — a human arming the command stands in for the marker
     * the schema does not have.
     */
    private function heldUsers(Collection $candidateIds): array
    {
        $users = DB::table('users')
            ->select('id', 'uuid', 'suspended_account')
            ->whereIn('id', $candidateIds)
            ->get();

        $held = [];

        // ⚠️ An ORPHAN `user_documents` row — a `user_id` with no `users` row —
        // appears in no query below and is therefore releasable. That is
        // deliberate: every exclusion here is a property of a user who no longer
        // exists, so there is no dispute, payout or hold it could be evidence
        // for. One such row exists on the dev database today (user #11).

        // ── 1. Suspended account ────────────────────────────────────────────
        // A suspension is an unresolved case by definition, and the identity
        // data is the evidence behind it.
        foreach ($users as $user) {
            if ((int) ($user->suspended_account ?? 0) !== 0) {
                $held[(int) $user->id] = 'account suspended';
            }
        }

        // Rows keyed by users.uuid rather than users.id — confirmed by the
        // Eloquent relations (Dispute::creator, PayoutRecord::creator both
        // declare `belongsTo(User::class, 'creator_id', 'uuid')`).
        $uuidToId = $users->filter(fn ($u) => ! empty($u->uuid))
            ->mapWithKeys(fn ($u) => [(string) $u->uuid => (int) $u->id]);
        $uuids = $uuidToId->keys()->all();
        $ids = $users->pluck('id')->map(fn ($id) => (int) $id)->all();

        $mark = function (iterable $keys, string $reason, ?Collection $map = null) use (&$held): void {
            foreach ($keys as $key) {
                $id = $map ? ($map[(string) $key] ?? null) : (int) $key;

                if ($id !== null && ! isset($held[$id])) {
                    $held[$id] = $reason;
                }
            }
        };

        // ── 2. Open dispute ─────────────────────────────────────────────────
        if ($uuids !== [] && Schema::hasTable('disputes')) {
            $open = DB::table('disputes')
                ->whereIn('creator_id', $uuids)
                ->where(function ($q) {
                    $q->whereNull('resolved_at')
                        ->orWhereNotIn('status', self::CLOSED_DISPUTE_STATUSES);
                })
                ->distinct()
                ->pluck('creator_id');

            $mark($open, 'open dispute', $uuidToId);
        }

        // ── 3. Open early fraud warning ─────────────────────────────────────
        // EFW rows carry no creator column of their own (the model's `creator()`
        // relation points at a `creator_id` that does not exist on the table),
        // so the owner is resolved through `payments`.
        if ($uuids !== [] && Schema::hasTable('early_fraud_warnings') && Schema::hasTable('payments')) {
            $open = DB::table('early_fraud_warnings')
                ->join('payments', 'payments.id', '=', 'early_fraud_warnings.payment_id')
                ->whereIn('payments.creator_id', $uuids)
                ->whereNull('early_fraud_warnings.closed_at')
                ->distinct()
                ->pluck('payments.creator_id');

            $mark($open, 'open early fraud warning', $uuidToId);
        }

        // ── 4. Payment still moving, or funds held by the platform ──────────
        if ($uuids !== [] && Schema::hasTable('payments')) {
            $unsettled = DB::table('payments')
                ->whereIn('creator_id', $uuids)
                ->where(function ($q) {
                    $q->whereIn('status', self::UNSETTLED_PAYMENT_STATUSES);

                    if (Schema::hasColumn('payments', 'platform_holds_funds')) {
                        $q->orWhere('platform_holds_funds', 1);
                    }
                })
                ->distinct()
                ->pluck('creator_id');

            $mark($unsettled, 'payment unsettled or funds held', $uuidToId);
        }

        // ── 5. Payout not settled ───────────────────────────────────────────
        if ($uuids !== [] && Schema::hasTable('payout_records')) {
            $pending = DB::table('payout_records')
                ->whereIn('creator_id', $uuids)
                ->whereNotIn('status', self::SETTLED_PAYOUT_STATUSES)
                ->when(
                    Schema::hasColumn('payout_records', 'deleted_at'),
                    fn ($q) => $q->whereNull('deleted_at'),
                )
                ->distinct()
                ->pluck('creator_id');

            $mark($pending, 'payout not settled', $uuidToId);
        }

        // ── 6. Earnings not yet paid out, or a reserve still held ───────────
        // `financial_transactions` is the canonical ledger. `payout_run_id` null
        // means the base earning has never been paid out; `reserve_status =
        // held` means a reserve is still inside its rolling 30-day window.
        if ($ids !== [] && Schema::hasTable('financial_transactions')) {
            $owed = DB::table('financial_transactions')
                ->whereIn('user_id', $ids)
                ->where('status', '!=', 'refunded')
                ->when(
                    Schema::hasColumn('financial_transactions', 'deleted_at'),
                    fn ($q) => $q->whereNull('deleted_at'),
                )
                ->where(function ($q) {
                    $q->whereNull('payout_run_id')->orWhere('reserve_status', 'held');
                })
                ->distinct()
                ->pluck('user_id');

            $mark($owed, 'earnings unpaid or reserve held');
        }

        return $held;
    }

    private function report(
        Collection $documents,
        Collection $payloadUsers,
        Collection $deletableDocs,
        Collection $clearableUsers,
        array $held,
    ): void {
        $this->newLine();
        $this->line(sprintf(
            'user_documents past window: %d — %d releasable, %d withheld.',
            $documents->count(),
            $deletableDocs->count(),
            $documents->count() - $deletableDocs->count(),
        ));
        $this->line(sprintf(
            'users with aged identity payload: %d — %d releasable, %d withheld.',
            $payloadUsers->count(),
            $clearableUsers->count(),
            $payloadUsers->count() - $clearableUsers->count(),
        ));

        if ($held !== []) {
            $this->newLine();
            $this->line('Withheld:');

            $reasons = collect($held)->countBy();

            foreach ($reasons as $reason => $count) {
                $this->line(sprintf('  %-38s %d user(s)', $reason, $count));
            }
        }

        if (! $this->option('details')) {
            return;
        }

        $this->newLine();

        foreach ($held as $id => $reason) {
            $this->line(sprintf('  HOLD  user #%d — %s', $id, $reason));
        }

        foreach ($deletableDocs as $row) {
            $this->line(sprintf('  DEL   user_documents #%d (user #%d)', $row->id, $row->user_id));
        }

        foreach ($clearableUsers as $row) {
            $this->line(sprintf('  CLEAR users #%d identity payload', $row->id));
        }
    }

    /** A bare Uploadcare file uuid — the only shape we will ask the CDN to delete. */
    private const CDN_UUID = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    /**
     * 🚨 THE ROW IS NOT THE DOCUMENT. Deleting only the `user_documents` row
     * leaves the actual photo ID sitting on a permanent, unauthenticated
     * `ucarecdn.com` URL with nothing left in the database pointing at it — a
     * strictly WORSE outcome than keeping the row, because it is then
     * unfindable and can never be cleaned up.
     *
     * Verified live on the dev database, 23 Aug 2026: all 8 references (4 rows
     * × front+back) answered **HTTP 200 image/jpeg**, 7KB–1.5MB — real ID cards
     * and a residence permit, readable by anyone with the URL.
     *
     * A row whose CDN object could not be deleted is KEPT, so the next run
     * retries it. Losing the reference is the one irreversible mistake here.
     *
     * @return array{0: array<int,int>, 1: int, 2: int} [deletable row ids, files removed, files failed]
     */
    private function purgeCdnObjects(array $documentIds): array
    {
        if ($documentIds === []) {
            return [[], 0, 0];
        }

        // ⚠️ Off in `testing` (phpunit.xml) so the suite never makes a live
        // Uploadcare call — a test whose result depends on the network fails for
        // reasons unrelated to this code.
        if ($this->option('keep-files') || ! config('identity_retention.delete_cdn_objects', true)) {
            $this->warn('CDN objects are NOT being deleted. The rows go, the photo IDs stay public and become unreferenced.');

            return [array_values($documentIds), 0, 0];
        }

        $rows = DB::table('user_documents')
            ->whereIn('id', $documentIds)
            ->select('id', 'front', 'back')
            ->get();

        $safeIds = [];
        $removed = 0;
        $failed = 0;

        foreach ($rows as $row) {
            $rowOk = true;

            foreach (['front', 'back'] as $column) {
                $value = (string) ($row->{$column} ?? '');

                // Anything that is not a bare uuid is a Stripe/SumSub id or a
                // foreign URL — not ours to delete, and not on our CDN.
                if ($value === '' || preg_match(self::CDN_UUID, $value) !== 1) {
                    continue;
                }

                try {
                    Uploadcare::getApiObj()->file()->deleteFile($value);
                    $removed++;
                } catch (\Throwable $e) {
                    // Already gone is success: the object is not public any more,
                    // which is the whole point.
                    if (str_contains(strtolower($e->getMessage()), 'not found')) {
                        $removed++;

                        continue;
                    }

                    $failed++;
                    $rowOk = false;

                    Log::warning('[identity:prune] Could not delete an identity document from the CDN; keeping the row so the next run retries it.', [
                        'user_documents_id' => $row->id,
                        'column' => $column,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($rowOk) {
                $safeIds[] = (int) $row->id;
            }
        }

        return [$safeIds, $removed, $failed];
    }

    private function purge(array $documentIds, array $userIds): void
    {
        $chunk = max(50, (int) config('identity_retention.chunk', 500));
        $deleted = 0;

        [$documentIds, $filesRemoved, $filesFailed] = $this->purgeCdnObjects($documentIds);

        foreach (array_chunk($documentIds, $chunk) as $batch) {
            $deleted += DB::table('user_documents')->whereIn('id', $batch)->delete();
        }

        $columns = $this->presentPayloadColumns();
        $cleared = 0;

        if ($columns !== []) {
            $nulls = array_fill_keys($columns, null);

            foreach (array_chunk($userIds, $chunk) as $batch) {
                $cleared += DB::table('users')->whereIn('id', $batch)->update($nulls);
            }
        }

        $this->newLine();
        $this->info(sprintf(
            'Removed %d CDN document object(s); deleted %d user_documents row(s); cleared the identity payload on %d user(s).',
            $filesRemoved,
            $deleted,
            $cleared,
        ));

        if ($filesFailed > 0) {
            $this->warn(sprintf(
                '%d CDN object(s) could not be deleted. Their rows were KEPT so the next run retries them — a deleted row with a live CDN object is an ID document nobody can find and nobody can remove.',
                $filesFailed,
            ));
        }
    }
}
