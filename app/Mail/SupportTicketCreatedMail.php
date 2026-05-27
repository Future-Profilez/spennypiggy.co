<?php

namespace App\Mail;

use App\Models\SupportTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SupportTicketCreatedMail extends Mailable
{
    use Queueable, SerializesModels;
    
    public $ticket;
    public $initialMessage;

    public function __construct(SupportTicket $ticket, $initialMessage = null) {
        $this->ticket = $ticket;
        $this->initialMessage = $initialMessage;
    }

    public function build()
    {
        return $this->view('email.support-ticket-created')
            ->subject('New Support Request');
    }
}

