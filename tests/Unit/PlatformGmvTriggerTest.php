<?php

namespace Tests\Unit;

use App\Support\PlatformGmvTrigger;
use PHPUnit\Framework\TestCase;

/**
 * The absolute floors under the platform's GMV ratio triggers.
 *
 * 🚨 The headline assertion is that ORDINARY TRADING cannot move the platform
 * into CAUTION or THROTTLE. Measured 15 Aug 2026 the 7-day GMV was £0, so the
 * first sale after a quiet week is an infinite ratio — and without a floor that
 * throttled the platform for taking one payment, while paid acquisition was
 * ramping the growth those states exist to protect.
 *
 * ⚠️ A unit test, not a feature test, on purpose: `MonitorPlatformRiskState`
 * computes its metrics in raw MySQL (`NOW() - INTERVAL 30 DAY`) which sqlite
 * cannot execute, so the command cannot run in this suite at all. The rule is
 * the part worth asserting; the SQL is not.
 *
 * All amounts are GBP MINOR UNITS, matching `payments.amount`.
 */
class PlatformGmvTriggerTest extends TestCase
{
    public function test_a_small_spike_after_a_quiet_week_does_not_fire(): void
    {
        // The live shape when this was written: nothing for a week, then one
        // ordinary £150 sale. The ratio is enormous; the money is not.
        $this->assertFalse(PlatformGmvTrigger::fires(
            ratio: 999.0,
            multiplier: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_MULTIPLIER,
            observedMinor: 15000,
            floorMinor: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR,
        ));
    }

    public function test_a_spike_clearing_both_the_ratio_and_the_floor_fires(): void
    {
        // £9,000 in a day against a £500/day baseline — disproportionate AND
        // material. This is the case the trigger exists for and it must survive.
        $this->assertTrue(PlatformGmvTrigger::fires(
            ratio: 18.0,
            multiplier: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_MULTIPLIER,
            observedMinor: 900000,
            floorMinor: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR,
        ));
    }

    public function test_a_large_day_that_is_not_disproportionate_does_not_fire(): void
    {
        // The floor is ANDed, never ORed. A big day on a big week is just trade.
        $this->assertFalse(PlatformGmvTrigger::fires(
            ratio: 1.1,
            multiplier: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_MULTIPLIER,
            observedMinor: 5000000,
            floorMinor: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR,
        ));
    }

    public function test_thirty_percent_week_on_week_growth_does_not_fire(): void
    {
        // The weekly multiplier shipped at 1.3, so a healthy ad-driven ramp
        // throttled the platform. 1.3 < 2.0, so the raised multiplier alone
        // stops it — the floor never even has to be consulted.
        $this->assertFalse(PlatformGmvTrigger::fires(
            ratio: 1.3,
            multiplier: PlatformGmvTrigger::DEFAULT_WEEKLY_MULTIPLIER,
            observedMinor: 1300000,
            floorMinor: PlatformGmvTrigger::DEFAULT_WEEKLY_FLOOR,
        ));
    }

    public function test_a_ratio_held_back_by_the_floor_reports_as_suppressed(): void
    {
        // "The trigger never fired" and "the trigger was held back" are different
        // findings with different fixes. The floors were picked against one GMV
        // snapshot, and this is the only signal that says whether they are right.
        $this->assertTrue(PlatformGmvTrigger::suppressed(
            ratio: 999.0,
            multiplier: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_MULTIPLIER,
            observedMinor: 15000,
            floorMinor: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR,
        ));
    }

    public function test_a_ratio_that_never_cleared_its_multiplier_is_not_suppressed(): void
    {
        // Otherwise every quiet day would log a suppression and the signal that
        // the floors need tuning would be buried in noise.
        $this->assertFalse(PlatformGmvTrigger::suppressed(
            ratio: 1.1,
            multiplier: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_MULTIPLIER,
            observedMinor: 15000,
            floorMinor: PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR,
        ));
    }

    public function test_a_cleared_floor_means_ratio_only_never_never_alarm(): void
    {
        // An operator emptying the field means "go back to the old behaviour",
        // not "switch the trigger off" — reading it as the latter would silently
        // disable platform protection.
        $this->assertTrue(PlatformGmvTrigger::fires(
            ratio: 5.0,
            multiplier: 2.0,
            observedMinor: 100,
            floorMinor: 0,
        ));

        $this->assertFalse(PlatformGmvTrigger::suppressed(
            ratio: 5.0,
            multiplier: 2.0,
            observedMinor: 100,
            floorMinor: 0,
        ));
    }

    public function test_a_zero_multiplier_disables_its_own_trigger(): void
    {
        // The existing convention everywhere else in the risk engine: a zeroed
        // threshold means "this rule is off", and it must not become always-on.
        $this->assertFalse(PlatformGmvTrigger::fires(
            ratio: 999.0,
            multiplier: 0,
            observedMinor: 99999999,
            floorMinor: 0,
        ));
    }

    public function test_the_floors_are_in_minor_units(): void
    {
        // 🚨 A floor typed in POUNDS is a hundredfold too low and silently
        // reinstates the bug this whole class exists to fix. £2,000 / £5,000 /
        // £15,000 expressed as pence.
        $this->assertSame(200000, PlatformGmvTrigger::DEFAULT_DAILY_CAUTION_FLOOR);
        $this->assertSame(500000, PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR);
        $this->assertSame(1500000, PlatformGmvTrigger::DEFAULT_WEEKLY_FLOOR);

        // The caution floor must sit below the throttle floor, or the milder
        // state is harder to reach than the severe one.
        $this->assertLessThan(
            PlatformGmvTrigger::DEFAULT_DAILY_THROTTLE_FLOOR,
            PlatformGmvTrigger::DEFAULT_DAILY_CAUTION_FLOOR,
        );
    }
}
