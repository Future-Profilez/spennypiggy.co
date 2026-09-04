<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Account;

/**
 * Keeps `users.charges_enabled` in step with the connected account.
 *
 * 🚨 THE COLUMN WAS WRITTEN BY NOTHING. It has existed since Nov 2023 with a
 * database default of 0, and every occurrence of the name in `app/` was a key
 * in an array built from a live Stripe object — never an assignment to the
 * model. Measured on the live database, 4 Sep 2026: 570 of 570 rows read 0,
 * while 28 live creators held a real `acct_…`.
 *
 * That is not a dormant column, because the admin console renders a red
 * "Stripe charges disabled — supporters cannot buy from this creator" alert
 * from it. Every creator on the platform carried that accusation, and the one
 * creator whose charges really were disabled looked exactly like the other 27.
 *
 * ⚠️ THE LIVE CAPABILITY CHECK REMAINS THE AUTHORITY at checkout. This column
 * is a CACHE for screens and queries — it can be stale by exactly as long as
 * it takes a webhook to arrive — so nothing that refuses a payment should read
 * it. `CreatorActivityWidget` documents the same rule from the other side.
 */
class StripeChargesFlag
{
    /**
     * Record what Stripe says about this account.
     *
     * @param  Account|object|null  $account
     * @return bool whether the stored value changed
     */
    public static function sync(?User $user, $account): bool
    {
        if (! $user || ! $account) {
            return false;
        }

        /*
         * ⚠️ An account object for somebody ELSE must never write this row.
         * `account.updated` resolves the creator from the account id, but a
         * caller holding a user and a retrieved account can get them out of
         * step, and a wrong `true` here says a creator can sell when they
         * cannot.
         */
        $accountId = $account->id ?? null;
        if ($accountId !== null && $user->account_id !== null && $user->account_id !== $accountId) {
            return false;
        }

        $enabled = ($account->charges_enabled ?? false) ? 1 : 0;
        $unchanged = (int) $user->charges_enabled === $enabled;

        /*
         * 🚨 THE TIMESTAMP IS WRITTEN EVEN WHEN THE VALUE DID NOT MOVE.
         *
         * It answers a different question — "has Stripe ever told us?" — and
         * the admin console needs it to tell a creator who genuinely cannot
         * take payments from one whose column has simply never been written.
         * Skipping it on an unchanged value would leave the commonest case
         * (a healthy account, reported as healthy) looking exactly like the
         * one nobody has ever asked about.
         */

        try {
            /*
             * 🚨 `DB::table`, NOT `User::whereKey(...)->update()`. Eloquent's
             * builder stamps `updated_at` on every update — and this is a fact
             * Stripe reported, not an edit anybody made. The public profile
             * cache is keyed off that column and the creator-review queue
             * ORDERS by it, so a routine webhook would reshuffle the admin's
             * list and expire caches for no reason.
             */
            DB::table('users')->where('id', $user->id)->update([
                'charges_enabled' => $enabled,
                'charges_checked_at' => now(),
            ]);
            $user->charges_enabled = $enabled;
            $user->charges_checked_at = now();
        } catch (\Throwable $e) {
            // Every caller is a webhook, a redirect handler or a sweep. None of
            // them may fail because a cache column could not be written.
            Log::warning('Could not sync charges_enabled', [
                'user_id' => $user->id,
                'account_id' => $accountId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        return ! $unchanged;
    }
}
