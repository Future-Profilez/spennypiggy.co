<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `ProfileController::updateProfile` wraps its whole body in
 * `try { ... } catch (\Throwable $e)`, and `ValidationException` IMPLEMENTS
 * `Throwable`. So every field error on the profile form was caught by the
 * handler meant for crashes and answered with the flash string
 * "Something went wrong while updating your profile." and an EMPTY error bag:
 * the creator was told the site had broken, and never which field to fix.
 *
 * These tests fail against the pre-fix controller and pass after it, which is
 * the only thing that distinguishes "a validation error" from "a crash" on this
 * route from the outside.
 */
class ProfileUpdateValidationTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'country' => 'India',
            'identity_status' => 1,
        ], $overrides))->refresh();
    }

    private function payload(User $user, array $overrides = []): array
    {
        return array_merge([
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'bio' => $user->bio,
            'gender' => 'they',
            'country' => $user->country,
            'social_handle' => '',
        ], $overrides);
    }

    public function test_a_duplicate_email_is_reported_on_the_field_not_as_a_crash(): void
    {
        $taken = $this->creator(['email' => 'taken@example.com']);
        $user = $this->creator();

        $response = $this->actingAs($user)
            ->from(route('edit-profile'))
            ->post(route('edit-profile'), $this->payload($user, ['email' => $taken->email]));

        $response->assertSessionHasErrors('email');
        $response->assertSessionMissing('error');
    }

    public function test_a_bio_over_the_limit_is_reported_on_the_field(): void
    {
        $user = $this->creator();

        $response = $this->actingAs($user)
            ->from(route('edit-profile'))
            ->post(route('edit-profile'), $this->payload($user, ['bio' => str_repeat('a', 300)]));

        $response->assertSessionHasErrors('bio');
        $response->assertSessionMissing('error');
    }

    public function test_an_avatar_modifier_the_regex_refuses_is_reported_on_the_field(): void
    {
        $user = $this->creator();

        $response = $this->actingAs($user)
            ->from(route('edit-profile'))
            ->post(route('edit-profile'), $this->payload($user, [
                'avatar' => [
                    'uuid' => '44444444-4444-4444-8444-444444444444',
                    // A space is outside /^[-\/:.,%~\w]+$/.
                    'cdnUrlModifiers' => '-/crop/1:1/center/ bad',
                ],
            ]));

        $response->assertSessionHasErrors('avatar.cdnUrlModifiers');
        $response->assertSessionMissing('error');
    }

    public function test_a_valid_save_still_succeeds(): void
    {
        $user = $this->creator();

        $response = $this->actingAs($user)
            ->post(route('edit-profile'), $this->payload($user, ['country' => 'United Kingdom']));

        $response->assertSessionHasNoErrors();
        $this->assertSame('United Kingdom', $user->refresh()->country);
    }
}
