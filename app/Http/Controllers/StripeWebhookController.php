<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\SendIdentityVerificationEmail;
use App\Jobs\SendPaymentSuccessEmail;
use App\Mail\PaymentSuccessMail;
use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use App\Services\StripeControl;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\Deliverable;
use App\Models\MembershipPayment;
use App\Models\StripePaymentDetail;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\WishItemSubscription;
use App\StripeControl as AppStripeControl;
// use App\StripeControl as AppStripeControl;
use Carbon\Carbon;
use Stripe\Customer;
use Stripe\StripeClient;
use Stripe\Stripe;
use Stripe\Webhook;
use App\Mail\TaskPurchasedMail;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskRefunded;
use App\Services\UserProfileService;

class StripeWebhookController extends Controller
{
    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        $this->userProfileService = $userProfileService;
    }

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

    // private function checkForFraud($session)
    // {
    //     // Analyze the session details for fraud
    //     $lastError = $session->last_error;
    //     $verificationChecks = $session->verification_checks;

    //     if ($lastError) {
    //         Log::warning('Fraud detected based on last error', ['error' => $lastError]);
    //         return true; // Fraud detected due to error
    //     }

    //     // Check if any verification checks failed
    //     if ($verificationChecks) {
    //         foreach ($verificationChecks as $check) {
    //             if ($check->status !== 'passed') {
    //                 Log::warning('Fraud detected based on failed verification check', ['check' => $check]);
    //                 return true; // Fraud detected due to failed checks
    //             }
    //         }
    //     }

    //     // Additional fraud detection logic can go here (e.g., comparing with other systems)

    //     return false; // No fraud detected
    // }

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
            case 'checkout.session.completed':
                Log::info("Handling Checkout Session Completed");
                $this->handleCheckoutSessionCompleted($data, $metadata);
                $this->handleSupportPaymentDeliverableReady($data, $metadata);
                break;

            case 'checkout.session.async_payment_succeeded':
                Log::info("Handling Checkout Session Async Payment Succeeded");
                $this->handleAsyncPaymentSucceeded($data);
                break;

            case 'checkout.session.async_payment_failed':
                Log::info("Handling Checkout Session Async Payment Failed");
                $this->handleAsyncPaymentFailed($data);
                break;

            case 'invoice.paid':
                Log::info("Handling Invoice Paid");
                $this->handleInvoicePaid($data, $metadata);
                break;

            case 'invoice.payment_succeeded':
                Log::info("Handling Invoice Payment Succeeded");
                $this->handleInvoicePaymentSucceeded($data, $metadata);
                $this->handleSupportPaymentDeliverableReady($data, $metadata);
                break;

            case 'charge.dispute.created':
                Log::info("Handling Charge Dispute Created");
                $this->handleChargeDisputeCreated($data);
                break;

            case 'charge.dispute.closed':
                Log::info("Handling Charge Dispute Closed");
                $this->handleChargeDisputeClosed($data);
                break;

            case 'charge.refunded':
                Log::info("Handling Charge Refunded");
                $this->handleChargeRefunded($data);
                break;

            case 'payment_intent.payment_failed':
                Log::info("Handling Payment Intent Failed");
                $this->handlePaymentIntentFailed($data);
                break;

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
     * Handle checkout session completed event
     */
    public function handleCheckoutSessionCompleted($session, $metadata)
    {
        try {
            Log::info("Processing checkout session completed", [
                'session_id' => $session->id,
                'metadata' => $metadata
            ]);

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

        // Calculate amount from session amount_total (in cents/smallest unit)
        $amount = ($session->amount_total ?? 0) / 100;
        
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
            'status' => $initialStatus,
            'payment_type' => $metadata->payment_type ?? 'STANDARD',
            'gifter_message' => $metadata->gifter_message ?? null,
            'admin_fee' => $metadata->admin_fee ?? 0,
            'platform_fee' => $metadata->platform_fee ?? 0,
            'vat_amount' => $metadata->vat_amount ?? 0,
            'transfer_amount' => $metadata->transfer_amount ?? 0,
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
        
        // Handle Instant Task
        if (($metadata->task_type ?? '') === 'instant') {
            $purchase->status = 'completed';
            $purchase->completed_at = Carbon::now();
            $purchase->save();
            
            $deliverable->status = 'delivered';
            $deliverable->delivered_at = Carbon::now();
            $deliverable->save();
            
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
                } catch (\Exception $e) {}

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

        // Clear user cache
        if ($metadata->creator_id) {
             $creator = \App\Models\User::find($metadata->creator_id);
             if ($creator) {
                 $this->userProfileService->clearUserCaches($creator->username, $creator->id);
             }
        }

        // Create deliverable entry for bill subscription renewal (like wish subscriptions)
        $this->createBillRenewalDeliverable($newSubs);

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

                Log::info('Subscription renewal content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id
                ]);
            }

            // Send renewal notification email if needed
            $this->sendSubscriptionRenewalEmail($wishSubscription, $invoiceData);
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
    private function sendSubscriptionRenewalEmail($wishSubscription, $invoiceData)
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
    public function handleInvoicePaid($data, $metadata)
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
            Log::info("Invoice paid for non-wish subscription or subscription not found", [
                'subscription_id' => $subscriptionId
            ]);
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

            case 'review.closed':
                $review = $event->data->object;

                if ($review->reason === 'approved') {
                    $paymentIntentId = $review->payment_intent;

                    if ($paymentIntentId) {
                        try {
                            $paymentIntent = $stripe->paymentIntents->retrieve($paymentIntentId, []);

                            // Only capture if it's still requires_capture
                            if ($paymentIntent->status === 'requires_capture') {
                                $stripe->paymentIntents->capture($paymentIntentId);
                                Log::info("Manually captured PaymentIntent: {$paymentIntentId}");
                            }
                        } catch (\Exception $e) {
                            Log::error("Failed to capture PaymentIntent {$paymentIntentId}: " . $e->getMessage());
                        }
                    }
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

            case 'customer.subscription.deleted':
                Log::info("Subscription deleted: {$subscriptionId}");
                $subs->status = 'cancelled';
                $subs->cancelled_at = now();
                $subs->upcoming_payment = null;
                $subs->save();
                if ($user) {
                    $user->is_subscribed = 0;
                    $user->save();
                }
                Helpers::sendNotification('Subscription has been cancelled 🛑', 'We\'re sorry to see you go. Your access will remain active until the end of the current billing period.', $customerEmail ?? null);
                SendRenewMail::dispatch($array, 'cancelled', 'site');
                break;

            default:
                Log::info("Unhandled event type: {$eventType}");
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

    /**
     * Create deliverable entry for bill subscription renewal (like wish subscriptions)
     */
    private function createBillRenewalDeliverable($billPayment)
    {
        try {
            $bill = $billPayment->bill;

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
                ->filter(function ($deliverable) {
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
                 }
             } catch (\Exception $e) {}

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
