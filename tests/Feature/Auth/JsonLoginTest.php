<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JsonLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user
        $this->testUser = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'username' => 'testuser',
        ]);
    }

    /** @test */
    public function it_returns_json_error_for_wrong_credentials_when_json_expected()
    {
        $response = $this->postJson('/verify/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
                ->assertJson([
                    'message' => trans('auth.failed'),
                    'errors' => [
                        'email' => [trans('auth.failed')]
                    ]
                ]);
    }

    /** @test */
    public function it_returns_json_success_for_valid_credentials_when_json_expected()
    {
        $response = $this->postJson('/verify/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Logged in successfully.',
                ])
                ->assertJsonStructure([
                    'success',
                    'message', 
                    'redirect_url'
                ]);
        
        $this->assertAuthenticated();
    }

    /** @test */
    public function it_returns_json_error_for_rate_limited_requests_when_json_expected()
    {
        // Make 5 failed attempts to trigger rate limiting
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/verify/login', [
                'email' => 'test@example.com',
                'password' => 'wrongpassword',
            ]);
        }

        $response->assertStatus(429)
                ->assertJsonStructure([
                    'message',
                    'errors' => [
                        'email'
                    ]
                ]);
    }

    /** @test */
    public function it_still_redirects_for_non_json_requests()
    {
        $response = $this->post('/verify/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        // Should redirect back with errors, not return JSON
        $response->assertRedirect();
        $response->assertSessionHasErrors(['email']);
    }
}