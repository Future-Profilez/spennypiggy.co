<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class WishSubscriptionMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sub;

    public $mailToSend;

    public $amountTotal;

    public $creator_name;

    public $is_renewal;

    /**
     * Create a new job instance.
     *
     * @param  User  $user
     * @param  bool  $social  = false
     * @return void
     */
    public function __construct($sub, $mailToSend, $amountTotal, $creator_name, $is_renewal = false)
    {
        $this->sub = $sub;
        $this->mailToSend = $mailToSend;
        $this->amountTotal = $amountTotal;
        $this->creator_name = $creator_name;
        $this->is_renewal = $is_renewal;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if ((isset($this->sub) && $this->sub->user->notification_send == 1) || (empty($this->sub->user))) {
            EmailService::wishSubscriptionMailToUser($this->sub, $this->mailToSend, $this->amountTotal, $this->creator_name, $this->is_renewal);
        }
    }
}
