<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskProofAcceptedSupporterMail extends Mailable
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
        return $this->view('email.taskproofaccepted_supporter')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject('Task Completed: ' . $this->task->title);
    }
}
