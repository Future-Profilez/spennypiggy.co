<?php

namespace Tests\Integration;

use App\Models\User;
use App\Models\WishItem;
use App\Models\Bills;
use App\Models\Shop;
use App\Models\Membership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialEngagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        
        // Create test users with social engagement data
        $this->users = User::factory(10)->create();
        
        // Create content with various engagement levels
        $this->createSocialEngagementTestData();
    }

    /** @test */
    public function it_can_retrieve_trending_content_sorted_by_social_metrics(): void
    {
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
                ])
                ->assertJsonFragment(['sorted_by' => 'social_engagement_metrics']);
    }

    /** @test */
    public function it_filters_content_by_engagement_level_correctly(): void
    {
        $response = $this->getJson('/api/social-engagement/engagement-level/viral?type=wishes&limit=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'wishes' => [
                            '*' => [
                                'id',
                                'supporter_count',
                                'engagement_level',
                                'trending_status',
                                'rising_score'
                            ]
                        ]
                    ],
                    'meta' => [
                        'engagement_level',
                        'type',
                        'sorted_by'
                    ]
                ])
                ->assertJsonFragment([
                    'engagement_level' => 'viral',
                    'sorted_by' => 'supporter_count_desc,rising_score_desc'
                ]);

        // Verify all returned items have viral engagement level
        $wishes = $response->json('data.wishes');
        foreach ($wishes as $wish) {
            $this->assertEquals('viral', $wish['engagement_level']);
            $this->assertGreaterThanOrEqual(500, $wish['supporter_count']); // Viral should have high supporter count
        }
    }

    /** @test */
    public function it_can_filter_by_supporter_count_range(): void
    {
        $minSupporters = 100;
        $maxSupporters = 500;

        $response = $this->getJson("/api/social-engagement/supporter-count?min_supporters={$minSupporters}&max_supporters={$maxSupporters}&type=wishes");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'supporter_count',
                            'engagement_level',
                            'rising_score'
                        ]
                    ],
                    'meta' => [
                        'min_supporters',
                        'max_supporters',
                        'type',
                        'total_results'
                    ]
                ]);

        // Verify all returned items are within the supporter count range
        $items = $response->json('data');
        foreach ($items as $item) {
            $this->assertGreaterThanOrEqual($minSupporters, $item['supporter_count']);
            $this->assertLessThanOrEqual($maxSupporters, $item['supporter_count']);
        }
    }

    /** @test */
    public function it_can_get_high_growth_creators(): void
    {
        $minGrowthRate = 20.0;

        $response = $this->getJson("/api/social-engagement/high-growth?min_growth_rate={$minGrowthRate}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'high_growth_wishes' => [
                            '*' => [
                                'creator_growth_rate',
                                'supporter_count',
                                'engagement_level'
                            ]
                        ]
                    ],
                    'meta' => [
                        'min_growth_rate',
                        'sorted_by',
                        'total_results'
                    ]
                ]);

        // Verify all returned creators meet minimum growth rate
        $creators = $response->json('data.high_growth_wishes');
        foreach ($creators as $creator) {
            $this->assertGreaterThanOrEqual($minGrowthRate, $creator['creator_growth_rate']);
        }
    }

    /** @test */
    public function it_provides_gift_frequency_statistics(): void
    {
        $response = $this->getJson('/api/social-engagement/gift-frequency-stats');

        $response->assertStatus(200)
                ->assertJsonStructure([
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
                ])
                ->assertJsonFragment([
                    'description' => 'Gift frequency statistics across all content types'
                ]);

        $stats = $response->json('data');

        // Verify we have numeric counts for all frequencies
        foreach (['wishes', 'bills', 'shops'] as $type) {
            foreach (['daily', 'weekly', 'monthly', 'rarely'] as $frequency) {
                $this->assertIsNumeric($stats[$type][$frequency]);
                $this->assertGreaterThanOrEqual(0, $stats[$type][$frequency]);
            }
        }
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
    public function it_can_update_social_engagement_metrics(): void
    {
        $wishItem = WishItem::factory()->create([
            'user_id' => $this->users->first()->id,
            'supporter_count' => 50,
            'engagement_level' => 'low',
            'trending_status' => false,
            'rising_score' => 25
        ]);

        $updateData = [
            'item_type' => 'wish_item',
            'item_id' => $wishItem->id,
            'supporter_count' => 750,
            'engagement_level' => 'viral',
            'trending_status' => true,
            'rising_score' => 95,
            'creator_growth_rate' => 45.8
        ];

        $response = $this->postJson('/api/social-engagement/update-metrics', $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data',
                    'updated_fields'
                ])
                ->assertJsonFragment(['success' => true]);

        // Verify database was updated
        $this->assertDatabaseHas('wish_items', [
            'id' => $wishItem->id,
            'supporter_count' => 750,
            'engagement_level' => 'viral',
            'trending_status' => true,
            'rising_score' => 95
        ]);
    }

    /** @test */
    public function it_sorts_results_by_social_engagement_instead_of_monetary_values(): void
    {
        // Create items with different engagement but same monetary values
        WishItem::create([
            'user_id' => $this->users->first()->id,
            'title' => 'High Engagement Item',
            'supporter_count' => 1000,
            'rising_score' => 95,
            'engagement_level' => 'viral',
            'trending_status' => true,
            'is_approved' => 1
        ]);

        WishItem::create([
            'user_id' => $this->users->first()->id,
            'title' => 'Low Engagement Item',
            'supporter_count' => 10,
            'rising_score' => 15,
            'engagement_level' => 'low',
            'trending_status' => false,
            'is_approved' => 1
        ]);

        $response = $this->getJson('/api/social-engagement/trending');
        $trendingWishes = $response->json('data.trending_wishes');

        // High engagement item should appear first
        if (count($trendingWishes) >= 2) {
            $this->assertGreaterThan($trendingWishes[1]['supporter_count'], $trendingWishes[0]['supporter_count']);
            $this->assertGreaterThan($trendingWishes[1]['rising_score'], $trendingWishes[0]['rising_score']);
        }
    }

    private function createSocialEngagementTestData(): void
    {
        // Create wishes with different engagement levels
        WishItem::factory(5)->create([
            'user_id' => $this->users->random()->id,
            'engagement_level' => 'viral',
            'supporter_count' => fake()->numberBetween(500, 2000),
            'rising_score' => fake()->numberBetween(80, 100),
            'trending_status' => true,
            'creator_growth_rate' => fake()->randomFloat(2, 25, 75),
            'gift_frequency' => fake()->randomElement(['daily', 'weekly']),
            'is_approved' => 1
        ]);

        WishItem::factory(10)->create([
            'user_id' => $this->users->random()->id,
            'engagement_level' => 'high',
            'supporter_count' => fake()->numberBetween(100, 500),
            'rising_score' => fake()->numberBetween(60, 85),
            'trending_status' => fake()->boolean(30),
            'creator_growth_rate' => fake()->randomFloat(2, 10, 30),
            'gift_frequency' => fake()->randomElement(['weekly', 'monthly']),
            'is_approved' => 1
        ]);

        WishItem::factory(15)->create([
            'user_id' => $this->users->random()->id,
            'engagement_level' => 'medium',
            'supporter_count' => fake()->numberBetween(20, 100),
            'rising_score' => fake()->numberBetween(30, 65),
            'trending_status' => fake()->boolean(15),
            'creator_growth_rate' => fake()->randomFloat(2, 5, 15),
            'gift_frequency' => fake()->randomElement(['monthly', 'rarely']),
            'is_approved' => 1
        ]);

        WishItem::factory(20)->create([
            'user_id' => $this->users->random()->id,
            'engagement_level' => 'low',
            'supporter_count' => fake()->numberBetween(0, 25),
            'rising_score' => fake()->numberBetween(0, 35),
            'trending_status' => false,
            'creator_growth_rate' => fake()->randomFloat(2, 0, 8),
            'gift_frequency' => 'rarely',
            'is_approved' => 1
        ]);

        // Create similar data for Bills and Shops
        Bills::factory(10)->create([
            'user_id' => $this->users->random()->id,
            'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
            'supporter_count' => fake()->numberBetween(0, 1000),
            'rising_score' => fake()->numberBetween(0, 100),
            'trending_status' => fake()->boolean(20),
            'status' => 1
        ]);

        Shop::factory(8)->create([
            'user_id' => $this->users->random()->id,
            'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
            'supporter_count' => fake()->numberBetween(0, 800),
            'rising_score' => fake()->numberBetween(0, 100),
            'trending_status' => fake()->boolean(25)
        ]);
    }
}
