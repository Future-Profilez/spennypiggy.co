<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Brings one creator's ledger up to date straight after a sale.
 *
 * WHY THIS EXISTS. `financial_transactions` is what the creator's financial
 * dashboard AND both tabs of Support History read — but nothing on the payment
 * path CREATES a row there. The webhook's
 * `syncFinancialTransactionsByPaymentIntent` only ever `->update()`s the status
 * of rows that already exist, so the row itself was written by
 * `finance:sync-transactions`, which runs **every 30 minutes**.
 *
 * The result: a creator was paid, the payment row existed, the deliverable
 * existed, the buyer had their receipt — and the creator's own dashboard showed
 * nothing for up to half an hour. The "Refresh records" button exists purely
 * because of that gap; it runs this exact command by hand.
 *
 * ⚠️ NEVER pass `--force`. Scoped to a user it DELETES that creator's existing
 * transactions before rebuilding them, which would re-hold reserves that have
 * already been paid out.
 */
class SyncCreatorLedger implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Trailing-edge debounce window. A creator taking several sales in the same
     * minute must not queue a full ledger sync per sale — the command reads
     * every payment table for that creator, so ten purchases would mean ten
     * identical scans.
     */
    private const DEBOUNCE_SECONDS = 20;

    public $tries = 2;

    public $backoff = [30];

    public function __construct(public int $creatorId) {}

    /**
     * Queue a sync unless one is already pending for this creator.
     *
     * The lock is released at the START of the run, not the end, so the pattern
     * is a genuine trailing-edge debounce: a sale that lands while a sync is
     * queued is covered by that run (the command rebuilds ALL of the creator's
     * transactions, and the payment row is already written by then), and a sale
     * landing after it begins re-arms a fresh one.
     *
     * Never throws — a purchase must not fail because its ledger refresh could
     * not be scheduled. The 30-minute cron is still the backstop.
     *
     * Accepts either a numeric users.id OR a users.uuid string, because the
     * webhook's Payment rows store the creator's UUID in creator_id
     * (Payment::creator() joins on users.uuid). The signature was ?int once,
     * and the UUID raised a TypeError at argument coercion — OUTSIDE this
     * method's own try, past the caller's catch (\Exception) — which failed
     * every checkout.session.completed event before its module fan-out ran.
     */
    public static function schedule(int|string|null $creatorId): void
    {
        try {
            $creatorId = self::resolveUserId($creatorId);

            if (! $creatorId) {
                return;
            }
            if (! Cache::add(self::lockKey($creatorId), 1, self::DEBOUNCE_SECONDS + 60)) {
                return;
            }

            self::dispatch($creatorId)->delay(now()->addSeconds(self::DEBOUNCE_SECONDS));
        } catch (\Throwable $e) {
            Log::warning('SyncCreatorLedger: could not schedule', [
                'creator_id' => $creatorId, 'error' => $e->getMessage(),
            ]);
        }
    }

    public function handle(): void
    {
        // Released first: anything that sells from this moment on gets its own
        // sync, while everything up to now is covered by the run below.
        Cache::forget(self::lockKey($this->creatorId));

        try {
            Artisan::call('finance:sync-transactions', [
                '--user_id' => $this->creatorId,
            ]);
        } catch (\Throwable $e) {
            Log::error('SyncCreatorLedger: sync failed', [
                'creator_id' => $this->creatorId, 'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private static function lockKey(int $creatorId): string
    {
        return "creator_ledger_sync:{$creatorId}";
    }

    /**
     * Normalise whatever the caller has to a numeric users.id — a UUID string
     * (payments.creator_id), a numeric string (Stripe metadata), or an int.
     * finance:sync-transactions matches --user_id against users.id only, so a
     * UUID passed through would sync zero rows even if it didn't throw.
     */
    private static function resolveUserId(int|string|null $creatorId): ?int
    {
        if ($creatorId === null || $creatorId === '') {
            return null;
        }

        if (is_int($creatorId) || ctype_digit((string) $creatorId)) {
            return (int) $creatorId ?: null;
        }

        return User::where('uuid', $creatorId)->value('id');
    }
}
