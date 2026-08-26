<?php

namespace Tests\Feature;

use App\Http\Controllers\StripeWebhookController;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\FulfilCartCheckout;
use App\Jobs\FulfilSubscriptionCheckout;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Deliverable;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\User;
use App\Models\UserCart;
use App\Models\WishItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Regression pins for the content→gifter→Stripe→mail flow audit (25 Aug 2026):
 *
 * - a wish CART checkout whose buyer never returns to the success URL now has
 *   webhook-driven fallback fulfilment (FulfilCartCheckout);
 * - a Bill/Membership first payment has the same (FulfilSubscriptionCheckout);
 * - the public /deliverable/access/{uuid} link no longer marks a PHYSICAL shop
 *   order 'delivered' just because the buyer opened their receipt email;
 * - a buyer's notification_send=0 no longer deletes the payment's Deliverables
 *   and the creator's sale email along with the buyer's own receipt.
 */
class PurchaseFlowGapFixesTest extends TestCase
{
    use RefreshDatabase;

    private function cartFixture(): array
    {
        $creator = User::factory()->create(['role' => 1]);
        $buyer = User::factory()->create(['role' => 0]);

        $wish = WishItem::factory()->create(['user_id' => $creator->id]);

        $cart = UserCart::create([
            'user_id' => $buyer->id,
            'owner_id' => $creator->id,
            'wish_item_id' => $wish->id,
            'amount' => 10,
            'quantity' => 1,
            'status' => 1,
        ]);

        $sessionId = 'cs_cartfix_'.Str::random(10);

        $detail = StripePaymentDetail::create([
            'session_id' => $sessionId,
            'user_id' => $buyer->id,
            'owner_id' => $creator->id,
            'currency' => 'GBP',
            'amount_subtotal' => 10,
            'amount_total' => 13,
            'metadata' => json_encode([
                'wish_items' => [[
                    'wish_id' => $wish->id,
                    'wish_name' => $wish->wishname,
                    'quantity' => 1,
                    'amount' => 10,
                    'cart_id' => $cart->id,
                ]],
            ]),
        ]);

        return [$detail, $cart, $wish, $creator, $buyer];
    }

    public function test_the_cart_fallback_fulfils_an_unclaimed_session(): void
    {
        Queue::fake();

        [$detail, $cart, $wish] = $this->cartFixture();

        (new FulfilCartCheckout($detail->session_id))->handle();

        $this->assertDatabaseHas('stripe_payment_items', [
            'stripe_payment_detail_id' => $detail->id,
            'wish_item_id' => $wish->id,
        ]);

        $this->assertSame('paid', $detail->fresh()->payment_status);
        $this->assertEquals(0, $cart->fresh()->status, 'The cart row must be spent, exactly as the redirect does.');

        Queue::assertPushed(CheckoutMailToUser::class);
    }

    public function test_the_cart_fallback_defers_to_a_redirect_that_already_claimed(): void
    {
        Queue::fake();

        [$detail, $cart, $wish] = $this->cartFixture();
        $detail->update(['payment_status' => 'paid']);

        (new FulfilCartCheckout($detail->session_id))->handle();

        $this->assertDatabaseMissing('stripe_payment_items', [
            'stripe_payment_detail_id' => $detail->id,
        ]);
        Queue::assertNotPushed(CheckoutMailToUser::class);
    }

    public function test_a_cart_session_event_queues_the_delayed_fallback(): void
    {
        Queue::fake();

        [$detail] = $this->cartFixture();

        $session = (object) [
            'id' => $detail->session_id,
            'payment_status' => 'paid',
            'payment_intent' => null,
            'metadata' => (object) ['type' => 'cart'],
        ];

        app(StripeWebhookController::class)->handleCheckoutSessionCompleted($session, $session->metadata);

        Queue::assertPushed(FulfilCartCheckout::class, fn ($job) => $job->sessionId === $detail->session_id);
    }

    public function test_an_initiated_bill_session_queues_the_subscription_fallback(): void
    {
        Queue::fake();

        $creator = User::factory()->create(['role' => 1]);
        $bill = Bills::factory()->create(['user_id' => $creator->id]);

        $billPay = new BillPayment;
        $billPay->forceFill([
            'uuid' => (string) Str::uuid(),
            'bills_id' => $bill->id,
            'user_id' => User::factory()->create()->id,
            'session_id' => 'cs_billfix_'.Str::random(8),
            'status' => 'initiated',
            'amount' => 10,
            'currency' => 'GBP',
            'recurring_type' => 'monthly',
        ])->save();

        $session = (object) [
            'id' => $billPay->session_id,
            'payment_status' => 'paid',
            'payment_intent' => null,
            'metadata' => (object) [],
        ];

        app(StripeWebhookController::class)->handleCheckoutSessionCompleted($session, $session->metadata);

        Queue::assertPushed(FulfilSubscriptionCheckout::class, fn ($job) => $job->sessionId === $billPay->session_id);
    }

    public function test_a_paid_bill_session_does_not_queue_the_fallback(): void
    {
        Queue::fake();

        $creator = User::factory()->create(['role' => 1]);
        $bill = Bills::factory()->create(['user_id' => $creator->id]);

        $billPay = new BillPayment;
        $billPay->forceFill([
            'uuid' => (string) Str::uuid(),
            'bills_id' => $bill->id,
            'user_id' => User::factory()->create()->id,
            'session_id' => 'cs_billfix_'.Str::random(8),
            'status' => 'paid',
            'amount' => 10,
            'currency' => 'GBP',
            'recurring_type' => 'monthly',
        ])->save();

        $session = (object) [
            'id' => $billPay->session_id,
            'payment_status' => 'paid',
            'payment_intent' => null,
            'metadata' => (object) [],
        ];

        app(StripeWebhookController::class)->handleCheckoutSessionCompleted($session, $session->metadata);

        Queue::assertNotPushed(FulfilSubscriptionCheckout::class);
    }

    private function deliverable(array $overrides = []): Deliverable
    {
        $creator = User::factory()->create(['role' => 1]);
        $buyer = User::factory()->create(['role' => 0]);

        return Deliverable::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'product_id' => 'shop_test',
            'item_id' => 1,
            'creator_id' => $creator->id,
            'gifter_id' => $buyer->id,
            'session_id' => 'cs_access_'.Str::random(8),
            'deliverable_type' => 'digital_file',
            'product_type' => 'shop_item',
            'deliverable_url' => 'https://ucarecdn.com/'.Str::uuid().'/',
            'status' => 'pending',
        ], $overrides));
    }

    public function test_opening_the_access_link_does_not_deliver_a_physical_order(): void
    {
        $deliverable = $this->deliverable(['deliverable_type' => 'shipping']);

        $this->get(route('deliverable.access', $deliverable->uuid))->assertRedirect();

        $fresh = $deliverable->fresh();
        $this->assertSame('pending', $fresh->status, 'A parcel is delivered when the creator posts it, not when the buyer opens an email.');
        $this->assertNotNull($fresh->accessed_at);
        $this->assertSame(1, (int) $fresh->access_count);
    }

    public function test_opening_the_access_link_does_not_deliver_an_order_under_admin_review(): void
    {
        $deliverable = $this->deliverable(['needs_admin_review' => true]);

        $this->get(route('deliverable.access', $deliverable->uuid))->assertRedirect();

        $this->assertSame('pending', $deliverable->fresh()->status);
    }

    public function test_opening_the_access_link_still_delivers_a_pending_digital_handoff(): void
    {
        $deliverable = $this->deliverable();

        $this->get(route('deliverable.access', $deliverable->uuid))->assertRedirect();

        $fresh = $deliverable->fresh();
        $this->assertSame('delivered', $fresh->status);
        $this->assertNotNull($fresh->delivered_at);
    }

    public function test_a_buyers_mail_preference_does_not_suppress_the_deliverable(): void
    {
        Mail::fake();
        Queue::fake();

        [$detail, $cart, $wish, $creator, $buyer] = $this->cartFixture();

        $buyer->forceFill(['notification_send' => 0])->save();
        $detail->update(['payment_status' => 'paid']);

        StripePaymentItems::create([
            'uuid' => (string) Str::uuid(),
            'stripe_payment_detail_id' => $detail->id,
            'wish_item_id' => $wish->id,
            'user_cart_id' => $cart->id,
            'amount' => 10,
            'quantity' => 1,
        ]);

        (new CheckoutMailToUser($detail->fresh(), '£'))->handle();

        $this->assertDatabaseHas('deliverables', [
            'session_id' => $detail->session_id,
            'item_id' => $wish->id,
            'product_type' => 'wish',
        ]);
    }
}
