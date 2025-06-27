<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RenewMail extends Mailable
{
    use Queueable, SerializesModels;
    public $array;
    public $type;
    public $module;
    /**
     * Create a new message instance.
     */
    public function __construct($array,$type,$module)
    {
        $this->array = $array;
        $this->type = $type;
        $this->module = $module;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            if($this->module == 'bill' || $this->module == 'membership' || $this->module == 'site'){
                $subject = "Subscription for $this->module " . $this->type . ".";
            }
            else{
                $subject = 'Subscription ' . $this->type . ".";
            }
            return $this->view('email.subscription-renew')
                ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
                ->subject($subject);
        } catch (\Exception $e) {
        }
    }
}
