<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BillPayMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $bill_pay;
    /**
     * Create a new job instance.
     */
    public function __construct($bill_pay)
    {
        $this->bill_pay = $bill_pay;
    }


    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if((isset($this->bill_pay->bill->user) && $this->bill_pay->bill->user->notification_send == 1) || (empty($this->bill_pay->bill->user))){
            EmailService::sendBillMail($this->bill_pay);
        }
    }
}
