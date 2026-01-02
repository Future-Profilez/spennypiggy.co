<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskApprove extends Mailable
{
    use Queueable, SerializesModels;

    public $task;

    public function __construct($task)
    {
        $this->task = $task;
    }

    public function build()
    {
        return $this->view('email.taskapprove')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject('Task Approved! ✅');
    }
}
