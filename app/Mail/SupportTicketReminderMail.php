<?php

namespace App\Mail;

use App\Models\SupportTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SupportTicketReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public SupportTicket $ticket, public int $hoursLeft) {}

    public function build()
    {
        return $this->view('email.support-ticket-reminder')
            ->subject('Reminder: Support request pending');
    }
}

