<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Checkout extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    public $anon;
    public $surprise;
    public $messages;
    public $anonname;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $anon, $surprise, $messages, $anonname)
    {
        $this->data = $data;
        $this->anon = $anon;
        $this->surprise = $surprise;
        $this->messages = $messages;
        $this->anonname = $anonname;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Surprise Gift Granted on Spenny Piggy! ';
            return $this->view('email.checkout')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
