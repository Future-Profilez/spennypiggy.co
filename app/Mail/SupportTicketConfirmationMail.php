<?php

namespace App\Mail;

use App\Models\SupportTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class SupportTicketConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $supportUrl;

    public function __construct(SupportTicket $ticket)
    {
        $this->ticket = $ticket;
        if ($ticket->supporter_id) {
            $this->supportUrl = url('/history');
        } else {
            $this->supportUrl = URL::signedRoute('support.guest.tickets.show', ['uuid' => $ticket->uuid, 'email' => $ticket->guest_email]);
        }
    }

    public function build()
    {
        return $this->view('email.support-ticket-confirmation')
            ->subject('Support Request Received');
    }
}
