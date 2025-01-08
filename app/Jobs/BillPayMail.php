<?php

namespace App\Jobs;

use App\EmailService;
use App\Mail\BillMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
        Log::info("come in BillPayMail method construct: $this->bill_pay");
    }


    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("come in BillPayMail class handle method");
        if((isset($this->bill_pay->bill->user) && $this->bill_pay->bill->user->notification_send == 1) || (empty($this->bill_pay->bill->user))){
            Log::info("come in BillPayMail class handle method if condition");
            Mail::to($this->bill_pay->bill->user->email)->send(new BillMail($this->bill_pay));
            // EmailService::sendBillMail($this->bill_pay);
        }
    }
}
