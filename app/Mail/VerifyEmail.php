<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {

            // print_r($this->data);
            // die;
            $subject = 'Verify email from spanny piggy platform.';
            return $this->view('email.user-verification')
                ->from('Noreply@spennypiggy.co', 'SPENNYPIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
            \Log::info($e);
        }
    }
}
