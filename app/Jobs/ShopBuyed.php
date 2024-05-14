<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ShopBuyed implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
/**
     * New Registered User
     * @var \App\Models\User
     */
    public $payment;

    /**
     * Is via Social
     * @var bool
     */
    public $anon;
    public $symbol;

    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($payment, $anon, $symbol)
    {
        $this->payment = $payment;
        $this->anon = $anon;
        $this->symbol = $symbol;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if((isset($this->payment->payment->user) && $this->payment->payment->user->notification_send == 1) || (empty($this->payment->payment->user))){
            EmailService::shopBuyed($this->payment, $this->anon,$this->symbol);
        }
    }
}
