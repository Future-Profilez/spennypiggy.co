<?php

namespace App\Jobs;

use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ShopBuyed implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * New Registered User
     *
     * @var mixed
     */
    public $payment;

    /**
     * Is via Social
     *
     * @var bool
     */
    public $anon;

    /**
     * Amount paid by user
     *
     * @var mixed
     */
    public $amountUserPay;

    /**
     * Number of retries
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Timeout for job execution
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     *
     * @param  mixed  $payment
     * @param  bool  $anon
     * @param  mixed  $amountUserPay
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
        try {
            if (! $this->payment) {
                Log::error('ShopBuyed Job: Payment data missing');

                return;
            }

            $this->payment->loadMissing(['shop.user']);

            $shop = $this->payment->shop;
            $creator = $shop?->user;
            $creatorEmail = $creator?->email;

            if (! $shop) {
                Log::warning('ShopBuyed Job: Shop not found', [
                    'shop_payment_id' => $this->payment->id ?? null,
                    'shop_id' => $this->payment->shop_id ?? null,
                ]);

                return;
            }

            if (! $creator) {
                Log::warning('ShopBuyed Job: Creator not found', [
                    'shop_payment_id' => $this->payment->id ?? null,
                    'shop_id' => $shop->id ?? null,
                ]);

                return;
            }

            if (! $creatorEmail) {
                Log::warning('ShopBuyed Job: Creator email missing', [
                    'shop_payment_id' => $this->payment->id ?? null,
                    'creator_id' => $creator->id ?? null,
                ]);

                return;
            }

            EmailService::shopBuyed(
                $this->payment,
                $this->anon,
                $this->amountUserPay,
            );

            Log::info('ShopBuyed Job: Email sent successfully', [
                'shop_payment_id' => $this->payment->id ?? null,
                'creator_email' => $creatorEmail,
            ]);
        } catch (Throwable $e) {

            Log::error('ShopBuyed Job Failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'shop_payment_id' => $this->payment->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw exception so Laravel marks job as failed
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @return void
     */
    public function failed(Throwable $exception)
    {
        Log::critical('ShopBuyed Job permanently failed', [
            'shop_payment_id' => $this->payment->id ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}
