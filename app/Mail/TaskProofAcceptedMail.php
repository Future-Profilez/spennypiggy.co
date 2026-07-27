<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
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
        $subject = 'Proof accepted for task: '.$this->task->title;

        return $this->view('email.taskproofaccepted')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
    }
}
