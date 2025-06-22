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
        $user = User::find($this->userId);
        if (!$user) {
            Log::warning("User not found with ID: {$this->userId}");
            return;
        }

        $deleted = false;

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
            Log::info("Deleted products for user {$user->id} and sent email.");
        } else {
            Log::info("No products deleted for user {$user->id}, skipping email.");
        }
    }
}
