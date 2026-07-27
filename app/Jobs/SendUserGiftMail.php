<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendUserGiftMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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
    public $owner;

    /**
     * Create a new job instance.
     *
     * @param  User  $user
     * @param  bool  $social  = false
     * @return void
     */
    public function __construct($user, $owner)
    {
        $this->user = $user;
        $this->owner = $owner;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if ($this->user->notification_send == 1) {
            $emailData = [
                'to' => $this->user->email,
                'name' => $this->user->name,
                // 'ownername' =>
                'username' => $this->user->username,
                'phone' => $this->user->phone,
                'email' => $this->user->email,
                'uuid' => $this->user->uuid,
            ];
            EmailService::verifyUserEmail($emailData);
        }
    }
}
