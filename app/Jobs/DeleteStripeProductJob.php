<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Mail\ProductDeletionMail;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\Shop;
use App\Models\User;
use App\Models\WishItem;
use App\StripeControl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DeleteStripeProductJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    protected $userId;

    protected $productIds;

    public function __construct(int $userId, array $productIds)
    {
        $this->userId = $userId;
        $this->productIds = $productIds;
    }

    /**
     * The job's maximum number of attempts.
     *
     * @var int
     */
    public function handle()
    {
        Log::info("DeleteStripeProductJob started for user ID: {$this->userId} with products: ".implode(', ', $this->productIds));
        $user = User::find($this->userId);
        if (! $user) {
            Log::warning("User not found with ID: {$this->userId}");

            return;
        }

        $deleted = false;

        foreach ($this->productIds as $productId) {
            // Try to fetch a bill, membership, wish item, or shop item with this product ID
            $bill = Bills::where('user_id', $user->id)->where('product_id', $productId)->first();
            $membership = Membership::where('user_id', $user->id)->where('product_id', $productId)->first();
            $wish = WishItem::where('user_id', $user->id)->where('stripe_product_id', $productId)->first();
            $shop = Shop::where('user_id', $user->id)->where('stripe_product_id', $productId)->first();

            $stripeProductId = $productId;
            $accountId = $user->account_id; // default fallback

            // Get Stripe product info from available models
            if ($bill) {
                $stripeProductId = $bill->product_id;
                $accountId = $user->account_id;
            } elseif ($membership) {
                $stripeProductId = $membership->product_id;
                $accountId = $user->account_id;
            } elseif ($wish) {
                $stripeProductId = $wish->stripe_product_id;
                $accountId = $user->account_id;
            } elseif ($shop) {
                $stripeProductId = $shop->stripe_product_id;
                $accountId = $user->account_id;
            }

            // Call Stripe deletion
            try {
                $stripeProduct = StripeControl::getProduct($stripeProductId);
                Log::info(json_encode($stripeProduct));
                if ($stripeProduct) {
                    StripeControl::deleteProductAndPricesOfCreator($stripeProduct->id);
                    Log::info("Stripe product {$stripeProduct->id} deleted for user {$user->id}");
                }
            } catch (\Exception $e) {
                Log::error("Error deleting Stripe product {$stripeProductId} for user {$user->id}: ".$e->getMessage());
            }
        }

        // Soft-delete records in database
        $deleted |= Bills::where('user_id', $user->id)
            ->whereIn('product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        $deleted |= WishItem::where('user_id', $user->id)
            ->whereIn('stripe_product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        $deleted |= Membership::where('user_id', $user->id)
            ->whereIn('product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        $deleted |= Shop::where('user_id', $user->id)
            ->whereIn('stripe_product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        if ($deleted) {
            // Mail::to($user->email)->queue(new ProductDeletionMail($user));
            Log::info("Deleted/archived products for user {$user->id} and sent email.");
        } else {
            Log::info("No products deleted for user {$user->id}, skipping email.");
        }
    }

    // public function handle()
    // {
    //     $user = User::find($this->userId);
    //     if (!$user) {
    //         Log::warning("User not found with ID: {$this->userId}");
    //         return;
    //     }

    //     $deleted = false;

    //     $deleted |= Bills::where('user_id', $user->id)
    //         ->whereIn('product_id', $this->productIds)
    //         ->update(['deleted_at' => now()]);

    //     $deleted |= WishItem::where('user_id', $user->id)
    //         ->whereIn('stripe_product_id', $this->productIds)
    //         ->update(['deleted_at' => now()]);

    //     $deleted |= Membership::where('user_id', $user->id)
    //         ->whereIn('product_id', $this->productIds)
    //         ->update(['deleted_at' => now()]);

    //     $deleted |= Shop::where('user_id', $user->id)
    //         ->whereIn('stripe_product_id', $this->productIds)
    //         ->update(['deleted_at' => now()]);

    //     if ($deleted) {
    //         // Mail::to($user->email)->queue(new ProductDeletionMail($user));
    //         Log::info("Deleted products for user {$user->id} and sent email.");
    //     } else {
    //         Log::info("No products deleted for user {$user->id}, skipping email.");
    //     }
    // }
}
