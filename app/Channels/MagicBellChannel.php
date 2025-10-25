<?php

namespace App\Channels;

use App\Helpers;
use Illuminate\Notifications\Notification;

class MagicBellChannel
{
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        // Get the notification data
        $message = $notification->toPush($notifiable);
        
        // Extract title, content, and email
        $title = $message['title'] ?? 'New Notification';
        $content = $message['content'] ?? '';
        $email = $notifiable->email ?? $notifiable->routeNotificationFor('mail');
        
        // Send notification using your existing Helpers method
        if ($email) {
            Helpers::sendNotification($title, $content, $email);
        }
    }
}