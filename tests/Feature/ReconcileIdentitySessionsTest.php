<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\IdentityCheckState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

/**
 * `identity:reconcile` is the safety net for the one thing Stripe never tells us: that a
 * creator opened the passport check and closed the tab. It is also what settles every row
 * that predates `identity_session_status`, without guessing — the answer comes from Stripe.
 */
class ReconcileIdentitySessionsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);

        parent::tearDown();
    }

    /** Every session retrieve answers with this status. */
    private function stripeAnswers(string $status): void
    {
        config(['services.stripe.secret' => 'sk_test_reconcile']);

        ApiRequestor::setHttpClient(new class($status) implements ClientInterface
        {
            public function __construct(private string $status) {}

            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1')
            {
                $id = basename(parse_url($absUrl, PHP_URL_PATH));

                return [
                    json_encode([
                        'id' => $id,
                        'object' => 'identity.verification_session',
                        'status' => $this->status,
                    ]),
                    200,
                    [],
                ];
            }
        });
    }

    private function openCheck(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'identity_status' => IdentityCheckState::STATUS_OPEN,
            'stripe_user_id' => 'vs_test_'.uniqid(),
            'identity_session_status' => null,
        ], $overrides));
    }

    public function test_an_abandoned_session_is_recorded_as_unfinished(): void
    {
        $creator = $this->openCheck();
        $this->stripeAnswers(IdentityCheckState::REQUIRES_INPUT);

        $this->artisan('identity:reconcile')->assertSuccessful();

        $creator->refresh();

        $this->assertSame(IdentityCheckState::REQUIRES_INPUT, $creator->identity_session_status);
        // ⚠️ No outcome invented: a session that was never submitted is not a failure,
        // and writing one would tell the creator their passport was rejected.
        $this->assertSame(2, (int) $creator->identity_status);
        $this->assertTrue(IdentityCheckState::isUnfinished($creator));
    }

    /** 🚨 A `verified` webhook that never landed leaves a passed creator unable to list. */
    public function test_a_missed_verified_webhook_is_repaired(): void
    {
        $creator = $this->openCheck();
        $this->stripeAnswers(IdentityCheckState::VERIFIED);

        $this->artisan('identity:reconcile')->assertSuccessful();

        $creator->refresh();

        $this->assertSame(1, (int) $creator->identity_status);
        $this->assertNotNull($creator->identity_verified_at);
        $this->assertSame(IdentityCheckState::VERIFIED, $creator->identity_session_status);
    }

    /**
     * 🚨 The FULL field set, not just `identity_status`. A creator repaired here while
     * carrying a stale `identity_admin_status = 2` would read as REJECTED on their own
     * page and sit in no queue at all — passed by Stripe and invisible to everybody.
     *
     * ⚠️ REWRITTEN 4 Sep 2026. This asserted the repair set the admin verdict to 1,
     * which pinned the fault the ID sign-off exists to close: Stripe checks the
     * DOCUMENT, and stamping a human's approval off an automated pass is how a creator
     * using somebody else's ID goes live with a verified tick nobody looked at. The
     * stale-verdict concern it was written for is real and is what 0 answers.
     */
    public function test_a_repair_puts_the_creator_back_in_the_sign_off_queue(): void
    {
        $creator = $this->openCheck([
            'identity_admin_status' => 2,
            'identity_admin_reviewed_at' => now()->subDay(),
            'identity_verification_error' => json_encode(['code' => 'document_unreadable']),
        ]);
        $this->stripeAnswers(IdentityCheckState::VERIFIED);

        $this->artisan('identity:reconcile')->assertSuccessful();

        $creator->refresh();

        // 0 = waiting on a person, which is the whole point of the step.
        $this->assertSame(0, (int) $creator->identity_admin_status);
        // ⚠️ The old review date belongs to a decision about a different document.
        $this->assertNull($creator->identity_admin_reviewed_at);
        $this->assertNull($creator->identity_verification_error);
        // ⚠️ And the creator is NOT blocked meanwhile — the listing gate reads this.
        $this->assertSame(1, (int) $creator->identity_status);
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $creator = $this->openCheck();
        $this->stripeAnswers(IdentityCheckState::PROCESSING);

        $this->artisan('identity:reconcile', ['--dry-run' => true])->assertSuccessful();

        $this->assertNull($creator->fresh()->identity_session_status);
    }

    /** A verified creator is finished; re-reading their session is a wasted call. */
    public function test_only_open_checks_are_read(): void
    {
        $done = $this->openCheck([
            'identity_status' => 1,
            'identity_session_status' => IdentityCheckState::VERIFIED,
        ]);
        $this->stripeAnswers(IdentityCheckState::REQUIRES_INPUT);

        $this->artisan('identity:reconcile')->assertSuccessful();

        $this->assertSame(IdentityCheckState::VERIFIED, $done->fresh()->identity_session_status);
    }

    /** No key, no guesses — and it says so rather than reporting a clean sweep. */
    public function test_it_fails_loudly_without_a_stripe_key(): void
    {
        config(['services.stripe.secret' => null]);

        $this->artisan('identity:reconcile')->assertFailed();
    }
}
