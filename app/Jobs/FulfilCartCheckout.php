<?php

namespace App\Jobs;

use App\Helpers;
use App\Models\Currency;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

/**
 * Delayed fallback fulfilment for a CART (basket wish) checkout whose buyer
 * never returned to the success URL.
 *
 * The cart's normal fulfilment lives in CheckoutController::successCheckout,
 * which needs the buyer's browser: it reads the session id out of the PHP
 * session and the items out of their UserCart rows. The webhook's
 * handleCheckoutSessionCompleted had NO branch for `type=cart`, so a buyer who
 * closed the tab (or paid by a delayed bank method) produced a paid Stripe
 * session with no StripePaymentItems, no Deliverable, no UserPayment, no
 * receipt — and therefore no FinancialTransaction, since syncWishes() keys on
 * the items.
 *
 * ⚠️ DISPATCHED WITH A DELAY, NEVER RUN INLINE IN THE WEBHOOK. The webhook
 * usually lands milliseconds around the redirect, and the redirect's flow is
 * the richer one (subscriptions, tweets, pushes, thank-you page state). This
 * job only acts when the redirect still has not claimed the payment by the
 * time it runs; the claim is the same atomic conditional UPDATE
 * successCheckout uses, so the two can never double-fulfil.
 *
 * The item list is rebuilt from StripePaymentDetail.metadata's `wish_items`
 * (written at checkout CREATION time, so it exists with no browser), each
 * entry carrying the UserCart row id (`cart_id`) — the same rows the redirect
 * would have read.
 */
class FulfilCartCheckout implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;

    public $backoff = [60];

    public function __construct(public string $sessionId) {}

    public function handle(): void
    {
        $detail = StripePaymentDetail::with('owner')->where('session_id', $this->sessionId)->first();

        if (! $detail) {
            Log::warning('FulfilCartCheckout: no StripePaymentDetail for session', ['session_id' => $this->sessionId]);

            return;
        }

        // Same atomic claim as successCheckout — 0 rows means the redirect (or
        // an earlier run of this job) already owns the fulfilment.
        $claimed = StripePaymentDetail::where('session_id', $this->sessionId)
            ->where(function ($q) {
                $q->whereNull('payment_status')->orWhere('payment_status', '!=', 'paid');
            })
            ->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);

        if ($claimed === 0) {
            return;
        }

        $detail->refresh();

        $meta = is_array($detail->metadata)
            ? $detail->metadata
            : (array) json_decode((string) $detail->metadata, true);

        $wishItems = $meta['wish_items'] ?? [];

        if (empty($wishItems)) {
            Log::error('FulfilCartCheckout: claimed a cart session with no wish_items metadata — nothing to fulfil', [
                'session_id' => $this->sessionId,
                'detail_id' => $detail->id,
            ]);

            return;
        }

        $createdAny = false;

        foreach ($wishItems as $mi) {
            $cart = UserCart::with(['wish', 'owner', 'user'])->find($mi['cart_id'] ?? null);
            $wish = $cart?->wish ?: WishItem::find($mi['wish_id'] ?? null);

            if (! $wish) {
                Log::warning('FulfilCartCheckout: wish no longer resolvable, skipping item', [
                    'session_id' => $this->sessionId,
                    'meta_item' => $mi,
                ]);

                continue;
            }

            if (StripePaymentItems::where('stripe_payment_detail_id', $detail->id)
                ->where('wish_item_id', $wish->id)
                ->exists()) {
                continue;
            }

            $amount = $cart->amount ?? ($mi['amount'] ?? 0);
            $quantity = $cart->quantity ?: ($mi['quantity'] ?? 1);
            $vatPercent = $detail->owner->vat_amount_percentage ?? 0;
            $vatAmount = ((float) $amount * (float) $vatPercent) / 100;

            StripePaymentItems::create([
                'uuid' => Uuid::uuid4(),
                'stripe_payment_detail_id' => $detail->id,
                'wish_item_id' => $wish->id,
                'user_cart_id' => $cart->id ?? null,
                'amount' => $amount,
                'message_media' => $wish->reward ?? null,
                'media_type' => ! empty($wish->reward) ? 'image' : null,
                'thank_you_approved' => ! empty($wish->reward) ? 1 : 0,
                'tax' => $cart->tax ?? null,
                'vat_amount' => $vatAmount,
                'quantity' => $quantity,
                'anonymous' => $cart->anonymous ?? ($detail->anonymous ?? false),
                'message' => $cart->message ?? ($detail->message ?? null),
            ]);

            $createdAny = true;

            // Buyer's own payment history (mirrors successCheckout).
            if ($cart && $cart->user_id) {
                try {
                    $creatorCurrency = strtoupper($detail->owner->default_currency ?? ($wish->currency ?? 'GBP'));
                    $userPayment = new UserPayment;
                    $userPayment->from_user_id = $cart->user_id;
                    $userPayment->to_user_id = $cart->owner_id;
                    $userPayment->product_type = 'wish item';
                    $userPayment->amount = $amount * $quantity;
                    $userPayment->currency = $wish->currency ?? 'GBP';
                    $userPayment->creator_currency = $creatorCurrency;
                    $userPayment->charge_currency = strtoupper($detail->currency ?? $creatorCurrency);
                    $userPayment->display_currency = strtoupper($detail->currency ?? 'GBP');
                    $userPayment->payment_method = 'stripe';
                    $userPayment->payment_details = json_encode($this->sessionId, true);
                    $userPayment->paid_at = Carbon::now();
                    $userPayment->status = 'paid';
                    $userPayment->save();
                } catch (\Throwable $e) {
                    Log::error('FulfilCartCheckout: UserPayment write failed: '.$e->getMessage(), [
                        'session_id' => $this->sessionId,
                    ]);
                }
            }

            // The cart row is spent — exactly what the redirect does, so the
            // buyer's next visit does not offer to re-buy what they own.
            if ($cart) {
                $cart->status = 0;
                $cart->quantity = 0;
                $cart->save();
            }
        }

        if (! $createdAny) {
            Log::info('FulfilCartCheckout: all items already existed, nothing new created', [
                'session_id' => $this->sessionId,
            ]);
        }

        // GMV once for the whole basket. (successCheckout adds it inside its
        // item loop, which over-counts a multi-item cart; once is the number
        // the subtotal actually represents.)
        try {
            Helpers::addGmv($detail->owner_id, (float) $detail->amount_subtotal, $detail->owner->default_currency ?? 'GBP');
        } catch (\Throwable $e) {
        }

        // Receipt to the buyer + sale notice to the creator + Deliverables +
        // certificates — all owned by CheckoutMailToUser. claimReceipt is the
        // same guard the redirect and the wish webhook use, so the receipt can
        // only ever send once whichever path wins.
        $symbol = Currency::where('iso', strtoupper($detail->currency ?? 'GBP'))->value('symbol') ?? '£';

        if (StripePaymentDetail::claimReceipt($detail->id)) {
            CheckoutMailToUser::dispatch($detail->fresh(), $symbol);
        }

        Log::info('FulfilCartCheckout: fulfilled abandoned cart session', [
            'session_id' => $this->sessionId,
            'detail_id' => $detail->id,
        ]);
    }
}
