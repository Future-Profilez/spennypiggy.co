<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * 🚨 "LOG OUT EVERYWHERE" ONLY WORKS IF `AuthenticateSession` IS IN THE WEB GROUP.
 *
 * `Auth::logoutOtherDevices()` rotates the password hash and nothing else. It is
 * the middleware that compares the hash stored in each session against the
 * user's current one and turns the stale ones away. Until 24 Aug 2026 it was not
 * registered, so changing a password left every other session signed in — the
 * opposite of what somebody resetting a password after a compromise believes has
 * happened.
 *
 * ⚠️ These assert BEHAVIOUR, not registration. A test that only checked the
 * middleware appears in the array would pass with it in the wrong position,
 * where it cannot see the authenticated user.
 */
class LogOutEverywhereTest extends TestCase
{
    use RefreshDatabase;

    private const SESSION_KEY = 'password_hash_web';

    public function test_a_session_holding_a_stale_password_hash_is_signed_out(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-horse-battery')]);

        // A second device: signed in, but carrying the hash from BEFORE the
        // password was changed elsewhere.
        $this->actingAs($user)
            ->withSession([self::SESSION_KEY => 'hash-from-before-the-change'])
            ->get('/');

        $this->assertGuest();
    }

    /**
     * 🚨 THE FACT THAT MADE THIS SAFE TO TURN ON. A session that predates the
     * middleware carries no stored hash at all, and the vendor code STORES it
     * rather than logging the user out — so enabling this did not sign out
     * everybody who was already signed in.
     */
    public function test_a_session_with_no_stored_hash_is_adopted_not_signed_out(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-horse-battery')]);

        $this->actingAs($user);
        $this->flushSession();
        $this->actingAs($user);

        $this->get('/')->assertOk();

        $this->assertAuthenticatedAs($user);
        $this->assertSame($user->getAuthPassword(), session(self::SESSION_KEY));
    }

    /** ⚠️ A signed-out visitor must be untouched — the middleware no-ops with no user. */
    public function test_a_guest_is_unaffected(): void
    {
        $this->get('/')->assertOk();
        $this->assertGuest();
    }

    /**
     * The end-to-end promise: after `logoutOtherDevices`, the hash every OTHER
     * session is holding no longer matches, which is exactly what signs them out.
     */
    public function test_changing_the_password_invalidates_the_hash_other_sessions_hold(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password-here')]);
        $hashOtherDevicesHold = $user->getAuthPassword();

        /*
         * ⚠️ `logoutOtherDevices()` takes the CURRENT password, not a new one —
         * it verifies it with `Hash::check` and then RE-hashes it, producing a
         * different hash string for the same password. That new hash is what no
         * other session is holding, which is what signs them out.
         * `PasswordController` calls it with the already-updated password, which
         * is why the order of operations there is load-bearing.
         */
        $this->actingAs($user);
        Auth::logoutOtherDevices('old-password-here');

        $this->assertNotSame($hashOtherDevicesHold, $user->fresh()->getAuthPassword());

        // And a device still holding the old one is now refused.
        $this->actingAs($user->fresh())
            ->withSession([self::SESSION_KEY => $hashOtherDevicesHold])
            ->get('/');

        $this->assertGuest();
    }
}
