<?php

namespace Tests\Feature;

use App\EmailService;
use App\Http\Controllers\EmailPreferenceController;
use App\Mail\FounderCongratulations;
use App\Mail\PublishYourFirstItem;
use App\Models\MarketingSuppression;
use App\Models\User;
use App\Support\MarketingConsent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * UK direct-marketing consent (client brief, 23 Aug 2026).
 *
 * Everything asserted here is a compliance position rather than a behaviour
 * anyone will notice day to day, which is exactly why it needs pinning: the
 * failure mode of all of it is "we quietly mailed people who never agreed",
 * and nothing in the product surfaces that.
 */
class MarketingConsentTest extends TestCase
{
    use RefreshDatabase;

    /** The signup payload minus whatever the test is actually about. */
    private function signupPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Person',
            'username' => 'testperson',
            'email' => 'test.person@gmail.com',
            'password' => 'Str0ng!Passw0rd',
            'password_confirmation' => 'Str0ng!Passw0rd',
            'role' => 0,
            'country' => 'GB',
            'country_code' => 'GB',
        ], $overrides);
    }

    /**
     * 🚨 THE ONE THAT MATTERS. An unticked box must still create the account —
     * marketing consent may never be a condition of registering (brief §1).
     */
    public function test_an_account_is_created_when_the_marketing_box_is_left_unticked(): void
    {
        $this->post(route('register'), $this->signupPayload());

        $user = User::where('email', 'test.person@gmail.com')->first();

        $this->assertNotNull($user, 'Leaving the marketing box unticked must not block registration.');
        $this->assertFalse((bool) $user->marketing_email_consent);
        $this->assertFalse((bool) $user->marketing_emails_enabled);

        // Never asked for is not the same as withdrawn — no provenance, and no
        // unsubscribe timestamp.
        $this->assertNull($user->marketing_consent_timestamp);
        $this->assertNull($user->marketing_consent_source);
        $this->assertNull($user->marketing_consent_version);
        $this->assertNull($user->marketing_unsubscribed_at);
    }

    /** Ticking it records the consent AND its proof, in one write. */
    public function test_ticking_the_box_records_consent_with_its_proof(): void
    {
        $this->post(route('register'), $this->signupPayload([
            'marketing_opt_in' => true,
            'role' => 1,
            'creator_email_receipt_ack' => true,
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ]));

        $user = User::where('email', 'test.person@gmail.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue((bool) $user->marketing_email_consent);
        $this->assertTrue((bool) $user->marketing_emails_enabled);
        $this->assertNotNull($user->marketing_consent_timestamp);
        $this->assertSame('creator_signup', $user->marketing_consent_source);
        $this->assertSame(config('marketing_consent.current'), $user->marketing_consent_version);

        // The append-only half of the proof: the users row gets overwritten
        // every time somebody changes their mind, the log does not.
        $this->assertDatabaseHas('email_preference_logs', [
            'user_id' => $user->id,
            'source' => 'creator_signup',
        ]);
    }

    /**
     * 🚨 Withdrawal must NOT erase the provenance of the original opt-in.
     * "Never agreed" and "agreed in March, withdrew in August" are different
     * facts and the audit trail has to keep telling them apart.
     */
    public function test_unsubscribing_keeps_the_original_consent_provenance(): void
    {
        $user = User::factory()->create(
            MarketingConsent::attributesForGrant('gifter_signup')
        );

        $grantedAt = $user->fresh()->marketing_consent_timestamp;

        $this->actingAs($user)->post(route('email.preferences.update'), [
            'marketing_emails_enabled' => false,
        ]);

        $user->refresh();

        $this->assertFalse((bool) $user->marketing_emails_enabled);
        $this->assertFalse((bool) $user->marketing_email_consent);
        $this->assertNotNull($user->marketing_unsubscribed_at);

        // Untouched.
        $this->assertSame('gifter_signup', $user->marketing_consent_source);
        $this->assertEquals(
            $grantedAt?->toDateTimeString(),
            $user->marketing_consent_timestamp?->toDateTimeString(),
        );
    }

    /**
     * 🚨 THE OPT-OUT OUTLIVES THE ACCOUNT (brief §6).
     *
     * A per-user flag dies with the row it sits on. Suppression is keyed on the
     * address, so deleting the account and signing up again with the same inbox
     * cannot silently opt somebody back in.
     */
    public function test_unsubscribing_suppresses_the_address_and_it_survives_the_account(): void
    {
        $user = User::factory()->create([
            'email' => 'gone@gmail.com',
            'marketing_emails_enabled' => true,
        ]);

        $this->get(URL::temporarySignedRoute(
            'email.unsubscribe',
            now()->addDays(30),
            ['user' => $user->id],
        ));

        $this->assertDatabaseHas('marketing_suppressions', ['email' => 'gone@gmail.com']);

        $user->delete();

        $this->assertTrue(MarketingConsent::isSuppressed('gone@gmail.com'));

        // And case does not get anyone off the list.
        $this->assertTrue(MarketingConsent::isSuppressed('GONE@Gmail.com'));
    }

    /** A suppressed address is refused even when the user row says yes. */
    public function test_a_suppressed_address_receives_no_marketing_even_if_the_row_allows_it(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'suppressed@gmail.com',
            // Deliberately contradictory: this is the state a re-registration
            // produces, and the row alone would let the mail through.
            'marketing_emails_enabled' => true,
            'marketing_unsubscribed_at' => null,
        ]);

        MarketingSuppression::create([
            'email' => 'suppressed@gmail.com',
            'suppressed_at' => now(),
            'source' => 'unsubscribe_link',
        ]);

        EmailService::sendMarketingEmail($user, new PublishYourFirstItem($user->id, $user->name));

        Mail::assertNothingSent();
    }

    /** Opting back in is an affirmative act, so it lifts the suppression. */
    public function test_opting_back_in_lifts_the_suppression_and_restamps_consent(): void
    {
        $user = User::factory()->create([
            'email' => 'returning@gmail.com',
            'marketing_emails_enabled' => false,
            'marketing_unsubscribed_at' => now()->subMonth(),
        ]);

        MarketingSuppression::create([
            'email' => 'returning@gmail.com',
            'suppressed_at' => now()->subMonth(),
            'source' => 'unsubscribe_link',
        ]);

        $this->actingAs($user)->post(route('email.preferences.update'), [
            'marketing_emails_enabled' => true,
        ]);

        $user->refresh();

        $this->assertTrue((bool) $user->marketing_email_consent);
        $this->assertNull($user->marketing_unsubscribed_at);
        $this->assertSame('settings_page', $user->marketing_consent_source);
        $this->assertFalse(MarketingConsent::isSuppressed('returning@gmail.com'));
    }

    /**
     * ⚠️ Existing accounts are NOT retrospectively marked as consenting
     * (brief §8). A row that predates consent capture keeps its send switch and
     * gains no consent record — the two must stay distinguishable, because only
     * one of them is evidence.
     */
    public function test_an_account_predating_consent_capture_is_not_treated_as_consenting(): void
    {
        $user = User::factory()->create([
            'marketing_emails_enabled' => true,
            'marketing_email_consent' => false,
            'marketing_consent_timestamp' => null,
        ]);

        $this->assertTrue((bool) $user->marketing_emails_enabled);
        $this->assertFalse((bool) $user->marketing_email_consent);
    }

    /**
     * ⚠️ Suppression bookkeeping must never break an unsubscribe. Every caller
     * sits inside a click where the opt-out itself has already been written.
     */
    public function test_a_broken_suppression_write_never_throws(): void
    {
        MarketingConsent::suppress(null, 'unsubscribe_link');
        MarketingConsent::suppress('not-an-email', 'unsubscribe_link');
        MarketingConsent::unsuppress(null);

        $this->assertFalse(MarketingConsent::isSuppressed(null));
    }

    /** The wording shown and the version recorded come from one place. */
    public function test_the_consent_wording_is_served_from_config(): void
    {
        $this->assertNotSame('', MarketingConsent::currentLabel());
        $this->assertSame(
            config('marketing_consent.versions.'.MarketingConsent::currentVersion().'.label'),
            MarketingConsent::currentLabel(),
        );
    }

    /**
     * 🚨 A MISCONFIGURED VERSION MUST NOT SILENTLY REMOVE THE CHECKBOX.
     *
     * `ReviewStep.jsx` guards the checkbox on this string, so an empty label
     * means no box on the signup form, no consent captured from anybody, and
     * no error anywhere — the one failure of this feature that could run for
     * months unnoticed. A typo while bumping `current` is all it takes.
     */
    public function test_a_missing_wording_version_falls_back_rather_than_hiding_the_checkbox(): void
    {
        config(['marketing_consent.current' => 'v99-does-not-exist']);

        $label = MarketingConsent::currentLabel();

        $this->assertNotSame('', $label, 'An unknown version must not render an empty label — the checkbox would disappear.');

        // The version RECORDED is still the configured one, so the log and the
        // stored value together say what actually happened.
        $this->assertSame('v99-does-not-exist', MarketingConsent::currentVersion());
    }

    /** With no wording configured at all there is nothing to fall back to. */
    public function test_an_entirely_empty_wording_config_returns_an_empty_label(): void
    {
        config(['marketing_consent.versions' => []]);

        $this->assertSame('', MarketingConsent::currentLabel());
    }

    /**
     * 🚨 Registration must not be able to require the marketing box. A rule of
     * `accepted`/`required` here would turn an opt-in into forced consent,
     * which is worth nothing — and it is a one-word edit away at all times.
     */
    public function test_the_signup_route_never_requires_marketing_consent(): void
    {
        $response = $this->post(route('register'), $this->signupPayload());

        $response->assertSessionDoesntHaveErrors('marketing_opt_in');
    }

    /**
     * 🚨 Every marketing email must offer an unsubscribe (brief §4).
     *
     * `FounderCongratulations` shipped without one while being sent through
     * `sendMarketingEmail`, so this is a regression test, not a hypothetical.
     */
    public function test_the_founder_congratulations_email_carries_an_unsubscribe_link(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $body = (new FounderCongratulations($creator, 2500.0))->render();

        $this->assertStringContainsString('/unsubscribe/', $body);
        $this->assertStringContainsString('Unsubscribe', $body);
    }

    /**
     * 🚨 A marketing mailable with no unsubscribe link must be LOGGED, and must
     * still SEND.
     *
     * Blocking would trade a recoverable compliance defect for an outage — one
     * missing footer would stop an entire campaign. The warning is the thing a
     * person acts on. Nothing else was enforcing this: NotificationDispatcher
     * takes a mailable FQCN straight from a payload.
     */
    public function test_a_marketing_mailable_without_an_unsubscribe_link_is_logged_but_still_sent(): void
    {
        Mail::fake();
        Log::spy();

        $user = User::factory()->create(['marketing_emails_enabled' => true]);

        EmailService::sendMarketingEmail($user, new MarketingMailableWithNoFooter);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn ($message) => str_contains($message, 'no unsubscribe link'))
            ->atLeast()->once();

        // 🚨 Still sent. A warning, never a block.
        Mail::assertSent(MarketingMailableWithNoFooter::class);
    }

    /** Transactional mail has no consent gate and must be unaffected. */
    public function test_transactional_mail_is_not_gated_by_marketing_consent(): void
    {
        $user = User::factory()->create([
            'marketing_emails_enabled' => false,
            'marketing_unsubscribed_at' => now(),
        ]);

        // The preference catalogue is the list of things a person CAN switch
        // off. Nothing security, legal or transactional may appear in it.
        $switchable = array_merge(
            ['marketing_emails_enabled'],
            EmailPreferenceController::CATEGORIES,
        );

        foreach (['password', 'security', 'receipt', 'payout', 'verification'] as $forbidden) {
            foreach ($switchable as $column) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $column,
                    "No transactional mail may have an opt-out switch ({$column}).",
                );
            }
        }

        $this->assertFalse((bool) $user->marketing_emails_enabled);
    }
}

/** A deliberately non-compliant marketing mailable, for the guard test above. */
class MarketingMailableWithNoFooter extends Mailable
{
    public function build()
    {
        return $this->html('<p>Buy our thing. No way out of this email.</p>');
    }
}
