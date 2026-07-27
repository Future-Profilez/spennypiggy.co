<?php

namespace App\Http\Controllers;

use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\UserPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EvidencePackController extends Controller
{
    public function generate(Request $request, $uuid)
    {
        $user = Auth::user();

        $query = FinancialTransaction::where('uuid', $uuid)->with([
            'user' => fn ($q) => $q->withTrashed(),
            'supporter' => fn ($q) => $q->withTrashed(),
            'source',
        ]);

        // If not admin, restrict to creator's own transactions or supporter's own transactions
        if ((string) $user->role !== '1') {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('supporter_id', $user->id);
            });
        }

        $transaction = $query->firstOrFail();
        $source = $transaction->source;

        // Try to get Stripe Session ID from source
        $stripeSessionId = null;
        $stripePaymentIntentId = null;

        if ($source) {
            $stripeSessionId = $source->stripe_session_id ?? $source->session_id ?? null;
            $stripePaymentIntentId = $source->stripe_payment_intent_id ?? $source->payment_intent_id ?? null;

            // Handle StripePaymentItems which stores session in its related payment detail
            if (! $stripeSessionId && method_exists($source, 'payment') && $source->payment) {
                $stripeSessionId = $source->payment->stripe_session_id ?? $source->payment->session_id ?? null;
                if (! $stripePaymentIntentId) {
                    $stripePaymentIntentId = $source->payment->stripe_payment_intent_id ?? $source->payment->payment_intent_id ?? null;
                }
            }
        }

        // Get risk ledger payment if exists
        $riskPayment = null;
        if ($stripeSessionId) {
            $riskPayment = Payment::where('stripe_session_id', $stripeSessionId)->first();
            if ($riskPayment && ! $stripePaymentIntentId) {
                $stripePaymentIntentId = $riskPayment->stripe_payment_intent_id;
            }
        }

        // If we still don't have it, try UserPayment
        if ($stripeSessionId && ! $stripePaymentIntentId) {
            $userPayment = UserPayment::where('payment_details', 'LIKE', '%'.$stripeSessionId.'%')->first();
            if ($userPayment && isset($userPayment->payment_details)) {
                // payment_details often stores the intent ID as well, but it's JSON/text. We will just check TipGoalsPayment next
            }
        }

        // Get supporter IP from User model if available
        $supporterIp = 'Not available';
        if ($transaction->supporter && isset($transaction->supporter->ip_address) && ! empty($transaction->supporter->ip_address)) {
            $supporterIp = $transaction->supporter->ip_address;
        } elseif ($riskPayment && isset($riskPayment->ip_address) && ! empty($riskPayment->ip_address)) {
            // fallback if it somehow exists
            $supporterIp = $riskPayment->ip_address;
        }

        // Gather evidence data
        $evidence = [
            'transaction_id' => $transaction->uuid,
            'date' => $transaction->transaction_date ? $transaction->transaction_date->format('F j, Y, g:i a') : ($transaction->created_at ? $transaction->created_at->format('F j, Y, g:i a') : 'N/A'),
            'description' => $transaction->description ?? 'No description',
            'amount' => number_format((float) ($transaction->gross_amount ?? 0), 2),
            'currency' => strtoupper($transaction->currency ?? 'GBP'),
            'status' => $transaction->status,
            'stripe_session_id' => $stripeSessionId ?? 'N/A',
            'stripe_payment_intent_id' => $stripePaymentIntentId ?? 'N/A',
            'creator' => [
                'name' => $transaction->user->name ?? 'Deleted User',
                'email' => $transaction->user->email ?? 'N/A',
                'username' => $transaction->user->username ?? 'deleted_user',
            ],
            'supporter' => $transaction->supporter ? [
                'name' => $transaction->supporter->name ?? 'Deleted User',
                'email' => $transaction->supporter->email ?? 'N/A',
                'username' => $transaction->supporter->username ?? 'deleted_user',
                'ip_address' => $supporterIp,
            ] : null,
            'platform_name' => config('app.name', 'SpennyPiggy'),
            'platform_url' => config('app.url'),
            'service_type' => $transaction->source_type ? class_basename($transaction->source_type) : 'Transaction',
        ];

        return Inertia::render('EvidencePack/Show', [
            'evidence' => $evidence,
        ]);
    }
}
