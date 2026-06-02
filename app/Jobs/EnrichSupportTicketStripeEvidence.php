<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Models\SupportTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class EnrichSupportTicketStripeEvidence implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $ticketId;
    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(int $ticketId)
    {
        $this->ticketId = $ticketId;
    }

    public function handle(): void
    {
        $ticket = SupportTicket::find($this->ticketId);
        if (!$ticket) {
            return;
        }

        $piId = $this->resolvePaymentIntentId($ticket);
        if (!$piId) {
            return;
        }

        $evidence = $ticket->evidence ?? [];
        $existingPi = data_get($evidence, 'stripe.payment_intent.id');
        if ($existingPi && $existingPi === $piId && data_get($evidence, 'stripe.enriched_at')) {
            return;
        }

        $secret = env('STRIPE_SECRET_KEY');
        if (!$secret) {
            return;
        }

        try {
            \Stripe\Stripe::setApiKey($secret);
            $pi = \Stripe\PaymentIntent::retrieve($piId, [
                'expand' => [
                    'charges.data.outcome',
                    'charges.data.payment_method_details',
                ],
            ]);
        } catch (\Throwable $e) {
            return;
        }

        $charge = null;
        if (isset($pi->charges) && isset($pi->charges->data) && is_array($pi->charges->data) && count($pi->charges->data) > 0) {
            $charge = $pi->charges->data[0];
        }

        $piPayload = array_filter([
            'id' => $pi->id ?? null,
            'status' => $pi->status ?? null,
            'amount' => isset($pi->amount) ? (int) $pi->amount : null,
            'currency' => isset($pi->currency) ? strtoupper((string) $pi->currency) : null,
            'created' => isset($pi->created) ? (int) $pi->created : null,
            'payment_method_types' => isset($pi->payment_method_types) ? $pi->payment_method_types : null,
            'livemode' => $pi->livemode ?? null,
        ], fn($v) => !($v === null || $v === ''));

        $chargePayload = null;
        if ($charge) {
            $pmd = $this->stripeObjectToArray($charge->payment_method_details ?? null);
            $card = is_array($pmd) ? (data_get($pmd, 'card') ?? null) : null;
            $threeDS = is_array($card) ? (data_get($card, 'three_d_secure') ?? null) : null;
            $checks = is_array($card) ? (data_get($card, 'checks') ?? null) : null;

            $chargePayload = array_filter([
                'id' => $charge->id ?? null,
                'status' => $charge->status ?? null,
                'paid' => $charge->paid ?? null,
                'captured' => $charge->captured ?? null,
                'refunded' => $charge->refunded ?? null,
                'amount' => isset($charge->amount) ? (int) $charge->amount : null,
                'currency' => isset($charge->currency) ? strtoupper((string) $charge->currency) : null,
                'created' => isset($charge->created) ? (int) $charge->created : null,
                'outcome' => array_filter([
                    'network_status' => data_get($charge, 'outcome.network_status'),
                    'risk_level' => data_get($charge, 'outcome.risk_level'),
                    'risk_score' => data_get($charge, 'outcome.risk_score'),
                    'seller_message' => data_get($charge, 'outcome.seller_message'),
                    'type' => data_get($charge, 'outcome.type'),
                    'reason' => data_get($charge, 'outcome.reason'),
                    'rule' => data_get($charge, 'outcome.rule'),
                ], fn($v) => !($v === null || $v === '')),
                'card' => is_array($card) ? array_filter([
                    'brand' => data_get($card, 'brand'),
                    'last4' => data_get($card, 'last4'),
                    'exp_month' => data_get($card, 'exp_month'),
                    'exp_year' => data_get($card, 'exp_year'),
                    'country' => data_get($card, 'country'),
                    'network' => data_get($card, 'network'),
                    'three_d_secure' => is_array($threeDS) ? array_filter([
                        'authentication_flow' => data_get($threeDS, 'authentication_flow'),
                        'result' => data_get($threeDS, 'result'),
                        'result_reason' => data_get($threeDS, 'result_reason'),
                        'version' => data_get($threeDS, 'version'),
                    ], fn($v) => !($v === null || $v === '')) : null,
                    'checks' => is_array($checks) ? array_filter([
                        'address_line1_check' => data_get($checks, 'address_line1_check'),
                        'address_postal_code_check' => data_get($checks, 'address_postal_code_check'),
                        'cvc_check' => data_get($checks, 'cvc_check'),
                    ], fn($v) => !($v === null || $v === '')) : null,
                ], fn($v) => !($v === null || $v === '')) : null,
            ], fn($v) => !($v === null || $v === ''));
        }

        $stripeBlock = $evidence['stripe'] ?? [];
        $stripeBlock = array_merge($stripeBlock, array_filter([
            'enriched_at' => now()->toISOString(),
            'payment_intent' => $piPayload,
            'charge' => $chargePayload,
        ], fn($v) => !($v === null || $v === '')));

        $evidence['stripe'] = $stripeBlock;
        $this->appendEvent($evidence, array_filter([
            'at' => now()->toISOString(),
            'action' => 'stripe_enriched',
            'payment_intent_id' => $piId,
            'charge_id' => $chargePayload['id'] ?? null,
            'pi_status' => $piPayload['status'] ?? null,
            'charge_risk_level' => data_get($chargePayload, 'outcome.risk_level'),
        ], fn($v) => !($v === null || $v === '')));

        $ticket->evidence = $evidence;
        $ticket->save();
    }

    private function resolvePaymentIntentId(SupportTicket $ticket): ?string
    {
        if ($ticket->stripe_payment_intent_id) {
            return (string) $ticket->stripe_payment_intent_id;
        }

        if ($ticket->stripe_session_id) {
            $pi = Payment::query()
                ->where('stripe_session_id', $ticket->stripe_session_id)
                ->value('stripe_payment_intent_id');
            if ($pi) {
                return (string) $pi;
            }
        }

        if ($ticket->source && $ticket->source_id) {
            $pi = $this->resolveFromSource((string) $ticket->source, (string) $ticket->source_id);
            if ($pi) {
                return (string) $pi;
            }
        }

        return null;
    }

    private function resolveFromSource(string $source, string $sourceId): ?string
    {
        $map = [
            'stripe_payment_items' => \App\Models\StripePaymentItems::class,
            'membership_payments' => \App\Models\MembershipPayment::class,
            'bill_payments' => \App\Models\BillPayment::class,
            'tip_goals_payments' => \App\Models\TipGoalsPayment::class,
            'piggy_pot_contributions' => \App\Models\PiggyPotContribution::class,
            'shop_payments' => \App\Models\ShopPayment::class,
            'task_purchases' => \App\Models\TaskPurchase::class,
        ];

        $modelClass = $map[$source] ?? null;
        if (!$modelClass) {
            return null;
        }

        $model = $modelClass::query()->find($sourceId);
        if (!$model || !method_exists($model, 'getAttribute')) {
            return null;
        }

        foreach (['stripe_payment_intent_id', 'payment_intent_id', 'payment_intent'] as $key) {
            $value = $model->getAttribute($key);
            if ($value) {
                return (string) $value;
            }
        }

        foreach (['stripe_session_id', 'session_id', 'stripe_session'] as $key) {
            $value = $model->getAttribute($key);
            if (!$value) {
                continue;
            }

            $pi = Payment::query()
                ->where('stripe_session_id', $value)
                ->value('stripe_payment_intent_id');
            if ($pi) {
                return (string) $pi;
            }
        }

        return null;
    }

    private function appendEvent(array &$evidence, array $event): void
    {
        $events = $evidence['events'] ?? [];
        if (!is_array($events)) {
            $events = [];
        }

        $events[] = $event;
        if (count($events) > 50) {
            $events = array_slice($events, -50);
        }

        if (!isset($evidence['created'])) {
            $evidence['created'] = $event;
        }
        $evidence['last'] = $event;
        $evidence['events'] = $events;
    }

    private function stripeObjectToArray($obj): ?array
    {
        if (!$obj) {
            return null;
        }

        $json = json_encode($obj);
        if (!is_string($json)) {
            return null;
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            return null;
        }

        return $decoded;
    }
}
