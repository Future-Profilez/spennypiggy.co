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
        $event = null;

        try {
            $event = Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
        } catch (\UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $e) {
            Log::error("Webhook signature verification failed: " . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event) {
            $eventType = $event->type;
            $object = $event->data->object;

            $customer_id = $object->customer ?? null;
            $customer = Customer::retrieve($customer_id);

            $subscriptionId = data_get($object, 'subscription');
            $customerEmail = $customer->email ?? null;
            $customerName = data_get($object, 'customer_name');
            $invoicePdf = data_get($object, 'invoice_pdf');

            $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->orderBy('updated_at', 'desc')->first();

            if ($subs) {
                $array = [
                    'email' => $customerEmail,
                    'name' => $customerName,
                    'invoice_pdf' => $invoicePdf,
                    'uuid' => $subs->uuid,
                    'notification' => $subs->user->notification_send ?? 0,
                    'trial_end' => $subs->upcoming_payment ?? null,
                    'amount' => $subs->amount ?? null,
                    'currency' => $subs->currency ?? 'GBP',
                ];

                switch ($eventType) {
                    case "customer.subscription.trial_will_end":
                        // Notify user 3 days before charge
                        SendRenewMail::dispatch($array, 'trial', 'site');
                        break;

                    case "invoice.payment_succeeded":
                        // Carbon::setTestNow(Carbon::create(2026, 1, 5, 10, 30, 0));

                        if (($subs->current_end_trial_date && Carbon::parse($subs->current_end_trial_date)->lte(now()) && !$subs->current_end_subscription_date) || ($subs->current_end_subscription_date &&
                            Carbon::parse($subs->current_end_subscription_date)->lte(now()))) {

                            $periodEnd = data_get($object, 'lines.data.0.period.end');
                            $subs->upcoming_payment = $periodEnd ? Carbon::createFromTimestamp($periodEnd)->format('Y-m-d H:i:s') : null;
                            $subs->current_start_subscription_date = now();
                            $subs->current_end_subscription_date = now()->addMonths(1);
                            $subs->status = "paid";
                            $subs->save();

                            SendRenewMail::dispatch($array, 'renew', 'site');
                            // Optionally: SendPaymentSuccessEmail::dispatch(...)
                        }
                        // Carbon::setTestNow(); // optional

                        break;

                    case "invoice.payment_failed":
                        Log::warning("Payment failed for subscription: {$subscriptionId}");
                        $subs->status = "failed";
                        $subs->save();
                        SendRenewMail::dispatch($array, 'failed', 'site');
                        break;

                    default:
                        Log::info("Unhandled event type: {$eventType}");
                        break;
                }
            }
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
