<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class MembershipMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $mem;

    public $amountWithCurr;

    /**
     * Create a new job instance.
     */
    public function __construct($mem, $amountWithCurr)
    {
        $this->mem = $mem;
        $this->amountWithCurr = $amountWithCurr;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ((isset($this->mem->membership->user) && $this->mem->membership->user->notification_send == 1) || (empty($this->mem->membership->user))) {
            EmailService::sendMembershipMail($this->mem, $this->amountWithCurr);
        }
    }
}
