<?php

namespace App\Services;

use App\Mail\GrowthBonusMilestoneReached;
use App\Mail\GrowthBonusOutcome;
use App\Models\FinancialTransaction;
use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Models\User;
use App\Support\GrowthBonusPanelPayload;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Creator Growth Bonus engine (brief 25 Aug 2026, client-confirmed 26 Aug 2026).
 *
 * "Qualifying Earnings" (terms clause 2.1) are the creator's LISTED SALE VALUE in
 * GBP-equivalent — `net_amount + vat_amount`, converted at the row's own frozen
 * rate — NOT the supporter's charge. Fees are grossed up on top of the listed
 * price on this platform, so a £100 listing charges the supporter £130.55;
 * counting the charge would climb the ladder ~30% faster than the terms promise.
 *
 * ⚠️ VAT IS INCLUDED DELIBERATELY (client decision, 26 Aug 2026, option (a)):
 * £100 listed is £100 qualifying whatever the creator's VAT status, so a
 * VAT-registered creator is not slowed down relative to one who is not. It
 * follows that this figure is NOT "what the creator keeps" — where VAT applies,
 * part of it is passed to HMRC — and no user-facing copy may describe it that
 * way. ⚠️ This is why it is close to, but not the same as,
 * `FounderBonus::calculateCompletedNetEarnings`, which is net of VAT.
 *
 * Excluded: self-payments
 * (supporter_id == user_id), refunded/disputed/held rows (status filter), the
 * refunded portion of partially-refunded rows, and task money still in escrow
 * (same source gate as FounderBonus::calculateCompletedNetEarnings — an FT flips
 * to `completed` when the buyer PAYS, but a timed task is refundable until
 * accepted). Referral rewards and creator subscription fees never create income
 * FTs, so their exclusion is structural.
 *
 * ⚠️ Rows with no frozen GBP rate are COUNTED AND REPORTED (`unconverted_rows`),
 * never silently dropped into the total — same reasoning as FreezesLedgerFx.
 */
class GrowthBonusService
{
    /**
     * How many days before the activation deadline a creator is warned.
     *
     * ⚠️ Seven, not three: the threshold is a SALES target, and a creator needs
     * long enough to actually sell something. A warning that arrives too late to
     * act on is worse than none, because it is the platform watching them miss.
     */
    private const WARN_DAYS_BEFORE_DEADLINE = 7;

    public function enabled(): bool
    {
        return (bool) config('growth_bonus.enabled', false);
    }

    /** @return array<int, array{gmv: float, amount: float}> */
    public function ladder(): array
    {
        return config('growth_bonus.ladder', []);
    }

    public function maxSeats(): int
    {
        return (int) config('growth_bonus.limits.max_seats', 150);
    }

    public function activationThreshold(): float
    {
        return (float) config('growth_bonus.activation.threshold_gmv', 100.00);
    }

    /**
     * Scheme membership test — creators whose Stripe Connect activation is on
     * or after the launch cutoff (client, 26 Aug 2026). Earlier creators are
     * out; an admin can still opt one in by creating their profile row.
     */
    public function eligibleForScheme(User $creator): bool
    {
        $cutoff = config('growth_bonus.launch_cutoff');

        return (int) $creator->role === 1
            && $creator->stripe_connected_at !== null
            && (int) ($creator->stripe_details_submitted ?? 0) === 1
            && ! empty($creator->account_id)
            && ($creator->bonus_scheme_eligible === null || $creator->bonus_scheme_eligible)
            && $cutoff
            && $creator->stripe_connected_at->gte(Carbon::parse($cutoff)->startOfDay());
    }

    /**
     * Full evaluation for one creator: create the profile if due, recompute
     * GMV from the ledger, walk the activation + milestone rules. Idempotent —
     * the daily command calls this repeatedly and re-running changes nothing
     * unless the ledger changed.
     */
    public function evaluateCreator(User $creator): ?GrowthBonusProfile
    {
        $profile = GrowthBonusProfile::where('creator_id', $creator->id)->first();

        if (! $profile) {
            if (! $this->eligibleForScheme($creator)) {
                return null;
            }

            $profile = GrowthBonusProfile::create([
                'creator_id' => $creator->id,
                'status' => GrowthBonusProfile::STATUS_PENDING,
                // Fixed at creation so a later config change never moves a
                // live deadline under a creator.
                'activation_deadline' => $creator->stripe_connected_at
                    ->copy()
                    ->addDays((int) config('growth_bonus.activation.window_days', 30)),
            ]);
        }

        if ($profile->status === GrowthBonusProfile::STATUS_MISSED) {
            return $profile;
        }

        // GMV is only ever counted up to expiry — sales after the window are
        // normal platform activity, not bonus progress.
        $until = $profile->expires_at;
        $gmv = $this->computeGmv($creator, $until);
        $total = $gmv['total'] + (float) $profile->gmv_adjustment;

        if ($profile->status === GrowthBonusProfile::STATUS_PENDING) {
            $this->evaluatePending($profile, $gmv);
            // Re-read: evaluatePending may have activated (expiry now set), in
            // which case milestone GMV must be re-bounded by the new expires_at.
            $profile->refresh();
            if ($profile->status === GrowthBonusProfile::STATUS_ACTIVE) {
                $gmv = $this->computeGmv($creator, $profile->expires_at);
                $total = $gmv['total'] + (float) $profile->gmv_adjustment;
            }
        }

        if (in_array($profile->status, [GrowthBonusProfile::STATUS_ACTIVE, GrowthBonusProfile::STATUS_EXPIRED], true)) {
            $this->syncRewards($profile, $total, $gmv['contributions']);

            if ($profile->status === GrowthBonusProfile::STATUS_ACTIVE
                && $profile->expires_at !== null
                && $profile->expires_at->isPast()) {
                $profile->status = GrowthBonusProfile::STATUS_EXPIRED;
            }
        }

        $profile->forceFill([
            'qualifying_gmv' => round($gmv['total'], 2),
            'unconverted_rows' => $gmv['unconverted'],
            'current_milestone' => $this->highestRung($total),
            'last_evaluated_at' => now(),
        ])->save();

        return $profile;
    }

    /**
     * Qualifying Earnings in GBP for one creator, from Stripe connection up to
     * $until (expiry bound), as an ordered list of per-transaction
     * contributions — the milestone engine needs WHICH row crossed each
     * threshold, not just the sum, because the bonus is paid in the payout run
     * that carries that row.
     *
     * 🚨 THE BASE IS THE CREATOR'S LISTED SALE VALUE (`net_amount + vat_amount`),
     * NOT THE SUPPORTER'S CHARGE (client decision, 26 Aug 2026 — terms clause
     * 2.1). Fees are grossed up ON TOP of the listed price here, so a £100
     * listing charges the supporter £130.55. Counting the charge would have
     * every creator climb the ladder ~30% faster than the terms say; counting
     * the creator's share alone would penalise VAT-registered creators.
     *
     * @return array{total: float, unconverted: int, contributions: array<int, array{id: int, date: Carbon, gbp: float, cumulative: float}>}
     */
    public function computeGmv(User $creator, ?Carbon $until = null): array
    {
        $rows = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->when($creator->stripe_connected_at, fn ($q) => $q->where('transaction_date', '>=', $creator->stripe_connected_at))
            ->when($until, fn ($q) => $q->where('transaction_date', '<=', $until))
            // Self-payment exclusion (brief §4). NULL supporter = guest
            // checkout, which stays in — the Phase 1 manual payout approval is
            // the control for disguised self-purchases.
            ->where(fn ($q) => $q->whereNull('supporter_id')->orWhereColumn('supporter_id', '!=', 'user_id'))
            // Full source, not column-constrained: morphTo across types where
            // some have no `status` column (same trap as FounderBonus).
            ->with('source')
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get(['id', 'gross_amount', 'net_amount', 'vat_amount', 'refunded_amount', 'gbp_amount', 'gbp_rate', 'currency', 'source_type', 'source_id', 'transaction_date']);

        $contributions = [];
        $running = 0.0;
        $unconverted = 0;

        foreach ($rows as $tx) {
            // Task escrow gate: paid but not yet accepted = still refundable,
            // so not yet a genuine qualifying sale.
            if ($tx->source_type === 'App\Models\TaskPurchase'
                && isset($tx->source->status)
                && ! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'], true)) {
                continue;
            }

            $gbp = $this->rowGbpQualifying($tx);

            if ($gbp === null) {
                $unconverted++;

                continue;
            }

            if ($gbp <= 0) {
                continue;
            }

            $running += $gbp;
            $contributions[] = [
                'id' => (int) $tx->id,
                'date' => $tx->transaction_date,
                'gbp' => $gbp,
                'cumulative' => $running,
            ];
        }

        return [
            'total' => round($running, 2),
            'unconverted' => $unconverted,
            'contributions' => $contributions,
        ];
    }

    /**
     * One row's contribution: the LISTED SALE VALUE in GBP, less any refunded
     * portion. NULL = cannot be converted (the caller counts it rather than
     * guessing at a rate).
     *
     * 🚨 `net_amount + vat_amount`, NOT `net_amount` ALONE (client decision,
     * 26 Aug 2026, option (a)). The listed price is what the creator typed, and
     * for a VAT-registered creator part of it is VAT they collect and pass on —
     * so `net_amount` alone would make that creator climb the ladder more
     * slowly than a non-registered creator selling the identical listing. The
     * client's rule is "£100 listed = £100 qualifying, whatever the VAT status".
     *
     * ⚠️ THIS IS NOT "WHAT THE CREATOR KEEPS" AND NO COPY MAY SAY SO. Where VAT
     * applies, part of this figure is money the creator hands to HMRC. It is the
     * LISTED SALE VALUE, which is why the terms define it as "Qualifying
     * Earnings" rather than as earnings in the take-home sense.
     *
     * 🚨 `gbp_amount` IS THE GROSS AND IS DELIBERATELY NOT USED FOR THE TOTAL.
     * It is still read for its FROZEN RATE (`gbp_rate`), so the figure converts
     * at the rate in force when the money moved rather than at today's — the
     * whole point of `FreezesLedgerFx`.
     *
     * ⚠️ A partial refund is applied PROPORTIONALLY. `refunded_amount` is a
     * refund of the supporter's GROSS, so subtracting it whole would remove more
     * than the sale ever added — on a £100 listing a £130.55 full refund would
     * take the creator to −£30. It is scaled by the row's own listed/gross ratio
     * instead.
     */
    private function rowGbpQualifying(FinancialTransaction $tx): ?float
    {
        // The listed sale value: the creator's share plus any VAT carried on it.
        $listed = (float) ($tx->net_amount ?? 0) + (float) ($tx->vat_amount ?? 0);
        $gross = (float) ($tx->gross_amount ?? 0);
        $refunded = (float) ($tx->refunded_amount ?? 0);

        $refundedShare = ($refunded > 0 && $gross > 0)
            ? $refunded * ($listed / $gross)
            : 0.0;

        $value = max(0.0, $listed - $refundedShare);

        if ((float) $tx->gbp_rate > 0) {
            return $value / (float) $tx->gbp_rate;
        }

        if (strtoupper((string) ($tx->currency ?? 'GBP')) === 'GBP') {
            return $value;
        }

        return null;
    }

    /**
     * Pending-window logic: activate on reaching the threshold INSIDE the
     * window (judged on transaction date, per the settled-vs-deadline decision
     * — payment still waits for settlement via the payout rule), or record the
     * miss once the window has closed.
     */
    private function evaluatePending(GrowthBonusProfile $profile, array $gmv): void
    {
        $threshold = $this->activationThreshold();
        $crossing = $this->crossingContribution($gmv['contributions'], (float) $profile->gmv_adjustment, $threshold);

        $crossedInWindow = $crossing !== null
            && $crossing['date'] !== null
            && Carbon::parse($crossing['date'])->lte($profile->activation_deadline);

        if ($crossedInWindow) {
            if (! $this->claimSeat($profile, Carbon::parse($crossing['date']))) {
                // Met the earnings, seats were full. The place is NOT consumed
                // (brief §2) and the outcome is recorded rather than silently
                // re-tried forever.
                $profile->forceFill([
                    'status' => GrowthBonusProfile::STATUS_MISSED,
                    'missed_reason' => 'seats_full',
                ])->save();

                $this->notifyOutcome($profile, 'seats_full');
            }

            return;
        }

        if ($profile->activation_deadline->isPast()) {
            $profile->forceFill([
                'status' => GrowthBonusProfile::STATUS_MISSED,
                'missed_reason' => 'earnings_below_threshold',
            ])->save();

            $this->notifyOutcome($profile, 'window_closed');

            return;
        }

        /*
         * A warning while there is still time to act on it. Without this the
         * only message a creator who never activates ever receives is the one
         * saying it is over — and the harshest rule in the programme (miss the
         * 30 days and you are out permanently, however well you sell later)
         * arrives as a surprise.
         */
        $daysLeft = (int) now()->startOfDay()->diffInDays($profile->activation_deadline->copy()->startOfDay(), false);

        if ($daysLeft > 0 && $daysLeft <= self::WARN_DAYS_BEFORE_DEADLINE) {
            $this->notifyOutcome($profile, 'window_closing', [
                'days_left' => $daysLeft,
                'remaining' => max(0, round($threshold - ($gmv['total'] + (float) $profile->gmv_adjustment), 2)),
            ]);
        }
    }

    /**
     * Atomically claim one of the 150 seats. Counts under lock inside a
     * transaction; the daily command also holds a process-wide cache lock
     * (same two-layer defence as CheckFounderQualifications).
     *
     * activated_at is the CROSSING transaction's date — the client's rule is
     * that 12 months run from when the creator reached £100, not from when the
     * evaluator noticed.
     */
    private function claimSeat(GrowthBonusProfile $profile, Carbon $activatedAt): bool
    {
        return DB::transaction(function () use ($profile, $activatedAt) {
            $claimed = GrowthBonusProfile::whereNotNull('seat_claimed_at')->lockForUpdate()->count();

            if ($claimed >= $this->maxSeats()) {
                return false;
            }

            $expiryMonths = (int) config('growth_bonus.expiry_months', 12);

            $profile->forceFill([
                'status' => GrowthBonusProfile::STATUS_ACTIVE,
                'activated_at' => $activatedAt,
                'seat_claimed_at' => now(),
                'expires_at' => $expiryMonths > 0 ? $activatedAt->copy()->addMonths($expiryMonths) : null,
            ])->save();

            return true;
        });
    }

    /**
     * Bring the reward rows in line with the current GMV: create a reward for
     * every rung now crossed (with its crossing transaction), reverse unpaid
     * rewards for rungs no longer met (refund pulled GMV back), flag paid ones
     * for admin review instead of clawing back automatically (brief §4). A
     * reversed reward whose rung is re-crossed by new sales is restored.
     */
    private function syncRewards(GrowthBonusProfile $profile, float $total, array $contributions): void
    {
        $adjustment = (float) $profile->gmv_adjustment;

        foreach ($this->ladder() as $rung) {
            $rungGmv = (float) $rung['gmv'];
            $reward = GrowthBonusReward::where('profile_id', $profile->id)
                ->where('milestone_gmv', $rungGmv)
                ->first();

            if ($total >= $rungGmv) {
                $crossing = $this->crossingContribution($contributions, $adjustment, $rungGmv);
                $txId = $crossing['id'] ?? null;

                if (! $reward) {
                    GrowthBonusReward::create([
                        'profile_id' => $profile->id,
                        'creator_id' => $profile->creator_id,
                        'milestone_gmv' => $rungGmv,
                        'amount' => (float) $rung['amount'],
                        'status' => GrowthBonusReward::STATUS_PENDING_VALIDATION,
                        'qualifying_transaction_id' => $txId,
                    ]);

                    // Tell the creator. ⚠️ Only on FIRST creation — a reward
                    // restored after a refund is the same milestone they were
                    // already told about, and "you unlocked £25" arriving twice
                    // for one rung reads as a double payment.
                    $this->notifyMilestone($profile, $rungGmv, (float) $rung['amount']);
                } elseif ($reward->status === GrowthBonusReward::STATUS_REVERSED
                    && $reward->paid_at === null) {
                    /*
                     * A refund can remove an unpaid milestone, and genuine later
                     * sales can earn that same milestone back (terms 7.4, client
                     * 26 Aug 2026).
                     *
                     * 🚨 `paid_at === null` IS THE DOUBLE-PAYMENT GUARD, and it
                     * is not theoretical: the engine never reverses a PAID
                     * reward (it flags it for review instead), but an admin can
                     * — and without this, GMV recovering afterwards would flip
                     * that reward back to payable and it could be paid a second
                     * time. "Each milestone can only ever be paid once" is the
                     * client's rule, and this is the line that holds it.
                     */
                    $reward->forceFill([
                        'status' => GrowthBonusReward::STATUS_PENDING_VALIDATION,
                        'reversed_at' => null,
                        'qualifying_transaction_id' => $txId,
                    ])->save();
                }

                continue;
            }

            // Rung no longer met.
            if ($reward && $reward->status === GrowthBonusReward::STATUS_PAID && ! $reward->needs_review) {
                $reward->forceFill(['needs_review' => true])->save();
                Log::warning("Growth Bonus: paid reward {$reward->id} (creator {$profile->creator_id}, rung £{$rungGmv}) no longer covered by GMV £{$total} — flagged for admin review.");
            } elseif ($reward && in_array($reward->status, [GrowthBonusReward::STATUS_PENDING_VALIDATION, GrowthBonusReward::STATUS_APPROVED], true)) {
                $reward->forceFill([
                    'status' => GrowthBonusReward::STATUS_REVERSED,
                    'reversed_at' => now(),
                ])->save();
            }
        }
    }

    /**
     * The outcomes that are NOT a milestone: the window closing, the window
     * closed, and every place having gone.
     *
     * 🚨 THESE DID NOT EXIST UNTIL 28 Aug 2026, AND THEIR ABSENCE WAS THE WORST
     * GAP IN THE FEATURE. A creator who reached the target and lost the last
     * place to somebody else was told nothing at all — they would find out only
     * by opening the bonus page themselves. The one creator with the strongest
     * claim on an explanation was the one the platform stayed silent with.
     *
     * ⚠️ `window_closing` is the only one that arrives while the creator can
     * still act. It carries how long is left and how much more they need, so it
     * is a task rather than a countdown.
     *
     * 🚨 Claimed per creator per OUTCOME, so the daily evaluator cannot repeat
     * one, and the claim is released on failure so a later run retries. Same
     * contract as `notifyMilestone` — see its docblock for why the claim is
     * taken before the queue push.
     *
     * ⚠️ NOTHING HERE MAY THROW: it runs inside the evaluation pass, and a
     * failure to explain an outcome must never stop the outcome being recorded
     * or block the other creators in the run.
     */
    private function notifyOutcome(GrowthBonusProfile $profile, string $outcome, array $extra = []): void
    {
        $type = 'growth_bonus_outcome';
        $dedupKey = $profile->creator_id.'|'.$outcome;

        if (! NotificationDispatcher::claim($profile->creator_id, $type, $dedupKey)) {
            return;
        }

        try {
            $creator = $profile->creator;

            if (! $creator) {
                NotificationDispatcher::releaseClaim($profile->creator_id, $type, $dedupKey);

                return;
            }

            $symbol = config('growth_bonus.display.currency_symbol', '£');
            $target = $symbol.number_format($this->activationThreshold(), 0);

            [$title, $body] = match ($outcome) {
                'seats_full' => [
                    'All Growth Bonus places have gone',
                    'You reached '.$target.' in time, but every place was taken. Keep an eye out — more bonus programmes are coming.',
                ],
                'window_closed' => [
                    'Your Growth Bonus window has closed',
                    'The '.(int) config('growth_bonus.activation.window_days', 30).'-day window ended before you reached '.$target.'. Everything else on your account works as normal.',
                ],
                'window_closing' => [
                    $symbol.number_format($extra['remaining'] ?? 0, 0).' to unlock your Growth Bonus',
                    'You have '.($extra['days_left'] ?? 0).' day'.(($extra['days_left'] ?? 0) === 1 ? '' : 's').' left to reach '.$target.' in qualifying earnings.',
                ],
                default => ['', ''],
            };

            if ($title === '') {
                NotificationDispatcher::releaseClaim($profile->creator_id, $type, $dedupKey);

                return;
            }

            NotificationDispatcher::queue(
                $creator,
                $type,
                [
                    'title' => $title,
                    'body' => $body,
                    'url' => '/growth-bonus',
                    'module' => 'growth_bonus',
                    'mailable' => GrowthBonusOutcome::class,
                    'mailable_args' => [
                        'creator' => $creator,
                        'outcome' => $outcome,
                        'headline' => $title,
                        'message' => $body,
                    ],
                ],
                NotificationDispatcher::ALL_CHANNELS,
                marketing: false,
            );
        } catch (\Throwable $e) {
            NotificationDispatcher::releaseClaim($profile->creator_id, $type, $dedupKey);

            Log::warning('Growth Bonus outcome notification could not be queued', [
                'creator_id' => $profile->creator_id,
                'outcome' => $outcome,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * "You unlocked a milestone" — bell, push and email.
     *
     * 🚨 QUEUED, NEVER SENT INLINE. `NotificationDispatcher::send()` makes a
     * synchronous HTTP call per channel and this runs inside a loop over every
     * creator in the programme, on a Lambda with a 60-second budget. **Needs
     * `queue:work` running** — without a worker the row exists, the creator is
     * never told, and nothing errors.
     *
     * 🚨 `$marketing = false`. This is money the creator has earned, so it is
     * transactional in the same sense a payout notice is, and must not be
     * silenced by a marketing opt-out. That also means the mail carries no
     * unsubscribe footer, deliberately.
     *
     * 🚨 CLAIMED BEFORE THE QUEUE PUSH, keyed on the CREATOR AND THE RUNG, so a
     * re-run of the daily evaluator — or two workers racing it — cannot tell one
     * creator twice about one milestone. `claim()` relies on the unique index,
     * so the race is settled by the database rather than by timing.
     *
     * 🚨 NOTHING HERE MAY THROW. It sits inside the reward-creation loop; a
     * failure to notify must never roll back or abort the reward itself, nor
     * stop the other creators in the pass. The claim is released on failure so a
     * later run can retry — a burnt claim is indistinguishable from a delivered
     * message, which is how the birthday campaign silently skipped people.
     */
    private function notifyMilestone(GrowthBonusProfile $profile, float $rungGmv, float $amount): void
    {
        $type = 'growth_bonus_milestone';
        $dedupKey = $profile->creator_id.'|'.number_format($rungGmv, 2, '.', '');

        if (! NotificationDispatcher::claim($profile->creator_id, $type, $dedupKey)) {
            return;
        }

        try {
            $creator = $profile->creator;

            if (! $creator) {
                NotificationDispatcher::releaseClaim($profile->creator_id, $type, $dedupKey);

                return;
            }

            // Read the shared shape rather than recomputing here, so the figures
            // in the message match the widget and the page exactly.
            $panel = GrowthBonusPanelPayload::shape($profile->fresh(['rewards']) ?? $profile);

            $symbol = config('growth_bonus.display.currency_symbol', '£');
            $reward = $symbol.number_format($amount, 0);
            $milestone = $symbol.number_format($rungGmv, 0);

            NotificationDispatcher::queue(
                $creator,
                $type,
                [
                    'title' => 'You unlocked a '.$reward.' Growth Bonus',
                    // ⚠️ The rung is the creator's listed sale value, so "earned"
                    // is accurate. This lands on a lock screen where there is no
                    // room to qualify it later, so it says what was paid FOR.
                    'body' => 'You passed '.$milestone.' in qualifying earnings. It will be paid with the sales that qualified you.',
                    'url' => '/growth-bonus',
                    'module' => 'growth_bonus',
                    'mailable' => GrowthBonusMilestoneReached::class,
                    'mailable_args' => [
                        'creator' => $creator,
                        'milestoneGmv' => $rungGmv,
                        'rewardAmount' => $amount,
                        'earnedTotal' => (float) ($panel['earned_total'] ?? $amount),
                        'nextMilestone' => $panel['next_milestone'] ?? null,
                        'nextReward' => $panel['next_reward'] ?? null,
                    ],
                ],
                NotificationDispatcher::ALL_CHANNELS,
                marketing: false,
            );
        } catch (\Throwable $e) {
            NotificationDispatcher::releaseClaim($profile->creator_id, $type, $dedupKey);

            Log::warning('Growth Bonus milestone notification could not be queued', [
                'creator_id' => $profile->creator_id,
                'milestone' => $rungGmv,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * The contribution at which (adjustment + running ledger total) first
     * reaches $threshold. NULL when never reached. An admin adjustment alone
     * reaching it returns ['id' => null] — a milestone with no single crossing
     * transaction.
     *
     * @param  array<int, array{id: int, date: mixed, cumulative: float}>  $contributions
     * @return array{id: ?int, date: mixed}|null
     */
    private function crossingContribution(array $contributions, float $adjustment, float $threshold): ?array
    {
        if ($adjustment >= $threshold) {
            return ['id' => null, 'date' => now()];
        }

        foreach ($contributions as $c) {
            if ($adjustment + $c['cumulative'] >= $threshold) {
                return ['id' => $c['id'], 'date' => $c['date']];
            }
        }

        return null;
    }

    private function highestRung(float $total): ?float
    {
        $highest = null;
        foreach ($this->ladder() as $rung) {
            if ($total >= (float) $rung['gmv']) {
                $highest = (float) $rung['gmv'];
            }
        }

        return $highest;
    }
}
