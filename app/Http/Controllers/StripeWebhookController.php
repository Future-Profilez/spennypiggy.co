<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\SendIdentityVerificationEmail;
use App\Jobs\SendPaymentSuccessEmail;
use App\Mail\PaymentSuccessMail;
use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use App\Services\StripeControl;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\WishItemSubscription;
use App\StripeControl as AppStripeControl;
// use App\StripeControl as AppStripeControl;
use Carbon\Carbon;
use Stripe\Customer;
use Stripe\StripeClient;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    /**
     * Handle Stripe Identity Verification Webhook
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handleWebhook(Request $request)
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

        $endpointSecret = env('STRIPE_IDENTITY_VERIFICATION_WEBHOOK_SECRET');
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

    /**
     * Handle the 'requires_input' event
     *
     * @param $session
     */
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

    /**
     * Handle the verified event for identity verification sessions
     *
     * @param $session
     */
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

    /**
     * Check for fraud based on session details
     *
     * @param $session
     * @return bool
     */
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

    /**
     * Handle Stripe Webhook for all subscription updates
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle(Request $request)
    {
        $endpoint_secret = env('STRIPE_WEBHOOK_SECRET');
        $payload = @file_get_contents('php://input');
        $sig_header = $request->header('Stripe-Signature');
        $event = null;

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );
        } catch (\UnexpectedValueException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
            // Invalid payload
            http_response_code(400);
            exit();
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
            // Invalid signature
            http_response_code(400);
            exit();
        }

        if (!$event || !isset($event->type)) {
            Log::warning('Stripe webhook: invalid payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $type = $event->type;
        $data = $event->data->object;

        $metadata = $event->data->object->metadata ?? null;

        switch ($type) {
            case 'customer.subscription.updated':
                $productType = $metadata->type ?? null;

                switch ($productType) {
                    case 'bill':
                        Log::info("Handling Bill Subscription Update");
                        $this->handleBillSubscriptionUpdate($data, $metadata);
                        break;

                    case 'membership':
                        Log::info("Handling Membership Subscription Update");
                        $this->handleMembershipSubscriptionUpdate($data, $metadata);
                        break;

                    case 'wish':
                        Log::info("Handling Wish Subscription Update");
                        $this->handleWishSubscriptionUpdate($data, $metadata);
                        break;

                    default:
                        Log::warning("Unknown product type in metadata: " . json_encode($metadata));
                        break;
                }
                break;

            case 'customer.subscription.deleted':
                $this->customerSubscriptionDeleted($data);
                Log::info("Subscription canceled: " . $data->id);
                break;

            // case 'customer.subscription.trial_will_end':
            //     $subscriptionId = data_get($event, 'data.object.id');
            //     $customerEmail = data_get($event, 'data.object.customer_email');
            //     $customerName = data_get($event, 'data.object.customer_name');
            //     $invoicePdf = data_get($event, 'data.object.invoice_pdf');

            //     $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->first();

            //     $array = [
            //         'email' => $customerEmail,
            //         'name' => $customerName,
            //         'invoice_pdf' => $invoicePdf,
            //         'uuid' => $subs->uuid,
            //         'notification' => $subs->user->notification_send ?? 0,
            //         'trial_end' => $subs->upcoming_payment ?? null,
            //         'amount' => $subs->amount ?? null,
            //         'currency' => $subs->currency ?? 'GBP',
            //     ];

            //     SendRenewMail::dispatch($array, 'trial', 'site');
            //     Log::info("Trial will end soon for subscription: " . $data->id);
            //     break;
            // $this->customerSubscriptionTrialWillEnd($data);
            default:
                Log::info("Unhandled event type: " . $type);
        }
        return response()->json(['status' => 'success']);
    }

    public function handleBillSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        $status = $data->status;
        $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);

        $user = User::find($metadata->creator_id ?? 0);

        $subs = BillPayment::where('stripe_id', $subscriptionId)->where('user_id', $metadata->user_id)->latest()->first();

        if (!$subs) {
            Log::warning("No active bill subscription found for stripe_id: {$subscriptionId}");
            return response()->json([
                'status' => 'error',
                'message' => 'No active bill subscription found.'
            ], 404);
        }
        $ret = AppStripeControl::getSubscription($subscriptionId, $user->account_id);

        $array = [
            'email' => $data->customer_email,
            'name' => $data->customer_name,
            'invoice_pdf' => $data->invoice_pdf,
            'uuid' => $subs->uuid,
            'notification' => $subs->user->notification_send ?? 0,
            'trial_end' => $subs->upcoming_payment ?? null,
            'amount' => $subs->amount ?? null,
            'currency' => $subs->currency ?? 'GBP',
        ];

        $subs->status = "ended";
        $subs->save();

        $newSubs = new BillPayment();
        $newSubs->stripe_id = $subs->stripe_id;
        $newSubs->session_id = $subs->session_id;
        $newSubs->bills_id = $subs->bills_id;
        $newSubs->user_id = $subs->user_id;
        $newSubs->guest_name = $subs->guest_name;
        $newSubs->guest_email = $subs->guest_email;
        $newSubs->currency = $subs->currency;
        $newSubs->amount = $subs->amount;
        $newSubs->tax = $subs->tax;
        $newSubs->recurring_for = $subs->recurring_for;
        $newSubs->recurring_type = $subs->recurring_type;
        $newSubs->message = $subs->message;
        $newSubs->anonymous = $subs->anonymous;
        $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
        $newSubs->status = "paid";
        $newSubs->created_at = $subs->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        SendRenewMail::dispatch($array, 'renew', 'bill');

        Log::info("Bill subscription updated: {$subscriptionId}, Status: {$status}");
    }

    public function handleMembershipSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        $status = $data->status;
        // $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);

        $user = User::find($metadata->creator_id ?? 0);

        $subs = MembershipPayment::where('stripe_id', $subscriptionId)->where('user_id', $metadata->user_id)->latest()->first();

        if (!$subs) {
            Log::warning("No active membership subscription found for stripe_id: {$subscriptionId}");
            return response()->json([
                'status' => 'error',
                'message' => 'No active membership subscription found.'
            ], 404);
        }
        $ret = AppStripeControl::getSubscription($subscriptionId, $user->account_id);

        $array = [
            'email' => $subs->guest_email ?? $data->customer_email,
            'name' => $subs->guest_name ?? $data->customer_name,
            'invoice_pdf' => $data->invoice_pdf ?? null,
            'uuid' => $subs->uuid,
            'notification' => $subs->user->notification_send ?? 0,
            'trial_end' => $subs->upcoming_payment ?? null,
            'amount' => $subs->amount ?? null,
            'currency' => $subs->currency ?? 'GBP',
        ];

        Log::info(json_encode($array));
        Log::info("Handling membership subscription update for user: {$subs->user_id}, subscription ID: {$subscriptionId}");


        $subs->status = "ended";
        $subs->save();

        $newSubs = new MembershipPayment();
        $newSubs->stripe_id = $subs->stripe_id;
        $newSubs->session_id = $subs->session_id;
        $newSubs->membership_id = $subs->membership_id;
        $newSubs->user_id = $subs->user_id;
        $newSubs->guest_name = $subs->guest_name;
        $newSubs->guest_email = $subs->guest_email;
        $newSubs->currency = $subs->currency;
        $newSubs->amount = $subs->amount;
        $newSubs->tax = $subs->tax;
        $newSubs->recurring_for = $subs->recurring_for;
        $newSubs->recurring_type = $subs->recurring_type;
        $newSubs->message = $subs->message;
        $newSubs->anonymous = $subs->anonymous;
        $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
        $newSubs->status = "paid";
        $newSubs->created_at = $subs->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        SendRenewMail::dispatch($array, 'renew', 'membership');

        Log::info("Membership subscription updated: {$subscriptionId}, Status: {$status}");
    }

    public function handleWishSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        // $status = $data->status;
        $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);

        $subs = StripePaymentDetail::where('user_id', $metadata->user_id)->whereIn('payment_status', ['paid', 'pending'])->latest()->first();
        $wish_subscription = WishItemSubscription::where('stripe_id', $subscriptionId)->where('status', 'paid')->latest()->first();
        if (!$wish_subscription) {
            Log::warning("No active wish subscription found for stripe_id: {$subscriptionId}");
            return response()->json([
                'status' => 'error',
                'message' => 'No active wish subscription found.'
            ], 404);
        }

        $user = User::find($subs->owner->id ?? $subs->owner_id ?? 0);
        if ($user->account_id) {
            $ret = AppStripeControl::getSubscription($data->id, $user->account_id);
        }

        $array = [
            'email' => $data->customer_email,
            'name' => $data->customer_name,
            'invoice_pdf' => $data->invoice_pdf,
            'uuid' => $subs->uuid,
            'notification' => $subs->user->notification_send ?? 0,
            'trial_end' => $subs->upcoming_payment ?? null,
            'amount' => $subs->amount ?? null,
            'currency' => $subs->currency ?? 'GBP',
        ];

        $wish_subscription->status = "ended";
        $wish_subscription->save();

        $newSubs = new WishItemSubscription();
        $newSubs->stripe_id = $wish_subscription->stripe_id;
        $newSubs->session_id = $wish_subscription->session_id;
        $newSubs->wish_item_id = $wish_subscription->wish_item_id;
        $newSubs->user_id = $wish_subscription->user_id;
        $newSubs->guest_name = $wish_subscription->guest_name;
        $newSubs->guest_email = $wish_subscription->guest_email;
        $newSubs->currency = $wish_subscription->currency;
        $newSubs->amount = $wish_subscription->amount;
        $newSubs->tax = $wish_subscription->tax;
        $newSubs->recurring_for = $wish_subscription->recurring_for;
        $newSubs->recurring_type = $wish_subscription->recurring_type;
        $newSubs->payment_method = 'stripe';
        $newSubs->surprise_message = $wish_subscription->surprise_message;
        $newSubs->anonymous = $wish_subscription->anonymous;
        $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
        $newSubs->status = "paid";
        $newSubs->created_at = $wish_subscription->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        SendRenewMail::dispatch($array, 'renew', 'main');
    }


    public function customerSubscriptionDeleted($data)
    {
        $subscriptionId = $data->id;

        // Delete the subscription from your database
        // Example: Subscription::where('stripe_id', $subscriptionId)->delete();

        Log::info("Subscription deleted: {$subscriptionId}");
    }

    /**
     * Handle Stripe Webhook for mandatory subscription status
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */

    public function mandatorySubscriptionStatus(Request $request)
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
        $endpoint_secret = env('MANDATORY_STATUS_WEBHOOK_SECRET');
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
        } catch (\UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $e) {
            Log::error("Webhook signature verification failed: " . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $eventType = $event->type;
        $object = $event->data->object;
        $subscriptionId = data_get($object, 'subscription') ?? data_get($object, 'id');
        $customerId = data_get($object, 'customer');

        try {
            $customer = $stripe->customers->retrieve($customerId, []);
        } catch (\Exception $e) {
            Log::error("Failed to retrieve customer: " . $e->getMessage());
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $subscription = null;
        try {
            $subscription = $stripe->subscriptions->retrieve($subscriptionId, []);
        } catch (\Exception $e) {
            Log::error("Failed to retrieve subscription: " . $e->getMessage());
        }

        $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->latest()->first();

        if (!$subs) {
            Log::info("Subscription record not found for Stripe ID: {$subscriptionId}");
            return response()->json(['message' => 'No record to update'], 200);
        }

        $currentPeriodStart = optional($subscription)->current_period_start ? Carbon::createFromTimestamp($subscription->current_period_start) : null;
        $currentPeriodEnd = optional($subscription)->current_period_end ? Carbon::createFromTimestamp($subscription->current_period_end) : null;
        $status = $subscription->status ?? 'incomplete';

        $subs->current_start_subscription_date = $currentPeriodStart;
        $subs->current_end_subscription_date = $currentPeriodEnd;
        $subs->status = $status;

        if (in_array($status, ['active', 'trialing']) && !$subscription->cancel_at_period_end) {
            $subs->upcoming_payment = Carbon::createFromTimestamp($subscription->current_period_end);
        } else {
            $subs->upcoming_payment = null;
        }

        $subs->save();
        // $subscriptionId = data_get($object, 'subscription');
        $customerName = data_get($object, 'customer_name');
        $invoicePdf = data_get($object, 'invoice_pdf');
        $customerEmail = $customer->email ?? null;

        $array = [
            'email' => $customerEmail ?? null,
            'name' => $customerName ?? null,
            'uuid' => $subs->uuid,
            'invoice_pdf' => $invoicePdf,
            'notification' => $subs->user->notification_send ?? 0,
            'renew_on' => $currentPeriodStart,
            'trial_end' => $subs->current_end_trial_date,
            'amount' => $subs->amount ?? null,
            'currency' => $subs->currency ?? 'GBP',
        ];

        $user = $subs->user;

        switch ($eventType) {
            case 'customer.subscription.trial_will_end':
                Helpers::sendNotification('Free Trial Ending Soon ⏳.', 'Your free trial is about to end.', $customerEmail ?? null);
                SendRenewMail::dispatch($array, 'trial', 'site');
                break;

            case 'invoice.payment_succeeded':
                if ($user) {
                    $user->is_subscribed = 1;
                    $user->save();
                }

                $nowStart = optional($subscription)->current_period_start;
                $previousStart = optional($subs->getOriginal('current_start_subscription_date'))?->timestamp ?? 0;
                $trialEnd = optional($subscription)->trial_end ?? 0;

                // Determine if this is first payment after trial
                if (
                    $status === 'active' &&
                    $trialEnd > 0 &&
                    $nowStart > $trialEnd &&
                    $previousStart < $trialEnd
                ) {
                    $type = 'start';
                } else {
                    $type = 'renew';
                }

                // Ensure we don't send the same type twice for the same cycle
                if ($subs->last_email_type !== $type) {
                    if ($type === 'renew') {
                        Helpers::sendNotification(
                            'Subscription renewed 🎉',
                            '🎉 Your subscription was renewed. Thank you for continuing your journey with Spenny Piggy!',
                            $customerEmail ?? null
                        );
                    } else { 
                        Helpers::sendNotification(
                            '🎉 You’ve successfully started your subscription!',
                            'Get ready to unlock all premium features 🚀 — no limits, no restrictions!',
                            $customerEmail ?? null
                        );
                    }
                    SendRenewMail::dispatch($array, $type, 'site');

                    // Update record so next webhook won't send same email again
                    $subs->last_email_type = $type;
                    $subs->save();
                } else {
                    Log::info("Skipping duplicate {$type} email for subscription {$subscriptionId}");
                }
                break;


            case 'invoice.payment_failed':
                $subs->status = 'failed';
                $subs->save();
                if ($user) {
                    $user->is_subscribed = 0;
                    $user->save();
                }
                Helpers::sendNotification('Spenny PiggySubscription could not be processed ❌', 'There was a problem processing your payment. Please update your payment method to continue enjoying premium access.', $customerEmail ?? null);
                SendRenewMail::dispatch($array, 'failed', 'site');
                break;

            case 'customer.subscription.deleted':
                Log::info("Subscription deleted: {$subscriptionId}");
                $subs->status = 'cancelled';
                $subs->cancelled_at = now();
                $subs->save();
                if ($user) {
                    $user->is_subscribed = 0;
                    $user->save();
                }
                Helpers::sendNotification('Subscription has been cancelled 🛑', 'We’re sorry to see you go. Your access will remain active until the end of the current billing period.', $customerEmail ?? null);
                SendRenewMail::dispatch($array, 'cancelled', 'site');
                break;

            default:
                Log::info('Unhandled event type: {$eventType}');
                break;
        }

        return response()->json(['status' => 'success']);
    }



    public function CreateProductForCreatorAndGifter()
    {
        $client = new StripeClient(env('STRIPE_SECRET_KEY'));
        try {
            // Step 1: Create the product
            $product = $client->products->create([
                'name' => 'Creator Monthly Subscription 4 Pound Product',
            ]);

            // Step 2: Create the recurring price
            $price = $client->prices->create([
                'unit_amount' => 400, // 4 GBP = 400 pence
                'currency' => 'gbp',
                'recurring' => [
                    'interval' => 'month', // monthly plan
                    'interval_count' => 1
                ],
                'product' => $product->id,
            ]);

            return [
                'product_id' => $product->id,
                'price_id' => $price->id,
            ];
        } catch (\Exception $e) {
            Log::error("Error creating £4/month subscription: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
}
