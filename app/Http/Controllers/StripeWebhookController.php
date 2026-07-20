<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\BillContentDeliveryMail;
use App\Jobs\BillPayMail;
use App\Jobs\CreateThankYouPostJob;
use App\Jobs\Dispute\SendDisputeClosedMailJob;
use App\Jobs\Dispute\SendDisputeCreatedMailJob;
use App\Jobs\Dispute\SendDisputeUpdatedMailJob;
use App\Jobs\FraudWarning\SendFraudWarningMailJob;
use App\Jobs\MembershipMail;
use App\Jobs\NotificationSave;
use App\Jobs\PiggyPotContributionMailToUser;
use App\Jobs\ProcessWishItemDeliverable;
use App\Jobs\SendIdentityVerificationEmail;
use App\Jobs\SendRenewMail;
use App\Jobs\ShopBuyed;
use App\Jobs\ShopBuyedUser;
use App\Jobs\SubscribedMail;
use App\Jobs\TipPaymentMailToUser;
use App\Jobs\UpdateSupportPaymentStripeMetadata;
use App\Jobs\WishSubscriptionMailToUser;
use App\Mail\CommandFailed;
use App\Mail\FastStartBonusPayoutStatusUpdated;
use App\Mail\FounderBonusPayoutStatusUpdated;
use App\Mail\TaskPurchasedMail;
use App\Mail\TaskPurchasedSupporterMail;
use App\Mail\TaskRefunded;
use App\Models\AuditLog;
use App\Models\BillPayment;
use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\Dispute;
use App\Models\EarlyFraudWarning;
use App\Models\FastStartBonusPayout;
use App\Models\FinancialTransaction;
use App\Models\FounderBonus;
use App\Models\FounderBonusMonthly;
use App\Models\MembershipPayment;
use App\Models\MonthlyCharge;
use App\Models\Payment;
use App\Models\PayoutRecord;
use App\Models\PayoutRun;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\StripeWebhookStatus;
use App\Models\SupportTicket;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Services\ActivityLogger;
use App\Services\DiscoveryService;
use App\Services\Risk\IdentityRollupService;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\ReservePolicy;
use App\Services\Risk\RiskService;
use App\Services\StripeMetadataService;
use App\Services\UserProfileService;
use App\StripeControl;
use App\StripeControl as AppStripeControl;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Stripe\Exception\SignatureVerificationException;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Webhook;

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
     * @return JsonResponse
     */
    public function handle(Request $request)
    {
        Log::info('StripeWebhookController: Received request at /webhook/payment (Unified Endpoint)');

        // Ensure API key is set for any subsequent Stripe calls.
        // Prefer config() over env() — on Vapor, cached config makes env() return
        // null mid-request, which would break webhook signature verification.
        // env() is kept as a fallback so no environment regresses.
        $stripe_secret = config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY');
        Stripe::setApiKey($stripe_secret);

        $payload = @file_get_contents('php://input');
        $sig_header = $request->header('Stripe-Signature');
        $event = null;

        // Try multiple secrets (UK and US)
        $configs = [
            ['secret' => config('services.stripe.webhook_secret') ?: env('STRIPE_WEBHOOK_SECRET'), 'key' => config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY')],
            ['secret' => config('services.stripe.webhook_secret_us') ?: env('STRIPE_WEBHOOK_SECRET_US'), 'key' => config('services.stripe.secret_us') ?: env('STRIPE_SECRET_KEY_US')],
        ];

        $verified = false;
        foreach ($configs as $config) {
            if (empty($config['secret'])) {
                continue;
            }

            try {
                $event = Webhook::constructEvent($payload, $sig_header, $config['secret']);

                // Set the correct API key for this account
                if (! empty($config['key'])) {
                    Stripe::setApiKey($config['key']);
                    config(['services.stripe.key' => $config['key']]); // Update global config if needed
                }

                $verified = true;
                break;
            } catch (SignatureVerificationException $e) {
                // Try next secret
                continue;
            } catch (\Exception $e) {
                Log::error('Stripe webhook error: '.$e->getMessage());

                return response()->json(['status' => false, 'message' => $e->getMessage()], 400);
            }
        }

        if (! $verified) {
            Log::error('Stripe webhook: Signature verification failed for all secrets');

            return response()->json(['status' => false, 'message' => 'No signatures found matching the expected signature for payload'], 400);
        }

        if (! $event || ! isset($event->type)) {
            Log::warning('Stripe webhook: Invalid event');

            return response()->json(['error' => 'Invalid event'], 400);
        }

        $webhookStatus = null;
        if (isset($event->id)) {
            $webhookStatus = StripeWebhookStatus::where('event_id', $event->id)->first();

            if ($webhookStatus && ($webhookStatus->status === 'processed' || $webhookStatus->processed_at)) {
                Log::info('Stripe Webhook: Event already processed', ['event_id' => $event->id]);

                return response()->json(['status' => 'success', 'message' => 'Already processed']);
            }

            if ($webhookStatus && $webhookStatus->status === 'processing' && $webhookStatus->updated_at && $webhookStatus->updated_at->gt(now()->subMinutes(5))) {
                Log::info('Stripe Webhook: Event already processing', ['event_id' => $event->id]);

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
                    $webhookStatus = StripeWebhookStatus::create([
                        'event_id' => $event->id,
                        'event_type' => $event->type,
                        'data' => json_encode($event->data->object),
                        'status' => 'processing',
                    ]);
                } catch (QueryException $e) {
                    $webhookStatus = StripeWebhookStatus::where('event_id', $event->id)->first();

                    if ($webhookStatus && ($webhookStatus->status === 'processed' || $webhookStatus->processed_at)) {
                        Log::info('Stripe Webhook: Event already processed', ['event_id' => $event->id]);

                        return response()->json(['status' => 'success', 'message' => 'Already processed']);
                    }

                    if ($webhookStatus && $webhookStatus->status === 'processing' && $webhookStatus->updated_at && $webhookStatus->updated_at->gt(now()->subMinutes(5))) {
                        Log::info('Stripe Webhook: Event already processing', ['event_id' => $event->id]);

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

        Log::info('Handling Stripe Event: '.$type);

        try {
            switch ($type) {
                // --- Identity Verification Events ---
                // case 'identity.verification_session.requires_input':
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

                case 'checkout.session.expired':
                    $this->handleCheckoutSessionExpired($data);
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

                    // case 'charge.dispute.updated':
                    // case 'charge.dispute.funds_withdrawn':

                case 'charge.dispute.updated':
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

                case 'radar.early_fraud_warning.created':
                    $this->handleEarlyFraudWarningCreated($data);
                    break;

                case 'radar.early_fraud_warning.updated':
                    $this->handleEarlyFraudWarningUpdated($data);
                    break;

                    // case 'radar.early_fraud_warning.closed':
                    //     $this->handleEarlyFraudWarningClosed($data);
                    //     break;

                    // case 'early_fraud_warning.created':
                    //     $this->handleEarlyFraudWarningCreated($data);
                    //     break;

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

                    // case 'customer.subscription.trial_will_end':
                    // case 'customer.subscription.created':
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
                    // case 'payout.created':
                case 'payout.paid':
                case 'payout.failed':
                case 'payout.in_transit':
                case 'payout.canceled':
                    $this->handlePayoutEvent($data, $type, $event);
                    break;

                default:
                    Log::info('Unhandled event type: '.$type);
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
        $stripe = new StripeClient(Stripe::getApiKey());

        $eventType = $event->type;
        $object = $event->data->object;

        $subscriptionId = $object->subscription ?? $object->id ?? null;
        if (! $subscriptionId) {
            return;
        } // Ignored

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
                if (! isset($object->subscription) && $object->object !== 'subscription') {
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
                    'expand' => ['customer'],
                ]);
                $customer = $subscription->customer;
            }
        } catch (\Exception $e) {
            Log::error('Failed to retrieve subscription/customer in processMandatorySubscription: '.$e->getMessage());

            return;
        }

        // Latest DB row for this subscription
        $subs = MonthlyCharge::where('stripe_id', $subscriptionId)
            ->whereIn('status', ['trialing', 'active', 'paid'])
            ->orderByDesc('updated_at')
            ->first();

        // If no DB record and not a creation event, we might want to skip or create?
        // Original logic: "Trial Started" creates record. "First Payment" creates record.

        /* ================= Stripe billing period ================= */
        $stripeStart = Carbon::createFromTimestamp($subscription->current_period_start);
        $stripeEnd = Carbon::createFromTimestamp($subscription->current_period_end);

        /* ================= Handle different event types ================= */

        // TRIAL STARTED
        if ($eventType === 'customer.subscription.trial_will_end' || ($eventType === 'customer.subscription.created' && $subscription->status === 'trialing')) {
            // Check duplicate
            $trialExists = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->whereNotNull('current_start_trial_date')
                ->exists();

            if ($trialExists) {
                return;
            }
            // if ($subs && $subs->status === 'trialing') {
            //     return;
            // }

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

            Log::info('MonthlyCharge: Trial Started/Will End processed', ['sub_id' => $subscriptionId]);

            return;
        }

        // TRIAL ENDED / SUBSCRIPTION STARTED (First Payment)
        if ($eventType === 'invoice.payment_succeeded' && $subscription->status === 'active') {

            $invoice = $object;
            $amount = ($invoice->amount_paid ?? 0) / 100;
            $currency = strtoupper($invoice->currency ?? 'GBP');

            $tax = 0;
            if (! empty($invoice->total_tax_amounts)) {
                foreach ($invoice->total_tax_amounts as $t) {
                    $tax += ($t->amount ?? 0) / 100;
                }
            }

            // Check if this is the first payment after trial
            $isFirstPayment = false;
            if ($subs) {
                $trialRecord = MonthlyCharge::where('stripe_id', $subscriptionId)
                    ->whereNotNull('current_start_trial_date')
                    ->orderBy('created_at')
                    ->first();
                $isFirstPayment = $trialRecord && empty($trialRecord->current_start_subscription_date);
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
                Log::info('MonthlyCharge: First Payment processed', ['sub_id' => $subscriptionId]);

                return;
            }
        }

        // SUBSCRIPTION RENEWAL (Existing subscription, new billing period)
        if ($eventType === 'invoice.payment_succeeded' && $subs && $subs->status === 'active') {

            $invoice = $object;
            $amount = ($invoice->amount_paid ?? 0) / 100;
            $currency = strtoupper($invoice->currency ?? 'GBP');

            $tax = 0;
            if (! empty($invoice->total_tax_amounts)) {
                foreach ($invoice->total_tax_amounts as $t) {
                    $tax += ($t->amount ?? 0) / 100;
                }
            }

            $exists = MonthlyCharge::where('stripe_id', $subscriptionId)
                ->whereDate('current_start_subscription_date', $stripeStart)
                ->whereDate('current_end_subscription_date', $stripeEnd)
                ->exists();

            if (! $exists) {
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

                Log::info('MonthlyCharge: Renewal processed', ['sub_id' => $subscriptionId]);

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
            Log::info('MonthlyCharge: Payment Failed processed', ['sub_id' => $subscriptionId]);

            return;
        }

        // SUBSCRIPTION CANCELLED (immediately deleted from Stripe)
        if ($eventType === 'customer.subscription.deleted') {
            if ($subs) {
                // Use 'canceled' (consistent with Stripe + accessor) so user keeps access until period end
                $subs->status = 'canceled';
                $subs->upcoming_payment = null;
                $subs->cancelled_at = Carbon::now();
                $subs->save();

                // Only revoke is_subscribed if the billing period has also ended
                if ($subs->user) {
                    $periodEnded = ! $subs->current_end_subscription_date ||
                        Carbon::now()->greaterThanOrEqualTo(Carbon::parse($subs->current_end_subscription_date));

                    if ($periodEnded) {
                        $subs->user->is_subscribed = 0;
                        $subs->user->save();
                    }
                }
            }
            Log::info('MonthlyCharge: Subscription Cancelled processed', ['sub_id' => $subscriptionId]);

            return;
        }

        // CANCEL AT PERIOD END scheduled via Stripe dashboard (subscription.updated with cancel_at_period_end=true)
        if (
            $eventType === 'customer.subscription.updated' &&
            $subscription->cancel_at_period_end &&
            $subs &&
            in_array($subs->status, ['active', 'paid', 'renew', 'trialing'])
        ) {
            $subs->status = 'canceled';
            $subs->upcoming_payment = null;
            $subs->cancelled_at = Carbon::now();
            $subs->save();

            Log::info('MonthlyCharge: Cancel-at-period-end scheduled', ['sub_id' => $subscriptionId, 'ends_at' => $stripeEnd]);
            // Don't return — fall through to customer detail sync below
        }

        // UPDATE STATUS FOR OTHER EVENTS
        if ($subs && $subs->status !== $subscription->status) {
            // Don't overwrite our 'canceled' status back to 'active' when cancel_at_period_end is set
            $skipUpdate = $subs->status === 'canceled' && $subscription->cancel_at_period_end;

            if (! $skipUpdate) {
                $subs->status = $subscription->status;

                if (in_array($subscription->status, ['active', 'trialing']) && ! $subscription->cancel_at_period_end) {
                    $subs->upcoming_payment = $stripeEnd;
                } else {
                    $subs->upcoming_payment = null;
                }

                $subs->save();
                Log::info('MonthlyCharge: Status Updated', ['sub_id' => $subscriptionId, 'status' => $subs->status]);
            }
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

                if (! empty($updates)) {
                    // Update all records for this subscription to keep consistency
                    MonthlyCharge::where('stripe_id', $subscriptionId)
                        ->update($updates);
                    Log::info('MonthlyCharge: Customer details updated', ['sub_id' => $subscriptionId]);
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
                        Log::error("Failed to capture PaymentIntent {$paymentIntentId}: ".$e->getMessage());
                    }
                }
            }
        }
    }

    /**
     * Handle the 'requires_input' event
     */
    private function handleRequiresInputEvent($session)
    {
        $user = User::where('stripe_user_id', $session->id)->first();

        // Fallback: look up by metadata.user_id if stripe_user_id is stale (e.g. creator retried)
        if (! $user && ! empty($session->metadata->user_id)) {
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
                'reason' => 'Additional information is required to complete verification.',
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
     */
    private function handleVerifiedEvent($session)
    {
        $user = User::where('stripe_user_id', $session->id)->first();

        // Fallback: look up by metadata.user_id if stripe_user_id is stale (e.g. creator retried)
        if (! $user && ! empty($session->metadata->user_id)) {
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
            $docType = data_get($session, 'verified_outputs.document.type') ?: data_get($session, 'last_verification_report.document.type');

            if ($docType && strtolower($docType) !== 'passport') {
                $error = [
                    'code' => 'document_type_not_allowed',
                    'reason' => 'Only passports are accepted for identity verification.',
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

            if (! $isFraudulent) {
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
            Log::info('Processing checkout session completed', [
                'session_id' => $session->id,
                'metadata' => $metadata,
            ]);

            // Delayed-settlement bank methods (SEPA/ACH): the session completes
            // with payment_status 'unpaid' while the debit clears. Defer ALL
            // fulfilment to checkout.session.async_payment_succeeded — mark the
            // risk-ledger payment 'processing' and stop here.
            if (! config('payments.instant_fulfilment', true)
                && ($session->payment_status ?? 'paid') === 'unpaid') {
                Payment::where('stripe_session_id', $session->id)
                    ->whereIn('status', ['initiated', 'review_hold'])
                    ->update([
                        'status' => 'processing',
                        'stripe_payment_intent_id' => $session->payment_intent ?? null,
                    ]);

                Log::info('Delayed-settlement session: fulfilment deferred to async_payment_succeeded', [
                    'session_id' => $session->id,
                ]);

                return response()->json(['status' => 'processing_deferred']);
            }

            try {
                // Wait briefly for the checkout controller to finish writing the payment record
                // (Webhooks sometimes arrive milliseconds before the redirect finishes DB writes)
                $payment = Payment::where('stripe_session_id', $session->id)->first();

                if (! $payment) {
                    usleep(500000); // Wait 500ms and try again
                    $payment = Payment::where('stripe_session_id', $session->id)->first();
                }

                if (! $payment && $session->payment_intent) {
                    $payment = Payment::where('stripe_payment_intent_id', $session->payment_intent)->first();
                    if ($payment) {
                        $payment->update([
                            'stripe_session_id' => $session->id,
                        ]);
                    }
                }

                if ($payment) {
                    $oldStatus = $payment->status;
                    $newStatus = 'succeeded';
                    // Check if it was marked for review hold
                    if (
                        $payment->status === 'review_hold' ||
                        (is_array($payment->reason_codes) && in_array('MARK_REVIEW_HOLD', $payment->reason_codes)) ||
                        (is_string($payment->reason_codes) && str_contains($payment->reason_codes, 'MARK_REVIEW_HOLD'))
                    ) {
                        $newStatus = 'review_hold';
                        Log::info('Risk Ledger: Marking payment as review_hold', ['payment_id' => $payment->id]);
                    }

                    // Log payment state change before updating
                    ActivityLogger::logPaymentStateChange(
                        $payment,
                        ['status' => $oldStatus],
                        ['status' => $newStatus],
                        'Webhook: checkout.session.completed'
                    );

                    $payment->update([
                        'stripe_payment_intent_id' => $session->payment_intent ?? $payment->stripe_payment_intent_id,
                        'status' => $newStatus,
                    ]);

                    if ($session->payment_intent) {
                        $this->syncFinancialTransactionsByPaymentIntent($session->payment_intent, $newStatus);
                    }

                    Log::info('Risk Ledger: Checkout session mapped to payment', [
                        'session_id' => $session->id,
                        'payment_id' => $payment->id,
                        'status' => $newStatus,
                        'payment_intent' => $session->payment_intent ?? null,
                    ]);
                } else {
                    Log::warning("Risk Ledger: No payment found for session_id: {$session->id} after delay");
                }
            } catch (\Exception $e) {
                Log::error('Risk Ledger: Failed mapping checkout.session.completed: '.$e->getMessage(), [
                    'session_id' => $session->id,
                ]);
            }

            // Check if this is a wish item purchase
            if (isset($metadata->deliverable_type) && $metadata->deliverable_type === 'media_bundle') {
                $this->processWishItemDeliverable($session, $metadata);
            }

            // Check if this is a shop item purchase
            if (isset($metadata->type) && $metadata->type === 'shop') {
                $this->processShopItemPayment($session, $metadata);
            }

            // Check if this is a task purchase
            if (isset($metadata->type) && $metadata->type === 'task_purchase') {
                $this->processTaskPurchase($session, $metadata);
                $this->finalizeTaskPurchaseAfterConfirmation($session, $metadata, $session->payment_intent ?? null);
            }

            // Check if this is a piggy pot contribution
            // buildStripeMetadata('piggy_pot') tags type='piggy_pot_contribution';
            // accept both so bank async-settlement routes correctly.
            if (isset($metadata->type) && in_array($metadata->type, ['piggy_pot', 'piggy_pot_contribution'], true)) {
                $this->processPiggyPotPayment($session, $metadata);
            }

            // Check if this is a support / tip payment
            if (isset($metadata->type) && $metadata->type === 'support_payment') {
                $this->processSupportPayment($session, $metadata);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Error processing checkout session completed', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Process piggy pot payment creation via webhook
     */
    private function processPiggyPotPayment($session, $metadata)
    {
        Log::info('Processing piggy pot payment via webhook', ['session_id' => $session->id]);

        $pay = PiggyPotContribution::where('session_id', $session->id)->first();
        if (! $pay) {
            Log::warning('Piggy pot contribution not found for session', ['session_id' => $session->id]);

            return;
        }

        // Avoid duplicate processing. A check-then-act guard races concurrent
        // webhook deliveries (both read "not paid" before either saves), so claim
        // the row atomically: only the first delivery flips the flag and proceeds.
        if ($session->payment_status === 'paid') {
            $claimed = PiggyPotContribution::where('session_id', $session->id)
                ->where(function ($q) {
                    $q->where('status', '!=', 'paid')->orWhereNull('payment_intent_id');
                })
                ->update([
                    'status' => 'paid',
                    'payment_intent_id' => $session->payment_intent,
                ]);
            if ($claimed === 0) {
                Log::info('Piggy pot payment already processed, skipping duplicate', ['session_id' => $session->id]);

                return;
            }
        } elseif ($pay->status === 'paid' && $pay->payment_intent_id) {
            return;
        }

        $pay->status = $session->payment_status;
        if ($session->payment_status === 'paid') {
            $pay->payment_intent_id = $session->payment_intent;
            $pay->save();

            Payment::where('stripe_session_id', $session->id)->update([
                'stripe_payment_intent_id' => $session->payment_intent,
                'status' => 'succeeded',
            ]);

            // Sync to FinancialTransactions
            try {
                $isZeroDecimal = Helpers::isZeroDecimalCurrency($pay->currency);

                $gross = (float) $pay->total_paid;
                $platformFee = (float) $pay->tax;
                $stripeFee = 0;
                $vatAmt = (float) $pay->vat_amount;

                if ($session->payment_intent) {
                    try {
                        $intentObj = PaymentIntent::retrieve($session->payment_intent, ['stripe_account' => $pay->creator->account_id]);
                        if (isset($intentObj->application_fee_amount)) {
                            $platformFee = $isZeroDecimal ? (float) $intentObj->application_fee_amount : ($intentObj->application_fee_amount / 100);
                        }
                    } catch (\Exception $e) {
                    }
                }

                $reserveAmountMajor = 0;
                $reserveStatus = 'none';
                $creatorMetric = $pay->creator?->uuid
                    ? CreatorMetric::where('creator_id', $pay->creator->uuid)->first()
                    : null;
                $reservePercent = $pay->creator
                    ? (int) app(ReservePolicy::class)->getEffectiveReservePercent($pay->creator, $creatorMetric, $pay->created_at)
                    : 0;
                if ($reservePercent > 0) {
                    $precision = $isZeroDecimal ? 0 : 2;
                    $reserveAmountMajor = round(((float) $pay->amount * $reservePercent) / 100, $precision, PHP_ROUND_HALF_UP);
                    $reserveStatus = 'held';
                }

                FinancialTransaction::updateOrCreate(
                    ['source_type' => PiggyPotContribution::class, 'source_id' => $pay->id],
                    [
                        'user_id' => $pay->creator_id,
                        'supporter_id' => $pay->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'fee_profile' => $pay->fee_profile ?? 'card',
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vatAmt,
                        'net_amount' => (float) $pay->amount,
                        'reserve_amount' => $reserveAmountMajor,
                        'reserve_status' => $reserveStatus,
                        'currency' => strtoupper($pay->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Content purchase: '.($pay->piggyPot?->title ?? 'Content'),
                        'transaction_date' => $pay->created_at,
                    ]
                );
            } catch (\Throwable $e) {
                Log::error('Failed to sync PiggyPotContribution to FinancialTransaction via Webhook: '.$e->getMessage());
            }

            // Stripe compliance: store a content deliverable + fulfilment status.
            try {
                $pot = $pay->piggyPot ?? PiggyPot::find($pay->piggy_pot_id);
                $contentUrl = null;
                if (! empty($pot?->content_file)) {
                    $contentUrl = $pot->content_file;
                    if (! str_starts_with($contentUrl, 'http')) {
                        $contentUrl = 'https://ucarecdn.com/'.trim($contentUrl, '/').'/';
                    }
                }

                Deliverable::firstOrCreate(
                    ['product_type' => 'piggy_pot', 'item_id' => $pay->id],
                    [
                        'uuid' => (string) Str::uuid(),
                        'product_id' => 'piggy_pot_'.($pot?->id ?? 'unknown'),
                        'creator_id' => $pay->creator_id,
                        'gifter_id' => $pay->user_id,
                        'payment_intent_id' => $session->payment_intent,
                        'session_id' => $session->id,
                        'deliverable_type' => ! empty($pot?->content_file) ? 'digital_file' : 'content_file',
                        'transaction_amount' => $pay->amount,
                        'deliverable_url' => $contentUrl,
                        'customer_email' => $pay->user?->email ?? $pay->guest_email,
                        'customer_name' => $pay->is_anonymous ? 'Anonymous' : ($pay->user?->name ?? $pay->guest_name),
                        'payment_status' => $pay->status,
                        'payment_currency' => $pay->currency,
                        'anonymous' => (bool) $pay->is_anonymous,
                        'message' => $pay->message,
                        'status' => ! empty($contentUrl) ? 'delivered' : 'pending',
                        'delivered_at' => ! empty($contentUrl) ? now() : null,
                        'metadata' => [
                            'product_type' => 'piggy_pot',
                            'content_id' => $pot?->id,
                            'content_title' => $pot?->title,
                            'goal_target' => $pot?->target_amount,
                            'amount' => $pay->amount,
                            'currency' => $pay->currency,
                        ],
                    ]
                );
            } catch (\Throwable $e) {
                Log::error('Failed to create PiggyPot deliverable via Webhook: '.$e->getMessage());
            }

            // Clear the cache for the creator's piggy pots
            Cache::forget('user_piggy_pots_'.$pay->creator_id.'_owner_pinned');
            Cache::forget('user_piggy_pots_'.$pay->creator_id.'_owner_all');
            Cache::forget('user_piggy_pots_'.$pay->creator_id.'_public_pinned');
            Cache::forget('user_piggy_pots_'.$pay->creator_id.'_public_all');
            Cache::forget('user_piggy_pot_top_'.$pay->creator_id);
            Cache::forget('user_piggy_pot_top_supporters_'.$pay->creator_id);
            Cache::forget('user_piggy_pot_feed_'.$pay->creator_id);

            if ($pay->creator) {
                $this->userProfileService->clearUserCaches($pay->creator->username, $pay->creator->id);
            }

            Helpers::addGmv($pay->creator_id, (float) $pay->amount, $pay->currency);

            $pay->loadMissing(['piggyPot', 'creator', 'user']);

            $symbol = Helpers::getCurrency($pay->currency ?? 'GBP');
            $supporterName = $pay->is_anonymous ? 'Anonymous' : ($pay->user?->name ?: ($pay->guest_name ?: 'A supporter'));
            $sendCreator = empty($pay->creator_notified_at);
            $sendSupporter = empty($pay->supporter_notified_at);

            if ($sendCreator && $pay->creator?->email) {
                $title = '🐷 New content purchase!';
                $content = "{$supporterName} purchased {$pay->piggyPot?->title} for {$symbol}".number_format((float) $pay->amount, 2).'.';
                Helpers::sendNotification($title, $content, $pay->creator->email);
                $pay->creator_notified_at = now();
            }

            $supporterEmail = $pay->user?->email ?: $pay->guest_email;
            if ($sendSupporter && $supporterEmail) {
                $title = '✅ Payment Successful!';
                $content = "Your purchase of {$symbol}".number_format((float) $pay->total_paid, 2)." from {$pay->creator?->name} is complete.";
                if (! empty($pay->piggyPot?->content_file)) {
                    $content .= ' Exclusive content unlocked.';
                }
                Helpers::sendNotification($title, $content, $supporterEmail);
                $pay->supporter_notified_at = now();
            }

            if ($sendCreator || $sendSupporter) {
                PiggyPotContributionMailToUser::dispatch($pay->id, $sendCreator, $sendSupporter);
            }

            $pay->save();
        } else {
            $pay->save();
        }
    }

    /**
     * Process support / tip payment via webhook
     */
    private function processSupportPayment($session, $metadata)
    {
        Log::info('Processing support payment via webhook', ['session_id' => $session->id]);

        $tip = TipGoalsPayment::with(['creator', 'user', 'tipGoal'])->where('session_id', $session->id)->first();
        if (! $tip) {
            Log::warning('TipGoalsPayment not found for session', ['session_id' => $session->id]);

            return;
        }

        if ($session->payment_status !== 'paid') {
            $tip->status = $session->payment_status;
            $tip->save();

            return;
        }

        $existingDeliverable = Deliverable::where('session_id', $session->id)
            ->where('product_type', 'support_payment')
            ->first();
        if ($existingDeliverable) {
            $tip->status = 'paid';
            $tip->save();

            return;
        }

        $tip->status = 'paid';
        $tip->save();

        try {
            Payment::where('stripe_session_id', $session->id)->update([
                'stripe_payment_intent_id' => $session->payment_intent,
                'status' => 'succeeded',
            ]);
        } catch (\Throwable $e) {
        }

        try {
            TipPaymentMailToUser::dispatch($tip, $tip->currency ?? 'USD');
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch TipPaymentMailToUser from webhook: '.$e->getMessage(), ['tip_pay_id' => $tip->id]);
        }

        try {
            CreateThankYouPostJob::dispatch($tip);
        } catch (\Throwable $e) {
        }
    }

    /**
     * Process wish item deliverable creation
     */
    private function processWishItemDeliverable($session, $metadata)
    {
        if (Deliverable::where('session_id', $session->id)->exists()) {
            Log::info('Deliverable already exists for session', ['session_id' => $session->id]);

            return;
        }

        // Get wish item to check for content file
        $wishItem = null;
        $deliverableType = $metadata->deliverable_type ?? 'media_bundle';
        $contentUrl = null;

        if (isset($metadata->wish_id)) {
            $wishItem = WishItem::find($metadata->wish_id);
            if ($wishItem && $wishItem->content_file) {
                $deliverableType = 'content_file';
                $contentUrl = $wishItem->content_file_url; // Use Uploadcare URL
            }
        }

        // Get payment details to retrieve message and anonymous data
        $payment = StripePaymentDetail::where('session_id', $session->id)->first();

        // Create deliverable record with proper fields
        $deliverable = Deliverable::create([
            'uuid' => Uuid::uuid4()->toString(),
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
                    'payment_status' => $session->payment_status,
                ],
            ]),
        ]);

        Log::info('Created deliverable record', [
            'deliverable_id' => $deliverable->id,
            'uuid' => $deliverable->uuid,
            'session_id' => $session->id,
            'deliverable_type' => $deliverableType,
            'has_content_file' => $wishItem && $wishItem->content_file ? true : false,
        ]);

        // Dispatch job to process the deliverable (media bundle creation, etc.)
        ProcessWishItemDeliverable::dispatch($deliverable);

        // Update Stripe payment intent metadata (exactly like membership)
        if ($session->payment_intent) {
            try {
                $stripeMetadataService = app(StripeMetadataService::class);
                $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                    'wish_processed_at' => now()->toISOString(),
                    'immediate_delivery' => 'true',
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata for wish', [
                    'deliverable_id' => $deliverable->id,
                    'payment_intent_id' => $session->payment_intent,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Clear user cache for the creator
        if ($metadata->creator_id) {
            $creator = User::find($metadata->creator_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                // Also clear discovery cache to update trending/top earners
                app(DiscoveryService::class)->clearDiscoveryCache();
            }
        }

        // Send thank you email to the purchaser
        if (isset($metadata->user_id)) {
            $payment = StripePaymentDetail::where('session_id', $session->id)->first();
            if ($payment) {
                // Check if user exists
                $user = User::where('id', $metadata->user_id)->first();

                if ($user) {
                    $currency = Currency::where('iso', strtoupper($session->currency))->first();
                    $currencySymbol = $currency ? $currency->symbol : '£';

                    Log::info('Skipping CheckoutMailToUser dispatch in webhook - already handled by checkout controller', [
                        'payment_id' => $payment->id,
                        'user_id' => $metadata->user_id,
                        'currency' => $currencySymbol,
                    ]);

                    // \App\Jobs\CheckoutMailToUser::dispatch($payment, $currencySymbol);
                    // NOTE: Disabled to prevent duplicate emails - checkout controller handles this
                } else {
                    Log::info('User not eligible for email (user not found)', [
                        'user_id' => $metadata->user_id,
                    ]);
                }
            } else {
                Log::warning('Payment record not found for session', ['session_id' => $session->id]);
            }
        }
    }

    private function createTaskPurchaseRecord($session, $metadata, $paymentIntentId = null, $initialStatus = 'pending')
    {
        $taskId = $metadata->task_id ?? null;
        $buyerId = $metadata->buyer_id ?? null;
        $creatorId = $metadata->creator_id ?? null;

        if (! $taskId || ! $buyerId) {
            Log::error('Missing task_id or buyer_id in metadata for task purchase');

            return null;
        }

        $existingPurchase = null;
        if (! empty($paymentIntentId)) {
            $existingPurchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        }

        if (! $existingPurchase && ! empty($session?->id)) {
            $existingPurchase = TaskPurchase::where('stripe_session_id', $session->id)->first();
        }

        if ($existingPurchase) {
            Log::info('Task purchase already exists for session or payment intent', [
                'purchase_id' => $existingPurchase->id,
                'session_id' => $session?->id,
                'payment_intent_id' => $paymentIntentId,
            ]);

            return $existingPurchase;
        }

        $task = Task::find($taskId);
        if (! $task) {
            Log::error('Task not found for purchase', ['task_id' => $taskId]);

            return null;
        }

        $currency = strtoupper($session->currency ?? ($metadata->currency ?? ($task->currency ?? 'GBP')));
        $currencyModel = Currency::where('ISO', $currency)->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $itemAmountMinor = $metadata->item_amount ?? null;
        $amount = $itemAmountMinor !== null ? ((float) $itemAmountMinor / $multiplier) : ((float) ($session->amount_total ?? 0) / $multiplier);

        $vat = isset($metadata->vat_amount) ? ((float) $metadata->vat_amount / $multiplier) : 0;
        $vatPercent = (float) ($metadata->vat_percent ?? 0);
        if ((! $vat || $vat <= 0) && $vatPercent > 0) {
            $vat = round(((float) $amount * $vatPercent) / 100, 2, PHP_ROUND_HALF_UP);
        }
        $adminFee = isset($metadata->admin_fee) ? ((float) $metadata->admin_fee / $multiplier) : 0;
        $platformFee = isset($metadata->platform_fee) ? ((float) $metadata->platform_fee / $multiplier) : 0;
        $transferAmount = isset($metadata->transfer_amount) ? ((float) $metadata->transfer_amount / $multiplier) : 0;

        $chargeId = null;
        if (! empty($session?->payment_intent)) {
            try {
                $client = AppStripeControl::getClient();
                $piId = is_string($session->payment_intent) ? $session->payment_intent : $session->payment_intent->id;
                $pi = $client->paymentIntents->retrieve($piId, ['expand' => ['latest_charge']]);
                $chargeId = $pi->latest_charge->id ?? ($pi->latest_charge ?? null);
            } catch (\Exception $e) {
                Log::warning('Failed to retrieve charge_id for task purchase (webhook)', ['pi' => $session->payment_intent]);
            }
        }

        $purchase = TaskPurchase::create([
            'task_id' => $taskId,
            'supporter_id' => $buyerId,
            'creator_id' => $creatorId ?? $task->creator_id,
            'stripe_session_id' => $session?->id,
            'payment_intent_id' => $paymentIntentId,
            'charge_id' => $chargeId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => $initialStatus,
            'payment_type' => $metadata->payment_type ?? 'STANDARD',
            'fee_profile' => $metadata->fee_profile ?? 'card',
            'gifter_message' => $metadata->gifter_message ?? null,
            'admin_fee' => $adminFee,
            'platform_fee' => $platformFee,
            'vat_amount' => $vat,
            'transfer_amount' => $transferAmount,
            'dispute_status' => 'none',
        ]);

        $slaHours = (int) ($metadata->sla_hours ?? 0);
        if ($slaHours > 0) {
            $purchase->sla_deadline = Carbon::now()->addHours($slaHours);
            $purchase->save();
        }

        Deliverable::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => (string) $taskId,
            'item_id' => $taskId,
            'order_id' => $purchase->id,
            'creator_id' => $creatorId ?? $task->creator_id,
            'gifter_id' => $buyerId,
            'payment_intent_id' => $paymentIntentId ?? ($session->payment_intent ?? null),
            'session_id' => $session?->id,
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

        return $purchase;
    }

    /**
     * Process task purchase creation
     */
    private function processTaskPurchase($session, $metadata)
    {
        Log::info('Processing task purchase', ['session_id' => $session->id]);

        $purchase = $this->createTaskPurchaseRecord($session, $metadata, is_string($session->payment_intent) ? $session->payment_intent : ($session->payment_intent->id ?? null));
        if (! $purchase) {
            return;
        }

        Log::info('Task purchase created; waiting for Stripe confirmation before dispatching deliverable work', [
            'purchase_id' => $purchase->id,
            'session_id' => $session->id,
            'task_id' => $metadata->task_id ?? null,
        ]);
    }

    private function finalizeTaskPurchaseAfterConfirmation($session, $metadata, $paymentIntentId)
    {
        if (empty($paymentIntentId) && empty($session?->id)) {
            return;
        }

        $purchase = null;
        if (! empty($paymentIntentId)) {
            $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        }

        if (! $purchase && ! empty($session?->id)) {
            $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();
        }

        if (! $purchase) {
            if ($metadata && isset($metadata->task_id) && isset($metadata->buyer_id)) {
                $purchase = $this->createTaskPurchaseRecord($session, $metadata, $paymentIntentId);
                if ($purchase) {
                    Log::info('StripeWebhookController: Recovered task purchase during confirmation finalization', [
                        'purchase_id' => $purchase->id,
                        'payment_intent_id' => $paymentIntentId,
                        'session_id' => $session?->id,
                    ]);
                }
            }

            if (! $purchase) {
                Log::warning('StripeWebhookController: No task purchase found for finalization', [
                    'payment_intent_id' => $paymentIntentId,
                    'session_id' => $session?->id,
                ]);

                return;
            }
        }

        $deliverable = Deliverable::where('order_id', $purchase->id)->first();
        if (! $deliverable) {
            Log::warning('StripeWebhookController: No deliverable found for task purchase finalization', [
                'purchase_id' => $purchase->id,
            ]);

            return;
        }

        $task = Task::find($purchase->task_id);
        if (! $task) {
            Log::warning('StripeWebhookController: Task not found for purchase finalization', [
                'purchase_id' => $purchase->id,
                'task_id' => $purchase->task_id,
            ]);

            return;
        }

        $alreadyFinalized = false;
        if ($task->type === 'instant') {
            $alreadyFinalized = ! empty($purchase->completed_at) || $deliverable->status === 'delivered';
        } else {
            $alreadyFinalized = in_array($purchase->status, ['paid', 'completed', 'completed_accepted', 'paid_out', 'refunded'], true);
        }

        if ($alreadyFinalized) {
            Log::info('StripeWebhookController: Task purchase already finalized; skipping duplicate work', [
                'purchase_id' => $purchase->id,
                'task_type' => $task->type,
            ]);

            return;
        }

        try {
            $purchase->status = $task->type === 'instant' ? 'completed' : 'paid';
            $purchase->completed_at = $task->type === 'instant' ? now() : $purchase->completed_at;
            $purchase->save();

            if ($task->type === 'instant') {
                $deliverable->status = 'delivered';
                $deliverable->delivered_at = now();
                $deliverable->save();
            }

            ProcessWishItemDeliverable::dispatch($deliverable);

            try {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                    'payment_confirmed_at' => now()->toISOString(),
                    'task_type' => $task->type,
                    'confirmation_source' => 'webhook',
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata after confirmation', [
                    'purchase_id' => $purchase->id,
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $creator = User::find($purchase->creator_id);
            $supporter = $purchase->supporter_id ? User::find($purchase->supporter_id) : null;

            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                if ($creator->notification_send == 1) {
                    Mail::to($creator->email)->send(new TaskPurchasedMail($purchase, $task, $supporter));
                }

                Helpers::sendNotification(
                    'New Task Order! 💰',
                    ($supporter ? $supporter->name : 'A Guest').' purchased your task: '.$task->title,
                    $creator->email
                );
            }

            if ($supporter && $supporter->notification_send == 1) {
                Mail::to($supporter->email)->send(new TaskPurchasedSupporterMail($purchase, $task, $supporter));
            }

            Log::info('StripeWebhookController: Task purchase finalized after Stripe confirmation', [
                'purchase_id' => $purchase->id,
                'deliverable_id' => $deliverable->id,
                'task_type' => $task->type,
                'payment_intent_id' => $paymentIntentId,
            ]);
        } catch (\Throwable $e) {
            Log::error('StripeWebhookController: Failed to finalize task purchase after confirmation', [
                'purchase_id' => $purchase->id,
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle Charge Dispute Created
     */
    private function handleChargeDisputeCreated($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;
        $creatorId = null;

        Log::info('handleChargeDisputeCreated: Processing dispute', [
            'dispute_id' => $dispute->id,
            'payment_intent_id' => $paymentIntentId,
            'amount' => $dispute->amount,
            'reason' => $dispute->reason,
        ]);

        try {
            $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->with('creator')->first();

            if ($payment) {
                $creatorId = $payment->creator_id;
            }

            if (! $payment && $paymentIntentId) {
                Log::warning("handleChargeDisputeCreated: Payment not found for PaymentIntent ID: $paymentIntentId. Attempting auto-creation.");

                $amount = $dispute->amount;

                $deliverable = Deliverable::where('payment_intent_id', $paymentIntentId)->first();
                if ($deliverable) {
                    $creatorId = $deliverable->creator_id;
                    $amount = (int) ($deliverable->transaction_amount * 100);
                }

                if (! $creatorId) {
                    $taskPurchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
                    if ($taskPurchase) {
                        $creatorId = $taskPurchase->creator_id;
                        $amount = (int) ($taskPurchase->amount * 100);
                    }
                }

                if (! $creatorId) {
                    $piggyPot = PiggyPotContribution::where('payment_intent_id', $paymentIntentId)->first();
                    if ($piggyPot) {
                        $creatorId = $piggyPot->creator_id;
                        $amount = (int) ($piggyPot->amount * 100);
                    }
                }

                if ($creatorId && is_numeric($creatorId)) {
                    $cUser = User::find($creatorId);
                    if ($cUser) {
                        $creatorId = $cUser->uuid;
                    }
                }

                if ($creatorId) {
                    try {
                        $payment = Payment::create([
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'creator_id' => $creatorId,
                            'amount' => $amount,
                            'reserve_amount_minor' => 0,
                            'platform_holds_funds' => true,
                            'currency' => $dispute->currency,
                            'status' => 'disputed',
                        ]);
                        $payment->load('creator');
                        Log::info('handleChargeDisputeCreated: Auto-created Payment record', ['payment_id' => $payment->id]);
                    } catch (\Exception $e) {
                        Log::error('handleChargeDisputeCreated: Failed to auto-create payment: '.$e->getMessage());
                    }
                }
            } else {
                if ($payment) {
                    Log::info('handleChargeDisputeCreated: Payment found', ['payment_id' => $payment->id, 'creator_id' => $payment->creator_id]);
                }
            }

            $dbDispute = Dispute::firstOrCreate(
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

            if (! $dbDispute->wasRecentlyCreated) {
                Log::info('Risk Engine: Dispute already exists', ['dispute_id' => $dispute->id]);
            } else {
                Log::info('Risk Engine: Dispute model created', [
                    'db_dispute_id' => $dbDispute->id ?? null,
                    'creator_id' => $dbDispute->creator_id ?? $creatorId,
                    'payment_id' => $dbDispute->payment_id ?? ($payment->id ?? null),
                ]);

                if ($payment && $payment->riskIdentity) {
                    app(IdentityRollupService::class)->refreshRollups($payment->riskIdentity);
                }

                if ($creatorId) {
                    try {
                        $this->riskService->recalculateMetrics($creatorId);
                    } catch (\Exception $e) {
                        Log::error('Risk Engine: Failed to recalculate metrics on dispute: '.$e->getMessage());
                    }
                }

                $adminEmail = config('services.dispute_notifications.admin_email');
                if ($adminEmail) {
                    $currencySymbol = Helpers::getCurrency($dispute->currency);
                    $formattedAmount = number_format($dispute->amount / 100, 2);
                    $title = "⚠️ DISPUTE CREATED: {$dispute->id}";
                    $content = "Payment Intent: {$paymentIntentId}\nAmount: ".($dispute->amount / 100)." {$dispute->currency}\nReason: {$dispute->reason}\nCreator: ".($payment && $payment->creator ? $payment->creator->email : 'Unknown')."\nEvidence Due By: ".($dbDispute->evidence_due_by ? $dbDispute->evidence_due_by->format('Y-m-d H:i:s') : 'Unknown');

                    try {
                        Helpers::sendNotification($title, $content, $adminEmail);
                        Log::info('StripeWebhookController: Admin notification sent for dispute created', [
                            'dispute_id' => $dispute->id,
                            'admin_email' => $adminEmail,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to send admin notification for dispute created', [
                            'dispute_id' => $dispute->id,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    try {
                        $adminUser = new User(['email' => $adminEmail]);
                        SendDisputeCreatedMailJob::dispatch($adminUser, $dbDispute);
                        Log::info('StripeWebhookController: Admin dispute created email dispatched', [
                            'dispute_id' => $dispute->id,
                            'admin_email' => $adminEmail,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to dispatch dispute created mail job', [
                            'dispute_id' => $dispute->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info('Risk Engine: Dispute recorded', ['dispute_id' => $dispute->id]);
            }

            if ($paymentIntentId) {
                $this->syncRiskLedgerStatus($paymentIntentId, 'disputed');
            }
        } catch (\Exception $e) {
            Log::error('Risk Engine: Failed to record dispute: '.$e->getMessage());
        }

        if (! $paymentIntentId) {
            return;
        }

        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $purchase->dispute_status = 'open';
            $purchase->save();
            Log::info('Dispute opened for TaskPurchase', ['id' => $purchase->id]);
        }

        $piggyPot = PiggyPotContribution::where('payment_intent_id', $paymentIntentId)->first();
        if ($piggyPot) {
            $piggyPot->status = 'disputed';
            $piggyPot->save();
            Log::info('Dispute opened for PiggyPotContribution', ['id' => $piggyPot->id]);
        }
    }

    private function handleChargeDisputeUpdated($dispute)
    {
        Log::info('StripeWebhookController: Processing charge.dispute.updated', [
            'dispute_id' => $dispute->id,
            'status' => $dispute->status,
            'reason' => $dispute->reason,
        ]);

        try {
            $riskDispute = Dispute::where('stripe_dispute_id', $dispute->id)->first();

            if (! $riskDispute) {
                Log::info('StripeWebhookController: Dispute not found for update, processing as created', [
                    'dispute_id' => $dispute->id,
                ]);
                $this->handleChargeDisputeCreated($dispute);

                return;
            }

            $changes = [];
            $oldStatus = $riskDispute->status;
            $newStatus = $dispute->status ?? $oldStatus;

            if ($oldStatus !== $newStatus) {
                $changes['status'] = [
                    'old' => $oldStatus,
                    'new' => $newStatus,
                ];
            }

            $oldReason = $riskDispute->reason;
            $newReason = $dispute->reason;
            if ($oldReason !== $newReason) {
                $changes['reason'] = [
                    'old' => $oldReason,
                    'new' => $newReason,
                ];
            }

            $oldAmount = $riskDispute->amount;
            $newAmount = $dispute->amount;
            if ($oldAmount !== $newAmount) {
                $changes['amount'] = [
                    'old' => $oldAmount,
                    'new' => $newAmount,
                ];
            }

            $oldDueBy = $riskDispute->evidence_due_by;
            $newDueBy = isset($dispute->evidence_details->due_by)
                ? Carbon::createFromTimestamp($dispute->evidence_details->due_by)
                : $oldDueBy;
            if ((string) $oldDueBy !== (string) $newDueBy) {
                $changes['evidence_due_by'] = [
                    'old' => $oldDueBy,
                    'new' => $newDueBy,
                ];
            }

            if (empty($changes)) {
                Log::info('StripeWebhookController: No changes detected for dispute update', [
                    'dispute_id' => $dispute->id,
                    'db_dispute_id' => $riskDispute->id,
                ]);

                return;
            }

            Log::info('StripeWebhookController: Changes detected for dispute update', [
                'dispute_id' => $dispute->id,
                'changes' => $changes,
            ]);

            $riskDispute->update([
                'amount' => $dispute->amount,
                'currency' => $dispute->currency,
                'reason' => $dispute->reason ?? $riskDispute->reason,
                'status' => $dispute->status ?? $riskDispute->status,
                'evidence_due_by' => isset($dispute->evidence_details->due_by)
                    ? Carbon::createFromTimestamp($dispute->evidence_details->due_by)
                    : $riskDispute->evidence_due_by,
                'updated_at' => now(),
            ]);

            Log::info('StripeWebhookController: Dispute updated', [
                'db_dispute_id' => $riskDispute->id,
                'dispute_id' => $dispute->id,
                'new_status' => $newStatus,
            ]);

            if (isset($changes['status'])) {
                try {
                    $adminEmail = config('services.dispute_notifications.admin_email');
                    if ($adminEmail) {
                        $title = "⚠️ DISPUTE STATUS UPDATED: {$dispute->id}";
                        $content = "Status changed from {$changes['status']['old']} to {$changes['status']['new']}\nReason: {$dispute->reason}\nAmount: ".($dispute->amount / 100)." {$dispute->currency}";

                        Helpers::sendNotification($title, $content, $adminEmail);
                        Log::info('StripeWebhookController: Admin notification sent for dispute status change', [
                            'dispute_id' => $dispute->id,
                            'old_status' => $changes['status']['old'],
                            'new_status' => $changes['status']['new'],
                        ]);

                        $adminUser = new User(['email' => $adminEmail]);
                        SendDisputeUpdatedMailJob::dispatch($adminUser, $riskDispute, $changes);
                        Log::info('StripeWebhookController: Admin dispute updated email dispatched', [
                            'dispute_id' => $dispute->id,
                            'admin_email' => $adminEmail,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to send admin notification for dispute status change', [
                        'dispute_id' => $dispute->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if (! empty($dispute->payment_intent)) {
                $payment = Payment::where('stripe_payment_intent_id', $dispute->payment_intent)->first();
                if ($payment && $payment->status !== 'disputed' && ! in_array($payment->status, ['refunded', 'failed', 'blocked'], true)) {
                    $payment->update(['status' => 'disputed']);
                }
            }

            if (! empty($dispute->payment_intent)) {
                $this->syncRiskLedgerStatus($dispute->payment_intent, 'disputed');
            }

            try {
                AuditLog::create([
                    'actor' => 'system',
                    'action_type' => 'DISPUTE_UPDATED',
                    'reference_id' => (string) $riskDispute->id,
                    'metadata_json' => [
                        'stripe_dispute_id' => $dispute->id,
                        'db_dispute_id' => $riskDispute->id,
                        'changes' => $changes,
                        'new_status' => $dispute->status,
                        'new_reason' => $dispute->reason,
                    ],
                ]);
            } catch (\Exception $e) {
                Log::warning('StripeWebhookController: Failed to create audit log for dispute update', [
                    'dispute_id' => $dispute->id,
                    'error' => $e->getMessage(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Risk Engine: Failed to update dispute: '.$e->getMessage(), ['stripe_dispute_id' => $dispute->id ?? null]);
        }
    }

    /**
     * Handle Charge Dispute Closed
     */
    private function handleChargeDisputeClosed($dispute)
    {
        $paymentIntentId = $dispute->payment_intent ?? null;

        try {
            $riskDispute = Dispute::where('stripe_dispute_id', $dispute->id)->with('creator')->first();
            if ($riskDispute && $riskDispute->status !== $dispute->status) {
                $riskDispute->update([
                    'status' => $dispute->status,
                    'resolved_at' => now(),
                ]);
                Log::info('Risk Engine: Dispute status updated', ['status' => $dispute->status]);

                try {
                    $adminEmail = config('services.dispute_notifications.admin_email');
                    if ($adminEmail) {
                        $currencySymbol = Helpers::getCurrency($dispute->currency);
                        $formattedAmount = number_format($dispute->amount / 100, 2);
                        $isWon = $dispute->status === 'won';
                        $title = ($isWon ? '✅' : '❌')." DISPUTE CLOSED: {$dispute->id}";
                        $content = "Final Status: {$dispute->status}\nReason: {$dispute->reason}\nAmount: ".($dispute->amount / 100)." {$dispute->currency}\nCreator: ".($riskDispute->creator ? $riskDispute->creator->email : 'Unknown');

                        Helpers::sendNotification($title, $content, $adminEmail);
                        Log::info('StripeWebhookController: Admin notification sent for dispute closed', [
                            'dispute_id' => $dispute->id,
                            'status' => $dispute->status,
                        ]);

                        $adminUser = new User(['email' => $adminEmail]);
                        SendDisputeClosedMailJob::dispatch($adminUser, $riskDispute, $isWon);
                        Log::info('StripeWebhookController: Admin dispute closed email dispatched', [
                            'dispute_id' => $dispute->id,
                            'admin_email' => $adminEmail,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to send admin notification for dispute closed', [
                        'dispute_id' => $dispute->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Risk Engine: Failed to update dispute status: '.$e->getMessage());
        }

        if ($paymentIntentId) {
            if ($dispute->status === 'won') {
                $this->syncRiskLedgerStatus($paymentIntentId, 'succeeded');
            } elseif ($dispute->status === 'lost') {
                $this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
            }
        }

        if (! $paymentIntentId) {
            return;
        }

        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $status = $dispute->status;

            if ($status === 'won') {
                $purchase->dispute_status = 'won';
            } elseif ($status === 'lost') {
                $purchase->dispute_status = 'lost';
                $purchase->status = 'refunded';
                $purchase->refunded_at = now();

                try {
                    $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                    if ($deliverable) {
                        $deliverable->status = 'refunded';
                        $deliverable->save();

                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'status' => 'refunded',
                            'dispute_result' => 'lost',
                            'refund_reason' => 'dispute_lost',
                        ]);

                        Log::info('Updated deliverable status to refunded for lost dispute', ['deliverable_id' => $deliverable->id]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to update deliverable status on dispute lost: '.$e->getMessage());
                }
            } else {
                if (str_contains($status, 'warning')) {
                    $purchase->dispute_status = 'none';
                }
            }

            $purchase->save();
            Log::info('Dispute closed for TaskPurchase', ['id' => $purchase->id, 'status' => $status]);
        }
    }

    public function handleBillSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        $status = $data->status;

        $user = User::find($metadata->creator_id ?? 0);

        $subs = BillPayment::where('stripe_id', $subscriptionId)->where('user_id', $metadata->user_id)->latest()->first();

        if (! $subs) {
            Log::warning("No active bill subscription found for stripe_id: {$subscriptionId}");

            return response()->json([
                'status' => 'error',
                'message' => 'No active bill subscription found.',
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

        $subs->status = 'ended';
        $subs->save();

        $newSubs = new BillPayment;
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
        $newSubs->status = 'paid';
        $newSubs->created_at = $subs->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        // Clear user cache
        if ($metadata->creator_id) {
            $creator = User::find($metadata->creator_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                // Also clear discovery cache
                app(DiscoveryService::class)->clearDiscoveryCache();
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
                    'immediate_delivery' => 'true',
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata for bill renewal', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        SendRenewMail::dispatch($array, 'renew', 'bill');

        // Dispatch content delivery email if bill has content file
        if (! empty($newSubs->bill->content_file)) {
            // Get currency symbol for email
            $currency = Currency::where('iso', strtoupper($newSubs->currency))->first();
            $currencySymbol = $currency ? $currency->symbol : '£';

            BillContentDeliveryMail::dispatch($newSubs, $currencySymbol);
            Log::info('StripeWebhookController: Content delivery email dispatched for bill renewal', [
                'bill_payment_id' => $newSubs->id,
                'bill_id' => $newSubs->bills_id,
                'has_content_file' => ! empty($newSubs->bill->content_file),
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

        if (! $subs) {
            Log::warning("No active membership subscription found for stripe_id: {$subscriptionId}");

            return response()->json([
                'status' => 'error',
                'message' => 'No active membership subscription found.',
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

        $subs->status = 'ended';
        $subs->save();

        $newSubs = new MembershipPayment;
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
        $newSubs->status = 'paid';
        $newSubs->created_at = $subs->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        // Clear user cache
        if ($metadata->creator_id) {
            $creator = User::find($metadata->creator_id);
            if ($creator) {
                $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                // Also clear discovery cache
                app(DiscoveryService::class)->clearDiscoveryCache();
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
                    'immediate_delivery' => 'true',
                ]);
            } catch (\Exception $e) {
                Log::error('StripeWebhookController: Failed to update Stripe metadata for membership renewal', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage(),
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

        if (! $subscriptionId) {
            Log::info('Invoice payment succeeded but no subscription ID found', ['invoice_id' => $data->id]);

            return;
        }

        Log::info('Processing invoice.payment_succeeded for subscription renewal', [
            'invoice_id' => $data->id,
            'subscription_id' => $subscriptionId,
            'billing_reason' => $data->billing_reason ?? null,
            'amount' => $data->amount_paid ?? 0,
            'metadata' => $metadata,
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
     * Stripe fires both invoice.paid and invoice.payment_succeeded for the same
     * invoice. Both wish-subscription handlers create a content deliverable, so
     * without this guard one billing cycle produces two deliverables (double
     * delivery + double certificate). Dedup on the invoice id (webhook-only, so
     * it never collides with the checkout-time deliverable).
     */
    private function wishSubscriptionDeliverableExistsForInvoice($wishSubscription, $invoiceId): bool
    {
        if (empty($invoiceId)) {
            return false;
        }

        return Deliverable::whereIn('product_type', ['wish_subscription_content', 'wish_subscription_renewal'])
            ->where('item_id', $wishSubscription->wish_item->id)
            ->where('gifter_id', $wishSubscription->user_id)
            ->where('metadata', 'like', '%"invoice_id":"'.$invoiceId.'"%')
            ->exists();
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
                'amount' => $invoiceData->amount_paid ?? 0,
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
                $creator = User::find($wishSubscription->wish_item->user_id);
                if ($creator) {
                    $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                }
            }

            Log::info('Wish subscription updated with new period', [
                'subscription_id' => $wishSubscription->id,
                'stripe_id' => $wishSubscription->stripe_id,
                'new_period_end' => $wishSubscription->current_period_end,
                'new_upcoming_payment' => $wishSubscription->upcoming_payment,
            ]);

            // If wish item has content to deliver for renewals, create deliverable
            // (skip if invoice.paid already created one for this same invoice).
            if (
                $wishSubscription->wish_item
                && (! empty($wishSubscription->wish_item->content_file) || ! empty($wishSubscription->wish_item->reward))
                && ! $this->wishSubscriptionDeliverableExistsForInvoice($wishSubscription, $invoiceData->id)
            ) {

                // Create deliverable record for renewal content delivery with certificate support
                $deliverable = Deliverable::create([
                    'uuid' => Str::uuid(),
                    'product_id' => (string) $wishSubscription->wish_item->id,
                    'item_id' => $wishSubscription->wish_item->id,
                    'creator_id' => $wishSubscription->wish_item->user_id,
                    'gifter_id' => $wishSubscription->user_id,
                    'session_id' => $wishSubscription->session_id,
                    'payment_intent_id' => $invoiceData->payment_intent ?? null,
                    'deliverable_type' => ! empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
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
                        'content_type' => ! empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                        'invoice_id' => $invoiceData->id,
                        'billing_reason' => $invoiceData->billing_reason ?? 'subscription_cycle',
                        'renewal_period_start' => $wishSubscription->current_period_start,
                        'renewal_period_end' => $wishSubscription->current_period_end,
                    ]),
                ]);

                // Dispatch job to process renewal content delivery
                ProcessWishItemDeliverable::dispatch($deliverable);

                // Update Stripe payment intent metadata (exactly like membership)
                if ($invoiceData->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'wish_renewal_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true',
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to update Stripe metadata for wish renewal', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $invoiceData->payment_intent,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info('Subscription renewal content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id,
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
                'trace' => $e->getTraceAsString(),
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
            $currency = Currency::where('iso', strtoupper($wishSubscription->currency ?? 'gbp'))->first();
            $currencySymbol = $currency ? $currency->symbol : '£';
            $formattedAmount = $currencySymbol.number_format($wishSubscription->amount, 2);
            $subscriptionPeriod = $wishSubscription->wish_item->subscription_period ?? 'monthly';
            $renewalAmount = $formattedAmount.'/'.$subscriptionPeriod;

            // Use the existing wish subscription email system for renewals
            WishSubscriptionMailToUser::dispatch(
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

                $breakdown = Helpers::calculateStripeDirectChargeFlow($total_amount, $wishSubscription->currency, 0, $wishSubscription->fee_profile ?? 'card');
                $creatorNet = $breakdown['net_to_creator'];
                $creatorNetAmountWithSymbol = $currencySymbol.number_format($creatorNet, 2);

                SubscribedMail::dispatch($wishSubscription, $creatorNetAmountWithSymbol);

                Log::info('Wish subscription renewal email dispatched to creator', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'creator_email' => $wishSubscription->wish_item->user->email,
                    'net_amount' => $creatorNetAmountWithSymbol,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify creator about subscription renewal', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Wish subscription renewal email dispatched', [
                'subscription_id' => $wishSubscription->stripe_id,
                'customer_email' => $wishSubscription->guest_email,
                'amount' => $renewalAmount,
                'creator_name' => $wishSubscription->wish_item->user->name,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send subscription renewal email', [
                'subscription_id' => $wishSubscription->stripe_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle invoice.paid events for all subscription types
     */
    public function handleInvoicePaid($data)
    {
        $subscriptionId = $data->subscription ?? null;

        if (! $subscriptionId) {
            Log::info('Invoice paid but no subscription ID found', ['invoice_id' => $data->id]);

            return;
        }

        Log::info('Processing invoice.paid for subscription', [
            'invoice_id' => $data->id,
            'subscription_id' => $subscriptionId,
            'billing_reason' => $data->billing_reason ?? null,
        ]);

        // Check if this is a wish item subscription
        $wishSubscription = WishItemSubscription::where('stripe_id', $subscriptionId)
            ->where('status', 'paid')
            ->first();

        if ($wishSubscription && $wishSubscription->wish_item) {
            $this->handleWishSubscriptionInvoicePaid($data, $wishSubscription);
        } else {
            // Check if this is a bill subscription
            $billPayment = BillPayment::where('stripe_id', $subscriptionId)
                ->where('status', 'paid')
                ->latest()
                ->first();

            if ($billPayment && $billPayment->bill) {
                Log::info('Invoice paid for bill subscription', [
                    'subscription_id' => $subscriptionId,
                    'bill_id' => $billPayment->bills_id,
                ]);

                // Create deliverable for bill renewal
                $deliverable = $this->createBillRenewalDeliverable($billPayment);

                // Notify Creator about the bill renewal with Net amount
                try {
                    $currency = Currency::where('iso', strtoupper($billPayment->currency ?? 'gbp'))->first();
                    $currencySymbol = $currency ? $currency->symbol : '£';

                    $total_amount = ($data->amount_paid ?? 0) / 100;
                    $breakdown = Helpers::calculateStripeDirectChargeFlow($total_amount, $billPayment->currency);
                    $creatorNet = $breakdown['net_to_creator'];
                    $creatorNetAmountWithSymbol = $currencySymbol.number_format($creatorNet, 2);

                    BillPayMail::dispatch($billPayment, $creatorNetAmountWithSymbol);

                    Log::info('Bill renewal email dispatched to creator', [
                        'subscription_id' => $subscriptionId,
                        'creator_email' => $billPayment->bill->user->email,
                        'net_amount' => $creatorNetAmountWithSymbol,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to notify creator about bill renewal', [
                        'subscription_id' => $subscriptionId,
                        'error' => $e->getMessage(),
                    ]);
                }

                if ($deliverable && $data->payment_intent) {
                    // Update payment intent ID on deliverable if it was missing
                    if (! $deliverable->payment_intent_id) {
                        $deliverable->payment_intent_id = $data->payment_intent;
                        $deliverable->save();
                    }

                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'bill_renewal_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true',
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to update Stripe metadata for bill renewal invoice', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $data->payment_intent,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            } else {
                // Check if this is a membership subscription
                $membershipPayment = MembershipPayment::where('stripe_id', $subscriptionId)
                    ->where('status', 'paid')
                    ->latest()
                    ->first();

                if ($membershipPayment && $membershipPayment->membership) {
                    Log::info('Invoice paid for membership subscription', [
                        'subscription_id' => $subscriptionId,
                        'membership_id' => $membershipPayment->membership_id,
                    ]);

                    // Also clear discovery cache to update trending/top earners
                    app(DiscoveryService::class)->clearDiscoveryCache();

                    // Create deliverable for membership renewal
                    $deliverable = $this->createMembershipRenewalDeliverable($membershipPayment);

                    // Notify Creator about the membership renewal with Net amount
                    try {
                        $currency = Currency::where('iso', strtoupper($membershipPayment->currency ?? 'gbp'))->first();
                        $currencySymbol = $currency ? $currency->symbol : '£';

                        $total_amount = ($data->amount_paid ?? 0) / 100;
                        $breakdown = Helpers::calculateStripeDirectChargeFlow($total_amount, $membershipPayment->currency);
                        $creatorNet = $breakdown['net_to_creator'];
                        $creatorNetAmountWithSymbol = $currencySymbol.number_format($creatorNet, 2);

                        MembershipMail::dispatch($membershipPayment, $creatorNetAmountWithSymbol);

                        Log::info('Membership renewal email dispatched to creator', [
                            'subscription_id' => $subscriptionId,
                            'creator_email' => $membershipPayment->membership->user->email,
                            'net_amount' => $creatorNetAmountWithSymbol,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to notify creator about membership renewal', [
                            'subscription_id' => $subscriptionId,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    if ($deliverable && $data->payment_intent) {
                        // Update payment intent ID on deliverable if it was missing
                        if (! $deliverable->payment_intent_id) {
                            $deliverable->payment_intent_id = $data->payment_intent;
                            $deliverable->save();
                        }

                        try {
                            $stripeMetadataService = app(StripeMetadataService::class);
                            $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                                'membership_renewal_processed_at' => now()->toISOString(),
                                'immediate_delivery' => 'true',
                            ]);
                        } catch (\Exception $e) {
                            Log::error('StripeWebhookController: Failed to update Stripe metadata for membership renewal invoice', [
                                'deliverable_id' => $deliverable->id,
                                'payment_intent_id' => $data->payment_intent,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                } else {
                    Log::info('Invoice paid for non-wish/non-bill/non-membership subscription or subscription not found', [
                        'subscription_id' => $subscriptionId,
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
                'invoice_id' => $invoiceData->id,
            ]);

            // Check if wish item has content to deliver
            // (skip if invoice.payment_succeeded already created one for this same invoice).
            if ((! empty($wishSubscription->wish_item->content_file) || ! empty($wishSubscription->wish_item->reward))
                && ! $this->wishSubscriptionDeliverableExistsForInvoice($wishSubscription, $invoiceData->id)
            ) {

                // Create deliverable record for tracking with certificate support
                $deliverable = Deliverable::create([
                    'uuid' => Str::uuid(),
                    'product_id' => (string) $wishSubscription->wish_item->id,
                    'item_id' => $wishSubscription->wish_item->id,
                    'creator_id' => $wishSubscription->wish_item->user_id,
                    'gifter_id' => $wishSubscription->user_id,
                    'session_id' => $wishSubscription->session_id,
                    'payment_intent_id' => $invoiceData->payment_intent ?? null,
                    'deliverable_type' => ! empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
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
                        'content_type' => ! empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                        'invoice_id' => $invoiceData->id,
                        'billing_reason' => $invoiceData->billing_reason ?? null,
                        'deliverable_url' => ! empty($wishSubscription->wish_item->content_file) ?
                            $wishSubscription->wish_item->content_file_url : ($wishSubscription->wish_item->reward_url ?? null),
                    ]),
                ]);

                // Dispatch ProcessWishItemDeliverable job for content processing
                ProcessWishItemDeliverable::dispatch($deliverable);

                // Update Stripe payment intent metadata (exactly like membership)
                if ($invoiceData->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'wish_subscription_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true',
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeWebhookController: Failed to update Stripe metadata for wish subscription invoice', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $invoiceData->payment_intent,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                // Clear user cache
                if ($wishSubscription->wish_item) {
                    $creator = User::find($wishSubscription->wish_item->user_id);
                    if ($creator) {
                        $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                    }
                }

                Log::info('Wish subscription content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id,
                    'has_content_file' => ! empty($wishSubscription->wish_item->content_file),
                    'has_reward' => ! empty($wishSubscription->wish_item->reward),
                ]);

                // Send subscription payment notification using existing wish subscription email
                $currency = Currency::where('iso', strtoupper($wishSubscription->currency ?? 'gbp'))->first();
                $currencySymbol = $currency ? $currency->symbol : '£';
                $formattedAmount = $currencySymbol.number_format($wishSubscription->amount, 2);
                $subscriptionPeriod = $wishSubscription->wish_item->subscription_period ?? 'monthly';
                $paymentAmount = $formattedAmount.'/'.$subscriptionPeriod;

                // Use existing wish subscription email system
                WishSubscriptionMailToUser::dispatch(
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

                    $breakdown = Helpers::calculateStripeDirectChargeFlow($total_amount, $wishSubscription->currency, 0, $wishSubscription->fee_profile ?? 'card');
                    $creatorNet = $breakdown['net_to_creator'];
                    $creatorNetAmountWithSymbol = $currencySymbol.number_format($creatorNet, 2);

                    SubscribedMail::dispatch($wishSubscription, $creatorNetAmountWithSymbol);

                    Log::info('Wish subscription payment email dispatched to creator', [
                        'subscription_id' => $wishSubscription->stripe_id,
                        'creator_email' => $wishSubscription->wish_item->user->email,
                        'net_amount' => $creatorNetAmountWithSymbol,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to notify creator about subscription payment', [
                        'subscription_id' => $wishSubscription->stripe_id,
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info('Wish subscription email notification dispatched', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id,
                    'customer_email' => $wishSubscription->guest_email,
                ]);
            } else {
                Log::info('Wish subscription has no content to deliver', [
                    'subscription_id' => $wishSubscription->stripe_id,
                    'wish_item_id' => $wishSubscription->wish_item->id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to process wish subscription invoice.paid', [
                'subscription_id' => $wishSubscription->stripe_id,
                'wish_item_id' => $wishSubscription->wish_item->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
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
        if (! $wish_subscription) {
            Log::warning("No active wish subscription found for stripe_id: {$subscriptionId}");

            return response()->json([
                'status' => 'error',
                'message' => 'No active wish subscription found.',
            ], 404);
        }

        $user = User::find($subs->owner->id ?? $subs->owner_id ?? 0);
        $ret = null;
        if ($user && $user->account_id) {
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

        $wish_subscription->status = 'ended';
        $wish_subscription->save();

        $upcomingPayment = null;
        if ($ret && isset($ret->current_period_end)) {
            $upcomingPayment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
        }

        $newSubs = new WishItemSubscription;
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
        $newSubs->upcoming_payment = $upcomingPayment;
        $newSubs->status = 'paid';
        $newSubs->created_at = $wish_subscription->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        // Clear user cache
        if ($wish_subscription->wish_item) {
            $creator = User::find($wish_subscription->wish_item->user_id);
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
                    'interval_count' => 1,
                ],
                'product' => $product->id,
            ]);

            return [
                'product_id' => $product->id,
                'price_id' => $price->id,
            ];
        } catch (\Exception $e) {
            Log::error('Error creating £8.99/month subscription: '.$e->getMessage());

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

            if (! $membership) {
                Log::error('StripeWebhookController: No membership found for renewal deliverable', [
                    'membership_payment_id' => $membershipPayment->id,
                ]);

                return null;
            }

            // For renewals, we don't have a session but we have the subscription info
            $paymentIntentId = null;

            // Use gross-up flow for net amount calculation
            $breakdown = Helpers::calculateStripeDirectChargeFlow($membershipPayment->amount, $membershipPayment->currency);

            // Create deliverable entry for renewed membership access
            $deliverable = Deliverable::create([
                'uuid' => Uuid::uuid4(),
                'product_id' => $membership->product_id ?? 'membership_'.$membership->id,
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
                    'membership_name' => $membership->level.' Membership',
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
                    'renewal_period_end' => $membershipPayment->upcoming_payment ?? Carbon::now()->addMonth()->toISOString(),
                ]),
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            ProcessWishItemDeliverable::dispatch($deliverable);

            Log::info('Membership renewal deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'membership_payment_id' => $membershipPayment->id,
                'membership_id' => $membership->id,
                'is_renewal' => true,
            ]);

            return $deliverable;
        } catch (\Exception $e) {
            Log::error('Failed to create membership renewal deliverable', [
                'error' => $e->getMessage(),
                'membership_payment_id' => $membershipPayment->id ?? 'unknown',
            ]);

            return null;
        }
    }

    private function createBillRenewalDeliverable($billPayment)
    {
        try {
            $bill = $billPayment->bill;

            // Use gross-up flow for net amount calculation
            $breakdown = Helpers::calculateStripeDirectChargeFlow($billPayment->amount, $billPayment->currency);

            $deliverableUrl = null;
            if (! empty($bill->content_file)) {
                $deliverableUrl = $bill->content_file;
                if (! Str::startsWith($deliverableUrl, ['http://', 'https://'])) {
                    $deliverableUrl = "https://ucarecdn.com/{$deliverableUrl}/";
                }
            }

            // Create deliverable entry for renewal tracking (similar to wish subscriptions)
            $deliverable = Deliverable::create([
                'uuid' => Uuid::uuid4(),
                'product_id' => $bill->product_id ?? 'bill_'.$bill->id,
                'price_id' => $bill->price_id,
                'item_id' => $bill->id, // Add item_id for bill lookup
                'creator_id' => $bill->user_id,
                'gifter_id' => $billPayment->user_id,
                'payment_intent_id' => null, // Renewals don't have payment intent
                'session_id' => $billPayment->session_id,
                'deliverable_type' => ! empty($bill->content_file) ? 'digital_file' : 'access',
                'product_type' => 'bill',
                'transaction_amount' => $billPayment->amount, // Add transaction amount
                'deliverable_url' => $deliverableUrl,
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
                    'has_content_file' => ! empty($bill->content_file),
                    'renewal' => true,
                ]),
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            ProcessWishItemDeliverable::dispatch($deliverable);

            Log::info('Bill renewal deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'bill_payment_id' => $billPayment->id,
                'bill_id' => $bill->id,
                'has_content_file' => ! empty($bill->content_file),
            ]);

            return $deliverable;
        } catch (\Exception $e) {
            Log::error('Failed to create bill renewal deliverable', [
                'error' => $e->getMessage(),
                'bill_payment_id' => $billPayment->id ?? 'unknown',
                'bill_id' => $billPayment->bill->id ?? 'unknown',
            ]);

            return null;
        }
    }

    /**
     * Handle Async Payment Succeeded
     */
    /**
     * Resolve the product type from the payment row keyed by session_id and run
     * the matching processor. Used when session-level metadata is missing, so a
     * settled bank payment still fulfils (deliverable + notification + mail)
     * instead of being silently dropped.
     *
     * Public so `payments:reconcile` can replay a settled session that the
     * webhook missed.
     */
    public function completeBySessionLookup($session): void
    {
        $sid = $session->id;

        if (PiggyPotContribution::where('session_id', $sid)->exists()) {
            Log::info('Async settlement: routed to piggy pot by session lookup', ['session_id' => $sid]);
            $this->processPiggyPotPayment($session, $session->metadata ?? (object) []);

            return;
        }

        if (TipGoalsPayment::where('session_id', $sid)->exists()) {
            Log::info('Async settlement: routed to support payment by session lookup', ['session_id' => $sid]);
            $this->processSupportPayment($session, $session->metadata ?? (object) []);

            return;
        }

        if (ShopPayment::where('session_id', $sid)->exists()) {
            Log::info('Async settlement: routed to shop by session lookup', ['session_id' => $sid]);
            $this->processShopItemPayment($session, $session->metadata ?? (object) []);

            return;
        }

        if (TaskPurchase::where('stripe_session_id', $sid)->exists()) {
            Log::info('Async settlement: routed to task by session lookup', ['session_id' => $sid]);
            $this->processTaskPurchase($session, $session->metadata ?? (object) []);

            return;
        }

        Log::warning('Async settlement: no payment row matched this session', ['session_id' => $sid]);
    }

    private function handleAsyncPaymentSucceeded($session)
    {
        Log::info('Processing async payment succeeded', ['session_id' => $session->id]);

        // Delayed-settlement bank methods (SEPA/ACH): the completed-session
        // fulfilment was deferred while the debit cleared — run it now. The
        // per-product processors are idempotent (firstOrCreate / exists guards),
        // so re-entry is safe.
        $metadata = $session->metadata ?? null;

        try {
            $this->handleCheckoutSessionCompleted($session, $metadata);
        } catch (\Exception $e) {
            Log::error('Async settlement: deferred fulfilment failed: '.$e->getMessage(), [
                'session_id' => $session->id,
            ]);
        }

        // Fallback routing: handleCheckoutSessionCompleted dispatches on
        // SESSION-level metadata, which is empty for sessions created before
        // that metadata was added (and for any future checkout that forgets it).
        // The session_id is the reliable key, so resolve the product from the
        // payment row itself and run the matching processor. Processors are
        // idempotent, so this is safe even when metadata routing already ran.
        if (! isset($metadata->type) && ! isset($metadata->deliverable_type)) {
            try {
                $this->completeBySessionLookup($session);
            } catch (\Exception $e) {
                Log::error('Async settlement: session-lookup fulfilment failed: '.$e->getMessage(), [
                    'session_id' => $session->id,
                ]);
            }
        }

        $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();
        if ($purchase) {
            // Only update if currently pending, processing or unpaid
            if (in_array($purchase->status, ['pending', 'unpaid', 'processing'])) {
                $purchase->status = 'paid';
                $purchase->save();
                Log::info('Updated TaskPurchase status to paid', ['id' => $purchase->id]);
            }
        }

        // Also update Deliverable
        $deliverable = Deliverable::where('session_id', $session->id)->first();
        if ($deliverable && $deliverable->payment_status !== 'paid') {
            $deliverable->payment_status = 'paid';
            $deliverable->save();
            try {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable);
            } catch (\Exception $e) {
                Log::error('Failed to update metadata on async payment succeeded: '.$e->getMessage());
            }
        }

        $piggyPot = PiggyPotContribution::where('session_id', $session->id)->first();
        if ($piggyPot && ! in_array($piggyPot->status, ['paid', 'succeeded'])) {
            $piggyPot->status = 'succeeded';
            $piggyPot->save();
            Log::info('Updated PiggyPotContribution status to succeeded', ['id' => $piggyPot->id]);
        }

        $shopPay = ShopPayment::where('session_id', $session->id)->first();
        if ($shopPay && ! in_array($shopPay->payment_status, ['paid'])) {
            $shopPay->payment_status = 'paid';
            $shopPay->save();
            Log::info('Updated ShopPayment status to paid (async settlement)', ['id' => $shopPay->id]);
        }

        $tipPay = TipGoalsPayment::where('session_id', $session->id)->first();
        if ($tipPay && ! in_array($tipPay->status, ['paid'])) {
            $tipPay->status = 'paid';
            $tipPay->save();
            Log::info('Updated TipGoalsPayment status to paid (async settlement)', ['id' => $tipPay->id]);
        }
    }

    /**
     * Handle Async Payment Failed
     */
    /**
     * A checkout session the supporter never completed. Close out the risk-ledger
     * Payment row so it stops sitting at 'initiated' forever.
     */
    private function handleCheckoutSessionExpired($session)
    {
        Log::info('Processing checkout session expired', ['session_id' => $session->id]);

        Payment::where('stripe_session_id', $session->id)
            ->where('status', 'initiated')
            ->update(['status' => 'expired']);
    }

    private function handleAsyncPaymentFailed($session)
    {
        Log::info('Processing async payment failed', ['session_id' => $session->id]);

        $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();
        if ($purchase) {
            $purchase->status = 'failed';
            $purchase->save();
            Log::info('Updated TaskPurchase status to failed', ['id' => $purchase->id]);

            // Clear caches
            if ($purchase->creator) {
                $this->userProfileService->clearUserCaches($purchase->creator->username, $purchase->creator->id);
            }
            if ($purchase->supporter) {
                $this->userProfileService->clearUserCaches($purchase->supporter->username, $purchase->supporter->id);
            }
        }

        // Also update Deliverable
        $deliverable = Deliverable::where('session_id', $session->id)->first();
        if ($deliverable) {
            $deliverable->payment_status = 'failed';
            $deliverable->status = 'failed';
            $deliverable->save();
            try {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable);
            } catch (\Exception $e) {
                Log::error('Failed to update metadata on async payment failed: '.$e->getMessage());
            }
        }

        $piggyPot = PiggyPotContribution::where('session_id', $session->id)->first();
        if ($piggyPot) {
            $piggyPot->status = 'failed';
            $piggyPot->save();
            Log::info('Updated PiggyPotContribution status to failed', ['id' => $piggyPot->id]);
        }

        $shopPay = ShopPayment::where('session_id', $session->id)->first();
        if ($shopPay && $shopPay->payment_status !== 'paid') {
            $shopPay->payment_status = 'failed';
            $shopPay->save();
            Log::info('Updated ShopPayment status to failed (async settlement)', ['id' => $shopPay->id]);
        }

        $tipPay = TipGoalsPayment::where('session_id', $session->id)->first();
        if ($tipPay && $tipPay->status !== 'paid') {
            $tipPay->status = 'failed';
            $tipPay->save();
            Log::info('Updated TipGoalsPayment status to failed (async settlement)', ['id' => $tipPay->id]);
        }

        Payment::where('stripe_session_id', $session->id)
            ->whereIn('status', ['initiated', 'processing', 'review_hold'])
            ->update(['status' => 'failed']);
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
                'metadata' => $metadata,
            ]);

            // Look for support payment deliverables that are ready but haven't had Stripe metadata updated
            $readyDeliverables = Deliverable::where('product_type', 'support_payment')
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
                            'event_payment_intent_id' => $eventPaymentIntentId,
                        ]);

                        return true;
                    }

                    return false;
                });

            // Dispatch UpdateSupportPaymentStripeMetadata job for any found deliverables
            foreach ($readyDeliverables as $deliverable) {
                UpdateSupportPaymentStripeMetadata::dispatch($deliverable->id)
                    ->delay(now()->addSeconds(5)); // Short delay for webhook safety-net

                Log::info('StripeWebhookController: Dispatched safety-net UpdateSupportPaymentStripeMetadata job', [
                    'deliverable_id' => $deliverable->id,
                    'certificate_url' => $deliverable->certificate_url,
                    'payment_intent_id' => $deliverable->payment_intent_id,
                ]);
            }

            if ($readyDeliverables->count() === 0) {
                Log::info('StripeWebhookController: No support payment deliverables found needing metadata updates');
            }
        } catch (\Exception $e) {
            Log::error('StripeWebhookController: Error in handleSupportPaymentDeliverableReady', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
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
            $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)
                ->orWhere('stripe_session_id', $charge->payment_intent) // Sometimes the session ID is passed as the identifier
                ->first();

            if ($payment) {
                $payment->update(['status' => 'refunded']);
                $creatorId = $payment->creator_id;
                Log::info('Risk Engine: Payment marked as refunded', ['payment_id' => $payment->id]);
            }

            if ($creatorId) {
                // Recalculate Risk Metrics
                try {
                    $this->riskService->recalculateMetrics($creatorId);
                } catch (\Exception $e) {
                    Log::error('Risk Engine: Failed to recalculate metrics on refund: '.$e->getMessage());
                }
            }
        } catch (\Exception $e) {
            Log::error('Risk Engine: Failed to process refund: '.$e->getMessage());
        }
        // ----------------------------------

        try {
            if ($paymentIntentId) {
                SupportTicket::where('stripe_payment_intent_id', $paymentIntentId)
                    ->whereNull('resolved_at')
                    ->update([
                        'status' => 'refunded',
                        'resolved_at' => now(),
                    ]);
            }
        } catch (\Throwable $e) {
        }

        // --- Module Sync: Mark internal purchase records as refunded ---

        // 1. Tasks
        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
        if ($purchase) {
            $purchase->status = 'refunded';
            $purchase->refunded_at = now();

            // Try to get refund ID from charge
            if (isset($charge->refunds->data) && ! empty($charge->refunds->data)) {
                $latestRefund = $charge->refunds->data[0] ?? null;
                if ($latestRefund) {
                    $purchase->refund_id = $latestRefund->id;
                }
            }

            $purchase->save();

            Log::info('TaskPurchase refunded via webhook', ['id' => $purchase->id]);

            // Update Deliverable
            try {
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'refunded';
                    $deliverable->save();

                    try {
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'status' => 'refunded',
                            'refunded_by' => 'stripe',
                            'refund_reason' => 'charge_refunded',
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to update metadata on charge refunded webhook: '.$e->getMessage());
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
                    Helpers::sendNotification('Task Refunded 💸', "The task '{$task->title}' has been refunded.", $supporter->email);
                    if ($supporter->notification_send == 1) {
                        Mail::to($supporter->email)->send(new TaskRefunded(['title' => $task->title, 'amount' => $purchase->amount, 'currency' => $task->currency, 'message' => 'The task was refunded.']));
                    }
                }

                if ($creator) {
                    Helpers::sendNotification('Task Refunded 💸', "The task '{$task->title}' has been refunded to the supporter.", $creator->email);
                    if ($creator->notification_send == 1) {
                        Mail::to($creator->email)->send(new TaskRefunded(['title' => $task->title, 'amount' => $purchase->amount, 'currency' => $task->currency, 'message' => 'The task was refunded to the supporter.']));
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to send refund notifications (webhook): '.$e->getMessage());
            }
        }

        $riskPayment = null;
        try {
            $riskPayment = $paymentIntentId ? Payment::where('stripe_payment_intent_id', $paymentIntentId)->first() : null;
        } catch (\Exception $e) {
        }
        $stripeSessionId = $riskPayment->stripe_session_id ?? null;

        // 2. Tips / Support
        $tip = $stripeSessionId ? TipGoalsPayment::where('session_id', $stripeSessionId)->first() : null;
        if (! $tip && $paymentIntentId) {
            $tip = TipGoalsPayment::where('session_id', $paymentIntentId)->first();
        }
        if ($tip) {
            $tip->update(['status' => 'refunded']);
        }

        // 2b. Piggy Pots
        $piggy = $stripeSessionId ? PiggyPotContribution::where('session_id', $stripeSessionId)->first() : null;
        if (! $piggy && $paymentIntentId) {
            $piggy = PiggyPotContribution::where('payment_intent_id', $paymentIntentId)->first();
        }
        if ($piggy) {
            $piggy->update(['status' => 'refunded']);
        }

        // 3. Shop Purchases
        $shopPayment = $stripeSessionId ? ShopPayment::where('session_id', $stripeSessionId)->first() : null;
        if (! $shopPayment && $paymentIntentId) {
            $shopPayment = ShopPayment::where('session_id', $paymentIntentId)->first();
        }
        if ($shopPayment) {
            $shopPayment->update(['payment_status' => 'refunded']);
        }

        // 4. Wishes (StripePaymentDetail)
        $wishPayment = $stripeSessionId ? StripePaymentDetail::where('session_id', $stripeSessionId)->first() : null;
        if (! $wishPayment && $paymentIntentId) {
            $wishPayment = StripePaymentDetail::where('session_id', $paymentIntentId)->first();
        }
        if ($wishPayment) {
            $wishPayment->update(['payment_status' => 'refunded']);
        }

        // 5. Memberships
        $membershipPayment = $stripeSessionId ? MembershipPayment::where('session_id', $stripeSessionId)->first() : null;
        if (! $membershipPayment && $paymentIntentId) {
            $membershipPayment = MembershipPayment::where('session_id', $paymentIntentId)->first();
        }
        if ($membershipPayment) {
            $membershipPayment->update(['status' => 'refunded']);
        }

        // --- Finalize Sync ---
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

        Log::info('Handling payment_intent.succeeded', [
            'pi_id' => $paymentIntentId,
            'metadata' => $paymentIntent->metadata ?? 'null',
            'amount' => $paymentIntent->amount,
            'currency' => $paymentIntent->currency,
            'connected_account' => $connectedAccountId,
        ]);

        // 1. Update Risk Ledger (payments table)
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (! $payment) {
            // Attempt to auto-create missing Payment record for legacy/direct flows
            $creatorId = $paymentIntent->metadata->creator_id ?? null;

            // Fallback: Look up via Connected Account (Direct Charges)
            if (! $creatorId && $connectedAccountId) {
                $creator = User::where('account_id', $connectedAccountId)->first();
                if ($creator) {
                    $creatorId = $creator->uuid;
                    Log::info('Risk Ledger: Found creator via Connected Account ID', ['creator_id' => $creatorId, 'account_id' => $connectedAccountId]);
                }
            }

            // Fallback: Look up via Deliverable
            if (! $creatorId) {
                $deliverable = Deliverable::where('payment_intent_id', $paymentIntentId)->first();
                $creatorId = $deliverable->creator_id ?? null;
            }

            if ($creatorId) {
                if (is_numeric($creatorId)) {
                    $creator = User::find($creatorId);
                    $creatorId = $creator ? $creator->uuid : null;
                } else {
                    $creator = User::where('uuid', $creatorId)->first();
                    $creatorId = $creator ? $creator->uuid : null;
                }
            }

            if ($creatorId) {
                try {
                    $appFee = $paymentIntent->application_fee_amount ?? 0;
                    $stripeFee = StripeControl::getStripeFeeMinorForPaymentIntent((string) $paymentIntentId, $connectedAccountId);
                    $netMinor = max(0, $paymentIntent->amount - $appFee - $stripeFee);

                    $gbpMinor = app(MoneyNormalizer::class)->toGbpMinor($netMinor, strtoupper((string) $paymentIntent->currency));

                    $existing = Payment::whereNull('stripe_payment_intent_id')
                        ->where('creator_id', $creatorId)
                        ->where(function ($q) use ($netMinor, $gbpMinor, $paymentIntent) {
                            $q->where(function ($sub) use ($netMinor, $paymentIntent) {
                                $sub->where('currency', strtoupper((string) $paymentIntent->currency))
                                    ->where('amount', $netMinor);
                            })->orWhere(function ($sub) use ($gbpMinor) {
                                $sub->whereIn('currency', ['gbp', 'GBP'])
                                    ->where('amount', $gbpMinor);
                            });
                        })
                        ->where('created_at', '>=', now()->subMinutes(10))
                        ->orderByDesc('created_at')
                        ->first();
                    if ($existing) {
                        $existing->update([
                            'stripe_payment_intent_id' => $paymentIntentId,
                        ]);
                        $payment = $existing;
                    } else {

                        $payment = Payment::create([
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'creator_id' => $creatorId,
                            'amount' => $netMinor, // Amount in minor units for Risk Ledger (Net amount)
                            'currency' => strtoupper($paymentIntent->currency),
                            'reserve_amount_minor' => 0,
                            'status' => 'succeeded',
                        ]);
                    }
                    Log::info('Risk Ledger: Auto-created missing Payment record', ['id' => $payment->id, 'creator_id' => $creatorId]);
                } catch (\Exception $e) {
                    Log::error('Risk Ledger: Failed to auto-create payment: '.$e->getMessage());
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
            app(DiscoveryService::class)->clearDiscoveryCache();

            try {
                // Calculate reserve based on the creator's share (Net Amount)
                // This ensures the reserve percentage matches what the creator expects to see.
                if ((int) ($payment->reserve_amount_minor ?? 0) === 0 || true) { // Force recalculation to ensure net-based
                    if (! $payment->creator_id) {
                        throw new \Exception('Missing creator_id for reserve recalculation');
                    }
                    $creator = User::where('uuid', $payment->creator_id)->first();
                    if (! $creator) {
                        throw new \Exception('Creator not found for reserve recalculation');
                    }
                    $metrics = app(RiskService::class)->recalculateMetrics((string) $payment->creator_id);
                    $reservePercent = app(ReservePolicy::class)->getEffectiveReservePercent($creator, $metrics, now());

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
                            $stripeFee = StripeControl::getStripeFeeMinorForPaymentIntent((string) $paymentIntentId, $connectedAccountId);
                            $netMinor = max(0, $paymentIntent->amount - $appFee - $stripeFee);
                        }

                        $reserveMinor = (int) round(((int) $netMinor * $reservePercent) / 100);

                        $payment->update([
                            'reserve_amount_minor' => $reserveMinor,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to backfill reserve amount on payment success: '.$e->getMessage());
            }

            // 2. Update Identity Rollups
            if ($payment->riskIdentity) {
                try {
                    $rollupService = app(IdentityRollupService::class);
                    $rollupService->refreshRollups($payment->riskIdentity);
                    Log::info('Risk Ledger: Identity rollups refreshed', ['identity_id' => $payment->risk_identity_id]);
                } catch (\Exception $e) {
                    Log::error('Failed to refresh identity rollups on payment success: '.$e->getMessage());
                }
            }

            // 3. Update Creator Metrics (Transaction Count & Risk Check)
            try {
                // We recalculate fully to ensure rates are up to date with new denominator
                $this->riskService->recalculateMetrics($payment->creator_id);
            } catch (\Exception $e) {
                Log::error('Failed to update creator metrics on payment success: '.$e->getMessage());
            }
        } else {
            Log::info('Payment intent succeeded but not found in Risk Ledger (might be legacy or direct)', ['pi' => $paymentIntentId]);
        }

        $metadata = $paymentIntent->metadata ?? null;
        if ($metadata && (isset($metadata->type) && $metadata->type === 'task_purchase')) {
            $this->finalizeTaskPurchaseAfterConfirmation((object) ['id' => $paymentIntent->metadata->checkout_session_id ?? null], $metadata, $paymentIntentId);
        }
    }

    /**
     * Handle Early Fraud Warning Created
     */
    private function handleEarlyFraudWarningCreated($efw)
    {
        Log::info('================ EFW WEBHOOK START ================');

        try {
            Log::info('EFW Payload Received', [
                'efw_id' => $efw->id ?? null,
                'payment_intent' => $efw->payment_intent ?? null,
                'charge' => $efw->charge ?? null,
                'action' => $efw->action ?? null,
                'fraud_type' => $efw->fraud_type ?? null,
                'risk_level' => $efw->risk_level ?? null,
            ]);

            $paymentIntentId = $efw->payment_intent;
            $chargeId = $efw->charge;

            Log::info('STEP 1 : Looking for Payment', [
                'payment_intent' => $paymentIntentId,
            ]);

            // Try to find payment
            $payment = null;
            if ($paymentIntentId) {
                $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

                if (! $payment) {
                    Log::info('Payment not found - Creating minimal payment record', [
                        'payment_intent' => $paymentIntentId,
                    ]);

                    $payment = Payment::create([
                        'stripe_payment_intent_id' => $paymentIntentId,
                        'creator_id' => null,
                        'amount' => 0,
                        'currency' => 'gbp',
                        'status' => 'initiated',
                        'reserve_amount_minor' => 0,
                        'platform_holds_funds' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    Log::info('Minimal payment created', [
                        'payment_id' => $payment->id,
                    ]);
                }
            }

            // Check for existing fraud warning
            $existing = EarlyFraudWarning::where(
                'stripe_efw_id',
                $efw->id
            )->exists();

            if ($existing) {
                Log::warning('EFW already exists. Returning.');

                return;
            }

            // Get creator info from TaskPurchase or Deliverable
            $creatorEmail = 'Unknown';
            $creatorName = 'Unknown';
            $amount = 0;
            $currency = 'USD';
            $paymentDescription = 'Unknown';
            $buyerName = 'Unknown';
            $buyerEmail = 'Unknown';

            if ($paymentIntentId) {
                $taskPurchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();
                if ($taskPurchase) {
                    $amount = $taskPurchase->amount ?? 0;
                    $currency = strtoupper($taskPurchase->currency ?? 'USD');
                    $paymentDescription = $taskPurchase->task->title ?? 'Task Purchase';

                    if ($taskPurchase->creator_id) {
                        $creator = User::find($taskPurchase->creator_id);
                        if ($creator) {
                            $creatorEmail = $creator->email ?? 'Unknown';
                            $creatorName = $creator->name ?? 'Unknown';
                        }
                    }

                    if ($taskPurchase->supporter_id) {
                        $buyer = User::find($taskPurchase->supporter_id);
                        if ($buyer) {
                            $buyerName = $buyer->name ?? 'Unknown';
                            $buyerEmail = $buyer->email ?? 'Unknown';
                        }
                    }
                }
            }

            // If no TaskPurchase, try Deliverable
            if (! $paymentIntentId || ! isset($taskPurchase) || ! $taskPurchase) {
                $deliverable = Deliverable::where('payment_intent_id', $paymentIntentId)->first();
                if ($deliverable) {
                    $amount = $deliverable->transaction_amount ?? 0;
                    $currency = strtoupper($deliverable->payment_currency ?? 'USD');
                    $paymentDescription = $deliverable->product_type ?? 'Unknown';

                    if ($deliverable->creator_id) {
                        $creator = User::where('uuid', $deliverable->creator_id)->first();
                        if ($creator) {
                            $creatorEmail = $creator->email ?? 'Unknown';
                            $creatorName = $creator->name ?? 'Unknown';
                        }
                    }
                }
            }

            // If we have a payment but no creator info yet
            if ($payment && ! $creatorName && $payment->creator_id) {
                $creator = User::where('uuid', $payment->creator_id)->first();
                if ($creator) {
                    $creatorEmail = $creator->email ?? 'Unknown';
                    $creatorName = $creator->name ?? 'Unknown';
                    $amount = $payment->amount / 100;
                    $currency = strtoupper($payment->currency ?? 'USD');
                }
            }

            Log::info('STEP 2 : Creator Info', [
                'creator_name' => $creatorName,
                'creator_email' => $creatorEmail,
                'amount' => $amount,
                'currency' => $currency,
            ]);

            Log::info('STEP 3 : Creating Early Fraud Warning');

            // IMPORTANT: Create fraud warning with ALL data from Stripe
            $fraudWarningData = [
                'payment_id' => $payment ? $payment->id : null,
                'stripe_efw_id' => $efw->id,
                'stripe_charge_id' => $chargeId,
                'stripe_payment_intent' => $paymentIntentId,
                'fraud_type' => $efw->fraud_type ?? null,
                'risk_level' => $efw->risk_level ?? null,
                'action' => $efw->action ?? null,
                'reason_codes' => json_encode($efw->reason_codes ?? []),
                'score' => $efw->score ?? null,
                'created_at' => now(),
            ];

            Log::info('Fraud Warning Data being saved', $fraudWarningData);

            $fraudWarning = EarlyFraudWarning::create($fraudWarningData);

            Log::info('STEP 4 : Fraud Warning Created', [
                'fraud_warning_id' => $fraudWarning->id,
                'fraud_type' => $fraudWarning->fraud_type,
                'risk_level' => $fraudWarning->risk_level,
                'action' => $fraudWarning->action,
            ]);

            // Get admin user for email
            $adminEmail = config('services.fraud_notifications.admin_email');
            $adminUser = null;

            if ($adminEmail) {
                $adminUser = User::where('email', $adminEmail)->first();
                if (! $adminUser) {
                    $adminUser = new User;
                    $adminUser->email = $adminEmail;
                    $adminUser->name = 'Admin';
                    $adminUser->id = 1;
                }
            }

            // Send MagicBell Notification
            Log::info('STEP 5 : Sending MagicBell Notification');
            $this->sendFraudWarningMagicBellNotification(
                $efw,
                $fraudWarning,
                $amount,
                $currency,
                $creatorName,
                $creatorEmail,
                $buyerName,
                $buyerEmail,
                $paymentDescription,
                $adminEmail
            );

            // Dispatch Fraud Mail Job
            Log::info('STEP 6 : Dispatch Fraud Mail');

            try {
                if ($adminUser) {
                    $fraudWarning->refresh();
                    SendFraudWarningMailJob::dispatch(
                        $adminUser,
                        $fraudWarning,
                        'created'
                    );
                    Log::info('Fraud Mail Job Dispatched', [
                        'fraud_warning_id' => $fraudWarning->id,
                        'admin_email' => $adminEmail,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('Fraud Mail Dispatch FAILED', [
                    'error' => $e->getMessage(),
                    'fraud_warning_id' => $fraudWarning->id,
                ]);
            }

            // Process payment actions if payment exists
            if ($payment) {
                Log::info('STEP 7 : Processing Payment Actions');

                // Update Payment Reason Codes
                try {
                    $reasons = [];
                    if ($payment->reason_codes) {
                        $reasons = is_array($payment->reason_codes)
                            ? $payment->reason_codes
                            : json_decode($payment->reason_codes, true) ?? [];
                    }

                    if (! in_array('EFW_RECEIVED', $reasons, true)) {
                        $reasons[] = 'EFW_RECEIVED';
                    }

                    $payment->update([
                        'reason_codes' => $reasons,
                    ]);

                    Log::info('Payment Reason Codes Updated');
                } catch (\Throwable $e) {
                    Log::error('Failed to update payment reason codes', [
                        'error' => $e->getMessage(),
                    ]);
                }

                // Create Audit Log
                try {
                    AuditLog::create([
                        'actor' => 'system',
                        'action_type' => 'EARLY_FRAUD_WARNING',
                        'reference_id' => (string) $payment->id,
                        'metadata_json' => [
                            'stripe_efw_id' => $efw->id,
                            'stripe_charge_id' => $chargeId,
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'creator_id' => $payment->creator_id,
                            'fraud_type' => $efw->fraud_type ?? null,
                            'risk_level' => $efw->risk_level ?? null,
                            'action' => $efw->action ?? null,
                            'amount' => $amount,
                            'currency' => $currency,
                            'creator_name' => $creatorName,
                            'creator_email' => $creatorEmail,
                        ],
                    ]);

                    Log::info('Audit Log Created');
                } catch (\Throwable $e) {
                    Log::error('Failed to create audit log', [
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info('Payment Actions Completed Successfully');
            }

            Log::info('================ EFW WEBHOOK END ================');
        } catch (\Throwable $e) {
            Log::error('EFW FATAL ERROR', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    // UPDATED: Helper method to send MagicBell notification with proper formatting
    private function sendFraudWarningMagicBellNotification($efw, $fraudWarning, $amount, $currency, $creatorName, $creatorEmail, $buyerName, $buyerEmail, $paymentDescription, $adminEmail)
    {
        try {
            // Get proper currency symbol
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $symbol = $currencyModel ? $currencyModel->symbol : '$';
            $formattedAmount = $symbol.number_format($amount, 2);

            // Clean notification with proper data
            $title = '🚨 FRAUD WARNING DETECTED';

            $contentLines = [];
            $contentLines[] = '🔴 FRAUD TYPE: '.ucfirst(str_replace('_', ' ', $fraudWarning->fraud_type ?? 'Unknown'));
            $contentLines[] = '📊 RISK LEVEL: '.ucfirst($fraudWarning->risk_level ?? 'Unknown');
            $contentLines[] = '⚡ ACTION: '.ucfirst(str_replace('_', ' ', $fraudWarning->action ?? 'None'));
            $contentLines[] = '';
            $contentLines[] = '📝 PAYMENT DETAILS:';
            $contentLines[] = '   💰 Amount: '.$formattedAmount;
            $contentLines[] = '   📦 Product: '.$paymentDescription;
            $contentLines[] = '   👤 Buyer: '.($buyerName ?: $buyerEmail ?: 'Unknown');
            $contentLines[] = '   🎨 Creator: '.($creatorName ?: $creatorEmail ?: 'Unknown');
            $contentLines[] = '';
            $contentLines[] = '🆔 EFW ID: '.($efw->id ?? 'N/A');
            $contentLines[] = '📅 DATE: '.now()->format('Y-m-d H:i:s');

            $content = implode("\n", $contentLines);

            Log::info('Sending MagicBell Notification', [
                'title' => $title,
                'content' => $content,
                'admin_email' => $adminEmail,
            ]);

            $result = Helpers::sendNotification($title, $content, $adminEmail);

            Log::info('MagicBell Notification Sent', [
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('MagicBell Notification FAILED', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function handlePaymentIntentFailed($paymentIntent)
    {
        $paymentIntentId = $paymentIntent->id;
        $purchase = TaskPurchase::where('payment_intent_id', $paymentIntentId)->first();

        if ($purchase) {
            Log::info('Payment Intent Failed for TaskPurchase', ['id' => $purchase->id]);
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
                if (! $paymentId) {
                    Log::error('StripeWebhookController: Missing payment_id in metadata for shop purchase');

                    return;
                }

                $shopPayment = ShopPayment::with(['shop', 'shop.user', 'user'])->where('uuid', $paymentId)->lockForUpdate()->first();
                if (! $shopPayment) {
                    Log::error("StripeWebhookController: No ShopPayment found for UUID: $paymentId");

                    return;
                }

                // Idempotency check: if UserPayment already exists, it means the business logic (emails, GMV, etc.) has already run.
                // We don't rely purely on payment_status === 'paid' because syncFinancialTransactionsByPaymentIntent might have updated it eagerly.
                $existingUserPayment = UserPayment::where('payment_details', json_encode($session->id, true))->exists();
                if ($existingUserPayment) {
                    Log::info('StripeWebhookController: Shop payment already processed', ['payment_id' => $paymentId]);

                    return;
                }

                Log::info('StripeWebhookController: Processing shop payment via webhook', ['payment_id' => $paymentId]);

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
                    $username = 'Anonymous user';
                } else {
                    $username = $shopPayment->name ?? ($shopPayment->user->name ?? 'Anonymous user');
                }

                // 4. Save notification
                $message = $username.' just purchased your shop item '.$shopPayment->shop->name;
                NotificationSave::dispatch($message, $shopPayment->shop->user, $shopPayment->user, 'Shop');

                $currencyModel = Currency::where('ISO', strtoupper($shopPayment->currency ?? 'GBP'))->first();
                $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
                $sessionAmount = isset($session->amount_total) ? (float) ($session->amount_total / $multiplier) : 0;

                // 5. Update status and persist the actual paid total
                $shopPayment->update([
                    'payment_status' => 'paid',
                    'session_id' => $session->id,
                    'total_paid' => $sessionAmount > 0 ? $sessionAmount : ($shopPayment->total_paid ?? 0),
                    'updated_at' => Carbon::now(),
                ]);

                // 6. Get currency symbol and calculate net
                $currency = Currency::where('iso', strtoupper($shopPayment->currency))->first();
                $symbol = $currency->symbol ?? '£';

                // Calculate creator net amount using the SAME logic as ShopsController
                $listedPriceToGrossUp = $shopPayment->amount + $shopPayment->tax_amount + $shopPayment->vat_tax_amount + ($shopPayment->shipping_amount ?? 0);

                $metrics = app(RiskService::class)->recalculateMetrics((string) $shopPayment->shop->user->uuid);
                $reserveRate = $metrics->reserve_percent ?? 0;

                $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $shopPayment->currency, $reserveRate, $shopPayment->fee_profile ?? 'card');
                $creatorNetAmount = $symbol.number_format($breakdown['net_to_creator'], 2);

                // 7. Dispatch jobs
                ShopBuyed::dispatch($shopPayment, $shopPayment->anonymous == 1, $creatorNetAmount);

                // 8. Create deliverable record
                $deliverable = null;
                try {
                    if (! Deliverable::where('session_id', $session->id)->exists()) {
                        $deliverable = Deliverable::create([
                            'uuid' => (string) Str::uuid(),
                            'product_id' => $shopPayment->shop->stripe_product_id ?? 'shop_'.$shopPayment->shop->id,
                            'price_id' => $shopPayment->shop->price_id,
                            'item_id' => $shopPayment->shop->id,
                            'creator_id' => $shopPayment->shop->user_id,
                            'gifter_id' => $shopPayment->user_id,
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
                            // Stripe compliance: high-value orders (>£2,500) are held for an
                            // enhanced review (admin confirms delivery before payout clears).
                            // Mirrors the redirect path in ShopsController.
                            'needs_admin_review' => Helpers::priceFormat(strtoupper($shopPayment->currency ?? 'GBP'), (float) $shopPayment->amount, 'GBP') > 2500,
                            'status' => ($shopPayment->shop->type == 'physical' || Helpers::priceFormat(strtoupper($shopPayment->currency ?? 'GBP'), (float) $shopPayment->amount, 'GBP') > 2500) ? 'pending' : 'delivered',
                            'delivered_at' => ($shopPayment->shop->type == 'physical' || Helpers::priceFormat(strtoupper($shopPayment->currency ?? 'GBP'), (float) $shopPayment->amount, 'GBP') > 2500) ? null : now(),
                            'metadata' => json_encode([
                                'shop_item_id' => $shopPayment->shop->id,
                                'shop_item_name' => $shopPayment->shop->name,
                                'type' => $shopPayment->shop->type,
                                'amount' => $shopPayment->amount,
                                'currency' => $shopPayment->currency,
                                'creator_net_amount' => $creatorNetAmount,
                                'via_webhook' => true,
                            ]),
                        ]);
                        Log::info('StripeWebhookController: Deliverable record created for shop item', ['shop_id' => $shopPayment->shop->id]);
                    }
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to create deliverable record for shop', ['error' => $e->getMessage()]);
                }

                ShopBuyedUser::dispatchSync($shopPayment, $shopPayment->shop->reward_file_url, $symbol);

                // 9. Send PWA notifications
                try {
                    $creatorName = ucfirst($shopPayment->shop->user->name ?? 'A Creator');
                    $content = $shopPayment->shop->type !== 'physical'
                        ? "Your digital purchase from $creatorName is complete and ready to access."
                        : "You bought something from $creatorName ’s shop. They’ll process it soon.";
                    Helpers::sendNotification('🛍️ Purchase Confirmed!', $content, $shopPayment->email ?? $shopPayment->user->email);

                    $fanName = ucfirst($shopPayment->user->name ?? $shopPayment->name ?? 'A Fan');
                    $content = $shopPayment->shop->type !== 'physical'
                        ? "$fanName purchased a digital item from your shop. Delivery was completed automatically."
                        : "$fanName placed an order in your shop. Time to fulfill it!.";
                    Helpers::sendNotification('📦 New Shop Order!', $content, $shopPayment->shop->user->email);
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to send PWA notifications for shop', ['error' => $e->getMessage()]);
                }

                // 10. Record UserPayment
                try {
                    $existingUserPayment = UserPayment::where('payment_details', json_encode($session->id, true))->exists();
                    if (! $existingUserPayment) {
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
                Log::error('StripeWebhookController: Error processing shop payment: '.$e->getMessage(), [
                    'session_id' => $session->id,
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        });
    }

    /**
     * Handle Stripe Connect Account Updates (Risk Monitoring)
     */
    /**
     * Request any bank payment capability this account's country supports but
     * doesn't yet hold. Reads the capabilities off the event payload, so it only
     * calls Stripe when something is actually missing (account.updated fires
     * often). Never throws — capability top-up must not break the webhook.
     */
    private function ensureBankCapabilities($account): void
    {
        try {
            $country = $account->country ?? null;
            $wanted = AppStripeControl::bankCapabilitiesForCountry($country);

            if (empty($wanted)) {
                return; // country has no bank rail
            }

            $current = AppStripeControl::capabilitiesMap($account);
            $missing = array_values(array_filter(
                $wanted,
                fn ($c) => ! array_key_exists($c, $current)
            ));

            if (empty($missing)) {
                return; // already requested/active/pending — nothing to do
            }

            Log::info('Requesting missing bank capabilities for connected account', [
                'account_id' => $account->id,
                'country' => $country,
                'missing' => $missing,
            ]);

            AppStripeControl::requestBankCapabilities($account->id, $country);
        } catch (\Throwable $e) {
            Log::warning('ensureBankCapabilities failed: '.$e->getMessage(), [
                'account_id' => $account->id ?? null,
            ]);
        }
    }

    private function handleAccountUpdated($account)
    {
        try {
            if (($account->charges_enabled ?? false) === true) {
                $creator = User::where('account_id', $account->id)->first();
                if ($creator && ! $creator->stripe_connected_at) {
                    $creator->stripe_connected_at = now();
                    $creator->stripe_details_submitted = 1;
                    $creator->save();
                    $this->userProfileService->clearUserCaches($creator->username, $creator->id);
                }
            }

            // Self-healing bank capabilities. Stripe's dashboard "on by default"
            // doesn't reach Express accounts, so an account that never had
            // pay_by_bank/SEPA/ACH requested would silently refuse bank at
            // checkout. Accounts are created from several code paths, so rather
            // than relying on each one, top up here — account.updated fires on
            // every account change, including when onboarding completes.
            $this->ensureBankCapabilities($account);

            if (! isset($account->settings->payouts->schedule->interval)) {
                return;
            }

            $schedule = $account->settings->payouts->schedule->interval;
            if ($schedule !== 'manual') {
                Log::warning("Stripe Risk: Account {$account->id} changed payout schedule to {$schedule}. Reverting and locking.");

                $creator = User::where('account_id', $account->id)->first();
                if ($creator) {
                    // Auto-lock the account
                    $creator->suspended_account = 1;
                    $creator->save();
                    $creator->tokens()->delete();

                    // Mark as HIGH RISK with minimum 20% reserve
                    $metrics = CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid]);
                    $metrics->risk_level = 'high';
                    $metrics->reserve_percent = max((int) $metrics->reserve_percent, 20);
                    $metrics->save();

                    // Revert to manual
                    StripeControl::ensureManualPayoutSchedule($account->id);

                    Log::warning("Stripe Risk: Account {$account->id} locked and marked HIGH RISK due to payout schedule manipulation.");
                }
            }
        } catch (\Exception $e) {
            Log::error('Error handling account.updated for risk monitoring: '.$e->getMessage());
        }
    }

    /**
     * Handle Stripe Payout Events (Risk Monitoring)
     */
    private function handlePayoutEvent($payout, $eventType, $event)
    {
        try {
            // Reserve-release payouts (issued by the reserve:release command) do not create a
            // PayoutRecord. If one fails/cancels at the bank, revert the linked reserves back to
            // 'held' so the next reserve:release run retries them. The mass update intentionally
            // bypasses the never-un-release model guard — this is the one legitimate
            // released → held transition. Idempotent: reserve_payout_id is cleared, so a
            // duplicate event matches zero rows.
            $payoutReason = $payout->metadata->reason ?? null;
            if ($payoutReason === 'reserve_release' && in_array($payout->status, ['failed', 'canceled'], true)) {
                $reverted = FinancialTransaction::where('reserve_payout_id', $payout->id)
                    ->where('reserve_status', 'released')
                    ->update([
                        'reserve_status' => 'held',
                        'reserve_released_at' => null,
                        'reserve_payout_id' => null,
                    ]);
                Log::warning("reserve:release payout {$payout->id} {$payout->status} — reverted {$reverted} reserve(s) to held for retry.");
            }

            // Update local PayoutRecord if it exists
            $record = PayoutRecord::where('stripe_payout_id', $payout->id)->first();
            if ($record) {
                $status = match ($payout->status) {
                    'paid' => 'paid',
                    'failed' => 'failed',
                    'canceled' => 'canceled',
                    'in_transit' => 'in_transit',
                    default => 'pending'
                };

                // Capture the previous status and apply the new one under a row lock so
                // duplicate/concurrent Stripe events for the same payout can't both observe
                // the same transition (which would double-requeue the creator's payments).
                $isTransition = DB::transaction(function () use ($payout, $status, &$record) {
                    $locked = PayoutRecord::where('id', $record->id)->lockForUpdate()->first();
                    $prev = (string) ($locked->status ?? '');
                    $locked->update([
                        'status' => $status,
                        'arrival_date' => $payout->arrival_date ? Carbon::createFromTimestamp($payout->arrival_date) : $locked->arrival_date,
                        'failure_code' => $payout->failure_code ?? null,
                        'failure_message' => $payout->failure_message ?? null,
                    ]);
                    $record = $locked->fresh();

                    return $prev !== $status;
                });

                Log::info("Payout Record updated via webhook: {$payout->id} status: {$status}");

                // Weekly payout-run payout that failed/canceled at the bank → requeue the
                // creator's payments so the next run retries automatically. Bonus payouts are
                // excluded (they have their own reconciliation). prevStatus guard makes this
                // idempotent against duplicate Stripe events.
                if (
                    $isTransition
                    && in_array($status, ['failed', 'canceled'], true)
                    && empty($record->metadata['bonus_type'])
                ) {
                    $this->requeueFailedRunPayout($record);
                }

                if ($isTransition && in_array($status, ['paid', 'failed'], true)) {
                    $record->loadMissing('creator');
                    $creator = $record->creator;
                    $bonusType = (string) (($record->metadata['bonus_type'] ?? null) ?? '');
                    $isFounder = in_array($bonusType, ['founder_qualification', 'founder_monthly'], true);

                    if ($creator && $isFounder) {
                        $label = $bonusType === 'founder_monthly' ? 'Founder Monthly Bonus' : 'Founder Bonus';
                        $periodLabel = $bonusType === 'founder_monthly'
                            ? (string) (($record->metadata['founder_month'] ?? null) ?? '')
                            : null;

                        $amount = ((int) $record->amount_minor) / 100;
                        $currency = (string) ($record->currency ?? 'gbp');
                        $arrivalDate = $record->arrival_date ? $record->arrival_date->toDateString() : null;
                        $failureMessage = (string) (($record->failure_message ?? null) ?? '');

                        try {
                            Mail::to($creator->email)->send(new FounderBonusPayoutStatusUpdated(
                                $creator,
                                $label,
                                (float) $amount,
                                (string) $currency,
                                (string) $status,
                                $arrivalDate,
                                $periodLabel ?: null,
                                $failureMessage ?: null
                            ));
                        } catch (\Throwable $e) {
                            Log::error('Founder payout status email failed', [
                                'creator_id' => $creator->id,
                                'stripe_payout_id' => $payout->id,
                                'error' => $e->getMessage(),
                            ]);
                        }

                        try {
                            $pushTitle = $status === 'paid' ? "{$label} paid" : "{$label} payout failed";
                            $pushBody = $status === 'paid'
                                ? "Your {$label} payout has been completed. Check your Payout History for details."
                                : "Your {$label} payout failed. Please check your Payout History for the reason.";
                            Helpers::sendNotification($pushTitle, $pushBody, $creator->email);
                        } catch (\Throwable $e) {
                            Log::error('Founder payout status push failed', [
                                'creator_id' => $creator->id,
                                'stripe_payout_id' => $payout->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }
            }

            $bonusRow = FastStartBonusPayout::where('stripe_payout_id', $payout->id)->first();
            if ($bonusRow) {
                $bonusStatus = match ($payout->status) {
                    'paid' => 'paid',
                    'failed' => 'failed',
                    'canceled' => 'canceled',
                    'in_transit' => 'in_transit',
                    default => 'pending'
                };
                $bonusRow->status = $bonusStatus;
                if ($bonusStatus === 'paid' && ! $bonusRow->paid_at) {
                    $bonusRow->paid_at = now();
                }
                $bonusRow->save();

                if (in_array($bonusStatus, ['paid', 'failed'], true)) {
                    $fsbCreator = User::where('uuid', $bonusRow->creator_uuid)->first();
                    if ($fsbCreator) {
                        $fsbAmount = round(($bonusRow->bonus_minor ?? 0) / 100, 2);
                        $fsbCurrency = strtoupper($bonusRow->currency ?? 'GBP');
                        $arrivalDate = isset($payout->arrival_date)
                            ? Carbon::createFromTimestamp($payout->arrival_date)->format('D, d M Y')
                            : null;
                        $failureReason = $payout->failure_message ?? null;

                        try {
                            $pushTitle = $bonusStatus === 'paid'
                                ? '🎉 Fast Start Bonus Paid!'
                                : '⚠️ Fast Start Bonus payout failed';
                            $pushBody = $bonusStatus === 'paid'
                                ? "Your {$fsbCurrency} {$fsbAmount} Fast Start Bonus has landed in your account!"
                                : "Your Fast Start Bonus payout failed. We'll look into this.";
                            Helpers::sendNotification($pushTitle, $pushBody, $fsbCreator->email);
                        } catch (\Throwable $e) {
                            Log::warning('Fast Start bonus push notification failed', [
                                'creator_uuid' => $bonusRow->creator_uuid,
                                'error' => $e->getMessage(),
                            ]);
                        }

                        if (config('fast_start_bonus.notifications.email')) {
                            try {
                                Mail::to($fsbCreator->email)->send(
                                    new FastStartBonusPayoutStatusUpdated(
                                        $fsbCreator,
                                        $fsbAmount,
                                        $fsbCurrency,
                                        $bonusStatus,
                                        $arrivalDate,
                                        $failureReason
                                    )
                                );
                            } catch (\Throwable $e) {
                                Log::warning('Fast Start bonus status email failed', [
                                    'creator_uuid' => $bonusRow->creator_uuid,
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        }
                    }
                }
            }

            if ($payout->status === 'paid') {
                try {
                    if (Schema::hasTable('founder_bonuses')) {
                        FounderBonus::where('stripe_payout_id', $payout->id)->where('payout_status', '!=', 'paid')->update([
                            'payout_status' => 'paid',
                            'paid_date' => now(),
                        ]);
                    }
                } catch (\Throwable $e) {
                    Log::error('FounderBonus payout sync failed', ['stripe_payout_id' => $payout->id, 'error' => $e->getMessage()]);
                }

                try {
                    if (Schema::hasTable('founder_bonus')) {
                        FounderBonusMonthly::where('stripe_payout_id', $payout->id)->where('payout_status', '!=', 'paid')->update([
                            'payout_status' => 'paid',
                            'payout_date' => now(),
                        ]);
                    }
                } catch (\Throwable $e) {
                    Log::error('FounderBonusMonthly payout sync failed', ['stripe_payout_id' => $payout->id, 'error' => $e->getMessage()]);
                }
            }

            // Founder payout failed/canceled at the bank: clear the Stripe ids on the
            // bonus row and revert it to pending, so the next founder payout run retries
            // it. Without this the stripe_payout_id guard would skip it forever.
            if (in_array($payout->status, ['failed', 'canceled'], true)) {
                try {
                    if (Schema::hasTable('founder_bonuses')) {
                        $revert = ['payout_status' => FounderBonus::STATUS_PENDING, 'paid_date' => null];
                        if (Schema::hasColumn('founder_bonuses', 'stripe_payout_id')) {
                            $revert['stripe_payout_id'] = null;
                        }
                        if (Schema::hasColumn('founder_bonuses', 'stripe_transfer_id')) {
                            $revert['stripe_transfer_id'] = null;
                        }
                        if (Schema::hasColumn('founder_bonuses', 'payout_record_uuid')) {
                            $revert['payout_record_uuid'] = null;
                        }
                        FounderBonus::where('stripe_payout_id', $payout->id)
                            ->where('payout_status', '!=', 'paid')
                            ->update($revert);
                    }
                } catch (\Throwable $e) {
                    Log::error('FounderBonus payout failure revert failed', ['stripe_payout_id' => $payout->id, 'error' => $e->getMessage()]);
                }

                try {
                    if (Schema::hasTable('founder_bonus')) {
                        $revertM = ['payout_status' => 'pending', 'payout_date' => null];
                        if (Schema::hasColumn('founder_bonus', 'stripe_payout_id')) {
                            $revertM['stripe_payout_id'] = null;
                        }
                        if (Schema::hasColumn('founder_bonus', 'stripe_transfer_id')) {
                            $revertM['stripe_transfer_id'] = null;
                        }
                        if (Schema::hasColumn('founder_bonus', 'payout_record_uuid')) {
                            $revertM['payout_record_uuid'] = null;
                        }
                        FounderBonusMonthly::where('stripe_payout_id', $payout->id)
                            ->where('payout_status', '!=', 'paid')
                            ->update($revertM);
                    }
                } catch (\Throwable $e) {
                    Log::error('FounderBonusMonthly payout failure revert failed', ['stripe_payout_id' => $payout->id, 'error' => $e->getMessage()]);
                }
            }

            // Check if payout was initiated by our platform (using local records or metadata)
            $isPlatformPayout = PayoutRecord::where('stripe_payout_id', $payout->id)->exists() ||
                (isset($payout->metadata) && (isset($payout->metadata->payout_run_id) || isset($payout->metadata->reason)));

            if (! $isPlatformPayout && $payout->status !== 'canceled' && $payout->status !== 'failed') {
                $accountId = $event->account ?? null;
                Log::critical("Stripe Risk: Unexpected payout created {$payout->id} on account {$accountId}.");

                if ($accountId) {
                    $creator = User::where('account_id', $accountId)->first();
                    if ($creator) {
                        try {
                            $creator->suspended_account = 1;
                            $creator->save();
                            $creator->tokens()->delete();

                            // Mark as HIGH RISK with minimum 20% reserve
                            $metrics = CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid]);
                            $metrics->risk_level = 'high';
                            $metrics->reserve_percent = max((int) $metrics->reserve_percent, 20);
                            $metrics->save();

                            Log::critical("Stripe Risk: Account {$accountId} locked and marked HIGH RISK due to unexpected manual payout creation.");
                        } catch (\Throwable $suspendEx) {
                            // Risk-critical: don't let the generic handler swallow this at error level.
                            // Surface it loudly — an unexpected manual payout that failed to lock the
                            // account needs manual intervention.
                            Log::critical("Stripe Risk: FAILED to suspend account {$accountId} after unexpected payout {$payout->id} — manual intervention required.", [
                                'error' => $suspendEx->getMessage(),
                            ]);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Error handling {$eventType} for risk monitoring: ".$e->getMessage());
        }
    }

    /**
     * A weekly payout-run payout failed/canceled at the bank. The money never left
     * the creator's Stripe balance, but the payments were marked as paid out — so they
     * would never be retried. Requeue them (clear payout_run_id on Payments and the
     * canonical FinancialTransaction ledger), revert the negative-balance change this run
     * applied, move the creator into the run's skipped list, and notify creator + admin.
     */
    private function requeueFailedRunPayout(PayoutRecord $record): void
    {
        try {
            $runId = $record->payout_run_id;
            $creatorId = $record->creator_id; // user uuid
            if (! $runId || ! $creatorId) {
                return;
            }

            $run = PayoutRun::find($runId);
            if (! $run) {
                return;
            }

            $creator = User::where('uuid', $creatorId)->first();

            DB::transaction(function () use ($runId, $creatorId, $creator, $run) {
                // Requeue base payments + refund/dispute adjustments tied to this run.
                Payment::where('creator_id', $creatorId)
                    ->where('payout_run_id', $runId)
                    ->update(['payout_run_id' => null]);
                Payment::where('creator_id', $creatorId)
                    ->where('adjustment_payout_run_id', $runId)
                    ->update(['adjustment_payout_run_id' => null]);

                // Un-stamp the canonical ledger so the "paid out" badge reverts and reserves
                // stay correctly attributed.
                if ($creator) {
                    FinancialTransaction::where('user_id', $creator->id)
                        ->where('payout_run_id', $runId)
                        ->update(['payout_run_id' => null]);
                }

                // Revert the negative-balance delta this run applied for the creator; the next
                // run recomputes it fresh from the requeued payments.
                $cdata = $run->totals['payouts'][$creatorId] ?? null;
                if ($cdata && isset($cdata['negative_balance_before'])) {
                    CreatorMetric::where('creator_id', $creatorId)->update([
                        'negative_balance_minor' => (int) $cdata['negative_balance_before'],
                        'updated_at' => now(),
                    ]);
                }

                // Move the creator from processed → skipped in the run totals for reporting.
                $totals = $run->totals;
                if (isset($totals['payouts'][$creatorId])) {
                    $moved = $totals['payouts'][$creatorId];
                    $moved['failure_reason'] = 'Stripe payout failed at bank — requeued for next run';
                    $moved['requeued_at'] = now()->toDateTimeString();
                    $totals['skipped_payouts'][$creatorId] = $moved;
                    unset($totals['payouts'][$creatorId]);
                    $run->totals = $totals;
                    $run->save();
                }
            });

            if ($creator) {
                Helpers::sendNotification(
                    'Payout failed',
                    'Your recent payout could not be completed due to a bank issue. It will be retried automatically in the next payout run — please verify your bank details.',
                    $creator->email
                );
            }

            $adminEmail = config('services.payout_notifications.weekly_job_email');
            if ($adminEmail) {
                Mail::to($adminEmail)->send(new CommandFailed(
                    '['.strtoupper(app()->environment()).'] Payout failed & requeued',
                    "Payout {$record->stripe_payout_id} for creator {$creatorId} failed ("
                        .($record->failure_message ?: 'unknown reason')
                        .'). Payments requeued for the next payout run.'
                ));
            }

            Log::warning("Payout failed & requeued: run {$runId}, creator {$creatorId}, payout {$record->stripe_payout_id}.");
        } catch (\Throwable $e) {
            Log::error('Failed to requeue failed payout: '.$e->getMessage());
        }
    }

    /**
     * Handle review.closed event
     */
    private function handleReviewClosed($review)
    {
        $paymentIntentId = $review->payment_intent ?? null;
        if (! $paymentIntentId) {
            return;
        }

        Log::info('Handling review.closed', [
            'review_id' => $review->id,
            'pi_id' => $paymentIntentId,
            'reason' => $review->reason,
        ]);

        if ($review->reason === 'approved') {
            $this->syncRiskLedgerStatus($paymentIntentId, 'succeeded');
        } elseif (str_contains($review->reason, 'refunded')) {
            $this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
        }
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
            $this->syncFinancialTransactionsByPaymentIntent($paymentIntentId, $newStatus);
            $this->syncSourcePaymentStatusesByPaymentIntent($paymentIntentId, $newStatus);

            $payment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if ($payment) {
                $payment->update([
                    'status' => $newStatus,
                    'platform_holds_funds' => in_array($newStatus, ['disputed', 'review_hold'], true),
                ]);
                Log::info("Risk Ledger: Synced payment status to {$newStatus}", ['id' => $payment->id]);

                // Also queue full sync as fallback (pass integer user_id, not UUID)
                if ($payment->creator_id) {
                    try {
                        $creator = User::where('uuid', $payment->creator_id)->first();
                        $intUserId = $creator ? $creator->id : null;
                        if ($intUserId) {
                            Artisan::queue('finance:sync-transactions', [
                                '--user_id' => $intUserId,
                            ]);

                            // Re-evaluate Refer & Earn GMV on any payment status change
                            Helpers::recalculateGmv($intUserId);

                            Log::info('Financial Sync queued for creator user_id: '.$intUserId);
                        }
                    } catch (\Exception $e) {
                        Log::error('Failed to queue financial sync: '.$e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to sync risk ledger status: '.$e->getMessage());
        }
    }

    private function syncSourcePaymentStatusesByPaymentIntent(string $paymentIntentId, string $newStatus): void
    {
        try {
            $sourceStatus = match ($newStatus) {
                'succeeded' => 'paid',
                'disputed' => 'disputed',
                'refunded' => 'refunded',
                'review_hold' => 'review_hold',
                'failed', 'blocked' => 'failed',
                default => $newStatus,
            };

            $riskPayment = Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

            $identifiers = array_values(array_unique(array_filter([
                $paymentIntentId,
                $riskPayment->stripe_session_id ?? null,
            ])));

            TipGoalsPayment::whereIn('session_id', $identifiers)->update(['status' => $sourceStatus]);

            PiggyPotContribution::whereIn('session_id', $identifiers)
                ->orWhere('payment_intent_id', $paymentIntentId)
                ->update(['status' => $sourceStatus]);

            ShopPayment::whereIn('session_id', $identifiers)->update(['payment_status' => $sourceStatus]);

            StripePaymentDetail::whereIn('session_id', $identifiers)
                ->orWhere('stripe_payment_intent_id', $paymentIntentId)
                ->update(['payment_status' => $sourceStatus]);

            MembershipPayment::whereIn('session_id', $identifiers)->update(['status' => $sourceStatus]);

            BillPayment::whereIn('session_id', $identifiers)->update(['status' => $sourceStatus]);

            Deliverable::whereIn('session_id', $identifiers)
                ->orWhere('payment_intent_id', $paymentIntentId)
                ->update(['payment_status' => $sourceStatus]);

            if ($sourceStatus === 'refunded') {
                Deliverable::whereIn('session_id', $identifiers)
                    ->orWhere('payment_intent_id', $paymentIntentId)
                    ->update(['status' => 'refunded']);
            }
        } catch (\Exception $e) {
            Log::error('syncSourcePaymentStatusesByPaymentIntent failed: '.$e->getMessage());
        }
    }

    /**
     * Directly update financial_transactions status for all source records linked to a payment intent.
     * This provides immediate consistency without waiting for the sync command queue.
     */
    private function syncFinancialTransactionsByPaymentIntent(string $paymentIntentId, string $newStatus): void
    {
        try {
            $ftStatus = match ($newStatus) {
                'succeeded' => 'completed',
                'disputed' => 'disputed',
                'refunded' => 'refunded',
                'review_hold' => 'review_hold',
                'failed', 'blocked' => 'failed',
                default => $newStatus,
            };

            // Resolve the checkout session for this PI. Many source records are keyed by
            // session_id, not payment_intent — the previous `orWhere($sessionCol, $paymentIntentId)`
            // compared a session column against the PI value and never matched them.
            $sessionId = Payment::where('stripe_payment_intent_id', $paymentIntentId)->value('stripe_session_id')
                ?? StripePaymentDetail::where('stripe_payment_intent_id', $paymentIntentId)->value('session_id');

            // Cascade a source record's OWN status only for terminal/negative outcomes.
            // A 'succeeded' sync must never overwrite a source 'paid' status with 'completed'.
            $sourceStatus = in_array($newStatus, ['refunded', 'disputed', 'failed', 'blocked', 'review_hold'], true)
                ? $newStatus
                : null;

            // [model, piColumn|null, sessionColumn|null, statusColumn]
            $sourceModels = [
                [TaskPurchase::class,         'payment_intent_id',        'stripe_session_id', 'status'],
                [PiggyPotContribution::class, 'payment_intent_id',        'session_id',        'status'],
                [TipGoalsPayment::class,      null,                       'session_id',        'status'],
                [ShopPayment::class,          null,                       'session_id',        'payment_status'],
                [StripePaymentDetail::class,  'stripe_payment_intent_id', 'session_id',        'payment_status'],
                [MembershipPayment::class,    null,                       'session_id',        'status'],
                [BillPayment::class,          null,                       'session_id',        'status'],
            ];

            foreach ($sourceModels as [$modelClass, $piCol, $sessionCol, $statusCol]) {
                $ids = [];
                if ($piCol) {
                    $ids = array_merge($ids, $modelClass::where($piCol, $paymentIntentId)->pluck('id')->all());
                }
                if ($sessionCol && $sessionId) {
                    $ids = array_merge($ids, $modelClass::where($sessionCol, $sessionId)->pluck('id')->all());
                }
                $ids = array_values(array_unique($ids));
                if (empty($ids)) {
                    continue;
                }

                if ($sourceStatus !== null) {
                    $modelClass::whereIn('id', $ids)->update([$statusCol => $sourceStatus]);
                }
                FinancialTransaction::where('source_type', $modelClass)
                    ->whereIn('source_id', $ids)
                    ->update(['status' => $ftStatus]);
            }

            // StripePaymentItems are children of StripePaymentDetail (by session); their own
            // FinancialTransactions (e.g. wish purchases) need the status propagated too.
            if ($sessionId) {
                $spdIds = StripePaymentDetail::where('session_id', $sessionId)->pluck('id')->all();
                if (! empty($spdIds)) {
                    $spiIds = StripePaymentItems::whereIn('stripe_payment_detail_id', $spdIds)->pluck('id')->all();
                    if (! empty($spiIds)) {
                        FinancialTransaction::where('source_type', StripePaymentItems::class)
                            ->whereIn('source_id', $spiIds)
                            ->update(['status' => $ftStatus]);
                    }
                }
            }

            // Deliverable + UserPayment carry the same terminal status (refund/dispute/etc.).
            if ($sourceStatus !== null) {
                $delIds = Deliverable::where('payment_intent_id', $paymentIntentId)
                    ->when($sessionId, fn ($q) => $q->orWhere('session_id', $sessionId))
                    ->pluck('id')->all();
                if (! empty($delIds)) {
                    Deliverable::whereIn('id', $delIds)
                        ->update(['status' => $sourceStatus, 'payment_status' => $sourceStatus]);
                }

                if ($sessionId) {
                    UserPayment::where('payment_details', json_encode($sessionId))
                        ->orWhere('payment_details', $sessionId)
                        ->update(['status' => $sourceStatus]);
                }
            }
        } catch (\Exception $e) {
            Log::error('syncFinancialTransactionsByPaymentIntent failed: '.$e->getMessage());
        }
    }

    /**
     * Handle Early Fraud Warning Updated
     */
    private function handleEarlyFraudWarningUpdated($efw)
    {
        Log::info('StripeWebhookController: Processing radar.early_fraud_warning.updated', [
            'efw_id' => $efw->id,
            'payment_intent' => $efw->payment_intent,
            'action' => $efw->action,
            'status' => $efw->status ?? null,
        ]);

        try {
            $warning = EarlyFraudWarning::where('stripe_efw_id', $efw->id)->first();

            if (! $warning) {
                Log::info('StripeWebhookController: Early Fraud Warning not found, processing as created', [
                    'efw_id' => $efw->id,
                ]);
                $this->handleEarlyFraudWarningCreated($efw);

                return;
            }

            $changes = [];
            $oldAction = $warning->action;
            $newAction = $efw->action ?? $oldAction;

            if ($oldAction !== $newAction) {
                $changes['action'] = [
                    'old' => $oldAction,
                    'new' => $newAction,
                ];
            }

            $warning->update([
                'stripe_charge_id' => $efw->charge,
                'updated_at' => now(),
            ]);

            Log::info('StripeWebhookController: Early Fraud Warning updated', [
                'fraud_warning_id' => $warning->id,
                'efw_id' => $efw->id,
                'action' => $newAction,
                'status' => $efw->status ?? null,
                'changes' => $changes,
            ]);

            if (! empty($changes)) {
                try {
                    $adminEmail = config('services.fraud_notifications.admin_email');
                    if ($adminEmail) {
                        $title = "⚠️ FRAUD WARNING UPDATED: {$efw->id}";
                        $content = "Action: {$efw->action}\nPrevious Action: {$oldAction}\nPayment Intent: {$efw->payment_intent}";

                        Helpers::sendNotification($title, $content, $adminEmail);
                        Log::info('StripeWebhookController: Admin notification sent for fraud warning update', [
                            'efw_id' => $efw->id,
                            'admin_email' => $adminEmail,
                        ]);

                        $adminUser = new User(['email' => $adminEmail]);
                        SendFraudWarningMailJob::dispatch($adminUser, $warning, 'updated');
                        Log::info('StripeWebhookController: Admin fraud warning updated email dispatched', [
                            'efw_id' => $efw->id,
                            'admin_email' => $adminEmail,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('StripeWebhookController: Failed to send admin notification for fraud warning update', [
                        'efw_id' => $efw->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            try {
                AuditLog::create([
                    'actor' => 'system',
                    'action_type' => 'EARLY_FRAUD_WARNING_UPDATED',
                    'reference_id' => (string) ($warning->payment_id ?? $warning->id),
                    'metadata_json' => [
                        'stripe_efw_id' => $efw->id,
                        'fraud_warning_id' => $warning->id,
                        'changes' => $changes,
                        'new_action' => $newAction,
                        'new_status' => $efw->status ?? null,
                    ],
                ]);
            } catch (\Exception $e) {
                Log::warning('StripeWebhookController: Failed to create audit log for early fraud warning update', [
                    'efw_id' => $efw->id,
                    'error' => $e->getMessage(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('StripeWebhookController: Failed to handle early fraud warning updated', [
                'efw_id' => $efw->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    // /**
    //  * Handle Early Fraud Warning Closed
    //  *
    //  * When Stripe sends this event:
    //  * - Mark fraud warning as closed
    //  * - Release reserve if applicable
    //  * - Call RiskService
    //  * - Notify creator
    //  * - Notify admins
    //  * - Queue email
    //  * - Log everything
    //  *
    //  * @param \Stripe\Radar\EarlyFraudWarning $efw
    //  * @return void
    //  */
    // private function handleEarlyFraudWarningClosed($efw)
    // {
    //     Log::info('StripeWebhookController: Processing radar.early_fraud_warning.closed', [
    //         'efw_id' => $efw->id,
    //         'payment_intent' => $efw->payment_intent,
    //         'charge' => $efw->charge,
    //         'action' => $efw->action,
    //     ]);

    //     try {
    //         $fraudWarning = \App\Models\EarlyFraudWarning::where('stripe_efw_id', $efw->id)->first();

    //         if (!$fraudWarning) {
    //             Log::info('StripeWebhookController: Early Fraud Warning not found for close event, attempting to create', [
    //                 'efw_id' => $efw->id,
    //             ]);
    //             $this->handleEarlyFraudWarningCreated($efw);

    //             $fraudWarning = \App\Models\EarlyFraudWarning::where('stripe_efw_id', $efw->id)->first();
    //             if (!$fraudWarning) {
    //                 Log::warning('StripeWebhookController: Failed to create Early Fraud Warning for close event', [
    //                     'efw_id' => $efw->id,
    //                 ]);
    //                 return;
    //             }
    //         }

    //         if ($fraudWarning->closed_at) {
    //             Log::info('StripeWebhookController: Early Fraud Warning already closed, skipping duplicate', [
    //                 'fraud_warning_id' => $fraudWarning->id,
    //                 'efw_id' => $efw->id,
    //                 'closed_at' => $fraudWarning->closed_at,
    //             ]);
    //             return;
    //         }

    //         $fraudWarning->update([
    //             'closed_at' => now(),
    //             'updated_at' => now(),
    //         ]);

    //         Log::info('StripeWebhookController: Early Fraud Warning marked as closed', [
    //             'fraud_warning_id' => $fraudWarning->id,
    //             'efw_id' => $efw->id,
    //             'closed_at' => now(),
    //         ]);

    //         try {
    //             $payment = $fraudWarning->payment;
    //             if ($payment && $payment->status === 'review_hold') {
    //                 $payment->update([
    //                     'status' => 'succeeded',
    //                     'platform_holds_funds' => false,
    //                 ]);

    //                 Log::info('StripeWebhookController: Payment hold released for closed fraud warning', [
    //                     'payment_id' => $payment->id,
    //                     'fraud_warning_id' => $fraudWarning->id,
    //                 ]);
    //             }

    //             $paymentIntentId = $efw->payment_intent;
    //             if ($paymentIntentId) {
    //                 $deliverable = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)->first();
    //                 if ($deliverable && $deliverable->status === 'review_hold') {
    //                     $deliverable->update([
    //                         'status' => 'delivered',
    //                         'payment_status' => 'paid',
    //                     ]);

    //                     try {
    //                         app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
    //                             'early_fraud_warning_closed' => true,
    //                             'fraud_warning_closed_at' => now()->toISOString(),
    //                         ]);
    //                     } catch (\Exception $e) {
    //                         Log::error('StripeWebhookController: Failed to update deliverable metadata for closed fraud warning', [
    //                             'fraud_warning_id' => $fraudWarning->id,
    //                             'error' => $e->getMessage(),
    //                         ]);
    //                     }
    //                 }
    //             }
    //         } catch (\Exception $e) {
    //             Log::error('StripeWebhookController: Failed to release hold for closed fraud warning', [
    //                 'efw_id' => $efw->id,
    //                 'error' => $e->getMessage(),
    //             ]);
    //         }

    //         try {
    //             $creator = $fraudWarning->creator;
    //             if ($creator) {
    //                 $this->riskService->recalculateMetrics($creator->uuid);
    //                 Log::info('StripeWebhookController: RiskService executed for closed fraud warning', [
    //                     'creator_uuid' => $creator->uuid,
    //                     'fraud_warning_id' => $fraudWarning->id,
    //                 ]);
    //             }
    //         } catch (\Exception $e) {
    //             Log::error('StripeWebhookController: RiskService execution failed for closed fraud warning', [
    //                 'fraud_warning_id' => $fraudWarning->id,
    //                 'error' => $e->getMessage(),
    //             ]);
    //         }

    //         // ✅ REMOVED: Creator notification and email
    //         // Only send admin notification
    //         try {
    //             $adminEmail = config('services.fraud_notifications.admin_email');
    //             if ($adminEmail) {
    //                 $title = "✅ FRAUD WARNING CLOSED: {$efw->id}";
    //                 $content = "Payment Intent: {$efw->payment_intent}\nCharge: {$efw->charge}\nAction: {$efw->action}";

    //                 \App\Helpers::sendNotification($title, $content, $adminEmail);

    //                 Log::info('StripeWebhookController: Admin notification sent for closed fraud warning', [
    //                     'fraud_warning_id' => $fraudWarning->id,
    //                     'admin_email' => $adminEmail,
    //                 ]);
    //             }
    //         } catch (\Exception $e) {
    //             Log::error('StripeWebhookController: Failed to send admin notification for closed fraud warning', [
    //                 'fraud_warning_id' => $fraudWarning->id,
    //                 'error' => $e->getMessage(),
    //             ]);
    //         }

    //         try {
    //             \App\Models\AuditLog::create([
    //                 'actor' => 'system',
    //                 'action_type' => 'EARLY_FRAUD_WARNING_CLOSED',
    //                 'reference_id' => (string) ($fraudWarning->payment_id ?? $fraudWarning->id),
    //                 'metadata_json' => [
    //                     'stripe_efw_id' => $efw->id,
    //                     'fraud_warning_id' => $fraudWarning->id,
    //                     'payment_intent' => $efw->payment_intent,
    //                     'charge' => $efw->charge,
    //                     'action' => $efw->action,
    //                     'closed_at' => now()->toISOString(),
    //                 ],
    //             ]);

    //             Log::info('StripeWebhookController: Audit log created for closed fraud warning', [
    //                 'fraud_warning_id' => $fraudWarning->id,
    //                 'efw_id' => $efw->id,
    //             ]);
    //         } catch (\Exception $e) {
    //             Log::error('StripeWebhookController: Failed to create audit log for closed fraud warning', [
    //                 'fraud_warning_id' => $fraudWarning->id,
    //                 'error' => $e->getMessage(),
    //             ]);
    //         }
    //     } catch (\Exception $e) {
    //         Log::error('StripeWebhookController: Failed to handle early fraud warning closed', [
    //             'efw_id' => $efw->id ?? null,
    //             'payment_intent' => $efw->payment_intent ?? null,
    //             'error' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //     }
    // }
}
