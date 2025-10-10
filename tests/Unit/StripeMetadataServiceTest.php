<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\StripeMetadataService;
use App\Models\Deliverable;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StripeMetadataServiceTest extends TestCase
{
    use RefreshDatabase;

    private StripeMetadataService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new StripeMetadataService();
    }

    /** @test */
    public function support_payment_without_certificate_excludes_delivery_fields()
    {
        // Create deliverable without certificate
        $deliverable = new Deliverable([
            'id' => 1,
            'uuid' => 'test-uuid',
            'product_type' => 'support_payment',
            'status' => 'delivered',
            'certificate_url' => null, // No certificate
            'payment_intent_id' => 'pi_test123',
            'transaction_amount' => 10.00,
            'payment_currency' => 'GBP',
            'metadata' => json_encode(['test' => 'data'])
        ]);

        // Test isSupportPaymentWithCertificate method via reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('isSupportPaymentWithCertificate');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, $deliverable);
        
        $this->assertFalse($result, 'Support payment without certificate should return false');
    }

    /** @test */
    public function support_payment_with_certificate_includes_delivery_fields()
    {
        // Create deliverable with certificate
        $deliverable = new Deliverable([
            'id' => 1,
            'uuid' => 'test-uuid',
            'product_type' => 'support_payment',
            'status' => 'delivered',
            'certificate_url' => 'https://ucarecdn.com/test-cert-url/', // Has certificate
            'payment_intent_id' => 'pi_test123',
            'transaction_amount' => 10.00,
            'payment_currency' => 'GBP',
            'metadata' => json_encode(['test' => 'data'])
        ]);

        // Test isSupportPaymentWithCertificate method via reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('isSupportPaymentWithCertificate');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, $deliverable);
        
        $this->assertTrue($result, 'Support payment with certificate should return true');
    }

    /** @test */
    public function regular_payment_types_not_affected_by_support_payment_logic()
    {
        $deliverable = new Deliverable([
            'id' => 1,
            'uuid' => 'test-uuid',
            'product_type' => 'wish', // Not a support payment
            'status' => 'delivered',
            'certificate_url' => 'https://ucarecdn.com/test-cert-url/',
            'payment_intent_id' => 'pi_test123',
            'transaction_amount' => 25.00,
            'payment_currency' => 'GBP',
            'metadata' => json_encode(['test' => 'data'])
        ]);

        // Test isSupportPaymentWithCertificate method via reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('isSupportPaymentWithCertificate');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, $deliverable);
        
        $this->assertFalse($result, 'Non-support payment should return false for support payment check');
    }

    /** @test */
    public function support_payment_with_certificate_builds_correct_product_metadata()
    {
        $deliverable = new Deliverable([
            'id' => 1,
            'uuid' => 'test-uuid',
            'product_type' => 'support_payment',
            'status' => 'delivered',
            'certificate_url' => 'https://ucarecdn.com/test-cert-url/',
            'deliverable_url' => 'https://ucarecdn.com/test-cert-url/',
            'payment_intent_id' => 'pi_test123',
            'transaction_amount' => 10.00,
            'payment_currency' => 'GBP',
            'deliverable_type' => 'access',
            'metadata' => json_encode(['test' => 'data'])
        ]);

        // Test buildProductSpecificMetadata method via reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('buildProductSpecificMetadata');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, $deliverable);

        // Verify support payment metadata structure
        $this->assertEquals('support_payment', $result['product_type']);
        $this->assertEquals('true', $result['support_payment']);
        $this->assertEquals('tip_donation', $result['payment_type']);
        
        // Verify certificate fields are included for support payments with certificates
        $this->assertArrayHasKey('certificate_url', $result);
        $this->assertEquals('https://ucarecdn.com/test-cert-url/', $result['certificate_url']);
        $this->assertArrayHasKey('certificate_id', $result);
        $this->assertEquals('test-uuid', $result['certificate_id']);
        $this->assertEquals('completed', $result['delivery_status']);
        $this->assertEquals('test-uuid', $result['deliverable_uuid']);

        // Verify content delivery fields are included
        $this->assertEquals('true', $result['content_available']);
        $this->assertEquals('https://ucarecdn.com/test-cert-url/', $result['content_delivery_url']);
    }

    /** @test */
    public function support_payment_without_certificate_excludes_certificate_fields()
    {
        $deliverable = new Deliverable([
            'id' => 1,
            'uuid' => 'test-uuid',
            'product_type' => 'support_payment',
            'status' => 'pending', // Not delivered yet
            'certificate_url' => null, // No certificate
            'payment_intent_id' => 'pi_test123',
            'transaction_amount' => 10.00,
            'payment_currency' => 'GBP',
            'deliverable_type' => 'access',
            'metadata' => json_encode(['test' => 'data'])
        ]);

        // Test buildProductSpecificMetadata method via reflection
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('buildProductSpecificMetadata');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, $deliverable);

        // Verify basic support payment metadata
        $this->assertEquals('support_payment', $result['product_type']);
        $this->assertEquals('true', $result['support_payment']);
        $this->assertEquals('tip_donation', $result['payment_type']);
        
        // Verify certificate fields are NOT included
        $this->assertArrayNotHasKey('certificate_url', $result);
        $this->assertArrayNotHasKey('certificate_id', $result);
        $this->assertArrayNotHasKey('delivery_status', $result);
        $this->assertArrayNotHasKey('deliverable_uuid', $result);

        // Verify content delivery fields are NOT included
        $this->assertArrayNotHasKey('content_available', $result);
        $this->assertArrayNotHasKey('content_delivery_url', $result);
    }
}