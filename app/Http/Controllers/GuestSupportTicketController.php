<?php

namespace App\Http\Controllers;

use App\Mail\SupportTicketCreatedMail;
use App\Mail\SupportTicketConfirmationMail;
use App\Mail\SupportTicketUpdatedMail;
use App\Models\StripePaymentDetail;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use App\Services\MagicBellService;

class GuestSupportTicketController extends Controller
{
    public function createTip(Request $request, int $tipPaymentId)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $payment = TipGoalsPayment::with(['creator'])->findOrFail($tipPaymentId);
        if (!$payment->guest_email || strtolower($payment->guest_email) !== strtolower($request->email)) {
            abort(403);
        }

        return Inertia::render('Support/Guest/Create', [
            'payment' => [
                'id' => $payment->id,
                'session_id' => $payment->session_id,
                'amount_total' => $payment->total_paid ?? $payment->amount,
                'currency' => $payment->currency,
            ],
            'creator' => $payment->creator ? [
                'username' => $payment->creator->username,
                'name' => $payment->creator->name,
                'avatar' => $payment->creator->avatar_url,
            ] : null,
            'initial_type' => $request->query('type') === 'refund' ? 'refund' : 'contact',
            'email' => $request->email,
            'post_url' => URL::signedRoute('support.guest.tip.store', ['tipPaymentId' => $payment->id, 'email' => $request->email]),
        ]);
    }

    public function storeTip(Request $request, int $tipPaymentId)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:contact,refund',
            'message' => 'required|string|max:2000',
            'reason' => 'nullable|string|max:2000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*.uuid' => 'required_with:attachments|string|max:255',
            'attachments.*.url' => 'nullable|string|max:2000',
            'attachments.*.name' => 'nullable|string|max:255',
            'attachments.*.size' => 'nullable|integer|max:5242880',
            'attachments.*.mimeType' => 'nullable|string|max:255',
        ]);

        $payment = TipGoalsPayment::with(['creator'])->findOrFail($tipPaymentId);
        if (!$payment->guest_email || strtolower($payment->guest_email) !== strtolower($request->email)) {
            abort(403);
        }

        $creator = $payment->creator;
        if (!$creator) {
            abort(404);
        }

        $ticket = SupportTicket::create([
            'type' => $request->type,
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => null,
            'guest_email' => $payment->guest_email,
            'event_type' => 'gift_tip',
            'source' => 'tip_goals_payments',
            'source_id' => (string) $payment->id,
            'stripe_payment_intent_id' => null,
            'stripe_session_id' => $payment->session_id,
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
            'sender_user_id' => null,
            'message' => $request->message,
            'attachments' => $request->attachments,
        ]);

        if ($creator->email) {
            Mail::to($creator->email)
                ->bcc(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                ->send(new SupportTicketCreatedMail($ticket, $request->message));

            \App\Helpers::sendNotification(
                'New Support Request',
                'You have a new support request from a guest supporter. Please respond within 48 hours.',
                $creator->email
            );
        }

        Mail::to($payment->guest_email)
            ->send(new SupportTicketConfirmationMail($ticket));

        \App\Helpers::sendNotification(
            'Support Request Received',
            'Your support request has been successfully sent to the creator.',
            $payment->guest_email
        );

        return response()->json([
            'status' => true,
            'ticket_uuid' => $ticket->uuid,
            'redirect' => URL::signedRoute('support.guest.tickets.show', ['uuid' => $ticket->uuid, 'email' => $payment->guest_email]),
        ]);
    }

    public function create(Request $request, int $paymentId)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $payment = StripePaymentDetail::with(['owner'])->findOrFail($paymentId);
        if (!$payment->guest_email || strtolower($payment->guest_email) !== strtolower($request->email)) {
            abort(403);
        }

        return Inertia::render('Support/Guest/Create', [
            'payment' => [
                'id' => $payment->id,
                'session_id' => $payment->session_id,
                'amount_total' => $payment->amount_total,
                'currency' => $payment->currency,
            ],
            'creator' => $payment->owner ? [
                'username' => $payment->owner->username,
                'name' => $payment->owner->name,
                'avatar' => $payment->owner->avatar_url,
            ] : null,
            'initial_type' => $request->query('type') === 'refund' ? 'refund' : 'contact',
            'email' => $request->email,
            'post_url' => URL::signedRoute('support.guest.store', ['paymentId' => $payment->id, 'email' => $request->email]),
        ]);
    }

    public function store(Request $request, int $paymentId)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:contact,refund',
            'message' => 'required|string|max:2000',
            'reason' => 'nullable|string|max:2000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*.uuid' => 'required_with:attachments|string|max:255',
            'attachments.*.url' => 'nullable|string|max:2000',
            'attachments.*.name' => 'nullable|string|max:255',
            'attachments.*.size' => 'nullable|integer|max:5242880',
            'attachments.*.mimeType' => 'nullable|string|max:255',
        ]);

        $payment = StripePaymentDetail::with(['owner'])->findOrFail($paymentId);
        if (!$payment->guest_email || strtolower($payment->guest_email) !== strtolower($request->email)) {
            abort(403);
        }

        $creator = $payment->owner;
        if (!$creator) {
            abort(404);
        }

        $ticket = SupportTicket::create([
            'type' => $request->type,
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => null,
            'guest_email' => $payment->guest_email,
            'stripe_payment_intent_id' => $payment->stripe_payment_intent_id ?? null,
            'stripe_session_id' => $payment->session_id ?? null,
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
            'sender_user_id' => null,
            'message' => $request->message,
            'attachments' => $request->attachments,
        ]);

        if ($creator->email) {
            Mail::to($creator->email)
                ->bcc(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                ->send(new SupportTicketCreatedMail($ticket, $request->message));
                
            \App\Helpers::sendNotification(
                'New Support Request',
                'You have a new support request from a guest supporter. Please respond within 48 hours.',
                $creator->email
            );
        }

        Mail::to($payment->guest_email)
            ->send(new SupportTicketConfirmationMail($ticket));
            
        \App\Helpers::sendNotification(
            'Support Request Received',
            'Your support request has been successfully sent to the creator.',
            $payment->guest_email
        );

        return response()->json([
            'status' => true,
            'ticket_uuid' => $ticket->uuid,
            'redirect' => URL::signedRoute('support.guest.tickets.show', ['uuid' => $ticket->uuid, 'email' => $payment->guest_email]),
        ]);
    }

    public function show(Request $request, string $uuid)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();
        if (!$ticket->guest_email || strtolower($ticket->guest_email) !== strtolower($request->email)) {
            abort(403);
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

        $creator = User::find($ticket->creator_id);

        $transaction = null;
        if ($ticket->source && $ticket->source_id) {
            $sourceModelClass = '';
            switch ($ticket->source) {
                case 'task_purchases':
                    $sourceModelClass = \App\Models\TaskPurchase::class;
                    break;
                case 'shop_payments':
                    $sourceModelClass = \App\Models\ShopPayment::class;
                    break;
                case 'membership_payments':
                    $sourceModelClass = \App\Models\MembershipPayment::class;
                    break;
                case 'bill_payments':
                    $sourceModelClass = \App\Models\BillPayment::class;
                    break;
                case 'stripe_payment_items':
                    $sourceModelClass = \App\Models\StripePaymentItems::class;
                    break;
                case 'piggy_pot_contributions':
                    $sourceModelClass = \App\Models\PiggyPotContribution::class;
                    break;
                case 'tip_goals_payments':
                    $sourceModelClass = \App\Models\TipGoalsPayment::class;
                    break;
            }

            if ($sourceModelClass) {
                $ftQuery = \App\Models\FinancialTransaction::with('source');
                $ftQuery->where('source_type', $sourceModelClass)
                        ->where('source_id', $ticket->source_id);
                $ft = $ftQuery->first();
                
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
        }

        return Inertia::render('Support/Guest/Ticket', [
            'ticket' => [
                'uuid' => $ticket->uuid,
                'type' => $ticket->type,
                'status' => $ticket->status,
                'reason' => $ticket->reason,
                'sla_deadline' => optional($ticket->sla_deadline)?->toISOString(),
            ],
            'creator' => $creator ? [
                'username' => $creator->username,
                'name' => $creator->name,
                'avatar' => $creator->avatar_url,
            ] : null,
            'transaction' => $transaction,
            'messages' => $messages,
            'email' => $request->email,
            'post_url' => URL::signedRoute('support.guest.tickets.message', ['uuid' => $ticket->uuid, 'email' => $request->email]),
        ]);
    }

    public function resolve(Request $request, string $uuid)
    {
        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();
        
        $token = $request->query('access_token');
        if ($ticket->guest_access_token !== $token) {
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
            'email' => 'required|email',
            'message' => 'required|string|max:2000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*.uuid' => 'required_with:attachments|string|max:255',
            'attachments.*.url' => 'nullable|string|max:2000',
            'attachments.*.name' => 'nullable|string|max:255',
            'attachments.*.size' => 'nullable|integer|max:5242880',
            'attachments.*.mimeType' => 'nullable|string|max:255',
        ]);

        $ticket = SupportTicket::where('uuid', $uuid)->firstOrFail();
        if (!$ticket->guest_email || strtolower($ticket->guest_email) !== strtolower($request->email)) {
            abort(403);
        }

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_role' => 'supporter',
            'sender_user_id' => null,
            'message' => $request->message,
            'attachments' => $request->attachments,
        ]);

        $ticket->last_message_at = now();
        $ticket->last_supporter_message_at = now();
        if ($ticket->status !== 'resolved' && $ticket->status !== 'rejected' && $ticket->status !== 'refund_initiated') {
            $ticket->status = 'awaiting_creator';
            $ticket->sla_deadline = Carbon::now()->addHours(48);
            $ticket->reminder_24h_sent_at = null;
            $ticket->reminder_6h_sent_at = null;
        }
        $ticket->save();
        
        $creator = User::find($ticket->creator_id);
        if ($creator && $creator->email) {
            Mail::to($creator->email)
                ->send(new SupportTicketUpdatedMail($ticket));
                
            \App\Helpers::sendNotification(
                'Ticket Updated',
                'The supporter has replied to the support request (Ticket #' . explode('-', $ticket->uuid)[0] . ').',
                $creator->email
            );
        }

        return response()->json(['status' => true]);
    }
}
