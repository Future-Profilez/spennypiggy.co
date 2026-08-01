<?php

namespace App\Mail;

use App\Models\Currency;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskPurchasedSupporterMail extends Mailable
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
        if (! $this->task->relationLoaded('creator')) {
            $this->task->load(['creator']);
        }
        if ($this->purchase && ! $this->purchase->relationLoaded('supporter')) {
            $this->purchase->load(['supporter']);
        }

        $subject = 'Task Purchase Confirmation: '.$this->task->title;

        $currencySymbol = Currency::where('ISO', $this->task->currency)->value('symbol') ?? '$';

        $deliverableUrl = null;
        if ($this->task->type === 'instant' && $this->task->deliverable_content) {
            if (str_starts_with($this->task->deliverable_content, 'http')) {
                $deliverableUrl = $this->task->deliverable_content;
            } else {
                $deliverableUrl = route('task.download', $this->task->uuid);
            }
        }

        return $this->view('email.taskpurchased_supporter')
            ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
            ->subject($subject)
            ->with([
                'currencySymbol' => $currencySymbol,
                'deliverableUrl' => $deliverableUrl,
            ]);
    }
}
