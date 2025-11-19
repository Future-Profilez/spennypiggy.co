<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\IntercomService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IntercomServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $intercomService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->intercomService = new IntercomService();
    }

    /** @test */
    public function it_returns_disabled_when_intercom_is_not_enabled()
    {
        config(['services.intercom.enabled' => false]);
        
        $result = $this->intercomService->buildSettings(null);
        
        $this->assertEquals(['enabled' => false], $result);
    }

    /** @test */
    public function it_returns_disabled_when_app_id_is_empty()
    {
        config(['services.intercom.enabled' => true]);
        config(['services.intercom.app_id' => '']);
        
        $result = $this->intercomService->buildSettings(null);
        
        $this->assertEquals(['enabled' => false], $result);
    }

    /** @test */
    public function it_returns_basic_settings_for_anonymous_user()
    {
        config([
            'services.intercom.enabled' => true,
            'services.intercom.app_id' => 'test123'
        ]);
        
        $result = $this->intercomService->buildSettings(null);
        
        $expected = [
            'enabled' => true,
            'appId' => 'test123',
            'boot' => [
                'app_id' => 'test123',
            ]
        ];
        
        $this->assertEquals($expected, $result);
    }

    /** @test */
    public function it_returns_full_settings_for_creator_user()
    {
        config([
            'services.intercom.enabled' => true,
            'services.intercom.app_id' => 'test123',
            'services.intercom.identity_secret' => 'secret123'
        ]);
        
        $user = User::factory()->create([
            'id' => 456,
            'name' => 'Test Creator',
            'email' => 'creator@test.com',
            'username' => 'testcreator',
            'role' => 'creator',
            'suspended_account' => 0,
        ]);
        
        $result = $this->intercomService->buildSettings($user);
        
        $this->assertTrue($result['enabled']);
        $this->assertEquals('test123', $result['appId']);
        $this->assertEquals('456', $result['boot']['user_id']);
        $this->assertEquals('creator@test.com', $result['boot']['email']);
        $this->assertEquals('Test Creator', $result['boot']['name']);
        
        // Test identity verification hash
        $expectedHash = hash_hmac('sha256', '456', 'secret123');
        $this->assertEquals($expectedHash, $result['boot']['user_hash']);
        
        // Test custom attributes
        $customAttrs = $result['boot']['custom_attributes'];
        $this->assertTrue($customAttrs['is_creator']);
        $this->assertEquals('active', $customAttrs['account_status']);
        $this->assertStringContains('/testcreator', $customAttrs['profile_url']);
    }

    /** @test */
    public function it_returns_disabled_for_non_creator_user()
    {
        config([
            'services.intercom.enabled' => true,
            'services.intercom.app_id' => 'test123'
        ]);
        
        $user = User::factory()->create([
            'role' => 'user', // Not a creator
            'is_creator' => false,
        ]);
        
        $result = $this->intercomService->buildSettings($user);
        
        $this->assertEquals(['enabled' => false], $result);
    }

    /** @test */
    public function it_includes_suspended_status_for_suspended_user()
    {
        config([
            'services.intercom.enabled' => true,
            'services.intercom.app_id' => 'test123'
        ]);
        
        $user = User::factory()->create([
            'role' => 'creator',
            'suspended_account' => 1, // Suspended
        ]);
        
        $result = $this->intercomService->buildSettings($user);
        
        $this->assertEquals('suspended', $result['boot']['custom_attributes']['account_status']);
    }

    /** @test */
    public function it_allows_admin_users_even_if_not_creator()
    {
        config([
            'services.intercom.enabled' => true,
            'services.intercom.app_id' => 'test123'
        ]);
        
        $user = User::factory()->create([
            'role' => 'admin',
            'is_creator' => false,
        ]);
        
        $result = $this->intercomService->buildSettings($user);
        
        $this->assertTrue($result['enabled']);
        $this->assertArrayHasKey('boot', $result);
    }
}