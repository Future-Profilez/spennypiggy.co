<?php

namespace App\Jobs;

use App\EmailService;
use App\Mail\MonthlySubscriptionFailedMail;
use App\Mail\MonthlySubscriptionSuccessMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MonthlySubscribedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $email;
    public $sub;
    public $type;

    /**
     * Create a new job instance.
     */
    public function __construct($email, $sub, $type)
    {
        $this->email = $email;
        $this->sub = $sub;
        $this->type = $type; // 'success' or 'failure'
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        if ($this->type === 'success') {
            EmailService::sendMonthlySubscribedMail($this->email, $this->sub);
            // Mail::to($this->email)->send(new MonthlySubscriptionSuccessMail($this->sub));
        } elseif ($this->type === 'failure') {
            // Mail::to($this->email)->send(new MonthlySubscriptionFailedMail($this->sub));
            EmailService::monthlySubscribedFailedMail($this->email, $this->sub);
        }
    }
    // public function handle(): void
    // {
    //     if((isset($this->sub->user) && $this->sub->user->notification_send == 1) || empty($this->sub->user)){
    //         EmailService::subscriptionFailed($this->sub);
    //     }
    // }
}
