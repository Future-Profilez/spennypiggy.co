<?php

namespace App\Services;

use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Bills;
use App\Models\Shop;
use App\Models\UserIntro;
use App\Models\Post;
use App\Models\User;
use App\Models\SocialLinks;
use Exception;
use App\Mail\PendingApprovalSummary;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
            'stripe_identity' => $this->getPendingStripeIdentitySubmissions(),
            'social_media' => $this->getPendingSocialMediaLinks(),
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
            ->get(['id', 'uuid', 'user_id', 'created_at']);
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
        // Match admin counter logic for profile verification
        $creatorQuery = User::where('role', 1)
        ->where('is_uk', 0)
        ->where('suspended_account', 0)
        ->where('profile_status_lock', 1) // Pending approval
        ->where('is_subscribed', 1)
        ->whereNotNull('avatar')
        ->whereNotNull('bio')
        ->whereHas('social_links', function ($query) {
            $query->where('status', 1);
        });

        $gifterQuery = User::where('role', 0)
            ->where('is_uk', 0)
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 1) // Pending approval
            ->where('is_subscribed', 1)
            ->where('is_500_limit_exceeded', 1);

        // Combine both queries using union
        $pendingCreators = $creatorQuery->get(['id', 'uuid', 'name', 'username', 'email', 'bio', 'updated_at', 'role']);
        $pendingGifters = $gifterQuery->get(['id', 'uuid', 'name', 'username', 'email', 'bio', 'updated_at', 'role']);

        return $pendingCreators->merge($pendingGifters)->sortByDesc('updated_at');
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
     * Get Stripe Identity submissions awaiting admin review
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingStripeIdentitySubmissions()
    {
        return User::query()
            ->where('role', 1) // creators only
            ->where('suspended_account', 0)
            ->where('identity_status', 1)
            ->whereHas('social_links', function ($query) {
                $query->where('status', 1);
            })->where(function ($q) {
                $q->whereNull('identity_admin_status')
                  ->orWhere('identity_admin_status', 0);
            })->orderBy('identity_verified_at', 'desc')
            ->get(['id', 'uuid', 'name', 'username', 'email', 'identity_status', 'identity_admin_status', 'identity_verified_at']);
    }

    /**
     * Get pending social media links awaiting admin review
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getPendingSocialMediaLinks()
    {
        return SocialLinks::where('status', 0) // 0 = pending approval
            ->where(function ($query) {
                $query->whereNotNull('twitter')->where('twitter', '!=', '')
                    ->orWhereNotNull('instagram')->where('instagram', '!=', '')
                    ->orWhereNotNull('facebook')->where('facebook', '!=', '')
                    ->orWhereNotNull('youtube')->where('youtube', '!=', '')
                    ->orWhereNotNull('twitch')->where('twitch', '!=', '')
                    ->orWhereNotNull('tumblr')->where('tumblr', '!=', '')
                    ->orWhereNotNull('reddit')->where('reddit', '!=', '')
                    ->orWhereNotNull('discord')->where('discord', '!=', '')
                    ->orWhereNotNull('onlyfans')->where('onlyfans', '!=', '')
                    ->orWhereNotNull('loyalfans')->where('loyalfans', '!=', '')
                    ->orWhereNotNull('fansly')->where('fansly', '!=', '')
                    ->orWhereNotNull('manyvids')->where('manyvids', '!=', '')
                    ->orWhereNotNull('other')->where('other', '!=', '');
            })
            ->with('user:id,name,username,email')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'uuid', 'user_id', 'twitter', 'instagram', 'facebook', 'youtube', 'twitch', 'tumblr', 'reddit', 'discord', 'onlyfans', 'loyalfans', 'fansly', 'manyvids', 'other', 'created_at']);
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
            $recipients = app()->environment('production')
                ? [
                    'naveen@internetbusinesssolutionsindia.com',
                    'support@spennypiggy.com',
                    'support@spennypiggy.co',
                ]
                : [
                    'naveen@internetbusinesssolutionsindia.com',
                ];

            foreach ($recipients as $email) {
                $mailable = new PendingApprovalSummary($pendingItems);
                $mailer = config('mail.default');
                Mail::mailer($mailer)->to($email)->send($mailable);
            }

            Log::info('Pending approval summary email sent to: ' . implode(', ', $recipients));
        } catch (Exception $e) {
            Log::error('Failed to send pending approval summary email: ' . $e->getMessage());
            throw $e;
        }
    }
}
