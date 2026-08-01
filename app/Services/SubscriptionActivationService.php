<?php

namespace App\Services;

use App\Models\MonthlyCharge;
use App\Models\User;
use App\StripeControl;
use App\Support\SubscriptionPlan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Starts a creator's platform subscription on their FIRST SALE.
 *
 * Client decision (31 July 2026): a creator is not charged until they have
 * earned. The card is still collected at sign-up — that is the filter keeping
 * junk sign-ups away from identity verification and the admin queue, and it is
 * unchanged — but the subscription is parked on a long trial until a sale
 * lands. This class is what ends that trial.
 *
 * ⚠️ There is exactly ONE definition of "has made a sale" on this platform and
 * it lives in CreatorJourneyService. It counts only `completed` income rows, so
 * a refunded or still-pending payment is not a sale. Do not write a second
 * query here — a creator who is "past first sale" for the journey card and
 * "not yet" for billing is the kind of drift that takes a week to find.
 */
class SubscriptionActivationService
{
    /**
     * Statuses on `monthly_charges` that represent a live free period we can
     * convert. Anything else is already billing, already cancelled, or was
     * never a real subscription.
     */
    public const CONVERTIBLE_STATUSES = ['trialing', 'trial_ending'];

    public function __construct(private CreatorJourneyService $journey) {}

    /**
     * Has this creator ever made a sale?
     *
     * Delegates to the journey service so billing and the creator's own
     * "what next" card can never disagree about it.
     */
    public function hasEverMadeSale(User $creator): bool
    {
        return $this->journey->isDone($creator, 'first_sale');
    }

    /**
     * The parked-trial subscription row waiting on a first sale, if any.
     *
     * Newest first: a creator who cancelled and re-subscribed has more than one
     * row, and it is the current one that matters.
     */
    public function pendingSubscription(User $creator): ?MonthlyCharge
    {
        return MonthlyCharge::where('user_id', $creator->id)
            ->whereIn('status', self::CONVERTIBLE_STATUSES)
            ->whereNull('first_sale_activated_at')
            // Either shape counts: a legacy parked-trial subscription, or a
            // setup-mode row that holds only the saved card. A row with neither
            // has nothing to bill against.
            ->where(function ($q) {
                $q->whereNotNull('stripe_id')->orWhereNotNull('stripe_payment_method');
            })
            ->latest('id')
            ->first();
    }

    /**
     * Should this creator's free period end now?
     *
     * Deliberately cheap on the common path: the status/claim lookup runs
     * before the sale query, because the overwhelming majority of creators the
     * sweep looks at are already billing and have nothing to do.
     */
    public function shouldActivate(User $creator): bool
    {
        if (! SubscriptionPlan::freeUntilFirstSale()) {
            return false;
        }

        if ((int) $creator->role !== 1) {
            return false;
        }

        if (! $this->pendingSubscription($creator)) {
            return false;
        }

        return $this->hasEverMadeSale($creator);
    }

    /**
     * End the free period and let Stripe bill.
     *
     * Returns true only when THIS call converted the subscription, so a caller
     * can safely act on it (notify, log, count) without the risk of doing so
     * twice.
     *
     * ⚠️ The local claim is taken BEFORE the Stripe call, and it is the UPDATE
     * itself (`whereNull(...)`), not a read-then-write. The hourly sweep and a
     * payment webhook can genuinely land in the same second; without this both
     * would see an unclaimed row and both would raise an invoice.
     */
    public function activate(User $creator, bool $dryRun = false, ?MonthlyCharge $subscription = null): bool
    {
        // Accept the row the caller already resolved — shouldActivate() has just
        // looked it up, and re-querying it here cost a second identical query for
        // every creator on every sweep.
        $subscription ??= $this->pendingSubscription($creator);

        if (! $subscription) {
            return false;
        }

        if ($dryRun) {
            return true;
        }

        // ⚠️ Claim by STRIPE SUBSCRIPTION ID, not by local row id, and claim every
        // row carrying it. The webhook and the redirect handler each create their
        // own monthly_charges row, so one Stripe subscription can legitimately be
        // described by two local rows — claiming only the one we happened to read
        // would leave the other unclaimed for the next sweep to find, and it would
        // bill the same subscription again under a different idempotency key.
        // Claim by Stripe subscription id where there is one; a setup-mode row has
        // none yet, so its own id is the only thing that identifies it.
        $claimQuery = $subscription->stripe_id
            ? MonthlyCharge::where('stripe_id', $subscription->stripe_id)
            : MonthlyCharge::where('id', $subscription->id);

        $claimed = $claimQuery
            ->whereNull('first_sale_activated_at')
            ->update(['first_sale_activated_at' => now()]);

        if (! $claimed) {
            return false;
        }

        try {
            if ($subscription->stripe_id) {
                // Legacy path: the subscription already exists on a parked trial.
                $result = StripeControl::endSubscriptionTrial(
                    $subscription->stripe_id,
                    // Keyed on the Stripe subscription for the same reason: the key
                    // must identify the thing being billed, not the row we read.
                    'first_sale_activation_'.$subscription->stripe_id,
                );
            } else {
                // Setup mode: no subscription exists, so this creates it. Both
                // paths coexist deliberately — a creator who checked out under the
                // old flow keeps their parked trial, and nothing had to be migrated.
                $created = StripeControl::createPlatformSubscription(
                    customerId: $creator->stripe_id,
                    paymentMethodId: $subscription->stripe_payment_method,
                    unitAmountMinor: (int) round(SubscriptionPlan::total() * 100),
                    currency: SubscriptionPlan::currency(),
                    productName: SubscriptionPlan::copy('checkout_name'),
                    trialDays: SubscriptionPlan::trialDaysOnSale(),
                    metadata: [
                        'monthly_charge_id' => (string) $subscription->id,
                        'user_id' => (string) $creator->id,
                        'subscription_purpose' => 'mandatory_platform_access',
                    ],
                    // Keyed on the local row: it is what identifies this creator's
                    // one subscription before Stripe has given it an id.
                    idempotencyKey: 'platform_subscription_'.$subscription->id,
                );

                $subscription->forceFill(['stripe_id' => $created->id])->save();
                $result = $created;
            }
        } catch (\Throwable $e) {
            // Release the claim so the next sweep retries. Leaving it set would
            // mark the creator as activated while Stripe still has them on a
            // trial — they would sell for months and never be billed.
            $claimQuery->update(['first_sale_activated_at' => null]);

            Log::error('SubscriptionActivationService: failed to end trial on first sale', [
                'creator_id' => $creator->id,
                'monthly_charge_id' => $subscription->id,
                'stripe_id' => $subscription->stripe_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        Log::info('SubscriptionActivationService: free period ended by first sale', [
            'creator_id' => $creator->id,
            'monthly_charge_id' => $subscription->id,
            'stripe_id' => $subscription->stripe_id,
        ]);

        // The authoritative status change comes from Stripe's own
        // customer.subscription.updated / invoice.paid webhooks. This is only so
        // the creator's dashboard is not still saying "free until your first
        // sale" in the seconds before that webhook lands. Applied to every row
        // for this Stripe subscription, matching the claim above.
        $statusQuery = $subscription->stripe_id
            ? MonthlyCharge::where('stripe_id', $subscription->stripe_id)
            : MonthlyCharge::where('id', $subscription->id);

        // ⚠️ Derive the local status from what Stripe actually did, never assume
        // 'paid'. An off-session charge that needs authentication, or a declined
        // card, leaves the subscription `incomplete` — writing 'paid' there tells
        // the creator they are subscribed while nothing is being collected, and an
        // `incomplete` subscription sits for ~23 hours before Stripe gives up, so
        // the webhook does not correct it quickly either.
        //
        // 'trialing' is a real outcome too: with trialDaysOnSale() > 0 no charge is
        // attempted yet, and the eligibility allow-list already accepts it.
        $stripeStatus = $result->status ?? null;

        $localStatus = match ($stripeStatus) {
            'active' => 'paid',
            'trialing' => 'trialing',
            null => 'paid', // Stripe told us nothing; the webhook is authoritative.
            default => 'failed',
        };

        $statusQuery->whereIn('status', self::CONVERTIBLE_STATUSES)
            ->update(['status' => $localStatus]);

        if ($localStatus === 'failed') {
            Log::warning('SubscriptionActivationService: Stripe did not collect on activation', [
                'creator_id' => $creator->id,
                'monthly_charge_id' => $subscription->id,
                'stripe_status' => $stripeStatus,
            ]);
        }

        return true;
    }

    /**
     * Creators whose free period is due to end.
     *
     * One statement rather than a walk over every creator: the sale test is a
     * `whereExists` against the ledger, so the database returns only the rows
     * that actually need work.
     */
    public function dueQuery()
    {
        return User::query()
            ->where('role', 1)
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('monthly_charges')
                    ->whereColumn('monthly_charges.user_id', 'users.id')
                    ->whereIn('monthly_charges.status', self::CONVERTIBLE_STATUSES)
                    ->whereNull('monthly_charges.first_sale_activated_at')
                    ->whereNull('monthly_charges.deleted_at')
                    ->where(function ($q) {
                        $q->whereNotNull('monthly_charges.stripe_id')
                            ->orWhereNotNull('monthly_charges.stripe_payment_method');
                    });
            })
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('financial_transactions')
                    ->whereColumn('financial_transactions.user_id', 'users.id')
                    ->where('financial_transactions.type', 'income')
                    ->where('financial_transactions.status', 'completed');
            })
            ->orderBy('users.id');
    }
}
