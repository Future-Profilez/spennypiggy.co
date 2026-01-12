<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\Deliverable;
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

class TaskController extends Controller
{
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
        $currencySymbol = \App\Models\Currency::where('ISO', $userCurrency)->value('symbol') ?? '$';

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
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => [
                'required',
                'numeric',
                'min:1',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->type === 'timed') {
                        $currency = Auth::user()->default_currency ?? 'USD';
                        $priceGBP = Helpers::priceFormat(strtoupper($currency), $value, 'GBP');
                        
                        if ($priceGBP < 5) {
                            $fail('Paid Tasks must be at least £5 GBP equivalent.');
                        }
                        if ($priceGBP > 500) {
                            $fail('Paid Tasks cannot exceed £500 GBP equivalent.');
                        }
                    }
                },
            ],
            'category' => 'nullable|string',
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

        // Clear user caches
        $user = Auth::user();
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return redirect()->route('task.dashboard')->with('success', 'Task created successfully.');
    }

    public function edit($uuid)
    {
        $task = Task::where('uuid', $uuid)->where('creator_id', Auth::id())->firstOrFail();
        $userCurrency = Auth::user()->default_currency ?? 'USD';
        $currencySymbol = \App\Models\Currency::where('ISO', $userCurrency)->value('symbol') ?? '$';

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'currency' => $userCurrency,
            'currencySymbol' => $currencySymbol
        ]);
    }

    public function update(Request $request, $uuid)
    {
        $task = Task::where('uuid', $uuid)->where('creator_id', Auth::id())->firstOrFail();

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => [
                'required',
                'numeric',
                'min:1',
                function ($attribute, $value, $fail) use ($request, $task) {
                    // Use task's existing currency if not updating type, but usually currency is fixed per task or user default?
                    // Task model has currency field. We should use that or User's default if it's being updated.
                    // The update method doesn't seem to update currency field in the code I read earlier (lines 166-185), 
                    // it only updates title, description, price, etc.
                    // So we use $task->currency.
                    
                    if ($request->type === 'timed') {
                        $currency = $task->currency ?? 'USD';
                        $priceGBP = Helpers::priceFormat(strtoupper($currency), $value, 'GBP');
                        
                        if ($priceGBP < 5) {
                            $fail('Paid Tasks must be at least £5 GBP equivalent.');
                        }
                        if ($priceGBP > 500) {
                            $fail('Paid Tasks cannot exceed £500 GBP equivalent.');
                        }
                    }
                },
            ],
            'category' => 'nullable|string',
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

        $task->title = $request->title;
        $task->description = $request->description;
        $task->price = $request->price;
        $task->category = $request->category;
        $task->type = $request->type;
        $task->sla_hours = $request->type === 'timed' ? $request->sla_hours : null;

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

        $currencySymbol = \App\Models\Currency::where('ISO', $task->currency)->value('symbol') ?? '$';

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'purchase' => $purchase,
            'purchaseHistory' => $purchaseHistory,
            'isCreator' => Auth::id() === $task->creator_id,
            'deliverableUrl' => ($purchase && $task->type === 'instant' && in_array($purchase->status, ['paid', 'delivered', 'completed', 'completed_accepted'])) ? route('task.download', $task->uuid) : null,
            'currencySymbol' => $currencySymbol
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
        $task = Task::where('uuid', $uuid)->firstOrFail();

        // Prevent purchasing unapproved tasks
        if (!$task->is_approved && Auth::id() !== $task->creator_id) {
            abort(404);
        }

        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $creator = $task->creator;

        // Currency Handling
        $currency = strtolower($task->currency ?? 'usd');
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        // Fee Calculations
        $adminFeeConfig = config('app.administration_fee', 0.50); // Default 0.50 if not set
        $platformFeePercent = config('app.platform_fee_percentage', 20);
        $vatPercent = $creator->vat_amount_percentage ?? 0;

        $price = $task->price;
        
        // Enforce Paid Task limits in GBP (min £5, max £500)
        if ($task->type !== 'instant') {
            $priceGBP = Helpers::priceFormat(strtoupper($currency), $price, 'GBP');
            if ($priceGBP < 5) {
                return back()->with('error', 'Paid Task price must be at least £5.');
            }
            if ($priceGBP > 500) {
                return back()->with('error', 'Paid Task price cannot exceed £500.');
            }
        }
        
        // 1. Creator VAT
        $creatorVatAmount = round($price * ($vatPercent / 100), 2);

        // 2. Admin Fee (Convert from GBP/Default to Task Currency)
        // Helpers::priceFormat($fromCurrency, $amount, $toCurrency)
        $convertedAdminFee = Helpers::priceFormat('GBP', $adminFeeConfig, strtoupper($currency));

        // 3. Platform Fee (Percentage of Price) + Admin Fee
        $platformFeeBase = round($price * ($platformFeePercent / 100), 2);
        $totalPlatformFee = round($platformFeeBase + $convertedAdminFee, 2);

        // 4. Totals
        $transferAmount = round(($price + $creatorVatAmount) * $multiplier); // What Creator receives
        $totalChargeAmount = round(($price + $creatorVatAmount + $totalPlatformFee) * $multiplier); // What Supporter pays

        Stripe::setApiKey(config('services.stripe.secret'));

        $lineItems = [];

        // Item 1: The Task
        $lineItems[] = [
            'price_data' => [
                'currency' => $currency,
                'product_data' => [
                    'name' => $task->title,
                    'description' => "You are purchasing a digital task. This is a PG-13 digital service. Delivery method: " . ucfirst($task->type) . ". No adult or sexual content.",
                    'images' => $task->media_url ? [asset($task->media_url)] : [],
                ],
                'unit_amount' => (int) ($price * $multiplier),
            ],
            'quantity' => 1,
        ];

        // Item 2: Creator VAT (if applicable)
        if ($creatorVatAmount > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => 'Creator VAT (' . $vatPercent . '%)',
                    ],
                    'unit_amount' => (int) ($creatorVatAmount * $multiplier),
                ],
                'quantity' => 1,
            ];
        }

        // Item 3: Platform Fee
        if ($totalPlatformFee > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => 'Platform Fee (' . $platformFeePercent . '% + Admin Fee)',
                    ],
                    'unit_amount' => (int) ($totalPlatformFee * $multiplier),
                ],
                'quantity' => 1,
            ];
        }

        // Prepare Transfer Data
        $connectedAccountId = $creator->account_id;
        $hasCardPayments = \App\StripeControl::hasCardPaymentsCapability($connectedAccountId);

        // Comprehensive Metadata for Stripe Compliance & Webhook Handling
        $complianceMetadata = [
            // Core Identity
            'creator_id' => $creator->id,
            'creator_name' => $creator->name,
            'creator_profile_url' => route('user.show', $creator->username),
            'buyer_id' => $user->id,
            'gifter_name' => $user->name,
            'gifter_profile_url' => route('user.show', $user->username),
            'supporter_id' => $user->id, // Kept for legacy compatibility
            'gifter_message' => $request->gifter_message,

            // Task Details
            'purpose' => 'paid_task',
            'type' => 'task_purchase', // Trigger for Webhook
            'task_id' => $task->id,
            'task_uuid' => $task->uuid,
            'task_type' => $task->type, // instant | timed
            'delivery_mode' => $task->type,
            'deliverable_type' => 'digital_task',
            'value_summary' => "Digital task service: " . $task->title,
            'caps_version' => 'v1',
            'sla_hours' => $task->sla_hours ?? 0,
            
            // Compliance Fields
            'content_delivery_status' => 'pending',
            'payment_status' => 'pending', 
            'payment_date' => now()->toIso8601String(),
            'current_status_of_order' => 'pending',
            'sla_timeline' => $task->type === 'timed' ? ($task->sla_hours . ' hours') : 'instant',

            // Financial Breakdown (Crucial for Disputes/Accounting)
            'admin_fee' => $convertedAdminFee,
            'platform_fee' => $totalPlatformFee,
            'vat_amount' => $creatorVatAmount,
            'transfer_amount' => ($transferAmount / $multiplier),
            'payment_type' => $task->type === 'instant' ? 'STANDARD' : 'PAID_TASK',
        ];

        $paymentIntentData = [
            'description' => "Spenny Piggy - Task purchase: " . $task->title,
            'metadata' => $complianceMetadata,
            'transfer_group' => "paid_task_{$task->id}",
        ];

        if ($connectedAccountId) {
            $paymentType = $complianceMetadata['payment_type'] ?? 'STANDARD';

            // Only apply automatic transfers if NOT a PAID_TASK
            if ($paymentType !== 'PAID_TASK') {
                if ($hasCardPayments) {
                    $paymentIntentData['on_behalf_of'] = $connectedAccountId;
                    $paymentIntentData['transfer_data'] = [
                        'destination' => $connectedAccountId,
                        'amount' => $transferAmount,
                    ];
                } else {
                     // Fallback if no card payments capability (rare for verified creators)
                     // We still try to transfer
                     $paymentIntentData['transfer_data'] = [
                        'destination' => $connectedAccountId,
                        'amount' => $transferAmount,
                    ];
                }
            } else {
                // PAID_TASK: Funds are held on platform.
                // Do NOT set transfer_data or on_behalf_of (unless we want on_behalf_of for statement descriptor only, 
                // but usually that implies settlement to connected account).
                // Spec says: "Funds settle in platform balance".
                Log::info('Paid Task Purchase: Funds held on platform for delayed payout.', [
                    'task_id' => $task->id,
                    'creator_id' => $creator->id
                ]);
            }
        }

        $checkout_session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => 'payment',
            'payment_intent_data' => $paymentIntentData,
            'success_url' => route('task.success', ['uuid' => $task->uuid]) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('task.show', $task->uuid),
            'metadata' => $complianceMetadata,
            'customer_email' => $user->email,
        ]);

        return Inertia::location($checkout_session->url);
    }

    public function success(Request $request, $uuid)
    {
        $sessionId = $request->query('session_id');
        $task = Task::where('uuid', $uuid)->with('creator')->firstOrFail();
        
        Stripe::setApiKey(config('services.stripe.secret'));
        $session = Session::retrieve($sessionId);

        $purchase = null;

        // Allow if paid OR if on localhost (bypass payment check for testing)
        $isPaid = $session->payment_status === 'paid';
        $isLocal = \Illuminate\Support\Facades\App::environment('local');

        if ($isPaid || $isLocal) {
            // Try to find existing purchase (webhook might have created it)
            $purchase = TaskPurchase::where('stripe_session_id', $session->id)->first();

            // If webhook hasn't processed it yet, create it here synchronously
            if (!$purchase) {
                $purchase = $this->createTaskPurchaseSync($session, $task);
            }

            // Self-healing: If purchase exists but is pending/paid for an instant task, fix it.
            // This handles cases where synchronous creation failed to set status correctly due to metadata issues.
            if ($purchase && in_array($purchase->status, ['pending', 'paid']) && $task->type === 'instant') {
                $purchase->status = 'completed';
                $purchase->completed_at = Carbon::now();
                $purchase->save();

                // Update GMV for creator
                Helpers::addGmv($purchase->creator_id, (float) $purchase->amount, $purchase->creator->default_currency);

                // Also fix deliverable
                $deliverable = Deliverable::where('order_id', $purchase->id)->first();
                if ($deliverable) {
                    $deliverable->status = 'delivered';
                    $deliverable->delivered_at = Carbon::now();
                    $deliverable->save();
                }

                Log::info('Self-healed instant task status', ['purchase_id' => $purchase->id]);
            }
        } else {
            return redirect()->route('task.show', $uuid)->with('error', 'Payment not completed.');
        }

        return Inertia::render('Tasks/Success', [
            'task' => $task,
            'purchase' => $purchase,
            'currencySymbol' => \App\Models\Currency::where('ISO', $task->currency)->value('symbol') ?? '$',
            'gracePeriodHours' => config('tasks.grace_period_hours', 1),
        ]);
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
        $taskId = $metadata->task_id ?? $task->id;
        $buyerId = $metadata->buyer_id ?? null;
        $creatorId = $metadata->creator_id ?? $task->creator_id;

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
                Log::warning('Failed to retrieve charge_id for task purchase', ['pi' => $session->payment_intent]);
            }
        }

        // Create TaskPurchase
        $purchase = TaskPurchase::create([
            'task_id' => $taskId,
            'supporter_id' => $buyerId,
            'creator_id' => $creatorId,
            'stripe_session_id' => $session->id,
            'payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : ($session->payment_intent->id ?? null),
            'charge_id' => $chargeId,
            'amount' => $amount,
            'status' => 'paid', // Always paid in sync handler (and especially for local dev)
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
            'metadata' => json_encode($metadata),
        ]);

        // Dispatch job to process the deliverable (certificate generation)
        \App\Jobs\ProcessWishItemDeliverable::dispatchSync($deliverable);

        // Handle Instant Task
        // Use $task->type as reliable source instead of metadata
        if ($task->type === 'instant') {
            $purchase->status = 'completed';
            $purchase->completed_at = Carbon::now();
            $purchase->save();
            
            // Update Metadata
            try {
                if ($purchase->payment_intent_id) {
                    $client = new StripeClient(config('services.stripe.secret'));
                    $client->paymentIntents->update($purchase->payment_intent_id, [
                        'metadata' => [
                            'status' => 'completed',
                            'task_type' => 'instant'
                        ]
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
                Mail::to($creator->email)->send(new TaskPurchasedMail($purchase, $task, $supporter));

                Helpers::sendNotification(
                    "New Task Order! 💰",
                    ($supporter ? $supporter->name : "A Guest") . " purchased your task: " . $task->title,
                    $creator->email
                );
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
            if ($purchase->payment_intent_id) {
                $client = new StripeClient(config('services.stripe.secret'));
                $client->paymentIntents->update($purchase->payment_intent_id, [
                    'metadata' => [
                        'status' => 'pending_review',
                        'proof_uploaded_at' => now()->toIso8601String()
                    ]
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to update metadata on proof upload: " . $e->getMessage());
        }

        try {
            $supporter = $purchase->supporter;
            $task = $purchase->task;
            $creator = Auth::user();

            if ($supporter) {
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
                $purchase->dispute_status = 'resolved';
            }

            $purchase->save();

            // Update Metadata
            try {
                if ($purchase->payment_intent_id) {
                    $client = new StripeClient(config('services.stripe.secret'));
                    
                    $metadata = [
                        'status' => 'completed_accepted',
                        'proof_status' => 'accepted',
                        'accepted_by' => 'supporter'
                    ];

                    if ($wasDispute) {
                        $metadata['dispute_resolution'] = 'supporter_accepted';
                        $metadata['dispute_status'] = 'resolved';
                    }

                    $client->paymentIntents->update($purchase->payment_intent_id, [
                        'metadata' => $metadata
                    ]);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to update metadata on proof acceptance: " . $e->getMessage());
            }

            // Update Deliverable Status
            try {
                $deliverable = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
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
                if ($creator) {
                    Mail::to($creator->email)->send(new TaskProofAcceptedMail($purchase, $task, $supporter));
                    Helpers::sendNotification(
                        "Proof Accepted! ✅",
                        $supporter->name . " accepted your proof for task: " . $task->title,
                        $creator->email
                    );
                }
            } catch (\Exception $e) {}

            // Delayed transfer for PAID_TASK
            if (($purchase->payment_type ?? 'STANDARD') === 'PAID_TASK' && $creator && !empty($creator->account_id)) {
                try {
                    $client = new StripeClient(config('services.stripe.secret'));
                    $pi = $client->paymentIntents->retrieve($purchase->payment_intent_id);
                    $chargeId = $pi->latest_charge ?? null;

                    // Get currency from Task or Deliverable
                    $currency = $task->currency;
                    if (empty($currency)) {
                        $deliverableForCurrency = \App\Models\Deliverable::where('order_id', $purchase->id)->first();
                        $currency = $deliverableForCurrency ? $deliverableForCurrency->payment_currency : 'gbp';
                    }
                    // Default to GBP if still empty
                    $currency = $currency ?: 'gbp';

                    $digits = \App\Models\Currency::where('ISO', strtoupper($currency))->value('ISOdigits');
                    $multiplier = ($digits == 0) ? 1 : 100;
                    $amount = (int) round(($purchase->transfer_amount ?? 0) * $multiplier);

                    if ($amount > 0) {
                        $transfer = \App\StripeControl::createTransfer([
                            'amount' => $amount,
                            'currency' => strtolower($currency),
                            'destination' => $creator->account_id,
                            'source_transaction' => $chargeId,
                            'transfer_group' => "paid_task_{$task->id}",
                        ]);

                        $purchase->status = 'paid_out';
                        $purchase->transfer_id = $transfer->id;
                        $purchase->save();

                        \Illuminate\Support\Facades\Log::info('Paid Task transfer created', [
                            'purchase_id' => $purchase->id,
                            'transfer_id' => $transfer->id ?? null,
                            'was_escalated' => $wasDispute ?? false,
                            'amount' => $amount,
                            'currency' => $currency
                        ]);
                    } else {
                        \Illuminate\Support\Facades\Log::warning('Paid Task transfer skipped: Amount is 0', [
                            'purchase_id' => $purchase->id,
                            'transfer_amount' => $purchase->transfer_amount,
                            'was_escalated' => $wasDispute ?? false
                        ]);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create transfer on proof acceptance', [
                        'error' => $e->getMessage(),
                        'purchase_id' => $purchase->id
                    ]);
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
                     if ($purchase->payment_intent_id) {
                         $client = new StripeClient(config('services.stripe.secret'));
                         $client->paymentIntents->update($purchase->payment_intent_id, [
                             'metadata' => [
                                 'status' => 'escalated',
                                 'dispute_status' => 'open',
                                 'escalation_reason' => $request->reason
                             ]
                         ]);
                     }
                 } catch (\Exception $e) {
                     \Illuminate\Support\Facades\Log::error("Failed to update metadata on escalation: " . $e->getMessage());
                 }

                 // Notify Creator
                 try {
                    Mail::to($creator->email)->send(new TaskDisputeEscalatedMail($purchase, $task, $creator, 'creator'));
                    Helpers::sendNotification("Dispute Escalated ⚠️", "Task dispute escalated to admin for '{$task->title}'", $creator->email);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify creator about escalation: " . $e->getMessage());
                }

                // Notify Supporter
                try {
                    Mail::to($supporter->email)->send(new TaskDisputeEscalatedMail($purchase, $task, $supporter, 'supporter'));
                    Helpers::sendNotification("Dispute Escalated ⚠️", "Task dispute escalated to admin for '{$task->title}'", $supporter->email);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify supporter about escalation: " . $e->getMessage());
                }

                // Notify Admin (via email)
                try {
                    // Send to admin support email
                    Mail::to('support@spennypiggy.co')->send(new TaskDisputeEscalatedMail($purchase, $task, null, 'admin'));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to notify admin about escalation: " . $e->getMessage());
                }
            } else {
                $purchase->status = 'rejected_once';
                $purchase->rejection_reason = $request->reason;
                $purchase->save();

                 // Update Metadata
                 try {
                     if ($purchase->payment_intent_id) {
                         $client = new StripeClient(config('services.stripe.secret'));
                         $client->paymentIntents->update($purchase->payment_intent_id, [
                             'metadata' => [
                                 'status' => 'rejected_once',
                                 'rejection_reason' => $request->reason
                             ]
                         ]);
                     }
                 } catch (\Exception $e) {
                     \Illuminate\Support\Facades\Log::error("Failed to update metadata on rejection: " . $e->getMessage());
                 }

                 // Notify Creator about rejection
                 try {
                    Mail::to($creator->email)->send(new TaskProofRejectedMail($purchase, $task, $supporter));
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
