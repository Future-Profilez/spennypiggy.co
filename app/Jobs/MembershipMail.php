<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MembershipMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $mem;
    /**
     * Create a new job instance.
     */
    public function __construct($mem)
    {
        Log::info("come in MembershipMail construct");
        $this->mem = $mem;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if((isset($this->mem->membership->user) && $this->mem->membership->user->notification_send == 1) || (empty($this->mem->membership->user))){
            Log::info("come in MembershipMail file handle method if condition");
            EmailService::sendMembershipMail($this->mem);
        }
    }
}
