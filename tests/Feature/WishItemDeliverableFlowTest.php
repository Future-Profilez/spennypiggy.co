<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\WishItem;
use App\Models\Deliverable;
use App\Jobs\ProcessWishItemDeliverable;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Http\Request;

class WishItemDeliverableFlowTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $creator;
    protected $wishItem;
    protected $webhookController;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake the queue to test job dispatching
        Queue::fake();
        
        // Create test data
        $this->createTestData();
        
        $this->webhookController = new StripeWebhookController();
    }

    private function createTestData()
    {
        // Create a creator user
        $this->creator = User::factory()->create([
            'name' => 'Test Creator',
            'username' => 'testcreator',
            'email' => 'creator@example.com',
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'is_uk' => 0,
            'role' => 1
        ]);

        // Create a wish item
        $this->wishItem = WishItem::factory()->create([
            'user_id' => $this->creator->id,
            'wishname' => 'Test Wish Item',
            'price' => 25.00,
            'currency' => 'USD',
            'is_approved' => 1
        ]);
    }

    /** @test */
    public function it_creates_deliverable_on_checkout_session_completed()
    {
        // Mock checkout session data
        $checkoutSessionData = (object) [
            'id' => 'cs_test_123456789',
            'payment_status' => 'paid',
            'amount_total' => 2500, // $25.00 in cents
            'currency' => 'usd',
            'customer_email' => 'buyer@example.com',
            'metadata' => (object) [
                'creator_id' => $this->creator->id,
                'wish_id' => $this->wishItem->id,
                'deliverable_type' => 'media_bundle',
                'certificate' => 'true',
                'product_type' => 'wish_item'
            ]
        ];

        $metadata = $checkoutSessionData->metadata;

        // Call the webhook handler method directly
        $this->webhookController->handleCheckoutSessionCompleted($checkoutSessionData, $metadata);

        // Assert deliverable was created
        $this->assertDatabaseHas('deliverables', [
            'wish_item_id' => $this->wishItem->id,
            'creator_id' => $this->creator->id,
            'buyer_email' => 'buyer@example.com',
            'type' => 'media_bundle',
            'status' => 'pending',
            'session_id' => 'cs_test_123456'
        ]);

        // Assert job was dispatched
        Queue::assertPushed(ProcessWishItemDeliverable::class, function ($job) {
            return $job->deliverable->wish_item_id === $this->wishItem->id;
        });
    }

    /** @test */
    public function it_handles_different_deliverable_types()
    {
        $deliverableTypes = ['media_bundle', 'digital_file', 'pdf_receipt', 'cert'];

        foreach ($deliverableTypes as $type) {
            $checkoutSessionData = (object) [
                'id' => 'cs_test_' . $type,
                'payment_status' => 'paid',
                'amount_total' => 2500,
                'currency' => 'usd',
                'customer_email' => 'buyer@example.com',
                'metadata' => (object) [
                    'creator_id' => $this->creator->id,
                    'wish_id' => $this->wishItem->id,
                    'deliverable_type' => $type,
                    'certificate' => 'false',
                    'product_type' => 'wish_item'
                ]
            ];

            $this->webhookController->handleCheckoutSessionCompleted(
                $checkoutSessionData, 
                $checkoutSessionData->metadata
            );

            $this->assertDatabaseHas('deliverables', [
                'wish_item_id' => $this->wishItem->id,
                'type' => $type,
                'session_id' => 'cs_test_' . $type
            ]);
        }
    }

    /** @test */
    public function it_handles_certificate_generation_flag()
    {
        $checkoutSessionData = (object) [
            'id' => 'cs_test_with_cert',
            'payment_status' => 'paid',
            'amount_total' => 2500,
            'currency' => 'usd',
            'customer_email' => 'buyer@example.com',
            'metadata' => (object) [
                'creator_id' => $this->creator->id,
                'wish_id' => $this->wishItem->id,
                'deliverable_type' => 'media_bundle',
                'certificate' => 'true',
                'product_type' => 'wish_item'
            ]
        ];

        $this->webhookController->handleCheckoutSessionCompleted(
            $checkoutSessionData, 
            $checkoutSessionData->metadata
        );

        $deliverable = Deliverable::where('session_id', 'cs_test_with_cert')->first();
        
        $this->assertNotNull($deliverable);
        $this->assertTrue($deliverable->generate_certificate);
    }

    /** @test */
    public function it_logs_missing_metadata_gracefully()
    {
        Log::shouldReceive('error')
            ->once()
            ->with('Missing required metadata for deliverable creation', \Mockery::any());

        $checkoutSessionData = (object) [
            'id' => 'cs_test_missing_metadata',
            'payment_status' => 'paid',
            'amount_total' => 2500,
            'currency' => 'usd',
            'customer_email' => 'buyer@example.com',
            'metadata' => (object) [
                // Missing required fields
                'product_type' => 'wish_item'
            ]
        ];

        $this->webhookController->handleCheckoutSessionCompleted(
            $checkoutSessionData, 
            $checkoutSessionData->metadata
        );

        // Should not create deliverable with missing metadata
        $this->assertDatabaseMissing('deliverables', [
            'session_id' => 'cs_test_missing_metadata'
        ]);
    }

    /** @test */
    public function it_validates_deliverable_model_constants()
    {
        // Test available statuses
        $expectedStatuses = ['pending', 'delivered', 'failed'];
        $this->assertEquals($expectedStatuses, Deliverable::STATUSES);

        // Test available types
        $expectedTypes = [
            'digital_file', 
            'pdf_receipt', 
            'badge', 
            'cert', 
            'access', 
            'post', 
            'media_bundle'
        ];
        $this->assertEquals($expectedTypes, Deliverable::TYPES);
    }

    /** @test */
    public function it_creates_deliverable_with_correct_attributes()
    {
        $checkoutSessionData = (object) [
            'id' => 'cs_test_attributes',
            'payment_status' => 'paid',
            'amount_total' => 5000, // $50.00
            'currency' => 'gbp',
            'customer_email' => 'test@example.com',
            'metadata' => (object) [
                'creator_id' => $this->creator->id,
                'wish_id' => $this->wishItem->id,
                'deliverable_type' => 'digital_file',
                'certificate' => 'false',
                'product_type' => 'wish_item'
            ]
        ];

        $this->webhookController->handleCheckoutSessionCompleted(
            $checkoutSessionData, 
            $checkoutSessionData->metadata
        );

        $deliverable = Deliverable::where('session_id', 'cs_test_attributes')->first();

        $this->assertNotNull($deliverable);
        $this->assertEquals($this->wishItem->id, $deliverable->wish_item_id);
        $this->assertEquals($this->creator->id, $deliverable->creator_id);
        $this->assertEquals('test@example.com', $deliverable->buyer_email);
        $this->assertEquals('digital_file', $deliverable->type);
        $this->assertEquals('pending', $deliverable->status);
        $this->assertEquals(50.00, $deliverable->amount);
        $this->assertEquals('GBP', $deliverable->currency);
        $this->assertFalse($deliverable->generate_certificate);
        $this->assertEquals('cs_test_attributes', $deliverable->session_id);
    }

    /** @test */
    public function it_handles_subscription_deliverables()
    {
        $checkoutSessionData = (object) [
            'id' => 'cs_test_subscription',
            'payment_status' => 'paid',
            'amount_total' => 1000, // $10.00
            'currency' => 'usd',
            'customer_email' => 'subscriber@example.com',
            'metadata' => (object) [
                'creator_id' => $this->creator->id,
                'wish_id' => $this->wishItem->id,
                'deliverable_type' => 'access',
                'certificate' => 'false',
                'product_type' => 'wish_item_subscription'
            ]
        ];

        $this->webhookController->handleCheckoutSessionCompleted(
            $checkoutSessionData, 
            $checkoutSessionData->metadata
        );

        $this->assertDatabaseHas('deliverables', [
            'wish_item_id' => $this->wishItem->id,
            'type' => 'access',
            'buyer_email' => 'subscriber@example.com',
            'session_id' => 'cs_test_subscription'
        ]);

        // Verify job was dispatched for subscription content
        Queue::assertPushed(ProcessWishItemDeliverable::class);
    }

    /** @test */
    public function deliverable_model_relationships_work_correctly()
    {
        // Create a deliverable
        $deliverable = Deliverable::create([
            'wish_item_id' => $this->wishItem->id,
            'creator_id' => $this->creator->id,
            'buyer_email' => 'test@example.com',
            'type' => 'media_bundle',
            'status' => 'pending',
            'amount' => 25.00,
            'currency' => 'USD',
            'generate_certificate' => true,
            'session_id' => 'cs_test_relationships'
        ]);

        // Test relationships
        $this->assertEquals($this->wishItem->id, $deliverable->wishItem->id);
        $this->assertEquals($this->creator->id, $deliverable->creator->id);
        $this->assertEquals('Test Wish Item', $deliverable->wishItem->wishname);
        $this->assertEquals('Test Creator', $deliverable->creator->name);
    }
}