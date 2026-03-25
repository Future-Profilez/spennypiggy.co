<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\PlatformRiskState;
use App\Models\RiskSetting;
use App\Models\User;
use App\Services\Risk\RiskEngineService;
use App\Services\Risk\RiskIdentityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiskEngineLimitsTest extends TestCase
{
    use RefreshDatabase;

    private function seedSettings(array $overrides = []): void
    {
        $stateLimits = [
            'NORMAL' => [
                'max_spend_1h' => 2000,
                'max_spend_24h' => 100000,
                'max_spend_7d' => 1000000,
                'max_new_creators_24h' => 1,
                'step_up_threshold' => 20000,
                'cooldown_minutes' => 15,
                'review_hold_threshold' => 250000,
                'guest_allowed' => true,
            ],
            'CAUTION' => [
                'max_spend_1h' => 999999,
                'max_spend_24h' => 999999,
                'max_spend_7d' => 999999,
                'max_new_creators_24h' => 10,
                'step_up_threshold' => 20000,
                'cooldown_minutes' => 15,
                'review_hold_threshold' => 250000,
                'guest_allowed' => true,
            ],
        ];

        RiskSetting::updateOrCreate(
            ['key' => 'state_limits'],
            ['value' => array_merge($stateLimits, $overrides['state_limits'] ?? [])]
        );

        RiskSetting::updateOrCreate(
            ['key' => 'global_limits'],
            ['value' => $overrides['global_limits'] ?? [
                'max_spend_1h' => 2000,
                'max_spend_24h' => 100000,
                'max_spend_7d' => 1000000,
                'max_creators_per_day' => 1,
                'guest_allowed' => true,
            ]]
        );

        RiskSetting::updateOrCreate(
            ['key' => 'supporter_rules'],
            ['value' => $overrides['supporter_rules'] ?? [
                'velocity_window_minutes' => 10,
                'velocity_step_up_count' => 3,
                'velocity_cooldown_count' => 5,
                'single_tx_step_up_amount' => 20000,
            ]]
        );

        RiskSetting::updateOrCreate(
            ['key' => 'creator_rules'],
            ['value' => $overrides['creator_rules'] ?? [
                'new_creator_age_days' => 30,
                'new_creator_daily_cap' => 50000,
            ]]
        );

        RiskSetting::updateOrCreate(
            ['key' => 'high_velocity_rules'],
            ['value' => $overrides['high_velocity_rules'] ?? [
                'spend_2h_step_up_amount' => 750000,
                'spend_2h_review_hold_amount' => 1500000,
                'force_3ds_on_high_velocity' => true,
            ]]
        );

        RiskSetting::updateOrCreate(
            ['key' => 'cross_creator_rules'],
            ['value' => $overrides['cross_creator_rules'] ?? [
                'spend_48h_restrict_amount' => 500000,
                'creators_paid_48h_min' => 2,
                'restrict_duration_hours' => 24,
            ]]
        );
    }

    public function test_single_transaction_marks_review_hold_when_over_threshold(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'global_limits' => [
                'max_spend_1h' => 999999,
                'max_spend_24h' => 999999,
                'max_spend_7d' => 999999,
                'max_creators_per_day' => 10,
                'guest_allowed' => true,
            ],
            'state_limits' => [
                'NORMAL' => [
                    'step_up_threshold' => 1000,
                    'review_hold_threshold' => 3000,
                    'guest_allowed' => true,
                ],
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $riskResult = app(RiskEngineService::class)->evaluate([
            'email' => 'payer@example.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
            'amount' => 4000,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-1',
        ]);

        $this->assertSame('STEP_UP', $riskResult['decision'] ?? null);
        $this->assertContains('MARK_REVIEW_HOLD', $riskResult['reason_codes'] ?? []);
    }

    public function test_hourly_spend_limit_blocks_when_initiated_payments_exceed_cap(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'state_limits' => [
                'NORMAL' => [
                    'max_spend_1h' => 2000,
                    'guest_allowed' => true,
                ],
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $identity = app(RiskIdentityService::class)->resolveIdentity([
            'email' => 'a@b.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 1500,
            'currency' => 'gbp',
            'status' => 'initiated',
            'reason_codes' => [],
        ]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 600,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-1',
            'email' => 'a@b.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision']);
        $this->assertContains('LIMIT_EXCEEDED_1H', $result['reason_codes']);
    }

    public function test_global_limit_caps_state_limit_in_non_normal_state(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'global_limits' => [
                'max_spend_1h' => 2000,
                'max_spend_24h' => 100000,
                'max_spend_7d' => 1000000,
                'max_creators_per_day' => 1,
                'guest_allowed' => true,
            ],
            'state_limits' => [
                'CAUTION' => [
                    'max_spend_1h' => 999999,
                    'max_spend_24h' => 999999,
                    'max_spend_7d' => 999999,
                    'max_new_creators_24h' => 10,
                    'step_up_threshold' => 20000,
                    'cooldown_minutes' => 15,
                    'review_hold_threshold' => 250000,
                    'guest_allowed' => true,
                ],
            ],
        ]);

        PlatformRiskState::create(['state' => 'CAUTION', 'set_by' => 'system', 'started_at' => now()]);

        $identity = app(RiskIdentityService::class)->resolveIdentity([
            'email' => 'a@b.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 1500,
            'currency' => 'gbp',
            'status' => 'initiated',
            'reason_codes' => [],
        ]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 600,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-1',
            'email' => 'a@b.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision'], json_encode($result));
        $this->assertContains('LIMIT_EXCEEDED_1H', $result['reason_codes'], json_encode($result));
    }

    public function test_velocity_step_up_triggers_at_configured_count(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'supporter_rules' => [
                'velocity_window_minutes' => 10,
                'velocity_step_up_count' => 3,
                'velocity_cooldown_count' => 5,
                'single_tx_step_up_amount' => 20000,
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $identity = app(RiskIdentityService::class)->resolveIdentity([
            'email' => 'a@b.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 100,
            'currency' => 'gbp',
            'status' => 'initiated',
            'reason_codes' => [],
            'created_at' => now()->subMinutes(1),
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 100,
            'currency' => 'gbp',
            'status' => 'initiated',
            'reason_codes' => [],
            'created_at' => now()->subMinutes(2),
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 100,
            'currency' => 'gbp',
            'status' => 'initiated',
            'reason_codes' => [],
            'created_at' => now()->subMinutes(3),
        ]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 100,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-1',
            'email' => 'a@b.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('STEP_UP', $result['decision']);
        $this->assertContains('ACCELERATION_3_IN_10M', $result['reason_codes']);
    }

    public function test_new_creator_limit_blocks_second_new_creator_in_24_hours(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'state_limits' => [
                'NORMAL' => [
                    'max_spend_1h' => 999999,
                    'max_spend_24h' => 999999,
                    'max_spend_7d' => 999999,
                    'max_new_creators_24h' => 1,
                    'step_up_threshold' => 20000,
                    'cooldown_minutes' => 15,
                    'review_hold_threshold' => 250000,
                    'guest_allowed' => true,
                ],
            ],
            'global_limits' => [
                'max_spend_1h' => 999999,
                'max_spend_24h' => 999999,
                'max_spend_7d' => 999999,
                'max_creators_per_day' => 1,
                'guest_allowed' => true,
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $identity = app(RiskIdentityService::class)->resolveIdentity([
            'email' => 'a@b.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 100,
            'currency' => 'gbp',
            'status' => 'succeeded',
            'reason_codes' => [],
            'created_at' => now()->subHour(),
        ]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 100,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-2',
            'email' => 'a@b.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision'], json_encode($result));
        $this->assertContains('NEW_CREATOR_LIMIT', $result['reason_codes'], json_encode($result));
    }

    public function test_guest_checkout_blocked_when_disabled_in_state_limits(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'state_limits' => [
                'NORMAL' => [
                    'max_spend_1h' => 2000,
                    'guest_allowed' => false,
                ],
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 100,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-1',
            'email' => 'guest@x.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision']);
        $this->assertContains('GUEST_BLOCKED_IN_STATE', $result['reason_codes']);
    }

    public function test_identity_resolution_prefers_device_id_over_email(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings();

        $svc = app(RiskIdentityService::class);

        $id1 = $svc->resolveIdentity([
            'email' => 'one@ex.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        $id2 = $svc->resolveIdentity([
            'email' => 'two@ex.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        $this->assertSame($id1->id, $id2->id);
    }

    public function test_cross_creator_hopping_blocks_new_creator_after_threshold(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'state_limits' => [
                'NORMAL' => [
                    'max_spend_1h' => 10000000,
                    'max_spend_24h' => 10000000,
                    'max_spend_7d' => 10000000,
                    'max_new_creators_24h' => 10,
                    'guest_allowed' => true,
                    'cooldown_minutes' => 15,
                    'step_up_threshold' => 0,
                    'review_hold_threshold' => 250000,
                ],
            ],
            'global_limits' => [
                'max_spend_1h' => 10000000,
                'max_spend_24h' => 10000000,
                'max_spend_7d' => 10000000,
                'max_creators_per_day' => 10,
                'guest_allowed' => true,
            ],
            'cross_creator_rules' => [
                'spend_48h_restrict_amount' => 500000,
                'creators_paid_48h_min' => 2,
                'restrict_duration_hours' => 72,
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $identity = app(RiskIdentityService::class)->resolveIdentity([
            'email' => 'a@b.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-1',
            'risk_identity_id' => $identity->id,
            'amount' => 300000,
            'currency' => 'gbp',
            'status' => 'succeeded',
            'reason_codes' => [],
            'created_at' => now()->subHours(2),
        ]);

        Payment::create([
            'creator_id' => 'creator-uuid-2',
            'risk_identity_id' => $identity->id,
            'amount' => 300000,
            'currency' => 'gbp',
            'status' => 'succeeded',
            'reason_codes' => [],
            'created_at' => now()->subHours(3),
        ]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 100,
            'currency' => 'GBP',
            'creator_id' => 'creator-uuid-3',
            'email' => 'a@b.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision'], json_encode($result));
        $this->assertContains('NEW_CREATOR_RESTRICTED', $result['reason_codes'], json_encode($result));
    }

    public function test_new_creator_daily_volume_cap_blocks_excess_amount(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 12:00:00'));
        $this->seedSettings([
            'state_limits' => [
                'NORMAL' => [
                    'max_spend_1h' => 10000000,
                    'max_spend_24h' => 10000000,
                    'max_spend_7d' => 10000000,
                    'max_new_creators_24h' => 10,
                    'guest_allowed' => true,
                    'cooldown_minutes' => 15,
                    'step_up_threshold' => 0,
                    'review_hold_threshold' => 250000,
                ],
            ],
            'global_limits' => [
                'max_spend_1h' => 10000000,
                'max_spend_24h' => 10000000,
                'max_spend_7d' => 10000000,
                'max_creators_per_day' => 10,
                'guest_allowed' => true,
            ],
            'creator_rules' => [
                'new_creator_age_days' => 30,
                'new_creator_daily_cap' => 50000,
            ],
        ]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        $creator = User::factory()->create([
            'created_at' => now()->subDays(10),
        ]);

        $identity = app(RiskIdentityService::class)->resolveIdentity([
            'email' => 'a@b.com',
            'device_id' => 'device-1',
            'ip' => '1.1.1.1',
            'is_guest' => true,
        ]);

        Payment::create([
            'creator_id' => $creator->uuid,
            'risk_identity_id' => $identity->id,
            'amount' => 49000,
            'currency' => 'gbp',
            'status' => 'succeeded',
            'reason_codes' => [],
            'created_at' => now()->subMinutes(30),
        ]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 2000,
            'currency' => 'GBP',
            'creator_id' => $creator->uuid,
            'email' => 'a@b.com',
            'ip' => '1.1.1.1',
            'device_id' => 'device-1',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision'], json_encode($result));
        $this->assertContains('NEW_CREATOR_VOLUME_LIMIT', $result['reason_codes'], json_encode($result));
    }
}
