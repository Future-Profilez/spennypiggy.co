<?php

namespace Tests\Feature;

use App\Console\Commands\ReengageStuckIdentityChecks;
use App\Jobs\SendEngagementNotification;
use App\Mail\IdentityCheckReengage;
use App\Models\User;
use App\Support\IdentityFailureReason;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class IdentityReengageTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'email_verified_at' => now(),
            'profile_status_lock' => 2,
            'stripe_details_submitted' => 1,
            'identity_status' => 0,
            'suspended_account' => 0,
        ], $attributes));
    }

    public function test_the_four_reasons_are_told_apart_and_fraud_is_excluded(): void
    {
        $this->assertSame('never_opened', ReengageStuckIdentityChecks::reasonFor($this->creator()));

        $this->assertSame('abandoned', ReengageStuckIdentityChecks::reasonFor($this->creator([
            'identity_status' => 2,
            'identity_session_status' => 'requires_input',
        ])));

        $this->assertSame('document_failed', ReengageStuckIdentityChecks::reasonFor($this->creator([
            'identity_verification_error' => IdentityFailureReason::payload('document_unverified_other', 'The document is invalid.'),
        ])));

        $this->assertSame('consent_declined', ReengageStuckIdentityChecks::reasonFor($this->creator([
            'identity_verification_error' => IdentityFailureReason::payload('consent_declined'),
        ])));

        // 🚨 Never invited to "try again": that creator gets a support ticket instead.
        $this->assertNull(ReengageStuckIdentityChecks::reasonFor($this->creator([
            'identity_status' => 3,
            'identity_verification_error' => IdentityFailureReason::payload('fraud_suspected'),
        ])));
    }

    /** ONE send per creator per reason, for ever ("ak baar"). */
    public function test_it_sends_once_and_never_repeats(): void
    {
        Queue::fake();
        $user = $this->creator();

        $this->artisan('identity:reengage-stuck')->assertSuccessful();
        $this->artisan('identity:reengage-stuck')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 1);
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $user->id,
            'type' => ReengageStuckIdentityChecks::TYPE,
            'dedup_key' => 'never_opened',
        ]);
    }

    public function test_a_fraud_flagged_creator_is_skipped(): void
    {
        Queue::fake();
        $this->creator(['identity_status' => 3, 'identity_verification_error' => IdentityFailureReason::payload('fraud_suspected')]);

        $this->artisan('identity:reengage-stuck')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_every_reason_has_its_own_subject_and_the_mail_carries_the_trust_facts(): void
    {
        $subjects = array_map(fn ($r) => IdentityCheckReengage::subjectLine($r), IdentityCheckReengage::REASONS);
        $this->assertCount(4, array_unique($subjects));

        $user = $this->creator();
        $html = (new IdentityCheckReengage($user->id, 'Ben', 'document_failed'))->render();

        $this->assertStringContainsString('checked by Stripe', $html);
        $this->assertStringContainsString('never uploaded to or stored on Spenny Piggy', $html);
        $this->assertStringContainsString('/stripe/identity-verification', $html);
    }
}
