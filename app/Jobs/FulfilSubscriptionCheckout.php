<?php

namespace App\Jobs;

use App\Helpers;
use App\Http\Controllers\Auth\BillsController;
use App\Http\Controllers\Auth\MembershipController;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\StripeControl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Delayed fallback fulfilment for a Bill or Membership FIRST payment whose
 * buyer never returned to the success URL.
 *
 * The redirect handlers (BillsController::handlePayment /
 * MembershipController::handlePayment) were the ONLY thing that ever wrote
 * `stripe_id` on the payment row — and every renewal webhook keys on that
 * column plus status='paid'. So a closed tab left a paid Stripe subscription
 * stuck at 'initiated' with stripe_id NULL: no deliverable, no ledger row, no
 * emails to either side, and every future renewal invisible while Stripe kept
 * charging the card.
 *
 * ⚠️ DISPATCHED WITH A DELAY, NEVER RUN INLINE IN THE WEBHOOK — the redirect
 * normally lands within seconds and its flow is the canonical one. This job
 * claims with the SAME atomic conditional UPDATE (initiated → processing) the
 * redirect uses, so the two can never double-fulfil, and the fulfilment
 * itself is the controllers' own fulfilPaidCheckout() — one code path, not a
 * webhook copy that drifts.
 */
class FulfilSubscriptionCheckout implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;

    public $backoff = [60];

    public function __construct(public string $sessionId) {}

    public function handle(): void
    {
        $bill_pay = BillPayment::with('bill.user')->where('session_id', $this->sessionId)->latest()->first();

        if ($bill_pay && $bill_pay->status === 'initiated') {
            $this->fulfilBill($bill_pay);

            return;
        }

        $mem = MembershipPayment::with('membership.user')->where('session_id', $this->sessionId)->latest()->first();

        if ($mem && $mem->status === 'initiated') {
            $this->fulfilMembership($mem);
        }
    }

    private function fulfilBill(BillPayment $bill_pay): void
    {
        $claimed = BillPayment::where('id', $bill_pay->id)
            ->where('status', 'initiated')
            ->update(['status' => 'processing']);

        if (! $claimed) {
            return;
        }

        try {
            $session = StripeControl::getCheckoutSession($bill_pay->session_id, $bill_pay->bill->user->account_id);

            if (($session->payment_status ?? null) !== 'paid') {
                // Not settled — release the claim so the redirect (or a later
                // run) can still finish it.
                BillPayment::where('id', $bill_pay->id)
                    ->where('status', 'processing')
                    ->update(['status' => 'initiated']);

                return;
            }

            Helpers::addGmv($bill_pay->bill->user_id);

            app(BillsController::class)->fulfilPaidCheckout($bill_pay, $session);

            Log::info('FulfilSubscriptionCheckout: fulfilled abandoned bill checkout', [
                'session_id' => $this->sessionId,
                'bill_payment_id' => $bill_pay->id,
            ]);
        } catch (\Throwable $e) {
            BillPayment::where('id', $bill_pay->id)
                ->where('status', 'processing')
                ->update(['status' => 'initiated']);

            Log::error('FulfilSubscriptionCheckout: bill fulfilment failed: '.$e->getMessage(), [
                'session_id' => $this->sessionId,
                'bill_payment_id' => $bill_pay->id,
            ]);

            throw $e;
        }
    }

    private function fulfilMembership(MembershipPayment $mem): void
    {
        $claimed = MembershipPayment::where('id', $mem->id)
            ->where('status', 'initiated')
            ->update(['status' => 'processing']);

        if (! $claimed) {
            return;
        }

        try {
            $session = StripeControl::getCheckoutSession($mem->session_id, $mem->membership->user->account_id);

            if (($session->payment_status ?? null) !== 'paid') {
                MembershipPayment::where('id', $mem->id)
                    ->where('status', 'processing')
                    ->update(['status' => 'initiated']);

                return;
            }

            app(MembershipController::class)->fulfilPaidCheckout($mem, $session);

            Log::info('FulfilSubscriptionCheckout: fulfilled abandoned membership checkout', [
                'session_id' => $this->sessionId,
                'membership_payment_id' => $mem->id,
            ]);
        } catch (\Throwable $e) {
            MembershipPayment::where('id', $mem->id)
                ->where('status', 'processing')
                ->update(['status' => 'initiated']);

            Log::error('FulfilSubscriptionCheckout: membership fulfilment failed: '.$e->getMessage(), [
                'session_id' => $this->sessionId,
                'membership_payment_id' => $mem->id,
            ]);

            throw $e;
        }
    }
}
