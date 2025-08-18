<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use App\Notifications\PendingApprovalNotification;
use Exception;

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
                'label' => 'User Intros',
                'count' => $userIntrosCount,
                'items' => [],
                'icon' => config('pending-approval.icons.User Intros', '👋'),
            ];
        }
        
        // 6. Fetch User Profiles count
        $userProfilesCount = $this->getUserProfilesCount();
        if ($userProfilesCount > 0) {
            $pendingSummary[] = [
                'label' => 'User Profiles',
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
            $appUrl = env('APP_URL'); // e.g. https://dev.spennypiggy.co
            $allConfigs = collect(config('pending-approval'));
            $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains'])); 
            $emails = $environmentConfig['emails'] ?? [];

            if (!empty($emails)) {
                // Send notification to all configured recipients
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
    private function getWishItemsCount(): int
    {
        return \App\Models\WishItem::where('is_approved', 0)
            ->where(function ($q) {
                $q->whereNull('edited_status')->orWhere('edited_status', '!=', 0);
            })
            ->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of unapproved memberships
     */
    private function getMembershipsCount(): int
    {
        return \App\Models\Membership::whereHas('user')
            ->where('approved', 0)
            ->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of unapproved bills
     */
    private function getBillsCount(): int
    {
        return \App\Models\Bills::whereHas('user')
            ->where('approved', 0)
            ->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of unapproved shops
     */
    private function getShopsCount(): int
    {
        return \App\Models\Shop::whereHas('user')
            ->where('approved', 0)
            ->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of unapproved user intros
     */
    private function getUserIntrosCount(): int
    {
        return \App\Models\UserIntro::whereHas('user')
            ->where('approved', 0)
            ->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of pending user profiles
     */
    private function getUserProfilesCount(): int
    {
        return \App\Models\UserVerificationStatus::query()
            ->where(function ($q) {
                // Creator condition: role = 1
                $q->where('role', 1)
                    ->whereHas('user', function ($userQuery) {
                        $userQuery->whereNotNull('avatar')
                            ->whereNotNull('bio')
                            ->where('profile_status_lock', 1)
                            ->whereNull('edit_bio_reason'); // Exclude users with bio edit requests
                    });
            })->orWhere(function ($q) {
                // Gifter condition: role = 0
                $q->where('role', 0)
                    ->whereHas('user', function ($userQuery) {
                        $userQuery->where('is_500_limit_exceeded', 1)
                            ->where('profile_status_lock', 1)
                            ->whereNull('edit_bio_reason'); // Exclude users with bio edit requests
                    });
            })
            ->count();
    }
    
    /**
     * Get count of unapproved posts
     */
    private function getPostsCount(): int
    {
        return \App\Models\Post::whereHas('user')
            ->where('approved', 0)
            ->whereNull('deleted_at')
            ->count();
    }
    
    /**
     * Get count of unapproved user avatars
     */
    private function getUserAvatarsCount(): int
    {
        return \App\Models\User::whereNotNull('avatar')
            ->where('avatar_approved', 0)
            ->whereNull('edit_bio_reason') // Exclude users with bio edit requests
            ->whereNull('deleted_at')
            ->count();
    }
}
