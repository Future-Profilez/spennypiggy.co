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
        $overdue = SupportTicket::where('status', 'awaiting_creator')
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', now())
            ->whereNull('escalated_at')
            ->get();

        foreach ($overdue as $ticket) {
            $ticket->status = 'escalated';
            $ticket->escalated_at = now();
            $ticket->save();

            Mail::to(['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com'])
                ->send(new SupportTicketEscalatedMail($ticket));
        }
    }
}

