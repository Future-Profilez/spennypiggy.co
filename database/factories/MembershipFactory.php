<?php

namespace Database\Factories;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Membership>
 */
class MembershipFactory extends Factory
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
            'product_id' => fake()->uuid(),
            'price_id' => fake()->uuid(),
            'level' => fake()->randomElement(['bronze', 'silver', 'gold', 'platinum', 'lifetime']),
            // Deprecated monetary fields - replaced with social engagement metrics
            // 'price' => fake()->randomFloat(2, 5, 100),
            'thumbnail' => null,
            'rewards' => fake()->sentence(),
            'status' => 1,
            'approved' => true,
            // New social engagement fields
            'supporter_count' => fake()->numberBetween(0, 2000),
            'gift_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly', 'rarely']),
            'creator_growth_rate' => fake()->randomFloat(2, 0, 100),
            'rising_score' => fake()->numberBetween(0, 100),
            'engagement_level' => fake()->randomElement(['low', 'medium', 'high', 'viral']),
            'trending_status' => fake()->boolean(),
        ];
    }

    /**
     * Indicate that the membership is not approved.
     */
    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'approved' => false,
        ]);
    }
}
