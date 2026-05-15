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

class ShopBuyedUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Payment data
     *
     * @var mixed
     */
    public $payment;

    /**
     * Redirect URL
     *
     * @var string|null
     */
    public $url;

    /**
     * Currency
     *
     * @var string|null
     */
    public $curr;

    /**
     * Number of retries
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Job timeout
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     *
     * @param mixed $payment
     * @param string|null $url
     * @param string|null $curr
     * @return void
     */
    public function __construct($payment, $url, $curr)
    {
        $this->payment = $payment;
        $this->url = $url;
        $this->curr = $curr;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {

            if (!$this->payment) {
                Log::error('ShopBuyedUser Job: Payment data missing');
                return;
            }

            $this->payment->loadMissing([
                'user',
                'shop',
            ]);

            $buyerEmail = $this->payment->email ?? $this->payment->user?->email;

            if (!$buyerEmail) {
                Log::warning('ShopBuyedUser Job: Buyer email missing', [
                    'shop_payment_id' => $this->payment->id ?? null,
                    'user_id' => $this->payment->user_id ?? null,
                ]);
                return;
            }

            EmailService::shopBuyedUser(
                $this->payment,
                $this->url,
                $this->curr
            );

            Log::info('ShopBuyedUser Job: Email sent successfully', [
                'shop_payment_id' => $this->payment->id ?? null,
                'buyer_email' => $buyerEmail,
            ]);
        } catch (Throwable $e) {

            Log::error('ShopBuyedUser Job Failed', [
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
     * Handle a failed job.
     *
     * @param Throwable $exception
     * @return void
     */
    public function failed(Throwable $exception)
    {
        Log::critical('ShopBuyedUser Job permanently failed', [
            'shop_payment_id' => $this->payment->id ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}
