<?php

namespace App\Jobs;

use App\EmailService;
use App\Mail\BillMailToUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BillPayToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $bill_pay;
    public $amountWithCurr;
    public $user_name;

    /**
     * Create a new job instance.
     */
    public function __construct($bill_pay, $amountWithCurr, $user_name)
    {
        $this->bill_pay = $bill_pay;
        $this->amountWithCurr = $amountWithCurr;
        $this->user_name = $user_name;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        if ((isset($this->bill_pay->user) && $this->bill_pay->user->notification_send == 1) || (empty($this->bill_pay->user))) {
            // EmailService::sendBillMailToUser($this->bill_pay, $this->amountWithCurr, $this->user_name);
            Mail::to($this->bill_pay->guest_email)->send(new BillMailToUser($this->bill_pay, $this->amountWithCurr, $this->user_name));
        }
    }
}
