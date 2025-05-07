<?php

// app/Jobs/SendPaymentSuccessEmail.php

namespace App\Jobs;

use App\Mail\PaymentSuccessMail;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPaymentSuccessEmail implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $user, $amount, $nextPaymentDate;

    public function __construct($user, $amount, $nextPaymentDate)
    {
        $this->user = $user;
        $this->amount = $amount;
        $this->nextPaymentDate = $nextPaymentDate;
    }

    public function handle()
    {
        Mail::to($this->user->email)->send(
            new PaymentSuccessMail($this->user, $this->amount, $this->nextPaymentDate)
        );
    }
}
