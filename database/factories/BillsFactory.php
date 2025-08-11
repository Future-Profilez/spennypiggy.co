<?php

namespace Database\Factories;

use App\Models\Bills;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bills>
 */
class BillsFactory extends Factory
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
            'name' => fake()->sentence(3),
            'price' => fake()->randomFloat(2, 20, 500),
            'currency' => 'GBP',
            'thumbnail' => null,
            'tax_amount' => fake()->randomFloat(2, 2, 50),
            'status' => 1,
            'approved' => true,
        ];
    }

    /**
     * Indicate that the bill is not approved.
     */
    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'approved' => false,
        ]);
    }
}
