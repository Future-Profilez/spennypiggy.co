<?php

namespace Tests\Feature;

use App\Models\AllowedDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed allowed domains for testing
        AllowedDomain::firstOrCreate(['name' => 'gmail.com']);
    }

    public function test_registration_validation_passes_with_valid_data(): void
    {
        $response = $this->postJson(route('register.validate'), [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@gmail.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'country' => 'United Kingdom',
            'street_address' => '123 Test Street, Test Area',
            'city' => 'Test City',
            'state' => 'Test State',
            'postal_code' => '12345',
        ]);

        $response->assertStatus(200)
            ->assertJson(['valid' => true]);
    }

    public function test_registration_validation_fails_with_invalid_email_domain(): void
    {
        $response = $this->postJson(route('register.validate'), [
            'email' => 'test@invalid.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_validation_fails_with_password_mismatch(): void
    {
        $response = $this->postJson(route('register.validate'), [
            'password' => 'Password123!',
            'password_confirmation' => 'Password456!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password_confirmation']);
    }

    public function test_registration_validation_fails_with_existing_email(): void
    {
        // Create a user first
        User::factory()->create([
            'email' => 'existing@gmail.com',
        ]);

        $response = $this->postJson(route('register.validate'), [
            'email' => 'existing@gmail.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
