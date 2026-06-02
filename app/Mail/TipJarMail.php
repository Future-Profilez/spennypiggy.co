<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TipJarMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tip;
    public $symbol;
    public $net_amount;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($tip, $symbol, $net_amount = null)
    {
        $this->tip = $tip;
        $this->symbol = $symbol;
        $this->net_amount = $net_amount;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'You’ve just received a tip for your tip jar on Spenny Piggy.';
            return $this->view('email.tip-recieved')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
