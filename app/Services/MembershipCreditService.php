<?php

namespace App\Services;

use App\Models\MembershipCredit;
use App\Models\User;
use App\StripeControl;
use App\Support\Incentives;
use App\Support\QualifyingEarnings;
use App\Support\SubscriptionPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * "Earn your membership back" — £500 of qualifying settled earnings buys one
 * free month of the creator platform subscription.
 *
 * 🚨 IT IS A SUBSCRIPTION CREDIT AND IT IS NEVER CASH. A credit is spent
 * against the creator's own membership bill and against nothing else. It is
 * pushed onto their Stripe CUSTOMER BALANCE, which Stripe can only ever apply
 * to that customer's own invoices — there is no path from it to a payout, and
 * that is why it is the right instrument rather than a transfer.
 *
 * 🚨 IT NEVER CREATES AN INCOME `FinancialTransaction`. A credit recorded as
 * income would feed its own qualifying total and earn the next credit on its
 * own. Fast Start, Referral and the Growth Bonus all avoid the same loop
 * structurally, and so does this.
 *
 * 🚨 PROGRESS IS `App\Support\QualifyingEarnings` AND NOTHING ELSE. That is the
 * lifted-out `GrowthBonusService::computeGmv()`, chosen over
 * `FounderBonus::calculateCompletedNetEarnings()` because the specification is
 * "only settled eligible earnings count; refunds and chargebacks reduce
 * qualifying progress" — the Founder formula subtracts no refunds and excludes
 * no self-payments. A disputed transaction is not `completed`, so chargebacks
 * fall out through the same filter that removes refunds.
 *
 * ⚠️ IT IS NOT "WHAT THE CREATOR KEEPS", and no copy may say so: where VAT
 * applies part of the figure goes to HMRC. Same defined term as the Growth
 * Bonus used.
 */
class MembershipCreditService
{
    public function enabled(): bool
    {
        return Incentives::membershipCreditsEnabled();
    }

    public function threshold(): float
    {
        return max(0.01, (float) config('membership_credits.threshold_gbp', 500));
    }

    public function monthsPerThreshold(): int
    {
        return max(1, (int) config('membership_credits.months_per_threshold', 1));
    }

    /** Null = no lifetime cap. */
    public function maxMonths(): ?int
    {
        $max = config('membership_credits.max_months_per_creator');

        return $max === null ? null : max(0, (int) $max);
    }

    /**
     * Earnings before this date do not count.
     *
     * ⚠️ Null counts a creator's whole history, which on launch day would hand
     * a large existing creator a year of free months at once. It is deliberately
     * set in config and deliberately not null.
     */
    public function earningsFrom(): ?Carbon
    {
        $from = config('membership_credits.earnings_from');

        if (blank($from)) {
            return null;
        }

        try {
            return Carbon::parse($from)->startOfDay();
        } catch (\Throwable) {
            // An unparseable date must not silently become "count everything".
            Log::error('membership_credits.earnings_from is not a parseable date; counting nothing.', ['value' => $from]);

            return Carbon::now()->addCentury();
        }
    }

    /* -----------------------------------------------------------------
     | Progress
     | ----------------------------------------------------------------- */

    /**
     * The creator's qualifying settled earnings, and what they buy.
     *
     * ⚠️ COMPUTED LIVE, and it writes nothing. The Growth Bonus learned this the
     * hard way: a snapshot written by a nightly command sat beside a figure the
     * dashboard computed on every render, the two disagreed on one screen, and
     * the creator believed the smaller one.
     *
     * @return array{
     *     earnings: float,
     *     unconverted: int,
     *     rungs_reached: int,
     *     months_entitled: int,
     *     months_earned: int,
     *     months_available: int,
     *     months_used: int,
     *     next_threshold: float|null,
     *     to_next: float|null,
     *     progress_pct: float,
     * }
     */
    public function progressFor(User $creator): array
    {
        $earned = QualifyingEarnings::forCreator($creator, $this->earningsFrom());
        $earnings = (float) $earned['total'];

        $threshold = $this->threshold();
        $rungs = (int) floor(($earnings + 0.001) / $threshold);
        $entitled = $rungs * $this->monthsPerThreshold();

        if (($cap = $this->maxMonths()) !== null) {
            $entitled = min($entitled, $cap);
        }

        $rows = MembershipCredit::query()
            ->where('creator_id', $creator->id)
            ->get(['status', 'expires_at']);

        $monthsEarned = $rows->whereIn('status', [
            MembershipCredit::STATUS_EARNED,
            MembershipCredit::STATUS_APPLIED,
        ])->count();

        $used = $rows->where('status', MembershipCredit::STATUS_APPLIED)->count();

        $available = $rows
            ->where('status', MembershipCredit::STATUS_EARNED)
            ->filter(fn ($row) => $row->expires_at === null || $row->expires_at->isFuture())
            ->count();

        /*
         * 🚨 THE BAR MEASURES THE CURRENT LEG, NOT THE WHOLE LADDER. A creator
         * at £990 of a £1,000 rung must not read 99% and then appear to fall
         * backwards on crossing it — the exact fault `GrowthBonusTracker` had.
         */
        $into = $earnings - ($rungs * $threshold);
        $toNext = max(0.0, round($threshold - $into, 2));

        $capped = $cap !== null && $entitled >= $cap;

        return [
            'earnings' => round($earnings, 2),
            'unconverted' => (int) $earned['unconverted'],
            'rungs_reached' => $rungs,
            'months_entitled' => $entitled,
            'months_earned' => $monthsEarned,
            'months_available' => $available,
            'months_used' => $used,
            'next_threshold' => $capped ? null : round(($rungs + 1) * $threshold, 2),
            'to_next' => $capped ? null : $toNext,
            'progress_pct' => $capped ? 100.0 : round(min(100, ($into / $threshold) * 100), 1),
        ];
    }

    /* -----------------------------------------------------------------
     | Earning
     | ----------------------------------------------------------------- */

    /**
     * Bring one creator's credits into line with what they have actually
     * earned. Awards what is owed and reverses what a refund has taken back.
     *
     * @return array{awarded: int, reversed: int, flagged: int}
     */
    public function evaluate(User $creator): array
    {
        $result = ['awarded' => 0, 'reversed' => 0, 'flagged' => 0];

        if (! $this->enabled()) {
            return $result;
        }

        $progress = $this->progressFor($creator);
        $entitled = (int) $progress['months_entitled'];

        /*
         * 🚨 ONE CREATOR AT A TIME. The unique key on
         * (creator_id, rung, sequence) is the real guarantee, but without the
         * lock two concurrent runs both compute "entitled 3, earned 2" and one
         * of them takes an integrity violation rather than doing nothing.
         */
        $lock = Cache::lock('membership-credits:'.$creator->id, 30);

        if (! $lock->get()) {
            return $result;
        }

        try {
            $existing = MembershipCredit::query()
                ->where('creator_id', $creator->id)
                ->orderBy('rung')
                ->orderBy('sequence')
                ->get();

            $perRung = $this->monthsPerThreshold();
            $threshold = $this->threshold();

            // ---- award what is owed ------------------------------------
            $held = $existing->whereIn('status', [
                MembershipCredit::STATUS_EARNED,
                MembershipCredit::STATUS_APPLIED,
            ])->count();

            for ($n = $held; $n < $entitled; $n++) {
                $rung = intdiv($n, $perRung) + 1;
                $sequence = ($n % $perRung) + 1;

                $row = $existing->first(fn ($c) => (int) $c->rung === $rung && (int) $c->sequence === $sequence);

                if ($row) {
                    /*
                     * 🚨 A REVERSED CREDIT IS RESTORED, NEVER DUPLICATED. The
                     * rung was re-crossed by genuine later sales, and the
                     * unique key means there is exactly one row that can hold
                     * it. Same rule as a Growth Bonus reward.
                     *
                     * ⚠️ An APPLIED row is never here — the loop only counts up
                     * from rows that are earned or applied, so a spent month is
                     * already accounted for.
                     */
                    $row->forceFill([
                        'status' => MembershipCredit::STATUS_EARNED,
                        'reversed_at' => null,
                        'earned_at' => $row->earned_at ?? now(),
                        'qualifying_earnings_gbp' => $progress['earnings'],
                        'expires_at' => $this->expiryFor($row->earned_at ?? now()),
                    ])->save();
                } else {
                    MembershipCredit::create([
                        'creator_id' => $creator->id,
                        'username' => $creator->username,
                        'rung' => $rung,
                        'sequence' => $sequence,
                        'threshold_gbp' => $threshold,
                        'qualifying_earnings_gbp' => $progress['earnings'],
                        'earned_at' => now(),
                        'expires_at' => $this->expiryFor(now()),
                    ]);
                }

                $result['awarded']++;
            }

            // ---- take back what a refund removed ------------------------
            if ($entitled < $held) {
                $spendable = $existing
                    ->where('status', MembershipCredit::STATUS_EARNED)
                    ->sortByDesc('rung')
                    ->values();

                $toRemove = $held - $entitled;

                foreach ($spendable as $row) {
                    if ($toRemove <= 0) {
                        break;
                    }

                    $row->forceFill([
                        'status' => MembershipCredit::STATUS_REVERSED,
                        'reversed_at' => now(),
                    ])->save();

                    $result['reversed']++;
                    $toRemove--;
                }

                /*
                 * 🚨 AN ALREADY-SPENT MONTH IS NEVER CLAWED BACK — IT IS
                 * FLAGGED. The creator has had the free month; taking it back
                 * would mean billing them for a period we told them was free.
                 * The engine asks a person to look instead, exactly as a paid
                 * Growth Bonus reward is flagged rather than reversed.
                 */
                if ($toRemove > 0) {
                    $flagged = MembershipCredit::query()
                        ->where('creator_id', $creator->id)
                        ->where('status', MembershipCredit::STATUS_APPLIED)
                        ->where('needs_review', false)
                        ->orderByDesc('rung')
                        ->limit($toRemove)
                        ->get();

                    foreach ($flagged as $row) {
                        $row->forceFill(['needs_review' => true])->save();
                        $result['flagged']++;
                    }
                }
            }
        } finally {
            $lock->release();
        }

        return $result;
    }

    private function expiryFor(Carbon|string|null $earnedAt): ?Carbon
    {
        $months = (int) config('membership_credits.expiry_months', 0);

        if ($months <= 0) {
            return null;
        }

        $from = $earnedAt instanceof Carbon ? $earnedAt->copy() : Carbon::parse($earnedAt ?: now());

        return $from->addMonthsNoOverflow($months);
    }

    /* -----------------------------------------------------------------
     | Spending
     | ----------------------------------------------------------------- */

    public function spendMode(): string
    {
        return config('membership_credits.spend_mode', 'automatic') === 'manual'
            ? 'manual'
            : 'automatic';
    }

    /**
     * Apply one earned month to the creator's Stripe customer balance.
     *
     * 🚨 THE STRIPE CALL HAPPENS OUTSIDE ANY DB TRANSACTION AND THE MARK
     * COMMITS IN ITS OWN SMALL ONE, right after the credit lands. The house
     * rule on every money path here: a late failure must never roll back
     * something that already moved.
     *
     * 🚨 THE LOCAL CLAIM IS TAKEN FIRST, AND IT IS THE UPDATE ITSELF, not a
     * read-then-write. Two workers, or the daily sweep landing on top of a
     * creator pressing the button, would otherwise both see a spendable row.
     * The Stripe idempotency key is the second line of defence, keyed on the
     * credit's own id so a retry returns the SAME balance transaction.
     *
     * @return bool true when a month was credited
     */
    public function apply(User $creator, MembershipCredit $credit): bool
    {
        if (! $credit->isSpendable() || (int) $credit->creator_id !== (int) $creator->id) {
            return false;
        }

        if (blank($creator->stripe_id)) {
            // No customer record on the platform account: nothing to credit
            // against. Not a failure of this credit — it stays spendable.
            return false;
        }

        // Claim by conditional UPDATE. `applied_at` is the marker; a row whose
        // claim is taken and whose Stripe call then fails is released below.
        $claimed = MembershipCredit::query()
            ->whereKey($credit->id)
            ->where('status', MembershipCredit::STATUS_EARNED)
            ->whereNull('applied_at')
            ->update([
                'status' => MembershipCredit::STATUS_APPLIED,
                'applied_at' => now(),
                'updated_at' => now(),
            ]);

        if (! $claimed) {
            return false;
        }

        $currency = SubscriptionPlan::currency();
        $amountMinor = (int) round(SubscriptionPlan::total() * 100);

        try {
            $txn = StripeControl::creditCustomerBalance(
                customerId: $creator->stripe_id,
                amountMinor: $amountMinor,
                currency: $currency,
                description: 'Earn your membership back — 1 free month',
                idempotencyKey: 'membership_credit_'.$credit->id,
                metadata: [
                    'membership_credit_id' => (string) $credit->id,
                    'creator_id' => (string) $creator->id,
                    'rung' => (string) $credit->rung,
                ],
            );
        } catch (\Throwable $e) {
            // Release the claim so the next sweep retries. Leaving it set would
            // mark the month as used while nothing was ever credited — the
            // creator loses a month they earned and nothing says so.
            MembershipCredit::query()
                ->whereKey($credit->id)
                ->update([
                    'status' => MembershipCredit::STATUS_EARNED,
                    'applied_at' => null,
                    'updated_at' => now(),
                ]);

            Log::error('MembershipCreditService: failed to credit the customer balance', [
                'creator_id' => $creator->id,
                'membership_credit_id' => $credit->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        DB::transaction(function () use ($credit, $txn, $amountMinor, $currency) {
            $credit->forceFill([
                'applied_value_minor' => $amountMinor,
                'applied_currency' => $currency,
                'stripe_balance_transaction_id' => $txn->id ?? null,
            ])->save();
        });

        Log::info('MembershipCreditService: a free month was credited', [
            'creator_id' => $creator->id,
            'membership_credit_id' => $credit->id,
            'amount_minor' => $amountMinor,
            'currency' => $currency,
        ]);

        return true;
    }

    /**
     * Apply up to the configured cap for one creator.
     *
     * 🚨 THE CAP IS WHY CREDIT IS PUSHED ONE MONTH AT A TIME. Stripe's customer
     * balance carries over — a six-month credit against a one-month invoice
     * leaves five months sitting there — so pushing them all at once is the
     * same outcome EXCEPT that the money is committed and can no longer be
     * reversed if a refund later takes the creator back below the rung. One at
     * a time keeps the reversal window open.
     */
    public function applyDue(User $creator, ?int $max = null): int
    {
        if (! $this->enabled()) {
            return 0;
        }

        $max ??= max(1, (int) config('membership_credits.auto_spend_max_per_cycle', 1));

        $credits = MembershipCredit::query()
            ->where('creator_id', $creator->id)
            ->available()
            ->orderBy('rung')
            ->orderBy('sequence')
            ->limit($max)
            ->get();

        $applied = 0;

        foreach ($credits as $credit) {
            if ($this->apply($creator, $credit)) {
                $applied++;
            }
        }

        return $applied;
    }

    /**
     * Retire credits that went unused past their expiry.
     *
     * ⚠️ A no-op while `expiry_months` is null, which is the shipped default —
     * a creator who earned a free month and has not been billed yet has done
     * nothing wrong.
     */
    public function expireStale(int $max = 500): int
    {
        if ((int) config('membership_credits.expiry_months', 0) <= 0) {
            return 0;
        }

        $rows = MembershipCredit::query()
            ->where('status', MembershipCredit::STATUS_EARNED)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->limit($max)
            ->get();

        foreach ($rows as $row) {
            $row->forceFill(['status' => MembershipCredit::STATUS_EXPIRED])->save();
        }

        return $rows->count();
    }

    /* -----------------------------------------------------------------
     | The creator's own panel
     | ----------------------------------------------------------------- */

    /**
     * What the creator sees. Null when there is nothing to say.
     *
     * 🚨 NEVER THROWS. It is built inline on the subscription screen, and a
     * failed count must not turn a missing panel into a 500 on a page about
     * the creator's own billing — the `GrowthBonusPanelPayload` house rule.
     */
    public function panelFor(?User $creator): ?array
    {
        if (! $creator || (int) $creator->role !== 1 || ! $this->enabled()) {
            return null;
        }

        try {
            $progress = $this->progressFor($creator);

            return $progress + [
                'threshold' => $this->threshold(),
                'months_per_threshold' => $this->monthsPerThreshold(),
                'spend_mode' => $this->spendMode(),
                'currency_symbol' => '£',
            ];
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }
}
