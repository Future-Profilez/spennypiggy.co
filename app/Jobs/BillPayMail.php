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
    public $amountWithVat;
    /**
     * Create a new job instance.
     */
    public function __construct($bill_pay, $amountWithVat)
    {
        $this->bill_pay = $bill_pay;
        $this->amountWithVat = $amountWithVat;
    }


    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ((isset($this->bill_pay->bill->user) && $this->bill_pay->bill->user->notification_send == 1) || (empty($this->bill_pay->bill->user))) {
            Mail::to($this->bill_pay->bill->user->email)->send(new BillMail($this->bill_pay, $this->amountWithVat));
            // EmailService::sendBillMail($this->bill_pay, $this->amountWithVat);
        }
    }
}
