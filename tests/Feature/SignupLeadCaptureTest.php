<?php

namespace Tests\Feature;

use App\Console\Commands\PruneSignupLeads;
use App\Mail\SignupWaitlistOpen;
use App\Models\PlatformRiskState;
use App\Models\SignupLead;
use App\Models\User;
use App\Services\SignupLeadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Capturing the person we just refused an account to.
 *
 * 🚨 When the platform risk state is FREEZE, creator registration is refused
 * outright. Until this existed the person got one sentence and nothing else —
 * no waitlist, no address captured, no way back — and every one of those was a
 * click paid acquisition had already been billed for.
 */
class SignupLeadCaptureTest extends TestCase
{
    use RefreshDatabase;

    private function freezePlatform(): void
    {
        PlatformRiskState::create([
            'state' => 'FREEZE',
            'reason_codes' => ['TEST'],
            'set_by' => 'system',
            'metrics_snapshot' => [],
            'started_at' => now(),
        ]);
    }

    private function openPlatform(): void
    {
        PlatformRiskState::create([
            'state' => 'NORMAL',
            'reason_codes' => ['TEST'],
            'set_by' => 'system',
            'metrics_snapshot' => [],
            'started_at' => now(),
        ]);
    }

    private function service(): SignupLeadService
    {
        return app(SignupLeadService::class);
    }

    public function test_a_refused_creator_is_captured_as_a_lead(): void
    {
        $this->freezePlatform();

        $this->post(route('signup.waitlist'), ['email' => 'hopeful@example.com']);

        $this->assertDatabaseHas('signup_leads', [
            'email' => 'hopeful@example.com',
            'reason' => SignupLead::REASON_PLATFORM_FREEZE,
        ]);
    }

    public function test_the_endpoint_answers_identically_whether_or_not_it_stored_anything(): void
    {
        // 🚨 The response must never differ, or this becomes "does this address
        // have a Spenny Piggy account?" for any address a stranger types. What
        // changes is what we STORE, never what we SAY.
        $this->freezePlatform();
        User::factory()->create(['email' => 'taken@example.com']);

        $captured = $this->post(route('signup.waitlist'), ['email' => 'brand-new@example.com']);
        $skipped = $this->post(route('signup.waitlist'), ['email' => 'taken@example.com']);

        $captured->assertOk();
        $skipped->assertOk();
        $this->assertSame($captured->json(), $skipped->json());

        // …and the difference is real: only one row was written.
        $this->assertDatabaseHas('signup_leads', ['email' => 'brand-new@example.com']);
        $this->assertDatabaseMissing('signup_leads', ['email' => 'taken@example.com']);
    }

    public function test_an_address_is_matched_case_insensitively(): void
    {
        // The address typed on the refused form and the one typed on the retry
        // are the same person; two rows would email them twice.
        $this->freezePlatform();

        $this->post(route('signup.waitlist'), ['email' => 'Mixed@Example.com']);
        $this->post(route('signup.waitlist'), ['email' => 'mixed@example.com']);

        $this->assertSame(1, SignupLead::where('email', 'mixed@example.com')->count());
    }

    public function test_registering_closes_a_waiting_lead(): void
    {
        // Without this the notify sweep emails "you can sign up now" to somebody
        // who already did.
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'later@example.com']);

        $this->service()->close('later@example.com');

        $this->assertNotNull(SignupLead::where('email', 'later@example.com')->first()->converted_at);
        $this->assertSame(0, SignupLead::query()->pending()->count());
    }

    public function test_nobody_is_emailed_while_registration_is_still_paused(): void
    {
        // 🚨 The mail says "you can sign up now" and links at the form that would
        // refuse them again. One wrong send and the next one is ignored.
        Mail::fake();
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'waiting@example.com']);

        $this->artisan('signup-leads:notify')->assertSuccessful();

        Mail::assertNothingQueued();
        $this->assertNull(SignupLead::where('email', 'waiting@example.com')->first()->notified_at);
    }

    public function test_a_lead_is_emailed_once_registration_reopens(): void
    {
        Mail::fake();
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'waiting@example.com']);

        $this->openPlatform();
        $this->artisan('signup-leads:notify')->assertSuccessful();

        Mail::assertQueued(SignupWaitlistOpen::class, 1);
        $this->assertNotNull(SignupLead::where('email', 'waiting@example.com')->first()->notified_at);
    }

    public function test_a_second_run_does_not_email_the_same_person_twice(): void
    {
        // `notified_at` is the CLAIM, taken by the same UPDATE that reads it.
        Mail::fake();
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'waiting@example.com']);

        $this->openPlatform();
        $this->artisan('signup-leads:notify')->assertSuccessful();
        $this->artisan('signup-leads:notify')->assertSuccessful();

        Mail::assertQueued(SignupWaitlistOpen::class, 1);
    }

    public function test_a_converted_lead_is_never_told_that_signups_reopened(): void
    {
        Mail::fake();
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'joined@example.com']);
        $this->service()->close('joined@example.com');

        $this->openPlatform();
        $this->artisan('signup-leads:notify')->assertSuccessful();

        Mail::assertNothingQueued();
    }

    public function test_a_dry_run_claims_nothing(): void
    {
        Mail::fake();
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'waiting@example.com']);
        $this->openPlatform();

        $this->artisan('signup-leads:notify', ['--dry-run' => true])->assertSuccessful();

        Mail::assertNothingQueued();
        $this->assertNull(SignupLead::where('email', 'waiting@example.com')->first()->notified_at);
    }

    public function test_max_caps_sends_and_leaves_the_rest_for_the_next_run(): void
    {
        // ⚠️ `--max` caps SENDS, not rows read. Capping the query means a run
        // whose first N rows were ineligible reaches nobody while the rest wait
        // forever, and that gap grows with the table.
        Mail::fake();
        $this->freezePlatform();
        foreach (['a@example.com', 'b@example.com', 'c@example.com'] as $email) {
            $this->post(route('signup.waitlist'), ['email' => $email]);
        }

        $this->openPlatform();
        $this->artisan('signup-leads:notify', ['--max' => 2])->assertSuccessful();

        Mail::assertQueued(SignupWaitlistOpen::class, 2);
        $this->assertSame(1, SignupLead::query()->pending()->count());
    }

    public function test_a_reason_that_is_not_recognised_captures_nothing(): void
    {
        // `reason` is an enum in practice; free text would make the admin
        // breakdown unreadable and the prune unable to tell cohorts apart.
        $this->freezePlatform();

        $lead = $this->service()->capture(
            request(),
            'someone@example.com',
            1,
            'not-a-real-reason',
        );

        $this->assertNull($lead);
        $this->assertDatabaseMissing('signup_leads', ['email' => 'someone@example.com']);
    }

    public function test_prune_removes_stale_rows_and_honours_its_floor(): void
    {
        // 🚨 A contact detail for somebody with no account. Nothing else removes
        // a row, so without this the table is a permanent shadow mailing list.
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'old@example.com']);

        // ⚠️ Written AFTER the insert — Eloquent stamps its own `created_at` and
        // silently discards one passed to create(), so a "200-day-old" row made
        // any other way is brand new and the assertion passes against the wrong
        // data.
        SignupLead::where('email', 'old@example.com')->first()
            ->forceFill(['created_at' => now()->subDays(200)])->saveQuietly();

        $this->post(route('signup.waitlist'), ['email' => 'recent@example.com']);

        $this->artisan('signup-leads:prune')->assertSuccessful();

        $this->assertDatabaseMissing('signup_leads', ['email' => 'old@example.com']);
        $this->assertDatabaseHas('signup_leads', ['email' => 'recent@example.com']);

        // A mistyped --days=0 must not empty the table.
        $this->artisan('signup-leads:prune', ['--days' => 0])->assertSuccessful();
        $this->assertDatabaseHas('signup_leads', ['email' => 'recent@example.com']);
        $this->assertSame(7, PruneSignupLeads::MIN_RETENTION_DAYS);
    }

    public function test_the_endpoint_requires_a_captcha_token_once_a_secret_is_configured(): void
    {
        // 🚨 This is the shape of a bug that passes every local run and fails
        // every production one: `ensureTurnstileVerified` returns early when no
        // secret is set, so a panel that never sends `cf_turnstile_response`
        // looks perfect here and refuses every real visitor. The panel renders a
        // widget and posts the token; this asserts the server half of that
        // contract so the two cannot drift apart again.
        config(['services.turnstile.secret_key' => 'test-secret']);
        $this->freezePlatform();

        $this->post(route('signup.waitlist'), ['email' => 'blocked@example.com'])
            ->assertSessionHasErrors('cf_turnstile_response');

        $this->assertDatabaseMissing('signup_leads', ['email' => 'blocked@example.com']);
    }

    public function test_a_dry_run_prune_deletes_nothing(): void
    {
        $this->freezePlatform();
        $this->post(route('signup.waitlist'), ['email' => 'old@example.com']);
        SignupLead::where('email', 'old@example.com')->first()
            ->forceFill(['created_at' => now()->subDays(200)])->saveQuietly();

        $this->artisan('signup-leads:prune', ['--dry-run' => true])->assertSuccessful();

        $this->assertDatabaseHas('signup_leads', ['email' => 'old@example.com']);
    }
}
