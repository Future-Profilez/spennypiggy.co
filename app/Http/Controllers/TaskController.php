<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\Deliverable;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\StripeClient;
use App\Mail\TaskPurchasedMail;
use App\Mail\TaskProofSubmittedMail;
use App\Mail\TaskProofAcceptedMail;
use App\Mail\TaskProofRejectedMail;
use App\Mail\TaskDisputeEscalatedMail;
use Illuminate\Support\Facades\Mail;
use App\Helpers;
use App\StripeControl;
use App\Models\Currency;
use Carbon\Carbon;
use App\Jobs\ProcessWishItemDeliverable;
use Illuminate\Support\Facades\Log;
use App\Services\UserProfileService;
use App\Services\StripeMetadataService;
use Illuminate\Support\Facades\App;
use App\Traits\RiskEnforcement;
use App\Services\CreatorSubscriptionService;
use App\Services\CreatorActivityService;
use App\Services\CreatorAvailabilityMessageService;
use App\Notifications\SubscriptionBlockedNotification;
use App\Notifications\PaymentBlockedNotification;

class TaskController extends Controller
{
    use RiskEnforcement;
    public function index()
    {
        $tasks = Task::where('creator_id', Auth::id())->orderBy('created_at', 'desc')->get();

        $orders = TaskPurchase::where('creator_id', Auth::id())
            ->whereIn('status', ['paid', 'assigned', 'pending_review', 'rejected_once', 'escalated', 'initiated', 'running_late'])
            ->with(['task', 'supporter'])
            ->orderBy('created_at', 'asc')
            ->get();

        $completed_orders = TaskPurchase::where('creator_id', Auth::id())
            ->whereIn('status', ['delivered', 'completed_accepted', 'completed', 'paid_out', 'refunded'])
            ->with(['task', 'supporter'])
            ->orderBy('created_at', 'desc')
            ->get();

        $purchased_tasks = TaskPurchase::where('supporter_id', Auth::id())
            ->with(['task.creator'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'orders' => $orders,
            'completed_orders' => $completed_orders,
            'purchased_tasks' => $purchased_tasks
        ]);
    }

    public function create()
    {
        if (Auth::user()->role !== 1) {
            return redirect()->route('task.dashboard')->with('error', 'Only creators can create tasks.');
        }

        $userCurrency = Auth::user()->default_currency ?? 'USD';
        $currencySymbol = Currency::where('ISO', $userCurrency)->value('symbol') ?? '$';

        return Inertia::render('Tasks/Create', [
            'currency' => $userCurrency,
            'currencySymbol' => $currencySymbol
        ]);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 1) {
            abort(403, 'Only creators can create tasks.');
        }

        $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'required|string',
            'price' => [
                'required',
                'numeric',
                'min:0.01',
                function ($attribute, $value, $fail) use ($request) {
                    $currency = Auth::user()->default_currency ?? 'USD';
                    $priceGBP = Helpers::priceFormat(strtoupper($currency), $value, 'GBP');

                    if ($priceGBP < 4.99) {
                        $fail('Paid Tasks must be at least £4.99 GBP equivalent.');
                    }
                    if ($priceGBP > 10000) {
                        $fail('Paid Tasks cannot exceed £10,000 GBP equivalent.');
                    }
                },
            ],
            'category' => 'required|string',
            'type' => 'required|in:instant,timed',
            'deliverable_file' => [
                'nullable',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->type === 'instant' && !$value && !$request->deliverable_note) {
                        $fail('Either a deliverable file or a note is required for instant delivery.');
                    }
                },
            ],
            'deliverable_note' => 'nullable|string',
            'media_file' => 'nullable',
            'sla_hours' => 'required_if:type,timed|integer|min:1|max:168',
        ]);

        if (Helpers::checkBlockData($request)) {
            return back()->withErrors(['title' => 'The task contains blocked words or phrases. Please check the title, description and deliverable content.']);
        }

        $task = new Task();
        $task->uuid = Str::uuid();
        $task->creator_id = Auth::id();
        $task->title = $request->title;
        $task->description = $request->description;
        $task->is_approved = false; // Default unapproved
        $task->price = $request->price;
        $task->currency = Auth::user()->default_currency ?? 'USD';
        $task->category = $request->category;
        $task->type = $request->type;
        $task->sla_hours = $request->type === 'timed' ? $request->sla_hours : null;
        $task->status = 'active'; // Admin skip
        $task->payment_methods_accepted = in_array($request->payment_methods_accepted, ['card', 'bank', 'both'], true) ? $request->payment_methods_accepted : 'both';

        if ($request->media_file) {
            $task->media_url = $request->media_file['url'] ?? null;
        }

        if ($request->type === 'instant') {
            if ($request->deliverable_file) {
                $task->deliverable_content = $request->deliverable_file['url'] ?? null;
                $task->deliverable_content_type = $request->deliverable_file['mimeType'] ?? null;
            }
            $task->deliverable_note = $request->deliverable_note;
        }

        $task->save();

        // SFW gate: AI-scan the task media; keep it unapproved if it fails moderation.
        $mediaUuid = $request->media_file['uuid'] ?? null;
        if (!empty($mediaUuid)) {
            \App\Jobs\CheckMediaModeration::dispatch(
                Task::class,
                $task->id,
                $mediaUuid,
                ['is_approved' => false]
            );
        }

        // Clear user caches
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return redirect()->route('task.dashboard')->with('success', 'Task created successfully.');
    }

    public function edit($uuid)
    {
        $task = Task::where('uuid', $uuid)->where('creator_id', Auth::id())->firstOrFail();

        // Lock edits if task has been purchased
        if (TaskPurchase::where('task_id', $task->id)->exists()) {
            return redirect()->route('task.dashboard')->with('error', 'This task cannot be edited because it has already been purchased.');
        }

        $userCurrency = Auth::user()->default_currency ?? 'USD';
        $currencySymbol = Currency::where('ISO', $userCurrency)->value('symbol') ?? '$';

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'currency' => $userCurrency,
            'currencySymbol' => $currencySymbol
        ]);
    }

    public function update(Request $request, $uuid)
    {
        $task = Task::where('uuid', $uuid)->where('creator_id', Auth::id())->firstOrFail();

        // Lock edits if task has been purchased
        if (TaskPurchase::where('task_id', $task->id)->exists()) {
            return redirect()->route('task.dashboard')->with('error', 'This task cannot be updated because it has already been purchased.');
        }

        $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'required|string',
            'price' => [
                'required',
                'numeric',
                'min:0.01',
                function ($attribute, $value, $fail) use ($request, $task) {
                    $currency = $task->currency ?? 'USD';
                    $priceGBP = Helpers::priceFormat(strtoupper($currency), $value, 'GBP');

                    if ($priceGBP < 4.99) {
                        $fail('Paid Tasks must be at least £4.99 GBP equivalent.');
                    }
                    if ($priceGBP > 10000) {
                        $fail('Paid Tasks cannot exceed £10,000 GBP equivalent.');
                    }
                },
            ],
            'category' => 'required|string',
            'type' => 'required|in:instant,timed',
            'deliverable_file' => [
                'nullable',
                function ($attribute, $value, $fail) use ($request, $task) {
                    if ($request->type === 'instant' && !$value && !$request->deliverable_note && !$task->deliverable_content) {
                        $fail('Either a deliverable file or a note is required for instant delivery.');
                    }
                },
            ],
            'deliverable_note' => 'nullable|string',
            'media_file' => 'nullable',
            'sla_hours' => 'required_if:type,timed|integer|min:1|max:168',
        ]);

        if (Helpers::checkBlockData($request)) {
            return back()->withErrors(['title' => 'The task contains blocked words or phrases. Please check the title, description and deliverable content.']);
        }

        $task->title = $request->title;
        $task->description = $request->description;
        $task->price = $request->price;
        $task->category = $request->category;
        $task->type = $request->type;
        $task->sla_hours = $request->type === 'timed' ? $request->sla_hours : null;

        if ($request->media_file) {
            $task->media_url = $request->media_file['url'] ?? null;
        }

        if ($task->is_approved == 2 || $task->is_approved == 1) {
            $task->is_approved = 0;
        }

        if ($request->type === 'instant') {
            if ($request->deliverable_file) {
                $task->deliverable_content = $request->deliverable_file['url'] ?? null;
                $task->deliverable_content_type = $request->deliverable_file['mimeType'] ?? null;
            }
            $task->deliverable_note = $request->deliverable_note;
        }

        $task->save();

        // Clear user caches
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return redirect()->route('task.dashboard')->with('success', 'Task updated successfully.');
    }

    public function show($uuid)
    {
        $task = Task::where('uuid', $uuid)->with('creator')->firstOrFail();

        // Visibility Check: Only Creator can see unapproved tasks
        if (!$task->is_approved && Auth::id() !== $task->creator_id) {
            abort(404);
        }

        $purchase = null;
        $purchaseHistory = [];

        if (Auth::check()) {
            if (Auth::id() !== $task->creator_id) {
                // Get all purchases for history
                $purchaseHistory = TaskPurchase::where('task_id', $task->id)
                    ->where('supporter_id', Auth::id())
                    ->whereIn('status', ['paid', 'delivered', 'assigned', 'pending_review', 'completed_accepted', 'rejected_once', 'escalated', 'sla_missed', 'refunded', 'initiated', 'completed', 'paid_out'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                // Get the latest one as the "active" purchase context if needed, or just use history
                $purchase = $purchaseHistory->first();
            }
        }

        if (Auth::id() !== $task->creator_id && !$purchase) {
            $task->makeHidden(['deliverable_content', 'deliverable_note', 'deliverable_content_type']);
        }

        $currencySymbol = Currency::where('ISO', $task->currency)->value('symbol') ?? '$';

        $card_capabilities = StripeControl::hasCardPaymentsCapability($task->creator->account_id);

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'purchase' => $purchase,
            'purchaseHistory' => $purchaseHistory,
            'isCreator' => Auth::id() === $task->creator_id,
            'deliverableUrl' => ($purchase && $task->type === 'instant' && in_array($purchase->status, ['paid', 'delivered', 'completed', 'completed_accepted'])) ? route('task.download', $task->uuid) : null,
            'currencySymbol' => $currencySymbol,
            'card_capabilities' => $card_capabilities
        ]);
    }

    public function download($uuid)
    {
        $task = Task::where('uuid', $uuid)->firstOrFail();

        if (!Auth::check()) {
            abort(403, 'Unauthorized');
        }

        $userId = Auth::id();

        if ($task->creator_id === $userId) {
            if (Str::startsWith($task->deliverable_content, ['http', 'https'])) {
                return redirect($task->deliverable_content);
            }
            return Storage::download($task->deliverable_content);
        }

        $purchase = TaskPurchase::where('task_id', $task->id)
            ->where('supporter_id', $userId)
            ->whereIn('status', ['paid', 'delivered', 'completed', 'completed_accepted', 'assigned', 'pending_review', 'rejected_once', 'escalated', 'sla_missed', 'paid_out'])
            ->latest()
            ->first();

        if (!$purchase) {
            // Debug logging for troubleshooting
            \Illuminate\Support\Facades\Log::info("Download failed - No valid purchase found", [
                'task_id' => $task->id,
                'user_id' => $userId,
                'uuid' => $uuid
            ]);

            // Check for any purchase to provide better error message
            $anyPurchase = TaskPurchase::where('task_id', $task->id)
                ->where('supporter_id', $userId)
                ->first();

            if ($anyPurchase) {
                \Illuminate\Support\Facades\Log::info("Download failed - Invalid status", [
                    'status' => $anyPurchase->status
                ]);
                abort(403, 'Purchase status not allowed: ' . $anyPurchase->status);
            }
            abort(403, 'Purchase required');
        }

        if (Str::startsWith($task->deliverable_content, ['http', 'https'])) {
            return redirect($task->deliverable_content);
        }
        return Storage::download($task->deliverable_content);
    }

    public function purchase(Request $request, $uuid)
    {
        // Stripe compliance: paid tasks require an account (order tracked until delivery).
        // Guest checkout is only allowed for Piggy Pot and Wishes.
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please log in or create an account to purchase — your order needs an account so it can be tracked through to delivery.');
        }

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }
        $task = Task::where('uuid', $uuid)->firstOrFail();

        // Prevent purchasing unapproved tasks
        if (!$task->is_approved && Auth::id() !== $task->creator_id) {
            abort(404);
        }

        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // A creator cannot purchase their own task.
        if ((int) Auth::id() === (int) $task->creator_id) {
            return redirect()->back()->with('error', 'You cannot purchase your own task.');
        }

        $creator = $task->creator;

        // NEW: Check creator subscription eligibility first
        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($creator);

        if (!$subscriptionCheck['eligible']) {
            // Send notification to creator about blocked payment
            $creator->notify(new SubscriptionBlockedNotification($subscriptionCheck, $task->price));

            // Log the blocked payment for subscription issues
            Log::warning('Task payment blocked due to subscription issue', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'task_id' => $task->id,
                'task_price' => $task->price,
                'subscription_status' => $subscriptionCheck['status'],
                'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown'
            ]);

            // Return user-friendly error to fan
            return redirect()->back()->with(
                'error',
                app(CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
            );
        }

        // NEW: Check creator activity eligibility
        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($creator);

        if (!$activityCheck['eligible']) {
            // Send notification to creator about blocked payment
            $creator->notify(new PaymentBlockedNotification($activityCheck, $task->price));

            // Log the blocked payment for analytics
            Log::info('Task purchase blocked due to insufficient creator activity', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'task_id' => $task->id,
                'task_price' => $task->price,
                'activity_status' => $activityCheck['status'],
                'content_count' => $activityCheck['content_count'] ?? 0
            ]);

            // Return user-friendly error to fan
            return redirect()->back()->with(
                'error',
                app(CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
            );
        }

        // Log successful activity check for analytics
        if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
            Log::info('Task purchase allowed - creator activity check passed', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'activity_status' => $activityCheck['status'],
                'content_count' => $activityCheck['content_count'] ?? 0
            ]);
        }

        // Currency Handling
        $currency = strtolower($task->currency ?? 'usd');
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        // Fee Calculations
        $adminFeeConfig = config('app.administration_fee', 1);
        $platformFeePercent = config('app.platform_fee_percentage', 20);
        $vatPercent = $creator->vat_amount_percentage ?? 0;

        $this->ensureTurnstileVerified($request);

        $request->validate([
            'digital_waiver' => ['required', 'accepted'],
        ]);

        $gifterMessage = $request->input('gifter_message');
        if ($msgErr = Helpers::validateSupporterMessage($gifterMessage)) {
            return back()->with('error', $msgErr);
        }

        $price = $task->price;

        // Enforce Paid Task limits in GBP (min £5)
        if ($task->type !== 'instant') {
            $priceGBP = Helpers::priceFormat(strtoupper($currency), $price, 'GBP');
            if ($priceGBP < 5) {
                return back()->with('error', 'Paid Task price must be at least £5.');
            }
        }

        // Use gross-up flow helper
        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        $vatAmount = $price * $vatPercent / 100;
        $priceWithVat = $price + $vatAmount;

        // Resolve requested payment method (card|bank) against listing
        // preference, progressive tiers, and creator capabilities.
        $methodResolution = \App\Services\CheckoutMethodResolver::resolve(
            $request->input('payment_method', 'card'),
            $task->payment_methods_accepted ?? 'both',
            $priceWithVat,
            $currency,
            $user,
            $user->email ?? null,
            $creator->account_id
        );
        if (!($methodResolution['ok'] ?? false)) {
            return back()->with('error', $methodResolution['message']);
        }

        $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $currency, 0, $methodResolution['fee_profile']);

        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $creatorNet = $breakdown['net_to_creator'];
        $adminFee = $breakdown['admin_fee'] ?? 0;
        $applicationFeeAmount = $breakdown['application_fee'] ?? 0;
        $creatorTransferAmount = round($priceWithVat, $multiplier === 1 ? 0 : 2, PHP_ROUND_HALF_UP);
        $platformFee = max(0, $finalTotalAmount - $creatorTransferAmount);

        // Unified Risk Enforcement
        $riskData = $this->enforceRiskChecks(
            $request,
            $creator,
            $finalTotalAmount,
            $currency,
            'task_purchase',
            false // redirect response
        );

        if ($riskData instanceof \Illuminate\Http\RedirectResponse) {
            return $riskData;
        }

        $lineItems = [
            [
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => "Total value of item including all fees",
                        'description' => "You are purchasing a digital task. Delivery method: " . ucfirst($task->type) . ".",
                        'images' => $task->media_url ? [asset($task->media_url)] : [],
                    ],
                    'unit_amount' => round($finalTotalAmount * $multiplier),
                ]
            ]
        ];

        // Prepare Transfer Data
        $connectedAccountId = $creator->account_id;
        $hasCardPayments = $methodResolution['fee_profile'] !== 'card'
            || StripeControl::hasCardPaymentsCapability($connectedAccountId);

        if (!$hasCardPayments) {
            $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return redirect()->back()->with('error', app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
        }

        $appUrl = rtrim(config('app.url'), '/');

        $paymentType = $task->type === 'instant' ? 'STANDARD - Destination Charge' : 'PAID_TASK - Destination Charge';

        $complianceMetadata = Helpers::buildStripeMetadata('task_purchase', $task, [
            'buyer_id' => $user->id,
            'task_type' => $task->type,
            'sla_hours' => (string) ($task->sla_hours ?? 0),
            'payment_type' => $paymentType,
            'currency' => strtoupper($currency),
            'item_amount' => (string) round($price * $multiplier),
            'vat_percent' => (string) $vatPercent,
            'vat_amount' => (string) round($vatAmount * $multiplier),
            'admin_fee' => (string) round($adminFee * $multiplier),
            'platform_fee' => (string) round($platformFee * $multiplier),
            'creator_net_amount' => (string) round($creatorNet * $multiplier),
            'platform_fee_amount' => (string) round($platformFee * $multiplier),
            'total_charge_amount' => (string) round($finalTotalAmount * $multiplier),
            'transfer_amount' => (string) round($creatorTransferAmount * $multiplier),
            'has_card_payments' => (string) $hasCardPayments,
            'fee_profile' => $methodResolution['fee_profile'],
            'digital_waiver_confirmed_at' => now()->toDateTimeString(),
            'digital_waiver_text' => Helpers::DIGITAL_WAIVER_TEXT,
            'gifter_message' => Str::limit((string) ($gifterMessage ?? ''), 450),
        ]);

        $payload = [
            'payment_method_types' => $methodResolution['payment_method_types'],
            'line_items' => $lineItems,
            'mode' => 'payment',
            'payment_intent_data' => [
                'receipt_email' => $user->email,
                'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
                'metadata' => $complianceMetadata,
            ],
            'success_url' => route('task.success', ['uuid' => $task->uuid]) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $appUrl . '/task/' . $task->uuid,
            'customer_email' => $user->email,
            'metadata' => $complianceMetadata,
        ];

        $force3DS = $methodResolution['fee_profile'] === 'card'
            && (in_array('FORCE_3DS', $riskData['reason_codes'] ?? []) || $methodResolution['force_3ds']);

        // Check if we need to force 3DS
        if ($force3DS) {
            $payload['payment_method_options'] = [
                'card' => [
                    'request_three_d_secure' => 'any',
                ],
            ];
        }

        $session = StripeControl::createCheckoutSession($payload, $connectedAccountId, $force3DS, $creator->username);

        try {
            $payment = Payment::firstOrCreate(
                ['stripe_session_id' => $session->id],
                [
                    'creator_id' => $creator->uuid,
                    'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                    'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) round($finalTotalAmount * $multiplier), strtoupper($currency)),
                    'reserve_amount_minor' => (function () use ($creator, $creatorNet, $currency, $multiplier) {
                        $creatorNetMinor = (int) round($creatorNet * $multiplier);
                        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $creator->uuid);
                        $reserveRate = app(\App\Services\Risk\ReservePolicy::class)->getEffectiveReservePercent($creator, $metrics, now());
                        if ($reserveRate <= 0) return 0;
                        $reserveMinor = (int) round(($creatorNetMinor * $reserveRate) / 100);
                        return app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor($reserveMinor, strtoupper($currency));
                    })(),
                    'currency' => 'gbp',
                    'stripe_payment_intent_id' => $session->payment_intent ?? null,
                    'status' => 'initiated',
                    'reason_codes' => $riskData['reason_codes'] ?? [],
                ]
            );

            $payment->save();
        } catch (\Exception $e) {
            Log::warning('Risk Ledger: Failed to record task purchase payment', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);
        }

        return Inertia::location($session->url);
    }

    public function success(Request $request, $uuid)
    {
        Log::info('come at success method');
        $sessionId = $request->query('session_id');

        $task = Task::where('uuid', $uuid)
            ->with('creator')
            ->firstOrFail();

        Stripe::setApiKey(config('services.stripe.secret'));

        $session = Session::retrieve(
            $sessionId,
            ['stripe_account' => $task->creator->account_id]
        );

        $purchase = null;

        $isPaid = $session->payment_status === 'paid';
        $isLocal = App::environment('local');

        if ($isPaid || $isLocal) {

            $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();

            if (!$purchase) {
                $purchase = $this->createTaskPurchaseSync($session, $task);
            }

            if ($purchase && in_array($purchase->status, ['pending', 'paid']) && $task->type === 'instant') {

                $purchase->status = 'completed';
                $purchase->completed_at = now();
                $purchase->save();

                Helpers::addGmv(
                    $purchase->creator_id,
                    (float) $purchase->amount,
                    $purchase->creator->default_currency
                );

                $deliverable = Deliverable::where('order_id', $purchase->id)->first();

                if ($deliverable) {
                    $deliverable->status = 'delivered';
                    $deliverable->delivered_at = now();
                    $deliverable->save();
                }
            }
        } else {
            // Delayed-settlement bank methods (SEPA/ACH) complete the session
            // before the debit clears — fulfilment happens via the
            // async_payment_succeeded webhook.
            if (($session->metadata->fee_profile ?? 'card') === 'bank' && $session->payment_status !== 'paid') {
                return redirect('/task/' . $uuid)
                    ->with('success', 'Payment received — your bank payment is processing. Your content unlocks as soon as it clears.');
            }

            return redirect('/task/' . $uuid)->with('error', 'Payment not completed.');
        }

        $displayAmount = $session->amount_total / 100;

        if ($purchase && auth()->check()) {

            // CREATOR VIEW
            if (auth()->user()->role == 1) {

                $displayAmount = (float) $purchase->transfer_amount;
            } else {

                // GIFTER VIEW
                $displayAmount = $purchase->total_paid > 0
                    ? (float) $purchase->total_paid
                    : (
                        (float) $purchase->amount +
                        (float) $purchase->platform_fee +
                        (float) $purchase->vat_amount
                    );
            }
        }

        $thankYouParams = [
            'username' => $task->creator->username,
            'type' => 'task',
            'item_name' => $task->title,
            'amount' => $displayAmount,
            'currency' => $session->currency ?? 'GBP',
            'item_id' => $task->uuid,
            'is_instant' => $task->type === 'instant' ? '1' : '0',
            'source' => 'task_purchases',
            'source_id' => $purchase?->id,
        ];

        if ($task->type === 'instant' && $task->deliverable_content) {
            $contentUrl = $task->deliverable_content;
            if (!\Illuminate\Support\Str::startsWith($contentUrl, ['http://', 'https://'])) {
                $contentUrl = 'https://ucarecdn.com/' . $contentUrl . '/';
            }

            $thankYouParams['wish_content'] = [
                'type' => $task->deliverable_content_type ?? 'image',
                'name' => 'Task Content',
                'url' => $contentUrl
            ];
        }
        Log::info('Redirecting to thank you page after task purchase', [
            'thank_you_params' => $thankYouParams
        ]);

        return to_route('thank-you', $thankYouParams)->with('success', 'Payment Successful.');
    }



    /**
     * Synchronously create task purchase if webhook is delayed
     */
    private function createTaskPurchaseSync($session, $task)
    {
        // Double check to avoid race condition
        $existing = TaskPurchase::where('stripe_session_id', $session->id)->first();
        if ($existing) return $existing;

        $metadata = $session->metadata;

        // If session metadata is empty (because we moved it to PaymentIntent), try to fetch from PI
        if (empty($metadata->buyer_id) && !empty($session->payment_intent)) {
            try {
                $client = new StripeClient(config('services.stripe.secret'));
                $piId = is_string($session->payment_intent) ? $session->payment_intent : $session->payment_intent->id;
                $pi = $client->paymentIntents->retrieve($piId);
                if ($pi && $pi->metadata) {
                    $metadata = $pi->metadata;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to retrieve metadata from PI for task purchase', ['pi' => $session->payment_intent]);
            }
        }

        $taskId = (!empty($metadata->task_id)) ? $metadata->task_id : $task->id;
        $buyerId = (!empty($metadata->buyer_id)) ? $metadata->buyer_id : null;
        $creatorId = (!empty($metadata->creator_id)) ? $metadata->creator_id : $task->creator_id;

        $currency = strtoupper($session->currency ?? ($task->currency ?? 'GBP'));
        $currencyModel = \App\Models\Currency::where('ISO', $currency)->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $itemAmountMinor = $metadata->item_amount ?? null;
        $amount = $itemAmountMinor !== null ? ((float) $itemAmountMinor / $multiplier) : ((float) ($session->amount_total ?? 0) / $multiplier);

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
                Log::warning('Failed to retrieve charge_id for task purchase', ['pi' => $session->payment_intent]);
            }
        }

        $vat = isset($metadata->vat_amount) ? ((float) $metadata->vat_amount / $multiplier) : 0;
        $vatPercent = (float) ($metadata->vat_percent ?? 0);
        if ((!$vat || $vat <= 0) && $vatPercent > 0) {
            $vat = round(((float) $amount * $vatPercent) / 100, 2, PHP_ROUND_HALF_UP);
        }
        $adminFee = isset($metadata->admin_fee) ? ((float) $metadata->admin_fee / $multiplier) : 0;
        $platformFee = isset($metadata->platform_fee) ? ((float) $metadata->platform_fee / $multiplier) : 0;
        $transferAmount = isset($metadata->transfer_amount) ? ((float) $metadata->transfer_amount / $multiplier) : 0;

        // Create TaskPurchase
        $purchase = TaskPurchase::create([
            'task_id' => $taskId,
            'supporter_id' => $buyerId,
            'creator_id' => $creatorId,
            'stripe_session_id' => $session->id,
            'payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : ($session->payment_intent->id ?? null),
            'charge_id' => $chargeId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'paid', // Always paid in sync handler (and especially for local dev)
            'payment_type' => $metadata->payment_type ?? 'STANDARD',
            'fee_profile' => $metadata->fee_profile ?? 'card',
            'gifter_message' => $metadata->gifter_message ?? null,
            'admin_fee' => $adminFee,
            'platform_fee' => $platformFee,
            'vat_amount' => $vat,
            'transfer_amount' => $transferAmount,
            'dispute_status' => 'none',
            'digital_waiver_confirmed_at' => $metadata->digital_waiver_confirmed_at ?? null,
            'digital_waiver_text' => $metadata->digital_waiver_text ?? null,
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
            'creator_id' => $creatorId,
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
            'digital_waiver_confirmed_at' => $metadata->digital_waiver_confirmed_at ?? null,
            'digital_waiver_text' => $metadata->digital_waiver_text ?? null,
            'metadata' => json_encode(array_merge((array)$metadata, [
                'currency' => $currency
            ])),
        ]);

        // Dispatch job to process the deliverable (certificate generation)
        ProcessWishItemDeliverable::dispatchSync($deliverable);

        // Initial Metadata Sync (ensure payment_status is 'paid' on Stripe)
        try {
            app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to sync initial metadata in createTaskPurchaseSync: " . $e->getMessage());
        }

        if ($task->type === 'instant') {
            $purchase->status = 'completed';
            $purchase->completed_at = Carbon::now();
            $purchase->save();

            // Update Metadata
            try {
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                        'task_type' => 'instant'
                    ]);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to update metadata on instant task completion: " . $e->getMessage());
            }

            $deliverable->status = 'delivered';
            $deliverable->delivered_at = Carbon::now();
            $deliverable->save();
        }

        try {
            $creator = User::find($creatorId);
            $supporter = $buyerId ? User::find($buyerId) : null;

            if ($creator) {
                if ($creator->notification_send == 1) {
                    Mail::to($creator->email)->send(new TaskPurchasedMail($purchase, $task, $supporter));
                }

                Helpers::sendNotification(
                    "New Task Order! 💰",
                    ($supporter ? $supporter->name : "A Guest") . " purchased your task: " . $task->title,
                    $creator->email
                );
            }

            if ($supporter && $supporter->notification_send == 1) {
                Mail::to($supporter->email)->send(new \App\Mail\TaskPurchasedSupporterMail($purchase, $task, $supporter));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send task purchase email/notification in sync handler", ['error' => $e->getMessage()]);
        }

        return $purchase;
    }

    public function uploadProof(Request $request, $uuid)
    {
        $purchase = TaskPurchase::where('uuid', $uuid)->firstOrFail();

        if (Auth::id() !== $purchase->creator_id) {
            abort(403);
        }

        $request->validate([
            'proof_file' => 'required',
            'notes' => 'nullable|string'
        ]);

        $fileData = $request->proof_file;
        $fileUrl = $fileData['url'] ?? null;
        $fileName = $fileData['name'] ?? 'proof_file';
        $mimeType = $fileData['mimeType'] ?? null;

        if (!$fileUrl) {
            return back()->withErrors(['proof_file' => 'Invalid file upload. Please try again.']);
        }

        $purchase->proof_content = [
            'file' => $fileUrl,
            'name' => $fileName,
            'mime_type' => $mimeType,
            'notes' => $request->notes,
            'uploaded_at' => now()->toIso8601String(),
            'is_external' => true
        ];

        $purchase->status = 'pending_review';
        $purchase->save();

        // Update Metadata
        try {
            $deliverable = Deliverable::where('order_id', $purchase->id)->first();
            if ($deliverable) {
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                    'proof_uploaded_at' => now()->toIso8601String()
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to update metadata on proof upload: " . $e->getMessage());
        }

        try {
            $supporter = $purchase->supporter;
            $task = $purchase->task;
            $creator = Auth::user();

            if ($supporter && $supporter->notification_send == 1) {
                Mail::to($supporter->email)->send(new TaskProofSubmittedMail($purchase, $task, $creator));

                Helpers::sendNotification(
                    "Proof Submitted! 🚀",
                    $creator->name . " submitted proof for task: " . $task->title,
                    $supporter->email
                );
            }
        } catch (\Exception $e) {
        }

        return back()->with('success', 'Proof uploaded successfully. Waiting for supporter review.');
    }

    public function reviewProof(Request $request, $uuid)
    {
        $purchase = TaskPurchase::where('uuid', $uuid)->firstOrFail();

        if (Auth::id() !== $purchase->supporter_id) {
            abort(403);
        }

        $request->validate([
            'action' => 'required|in:accept,reject',
            'reason' => 'required_if:action,reject|nullable|string'
        ]);

        $creator = $purchase->creator;
        $task = $purchase->task;
        $supporter = Auth::user();

        if ($request->action === 'accept') {
            // Check if it was a dispute (escalated)
            $wasDispute = $purchase->status === 'escalated';

            $purchase->status = 'completed_accepted';
            $purchase->completed_at = now();
            $purchase->reviewed_at = now();

            if ($wasDispute) {
                $purchase->dispute_status = 'won';
            }

            $purchase->save();

            // Update Metadata
            try {
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $metadata = [
                        'proof_status' => 'accepted',
                        'accepted_by' => 'supporter'
                    ];

                    if ($wasDispute) {
                        $metadata['dispute_resolution'] = 'supporter_accepted';
                        $metadata['dispute_status'] = 'won';
                    }

                    app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, $metadata);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to update metadata on proof acceptance: " . $e->getMessage());
            }

            // Update Deliverable Status
            try {
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'delivered';
                    $deliverable->delivered_at = now();
                    // If task has content URL, ensure it's set in deliverable_url?
                    // Usually deliverable_url for tasks might be the proof file or task content.
                    // If task type is instant, it's already set. 
                    // For timed task, maybe we set it to proof file URL?
                    if (isset($purchase->proof_content['file'])) {
                        $deliverable->deliverable_url = $purchase->proof_content['file'];
                    }
                    $deliverable->save();
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to update deliverable status (proof accepted): " . $e->getMessage());
            }

            try {
                if ($creator && $creator->notification_send == 1) {
                    Mail::to($creator->email)->send(new TaskProofAcceptedMail($purchase, $task, $supporter));
                    Helpers::sendNotification(
                        "Proof Accepted! ✅",
                        $supporter->name . " accepted your proof for task: " . $task->title,
                        $creator->email
                    );
                }
            } catch (\Exception $e) {
            }

            // Delayed transfer for PAID_TASK - Direct Charge handling
            if (($purchase->payment_type ?? 'STANDARD') === 'PAID_TASK') {
                $purchase->status = 'paid_out';
                $purchase->save();

                \Illuminate\Support\Facades\Log::info('Paid Task marked as paid_out (Direct Charge)', [
                    'purchase_id' => $purchase->id,
                    'payment_intent' => $purchase->payment_intent_id
                ]);

                // Update Metadata with new status (paid_out / transferred)
                try {
                    $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                    if ($deliverable) {
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'transfer_status' => 'transferred',
                            'current_status_of_order' => 'paid_out',
                            'payment_status' => 'paid'
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to update metadata after marking paid_out: " . $e->getMessage());
                }
            }
        } else {
            // Increment rejection count
            $purchase->rejection_count += 1;
            $purchase->reviewed_at = now();

            // If rejected 2 or more times, escalate to Admin
            if ($purchase->rejection_count >= 2) {
                $purchase->status = 'escalated';
                $purchase->dispute_status = 'open';
                $purchase->rejection_reason = $request->reason;
                $purchase->save();

                // Update Metadata
                try {
                    $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                    if ($deliverable) {
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'dispute_status' => 'open',
                            'escalation_reason' => $request->reason
                        ]);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to update metadata on escalation: " . $e->getMessage());
                }

                // Notify Creator
                try {
                    if ($creator->notification_send == 1) {
                        Mail::to($creator->email)->send(new TaskDisputeEscalatedMail($purchase, $task, $creator, 'creator'));
                    }
                    Helpers::sendNotification("Dispute Escalated ⚠️", "Task dispute escalated to admin for '{$task->title}'", $creator->email);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify creator about escalation: " . $e->getMessage());
                }

                // Notify Supporter
                try {
                    if ($supporter->notification_send == 1) {
                        Mail::to($supporter->email)->send(new TaskDisputeEscalatedMail($purchase, $task, $supporter, 'supporter'));
                    }
                    Helpers::sendNotification("Dispute Escalated ⚠️", "Task dispute escalated to admin for '{$task->title}'", $supporter->email);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify supporter about escalation: " . $e->getMessage());
                }

                // Notify Admin (via email)
                try {
                    $appUrl = config('app.url'); // e.g. https://dev.spennypiggy.co

                    if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
                        Mail::to('prem@futureprofilez.com')->send(new TaskDisputeEscalatedMail($purchase, $task, null, 'admin'));
                    } elseif ($appUrl == 'https://spennypiggy.co') {
                        Mail::to('support@spennypiggy.co')->send(new TaskDisputeEscalatedMail($purchase, $task, null, 'admin'));
                    }
                    // Send to admin support email
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify admin about escalation: " . $e->getMessage());
                }
            } else {
                $purchase->status = 'rejected_once';
                $purchase->rejection_reason = $request->reason;
                $purchase->save();

                // Update Metadata
                try {
                    $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                    if ($deliverable) {
                        app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, [
                            'status' => 'rejected_once',
                            'rejection_reason' => $request->reason
                        ]);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to update metadata on rejection: " . $e->getMessage());
                }

                // Notify Creator about rejection
                try {
                    if ($creator->notification_send == 1) {
                        Mail::to($creator->email)->send(new TaskProofRejectedMail($purchase, $task, $supporter));
                    }
                    Helpers::sendNotification("Proof Rejected ❌", "Proof rejected for '{$task->title}'. Please review.", $creator->email);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify creator about rejection: " . $e->getMessage());
                }
            }
        }

        return back()->with('success', 'Review submitted successfully.');
    }

    public function order($uuid)
    {
        $purchase = TaskPurchase::where('uuid', $uuid)->with(['task', 'supporter', 'creator'])->first();
        if (!$purchase) {
            abort(404);
        }

        if (Auth::id() !== $purchase->supporter_id && Auth::id() !== $purchase->creator_id) {
            abort(403);
        }

        $currencySymbol = \App\Models\Currency::where('ISO', $purchase->task->currency)->value('symbol') ?? '$';

        return Inertia::render('Tasks/Order', [
            'purchase' => $purchase,
            'task' => $purchase->task,
            'isCreator' => Auth::id() === $purchase->creator_id,
            'isSupporter' => Auth::id() === $purchase->supporter_id,
            'currencySymbol' => $currencySymbol,
            'gracePeriodHours' => config('tasks.grace_period_hours', 1),
        ]);
    }
}
