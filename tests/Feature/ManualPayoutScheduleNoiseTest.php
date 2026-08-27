<?php

namespace Tests\Feature;

use App\StripeControl;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * `payout:enforce-manual` sweeps every row with an `account_id` every ten minutes -
 * 144 runs a day. An account this key cannot reach (creator disconnected, account
 * rejected or deleted, account belongs to another platform) fails on every one of
 * those runs, and the failure used to be logged at ERROR level with no context but
 * the message string.
 *
 * With the `sentry` log channel in the stack that is 144 identical alerts a day per
 * dead account, which is how the alert that matters becomes indistinguishable from
 * the ones that do not.
 */
class ManualPayoutScheduleNoiseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_a_non_account_id_is_refused_without_a_stripe_call(): void
    {
        Log::shouldReceive('warning')->once();
        Log::shouldReceive('error')->never();

        $this->assertFalse(StripeControl::ensureManualPayoutSchedule('cus_ABC123'));
    }

    public function test_an_unreachable_account_is_classified_as_permanent(): void
    {
        $method = new \ReflectionMethod(StripeControl::class, 'isAccountUnreachable');
        $method->setAccessible(true);

        $permission = new \Stripe\Exception\PermissionException(
            "The provided key 'sk_live_xxx' does not have access to account 'acct_1QHzEN2RsYS7cGKq' "
            .'(or that account does not exist). Application access may have been revoked.'
        );

        $this->assertTrue($method->invoke(null, $permission));
    }

    public function test_a_transient_failure_is_not_classified_as_permanent(): void
    {
        $method = new \ReflectionMethod(StripeControl::class, 'isAccountUnreachable');
        $method->setAccessible(true);

        // A network blip is a failure of THIS run and must keep its error level.
        $transient = new \Stripe\Exception\ApiConnectionException('Could not connect to Stripe.');

        $this->assertFalse(
            $method->invoke(null, $transient),
            'A connection failure must stay at error level - it is not a fact about the account.'
        );
    }
}
