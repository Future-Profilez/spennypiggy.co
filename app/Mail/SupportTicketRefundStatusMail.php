<?php

namespace App\Mail;

use App\Models\SupportTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class SupportTicketRefundStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;

    public $supportUrl;

    public $status;

    public $forRole;

    public function __construct(SupportTicket $ticket, $status, $forRole)
    {
        $this->ticket = $ticket;
        $this->status = $status;
        $this->forRole = $forRole;
        if ($forRole === 'supporter') {
            if ($ticket->supporter_id) {
                $this->supportUrl = url('/history');
            } else {
                $this->supportUrl = URL::signedRoute('support.guest.tickets.show', ['uuid' => $ticket->uuid, 'email' => $ticket->guest_email]);
            }
        } else {
            $this->supportUrl = url('/creator/disputes');
        }
    }

    public function build()
    {
        return $this->view('email.support-ticket-refund-status')
            ->subject('Refund Request '.ucfirst($this->status));
    }
}
