<?php

namespace App\Http\Controllers;

use App\Jobs\SendIdentityVerificationEmail;
use App\Jobs\SendPaymentSuccessEmail;
use App\Mail\PaymentSuccessMail;
use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function handleWebhook(Request $request)
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

        $endpointSecret = env('STRIPE_WEBHOOK_SECRET');
        $sigHeader = $request->header('Stripe-Signature');
        $payload = $request->getContent();

        try {
            // Validate the Stripe event
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);

            $session = $event->data->object;

            switch ($event->type) {
                case 'identity.verification_session.requires_input':
                    $this->handleRequiresInputEvent($session);
                    break;

                case 'identity.verification_session.verified':
                    $this->handleVerifiedEvent($session);
                    break;

                default:
                    Log::warning('Unhandled event type', ['type' => $event->type]);
                    break;
            }

            return response()->json(['status' => 'success']);
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            Log::error('Invalid Payload', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            Log::error('Invalid Signature', [
                'message' => $e->getMessage(),
                'sig_header' => $sigHeader,
                'payload' => $payload,
                'expected_secret' => $endpointSecret,
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }
    }

    private function handleRequiresInputEvent($session)
    {
        $user = User::where('stripe_user_id', $session->id)->first();

        if ($user) {
            // Check for fraud based on the last error or session details
            $isFraudulent = $this->checkForFraud($session);

            $user->update([
                'identity_status' => $isFraudulent ? 3 : 0, // 3 = Fraud, 0 = Failed
                'identity_verification_error' => $session->last_error ? json_encode($session->last_error) : null,
                'identity_verification_details' => json_encode($session),
                'identity_verified_at' => null,
            ]);

            $emailType = $isFraudulent ? 'fraud' : 'failed';
            SendIdentityVerificationEmail::dispatch($user, $emailType);
        } else {
            Log::error('User not found for verification session requiring input', ['session_id' => $session->id]);
        }
    }

    private function handleVerifiedEvent($session)
    {
        $user = User::where('stripe_user_id', $session->id)->first();

        if ($user) {
            // Check for fraud even if the session is verified
            $isFraudulent = $this->checkForFraud($session);

            $user->update([
                'identity_status' => $isFraudulent ? 3 : 1, // 3 = Fraud, 1 = Verified
                'identity_verified_at' => $isFraudulent ? null : now(),
                'identity_verification_details' => json_encode($session),
            ]);

            $emailType = $isFraudulent ? 'fraud' : 'success';
            SendIdentityVerificationEmail::dispatch($user, $emailType);
        } else {
            Log::error('User not found for verified verification session', ['session_id' => $session->id]);
        }
    }

    private function checkForFraud($session)
    {
        // Analyze the session details for fraud
        $lastError = $session->last_error;
        $verificationChecks = $session->verification_checks;

        if ($lastError) {
            Log::warning('Fraud detected based on last error', ['error' => $lastError]);
            return true; // Fraud detected due to error
        }

        // Check if any verification checks failed
        if ($verificationChecks) {
            foreach ($verificationChecks as $check) {
                if ($check->status !== 'passed') {
                    Log::warning('Fraud detected based on failed verification check', ['check' => $check]);
                    return true; // Fraud detected due to failed checks
                }
            }
        }

        // Additional fraud detection logic can go here (e.g., comparing with other systems)

        return false; // No fraud detected
    }

    public function creatorMonthlyVerificationWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                env('CREATOR_MONTHLY_SUBSCRIPTION_SECRET')
            );
        } catch (\UnexpectedValueException $e) {
            return response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response('Invalid signature', 400);
        }

        if ($event->type === 'invoice.payment_succeeded') {
            $invoice = $event->data->object;
            Log::info("Invoice: ");
            Log::info(json_encode($invoice, true));

            // Get email from invoice
            $stripeEmailId = $invoice->customer_email ?? null;

            // Find MonthlyCharge by stripe customer email
            $monthlyCharge = MonthlyCharge::where('email', $stripeEmailId)->latest()->first();

            Log::info("data: $monthlyCharge");

            if ($monthlyCharge->status != 'paid') {
                // Get trial end date from invoice line item
                $periodEndTimestamp = $invoice->lines->data[0]->period->end ?? null;
                $trialEndDate = $periodEndTimestamp ? date('Y-m-d H:i:s', $periodEndTimestamp) : null;

                $monthlyCharge->updated_at = now();
                $monthlyCharge->upcoming_payment = $trialEndDate;
                $monthlyCharge->status = 'paid';
                $monthlyCharge->save();

                $planAmount = $invoice->lines->data[0]->plan->amount ?? 0;
                $planCurrency = strtoupper($invoice->lines->data[0]->plan->currency ?? 'usd');
                $amount = $planAmount / 100;

                Log::info("Plan Amount: {$amount} {$planCurrency}");

                // Dispatch mail job
                dispatch(new SendPaymentSuccessEmail(
                    $monthlyCharge->user,
                    $amount,
                    $planCurrency,
                    $monthlyCharge->upcoming_payment
                ));
            }
        }



        return response()->json(['status' => 'success', 'message' => 'Webhook received']);
        // return response('Webhook received', 200);
    }

    // public function handleWebhook(Request $request)
    // {
    //     Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

    //     $endpointSecret = env('STRIPE_WEBHOOK_SECRET');
    //     $sigHeader = $request->header('Stripe-Signature');
    //     $payload = $request->getContent();

    //     try {
    //         // Validate and construct the Stripe event
    //         $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
    //         $session = $event->data->object;

    //         switch ($event->type) {
    //             // case 'identity.verification_session.processing':
    //             //     $this->handleProcessingEvent($session);
    //             //     break;

    //             case 'identity.verification_session.requires_input':
    //                 $this->handleRequiresInputEvent($session);
    //                 break;

    //             case 'identity.verification_session.verified':
    //                 $this->handleVerifiedEvent($session);
    //                 break;

    //             default:
    //                 Log::warning('Unhandled event type', ['type' => $event->type]);
    //                 break;
    //         }

    //         return response()->json(['status' => 'success']);
    //     } catch (\Exception $e) {
    //         Log::error('Stripe Webhook Error', ['message' => $e->getMessage()]);
    //         return response()->json(['error' => $e->getMessage()], 400);
    //     }
    // }

    // private function handleProcessingEvent($session)
    // {
    //     $user = User::where('stripe_user_id', $session->id)->first();

    //     if ($user) {
    //         $user->update([
    //             'identity_status' => 2, // Processing
    //             'identity_verification_error' => null, // Clear previous errors
    //         ]);

    //         Log::info('Verification session is processing', ['user_id' => $user->id, 'session_id' => $session->id]);

    //         SendIdentityVerificationEmail::dispatch($user, 'process');
    //     } else {
    //         Log::error('User not found for processing verification session', ['session_id' => $session->id]);
    //     }
    // }

    // private function handleRequiresInputEvent($session)
    // {
    //     $user = User::where('stripe_user_id', $session->id)->first();

    //     if ($user) {
    //         $user->update([
    //             'identity_status' => 0, // Failed
    //             'identity_verification_error' => $session->last_error ? json_encode($session->last_error) : null,
    //             'identity_verification_details' => null,
    //             'identity_verified_at' => null,
    //         ]);

    //         Log::info('Verification session requires input', ['user_id' => $user->id, 'session_id' => $session->id]);

    //         SendIdentityVerificationEmail::dispatch($user, 'failed');
    //     } else {
    //         Log::error('User not found for verification session requiring input', ['session_id' => $session->id]);
    //     }
    // }

    // private function handleVerifiedEvent($session)
    // {
    //     $user = User::where('stripe_user_id', $session->id)->first();

    //     if ($user) {
    //         $user->update([
    //             'identity_status' => 1, // Verified
    //             'identity_verified_at' => now(),
    //             'identity_verification_details' => json_encode($session),
    //         ]);

    //         Log::info('Verification session verified', ['user_id' => $user->id, 'session_id' => $session->id]);

    //         SendIdentityVerificationEmail::dispatch($user, 'success');
    //     } else {
    //         Log::error('User not found for verified verification session', ['session_id' => $session->id]);
    //     }
    // }
}
