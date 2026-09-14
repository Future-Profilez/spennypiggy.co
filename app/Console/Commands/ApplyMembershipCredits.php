<?php

namespace App\Console\Commands;

use App\Models\MembershipCredit;
use App\Models\User;
use App\Services\MembershipCreditService;
use App\Support\Incentives;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Spend earned membership credits against the creator's next bill.
 *
 * 🚨 AUTOMATIC MODE ONLY, AND THAT IS AN OPEN CLIENT DECISION (D11). With
 * `membership_credits.spend_mode = 'manual'` this command does nothing and the
 * creator presses the button on their own subscription screen instead — the
 * same `MembershipCreditService::apply()` runs either way, only the trigger
 * differs. Both are built because the client has not yet chosen.
 *
 * ⚠️ Capped per creator per run by `auto_spend_max_per_cycle` (default 1). See
 * `MembershipCreditService::applyDue()` for why one at a time rather than
 * pushing every earned month onto the balance at once.
 *
 * ⚠️ Talks to Stripe once per credit, so it is scheduled daily rather than
 * hourly: an invoice is monthly and there is nothing a faster sweep can catch.
 */
class ApplyMembershipCredits extends Command
{
    protected $signature = 'membership-credits:apply {--dry-run} {--creator=} {--max=}';

    protected $description = 'Apply earned creator membership credits to the next subscription bill.';

    public function handle(MembershipCreditService $service): int
    {
        if (! Incentives::membershipCreditsEnabled()) {
            $this->info("Membership credits are off ('enabled' in config/membership_credits.php). Nothing to do.");

            return self::SUCCESS;
        }

        if ($service->spendMode() !== 'automatic') {
            $this->info("Spend mode is 'manual' — credits are applied by the creator, not by this command.");

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $filter = trim((string) $this->option('creator'));
        $max = (int) ($this->option('max') ?: config('membership_credits.max_per_run', 500));

        /*
         * The creators with something to spend, found from the LEDGER rather
         * than by walking every creator: `available()` is an indexed read and
         * most creators have no credits at all.
         */
        $creatorIds = MembershipCredit::query()
            ->available()
            ->distinct()
            ->limit($max)
            ->pluck('creator_id');

        if ($creatorIds->isEmpty()) {
            $this->info('No membership credits are waiting to be applied.');

            return self::SUCCESS;
        }

        $creators = User::query()
            ->whereIn('id', $creatorIds)
            ->when($filter !== '', fn ($q) => $q->where(fn ($w) => $w->where('uuid', $filter)->orWhere('username', $filter)))
            ->get();

        $applied = 0;
        $skipped = 0;

        foreach ($creators as $creator) {
            if ($dryRun) {
                $this->line(($creator->username ?: $creator->id).' has credit waiting.');
                $skipped++;

                continue;
            }

            /*
             * 🚨 ONE CREATOR'S STRIPE FAILURE MUST NOT END THE RUN. `apply()`
             * already releases its own claim and logs; this is the belt to
             * that braces for anything it did not anticipate.
             */
            try {
                $applied += $service->applyDue($creator);
            } catch (\Throwable $e) {
                $skipped++;
                Log::error('membership-credits:apply failed for one creator', [
                    'creator_id' => $creator->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info(sprintf(
            'Membership credits: %d applied, %d skipped.%s',
            $applied, $skipped, $dryRun ? ' (dry run)' : ''
        ));

        return self::SUCCESS;
    }
}
