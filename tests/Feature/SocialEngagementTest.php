<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WishItem;
use App\Models\Bills;
use App\Models\Shop;
use App\Models\Membership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialEngagementTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        
        // Create test users
        $this->users = User::factory(5)->create();
    }

    /** @test */
    public function it_can_create_wish_items_with_social_engagement_fields(): void
    {
        $wishItem = WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'supporter_count' => 150,
            'gift_frequency' => 'weekly',
            'creator_growth_rate' => 25.5,
            'rising_score' => 78,
            'engagement_level' => 'high',
            'trending_status' => true,
        ]);

        $this->assertDatabaseHas('wish_items', [
            'id' => $wishItem->id,
            'supporter_count' => 150,
            'gift_frequency' => 'weekly',
            'creator_growth_rate' => 25.5,
            'rising_score' => 78,
            'engagement_level' => 'high',
            'trending_status' => true,
        ]);
    }

    /** @test */
    public function it_can_retrieve_trending_content(): void
    {
        // Create trending and non-trending content
        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'trending_status' => true,
            'rising_score' => 95,
            'supporter_count' => 500,
            'is_approved' => 1,
        ]);

        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'trending_status' => false,
            'rising_score' => 20,
            'supporter_count' => 10,
            'is_approved' => 1,
        ]);

        $response = $this->getJson('/api/social-engagement/trending');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'trending_wishes',
                        'trending_bills',
                        'trending_shops',
                    ],
                    'meta' => [
                        'total_trending_items',
                        'sorted_by',
                        'deprecated_fields'
                    ]
                ]);
    }

    /** @test */
    public function it_can_filter_content_by_engagement_level(): void
    {
        // Create content with different engagement levels
        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'engagement_level' => 'viral',
            'supporter_count' => 1000,
            'is_approved' => 1,
        ]);

        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'engagement_level' => 'low',
            'supporter_count' => 5,
            'is_approved' => 1,
        ]);

        $response = $this->getJson('/api/social-engagement/engagement-level/viral?type=wishes');

        $response->assertStatus(200)
                ->assertJsonFragment(['engagement_level' => 'viral'])
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'wishes'
                    ],
                    'meta' => [
                        'engagement_level',
                        'type',
                        'sorted_by'
                    ]
                ]);
    }

    /** @test */
    public function it_can_filter_by_supporter_count_range(): void
    {
        // Create content with different supporter counts
        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'supporter_count' => 250,
            'is_approved' => 1,
        ]);

        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'supporter_count' => 50,
            'is_approved' => 1,
        ]);

        $response = $this->getJson('/api/social-engagement/supporter-count?min_supporters=100&max_supporters=500&type=wishes');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data',
                    'meta' => [
                        'min_supporters',
                        'max_supporters',
                        'type',
                        'total_results'
                    ]
                ]);
    }

    /** @test */
    public function it_can_get_high_growth_creators(): void
    {
        // Create wishes for creators with different growth rates
        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'creator_growth_rate' => 45.8,
            'supporter_count' => 300,
            'is_approved' => 1,
        ]);

        WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'creator_growth_rate' => 5.2,
            'supporter_count' => 50,
            'is_approved' => 1,
        ]);

        $response = $this->getJson('/api/social-engagement/high-growth?min_growth_rate=20.0');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'high_growth_wishes'
                    ],
                    'meta' => [
                        'min_growth_rate',
                        'sorted_by',
                        'total_results'
                    ]
                ]);
    }

    /** @test */
    public function it_can_get_gift_frequency_statistics(): void
    {
        // Create content with different gift frequencies
        WishItem::factory()->create([
            'gift_frequency' => 'daily',
            'is_approved' => 1,
        ]);

        WishItem::factory()->create([
            'gift_frequency' => 'weekly',
            'is_approved' => 1,
        ]);

        Bills::factory()->create([
            'gift_frequency' => 'monthly',
            'status' => 1,
        ]);

        $response = $this->getJson('/api/social-engagement/gift-frequency-stats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'wishes' => [
                            'daily',
                            'weekly', 
                            'monthly',
                            'rarely'
                        ],
                        'bills' => [
                            'daily',
                            'weekly',
                            'monthly', 
                            'rarely'
                        ],
                        'shops' => [
                            'daily',
                            'weekly',
                            'monthly',
                            'rarely'
                        ]
                    ]
                ]);
    }

    /** @test */
    public function it_can_update_social_engagement_metrics(): void
    {
        $wishItem = WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'supporter_count' => 100,
            'engagement_level' => 'low',
        ]);

        $updateData = [
            'item_type' => 'wish_item',
            'item_id' => $wishItem->id,
            'supporter_count' => 500,
            'engagement_level' => 'high',
            'trending_status' => true,
            'rising_score' => 85,
        ];

        $response = $this->postJson('/api/social-engagement/update-metrics', $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data',
                    'updated_fields'
                ]);

        $this->assertDatabaseHas('wish_items', [
            'id' => $wishItem->id,
            'supporter_count' => 500,
            'engagement_level' => 'high',
            'trending_status' => true,
            'rising_score' => 85,
        ]);
    }

    /** @test */
    public function it_validates_engagement_level_parameter(): void
    {
        $response = $this->getJson('/api/social-engagement/engagement-level/invalid');

        $response->assertStatus(400)
                ->assertJsonFragment([
                    'success' => false,
                    'message' => 'Invalid engagement level. Must be one of: low, medium, high, viral'
                ]);
    }

    /** @test */
    public function all_models_have_social_engagement_fields(): void
    {
        // Test that all main models can be created with social engagement fields
        $socialFields = [
            'supporter_count' => 200,
            'gift_frequency' => 'weekly',
            'creator_growth_rate' => 33.5,
            'rising_score' => 72,
            'engagement_level' => 'medium',
            'trending_status' => false,
        ];

        // WishItem
        $wishItem = WishItem::factory()->create($socialFields + ['user_id' => $this->users->first()->id]);
        $this->assertEquals(200, $wishItem->supporter_count);
        $this->assertEquals('weekly', $wishItem->gift_frequency);

        // Bills  
        $bill = Bills::factory()->create($socialFields + ['user_id' => $this->users->first()->id]);
        $this->assertEquals(200, $bill->supporter_count);
        $this->assertEquals('medium', $bill->engagement_level);

        // Shop
        $shop = Shop::factory()->create($socialFields + ['user_id' => $this->users->first()->id]);
        $this->assertEquals(72, $shop->rising_score);
        $this->assertEquals(false, $shop->trending_status);

        // Membership
        $membership = Membership::factory()->create($socialFields + ['user_id' => $this->users->first()->id]);
        $this->assertEquals(33.5, $membership->creator_growth_rate);
        $this->assertEquals('medium', $membership->engagement_level);
    }
}
