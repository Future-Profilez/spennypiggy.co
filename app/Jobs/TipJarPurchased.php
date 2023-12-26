<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class TipJarPurchased implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tip_pay;
    /**
     * Create a new job instance.
     */
    public function __construct($tip_pay)
    {
        $this->tip_pay = $tip_pay;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        EmailService::sendTipJarSubscribedMail($this->tip_pay);
    }
}
