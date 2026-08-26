<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Keep `users.default_currency` equal to the connected account's real
 * `default_currency` on Stripe.
 *
 * 🚨 THIS COLUMN IS A MONEY COLUMN, NOT A DISPLAY PREFERENCE. It decides the
 * charge currency at cart checkout (CheckoutController), the `currency` stamped
 * on every new Shop / Bill / Task / Wish / Piggy Pot listing, and the currency
 * every payout is issued in (Risk\PayoutService). A stale value means the
 * supporter is charged in one currency while the creator's Stripe account
 * settles in another — Stripe converts it, and nobody is told.
 *
 * The column's DB default is 'GBP', so a creator who never gets synced silently
 * reads as a GBP creator whatever country they onboarded from. Before this class
 * the ONLY sync in the codebase was inside
 * `StripeController::connectReturn()`'s `if (empty($user->stripe_details_submitted))`
 * guard — so it never ran when the creator closed the tab instead of returning,
 * finished onboarding from the Stripe dashboard, or when the `account.updated`
 * webhook set `stripe_details_submitted = 1` first and closed the guard forever.
 *
 * ⚠️ We do NOT trust the currency we REQUESTED at account creation. Stripe
 * decides it from the account's country and will quietly answer with a different
 * one (a NZ account asked for `gbp` comes back `nzd`), so the value is always
 * read back off the Account object Stripe returns.
 */
class StripeCurrencySync
{
    /**
     * Sync from a Stripe Account object (from create, retrieve, or the
     * `account.updated` webhook payload).
     *
     * @param  object|array  $account  Stripe Account
     * @return string|null The currency now stored, or null if nothing was changed.
     */
    public static function apply(User $user, $account, string $source): ?string
    {
        try {
            $incoming = is_array($account)
                ? ($account['default_currency'] ?? null)
                : ($account->default_currency ?? null);

            // Stripe omits `default_currency` until the account has a country.
            // An absent value is "not known yet", never "reset them to GBP".
            if (! is_string($incoming) || strlen(trim($incoming)) !== 3) {
                return null;
            }

            $incoming = strtoupper(trim($incoming));
            $current = strtoupper(trim((string) $user->default_currency));

            // ⚠️ Compared case-insensitively on purpose. Existing rows written by
            // the old `connectReturn` line hold Stripe's lower-case string; those
            // are correct values and must not be rewritten just to change their
            // case — a no-op UPDATE on every webhook is noise in the audit trail.
            if ($current === $incoming) {
                return null;
            }

            $user->default_currency = $incoming;
            $user->save();

            // A creator's settlement currency changing is a money event, so it is
            // logged at warning even when it is the expected first-time fill —
            // this is the line you grep when a payout lands in the wrong currency.
            Log::warning('Creator default_currency synced from Stripe', [
                'user_id' => $user->id,
                'account_id' => $user->account_id,
                'from' => $current !== '' ? $current : null,
                'to' => $incoming,
                'source' => $source,
            ]);

            return $incoming;
        } catch (\Throwable $e) {
            // 🚨 NEVER THROW. Every caller is inside a Stripe webhook or an
            // onboarding redirect — house pattern, same as VisitTracker and
            // PayoutDestinationAudit. A bookkeeping failure must not break
            // onboarding or make Stripe retry a webhook it already delivered.
            Log::warning('StripeCurrencySync failed', [
                'user_id' => $user->id ?? null,
                'source' => $source,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
