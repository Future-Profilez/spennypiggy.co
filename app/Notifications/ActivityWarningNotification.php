<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ActivityWarningNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $activityData;
    protected $warningType;

    public function __construct(array $activityData, string $warningType = 'general')
    {
        $this->activityData = $activityData;
        $this->warningType = $warningType;
    }

    public function via($notifiable)
    {
        return ['mail', 'database', 'push'];
    }

    public function toMail($notifiable)
    {
        $mail = (new MailMessage)
            ->greeting("Hi {$notifiable->name}!");

        switch ($this->warningType) {
            case 'grace_period_ending':
                $daysRemaining = $this->activityData['days_remaining'] ?? 0;
                $currentContent = $this->activityData['current_content'] ?? 0;
                
                $mail->subject('⏰ Grace Period Ending Soon')
                    ->line("Your 30-day onboarding period ends in {$daysRemaining} days.")
                    ->line("")
                    ->line("**Current content:** {$currentContent}/3 items")
                    ->line("**What happens next:** After your grace period ends, you'll need 3+ content items from the last 28 days to receive payments.")
                    ->line("")
                    ->line("**Recommended action:** Add " . (3 - $currentContent) . " more content items now to ensure uninterrupted payments.");
                break;
                
            case 'insufficient_content':
                $needed = $this->activityData['needed'] ?? 1;
                
                $mail->subject('📝 Content Update Needed')
                    ->line("Your payment eligibility requires attention.")
                    ->line("")
                    ->line("**Current activity:** {$this->activityData['content_count']}/3 items in the last 28 days")
                    ->line("**Action needed:** Add {$needed} more content item" . ($needed > 1 ? 's' : '') . " to continue receiving payments.")
                    ->line("")
                    ->line("Don't worry - this takes just a few minutes!");
                break;
                
            default:
                $mail->subject('📊 Activity Status Update')
                    ->line("Just a friendly reminder about your content activity.")
                    ->line("")
                    ->line("**Current status:** {$this->activityData['message']}");
        }

        // Add content suggestions
        $suggestions = $this->activityData['suggestions'] ?? [];
        if (!empty($suggestions)) {
            $mail->line("")
                ->line("**Quick options:**");
                
            foreach (array_slice($suggestions, 0, 2) as $suggestion) {
                $mail->action($suggestion['title'], url($suggestion['action_url']));
            }
        }

        return $mail
            ->line("")
            ->line("Your supporters are waiting to support your amazing work!")
            ->action('View Dashboard', url('/dashboard'))
            ->salutation("Keep creating! 🎨\nThe Spenny Piggy Team");
    }

    public function toDatabase($notifiable)
    {
        $titles = [
            'grace_period_ending' => '⏰ Grace Period Ending Soon',
            'insufficient_content' => '📝 Content Update Needed',
            'general' => '📊 Activity Reminder'
        ];

        return [
            'type' => 'activity_warning',
            'title' => $titles[$this->warningType] ?? $titles['general'],
            'message' => $this->activityData['message'] ?? 'Please check your content activity status.',
            'data' => [
                'warning_type' => $this->warningType,
                'current_content' => $this->activityData['content_count'] ?? 0,
                'needed_content' => $this->activityData['needed'] ?? 0,
                'breakdown' => $this->activityData['breakdown'] ?? [],
                'suggestions' => $this->activityData['suggestions'] ?? [],
                'grace_period' => [
                    'active' => $this->activityData['grace_period']['active'] ?? false,
                    'days_remaining' => $this->activityData['days_remaining'] ?? 0
                ]
            ],
            'action_url' => '/dashboard',
            'priority' => 'medium'
        ];
    }

    public function toPush($notifiable)
    {
        switch ($this->warningType) {
            case 'grace_period_ending':
                $daysRemaining = $this->activityData['days_remaining'] ?? 0;
                $currentContent = $this->activityData['current_content'] ?? 0;
                $needed = 3 - $currentContent;
                
                return [
                    'title' => '⏰ Grace Period Ending Soon',
                    'content' => "Your grace period ends in {$daysRemaining} days. You have {$currentContent}/3 content items. Add {$needed} more to ensure uninterrupted payments!"
                ];
                
            case 'insufficient_content':
                $needed = $this->activityData['needed'] ?? 1;
                $currentContent = $this->activityData['content_count'] ?? 0;
                
                return [
                    'title' => '📝 Content Update Needed',
                    'content' => "You have {$currentContent}/3 content items from the last 28 days. Add {$needed} more item" . ($needed > 1 ? 's' : '') . " to continue receiving payments!"
                ];
                
            default:
                return [
                    'title' => '📊 Activity Reminder',
                    'content' => $this->activityData['message'] ?? 'Please check your content activity status to ensure payment eligibility.'
                ];
        }
    }

    public function toArray($notifiable)
    {
        return $this->toDatabase($notifiable);
    }
}
