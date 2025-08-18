<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use App\Notifications\PendingApprovalNotification;
use Exception;
use Illuminate\Database\Eloquent\Casts\Json;
use Illuminate\Support\Js;

class PendingApprovalService
{
    /**
     * Build the pending approval summary and send the notification email
     * 
     * @return array The pending summary data that was processed
     */
    public function buildAndSend(): array
    {
        $pendingSummary = [];
        
        // 1. Fetch Wish Items count
        $wishItemsCount = $this->getWishItemsCount();
        if ($wishItemsCount > 0) {
            $pendingSummary[] = [
                'label' => 'Wish Items',
                'count' => $wishItemsCount,
                'items' => [],
                'icon' => config('pending-approval.icons.Wish Items', '🎁'),
            ];
        }
        
        // 2. Fetch Memberships count
        $membershipsCount = $this->getMembershipsCount();
        if ($membershipsCount > 0) {
            $pendingSummary[] = [
                'label' => 'Memberships',
                'count' => $membershipsCount,
                'items' => [],
                'icon' => config('pending-approval.icons.Memberships', '👥'),
            ];
        }
        
        // 3. Fetch Bills count
        $billsCount = $this->getBillsCount();
        if ($billsCount > 0) {
            $pendingSummary[] = [
                'label' => 'Bills',
                'count' => $billsCount,
                'items' => [],
                'icon' => config('pending-approval.icons.Bills', '🧾'),
            ];
        }
        
        // 4. Fetch Shops count
        $shopsCount = $this->getShopsCount();
        if ($shopsCount > 0) {
            $pendingSummary[] = [
                'label' => 'Shops',
                'count' => $shopsCount,
                'items' => [],
                'icon' => config('pending-approval.icons.Shops', '🏪'),
            ];
        }
        
        // 5. Fetch User Intros count
        $userIntrosCount = $this->getUserIntrosCount();
        if ($userIntrosCount > 0) {
            $pendingSummary[] = [
                'label' => 'User Verification Video',
                'count' => $userIntrosCount,
                'items' => [],
                'icon' => config('pending-approval.icons.User Intros', '👋'),
            ];
        }
        
        // 6. Fetch User Profiles count
        $userProfilesCount = $this->getUserProfilesCount();
        if ($userProfilesCount > 0) {
            $pendingSummary[] = [
                'label' => 'User Profiles Approval',
                'count' => $userProfilesCount,
                'items' => [],
                'icon' => config('pending-approval.icons.User Profiles', '👤'),
            ];
        }
        
        // 7. Fetch Posts count
        $postsCount = $this->getPostsCount();
        if ($postsCount > 0) {
            $pendingSummary[] = [
                'label' => 'Posts',
                'count' => $postsCount,
                'items' => [],
                'icon' => config('pending-approval.icons.Posts', '📝'),
            ];
        }
        
        // 8. Fetch User Avatars count
        $userAvatarsCount = $this->getUserAvatarsCount();
        if ($userAvatarsCount > 0) {
            $pendingSummary[] = [
                'label' => 'User Avatars',
                'count' => $userAvatarsCount,
                'items' => [],
                'icon' => config('pending-approval.icons.User Avatars', '🖼️'),
            ];
        }

        if (!empty($pendingSummary)) {
            // Get application URL and find matching email recipients from config
            $appUrl = env('APP_URL');  
            $allConfigs = collect(config('pending-approval'));
            $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains'])); 
            $emails = $environmentConfig['emails'] ?? [];

            if (!empty($emails)) {
                Notification::route('mail', $emails)
                    ->notify(new PendingApprovalNotification($pendingSummary));
                Log::info('Summary email for pending approvals sent to: ' . implode(', ', $emails));
            } else {
                Log::info('No email recipients configured for URL: ' . $appUrl);
            }
        } else {
            Log::info('No pending items found.');
        }
        return $pendingSummary;
    }
    
    /**
     * Get count of unapproved wish items
     */
    private function getWishItemsCount(): int {
        $wishescount = WishItem::where('is_approved', 0)->where(function ($q) {
            $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
        })->count();
        return $wishescount;
    }

   
    /**
     * Get count of unapproved memberships
     */
    private function getMembershipsCount(): int
    {
        return \App\Models\Membership::where('approved', 0)->where(function ($q) {
            $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
        })->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of unapproved bills
     */
    private function getBillsCount(): int
    {
        $billscount = Bills::where('approved', 0)->where(function ($q) {
            $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
        })->whereNull('deleted_at')
        ->count();
        return $billscount;
    }
    
    /**
     * Get count of unapproved shops
    */
    private function getShopsCount(): int
    {
        $shopscount = \App\Models\Shop::where('approved', 0)->where(function ($q) {
            $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
        })->whereNull('deleted_at')
        ->count();
        return $shopscount;
    }
    
    /**
     * Get count of unapproved user intros
    */
    private function getUserIntrosCount(): int
    {
        $userIntrosCount = \App\Models\UserIntro::where('approved', 0)
        ->whereNull('deleted_at')
        ->count();
        return $userIntrosCount;
    }
    
    /**
     * Get count of pending user profiles
     */
    private function getUserProfilesCount(): int
    {
        return \App\Models\UserVerificationStatus::query()
            ->where(function ($q) {
                $q->where('role', 1)
                    ->whereHas('user', function ($userQuery) {
                        $userQuery->whereNotNull('avatar')
                            ->whereNotNull('bio')
                            ->where('is_subscribed', 1)
                            ->where('profile_status_lock', 1);
                    });
            })->orWhere(function ($q) {
                $q->where('role', 0)
                    ->whereHas('user', function ($userQuery) {
                        $userQuery->where('is_500_limit_exceeded', 1)
                        ->where('is_subscribed', 1)
                            ->where('profile_status_lock', 1);
                    });
            })
            ->count();
    }
    
    private function getPostsCount(): int {
        $postsCount = \App\Models\Post::where('approved', 0)->where(function ($q) {
            $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
        })
            ->count();
        return $postsCount;
    }
    
    private function getUserAvatarsCount(): int
    {
        $avatarsCount = User::whereNotNull('avatar')
            ->where('avatar_approved', 0)
            ->whereNull('deleted_at')
            ->count();
        Log::info('Pending user avatars count: ' . $avatarsCount);

        return $avatarsCount;
    }
}
