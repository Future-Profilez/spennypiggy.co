<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebAuthnTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_user_without_passkey()
    {
        $user = User::factory()->create([
            'email' => 'test@gmail.com',
        ]);

        $response = $this->postJson(route('webauthn.check'), [
            'email' => 'test@gmail.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'has_passkey' => false,
                'has_any_passkey' => false,
                'user_exists' => true,
            ]);
    }

    public function test_check_non_existent_user()
    {
        $response = $this->postJson(route('webauthn.check'), [
            'email' => 'nonexistent@gmail.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'has_passkey' => false,
                'user_exists' => false,
            ]);
    }

    public function test_login_options_userless()
    {
        $response = $this->postJson(route('webauthn.login.userless.options'));

        $response->assertStatus(200);
    }

    public function test_register_options()
    {
        $user = User::factory()->create([
            'email' => 'test@gmail.com',
        ]);

        $response = $this->actingAs($user)->postJson(route('webauthn.register.options'));

        $response->assertStatus(200);
    }
}
