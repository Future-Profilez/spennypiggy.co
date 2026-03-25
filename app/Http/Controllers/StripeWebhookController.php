<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\SendIdentityVerificationEmail;
use App\Mail\PaymentSuccessMail;
use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\Deliverable;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\WishItemSubscription;
use App\StripeControl as AppStripeControl;
use Carbon\Carbon;
use Stripe\StripeClient;
use Stripe\Stripe;
use Stripe\Webhook;
use App\Mail\TaskPurchasedMail;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskRefunded;
use App\Services\UserProfileService;
use App\Services\StripeMetadataService;
use App\Services\Risk\RiskService;

class StripeWebhookController extends Controller
{
    protected $userProfileService;
    protected $riskService;

    public function __construct(UserProfileService $userProfileService, RiskService $riskService)
    {
        $this->userProfileService = $userProfileService;
        $this->riskService = $riskService;
    }

    /**
     * Handle Stripe Webhook for ALL events (Payment, Identity, Connect, Subscription)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle(Request $request)
    {
        Log::info("StripeWebhookController: Received request at /webhook/payment (Unified Endpoint)");
        
        // Ensure API key is set for any subsequent Stripe calls
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

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
            Log::error('Stripe webhook: Invalid payload');
            return response()->json(['status' => false, 'message' => $e->getMessage()], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Stripe webhook: Invalid signature');
            return response()->json(['status' => false, 'message' => $e->getMessage()], 400);
        }

        if (!$event || !isset($event->type)) {
            Log::warning('Stripe webhook: Invalid event');
            return response()->json(['error' => 'Invalid event'], 400);
        }

        $webhookStatus = null;
        if (isset($event->id)) {
            $webhookStatus = \App\Models\StripeWebhookStatus::where('event_id', $event->id)->first();

            if ($webhookStatus && ($webhookStatus->status === 'processed' || $webhookStatus->processed_at)) {
                Log::info("Stripe Webhook: Event already processed", ['event_id' => $event->id]);
                return response()->json(['status' => 'success', 'message' => 'Already processed']);
            }

            if ($webhookStatus && $webhookStatus->status === 'processing' && $webhookStatus->updated_at && $webhookStatus->updated_at->gt(now()->subMinutes(5))) {
                Log::info("Stripe Webhook: Event already processing", ['event_id' => $event->id]);
                return response()->json(['status' => 'success', 'message' => 'Already processing']);
            }

            if ($webhookStatus) {
                $webhookStatus->update([
                    'event_type' => $event->type,
                    'data' => json_encode($event->data->object),
                    'status' => 'processing',
                    'processed_at' => null,
                    'last_error' => null,
                ]);
            } else {
                $webhookStatus = \App\Models\StripeWebhookStatus::create([
                    'event_id' => $event->id,
                    'event_type' => $event->type,
                    'data' => json_encode($event->data->object),
                    'status' => 'processing',
                ]);
            }
        }

        // Log if it's a Connect event
        if (isset($event->account)) {
            Log::info("Connect Event: {$event->type}", ['account' => $event->account]);
        }

        $type = $event->type;
        $data = $event->data->object;
        $metadata = $event->data->object->metadata ?? null;

        Log::info("Handling Stripe Event: " . $type);

        try {
            switch ($type) {
            // --- Identity Verification Events ---
            case 'identity.verification_session.requires_input':
            case 'identity.verification_session.verified':
                $this->processIdentityVerification($event);
                break;

            // --- Payment & Subscription Events ---
            case 'checkout.session.completed':
                $this->handleCheckoutSessionCompleted($data, $metadata);
                $this->handleSupportPaymentDeliverableReady($data, $metadata);
                break;

            case 'checkout.session.async_payment_succeeded':
                $this->handleAsyncPaymentSucceeded($data);
                break;

            case 'checkout.session.async_payment_failed':
                $this->handleAsyncPaymentFailed($data);
                break;

            case 'invoice.paid':
                // Handles Wish/Bill/Membership subscriptions
                $this->handleInvoicePaid($data); 
                // Handles MonthlyCharge (Platform Subscription)
                $this->processMandatorySubscription($event); 
                break;

            case 'invoice.payment_succeeded':
                // Handles Wish renewals
                $this->handleInvoicePaymentSucceeded($data, $metadata); 
                $this->handleSupportPaymentDeliverableReady($data, $metadata);
                // Handles MonthlyCharge (Platform Subscription)
                $this->processMandatorySubscription($event); 
                break;

            case 'invoice.payment_failed':
                $this->processMandatorySubscription($event);
                break;

            case 'charge.dispute.created':
                $this->handleChargeDisputeCreated($data);
                break;

            case 'charge.dispute.closed':
                $this->handleChargeDisputeClosed($data);
                break;

            case 'charge.refunded':
                $this->handleChargeRefunded($data);
                break;

            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($data, $event->account ?? null);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($data);
                break;

            case 'early_fraud_warning.created':
                $this->handleEarlyFraudWarningCreated($data);
                break;

            case 'customer.subscription.updated':
                // Handle Wish/Bill/Membership updates based on metadata
                $productType = $metadata->type ?? null;
                if ($productType) {
                    switch ($productType) {
                        case 'bill':
                            $this->handleBillSubscriptionUpdate($data, $metadata);
                            break;
                        case 'membership':
                            $this->handleMembershipSubscriptionUpdate($data, $metadata);
                            break;
                        case 'wish':
                            $this->handleWishSubscriptionUpdate($data, $metadata);
                            break;
                    }
                }
                // Handle MonthlyCharge updates (Platform Subscription)
                $this->processMandatorySubscription($event);
                break;

            case 'customer.subscription.deleted':
                $this->customerSubscriptionDeleted($data);
                $this->processMandatorySubscription($event);
                break;

            case 'customer.subscription.trial_will_end':
            case 'customer.subscription.created':
            case 'customer.updated':
                $this->processMandatorySubscription($event);
                break;
            
            case 'review.closed':
                $this->processMandatorySubscription($event);
                break;

            default:
                Log::info("Unhandled event type: " . $type);
            }
        } catch (\Throwable $e) {
            if ($webhookStatus) {
                $webhookStatus->update([
                    'status' => 'failed',
                    'last_error' => $e->getMessage(),
                ]);
            }
            throw $e;
        }

        if ($webhookStatus) {
            $webhookStatus->update([
                'status' => 'processed',
                'processed_at' => now(),
                'last_error' => null,
            ]);
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Process Identity Verification Events (extracted from handleWebhook)
     */
    private function processIdentityVerification($event)
    {
        $session = $event->data->object;
        $type = $event->type;

        switch ($type) {
            case 'identity.verification_session.requires_input':
                $this->handleRequiresInputEvent($session);
                break;

            case 'identity.verification_session.verified':
                $this->handleVerifiedEvent($session);
                break;

            default:
                Log::warning('Unhandled identity event type', ['type' => $type]);
                break;
        }
    }

    /**
     * Process Mandatory Subscription (MonthlyCharge) Events (extracted from mandatorySubscriptionStatus)
     */
    private function processMandatorySubscription($event)
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
        
        $eventType = $event->type;
        $object = $event->data->object;

        $subscriptionId = $object->subscription ?? $object->id ?? null;
        if (!$subscriptionId) return; // Ignored

        // Check if this subscription exists in MonthlyCharge table
        // If not, and it's not a creation event, we might ignore it or create it if needed.
        // The original logic fetches subscription from Stripe first to get customer info.
        
        // Optimisation: Check DB first to see if we even care about this subscription ID?
        // But for 'customer.subscription.created', we might need to create it.
        // Let's stick to original logic flow but safer.

        try {
            // Fetch subscription from Stripe FIRST to get customer info (expand customer)
            // Only if it looks like a subscription ID (starts with sub_)
            if (strpos($subscriptionId, 'sub_') !== 0) {
                 // If it's not a subscription object ID, we might need to look it up differently?
                 // But $object->subscription usually holds the ID.
                 if (!isset($object->subscription) && $object->object !== 'subscription') {
                     return; 
                 }
            }

            // If event object IS subscription, use it. If invoice, use subscription ID.
            if ($object->object === 'subscription') {
                $subscription = $object;
                // We need customer details, might need to fetch if not expanded
                if (is_string($subscription->customer)) {
                     $customer = $stripe->customers->retrieve($subscription->customer);
                } else {
                     $customer = $subscription->customer;
                }
            } else {
                $subscription = $stripe->subscriptions->retrieve($subscriptionId, [
                    'expand' => ['customer']
                ]);
                $customer = $subscription->customer;
            }
        } catch (\Exception $e) {
            Log::error("Failed to retrieve subscription/customer in processMandatorySubscription: " . $e->getMessage());
            return;
        }

        // Latest DB row for this subscription
        $subs = MonthlyCharge::where('stripe_id', $subscriptionId)
            ->latest()
            ->first();

        // If no DB record and not a creation event, we might want to skip or create?
        // Original logic: "Trial Started" creates record. "First Payment" creates record.
        
        /* ================= Stripe billing period ================= */
        $stripeStart = Carbon::createFromTimestamp($subscription->current_period_start);
        $stripeEnd   = Carbon::createFromTimestamp($subscription->current_period_end);

        /* ================= Handle different event types ================= */

        // TRIAL STARTED
        if (
            $eventType === 'customer.subscription.trial_will_end' ||
            ($eventType === 'customer.subscription.created' && $subscription->status === 'trialing')
        ) {
            // Check duplicate
            if ($subs && $subs->status === 'trialing') {
                return;
            }

            // Create new record for trial
            MonthlyCharge::create([
                'user_id' => $subscription->metadata->user_id ?? $customer->metadata->user_id ?? null,
                'name' => $customer->name ?? 'Creator',
                'email' => $customer->email,
                'stripe_id' => $subscriptionId,
                'current_start_trial_date' => $stripeStart,
                'current_end_trial_date' => $stripeEnd,
                'current_start_subscription_date' => null,
                'current_end_subscription_date' => null,
                'status' => 'trialing',
                'upcoming_payment' => $stripeEnd,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info("MonthlyCharge: Trial Started/Will End processed", ['sub_id' => $subscriptionId]);
            return;
        }

        // TRIAL ENDED / SUBSCRIPTION STARTED (First Payment)
        if ($eventType === 'invoice.payment_succeeded' && $subscription->status === 'active') {

            $invoice = $object;
            $amount = ($invoice->amount_paid ?? 0) / 100;
            $currency = strtoupper($invoice->currency ?? 'GBP');

            $tax = 0;
            if (!empty($invoice->total_tax_amounts)) {
                foreach ($invoice->total_tax_amounts as $t) {
                    $tax += ($t->amount ?? 0) / 100;
                }
            }

            // Check if this is the first payment after trial
            $isFirstPayment = false;
            if ($subs) {
                $isFirstPayment = !empty($subs->current_start_trial_date) &&
                    empty($subs->current_start_subscription_date);
            } else {
                // No record exists, create first one
                $isFirstPayment = true;
            }

            if ($isFirstPayment) {
                if ($subs) {
                    // Update existing trial record with subscription dates
                    $subs->current_start_subscription_date = $stripeStart;
                    $subs->current_end_subscription_date = $stripeEnd;
                    $subs->amount = $amount;
                    $subs->currency = $currency;
                    $subs->tax = $tax;
                    $subs->status = 'active';
                    $subs->upcoming_payment = $stripeEnd;
                    $subs->save();
                } else {
                    // Create new record for first payment (if trial wasn't tracked)
                    MonthlyCharge::create([
                        'user_id' => $subscription->metadata->user_id ?? $customer->metadata->user_id ?? null,
                        'name' => $customer->name ?? 'Creator',
                        'email' => $customer->email,
                        'stripe_id' => $subscriptionId,
                        'current_start_trial_date' => null, // No trial for this subscription
                        'current_end_trial_date' => null,
                        'current_start_subscription_date' => $stripeStart,
                        'current_end_subscription_date' => $stripeEnd,
                        'amount' => $amount,
                        'currency' => $currency,
                        'tax' => $tax,
                        'status' => 'active',
                        'upcoming_payment' => $stripeEnd,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                Log::info("MonthlyCharge: First Payment processed", ['sub_id' => $subscriptionId]);
                return;
            }
        }

        // SUBSCRIPTION RENEWAL (Existing subscription, new billing period)
        if ($eventType === 'invoice.payment_succeeded' && $subs && $subs->status === 'active') {

            $invoice = $object;
            $amount = ($invoice->amount_paid ?? 0) / 100;
            $currency = strtoupper($invoice->currency ?? 'GBP');

            $tax = 0;
            if (!empty($invoice->total_tax_amounts)) {
                foreach ($invoice->total_tax_amounts as $t) {
                    $tax += ($t->amount ?? 0) / 100;
                }
            }

            // Check if this billing period already exists
            $exists = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->where('current_start_subscription_date', $stripeStart->toDateString())
                ->where('current_end_subscription_date', $stripeEnd->toDateString())
                ->exists();

            if (!$exists) {
                // End previous cycle
                $subs->status = 'ended';
                $subs->save();

                // Create new active cycle WITHOUT trial dates
                MonthlyCharge::create([
                    'user_id' => $subs->user_id,
                    'name' => $subs->name ?? $customer->name ?? 'Creator',
                    'email' => $subs->email ?? $customer->email,
                    'stripe_id' => $subscriptionId,

                    // DO NOT copy trial dates for renewals
                    'current_start_trial_date' => null,
                    'current_end_trial_date' => null,

                    // New subscription period
                    'current_start_subscription_date' => $stripeStart,
                    'current_end_subscription_date' => $stripeEnd,

                    'amount' => $amount,
                    'currency' => $currency,
                    'tax' => $tax,
                    'status' => 'active',
                    'upcoming_payment' => $stripeEnd,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Update user subscription status
                if ($subs->user) {
                    $subs->user->is_subscribed = 1;
                    $subs->user->save();
                }

                Log::info("MonthlyCharge: Renewal processed", ['sub_id' => $subscriptionId]);
                return;
            }
        }

        // PAYMENT FAILED
        if ($eventType === 'invoice.payment_failed') {
            if ($subs) {
                $subs->status = 'failed';
                $subs->upcoming_payment = null;
                $subs->save();

                if ($subs->user) {
                    $subs->user->is_subscribed = 0;
                    $subs->user->save();
                }
            }
            Log::info("MonthlyCharge: Payment Failed processed", ['sub_id' => $subscriptionId]);
            return;
        }

        // SUBSCRIPTION CANCELLED
        if ($eventType === 'customer.subscription.deleted') {
            if ($subs) {
                $subs->status = 'cancelled';
                $subs->upcoming_payment = null;
                $subs->save();

                if ($subs->user) {
                    $subs->user->is_subscribed = 0;
                    $subs->user->save();
                }
            }
            Log::info("MonthlyCharge: Subscription Cancelled processed", ['sub_id' => $subscriptionId]);
            return;
        }

        // UPDATE STATUS FOR OTHER EVENTS
        if ($subs && $subs->status !== $subscription->status) {
            $subs->status = $subscription->status;

            if (in_array($subscription->status, ['active', 'trialing']) && !$subscription->cancel_at_period_end) {
                $subs->upcoming_payment = $stripeEnd;
            } else {
                $subs->upcoming_payment = null;
            }

            $subs->save();
            Log::info("MonthlyCharge: Status Updated", ['sub_id' => $subscriptionId, 'status' => $subs->status]);
        }

        // Handle customer details update
        if (in_array($eventType, ['customer.updated', 'customer.subscription.updated']) && $subs) {
            // Update name and email if they changed in Stripe
            if ($customer) {
                $updates = [];
                if ($customer->name && $customer->name !== $subs->name) {
                    $updates['name'] = $customer->name;
                }
                if ($customer->email && $customer->email !== $subs->email) {
                    $updates['email'] = $customer->email;
                }

                if (!empty($updates)) {
                    // Update all records for this subscription to keep consistency
                    MonthlyCharge::where('stripe_id', $subscriptionId)
                        ->update($updates);
                    Log::info("MonthlyCharge: Customer details updated", ['sub_id' => $subscriptionId]);
                }
            }
        }
        
        // Handle Manual Capture (review.closed)
        if ($eventType === 'review.closed') {
             $review = $object;
             if ($review->reason === 'approved') {
                 $paymentIntentId = $review->payment_intent;
                 if ($paymentIntentId) {
                     try {
                         $paymentIntent = $stripe->paymentIntents->retrieve($paymentIntentId, []);
                         if ($paymentIntent->status === 'requires_capture') {
                             $stripe->paymentIntents->capture($paymentIntentId);
                             Log::info("Manually captured PaymentIntent: {$paymentIntentId}");
                         }
                     } catch (\Exception $e) {
                         Log::error("Failed to capture PaymentIntent {$paymentIntentId}: " . $e->getMessage());
                     }
                 }
             }
        }
    }

    /**
     * Handle the 'requires_input' event
     *
     * @param $session
     */
    private function handleRequiresInputEvent($session)
    {
        $user = User::where('stripe_user_id', $session->id)->first();

        if ($user) {
            $isFraudulent = $this->checkForFraud($session);

            $errorPayload = $session->last_error ? json_encode($session->last_error) : json_encode([
                'code' => 'requires_input',
                'reason' => 'Additional information is required to complete verification.'
            ]);

            $user->update([
                'identity_status' => $isFraudulent ? 3 : 0, // 3 = Fraud, 0 = Failed
                'identity_verification_error' => $errorPayload,
                'identity_verification_details' => null,
                'identity_verified_at' => null,
            ]);

            $emailType = $isFraudulent ? 'fraud' : 'failed';
            SendIdentityVerificationEmail::dispatch($user, $emailType);

            $err = $session->last_error ?? null;
            $code = data_get($err, 'code', 'requires_input');
            $reason = data_get($err, 'reason', 'Additional information is required to complete verification.');
            Helpers::sendNotification(
                'Identity verification rejected ❌',
                "Reason: {$reason} (code: {$code})",
                $user->email
            );
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
        $user = User::where('stripe_user_id', $session->id)->first();

        if ($user) {
            $docType = data_get($session, 'verified_outputs.document.type')
                ?: data_get($session, 'last_verification_report.document.type');

            if ($docType && strtolower($docType) !== 'passport') {
                $error = [
                    'code' => 'document_type_not_allowed',
                    'reason' => 'Only passports are accepted for identity verification.'
                ];

                $user->update([
                    'identity_status' => 0, // Failed per policy
                    'identity_verified_at' => null,
                    'identity_verification_error' => json_encode($error),
                    'identity_verification_details' => null,
                ]);

                SendIdentityVerificationEmail::dispatch($user, 'failed');
                Helpers::sendNotification(
                    'Identity verification rejected ❌',
                    'Reason: Only passports are accepted for identity verification.',
                    $user->email
                );
                return;
            }

            $isFraudulent = $this->checkForFraud($session);

            $updateData = [
                'identity_status' => $isFraudulent ? 3 : 1, // 3 = Fraud, 1 = Verified
                'identity_verified_at' => $isFraudulent ? null : now(),
                'identity_verification_details' => null,
            ];

            if (!$isFraudulent) {
                $updateData['identity_admin_status'] = 1;
                $updateData['identity_admin_reviewed_at'] = now();
            }

            $user->update($updateData);

            $emailType = $isFraudulent ? 'fraud' : 'success';
            SendIdentityVerificationEmail::dispatch($user, $emailType);

            // Request redaction of verification session to avoid storing sensitive images at Stripe
            try {
                $client = new StripeClient(env('STRIPE_SECRET_KEY'));
                $client->identity->verificationSessions->redact($session->id, []);
            } catch (\Throwable $e) {
                Log::warning('Stripe Identity redaction failed', [
                    'user_id' => $user->id,
                    'session_id' => $session->id ?? null,
                    'error' => $e->getMessage(),
                ]);
            }

            if ($isFraudulent) {
                Helpers::sendNotification(
                    'Identity verification rejected ❌',
                    'Reason: Verification checks did not pass or suspected fraud.',
                    $user->email
                );
            } else {
                Helpers::sendNotification(
                    'Identity verification successful ✅',
                    'Your identity has been verified successfully.',
                    $user->email
                );
            }
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
        if (isset($session->status) && $session->status === 'verified') {
            return false;
        }

        if ($session->last_error) {
            Log::warning('Fraud detected based on last error', ['error' => $session->last_error]);
            return true;
        }

        $checks = data_get($session, 'verification_checks', []);
        if (is_array($checks)) {
            foreach ($checks as $check) {
                $status = is_object($check) ? ($check->status ?? 'passed') : (data_get($check, 'status') ?? 'passed');
                if ($status !== 'passed') {
                    Log::warning('Fraud detected based on failed verification check', ['check' => $check]);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Handle checkout session completed event
     */
    public function handleCheckoutSessionCompleted($session, $metadata)
    {
        try {
            Log::info("Processing checkout session completed", [
                'session_id' => $session->id,
                'metadata' => $metadata
            ]);

            try {
                $payment = \App\Models\Payment::where('stripe_session_id', $session->id)->first();
                if ($payment) {
                    $newStatus = 'succeeded';
                    if (
                        $payment->status === 'review_hold' ||
                        (is_array($payment->reason_codes) && in_array('MARK_REVIEW_HOLD', $payment->reason_codes))
                    ) {
                        $newStatus = 'review_hold';
                    }

                    $payment->update([
                        'stripe_payment_intent_id' => $session->payment_intent ?? $payment->stripe_payment_intent_id,
                        'status' => $newStatus,
                    ]);

                    Log::info("Risk Ledger: Checkout session mapped to payment", [
                        'session_id' => $session->id,
                        'payment_id' => $payment->id,
                        'status' => $newStatus,
                        'payment_intent' => $session->payment_intent ?? null,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Risk Ledger: Failed mapping checkout.session.completed: " . $e->getMessage(), [
                    'session_id' => $session->id,
                ]);
            }

            // Check if this is a wish item purchase
            if (isset($metadata->deliverable_type) && $metadata->deliverable_type === 'media_bundle') {
                $this->processWishItemDeliverable($session, $metadata);
            }

            // Check if this is a task purchase
            if (isset($metadata->type) && $metadata->type === 'task_purchase') {
                $this->processTaskPurchase($session, $metadata);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error("Error processing checkout session completed", [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Process wish item deliverable creation
     */
    private function processWishItemDeliverable($session, $metadata)
    {
        // Get wish item to check for content file
        $wishItem = null;
        $deliverableType = $metadata->deliverable_type ?? 'media_bundle';
        $contentUrl = null;

        if (isset($metadata->wish_id)) {
            $wishItem = \App\Models\WishItem::find($metadata->wish_id);
            if ($wishItem && $wishItem->content_file) {
                $deliverableType = 'content_file';
                $contentUrl = $wishItem->content_file_url; // Use Uploadcare URL
            }
        }

        // Get payment details to retrieve message and anonymous data
        $payment = \App\Models\StripePaymentDetail::where('session_id', $session->id)->first();

        // Create deliverable record with proper fields
        $deliverable = \App\Models\Deliverable::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'product_id' => (string) ($metadata->wish_id ?? 'unknown'),
            'item_id' => $metadata->wish_id ?? null,
            'creator_id' => $metadata->creator_id ?? null,
            'gifter_id' => $metadata->user_id ?? null,
            'price_id' => $metadata->price_id ?? null,
            'payment_intent_id' => $session->payment_intent ?? null,
            'session_id' => $session->id,
            'deliverable_type' => $deliverableType,
            'product_type' => str_contains($metadata->product_type ?? '', 'subscription') ? 'wish_subscription' : 'wish',
            'transaction_amount' => ($session->amount_total ?? 0) / 100, // Convert from cents
            'status' => 'pending',
            'customer_email' => $session->customer_details->email ?? null,
            'customer_name' => $session->customer_details->name ?? null,
            'payment_currency' => strtoupper($session->currency ?? 'GBP'),
            'anonymous' => $payment ? $payment->anonymous : false,
            'message' => $payment ? $payment->message : null,
            'metadata' => json_encode([
                'certificate' => $metadata->certificate ?? 'true',
                'product_type' => $metadata->product_type ?? 'wish_one_off',
                'content_url' => $contentUrl, // Real content URL instead of zip
                'content_file_name' => $wishItem->content_file_name ?? null,
                'content_file_type' => $wishItem->content_file_type ?? null,
                'session_data' => [
                    'amount_total' => $session->amount_total,
                    'currency' => $session->currency,
                    'customer_email' => $session->customer_details->email ?? null,
                    'payment_status' => $session->payment_status
                ]
            ])
        ]);

        Log::info("Created deliverable record", [
            'deliverable_id' => $deliverable->id,
            'uuid' => $deliverable->uuid,
            'session_id' => $session->id,
            'deliverable_type' => $deliverableType,
            'has_content_file' => $wishItem && $wishItem->content_file ? true : false
        ]);

        // Dispatch job to process the deliverable (media bundle creation, etc.)
        \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

        // Update Stripe payment intent metadata (exactly like membership)
        if ($session->payment_intent) {
            try {
                $stripeMetadataService = app(StripeMetadataService::class);
                $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                    'wish_processed_at' => now()->toISOString(),
                    'immediate_delivery' => 'true'
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata for wish', [
                    'deliverable_id' => $deliverable->id,
                    'payment_intent_id' => $session->payment_intent,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Clear user cache for the creator
        if ($metadata->creator_id) {
            $creator = \App\Models\User::find($metadata->creator_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
            }
        }

        // Send thank you email to the purchaser
        if (isset($metadata->user_id)) {
            $payment = \App\Models\StripePaymentDetail::where('session_id', $session->id)->first();
            if ($payment) {
                // Check if user exists and has is_uk = 0 (to match the relationship constraint)
                $user = \App\Models\User::where('id', $metadata->user_id)->where('is_uk', 0)->first();

                if ($user) {
                    $currency = \App\Models\Currency::where('iso', strtoupper($session->currency))->first();
                    $currencySymbol = $currency ? $currency->symbol : '£';

                    Log::info("Skipping CheckoutMailToUser dispatch in webhook - already handled by checkout controller", [
                        'payment_id' => $payment->id,
                        'user_id' => $metadata->user_id,
                        'currency' => $currencySymbol
                    ]);

                    // \App\Jobs\CheckoutMailToUser::dispatch($payment, $currencySymbol);
                    // NOTE: Disabled to prevent duplicate emails - checkout controller handles this
                } else {
                    Log::info('User not eligible for email (is_uk != 0 or user not found)', [
                        'user_id' => $metadata->user_id
                    ]);
                }
            } else {
                Log::warning("Payment record not found for session", ['session_id' => $session->id]);
            }
        }
    }

    /**
     * Process task purchase creation
     */
    private function processTaskPurchase($session, $metadata)
    {
        Log::info("Processing task purchase", ['session_id' => $session->id]);

        $taskId = $metadata->task_id ?? null;
        $buyerId = $metadata->buyer_id ?? null;
        $creatorId = $metadata->creator_id ?? null;

        if (!$taskId || !$buyerId) {
            Log::error("Missing task_id or buyer_id in metadata for task purchase");
            return;
        }

        // Idempotency check
        if (TaskPurchase::where('stripe_session_id', $session->id)->exists()) {
            Log::info("Task purchase already exists for session", ['session_id' => $session->id]);
            return;
        }

        $task = Task::find($taskId);
        if (!$task) {
            Log::error("Task not found for purchase", ['task_id' => $taskId]);
            return;
        }

        $currency = strtoupper($session->currency ?? ($metadata->currency ?? ($task->currency ?? 'GBP')));
        $currencyModel = \App\Models\Currency::where('ISO', $currency)->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $itemAmountMinor = $metadata->item_amount ?? null;
        $amount = $itemAmountMinor !== null ? ((float) $itemAmountMinor / $multiplier) : ((float) ($session->amount_total ?? 0) / $multiplier);

        $vat = isset($metadata->vat_amount) ? ((float) $metadata->vat_amount / $multiplier) : 0;
        $vatPercent = (float) ($metadata->vat_percent ?? 0);
        if ((!$vat || $vat <= 0) && $vatPercent > 0) {
            $vat = round(((float) $amount * $vatPercent) / 100, 2, PHP_ROUND_HALF_UP);
        }
        $adminFee = isset($metadata->admin_fee) ? ((float) $metadata->admin_fee / $multiplier) : 0;
        $platformFee = isset($metadata->platform_fee) ? ((float) $metadata->platform_fee / $multiplier) : 0;
        $transferAmount = isset($metadata->transfer_amount) ? ((float) $metadata->transfer_amount / $multiplier) : 0;

        // Try to get charge_id from payment intent if available
        $chargeId = null;
        if (!empty($session->payment_intent)) {
            try {
                $client = new StripeClient(config('services.stripe.secret'));
                // Check if payment_intent is already an object (expanded) or string
                $piId = is_string($session->payment_intent) ? $session->payment_intent : $session->payment_intent->id;
                $pi = $client->paymentIntents->retrieve($piId, ['expand' => ['latest_charge']]);
                $chargeId = $pi->latest_charge->id ?? ($pi->latest_charge ?? null);
            } catch (\Exception $e) {
                Log::warning('Failed to retrieve charge_id for task purchase (webhook)', ['pi' => $session->payment_intent]);
            }
        }

        // Determine initial status based on payment_status
        // 'paid' -> 'paid', 'unpaid'/'no_payment_required' -> 'pending'
        $initialStatus = ($session->payment_status === 'paid') ? 'paid' : 'pending';

        // Create TaskPurchase
        $purchase = TaskPurchase::create([
            'task_id' => $taskId,
            'supporter_id' => $buyerId,
            'creator_id' => $creatorId ?? $task->creator_id,
            'stripe_session_id' => $session->id,
            'payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : ($session->payment_intent->id ?? null),
            'charge_id' => $chargeId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => $initialStatus,
            'payment_type' => $metadata->payment_type ?? 'STANDARD',
            'gifter_message' => $metadata->gifter_message ?? null,
            'admin_fee' => $adminFee,
            'platform_fee' => $platformFee,
            'vat_amount' => $vat,
            'transfer_amount' => $transferAmount,
            'dispute_status' => 'none',
        ]);

        // SLA logic
        $slaHours = (int) ($metadata->sla_hours ?? 0);
        if ($slaHours > 0) {
            $purchase->sla_deadline = Carbon::now()->addHours($slaHours);
            $purchase->save();
        }

        // Create Deliverable
        $deliverable = Deliverable::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => (string) $taskId,
            'item_id' => $taskId,
            'order_id' => $purchase->id,
            'creator_id' => $creatorId ?? $task->creator_id,
            'gifter_id' => $buyerId,
            'payment_intent_id' => $session->payment_intent,
            'session_id' => $session->id,
            'deliverable_type' => 'digital_task',
            'product_type' => 'task',
            'transaction_amount' => $amount,
            'status' => 'pending',
            'sla_hours' => $slaHours,
            'due_at' => $slaHours > 0 ? Carbon::now()->addHours($slaHours) : null,
            'refund_eligible' => $slaHours > 0,
            'payment_status' => 'paid',
            'payment_type' => $metadata->payment_type ?? 'STANDARD',
            'payment_currency' => strtoupper($session->currency ?? 'GBP'),
            'customer_email' => $session->customer_details->email ?? null,
            'customer_name' => $session->customer_details->name ?? null,
            'metadata' => json_encode($metadata),
        ]);

        // Dispatch job to process the deliverable (certificate generation)
        \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

        // Initial Metadata Sync (ensure payment_status is 'paid' on Stripe)
        try {
            app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable);
        } catch (\Exception $e) {
            Log::error("Failed to sync initial metadata in processTaskPurchase: " . $e->getMessage());
        }

        // Handle Instant Task
        if (($metadata->task_type ?? '') === 'instant') {
            $purchase->status = 'completed';
            $purchase->completed_at = Carbon::now();
            $purchase->save();

            $deliverable->status = 'delivered';
            $deliverable->delivered_at = Carbon::now();
            $deliverable->save();

            // Update Metadata for Instant Completion
            try {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                    'content_delivery_status' => 'delivered',
                    'current_status_of_order' => 'completed',
                    'task_type' => 'instant'
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to update metadata on instant task completion (webhook): " . $e->getMessage());
            }

            Log::info("Instant task purchase completed", ['purchase_id' => $purchase->id]);
        } else {
            Log::info("Timed task purchase created", ['purchase_id' => $purchase->id]);
        }

        try {
            $creator = User::find($creatorId ?? $task->creator_id);
            $supporter = $buyerId ? User::find($buyerId) : null;

            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                Mail::to($creator->email)->send(new TaskPurchasedMail($purchase, $task, $supporter));

                Helpers::sendNotification(
                    "New Task Order! 💰",
                    ($supporter ? $supporter->name : "A Guest") . " purchased your task: " . $task->title,
                    $creator->email
                );
                Log::info("Task purchase email sent", ['creator_email' => $creator->email]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to send task purchase email/notification", ['error' => $e->getMessage()]);
        }
    }

    /**
     * Handle Charge Dispute Created
     */
    private function handleChargeDisputeCreated($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;
        $creatorId = null;

        Log::info("handleChargeDisputeCreated: Processing dispute", [
            'dispute_id' => $dispute->id,
            'payment_intent_id' => $paymentIntentId,
            'amount' => $dispute->amount,
            'reason' => $dispute->reason
        ]);

        // --- Risk Engine: Record Dispute ---
        try {
            $payment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->with('creator')->first();
            
            if ($payment) {
                $creatorId = $payment->creator_id;
            }
            
            if (!$payment && $paymentIntentId) {
                Log::warning("handleChargeDisputeCreated: Payment not found for PaymentIntent ID: $paymentIntentId. Attempting auto-creation.");
                
                $amount = $dispute->amount; // Default to dispute amount if we can't find original
                
                // Check Deliverable
                $deliverable = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)->first();
                if ($deliverable) {
                    $creatorId = $deliverable->creator_id;
                    $amount = (int)($deliverable->transaction_amount * 100); // Convert back to cents
                }
                
                // Check TaskPurchase
                if (!$creatorId) {
                    $taskPurchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
                    if ($taskPurchase) {
                        $creatorId = $taskPurchase->creator_id;
                        $amount = (int)($taskPurchase->amount * 100);
                    }
                }

                if ($creatorId) {
                    try {
                        $payment = \App\Models\Payment::create([
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'creator_id' => $creatorId,
                            'amount' => $amount,
                            'currency' => $dispute->currency,
                            'status' => 'disputed',
                        ]);
                        $payment->load('creator'); // Load relationship for downstream logic
                        Log::info("handleChargeDisputeCreated: Auto-created Payment record", ['payment_id' => $payment->id]);
                    } catch (\Exception $e) {
                        Log::error("handleChargeDisputeCreated: Failed to auto-create payment: " . $e->getMessage());
                    }
                }
            } else {
                if ($payment) {
                    Log::info("handleChargeDisputeCreated: Payment found", ['payment_id' => $payment->id, 'creator_id' => $payment->creator_id]);
                }
            }

            $dbDispute = \App\Models\Dispute::create([
                'payment_id' => $payment ? $payment->id : null,
                'creator_id' => $creatorId,
                'stripe_dispute_id' => $dispute->id,
                'amount' => $dispute->amount,
                'currency' => $dispute->currency,
                'reason' => $dispute->reason,
                'status' => $dispute->status,
                'evidence_due_by' => isset($dispute->evidence_details->due_by) ? Carbon::createFromTimestamp($dispute->evidence_details->due_by) : null,
            ]);
            
            Log::info("Risk Engine: Dispute model created", [
                'db_dispute_id' => $dbDispute->id ?? null,
                'creator_id' => $dbDispute->creator_id ?? $creatorId,
                'payment_id' => $dbDispute->payment_id ?? ($payment->id ?? null),
            ]);

            // Update Identity Rollups (Dispute Count)
            if ($payment && $payment->riskIdentity) {
                app(\App\Services\Risk\IdentityRollupService::class)->refreshRollups($payment->riskIdentity);
            }
            
            // Update Payment Status
            if ($payment) {
                $payment->update(['status' => 'disputed']);
            }

            // Recalculate Risk Metrics (Always, if we know the creator)
            if ($creatorId) {
                try {
                    $this->riskService->recalculateMetrics($creatorId);
                } catch (\Exception $e) {
                    Log::error("Risk Engine: Failed to recalculate metrics on dispute: " . $e->getMessage());
                }
            }

            if ($payment || $creatorId) {
                // Notify Creator
                $creator = null;
                if ($payment && $payment->creator) {
                    $creator = $payment->creator;
                } elseif ($creatorId) {
                    $creator = \App\Models\User::find($creatorId);
                }

                if ($creator) {
                    $currencySymbol = \App\Helpers::getCurrency($dispute->currency);
                    $formattedAmount = number_format($dispute->amount / 100, 2);
                    
                    $title = "⚠️ Dispute Opened: We Are Handling It";
                    $content = "A dispute for {$currencySymbol}{$formattedAmount} has been opened by a supporter. No action is required from you—Spenny Piggy is automatically submitting evidence on your behalf. The amount is temporarily reserved.";
                    
                    try {
                        \App\Helpers::sendNotification($title, $content, $creator->email);
                        Log::info("Dispute notification sent to creator: " . $creator->email);
                    } catch (\Exception $e) {
                        Log::error("Failed to send dispute notification: " . $e->getMessage());
                    }
                }
            }
            
            Log::info("Risk Engine: Dispute recorded", ['dispute_id' => $dispute->id]);
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to record dispute: " . $e->getMessage());
        }
        // -----------------------------------

        if (!$paymentIntentId) {
            return;
        }

        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $purchase->dispute_status = 'open';
            $purchase->save();
            Log::info("Dispute opened for TaskPurchase", ['id' => $purchase->id]);
        }
    }

    /**
     * Handle Charge Dispute Closed
     */
    private function handleChargeDisputeClosed($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;

        // --- Risk Engine: Update Dispute Status ---
        try {
            $riskDispute = \App\Models\Dispute::where('stripe_dispute_id', $dispute->id)->with('creator')->first();
            if ($riskDispute) {
                $riskDispute->update([
                    'status' => $dispute->status,
                    'resolved_at' => now(),
                ]);
                Log::info("Risk Engine: Dispute status updated", ['status' => $dispute->status]);

                // Notify Creator
                if ($riskDispute->creator) {
                    $currencySymbol = \App\Helpers::getCurrency($dispute->currency);
                    $formattedAmount = number_format($dispute->amount / 100, 2);
                    
                    if ($dispute->status === 'won') {
                        $title = "✅ Dispute Won!";
                        $content = "Great news! You won the dispute for {$currencySymbol}{$formattedAmount}. The funds have been returned to your balance.";
                    } elseif ($dispute->status === 'lost') {
                        $title = "❌ Dispute Lost";
                        $content = "The dispute for {$currencySymbol}{$formattedAmount} was decided in favor of the cardholder. The funds have been deducted.";
                    }

                    if (isset($title)) {
                        try {
                            \App\Helpers::sendNotification($title, $content, $riskDispute->creator->email);
                        } catch (\Exception $e) {
                            Log::error("Failed to send dispute closed notification: " . $e->getMessage());
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to update dispute status: " . $e->getMessage());
        }
        // ------------------------------------------

        if (!$paymentIntentId) {
            return;
        }

        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $status = $dispute->status; // won, lost, warning_closed

            // Map Stripe status to our enum ['none', 'open', 'won', 'lost']
            if ($status === 'won') {
                $purchase->dispute_status = 'won';
            } elseif ($status === 'lost') {
                $purchase->dispute_status = 'lost';

                // If lost, it means the customer got a refund.
                $purchase->status = 'refunded';
                $purchase->refunded_at = now();

                // Update Deliverable Status
                try {
                    $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
                    if ($deliverable) {
                        $deliverable->status = 'refunded';
                        $deliverable->save();

                        // Update Stripe Metadata using Service
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'status' => 'refunded',
                            'dispute_result' => 'lost',
                            'refund_reason' => 'dispute_lost'
                        ]);

                        Log::info("Updated deliverable status to refunded for lost dispute", ['deliverable_id' => $deliverable->id]);
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to update deliverable status on dispute lost: " . $e->getMessage());
                }

                // Notify Creator (Loser)
                try {
                    $creator = $purchase->creator;
                    if ($creator) {
                        Helpers::sendNotification(
                            "Dispute Lost ⚠️",
                            "The dispute for '{$purchase->task->title}' was decided in favor of the customer. Funds have been returned.",
                            $creator->email
                        );
                    }
                } catch (\Exception $e) {
                }
            } else {
                // Keep open or set to none if it was just a warning
                if (str_contains($status, 'warning')) {
                    $purchase->dispute_status = 'none';
                }
            }

            $purchase->save();
            Log::info("Dispute closed for TaskPurchase", ['id' => $purchase->id, 'status' => $status]);
        }
    }

    public function handleBillSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        $status = $data->status;

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

        // Clear user cache
        if ($metadata->creator_id) {
            $creator = \App\Models\User::find($metadata->creator_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
            }
        }

        // Create deliverable entry for bill subscription renewal (like wish subscriptions)
        $deliverable = $this->createBillRenewalDeliverable($newSubs);

        // Update Stripe payment intent metadata if possible
        if ($deliverable) {
            try {
                $stripeMetadataService = app(StripeMetadataService::class);
                $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                    'bill_renewal_processed_at' => now()->toISOString(),
                    'immediate_delivery' => 'true'
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata for bill renewal', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        SendRenewMail::dispatch($array, 'renew', 'bill');

        // Dispatch content delivery email if bill has content file
        if (!empty($newSubs->bill->content_file)) {
            // Get currency symbol for email
            $currency = \App\Models\Currency::where('iso', strtoupper($newSubs->currency))->first();
            $currencySymbol = $currency ? $currency->symbol : '£';

            \App\Jobs\BillContentDeliveryMail::dispatch($newSubs, $currencySymbol);
            Log::info('StripeWebhookController: Content delivery email dispatched for bill renewal', [
                'bill_payment_id' => $newSubs->id,
                'bill_id' => $newSubs->bills_id,
                'has_content_file' => !empty($newSubs->bill->content_file)
            ]);
        }

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

        // Clear user cache
        if ($metadata->creator_id) {
            $creator = \App\Models\User::find($metadata->creator_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
            }
        }

        // Create deliverable entry for membership subscription renewal
        $deliverable = $this->createMembershipRenewalDeliverable($newSubs);

        // Update Stripe payment intent metadata if possible
        if ($deliverable) {
            try {
                $stripeMetadataService = app(StripeMetadataService::class);
                $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                    'membership_renewal_processed_at' => now()->toISOString(),
                    'immediate_delivery' => 'true'
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata for membership renewal', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        SendRenewMail::dispatch($array, 'renew', 'membership');

        Log::info("Membership subscription updated: {$subscriptionId}, Status: {$status}");
    }

    /**
     * Handle invoice.payment_succeeded events for subscription renewals
     */
    public function handleInvoicePaymentSucceeded($data, $metadata)
    {
        $subscriptionId = $data->subscription ?? null;

        if (!$subscriptionId) {
            Log::info("Invoice payment succeeded but no subscription ID found", ['invoice_id' => $data->id]);
            return;
        }

        Log::info("Processing invoice.payment_succeeded for subscription renewal", [
            'invoice_id' => $data->id,
            'subscription_id' => $subscriptionId,
            'billing_reason' => $data->billing_reason ?? null,
            'amount' => $data->amount_paid ?? 0,
            'metadata' => $metadata
        ]);

        // Check if this is a wish item subscription renewal
        $wishSubscription = WishItemSubscription::where('stripe_id', $subscriptionId)
            ->where('status', 'paid')
            ->first();

        if ($wishSubscription) {
            $this->handleWishSubscriptionRenewal($data, $wishSubscription);
        }

        // Check for other subscription types (membership, bills) here if needed
        // For now, focusing on wish subscriptions
    }

    /**
     * Handle wish subscription renewal payments
     */
    private function handleWishSubscriptionRenewal($invoiceData, $wishSubscription)
    {
        try {
            Log::info('Processing wish subscription renewal payment', [
                'subscription_id' => $wishSubscription->stripe_id,
                'wish_item_id' => $wishSubscription->wish_item_id,
                'invoice_id' => $invoiceData->id,
                'amount' => $invoiceData->amount_paid ?? 0
            ]);

            // Get the subscription details from Stripe to update period information
            $stripeClient = new StripeClient(env('STRIPE_SECRET_KEY'));
            $stripeSubscription = $stripeClient->subscriptions->retrieve($wishSubscription->stripe_id);

            // Update subscription with new period information
            $wishSubscription->current_period_start = Carbon::createFromTimestamp($stripeSubscription->current_period_start);
            $wishSubscription->current_period_end = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
            $wishSubscription->upcoming_payment = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
            $wishSubscription->stripe_status = $stripeSubscription->status;
            $wishSubscription->updated_at = Carbon::now();
            $wishSubscription->save();

            // Clear cache
            if ($wishSubscription->wish_item) {
                $creator = \App\Models\User::find($wishSubscription->wish_item->user_id);
                if ($creator) {
                    $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                }
            }

            Log::info('Wish subscription updated with new period', [
                'subscription_id' => $wishSubscription->id,
                'stripe_id' => $wishSubscription->stripe_id,
                'new_period_end' => $wishSubscription->current_period_end,
                'new_upcoming_payment' => $wishSubscription->upcoming_payment
            ]);

            // If wish item has content to deliver for renewals, create deliverable
            if ($wishSubscription->wish_item && (!empty($wishSubscription->wish_item->content_file) || !empty($wishSubscription->wish_item->reward))) {

                // Create deliverable record for renewal content delivery with certificate support
                $deliverable = \App\Models\Deliverable::create([
                    'uuid' => \Illuminate\Support\Str::uuid(),
                    'product_id' => (string) $wishSubscription->wish_item->id,
                    'item_id' => $wishSubscription->wish_item->id,
                    'creator_id' => $wishSubscription->wish_item->user_id,
                    'gifter_id' => $wishSubscription->user_id,
                    'session_id' => $wishSubscription->session_id,
                    'payment_intent_id' => $invoiceData->payment_intent ?? null,
                    'deliverable_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
                    'product_type' => 'wish_subscription_renewal',
                    'transaction_amount' => $wishSubscription->wish_item->price, // Use wish item price directly (base amount only)
                    'status' => 'pending',
                    'customer_email' => $wishSubscription->guest_email,
                    'customer_name' => $wishSubscription->guest_name,
                    'payment_currency' => strtoupper($wishSubscription->currency ?? 'GBP'),
                    'anonymous' => $wishSubscription->anonymous ?? false,
                    'message' => 'Subscription renewal content delivery',
                    'metadata' => json_encode([
                        'certificate' => 'true', // Enable certificate for subscription renewals
                        'wish_id' => $wishSubscription->wish_item->id,
                        'subscription_id' => $wishSubscription->id,
                        'stripe_subscription_id' => $wishSubscription->stripe_id,
                        'subscription_renewal' => true,
                        'product_type' => 'wish_subscription_renewal',
                        'content_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                        'invoice_id' => $invoiceData->id,
                        'billing_reason' => $invoiceData->billing_reason ?? 'subscription_cycle',
                        'renewal_period_start' => $wishSubscription->current_period_start,
                        'renewal_period_end' => $wishSubscription->current_period_end
                    ])
                ]);

                // Dispatch job to process renewal content delivery
                \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

                // Update Stripe payment intent metadata (exactly like membership)
                if ($invoiceData->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'wish_renewal_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to update Stripe metadata for wish renewal', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $invoiceData->payment_intent,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                Log::info('Subscription renewal content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id
                ]);
            }

            // Send renewal notification email if needed
            $this->sendSubscriptionRenewalEmail($wishSubscription);
        } catch (\Exception $e) {
            Log::error('Failed to process wish subscription renewal', [
                'subscription_id' => $wishSubscription->stripe_id ?? null,
                'wish_item_id' => $wishSubscription->wish_item_id ?? null,
                'invoice_id' => $invoiceData->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Send subscription renewal email notification
     */
    private function sendSubscriptionRenewalEmail($wishSubscription)
    {
        try {
            // Prepare renewal amount with currency formatting and subscription period
            // Use the base subscription amount (wish item price only, without platform fees)
            $currency = \App\Models\Currency::where('iso', strtoupper($wishSubscription->currency ?? 'gbp'))->first();
            $currencySymbol = $currency ? $currency->symbol : '£';
            $formattedAmount = $currencySymbol . number_format($wishSubscription->amount, 2);
            $subscriptionPeriod = $wishSubscription->wish_item->subscription_period ?? 'monthly';
            $renewalAmount = $formattedAmount . '/' . $subscriptionPeriod;

            // Use the existing wish subscription email system for renewals
            \App\Jobs\WishSubscriptionMailToUser::dispatch(
                $wishSubscription,
                $wishSubscription->guest_email,
                $renewalAmount,
                $wishSubscription->wish_item->user->name,
                true // is_renewal = true
            );

            Log::info('Wish subscription renewal email dispatched', [
                'subscription_id' => $wishSubscription->stripe_id,
                'customer_email' => $wishSubscription->guest_email,
                'amount' => $renewalAmount,
                'creator_name' => $wishSubscription->wish_item->user->name
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send subscription renewal email', [
                'subscription_id' => $wishSubscription->stripe_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle invoice.paid events for all subscription types
     */
    public function handleInvoicePaid($data)
    {
        $subscriptionId = $data->subscription ?? null;

        if (!$subscriptionId) {
            Log::info("Invoice paid but no subscription ID found", ['invoice_id' => $data->id]);
            return;
        }

        Log::info("Processing invoice.paid for subscription", [
            'invoice_id' => $data->id,
            'subscription_id' => $subscriptionId,
            'billing_reason' => $data->billing_reason ?? null
        ]);

        // Check if this is a wish item subscription
        $wishSubscription = \App\Models\WishItemSubscription::where('stripe_id', $subscriptionId)
            ->where('status', 'paid')
            ->first();

        if ($wishSubscription && $wishSubscription->wish_item) {
            $this->handleWishSubscriptionInvoicePaid($data, $wishSubscription);
        } else {
            // Check if this is a bill subscription
            $billPayment = \App\Models\BillPayment::where('stripe_id', $subscriptionId)
                ->where('status', 'paid')
                ->latest()
                ->first();

            if ($billPayment && $billPayment->bill) {
                Log::info("Invoice paid for bill subscription", [
                    'subscription_id' => $subscriptionId,
                    'bill_id' => $billPayment->bills_id
                ]);
                
                // Create deliverable for bill renewal
                $deliverable = $this->createBillRenewalDeliverable($billPayment);
                
                if ($deliverable && $data->payment_intent) {
                    // Update payment intent ID on deliverable if it was missing
                    if (!$deliverable->payment_intent_id) {
                        $deliverable->payment_intent_id = $data->payment_intent;
                        $deliverable->save();
                    }

                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'bill_renewal_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to update Stripe metadata for bill renewal invoice', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $data->payment_intent,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            } else {
                // Check if this is a membership subscription
                $membershipPayment = \App\Models\MembershipPayment::where('stripe_id', $subscriptionId)
                    ->where('status', 'paid')
                    ->latest()
                    ->first();

                if ($membershipPayment && $membershipPayment->membership) {
                    Log::info("Invoice paid for membership subscription", [
                        'subscription_id' => $subscriptionId,
                        'membership_id' => $membershipPayment->membership_id
                    ]);

                    // Create deliverable for membership renewal
                    $deliverable = $this->createMembershipRenewalDeliverable($membershipPayment);

                    if ($deliverable && $data->payment_intent) {
                        // Update payment intent ID on deliverable if it was missing
                        if (!$deliverable->payment_intent_id) {
                            $deliverable->payment_intent_id = $data->payment_intent;
                            $deliverable->save();
                        }

                        try {
                            $stripeMetadataService = app(StripeMetadataService::class);
                            $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                                'membership_renewal_processed_at' => now()->toISOString(),
                                'immediate_delivery' => 'true'
                            ]);
                        } catch (\Exception $e) {
                            Log::error('StripeWebhookController: Failed to update Stripe metadata for membership renewal invoice', [
                                'deliverable_id' => $deliverable->id,
                                'payment_intent_id' => $data->payment_intent,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                } else {
                    Log::info("Invoice paid for non-wish/non-bill/non-membership subscription or subscription not found", [
                        'subscription_id' => $subscriptionId
                    ]);
                }
            }
        }
    }

    /**
     * Handle invoice.paid events specifically for wish item subscriptions
     */
    private function handleWishSubscriptionInvoicePaid($invoiceData, $wishSubscription)
    {
        try {
            Log::info('Processing wish subscription invoice.paid', [
                'subscription_id' => $wishSubscription->stripe_id,
                'wish_item_id' => $wishSubscription->wish_item->id,
                'invoice_id' => $invoiceData->id
            ]);

            // Check if wish item has content to deliver
            if (!empty($wishSubscription->wish_item->content_file) || !empty($wishSubscription->wish_item->reward)) {

                // Create deliverable record for tracking with certificate support
                $deliverable = \App\Models\Deliverable::create([
                    'uuid' => \Illuminate\Support\Str::uuid(),
                    'product_id' => (string) $wishSubscription->wish_item->id,
                    'item_id' => $wishSubscription->wish_item->id,
                    'creator_id' => $wishSubscription->wish_item->user_id,
                    'gifter_id' => $wishSubscription->user_id,
                    'session_id' => $wishSubscription->session_id,
                    'payment_intent_id' => $invoiceData->payment_intent ?? null,
                    'deliverable_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
                    'product_type' => 'wish_subscription_content',
                    'transaction_amount' => $wishSubscription->amount,
                    'status' => 'pending',
                    'customer_email' => $wishSubscription->guest_email,
                    'customer_name' => $wishSubscription->guest_name,
                    'payment_currency' => strtoupper($wishSubscription->currency ?? 'GBP'),
                    'anonymous' => $wishSubscription->anonymous ?? false,
                    'message' => $wishSubscription->surprise_message,
                    'metadata' => json_encode([
                        'certificate' => 'true', // Enable certificate for subscription payments
                        'wish_id' => $wishSubscription->wish_item->id,
                        'subscription_id' => $wishSubscription->id,
                        'stripe_subscription_id' => $wishSubscription->stripe_id,
                        'subscription_payment' => true,
                        'product_type' => 'wish_subscription_content',
                        'content_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                        'invoice_id' => $invoiceData->id,
                        'billing_reason' => $invoiceData->billing_reason ?? null,
                        'deliverable_url' => !empty($wishSubscription->wish_item->content_file) ?
                            $wishSubscription->wish_item->content_file_url : ($wishSubscription->wish_item->reward_url ?? null)
                    ])
                ]);

                // Dispatch ProcessWishItemDeliverable job for content processing
                \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

                // Update Stripe payment intent metadata (exactly like membership)
                if ($invoiceData->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'wish_subscription_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to update Stripe metadata for wish subscription invoice', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $invoiceData->payment_intent,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Clear user cache
                if ($wishSubscription->wish_item) {
                    $creator = \App\Models\User::find($wishSubscription->wish_item->user_id);
                    if ($creator) {
                        $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                    }
                }

                Log::info('Wish subscription content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id,
                    'has_content_file' => !empty($wishSubscription->wish_item->content_file),
                    'has_reward' => !empty($wishSubscription->wish_item->reward)
                ]);

                // Send subscription payment notification using existing wish subscription email
                $currency = \App\Models\Currency::where('iso', strtoupper($wishSubscription->currency ?? 'gbp'))->first();
                $currencySymbol = $currency ? $currency->symbol : '£';
                $formattedAmount = $currencySymbol . number_format($wishSubscription->amount, 2);
                $subscriptionPeriod = $wishSubscription->wish_item->subscription_period ?? 'monthly';
                $paymentAmount = $formattedAmount . '/' . $subscriptionPeriod;

                // Use existing wish subscription email system
                \App\Jobs\WishSubscriptionMailToUser::dispatch(
                    $wishSubscription,
                    $wishSubscription->guest_email,
                    $paymentAmount,
                    $wishSubscription->wish_item->user->name,
                    true // is_renewal = true for subscription payments
                );

                Log::info('Wish subscription email notification dispatched', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id,
                    'customer_email' => $wishSubscription->guest_email
                ]);
            } else {
                Log::info('Wish subscription has no content to deliver', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to process wish subscription invoice.paid', [
                'subscription_id' => $wishSubscription->stripe_id,
                'wish_item_id' => $wishSubscription->wish_item->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
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

        // Clear user cache
        if ($wish_subscription->wish_item) {
            $creator = \App\Models\User::find($wish_subscription->wish_item->user_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
            }
        }

        SendRenewMail::dispatch($array, 'renew', 'main');
    }


    public function customerSubscriptionDeleted($data)
    {
        $subscriptionId = $data->id;

        // Delete the subscription from your database
        // Example: Subscription::where('stripe_id', $subscriptionId)->delete();

        Log::info("Subscription deleted: {$subscriptionId}");
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

    /**
     * Create deliverable entry for bill subscription renewal (like wish subscriptions)
     */
    private function createMembershipRenewalDeliverable($membershipPayment)
    {
        try {
            $membership = $membershipPayment->membership;

            if (!$membership) {
                Log::error('StripeWebhookController: No membership found for renewal deliverable', [
                    'membership_payment_id' => $membershipPayment->id
                ]);
                return null;
            }

            // For renewals, we don't have a session but we have the subscription info
            $paymentIntentId = null;

            // Use gross-up flow for net amount calculation
            $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($membershipPayment->amount, $membershipPayment->currency);

            // Create deliverable entry for renewed membership access
            $deliverable = \App\Models\Deliverable::create([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4(),
                'product_id' => $membership->product_id ?? 'membership_' . $membership->id,
                'price_id' => $membership->price_id,
                'item_id' => $membership->id,
                'creator_id' => $membership->user_id,
                'gifter_id' => $membershipPayment->user_id,
                'payment_intent_id' => $paymentIntentId,
                'session_id' => $membershipPayment->session_id, // Original session
                'deliverable_type' => 'membership_access',
                'product_type' => 'membership',
                'transaction_amount' => $membershipPayment->amount,
                'customer_email' => $membershipPayment->guest_email,
                'customer_name' => $membershipPayment->guest_name,
                'payment_currency' => strtoupper($membershipPayment->currency ?? 'GBP'),
                'anonymous' => $membershipPayment->anonymous ?? false,
                'message' => $membershipPayment->message,
                'deliverable_url' => null,
                'metadata' => json_encode([
                    'certificate' => 'true',
                    'product_type' => 'membership',
                    'membership_id' => $membership->id,
                    'membership_level' => $membership->level,
                    'membership_name' => $membership->level . ' Membership',
                    'amount' => $membershipPayment->amount,
                    'creator_net_amount' => $breakdown['net_to_creator'],
                    'currency' => $membershipPayment->currency,
                    'subscription_id' => $membershipPayment->stripe_id,
                    'recurring_type' => $membershipPayment->recurring_type,
                    'recurring_for' => $membershipPayment->recurring_for,
                    'anonymous' => $membershipPayment->anonymous,
                    'message' => $membershipPayment->message,
                    'guest_email' => $membershipPayment->guest_email,
                    'guest_name' => $membershipPayment->guest_name,
                    'members_only_access' => true,
                    'subscription_active' => true,
                    'is_renewal' => true,
                    'renewal_period_start' => now()->toISOString(),
                    'renewal_period_end' => $membershipPayment->upcoming_payment ?? \Carbon\Carbon::now()->addMonth()->toISOString()
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

            Log::info('Membership renewal deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'membership_payment_id' => $membershipPayment->id,
                'membership_id' => $membership->id,
                'is_renewal' => true
            ]);

            return $deliverable;
        } catch (\Exception $e) {
            Log::error('Failed to create membership renewal deliverable', [
                'error' => $e->getMessage(),
                'membership_payment_id' => $membershipPayment->id ?? 'unknown'
            ]);
            return null;
        }
    }

    private function createBillRenewalDeliverable($billPayment)
    {
        try {
            $bill = $billPayment->bill;

            // Use gross-up flow for net amount calculation
            $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($billPayment->amount, $billPayment->currency);

            // Create deliverable entry for renewal tracking (similar to wish subscriptions)
            $deliverable = Deliverable::create([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4(),
                'product_id' => $bill->product_id ?? 'bill_' . $bill->id,
                'price_id' => $bill->price_id,
                'item_id' => $bill->id, // Add item_id for bill lookup
                'creator_id' => $bill->user_id,
                'gifter_id' => $billPayment->user_id,
                'payment_intent_id' => null, // Renewals don't have payment intent
                'session_id' => $billPayment->session_id,
                'deliverable_type' => !empty($bill->content_file) ? 'digital_file' : 'access',
                'product_type' => 'bill',
                'transaction_amount' => $billPayment->amount, // Add transaction amount
                'deliverable_url' => !empty($bill->content_file) ? "https://ucarecdn.com/{$bill->content_file}/" : null,
                'customer_email' => $billPayment->guest_email ?? $billPayment->user->email ?? null,
                'customer_name' => $billPayment->guest_name ?? $billPayment->user->name ?? null,
                'payment_status' => $billPayment->status,
                'payment_currency' => $billPayment->currency,
                'anonymous' => $billPayment->anonymous ?? false,
                'message' => $billPayment->message,
                'metadata' => json_encode([
                    'product_type' => 'bill',
                    'bill_id' => $bill->id,
                    'bill_name' => $bill->name,
                    'amount' => $billPayment->amount,
                    'creator_net_amount' => $breakdown['net_to_creator'],
                    'currency' => $billPayment->currency,
                    'subscription_id' => $billPayment->stripe_id,
                    'recurring_type' => $billPayment->recurring_type,
                    'anonymous' => $billPayment->anonymous,
                    'message' => $billPayment->message,
                    'guest_email' => $billPayment->guest_email,
                    'guest_name' => $billPayment->guest_name,
                    'has_content_file' => !empty($bill->content_file),
                    'renewal' => true
                ]),
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);

            Log::info('Bill renewal deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'bill_payment_id' => $billPayment->id,
                'bill_id' => $bill->id,
                'has_content_file' => !empty($bill->content_file)
            ]);

            return $deliverable;
        } catch (\Exception $e) {
            Log::error('Failed to create bill renewal deliverable', [
                'error' => $e->getMessage(),
                'bill_payment_id' => $billPayment->id ?? 'unknown',
                'bill_id' => $billPayment->bill->id ?? 'unknown'
            ]);
            return null;
        }
    }

    /**
     * Handle Async Payment Succeeded
     */
    private function handleAsyncPaymentSucceeded($session)
    {
        Log::info("Processing async payment succeeded", ['session_id' => $session->id]);

        $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();
        if ($purchase) {
            // Only update if currently pending or unpaid
            if (in_array($purchase->status, ['pending', 'unpaid'])) {
                $purchase->status = 'paid';
                $purchase->save();
                Log::info("Updated TaskPurchase status to paid", ['id' => $purchase->id]);
            }
        }

        // Also update Deliverable
        $deliverable = \App\Models\Deliverable::where('session_id', $session->id)->first();
        if ($deliverable && $deliverable->payment_status !== 'paid') {
            $deliverable->payment_status = 'paid';
            $deliverable->save();
            try {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable);
            } catch (\Exception $e) {
                Log::error("Failed to update metadata on async payment succeeded: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle Async Payment Failed
     */
    private function handleAsyncPaymentFailed($session)
    {
        Log::info("Processing async payment failed", ['session_id' => $session->id]);

        $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();
        if ($purchase) {
            $purchase->status = 'failed';
            $purchase->save();
            Log::info("Updated TaskPurchase status to failed", ['id' => $purchase->id]);

            // Clear caches
            if ($purchase->creator) {
                $this->userProfileService->clearUserCaches($purchase->creator->username, $purchase->creator->id);
            }
            if ($purchase->supporter) {
                $this->userProfileService->clearUserCaches($purchase->supporter->username, $purchase->supporter->id);
            }
        }

        // Also update Deliverable
        $deliverable = \App\Models\Deliverable::where('session_id', $session->id)->first();
        if ($deliverable) {
            $deliverable->payment_status = 'failed';
            $deliverable->status = 'failed';
            $deliverable->save();
            try {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable);
            } catch (\Exception $e) {
                Log::error("Failed to update metadata on async payment failed: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle support payment deliverables that are ready for Stripe metadata updates
     * This is a safety-net to catch any support payments that didn't get their
     * Stripe metadata updated through the primary flow
     */
    private function handleSupportPaymentDeliverableReady($data, $metadata)
    {
        try {
            Log::info('StripeWebhookController: Checking for support payment deliverables ready for metadata updates', [
                'event_data' => get_class($data),
                'metadata' => $metadata
            ]);

            // Look for support payment deliverables that are ready but haven't had Stripe metadata updated
            $readyDeliverables = \App\Models\Deliverable::where('product_type', 'support_payment')
                ->where('status', 'delivered')
                ->whereNotNull('certificate_url')
                ->whereNotNull('payment_intent_id')
                ->get()
                ->filter(function ($deliverable) use ($data) {
                    // Check if Stripe metadata hasn't been updated yet
                    $metadata = json_decode($deliverable->metadata, true) ?? [];
                    $alreadyUpdated = $metadata['stripe_metadata_updated'] ?? false;

                    if ($alreadyUpdated) {
                        return false; // Skip already updated ones
                    }

                    // Additional check: verify this deliverable is related to current webhook event
                    // by checking session_id or payment_intent_id matches webhook data
                    $sessionId = $deliverable->session_id;
                    $paymentIntentId = $deliverable->payment_intent_id;

                    // Check if this webhook event relates to this deliverable
                    $eventSessionId = $data->id ?? null;
                    $eventPaymentIntentId = $data->payment_intent ?? null;

                    $isRelated = ($sessionId && $sessionId === $eventSessionId) ||
                        ($paymentIntentId && $paymentIntentId === $eventPaymentIntentId);

                    if ($isRelated) {
                        Log::info('StripeWebhookController: Found related support payment deliverable needing metadata update', [
                            'deliverable_id' => $deliverable->id,
                            'session_id' => $sessionId,
                            'payment_intent_id' => $paymentIntentId,
                            'event_session_id' => $eventSessionId,
                            'event_payment_intent_id' => $eventPaymentIntentId
                        ]);
                        return true;
                    }

                    return false;
                });

            // Dispatch UpdateSupportPaymentStripeMetadata job for any found deliverables
            foreach ($readyDeliverables as $deliverable) {
                \App\Jobs\UpdateSupportPaymentStripeMetadata::dispatch($deliverable->id)
                    ->delay(now()->addSeconds(5)); // Short delay for webhook safety-net

                Log::info('StripeWebhookController: Dispatched safety-net UpdateSupportPaymentStripeMetadata job', [
                    'deliverable_id' => $deliverable->id,
                    'certificate_url' => $deliverable->certificate_url,
                    'payment_intent_id' => $deliverable->payment_intent_id
                ]);
            }

            if ($readyDeliverables->count() === 0) {
                Log::info('StripeWebhookController: No support payment deliverables found needing metadata updates');
            }
        } catch (\Exception $e) {
            Log::error('StripeWebhookController: Error in handleSupportPaymentDeliverableReady', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Don't throw - this is a safety-net, shouldn't break main webhook processing
        }
    }

    /**
     * Handle Charge Refunded
     */
    private function handleChargeRefunded($charge)
    {
        $paymentIntentId = $charge->payment_intent ?? null;

        // --- Risk Engine: Handle Refund ---
        try {
            $payment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if ($payment) {
                $payment->update(['status' => 'refunded']);
                
                // Recalculate Risk Metrics
                try {
                    $this->riskService->recalculateMetrics($payment->creator_id);
                } catch (\Exception $e) {
                    Log::error("Risk Engine: Failed to recalculate metrics on refund: " . $e->getMessage());
                }
                
                Log::info("Risk Engine: Payment marked as refunded", ['payment_id' => $payment->id]);
            }
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to process refund: " . $e->getMessage());
        }
        // ----------------------------------

        if (!$paymentIntentId) {
            return;
        }

        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $purchase->status = 'refunded';
            $purchase->refunded_at = now();

            // Try to get refund ID from charge
            if (isset($charge->refunds->data) && !empty($charge->refunds->data)) {
                // Assuming the latest refund is the one relevant to this event
                $latestRefund = $charge->refunds->data[0] ?? null;
                if ($latestRefund) {
                    $purchase->refund_id = $latestRefund->id;
                }
            }

            $purchase->save();

            Log::info("TaskPurchase refunded via webhook", ['id' => $purchase->id]);

            // Update Deliverable
            try {
                $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'refunded';
                    $deliverable->save();

                    try {
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'status' => 'refunded',
                            'refunded_by' => 'stripe',
                            'refund_reason' => 'charge_refunded'
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Failed to update metadata on charge refunded webhook: " . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
            }

            // Notify Supporter and Creator via email and push
            try {
                $task = $purchase->task;
                $supporter = $purchase->supporter;
                $creator = $purchase->creator;

                // Clear caches
                if ($creator) {
                    $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                }
                if ($supporter) {
                    $this->userProfileService->clearUserCaches($supporter->username, $supporter->id);
                }

                if ($supporter) {
                    Helpers::sendNotification(
                        "Task Refunded 💸",
                        "The task '{$task->title}' has been refunded.",
                        $supporter->email
                    );
                    Mail::to($supporter->email)->send(new TaskRefunded([
                        'title' => $task->title,
                        'amount' => $purchase->amount,
                        'currency' => $task->currency,
                        'message' => "The task was refunded."
                    ]));
                }

                if ($creator) {
                    Helpers::sendNotification(
                        "Task Refunded 💸",
                        "The task '{$task->title}' has been refunded to the supporter.",
                        $creator->email
                    );
                    Mail::to($creator->email)->send(new TaskRefunded([
                        'title' => $task->title,
                        'amount' => $purchase->amount,
                        'currency' => $task->currency,
                        'message' => "The task was refunded to the supporter."
                    ]));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send refund notifications (webhook): " . $e->getMessage());
            }
        }
    }

    /**
     * Handle Payment Intent Succeeded
     * Syncs with Risk Engine Ledger and Updates Rollups
     */
    private function handlePaymentIntentSucceeded($paymentIntent, $connectedAccountId = null)
    {
        $paymentIntentId = $paymentIntent->id;

        Log::info("Handling payment_intent.succeeded", [
            'pi_id' => $paymentIntentId,
            'metadata' => $paymentIntent->metadata ?? 'null',
            'amount' => $paymentIntent->amount,
            'currency' => $paymentIntent->currency,
            'connected_account' => $connectedAccountId
        ]);
        
        // 1. Update Risk Ledger (payments table)
        $payment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
        
        if (!$payment) {
            // Attempt to auto-create missing Payment record for legacy/direct flows
            $creatorId = $paymentIntent->metadata->creator_id ?? null;

            // Fallback: Look up via Connected Account (Direct Charges)
            if (!$creatorId && $connectedAccountId) {
                $creator = \App\Models\User::where('account_id', $connectedAccountId)->first();
                if ($creator) {
                    $creatorId = $creator->id;
                    Log::info("Risk Ledger: Found creator via Connected Account ID", ['creator_id' => $creatorId, 'account_id' => $connectedAccountId]);
                }
            }
            
            // Fallback: Look up via Deliverable
            if (!$creatorId) {
                $deliverable = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)->first();
                $creatorId = $deliverable->creator_id ?? null;
            }

            if ($creatorId) {
                try {
                    // Normalize amount (Stripe sends cents, DB likely expects major units)
                    $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($paymentIntent->currency);
                    $amount = $paymentIntent->amount;
                    if (!$isZeroDecimal) {
                        $amount = $amount / 100;
                    }

                    $payment = \App\Models\Payment::create([
                        'stripe_payment_intent_id' => $paymentIntentId,
                        'creator_id' => $creatorId,
                        'amount' => $amount,
                        'currency' => strtoupper($paymentIntent->currency),
                        'status' => 'succeeded',
                    ]);
                    Log::info("Risk Ledger: Auto-created missing Payment record", ['id' => $payment->id, 'creator_id' => $creatorId]);
                } catch (\Exception $e) {
                    Log::error("Risk Ledger: Failed to auto-create payment: " . $e->getMessage());
                }
            }
        }
        
        if ($payment) {
            $newStatus = 'succeeded';
            // If the payment was already marked as review_hold or has it in reason codes, keep it in review_hold
            if ($payment->status === 'review_hold' || (is_array($payment->reason_codes) && in_array('MARK_REVIEW_HOLD', $payment->reason_codes))) {
                $newStatus = 'review_hold';
            }
            
            $payment->update(['status' => $newStatus]);
            Log::info("Risk Ledger: Payment marked as {$newStatus}", ['id' => $payment->id]);
            
            // 2. Update Identity Rollups
            if ($payment->riskIdentity) {
                try {
                    $rollupService = app(\App\Services\Risk\IdentityRollupService::class);
                    $rollupService->refreshRollups($payment->riskIdentity);
                    Log::info("Risk Ledger: Identity rollups refreshed", ['identity_id' => $payment->risk_identity_id]);
                } catch (\Exception $e) {
                    Log::error("Failed to refresh identity rollups on payment success: " . $e->getMessage());
                }
            }
            
            // 3. Update Creator Metrics (Transaction Count & Risk Check)
            try {
                // We recalculate fully to ensure rates are up to date with new denominator
                $this->riskService->recalculateMetrics($payment->creator_id);
            } catch (\Exception $e) {
                Log::error("Failed to update creator metrics on payment success: " . $e->getMessage());
            }
        } else {
            Log::info("Payment intent succeeded but not found in Risk Ledger (might be legacy or direct)", ['pi' => $paymentIntentId]);
        }
    }

    /**
     * Handle Early Fraud Warning Created
     */
    private function handleEarlyFraudWarningCreated($efw)
    {
        try {
            $paymentIntentId = $efw->payment_intent;
            $chargeId = $efw->charge;
            
            // Find related payment
            $payment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            $existing = \App\Models\EarlyFraudWarning::where('stripe_efw_id', $efw->id)->exists();
            if ($existing) {
                Log::info("Early Fraud Warning already recorded", ['efw_id' => $efw->id]);
                return;
            }

            \App\Models\EarlyFraudWarning::create([
                'payment_id' => $payment ? $payment->id : null,
                'stripe_efw_id' => $efw->id,
                'stripe_charge_id' => $chargeId,
                'created_at' => now(),
            ]);

            if ($payment) {
                try {
                    $reasons = is_array($payment->reason_codes) ? $payment->reason_codes : [];
                    if (!in_array('EFW_RECEIVED', $reasons, true)) {
                        $reasons[] = 'EFW_RECEIVED';
                    }
                    $payment->update(['reason_codes' => $reasons]);
                } catch (\Throwable $e) {
                }

                try {
                    \App\Models\AuditLog::create([
                        'actor' => 'system',
                        'action_type' => 'EARLY_FRAUD_WARNING',
                        'reference_id' => (string) $payment->id,
                        'metadata_json' => [
                            'stripe_efw_id' => $efw->id,
                            'stripe_charge_id' => $chargeId,
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'creator_id' => $payment->creator_id,
                        ],
                    ]);
                } catch (\Throwable $e) {
                }

                try {
                    $creator = \App\Models\User::where('uuid', $payment->creator_id)->first();
                    if ($creator) {
                        $title = "Refund Recommended";
                        $content = "A payment received an Early Fraud Warning. Consider refunding to reduce chargeback risk.";
                        \App\Helpers::sendNotification($title, $content, $creator->email);
                    }
                } catch (\Throwable $e) {
                }
            }

            Log::info("Early Fraud Warning recorded", ['efw_id' => $efw->id, 'pi' => $paymentIntentId]);
            
        } catch (\Exception $e) {
            Log::error("Failed to handle EFW: " . $e->getMessage());
        }
    }

    /**
     * Handle Payment Intent Failed
     */
    private function handlePaymentIntentFailed($paymentIntent)
    {
        $paymentIntentId = $paymentIntent->id;
        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();

        if ($purchase) {
            Log::info("Payment Intent Failed for TaskPurchase", ['id' => $purchase->id]);
            // Optional: Update status if needed, but 'failed' isn't in enum yet.
        }
    }
}
