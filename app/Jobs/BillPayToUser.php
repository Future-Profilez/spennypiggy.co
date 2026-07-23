<?php

namespace App\Jobs;

use App\Mail\BillMailToUser;
use App\Models\Deliverable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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
        // Transactional receipt for money the supporter has already been charged —
        // it has no opt-out. It used to be gated on notification_send, so a supporter
        // with notifications off got no confirmation of a real payment.
        $deliverable = Deliverable::where('session_id', $this->bill_pay->session_id)
            ->where('product_type', 'bill')
            ->first();

        Mail::to($this->bill_pay->guest_email)->send(new BillMailToUser($this->bill_pay, $this->amountWithCurr, $this->user_name, $deliverable));
    }
}
