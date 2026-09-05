<?php

namespace Tests\Feature;

use App\Http\Controllers\StripeWebhookController;
use App\Models\BlockedPayment;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\User;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Services\PaymentTierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use ReflectionMethod;
use Tests\TestCase;

class PayByBankAsyncFailureTest extends TestCase
{
    use RefreshDatabase;

    private User $creator;
    private User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->creator = User::factory()->create([
            'default_currency' => 'GBP',
            'account_id' => 'acct_test_creator_bank',
        ]);

        $this->buyer = User::factory()->create([
            'default_currency' => 'GBP',
            'email' => 'bankbuyer@example.com',
        ]);
    }

    /**
     * When instant fulfilment is on, a Pay by Bank checkout creates paid deliverables
     * and a completed FinancialTransaction on redirect.
     * When the bank settlement fails days later (checkout.session.async_payment_failed),
     * the ShopPayment, Deliverable, and FinancialTransaction must be demoted to 'failed',
     * and a BlockedPayment must be recorded to flag the buyer on future risk checks.
     */
    public function test_async_payment_failed_demotes_instantly_fulfilled_shop_payment(): void
    {
        $sessionId = 'cs_bank_shop_'.Str::random(10);
        $piId = 'pi_bank_shop_'.Str::random(10);

        $shopId = DB::table('shops')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->creator->id,
            'name' => 'Bank Test Shop',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $shopPayment = ShopPayment::create([
            'session_id' => $sessionId,
            'user_id' => $this->buyer->id,
            'amount' => 50.00,
            'currency' => 'GBP',
            'shop_id' => $shopId,
            'payment_status' => 'paid', // Instant fulfilment marked it paid
        ]);

        $deliverable = Deliverable::create([
            'uuid' => Str::uuid(),
            'product_id' => 'shop_item_1',
            'creator_id' => $this->creator->id,
            'gifter_id' => $this->buyer->id,
            'session_id' => $sessionId,
            'payment_intent_id' => $piId,
            'deliverable_type' => 'digital_file',
            'product_type' => 'shop',
            'status' => 'delivered',
            'payment_status' => 'paid',
            'payment_currency' => 'GBP',
        ]);

        $ft = FinancialTransaction::create([
            'user_id' => $this->creator->id,
            'source_type' => ShopPayment::class,
            'source_id' => $shopPayment->id,
            'type' => 'income',
            'gross_amount' => 50,
            'net_amount' => 45,
            'platform_fee' => 5,
            'stripe_fee' => 0.30,
            'vat_amount' => 0,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'Shop purchase via bank',
            'transaction_date' => now(),
        ]);

        $session = (object) [
            'id' => $sessionId,
            'payment_intent' => $piId,
            'amount_total' => 5000,
            'currency' => 'gbp',
            'customer_details' => (object) [
                'email' => $this->buyer->email,
                'name' => 'Bank Buyer',
            ],
            'metadata' => (object) [
                'creator_id' => $this->creator->id,
                'fee_profile' => 'bank',
            ],
        ];

        // Trigger async_payment_failed handling
        $controller = app(StripeWebhookController::class);
        $method = new ReflectionMethod($controller, 'handleAsyncPaymentFailed');
        $method->setAccessible(true);
        $method->invoke($controller, $session);

        // Verify ShopPayment is now failed
        $this->assertEquals('failed', $shopPayment->fresh()->payment_status);

        // Verify Deliverable is marked failed
        $this->assertEquals('failed', $deliverable->fresh()->status);
        $this->assertEquals('failed', $deliverable->fresh()->payment_status);

        // Verify FinancialTransaction is failed so creator does not retain unearned balance
        $this->assertEquals('failed', $ft->fresh()->status);

        // Verify BlockedPayment was created
        $blocked = BlockedPayment::where('payer_id', $this->buyer->id)->first();
        $this->assertNotNull($blocked);
        $this->assertEquals('bank_settlement_failed', $blocked->blocked_reason);
        $this->assertEquals('bank', $blocked->payment_method);

        // Verify buyer risk check trips
        $this->assertFalse(PaymentTierService::passesBuyerRiskChecks($this->buyer));
    }

    /**
     * Verify StripePaymentDetail and WishItemSubscription are demoted to failed
     * on async payment failure.
     */
    public function test_async_payment_failed_demotes_cart_and_wish_subscription(): void
    {
        $sessionId = 'cs_bank_cart_'.Str::random(10);
        $piId = 'pi_bank_cart_'.Str::random(10);

        $spd = StripePaymentDetail::create([
            'session_id' => $sessionId,
            'stripe_payment_intent_id' => $piId,
            'amount_subtotal' => 30,
            'amount_total' => 35,
            'currency' => 'gbp',
            'owner_id' => $this->creator->id,
            'user_id' => $this->buyer->id,
            'payment_status' => 'paid',
        ]);

        $ftCart = FinancialTransaction::create([
            'user_id' => $this->creator->id,
            'source_type' => StripePaymentDetail::class,
            'source_id' => $spd->id,
            'type' => 'income',
            'gross_amount' => 35,
            'net_amount' => 30,
            'platform_fee' => 5,
            'stripe_fee' => 0.30,
            'vat_amount' => 0,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'Cart purchase via bank',
            'transaction_date' => now(),
        ]);

        $wishSessionId = 'cs_bank_wish_'.Str::random(10);
        $wishPiId = 'pi_bank_wish_'.Str::random(10);

        $wishItem = WishItem::create([
            'user_id' => $this->creator->id,
            'wishname' => 'Test Wish',
            'price' => 25,
            'currency' => 'GBP',
            'subscription' => 0,
        ]);

        $wishSub = WishItemSubscription::create([
            'session_id' => $wishSessionId,
            'wish_item_id' => $wishItem->id,
            'user_id' => $this->buyer->id,
            'amount' => 25,
            'tax' => 3,
            'total_paid' => 28,
            'currency' => 'GBP',
            'status' => 'paid',
        ]);

        $ftWish = FinancialTransaction::create([
            'user_id' => $this->creator->id,
            'source_type' => WishItemSubscription::class,
            'source_id' => $wishSub->id,
            'type' => 'income',
            'gross_amount' => 28,
            'net_amount' => 25,
            'platform_fee' => 3,
            'stripe_fee' => 0.30,
            'vat_amount' => 0,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'Wish via bank',
            'transaction_date' => now(),
        ]);

        $controller = app(StripeWebhookController::class);
        $method = new ReflectionMethod($controller, 'handleAsyncPaymentFailed');
        $method->setAccessible(true);

        // Fail cart session
        $method->invoke($controller, (object) [
            'id' => $sessionId,
            'payment_intent' => $piId,
            'amount_total' => 3500,
            'currency' => 'gbp',
            'metadata' => (object) ['creator_id' => $this->creator->id],
        ]);

        $this->assertEquals('failed', $spd->fresh()->payment_status);
        $this->assertEquals('failed', $ftCart->fresh()->status);

        // Fail wish session
        $method->invoke($controller, (object) [
            'id' => $wishSessionId,
            'payment_intent' => $wishPiId,
            'amount_total' => 2800,
            'currency' => 'gbp',
            'metadata' => (object) ['creator_id' => $this->creator->id],
        ]);

        $this->assertEquals('failed', $wishSub->fresh()->status);
        $this->assertEquals('failed', $ftWish->fresh()->status);
    }

    /**
     * Verify guest email from bounced bank payment is blocked on subsequent risk checks.
     */
    public function test_passes_buyer_risk_checks_blocks_guest_email_after_failed_settlement(): void
    {
        $guestEmail = 'bounced_guest@example.com';

        BlockedPayment::logBlockedPayment([
            'creator_id' => $this->creator->id,
            'payer_id' => null,
            'amount' => 40.00,
            'currency' => 'GBP',
            'payment_type' => 'shop',
            'payment_method' => 'bank',
            'blocked_reason' => 'bank_settlement_failed',
            'payer_info' => ['email' => $guestEmail],
        ]);

        $this->assertFalse(PaymentTierService::passesBuyerRiskChecks(null, $guestEmail));
        $this->assertTrue(PaymentTierService::passesBuyerRiskChecks(null, 'clean_guest@example.com'));
    }
}
