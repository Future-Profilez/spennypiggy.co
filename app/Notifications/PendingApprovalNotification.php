<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage as Mailable;
use Illuminate\Notifications\Notification;

class PendingApprovalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $pendingSummary;

    public function __construct($pendingSummary)
    {
        $this->pendingSummary = $pendingSummary;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new Mailable)
            ->subject('Summary of Pending Approvals - '.env('APP_NAME'))
            ->view('email.pending_approval_summary', [
                'pendingSummary' => $this->pendingSummary,
            ]);
    }
}
