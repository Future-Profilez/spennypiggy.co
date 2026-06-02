<?php

namespace App\Http\Controllers;

use App\Jobs\EnrichSupportTicketStripeEvidence;
use App\Mail\SupportTicketCreatedMail;
use App\Mail\SupportTicketConfirmationMail;
use App\Mail\SupportTicketUpdatedMail;
use App\Mail\SupportTicketRefundStatusMail;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use App\Services\MagicBellService;
use App\Services\SupportTicketRefundService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Stripe\Exception\ApiErrorException;

class SupportTicketController extends Controller
{
    private function appendEvidence(Request $request, SupportTicket $ticket, string $action, array $context = []): void
    {
        $event = array_merge([
            'at' => now()->toISOString(),
            'action' => $action,
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'accept_language' => $request->header('accept-language'),
            'referer' => $request->header('referer'),
            'x_forwarded_for' => $request->header('x-forwarded-for'),
            'cf_connecting_ip' => $request->header('cf-connecting-ip'),
            'request_id' => $request->header('x-vapor-request-id') ?? $request->header('x-amzn-trace-id'),
            'session_id' => $request->hasSession() ? $request->session()->getId() : null,
        ], $context);

        $event = array_filter($event, fn($v) => !($v === null || $v === ''));

        $evidence = $ticket->evidence ?? [];
        $events = $evidence['events'] ?? [];
        $events[] = $event;
        if (count($events) > 50) {
            $events = array_slice($events, -50);
        }

        if (!isset($evidence['created'])) {
            $evidence['created'] = $event;
        }
        $evidence['last'] = $event;
        $evidence['events'] = $events;

        $ticket->evidence = $evidence;
        $ticket->save();
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:contact,refund',
            'creator_username' => 'required|string',
            'event_type' => 'nullable|string',
            'source' => 'nullable|string',
            'source_id' => 'nullable|string',
            'message' => 'required|string|max:2000',
            'reason' => 'nullable|string|max:2000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*.uuid' => 'required_with:attachments|string|max:255',
            'attachments.*.url' => 'nullable|string|max:2000',
            'attachments.*.name' => 'nullable|string|max:255',
            'attachments.*.size' => 'nullable|integer|max:5242880',
            'attachments.*.mimeType' => 'nullable|string|max:255',
        ]);

        $supporter = Auth::user();
        if (!$supporter) {
            throw new AuthorizationException('Unauthorized');
        }

        $creator = User::where('username', $request->creator_username)->firstOrFail();

        $ticket = SupportTicket::create([
            'type' => $request->type,
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'event_type' => $request->event_type,
            'source' => $request->source,
            'source_id' => $request->source_id,
            'reason' => $request->reason,
            'sla_deadline' => Carbon::now()->addHours(48),
            'last_message_at' => now(),
            'last_supporter_message_at' => now(),
        ]);

        $recentMessages = SupportTicketMessage::where('ticket_id', $ticket->id)
            ->orderBy('id', 'desc')
            ->limit(3)
            ->get();

        if ($recentMessages->count() === 3 && $recentMessages->every(fn($m) => $m->sender_role === 'supporter')) {
            return response()->json(['status' => false, 'message' => 'You can only send up to 3 consecutive messages. Please wait for a reply.'], 422);
        }

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_role' => 'supporter',
            'sender_user_id' => $supporter->id,
            'message' => $request->message,
            'attachments' => $request->attachments,
        ]);

        $this->appendEvidence($request, $ticket, 'ticket_created', [
            'actor_role' => 'supporter',
            'actor_user_id' => $supporter->id,
            'attachments_count' => is_array($request->attachments) ? count($request->attachments) : 0,
        ]);

        EnrichSupportTicketStripeEvidence::dispatch($ticket->id);

        if ($creator->email) {
            $adminRecipients = config('support.ticket_admin_recipients', []);

            Mail::to($creator->email)
                ->bcc($adminRecipients)
                ->send(new SupportTicketCreatedMail($ticket, $request->message));

            app(MagicBellService::class)->sendNotification(
                'New Support Request',
                'You have a new support request from @' . $supporter->username . '. Please respond within 48 hours.',
                $creator->email
            );
        }

        if ($supporter->email) {
            Mail::to($supporter->email)
                ->send(new SupportTicketConfirmationMail($ticket));

            app(MagicBellService::class)->sendNotification(
                'Support Request Received',
                'Your support request has been successfully sent to @' . $creator->username . '.',
                $supporter->email
            );
        }

        return response()->json([
            'status' => true,
            'ticket_uuid' => $ticket->uuid,
            'redirect' => route('support.tickets.show', $ticket->uuid),
        ]);
    }

    public function show(string $uuid)
    {
        $user = Auth::user();
        if (!$user) {
            throw new AuthorizationException('Unauthorized');
        }

        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();

        if ($ticket->creator_id !== $user->id && $ticket->supporter_id !== $user->id) {
            throw new AuthorizationException('Unauthorized');
        }

        $messages = SupportTicketMessage::where('ticket_id', $ticket->id)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($m) {
                $sender = $m->sender_user_id ? User::find($m->sender_user_id) : null;
                return [
                    'id' => $m->id,
                    'sender_role' => $m->sender_role,
                    'sender' => $sender ? [
                        'username' => $sender->username,
                        'name' => $sender->name,
                        'avatar' => $sender->avatar_url,
                    ] : null,
                    'message' => $m->message,
                    'attachments' => $m->attachments,
                    'created_at' => $m->created_at->format('Y-m-d H:i:s'),
                ];
            });

        $transaction = null;
        if ($ticket->source && $ticket->source_id) {
            $sourceModelClass = match ($ticket->source) {
                'stripe_payment_items' => \App\Models\StripePaymentItems::class,
                'membership_payments' => \App\Models\MembershipPayment::class,
                'bill_payments' => \App\Models\BillPayment::class,
                'tip_goals_payments' => \App\Models\TipGoalsPayment::class,
                'piggy_pot_contributions' => \App\Models\PiggyPotContribution::class,
                'shop_payments' => \App\Models\ShopPayment::class,
                'task_purchases' => \App\Models\TaskPurchase::class,
                default => null,
            };

            $ft = null;
            if ($sourceModelClass) {
                $ft = \App\Models\FinancialTransaction::with('source')->where('source_type', $sourceModelClass)
                    ->where('source_id', $ticket->source_id)
                    ->first();
            } elseif ($ticket->source === 'financial_transactions') {
                $ft = \App\Models\FinancialTransaction::with('source')->find($ticket->source_id);
            }

            if ($ft) {
                $transaction = [
                    'amount' => $ft->gross_amount,
                    'net_amount' => $ft->net_amount,
                    'currency' => strtoupper($ft->currency ?? 'GBP'),
                    'date' => $ft->transaction_date ? $ft->transaction_date->format('M d, Y') : $ft->created_at->format('M d, Y'),
                    'description' => $ft->description,
                    'message' => $ft->source->message ?? null,
                ];
            }
        }

        return Inertia::render('Support/Tickets/Show', [
            'ticket' => [
                'uuid' => $ticket->uuid,
                'type' => $ticket->type,
                'status' => $ticket->status,
                'reason' => $ticket->reason,
                'evidence' => $ticket->evidence,
                'event_type' => $ticket->event_type,
                'source' => $ticket->source,
                'source_id' => $ticket->source_id,
                'sla_deadline' => optional($ticket->sla_deadline)?->toISOString(),
                'escalated_at' => optional($ticket->escalated_at)?->toISOString(),
                'resolved_at' => optional($ticket->resolved_at)?->toISOString(),
                'creator_id' => $ticket->creator_id,
                'supporter_id' => $ticket->supporter_id,
            ],
            'transaction' => $transaction,
            'messages' => $messages,
            'viewer' => [
                'role' => $ticket->creator_id === $user->id ? 'creator' : 'supporter',
            ],
        ]);
    }

    public function transactionDetails(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'source_id' => 'required|string',
        ]);

        $user = Auth::user();
        if (!$user) {
            throw new AuthorizationException('Unauthorized');
        }

        $sourceModelClass = match ($request->source) {
            'stripe_payment_items' => \App\Models\StripePaymentItems::class,
            'membership_payments' => \App\Models\MembershipPayment::class,
            'bill_payments' => \App\Models\BillPayment::class,
            'tip_goals_payments' => \App\Models\TipGoalsPayment::class,
            'piggy_pot_contributions' => \App\Models\PiggyPotContribution::class,
            'shop_payments' => \App\Models\ShopPayment::class,
            'task_purchases' => \App\Models\TaskPurchase::class,
            'financial_transactions' => \App\Models\FinancialTransaction::class,
            default => null,
        };

        if (!$sourceModelClass) {
            return response()->json(['status' => false, 'message' => 'Invalid source.'], 422);
        }

        $ft = null;
        if ($request->source === 'financial_transactions') {
            $ft = \App\Models\FinancialTransaction::query()
                ->with([
                    'user:id,username,name',
                    'supporter:id,username,name',
                    'source',
                ])
                ->find($request->source_id);
        } else {
            $ft = \App\Models\FinancialTransaction::query()
                ->with([
                    'user:id,username,name',
                    'supporter:id,username,name',
                    'source',
                ])
                ->where('source_type', $sourceModelClass)
                ->where('source_id', $request->source_id)
                ->first();
        }

        if ($ft) {
            if ($ft->user_id !== $user->id && $ft->supporter_id !== $user->id) {
                throw new AuthorizationException('Unauthorized');
            }

            $ft->loadMorph('source', [
                \App\Models\ShopPayment::class => ['shop', 'shop.user'],
                \App\Models\TaskPurchase::class => ['task', 'creator'],
                \App\Models\StripePaymentItems::class => ['wish', 'payment', 'payment.owner'],
                \App\Models\MembershipPayment::class => ['membership', 'membership.user'],
                \App\Models\BillPayment::class => ['bill', 'bill.user'],
                \App\Models\PiggyPotContribution::class => ['piggyPot', 'creator'],
                \App\Models\TipGoalsPayment::class => ['tipGoal'],
            ]);

            $base = class_basename($ft->source_type);
            $type = match ($base) {
                'StripePaymentItems' => 'gift_wish',
                'MembershipPayment' => 'gift_membership',
                'BillPayment' => 'gift_bill',
                'TipGoalsPayment' => 'gift_tip',
                'PiggyPotContribution' => 'piggy_pot',
                'ShopPayment' => 'gift_shop',
                'TaskPurchase' => 'gift_task',
                default => 'transaction',
            };

            $title = null;
            if ($base === 'ShopPayment') {
                $title = $ft->source?->shop?->name;
            } elseif ($base === 'TaskPurchase') {
                $title = $ft->source?->task?->title;
            } elseif ($base === 'StripePaymentItems') {
                $title = $ft->source?->wish?->wishname;
            } elseif ($base === 'MembershipPayment') {
                $title = $ft->source?->membership?->level;
            } elseif ($base === 'BillPayment') {
                $title = $ft->source?->bill?->name;
            } elseif ($base === 'PiggyPotContribution') {
                $title = $ft->source?->piggyPot?->title;
            }

            return response()->json([
                'status' => true,
                'event' => [
                    'uuid' => $ft->uuid,
                    'type' => $type,
                    'title' => $title,
                    'source' => $request->source,
                    'source_id' => (string) $request->source_id,
                    'created_at' => optional($ft->transaction_date)->format('Y-m-d H:i:s') ?? $ft->created_at->format('Y-m-d H:i:s'),
                    'amount' => (float) ($ft->gross_amount ?? 0),
                    'net_amount' => (float) ($ft->net_amount ?? 0),
                    'currency' => strtolower($ft->currency ?? 'GBP'),
                    'creator' => $ft->user ? [
                        'name' => $ft->user->name,
                        'username' => $ft->user->username,
                    ] : null,
                ],
            ]);
        }

        if ($request->source === 'financial_transactions') {
            return response()->json(['status' => false, 'message' => 'Transaction not found.'], 404);
        }

        $model = $sourceModelClass::query()->find($request->source_id);
        if (!$model) {
            return response()->json(['status' => false, 'message' => 'Transaction not found.'], 404);
        }

        $type = match ($request->source) {
            'stripe_payment_items' => 'gift_wish',
            'membership_payments' => 'gift_membership',
            'bill_payments' => 'gift_bill',
            'tip_goals_payments' => 'gift_tip',
            'piggy_pot_contributions' => 'piggy_pot',
            'shop_payments' => 'gift_shop',
            'task_purchases' => 'gift_task',
            default => 'transaction',
        };

        $title = null;
        $creator = null;
        $amount = null;
        $currency = null;
        $createdAt = method_exists($model, 'getAttribute') ? ($model->getAttribute('created_at') ?? null) : null;

        if ($request->source === 'shop_payments') {
            $model->loadMissing(['shop', 'shop.user']);
            $title = $model->shop?->name;
            $creator = $model->shop?->user;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount + ((float) ($model->shipping_amount ?? 0)) + ((float) ($model->vat_tax_amount ?? 0))));
            $currency = $model->currency;
        } elseif ($request->source === 'task_purchases') {
            $model->loadMissing(['task', 'creator', 'supporter']);
            $title = $model->task?->title;
            $creator = $model->creator;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount ?? 0));
            $currency = $model->currency;
            if ($model->creator_id !== $user->id && $model->supporter_id !== $user->id) {
                throw new AuthorizationException('Unauthorized');
            }
        } elseif ($request->source === 'stripe_payment_items') {
            $model->loadMissing(['wish', 'payment', 'payment.owner']);
            $title = $model->wish?->wishname;
            $creator = $model->payment?->owner;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount ?? 0));
            $currency = $model->payment?->currency;
        } elseif ($request->source === 'membership_payments') {
            $model->loadMissing(['membership', 'membership.user', 'user']);
            $title = $model->membership?->level;
            $creator = $model->membership?->user;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount ?? 0));
            $currency = $model->currency;
        } elseif ($request->source === 'bill_payments') {
            $model->loadMissing(['bill', 'bill.user', 'user']);
            $title = $model->bill?->name;
            $creator = $model->bill?->user;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount ?? 0));
            $currency = $model->currency;
        } elseif ($request->source === 'tip_goals_payments') {
            $model->loadMissing(['tipGoal', 'creator', 'user']);
            $title = $model->tipGoal?->name;
            $creator = $model->creator;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount ?? 0));
            $currency = $model->currency;
        } elseif ($request->source === 'piggy_pot_contributions') {
            $model->loadMissing(['piggyPot', 'creator', 'user']);
            $title = $model->piggyPot?->title;
            $creator = $model->creator;
            $amount = (float) (($model->total_paid && $model->total_paid > 0) ? $model->total_paid : ($model->amount ?? 0));
            $currency = $model->currency;
        }

        $creatorUsername = $creator?->username;
        $creatorName = $creator?->name;

        if ($request->source !== 'task_purchases') {
            $ownerId = $creator?->id ?? $model->creator_id ?? null;
            $supporterId = $model->user_id ?? $model->supporter_id ?? null;
            if ($ownerId && $supporterId) {
                if ($ownerId !== $user->id && $supporterId !== $user->id) {
                    throw new AuthorizationException('Unauthorized');
                }
            }
        }

        return response()->json([
            'status' => true,
            'event' => [
                'uuid' => $model->uuid ?? null,
                'type' => $type,
                'title' => $title,
                'source' => $request->source,
                'source_id' => (string) $request->source_id,
                'created_at' => $createdAt ? $createdAt->format('Y-m-d H:i:s') : null,
                'amount' => $amount,
                'currency' => strtolower($currency ?? 'GBP'),
                'creator' => $creatorUsername ? [
                    'name' => $creatorName,
                    'username' => $creatorUsername,
                ] : null,
            ],
        ]);
    }

    public function resolve(string $uuid)
    {
        $user = Auth::user();
        if (!$user) {
            abort(403, 'Unauthorized');
        }

        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();

        if ($ticket->creator_id !== $user->id && $ticket->supporter_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        if (in_array($ticket->status, ['resolved', 'refunded', 'rejected', 'refund_initiated'])) {
            return response()->json(['status' => false, 'message' => 'Ticket is already closed.'], 422);
        }

        $ticket->status = 'resolved';
        $ticket->resolved_at = now();
        $ticket->last_message_at = now();
        $ticket->save();

        return response()->json(['status' => true, 'message' => 'Ticket marked as resolved.']);
    }

    public function message(Request $request, string $uuid)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*.uuid' => 'required_with:attachments|string|max:255',
            'attachments.*.url' => 'nullable|string|max:2000',
            'attachments.*.name' => 'nullable|string|max:255',
            'attachments.*.size' => 'nullable|integer|max:5242880',
            'attachments.*.mimeType' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        if (!$user) {
            throw new AuthorizationException('Unauthorized');
        }

        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();
        if ($ticket->creator_id !== $user->id && $ticket->supporter_id !== $user->id) {
            throw new AuthorizationException('Unauthorized');
        }

        $senderRole = $ticket->creator_id === $user->id ? 'creator' : 'supporter';

        $recentMessages = SupportTicketMessage::where('ticket_id', $ticket->id)
            ->orderBy('id', 'desc')
            ->limit(3)
            ->get();

        if ($recentMessages->count() === 3 && $recentMessages->every(fn($m) => $m->sender_role === $senderRole)) {
            return response()->json(['status' => false, 'message' => 'You can only send up to 3 consecutive messages. Please wait for a reply.'], 422);
        }

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_role' => $senderRole,
            'sender_user_id' => $user->id,
            'message' => $request->message,
            'attachments' => $request->attachments,
        ]);

        $this->appendEvidence($request, $ticket, 'message_sent', [
            'actor_role' => $senderRole,
            'actor_user_id' => $user->id,
            'attachments_count' => is_array($request->attachments) ? count($request->attachments) : 0,
        ]);

        $ticket->last_message_at = now();
        if ($senderRole === 'creator') {
            $ticket->last_creator_message_at = now();
            if ($ticket->status === 'awaiting_creator') {
                $ticket->status = 'awaiting_supporter';
            }

            // Notify Supporter
            $supporterEmail = $ticket->supporter ? $ticket->supporter->email : $ticket->guest_email;
            if ($supporterEmail) {
                Mail::to($supporterEmail)->send(new SupportTicketUpdatedMail($ticket));
                \App\Helpers::sendNotification(
                    'Ticket Updated',
                    'The creator has replied to your support request (Ticket #' . explode('-', $ticket->uuid)[0] . ').',
                    $supporterEmail
                );
            }
        } else {
            $ticket->last_supporter_message_at = now();
            if ($ticket->status !== 'resolved' && $ticket->status !== 'rejected' && $ticket->status !== 'refund_initiated') {
                $ticket->status = 'awaiting_creator';
                $ticket->sla_deadline = Carbon::now()->addHours(48);
                $ticket->reminder_24h_sent_at = null;
                $ticket->reminder_6h_sent_at = null;
            }

            // Notify Creator
            $creator = User::find($ticket->creator_id);
            if ($creator && $creator->email) {
                Mail::to($creator->email)->send(new SupportTicketUpdatedMail($ticket));
                \App\Helpers::sendNotification(
                    'Ticket Updated',
                    'The supporter has replied to the support request (Ticket #' . explode('-', $ticket->uuid)[0] . ').',
                    $creator->email
                );
            }
        }
        $ticket->save();

        return response()->json(['status' => true]);
    }

    public function creatorApproveRefund(Request $request, SupportTicketRefundService $refundService, string $uuid)
    {
        $request->validate([
            'message' => 'nullable|string|max:2000',
        ]);

        try {

            $user = Auth::user();

            if (!$user) {
                throw new AuthorizationException('Unauthorized');
            }

            $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();

            if ($ticket->creator_id !== $user->id) {
                throw new AuthorizationException('Unauthorized');
            }

            if ($ticket->type !== 'refund') {
                return response()->json([
                    'status' => false,
                    'message' => 'Not a refund ticket.'
                ], 422);
            }

            $creator = User::findOrFail($ticket->creator_id);

            $refundService->initiateRefund(
                $ticket,
                $creator,
                'creator'
            );

            if ($request->message) {
                SupportTicketMessage::create([
                    'ticket_id' => $ticket->id,
                    'sender_role' => 'creator',
                    'sender_user_id' => $user->id,
                    'message' => $request->message,
                    'attachments' => null,
                ]);
            }

            $ticket->status = 'refund_initiated';
            $ticket->resolved_at = now();
            $ticket->last_message_at = now();
            $ticket->last_creator_message_at = now();
            $ticket->save();

            return response()->json([
                'status' => true,
                'message' => 'Refund initiated successfully.'
            ]);
        } catch (ApiErrorException $e) {

            Log::error('Stripe Refund Error', [
                'ticket_uuid' => $uuid,
                'creator_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Stripe refund failed: ' . $e->getMessage(),
            ], 422);
        } catch (Exception $e) {

            Log::error('Refund Approval Error', [
                'ticket_uuid' => $uuid,
                'creator_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Something went wrong while processing the refund.'
            ], 500);
        }
    }

    public function creatorRejectRefund(Request $request, string $uuid)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $user = Auth::user();
        if (!$user) {
            throw new AuthorizationException('Unauthorized');
        }

        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();
        if ($ticket->creator_id !== $user->id) {
            throw new AuthorizationException('Unauthorized');
        }

        if ($ticket->type !== 'refund') {
            return response()->json(['status' => false, 'message' => 'Not a refund ticket.'], 422);
        }

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_role' => 'creator',
            'sender_user_id' => $user->id,
            'message' => $request->message,
            'attachments' => null,
        ]);

        $ticket->status = 'rejected';
        $ticket->resolved_at = now();
        $ticket->last_message_at = now();
        $ticket->last_creator_message_at = now();
        $ticket->save();

        // Notify Supporter
        $supporterEmail = $ticket->supporter ? $ticket->supporter->email : $ticket->guest_email;
        if ($supporterEmail) {
            Mail::to($supporterEmail)->send(new SupportTicketRefundStatusMail($ticket, 'rejected', 'supporter'));
            \App\Helpers::sendNotification(
                'Refund Rejected',
                'Your refund request (Ticket #' . explode('-', $ticket->uuid)[0] . ') has been rejected.',
                $supporterEmail
            );
        }

        // Notify Creator
        $creator = User::find($ticket->creator_id);
        if ($creator && $creator->email) {
            Mail::to($creator->email)->send(new SupportTicketRefundStatusMail($ticket, 'rejected', 'creator'));
            \App\Helpers::sendNotification(
                'Refund Rejected',
                'You have rejected the refund for Ticket #' . explode('-', $ticket->uuid)[0] . '.',
                $creator->email
            );
        }

        return response()->json(['status' => true]);
    }
}
