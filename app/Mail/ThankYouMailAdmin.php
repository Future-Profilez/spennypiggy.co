<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ThankYouMailAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public $pay;
    /**
     * Create a new message instance.
     */
    public function __construct($pay)
    {
        $this->pay = $pay;
    }

      /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'New thank you message to approve.';
            return $this->view('email.new-thanks-message')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
