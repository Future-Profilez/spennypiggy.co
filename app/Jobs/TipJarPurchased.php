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
    public $symbol;
    /**
     * Create a new job instance.
     */
    public function __construct($tip_pay,$symbol)
    {
        $this->tip_pay = $tip_pay;
        $this->symbol = $symbol;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if((isset($this->tip_pay->creator) && $this->tip_pay->creator->notification_send == 1) || (empty($this->tip_pay->creator))){
            EmailService::sendTipJarSubscribedMail($this->tip_pay,$this->symbol);
        }
    }
}
