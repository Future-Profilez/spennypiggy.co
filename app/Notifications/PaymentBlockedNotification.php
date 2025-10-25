<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\View;

class PaymentBlockedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $activityData;
    protected $paymentAmount;

    public function __construct(array $activityData, $paymentAmount = null)
    {
        $this->activityData = $activityData;
        $this->paymentAmount = $paymentAmount;
    }

    public function via($notifiable)
    {
        return ['mail', 'push'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('🚨 Payment Alert - Content Update Needed')
            ->view('email.payment_blocked_notification', [
                'creator' => $notifiable,
                'activityData' => $this->activityData,
                'paymentAmount' => $this->paymentAmount,
            ]);
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => '🚨 Payment Blocked',
            'message' => "A payment was blocked due to insufficient content activity. You need {$this->activityData['needed']} more items.",
            'current_content' => $this->activityData['content_count'],
            'needed_content' => $this->activityData['needed'],
            'breakdown' => $this->activityData['breakdown'] ?? [],
            'suggestions' => $this->activityData['suggestions'] ?? [],
            'payment_amount' => $this->paymentAmount,
            'action_url' => '/dashboard',
            'priority' => 'high'
        ];
    }

    public function toPush($notifiable)
    {
        $paymentText = $this->paymentAmount ? "£" . number_format($this->paymentAmount, 2) : "a payment";
        $needed = $this->activityData['needed'] ?? 1;
        
        return [
            'title' => '🚨 Payment Alert - Content Needed',
            'content' => "Someone tried to pay you {$paymentText}, but you need {$needed} more content item" . ($needed > 1 ? 's' : '') . " from the last 28 days to receive payments. Add content now to unlock payments!"
        ];
    }

    public function toArray($notifiable)
    {
        return $this->toDatabase($notifiable);
    }
}
