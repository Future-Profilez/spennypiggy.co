<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskProofSubmittedCreatorMail extends Mailable
{
    use Queueable, SerializesModels;

    public $purchase;

    public $task;

    public function __construct($purchase, $task)
    {
        $this->purchase = $purchase;
        $this->task = $task;
    }

    public function build()
    {
        return $this->view('email.taskproofsubmitted_creator')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Your proof has been submitted: '.$this->task->title);
    }
}
