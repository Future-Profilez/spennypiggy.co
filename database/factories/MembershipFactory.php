<?php

namespace Database\Factories;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Membership>
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
            'price' => fake()->randomFloat(2, 5, 100),
            'thumbnail' => null,
            'rewards' => fake()->sentence(),
            'status' => 1,
            'approved' => true,
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
