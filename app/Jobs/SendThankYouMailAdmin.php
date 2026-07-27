<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendThankYouMailAdmin implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $pay;

    /**
     * Create a new job instance.
     */
    public function __construct($pay)
    {
        $this->pay = $pay;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        EmailService::sendThankyouAdmin($this->pay);
    }
}
