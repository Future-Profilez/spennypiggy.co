<?php

namespace App\Console\Commands;

use App\Mail\SupportTicketEscalatedMail;
use App\Mail\SupportTicketReminderMail;
use App\Models\SupportTicket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class ProcessSupportTickets extends Command
{
    protected $signature = 'app:process-support-tickets';
    protected $description = 'Send reminders and escalate support tickets when creator does not respond within SLA';

    public function handle()
    {
        $this->sendReminders();
        $this->escalateOverdue();

        return 0;
    }

    private function sendReminders(): void
    {
        $now = Carbon::now();

        $tickets = SupportTicket::where('status', 'awaiting_creator')
            ->whereNotNull('sla_deadline')
            ->whereNull('escalated_at')
            ->get();

        foreach ($tickets as $ticket) {
            $creator = User::find($ticket->creator_id);
            if (!$creator || !$creator->email) {
                continue;
            }

            $hoursLeft = max(0, $now->diffInHours($ticket->sla_deadline, false));
            if ($hoursLeft <= 0) {
                continue;
            }

            if ($hoursLeft <= 24 && !$ticket->reminder_24h_sent_at) {
                Mail::to($creator->email)
                    ->bcc(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                    ->send(new SupportTicketReminderMail($ticket, $hoursLeft));
                $ticket->reminder_24h_sent_at = now();
                $ticket->save();
                continue;
            }

            if ($hoursLeft <= 6 && !$ticket->reminder_6h_sent_at) {
                Mail::to($creator->email)
                    ->bcc(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                    ->send(new SupportTicketReminderMail($ticket, $hoursLeft));
                $ticket->reminder_6h_sent_at = now();
                $ticket->save();
            }
        }
    }

    private function escalateOverdue(): void
    {
        // 1. Escalate tickets that missed their SLA deadline
        $overdueSla = SupportTicket::where('status', 'awaiting_creator')
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', now())
            ->whereNull('escalated_at')
            ->get();

        foreach ($overdueSla as $ticket) {
            $ticket->status = 'escalated';
            $ticket->escalated_at = now();
            $ticket->escalation_reason = 'SLA Deadline Missed';
            $ticket->save();

            Mail::to(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                ->send(new SupportTicketEscalatedMail($ticket));
        }

        // 2. Escalate ANY ticket that has been open for > 7 days and is not yet resolved/closed
        $overdue7Days = SupportTicket::whereIn('status', ['awaiting_creator', 'awaiting_supporter'])
            ->where('created_at', '<', now()->subDays(7))
            ->whereNull('escalated_at')
            ->get();

        foreach ($overdue7Days as $ticket) {
            $ticket->status = 'escalated';
            $ticket->escalated_at = now();
            $ticket->escalation_reason = 'Unresolved for 7 Days';
            $ticket->save();

            Mail::to(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                ->send(new SupportTicketEscalatedMail($ticket));
        }
    }
}

