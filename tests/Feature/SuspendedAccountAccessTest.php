<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SuspendedAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A suspended account signs in, reads, and writes nothing.
 *
 * 🚨 THE MIDDLEWARE USED TO FORCE-LOGOUT ON EVERY REQUEST, so the one person who
 * needed to read the reason and message support was the only person who could
 * not. These tests pin the replacement — and, more importantly, they pin that
 * the write side is DENIED BY DEFAULT: the allowlist is the only reason opening
 * the door is safe, and widening it is a one-line change that no build step and
 * no scanner can see.
 */
class SuspendedAccountAccessTest extends TestCase
{
    use RefreshDatabase;

    private function suspendRow(User $user, array $attributes = []): User
    {
        $user->forceFill(array_merge([
            'suspended_account' => 1,
            'suspension_reason_code' => 'policy_violation',
            'suspended_at' => now(),
        ], $attributes))->save();

        return $user->refresh();
    }

    private function suspended(array $attributes = []): User
    {
        $user = User::factory()->create(['role' => 1]);

        $user->forceFill(array_merge([
            'suspended_account' => 1,
            'suspension_reason_code' => 'policy_violation',
            'suspended_at' => now(),
        ], $attributes))->save();

        return $user->refresh();
    }

    public function test_a_suspended_account_can_actually_sign_in(): void
    {
        /*
         * 🚨 FOUR LOGIN PATHS REFUSED A SUSPENDED ACCOUNT OUTRIGHT, AND EVERY ONE
         * OF THEM DEFEATED THE WHOLE FEATURE: password (`store`), the 2FA step,
         * Google (`GoogleController::signIn`) and WebAuthn. Opening the door
         * without removing those is a banner nobody can reach.
         */
        $user = User::factory()->create([
            'role' => 1,
            'password' => bcrypt('correct-horse-battery-staple'),
            'email_verified_at' => now(),
        ]);
        $this->suspendRow($user);

        // ⚠️ The POST handler is `login-user` (`verify/login`), not `login` —
        // that name is the GET form. Posting to it answers 405 and proves nothing.
        $response = $this->post(route('login-user'), [
            'email' => $user->email,
            'password' => 'correct-horse-battery-staple',
        ]);

        $response->assertStatus(200);
        $this->assertAuthenticatedAs($user->fresh());
    }

    public function test_the_owner_sees_their_own_profile_and_not_the_withdrawn_page(): void
    {
        /*
         * 🚨 `/{username}` IS BOTH THE PUBLIC PROFILE AND THE CREATOR'S OWN
         * DASHBOARD. Returning the withdrawn page for everybody meant a suspended
         * creator opening their own account got a notice instead of their account
         * — no banner, no history, no support route — which is exactly what
         * signing in was reopened for.
         */
        $user = User::factory()->create(['role' => 1, 'username' => 'ownercheck']);
        $this->suspendRow($user);

        $this->actingAs($user->fresh())
            ->get('/ownercheck')
            ->assertStatus(200);
    }

    public function test_a_visitor_still_gets_the_withdrawn_page(): void
    {
        $user = User::factory()->create(['role' => 1, 'username' => 'gonecheck']);
        $this->suspendRow($user);

        // 410 Gone, and it must NOT tell a stranger why.
        $this->get('/gonecheck')->assertStatus(410);
    }

    public function test_a_suspended_account_can_still_read_its_own_pages(): void
    {
        $user = $this->suspended();

        $response = $this->actingAs($user)->get(route('email.preferences'));

        $response->assertSuccessful();
        $this->assertTrue(auth()->check(), 'Reading a page must not sign a suspended account out.');
    }

    public function test_a_write_that_is_not_on_the_allowlist_is_refused(): void
    {
        $user = $this->suspended();

        // Any state-changing route that is not named in
        // config('suspension.allowed_write_routes').
        $response = $this->actingAs($user)
            ->from(route('email.preferences'))
            ->post(route('edit-profile'), ['name' => 'New name']);

        $response->assertSessionHasErrors('account');
    }

    public function test_the_allowlisted_writes_still_work(): void
    {
        $user = $this->suspended();

        // Signing out is the one write nobody may ever be locked out of.
        $this->assertContains('logout', (array) config('suspension.allowed_write_routes'));

        $this->actingAs($user)->post(route('logout'));

        $this->assertFalse(auth()->check());
    }

    public function test_an_unsuspended_account_is_untouched(): void
    {
        $user = User::factory()->create(['role' => 1, 'suspended_account' => 0]);

        $response = $this->actingAs($user)
            ->from(route('email.preferences'))
            ->post(route('edit-profile'), ['name' => 'New name']);

        // It may still fail its own validation — what matters is that the
        // suspension middleware did not refuse it.
        $response->assertSessionDoesntHaveErrors('account');
    }

    public function test_a_creator_told_to_renew_can_actually_reach_the_checkout(): void
    {
        /*
         * 🚨 THE WHOLE POINT OF THE BILLING REASON. It says "renew it and
         * everything comes straight back" — and `mandatory.checkout` is a POST,
         * which the middleware refuses by default. Without it on the allowlist
         * the message asks for something the platform then blocks: the same
         * "banner behind a door nobody can open" fault as the login gates.
         */
        $user = $this->suspended(['suspension_reason_code' => 'subscription_unpaid']);

        $this->assertContains('mandatory.checkout', (array) config('suspension.allowed_write_routes'));

        $response = $this->actingAs($user)
            ->from(route('activate-subscription'))
            ->post(route('mandatory.checkout'));

        // It may fail on its own validation or on Stripe — what must NOT happen
        // is the suspension middleware turning it away.
        $response->assertSessionDoesntHaveErrors('account');
    }

    public function test_an_unpaid_subscription_reads_as_limited_not_suspended(): void
    {
        // Client direction, 4 Sep 2026: "suspended is harsh for that."
        $user = $this->suspended(['suspension_reason_code' => 'subscription_unpaid']);

        $copy = SuspendedAccount::copyFor($user);

        $this->assertSame('limited', $copy['tone']);
        $this->assertStringContainsString('limited', strtolower($copy['title']));
        $this->assertStringNotContainsStringIgnoringCase('suspend', $copy['title']);
        // And it must name the way out rather than only pointing at support.
        $this->assertNotNull($copy['action']);
        $this->assertSame(route('activate-subscription'), $copy['action']['url']);
    }

    public function test_a_judged_account_still_reads_as_suspended(): void
    {
        // The softer word must not leak onto a real suspension.
        $copy = SuspendedAccount::copyFor($this->suspended(['suspension_reason_code' => 'policy_violation']));

        $this->assertSame('suspended', $copy['tone']);
        $this->assertStringContainsString('suspended', strtolower($copy['title']));
        $this->assertNull($copy['action'], 'Only support can lift a policy suspension.');
    }

    public function test_an_unknown_tone_falls_back_to_the_heavier_word(): void
    {
        // Softening a real suspension is the costlier direction to be wrong in.
        config(['suspension.reasons.made_up' => ['title' => 'x', 'body' => 'y', 'tone' => 'nonsense']]);

        $copy = SuspendedAccount::copyFor($this->suspended(['suspension_reason_code' => 'made_up']));

        $this->assertSame('suspended', $copy['tone']);
    }

    public function test_a_reason_naming_a_dead_route_does_not_take_every_page_down(): void
    {
        /*
         * 🚨 `route()` THROWS for a name the router does not carry, and this is
         * built inside the SHARED Inertia payload — so one typo in config would
         * 500 every page for every signed-in user, to render a button.
         */
        config(['suspension.reasons.broken' => [
            'title' => 'x', 'body' => 'y', 'tone' => 'limited',
            'action' => ['label' => 'Go', 'route' => 'this-route-does-not-exist'],
        ]]);

        $copy = SuspendedAccount::copyFor($this->suspended(['suspension_reason_code' => 'broken']));

        $this->assertNull($copy['action']);
    }

    public function test_the_reason_is_resolved_from_the_code_and_never_from_the_admin_note(): void
    {
        $user = $this->suspended([
            'suspension_note' => 'Suspected card testing, watch for re-registration.',
        ]);

        $copy = SuspendedAccount::copyFor($user);

        $this->assertSame(config('suspension.reasons.policy_violation.body'), $copy['body']);
        $this->assertStringNotContainsString('card testing', $copy['body']);
    }

    public function test_an_account_suspended_before_the_column_existed_gets_the_default_copy(): void
    {
        // Every pre-existing suspension: flag set, no code. There is no reason to
        // read and none may be invented.
        $user = User::factory()->create(['role' => 1]);
        $user->forceFill(['suspended_account' => 1])->save();

        $copy = SuspendedAccount::copyFor($user->refresh());

        $this->assertSame(config('suspension.default_reason.body'), $copy['body']);
    }

    public function test_the_doctor_passes_on_this_codebase(): void
    {
        /*
         * 🚨 A DOCTOR NOBODY RUNS IS NOT A GUARD. `suspension:doctor` checks the
         * six things that must agree for this feature to work at all — columns,
         * reason copy, the write allowlist, the login paths staying open, the
         * banner's prop contract, and the sweep being scheduled — and every one
         * of those has been silently wrong at least once. Running it here means
         * the contract is checked on every suite run, not only when somebody
         * remembers to type the command.
         *
         * ⚠️ It is READ-ONLY: no writes, no Stripe, safe in a test and safe on
         * production while something is broken.
         */
        $this->artisan('suspension:doctor')->assertSuccessful();
    }

    public function test_the_banner_reads_the_key_the_server_actually_sends(): void
    {
        /*
         * 🚨 A TWO-LANGUAGE PIN, AND IT CAUGHT A REAL BUG.
         *
         * The prop is built inside the shared USER array (`auth.user.suspension`)
         * and the component first read `auth.suspension` — one level too high, so
         * it was permanently undefined and the banner NEVER RENDERED. Nothing
         * errors on a key an object does not carry: the suspended creator simply
         * saw no explanation, which is indistinguishable from the feature not
         * being deployed. Neither `npm run build` nor any scanner can see that the
         * two halves agree, which is why this is a test.
         */
        $middleware = file_get_contents(base_path('app/Http/Middleware/HandleInertiaRequests.php'));
        $this->assertStringContainsString(
            "'suspension' => SuspendedAccount::payload(\$user),",
            $middleware,
            'The shared payload no longer sends a `suspension` key.'
        );

        $component = file_get_contents(base_path('resources/js/Components/SuspendedBanner.jsx'));
        $this->assertStringContainsString(
            'auth?.user?.suspension',
            $component,
            'The banner must read auth.user.suspension — the prop sits inside the user array.'
        );
    }

    public function test_the_payload_is_null_for_an_account_that_is_not_suspended(): void
    {
        // 🚨 The banner renders on the prop's PRESENCE. An object that is always
        // sent is one truthiness slip away from telling every creator on the
        // platform that they are suspended.
        $user = User::factory()->create(['role' => 1, 'suspended_account' => 0]);

        $this->assertNull(SuspendedAccount::payload($user));
        $this->assertNotNull(SuspendedAccount::payload($this->suspended()));
    }
}
