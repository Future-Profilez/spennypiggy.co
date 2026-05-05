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
use Illuminate\Support\Facades\DB;
use Stripe\Exception\SignatureVerificationException;
use App\Jobs\SendRenewMail;
use App\Jobs\ShopBuyed;
use App\Jobs\ShopBuyedUser;
use App\Jobs\NotificationSave;
use App\Models\BillPayment;
use App\Models\FinancialTransaction;
use App\Models\Deliverable;
use App\Models\StripePaymentItems;
use App\Models\UserCart;
use App\Models\ConnectedAccountCustomer;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\WishItemSubscription;
use App\Models\ShopPayment;
use App\Models\Shop;
use App\Models\UserPayment;
use App\StripeControl as AppStripeControl;
use Carbon\Carbon;
use Stripe\StripeClient;
use Stripe\Stripe;
use Stripe\Webhook;
use App\Mail\TaskPurchasedMail;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskRefunded;
use App\Mail\PaymentRefunded;
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
        $stripe_secret = env('STRIPE_SECRET_KEY');
        Stripe::setApiKey($stripe_secret);

        $payload = @file_get_contents('php://input');
        $sig_header = $request->header('Stripe-Signature');
        $event = null;

        // Try multiple secrets (UK and US)
        $configs = [
            ['secret' => env('STRIPE_WEBHOOK_SECRET'), 'key' => env('STRIPE_SECRET_KEY')],
            ['secret' => env('STRIPE_WEBHOOK_SECRET_US'), 'key' => env('STRIPE_SECRET_KEY_US')],
        ];

        $verified = false;
        foreach ($configs as $config) {
            if (empty($config['secret'])) continue;
            
            try {
                $event = Webhook::constructEvent($payload, $sig_header, $config['secret']);
                
                // Set the correct API key for this account
                if (!empty($config['key'])) {
                    Stripe::setApiKey($config['key']);
                    config(['services.stripe.key' => $config['key']]); // Update global config if needed
                }
                
                $verified = true;
                break;
            } catch (\Stripe\Exception\SignatureVerificationException $e) {
                // Try next secret
                continue;
            } catch (\Exception $e) {
                Log::error('Stripe webhook error: ' . $e->getMessage());
                return response()->json(['status' => false, 'message' => $e->getMessage()], 400);
            }
        }

        if (!$verified) {
            Log::error('Stripe webhook: Signature verification failed for all secrets');
            return response()->json(['status' => false, 'message' => 'No signatures found matching the expected signature for payload'], 400);
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
                try {
                    $webhookStatus = \App\Models\StripeWebhookStatus::create([
                        'event_id' => $event->id,
                        'event_type' => $event->type,
                        'data' => json_encode($event->data->object),
                        'status' => 'processing',
                    ]);
                } catch (\Illuminate\Database\QueryException $e) {
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
                        throw $e;
                    }
                }
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

            case 'charge.dispute.updated':
            case 'charge.dispute.funds_withdrawn':
            case 'charge.dispute.funds_reinstated':
                $this->handleChargeDisputeUpdated($data);
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
                $this->handleReviewClosed($data);
                break;

            // --- Connect Account / Payout Risk Monitoring ---
            case 'account.updated':
                $this->handleAccountUpdated($data);
                break;
            case 'payout.created':
            case 'payout.paid':
            case 'payout.failed':
            case 'payout.in_transit':
            case 'payout.canceled':
                $this->handlePayoutEvent($data, $type, $event);
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
        $stripe = new \Stripe\StripeClient(Stripe::getApiKey());
        
        $eventType = $event->type;
        $object = $event->data->object;

        $subscriptionId = $object->subscription ?? $object->id ?? null;
        if (!$subscriptionId) return; // Ignored

        try {
            // If event object IS subscription, use it. If invoice, use subscription ID.
            if ($object->object === 'subscription') {
                $subscription = $object;
            } else {
                $subscription = $stripe->subscriptions->retrieve($subscriptionId);
            }

            $invoice = ($object->object === 'invoice') ? $object : null;

            // Use the unified sync service
            $this->userProfileService->syncMandatorySubscriptionStatus($subscription, $eventType, $invoice);

        } catch (\Exception $e) {
            Log::error("Failed to sync mandatory subscription in webhook: " . $e->getMessage());
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

        // Fallback: look up by metadata.user_id if stripe_user_id is stale (e.g. creator retried)
        if (!$user && !empty($session->metadata->user_id)) {
            $user = User::find($session->metadata->user_id);
            if ($user) {
                // Re-sync the session ID so future webhooks resolve correctly
                $user->stripe_user_id = $session->id;
                $user->save();
                Log::info('Identity webhook: resolved user via metadata.user_id fallback', [
                    'user_id' => $user->id,
                    'session_id' => $session->id,
                ]);
            }
        }

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

        // Fallback: look up by metadata.user_id if stripe_user_id is stale (e.g. creator retried)
        if (!$user && !empty($session->metadata->user_id)) {
            $user = User::find($session->metadata->user_id);
            if ($user) {
                // Re-sync the session ID so future webhooks resolve correctly
                $user->stripe_user_id = $session->id;
                $user->save();
                Log::info('Identity webhook: resolved user via metadata.user_id fallback', [
                    'user_id' => $user->id,
                    'session_id' => $session->id,
                ]);
            }
        }

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
                $client = AppStripeControl::getClient();
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
                // Wait briefly for the checkout controller to finish writing the payment record
                // (Webhooks sometimes arrive milliseconds before the redirect finishes DB writes)
                $payment = \App\Models\Payment::where('stripe_session_id', $session->id)->first();
                
                if (!$payment) {
                    usleep(500000); // Wait 500ms and try again
                    $payment = \App\Models\Payment::where('stripe_session_id', $session->id)->first();
                }

                if (!$payment && $session->payment_intent) {
                    $payment = \App\Models\Payment::where('stripe_payment_intent_id', $session->payment_intent)->first();
                    if ($payment) {
                        $payment->update([
                            'stripe_session_id' => $session->id,
                        ]);
                    }
                }

                if ($payment) {
                    $newStatus = 'succeeded';
                    // Check if it was marked for review hold
                    if (
                        $payment->status === 'review_hold' ||
                        (is_array($payment->reason_codes) && in_array('MARK_REVIEW_HOLD', $payment->reason_codes)) ||
                        (is_string($payment->reason_codes) && str_contains($payment->reason_codes, 'MARK_REVIEW_HOLD'))
                    ) {
                        $newStatus = 'review_hold';
                        Log::info("Risk Ledger: Marking payment as review_hold", ['payment_id' => $payment->id]);
                    }

                    $payment->update([
                        'stripe_payment_intent_id' => $session->payment_intent ?? $payment->stripe_payment_intent_id,
                        'status' => $newStatus,
                    ]);

                    // Also store the payment intent ID on the StripePaymentDetail record for future lookups
                    if ($session->payment_intent) {
                        \App\Models\StripePaymentDetail::where('session_id', $session->id)
                            ->whereNull('stripe_payment_intent_id')
                            ->update(['stripe_payment_intent_id' => $session->payment_intent]);
                    }

                    if ($session->payment_intent) {
                        $this->syncFinancialTransactionsByPaymentIntent($session->payment_intent, $newStatus);
                    }

                    Log::info("Risk Ledger: Checkout session mapped to payment", [
                        'session_id' => $session->id,
                        'payment_id' => $payment->id,
                        'status' => $newStatus,
                        'payment_intent' => $session->payment_intent ?? null,
                    ]);
                } else {
                    Log::warning("Risk Ledger: No payment found for session_id: {$session->id} after delay");
                }
            } catch (\Exception $e) {
                Log::error("Risk Ledger: Failed mapping checkout.session.completed: " . $e->getMessage(), [
                    'session_id' => $session->id,
                ]);
            }

            // Check if this is a wish item purchase (handles single wishes and carts)
            $wishTypes = ['media_bundle', 'content_file', 'reward', 'no_content'];
            if (isset($metadata->deliverable_type) && in_array($metadata->deliverable_type, $wishTypes)) {
                $this->processWishItemDeliverable($session, $metadata);
            }

            // Check if this is a shop item purchase
            if (isset($metadata->type) && $metadata->type === 'shop') {
                $this->processShopItemPayment($session, $metadata);
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
        if (\App\Models\Deliverable::where('session_id', $session->id)->exists()) {
            Log::info("Deliverable already exists for session", ['session_id' => $session->id]);
            return;
        }

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

        // Sync StripePaymentItems and FinancialTransaction if missing (Safety check for missed checkout redirects)
        $this->syncWishPaymentItemsFromDetail($payment, $session);

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
                // Also clear discovery cache to update trending/top earners
                app(\App\Services\DiscoveryService::class)->clearDiscoveryCache();
            }
        }

        // Send thank you email to the purchaser
        if (isset($metadata->user_id)) {
            $payment = \App\Models\StripePaymentDetail::where('session_id', $session->id)->first();
            if ($payment) {
                // Check if user exists
                $user = \App\Models\User::where('id', $metadata->user_id)->first();

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
                    Log::info('User not eligible for email (user not found)', [
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
                $client = AppStripeControl::getClient();
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
            'total_paid' => (float) ($session->amount_total ?? 0) / $multiplier,
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

        // Record UserPayment
        try {
            $existingUserPayment = UserPayment::where('payment_details', json_encode($session->id, true))->exists();
            if (!$existingUserPayment) {
                UserPayment::create([
                    'from_user_id' => $buyerId,
                    'to_user_id' => $creatorId ?? $task->creator_id,
                    'product_type' => 'task',
                    'amount' => $amount,
                    'total_paid' => $purchase->total_paid,
                    'currency' => $currency,
                    'payment_method' => 'stripe',
                    'payment_details' => json_encode($session->id, true),
                    'paid_at' => Carbon::now(),
                    'status' => 'paid',
                ]);
            }
        } catch (\Exception $e) {
            Log::error('StripeWebhookController: Failed to record UserPayment for task', ['error' => $e->getMessage()]);
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

            // Immediately sync to FinancialTransaction so earnings dashboard and support history shows up-to-date
            try {
                $creator = User::find($creatorId ?? $task->creator_id);
                $amount = (float) $purchase->amount;
                $vat = (float) ($purchase->vat_amount ?? 0);
                
                $currency = strtoupper($purchase->currency ?? 'GBP');
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];
                
                $gross = $purchase->total_paid && $purchase->total_paid > 0 
                    ? (float) $purchase->total_paid 
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => TaskPurchase::class,
                        'source_id' => $purchase->id,
                    ],
                    [
                        'user_id' => $creator->id,
                        'supporter_id' => $purchase->supporter_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($purchase->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Task Purchase: ' . ($task->title ?? 'Task'),
                        'transaction_date' => $purchase->created_at,
                    ]
                );
            } catch (\Throwable $e) {
                Log::error('Failed to sync TaskPurchase to FinancialTransaction in processTaskPurchase: ' . $e->getMessage(), ['purchase_id' => $purchase->id]);
            }

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
            // Immediately sync to FinancialTransaction even for timed tasks so they appear as 'pending' or 'completed' depending on risk
            try {
                $creator = User::find($creatorId ?? $task->creator_id);
                $amount = (float) $purchase->amount;
                $vat = (float) ($purchase->vat_amount ?? 0);
                
                $currency = strtoupper($purchase->currency ?? 'GBP');
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];
                
                $gross = $purchase->total_paid && $purchase->total_paid > 0 
                    ? (float) $purchase->total_paid 
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => TaskPurchase::class,
                        'source_id' => $purchase->id,
                    ],
                    [
                        'user_id' => $creator->id,
                        'supporter_id' => $purchase->supporter_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($purchase->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Task Purchase: ' . ($task->title ?? 'Task'),
                        'transaction_date' => $purchase->created_at,
                    ]
                );
            } catch (\Throwable $e) {
                Log::error('Failed to sync TaskPurchase to FinancialTransaction in processTaskPurchase (timed): ' . $e->getMessage(), ['purchase_id' => $purchase->id]);
            }

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

            if ($supporter) {
                Mail::to($supporter->email)->send(new \App\Mail\TaskPurchasedSupporterMail($purchase, $task, $supporter));
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

                // Check MembershipPayment
                if (!$creatorId) {
                    $membershipPayment = \App\Models\MembershipPayment::where('stripe_id', $paymentIntentId)
                        ->orWhere('session_id', $paymentIntentId)
                        ->with('membership')
                        ->first();
                    if ($membershipPayment && $membershipPayment->membership) {
                        $creatorId = $membershipPayment->membership->user_id;
                        $amount = (int)($membershipPayment->amount * 100);
                    }
                }

                // Check BillPayment
                if (!$creatorId) {
                    $billPayment = \App\Models\BillPayment::where('stripe_id', $paymentIntentId)
                        ->orWhere('session_id', $paymentIntentId)
                        ->with('bill')
                        ->first();
                    if ($billPayment && $billPayment->bill) {
                        $creatorId = $billPayment->bill->user_id;
                        $amount = (int)($billPayment->amount * 100);
                    }
                }

                // Check ShopPayment
                if (!$creatorId) {
                    $shopPayment = \App\Models\ShopPayment::where('session_id', $paymentIntentId)
                        ->with('shop')
                        ->first();
                    if ($shopPayment && $shopPayment->shop) {
                        $creatorId = $shopPayment->shop->user_id;
                        $amount = (int)($shopPayment->amount * 100);
                    }
                }

                // Check StripePaymentDetail (Fallback)
                if (!$creatorId) {
                    $paymentDetail = \App\Models\StripePaymentDetail::where('stripe_payment_intent_id', $paymentIntentId)
                        ->orWhere('session_id', $paymentIntentId)
                        ->first();
                    if ($paymentDetail) {
                        $creatorId = $paymentDetail->owner_id;
                        $amount = (int)($paymentDetail->amount_total * 100);
                    }
                }

                // Resolve UUID if we got an integer ID
                if ($creatorId && is_numeric($creatorId)) {
                    $cUser = \App\Models\User::find($creatorId);
                    if ($cUser) {
                        $creatorId = $cUser->uuid;
                    }
                }

                if ($creatorId) {
                    try {
                        $payment = \App\Models\Payment::create([
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'creator_id' => $creatorId,
                            'amount' => $amount,
                        'reserve_amount_minor' => 0,
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

            $dbDispute = \App\Models\Dispute::firstOrCreate(
                ['stripe_dispute_id' => $dispute->id],
                [
                    'payment_id' => $payment ? $payment->id : null,
                    'creator_id' => $creatorId,
                    'amount' => $dispute->amount,
                    'currency' => $dispute->currency,
                    'reason' => $dispute->reason,
                    'status' => $dispute->status,
                    'evidence_due_by' => isset($dispute->evidence_details->due_by) ? Carbon::createFromTimestamp($dispute->evidence_details->due_by) : null,
                ]
            );
            
            if (!$dbDispute->wasRecentlyCreated) {
                Log::info("Risk Engine: Dispute already exists", ['dispute_id' => $dispute->id]);
                // Still update TaskPurchase status just in case
            } else {
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
                    $this->syncRiskLedgerStatus($paymentIntentId, 'disputed');
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

                        // Send email to creator about dispute opened
                        try {
                            $disputeTaskPurchase = \App\Models\TaskPurchase::where('payment_intent_id', $paymentIntentId ?? ($dispute->payment_intent ?? null))->first();
                            if ($disputeTaskPurchase && $disputeTaskPurchase->task) {
                                Mail::to($creator->email)->send(new \App\Mail\TaskDisputeEscalatedMail($disputeTaskPurchase, $disputeTaskPurchase->task, $creator, 'creator'));
                            }
                        } catch (\Exception $e) {
                            Log::error("Failed to send dispute email to creator: " . $e->getMessage());
                        }
                    }
                }
                
                Log::info("Risk Engine: Dispute recorded", ['dispute_id' => $dispute->id]);
            }
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to record dispute: " . $e->getMessage());
        }
        // -----------------------------------

        // Propagate disputed status to ALL payment tables (not just TaskPurchase)
        if ($paymentIntentId) {
            $this->syncRiskLedgerStatus($paymentIntentId, 'disputed');
        }

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

    private function handleChargeDisputeUpdated($dispute)
    {
        try {
            $riskDispute = \App\Models\Dispute::where('stripe_dispute_id', $dispute->id)->first();

            if (!$riskDispute) {
                $this->handleChargeDisputeCreated($dispute);
                return;
            }

            $riskDispute->update([
                'amount' => $dispute->amount,
                'currency' => $dispute->currency,
                'reason' => $dispute->reason ?? $riskDispute->reason,
                'status' => $dispute->status ?? $riskDispute->status,
                'evidence_due_by' => isset($dispute->evidence_details->due_by)
                    ? Carbon::createFromTimestamp($dispute->evidence_details->due_by)
                    : $riskDispute->evidence_due_by,
            ]);

            if (!empty($dispute->payment_intent)) {
                $payment = \App\Models\Payment::where('stripe_payment_intent_id', $dispute->payment_intent)->first();
                if ($payment && $payment->status !== 'disputed' && !in_array($payment->status, ['refunded', 'failed', 'blocked'], true)) {
                    // Sync disputed status to ALL tables
                    $this->syncRiskLedgerStatus($dispute->payment_intent, 'disputed');
                }
            }
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to update dispute: " . $e->getMessage(), ['stripe_dispute_id' => $dispute->id ?? null]);
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
            if ($riskDispute && $riskDispute->status !== $dispute->status) {
                $riskDispute->update([
                    'status' => $dispute->status,
                    'resolved_at' => now(),
                ]);
                Log::info("Risk Engine: Dispute status updated", ['status' => $dispute->status]);

                // Sync Risk Ledger Status
                if ($dispute->status === 'won') {
                    $this->syncRiskLedgerStatus($paymentIntentId, 'succeeded');
                } elseif ($dispute->status === 'lost') {
                    $this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
                }

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

                        // Send email to creator about dispute resolution
                        try {
                            $closedPurchase = \App\Models\TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
                            if ($closedPurchase && $closedPurchase->task) {
                                $resolution = $dispute->status === 'won' ? 'creator_won' : 'supporter_won';
                                Mail::to($riskDispute->creator->email)->send(new \App\Mail\TaskDisputeResolvedMail(
                                    $closedPurchase, $closedPurchase->task, $riskDispute->creator, 'creator', $resolution
                                ));

                                // Notify supporter about dispute resolution
                                $closedSupporter = $closedPurchase->supporter;
                                if ($closedSupporter) {
                                    $supporterTitle = $dispute->status === 'won' ? "❌ Dispute Lost" : "✅ Dispute Resolved";
                                    $supporterContent = $dispute->status === 'won'
                                        ? "The dispute for '{$closedPurchase->task->title}' was decided in favor of the creator. No refund will be issued."
                                        : "The dispute for '{$closedPurchase->task->title}' has been resolved. A refund has been issued.";
                                    \App\Helpers::sendNotification($supporterTitle, $supporterContent, $closedSupporter->email);
                                    Mail::to($closedSupporter->email)->send(new \App\Mail\TaskDisputeResolvedMail(
                                        $closedPurchase, $closedPurchase->task, $closedSupporter, 'supporter', $resolution
                                    ));
                                }
                            }
                        } catch (\Exception $e) {
                            Log::error("Failed to send dispute resolved emails: " . $e->getMessage());
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
                        Mail::to($creator->email)->send(new \App\Mail\TaskDisputeResolvedMail(
                            $purchase, $purchase->task, $creator, 'creator', 'supporter_won'
                        ));
                    }
                    // Also notify supporter
                    $lostSupporter = $purchase->supporter;
                    if ($lostSupporter) {
                        Helpers::sendNotification(
                            "Dispute Resolved ✅",
                            "The dispute for '{$purchase->task->title}' has been resolved. A refund has been issued to you.",
                            $lostSupporter->email
                        );
                        Mail::to($lostSupporter->email)->send(new \App\Mail\TaskDisputeResolvedMail(
                            $purchase, $purchase->task, $lostSupporter, 'supporter', 'supporter_won'
                        ));
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
                // Also clear discovery cache
                app(\App\Services\DiscoveryService::class)->clearDiscoveryCache();
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
                // Also clear discovery cache
                app(\App\Services\DiscoveryService::class)->clearDiscoveryCache();
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
            $stripeClient = AppStripeControl::getClient();
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

            // Notify Creator about the renewal with Net amount
            try {
                $total_amount = ($invoiceData->amount_paid ?? 0) / 100; // Stripe amount is in cents
                if ($total_amount <= 0) {
                    $total_amount = $wishSubscription->amount;
                }
                
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($total_amount, $wishSubscription->currency);
                $creatorNet = $breakdown['net_to_creator'];
                $creatorNetAmountWithSymbol = $currencySymbol . number_format($creatorNet, 2);

                \App\Jobs\SubscribedMail::dispatch($wishSubscription, $creatorNetAmountWithSymbol);
                
                Log::info('Wish subscription renewal email dispatched to creator', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'creator_email' => $wishSubscription->wish_item->user->email,
                    'net_amount' => $creatorNetAmountWithSymbol
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify creator about subscription renewal', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'error' => $e->getMessage()
                ]);
            }

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
                
                // Notify Creator about the bill renewal with Net amount
                try {
                    $currency = \App\Models\Currency::where('iso', strtoupper($billPayment->currency ?? 'gbp'))->first();
                    $currencySymbol = $currency ? $currency->symbol : '£';
                    
                    $total_amount = ($data->amount_paid ?? 0) / 100;
                    $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($total_amount, $billPayment->currency);
                    $creatorNet = $breakdown['net_to_creator'];
                    $creatorNetAmountWithSymbol = $currencySymbol . number_format($creatorNet, 2);

                    \App\Jobs\BillPayMail::dispatch($billPayment, $creatorNetAmountWithSymbol);
                    
                    Log::info('Bill renewal email dispatched to creator', [
                        'subscription_id' => $subscriptionId,
                        'creator_email' => $billPayment->bill->user->email,
                        'net_amount' => $creatorNetAmountWithSymbol
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to notify creator about bill renewal', [
                        'subscription_id' => $subscriptionId,
                        'error' => $e->getMessage()
                    ]);
                }
                
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

                    // Also clear discovery cache to update trending/top earners
                    app(\App\Services\DiscoveryService::class)->clearDiscoveryCache();
                    
                    // Create deliverable for membership renewal
                    $deliverable = $this->createMembershipRenewalDeliverable($membershipPayment);

                    // Notify Creator about the membership renewal with Net amount
                    try {
                        $currency = \App\Models\Currency::where('iso', strtoupper($membershipPayment->currency ?? 'gbp'))->first();
                        $currencySymbol = $currency ? $currency->symbol : '£';
                        
                        $total_amount = ($data->amount_paid ?? 0) / 100;
                        $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($total_amount, $membershipPayment->currency);
                        $creatorNet = $breakdown['net_to_creator'];
                        $creatorNetAmountWithSymbol = $currencySymbol . number_format($creatorNet, 2);

                        \App\Jobs\MembershipMail::dispatch($membershipPayment, $creatorNetAmountWithSymbol);
                        
                        Log::info('Membership renewal email dispatched to creator', [
                            'subscription_id' => $subscriptionId,
                            'creator_email' => $membershipPayment->membership->user->email,
                            'net_amount' => $creatorNetAmountWithSymbol
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to notify creator about membership renewal', [
                            'subscription_id' => $subscriptionId,
                            'error' => $e->getMessage()
                        ]);
                    }

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

                // Notify Creator about the payment with Net amount
                try {
                    $total_amount = ($invoiceData->amount_paid ?? 0) / 100; // Stripe amount is in cents
                    if ($total_amount <= 0) {
                        $total_amount = $wishSubscription->amount;
                    }
                    
                    $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($total_amount, $wishSubscription->currency);
                    $creatorNet = $breakdown['net_to_creator'];
                    $creatorNetAmountWithSymbol = $currencySymbol . number_format($creatorNet, 2);

                    \App\Jobs\SubscribedMail::dispatch($wishSubscription, $creatorNetAmountWithSymbol);
                    
                    Log::info('Wish subscription payment email dispatched to creator', [
                        'subscription_id' => $wishSubscription->stripe_id,
                        'creator_email' => $wishSubscription->wish_item->user->email,
                        'net_amount' => $creatorNetAmountWithSymbol
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to notify creator about subscription payment', [
                        'subscription_id' => $wishSubscription->stripe_id,
                        'error' => $e->getMessage()
                    ]);
                }

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
        // Actual cancellation logic is handled in processMandatorySubscription for MonthlyCharge records.
        // Also handle WishItemSubscription, BillPayment, MembershipPayment if needed here.
        $subscriptionId = $data->id;
        Log::info("Subscription deleted webhook received: {$subscriptionId}");

        // Handle MembershipPayment cancellation
        $membershipPayment = \App\Models\MembershipPayment::where('stripe_id', $subscriptionId)->latest()->first();
        if ($membershipPayment) {
            $membershipPayment->update([
                'status' => 'cancelled',
                'end' => now()
            ]);
            Log::info("MembershipPayment marked as cancelled via webhook", ['id' => $membershipPayment->id]);
        }

        // Handle BillPayment cancellation
        $billPayment = \App\Models\BillPayment::where('stripe_id', $subscriptionId)->latest()->first();
        if ($billPayment) {
            $billPayment->update([
                'status' => 'cancelled',
                'end' => now()
            ]);
            Log::info("BillPayment marked as cancelled via webhook", ['id' => $billPayment->id]);
        }
    }

    public function CreateProductForCreatorAndGifter()
    {
        $client = AppStripeControl::getClient();
        try {
            // Step 1: Create the product
            $product = $client->products->create([
                'name' => 'Creator Monthly Subscription £8.99 + VAT Product',
            ]);

            // Step 2: Create the recurring price (£10.79 total)
            $price = $client->prices->create([
                'unit_amount' => 1079, // £8.99 + £1.80 VAT = £10.79
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
            Log::error("Error creating £8.99/month subscription: " . $e->getMessage());
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
        $chargeId = $charge->id ?? null;

        // --- Risk Engine: Handle Refund ---
        try {
            $creatorId = null;
            
            // Search by PI first, then Charge ID (Stripe sometimes uses one or the other in metadata/logs)
            $payment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)
                ->orWhere('stripe_session_id', $charge->payment_intent) // Sometimes the session ID is passed as the identifier
                ->first();

            if ($payment) {
                $payment->update(['status' => 'refunded']);
                $creatorId = $payment->creator_id;
                Log::info("Risk Engine: Payment marked as refunded", ['payment_id' => $payment->id]);
            }
            
            if ($creatorId) {
                // Recalculate Risk Metrics
                try {
                    $this->riskService->recalculateMetrics($creatorId);
                } catch (\Exception $e) {
                    Log::error("Risk Engine: Failed to recalculate metrics on refund: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to process refund: " . $e->getMessage());
        }
        // ----------------------------------

        // --- Module Sync: Mark internal purchase records as refunded ---
        
        // 1. Tasks
        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $purchase->status = 'refunded';
            $purchase->refunded_at = now();

            // Try to get refund ID from charge
            if (isset($charge->refunds->data) && !empty($charge->refunds->data)) {
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

            // Notify Supporter and Creator
            try {
                $task = $purchase->task;
                $supporter = $purchase->supporter;
                $creator = $purchase->creator;

                if ($creator) {
                    $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                }
                if ($supporter) {
                    $this->userProfileService->clearUserCaches($supporter->username, $supporter->id);
                }

                if ($supporter) {
                    Helpers::sendNotification("Task Refunded 💸", "The task '{$task->title}' has been refunded.", $supporter->email);
                    Mail::to($supporter->email)->send(new TaskRefunded(['title' => $task->title, 'amount' => $purchase->amount, 'currency' => $task->currency, 'message' => "The task was refunded."]));
                }

                if ($creator) {
                    Helpers::sendNotification("Task Refunded 💸", "The task '{$task->title}' has been refunded to the supporter.", $creator->email);
                    Mail::to($creator->email)->send(new TaskRefunded(['title' => $task->title, 'amount' => $purchase->amount, 'currency' => $task->currency, 'message' => "The task was refunded to the supporter."]));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send refund notifications (webhook): " . $e->getMessage());
            }
        }

        // 2. Tips / Support
        $tip = \App\Models\TipGoalsPayment::where('session_id', $paymentIntentId)->first();
        if (!$tip) {
            // Resolve session ID from risk engine if not found directly
            $riskPayment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if ($riskPayment && $riskPayment->stripe_session_id) {
                $tip = \App\Models\TipGoalsPayment::where('session_id', $riskPayment->stripe_session_id)->first();
            }
        }
        if ($tip) {
            $tip->update(['status' => 'refunded']);

            try {
                $tipCreator = $tip->creator;
                $tipSupporter = $tip->user;
                $tipTitle = $tip->tipGoal->title ?? 'Support Payment';
                $tipAmount = $tip->amount ?? 0;
                $tipCurrency = $tip->currency ?? 'GBP';
                $refundData = [
                    'payment_type' => 'support',
                    'title' => $tipTitle,
                    'amount' => $tipAmount,
                    'currency' => $tipCurrency,
                    'link' => env('APP_URL') . '/dashboard',
                ];

                if ($tipSupporter) {
                    $refundData['message'] = "Your support payment has been refunded.";
                    Helpers::sendNotification("Refund Issued 💸", "Your support payment '{$tipTitle}' has been refunded.", $tipSupporter->email);
                    Mail::to($tipSupporter->email)->send(new PaymentRefunded($refundData));
                }
                if ($tipCreator) {
                    $refundData['message'] = "A support payment you received has been refunded to the supporter.";
                    Helpers::sendNotification("Refund Issued 💸", "A support payment '{$tipTitle}' has been refunded to the supporter.", $tipCreator->email);
                    Mail::to($tipCreator->email)->send(new PaymentRefunded($refundData));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send tip refund notifications: " . $e->getMessage());
            }
        }

        // 3. Shop Purchases
        $shopDeliverable = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)
            ->where('product_type', 'shop_item')
            ->first();
        $shopPayment = null;
        if ($shopDeliverable) {
            $shopPayment = \App\Models\ShopPayment::where('session_id', $shopDeliverable->session_id)->first();
        } else {
            // Fallback for session ID lookup
            $shopPayment = \App\Models\ShopPayment::where('session_id', $paymentIntentId)->first();
        }

        if ($shopPayment) {
            $shopPayment->update(['payment_status' => 'refunded']);

            try {
                $shopBuyer = $shopPayment->user;
                $shopCreator = $shopPayment->shop ? $shopPayment->shop->user : null;
                $shopTitle = $shopPayment->shop->name ?? 'Shop Item';
                $shopAmount = $shopPayment->amount ?? 0;
                $shopCurrency = $shopPayment->currency ?? 'GBP';
                $shopRefundData = [
                    'payment_type' => 'shop',
                    'title' => $shopTitle,
                    'amount' => $shopAmount,
                    'currency' => $shopCurrency,
                    'link' => env('APP_URL') . '/dashboard',
                ];

                if ($shopBuyer) {
                    $shopRefundData['message'] = "Your shop purchase has been refunded.";
                    Helpers::sendNotification("Refund Issued 💸", "Your purchase from '{$shopTitle}' has been refunded.", $shopBuyer->email);
                    Mail::to($shopBuyer->email)->send(new PaymentRefunded($shopRefundData));
                }
                if ($shopCreator) {
                    $shopRefundData['message'] = "A shop purchase has been refunded to the buyer.";
                    Helpers::sendNotification("Refund Issued 💸", "A purchase from your shop '{$shopTitle}' has been refunded.", $shopCreator->email);
                    Mail::to($shopCreator->email)->send(new PaymentRefunded($shopRefundData));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send shop refund notifications: " . $e->getMessage());
            }
        }

        // 4. Wishes (StripePaymentDetail) — looked up via session_id from risk ledger Payment record
        // NOTE: StripePaymentDetail has no payment_intent_id column; use stripe_session_id from Payment table.
        // syncRiskLedgerStatus() below handles all FinancialTransaction and source-model updates including this.

        // 5 & 6. Memberships + Bills — resolved via session_id from the risk-ledger Payment record.
        // syncRiskLedgerStatus() below handles all these via syncFinancialTransactionsByPaymentIntent().
        // Direct status updates here are belt-and-suspenders for faster UI consistency.
        try {
            $riskPaymentRecord = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if ($riskPaymentRecord && $riskPaymentRecord->stripe_session_id) {
                $sessionId = $riskPaymentRecord->stripe_session_id;

                $membershipPayment = \App\Models\MembershipPayment::where('session_id', $sessionId)->first();
                if ($membershipPayment) {
                    $membershipPayment->update([
                        'status' => 'refunded',
                        'end' => now()
                    ]);

                    try {
                        $memPayer = $membershipPayment->user;
                        $memCreator = $membershipPayment->membership ? $membershipPayment->membership->user : null;
                        $memTitle = $membershipPayment->membership->name ?? 'Membership';
                        $memAmount = $membershipPayment->amount ?? 0;
                        $memCurrency = $membershipPayment->currency ?? 'GBP';
                        $memRefundData = [
                            'payment_type' => 'membership',
                            'title' => $memTitle,
                            'amount' => $memAmount,
                            'currency' => $memCurrency,
                            'link' => env('APP_URL') . '/dashboard',
                        ];

                        if ($memPayer) {
                            $memRefundData['message'] = "Your membership payment has been refunded.";
                            Helpers::sendNotification("Refund Issued 💸", "Your membership '{$memTitle}' payment has been refunded.", $memPayer->email);
                            Mail::to($memPayer->email)->send(new PaymentRefunded($memRefundData));
                        }
                        if ($memCreator) {
                            $memRefundData['message'] = "A membership payment you received has been refunded.";
                            Helpers::sendNotification("Refund Issued 💸", "A membership '{$memTitle}' payment has been refunded to the supporter.", $memCreator->email);
                            Mail::to($memCreator->email)->send(new PaymentRefunded($memRefundData));
                        }
                    } catch (\Exception $e) {
                        Log::error("Failed to send membership refund notifications: " . $e->getMessage());
                    }
                }

                $billPayment = \App\Models\BillPayment::where('session_id', $sessionId)->first();
                if ($billPayment) {
                    $billPayment->update([
                        'status' => 'refunded',
                        'end' => now()
                    ]);

                    try {
                        $billPayer = $billPayment->user;
                        $billCreator = $billPayment->bill ? $billPayment->bill->user : null;
                        $billTitle = $billPayment->bill->name ?? 'Bill';
                        $billAmount = $billPayment->amount ?? 0;
                        $billCurrency = $billPayment->currency ?? 'GBP';
                        $billRefundData = [
                            'payment_type' => 'bill',
                            'title' => $billTitle,
                            'amount' => $billAmount,
                            'currency' => $billCurrency,
                            'link' => env('APP_URL') . '/dashboard',
                        ];

                        if ($billPayer) {
                            $billRefundData['message'] = "Your bill payment has been refunded.";
                            Helpers::sendNotification("Refund Issued 💸", "Your bill payment '{$billTitle}' has been refunded.", $billPayer->email);
                            Mail::to($billPayer->email)->send(new PaymentRefunded($billRefundData));
                        }
                        if ($billCreator) {
                            $billRefundData['message'] = "A bill payment you received has been refunded.";
                            Helpers::sendNotification("Refund Issued 💸", "A bill payment '{$billTitle}' has been refunded to the supporter.", $billCreator->email);
                            Mail::to($billCreator->email)->send(new PaymentRefunded($billRefundData));
                        }
                    } catch (\Exception $e) {
                        Log::error("Failed to send bill refund notifications: " . $e->getMessage());
                    }
                }

                $wishPayment = \App\Models\StripePaymentDetail::where('session_id', $sessionId)->first();
                if ($wishPayment) {
                    $wishPayment->update(['payment_status' => 'refunded']);

                    try {
                        $wishGifter = $wishPayment->user;
                        $wishCreator = $wishPayment->owner;
                        $wishAmount = $wishPayment->amount_subtotal ?? 0;
                        $wishCurrency = $wishPayment->currency ?? 'GBP';
                        $wishRefundData = [
                            'payment_type' => 'wish',
                            'title' => 'Wish Gift',
                            'amount' => $wishAmount,
                            'currency' => $wishCurrency,
                            'link' => env('APP_URL') . '/dashboard',
                        ];

                        if ($wishGifter) {
                            $wishRefundData['message'] = "Your wish payment has been refunded.";
                            Helpers::sendNotification("Refund Issued 💸", "Your wish payment has been refunded.", $wishGifter->email);
                            Mail::to($wishGifter->email)->send(new PaymentRefunded($wishRefundData));
                        } elseif ($wishPayment->guest_email) {
                            $wishRefundData['message'] = "Your wish payment has been refunded.";
                            Mail::to($wishPayment->guest_email)->send(new PaymentRefunded($wishRefundData));
                        }
                        if ($wishCreator) {
                            $wishRefundData['message'] = "A wish payment you received has been refunded.";
                            Helpers::sendNotification("Refund Issued 💸", "A wish payment has been refunded to the supporter.", $wishCreator->email);
                            Mail::to($wishCreator->email)->send(new PaymentRefunded($wishRefundData));
                        }
                    } catch (\Exception $e) {
                        Log::error("Failed to send wish refund notifications: " . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Risk Engine: Failed to update Membership/Bill/Wish on refund: " . $e->getMessage());
        }

        // --- Finalize Sync: propagates to ALL tables including FinancialTransaction, Deliverable, UserPayment ---
        if ($paymentIntentId) {
            $this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
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
                    $creatorId = $creator->uuid;
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
                    $appFee = $paymentIntent->application_fee_amount ?? 0;
                    $stripeFee = \App\StripeControl::getStripeFeeMinorForPaymentIntent((string) $paymentIntentId, $connectedAccountId);
                    $netMinor = max(0, $paymentIntent->amount - $appFee - $stripeFee);

                    $existing = \App\Models\Payment::whereNull('stripe_payment_intent_id')
                        ->where('creator_id', $creatorId)
                        ->where('currency', strtoupper((string) $paymentIntent->currency))
                        ->where('amount', $netMinor)
                        ->where('created_at', '>=', now()->subMinutes(10))
                        ->orderByDesc('created_at')
                        ->first();
                    if ($existing) {
                        $existing->update([
                            'stripe_payment_intent_id' => $paymentIntentId,
                        ]);
                        $payment = $existing;
                    } else {

                    $payment = \App\Models\Payment::create([
                        'stripe_payment_intent_id' => $paymentIntentId,
                        'creator_id' => $creatorId,
                        'amount' => $netMinor, // Amount in minor units for Risk Ledger (Net amount)
                        'currency' => strtoupper($paymentIntent->currency),
                        'reserve_amount_minor' => 0,
                        'status' => 'succeeded',
                    ]);
                    }
                    Log::info("Risk Ledger: Auto-created missing Payment record", ['id' => $payment->id, 'creator_id' => $creatorId]);
                } catch (\Exception $e) {
                    Log::error("Risk Ledger: Failed to auto-create payment: " . $e->getMessage());
                }
            }
        }
        
        if ($payment) {
            $newStatus = 'succeeded';
            // If the payment is already in a specialized state (hold, dispute, refund), 
            // we should PRESERVE that state unless it's just 'initiated' or 'pending'.
            if (in_array($payment->status, ['review_hold', 'disputed', 'refunded'])) {
                $newStatus = $payment->status;
            }
            
            $this->syncRiskLedgerStatus($paymentIntentId, $newStatus);
            
            // Also clear discovery cache to update trending/top earners
            app(\App\Services\DiscoveryService::class)->clearDiscoveryCache();

            try {
                // Calculate reserve based on the creator's share (Net Amount)
                // This ensures the reserve percentage matches what the creator expects to see.
                if ((int) ($payment->reserve_amount_minor ?? 0) === 0 || true) { // Force recalculation to ensure net-based
                    $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $payment->creator_id);
                    $reservePercent = (int) ($metrics->reserve_percent ?? 0);
                    if ($reservePercent > 0) {
                        // Calculate Net Amount
                        $netMinor = null;
                        
                        // First try to get it from metadata (set by our controllers)
                        if (isset($paymentIntent->metadata->creator_net_amount)) {
                            $netMinor = (int) $paymentIntent->metadata->creator_net_amount;
                        } 
                        
                        if ($netMinor === null) {
                            // Fallback: Gross - App Fee - Stripe Fee
                            $appFee = $paymentIntent->application_fee_amount ?? 0;
                            $stripeFee = \App\StripeControl::getStripeFeeMinorForPaymentIntent((string) $paymentIntentId, $connectedAccountId);
                            $netMinor = max(0, $paymentIntent->amount - $appFee - $stripeFee);
                        }
                        
                        $reserveMinor = (int) round(((int) $netMinor * $reservePercent) / 100);
                        
                        $payment->update([
                            'reserve_amount_minor' => $reserveMinor,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Failed to backfill reserve amount on payment success: " . $e->getMessage());
            }
            
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

    /**
     * Process shop item payment (Webhook alternative to ShopsController@successPayment)
     */
    private function processShopItemPayment($session, $metadata)
    {
        return DB::transaction(function () use ($session, $metadata) {
            try {
                $paymentId = $metadata->payment_id ?? null;
                if (!$paymentId) {
                    Log::error("StripeWebhookController: Missing payment_id in metadata for shop purchase");
                    return;
                }

                $shopPayment = ShopPayment::with(['shop', 'shop.user', 'user'])->where('uuid', $paymentId)->lockForUpdate()->first();
                if (!$shopPayment) {
                    Log::error("StripeWebhookController: No ShopPayment found for UUID: $paymentId");
                    return;
                }

                // Idempotency check: if already paid, skip
                if ($shopPayment->payment_status === 'paid') {
                    Log::info("StripeWebhookController: Shop payment already processed", ['payment_id' => $paymentId]);
                    return;
                }

                Log::info("StripeWebhookController: Processing shop payment via webhook", ['payment_id' => $paymentId]);

                // 1. Decrement stock if applicable
                $shop = $shopPayment->shop;
                if ($shop->slot_limitation !== null) {
                    if ($shop->slot_limitation > 0) {
                        $shop->decrement('slot_limitation');
                    } else {
                        Log::warning('Shop item sold out during webhook processing', ['shop_id' => $shop->id]);
                    }
                }

                // 2. Update GMV
                Helpers::addGmv($shopPayment->shop->user_id, (float) $shopPayment->amount);

                // 3. Set username for notification
                if ($shopPayment->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $shopPayment->name ?? ($shopPayment->user->name ?? "Anonymous user");
                }

                // 4. Save notification
                $message = $username . " just purchased your shop item " . $shopPayment->shop->name;
                NotificationSave::dispatch($message, $shopPayment->shop->user, $shopPayment->user, 'Shop');

                // 5. Update status
                $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                $shopPayment->update([
                    'payment_status' => 'paid',
                    'session_id' => $session->id,
                    'total_paid' => (float) ($session->amount_total / $multiplier),
                    'updated_at' => Carbon::now(),
                ]);
                $shopPayment->refresh();

                // Immediately sync to FinancialTransaction so earnings dashboard and support history shows up-to-date
                try {
                    $creator = $shopPayment->shop->user;
                    $amount = (float) $shopPayment->amount;
                    $shippingAmount = (float) ($shopPayment->shipping_amount ?? 0);
                    $vat = (float) ($shopPayment->vat_tax_amount ?? 0);
                    if ($vat <= 0 && $creator && $creator->vat_amount_percentage > 0) {
                        $vat = round(($amount + $shippingAmount) * (float) $creator->vat_amount_percentage / 100, 2, PHP_ROUND_HALF_UP);
                    }
                    // Use actual fee breakdown from the gross-up formula (not legacy tax_amount)
                    $shopBreakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat + $shippingAmount, strtoupper($shopPayment->currency ?? 'GBP'));
                    $platformFee = $shopBreakdown['platform_fee'] + $shopBreakdown['compliance_fee'] + $shopBreakdown['admin_fee'];
                    $stripeFee = $shopBreakdown['stripe_fee'];
                    $gross = $shopPayment->total_paid && $shopPayment->total_paid > 0 
                        ? (float) $shopPayment->total_paid 
                        : $shopBreakdown['total_supporter_pays'];
                    $creatorAmount = $amount + $shippingAmount;

                    \App\Models\FinancialTransaction::updateOrCreate(
                        [
                            'source_type' => \App\Models\ShopPayment::class,
                            'source_id' => $shopPayment->id,
                        ],
                        [
                            'user_id' => $creator->id,
                            'supporter_id' => $shopPayment->user_id,
                            'type' => 'income',
                            'gross_amount' => $gross,
                            'platform_fee' => $platformFee,
                            'stripe_fee' => $stripeFee,
                            'vat_amount' => $vat,
                            'net_amount' => $creatorAmount,
                            'currency' => strtoupper($shopPayment->currency ?? 'GBP'),
                            'status' => 'completed',
                            'description' => 'Shop Purchase: ' . ($shopPayment->shop->name ?? 'Item'),
                            'transaction_date' => $shopPayment->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync ShopPayment to FinancialTransaction in processShopItemPayment: ' . $e->getMessage(), ['shop_payment_id' => $shopPayment->id]);
                }

                // 6. Get currency symbol and calculate net
                $currency = \App\Models\Currency::where('iso', strtoupper($shopPayment->currency))->first();
                $symbol = $currency->symbol ?? '£';

                // Calculate creator net amount: gross-up from creator's listed price (no extra shop_tax)
                $listedPriceToGrossUp = $shopPayment->amount + $shopPayment->vat_tax_amount + ($shopPayment->shipping_amount ?? 0);
                
                $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $shopPayment->shop->user->uuid);
                $reserveRate = $metrics->reserve_percent ?? 0;
                
                $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $shopPayment->currency, $reserveRate);
                $creatorNetAmount = $symbol . number_format($breakdown['net_to_creator'], 2);

                // 7. Dispatch jobs
                ShopBuyed::dispatch($shopPayment, $shopPayment->anonymous == 1, $creatorNetAmount);
                
                // 8. Create deliverable record
                $deliverable = null;
                try {
                    if (!\App\Models\Deliverable::where('session_id', $session->id)->exists()) {
                        $deliverable = \App\Models\Deliverable::create([
                            'uuid' => (string) \Illuminate\Support\Str::uuid(),
                            'product_id' => $shopPayment->shop->stripe_product_id ?? 'shop_' . $shopPayment->shop->id,
                            'price_id' => $shopPayment->shop->price_id,
                            'item_id' => $shopPayment->shop->id,
                            'creator_id' => $shopPayment->shop->user_id,
                            'gifter_id' => $shopPayment->user_id,
                            'payment_intent_id' => $session->payment_intent ?? null,
                            'session_id' => $session->id,
                            'deliverable_type' => $shopPayment->shop->type == 'physical' ? 'shipping' : 'digital_file',
                            'product_type' => 'shop_item',
                            'transaction_amount' => $shopPayment->amount,
                            'deliverable_url' => $shopPayment->shop->reward_file_url,
                            'customer_email' => $shopPayment->email ?? ($shopPayment->user->email ?? null),
                            'customer_name' => $shopPayment->name ?? ($shopPayment->user->name ?? null),
                            'payment_status' => 'paid',
                            'payment_currency' => strtoupper($shopPayment->currency ?? 'GBP'),
                            'anonymous' => $shopPayment->anonymous ?? false,
                            'message' => $shopPayment->message,
                            'status' => $shopPayment->shop->type == 'physical' ? 'pending' : 'delivered',
                            'delivered_at' => $shopPayment->shop->type == 'physical' ? null : now(),
                            'metadata' => json_encode([
                                'shop_item_id' => $shopPayment->shop->id,
                                'shop_item_name' => $shopPayment->shop->name,
                                'type' => $shopPayment->shop->type,
                                'amount' => $shopPayment->amount,
                                'currency' => $shopPayment->currency,
                                'creator_net_amount' => $creatorNetAmount,
                                'via_webhook' => true
                            ])
                        ]);
                        Log::info('StripeWebhookController: Deliverable record created for shop item', ['shop_id' => $shopPayment->shop->id]);
                    }
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to create deliverable record for shop', ['error' => $e->getMessage()]);
                }

                ShopBuyedUser::dispatch($shopPayment, $shopPayment->shop->reward_file_url, $symbol);

                // 9. Send PWA notifications
                try {
                    $creatorName = ucfirst($shopPayment->shop->user->name) ?? 'A Creator';
                    Helpers::sendNotification("🛍️ Purchase Confirmed!", "You bought something from $creatorName ’s shop. They’ll process it soon.", $shopPayment->email ?? $shopPayment->user->email);

                    $fanName = ucfirst($shopPayment->user->name ?? $shopPayment->name) ?? 'A Fan';
                    Helpers::sendNotification("📦 New Shop Order!", "$fanName placed an order in your shop. Time to fulfill it!.", $shopPayment->shop->user->email);
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to send PWA notifications for shop', ['error' => $e->getMessage()]);
                }

                // 10. Record UserPayment
                try {
                    $existingUserPayment = UserPayment::where('payment_details', json_encode($session->id, true))->exists();
                    if (!$existingUserPayment) {
                        UserPayment::create([
                            'from_user_id' => $shopPayment->user_id ?? null,
                            'to_user_id' => $shopPayment->shop->user_id,
                            'product_type' => 'shop',
                            'amount' => $shopPayment->amount,
                            'total_paid' => $shopPayment->total_paid,
                            'currency' => $shopPayment->currency,
                            'payment_method' => 'stripe',
                            'payment_details' => json_encode($session->id, true),
                            'paid_at' => Carbon::now(),
                            'status' => 'paid',
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to record UserPayment for shop', ['error' => $e->getMessage()]);
                }

                // 11. Clear user caches
                $this->userProfileService->clearUserCaches($shopPayment->shop->user->username, $shopPayment->shop->user->id);

            } catch (\Exception $e) {
                Log::error("StripeWebhookController: Error processing shop payment: " . $e->getMessage(), [
                    'session_id' => $session->id,
                    'trace' => $e->getTraceAsString()
                ]);
            }
        });
    }

    /**
     * Handle Stripe Connect Account Updates (Risk Monitoring)
     */
    private function handleAccountUpdated($account)
    {
        try {
            if (!isset($account->settings->payouts->schedule->interval)) {
                return;
            }

            $schedule = $account->settings->payouts->schedule->interval;
            if ($schedule !== 'manual') {
                $creator = \App\Models\User::where('account_id', $account->id)->first();
                if ($creator) {
                    // Check if creator is already live and verified
                    // If they are still onboarding (identity not verified or profile not approved), 
                    // just revert the schedule without locking the account.
                    $isLive = ($creator->identity_status == 1 && $creator->profile_status_lock == 2);

                    // Check if the user was resolving issues. 
                    // If they have pending requirements, we assume they were fixing something 
                    // and Stripe might have reset the schedule automatically.
                    $hasRequirements = !empty($account->requirements->currently_due) || 
                                     !empty($account->requirements->eventually_due) ||
                                     !empty($account->requirements->past_due);

                    if ($isLive && !$hasRequirements) {
                        Log::warning("Stripe Risk: Live Account {$account->id} changed payout schedule to {$schedule} without pending requirements. Reverting and locking.");
                        
                        // Auto-lock the account
                        $creator->suspended_account = 1;
                        $creator->save();
                        $creator->tokens()->delete();

                        // Mark as HIGH RISK with minimum 20% reserve
                        $metrics = \App\Models\CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid]);
                        $metrics->risk_level = 'high';
                        $metrics->reserve_percent = max((int) $metrics->reserve_percent, 20);
                        $metrics->save();
                        
                        Log::warning("Stripe Risk: Account {$account->id} locked and marked HIGH RISK due to payout schedule manipulation.");
                    } else {
                        $reason = $hasRequirements ? "resolving requirements" : "onboarding";
                        Log::info("Stripe Risk: Account {$account->id} ({$reason}) changed payout schedule to {$schedule}. Reverting without locking.");
                    }

                    // Always revert to manual
                    \App\StripeControl::ensureManualPayoutSchedule($account->id);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error handling account.updated for risk monitoring: ' . $e->getMessage());
        }
    }

    /**
     * Handle Stripe Payout Events (Risk Monitoring)
     */
    private function handlePayoutEvent($payout, $eventType, $event)
    {
        try {
            // Update local PayoutRecord if it exists
            $record = \App\Models\PayoutRecord::where('stripe_payout_id', $payout->id)->first();
            if ($record) {
                $status = match ($payout->status) {
                    'paid' => 'paid',
                    'failed' => 'failed',
                    'canceled' => 'canceled',
                    'in_transit' => 'in_transit',
                    default => 'pending'
                };

                $record->update([
                    'status' => $status,
                    'arrival_date' => $payout->arrival_date ? \Carbon\Carbon::createFromTimestamp($payout->arrival_date) : $record->arrival_date,
                    'failure_code' => $payout->failure_code ?? null,
                    'failure_message' => $payout->failure_message ?? null,
                ]);

                Log::info("Payout Record updated via webhook: {$payout->id} status: {$status}");
            }

            // Check if payout was initiated by our platform (using local records or metadata)
            $isPlatformPayout = \App\Models\PayoutRecord::where('stripe_payout_id', $payout->id)->exists() || 
                               (isset($payout->metadata) && (isset($payout->metadata->payout_run_id) || isset($payout->metadata->reason)));
            
            if (!$isPlatformPayout && $payout->status !== 'canceled' && $payout->status !== 'failed') {
                $accountId = $event->account ?? null;
                Log::critical("Stripe Risk: Unexpected payout created {$payout->id} on account {$accountId}.");
                
                if ($accountId) {
                    $creator = \App\Models\User::where('account_id', $accountId)->first();
                    if ($creator) {
                        $creator->suspended_account = 1;
                        $creator->save();
                        $creator->tokens()->delete();

                        // Mark as HIGH RISK with minimum 20% reserve
                        $metrics = \App\Models\CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid]);
                        $metrics->risk_level = 'high';
                        $metrics->reserve_percent = max((int) $metrics->reserve_percent, 20);
                        $metrics->save();

                        Log::critical("Stripe Risk: Account {$accountId} locked and marked HIGH RISK due to unexpected manual payout creation.");
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Error handling {$eventType} for risk monitoring: " . $e->getMessage());
        }
    }

    /**
     * Handle review.closed event
     */
    private function handleReviewClosed($review)
    {
        $paymentIntentId = $review->payment_intent ?? null;
        if (!$paymentIntentId) return;

        Log::info("Handling review.closed", [
            'review_id' => $review->id,
            'pi_id' => $paymentIntentId,
            'reason' => $review->reason
        ]);

        // Stripe review.closed reasons: approved, disputed, refunded, redacted
        if ($review->reason === 'approved') {
            $this->syncRiskLedgerStatus($paymentIntentId, 'succeeded');
        } elseif (in_array($review->reason, ['refunded', 'refunded_as_fraud'], true)) {
            $this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
        } elseif ($review->reason === 'disputed') {
            $this->syncRiskLedgerStatus($paymentIntentId, 'disputed');
        }
        // 'redacted' means the payment was blocked/removed by Stripe — leave status as-is
    }

    /**
     * Handle Dispute Created
     */
    private function handleDisputeCreated($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;
        if ($paymentIntentId) {
            $this->syncRiskLedgerStatus($paymentIntentId, 'disputed');
        }
    }

    /**
     * Reconstruct StripePaymentItems and FinancialTransaction from StripePaymentDetail metadata
     * if they were missed during the success redirect.
     */
    private function syncWishPaymentItemsFromDetail($payment, $session)
    {
        if (!$payment || !$payment->metadata) {
            return;
        }

        try {
            $metadata = json_decode($payment->metadata, true);
            $wishItems = $metadata['wish_items'] ?? [];
            
            if (empty($wishItems)) {
                // Try alternate metadata format if primary is missing
                $wishItemsSummary = json_decode($payment->metadata, true)['wish_items_summary'] ?? null;
                if ($wishItemsSummary) {
                    $summary = json_decode($wishItemsSummary, true);
                    // Minimal reconstruction if summary exists but full items don't
                    // (Note: full items should be in 'wish_items' key from buildWishItemsMetadata)
                }
            }

            if (empty($wishItems)) {
                Log::warning("No wish items found in metadata for sync", ['session_id' => $session->id]);
                return;
            }

            foreach ($wishItems as $item) {
                $amount = (float) $item['amount'];
                $tax = (float) ($item['tax'] ?? 0);
                $vat = (float) ($item['vat_amount'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 1);
                $totalPaid = $amount + $tax + $vat;

                // 1. Create StripePaymentItems if missing
                $paymentItem = StripePaymentItems::updateOrCreate(
                    [
                        'stripe_payment_detail_id' => $payment->id,
                        'wish_item_id' => $item['wish_id'],
                        'amount' => $amount,
                    ],
                    [
                        'quantity' => $quantity,
                        'total_paid' => $totalPaid,
                        'tax' => $tax, 
                        'vat_amount' => $vat,
                        'created_at' => $payment->created_at,
                        'updated_at' => now(),
                    ]
                );

                // 2. Create FinancialTransaction if missing
                $creator = User::find($payment->owner_id);
                $currency = strtoupper($payment->currency ?? 'GBP');
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];
                $gross = $totalPaid; 
                
                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => StripePaymentItems::class,
                        'source_id' => $paymentItem->id,
                    ],
                    [
                        'user_id' => $payment->owner_id,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $amount,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Wish Gift: ' . ($item['wish_name'] ?? 'Item'),
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }

            // 3. Mark UserCart as processed if we have a user_id
            if ($payment->user_id) {
                UserCart::where('user_id', $payment->user_id)
                    ->where('owner_id', $payment->owner_id)
                    ->where('status', 1)
                    ->update(['status' => 0, 'quantity' => 0]);
            }

            Log::info("Synced wish payment items from metadata", ['session_id' => $session->id, 'items_count' => count($wishItems)]);

            // 4. Record UserPayment
            try {
                $existingUserPayment = UserPayment::where('payment_details', json_encode($session->id, true))->exists();
                if (!$existingUserPayment) {
                    $totalAmount = ($session->amount_total ?? 0) / 100;
                    UserPayment::create([
                        'from_user_id' => $payment->user_id ?? null,
                        'to_user_id' => $payment->owner_id,
                        'product_type' => 'wish item',
                        'amount' => $payment->amount_subtotal,
                        'total_paid' => $totalAmount,
                        'currency' => $payment->currency,
                        'payment_method' => 'stripe',
                        'payment_details' => json_encode($session->id, true),
                        'paid_at' => Carbon::now(),
                        'status' => 'paid',
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to record UserPayment for wish', ['error' => $e->getMessage()]);
            }

        } catch (\Exception $e) {
            Log::error("Failed to sync wish payment items from metadata: " . $e->getMessage(), ['session_id' => $session->id]);
        }
    }

    /**
     * Handle Dispute Won (Funds Reinstated)
     */
    private function handleDisputeWon($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;
        if ($paymentIntentId) {
            $this->syncRiskLedgerStatus($paymentIntentId, 'succeeded');
        }
    }

    /**
     * Handle Dispute Lost (Funds Withdrawn)
     */
    private function handleDisputeLost($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;
        if ($paymentIntentId) {
            // Mark as refunded — funds were withdrawn by Stripe, treated same as refund for payout purposes
            $this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
        }
    }

    /**
     * Sync payment status across Risk Ledger and Financial Transactions
     */
    private function syncRiskLedgerStatus($paymentIntentId, $newStatus)
    {
        try {
            $payment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if ($payment) {
                $payment->update(['status' => $newStatus]);
                Log::info("Risk Ledger: Synced payment status to {$newStatus}", ['id' => $payment->id]);

                // Direct immediate update on financial_transactions
                $this->syncFinancialTransactionsByPaymentIntent($paymentIntentId, $newStatus);

                // Also queue full sync as fallback (pass integer user_id, not UUID)
                if ($payment->creator_id) {
                    try {
                        $creator = \App\Models\User::where('uuid', $payment->creator_id)->first();
                        $intUserId = $creator ? $creator->id : null;
                        if ($intUserId) {
                            \Illuminate\Support\Facades\Artisan::queue('finance:sync-transactions', [
                                '--user_id' => $intUserId,
                            ]);
                            
                            // Re-evaluate Refer & Earn GMV on any payment status change
                            \App\Helpers::recalculateGmv($intUserId);

                            Log::info("Financial Sync queued for creator user_id: " . $intUserId);
                        }
                    } catch (\Exception $e) {
                        Log::error("Failed to queue financial sync: " . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to sync risk ledger status: " . $e->getMessage());
        }
    }

    /**
     * Directly update financial_transactions status for ALL source records linked to a payment intent.
     * Also propagates status to source payment tables, UserPayment, and Deliverable.
     * This provides immediate consistency without waiting for the sync command queue.
     */
    private function syncFinancialTransactionsByPaymentIntent(string $paymentIntentId, string $newStatus): void
    {
        try {
            $ftStatus = match($newStatus) {
                'succeeded' => 'completed',
                'disputed'  => 'disputed',
                'refunded'  => 'refunded',
                'review_hold' => 'review_hold',
                'failed', 'blocked' => 'failed',
                default     => $newStatus,
            };

            // Also resolve via session_id from the Payment (risk ledger) record
            $paymentRecord = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            $sessionId = $paymentRecord->stripe_session_id ?? null;

            // Fallback: Resolve session_id from Deliverables if missing (crucial for subscription renewals)
            if (!$sessionId && $paymentIntentId) {
                $sessionId = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)->value('session_id');
            }

            // Source models: [class, payment_intent column, session column, status column]
            $sourceModels = [
                [\App\Models\TaskPurchase::class,        'payment_intent_id',        'stripe_session_id', 'status'],
                [\App\Models\TipGoalsPayment::class,     null,                        'session_id',        'status'],
                [\App\Models\ShopPayment::class,         null,                        'session_id',        'payment_status'],
                [\App\Models\StripePaymentDetail::class, 'stripe_payment_intent_id',  'session_id',        'payment_status'],
                [\App\Models\MembershipPayment::class,   'stripe_id',                 'session_id',        'status'],
                [\App\Models\BillPayment::class,         'stripe_id',                 'session_id',        'status'],
                [\App\Models\WishItemSubscription::class,'stripe_id',                 'session_id',        'status'],
            ];

            // Map risk-ledger status to source-model friendly status
            $sourceStatus = match($newStatus) {
                'succeeded' => 'paid',
                'disputed'  => 'disputed',
                'refunded'  => 'refunded',
                'review_hold' => 'review_hold',
                'failed', 'blocked' => 'failed',
                default     => $newStatus,
            };

            foreach ($sourceModels as [$modelClass, $piCol, $sessionCol, $statusCol]) {
                // Find ALL matching records (not just first) via PI or session
                $query = $modelClass::query();
                $query->where(function ($q) use ($piCol, $sessionCol, $paymentIntentId, $sessionId) {
                    if ($piCol && $paymentIntentId) {
                        $q->where($piCol, $paymentIntentId);
                    }
                    
                    if ($sessionCol) {
                        if ($sessionId) $q->orWhere($sessionCol, $sessionId);
                        if ($paymentIntentId) $q->orWhere($sessionCol, $paymentIntentId);
                    }
                });

                // Extra check for renewals (Bills, Memberships, Wish Subscriptions)
                if (empty($records) || $records->isEmpty()) {
                    if ($modelClass === \App\Models\BillPayment::class || 
                        $modelClass === \App\Models\MembershipPayment::class ||
                        $modelClass === \App\Models\WishItemSubscription::class) {
                        
                        $productTypeMap = [
                            \App\Models\BillPayment::class => 'bill',
                            \App\Models\MembershipPayment::class => 'membership',
                            \App\Models\WishItemSubscription::class => 'wish_subscription'
                        ];
                        
                        $subscriptionId = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)
                            ->orWhere('session_id', $sessionId)
                            ->whereIn('product_type', [$productTypeMap[$modelClass] ?? '', 'wish_subscription_renewal', 'wish_subscription_content'])
                            ->get()
                            ->map(fn($d) => json_decode($d->metadata, true)['subscription_id'] ?? json_decode($d->metadata, true)['stripe_subscription_id'] ?? null)
                            ->filter()
                            ->first();
                        
                        if ($subscriptionId) {
                            $query->orWhere('stripe_id', $subscriptionId);
                        }
                    }
                }

                $records = $query->get();
                foreach ($records as $record) {
                    // Update the source record's own status column
                    try {
                        $record->update([$statusCol => $sourceStatus]);
                    } catch (\Throwable $e) {
                        // Status column might not accept this value; log and continue
                        Log::warning("syncFinancialTransactionsByPaymentIntent: Could not update {$modelClass}#{$record->id}.{$statusCol} to {$sourceStatus}: " . $e->getMessage());
                    }

                    // Update all FinancialTransaction rows linked to this source
                    $updated = \App\Models\FinancialTransaction::where('source_type', $modelClass)
                        ->where('source_id', $record->id)
                        ->update(['status' => $ftStatus]);
                    if ($updated) {
                        Log::info("FinancialTransaction updated directly", [
                            'source_type' => $modelClass,
                            'source_id'   => $record->id,
                            'status'      => $ftStatus,
                        ]);
                    }
                }

                // For StripePaymentDetail, also update child StripePaymentItems FTs
                if ($modelClass === \App\Models\StripePaymentDetail::class && $records->isNotEmpty()) {
                    $detailIds = $records->pluck('id');
                    $items = \App\Models\StripePaymentItems::whereIn('stripe_payment_detail_id', $detailIds)->get();
                    foreach ($items as $item) {
                        \App\Models\FinancialTransaction::where('source_type', \App\Models\StripePaymentItems::class)
                            ->where('source_id', $item->id)
                            ->update(['status' => $ftStatus]);
                    }
                }
            }

            // Update Deliverable status
            $deliverables = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)
                ->when($sessionId, fn($q) => $q->orWhere('session_id', $sessionId))
                ->get();
            foreach ($deliverables as $deliverable) {
                $deliverableStatus = match($newStatus) {
                    'failed', 'blocked' => 'failed',
                    default => $deliverable->status, 
                };
                if ($deliverableStatus !== $deliverable->status) {
                    $deliverable->update(['status' => $deliverableStatus]);
                }
                if (in_array($newStatus, ['succeeded', 'review_hold']) && $deliverable->payment_status !== 'paid') {
                    $deliverable->update(['payment_status' => 'paid']);
                } elseif ($newStatus === 'refunded') {
                    $deliverable->update(['payment_status' => 'refunded']);
                }
            }

            // Update UserPayment status
            if ($sessionId) {
                \App\Models\UserPayment::where('payment_details', 'LIKE', '%' . $sessionId . '%')
                    ->update(['status' => $sourceStatus]);
            }
            if ($paymentIntentId) {
                \App\Models\UserPayment::where('payment_details', 'LIKE', '%' . $paymentIntentId . '%')
                    ->update(['status' => $sourceStatus]);
            }

        } catch (\Exception $e) {
            Log::error("syncFinancialTransactionsByPaymentIntent failed: " . $e->getMessage());
        }
    }
}
