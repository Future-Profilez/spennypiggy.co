<?php

namespace Tests\Feature;

use App\Mail\RiskLevelChanged;
use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\User;
use App\Services\Risk\RiskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class RiskLevelChangeNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create([
            'role' => '1',
            'stripe_connected_at' => now()->subDays(60),
        ]);
    }

    /** @test */
    public function a_brand_new_creator_is_never_emailed_that_restrictions_were_lifted(): void
    {
        Mail::fake();

        $user = $this->creator();

        // First ever evaluation: creates the metric row and computes 'low'.
        app(RiskService::class)->recalculateMetrics((string) $user->uuid);

        Mail::assertNothingSent();
    }

    /** @test */
    public function a_freshly_created_metric_row_holds_the_low_baseline_not_null(): void
    {
        $user = $this->creator();

        $metric = CreatorMetric::firstOrCreate(['creator_id' => (string) $user->uuid]);

        // The DB default is not applied to the in-memory model — the model's
        // own $attributes default is what keeps this from being NULL.
        $this->assertSame('low', $metric->risk_level);
    }

    /** @test */
    public function a_first_evaluation_that_genuinely_lands_on_high_still_emails_the_creator(): void
    {
        Mail::fake();

        $user = $this->creator();

        // risk_thresholds.min_tx_count is 10 — a dispute rate is only acted on
        // once there are enough transactions for it to mean anything.
        for ($i = 0; $i < 10; $i++) {
            Payment::create([
                'id' => (string) Str::uuid(),
                'creator_id' => (string) $user->uuid,
                'amount' => 1000,
                'currency' => 'GBP',
                'status' => 'succeeded',
            ]);
        }

        // disputes has no updated_at column, so insert rather than using the model.
        DB::table('disputes')->insert([
            'id' => (string) Str::uuid(),
            'creator_id' => (string) $user->uuid,
            'stripe_dispute_id' => 'dp_test_'.uniqid(),
            'amount' => 1000,
            'currency' => 'GBP',
            'status' => 'needs_response',
            'created_at' => now(),
        ]);

        app(RiskService::class)->recalculateMetrics((string) $user->uuid);

        $this->assertSame('high', CreatorMetric::find((string) $user->uuid)->risk_level);
        Mail::assertSent(RiskLevelChanged::class);
    }

    /** @test */
    public function a_real_recovery_from_high_back_to_low_still_emails_the_creator(): void
    {
        Mail::fake();

        $user = $this->creator();

        CreatorMetric::create([
            'creator_id' => (string) $user->uuid,
            'risk_level' => 'high',
        ]);

        // No disputes, no transactions — evaluates back down to 'low'.
        app(RiskService::class)->recalculateMetrics((string) $user->uuid);

        $this->assertSame('low', CreatorMetric::find((string) $user->uuid)->risk_level);
        Mail::assertSent(RiskLevelChanged::class);
    }
}
