<?php

namespace App\Support;

/**
 * The ONE definition of whether a GMV ratio trigger fires.
 *
 * 🚨 A RATIO ALONE IS MEANINGLESS AT LOW VOLUME, AND THIS PLATFORM IS AT LOW
 * VOLUME. Measured 15 Aug 2026: 30-day GMV £23,013 and **7-day GMV £0**. After a
 * quiet week the 7-day daily average is pennies, so the next ordinary sale reads
 * as a 3x, 10x or infinite "spike" — and the platform CAUTIONed or THROTTLEd
 * itself for trading normally, while paid acquisition was ramping the creator
 * and revenue growth those states exist to protect.
 *
 * So a state change now needs the day to be BOTH disproportionate AND materially
 * large. The floor is ANDed with the multiplier, never ORed.
 *
 * ⚠️ This governs the GMV triggers ONLY. The dispute-rate FREEZE, the EFW counts
 * and the creator-cluster count are absolute risk signals already — they are what
 * actually catches fraud, and nothing here may soften them.
 *
 * It lives outside `MonitorPlatformRiskState` because that command's metrics are
 * raw MySQL (`NOW() - INTERVAL 30 DAY`), which no sqlite test can execute. The
 * rule is the part worth testing; the SQL is not.
 */
class PlatformGmvTrigger
{
    /**
     * ⚠️ GBP MINOR UNITS (pence) — the scale `payments.amount` is stored in, and
     * the same scale as `new_creator_daily_cap` (50000 = £500). A floor typed in
     * pounds is a hundredfold too low and silently reinstates the bug.
     */
    public const DEFAULT_DAILY_CAUTION_FLOOR = 200000;   // £2,000 in 24h

    public const DEFAULT_DAILY_THROTTLE_FLOOR = 500000;  // £5,000 in 24h

    public const DEFAULT_WEEKLY_FLOOR = 1500000;         // £15,000 in 7d

    /**
     * ⚠️ Raised from 1.3 on 15 Aug 2026. At 1.3 the platform THROTTLED itself for
     * 30% week-on-week growth — a healthy ramp, and precisely the outcome the live
     * ad campaigns are bought to produce. Do not lower it without raising the
     * weekly floor to match.
     */
    public const DEFAULT_WEEKLY_MULTIPLIER = 2.0;

    /**
     * Unchanged, and deliberately a SEPARATE constant from the weekly one even
     * though they currently hold the same number — they answer different
     * questions (one day against a week's average, one week against the last),
     * and sharing a constant is how the two silently move together later.
     */
    public const DEFAULT_DAILY_THROTTLE_MULTIPLIER = 2.0;

    /**
     * Does this trigger fire?
     *
     * A zero or negative floor disables the size test rather than blocking every
     * trigger — an operator clearing the field means "ratio only", which is the
     * old behaviour, not "never alarm again".
     */
    public static function fires(float $ratio, float $multiplier, int $observedMinor, int $floorMinor): bool
    {
        if ($multiplier <= 0) {
            return false;
        }

        if ($ratio < $multiplier) {
            return false;
        }

        return $floorMinor <= 0 || $observedMinor >= $floorMinor;
    }

    /**
     * Did the ratio clear its multiplier only to be held back by the floor?
     *
     * ⚠️ Not cosmetic. The floors were chosen against one snapshot of live GMV,
     * and the only way to know whether they are set right is to read back how
     * often a real trigger was suppressed and by how much. A silent suppression
     * is indistinguishable from a trigger that never fired.
     */
    public static function suppressed(float $ratio, float $multiplier, int $observedMinor, int $floorMinor): bool
    {
        if ($multiplier <= 0 || $floorMinor <= 0) {
            return false;
        }

        return $ratio >= $multiplier && $observedMinor < $floorMinor;
    }
}
