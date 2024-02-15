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
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($tip,$symbol)
    {
        $this->tip = $tip;
        $this->symbol = $symbol;
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
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
