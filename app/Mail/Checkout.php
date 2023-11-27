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

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $anon, $surprise, $messages)
    {
        $this->data = $data;
        $this->anon = $anon;
        $this->surprise = $surprise;
        $this->messages = $messages;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Checkout from spanny piggy platform.';
            return $this->view('email.checkout')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
