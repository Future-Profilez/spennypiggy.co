<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskGracePeriodStartedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        return $this->view('email.taskgraceperiodstarted')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject('Grace Period Started ⏳');
    }
}
