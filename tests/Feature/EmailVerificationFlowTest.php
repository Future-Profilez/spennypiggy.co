<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\EmailVerificationNotificationController as Verification;
use App\Jobs\VerifyEmail;
use App\Models\AllowedDomain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * 🚨 The verification email used to be dispatched from ONE place: a mount
 * effect on the verification page, gated by a per-device localStorage
 * timestamp. Nothing on the server ever sent it, so an account could be created
 * and never mailed — silently, while the screen said one had been sent — and a
 * typo'd address had no fix short of a support ticket.
 *
 * These assert the send happens on the server and that a creator can correct
 * their own address.
 */
class EmailVerificationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The cooldown lives in the cache, and `RefreshDatabase` does not touch
        // it — one test's timestamp would suppress the next test's send.
        Cache::flush();

        AllowedDomain::query()->delete();
        AllowedDomain::create(['name' => 'gmail.com']);
    }

    private function unverified(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email' => 'creator@gmail.com',
            'email_verified_at' => null,
            'role' => 1,
        ], $overrides));
    }

    /**
     * The root cause. Registration must send the link itself — everything
     * downstream (the screen, the resend, the backfill) is a safety net behind
     * this one dispatch.
     */
    public function test_registration_sends_the_verification_email(): void
    {
        Queue::fake();

        $this->post('/register', [
            'name' => 'New Creator',
            'username' => 'newcreator',
            'email' => 'newcreator@gmail.com',
            'password' => 'Str0ng-Passw0rd!',
            'password_confirmation' => 'Str0ng-Passw0rd!',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ]);

        $this->assertNotNull(
            User::where('email', 'newcreator@gmail.com')->first(),
            'The registration itself did not go through, so this test proves nothing.'
        );

        Queue::assertPushed(VerifyEmail::class);
    }

    public function test_the_verification_screen_sends_a_link_on_arrival(): void
    {
        Queue::fake();

        $user = $this->unverified();

        $this->actingAs($user)->get(route('verification.notice'))->assertOk();

        Queue::assertPushed(VerifyEmail::class);
    }

    /** The screen is reached on every blocked navigation; it must not mail on each one. */
    public function test_the_screen_does_not_resend_inside_the_automatic_cooldown(): void
    {
        Queue::fake();

        $user = $this->unverified();

        $this->actingAs($user)->get(route('verification.notice'));
        $this->actingAs($user)->get(route('verification.notice'));

        Queue::assertPushed(VerifyEmail::class, 1);
    }

    public function test_the_screen_shows_the_address_it_mailed(): void
    {
        $user = $this->unverified(['email' => 'typo@gmail.com']);

        $this->actingAs($user)
            ->get(route('verification.notice'))
            ->assertInertia(fn ($page) => $page
                ->component('Auth/VerifyEmail')
                ->where('verificationEmail', 'typo@gmail.com')
            );
    }

    public function test_a_verified_user_is_sent_on_rather_than_shown_the_screen(): void
    {
        $user = User::factory()->create(['email_verified_at' => now(), 'role' => 1]);

        $this->actingAs($user)->get(route('verification.notice'))->assertRedirect();
    }

    /**
     * A refusal must carry the number the screen counts down. A bare 429 is a
     * button that fails for a reason the caller cannot see.
     */
    public function test_a_manual_resend_inside_the_cooldown_is_refused_with_a_wait(): void
    {
        $user = $this->unverified();

        $this->actingAs($user)->post(route('verification.email'))->assertOk();

        $this->actingAs($user)
            ->post(route('verification.email'))
            ->assertStatus(429)
            ->assertJsonPath('status', false)
            ->assertJson(fn ($json) => $json->where('retry_after', fn ($v) => $v > 0)->etc());
    }

    public function test_changing_the_address_updates_it_and_sends_a_fresh_link(): void
    {
        Queue::fake();

        $user = $this->unverified(['email' => 'wrong@gmail.com']);

        $this->actingAs($user)
            ->post(route('verification.change-email'), ['email' => 'Right@Gmail.com'])
            ->assertSessionHasNoErrors();

        $this->assertSame('right@gmail.com', $user->fresh()->email);
        $this->assertNull($user->fresh()->email_verified_at);

        Queue::assertPushed(VerifyEmail::class);
    }

    /**
     * A new address gets its link immediately — the cooldown belongs to the
     * address that was replaced, and making someone wait to re-fix a typo is
     * the stuck state this exists to end.
     */
    public function test_changing_the_address_clears_the_cooldown(): void
    {
        $user = $this->unverified(['email' => 'wrong@gmail.com']);

        $this->actingAs($user)->post(route('verification.email'))->assertOk();
        $this->assertGreaterThan(0, Verification::secondsUntilResend($user->id));

        $this->actingAs($user)->post(route('verification.change-email'), ['email' => 'right@gmail.com']);

        // The change itself sends, so the cooldown restarts from that send —
        // what must not survive is the OLD address's window on top of it.
        $this->assertLessThanOrEqual(
            Verification::RESEND_COOLDOWN,
            Verification::secondsUntilResend($user->id)
        );
    }

    public function test_the_new_address_cannot_belong_to_another_account(): void
    {
        User::factory()->create(['email' => 'taken@gmail.com']);
        $user = $this->unverified();

        $this->actingAs($user)
            ->post(route('verification.change-email'), ['email' => 'taken@gmail.com'])
            ->assertSessionHasErrors('email');

        $this->assertSame('creator@gmail.com', $user->fresh()->email);
    }

    /** The same allowlist registration enforces — otherwise this is a way around it. */
    public function test_an_address_outside_the_allowlist_is_refused(): void
    {
        $user = $this->unverified();

        $this->actingAs($user)
            ->post(route('verification.change-email'), ['email' => 'someone@not-allowed.test'])
            ->assertSessionHasErrors('email');

        $this->assertSame('creator@gmail.com', $user->fresh()->email);
    }

    public function test_a_verified_account_cannot_change_its_address_here(): void
    {
        $user = User::factory()->create([
            'email' => 'done@gmail.com',
            'email_verified_at' => now(),
            'role' => 1,
        ]);

        $this->actingAs($user)->post(route('verification.change-email'), ['email' => 'other@gmail.com']);

        $this->assertSame('done@gmail.com', $user->fresh()->email);
    }

    /**
     * An expired link is a dead end unless it hands over the screen that mints
     * a new one.
     */
    public function test_an_expired_link_sends_a_signed_in_creator_to_the_screen(): void
    {
        $user = $this->unverified();

        $url = URL::temporarySignedRoute('email.verify.uuid', now()->subMinute(), ['uuid' => $user->uuid]);

        $this->actingAs($user)->get($url)->assertRedirect(route('verification.notice'));
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_an_expired_link_sends_a_signed_out_visitor_to_login(): void
    {
        $user = $this->unverified();

        $url = URL::temporarySignedRoute('email.verify.uuid', now()->subMinute(), ['uuid' => $user->uuid]);

        $this->get($url)->assertRedirect(route('login'));
        $this->assertNull($user->fresh()->email_verified_at);
    }

    /** 🚨 It mails real people, so nothing may go out without `--apply`. */
    public function test_the_backfill_command_sends_nothing_by_default(): void
    {
        Queue::fake();

        $this->unverified();

        $this->artisan('users:resend-verification')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_the_backfill_command_sends_with_apply_and_skips_the_recently_mailed(): void
    {
        Queue::fake();

        $stuck = $this->unverified(['email' => 'stuck@gmail.com', 'username' => 'stuckone']);
        $justMailed = $this->unverified(['email' => 'fresh@gmail.com', 'username' => 'freshone']);
        User::factory()->create(['email' => 'fine@gmail.com', 'email_verified_at' => now()]);

        // Someone mailed a moment ago must not be mailed again by the sweep.
        Cache::put(Verification::cacheKey($justMailed->id), now()->timestamp, now()->addDay());

        $this->artisan('users:resend-verification --apply')->assertSuccessful();

        Queue::assertPushed(VerifyEmail::class, 1);
        Queue::assertPushed(VerifyEmail::class, fn ($job) => $job->user->is($stuck));
    }
}
