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
use Illuminate\Support\Facades\Log;
use Mail;

class MonthlySubscribedJob implements ShouldQueue
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
        Log::info("come in MonthlySubscribedJobs class handle function");
        if ((isset($this->sub->user) && $this->sub->user->notification_send == 1) || (empty($this->sub->user))) {
            Log::info("come in handle function if condition");
            EmailService::sendMonthlySubscribedMail($this->sub);
        }
    }
}
