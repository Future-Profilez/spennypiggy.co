<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Absolute GBP floors under the platform's GMV ratio triggers.
 *
 * 🚨 The ratio triggers are meaningless at this platform's volume. Measured
 * 15 Aug 2026: 30-day GMV £23,013 and **7-day GMV £0**. After a quiet week the
 * 7-day daily average is pennies, so the next ordinary sale reads as a 3x-plus
 * "spike" and the platform CAUTIONs or THROTTLEs itself — throttling exactly the
 * ad-driven growth it is being asked to protect.
 *
 * The floors are ANDed with the multipliers in `MonitorPlatformRiskState`: a
 * state change now needs the day to be both disproportionate AND materially
 * large. The dispute-rate FREEZE and the EFW/creator-cluster counts are NOT
 * touched — those are absolute risk signals already, and they are what actually
 * catches fraud.
 *
 * ⚠️ Values are GBP MINOR UNITS, matching `payments.amount`.
 */
return new class extends Migration
{
    /** Keys added here, with their values. Read by up() and reported by down(). */
    private const FLOORS = [
        'daily_gmv_caution_floor_minor' => 200000,    // £2,000 in 24h
        'daily_gmv_throttle_floor_minor' => 500000,   // £5,000 in 24h
        'weekly_gmv_spike_floor_minor' => 1500000,    // £15,000 in 7d
    ];

    /** The value the weekly multiplier shipped with, and the value it becomes. */
    private const WEEKLY_OLD_DEFAULT = 1.3;

    private const WEEKLY_NEW_DEFAULT = 2.0;

    public function up(): void
    {
        if (! Schema::hasTable('risk_settings')) {
            return;
        }

        $row = DB::table('risk_settings')->where('key', 'platform_state_triggers')->first();

        $triggers = [];
        if ($row && ! empty($row->value)) {
            $decoded = json_decode($row->value, true);
            $triggers = is_array($decoded) ? $decoded : [];
        }

        // ⚠️ Only ADD what is missing. An admin may have tuned any of these from
        // the risk settings screen, and a migration that overwrites a deliberate
        // operational decision is worse than one that does nothing.
        foreach (self::FLOORS as $key => $value) {
            if (! array_key_exists($key, $triggers)) {
                $triggers[$key] = $value;
            }
        }

        // 🚨 The weekly multiplier is raised ONLY if it is still sitting on the
        // value it shipped with. At 1.3 the platform throttles itself for 30%
        // week-on-week growth — a healthy ramp, and the outcome the live ad
        // campaigns are bought to produce. If somebody has since chosen a
        // different number, that choice stands.
        $weekly = $triggers['weekly_gmv_spike_multiplier'] ?? null;
        if ($weekly === null || abs((float) $weekly - self::WEEKLY_OLD_DEFAULT) < 0.0001) {
            $triggers['weekly_gmv_spike_multiplier'] = self::WEEKLY_NEW_DEFAULT;
        }

        DB::table('risk_settings')->updateOrInsert(
            ['key' => 'platform_state_triggers'],
            [
                'value' => json_encode($triggers),
                'description' => 'Thresholds that move the platform risk state. GMV ratio triggers additionally require an absolute GBP-minor floor.',
                'updated_at' => now(),
                // ⚠️ Null-safe: on a database where this row does not exist yet
                // `$row` IS null, and `$row->created_at` emits an "Attempt to
                // read property on null" warning — which an error handler
                // configured to escalate warnings turns into a failed migration.
                'created_at' => $row?->created_at ?? now(),
            ]
        );
    }

    /**
     * Removes only the keys this migration added.
     *
     * ⚠️ The weekly multiplier is deliberately NOT reverted — it cannot tell a
     * value it wrote from one an admin has since chosen, and guessing would
     * silently reinstate the self-throttle.
     */
    public function down(): void
    {
        if (! Schema::hasTable('risk_settings')) {
            return;
        }

        $row = DB::table('risk_settings')->where('key', 'platform_state_triggers')->first();

        if (! $row || empty($row->value)) {
            return;
        }

        $triggers = json_decode($row->value, true);

        if (! is_array($triggers)) {
            return;
        }

        foreach (array_keys(self::FLOORS) as $key) {
            unset($triggers[$key]);
        }

        DB::table('risk_settings')
            ->where('key', 'platform_state_triggers')
            ->update(['value' => json_encode($triggers), 'updated_at' => now()]);
    }
};
