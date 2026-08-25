<?php

namespace App\Support\Testing;

use Stripe\HttpClient\ClientInterface;

/**
 * 🚨 THE TEST SUITE MUST NOT CALL STRIPE, AND UNTIL NOW IT CALLED IT 2,000+
 * TIMES IN A SINGLE RUN.
 *
 * Measured 22 Aug 2026 from `storage/logs/laravel.log` after one full run:
 * over two thousand entries of "Failed to ensure manual payout schedule: The
 * provided key 'sk_test_…'" and "No API key provided". Every one of those is a
 * real network round trip made while running tests.
 *
 * What that costs:
 *   · **Flakiness.** `StripeOnboardingFlowTest` returned 500 in a full run and
 *     passed in isolation, taking 9s against 3s — the shape of a slow or
 *     rate-limited call, not of a logic error. A suite that fails at random
 *     makes a "green regression" meaningless, and Section F of the client plan
 *     depends on exactly that gate.
 *   · **Time.** Two thousand round trips is most of the suite's hour.
 *   · **Reach.** Tests reaching a third party can fail for reasons that have
 *     nothing to do with this code — the same lesson this repository already
 *     recorded when the password rule called HaveIBeenPwned on every
 *     registration test.
 *
 * 🚨 IT ANSWERS WITH A REAL STRIPE ERROR SHAPE, NOT AN EMPTY SUCCESS.
 * Every caller in this app already handles a Stripe failure — that is what the
 * logs above are. Returning a fake SUCCESS would send code down paths it never
 * takes in a test today and would quietly change what the suite proves.
 * Returning the failure it already gets, instantly and identically every time,
 * changes nothing except the network and the clock.
 *
 * ⚠️ ESCAPE HATCH: `STRIPE_ALLOW_LIVE_CALLS_IN_TESTS=true` restores the real
 * client. It exists because somebody genuinely testing the Stripe integration
 * against test keys must be able to, and a switch nobody can find is a switch
 * that gets removed. It must never be set in CI.
 */
class OfflineStripeHttpClient implements ClientInterface
{
    /**
     * Stripe's own error envelope, so `ApiErrorException` is raised with the
     * type and message the SDK would normally build from a live 401.
     */
    private const BODY = '{"error":{"type":"invalid_request_error","message":"Stripe is not called during tests. See App\\\\Support\\\\Testing\\\\OfflineStripeHttpClient."}}';

    /**
     * ⚠️ The signature must match the INSTALLED SDK's `ClientInterface`, which
     * on this version carries `$apiMode`. PHP raises a fatal on an incompatible
     * declaration, so a mismatch takes the whole suite down rather than one
     * test — worth checking against `vendor/stripe` after any SDK bump.
     */
    public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1')
    {
        return [self::BODY, 401, []];
    }
}
