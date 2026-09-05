<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * The ONE definition of when a sale is paid (client direction, 4 Sep 2026).
 *
 * Creators are paid on a FIXED WEEKLY CYCLE:
 *
 *   · An earning period runs Friday 00:00:00 → Thursday 23:59:59.
 *   · That closed period is held through the following week.
 *   · It is paid on the NEXT Friday after that.
 *
 *   Fri 4 Sep – Thu 10 Sep  →  paid Fri 18 Sep
 *   Fri 11 Sep – Thu 17 Sep →  paid Fri 25 Sep
 *
 * So a sale waits 8 days (made on the Thursday the period closes) to 14 days
 * (made on the Friday it opens). A creator's FIRST payout therefore takes
 * 8–14 days depending where in the week their first sale lands; after that they
 * are on a weekly Friday cycle.
 *
 * 🚨 THIS CLASS IS THE ONLY PLACE THAT RULE IS WRITTEN DOWN. Before this existed
 * the same arithmetic was spelled out four times — the payout engine, the ledger
 * badge on the creator's own transaction list, the dashboard's "next payout"
 * payload and the Help Centre tokens — in three languages, and they had already
 * drifted: the engine paid on a rolling per-transaction 7-day sweep while the
 * FAQ, the Payments Policy and the Help Centre all described the weekly period
 * above. The creator-facing copy was right and the engine was the odd one out.
 * **Add a new surface by reading this class, never by re-deriving the dates.**
 *
 * ⚠️ WHAT DID NOT CHANGE, DELIBERATELY:
 *
 * · The engine still SWEEPS — it pays everything eligible up to the cut-off
 *   rather than storing literal period rows (client-approved, 4 Sep 2026). For a
 *   creator earning normally the two are identical, but the sweep means anything
 *   held back for any reason — an unfulfilled order, a failed payout, a
 *   `review_hold` — is picked up by the NEXT run instead of being stranded in a
 *   period that has already closed and paid. Nothing here should ever become a
 *   `BETWEEN start AND end` query.
 * · Reserve release is a separate, ROLLING 30-day window keyed to each
 *   transaction's own date (see `reserve:release`). It does not follow this
 *   cycle and no copy may imply that it does.
 */
class PayoutCycle
{
    /** Payouts run on this weekday. `payout:run-weekly` is scheduled Friday 10:07 UTC. */
    public const PAYOUT_DAY = CarbonInterface::FRIDAY;

    /** An earning period closes at the end of this weekday. */
    public const PERIOD_CLOSES_ON = CarbonInterface::THURSDAY;

    /**
     * The minimum age, in days, of a sale the run will pay.
     *
     * 🚨 EIGHT, NOT SEVEN — and the one day is the whole change. Eight days
     * before a Friday is the Thursday that closed the period before last, which
     * is exactly the client's rule. At seven it was the Friday, so a sale made ON
     * a Friday was swept up by the run seven days later — paying out the day the
     * period it belongs to opened, a week before that period is due.
     *
     * ⚠️ It is a FLOOR, not the answer: {@see cutoffFor()} walks back from here
     * to a period boundary, so a run on any other weekday still pays whole
     * closed periods rather than a mid-week slice.
     */
    public const MIN_HOLD_DAYS = 8;

    /**
     * The cut-off for a run on $runDate: the end of the last period that is due.
     *
     * Everything completed on or before this instant is payable; everything after
     * it belongs to a period that has not been held yet.
     *
     * 🚨 THE RESULT IS ALWAYS A THURSDAY 23:59:59, whatever weekday the run fires
     * on. That is the point of walking back rather than trusting the subtraction:
     * `subDays(8)` is only a period boundary when the run itself is on a Friday,
     * and a run started by hand (`--force`), or a Friday missed and caught up on
     * the Saturday, would otherwise take a mid-week cut-off and pay part of a
     * period several days early. Pinned by a test that asserts the weekday from
     * every possible run day.
     */
    public static function cutoffFor(?Carbon $runDate = null, int $minHoldDays = self::MIN_HOLD_DAYS): Carbon
    {
        $runDate = $runDate ? $runDate->copy() : Carbon::now();

        // Never less than the standard hold, even if a caller passes something smaller —
        // a risk profile may lengthen the wait, nothing may shorten it.
        $minHoldDays = max(self::MIN_HOLD_DAYS, $minHoldDays);

        $cutoff = $runDate->copy()->startOfDay()->subDays($minHoldDays);

        // ⚠️ `previous()` SKIPS a date that is already the target weekday, and on the
        // normal path (a Friday run, minus 8 days) it lands on a Thursday exactly —
        // so calling it unconditionally would rewind a further week and pay nothing
        // for seven days. Only walk when we are not already on the boundary.
        if (! $cutoff->isDayOfWeek(self::PERIOD_CLOSES_ON)) {
            $cutoff = $cutoff->previous(self::PERIOD_CLOSES_ON);
        }

        return $cutoff->endOfDay();
    }

    /**
     * The earning period a run on $runDate pays out: [Friday 00:00, Thursday 23:59].
     *
     * ⚠️ This is what the run PAYS, not what is currently being earned — those are
     * two different weeks and naming them the same thing on one screen is the
     * ambiguity this whole change exists to remove. For the week in progress, use
     * {@see currentPeriod()}.
     */
    public static function periodFor(?Carbon $runDate = null, int $minHoldDays = self::MIN_HOLD_DAYS): array
    {
        $end = self::cutoffFor($runDate, $minHoldDays);

        return [$end->copy()->startOfDay()->subDays(6), $end];
    }

    /** The Friday–Thursday period that $at falls inside — the week still being earned. */
    public static function currentPeriod(?Carbon $at = null): array
    {
        $at = $at ? $at->copy() : Carbon::now();

        $start = $at->copy()->startOfDay();
        if (! $start->isDayOfWeek(self::PAYOUT_DAY)) {
            $start = $start->previous(self::PAYOUT_DAY);
        }

        return [$start, $start->copy()->addDays(6)->endOfDay()];
    }

    /**
     * The time `payout:run-weekly` fires, UTC.
     *
     * ⚠️ MIRRORS `Console\Kernel`'s `->weeklyOn(5, '10:07')` and must move with it.
     * It is here because "has this week's run already happened?" is a question about
     * the cycle, and every surface that asks it would otherwise hardcode the answer.
     */
    public const RUN_TIME_UTC = '10:07';

    /**
     * The next Friday a payout run happens.
     *
     * 🚨 TODAY COUNTS ONLY UNTIL THE RUN HAS FIRED, AND THAT IS A CORRECTNESS
     * MATTER, NOT A DISPLAY ONE. This drives the ledger badge as well as the
     * dashboard: after Friday's 10:07 run, the next run is genuinely NEXT Friday,
     * so a sale made the previous Monday belongs in it. Counting today all day
     * would take today's already-spent cut-off, and that Monday sale would show no
     * "in this Friday's payout" badge at all — while the run a week later pays it.
     *
     * ⚠️ Before the run, today is included deliberately: a creator being paid this
     * morning must not be told they are being paid in seven days.
     */
    public static function nextPayoutDate(?Carbon $from = null): Carbon
    {
        $from = $from ? $from->copy() : Carbon::now();

        // Asked BEFORE startOfDay throws the time away.
        $runHasFired = $from->isDayOfWeek(self::PAYOUT_DAY)
            && $from->format('H:i') >= self::RUN_TIME_UTC;

        $day = $from->copy()->startOfDay();

        return $day->isDayOfWeek(self::PAYOUT_DAY) && ! $runHasFired
            ? $day
            : $day->next(self::PAYOUT_DAY);
    }

    /** The Thursday that closes the period a sale dated $saleDate belongs to. */
    public static function periodEndFor(Carbon $saleDate): Carbon
    {
        $end = $saleDate->copy()->startOfDay();

        if (! $end->isDayOfWeek(self::PERIOD_CLOSES_ON)) {
            $end = $end->next(self::PERIOD_CLOSES_ON);
        }

        return $end->endOfDay();
    }

    /**
     * The Friday a sale dated $saleDate is paid on.
     *
     * Its period closes on the Thursday on or after the sale, and is paid eight
     * days later — so a Friday sale waits 14 days and a Thursday sale waits 8.
     */
    public static function payoutDateFor(Carbon $saleDate): Carbon
    {
        return self::periodEndFor($saleDate)
            ->copy()
            ->startOfDay()
            ->addDays(self::MIN_HOLD_DAYS);
    }

    /**
     * The period the NEXT run will pay, and the date it pays on.
     *
     * This is the pairing every creator-facing surface should show, because the
     * two halves belong to each other. Showing the week in progress beside the
     * next payout date is how a creator concludes that this week's sales are in
     * Friday's payment, which they are not.
     *
     * @return array{payout_date: Carbon, period_start: Carbon, period_end: Carbon}
     */
    public static function nextRun(?Carbon $from = null): array
    {
        $payoutDate = self::nextPayoutDate($from);
        [$start, $end] = self::periodFor($payoutDate);

        return [
            'payout_date' => $payoutDate,
            'period_start' => $start,
            'period_end' => $end,
        ];
    }
}
