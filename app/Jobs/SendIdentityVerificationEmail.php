<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use App\Mail\IdentityVerificationSuccess;
use App\Mail\IdentityVerificationFailed;
use App\Mail\IdentityVerificationProcess;
use Illuminate\Support\Facades\Log;

class SendIdentityVerificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;
    protected $status;
    /**
     * Create a new job instance.
     */
    public function __construct($user, $status)
    {
        Log::info("come in function construct " . $user->id);
        $this->user = $user;
        $this->status = $status;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->status == 'success') {
            Mail::to($this->user->email)->send(new IdentityVerificationSuccess($this->user));
        } elseif ($this->status == 'failed') {
            Log::info("come in failed function");
            Mail::to($this->user->email)->send(new IdentityVerificationFailed($this->user));
        } elseif ($this->status == 'process') {
            Mail::to($this->user->email)->send(new IdentityVerificationProcess($this->user));
        }
    }
}
