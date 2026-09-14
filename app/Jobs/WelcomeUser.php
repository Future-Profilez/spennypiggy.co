<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class WelcomeUser implements ShouldQueue
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
        $this->social = $social;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {

        /*
         * 🚨 `role` DECIDES WHICH WELCOME MAIL IS SENT, and until 12 Sep 2026 it
         * was not passed — so every creator got the supporter's mail, which told
         * them to go and support somebody. `App\Mail\Welcome` reads it; a
         * missing value falls back to the supporter mail, which is the safer of
         * the two to send to the wrong person.
         */
        $emailData = [
            'to' => $this->user->email,
            'name' => $this->user->name,
            'username' => $this->user->username,
            'phone' => $this->user->phone,
            'email' => $this->user->email,
            'uuid' => $this->user->uuid,
            'role' => (int) $this->user->role,
        ];

        EmailService::welcome($emailData);
    }
}
