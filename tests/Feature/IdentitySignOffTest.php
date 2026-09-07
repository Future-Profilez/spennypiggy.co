<?php

namespace Tests\Feature;

use App\Models\IdentityReview;
use App\Models\User;
use App\Support\IdentityRejection;
use App\Support\IdentityReverifiedAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The website half of the ID sign-off: what a refusal DOES to an account, and
 * what a re-verify undoes.
 */
class IdentitySignOffTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'identity_status' => 1,
        ], $attributes));
    }

    public function test_a_refusal_stops_the_account_with_its_own_reason_code(): void
    {
        $user = $this->creator();

        IdentityRejection::apply($user, 'The ID is not the person on the profile.', 7);

        $user->refresh();

        $this->assertSame(1, (int) $user->suspended_account);
        $this->assertSame(IdentityRejection::REASON_CODE, $user->suspension_reason_code);
        $this->assertSame('The ID is not the person on the profile.', $user->suspension_note);
        // 🚨 The claim marker MUST be null, or the website's own sweep never
        // picks the account up and no subscription is ever paused.
        $this->assertNull($user->suspension_enforced_at);
    }

    public function test_a_refusal_never_overwrites_somebody_elses_suspension(): void
    {
        $user = $this->creator([
            'suspended_account' => 1,
            'suspension_reason_code' => 'policy_violation',
            'suspension_note' => 'Repeated breaches.',
        ]);

        $this->assertFalse(IdentityRejection::apply($user, 'ID problem'));

        $user->refresh();
        $this->assertSame('policy_violation', $user->suspension_reason_code);
        $this->assertSame('Repeated breaches.', $user->suspension_note);
    }

    public function test_lifting_only_touches_a_hold_this_feature_applied(): void
    {
        $policy = $this->creator([
            'suspended_account' => 1,
            'suspension_reason_code' => 'policy_violation',
        ]);

        $this->assertFalse(IdentityRejection::lift($policy));
        $this->assertSame(1, (int) $policy->fresh()->suspended_account);
    }

    public function test_the_re_verified_alert_fires_only_for_a_creator_who_was_refused(): void
    {
        config(['alerts.enabled' => true]);
        Mail::fake();

        $neverRefused = $this->creator();
        $this->assertFalse(IdentityReverifiedAlert::notify($neverRefused));

        $refused = $this->creator();
        IdentityReview::create([
            'user_id' => $refused->id,
            'username' => $refused->username,
            'decision' => IdentityReview::DECISION_REJECTED,
            'reason_type' => IdentityReview::REASON_MISMATCH,
            'notes' => 'Not the same person.',
        ]);

        $this->assertTrue(IdentityReverifiedAlert::notify($refused));
    }

    public function test_nothing_on_this_path_throws(): void
    {
        // Every caller is a Stripe webhook or an admin request that has already
        // written the decision. A failure here must never surface as an error.
        $ghost = new User(['id' => 999999]);

        $this->assertFalse(IdentityRejection::apply($ghost, 'x'));
        $this->assertFalse(IdentityRejection::lift($ghost));
        $this->assertFalse(IdentityReverifiedAlert::notify($ghost));
    }

    public function test_the_reason_type_decides_what_the_creator_is_told_to_do(): void
    {
        $document = new IdentityReview(['reason_type' => IdentityReview::REASON_DOCUMENT]);
        $mismatch = new IdentityReview(['reason_type' => IdentityReview::REASON_MISMATCH]);

        // 🚨 Telling somebody whose ID is not their own to "run the check again"
        // produces the same passport and the same Stripe pass, for ever.
        $this->assertStringContainsString('document', $document->instruction());
        $this->assertStringContainsString('profile photo', $mismatch->instruction());
        $this->assertNotSame($document->instruction(), $mismatch->instruction());
    }

    public function test_the_identity_rejected_reason_exists_and_is_limited_not_suspended(): void
    {
        $reason = config('suspension.reasons.'.IdentityRejection::REASON_CODE);

        $this->assertIsArray($reason, 'The website copy for an ID refusal is missing.');
        // ⚠️ "Suspended" accuses somebody of misconduct. A refused ID check is
        // something to put right, so the tone is `limited` — the client was
        // explicit that calling the softer cases a suspension is too harsh.
        $this->assertSame('limited', $reason['tone']);
        $this->assertArrayHasKey('action', $reason, 'A reason that names a fix must carry a route the account can reach.');
    }

    public function test_the_verified_webhook_no_longer_destroys_the_id_images(): void
    {
        /*
         * 🚨 A SOURCE SCAN, DELIBERATELY. `verificationSessions->redact()`
         * permanently destroys the document images at Stripe with no undo, and
         * it used to run the instant Stripe passed the check — so by the time a
         * reviewer opened the file there was nothing left to compare with the
         * profile photo, on every creator, with nothing wrong in any log. What
         * has to hold is structural: this path must not redact. The admin app
         * redacts once a decision has been taken.
         */
        $source = file_get_contents(app_path('Http/Controllers/StripeWebhookController.php'));
        $source = preg_replace('#/\*.*?\*/#s', '', $source);
        $source = preg_replace('#//[^\n]*#', '', $source);

        $this->assertStringNotContainsString('verificationSessions->redact', $source);
    }
}
