<?php

// app/Jobs/SendPaymentSuccessEmail.php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Mail\PaymentSuccessMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendPaymentSuccessEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    public $user;

    public $amount;

    public $planCurrency;

    public $nextPaymentDate;

    public function __construct($user, $amount, $planCurrency, $nextPaymentDate)
    {
        $this->user = $user;
        $this->amount = $amount;
        $this->planCurrency = $planCurrency;
        $this->nextPaymentDate = $nextPaymentDate;
    }

    public function handle()
    {
        Mail::to($this->user->email)->send(
            new PaymentSuccessMail($this->user, $this->amount, $this->planCurrency, $this->nextPaymentDate)
        );
    }
}
