<?php

namespace Tests\Feature;

use App\Support\PayoutCycle;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * The fixed Friday-to-Thursday payout cycle (client direction, 4 Sep 2026).
 *
 * 🚨 EVERY ASSERTION HERE IS ABOUT THE RULE, NOT ABOUT THE CONSTANT. A test that
 * hardcodes "8" passes just as happily against a cut-off that lands mid-week, which
 * is the exact fault the walk-back exists to prevent — so the cut-off is checked by
 * its WEEKDAY and the waits are derived from real dates.
 */
class PayoutCycleTest extends TestCase
{
    /**
     * 🚨 THE ONE THAT MATTERS. `subDays(8)` is a period boundary only when the run
     * itself is on a Friday; a forced run, or a Friday missed and caught up later,
     * would otherwise take a mid-week cut-off and pay part of a period days early.
     */
    public function test_the_cut_off_is_always_a_thursday_whatever_day_the_run_fires_on(): void
    {
        // A whole week of possible run days.
        foreach (range(0, 6) as $offset) {
            $runDate = Carbon::parse('2026-09-18')->addDays($offset);
            $cutoff = PayoutCycle::cutoffFor($runDate);

            $this->assertSame(
                Carbon::THURSDAY,
                $cutoff->dayOfWeek,
                "A run on {$runDate->format('D j M')} took a cut-off on {$cutoff->format('D j M')}, which is not a period boundary."
            );
            $this->assertSame('23:59:59', $cutoff->format('H:i:s'));
        }
    }

    /** The client's own worked examples, to the day. */
    public function test_a_period_runs_friday_to_thursday_and_is_paid_the_friday_after_next(): void
    {
        [$start, $end] = PayoutCycle::periodFor(Carbon::parse('2026-09-18'));

        $this->assertSame('2026-09-04', $start->toDateString());
        $this->assertSame('2026-09-10', $end->toDateString());

        [$start, $end] = PayoutCycle::periodFor(Carbon::parse('2026-09-25'));

        $this->assertSame('2026-09-11', $start->toDateString());
        $this->assertSame('2026-09-17', $end->toDateString());
    }

    /**
     * 8 days when the sale lands on the Thursday that closes the week, 14 when it
     * lands on the Friday that opens it — the range every creator-facing surface
     * states.
     */
    public function test_a_sale_waits_between_eight_and_fourteen_days(): void
    {
        $cases = [
            // Friday opens the period: the longest wait.
            '2026-09-11' => ['2026-09-25', 14],
            '2026-09-12' => ['2026-09-25', 13],
            '2026-09-14' => ['2026-09-25', 11],
            // Thursday closes it: the shortest.
            '2026-09-17' => ['2026-09-25', 8],
        ];

        foreach ($cases as $sale => [$expectedPayout, $expectedWait]) {
            $saleDate = Carbon::parse($sale);
            $payout = PayoutCycle::payoutDateFor($saleDate);

            $this->assertSame($expectedPayout, $payout->toDateString(), "A sale on {$sale} was dated wrong.");
            $this->assertSame($expectedWait, $saleDate->diffInDays($payout), "A sale on {$sale} waited the wrong number of days.");
            $this->assertSame(Carbon::FRIDAY, $payout->dayOfWeek);
        }
    }

    /**
     * 🚨 The week being EARNED is not the week being PAID, and showing them as one
     * line is what made creators read this week's sales as being in Friday's payment.
     */
    public function test_the_week_being_earned_is_never_the_week_being_paid(): void
    {
        $onATuesday = Carbon::parse('2026-09-15');

        [$currentStart] = PayoutCycle::currentPeriod($onATuesday);
        $next = PayoutCycle::nextRun($onATuesday);

        $this->assertSame('2026-09-11', $currentStart->toDateString(), 'The week in progress is the one containing today.');
        $this->assertSame('2026-09-18', $next['payout_date']->toDateString());
        $this->assertSame('2026-09-04', $next['period_start']->toDateString(), 'Friday pays the week BEFORE the one being earned.');

        $this->assertNotSame(
            $currentStart->toDateString(),
            $next['period_start']->toDateString(),
            'The week being earned must never be reported as the week being paid.'
        );
    }

    /**
     * 🚨 A CORRECTNESS CASE, NOT A DISPLAY ONE. This drives the ledger badge: after
     * Friday's run, the next run is NEXT Friday, so a sale from the Monday before
     * belongs in it. Counting today all day would take today's already-spent
     * cut-off and that sale would carry no badge while the run a week later pays it.
     */
    public function test_today_counts_only_until_the_run_has_fired(): void
    {
        // Friday morning, before 10:07 — a creator paid today is paid today.
        $this->assertSame(
            '2026-09-18',
            PayoutCycle::nextPayoutDate(Carbon::parse('2026-09-18 09:00:00'))->toDateString()
        );

        // Friday evening, after the run — the next one is next Friday.
        $this->assertSame(
            '2026-09-25',
            PayoutCycle::nextPayoutDate(Carbon::parse('2026-09-18 18:00:00'))->toDateString()
        );

        $this->assertSame(
            '2026-09-25',
            PayoutCycle::nextPayoutDate(Carbon::parse('2026-09-19'))->toDateString()
        );
    }

    /**
     * The badge case in full: a Monday sale must be reported as "in this Friday's
     * payout" from the moment the previous Friday's run has finished.
     */
    public function test_a_sale_is_badged_for_the_run_that_will_actually_pay_it(): void
    {
        $sale = Carbon::parse('2026-09-14 12:00:00');           // Monday.
        $afterFridaysRun = Carbon::parse('2026-09-18 18:00:00'); // That Friday, run done.

        $nextRun = PayoutCycle::nextPayoutDate($afterFridaysRun);

        $this->assertSame('2026-09-25', $nextRun->toDateString());
        $this->assertTrue(
            $sale->lte(PayoutCycle::cutoffFor($nextRun)),
            'A Monday sale must be payable by the run that follows the Friday just gone.'
        );
        $this->assertSame(
            $nextRun->toDateString(),
            PayoutCycle::payoutDateFor($sale)->toDateString(),
            'The badge and the sale\'s own payout date must name the same run.'
        );
    }

    /**
     * 🚨 A risk profile may only ever LENGTHEN the wait. It pushes a creator into an
     * earlier period rather than paying them a mid-week slice of a later one.
     */
    public function test_a_risk_delay_lengthens_the_wait_and_still_lands_on_a_boundary(): void
    {
        $runDate = Carbon::parse('2026-09-18');

        $standard = PayoutCycle::cutoffFor($runDate);
        $delayed = PayoutCycle::cutoffFor($runDate, 21);

        $this->assertTrue($delayed->lt($standard), 'A risk delay must move the cut-off further back, never forward.');
        $this->assertSame(Carbon::THURSDAY, $delayed->dayOfWeek, 'A delayed cut-off is still a period boundary.');

        // A hold SHORTER than the standard one cannot shorten the wait.
        $this->assertEquals(
            $standard->toDateTimeString(),
            PayoutCycle::cutoffFor($runDate, 1)->toDateTimeString(),
            'Nothing may shorten the standard hold.'
        );
    }

    /**
     * ⚠️ The sweep pays everything eligible, so a sale held back for any reason is
     * picked up by the next run rather than being stranded in a closed period. This
     * is the behaviour the client explicitly approved keeping.
     */
    public function test_an_older_unpaid_sale_is_still_before_a_later_cut_off(): void
    {
        $strandedSale = Carbon::parse('2026-08-10 12:00:00');

        $this->assertTrue(
            $strandedSale->lte(PayoutCycle::cutoffFor(Carbon::parse('2026-09-18'))),
            'Anything held back must remain payable by a later run, never stranded in a closed period.'
        );
    }
}
