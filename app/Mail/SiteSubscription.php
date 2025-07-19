<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SiteSubscription extends Mailable
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

        return $this->subject('Subscription Update')
            ->view('email.sitesubscription')  
            ->with([
                'array' => $this->array,
                'type' => $this->type,
                'module' => $this->module,
            ]);
    }
}

