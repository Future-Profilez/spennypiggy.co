<?php

namespace App\Mail;

use App\Models\EarlyFraudWarning;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FraudWarningMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $fraudWarning;
    public $eventType;

    /**
     * Create a new message instance.
     *
     * @param User $user
     * @param EarlyFraudWarning $fraudWarning
     * @param string $eventType
     */
    public function __construct(User $user, EarlyFraudWarning $fraudWarning, string $eventType)
    {
        $this->user = $user;
        $this->fraudWarning = $fraudWarning;
        $this->eventType = $eventType;

        Log::debug('FraudWarningMail constructed', [
            'user_id' => $user->id,
            'fraud_warning_id' => $fraudWarning->id,
            'event_type' => $eventType,
        ]);
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // UPDATED: Better subject formatting
        $subject = match ($this->eventType) {
            'created' => '🚨 Fraud Warning Alert - ' . config('app.name'),
            'updated' => '🔄 Fraud Warning Updated - ' . config('app.name'),
            'closed' => '✅ Fraud Warning Resolved - ' . config('app.name'),
            default => '⚠️ Fraud Warning Notification - ' . config('app.name'),
        };

        return $this->subject($subject)
            ->view('email.fraud-warning')
            ->with([
                'user' => $this->user,
                'fraudWarning' => $this->fraudWarning,
                'eventType' => $this->eventType,
            ]);
    }
}
