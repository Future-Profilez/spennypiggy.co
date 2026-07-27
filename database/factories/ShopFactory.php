<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shop>
 */
class ShopFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'physical',
            'stripe_product_id' => fake()->uuid(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'image' => null,
            // Deprecated monetary fields - replaced with social engagement metrics
            // 'price' => fake()->randomFloat(2, 10, 200),
            // 'currency' => 'GBP',
            // 'special_member_price' => null,
            'success_page_type' => 'message',
            'success_page_value' => fake()->sentence(),
            'reward_file_type' => null,
            'reward_file' => null,
            'ai_generated' => false,
            'ask_question' => false,
            'slot_limitation' => null,
            'quantity_allow' => 1,
            'shipping_information' => null,
            'vat_applicable' => false,
            'approved' => true,
            // New social engagement fields
            'supporter_count' => fake()->numberBetween(0, 800),
            'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
            'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
            'rising_score' => fake()->numberBetween(0, 100),
            'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
            'trending_status' => fake()->boolean(),
        ];
    }

    /**
     * Indicate that the shop item is not approved.
     */
    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'approved' => false,
        ]);
    }
}
