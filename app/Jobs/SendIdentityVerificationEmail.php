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
        $emailClass = $this->getEmailClassForStatus($this->status);

        if (! $emailClass) {
            Log::warning("No email class defined for status: {$this->status} for user ID: {$this->user->id}");

            return;
        }

        // Deliberately NOT wrapped in try/catch. Swallowing the exception here
        // made RetriesCriticalWork inert — the job "succeeded" on a transient
        // SMTP blip, so neither the retries nor failed() ever ran and the
        // creator was never told their ID check had failed.
        Mail::to($this->user->email)->send(new $emailClass($this->user));
    }

    /**
     * Named in the critical-failure log so the lost email can be traced to a
     * person, not just a stack trace.
     */
    public function failureContext(): array
    {
        return [
            'user_id' => $this->user->id ?? null,
            'email' => $this->user->email ?? null,
            'status' => $this->status,
        ];
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
