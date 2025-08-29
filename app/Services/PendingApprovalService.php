<?php

namespace App\Services;

use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Bills;
use App\Models\Shop;
use App\Models\UserIntro;
use App\Models\Post;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\PendingApprovalSummary;

class PendingApprovalService
{
    /**
     * Build and send pending approval summary
     *
     * @return array|null
     */
    public function buildAndSend()
    {
        try {
            // Collect all pending items
            $pendingItems = $this->collectPendingItems();

            if (empty($pendingItems) || $this->isEmpty($pendingItems)) {
                Log::info('No pending approval items found');
                return null;
            }

            // Send email notification
            $this->sendApprovalEmail($pendingItems);

            return $pendingItems;
        } catch (Exception $e) {
            Log::error('Failed to build and send pending approval summary: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Collect all pending approval items
     *
     * @return array
     */
    private function collectPendingItems(): array
    {
        return [
            'wish_items' => $this->getPendingWishItems(),
            'memberships' => $this->getPendingMemberships(),
            'bills' => $this->getPendingBills(),
            'shops' => $this->getPendingShops(),
            'user_intros' => $this->getPendingUserIntros(),
            'posts' => $this->getPendingPosts(),
            'user_profiles' => $this->getPendingUserProfiles(),
            'user_avatars' => $this->getPendingUserAvatars(),
        ];
    }

    /**
     * Check if all collections are empty
     *
     * @param array $items
     * @return bool
     */
    private function isEmpty(array $items): bool
    {
        foreach ($items as $collection) {
            if (!empty($collection) && count($collection) > 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get pending wish items
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingWishItems()
    {
        return WishItem::where('is_approved', false)
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'wishname', 'price', 'currency', 'created_at']);
    }

    /**
     * Get pending memberships
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingMemberships()
    {
        return Membership::where('status', 0)
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'level', 'price', 'created_at']);
    }

    /**
     * Get pending bills
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingBills()
    {
        return Bills::where('status', 0)
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'name', 'price', 'currency', 'created_at']);
    }

    /**
     * Get pending shops
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingShops()
    {
        return Shop::where('approved', 0)
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'name', 'price', 'currency', 'created_at']);
    }

    /**
     * Get pending user intros
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingUserIntros()
    {
        return UserIntro::where('approved', false)
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'title', 'created_at']);
    }

    /**
     * Get pending posts
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingPosts()
    {
        return Post::where('approved', false)
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'title', 'created_at']);
    }

    /**
     * Get pending user profiles (bio approval)
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingUserProfiles()
    {
        return User::where('bio_approved', false)
            ->whereNotNull('bio')
            ->where('bio', '!=', '')
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'uuid', 'name', 'username', 'email', 'bio', 'updated_at']);
    }

    /**
     * Get pending user avatars (avatar approval)
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingUserAvatars()
    {
        return User::where('avatar_approved', false)
            ->whereNotNull('avatar')
            ->where('avatar', '!=', '')
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'uuid', 'name', 'username', 'email', 'avatar', 'updated_at']);
    }

    /**
     * Send approval email notification
     *
     * @param array $pendingItems
     * @return void
     */
    private function sendApprovalEmail(array $pendingItems): void
    {
        try {
            $recipients = [
                'admin@spennypiggy.co',
                'support@spennypiggy.co'
            ];

            foreach ($recipients as $email) {
                Mail::to($email)->send(new PendingApprovalSummary($pendingItems));
            }

            Log::info('Pending approval summary email sent to: ' . implode(', ', $recipients));
        } catch (Exception $e) {
            Log::error('Failed to send pending approval email: ' . $e->getMessage());
            throw $e;
        }
    }
}
