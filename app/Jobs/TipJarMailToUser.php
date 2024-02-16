<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class TipJarMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    public $pay;
    public $symbol;
    public $amount;


    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($pay,$symbol,$amount)
    {
        $this->pay = $pay;
        $this->symbol = $symbol;
        $this->amount = $amount;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if((isset($this->pay->user) && $this->pay->user->notification_send == 1) || (empty($this->pay->user))){
            EmailService::sendTipJarToUser($this->pay,$this->symbol,$this->amount);
        }
    }
}
