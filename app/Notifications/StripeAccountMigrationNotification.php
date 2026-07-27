<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StripeAccountMigrationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $migrationResult;

    public function __construct($migrationResult)
    {
        $this->migrationResult = $migrationResult;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $username = $notifiable->username ?? 'Creator';
        $oldAccountId = $this->migrationResult['old_account_id'] ?? 'N/A';
        $newAccountId = $this->migrationResult['new_account_id'] ?? 'N/A';

        return (new MailMessage)
            ->subject('🚀 Your Spenny Piggy Payment Account Has Been Upgraded!')
            ->greeting("Hello {$username}!")
            ->line('Great news! We\'ve upgraded your payment processing account to improve compatibility and ensure you can receive payments from fans worldwide.')
            ->line('**What happened:** Your Stripe account has been migrated to support cross-border payments more effectively.')
            ->line('**What you need to do:** Complete a quick re-verification of your account to start receiving payments again.')
            ->action('Complete Account Setup', route('stripe.index'))
            ->line('**Why this happened:** This upgrade ensures creators in your region can receive payments without restrictions, especially from international supporters.')
            ->line('**Important:** This is a one-time process and will only take a few minutes to complete.')
            ->line('If you have any questions, please contact our support team. We\'re here to help!')
            ->line('Keep creating amazing content! 🎨')
            ->salutation('Best regards, The Spenny Piggy Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'stripe_account_migration',
            'old_account_id' => $this->migrationResult['old_account_id'] ?? null,
            'new_account_id' => $this->migrationResult['new_account_id'] ?? null,
            'requires_onboarding' => $this->migrationResult['onboarding_required'] ?? true,
        ];
    }
}
