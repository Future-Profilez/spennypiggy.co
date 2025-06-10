<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Bills;
use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Shop;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use App\Mail\ProductDeletionMail;

class DeleteStripeProductJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;
    protected $productIds;

    public function __construct(User $user, array $productIds)
    {
        $this->user = $user;
        $this->productIds = $productIds;
    }

    public function handle()
    {
        $deleted = false;

        // Bills
        $deleted |= Bills::where('user_id', $this->user->id)
            ->whereIn('product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        // WishItem
        $deleted |= WishItem::where('user_id', $this->user->id)
            ->whereIn('stripe_product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        // Membership
        $deleted |= Membership::where('user_id', $this->user->id)
            ->whereIn('product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        // Shop
        $deleted |= Shop::where('user_id', $this->user->id)
            ->whereIn('stripe_product_id', $this->productIds)
            ->update(['deleted_at' => now()]);

        if ($deleted) {
            Mail::to($this->user->email)->queue(new ProductDeletionMail($this->user));
            Log::info("Deleted products for user {$this->user->id} and sent email.");
        } else {
            Log::info("No products deleted for user {$this->user->id}, skipping email.");
        }
    }
}
