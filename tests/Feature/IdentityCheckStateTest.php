<?php

namespace Tests\Feature;

use App\Console\Commands\NudgeStuckJourney;
use App\Http\Controllers\StripeWebhookController;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Support\IdentityCheckState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 THE BUG THIS PINS. `users.identity_status = 2` is written when the Stripe Identity
 * SESSION IS CREATED, not when a document is submitted — and Stripe emits no event at all
 * for a creator who opens the check and closes the tab. Every surface read 2 as "with our
 * team": an IN REVIEW pill, "Your ID check is being processed", no step number, and for
 * some screens no button. That is a wait with no end on a step only the creator can finish.
 *
 * Found live: a creator sat on it for days with `identity_verified_at` null, no stored
 * error, and nothing in any log — because nothing had gone wrong. Nothing had happened.
 */
class IdentityCheckStateTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'identity_status' => IdentityCheckState::STATUS_OPEN,
            'stripe_user_id' => 'vs_test_'.uniqid(),
        ], $overrides));
    }

    public function test_an_open_session_with_nothing_submitted_is_unfinished(): void
    {
        $creator = $this->creator(['identity_session_status' => IdentityCheckState::REQUIRES_INPUT]);

        $this->assertTrue(IdentityCheckState::isUnfinished($creator));
        $this->assertFalse(IdentityCheckState::isProcessing($creator));
    }

    /** ⚠️ Rows written before the column existed. Unfinished is the safe reading. */
    public function test_a_null_session_status_is_unfinished(): void
    {
        $creator = $this->creator(['identity_session_status' => null]);

        $this->assertTrue(IdentityCheckState::isUnfinished($creator));
    }

    public function test_only_processing_counts_as_with_stripe(): void
    {
        $creator = $this->creator(['identity_session_status' => IdentityCheckState::PROCESSING]);

        $this->assertTrue(IdentityCheckState::isProcessing($creator));
        $this->assertFalse(IdentityCheckState::isUnfinished($creator));
    }

    /** A verified creator is past all of this, whatever the session row says. */
    public function test_a_verified_creator_is_neither(): void
    {
        $creator = $this->creator([
            'identity_status' => 1,
            'identity_session_status' => IdentityCheckState::VERIFIED,
        ]);

        $this->assertFalse(IdentityCheckState::isProcessing($creator));
        $this->assertFalse(IdentityCheckState::isUnfinished($creator));
    }

    /**
     * 🚨 `identity.verification_session.processing` is the ONLY event that says a document
     * was submitted. Without it handled, the two states above are the same value.
     */
    public function test_the_processing_webhook_records_that_documents_were_submitted(): void
    {
        $creator = $this->creator(['identity_session_status' => IdentityCheckState::REQUIRES_INPUT]);

        $this->dispatchProcessing($creator->stripe_user_id, $creator->id);

        $creator->refresh();

        $this->assertSame(IdentityCheckState::PROCESSING, $creator->identity_session_status);
        // ⚠️ It records no OUTCOME — verified/requires_input still decide that.
        $this->assertSame(2, (int) $creator->identity_status);
        $this->assertNotNull($creator->identity_session_updated_at);
    }

    /** A replayed or late event must never walk a finished check backwards. */
    public function test_a_processing_event_never_un_verifies_a_verified_creator(): void
    {
        $creator = $this->creator([
            'identity_status' => 1,
            'identity_session_status' => IdentityCheckState::VERIFIED,
        ]);

        $this->dispatchProcessing($creator->stripe_user_id, $creator->id);

        $creator->refresh();

        $this->assertSame(1, (int) $creator->identity_status);
        $this->assertSame(IdentityCheckState::VERIFIED, $creator->identity_session_status);
    }

    /**
     * The nudge email says "you started this check but it was never completed". True for an
     * abandoned session; false and unactionable for one Stripe is deciding.
     */
    public function test_the_reminder_body_matches_the_state_it_is_about(): void
    {
        $unfinished = $this->creator([
            'journey_step' => 'identity',
            'identity_session_status' => IdentityCheckState::REQUIRES_INPUT,
        ]);

        $body = app(NudgeStuckJourney::class)->payloadFor($unfinished, 2)['body'];

        $this->assertSame(CreatorJourneyService::UNFINISHED_COPY['identity']['body'], $body);
    }

    /** Reaches into the private handler the same way the webhook router does. */
    private function dispatchProcessing(string $sessionId, int $userId): void
    {
        $session = (object) [
            'id' => $sessionId,
            'status' => IdentityCheckState::PROCESSING,
            'metadata' => (object) ['user_id' => $userId],
        ];

        $controller = app(StripeWebhookController::class);
        $method = new \ReflectionMethod($controller, 'handleProcessingEvent');
        $method->setAccessible(true);
        $method->invoke($controller, $session);
    }
}
