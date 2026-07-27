<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Mail\IdentityVerificationFailed;
use App\Mail\IdentityVerificationSuccess;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendIdentityVerificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    protected $user;

    protected $status;

    /**
     * Create a new job instance.
     */
    public function __construct($user, $status)
    {
        $this->user = $user;
        $this->status = $status;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $emailClass = $this->getEmailClassForStatus($this->status);
            if ($emailClass) {
                Mail::to($this->user->email)->send(new $emailClass($this->user));
            } else {
                Log::warning("No email class defined for status: {$this->status} for user ID: {$this->user->id}");
            }
        } catch (\Exception $e) {
            Log::error("Error sending identity verification email for user ID: {$this->user->id}. Error: {$e->getMessage()}");
        }
    }

    /**
     * Get the appropriate email class based on the status.
     */
    protected function getEmailClassForStatus(string $status): ?string
    {
        $statusEmailMapping = [
            'success' => IdentityVerificationSuccess::class,
            'failed' => IdentityVerificationFailed::class,
            'fraud' => IdentityVerificationFailed::class,
        ];

        return $statusEmailMapping[$status] ?? null;
    }
}
