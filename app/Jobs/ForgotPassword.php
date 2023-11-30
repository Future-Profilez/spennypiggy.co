<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\AppService;
use App\Models\AutoMessage;
use App\Models\Follower;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ForgotPassword implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * New Registered User
     * @var \App\Models\User
     */
    public $user;

    /**
     * Is via Social
     * @var bool
     */

    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($user)
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

        $emailData = [
            'to' => $this->user->email,
            'name' => $this->user->name,
            'username' => $this->user->username,
            'email' => $this->user->email,
            'uuid' => $this->user->uuid,
        ];

        \Log::info('1 data:' . $emailData);
        EmailService::ForgotPassword($emailData);
    }
}
