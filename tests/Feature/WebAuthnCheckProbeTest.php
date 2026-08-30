<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * `POST /webauthn/check` is a BACKGROUND PROBE fired from the login form while the
 * person is still typing their address. `$request->validate()` throws a
 * ValidationException, which implements Throwable, so the controller's catch — written
 * for a real fault — caught it, answered 500 and logged at ERROR level. One person
 * typing on an iPhone produced three production alerts (JAVASCRIPT-REACT-AE).
 */
class WebAuthnCheckProbeTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_half_typed_address_is_answered_quietly(): void
    {
        Log::spy();

        $this->postJson('/webauthn/check', ['email' => 'naveen@'])
            ->assertOk()
            ->assertJson([
                'has_passkey' => false,
                'user_exists' => false,
            ]);

        Log::shouldNotHaveReceived('error');
    }

    public function test_a_missing_address_is_answered_quietly(): void
    {
        Log::spy();

        $this->postJson('/webauthn/check', [])->assertOk();

        Log::shouldNotHaveReceived('error');
    }

    public function test_a_valid_address_with_no_account_reports_no_user(): void
    {
        $this->postJson('/webauthn/check', ['email' => 'nobody@example.com'])
            ->assertOk()
            ->assertJson(['user_exists' => false]);
    }

    public function test_a_real_account_is_still_looked_up(): void
    {
        $user = User::factory()->create();

        $this->postJson('/webauthn/check', ['email' => $user->email])
            ->assertOk()
            ->assertJson([
                'user_exists' => true,
                'has_passkey' => false,
            ]);
    }
}
