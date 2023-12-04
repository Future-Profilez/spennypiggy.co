<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ThankyouMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $payment;
    public $message;

    /**
     * Create a new job instance.
     */
    public function __construct($payment, $message)
    {
        $this->payment = $payment;
        $this->message = $message;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        EmailService::thankyouUser($this->payment, $this->message);
    }
}
