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
        $this->productId = $productId;
        $this->user = $user;
    }

    public function handle()
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        try {
            $subscriptions = Subscription::all(['limit' => 100]);
            foreach ($subscriptions->data as $subscription) {
                foreach ($subscription->items->data as $item) {
                    if ($item->price->product === $this->productId) {
                        Subscription::update($subscription->id, ['cancel_at_period_end' => true]);
                    }
                }
            }

            $prices = Price::all(['product' => $this->productId, 'limit' => 100]);
            foreach ($prices->data as $price) {
                Price::update($price->id, ['active' => false]);
            }

            Product::update($this->productId, ['active' => false]);

            // ✅ Send email after deletion
            Mail::to($this->user->email)->queue(new ProductDeletionMail($this->user));

            Log::info("Deleted product {$this->productId} and emailed user {$this->user->id}");
        } catch (\Exception $e) {
            Log::error("Stripe product cleanup failed: " . $e->getMessage());
        }
    }
}
