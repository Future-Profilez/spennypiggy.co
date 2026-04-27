<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RenewMail extends Mailable
{
    use Queueable, SerializesModels;

    public $array;
    public $type;
    public $module;

    public function __construct($array, $type, $module)
    {
        $this->array = $array;
        $this->type = $type;
        $this->module = $module;
    }

    public function build()
    {

        return $this->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Spenny Piggy Subscription Status Notification')
            ->view('email.subscription-renew')  
            ->with([
                'array' => $this->array,
                'type' => $this->type,
                'module' => $this->module,
            ]);
    }
}

