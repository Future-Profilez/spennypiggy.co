<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\MembershipCreditService;
use App\Support\Incentives;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Award and reverse "earn your membership back" credits.
 *
 * ⚠️ A NO-OP, NEVER A THROW, while the scheme is off — a scheduled command
 * that errors takes the rest of the tick's commands down with it.
 *
 * ⚠️ THE DAILY RUN IS THE SOURCE OF TRUTH even though the creator's own panel
 * computes live. A refund arrives as a webhook and nothing else re-reads that
 * creator's total; a credit that should have been reversed would otherwise sit
 * spendable until they happened to open a page.
 */
class EvaluateMembershipCredits extends Command
{
    protected $signature = 'membership-credits:evaluate {--dry-run} {--creator=} {--max=}';

    protected $description = 'Award or reverse creator membership credits against qualifying settled earnings.';

    public function handle(MembershipCreditService $service): int
    {
        if (! Incentives::membershipCreditsEnabled()) {
            $this->info("Membership credits are off ('enabled' in config/membership_credits.php). Nothing to do.");

            return self::SUCCESS;
        }

        $lock = Cache::lock('membership-credits:evaluate', 900);

        if (! $lock->get()) {
            $this->info('Another evaluation is already running — skipping.');

            return self::SUCCESS;
        }

        try {
            $dryRun = (bool) $this->option('dry-run');
            $filter = trim((string) $this->option('creator'));
            $max = (int) ($this->option('max') ?: config('membership_credits.max_per_run', 500));

            /*
             * ⚠️ Creators only, and only those who can have sold — a creator
             * with no Stripe connection has no settled earnings by definition,
             * and scanning the whole user table to prove it is a ledger query
             * per row for an answer that is always zero.
             */
            $query = User::query()
                ->where('role', 1)
                ->whereNotNull('stripe_connected_at')
                ->orderBy('id');

            if ($filter !== '') {
                $query->where(fn ($q) => $q->where('uuid', $filter)->orWhere('username', $filter));
            }

            $awarded = 0;
            $reversed = 0;
            $flagged = 0;
            $seen = 0;

            $query->chunkById(200, function ($creators) use ($service, $dryRun, $max, &$awarded, &$reversed, &$flagged, &$seen) {
                foreach ($creators as $creator) {
                    if ($seen >= $max) {
                        return false;
                    }

                    $seen++;

                    if ($dryRun) {
                        $progress = $service->progressFor($creator);

                        if ($progress['months_entitled'] !== $progress['months_earned']) {
                            $this->line(sprintf(
                                '%s earnings=%.2f entitled=%d earned=%d',
                                $creator->username ?: $creator->id,
                                $progress['earnings'],
                                $progress['months_entitled'],
                                $progress['months_earned'],
                            ));
                        }

                        continue;
                    }

                    /*
                     * 🚨 ONE CREATOR'S FAILURE MUST NOT END THE SWEEP. Without
                     * this, a single unconvertible ledger row stops every
                     * creator after it in the chunk from being evaluated at
                     * all — and nothing would say so.
                     */
                    try {
                        $result = $service->evaluate($creator);
                        $awarded += $result['awarded'];
                        $reversed += $result['reversed'];
                        $flagged += $result['flagged'];
                    } catch (\Throwable $e) {
                        Log::error('membership-credits:evaluate failed for one creator', [
                            'creator_id' => $creator->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                return true;
            });

            $expired = $dryRun ? 0 : $service->expireStale();

            $this->info(sprintf(
                'Membership credits: %d creators, %d awarded, %d reversed, %d flagged for review, %d expired.%s',
                $seen, $awarded, $reversed, $flagged, $expired, $dryRun ? ' (dry run)' : ''
            ));

            return self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}
