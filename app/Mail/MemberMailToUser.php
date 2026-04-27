<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MemberMailToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $mem;
    public $amountWithcurrency;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($mem, $amountWithcurrency)
    {
        $this->mem = $mem;
        $this->amountWithcurrency = $amountWithcurrency;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            $subject = 'Membership Granted on Spenny Piggy!';
            return $this->view('email.membership_to_user')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
