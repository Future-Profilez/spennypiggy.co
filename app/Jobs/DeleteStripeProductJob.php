<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ProductDeletionMail;
use Illuminate\Bus\Queueable;
use Stripe\Subscription;
use App\Models\User; // If not already imported
use Stripe\Product;
use Stripe\Stripe;
use Stripe\Price;

class DeleteStripeProductJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $productId;
    public $user;

    public function __construct($productId, User $user)
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
        $this->productId = $productId;
        $this->user = $user;
    }

    public function handle()
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
        if (empty($this->user->account_id)) {
            Log::error("Stripe product cleanup failed: Connected account ID not found for user ID {$this->user->id}");
            return;
        }

        try {
            $connectedAccountId = $this->user->account_id;
            $account = ['stripe_account' => $connectedAccountId];

            // Cancel all subscriptions using the product
            $subscriptions = \Stripe\Subscription::all(['limit' => 100], $account);
            foreach ($subscriptions->data as $subscription) {
                foreach ($subscription->items->data as $item) {
                    if ($item->price->product === $this->productId) {
                        \Stripe\Subscription::update($subscription->id, ['cancel_at_period_end' => true], $account);
                    }
                }
            }

            // Deactivate prices for the product
            $prices = \Stripe\Price::all(['product' => $this->productId, 'limit' => 100], $account);
            foreach ($prices->data as $price) {
                \Stripe\Price::update($price->id, ['active' => false], $account);
            }

            // Deactivate the product itself
            \Stripe\Product::update($this->productId, ['active' => false], $account);

            // Send deletion email
            Mail::to($this->user->email)->queue(new \App\Mail\ProductDeletionMail($this->user));

            Log::info("Deleted product {$this->productId} and emailed user {$this->user->id}");
        } catch (\Exception $e) {
            Log::error("Stripe product cleanup failed: " . $e->getMessage());
        }
    }
}
