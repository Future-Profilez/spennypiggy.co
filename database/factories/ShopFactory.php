<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shop>
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
            'price' => fake()->randomFloat(2, 10, 200),
            'currency' => 'GBP',
            'success_page_type' => 'message',
            'success_page_value' => fake()->sentence(),
            'reward_file_type' => null,
            'reward_file' => null,
            'ai_generated' => false,
            'ask_question' => false,
            'slot_limitation' => null,
            'special_member_price' => null,
            'quantity_allow' => 1,
            'shipping_information' => null,
            'vat_applicable' => false,
            'approved' => true,
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
