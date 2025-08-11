<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
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
            'type' => fake()->randomElement(['text', 'image']),
            'for_module' => fake()->randomElement(['feed', 'profile']),
            'title' => fake()->sentence(),
            'content' => fake()->paragraph(),
            'image' => null,
            'ai_generated' => false,
            'approved' => true,
        ];
    }

    /**
     * Indicate that the post is not approved.
     */
    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'approved' => false,
        ]);
    }
}
