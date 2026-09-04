<?php

namespace App\Jobs;

use App\EmailService;
use App\Jobs\Concerns\RetriesCriticalWork;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class VerifyEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    /**
     * New Registered User
     *
     * @var User
     */
    public $user;

    /**
     * Is via Social
     *
     * @var bool
     */
    public $social;

    /**
     * Create a new job instance.
     *
     * @param  User  $user
     * @param  bool  $social  = false
     * @return void
     */
    public function __construct($user, $social = false)
    {
        $this->user = $user;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {

        $otp = \App\Http\Controllers\Auth\EmailVerificationNotificationController::getOrGenerateOtp($this->user);

        $emailData = [
            'to' => $this->user->email,
            'name' => $this->user->name,
            'username' => $this->user->username,
            'phone' => $this->user->phone,
            'email' => $this->user->email,
            'uuid' => $this->user->uuid,
            'otp' => $otp,
            // ⚠️ SIGNED, and built here rather than in the template. The uuid is a
            // public identifier, so a bare `/user/{uuid}` link let anyone mark any
            // account's email verified; and `env('APP_URL')` inside a Blade view is
            // NULL once the config is cached on deploy, so the link lost its host.
            'verify_url' => URL::temporarySignedRoute(
                'email.verify.uuid',
                now()->addDays(7),
                ['uuid' => $this->user->uuid]
            ),
        ];
        EmailService::verifyUserEmail($emailData);
    }
}
