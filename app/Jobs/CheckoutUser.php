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

class CheckoutUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * New Registered User
     * @var \App\Models\User
     */
    public $payment;

    /**
     * Is via Social
     * @var bool
     */
    public $anon;

    public $surprise;
    public $message;

    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($payment, $anon, $surprise, $message)
    {
        $this->payment = $payment;
        $this->anon = $anon;
        $this->surprise = $surprise;
        $this->message = $message;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        \Log::info('messageinfo1'. $this->message);
        EmailService::checkOutUser($this->payment, $this->anon, $this->surprise, $this->message);
    }
}
