<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\Membership;
use App\Models\Payment;
use App\Models\PayoutRun;
use App\Models\PlatformRiskState;
use App\Models\RiskSetting;
use App\Models\ShopPayment;
use App\Models\Shop;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\Task;
use App\Models\TipGoalsPayment;
use App\Models\TipGoal;
use App\Models\User;
use App\Models\UserPayment;
use App\Services\Risk\PayoutService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PayoutAndStatusPropagationTest extends TestCase
{
    use RefreshDatabase;

    private User $creator;
    private string $creatorUuid;
    private int $tipGoalId;

    protected function setUp(): void
    {
        parent::setUp();

        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);

        $this->creator = User::factory()->create([
            'default_currency' => 'GBP',
            'account_id' => 'acct_test_123',
        ]);
        $this->creatorUuid = $this->creator->uuid;

        // Seed minimal risk settings so PayoutService doesn't crash
        RiskSetting::updateOrCreate(['key' => 'risk_thresholds'], ['value' => [
            'high_dispute_rate' => 0.01, 'medium_dispute_rate' => 0.005,
            'high_refund_rate' => 0.05, 'min_tx_count' => 10,
        ]]);
        RiskSetting::updateOrCreate(['key' => 'risk_consequences'], ['value' => [
            'high_reserve_percent' => 25, 'high_payout_delay' => 14,
            'medium_reserve_percent' => 10, 'medium_payout_delay' => 7,
            'low_reserve_percent' => 0, 'low_payout_delay' => 7,
        ]]);
        RiskSetting::updateOrCreate(['key' => 'creator_rules'], ['value' => [
            'new_creator_age_days' => 30, 'new_creator_daily_cap' => 50000,
        ]]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);

        // Create a TipGoal for FK constraint on tip_goals_payments
        // Use DB::table to bypass mass assignment and SoftDeletes issues
        $this->tipGoalId = \Illuminate\Support\Facades\DB::table('tip_goals')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test Goal',
            'user_id' => $this->creator->id,
            'target' => 100.00,
            'default_price' => 5.00,
            'tax_amount' => 0,
            'currency' => 'GBP',
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // =========================================================================
    // 1. FEE CALCULATION — reserve NOT in application_fee
    // =========================================================================

    public function test_fee_calculation_does_not_include_reserve_in_application_fee(): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow(15.00, 'GBP', 10);

        // Reserve should be reported but NOT added to application_fee
        $this->assertGreaterThan(0, $breakdown['reserve_amount']);
        $this->assertEquals(round(15.00 * 10 / 100, 2), $breakdown['reserve_amount']);

        // application_fee should be platform + compliance + admin only
        $expectedAppFee = $breakdown['platform_fee'] + $breakdown['compliance_fee'] + $breakdown['admin_fee'];
        $this->assertEquals($expectedAppFee, $breakdown['application_fee']);

        // net_to_creator should NOT subtract reserve
        $expectedNet = $breakdown['total_supporter_pays'] - $breakdown['stripe_fee'] - $breakdown['application_fee'];
        $this->assertEquals(round($expectedNet, 2), $breakdown['net_to_creator']);
    }

    public function test_fee_calculation_uses_correct_rates(): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow(100.00, 'GBP');

        // 17% platform
        $this->assertEquals(
            round($breakdown['total_supporter_pays'] * 0.17, 2),
            $breakdown['platform_fee']
        );
        // 2% compliance
        $this->assertEquals(
            round($breakdown['total_supporter_pays'] * 0.02, 2),
            $breakdown['compliance_fee']
        );
    }

    public function test_fee_calculation_without_reserve_matches_with_reserve(): void
    {
        $withoutReserve = Helpers::calculateStripeDirectChargeFlow(20.00, 'GBP', 0);
        $withReserve = Helpers::calculateStripeDirectChargeFlow(20.00, 'GBP', 15);

        // Total supporter pays should be identical — reserve doesn't change the charge
        $this->assertEquals($withoutReserve['total_supporter_pays'], $withReserve['total_supporter_pays']);
        $this->assertEquals($withoutReserve['application_fee'], $withReserve['application_fee']);
        $this->assertEquals($withoutReserve['net_to_creator'], $withReserve['net_to_creator']);

        // Only reserve_amount differs
        $this->assertEquals(0, $withoutReserve['reserve_amount']);
        $this->assertGreaterThan(0, $withReserve['reserve_amount']);
    }

    // =========================================================================
    // 2. PAYOUT — reserve excluded, review_hold/dispute/refund excluded
    // =========================================================================

    public function test_payout_excludes_reserve_from_net_payout(): void
    {
        Carbon::setTestNow('2026-05-01 12:00:00');

        // Create creator metric with 10% reserve
        CreatorMetric::create([
            'creator_id' => $this->creatorUuid,
            'reserve_percent' => 10,
            'risk_level' => 'low',
        ]);

        $sessionId = 'cs_test_' . Str::random(10);
        $piId = 'pi_test_' . Str::random(10);

        // Create a succeeded payment
        Payment::create([
            'creator_id' => $this->creatorUuid,
            'amount' => 1500, // 15.00 GBP in minor
            'reserve_amount_minor' => 150, // 10% of 1500
            'currency' => 'gbp',
            'stripe_session_id' => $sessionId,
            'stripe_payment_intent_id' => $piId,
            'status' => 'succeeded',
        ]);

        // Create corresponding TipGoalsPayment + FinancialTransaction
        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalId,
            'user_id' => null,
            
            'session_id' => $sessionId,
            'currency' => 'GBP',
            'amount' => 15.00,
            'tax' => 3.00,
            'status' => 'paid',
        ]);

        FinancialTransaction::create([
            'user_id' => $this->creator->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => $tip->id,
            'type' => 'income',
            'gross_amount' => 18.00,
            'platform_fee' => 3.00,
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => 15.00,
            'reserve_amount' => 1.50, // 10% of 15
            'reserve_status' => 'held',
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'Tip',
            'transaction_date' => now(),
        ]);

        $payoutService = app(PayoutService::class);
        $preview = $payoutService->calculatePayouts();

        $this->assertArrayHasKey($this->creatorUuid, $preview['payouts']);

        $payout = $preview['payouts'][$this->creatorUuid];

        // Net earnings from FT = 15.00 * 100 = 1500
        $this->assertEquals(1500, $payout['net_earnings']);

        // Reserve held = 1.50 * 100 = 150
        $this->assertEquals(150, $payout['reserve_amount']);

        // Net payout = net_earnings - reserve = 1500 - 150 = 1350
        $this->assertEquals(1350, $payout['net_payout']);
    }

    public function test_payout_excludes_review_hold_payments(): void
    {
        Carbon::setTestNow('2026-05-01 12:00:00');

        CreatorMetric::create([
            'creator_id' => $this->creatorUuid,
            'reserve_percent' => 0,
            'risk_level' => 'low',
        ]);

        // Succeeded payment
        $session1 = 'cs_ok_' . Str::random(10);
        Payment::create([
            'creator_id' => $this->creatorUuid,
            'amount' => 1000,
            'currency' => 'gbp',
            'stripe_session_id' => $session1,
            'status' => 'succeeded',
        ]);

        $tip1 = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalId, 'user_id' => null, 
            'session_id' => $session1, 'currency' => 'GBP', 'amount' => 10.00, 'tax' => 0, 'status' => 'paid',
        ]);
        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => TipGoalsPayment::class, 'source_id' => $tip1->id,
            'type' => 'income', 'gross_amount' => 10, 'net_amount' => 10, 'platform_fee' => 0, 'stripe_fee' => 0,
            'vat_amount' => 0, 'currency' => 'GBP', 'status' => 'completed', 'description' => 'Tip', 'transaction_date' => now(),
        ]);

        // Review hold payment — should be excluded
        $session2 = 'cs_hold_' . Str::random(10);
        Payment::create([
            'creator_id' => $this->creatorUuid,
            'amount' => 5000,
            'currency' => 'gbp',
            'stripe_session_id' => $session2,
            'stripe_payment_intent_id' => 'pi_hold_' . Str::random(10),
            'status' => 'review_hold',
        ]);

        $preview = app(PayoutService::class)->calculatePayouts();

        $this->assertArrayHasKey($this->creatorUuid, $preview['payouts']);
        $payout = $preview['payouts'][$this->creatorUuid];

        // Only the succeeded payment should be in net earnings
        $this->assertEquals(1000, $payout['net_earnings']);
        $this->assertEquals(1000, $payout['net_payout']);
    }

    public function test_payout_adjustment_uses_financial_transaction_net_amount(): void
    {
        Carbon::setTestNow('2026-05-01 12:00:00');

        CreatorMetric::create([
            'creator_id' => $this->creatorUuid,
            'reserve_percent' => 0,
            'risk_level' => 'low',
        ]);

        // A payment that was already paid out, then refunded
        $session = 'cs_refund_' . Str::random(10);
        $piId = 'pi_refund_' . Str::random(10);

        // Create a payout run that "paid" this
        $run = PayoutRun::create(['run_date' => '2026-04-25', 'status' => 'executed', 'totals' => []]);

        Payment::create([
            'creator_id' => $this->creatorUuid,
            'amount' => 5000, // risk ledger amount (could be gifter total in GBP)
            'currency' => 'gbp',
            'stripe_session_id' => $session,
            'stripe_payment_intent_id' => $piId,
            'status' => 'refunded',
            'payout_run_id' => $run->id, // already paid out
        ]);

        // The FT has the real creator amount
        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalId, 'user_id' => null, 
            'session_id' => $session, 'currency' => 'GBP', 'amount' => 30.00, 'tax' => 5, 'status' => 'refunded',
        ]);
        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => TipGoalsPayment::class, 'source_id' => $tip->id,
            'type' => 'income', 'gross_amount' => 35, 'net_amount' => 30, 'platform_fee' => 5, 'stripe_fee' => 0,
            'vat_amount' => 0, 'currency' => 'GBP', 'status' => 'refunded', 'description' => 'Tip', 'transaction_date' => now(),
        ]);

        $preview = app(PayoutService::class)->calculatePayouts();

        $this->assertArrayHasKey($this->creatorUuid, $preview['payouts']);
        $payout = $preview['payouts'][$this->creatorUuid];

        // Adjustment should use FT net_amount (30.00 = 3000 minor), NOT Payment.amount (5000)
        $this->assertEquals(3000, $payout['refund_dispute_amount']);
    }

    // =========================================================================
    // 3. RESERVE RELEASE — UUID payout_run_id handling
    // =========================================================================

    public function test_reserve_release_works_with_uuid_payout_run_ids(): void
    {
        Carbon::setTestNow('2026-06-15 12:00:00'); // 45 days after run

        // Create a past payout run with reserves
        $run = PayoutRun::create([
            'run_date' => '2026-05-01',
            'status' => 'executed',
            'totals' => [
                'payouts' => [
                    $this->creatorUuid => [
                        'reserve_amount' => 500,
                        'reserve_release_date' => '2026-05-31', // 30 days after run
                    ],
                ],
            ],
        ]);

        // UUID should be a string, not an integer
        $this->assertIsString($run->id);

        $payoutService = app(PayoutService::class);
        $reserves = $payoutService->getHeldReserves($this->creatorUuid);

        // The reserve should be in the breakdown (it's past release date)
        // getDueReserveReleases should find it since release date <= now
        $releaseData = $payoutService->releaseReserves();

        $this->assertGreaterThanOrEqual(1, $releaseData['due_creator_count']);
        $this->assertGreaterThanOrEqual(500, $releaseData['due_total']);
    }

    // =========================================================================
    // 4. WEBHOOK STATUS PROPAGATION — all tables updated
    // =========================================================================

    public function test_webhook_sync_propagates_refund_to_all_tables(): void
    {
        $sessionId = 'cs_sync_' . Str::random(10);
        $piId = 'pi_sync_' . Str::random(10);

        // Create risk ledger Payment
        Payment::create([
            'creator_id' => $this->creatorUuid,
            'amount' => 1500,
            'currency' => 'gbp',
            'stripe_session_id' => $sessionId,
            'stripe_payment_intent_id' => $piId,
            'status' => 'succeeded',
        ]);

        // TaskPurchase
        $task = Task::create([
            'title' => 'Test Task', 'creator_id' => $this->creator->id,
            'price' => 15, 'currency' => 'GBP', 'type' => 'instant', 'status' => 1,
        ]);
        $taskPurchase = TaskPurchase::create([
            'task_id' => $task->id, 'supporter_id' => $this->creator->id, 'creator_id' => $this->creator->id,
            'stripe_session_id' => $sessionId, 'payment_intent_id' => $piId,
            'amount' => 15, 'currency' => 'GBP', 'status' => 'paid', 'dispute_status' => 'none',
        ]);

        // TipGoalsPayment
        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalId, 'user_id' => null, 
            'session_id' => $sessionId, 'currency' => 'GBP', 'amount' => 15, 'tax' => 0, 'status' => 'paid',
        ]);

        // StripePaymentDetail
        $spd = StripePaymentDetail::create([
            'session_id' => $sessionId, 'amount_subtotal' => 15, 'amount_total' => 18,
            'currency' => 'gbp', 'owner_id' => $this->creator->id, 'payment_status' => 'paid',
        ]);

        // StripePaymentItems
        $spi = StripePaymentItems::create([
            'uuid' => Str::uuid(), 'stripe_payment_detail_id' => $spd->id,
            'amount' => 15, 'tax' => 3, 'quantity' => 1,
        ]);

        // ShopPayment (use DB::table since shops migration may lack price/currency/type columns)
        $shopId = \Illuminate\Support\Facades\DB::table('shops')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->creator->id, 'name' => 'Test Shop',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $shopPayment = ShopPayment::create([
            'session_id' => $sessionId, 'amount' => 15, 'currency' => 'GBP',
            'shop_id' => $shopId, 'payment_status' => 'paid',
        ]);

        // MembershipPayment (use DB::table for membership since columns added via SQL dump)
        $membershipId = \Illuminate\Support\Facades\DB::table('memberships')->insertGetId([
            'uuid' => (string) Str::uuid(), 'user_id' => $this->creator->id, 'name' => 'Gold',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $membershipPayment = MembershipPayment::create([
            'session_id' => $sessionId, 'membership_id' => $membershipId,
            'user_id' => $this->creator->id, 'currency' => 'GBP', 'amount' => 15,
            'tax' => 3, 'status' => 'paid',
        ]);

        // BillPayment
        $bill = Bills::create([
            'user_id' => $this->creator->id, 'name' => 'Test Bill', 'price' => 15,
            'currency' => 'GBP', 'period' => 'monthly', 'status' => 1,
        ]);
        $billPayment = BillPayment::create([
            'session_id' => $sessionId, 'bills_id' => $bill->id,
            'user_id' => $this->creator->id, 'currency' => 'GBP', 'amount' => 15,
            'tax' => 3, 'status' => 'paid',
        ]);

        // Deliverable
        $deliverable = Deliverable::create([
            'uuid' => Str::uuid(), 'product_id' => 'test',
            'creator_id' => $this->creator->id, 'gifter_id' => $this->creator->id,
            'session_id' => $sessionId, 'payment_intent_id' => $piId,
            'deliverable_type' => 'digital_file', 'product_type' => 'task',
            'status' => 'delivered', 'payment_status' => 'paid',
            'payment_currency' => 'GBP',
        ]);

        // FinancialTransactions for task and tip
        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => TaskPurchase::class, 'source_id' => $taskPurchase->id,
            'type' => 'income', 'gross_amount' => 18, 'net_amount' => 15, 'platform_fee' => 3, 'stripe_fee' => 0,
            'vat_amount' => 0, 'currency' => 'GBP', 'status' => 'completed', 'description' => 'Task', 'transaction_date' => now(),
        ]);
        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => TipGoalsPayment::class, 'source_id' => $tip->id,
            'type' => 'income', 'gross_amount' => 15, 'net_amount' => 15, 'platform_fee' => 0, 'stripe_fee' => 0,
            'vat_amount' => 0, 'currency' => 'GBP', 'status' => 'completed', 'description' => 'Tip', 'transaction_date' => now(),
        ]);
        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => StripePaymentItems::class, 'source_id' => $spi->id,
            'type' => 'income', 'gross_amount' => 18, 'net_amount' => 15, 'platform_fee' => 3, 'stripe_fee' => 0,
            'vat_amount' => 0, 'currency' => 'GBP', 'status' => 'completed', 'description' => 'Wish', 'transaction_date' => now(),
        ]);

        // UserPayment
        UserPayment::create([
            'from_user_id' => $this->creator->id, 'to_user_id' => $this->creator->id,
            'product_type' => 'task', 'amount' => 15, 'currency' => 'GBP',
            'payment_method' => 'stripe', 'payment_details' => json_encode($sessionId),
            'paid_at' => now(), 'status' => 'paid',
        ]);

        // ---- Execute sync (simulates what webhook does) ----
        $controller = app(\App\Http\Controllers\StripeWebhookController::class);
        // Use reflection to call private method
        $method = new \ReflectionMethod($controller, 'syncFinancialTransactionsByPaymentIntent');
        $method->setAccessible(true);
        $method->invoke($controller, $piId, 'refunded');

        // ---- Assert ALL tables updated ----

        // TaskPurchase
        $this->assertEquals('refunded', $taskPurchase->fresh()->status);

        // TipGoalsPayment
        $this->assertEquals('refunded', $tip->fresh()->status);

        // ShopPayment
        $this->assertEquals('refunded', $shopPayment->fresh()->payment_status);

        // StripePaymentDetail
        $this->assertEquals('refunded', $spd->fresh()->payment_status);

        // MembershipPayment
        $this->assertEquals('refunded', $membershipPayment->fresh()->status);

        // BillPayment
        $this->assertEquals('refunded', $billPayment->fresh()->status);

        // Deliverable
        $freshDeliverable = $deliverable->fresh();
        $this->assertEquals('refunded', $freshDeliverable->status);
        $this->assertEquals('refunded', $freshDeliverable->payment_status);

        // FinancialTransactions — all should be 'refunded'
        $ftStatuses = FinancialTransaction::where('user_id', $this->creator->id)->pluck('status')->unique()->toArray();
        $this->assertEquals(['refunded'], $ftStatuses);

        // UserPayment
        $this->assertEquals('refunded', UserPayment::where('from_user_id', $this->creator->id)->first()->status);
    }

    public function test_webhook_sync_propagates_disputed_to_all_tables(): void
    {
        $sessionId = 'cs_disp_' . Str::random(10);
        $piId = 'pi_disp_' . Str::random(10);

        Payment::create([
            'creator_id' => $this->creatorUuid,
            'amount' => 2000, 'currency' => 'gbp',
            'stripe_session_id' => $sessionId, 'stripe_payment_intent_id' => $piId,
            'status' => 'succeeded',
        ]);

        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalId, 'user_id' => null, 
            'session_id' => $sessionId, 'currency' => 'GBP', 'amount' => 20, 'tax' => 0, 'status' => 'paid',
        ]);

        $bill = Bills::create([
            'user_id' => $this->creator->id, 'name' => 'Bill', 'price' => 20,
            'currency' => 'GBP', 'period' => 'monthly', 'status' => 1,
        ]);
        $billPayment = BillPayment::create([
            'session_id' => $sessionId, 'bills_id' => $bill->id,
            'user_id' => $this->creator->id, 'currency' => 'GBP', 'amount' => 20, 'tax' => 3, 'status' => 'paid',
        ]);

        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => TipGoalsPayment::class, 'source_id' => $tip->id,
            'type' => 'income', 'gross_amount' => 20, 'net_amount' => 20, 'platform_fee' => 0, 'stripe_fee' => 0,
            'vat_amount' => 0, 'currency' => 'GBP', 'status' => 'completed', 'description' => 'Tip', 'transaction_date' => now(),
        ]);

        // Simulate dispute sync
        $controller = app(\App\Http\Controllers\StripeWebhookController::class);
        $method = new \ReflectionMethod($controller, 'syncFinancialTransactionsByPaymentIntent');
        $method->setAccessible(true);
        $method->invoke($controller, $piId, 'disputed');

        $this->assertEquals('disputed', $tip->fresh()->status);
        $this->assertEquals('disputed', $billPayment->fresh()->status);
        $this->assertEquals('disputed', FinancialTransaction::where('source_type', TipGoalsPayment::class)->where('source_id', $tip->id)->first()->status);
    }

    // =========================================================================
    // 5. RESERVE ONLY ON CONFIRMED PAYMENTS
    // =========================================================================

    public function test_payout_does_not_count_reserve_for_disputed_payments(): void
    {
        Carbon::setTestNow('2026-05-01 12:00:00');

        CreatorMetric::create([
            'creator_id' => $this->creatorUuid,
            'reserve_percent' => 10,
            'risk_level' => 'low',
        ]);

        // Succeeded payment with reserve
        $session1 = 'cs_good_' . Str::random(10);
        Payment::create([
            'creator_id' => $this->creatorUuid, 'amount' => 1000,
            'reserve_amount_minor' => 100, 'currency' => 'gbp',
            'stripe_session_id' => $session1, 'status' => 'succeeded',
        ]);
        $tip1 = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalId, 'user_id' => null, 
            'session_id' => $session1, 'currency' => 'GBP', 'amount' => 10, 'tax' => 0, 'status' => 'paid',
        ]);
        FinancialTransaction::create([
            'user_id' => $this->creator->id, 'source_type' => TipGoalsPayment::class, 'source_id' => $tip1->id,
            'type' => 'income', 'gross_amount' => 10, 'net_amount' => 10, 'platform_fee' => 0, 'stripe_fee' => 0,
            'vat_amount' => 0, 'reserve_amount' => 1.00, 'reserve_status' => 'held',
            'currency' => 'GBP', 'status' => 'completed', 'description' => 'Tip', 'transaction_date' => now(),
        ]);

        // Disputed payment — should NOT be in eligible payments
        $session2 = 'cs_disp2_' . Str::random(10);
        Payment::create([
            'creator_id' => $this->creatorUuid, 'amount' => 5000,
            'reserve_amount_minor' => 500, 'currency' => 'gbp',
            'stripe_session_id' => $session2,
            'stripe_payment_intent_id' => 'pi_disp2_' . Str::random(10),
            'status' => 'disputed',
        ]);

        $preview = app(PayoutService::class)->calculatePayouts();

        $this->assertArrayHasKey($this->creatorUuid, $preview['payouts']);
        $payout = $preview['payouts'][$this->creatorUuid];

        // Only the succeeded payment's reserve should be counted
        $this->assertEquals(100, $payout['reserve_amount']);
        // Disputed payment reserve (500) should NOT appear
        $this->assertNotEquals(600, $payout['reserve_amount']);
    }
}
