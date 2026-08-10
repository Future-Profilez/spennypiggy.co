<?php

namespace Tests\Feature;

use App\Http\Controllers\PiggyPotPaymentController;
use App\Models\RiskIdentity;
use App\Services\Risk\RiskEngineService;
use App\Services\Risk\RiskIdentityService;
use App\Traits\RiskEnforcement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Tests\TestCase;

/**
 * Regression guards for the two ways the risk engine was silently doing
 * nothing. Both failures were invisible: no error, no log, no failed job —
 * the checkout simply carried on.
 */
class RiskEngineEnforcementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 🚨 THE PIGGY POT BYPASS.
     *
     * The controller called evaluate() and then did
     * `if ($riskData instanceof JsonResponse) { return $riskData; }`.
     * evaluate() has ALWAYS returned an array, so that branch could never be
     * true and every BLOCK / COOLDOWN / STEP_UP was discarded.
     *
     * This asserts the false premise directly: no matter what it decides, the
     * engine returns an array. Anyone reintroducing an `instanceof` check as
     * the enforcement point has to make this test fail first.
     */
    public function test_the_risk_engine_never_returns_a_response_object(): void
    {
        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 100_00,
            'currency' => 'GBP',
            'creator_id' => 'no-such-creator',
            'email' => 'someone@example.com',
            'ip' => '203.0.113.10',
            'device_id' => 'device-a',
            'is_guest' => true,
        ]);

        $this->assertIsArray($result);
        $this->assertNotInstanceOf(JsonResponse::class, $result);
        $this->assertArrayHasKey('decision', $result);
    }

    /**
     * Piggy Pot must enforce risk through the same shared trait as the other
     * eight checkouts. It was the only one that did not, which is how it ended
     * up with a broken private copy of the enforcement.
     */
    public function test_piggy_pot_checkout_uses_the_shared_risk_enforcement(): void
    {
        $this->assertContains(
            RiskEnforcement::class,
            class_uses_recursive(PiggyPotPaymentController::class),
            'PiggyPotPaymentController must enforce risk via the shared trait — '
            .'a private copy is what let every decision be discarded.'
        );
    }

    /**
     * A refusal must arrive with the customer-facing copy attached, not just a
     * decision. Without `ui` the caller falls back to whatever string it has
     * lying around, which is how "Payment blocked for security reasons."
     * survived on eight screens.
     */
    public function test_a_refusal_carries_its_customer_facing_copy(): void
    {
        $identity = RiskIdentity::create([
            'email_hash' => hash('sha256', 'blocked@example.com'),
            'is_guest' => true,
            'is_blocked' => true,
        ]);
        $identity->rollup()->create([]);

        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 10_00,
            'currency' => 'GBP',
            'creator_id' => 'anything',
            'email' => 'blocked@example.com',
            'ip' => '203.0.113.11',
            'device_id' => 'device-b',
            'is_guest' => true,
        ]);

        $this->assertSame('BLOCK', $result['decision']);
        $this->assertNotEmpty($result['ui']['title']);
        $this->assertNotEmpty($result['ui']['next_step']);
        $this->assertSame('guest', $result['ui']['audience']);
    }

    /**
     * ALLOW must carry no message at all. Building one would put refusal copy
     * into the payload of a payment that is going through.
     */
    public function test_an_allowed_payment_carries_no_message(): void
    {
        $result = app(RiskEngineService::class)->evaluate([
            'amount' => 5_00,
            'currency' => 'GBP',
            'creator_id' => 'anything',
            'email' => 'fine@example.com',
            'ip' => '203.0.113.12',
            'device_id' => 'device-c',
            'is_guest' => false,
        ]);

        $this->assertSame('ALLOW', $result['decision']);
        $this->assertSame([], $result['ui']);
    }

    /**
     * 🚨 THE is_guest LATCH.
     *
     * `is_guest` was only ever moved true → false, so anyone who signed in once
     * and later signed out kept `is_guest = false` for good. The guest block in
     * RiskEngineService reads exactly that column, so that visitor evaded it
     * permanently — and a device and an email are shared and reused constantly.
     */
    public function test_signing_out_makes_an_identity_a_guest_again(): void
    {
        $service = app(RiskIdentityService::class);
        $context = [
            'email' => 'someone@example.com',
            'ip' => '203.0.113.20',
            'device_id' => 'shared-device',
        ];

        $asGuest = $service->resolveIdentity($context + ['is_guest' => true]);
        $this->assertTrue((bool) $asGuest->is_guest);

        $signedIn = $service->resolveIdentity($context + ['is_guest' => false]);
        $this->assertSame($asGuest->id, $signedIn->id, 'Same signals must resolve the same identity.');
        $this->assertFalse((bool) $signedIn->fresh()->is_guest);

        // The regression: this used to still report false.
        $backToGuest = $service->resolveIdentity($context + ['is_guest' => true]);
        $this->assertSame($asGuest->id, $backToGuest->id);
        $this->assertTrue(
            (bool) $backToGuest->fresh()->is_guest,
            'A signed-out visitor must be a guest again, or the guest block never applies to them.'
        );
    }

    /**
     * An absent `is_guest` says nothing about the visitor, so it must leave the
     * stored value alone rather than defaulting anyone to "guest".
     */
    public function test_an_absent_is_guest_leaves_the_identity_unchanged(): void
    {
        $service = app(RiskIdentityService::class);
        $context = ['email' => 'quiet@example.com', 'ip' => '203.0.113.21', 'device_id' => 'device-q'];

        $service->resolveIdentity($context + ['is_guest' => false]);
        $again = $service->resolveIdentity($context);

        $this->assertFalse((bool) $again->fresh()->is_guest);
    }

    /**
     * 🚨 The public limits endpoint must not publish the thresholds.
     *
     * It is unauthenticated, and guest identity is keyed to card fingerprint,
     * device and IP — so returning max_spend_1h / step_up_threshold /
     * cooldown_minutes handed anyone testing cards the exact lines to stay
     * under. The only field the frontend reads for a guest is `guest_allowed`.
     */
    public function test_the_public_limits_endpoint_tells_a_guest_only_whether_they_may_check_out(): void
    {
        $response = $this->getJson('/api/risk/limits');

        $response->assertOk();
        $response->assertJsonStructure(['guest_allowed']);

        foreach (['max_spend_1h', 'max_spend_24h', 'max_spend_7d', 'step_up_threshold', 'review_hold_threshold', 'cooldown_minutes'] as $threshold) {
            $response->assertJsonMissingPath($threshold);
        }
    }
}
