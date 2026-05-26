<?php

namespace App\Http\Controllers;

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
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
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
            'attachments' => null,
        ]);

        if ($creator->email) {
            Mail::to($creator->email)
                ->bcc(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                ->send(new SupportTicketCreatedMail($ticket));
                
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
            $sourceModelClass = match($ticket->source) {
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

    public function message(Request $request, string $uuid)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'attachments' => 'nullable|array',
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

        $creator = User::findOrFail($ticket->creator_id);
        $refundService->initiateRefund($ticket, $creator, 'creator');

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

        // Notify Supporter
        $supporterEmail = $ticket->supporter ? $ticket->supporter->email : $ticket->guest_email;
        if ($supporterEmail) {
            Mail::to($supporterEmail)->send(new SupportTicketRefundStatusMail($ticket, 'approved', 'supporter'));
            \App\Helpers::sendNotification(
                'Refund Approved',
                'Your refund request (Ticket #' . explode('-', $ticket->uuid)[0] . ') has been approved and initiated.',
                $supporterEmail
            );
        }

        // Notify Creator
        if ($creator->email) {
            Mail::to($creator->email)->send(new SupportTicketRefundStatusMail($ticket, 'approved', 'creator'));
            \App\Helpers::sendNotification(
                'Refund Approved',
                'You have approved the refund for Ticket #' . explode('-', $ticket->uuid)[0] . '.',
                $creator->email
            );
        }

        return response()->json(['status' => true]);
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
