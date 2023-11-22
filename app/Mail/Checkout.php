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

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $anon)
    {
        $this->data = $data;
        $this->anon = $anon;
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
                ->from('Noreply@whoyouinto.com', 'SPENNYPIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
