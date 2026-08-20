<?php

namespace Tests\Feature;

use App\Models\AllowedDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    /**
     * ⚠️ THE MAIL-SERVER VERDICT IS SEEDED, NOT LOOKED UP.
     *
     * This asserted that `test@invalid.com` is refused — but `invalid.com` has
     * live MX **and** A records (checked: both return true), so
     * `EmailDomainPolicy` accepts it and always should. The test was passing on
     * an assumption about somebody else's DNS, and failed the day that
     * assumption stopped holding.
     *
     * That is the exact fault `EmailDomainPolicyTest` documents and guards
     * against: "a suite whose result depends on the network, or on whether a
     * third party's domain is up today, fails for reasons unrelated to this
     * code". It seeds `email_mx_ok:<domain>` in the cache; so does this now.
     *
     * The domain is also switched to a disposable one, which is refused by the
     * BLOCKLIST rather than by DNS — a rule we own, on a domain we control the
     * verdict for.
     */
    public function test_registration_validation_fails_with_invalid_email_domain(): void
    {
        // No mail server, and never asked over the network.
        Cache::put('email_mx_ok:yopmail.com', false, now()->addDay());

        $response = $this->postJson(route('register.validate'), [
            'email' => 'test@yopmail.com',
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
