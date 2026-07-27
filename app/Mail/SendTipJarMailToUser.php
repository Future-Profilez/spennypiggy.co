<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SendTipJarMailToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $tip;

    public $symbol;

    public $amount;

    /**
     * Create a new job instance.
     *
     * @param  User  $user
     * @param  bool  $social  = false
     * @return void
     */
    public function __construct($tip, $symbol, $amount)
    {
        $this->tip = $tip;
        $this->symbol = $symbol;
        $this->amount = $amount;
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
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
