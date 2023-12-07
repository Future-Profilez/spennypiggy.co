<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CheckError extends Mailable
{
    use Queueable, SerializesModels;
    public $th;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($th)
    {
        $this->th = $th;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Check Error.';
            return $this->view('email.check_error')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
