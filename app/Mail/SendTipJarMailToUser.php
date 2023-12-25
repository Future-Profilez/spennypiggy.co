<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendTipJarMailToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $tip;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($tip)
    {
        $this->tip = $tip;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'You’ve just granted a tip on a tip jar on Spenny Piggy.';
            return $this->view('email.tip-granted')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
