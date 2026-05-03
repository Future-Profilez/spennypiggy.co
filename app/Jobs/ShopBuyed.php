<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

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
    public $amountUserPay;

    /**
     * Create a new job instance.
     *
     * @param \App\Models\User $user
     * @param bool $social = false
     * @return void
     */
    public function __construct($payment, $anon, $amountUserPay)
    {
        $this->payment = $payment;
        $this->anon = $anon;
        $this->amountUserPay = $amountUserPay;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $this->payment->loadMissing(['shop.user']);

        $creatorEmail = $this->payment->shop?->user?->email;
        if (!$creatorEmail) {
            Log::warning('ShopBuyed: creator email missing', [
                'shop_payment_id' => $this->payment->id ?? null,
                'shop_id' => $this->payment->shop_id ?? null,
            ]);
            return;
        }

        EmailService::shopBuyed($this->payment, $this->anon, $this->amountUserPay);
    }
}
