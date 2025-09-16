<?php

namespace App\Notifications;

use App\Helpers;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class SubscriptionBlockedNotification extends Notification
{
    use Queueable;

    protected $subscriptionData;
    protected $paymentAmount;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $subscriptionData, $paymentAmount = 0)
    {
        $this->subscriptionData = $subscriptionData;
        $this->paymentAmount = $paymentAmount;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable)
    {
        return ['mail', 'push'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('🚨 Payment Alert - Subscription Required')
            ->view('email.subscription_blocked_notification', [
                'creator' => $notifiable,
                'subscriptionData' => $this->subscriptionData,
                'paymentAmount' => $this->paymentAmount,
            ]);
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable)
    {
        return [
            'notification' => 'Payment Blocked - Subscription Required: A payment was blocked because your subscription is not active.',
            'module' => 'subscription',
            'target_id' => $notifiable->id,
            'is_read' => 0
        ];
    }

    /**
     * Get the push notification representation of the notification.
     */
    public function toPush($notifiable)
    {
        return [
            'title' => '🚨 Payment Alert - Subscription Required',
            'content' => 'A payment was blocked because your subscription is not active. Please update your subscription to continue receiving payments.'
        ];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable)
    {
        return $this->toDatabase($notifiable);
    }
}