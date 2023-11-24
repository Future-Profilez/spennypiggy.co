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
    public $message;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $anon, $surprise, $message)
    {
        $this->data = $data;
        $this->anon = $anon;
        $this->surprise = $surprise;
        $this->message = $message;
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
