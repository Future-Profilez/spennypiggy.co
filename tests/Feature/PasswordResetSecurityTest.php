<?php

namespace Tests\Feature;

use App\Jobs\ForgotPassword;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Queue;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

/**
 * The reset link used to be the user's `uuid` and nothing else.
 *
 * `uuid` is a PUBLIC identifier — it is in profile payloads and item routes all
 * over this codebase — and `forgot-password` is unauthenticated, so the whole
 * takeover was: request a reset for the victim's email (which set the only guard,
 * `expired_at`, into the future), then POST a new password at their uuid.
 *
 * These tests exist so that never comes back.
 */
class PasswordResetSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $email = 'victim@example.com'): User
    {
        return User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Victim',
            'email' => $email,
            'username' => 'victim_user',
            'password' => Hash::make('OriginalPassw0rd!'),
            'role' => 1,
        ]);
    }

    public function test_a_uuid_alone_cannot_change_a_password(): void
    {
        $user = $this->makeUser();

        // The attacker triggers the reset themselves, exactly as before.
        $this->postJson(route('password.email'), ['email' => $user->email])
            ->assertJson(['status' => true]);

        $this->post(route('changePassword', ['uuid' => $user->uuid]), [
            'password' => 'AttackerPassw0rd!',
            'password_confirmation' => 'AttackerPassw0rd!',
        ])->assertSessionHasErrors('token');

        $this->assertTrue(Hash::check('OriginalPassw0rd!', $user->fresh()->password));
    }

    public function test_a_forged_token_is_refused(): void
    {
        $user = $this->makeUser();
        Password::broker()->createToken($user);

        $this->post(route('changePassword', ['uuid' => $user->uuid]), [
            'token' => 'not-the-real-token',
            'password' => 'AttackerPassw0rd!',
            'password_confirmation' => 'AttackerPassw0rd!',
        ])->assertSessionHas('error');

        $this->assertTrue(Hash::check('OriginalPassw0rd!', $user->fresh()->password));
    }

    public function test_a_valid_token_resets_the_password_once(): void
    {
        $user = $this->makeUser();
        $token = Password::broker()->createToken($user);
        $user->forceFill(['expired_at' => Carbon::now()->addMinutes(10)])->save();

        $this->post(route('changePassword', ['uuid' => $user->uuid]), [
            'token' => $token,
            'password' => 'BrandNewPassw0rd!',
            'password_confirmation' => 'BrandNewPassw0rd!',
        ])->assertRedirect(route('login'));

        $this->assertTrue(Hash::check('BrandNewPassw0rd!', $user->fresh()->password));

        // Single use — replaying the same link must not work.
        $this->post(route('changePassword', ['uuid' => $user->uuid]), [
            'token' => $token,
            'password' => 'SecondAttemptPassw0rd!',
            'password_confirmation' => 'SecondAttemptPassw0rd!',
        ])->assertSessionHas('error');

        $this->assertTrue(Hash::check('BrandNewPassw0rd!', $user->fresh()->password));
    }

    public function test_an_expired_link_is_refused(): void
    {
        $user = $this->makeUser();
        $token = Password::broker()->createToken($user);
        $user->forceFill(['expired_at' => Carbon::now()->subMinute()])->save();

        $this->post(route('changePassword', ['uuid' => $user->uuid]), [
            'token' => $token,
            'password' => 'BrandNewPassw0rd!',
            'password_confirmation' => 'BrandNewPassw0rd!',
        ])->assertSessionHas('error');

        $this->assertTrue(Hash::check('OriginalPassw0rd!', $user->fresh()->password));
    }

    public function test_a_weak_password_is_refused(): void
    {
        $user = $this->makeUser();
        $token = Password::broker()->createToken($user);
        $user->forceFill(['expired_at' => Carbon::now()->addMinutes(10)])->save();

        // `min:6` used to be the whole rule here — the weakest gate on the platform
        // sat on the one endpoint that replaces a password.
        $this->post(route('changePassword', ['uuid' => $user->uuid]), [
            'token' => $token,
            'password' => 'abc123',
            'password_confirmation' => 'abc123',
        ])->assertSessionHasErrors('password');

        $this->assertTrue(Hash::check('OriginalPassw0rd!', $user->fresh()->password));
    }

    public function test_the_reset_mail_carries_a_token(): void
    {
        Queue::fake();
        $user = $this->makeUser();

        $this->postJson(route('password.email'), ['email' => $user->email])
            ->assertJson(['status' => true]);

        Queue::assertPushed(ForgotPassword::class, function ($job) use ($user) {
            return $job->user->id === $user->id && $job->token !== '';
        });
    }

    public function test_an_unknown_email_queues_nothing(): void
    {
        Queue::fake();

        $this->postJson(route('password.email'), ['email' => 'nobody@example.com'])
            ->assertJson(['status' => false]);

        Queue::assertNothingPushed();
    }
}
