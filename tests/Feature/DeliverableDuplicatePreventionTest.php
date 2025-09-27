<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Queue;
use App\Models\User;
use App\Models\WishItem;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Deliverable;
use App\Jobs\CheckoutMailToUser;
use App\Http\Controllers\StripeWebhookController;

class DeliverableDuplicatePreventionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $creator;
    protected $buyer;
    protected $wishItem;
    protected $payment;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake the queue
        Queue::fake();
        
        // Create test data
        $this->createTestData();
    }

    private function createTestData()
    {
        // Create a creator user
        $this->creator = User::factory()->create([
            'name' => 'Test Creator',
            'username' => 'testcreator',
            'email' => 'creator@example.com',
            'is_uk' => 0,
            'role' => 1
        ]);

        // Create a buyer user
        $this->buyer = User::factory()->create([
            'name' => 'Test Buyer',
            'username' => 'testbuyer',
            'email' => 'buyer@example.com',
            'is_uk' => 0,
            'role' => 0
        ]);

        // Create a wish item
        $this->wishItem = WishItem::factory()->create([
            'user_id' => $this->creator->id,
            'wishname' => 'Test Wish Item',
            'price' => 25.00,
            'currency' => 'USD',
            'is_approved' => 1,
            'content_file' => 'abc-123-uuid',
            'content_file_type' => 'application/pdf'
        ]);

        // Create a payment record
        $this->payment = StripePaymentDetail::create([
            'session_id' => 'cs_test_duplicate_prevention',
            'amount_subtotal' => 25.00,
            'amount_total' => 25.00,
            'currency' => 'usd',
            'user_id' => $this->buyer->id,
            'owner_id' => $this->creator->id,
            'payment_status' => 'paid'
        ]);

        // Create payment item
        StripePaymentItems::create([
            'stripe_payment_detail_id' => $this->payment->id,
            'wish_item_id' => $this->wishItem->id,
            'amount' => 25.00,
            'quantity' => 1
        ]);
    }

    /** @test */
    public function it_prevents_duplicate_deliverables_from_checkout_job()
    {
        $currencySymbol = '$';
        
        // First execution of CheckoutMailToUser job
        $job1 = new CheckoutMailToUser($this->payment, $currencySymbol);
        $job1->handle();

        // Verify first deliverable was created
        $firstDeliverable = Deliverable::where('session_id', $this->payment->session_id)
            ->where('product_id', (string) $this->wishItem->id)
            ->first();
        
        $this->assertNotNull($firstDeliverable, 'First deliverable should be created');

        // Second execution of the same job (simulating race condition)
        $job2 = new CheckoutMailToUser($this->payment, $currencySymbol);
        $job2->handle();

        // Verify only one deliverable exists
        $deliverables = Deliverable::where('session_id', $this->payment->session_id)
            ->where('product_id', (string) $this->wishItem->id)
            ->get();

        $this->assertCount(1, $deliverables, 'Should only have 1 deliverable, not duplicates');
        $this->assertEquals($firstDeliverable->id, $deliverables->first()->id, 'Should be the same deliverable');
    }

    /** @test */
    public function it_prevents_duplicate_deliverables_from_webhook_controller()
    {
        // Create a deliverable first (simulating CheckoutMailToUser job creating it)
        $existingDeliverable = Deliverable::create([
            'uuid' => \Str::uuid(),
            'product_id' => (string) $this->wishItem->id,
            'item_id' => $this->wishItem->id,
            'creator_id' => $this->creator->id,
            'gifter_id' => $this->buyer->id,
            'session_id' => $this->payment->session_id,
            'deliverable_type' => 'digital_file',
            'product_type' => 'wish',
            'transaction_amount' => 25.00,
            'status' => 'delivered'
        ]);

        // Mock webhook session data
        $sessionData = (object) [
            'id' => $this->payment->session_id,
            'payment_status' => 'paid',
            'amount_total' => 2500, // $25.00 in cents
            'currency' => 'usd',
            'customer_details' => (object) [
                'email' => 'buyer@example.com'
            ]
        ];

        // Mock metadata
        $metadata = (object) [
            'creator_id' => $this->creator->id,
            'wish_id' => $this->wishItem->id,
            'user_id' => $this->buyer->id,
            'deliverable_type' => 'media_bundle',
            'certificate' => 'true',
            'product_type' => 'wish_item'
        ];

        $webhookController = new StripeWebhookController();
        $webhookController->handleCheckoutSessionCompleted($sessionData, $metadata);

        // Verify no duplicate was created
        $deliverables = Deliverable::where('session_id', $this->payment->session_id)
            ->where('product_id', (string) $this->wishItem->id)
            ->get();

        $this->assertCount(1, $deliverables, 'Webhook should not create duplicate deliverable');
        $this->assertEquals($existingDeliverable->id, $deliverables->first()->id, 'Should be the original deliverable');
    }

    /** @test */
    public function it_allows_deliverables_for_different_sessions()
    {
        // Create second payment with different session
        $payment2 = StripePaymentDetail::create([
            'session_id' => 'cs_test_different_session',
            'amount_subtotal' => 25.00,
            'amount_total' => 25.00,
            'currency' => 'usd',
            'user_id' => $this->buyer->id,
            'owner_id' => $this->creator->id,
            'payment_status' => 'paid'
        ]);

        StripePaymentItems::create([
            'stripe_payment_detail_id' => $payment2->id,
            'wish_item_id' => $this->wishItem->id,
            'amount' => 25.00,
            'quantity' => 1
        ]);

        // Create deliverables for both payments
        $job1 = new CheckoutMailToUser($this->payment, '$');
        $job1->handle();

        $job2 = new CheckoutMailToUser($payment2, '$');
        $job2->handle();

        // Verify both deliverables exist
        $deliverables = Deliverable::where('product_id', (string) $this->wishItem->id)->get();

        $this->assertCount(2, $deliverables, 'Should have 2 deliverables for different sessions');

        $sessionIds = $deliverables->pluck('session_id')->toArray();
        $this->assertContains($this->payment->session_id, $sessionIds);
        $this->assertContains($payment2->session_id, $sessionIds);
    }

    /** @test */
    public function it_allows_deliverables_for_different_wish_items()
    {
        // Create second wish item
        $wishItem2 = WishItem::factory()->create([
            'user_id' => $this->creator->id,
            'wishname' => 'Test Wish Item 2',
            'price' => 30.00,
            'currency' => 'USD',
            'is_approved' => 1
        ]);

        // Create payment items for both wishes in the same session
        StripePaymentItems::create([
            'stripe_payment_detail_id' => $this->payment->id,
            'wish_item_id' => $wishItem2->id,
            'amount' => 30.00,
            'quantity' => 1
        ]);

        // Process the payment
        $job = new CheckoutMailToUser($this->payment, '$');
        $job->handle();

        // Verify deliverables for both wish items exist
        $deliverables = Deliverable::where('session_id', $this->payment->session_id)->get();

        $this->assertCount(2, $deliverables, 'Should have 2 deliverables for different wish items');

        $productIds = $deliverables->pluck('product_id')->toArray();
        $this->assertContains((string) $this->wishItem->id, $productIds);
        $this->assertContains((string) $wishItem2->id, $productIds);
    }
}