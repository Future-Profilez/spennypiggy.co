<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $defaults = [
            [
                'key' => 'state_limits',
                'value' => [
                    'NORMAL' => [
                        'max_spend_1h' => 75000,
                        'max_spend_24h' => 150000,
                        'max_spend_7d' => 300000,
                        'max_new_creators_24h' => 1,
                        'guest_allowed' => false,
                        'cooldown_minutes' => 15,
                    ],
                    'CAUTION' => [
                        'max_spend_1h' => 50000,
                        'max_spend_24h' => 250000,
                        'max_spend_7d' => 500000,
                        'max_new_creators_24h' => 1,
                        'guest_allowed' => true,
                        'cooldown_minutes' => 15,
                    ],
                    'THROTTLE' => [
                        'max_spend_1h' => 25000,
                        'max_spend_24h' => 150000,
                        'max_spend_7d' => 300000,
                        'max_new_creators_24h' => 0,
                        'guest_allowed' => false,
                        'cooldown_minutes' => 60,
                    ],
                    'FREEZE' => [
                        'max_spend_1h' => 0,
                        'max_spend_24h' => 0,
                        'max_spend_7d' => 0,
                        'max_new_creators_24h' => 0,
                        'guest_allowed' => false,
                        'cooldown_minutes' => 1440,
                    ],
                ],
                'description' => 'Limits per platform state (spend caps, guest checkout, and cooldown). Amounts are in minor units.',
            ],
            [
                'key' => 'supporter_rules',
                'value' => [
                    'velocity_window_minutes' => 10,
                    'velocity_step_up_count' => 3,
                    'velocity_cooldown_count' => 5,
                    'single_tx_step_up_amount' => 20000,
                ],
                'description' => 'Supporter/buyer anti-fraud rules (velocity + single transaction step-up). Amounts are in minor units.',
            ],
            [
                'key' => 'creator_rules',
                'value' => [
                    'new_creator_age_days' => 30,
                    'new_creator_daily_cap' => 50000,
                ],
                'description' => 'Creator protection rules for new creators. Amounts are in minor units.',
            ],
            [
                'key' => 'high_velocity_rules',
                'value' => [
                    'spend_2h_step_up_amount' => 750000,
                    'spend_2h_review_hold_amount' => 1500000,
                    'force_3ds_on_high_velocity' => true,
                ],
                'description' => 'High velocity spend rules (2-hour windows) and review-hold threshold. Amounts are in minor units.',
            ],
            [
                'key' => 'cross_creator_rules',
                'value' => [
                    'spend_48h_restrict_amount' => 500000,
                    'creators_paid_48h_min' => 2,
                    'restrict_duration_hours' => 24,
                ],
                'description' => 'Cross-creator hopping restrictions for supporters. Amounts are in minor units.',
            ],
            [
                'key' => 'platform_state_triggers',
                'value' => [
                    'daily_gmv_caution_multiplier' => 1.5,
                    'daily_gmv_throttle_multiplier' => 2.0,
                    'weekly_gmv_spike_multiplier' => 1.3,
                    'creator_dispute_rate_trigger' => 0.008,
                    'creators_over_trigger_count' => 5,
                    'platform_dispute_rate_freeze' => 0.007,
                ],
                'description' => 'Automatic platform state triggers (CAUTION/THROTTLE/FREEZE) based on GMV and dispute rates.',
            ],
        ];

        foreach ($defaults as $row) {
            $exists = DB::table('risk_settings')->where('key', $row['key'])->exists();
            if ($exists) {
                continue;
            }

            DB::table('risk_settings')->insert([
                'key' => $row['key'],
                'value' => json_encode($row['value']),
                'description' => $row['description'],
                'last_updated_by' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('risk_settings')->whereIn('key', [
            'state_limits',
            'supporter_rules',
            'creator_rules',
            'high_velocity_rules',
            'cross_creator_rules',
            'platform_state_triggers',
        ])->delete();
    }
};
