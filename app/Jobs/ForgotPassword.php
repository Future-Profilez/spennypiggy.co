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

class ForgotPassword implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    /**
     * New Registered User
     *
     * @var User
     */
    public $user;

    /**
     * Single-use reset token. The link is worthless without it — the uuid in the
     * URL only says WHICH account, it proves nothing.
     *
     * @var string
     */
    public $token;

    /**
     * Create a new job instance.
     *
     * @param  User  $user
     * @param  string  $token
     * @return void
     */
    public function __construct($user, $token = '')
    {
        $this->user = $user;
        $this->token = (string) $token;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {

        $emailData = [
            'to' => $this->user->email,
            'name' => $this->user->name,
            'username' => $this->user->username,
            'email' => $this->user->email,
            'uuid' => $this->user->uuid,
            'token' => $this->token,
            // Built here, not in the template: `env('APP_URL')` inside a Blade view
            // returns NULL once the config is cached (every Vapor deploy), which
            // shipped a reset link pointing at `/forgot-password/...` with no host.
            'reset_url' => rtrim((string) config('app.url'), '/')
                .'/forgot-password/'.$this->user->uuid
                .'?token='.urlencode($this->token),
        ];

        // Not swallowed: RetriesCriticalWork gives this job three attempts and a
        // Log::critical on final failure. Catching here meant one SMTP blip lost
        // the reset mail permanently and silently.
        EmailService::ForgotPassword($emailData);
    }
}
