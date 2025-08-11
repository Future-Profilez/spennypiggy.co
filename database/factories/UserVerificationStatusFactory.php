<?php

namespace Database\Factories;

use App\Models\UserVerificationStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserVerificationStatus>
 */
class UserVerificationStatusFactory extends Factory
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
            'role' => fake()->randomElement([0, 1]),
            'bio_status' => fake()->randomElement([0, 1]),
            'social_status' => fake()->randomElement([0, 1]),
            'address_status' => fake()->randomElement([0, 1]),
            'user_profile_status' => fake()->randomElement([0, 1]),
            'address_verification_error' => null,
        ];
    }

    /**
     * Indicate that the user verification status has pending creator profile.
     */
    public function pendingCreatorProfile(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 1,
            'bio_status' => 0,
            'user_profile_status' => 0,
        ]);
    }

    /**
     * Indicate that the user verification status has pending gifter profile.
     */
    public function pendingGifterProfile(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 0,
            'user_profile_status' => 0,
        ]);
    }
}
