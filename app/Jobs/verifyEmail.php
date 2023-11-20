<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class verifyEmail implements ShouldQueue
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
    public $social;

    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
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

        $emailData = [
            'to' => $this->user->email,
            'name' => $this->user->name,
            'username' => $this->user->username,
            'phone' => $this->user->phone,
            'email' => $this->user->email,
            'uuid' => $this->user->uuid,
        ];
        \Log::info('2');

        $emailService = new EmailService();
        $emailService->verifyUserEmail($emailData);
    }
}
