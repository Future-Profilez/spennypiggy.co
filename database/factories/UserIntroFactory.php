<?php

namespace Database\Factories;

use App\Models\UserIntro;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserIntro>
 */
class UserIntroFactory extends Factory
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
            'poster' => fake()->uuid(),
            'height' => fake()->numberBetween(300, 1080),
            'width' => fake()->numberBetween(300, 1920),
            'approved' => true,
        ];
    }

    /**
     * Indicate that the user intro is not approved.
     */
    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'approved' => false,
        ]);
    }
}
