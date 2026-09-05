<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserBackupCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_2fa_qr_generates_secret_key_and_returns_svg_and_key(): void
    {
        $user = User::factory()->create([
            'email' => 'twofa@gmail.com',
            'is_2fa' => 0,
            'tfa_key' => null,
        ]);

        $response = $this->actingAs($user)->getJson('/show-2fa-qr');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonStructure(['status', 'qr_code', 'secret_key']);

        $this->assertNotEmpty($response->json('secret_key'));
        $this->assertStringContainsString('<svg', $response->json('qr_code'));
        $this->assertSame($response->json('secret_key'), $user->fresh()->tfa_key);
    }

    public function test_verification_2fa_with_valid_otp_enables_2fa_and_creates_backup_codes(): void
    {
        $google2fa = app(Google2FA::class);
        $secret = $google2fa->generateSecretKey();

        $user = User::factory()->create([
            'email' => 'twofa@gmail.com',
            'is_2fa' => 0,
            'tfa_key' => $secret,
        ]);

        $validOtp = $google2fa->getCurrentOtp($secret);

        $response = $this->actingAs($user)->postJson('/verification-2fa', [
            'otp' => $validOtp,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(5, 'codes');

        $this->assertSame(1, $user->fresh()->is_2fa);
        $this->assertDatabaseCount('user_backup_codes', 5);
    }

    public function test_verification_2fa_with_invalid_otp_fails_and_does_not_enable_2fa(): void
    {
        $google2fa = app(Google2FA::class);
        $secret = $google2fa->generateSecretKey();

        $user = User::factory()->create([
            'email' => 'twofa@gmail.com',
            'is_2fa' => 0,
            'tfa_key' => $secret,
        ]);

        $response = $this->actingAs($user)->postJson('/verification-2fa', [
            'otp' => '000000',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', false);

        $this->assertSame(0, $user->fresh()->is_2fa);
        $this->assertDatabaseCount('user_backup_codes', 0);
    }

    public function test_switch_2fa_disables_2fa_and_clears_backup_codes_and_secret_key(): void
    {
        $user = User::factory()->create([
            'email' => 'twofa@gmail.com',
            'is_2fa' => 1,
            'tfa_key' => 'OLDSECRETKEY1234',
        ]);

        UserBackupCode::create([
            'user_id' => $user->id,
            'code' => encrypt('BACKUP-1234'),
        ]);

        $response = $this->actingAs($user)->postJson('/switch-2fa', [
            'status' => 0,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('tfa_status', 0);

        $fresh = $user->fresh();
        $this->assertSame(0, $fresh->is_2fa);
        $this->assertNull($fresh->tfa_key);
        $this->assertDatabaseCount('user_backup_codes', 0);
    }

    public function test_login_with_valid_password_and_2fa_otp_authenticates_user(): void
    {
        $google2fa = app(Google2FA::class);
        $secret = $google2fa->generateSecretKey();

        $user = User::factory()->create([
            'email' => 'twofa_login@gmail.com',
            'password' => Hash::make('ValidPass1234!'),
            'is_2fa' => 1,
            'tfa_key' => $secret,
        ]);

        $validOtp = $google2fa->getCurrentOtp($secret);

        $response = $this->postJson('/verify-2fa', [
            'email' => 'twofa_login@gmail.com',
            'password' => 'ValidPass1234!',
            'otp' => $validOtp,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true);

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_with_invalid_2fa_otp_rejects(): void
    {
        $google2fa = app(Google2FA::class);
        $secret = $google2fa->generateSecretKey();

        $user = User::factory()->create([
            'email' => 'twofa_login@gmail.com',
            'password' => Hash::make('ValidPass1234!'),
            'is_2fa' => 1,
            'tfa_key' => $secret,
        ]);

        $response = $this->postJson('/verify-2fa', [
            'email' => 'twofa_login@gmail.com',
            'password' => 'ValidPass1234!',
            'otp' => '000000',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', false);

        $this->assertGuest();
    }
}
