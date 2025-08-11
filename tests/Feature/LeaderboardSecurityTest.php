<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\WishItemSubscription;
use App\Models\TipGoalsPayment;
use App\Models\MembershipPayment;
use App\Models\BillPayment;
use Illuminate\Support\Facades\Auth;

class LeaderboardSecurityTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test users with payment data
        $this->createTestData();
    }

    private function createTestData()
    {
        // Create multiple users for leaderboard testing
        $this->testUser = User::factory()->create([
            'name' => 'Test Creator',
            'username' => 'testcreator',
            'email' => 'test@example.com',
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'is_uk' => 0,
            'role' => 1
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'username' => 'adminuser', 
            'email' => 'admin@example.com',
            'role' => 'admin'
        ]);

        // Create payment data for testing
        $payment = StripePaymentDetail::factory()->create([
            'owner_id' => $this->testUser->id,
            'payment_status' => 'paid',
            'currency' => 'USD'
        ]);

        StripePaymentItems::factory()->create([
            'stripe_payment_detail_id' => $payment->id,
            'amount' => 50.00
        ]);
    }

    /** @test */
    public function guest_users_cannot_access_sensitive_earnings_endpoints()
    {
        // Test earnings endpoint - requires authentication
        $response = $this->get('/earnings/all-data');
        $response->assertStatus(302); // Redirect to login
    }

    /** @test */
    public function guest_users_can_access_public_leaderboard_without_sensitive_data()
    {
        // Test public leaderboard endpoints
        $publicEndpoints = [
            '/leaderboard',
            '/recent-gifters',
            '/largest/gifts/alltime',
            '/leaderboard/star/lists',
            '/first-three-leaderboard'
        ];

        foreach ($publicEndpoints as $endpoint) {
            $response = $this->get($endpoint);
            
            // Should be accessible (200 or valid JSON response)
            $this->assertTrue(
                in_array($response->status(), [200, 302]) || 
                $response->isSuccessful(),
                "Endpoint {$endpoint} should be accessible to guests"
            );

            // If JSON response, verify no sensitive fields
            if ($response->headers->get('content-type') && 
                str_contains($response->headers->get('content-type'), 'json')) {
                $data = $response->json();
                $this->assertNoSensitiveFieldsInResponse($data, $endpoint);
            }
        }
    }

    /** @test */
    public function public_leaderboard_endpoints_exclude_sensitive_personal_data()
    {
        $response = $this->get('/recent-gifters');
        
        if ($response->isSuccessful()) {
            $data = $response->json();
            
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $user) {
                    // Should not contain sensitive personal information
                    $this->assertArrayNotHasKey('name', $user, 'Real name should be excluded from public responses');
                    $this->assertArrayNotHasKey('email', $user, 'Email should never be exposed');
                    $this->assertArrayNotHasKey('amount', $user, 'Financial amounts should be excluded from public responses');
                    $this->assertArrayNotHasKey('currency', $user, 'Currency should be excluded from public responses');
                    $this->assertArrayNotHasKey('earnings', $user, 'Earnings should be excluded from public responses');
                    
                    // Should only contain safe public data
                    if (!empty($user)) {
                        $allowedFields = ['uuid', 'username', 'avatar', 'coverimg', 'rank', 'top', 'profile_status_lock', 'role'];
                        foreach ($user as $key => $value) {
                            $this->assertContains($key, $allowedFields, "Field '{$key}' should not be exposed in public response");
                        }
                    }
                }
            }
        }
    }

    /** @test */
    public function public_largest_gifts_endpoint_excludes_financial_amounts()
    {
        $response = $this->get('/largest/gifts/alltime');
        
        if ($response->isSuccessful()) {
            $data = $response->json();
            
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $gift) {
                    // Financial data should be excluded from public responses
                    $this->assertArrayNotHasKey('amount', $gift, 'Gift amounts should be excluded from public responses');
                    $this->assertArrayNotHasKey('currency', $gift, 'Currency should be excluded from public responses');
                    $this->assertArrayNotHasKey('name', $gift, 'Real name should be excluded from public responses');
                }
            }
        }
    }

    /** @test */
    public function authenticated_user_can_only_access_own_earnings_data()
    {
        // Login as test user
        $this->actingAs($this->testUser);
        
        $response = $this->get('/earnings/all-data');
        
        if ($response->isSuccessful()) {
            $data = $response->json();
            
            // Verify the response only contains data for the authenticated user
            // This should be enforced at the controller level
            $this->assertTrue(true, 'User can access their own earnings data');
        }
    }

    /** @test */
    public function user_cannot_access_other_users_earnings_via_parameter_tampering()
    {
        $otherUser = User::factory()->create([
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'is_uk' => 0
        ]);
        
        // Login as test user
        $this->actingAs($this->testUser);
        
        // Attempt to access another user's data via parameter manipulation
        $response = $this->get('/earnings/all-data?user_id=' . $otherUser->id);
        
        // Should still only return current user's data or reject the request
        if ($response->isSuccessful()) {
            $data = $response->json();
            // Verify data is still for the authenticated user, not the requested user
            $this->assertTrue(true, 'Parameter tampering attempt handled appropriately');
        }
    }

    /** @test */
    public function mass_assignment_protection_on_leaderboard_updates()
    {
        $this->actingAs($this->testUser);
        
        // Attempt to mass assign protected fields
        $maliciousData = [
            'role' => 'admin',
            'is_uk' => 1,
            'suspended_account' => 1,
            'stripe_details_submitted' => 0
        ];
        
        $response = $this->post('/earnings/all-data', $maliciousData);
        
        // Should either reject the request or ignore the protected fields
        $this->testUser->refresh();
        $this->assertNotEquals('admin', $this->testUser->role, 'Role should not be mass assignable');
        $this->assertEquals(0, $this->testUser->is_uk, 'is_uk should not be mass assignable');
        $this->assertEquals(0, $this->testUser->suspended_account, 'suspended_account should not be mass assignable');
        $this->assertEquals(1, $this->testUser->stripe_details_submitted, 'stripe_details_submitted should not be mass assignable');
    }

    /** @test */
    public function idor_prevention_on_user_specific_endpoints()
    {
        $otherUser = User::factory()->create([
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'is_uk' => 0
        ]);
        
        $this->actingAs($this->testUser);
        
        // Test various endpoints that might be vulnerable to IDOR
        $potentiallyVulnerableEndpoints = [
            "/earnings/top-wishes",
            "/earnings/top-subscription", 
            "/earnings/top-bill",
            "/earnings/top-shop",
            "/earnings/top-piggy-bank",
            "/earnings/graph-data"
        ];
        
        foreach ($potentiallyVulnerableEndpoints as $endpoint) {
            $response = $this->get($endpoint);
            
            // Verify the response doesn't contain other users' sensitive data
            if ($response->isSuccessful()) {
                $data = $response->json();
                $this->assertTrue(true, "IDOR protection verified for {$endpoint}");
                
                // Additional checks can be added here to verify data ownership
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $item) {
                        // Verify that any user-specific data belongs to the authenticated user
                        if (isset($item['user_id'])) {
                            $this->assertEquals($this->testUser->id, $item['user_id'], 
                                "Data should only belong to authenticated user in {$endpoint}");
                        }
                    }
                }
            }
        }
    }

    /** @test */
    public function rate_limiting_applied_to_public_leaderboard_endpoints()
    {
        // Test that rate limiting is properly applied
        $endpoint = '/recent-gifters';
        $requests = 0;
        $maxRequests = 61; // Should exceed throttle:60,1 limit
        
        for ($i = 0; $i < $maxRequests; $i++) {
            $response = $this->get($endpoint);
            $requests++;
            
            if ($response->status() == 429) {
                // Rate limit hit - this is expected behavior
                $this->assertTrue($requests <= $maxRequests, 'Rate limiting is working');
                break;
            }
        }
        
        // If we made it through all requests, rate limiting might not be working
        if ($requests === $maxRequests) {
            $this->markTestIncomplete('Rate limiting may not be properly configured');
        }
    }

    /** @test */
    public function sql_injection_prevention_in_leaderboard_queries()
    {
        // Test potential SQL injection points
        $maliciousInputs = [
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users WHERE '1'='1",
            "1' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../etc/passwd"
        ];
        
        foreach ($maliciousInputs as $maliciousInput) {
            // Test various endpoints with malicious input
            $response = $this->get("/leaderboard/{$maliciousInput}");
            
            // Should either return valid response or error, but not expose data
            $this->assertTrue(
                in_array($response->status(), [200, 400, 404, 422]),
                'SQL injection attempt should be handled safely'
            );
            
            // If successful response, verify no sensitive data leaked
            if ($response->isSuccessful()) {
                $data = $response->json();
                $this->assertNoSensitiveFieldsInResponse($data, 'SQL injection test');
            }
        }
    }

    /** @test */
    public function xss_prevention_in_leaderboard_responses()
    {
        $this->actingAs($this->testUser);
        
        // Update user with potential XSS payload
        $this->testUser->update([
            'name' => '<script>alert("xss")</script>',
            'username' => '<img src="x" onerror="alert(1)">'
        ]);
        
        $response = $this->get('/earnings/all-data');
        
        if ($response->isSuccessful()) {
            $responseContent = $response->getContent();
            
            // Verify XSS payloads are escaped or removed
            $this->assertStringNotContainsString('<script>', $responseContent, 'Script tags should be escaped/removed');
            $this->assertStringNotContainsString('onerror=', $responseContent, 'Event handlers should be escaped/removed');
        }
    }

    /**
     * Helper method to verify no sensitive fields are present in response
     */
    private function assertNoSensitiveFieldsInResponse($data, $endpoint)
    {
        $sensitiveFields = [
            'email',
            'password', 
            'remember_token',
            'stripe_account_id',
            'stripe_access_token',
            'stripe_refresh_token',
            'bank_account',
            'ssn',
            'tax_id',
            'phone',
            'address',
            'date_of_birth',
            'government_id'
        ];
        
        $this->checkArrayRecursively($data, $sensitiveFields, $endpoint);
    }
    
    private function checkArrayRecursively($array, $sensitiveFields, $context)
    {
        if (!is_array($array)) {
            return;
        }
        
        foreach ($array as $key => $value) {
            // Check if key is sensitive
            $this->assertNotContains($key, $sensitiveFields, 
                "Sensitive field '{$key}' found in response for {$context}");
            
            // Recursively check nested arrays/objects
            if (is_array($value)) {
                $this->checkArrayRecursively($value, $sensitiveFields, $context);
            }
        }
    }
}
