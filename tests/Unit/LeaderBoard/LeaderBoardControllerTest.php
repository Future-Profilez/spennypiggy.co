<?php

namespace Tests\Unit\LeaderBoard;

use App\Http\Controllers\Auth\LeaderBoardController;
use App\Http\DTOs\LeaderBoard\LeaderBoardUserDTO;
use App\Http\DTOs\LeaderBoard\RecentGifterDTO;
use App\Http\DTOs\LeaderBoard\LargestGiftDTO;
use Tests\TestCase;
use ReflectionClass;

class LeaderBoardControllerTest extends TestCase
{
    private $controller;
    private $reflection;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new LeaderBoardController();
        $this->reflection = new ReflectionClass(LeaderBoardController::class);
    }

    /**
     * Test dtosToPublicResponse method correctly strips sensitive data
     */
    public function test_dtos_to_public_response_strips_sensitive_data()
    {
        $method = $this->reflection->getMethod('dtosToPublicResponse');
        $method->setAccessible(true);

        $dtos = [
            new LeaderBoardUserDTO(
                'uuid-1', 'user1', 'Secret Name 1', 'avatar1.jpg', 'cover1.jpg', 
                1, 1.0, 1, 1, 100.0, 'USD'
            ),
            new RecentGifterDTO(
                'uuid-2', 'user2', 'Secret Name 2', 'avatar2.jpg', 'cover2.jpg',
                1, 1, 50.0, 'EUR'
            )
        ];

        $result = $method->invoke($this->controller, $dtos);

        // Check first DTO (LeaderBoard)
        $this->assertEquals('uuid-1', $result[0]['uuid']);
        $this->assertEquals('user1', $result[0]['username']);
        $this->assertArrayNotHasKey('name', $result[0]); // Sensitive data stripped
        $this->assertArrayNotHasKey('amount', $result[0]); // Sensitive data stripped

        // Check second DTO (RecentGifter) 
        $this->assertEquals('uuid-2', $result[1]['uuid']);
        $this->assertEquals('user2', $result[1]['username']);
        $this->assertArrayNotHasKey('name', $result[1]); // Sensitive data stripped
        $this->assertArrayNotHasKey('amount', $result[1]); // Sensitive data stripped
    }

    /**
     * Test dtosToInternalResponse method includes all data
     */
    public function test_dtos_to_internal_response_includes_all_data()
    {
        $method = $this->reflection->getMethod('dtosToInternalResponse');
        $method->setAccessible(true);

        $dtos = [
            new LeaderBoardUserDTO(
                'uuid-1', 'user1', 'Full Name 1', 'avatar1.jpg', 'cover1.jpg', 
                1, 1.0, 1, 1, 100.0, 'USD'
            ),
            new RecentGifterDTO(
                'uuid-2', 'user2', 'Full Name 2', 'avatar2.jpg', 'cover2.jpg',
                1, 1, 50.0, 'EUR'
            )
        ];

        $result = $method->invoke($this->controller, $dtos);

        // Check first DTO includes internal data
        $this->assertEquals('Full Name 1', $result[0]['name']);
        $this->assertEquals(100.0, $result[0]['amount']);
        $this->assertEquals('USD', $result[0]['currency']);

        // Check second DTO includes internal data
        $this->assertEquals('Full Name 2', $result[1]['name']);
        $this->assertEquals(50.0, $result[1]['amount']);
        $this->assertEquals('EUR', $result[1]['currency']);
    }

    /**
     * Test filterZeroValueUsers method excludes zero-value DTOs by default
     */
    public function test_filter_zero_value_users_excludes_zeros_by_default()
    {
        $method = $this->reflection->getMethod('filterZeroValueUsers');
        $method->setAccessible(true);

        $dtos = [
            new LeaderBoardUserDTO(
                'uuid-1', 'user1', 'Name 1', null, null, 1, 1.0, 1, 1, 100.0, 'USD'
            ), // Non-zero
            new LeaderBoardUserDTO(
                'uuid-2', 'user2', 'Name 2', null, null, 2, 2.0, 1, 1, 0.0, 'USD'
            ), // Zero
            new RecentGifterDTO(
                'uuid-3', 'user3', 'Name 3', null, null, 1, 1, 25.0, 'EUR'
            ), // Non-zero
        ];

        $result = $method->invoke($this->controller, $dtos, false);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('users', $result);
        $this->assertArrayHasKey('total_count', $result);
        $this->assertArrayHasKey('active_count', $result);
        $this->assertArrayHasKey('zero_value_count', $result);

        $this->assertEquals(3, $result['total_count']);
        $this->assertEquals(2, $result['active_count']); // Only non-zero users
        $this->assertEquals(1, $result['zero_value_count']); // One zero-value user
        $this->assertCount(2, $result['users']);
    }

    /**
     * Test filterZeroValueUsers method includes all when flag is set
     */
    public function test_filter_zero_value_users_includes_all_when_flag_set()
    {
        $method = $this->reflection->getMethod('filterZeroValueUsers');
        $method->setAccessible(true);

        $dtos = [
            new LeaderBoardUserDTO(
                'uuid-1', 'user1', 'Name 1', null, null, 1, 1.0, 1, 1, 100.0, 'USD'
            ),
            new LeaderBoardUserDTO(
                'uuid-2', 'user2', 'Name 2', null, null, 2, 2.0, 1, 1, 0.0, 'USD'
            ), // Zero value - should be included
        ];

        $result = $method->invoke($this->controller, $dtos, true); // Include zeros

        $this->assertIsArray($result);
        $this->assertCount(2, $result); // Should return original array when including zeros
        $this->assertInstanceOf(LeaderBoardUserDTO::class, $result[0]);
        $this->assertInstanceOf(LeaderBoardUserDTO::class, $result[1]);
    }

    /**
     * Test transformToLeaderBoardDTO method creates correct DTO
     */
    public function test_transform_to_leader_board_dto()
    {
        $method = $this->reflection->getMethod('transformToLeaderBoardDTO');
        $method->setAccessible(true);

        $mockUser = (object) [
            'uuid' => 'test-uuid',
            'username' => 'testuser',
            'name' => 'Test User',
            'avatar_url' => 'avatar.jpg',
            'cover_url' => 'cover.jpg',
            'profile_status_lock' => 2,
            'role' => 1,
            'total_amount' => 250.75
        ];

        $result = $method->invoke($this->controller, $mockUser, 3);

        $this->assertInstanceOf(LeaderBoardUserDTO::class, $result);
        
        $publicArray = $result->toPublicArray();
        $this->assertEquals('test-uuid', $publicArray['uuid']);
        $this->assertEquals('testuser', $publicArray['username']);
        $this->assertEquals(3, $publicArray['rank']);
        $this->assertEquals(0.03, $publicArray['top']); // 3/100
        
        $internalArray = $result->toInternalArray();
        $this->assertEquals('Test User', $internalArray['name']);
        $this->assertEquals(250.75, $internalArray['amount']);
    }

    /**
     * Test transformToRecentGifterDTO method creates correct DTO
     */
    public function test_transform_to_recent_gifter_dto()
    {
        $method = $this->reflection->getMethod('transformToRecentGifterDTO');
        $method->setAccessible(true);

        $mockUser = (object) [
            'uuid' => 'gifter-uuid',
            'username' => 'gifteruser',
            'name' => 'Gifter Name',
            'avatar_url' => 'gifter_avatar.jpg',
            'cover_url' => 'gifter_cover.jpg',
            'profile_status_lock' => 1,
            'role' => 0
        ];

        $result = $method->invoke($this->controller, $mockUser, 75.50, 'GBP');

        $this->assertInstanceOf(RecentGifterDTO::class, $result);
        
        $publicArray = $result->toPublicArray();
        $this->assertEquals('gifter-uuid', $publicArray['uuid']);
        $this->assertEquals('gifteruser', $publicArray['username']);
        $this->assertArrayNotHasKey('amount', $publicArray); // Should be stripped
        
        $internalArray = $result->toInternalArray();
        $this->assertEquals('Gifter Name', $internalArray['name']);
        $this->assertEquals(75.50, $internalArray['amount']);
        $this->assertEquals('GBP', $internalArray['currency']);
    }

    /**
     * Test transformToLargestGiftDTO method creates correct DTO
     */
    public function test_transform_to_largest_gift_dto()
    {
        $method = $this->reflection->getMethod('transformToLargestGiftDTO');
        $method->setAccessible(true);

        $mockUser = (object) [
            'uuid' => 'large-uuid',
            'username' => 'largeuser',
            'name' => 'Large Gifter',
            'avatar_url' => 'large_avatar.jpg',
            'cover_url' => 'large_cover.jpg',
            'profile_status_lock' => 2,
            'role' => 1
        ];

        $result = $method->invoke($this->controller, $mockUser, 1500.00, 'USD', 'membership');

        $this->assertInstanceOf(LargestGiftDTO::class, $result);
        
        $publicArray = $result->toPublicArray();
        $this->assertEquals('large-uuid', $publicArray['uuid']);
        $this->assertEquals('largeuser', $publicArray['username']);
        $this->assertEquals('membership', $publicArray['type']);
        $this->assertArrayNotHasKey('amount', $publicArray); // Should be stripped
        
        $internalArray = $result->toInternalArray();
        $this->assertEquals('Large Gifter', $internalArray['name']);
        $this->assertEquals(1500.00, $internalArray['amount']);
        $this->assertEquals('USD', $internalArray['currency']);
    }

    /**
     * Test DTOs handle missing user fields gracefully
     */
    public function test_transform_methods_handle_missing_fields()
    {
        $method = $this->reflection->getMethod('transformToLeaderBoardDTO');
        $method->setAccessible(true);

        $mockUser = (object) [
            // Missing uuid, name, avatar_url, cover_url, etc.
            'username' => 'testuser'
            // Other fields will be null/default
        ];

        $result = $method->invoke($this->controller, $mockUser, 1);

        $publicArray = $result->toPublicArray();
        $this->assertEquals('', $publicArray['uuid']); // Default empty string
        $this->assertEquals('testuser', $publicArray['username']);
        $this->assertNull($publicArray['avatar']);
        $this->assertNull($publicArray['coverimg']);
        $this->assertEquals(1, $publicArray['profile_status_lock']); // Default
        $this->assertEquals(0, $publicArray['role']); // Default
    }
}
