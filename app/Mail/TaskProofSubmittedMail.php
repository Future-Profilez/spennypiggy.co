<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
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
        $subject = 'Proof submitted for task: '.$this->task->title;

        $proofUrl = null;
        if ($this->purchase->proof_file) {
            // Check if it's a URL or a local path
            if (str_starts_with($this->purchase->proof_file, 'http')) {
                $proofUrl = $this->purchase->proof_file;
            } else {
                $proofUrl = asset('storage/'.$this->purchase->proof_file);
            }
        }

        return $this->view('email.taskproofsubmitted')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject)
            ->with(['proofUrl' => $proofUrl]);
    }
}
