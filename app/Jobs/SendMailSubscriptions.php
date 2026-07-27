<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendMailSubscriptions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $subs = Subscription::where('end_at', '>=', Carbon::now())->where('status', 1)->get();

        foreach ($subs as $key => $value) {

            if ($value->user->notification_send == 1) {
                EmailService::sendSubscriptionMail($value);
            }
        }
    }
}
