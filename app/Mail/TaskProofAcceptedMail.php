<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskProofAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $purchase;
    public $task;
    public $supporter;

    public function __construct($purchase, $task, $supporter)
    {
        $this->purchase = $purchase;
        $this->task = $task;
        $this->supporter = $supporter;
    }

    public function build()
    {
        $subject = "Proof accepted for task: " . $this->task->title;

        return $this->view('email.taskproofaccepted')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
    }
}
