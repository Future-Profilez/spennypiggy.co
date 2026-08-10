<?php

namespace App\Support;

use App\Models\MonthlyCharge;
use App\Models\User;
use Carbon\Carbon;

/**
 * The ONE builder of the `monthly_charges` page payload.
 *
 * 🚨 There were two, and the difference between them was a live bug. The profile
 * page's copy was given a `has_card` flag so `SiteSubscription` could tell "card
 * saved, nothing charged" apart from "never started"; the account page's copy —
 * which is where the Platform Subscription popup actually renders — was not. So on
 * the one screen the creator opens it from, a creator who had just saved their card
 * was still told to add one, directly beneath a row reading "Card saved". Any new
 * surface needing this payload must call this class, never hand-roll a third array.
 */
class SubscriptionPayload
{
    /**
     * ⚠️ Statuses that describe a DEAD row and must never win the date match.
     *
     * Mirrors `User::computeSubscriptionStatus()`. An abandoned checkout keeps
     * whatever window it was given and a written-off period keeps its dates, so
     * without this an old row outranks the creator's live one and the popup
     * describes a subscription they no longer have. Deliberately applied to the
     * date-matching lookup ONLY — the newest-row fallback must still be able to
     * return an expired row, or an expired creator loses their "Renew" screen.
     */
    public const DEAD_STATUSES = ['initiated', 'expired'];

    /** The row that describes this creator's subscription right now. */
    public static function currentRow(User $user): ?MonthlyCharge
    {
        $now = Carbon::now();

        $active = MonthlyCharge::where('user_id', $user->id)
            ->whereNotIn('status', self::DEAD_STATUSES)
            ->where(function ($query) use ($now) {
                $query->where(function ($q) use ($now) {
                    $q->whereDate('current_start_subscription_date', '<=', $now)
                        ->whereDate('current_end_subscription_date', '>=', $now);
                })->orWhere(function ($q) use ($now) {
                    $q->whereDate('current_start_trial_date', '<=', $now)
                        ->whereDate('current_end_trial_date', '>=', $now);
                });
            })
            // Newest period first (created_at ties are not reliable here).
            ->newestFirst()
            ->first();

        if ($active) {
            return $active;
        }

        // A setup-mode row carries no dates at all — there is no Stripe
        // subscription for them to describe — so it can only arrive this way.
        return MonthlyCharge::where('user_id', $user->id)->newestFirst()->first();
    }

    /** Shape the row for the page. Returns null when there is nothing to describe. */
    public static function for(?MonthlyCharge $subscription): ?array
    {
        if (! $subscription) {
            return null;
        }

        $fmt = function ($date) {
            try {
                return $date ? Carbon::parse($date)->format('d F Y') : null;
            } catch (\Throwable $e) {
                return null;
            }
        };

        return [
            'id' => $subscription->id,
            'uuid' => $subscription->uuid,
            'user_id' => $subscription->user_id,
            'status' => $subscription->status ?? 'pending',
            'amount' => (float) ($subscription->amount ?? 0),
            'currency' => $subscription->currency ?? 'GBP',
            'current_start_trial_date' => $fmt($subscription->current_start_trial_date),
            'current_end_trial_date' => $fmt($subscription->current_end_trial_date),
            'current_start_subscription_date' => $fmt($subscription->current_start_subscription_date),
            'current_end_subscription_date' => $fmt($subscription->current_end_subscription_date),
            'upcoming_payment' => $subscription->upcoming_payment
                ? Carbon::parse($subscription->upcoming_payment)->format('d F Y H:i')
                : null,
            'created_at' => $fmt($subscription->created_at),

            // ⚠️ A BOOLEAN, never the `pm_...` id. The page only needs to know a
            // card is saved; a payment-method identifier has no reason to leave
            // the server.
            //
            // ⚠️ And NOT `stripe_payment_method` alone. That column is written only
            // by SETUP-mode checkout, so every creator who subscribed under the
            // older subscription-mode flow has it NULL — measured on live data, 9 of
            // the 10 creators the platform is actively collecting from. Reading it
            // alone told all of them they had no card on file. A subscription that
            // is collecting cannot exist without a payment method behind it.
            'has_card' => ! empty($subscription->stripe_payment_method)
                || (! empty($subscription->stripe_id)
                    && in_array($subscription->status, ['paid', 'active', 'renew'], true)),
        ];
    }
}
