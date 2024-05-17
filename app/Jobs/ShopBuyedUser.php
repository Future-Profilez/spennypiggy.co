<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ShopBuyedUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $payment;
    public $curr;


    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($payment,$curr)
    {
        $this->payment = $payment;
        $this->curr = $curr;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if((isset($this->payment->user) && $this->payment->user->notification_send == 1) || (empty($this->payment->user))){
            EmailService::shopBuyedUser($this->payment,$this->curr);
        }
    }
}
