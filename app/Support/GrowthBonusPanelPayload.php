<?php

namespace App\Support;

use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Models\User;
use App\Services\GrowthBonusService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * The shape the creator's own dashboard receives for the Growth Bonus
 * (brief §6) — same arrangement as `OpportunityPanelPayload` and
 * `DiscoveryPayload`.
 *
 * 🚨 OWNER ONLY. `/{username}` is also the PUBLIC profile, and this is a
 * creator's own progress and the money they are owed. The caller gates on
 * `$isOwner`; null means "not your dashboard", never "no data".
 *
 * 🚨 NOTHING HERE MAY THROW. It is built inside the profile render, so a
 * failure would take a public page down to hide a progress bar. Same house
 * pattern as `OpportunityPanelPayload::forDashboard` and `VisitTracker`:
 * catch `\Throwable`, log, return null.
 *
 * ⚠️ `qualifying_gmv` KEEPS ITS NAME AND NO LONGER MEANS GMV. The base is the
 * creator's LISTED SALE VALUE (`net_amount + vat_amount`), not the supporter's
 * charge — the key and the column were deliberately left alone rather than
 * renamed across two apps and a live table, so read the service, not the name.
 * It renders as "Qualifying earnings", the terms' defined term.
 *
 * 🚨 NOT "WHAT THE CREATOR KEEPS". VAT is included so that a VAT-registered
 * creator is not slowed relative to one who is not — which means part of the
 * figure may be passed to HMRC. No label on this payload may imply take-home.
 */
class GrowthBonusPanelPayload
{
    public static function forDashboard(User $user): ?array
    {
        try {
            if (! config('growth_bonus.enabled', false)) {
                return null;
            }

            $profile = GrowthBonusProfile::with([
                'rewards' => fn ($q) => $q->orderBy('milestone_gmv'),
                // ⚠️ Eager-loaded ONLY for its date: `expectedPayout()` needs the
                // crossing sale to say when the bonus arrives, and resolving it
                // per reward would N+1 the dashboard.
                'rewards.qualifyingTransaction:id,transaction_date',
            ])->where('creator_id', $user->id)->first();

            if (! $profile) {
                return null;
            }

            /*
             * 🚨 THE FIGURE THE CREATOR READS IS COMPUTED LIVE, NOT THE STORED
             * SNAPSHOT. `qualifying_gmv` is only as fresh as the last evaluation,
             * so a creator who sold twenty minutes ago saw a number that
             * disagreed with the Total Earned card on the same screen — and the
             * ledger, which both of them read, was already correct. Two figures
             * for one pot of money is the fault `LedgerRules` exists to prevent.
             *
             * ⚠️ DISPLAY ONLY — this NEVER writes. Activation, seat claims,
             * reward rows and notifications stay with the evaluator: a page view
             * must not claim one of the 150 places or send an email, and a GET
             * that mints money records is a GET that does it twice on a refresh.
             *
             * ⚠️ Cost measured: 2 queries, ~7ms for one creator. If it ever
             * needs to be cheaper, cache it for a minute — do NOT go back to the
             * stored column, which is what caused this.
             */
            $ledger = app(GrowthBonusService::class)->computeGmv(
                $user,
                $profile->expires_at,
            );

            return self::shape($profile, $ledger);
        } catch (\Throwable $e) {
            Log::warning('Growth Bonus dashboard payload could not be built', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * ⚠️ Kept public so `GrowthBonusController` renders the same numbers as the
     * dashboard widget. Two implementations of "how far along am I" is how the
     * page and the widget end up disagreeing on the creator's own screen.
     */
    /**
     * ⚠️ The parameter is `$ledger`, NOT `$live` — `$live` is already the
     * filtered reward Collection a few lines down, and naming this one the same
     * silently replaced it with a Collection before it was read. The symptom was
     * an "Undefined array key" warning from deep inside Collection, pointing at a
     * line that looked perfectly correct.
     *
     * @param  array{total: float, unconverted: int}|null  $ledger  Freshly computed
     *                                                              ledger figures. Omitted by callers that only have the profile row (the
     *                                                              admin screens), which correctly read the last evaluated snapshot.
     */
    public static function shape(GrowthBonusProfile $profile, ?array $ledger = null): array
    {
        $ladder = (array) config('growth_bonus.ladder', []);

        $computed = $ledger !== null
            ? (float) $ledger['total']
            : (float) $profile->qualifying_gmv;

        $gmv = $computed + (float) $profile->gmv_adjustment;

        $rewards = $profile->relationLoaded('rewards')
            ? $profile->rewards
            : $profile->rewards()->orderBy('milestone_gmv')->get();

        // A reversed reward is not owed, so it is not earned.
        $live = $rewards->where('status', '!=', GrowthBonusReward::STATUS_REVERSED);

        $next = collect($ladder)->first(fn ($rung) => $gmv < (float) $rung['gmv']);
        $target = $next ? (float) $next['gmv'] : null;

        /*
         * The bar measures progress toward the NEXT rung from the PREVIOUS one,
         * not from zero. Measured from zero, a creator at £9,900 of a £10,000
         * rung reads as 99% "finished" for the whole of the £7,500–£10,000 leg
         * and then snaps back to a low number the moment they cross — which is
         * the opposite of what a progress bar is for.
         */
        $floor = 0.0;
        foreach ($ladder as $rung) {
            if ($gmv >= (float) $rung['gmv']) {
                $floor = (float) $rung['gmv'];
            }
        }

        $pct = $target !== null && $target > $floor
            ? (int) max(0, min(100, round((($gmv - $floor) / ($target - $floor)) * 100)))
            : 100;

        return [
            'status' => $profile->status,
            'missed_reason' => $profile->missed_reason,

            // Listed sale value including VAT, per terms clause 2.1. Not take-home.
            'qualifying_gmv' => round($gmv, 2),

            /*
             * ⚠️ True when the creator's live earnings have passed a rung the
             * evaluator has not recorded a reward for yet. The ladder shows it as
             * reached — which it is — and the page says the bonus is being
             * confirmed rather than leaving the row silent, which reads as the
             * platform having missed it.
             */
            'awaiting_evaluation' => $ledger !== null
                && round($computed, 2) !== round((float) $profile->qualifying_gmv, 2),

            'earned_total' => (float) $live->sum('amount'),
            'paid_total' => (float) $rewards->where('status', GrowthBonusReward::STATUS_PAID)->sum('amount'),

            'next_milestone' => $target,
            'next_reward' => $next ? (float) $next['amount'] : null,
            'remaining_to_next' => $target !== null ? max(0, round($target - $gmv, 2)) : null,
            'progress_pct' => $pct,

            'activation_gmv' => (float) config('growth_bonus.activation.threshold_gmv', 100),
            'activation_deadline' => $profile->activation_deadline?->toDateString(),
            // Whole days left in the window, floored at 0 — a negative countdown
            // on a deadline that has passed reads as a bug.
            'days_left' => $profile->status === GrowthBonusProfile::STATUS_PENDING && $profile->activation_deadline
                ? max(0, (int) now()->startOfDay()->diffInDays($profile->activation_deadline->copy()->startOfDay(), false))
                : null,
            'activated_at' => $profile->activated_at?->toDateString(),
            'expires_at' => $profile->expires_at?->toDateString(),

            'max_total' => (float) array_sum(array_column($ladder, 'amount')),
            'currency_symbol' => config('growth_bonus.display.currency_symbol', '£'),

            // Non-zero means this creator's qualifying earnings are understated
            // by a sale the ledger could not convert. Surfaced rather than
            // hidden — otherwise a milestone that "should" have unlocked has no
            // explanation.
            'unconverted_rows' => $ledger !== null
                ? (int) $ledger['unconverted']
                : (int) $profile->unconverted_rows,

            /*
             * 🚨 THE CREATOR MUST BE ABLE TO SEE WHERE EACH BONUS IS.
             * "£25 earned / £0 paid" with nothing between them is what makes a
             * creator think the platform has forgotten, and the ladder's own
             * Unlocked/Locked column answers a different question — whether
             * they SOLD enough, not whether they have been PAID.
             */
            /*
             * The most recently unlocked milestone, for the celebration state on
             * the dashboard tracker. NULL when the newest reward is older than
             * `CELEBRATE_WINDOW_DAYS` — a burst of confetti for something that
             * happened three weeks ago is noise, and the creator has already been
             * told by push and email.
             *
             * ⚠️ The component still decides whether to draw it: it records in
             * the browser which rung it has celebrated, so the moment survives
             * one reload and not every reload for a fortnight.
             */
            'just_unlocked' => self::justUnlocked($rewards),

            'milestones' => $rewards->map(fn ($r) => [
                'gmv' => (float) $r->milestone_gmv,
                'amount' => (float) $r->amount,
                'status' => $r->status,
                'paid_at' => $r->paid_at?->toDateString(),
                'expected_payout' => $r->status === GrowthBonusReward::STATUS_PAID
                    ? null
                    : self::expectedPayout($r),
            ])->values()->all(),
        ];
    }

    /**
     * How long a milestone is worth celebrating for.
     *
     * ⚠️ The evaluator is a DAILY batch, so a creator can cross a milestone up to
     * 24 hours before the reward row exists. A window shorter than that would
     * hand the celebration to creators whose sale happened to land near the run
     * and silently skip everyone else.
     */
    private const CELEBRATE_WINDOW_DAYS = 3;

    /** @param  Collection<int, GrowthBonusReward>  $rewards */
    private static function justUnlocked($rewards): ?array
    {
        $latest = $rewards
            ->where('status', '!=', GrowthBonusReward::STATUS_REVERSED)
            ->sortByDesc('created_at')
            ->first();

        if (! $latest || ! $latest->created_at
            || $latest->created_at->lt(now()->subDays(self::CELEBRATE_WINDOW_DAYS))) {
            return null;
        }

        return [
            'gmv' => (float) $latest->milestone_gmv,
            'amount' => (float) $latest->amount,
        ];
    }

    /**
     * The Friday this reward should arrive on.
     *
     * 🚨 IT IS DERIVED FROM THE PAYOUT RUN'S OWN RULE, NOT GUESSED. `payout:run-weekly`
     * goes out every Friday and pays every transaction completed on or before the
     * PREVIOUS Friday — each one waits its own seven days — so the first run that can
     * carry this bonus is the first Friday falling on or after the crossing sale's
     * date + 7 days. That is why a milestone lands 7–13 days after it is crossed,
     * depending on the weekday, and why no copy anywhere names a fixed day.
     *
     * ⚠️ NULL when there is no crossing sale — an admin GMV amendment can unlock a
     * milestone with no transaction behind it, and there is no run to point at.
     * The UI says "with your next payout" rather than inventing a date.
     *
     * ⚠️ It is an EXPECTATION, not a promise: a sale held for review, or a creator
     * under the payout minimum, moves with the run rather than with this date. The
     * label says "expected" for that reason.
     */
    private static function expectedPayout(GrowthBonusReward $reward): ?string
    {
        $crossedAt = $reward->qualifyingTransaction?->transaction_date;

        if (! $crossedAt) {
            return null;
        }

        $eligible = $crossedAt->copy()->startOfDay()->addDays(7);

        // Carbon's next(FRIDAY) always moves forward, so a date that IS a Friday
        // would be pushed a week — the seven-day wait is already satisfied then.
        return ($eligible->isFriday() ? $eligible : $eligible->next(Carbon::FRIDAY))->toDateString();
    }
}
