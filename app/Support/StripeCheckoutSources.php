<?php

namespace App\Support;

use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use Illuminate\Database\Eloquent\Model;

/**
 * Every table that holds a payment row created from a Stripe Checkout Session — in ONE
 * place, with the column names and the connected account each one needs.
 *
 * 🚨 WHY THIS IS SHARED. There were TWO hand-maintained copies of this list and BOTH were
 * missing **memberships and bills**: `SweepStuckPayments` (the daily safety net that
 * finds purchases whose fulfilment webhook was dropped) and `ReconcileStripeSession`
 * (the by-hand repair for one session). So a dropped `checkout.session.completed` on a
 * membership or a bill left the supporter charged, the subscription stuck at
 * `initiated`, no deliverable, no ledger row, no emails and every renewal invisible —
 * and it was neither detected by the sweep nor repairable by the tool, which answered
 * "No payment row found" for a session whose row was sitting right there. The webhook
 * controller's own refund cascade already knew about all eight tables; the two recovery
 * paths knew about six.
 *
 * ⚠️ Adding a paid product means adding it HERE. A source missing from this map is a
 * product whose dropped webhook nothing will ever notice.
 */
final class StripeCheckoutSources
{
    /**
     * [label, model, session column, status column, account resolver]
     *
     * The account resolver returns the CONNECTED account a direct charge was made on —
     * a session created on a connected account cannot be retrieved from the platform.
     *
     * @return array<int, array{0:string,1:class-string<Model>,2:string,3:string,4:callable}>
     */
    public static function map(): array
    {
        return [
            ['Piggy Pot contribution', PiggyPotContribution::class, 'session_id', 'status',
                fn ($row) => $row->creator->account_id ?? null],

            ['Support payment (Piggy Bank)', TipGoalsPayment::class, 'session_id', 'status',
                fn ($row) => $row->creator->account_id ?? null],

            ['Shop payment', ShopPayment::class, 'session_id', 'payment_status',
                fn ($row) => $row->shop->user->account_id ?? null],

            ['Task purchase', TaskPurchase::class, 'stripe_session_id', 'status',
                fn ($row) => $row->creator->account_id ?? null],

            ['Wish subscription', WishItemSubscription::class, 'session_id', 'status',
                fn ($row) => optional(WishItem::find($row->wish_item_id))->user->account_id ?? null],

            ['Wish / checkout (StripePaymentDetail)', StripePaymentDetail::class, 'session_id', 'payment_status',
                fn ($row) => $row->owner->account_id ?? null],

            // ⚠️ Both of these were absent from the old `locate()`. Their creator is
            // reached through the LISTING, not through `user_id` — that column is the
            // supporter who paid.
            ['Membership payment', MembershipPayment::class, 'session_id', 'status',
                fn ($row) => optional(Membership::find($row->membership_id))->user->account_id ?? null],

            ['Bill payment', BillPayment::class, 'session_id', 'status',
                fn ($row) => optional(Bills::find($row->bills_id))->user->account_id ?? null],
        ];
    }

    /**
     * Which product a checkout session belongs to.
     *
     * @return array{0:string,1:?Model,2:?string} [label, row, connected account id]
     */
    public static function locate(string $sessionId): array
    {
        foreach (self::map() as [$label, $model, $sessionColumn, , $account]) {
            $row = $model::where($sessionColumn, $sessionId)->first();

            if ($row) {
                return [$label, $row, $account($row) ?: null];
            }
        }

        return ['', null, null];
    }
}
