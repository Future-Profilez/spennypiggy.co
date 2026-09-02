<?php

namespace App\Console\Commands;

use App\Models\Currency;
use App\Models\GrowthBonusReward;
use App\Models\PayoutRecord;
use App\Services\GrowthBonusService;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Growth Bonus Phase 3 — send the money.
 *
 * Mirrors `App\Jobs\ProcessFounderPayouts` deliberately: platform → connected
 * account transfer, then a payout from that account, both keyed to the reward id
 * so a retry or a concurrent run returns the SAME Stripe objects instead of
 * paying twice.
 *
 * 🚨 THE STRIPE CALLS HAPPEN OUTSIDE ANY DB TRANSACTION, and the marks are
 * committed in their own small transaction immediately after the money moves.
 * The house rule across every payout path here: a late failure must never roll
 * back a payout that has already left.
 *
 * 🚨 A BONUS PAYOUT MUST NEVER CREATE AN INCOME LEDGER ROW. Growth Bonus counts
 * completed income transactions, so a bonus recorded as income would feed its own
 * qualifying earnings and climb the ladder on its own. Fast Start and Referral
 * already follow this; the `PayoutRecord` below is a payout record, not a sale.
 *
 * ⚠️ It pays only what has been APPROVED and DATED — `growth-bonus:announce`
 * writes the date the creator was told, and this reads it back. Never recompute
 * "next Friday" here.
 *
 * ⚠️ Scheduled Friday, after `payout:run-weekly`, so the bonus rides the same
 * rhythm as the creator's ordinary earnings rather than inventing a second one.
 */
class ProcessGrowthBonusPayouts extends Command
{
    protected $signature = 'growth-bonus:pay
                            {--dry-run : Report what would be paid and move no money}
                            {--max= : Cap the number paid in this run}
                            {--reward= : Pay one reward by id}';

    protected $description = 'Pay approved Growth Bonus rewards that are due';

    public function handle(GrowthBonusService $service): int
    {
        if (! $service->payoutEnabled()) {
            $this->info('Growth Bonus payout is switched off. Nothing sent.');

            return self::SUCCESS;
        }

        $dry = (bool) $this->option('dry-run');
        $max = (int) ($this->option('max') ?: config('growth_bonus.payout.max_per_run', 200));

        /*
         * ⚠️ HELD ROWS ARE SELECTED TOO, AND THEY CARRY NO DATE. `applyHold()`
         * clears `scheduled_payout_date` because the day the creator was told is
         * no longer true — so a date-only filter would drop a held bonus out of
         * every future run and it would never be re-checked. This is the weekly
         * retry the hold promises.
         */
        $due = GrowthBonusReward::query()
            ->where('status', GrowthBonusReward::STATUS_APPROVED)
            ->whereNull('paid_at')
            // Never paid twice: a row that already carries Stripe ids is done,
            // whatever its status says.
            ->whereNull('stripe_payout_id')
            ->where(function ($q) {
                $q->where(function ($due) {
                    $due->whereNotNull('scheduled_payout_date')
                        ->whereDate('scheduled_payout_date', '<=', now()->toDateString());
                })->orWhereNotNull('payout_hold_reason');
            })
            ->when($this->option('reward'), fn ($q) => $q->whereKey((int) $this->option('reward')))
            ->with('creator')
            ->orderBy('id')
            ->limit($max)
            ->get();

        if ($due->isEmpty()) {
            $this->info('Nothing due.');

            return self::SUCCESS;
        }

        $this->info($due->count().' bonus(es) due.');

        $paid = 0;
        $skipped = 0;

        foreach ($due as $reward) {
            try {
                $result = $this->pay($service, $reward, $dry);

                $result ? $paid++ : $skipped++;
            } catch (\Throwable $e) {
                $skipped++;

                /*
                 * 🚨 ERROR, not warning: a creator is owed money that did not
                 * move, and the row stays approved so the next run retries. This
                 * is a line somebody has to read.
                 */
                Log::error('Growth Bonus payout failed', [
                    'reward_id' => $reward->id,
                    'creator_id' => $reward->creator_id,
                    'error' => $e->getMessage(),
                ]);

                $reward->forceFill([
                    'payout_failure_message' => mb_substr($e->getMessage(), 0, 500),
                ])->save();

                $this->warn('  #'.$reward->id.' failed: '.$e->getMessage());
            }
        }

        $this->info(($dry ? 'WOULD pay ' : 'Paid ').$paid.', skipped '.$skipped.'.');

        return self::SUCCESS;
    }

    private function pay(GrowthBonusService $service, GrowthBonusReward $reward, bool $dry): bool
    {
        $creator = $reward->creator;

        /*
         * 🚨 THE LAST CHECK BEFORE MONEY MOVES, AND IT DOES NOT TRUST THE
         * APPROVAL. That approval can be weeks old; since then a supporter may
         * have charged back, a refund may have landed, or the account may have
         * been suspended. `holdReasonFor()` re-tests the milestone against LIVE
         * qualifying earnings — refunds removed proportionally, anything not
         * `completed` (which is what a disputed transaction becomes) excluded.
         *
         * ⚠️ A hold is not a skip: it is recorded with its reason, the creator
         * is told once, and the row stays selectable so next week re-checks it.
         */
        $hold = $service->holdReasonFor($reward);

        if ($hold !== null) {
            $this->line('  #'.$reward->id.' HELD — '.$hold);

            if (! $dry) {
                $service->applyHold($reward, $hold);
            }

            return false;
        }

        /*
         * ⚠️ Cleared here, not by whatever fixed it. A hold is a fact about a
         * payout attempt, so the payout attempt is what lifts it — and it is
         * lifted BEFORE the money moves, so a crash mid-payment leaves a row
         * that is payable rather than one still marked held.
         */
        if ($reward->payout_hold_reason !== null && ! $dry) {
            $service->clearHold($reward);
            $reward->refresh();
            $this->line('  #'.$reward->id.' hold cleared — milestone covered again.');
        }

        /*
         * 🚨 THE LADDER IS IN GBP; THE CREATOR IS PAID IN THEIR OWN CURRENCY.
         * Same converter and the same frozen-rate table Founder uses, so two
         * bonus schemes cannot disagree about what £25 is worth to a USD creator.
         */
        $currency = strtoupper((string) ($creator->default_currency ?? 'GBP'));
        $amount = $this->convert((float) $reward->amount, 'GBP', $currency);
        $amountMinor = (int) round($amount * 100);

        if ($amountMinor <= 0) {
            $this->line('  #'.$reward->id.' skipped — converts to zero.');

            return false;
        }

        $this->line(sprintf(
            '  #%d  creator %d  %s %s',
            $reward->id,
            $reward->creator_id,
            strtoupper($currency),
            number_format($amountMinor / 100, 2),
        ));

        if ($dry) {
            return true;
        }

        $metadata = [
            'bonus_type' => 'growth_bonus',
            'reason' => 'growth_bonus_milestone',
            'source' => 'command:growth-bonus:pay',
            'growth_bonus_reward_id' => (string) $reward->id,
            'milestone_gmv' => (string) $reward->milestone_gmv,
            'creator_id' => (string) $creator->uuid,
            'creator_username' => (string) $creator->username,
            'amount_minor' => (string) $amountMinor,
            'currency' => strtolower($currency),
            'env' => (string) config('app.env'),
        ];

        /*
         * 🚨 IDEMPOTENCY KEYS ARE THE ONLY THING BETWEEN A RETRY AND A DOUBLE
         * PAYMENT — and Stripe expires them after 24 HOURS, so a retry on a
         * later Friday genuinely mints new objects. The transfer id is
         * therefore PERSISTED the moment the transfer succeeds, and any row
         * already carrying one skips the transfer leg entirely: a bank-refused
         * payout leaves the money in the CONNECTED account (the webhook revert
         * keeps the transfer id for exactly this reason), and a crash between
         * transfer and payout must not move the bonus from the platform twice.
         */
        $transferId = $reward->stripe_transfer_id;

        if (empty($transferId)) {
            $transfer = StripeControl::transferToConnectedAccountMinor(
                $creator->account_id,
                $amountMinor,
                strtolower($currency),
                $metadata,
                'Growth Bonus'.($creator->username ? ' - '.$creator->username : ''),
                'growth_bonus_transfer_'.$reward->id,
            );

            $transferId = $transfer->id ?? null;

            // Written OUTSIDE the final marks transaction, immediately: if the
            // payout call below fails, the next run must know the transfer leg
            // is already done.
            $reward->forceFill(['stripe_transfer_id' => $transferId])->save();
        } else {
            $this->line('  #'.$reward->id.' transfer already made ('.$transferId.'); paying out only.');
        }

        StripeControl::ensureManualPayoutSchedule($creator->account_id, strtolower($currency));

        /*
         * ⚠️ The payout key carries the DATE: a same-day re-run or concurrent
         * run resolves to the same payout object, while a retry after a bank
         * refusal (always a later day, past the 24h key expiry anyway) is a
         * deliberately new payout of the money already sitting in the account.
         */
        $payout = StripeControl::createPayout([
            'amount' => $amountMinor,
            'currency' => strtolower($currency),
            'method' => 'standard',
            'metadata' => array_merge($metadata, [
                'transfer_id' => (string) ($transferId ?? ''),
            ]),
            'idempotency_key' => 'growth_bonus_payout_'.$reward->id.'_'.now()->format('Ymd'),
        ], $creator->account_id);

        // The money has moved. Commit the marks now, in their own transaction.
        DB::transaction(function () use ($reward, $creator, $currency, $amountMinor, $transferId, $payout) {
            $locked = GrowthBonusReward::whereKey($reward->id)->lockForUpdate()->first();

            // Another run recorded this already — same Stripe objects via the
            // idempotency keys, so there is nothing left to write.
            if (! $locked || $locked->paid_at || $locked->stripe_payout_id) {
                return;
            }

            $record = PayoutRecord::create([
                'creator_id' => $creator->uuid,
                'payout_run_id' => null,
                'stripe_payout_id' => $payout->id ?? null,
                'amount_minor' => $amountMinor,
                'currency' => strtolower($currency),
                'status' => $payout->status ?? 'pending',
                'arrival_date' => isset($payout->arrival_date)
                    ? Carbon::createFromTimestamp($payout->arrival_date)
                    : null,
                'metadata' => [
                    'bonus_type' => 'growth_bonus',
                    'growth_bonus_reward_id' => (int) $locked->id,
                    'milestone_gmv' => (float) $locked->milestone_gmv,
                    'growth_bonus_transfer_id' => $transferId,
                    'stripe_payout' => method_exists($payout, 'toArray') ? $payout->toArray() : null,
                ],
            ]);

            $locked->forceFill([
                'status' => GrowthBonusReward::STATUS_PAID,
                'paid_at' => now(),
                'stripe_transfer_id' => $transferId,
                'stripe_payout_id' => $payout->id ?? null,
                'payout_record_uuid' => $record->uuid,
                'payout_reference' => $payout->id ?? null,
                'payout_failure_message' => null,
            ])->save();
        });

        return true;
    }

    /**
     * ⚠️ An unknown currency returns the amount UNCHANGED rather than guessing.
     * Same behaviour as `ProcessFounderPayouts` — a wrong rate pays the wrong
     * amount, which is worse than paying the GBP figure and being visibly odd.
     */
    private function convert(float $amount, string $from, string $to): float
    {
        $rates = Currency::rates();

        if ($rates instanceof Collection) {
            $rates = $rates->toArray();
        }

        $from = strtoupper($from ?: 'GBP');
        $to = strtoupper($to ?: 'GBP');

        if ($from === $to || ! isset($rates[$from], $rates[$to])) {
            return $amount;
        }

        return ($amount / $rates[$from]) * $rates[$to];
    }
}
