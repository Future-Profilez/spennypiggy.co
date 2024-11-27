<?php

namespace App\Jobs;

use App\EmailService;
use App\Mail\MonthlySubscriptionSuccessMail;
use App\Mail\SubscriptionSuccessMail;
use App\Models\MonthlyCharge;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Mail;

class MonthlySubscriptionFailedJobs implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $sub;

    /**
     * Create a new job instance.
     *
     * @param MonthlyCharge $subscription
     * @return void
     */
    public function __construct(MonthlyCharge $sub)
    {
        $this->sub = $sub;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if ((isset($this->subs->user) && $this->sub->user->notification_send == 1) || (empty($this->sub->user))) {
            EmailService::monthlySubscribedFailedMail($this->sub);
        }
    }
}
