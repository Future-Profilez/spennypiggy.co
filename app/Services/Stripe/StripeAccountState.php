<?php

namespace App\Services\Stripe;

use App\Models\User;
use App\StripeControl;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Stripe\Account;
use Stripe\Exception\InvalidRequestException;

/**
 * Everything the platform needs to know about a creator's connected account,
 * read ONCE.
 *
 * Two separate controllers used to answer "what state is this account in?" with
 * four sequential Stripe calls that all retrieved the SAME account —
 * `getAccount()`, then `checkAccountMigrationNeeds()`, then
 * `isAccountReadyForCheckout()`, then `getAccountRequirements()` — and the
 * creator's profile render waited on all four every time the five-minute cache
 * lapsed. They had also drifted into two near-identical copies of the same
 * block, so a fix to one silently missed the other.
 *
 * ⚠️ The cache is the reason the dashboard used to nag a creator who had just
 * finished onboarding. It was never invalidated anywhere: `connectReturn()`
 * carried the `Cache::forget` calls COMMENTED OUT, and the `account.updated`
 * webhook — the moment Stripe tells us the state changed — did not touch it
 * either. So a creator finished Stripe, came back, and was told for another
 * five minutes that action was required. `forget()` is now called from all
 * three places that know the state just moved.
 */
class StripeAccountState
{
    /** Long enough that a browsing creator is not re-reading Stripe on every page. */
    public const TTL = 300;

    /**
     * Bumped from v1: the payload is now built from one retrieve, so an entry
     * written by the old four-call path must not be read back by this one.
     */
    private const CACHE_PREFIX = 'stripe_acct_state_v2_';

    public static function cacheKey(string $accountId): string
    {
        return self::CACHE_PREFIX.$accountId;
    }

    /**
     * Drop the cached state for an account.
     *
     * Call this the moment something is known to have changed it — the creator
     * returning from onboarding, a connect attempt that came back already
     * enabled, or an `account.updated` webhook. Cheap, and the alternative is a
     * creator being told to fix something they have already fixed.
     */
    public static function forget(?string $accountId): void
    {
        if (empty($accountId)) {
            return;
        }

        Cache::forget(self::cacheKey($accountId));
    }

    /**
     * @return array{0: bool, 1: bool, 2: array} [needsUpgrade, cardCapabilities, requirements]
     *
     * Tuple shape is deliberately the one both controllers already destructure,
     * so this is a drop-in for the blocks it replaces.
     */
    public static function for(User $user): array
    {
        if (empty($user->account_id)) {
            return [false, false, []];
        }

        try {
            return Cache::remember(
                self::cacheKey($user->account_id),
                self::TTL,
                fn () => self::read($user)
            );
        } catch (\Exception $e) {
            // A 404 means the account is genuinely gone from Stripe — that is the
            // one failure that should change local state. Every other failure is
            // "we could not ask", which must never be recorded as "not connected".
            if ($e instanceof InvalidRequestException && $e->getHttpStatus() === 404) {
                $user->update(['stripe_details_submitted' => 0]);
            }

            Log::error('Failed to read Stripe account state', [
                'user_id' => $user->id,
                'account_id' => $user->account_id,
                'error' => $e->getMessage(),
            ]);

            return [false, false, self::connectionError()];
        }
    }

    /**
     * One retrieve, every fact derived from it.
     */
    private static function read(User $user): array
    {
        $account = StripeControl::getAccount($user->account_id);

        $requirements = StripeControl::accountRequirementsFrom($account);
        $cardCapabilities = StripeControl::accountReadyForCheckoutFrom($account);
        $needsUpgrade = self::needsServiceAgreementUpgrade($account);

        if ($needsUpgrade) {
            $requirements['has_requirements'] = true;
            $requirements['requirements'][] = [
                'type' => 'legacy_upgrade',
                'severity' => 'high',
                'title' => 'Account Upgrade Required',
                'message' => 'Your Stripe account needs to be upgraded to the latest version to receive card payments.',
                'action' => 'Upgrade your Stripe account now.',
                'action_url' => '/stripe/upgrade-express-account',
            ];
        }

        return [$needsUpgrade, $cardCapabilities, $requirements];
    }

    /**
     * Is this account on a service agreement the platform no longer uses?
     *
     * Same rule as `StripeController::checkAccountMigrationNeeds()`, read off the
     * account already in hand instead of retrieving it a second time. The
     * platform requires `full` for every country (Direct Charges need the
     * `card_payments` capability), so only an account still sitting on
     * `recipient` needs migrating.
     *
     * @param  Account  $account
     */
    private static function needsServiceAgreementUpgrade($account): bool
    {
        return ($account->tos_acceptance->service_agreement ?? null) === 'recipient';
    }

    /**
     * A read failure is an UNKNOWN state, never "nothing to do" — saying nothing
     * would hide a real requirement behind a transient outage, and the dashboard
     * deliberately keeps its own Stripe links alive when it sees this type.
     */
    private static function connectionError(): array
    {
        return [
            'has_requirements' => true,
            'requirements' => [[
                'type' => 'connection_error',
                'severity' => 'warning',
                'title' => 'We could not check your payment account',
                'message' => 'We could not reach Stripe just now, so we cannot tell you whether anything needs your attention. This is usually temporary.',
                'action' => 'Refresh the page in a few minutes. If it keeps happening, contact support.',
                'action_url' => null,
                'contact_support' => true,
            ]],
            'account_status' => [],
        ];
    }
}
