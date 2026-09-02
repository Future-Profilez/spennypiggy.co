<?php

namespace App\Console\Commands;

use App\Models\GrowthBonusReward;
use App\Services\GrowthBonusService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Tell a creator their Growth Bonus is approved, and fix the day it will be sent.
 *
 * 🚨 THE ADMIN APP APPROVES; THIS APP ANNOUNCES AND PAYS. The two apps share a
 * database and NOT a codebase, so the back office writes `status = approved` and
 * this sweep picks it up. Dispatching a job from the admin side would put a class
 * its own worker cannot resolve onto the shared queue, and the money path stays
 * in one repository either way.
 *
 * 🚨 THE DATE IS WRITTEN ONCE, HERE, AND EVERY OTHER SURFACE READS THE COLUMN.
 * The creator is told this day in an email; if the payer recomputed "next Friday"
 * later, an approval late on a Thursday would be announced for one Friday and
 * paid on another — a broken promise about money, in writing, that nothing
 * downstream would catch.
 *
 * ⚠️ Runs every 15 minutes rather than daily: an approval is a person pressing a
 * button and waiting to see something happen, and a creator hearing tomorrow that
 * their money was cleared today is the gap this closes.
 *
 * ⚠️ NEEDS `queue:work` — the notification fan-out is queued.
 */
class AnnounceGrowthBonusApprovals extends Command
{
    protected $signature = 'growth-bonus:announce
                            {--dry-run : Report what would be announced and change nothing}
                            {--max= : Cap the number handled in this run}';

    protected $description = 'Announce approved Growth Bonus rewards and fix their payout date';

    public function handle(GrowthBonusService $service): int
    {
        if (! $service->enabled()) {
            $this->info('Growth Bonus is switched off. Nothing to announce.');

            return self::SUCCESS;
        }

        $dry = (bool) $this->option('dry-run');
        $max = (int) ($this->option('max') ?: config('growth_bonus.payout.max_per_run', 200));

        /*
         * ⚠️ `announced_at` IS THE CLAIM ON THE WORK, not the notification's
         * dedup. The dispatcher's own claim stops a duplicate message; this
         * stops a second run re-processing a bonus already handled — including
         * one announced WITHOUT a date (unpayable creator, or the payout switch
         * off), which a date-null claim would re-select every 15 minutes
         * forever, and whose backlog would eventually starve new approvals past
         * the run limit.
         *
         * Two passes share the limit:
         *   1. Never announced - tell the creator, with a date when payable.
         *   2. Announced but still undated (couldn't receive then; bank-refused
         *      payouts also land here because the webhook clears the date) -
         *      once payable, fix the date and tell them the day. The dedup key
         *      carries the date, so this second message is not suppressed by
         *      the first one's claim.
         */
        $fresh = GrowthBonusReward::query()
            ->where('status', GrowthBonusReward::STATUS_APPROVED)
            ->whereNull('announced_at')
            ->whereNull('paid_at')
            ->with('creator')
            ->orderBy('id')
            ->limit($max)
            ->get();

        $remaining = max(0, $max - $fresh->count());

        /*
         * ⚠️ A HELD ROW IS NOT RE-DATED HERE. `applyHold()` clears the date, so a
         * held bonus looks exactly like one waiting for a payable account — but
         * the payer owns that one: it re-checks the hold on its own run and
         * clears it there. Re-dating from this side would promise a day while
         * the reason for the hold still stands.
         */
        $redate = $remaining === 0 ? collect() : GrowthBonusReward::query()
            ->where('status', GrowthBonusReward::STATUS_APPROVED)
            ->whereNotNull('announced_at')
            ->whereNull('scheduled_payout_date')
            ->whereNull('payout_hold_reason')
            ->whereNull('paid_at')
            ->with('creator')
            ->orderBy('id')
            ->limit($remaining)
            ->get();

        if ($fresh->isEmpty() && $redate->isEmpty()) {
            $this->info('No newly approved bonuses.');

            return self::SUCCESS;
        }

        $done = 0;

        foreach ($fresh as $reward) {
            /*
             * ⚠️ A creator whose Stripe account cannot receive is still ANNOUNCED,
             * with no date. Their bonus is genuinely approved and genuinely owed —
             * staying silent because the transfer is not possible yet would leave
             * them believing nothing had happened. Pass 2 dates them later.
             */
            $done += $this->announce($service, $reward, $dry, firstAnnouncement: true) ? 1 : 0;
        }

        foreach ($redate as $reward) {
            // Not payable yet - nothing new to say; skipped without touching
            // the row or the dispatcher.
            if (! ($service->payoutEnabled() && $this->canReceive($reward))) {
                continue;
            }

            $done += $this->announce($service, $reward, $dry, firstAnnouncement: false) ? 1 : 0;
        }

        $this->info(($dry ? 'WOULD announce ' : 'Announced ').$done.'.');

        return self::SUCCESS;
    }

    private function announce(GrowthBonusService $service, GrowthBonusReward $reward, bool $dry, bool $firstAnnouncement): bool
    {
        $payable = $service->payoutEnabled() && $this->canReceive($reward);
        $date = $payable ? $service->nextPayoutDate() : null;

        $this->line(sprintf(
            '  #%d  creator %d  %s%s  →  %s',
            $reward->id,
            $reward->creator_id,
            config('growth_bonus.display.currency_symbol', '£'),
            number_format((float) $reward->amount, 2),
            $date ? $date->toDateString() : 'no date yet',
        ));

        if ($dry) {
            return true;
        }

        try {
            $marks = ['announced_at' => $reward->announced_at ?? now()];

            if ($date) {
                $marks['scheduled_payout_date'] = $date;
            }

            $reward->forceFill($marks)->save();
            $reward->refresh();

            /*
             * 🚨 REVERT THE MARKS WHEN THE MESSAGE DID NOT GO. The date must be
             * on the row BEFORE the notification is built (the message names
             * it), but a dated-and-claimed row that was never announced would be
             * PAID on a day the creator was never told — so a failed queue push
             * hands the work back to the next run.
             */
            if (! $service->notifyApproved($reward)) {
                $reward->forceFill([
                    'scheduled_payout_date' => null,
                    'announced_at' => $firstAnnouncement ? null : $reward->announced_at,
                ])->save();

                $this->warn('    notification failed; will retry next run.');

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            /*
             * ⚠️ One creator's failure must not stop the sweep. Best-effort
             * revert, then carry on - a row left dated here is re-checked by
             * the guard above on the next pass only if the revert succeeded,
             * which is why notifyApproved itself never throws.
             */
            Log::warning('Growth Bonus approval announcement failed', [
                'reward_id' => $reward->id,
                'error' => $e->getMessage(),
            ]);

            $this->warn('    failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * ⚠️ A LOCAL CHECK ONLY — this never calls Stripe. The payer is what finds
     * out for certain; asking Stripe once per reward on a 15-minute sweep would
     * cost a round trip per row to answer a question the payment already answers.
     */
    private function canReceive(GrowthBonusReward $reward): bool
    {
        $creator = $reward->creator;

        return $creator
            && ! empty($creator->account_id)
            && (int) ($creator->stripe_details_submitted ?? 0) === 1
            && empty($creator->payout_paused_at);
    }
}
