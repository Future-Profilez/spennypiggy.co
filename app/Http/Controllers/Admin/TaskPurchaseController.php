<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TaskPurchase;
use App\Models\Deliverable;
use App\Models\Currency;
use App\Services\StripeMetadataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\Refund;
use App\Helpers;
use App\Mail\TaskRefunded;

class TaskPurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = TaskPurchase::with(['task:id,title,type,currency', 'creator:id,name,username,email', 'supporter:id,name,username,email'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->whereHas('task', fn($q) => $q->where('type', $request->type));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('task', fn($t) => $t->where('title', 'like', "%{$search}%"))
                  ->orWhereHas('creator', fn($u) => $u->where('username', 'like', "%{$search}%"))
                  ->orWhereHas('supporter', fn($u) => $u->where('username', 'like', "%{$search}%"));
            });
        }

        $purchases = $query->paginate(30)->through(function ($p) {
            $currencySymbol = Currency::where('ISO', strtoupper($p->task?->currency ?? 'GBP'))->value('symbol') ?? '£';
            return [
                'uuid'             => $p->uuid,
                'task_title'       => $p->task?->title ?? '—',
                'task_type'        => $p->task?->type ?? '—',
                'creator_name'     => $p->creator?->name ?? '—',
                'creator_username' => $p->creator?->username ?? '—',
                'supporter_name'   => $p->supporter?->name ?? '—',
                'supporter_username' => $p->supporter?->username ?? '—',
                'amount'           => $p->amount,
                'currency'         => strtoupper($p->task?->currency ?? 'GBP'),
                'currency_symbol'  => $currencySymbol,
                'status'           => $p->status,
                'dispute_status'   => $p->dispute_status,
                'rejection_count'  => $p->rejection_count,
                'rejection_reason' => $p->rejection_reason,
                'sla_deadline'     => $p->sla_deadline,
                'completed_at'     => $p->completed_at,
                'refunded_at'      => $p->refunded_at,
                'created_at'       => $p->created_at,
                'proof_content'    => $p->proof_content,
            ];
        });

        $statusCounts = TaskPurchase::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('Admin/Tasks/Index', [
            'purchases'    => $purchases,
            'statusCounts' => $statusCounts,
            'filters'      => $request->only(['status', 'type', 'search']),
        ]);
    }

    public function resolve(Request $request, $uuid)
    {
        $request->validate([
            'action' => 'required|in:refund,release',
        ]);

        $purchase = TaskPurchase::where('uuid', $uuid)
            ->where('status', 'escalated')
            ->with(['task', 'creator', 'supporter'])
            ->firstOrFail();

        if ($request->action === 'refund') {
            return $this->processRefund($purchase);
        }

        return $this->processRelease($purchase);
    }

    private function processRefund(TaskPurchase $purchase)
    {
        if (!$purchase->payment_intent_id) {
            return response()->json(['status' => false, 'message' => 'Missing payment intent — cannot refund.'], 422);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $stripeOptions = [];
            if ($purchase->creator?->account_id) {
                $stripeOptions['stripe_account'] = $purchase->creator->account_id;
            }

            $refund = Refund::create([
                'payment_intent' => $purchase->payment_intent_id,
                'reason'         => 'requested_by_customer',
                'metadata'       => [
                    'reason'               => 'admin_dispute_refund',
                    'task_purchase_uuid'   => $purchase->uuid,
                    'resolved_by'          => 'admin',
                    'resolution'           => 'gifter_wins',
                ],
            ], $stripeOptions);

            $purchase->status         = 'refunded';
            $purchase->refund_status  = 'refunded';
            $purchase->refunded_at    = now();
            $purchase->dispute_status = 'refunded';
            $purchase->refund_id      = $refund->id;
            $purchase->save();

            $this->updateDeliverableStatus($purchase, 'refunded', ['admin_resolution' => 'gifter_wins', 'refunded_by' => 'admin']);

            $this->notifyUsers($purchase, 'refund');

            return response()->json(['status' => true, 'message' => 'Refund processed. Gifter wins.']);
        } catch (\Exception $e) {
            Log::error("Admin task refund failed [{$purchase->uuid}]: " . $e->getMessage());
            return response()->json(['status' => false, 'message' => 'Stripe error: ' . $e->getMessage()], 500);
        }
    }

    private function processRelease(TaskPurchase $purchase)
    {
        try {
            $purchase->status         = 'completed_accepted';
            $purchase->dispute_status = 'won';
            $purchase->completed_at   = now();
            $purchase->reviewed_at    = now();
            $purchase->save();

            $this->updateDeliverableStatus($purchase, 'delivered', [
                'admin_resolution' => 'creator_wins',
                'dispute_status'   => 'won',
                'delivered_at'     => now()->toISOString(),
            ]);

            $this->notifyUsers($purchase, 'release');

            return response()->json(['status' => true, 'message' => 'Payment released. Creator wins.']);
        } catch (\Exception $e) {
            Log::error("Admin task release failed [{$purchase->uuid}]: " . $e->getMessage());
            return response()->json(['status' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    private function updateDeliverableStatus(TaskPurchase $purchase, string $status, array $meta = [])
    {
        try {
            $deliverable = Deliverable::where('order_id', $purchase->id)->first();
            if ($deliverable) {
                $deliverable->status = $status;
                if ($status === 'delivered') {
                    $deliverable->delivered_at = now();
                }
                $deliverable->save();
                app(StripeMetadataService::class)->updateDeliverableMetadata($deliverable, array_merge(['status' => $status], $meta));
            }
        } catch (\Exception $e) {
            Log::error("Admin task: failed to update deliverable [{$purchase->uuid}]: " . $e->getMessage());
        }
    }

    private function notifyUsers(TaskPurchase $purchase, string $resolution)
    {
        $task = $purchase->task;
        $isRefund = $resolution === 'refund';

        $creatorMsg  = $isRefund
            ? "Admin resolved the dispute for '{$task->title}' in the gifter's favour. Payment has been refunded."
            : "Admin resolved the dispute for '{$task->title}' in your favour. Payment has been released.";

        $supporterMsg = $isRefund
            ? "The dispute for '{$task->title}' was resolved in your favour. A refund has been issued."
            : "Admin resolved the dispute for '{$task->title}' in the creator's favour. No refund will be issued.";

        try {
            if ($purchase->creator) {
                Helpers::sendNotification($isRefund ? 'Dispute Resolved' : 'Payment Released ✅', $creatorMsg, $purchase->creator->email);
                if ($isRefund && $purchase->creator->notification_send == 1) {
                    Mail::to($purchase->creator->email)->send(new TaskRefunded([
                        'title' => $task->title, 'amount' => $purchase->amount, 'currency' => $task->currency,
                        'message' => $creatorMsg,
                    ]));
                }
            }
            if ($purchase->supporter) {
                Helpers::sendNotification($isRefund ? 'Refund Issued 💸' : 'Dispute Resolved', $supporterMsg, $purchase->supporter->email);
                if ($isRefund && $purchase->supporter->notification_send == 1) {
                    Mail::to($purchase->supporter->email)->send(new TaskRefunded([
                        'title' => $task->title, 'amount' => $purchase->amount, 'currency' => $task->currency,
                        'message' => $supporterMsg,
                    ]));
                }
            }
        } catch (\Exception $e) {
            Log::error("Admin task: notification failed [{$purchase->uuid}]: " . $e->getMessage());
        }
    }
}
