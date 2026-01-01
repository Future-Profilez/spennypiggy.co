<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskProofSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $purchase;
    public $task;
    public $creator;

    public function __construct($purchase, $task, $creator)
    {
        $this->purchase = $purchase;
        $this->task = $task;
        $this->creator = $creator;
    }

    public function build()
    {
        $subject = "Proof submitted for task: " . $this->task->title;

        return $this->view('email.taskproofsubmitted')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
    }
}
