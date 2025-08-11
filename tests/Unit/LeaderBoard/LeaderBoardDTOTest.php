<?php

namespace Tests\Unit\LeaderBoard;

use App\Http\DTOs\LeaderBoard\LeaderBoardUserDTO;
use App\Http\DTOs\LeaderBoard\RecentGifterDTO;
use App\Http\DTOs\LeaderBoard\LargestGiftDTO;
use Tests\TestCase;

class LeaderBoardDTOTest extends TestCase
{
    /**
     * Test LeaderBoardUserDTO excludes sensitive data in public response
     */
    public function test_leader_board_user_dto_public_response_excludes_sensitive_data()
    {
        $dto = new LeaderBoardUserDTO(
            'user-uuid-123',
            'testuser',
            'John Doe', // Should be excluded from public
            'https://example.com/avatar.jpg',
            'https://example.com/cover.jpg',
            1,
            1.0,
            2,
            1,
            150.50, // Should be excluded from public
            'USD'   // Should be excluded from public
        );

        $publicResponse = $dto->toPublicArray();

        // Should include non-sensitive data
        $this->assertEquals('user-uuid-123', $publicResponse['uuid']);
        $this->assertEquals('testuser', $publicResponse['username']);
        $this->assertEquals('https://example.com/avatar.jpg', $publicResponse['avatar']);
        $this->assertEquals('https://example.com/cover.jpg', $publicResponse['coverimg']);
        $this->assertEquals(1, $publicResponse['rank']);
        $this->assertEquals(1.0, $publicResponse['top']);
        $this->assertEquals(2, $publicResponse['profile_status_lock']);
        $this->assertEquals(1, $publicResponse['role']);

        // Should exclude sensitive data
        $this->assertArrayNotHasKey('name', $publicResponse);
        $this->assertArrayNotHasKey('amount', $publicResponse);
        $this->assertArrayNotHasKey('currency', $publicResponse);
    }

    /**
     * Test LeaderBoardUserDTO includes sensitive data in internal response
     */
    public function test_leader_board_user_dto_internal_response_includes_sensitive_data()
    {
        $dto = new LeaderBoardUserDTO(
            'user-uuid-123',
            'testuser',
            'John Doe',
            'https://example.com/avatar.jpg',
            'https://example.com/cover.jpg',
            1,
            1.0,
            2,
            1,
            150.50,
            'USD'
        );

        $internalResponse = $dto->toInternalArray();

        // Should include all data including sensitive fields
        $this->assertEquals('John Doe', $internalResponse['name']);
        $this->assertEquals(150.50, $internalResponse['amount']);
        $this->assertEquals('USD', $internalResponse['currency']);

        // Should also include public data
        $this->assertEquals('user-uuid-123', $internalResponse['uuid']);
        $this->assertEquals('testuser', $internalResponse['username']);
    }

    /**
     * Test LeaderBoardUserDTO correctly identifies zero values
     */
    public function test_leader_board_user_dto_zero_value_detection()
    {
        $zeroValueDto = new LeaderBoardUserDTO(
            'user-uuid-123',
            'testuser',
            'John Doe',
            null,
            null,
            5,
            5.0,
            1,
            0,
            0.0, // Zero amount
            'USD'
        );

        $nonZeroValueDto = new LeaderBoardUserDTO(
            'user-uuid-456',
            'testuser2',
            'Jane Doe',
            null,
            null,
            3,
            3.0,
            1,
            0,
            50.0, // Non-zero amount
            'USD'
        );

        $this->assertTrue($zeroValueDto->hasZeroValue());
        $this->assertFalse($nonZeroValueDto->hasZeroValue());
    }

    /**
     * Test RecentGifterDTO excludes financial amounts from public response
     */
    public function test_recent_gifter_dto_public_response_excludes_amounts()
    {
        $dto = new RecentGifterDTO(
            'user-uuid-789',
            'gifteruser',
            'Gift Giver', // Should be excluded
            'https://example.com/avatar.jpg',
            'https://example.com/cover.jpg',
            1,
            0,
            25.75, // Should be excluded
            'EUR'  // Should be excluded
        );

        $publicResponse = $dto->toPublicArray();

        // Should include safe data
        $this->assertEquals('user-uuid-789', $publicResponse['uuid']);
        $this->assertEquals('gifteruser', $publicResponse['username']);
        $this->assertEquals('https://example.com/avatar.jpg', $publicResponse['avatar']);

        // Should exclude financial and personal data
        $this->assertArrayNotHasKey('name', $publicResponse);
        $this->assertArrayNotHasKey('amount', $publicResponse);
        $this->assertArrayNotHasKey('currency', $publicResponse);
        $this->assertArrayNotHasKey('rank', $publicResponse);
        $this->assertArrayNotHasKey('top', $publicResponse);
    }

    /**
     * Test RecentGifterDTO includes all data in internal response
     */
    public function test_recent_gifter_dto_internal_response_includes_all_data()
    {
        $dto = new RecentGifterDTO(
            'user-uuid-789',
            'gifteruser',
            'Gift Giver',
            'https://example.com/avatar.jpg',
            'https://example.com/cover.jpg',
            1,
            0,
            25.75,
            'EUR'
        );

        $internalResponse = $dto->toInternalArray();

        // Should include all data
        $this->assertEquals('Gift Giver', $internalResponse['name']);
        $this->assertEquals(25.75, $internalResponse['amount']);
        $this->assertEquals('EUR', $internalResponse['currency']);
        $this->assertEquals('gifteruser', $internalResponse['username']);
    }

    /**
     * Test LargestGiftDTO excludes financial data from public response
     */
    public function test_largest_gift_dto_public_response_excludes_financial_data()
    {
        $dto = new LargestGiftDTO(
            'user-uuid-999',
            'largeuser',
            'Large Gifter', // Should be excluded
            'https://example.com/avatar.jpg',
            'https://example.com/cover.jpg',
            2,
            1,
            500.00, // Should be excluded
            'GBP',  // Should be excluded
            'wishlist_gift'
        );

        $publicResponse = $dto->toPublicArray();

        // Should include safe data
        $this->assertEquals('user-uuid-999', $publicResponse['uuid']);
        $this->assertEquals('largeuser', $publicResponse['username']);
        $this->assertEquals('wishlist_gift', $publicResponse['type']);

        // Should exclude financial and personal data
        $this->assertArrayNotHasKey('name', $publicResponse);
        $this->assertArrayNotHasKey('amount', $publicResponse);
        $this->assertArrayNotHasKey('currency', $publicResponse);
    }

    /**
     * Test LargestGiftDTO zero value detection
     */
    public function test_largest_gift_dto_zero_value_detection()
    {
        $zeroDto = new LargestGiftDTO(
            'user-uuid-999',
            'largeuser',
            'Large Gifter',
            null,
            null,
            2,
            1,
            0.0, // Zero amount
            'GBP',
            'tip'
        );

        $nonZeroDto = new LargestGiftDTO(
            'user-uuid-888',
            'largeuser2',
            'Large Gifter 2',
            null,
            null,
            2,
            1,
            100.0, // Non-zero amount
            'GBP',
            'subscription'
        );

        $this->assertTrue($zeroDto->hasZeroValue());
        $this->assertFalse($nonZeroDto->hasZeroValue());
    }

    /**
     * Test DTOs handle null values gracefully
     */
    public function test_dtos_handle_null_values_gracefully()
    {
        $dto = new LeaderBoardUserDTO(
            'user-uuid-123',
            'testuser',
            null, // Null name
            null, // Null avatar
            null, // Null cover
            1,
            1.0,
            2,
            1,
            150.50,
            'USD'
        );

        $publicResponse = $dto->toPublicArray();

        $this->assertEquals('user-uuid-123', $publicResponse['uuid']);
        $this->assertEquals('testuser', $publicResponse['username']);
        $this->assertNull($publicResponse['avatar']);
        $this->assertNull($publicResponse['coverimg']);
    }

    /**
     * Test DTO amount getters work correctly
     */
    public function test_dto_amount_getters()
    {
        $leaderboardDto = new LeaderBoardUserDTO(
            'user-1', 'user1', 'User 1', null, null, 1, 1.0, 1, 1, 100.0, 'USD'
        );

        $recentGifterDto = new RecentGifterDTO(
            'user-2', 'user2', 'User 2', null, null, 1, 1, 50.0, 'EUR'
        );

        $largestGiftDto = new LargestGiftDTO(
            'user-3', 'user3', 'User 3', null, null, 1, 1, 200.0, 'GBP', 'membership'
        );

        $this->assertEquals(100.0, $leaderboardDto->getTotalAmount());
        $this->assertEquals(50.0, $recentGifterDto->getAmount());
        $this->assertEquals(200.0, $largestGiftDto->getAmount());
        $this->assertEquals('membership', $largestGiftDto->getType());
    }
}
