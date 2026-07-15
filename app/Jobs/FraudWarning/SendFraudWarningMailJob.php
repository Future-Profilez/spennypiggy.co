<?php

namespace App\Jobs\FraudWarning;

use App\Models\EarlyFraudWarning;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use App\Mail\FraudWarningMail;
use Illuminate\Support\Facades\Log;

class SendFraudWarningMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // UPDATED: Store full model for now (to match controller expectations)
    protected $user;
    protected $fraudWarning;
    protected $eventType;

    // UPDATED: Add retry configuration
    public $tries = 3;
    public $backoff = [60, 300, 600]; // 1 min, 5 min, 10 min

    /**
     * Create a new job instance.
     *
     * @param User $user
     * @param EarlyFraudWarning $fraudWarning
     * @param string $eventType 'created', 'updated', 'closed'
     */
    public function __construct(User $user, EarlyFraudWarning $fraudWarning, string $eventType)
    {
        $this->user = $user;
        $this->fraudWarning = $fraudWarning;
        $this->eventType = $eventType;

        Log::info('FraudWarningMailJob created', [
            'user_id' => $user->id,
            'fraud_warning_id' => $fraudWarning->id,
            'event_type' => $eventType,
        ]);
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            // UPDATED: Refresh models from database
            $user = User::find($this->user->id);
            $fraudWarning = EarlyFraudWarning::find($this->fraudWarning->id);

            if (!$user) {
                Log::error('User not found for fraud warning email', [
                    'user_id' => $this->user->id,
                    'fraud_warning_id' => $this->fraudWarning->id,
                ]);
                return;
            }

            if (!$fraudWarning) {
                Log::error('Fraud warning not found for email', [
                    'fraud_warning_id' => $this->fraudWarning->id,
                    'user_id' => $this->user->id,
                ]);
                return;
            }

            Log::info('Sending fraud warning email', [
                'user_id' => $user->id,
                'fraud_warning_id' => $fraudWarning->id,
                'event_type' => $this->eventType,
            ]);

            Mail::to($user->email)->send(
                new FraudWarningMail($user, $fraudWarning, $this->eventType)
            );

            Log::info('Fraud warning email sent successfully', [
                'user_id' => $user->id,
                'fraud_warning_id' => $fraudWarning->id,
                'event_type' => $this->eventType,
            ]);
        } catch (\Exception $e) {
            Log::error('SendFraudWarningMailJob failed', [
                'user_id' => $this->user->id,
                'fraud_warning_id' => $this->fraudWarning->id,
                'event_type' => $this->eventType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        Log::error('SendFraudWarningMailJob failed permanently', [
            'user_id' => $this->user->id,
            'fraud_warning_id' => $this->fraudWarning->id,
            'event_type' => $this->eventType,
            'error' => $exception->getMessage(),
        ]);
    }
}
