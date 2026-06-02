<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentItems;
use App\Models\SupportTicket;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Stripe\StripeClient;

class SupportTicketRefundService
{
    public function initiateRefund(SupportTicket $ticket, User $creator, string $refundedBy = 'creator'): void
    {
        $connectedAccountId = $creator->account_id ?? null;
        $paymentIntentId = $ticket->stripe_payment_intent_id;
        $sessionId = $ticket->stripe_session_id;

        if (!$paymentIntentId || !$sessionId) {
            [$paymentIntentId, $sessionId, $connectedAccountId] = $this->resolveStripeIdentifiers($ticket, $connectedAccountId);
        }

        if (!$paymentIntentId) {
            throw new \RuntimeException(
                'Unable to locate payment information for refund. '
                    . 'Source: ' . $ticket->source
                    . ', Source ID: ' . $ticket->source_id
            );
        }

        \Stripe\Stripe::setApiKey(config('services.stripe.secret'));
        $options = [];
        if ($connectedAccountId) {
            $options['stripe_account'] = $connectedAccountId;
        }

        \Stripe\Refund::create([
            'payment_intent' => $paymentIntentId,
            'reason' => 'requested_by_customer',
            'metadata' => [
                'support_ticket_uuid' => $ticket->uuid,
                'refunded_by' => $refundedBy,
            ],
        ], $options);

        $ticket->stripe_payment_intent_id = $paymentIntentId;
        $ticket->stripe_session_id = $sessionId ?: $ticket->stripe_session_id;
        $ticket->save();
    }

    private function resolveStripeIdentifiers(SupportTicket $ticket, ?string $connectedAccountId): array
    {
        $paymentIntentId = null;
        $sessionId = null;

        switch ($ticket->source) {
            case 'stripe_payment_items':
            case 'StripePaymentItems':
                $item = StripePaymentItems::with(['payment', 'wish.user'])->findOrFail($ticket->source_id);
                $paymentIntentId = $item->payment?->stripe_payment_intent_id;
                $sessionId = $item->payment?->session_id;
                $connectedAccountId = $item->wish?->user?->account_id ?? $connectedAccountId;
                break;
            case 'tip_goals_payments':
            case 'TipGoalsPayment':
                $p = TipGoalsPayment::with('creator')->findOrFail($ticket->source_id);
                $sessionId = $p->session_id;
                $connectedAccountId = $p->creator?->account_id ?? $connectedAccountId;
                break;
            case 'piggy_pot_contributions':
            case 'PiggyPotContribution':
                $p = PiggyPotContribution::with('creator')->findOrFail($ticket->source_id);
                $paymentIntentId = $p->payment_intent_id;
                $sessionId = $p->session_id;
                $connectedAccountId = $p->creator?->account_id ?? $connectedAccountId;
                break;
            case 'bill_payments':
            case 'BillPayment':
                $p = BillPayment::with('bill.user')->findOrFail($ticket->source_id);
                $paymentIntentId = $p->stripe_id;
                $sessionId = $p->session_id;
                $connectedAccountId = $p->bill?->user?->account_id ?? $connectedAccountId;
                break;
            case 'membership_payments':
            case 'MembershipPayment':
                $p = MembershipPayment::with('membership.user')->findOrFail($ticket->source_id);
                $sessionId = $p->session_id;
                $connectedAccountId = $p->membership?->user?->account_id ?? $connectedAccountId;
                break;
            case 'shop_payments':
            case 'ShopPayment':
                $p = ShopPayment::with(['shop.user'])->where('uuid', $ticket->source_id)->firstOrFail();
                $sessionId = $p->session_id;
                $connectedAccountId = $p->shop?->user?->account_id ?? $connectedAccountId;
                $deliverable = \App\Models\Deliverable::where('session_id', $p->session_id)->first();
                $paymentIntentId = $deliverable?->payment_intent_id;
                break;
            case 'task_purchases':
            case 'TaskPurchase':
                $p = TaskPurchase::with(['creator'])->findOrFail($ticket->source_id);
                $paymentIntentId = $p->payment_intent_id;
                $sessionId = $p->stripe_session_id;
                $connectedAccountId = $p->creator?->account_id ?? $connectedAccountId;
                break;
            default:
                throw new \RuntimeException('Unsupported ticket source for refund: ' . (string) $ticket->source);
        }

        if (!$paymentIntentId && $sessionId) {

            \Log::info('Refund Debug Before Session Fetch', [
                'ticket_uuid' => $ticket->uuid,
                'source' => $ticket->source,
                'source_id' => $ticket->source_id,
                'session_id' => $sessionId,
                'connected_account' => $connectedAccountId,
            ]);

            $client = new StripeClient(config('services.stripe.secret'));
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }
            $session = $client->checkout->sessions->retrieve($sessionId, [], $options);
            \Log::info('Refund Debug Session Response', [
                'session_id' => $sessionId,
                'payment_intent' => $session?->payment_intent,
                'subscription' => $session?->subscription,
                'mode' => $session?->mode,
            ]);
            $paymentIntentId = $session?->payment_intent;

            if (!$paymentIntentId && !empty($session?->subscription)) {

                $subscription = $client->subscriptions->retrieve(
                    $session->subscription,
                    [],
                    $options
                );

                $invoiceId = $subscription->latest_invoice;

                if ($invoiceId) {
                    $invoice = $client->invoices->retrieve(
                        $invoiceId,
                        [],
                        $options
                    );

                    $paymentIntentId =
                        $invoice->payment_intent;
                }
            }
        }

        return [$paymentIntentId, $sessionId, $connectedAccountId];
    }
}
