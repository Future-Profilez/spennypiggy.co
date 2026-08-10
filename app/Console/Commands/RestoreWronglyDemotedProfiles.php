<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\UserProfileService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * One-off repair for creators stranded at `profile_status_lock = 1`.
 *
 * Until 6 Aug 2026, editing a bio or saving a social handle demoted an approved
 * creator from 2 to 1. That is not "under review": it takes the verified badge,
 * removes them from Discover, search, trending and top-earners — DELISTING EVERY
 * ITEM THEY SELL — and blocks Stripe onboarding. And nothing on the website ever
 * sets it back to 2.
 *
 * The per-asset queues then made it permanent: an admin approving the bio sets
 * `bio_approved = 1` and does not touch the lock, so the creator's work was
 * cleared and they still never came back.
 *
 * 🚨 DRY RUN BY DEFAULT. Putting an unreviewed profile into Discover is the one
 * mistake this must not make, so it restores only a demotion that CANNOT have
 * been a real decision.
 */
class RestoreWronglyDemotedProfiles extends Command
{
    protected $signature = 'profile:restore-wrongly-demoted {--apply} {--user=} {--max=}';

    protected $description = 'Restore creators demoted to "under review" by a routine profile edit (dry run unless --apply)';

    public function handle(UserProfileService $profiles): int
    {
        $apply = (bool) $this->option('apply');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $query = User::query()
            ->where('role', 1)
            ->where('profile_status_lock', 1)
            ->where(fn ($q) => $q->where('suspended_account', 0)->orWhereNull('suspended_account'))
            ->orderBy('id');

        if ($this->option('user')) {
            $query->where(function ($q) {
                $q->where('username', $this->option('user'))
                    ->orWhere('uuid', $this->option('user'))
                    ->orWhere('id', $this->option('user'));
            });
        }

        $restored = 0;
        $skipped = ['unsettled' => 0, 'told_something' => 0, 'never_approved' => 0];

        foreach ($query->cursor() as $user) {
            if ($max !== null && $restored >= $max) {
                break;
            }

            $reason = $this->skipReason($user);

            if ($reason !== null) {
                $skipped[$reason]++;

                continue;
            }

            $this->line(sprintf(
                '  %s @%s (#%d)',
                $apply ? 'restoring' : 'would restore',
                $user->username ?? '—',
                $user->id
            ));

            if ($apply) {
                $user->forceFill([
                    'profile_status_lock' => 2,
                    'profile_reject_reason' => null,
                ])->saveQuietly();

                // The profile cache is keyed off `users.updated_at`, and
                // `saveQuietly` still touches it — but a guest read may already be
                // in flight, so forget it explicitly.
                $profiles->clearUserCaches($user->username, $user->id);

                Log::warning('Restored a wrongly demoted profile', [
                    'user_id' => $user->id,
                    'username' => $user->username,
                ]);
            }

            $restored++;
        }

        $this->newLine();
        $this->info(sprintf(
            '%s %d creator(s). Skipped: %d still waiting on an admin, %d were told something, %d never approved.',
            $apply ? 'Restored' : 'Would restore',
            $restored,
            $skipped['unsettled'],
            $skipped['told_something'],
            $skipped['never_approved'],
        ));

        if (! $apply && $restored > 0) {
            $this->comment('Dry run. Re-run with --apply to write.');
        }

        return self::SUCCESS;
    }

    /**
     * Why this creator is left alone, or null to restore them.
     *
     * All three guards are load-bearing:
     *
     *  - anything still PENDING or REJECTED means an admin genuinely has work to
     *    do, and `lock = 1` is exactly right for them;
     *  - a `profile_reject_reason` or an `edit_bio_reason` means a human wrote
     *    words to this creator, so a human made the decision;
     *  - 🚨 and without a prior approval on record there is nothing to restore
     *    TO. "Was at 2 once" cannot be inferred from the current row, and
     *    guessing puts an unreviewed profile into Discover.
     */
    private function skipReason(User $user): ?string
    {
        $unsettled = [
            [$user->avatar, $user->avatar_approved],
            [$user->cover, $user->cover_approved],
            [$user->bio, $user->bio_approved],
        ];

        foreach ($unsettled as [$value, $flag]) {
            if (filled($value) && (int) $flag !== 1) {
                return 'unsettled';
            }
        }

        $links = $user->social_links;

        if ($links && (int) $links->status !== 1) {
            return 'unsettled';
        }

        if (filled($user->profile_reject_reason) || filled($user->edit_bio_reason)) {
            return 'told_something';
        }

        return $this->wasApprovedBefore($user) ? null : 'never_approved';
    }

    /**
     * Did an admin ever set this creator to approved?
     *
     * `audit_logs.new_values` is a real, queryable column on both apps, and
     * `approveUserField` writes `USER_PROFILE_REVIEWED` on both branches — so a
     * creator who was approved and never rejected since is provably one this
     * command may restore.
     *
     * ⚠️ Fails CLOSED. No audit table, no rows, unreadable JSON — all mean "do
     * not restore".
     */
    private function wasApprovedBefore(User $user): bool
    {
        if (! Schema::hasTable('audit_logs')) {
            return false;
        }

        try {
            $rows = AuditLog::query()
                ->where('action_type', 'USER_PROFILE_REVIEWED')
                ->where('reference_id', (string) ($user->uuid ?? $user->id))
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(['new_values', 'created_at']);
        } catch (\Throwable $e) {
            Log::warning('Could not read the profile review history', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        foreach ($rows as $row) {
            $values = is_array($row->new_values) ? $row->new_values : json_decode((string) $row->new_values, true);
            $lock = $values['profile_status_lock'] ?? null;

            if ($lock === null) {
                continue;
            }

            // The most recent decision wins: a creator approved and then rejected
            // is a rejected creator, and restoring them would overrule a person.
            return (int) $lock === 2;
        }

        return false;
    }
}
