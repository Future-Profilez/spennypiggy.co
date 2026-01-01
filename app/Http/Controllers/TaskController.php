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
use App\Mail\TaskPurchasedMail;
use App\Mail\TaskProofSubmittedMail;
use App\Mail\TaskProofAcceptedMail;
use App\Mail\TaskProofRejectedMail;
use Illuminate\Support\Facades\Mail;
use App\Helpers;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = Task::where('creator_id', Auth::id())->orderBy('created_at', 'desc')->get();
        
        $orders = TaskPurchase::where('creator_id', Auth::id())
            ->whereIn('status', ['paid', 'assigned', 'pending_review', 'rejected_once', 'escalated'])
            ->with(['task', 'supporter'])
            ->orderBy('created_at', 'asc')
            ->get();

        $completed_orders = TaskPurchase::where('creator_id', Auth::id())
            ->whereIn('status', ['delivered', 'completed_accepted'])
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
        return Inertia::render('Tasks/Create');
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 1) {
            abort(403, 'Only creators can create tasks.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:1',
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
        $task->price = $request->price;
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

        return redirect()->route('task.dashboard')->with('success', 'Task created successfully.');
    }

    public function show($uuid)
    {
        $task = Task::where('uuid', $uuid)->with('creator')->firstOrFail();
        
        $purchase = null;
        if (Auth::check()) {
            if (Auth::id() !== $task->creator_id) {
                $purchase = TaskPurchase::where('task_id', $task->id)
                    ->where('supporter_id', Auth::id())
                    ->whereIn('status', ['paid', 'delivered', 'assigned', 'pending_review', 'completed_accepted', 'rejected_once', 'escalated', 'sla_missed', 'refunded'])
                    ->first();
            }
        }

        if (Auth::id() !== $task->creator_id && !$purchase) {
            $task->makeHidden(['deliverable_content', 'deliverable_note', 'deliverable_content_type']);
        }

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'purchase' => $purchase,
            'isCreator' => Auth::id() === $task->creator_id,
            'deliverableUrl' => ($purchase && $task->type === 'instant' && in_array($purchase->status, ['delivered', 'completed_accepted'])) ? route('task.download', $task->uuid) : null
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

        $hasPurchased = TaskPurchase::where('task_id', $task->id)
            ->where('supporter_id', $userId)
            ->whereIn('status', ['paid', 'delivered', 'completed_accepted'])
            ->exists();
            
        if (!$hasPurchased) {
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
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $checkout_session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => $task->title,
                        'description' => "You are purchasing a digital task. This is a PG-13 digital service. Delivery method: " . ucfirst($task->type) . ". No adult or sexual content.",
                        'images' => $task->media_url ? [asset($task->media_url)] : [],
                    ],
                    'unit_amount' => (int) ($task->price * 100),
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => route('task.success', ['uuid' => $task->uuid]) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('task.show', $task->uuid),
            'metadata' => [
                'type' => 'task_purchase',
                'task_id' => $task->id,
                'creator_id' => $task->creator_id,
                'supporter_id' => $user->id,
                'delivery_mode' => $task->type,
                'value_summary' => 'PG-13 Digital Service - ' . ucfirst($task->type) . ' Delivery',
            ],
            'customer_email' => $user->email,
        ]);

        return Inertia::location($checkout_session->url);
    }

    public function success(Request $request, $uuid)
    {
        $sessionId = $request->query('session_id');
        $task = Task::where('uuid', $uuid)->firstOrFail();
        
        Stripe::setApiKey(config('services.stripe.secret'));
        $session = Session::retrieve($sessionId);
        
        if ($session->payment_status === 'paid') {
            $existing = TaskPurchase::where('stripe_session_id', $session->id)->first();
            
            if (!$existing) {
                $purchase = new TaskPurchase();
                $purchase->uuid = Str::uuid();
                $purchase->task_id = $task->id;
                $purchase->supporter_id = Auth::id(); // Assuming logged in
                $purchase->creator_id = $task->creator_id;
                $purchase->stripe_session_id = $session->id;
                $purchase->payment_intent_id = $session->payment_intent;
                $purchase->amount = $session->amount_total / 100;
                
                if ($task->type === 'instant') {
                    $purchase->status = 'delivered';
                    $purchase->completed_at = now();
                } else {
                    $purchase->status = 'assigned';
                    $purchase->sla_deadline = now()->addHours($task->sla_hours);
                }
                
                $purchase->save();
                
                try {
                    $creator = $task->creator;
                    $supporter = Auth::user();
                    if ($creator) {
                        Mail::to($creator->email)->send(new TaskPurchasedMail($purchase, $task, $supporter));
                        
                        Helpers::sendNotification(
                            "New Task Order! 💰", 
                            ($supporter ? $supporter->name : "A Guest") . " purchased your task: " . $task->title, 
                            $creator->email
                        );
                    }
                } catch (\Exception $e) {
                    // Log error or silently fail so purchase flow isn't interrupted
                }
            } else {
                $purchase = $existing;
            }
        } else {
            return redirect()->route('task.show', $uuid)->with('error', 'Payment not completed.');
        }

        return Inertia::render('Tasks/Success', [
            'task' => $task,
            'purchase' => $purchase
        ]);
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
        } catch (\Exception $e) {}
        
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
        
        if ($request->action === 'accept') {
            $purchase->status = 'completed_accepted';
            $purchase->completed_at = now();
        } else {
            if ($purchase->status === 'pending_review') {
                 $purchase->status = 'rejected_once';
                 $purchase->rejection_reason = $request->reason;
            } else {
                 $purchase->status = 'escalated';
                 $purchase->rejection_reason = $request->reason;
            }
        }
        
        $purchase->reviewed_at = now();
        $purchase->save();
        
        try {
            $creator = $purchase->creator;
            $task = $purchase->task;
            $supporter = Auth::user();
            
            if ($creator) {
                if ($request->action === 'accept') {
                    Mail::to($creator->email)->send(new TaskProofAcceptedMail($purchase, $task, $supporter));
                    Helpers::sendNotification(
                        "Proof Accepted! ✅", 
                        $supporter->name . " accepted your proof for task: " . $task->title, 
                        $creator->email
                    );
                } else {
                    Mail::to($creator->email)->send(new TaskProofRejectedMail($purchase, $task, $supporter));
                    Helpers::sendNotification(
                        "Proof Rejected ⚠️", 
                        $supporter->name . " rejected your proof for task: " . $task->title, 
                        $creator->email
                    );
                }
            }
        } catch (\Exception $e) {}
        
        return back()->with('success', 'Review submitted.');
    }

    public function order($uuid)
    {
        $purchase = TaskPurchase::where('uuid', $uuid)->with(['task', 'supporter', 'creator'])->firstOrFail();
        
        if (Auth::id() !== $purchase->supporter_id && Auth::id() !== $purchase->creator_id) {
            abort(403);
        }
        
        return Inertia::render('Tasks/Order', [
            'purchase' => $purchase,
            'task' => $purchase->task,
            'isCreator' => Auth::id() === $purchase->creator_id,
            'isSupporter' => Auth::id() === $purchase->supporter_id,
        ]);
    }
}
