<?php

namespace Database\Factories;

use App\Models\WishItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WishItem>
 */
class WishItemFactory extends Factory
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
            'wishname' => fake()->sentence(3),
            'price' => fake()->randomFloat(2, 10, 1000),
            'currency' => 'GBP',
            'item_url' => fake()->url(),
            'thumbnail' => null,
            'reward' => null,
            'ai_generated' => false,
            'subscription' => 0,
            'subscription_period' => null,
            'repeat_purchase' => 0,
            'category' => null,
            'is_pin' => false,
            'fullfill_amount' => null,
            'tax_amount' => fake()->randomFloat(2, 1, 50),
            'twitter_response' => null,
            'delete_reason' => null,
            'edited_reason' => null,
            'edited_status' => null,
            'is_approved' => 1,
        ];
    }

    /**
     * Indicate that the wish item is not approved.
     */
    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => 0,
        ]);
    }
}
