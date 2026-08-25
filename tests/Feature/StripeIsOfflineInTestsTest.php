<?php

namespace Tests\Feature;

use App\Support\Testing\OfflineStripeHttpClient;
use Stripe\ApiRequestor;
use Stripe\Exception\ApiErrorException;
use Stripe\HttpClient\ClientInterface;
use Stripe\StripeClient;
use Tests\TestCase;

/**
 * 🚨 THE SUITE MUST NEVER CALL STRIPE.
 *
 * Measured 22 Aug 2026 on one full run: **over 2,000 live Stripe requests**,
 * logged as "Failed to ensure manual payout schedule: The provided key
 * 'sk_test_…'" and "No API key provided". The cost was not only time — it made
 * the suite NON-DETERMINISTIC. `StripeOnboardingFlowTest > a creator with a
 * card reaches the connect page` returned 500 in a full run and passed in
 * isolation, taking 9s against 3s: the shape of a slow or rate-limited call.
 *
 * A suite that fails at random makes a "green regression" meaningless, and
 * Section F of the Developer Master Plan gates every release on exactly that.
 *
 * ⚠️ This repository has already paid for this lesson once — the password rule
 * called HaveIBeenPwned on every registration test, which was network-dependent
 * and failed a password that met our own policy. The verifier was taken offline
 * in `testing` only; this is the same remedy for the same class of fault.
 */
class StripeIsOfflineInTestsTest extends TestCase
{
    /**
     * ⚠️ Asserts the BOUND CLIENT, not the outcome of a call. A test that made
     * a request to prove requests are blocked would be the thing it is checking
     * for.
     */
    public function test_the_offline_client_is_installed(): void
    {
        $this->assertInstanceOf(
            OfflineStripeHttpClient::class,
            ApiRequestor::httpClient(),
            'Tests are making live Stripe calls again. See AppServiceProvider — the '
            .'testing branch must be checked BEFORE the local one, because the test '
            .'environment is also `local` on a developer machine.'
        );
    }

    /**
     * ⚠️ IT ANSWERS WITH AN ERROR, NOT A FAKE SUCCESS. Every caller in this app
     * already handles a Stripe failure — that is what the 2,000 log lines were.
     * A fake success would send code down paths it never takes in a test today
     * and would quietly change what the suite proves.
     */
    public function test_a_stripe_call_fails_immediately_instead_of_reaching_the_network(): void
    {
        $client = new StripeClient('sk_test_offline');

        $started = microtime(true);

        try {
            $client->accounts->retrieve('acct_offline_probe');
            $this->fail('The call succeeded, so something reached Stripe.');
        } catch (ApiErrorException $e) {
            $this->assertStringContainsString('not called during tests', $e->getMessage());
        }

        /*
         * ⚠️ A generous bound, deliberately. This is not a performance
         * assertion — it is the difference between "answered locally" and "went
         * to the internet", and a real round trip cannot finish in this.
         */
        $this->assertLessThan(
            1.0,
            microtime(true) - $started,
            'That call took long enough to have left the machine.'
        );
    }

    /**
     * The signature must match the INSTALLED SDK's `ClientInterface`. PHP raises
     * a FATAL on an incompatible declaration, which takes the whole suite down
     * rather than one test — this failed exactly that way when the client was
     * first written without `$apiMode`.
     */
    public function test_the_client_still_satisfies_the_sdk_interface(): void
    {
        $this->assertInstanceOf(
            ClientInterface::class,
            new OfflineStripeHttpClient
        );
    }
}
