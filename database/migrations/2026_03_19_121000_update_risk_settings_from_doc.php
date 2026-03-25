<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $updates = [
            'global_limits' => [
                'value' => [
                    'max_spend_1h' => 200000,
                    'max_spend_24h' => 500000,
                    'max_spend_7d' => 1000000,
                    'max_creators_per_day' => 1,
                    'guest_allowed' => true,
                ],
                'description' => 'Global platform spending limits (NORMAL state). Amounts are in minor units.',
            ],
            'state_limits' => [
                'value' => [
                    'NORMAL' => [
                        'max_spend_1h' => 200000,
                        'max_spend_24h' => 500000,
                        'max_spend_7d' => 1000000,
                        'max_new_creators_24h' => 1,
                        'step_up_threshold' => 150000,
                        'cooldown_minutes' => 15,
                        'review_hold_threshold' => 250000,
                        'guest_allowed' => true,
                    ],
                    'CAUTION' => [
                        'max_spend_1h' => 100000,
                        'max_spend_24h' => 250000,
                        'max_spend_7d' => 500000,
                        'max_new_creators_24h' => 1,
                        'step_up_threshold' => 50000,
                        'cooldown_minutes' => 15,
                        'review_hold_threshold' => 150000,
                        'guest_allowed' => true,
                    ],
                    'THROTTLE' => [
                        'max_spend_1h' => 75000,
                        'max_spend_24h' => 150000,
                        'max_spend_7d' => 300000,
                        'max_new_creators_24h' => 1,
                        'step_up_threshold' => 25000,
                        'cooldown_minutes' => 30,
                        'review_hold_threshold' => 100000,
                        'guest_allowed' => false,
                    ],
                    'FREEZE' => [
                        'max_spend_1h' => 50000,
                        'max_spend_24h' => 100000,
                        'max_spend_7d' => 200000,
                        'max_new_creators_24h' => 1,
                        'step_up_threshold' => 25000,
                        'cooldown_minutes' => 30,
                        'review_hold_threshold' => 75000,
                        'guest_allowed' => false,
                    ],
                ],
                'description' => 'Limits per platform state (spend caps, step-up thresholds, review-hold thresholds, guest checkout, cooldown). Amounts are in minor units.',
            ],
            'platform_state_triggers' => [
                'value' => [
                    'daily_gmv_caution_multiplier' => 1.5,
                    'daily_gmv_throttle_multiplier' => 2.0,
                    'weekly_gmv_spike_multiplier' => 1.3,
                    'platform_dispute_rate_freeze' => 0.007,
                    'creator_dispute_rate_trigger' => 0.008,
                    'creators_over_trigger_count' => 5,
                ],
                'description' => 'Automatic platform state triggers (CAUTION/THROTTLE/FREEZE) based on GMV and dispute rates.',
            ],
            'high_velocity_rules' => [
                'value' => [
                    'spend_2h_step_up_amount' => 750000,
                    'spend_2h_review_hold_amount' => 1500000,
                    'force_3ds_on_high_velocity' => true,
                ],
                'description' => 'High velocity spend rules (2-hour windows) and review-hold threshold. Amounts are in minor units.',
            ],
            'cross_creator_rules' => [
                'value' => [
                    'spend_48h_restrict_amount' => 500000,
                    'creators_paid_48h_min' => 2,
                    'restrict_duration_hours' => 72,
                ],
                'description' => 'Cross-creator hopping restrictions for supporters. Amounts are in minor units.',
            ],
            'creator_rules' => [
                'value' => [
                    'new_creator_age_days' => 30,
                    'new_creator_daily_cap' => 50000,
                ],
                'description' => 'Creator protection rules for new creators. Amounts are in minor units.',
            ],
            'supporter_rules' => [
                'value' => [
                    'velocity_window_minutes' => 10,
                    'velocity_step_up_count' => 3,
                    'velocity_cooldown_count' => 5,
                    'single_tx_step_up_amount' => 150000,
                ],
                'description' => 'Supporter/buyer anti-fraud rules (velocity + single transaction step-up). Amounts are in minor units.',
            ],
            'risk_thresholds' => [
                'value' => [
                    'high_dispute_rate' => 0.01,
                    'medium_dispute_rate' => 0.005,
                    'high_refund_rate' => 0.05,
                    'min_tx_count' => 10,
                    'concentration_gmv_threshold' => 500000,
                    'concentration_percent_trigger' => 40,
                    'concentration_reserve_increase' => 10,
                ],
                'description' => 'Thresholds for automated risk classification and concentration risk.',
            ],
            'onboarding_limits' => [
                'value' => [
                    'NORMAL' => 25,
                    'CAUTION' => 10,
                    'THROTTLE' => 5,
                    'FREEZE' => 0,
                ],
                'description' => 'Creator activation/day limits per platform state.',
            ],
        ];

        foreach ($updates as $key => $row) {
            $exists = DB::table('risk_settings')->where('key', $key)->exists();

            if ($exists) {
                DB::table('risk_settings')
                    ->where('key', $key)
                    ->update([
                        'value' => json_encode($row['value']),
                        'description' => $row['description'],
                        'updated_at' => $now,
                    ]);
            } else {
                DB::table('risk_settings')->insert([
                    'key' => $key,
                    'value' => json_encode($row['value']),
                    'description' => $row['description'],
                    'last_updated_by' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('risk_settings')->where('key', 'onboarding_limits')->delete();
    }
};
