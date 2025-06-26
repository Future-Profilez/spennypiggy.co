<?php

namespace App\Http\Controllers;

use App\Jobs\SendIdentityVerificationEmail;
use App\Jobs\SendPaymentSuccessEmail;
use App\Mail\PaymentSuccessMail;
use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
// use App\Services\StripeControl;
use App\Jobs\SendRenewMail;
use App\StripeControl as AppStripeControl;
use Carbon\Carbon;
use Stripe\StripeClient;
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
        $user = User::where('stripe_user_id', $session->id)->where('is_uk', 0)->first();

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
        $user = User::where('stripe_user_id', $session->id)->where('is_uk', 0)->first();

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

    // public function creatorMonthlyVerificationWebhook(Request $request)
    // {
    //     $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
    //     $endpoint_secret = env('CREATOR_TRIAL_END_MONTHLY_SUBSCRIPTION_SECRET');

    //     $payload = $request->getContent();
    //     $sig_header = $request->header('Stripe-Signature');
    //     $event = null;

    //     try {
    //         $event = Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
    //     } catch (\UnexpectedValueException | SignatureVerificationException $e) {
    //         Log::error("Webhook signature verification failed: " . $e->getMessage());
    //         return response()->json(['error' => 'Invalid signature'], 400);
    //     }

    //     if (!empty($event)) {
    //         $subscriptionId = data_get($event, 'data.object.id');
    //         $customerEmail = data_get($event, 'data.object.customer_email');
    //         $customerName = data_get($event, 'data.object.customer_name');
    //         $invoicePdf = data_get($event, 'data.object.invoice_pdf');

    //         $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->first();

    //         try {
    //             $ret = AppStripeControl::getSubscription($subscriptionId);
    //         } catch (\Exception $e) {
    //             Log::error("Failed to retrieve subscription: " . $e->getMessage());
    //             return response()->json(['error' => 'Failed to retrieve subscription'], 500);
    //         }

    //         if ($subs) {
    //             $array = [
    //                 'email' => $customerEmail,
    //                 'name' => $customerName,
    //                 'invoice_pdf' => $invoicePdf,
    //                 'uuid' => $subs->uuid,
    //                 'notification' => $subs->user->notification_send ?? 0,
    //             ];

    //             switch ($event->type) {
    //                 // case "customer.subscription.trial_will_end":
    //                 // $subs->status = "trial";
    //                 // $subs->save();
    //                 // SendRenewMail::dispatch($array, 'trial', 'site');
    //                 // break;

    //                 case "invoice.paid":
    //                 case "invoice.payment_succeeded":
    //                     $subs->status = "paid";
    //                     $subs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
    //                     $subs->save();

    //                     $planAmount = data_get($event, 'data.object.lines.data.0.plan.amount', 0);
    //                     $planCurrency = strtoupper(data_get($event, 'data.object.lines.data.0.plan.currency', 'usd'));
    //                     $amount = $planAmount / 100;

    //                     SendPaymentSuccessEmail::dispatch($subs->user, $amount, $planCurrency, $subs->upcoming_payment);
    //                     // dispatch(new SendPaymentSuccessEmail(
    //                     //     $subs->user,
    //                     //     $amount,
    //                     //     $planCurrency,
    //                     //     $subs->upcoming_payment
    //                     // ));
    //                     break;

    //                 case "customer.subscription.deleted":
    //                     $subs->status = "cancelled";
    //                     $subs->save();
    //                     SendRenewMail::dispatch($array, 'cancelled', 'site');
    //                     break;

    //                 case "invoice.payment_failed":
    //                     $subs->status = "failed";
    //                     $subs->save();
    //                     SendRenewMail::dispatch($array, 'failed', 'site');
    //                     break;

    //                 case "invoice.updated":
    //                     $subs->status = "ended";
    //                     $subs->save();

    //                     $newSubs = new MonthlyCharge();
    //                     $newSubs->stripe_id = $subs->stripe_id;
    //                     $newSubs->session_id = $subs->session_id;
    //                     $newSubs->user_id = $subs->user_id;
    //                     $newSubs->name = $subs->name;
    //                     $newSubs->email = $subs->email;
    //                     $newSubs->currency = $subs->currency;
    //                     $newSubs->amount = $subs->amount;
    //                     $newSubs->tax = $subs->tax;
    //                     $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
    //                     $newSubs->status = "paid";
    //                     $newSubs->created_at = $subs->created_at;
    //                     $newSubs->updated_at = $subs->updated_at;
    //                     $newSubs->save();

    //                     SendRenewMail::dispatch($array, 'renew', 'site');
    //                     break;

    //                 default:
    //                     Log::info("Unhandled event type: {$event->type}");
    //                     break;
    //             }
    //         }
    //     }

    //     return response()->json(['status' => 'success']);
    // }
    // public function creatorMonthlyVerificationWebhook(Request $request)
    // {
    //     // $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
    //     // $endpoint_secret = 'whsec_uudLXC7MsoAON61MKFLJ8RYQxuDeyFgf';
    //     // // $endpoint_secret = env('CREATOR_TRIAL_END_MONTHLY_SUBSCRIPTION_SECRET');

    //     // // $endpoint_secret = env('MEMBER_SUB_WEBHOOK_SECRET');
    //     // $payload = @file_get_contents('php://input');
    //     // $sig_header = $request->server('HTTP_STRIPE_SIGNATURE');
    //     // $sig_header = $request->header('Stripe-Signature');
    //     Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

    //     $endpointSecret = 'whsec_2wIP8BkntEN3ZmvsGSRwP2U2kVe9ifmU';
    //     $sigHeader = $request->header('Stripe-Signature');
    //     $payload = $request->getContent();
    //     $event = null;

    //     // Validate the Stripe event
    //     $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);

    //     $session = $event->data->object;
    //     Log::info('Webhook received: ');
    //     Log::info(json_encode($event));

    //     // try {
    //     //     $event = Webhook::constructEvent(
    //     //         $payload,
    //     //         $sig_header,
    //     //         $endpoint_secret
    //     //     );
    //     // } catch (\UnexpectedValueException $e) {
    //     //     return response()->json([
    //     //         'status' => false,
    //     //         'message' => $e->getMessage()
    //     //     ]);
    //     //     // Invalid payload
    //     //     http_response_code(400);
    //     //     exit();
    //     // } catch (\Stripe\Exception\SignatureVerificationException $e) {
    //     //     return response()->json([
    //     //         'status' => false,
    //     //         'message' => $e->getMessage()
    //     //     ]);
    //     //     // Invalid signature
    //     //     http_response_code(400);
    //     //     exit();
    //     // }
    //     // $payload = $request->getContent();
    //     // $sig_header = $request->header('Stripe-Signature');
    //     // $event = null;

    //     // try {
    //     //     $event = Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
    //     // } catch (\UnexpectedValueException | SignatureVerificationException $e) {
    //     //     Log::error("Webhook signature verification failed: " . $e->getMessage());
    //     //     return response()->json(['error' => 'Invalid signature'], 400);
    //     // }

    //     // if (!empty($event)) {
    //     //     $subscriptionId = data_get($event, 'data.object.id');
    //     //     $customerEmail = data_get($event, 'data.object.customer_email');
    //     //     $customerName = data_get($event, 'data.object.customer_name');
    //     //     $invoicePdf = data_get($event, 'data.object.invoice_pdf');

    //     //     Log::info('Webhook received: ');
    //     //     Log::info(json_encode($event));

    //     //     $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->first();

    //     //     try {
    //     //         $ret = AppStripeControl::getSubscription($subscriptionId);
    //     //     } catch (\Exception $e) {
    //     //         Log::error("Failed to retrieve subscription: " . $e->getMessage());
    //     //         return response()->json(['error' => 'Failed to retrieve subscription'], 500);
    //     //     }

    //     //     if ($subs) {
    //     //         $array = [
    //     //             'email' => $customerEmail,
    //     //             'name' => $customerName,
    //     //             'invoice_pdf' => $invoicePdf,
    //     //             'uuid' => $subs->uuid,
    //     //             'notification' => $subs->user->notification_send ?? 0,
    //     //         ];

    //     //         switch ($event->type) {
    //     //             case "customer.subscription.trial_will_end":
    //     //                 $subs->status = "trial_ending";
    //     //                 $subs->save();
    //     //                 SendRenewMail::dispatch($array, 'trial_ending', 'site');
    //     //                 break;

    //     //             case "invoice.paid":
    //     //             case "invoice.payment_succeeded":
    //     //                 $subs->status = "paid";
    //     //                 $subs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
    //     //                 $subs->save();

    //     //                 $planAmount = data_get($event, 'data.object.lines.data.0.plan.amount', 0);
    //     //                 $planCurrency = strtoupper(data_get($event, 'data.object.lines.data.0.plan.currency', 'usd'));
    //     //                 $amount = $planAmount / 100;

    //     //                 dispatch(new SendPaymentSuccessEmail(
    //     //                     $subs->user,
    //     //                     $amount,
    //     //                     $planCurrency,
    //     //                     $subs->upcoming_payment
    //     //                 ));
    //     //                 break;

    //     //             case "customer.subscription.deleted":
    //     //                 $subs->status = "cancelled";
    //     //                 $subs->save();
    //     //                 SendRenewMail::dispatch($array, 'cancelled', 'site');
    //     //                 break;

    //     //             case "invoice.payment_failed":
    //     //                 $subs->status = "failed";
    //     //                 $subs->save();
    //     //                 SendRenewMail::dispatch($array, 'failed', 'site');
    //     //                 break;

    //     //             case "invoice.updated":
    //     //                 $subs->status = "ended";
    //     //                 $subs->save();

    //     //                 $newSubs = new MonthlyCharge();
    //     //                 $newSubs->stripe_id = $subs->stripe_id;
    //     //                 $newSubs->session_id = $subs->session_id;
    //     //                 $newSubs->user_id = $subs->user_id;
    //     //                 $newSubs->name = $subs->name;
    //     //                 $newSubs->email = $subs->email;
    //     //                 $newSubs->currency = $subs->currency;
    //     //                 $newSubs->amount = $subs->amount;
    //     //                 $newSubs->tax = $subs->tax;
    //     //                 $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
    //     //                 $newSubs->status = "paid";
    //     //                 $newSubs->created_at = $subs->created_at;
    //     //                 $newSubs->updated_at = $subs->updated_at;
    //     //                 $newSubs->save();

    //     //                 SendRenewMail::dispatch($array, 'renew', 'site');
    //     //                 break;

    //     //             default:
    //     //                 Log::info("Unhandled event type: {$event->type}");
    //     //                 break;
    //     //         }
    //     //     }
    //     // }

    //     return response()->json(['status' => 'success']);
    // }


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
