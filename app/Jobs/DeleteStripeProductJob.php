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

        $productIds = $this->productId; // List of product IDs to delete
        $mailShouldBeSent = false;

        foreach ($productIds as $productId) {
            try {
                // Step 1: Check if the product exists on the platform
                $product = \Stripe\Product::retrieve($productId);

                // Step 2: Deactivate the product first (important before deactivating default price)
                \Stripe\Product::update($productId, ['active' => false]);

                // Step 3: Deactivate all prices for this product
                $prices = \Stripe\Price::all(['product' => $productId, 'limit' => 100]);
                foreach ($prices->data as $price) {
                    if ($price->active) {
                        \Stripe\Price::update($price->id, ['active' => false]);
                    }
                }

                // Step 4: Cancel subscriptions using this product
                $subscriptions = \Stripe\Subscription::all(['limit' => 100]);
                foreach ($subscriptions->data as $subscription) {
                    foreach ($subscription->items->data as $item) {
                        if ($item->price->product === $productId) {
                            \Stripe\Subscription::update($subscription->id, [
                                'cancel_at_period_end' => true,
                            ]);
                        }
                    }
                }

                $mailShouldBeSent = true;
                Log::info("Product {$productId} deactivated from platform account.");
            } catch (\Exception $e) {
                Log::error("Platform Stripe product cleanup failed for {$productId}: " . $e->getMessage());
            }
        }

        if ($mailShouldBeSent) {
            Mail::to($this->user->email)->queue(new \App\Mail\ProductDeletionMail($this->user));
        }
    }
}
