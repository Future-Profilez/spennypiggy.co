<?php

namespace App\Services;

use App\Models\MonthlyCharge;
use App\Models\User;
use App\StripeControl;
use Illuminate\Support\Facades\Log;

/**
 * Completing the platform-subscription checkout — ONE definition, three callers.
 *
 * 🚨 Until this existed, the ONLY thing that could turn a `monthly_charges` row
 * from `initiated` into a card on file was the browser following Stripe's
 * `success_url` back to `mandatory.handle`. There was no webhook (the platform
 * subscription's setup session is not in `checkout.session.completed`'s
 * metadata routing, and every other MonthlyCharge webhook handler keys on
 * `stripe_id`, which a setup-mode row does not have until the first sale) and no
 * sweep. So a creator who saved their card and then lost the redirect — closed
 * tab, dead connection, expired session — had their card on Stripe and nothing
 * at all on our side, permanently, with no retry and no reminder.
 *
 * Every other checkout on this platform is written so the redirect handler and
 * the webhook RACE and either one can finish the job. This brings the one flow
 * that gates a creator's ability to sell anything into line with that rule.
 */
class SubscriptionCheckoutService
{
    /** A row waiting on the creator to finish Stripe. */
    public const STATUS_STARTED = 'initiated';

    /** The platform's word for "card on file, nothing charged yet". */
    public const STATUS_CARD_ON_FILE = 'trialing';

    /** A checkout that can never be completed now. */
    public const STATUS_DEAD = 'expired';

    public function __construct(private SubscriptionActivationService $activation) {}

    /**
     * Finish a setup-mode checkout: record the saved card and open the free period.
     *
     * ⚠️ The status flip is an ATOMIC CLAIM, not a read-then-write. The redirect
     * handler and the webhook arrive at the same moment by design, and both would
     * otherwise pass the `initiated` check, both call Stripe, and both write —
     * with the second one setting a default payment method against a row the first
     * has already moved on from.
     *
     * Returns true only when THIS call is the one that completed the row.
     */
    public function completeSetupCheckout(MonthlyCharge $sub, $session, string $source): bool
    {
        if ($sub->status !== self::STATUS_STARTED) {
            return false;
        }

        $paymentMethod = $this->paymentMethodFor($session);

        if (! $paymentMethod) {
            // No usable card means the creator cannot be billed later, and
            // pretending the setup worked would leave them selling for free with
            // nothing to charge. Leave the row started so a retry can still win.
            Log::error('SubscriptionCheckout: setup session completed without a payment method', [
                'monthly_charge_id' => $sub->id,
                'session_id' => $sub->session_id,
                'source' => $source,
            ]);

            return false;
        }

        $claimed = MonthlyCharge::where('id', $sub->id)
            ->where('status', self::STATUS_STARTED)
            ->update([
                'status' => self::STATUS_CARD_ON_FILE,
                'stripe_payment_method' => $paymentMethod,
                'upcoming_payment' => null,
            ]);

        if (! $claimed) {
            // The other path won the race. Nothing to do and nothing wrong.
            return false;
        }

        $sub->refresh();
        $user = $sub->user ?: User::find($sub->user_id);

        if (! $user) {
            Log::error('SubscriptionCheckout: completed a row whose creator is gone', [
                'monthly_charge_id' => $sub->id,
            ]);

            return true;
        }

        $user->is_subscribed = 1;
        $user->save();

        // Make it the customer's default so the subscription created on the first
        // sale collects against it without asking the creator again.
        //
        // Not fatal: `createPlatformSubscription` passes an explicit
        // `default_payment_method` anyway. Worth knowing about, though.
        try {
            if ($user->stripe_id) {
                StripeControl::setDefaultPaymentMethod($user->stripe_id, $paymentMethod);
            }
        } catch (\Throwable $e) {
            Log::warning('SubscriptionCheckout: could not set the default payment method: '.$e->getMessage());
        }

        Log::info('SubscriptionCheckout: card recorded', [
            'monthly_charge_id' => $sub->id,
            'user_id' => $user->id,
            'source' => $source,
        ]);

        return true;
    }

    /**
     * A creator who has already sold is billed the moment they add a card — they
     * are past the free period by definition, so waiting for the 15-minute sweep
     * would leave them reading "nothing charged yet" about a charge that is simply
     * late.
     *
     * ⚠️ Never fatal. The sweep (`subscription:activate-on-sale`) is still the
     * guarantee, and a failure here must not make a saved card look unsaved.
     */
    public function activateIfAlreadySelling(User $user, MonthlyCharge $sub): bool
    {
        try {
            if (! $this->activation->hasEverMadeSale($user)) {
                return false;
            }

            $this->activation->activate($user, subscription: $sub->fresh());

            return true;
        } catch (\Throwable $e) {
            Log::warning('SubscriptionCheckout: immediate activation failed, leaving it to the sweep: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Close a checkout that can never complete.
     *
     * ⚠️ `handleCheckoutSessionExpired` used to update the risk-ledger `Payment`
     * table only, so an abandoned subscription checkout sat at `initiated`
     * forever — long after Stripe had expired the session and the link was dead.
     */
    public function markDead(MonthlyCharge $sub, string $reason): bool
    {
        $closed = MonthlyCharge::where('id', $sub->id)
            ->where('status', self::STATUS_STARTED)
            ->update(['status' => self::STATUS_DEAD]);

        if ($closed) {
            Log::info('SubscriptionCheckout: unfinished checkout closed', [
                'monthly_charge_id' => $sub->id,
                'session_id' => $sub->session_id,
                'reason' => $reason,
            ]);
        }

        return (bool) $closed;
    }

    /**
     * The saved card behind a completed setup session.
     *
     * Its own method purely so a test can reach the rules above without a live
     * Stripe account — everything that decides whether a creator can sell is in
     * `completeSetupCheckout`, and none of it should be untestable because one
     * line of it is a static API call.
     */
    protected function paymentMethodFor($session): ?string
    {
        return StripeControl::paymentMethodFromSetupSession($session);
    }

    /** The row a Stripe checkout session belongs to, if it is one of ours. */
    public function rowForSession(?string $sessionId): ?MonthlyCharge
    {
        if (empty($sessionId)) {
            return null;
        }

        // ⚠️ Matched on `session_id`, not on session metadata. The sessions
        // already created in production carry their metadata on the SetupIntent
        // rather than on the session itself, so a metadata-only lookup would
        // recover none of the creators currently stuck.
        return MonthlyCharge::where('session_id', $sessionId)->first();
    }
}
