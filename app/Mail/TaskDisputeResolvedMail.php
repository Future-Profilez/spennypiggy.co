<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskDisputeResolvedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $purchase;
    public $task;
    public $user; // The user receiving the mail
    public $role; // 'creator' or 'supporter'
    public $resolution; // 'creator_won' or 'supporter_won'

    public function __construct($purchase, $task, $user, $role, $resolution)
    {
        $this->purchase = $purchase;
        $this->task = $task;
        $this->user = $user;
        $this->role = $role;
        $this->resolution = $resolution;
    }

    public function build()
    {
        $subject = "Dispute Resolved: " . $this->task->title;

        return $this->view('email.taskdisputeresolved')
            ->from('Noreply@spennypiggy.co', 'SPENNY PIGGY')
            ->subject($subject);
    }
}
