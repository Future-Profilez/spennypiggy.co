<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskDisputeEscalatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $purchase;

    public $task;

    public $user; // The user receiving the mail

    public $role; // 'creator' or 'supporter'

    public function __construct($purchase, $task, $user, $role)
    {
        $this->purchase = $purchase;
        $this->task = $task;
        $this->user = $user;
        $this->role = $role;
    }

    public function build()
    {
        $subject = 'Dispute Escalated to Admin: '.$this->task->title;

        return $this->view('email.taskdisputeescalated')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject);
    }
}
