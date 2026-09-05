<?php

namespace Tests\Feature;

use App\Mail\FounderPayoutRejection;
use App\Models\AuditLog;
use App\Models\FounderBonus;
use App\Models\FounderBonusMonthly;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FounderBonusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function createAdmin(): User
    {
        return User::factory()->create([
            'role' => 2,
            'email_verified_at' => now(),
        ]);
    }

    private function createCreator(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'email_verified_at' => now(),
            'default_currency' => 'GBP',
            'is_founder' => false,
        ], $attrs));
    }

    public function test_guest_or_creator_cannot_access_admin_founder_bonus_routes(): void
    {
        // 1. Guest
        $response = $this->get(route('admin.founder/bonuses.index'));
        $response->assertRedirectContains('/login');

        // 2. Regular Creator (role 1)
        $creator = $this->createCreator();
        $response = $this->actingAs($creator)->get(route('admin.founder/bonuses.index'));
        $response->assertStatus(403);
    }

    public function test_admin_can_view_founder_bonus_dashboard_and_fetch_data(): void
    {
        $admin = $this->createAdmin();
        $creator = $this->createCreator(['is_founder' => true]);

        // Create a monthly bonus record
        FounderBonusMonthly::create([
            'creator_id' => $creator->id,
            'month' => Carbon::now()->format('Y-m'),
            'total_earnings' => 5000.00,
            'bonus_amount' => 500.00,
            'payout_status' => 'pending',
        ]);

        // Create a qualification bonus record
        FounderBonus::create([
            'creator_id' => $creator->id,
            'first_30d_earnings' => 3000.00,
            'bonus_amount' => 300.00,
            'qualification_date' => Carbon::now()->toDateString(),
            'estimated_payout_date' => Carbon::now()->addDays(30)->toDateString(),
            'payout_status' => 'pending',
        ]);

        // View index
        $response = $this->actingAs($admin)->get(route('admin.founder/bonuses.index'));
        $response->assertStatus(200);

        // Fetch monthly data JSON
        $dataMonthly = $this->actingAs($admin)->getJson(route('admin.founder/bonuses.data', ['type' => 'monthly']));
        $dataMonthly->assertStatus(200);
        $dataMonthly->assertJsonStructure([
            'data',
            'current_page',
            'total',
        ]);

        // Fetch qualification data JSON
        $dataQual = $this->actingAs($admin)->getJson(route('admin.founder/bonuses.data', ['type' => 'qualification']));
        $dataQual->assertStatus(200);
        $dataQual->assertJsonStructure([
            'data',
            'current_page',
            'total',
        ]);
    }

    public function test_admin_can_approve_monthly_and_qualification_bonus(): void
    {
        $admin = $this->createAdmin();
        $creator = $this->createCreator(['is_founder' => true]);

        $monthly = FounderBonusMonthly::create([
            'creator_id' => $creator->id,
            'month' => Carbon::now()->format('Y-m'),
            'total_earnings' => 4000.00,
            'bonus_amount' => 400.00,
            'payout_status' => 'pending',
        ]);

        $qual = FounderBonus::create([
            'creator_id' => $creator->id,
            'first_30d_earnings' => 3000.00,
            'bonus_amount' => 300.00,
            'qualification_date' => Carbon::now()->toDateString(),
            'estimated_payout_date' => Carbon::now()->addDays(30)->toDateString(),
            'payout_status' => 'pending',
        ]);

        // Approve monthly
        $resMonthly = $this->actingAs($admin)->postJson(route('admin.founder/bonuses.approve', [
            'type' => 'monthly',
            'id' => $monthly->id,
        ]));
        $resMonthly->assertStatus(200);
        $this->assertEquals('approved', $monthly->fresh()->payout_status);

        // Approve qualification
        $resQual = $this->actingAs($admin)->postJson(route('admin.founder/bonuses.approve', [
            'type' => 'qualification',
            'id' => $qual->id,
        ]));
        $resQual->assertStatus(200);
        $this->assertEquals('approved', $qual->fresh()->payout_status);
    }

    public function test_admin_can_reject_bonus_with_reason_and_emails_creator(): void
    {
        $admin = $this->createAdmin();
        $creator = $this->createCreator(['is_founder' => true]);

        $monthly = FounderBonusMonthly::create([
            'creator_id' => $creator->id,
            'month' => Carbon::now()->format('Y-m'),
            'total_earnings' => 4000.00,
            'bonus_amount' => 400.00,
            'payout_status' => 'pending',
        ]);

        $reason = 'Suspicious chargeback rate on subscription purchases';

        $res = $this->actingAs($admin)->postJson(route('admin.founder/bonuses.reject', [
            'type' => 'monthly',
            'id' => $monthly->id,
        ]), [
            'reason' => $reason,
        ]);

        $res->assertStatus(200);
        $refreshed = $monthly->fresh();
        $this->assertEquals('rejected', $refreshed->payout_status);
        $this->assertEquals($reason, $refreshed->payout_rejection_reason);

        // Assert mail was sent to creator
        Mail::assertSent(FounderPayoutRejection::class, function (FounderPayoutRejection $mail) use ($creator) {
            return $mail->hasTo($creator->email);
        });

        // Assert audit log was recorded
        $auditLog = AuditLog::where('action_type', 'FOUNDER_BONUS_REJECTED')
            ->where('reference_id', (string) $monthly->id)
            ->first();
        $this->assertNotNull($auditLog);
    }

    public function test_admin_can_mark_bonus_as_paid_with_payment_reference(): void
    {
        $admin = $this->createAdmin();
        $creator = $this->createCreator(['is_founder' => true]);

        $monthly = FounderBonusMonthly::create([
            'creator_id' => $creator->id,
            'month' => Carbon::now()->format('Y-m'),
            'total_earnings' => 4000.00,
            'bonus_amount' => 400.00,
            'payout_status' => 'approved',
        ]);

        // Validation test: payment_reference required
        $invalidRes = $this->actingAs($admin)->postJson(route('admin.founder/bonuses.mark-paid', [
            'type' => 'monthly',
            'id' => $monthly->id,
        ]), []);
        $invalidRes->assertStatus(422);

        // Valid test
        $ref = 'BANK-WIRE-REF-99201';
        $validRes = $this->actingAs($admin)->postJson(route('admin.founder/bonuses.mark-paid', [
            'type' => 'monthly',
            'id' => $monthly->id,
        ]), [
            'payment_reference' => $ref,
        ]);
        $validRes->assertStatus(200);

        $refreshed = $monthly->fresh();
        $this->assertEquals('paid', $refreshed->payout_status);
        $this->assertEquals($ref, $refreshed->payment_reference);
        $this->assertNotNull($refreshed->payout_date);

        // Audit log created
        $auditLog = AuditLog::where('action_type', 'FOUNDER_BONUS_MARKED_PAID')
            ->where('reference_id', (string) $monthly->id)
            ->first();
        $this->assertNotNull($auditLog);
    }

    public function test_admin_can_get_and_update_founder_bonus_settings(): void
    {
        $admin = $this->createAdmin();

        // Get settings
        $getRes = $this->actingAs($admin)->getJson(route('admin.founder/bonus-settings.get'));
        $getRes->assertStatus(200);
        $getRes->assertJsonStructure([
            'thresholds' => [
                'min_first_30d_earnings',
                'min_monthly_earnings',
                'max_monthly_earnings',
            ],
            'calculation' => [
                'qualification_days',
                'bonus_percentage',
            ],
            'limits' => [
                'max_founder_seats',
                'max_bonus_per_month',
            ],
            'features',
        ]);

        // Update settings
        $newSettings = [
            'thresholds' => [
                'min_first_30d_earnings' => 3500,
                'min_monthly_earnings' => 3000,
                'max_monthly_earnings' => 12000,
            ],
            'calculation' => [
                'qualification_days' => 45,
                'bonus_percentage' => 0.12,
            ],
            'limits' => [
                'max_founder_seats' => 200,
                'max_bonus_per_month' => 1200,
            ],
            'features' => [
                'email_notifications' => true,
            ],
        ];

        $postRes = $this->actingAs($admin)->postJson(route('admin.founder/bonus-settings.update'), $newSettings);
        $postRes->assertStatus(200);

        // Verify dynamic getters read the new overrides
        $this->assertEquals(3500.0, FounderBonus::getMinFirst30dEarnings());
        $this->assertEquals(0.12, FounderBonus::getBonusPercentage());
        $this->assertEquals(200, FounderBonus::getMaxFounderSeats());
        $this->assertEquals(3000.0, FounderBonus::getMinMonthlyEarnings());
        $this->assertEquals(12000.0, FounderBonus::getMaxMonthlyEarnings());
        $this->assertEquals(1200.0, FounderBonus::getMaxBonusPerMonth());
        $this->assertEquals(45, FounderBonus::getQualificationDays());
    }

    public function test_admin_can_export_founder_bonuses_as_csv(): void
    {
        $admin = $this->createAdmin();
        $creator = $this->createCreator(['is_founder' => true]);

        FounderBonusMonthly::create([
            'creator_id' => $creator->id,
            'month' => Carbon::now()->format('Y-m'),
            'total_earnings' => 5000.00,
            'bonus_amount' => 500.00,
            'payout_status' => 'paid',
            'payment_reference' => 'TEST-EXPORT-REF',
        ]);

        $response = $this->actingAs($admin)->get(route('admin.founder/bonuses.export', ['type' => 'monthly']));
        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
    }

    public function test_public_founder_leaderboard_route_and_calculations(): void
    {
        $creator = $this->createCreator([
            'is_founder' => true,
            'stripe_connected_at' => now()->subDays(10),
        ]);

        // Qualified creator should see founderMonthlyData
        $response = $this->actingAs($creator)->get(route('founder.bonus'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('FounderBonus/Index')
            ->has('programStats')
            ->has('founderMonthlyData')
        );
    }
}
