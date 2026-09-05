<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\MonthlyCharge;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Illuminate\Support\Facades\Log;

/**
 * Everything that happens to an account when it is suspended, in one place.
 *
 * 🚨 THE FLAG HAS THREE WRITERS AND ONLY ONE OF THEM IS A PERSON. The admin
 * app's suspend button, and two automatic paths in `StripeWebhookController`
 * (5843, 6220) that suspend a creator off a Stripe signal. Before this class
 * each of them set `suspended_account = 1` raw, so the two webhook paths
 * produced a creator who was hidden and locked out with no reason recorded, no
 * payout hold, and every subscription still billing. Every writer now goes
 * through `suspend()`.
 *
 * 🚨 THE ADMIN APP CANNOT CALL THIS. It shares the database and nothing else —
 * no queue worker, no Stripe client on the platform key, and a 60-second Lambda
 * that must not sit in a loop of Stripe calls while an admin waits. So the admin
 * app writes the STATE (flag, code, note, author) and the website's
 * `suspension:enforce` sweep applies the CONSEQUENCES, claiming each account
 * with `suspension_enforced_at`. Same split, and the same reasoning, as
 * `payout_paused_at` / `NotifyPayoutHolds`.
 *
 * What enforcement does, and why each is what it is:
 *
 *  - **Incoming subscriptions PAUSE, they do not cancel.** `pause_collection:
 *    void` stops every future charge while leaving the subscription in place, so
 *    lifting a suspension restores the creator's income by itself. Cancelling
 *    would end thousands of supporter relationships that no supporter chose to
 *    end, and Stripe has no undo — a wrongly-suspended creator would come back
 *    to nothing.
 *  - **Outgoing subscriptions CANCEL at period end.** A suspended account may
 *    not send money; at period end rather than immediately because the supporter
 *    has already paid for the current period and there is no refund. Those
 *    cancels are NOT reversed on unsuspend — Stripe cannot resurrect them.
 *  - **Their own platform subscription keeps running and stops renewing.**
 *    Client rule: they keep what they paid for, they are not billed again.
 *  - **Payouts freeze.** `payout_paused_at` is already read by the weekly run,
 *    reserve release, and all four bonus payout jobs, so this one column stops
 *    every outbound payment without touching any of them.
 */
class SuspensionService
{
    /** Written into `payout_pause_reason` so unsuspend knows which hold is ours. */
    public const PAYOUT_HOLD_REASON = 'Account suspended';

    /**
     * Put an account into suspension and queue the consequences.
     *
     * Idempotent: suspending an already-suspended account refreshes nothing and
     * re-queues nothing, so a double-click or a repeated webhook cannot pause a
     * subscription twice or overwrite the original reason with a later one.
     */
    public function suspend(User $user, string $reasonCode = 'admin_action', ?string $note = null, ?int $adminId = null): bool
    {
        if ((int) $user->suspended_account === 1) {
            return false;
        }

        $user->forceFill([
            'suspended_account' => 1,
            'suspension_reason_code' => $reasonCode,
            'suspension_note' => $note,
            'suspended_at' => now(),
            'suspended_by_admin_id' => $adminId,
            // The claim the sweep looks for. Null means "consequences pending".
            'suspension_enforced_at' => null,
        ])->save();

        $this->freezePayouts($user);

        return true;
    }

    /**
     * Lift a suspension. Restores what can be restored and says so.
     *
     * ⚠️ Outgoing subscriptions the creator had to other creators are NOT
     * restored — they were cancelled at Stripe and cannot be re-created from
     * here. The admin dialog says so before the suspension is applied.
     */
    public function unsuspend(User $user): bool
    {
        if ((int) $user->suspended_account !== 1) {
            return false;
        }

        $user->forceFill([
            'suspended_account' => 0,
            'suspension_reason_code' => null,
            'suspension_note' => null,
            'suspended_at' => null,
            'suspended_by_admin_id' => null,
        ])->save();

        $this->releasePayouts($user);

        return true;
    }

    /**
     * Apply a suspension's consequences. Safe to call repeatedly.
     *
     * @return array{paused:int, cancelled:int, renewal_stopped:bool}
     */
    public function enforce(User $user): array
    {
        $result = [
            'paused' => $this->pauseIncomingSubscriptions($user),
            'cancelled' => $this->cancelOutgoingSubscriptions($user),
            'renewal_stopped' => $this->stopPlatformRenewal($user),
        ];

        // The payout hold is set by suspend(), but the admin app writes the flag
        // directly and never calls it — so the sweep applies it here too.
        $this->freezePayouts($user);

        $user->forceFill(['suspension_enforced_at' => now()])->save();

        Log::info('Suspension enforced', ['user_id' => $user->id] + $result);

        return $result;
    }

    /**
     * Undo what enforcement did, as far as Stripe allows.
     *
     * @return array{resumed:int}
     */
    public function lift(User $user): array
    {
        $resumed = $this->resumeIncomingSubscriptions($user);

        $this->releasePayouts($user);

        $user->forceFill(['suspension_enforced_at' => null])->save();

        Log::info('Suspension lifted', ['user_id' => $user->id, 'resumed' => $resumed]);

        return ['resumed' => $resumed];
    }

    // ───────────────────────────────────────────────────────────────────
    // Incoming — supporters paying this creator
    // ───────────────────────────────────────────────────────────────────

    /**
     * Stripe subscription ids of the creator's live recurring supporters.
     *
     * ⚠️ Same query shape as `PostingCadenceService::activeSubscriptionIds()` on
     * purpose — that is the definition of "a live recurring subscriber" on this
     * platform, and two definitions of it would pause different sets.
     *
     * @return string[]
     */
    public function incomingSubscriptionIds(User $creator): array
    {
        $bill = BillPayment::query()
            ->join('bills', 'bills.id', '=', 'bill_payments.bills_id')
            ->where('bills.user_id', $creator->id)
            ->where('bill_payments.status', 'paid')
            ->where('bill_payments.recurring_for', 'continue')
            ->whereNotNull('bill_payments.stripe_id')
            ->pluck('bill_payments.stripe_id')
            ->all();

        $membership = MembershipPayment::query()
            ->join('memberships', 'memberships.id', '=', 'membership_payments.membership_id')
            ->where('memberships.user_id', $creator->id)
            ->where('membership_payments.status', 'paid')
            ->where('membership_payments.recurring_for', 'continue')
            ->whereNotNull('membership_payments.stripe_id')
            ->pluck('membership_payments.stripe_id')
            ->all();

        /*
         * 🚨 RECURRING WISHES WERE MISSING FROM THIS LIST (4 Sep 2026, found
         * while wiring the ID sign-off). A wish sold as `recurring_for =
         * continue` is a Stripe subscription on the creator's own connected
         * account exactly like a bill or a membership — so a suspended creator
         * went on being paid every month by every recurring-wish supporter,
         * silently, while their bills and memberships were correctly paused. The
         * client's instruction was the whole platform: no subscription renews
         * while a creator is suspended.
         */
        $wish = WishItemSubscription::query()
            ->join('wish_items', 'wish_items.id', '=', 'wish_item_subscriptions.wish_item_id')
            ->where('wish_items.user_id', $creator->id)
            ->where('wish_item_subscriptions.status', 'paid')
            ->where('wish_item_subscriptions.recurring_for', 'continue')
            ->whereNotNull('wish_item_subscriptions.stripe_id')
            ->pluck('wish_item_subscriptions.stripe_id')
            ->all();

        return $this->onlySubscriptionIds(array_merge($bill, $membership, $wish));
    }

    private function pauseIncomingSubscriptions(User $creator): int
    {
        $paused = 0;

        foreach ($this->incomingSubscriptionIds($creator) as $subId) {
            try {
                StripeControl::pauseSubscription($subId, $creator->account_id);
                $paused++;
            } catch (\Throwable $e) {
                // Best effort, per subscription. One dead subscription id must
                // not stop the rest of a suspension being applied.
                Log::warning('Suspension: could not pause an incoming subscription', [
                    'creator_id' => $creator->id,
                    'subscription' => $subId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $paused;
    }

    private function resumeIncomingSubscriptions(User $creator): int
    {
        // 🚨 THE POSTING-CADENCE PAUSE USES THE SAME STRIPE FIELD. If that
        // service paused this creator for being behind on posting, resuming here
        // would silently overturn its decision and start charging supporters for
        // a creator who still owes them content. Leave it to `EnforcePostingCadence`,
        // which resumes on its own once the creator is posting again.
        if ($creator->content_posting_paused_at) {
            Log::info('Suspension lift: leaving subscriptions paused, posting cadence owns the pause', [
                'creator_id' => $creator->id,
            ]);

            return 0;
        }

        $resumed = 0;

        foreach ($this->incomingSubscriptionIds($creator) as $subId) {
            try {
                StripeControl::resumeSubscription($subId, $creator->account_id);
                $resumed++;
            } catch (\Throwable $e) {
                Log::warning('Suspension: could not resume an incoming subscription', [
                    'creator_id' => $creator->id,
                    'subscription' => $subId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $resumed;
    }

    // ───────────────────────────────────────────────────────────────────
    // Outgoing — this account paying other creators
    // ───────────────────────────────────────────────────────────────────

    /**
     * Their live recurring payments to other creators, as
     * `[stripe_subscription_id => payee connected account id]`.
     *
     * ⚠️ The connected account is the PAYEE's, not theirs — a subscription to
     * another creator lives on that creator's Stripe account, and cancelling it
     * against the wrong account is a "no such subscription" error.
     *
     * @return array<string,?string>
     */
    public function outgoingSubscriptions(User $payer): array
    {
        $rows = BillPayment::query()
            ->join('bills', 'bills.id', '=', 'bill_payments.bills_id')
            ->join('users as payee', 'payee.id', '=', 'bills.user_id')
            ->where('bill_payments.user_id', $payer->id)
            ->where('bill_payments.status', 'paid')
            ->where('bill_payments.recurring_for', 'continue')
            ->whereNotNull('bill_payments.stripe_id')
            ->select('bill_payments.stripe_id as sub_id', 'payee.account_id as account_id')
            ->get()
            ->merge(
                MembershipPayment::query()
                    ->join('memberships', 'memberships.id', '=', 'membership_payments.membership_id')
                    ->join('users as payee', 'payee.id', '=', 'memberships.user_id')
                    ->where('membership_payments.user_id', $payer->id)
                    ->where('membership_payments.status', 'paid')
                    ->where('membership_payments.recurring_for', 'continue')
                    ->whereNotNull('membership_payments.stripe_id')
                    ->select('membership_payments.stripe_id as sub_id', 'payee.account_id as account_id')
                    ->get()
            );

        $out = [];

        foreach ($rows as $row) {
            if (is_string($row->sub_id) && str_starts_with($row->sub_id, 'sub_')) {
                $out[$row->sub_id] = $row->account_id;
            }
        }

        return $out;
    }

    private function cancelOutgoingSubscriptions(User $payer): int
    {
        $cancelled = 0;

        foreach ($this->outgoingSubscriptions($payer) as $subId => $accountId) {
            try {
                // At period end, not immediately: they have already paid for the
                // current period and no refund is issued, so ending access now
                // would take money for nothing. The next charge never happens,
                // which is what "cannot pay anyone" means here.
                StripeControl::cancelSubscription($subId, true, $accountId);
                $cancelled++;
            } catch (\Throwable $e) {
                Log::warning('Suspension: could not cancel an outgoing subscription', [
                    'user_id' => $payer->id,
                    'subscription' => $subId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $cancelled;
    }

    // ───────────────────────────────────────────────────────────────────
    // Their own platform subscription
    // ───────────────────────────────────────────────────────────────────

    /**
     * Stop the creator's platform subscription renewing, without ending it.
     *
     * ⚠️ On the PLATFORM account, not a connected one — this is the creator
     * paying Spenny Piggy, so no `stripe_account` option is passed.
     */
    private function stopPlatformRenewal(User $user): bool
    {
        $charge = MonthlyCharge::where('user_id', $user->id)
            ->whereNotNull('stripe_id')
            ->whereNotIn('status', ['initiated', 'expired'])
            ->latest('id')
            ->first();

        if (! $charge || ! str_starts_with((string) $charge->stripe_id, 'sub_')) {
            return false;
        }

        if ($charge->cancelled_at) {
            return false;
        }

        try {
            StripeControl::cancelSubscription($charge->stripe_id, true);

            // `status` is deliberately untouched: `computeSubscriptionStatus()`
            // treats 'canceled' as still active until the end date, and the
            // Stripe sync writes it from the real subscription. Recording the
            // date here is what makes `is_subscription_cancelled` true now.
            $charge->cancelled_at = now();
            $charge->save();

            return true;
        } catch (\Throwable $e) {
            Log::warning('Suspension: could not stop platform subscription renewal', [
                'user_id' => $user->id,
                'subscription' => $charge->stripe_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    // ───────────────────────────────────────────────────────────────────
    // Payouts
    // ───────────────────────────────────────────────────────────────────

    private function freezePayouts(User $user): void
    {
        if ($user->payout_paused_at) {
            return;
        }

        $user->forceFill([
            'payout_paused_at' => now(),
            'payout_pause_reason' => self::PAYOUT_HOLD_REASON,
        ])->save();
    }

    /**
     * ⚠️ Only releases a hold THIS put on. An admin may have paused payouts for
     * an unrelated reason before or during the suspension, and lifting the
     * suspension must not quietly pay out money somebody else decided to hold.
     */
    private function releasePayouts(User $user): void
    {
        if ($user->payout_pause_reason !== self::PAYOUT_HOLD_REASON) {
            return;
        }

        $user->forceFill([
            'payout_paused_at' => null,
            'payout_pause_reason' => null,
        ])->save();
    }

    /** @param  array<int,mixed>  $ids */
    private function onlySubscriptionIds(array $ids): array
    {
        return array_values(array_unique(array_filter(
            $ids,
            fn ($id) => is_string($id) && str_starts_with($id, 'sub_')
        )));
    }
}
