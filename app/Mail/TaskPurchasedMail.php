<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskPurchasedMail extends Mailable
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
        $supporterName = $this->supporter ? $this->supporter->name : 'A Guest';
        $subject = "$supporterName purchased your task: " . $this->task->title;

        $currencySymbol = \App\Models\Currency::where('ISO', $this->task->currency)->value('symbol') ?? '$';

        return $this->view('email.taskpurchased')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject)
            ->with(['currencySymbol' => $currencySymbol]);
    }
}
