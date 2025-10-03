<?php

namespace App\Helpers;

use App\Services\MembershipAccessService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MembershipHelper
{
    /**
     * Check if current user has membership access to creator's content
     */
    public static function userHasAccess($creatorId, $membershipLevel = null)
    {
        if (!Auth::check()) {
            return false;
        }

        $service = app(MembershipAccessService::class);
        $access = $service->hasActiveMembership(Auth::id(), $creatorId, $membershipLevel);
        
        return $access['has_access'];
    }

    /**
     * Get current user's membership details for a creator
     */
    public static function getUserMembership($creatorId, $membershipLevel = null)
    {
        if (!Auth::check()) {
            return null;
        }

        $service = app(MembershipAccessService::class);
        return $service->hasActiveMembership(Auth::id(), $creatorId, $membershipLevel);
    }

    /**
     * Get all active memberships for current user
     */
    public static function getUserMemberships()
    {
        if (!Auth::check()) {
            return [];
        }

        $service = app(MembershipAccessService::class);
        return $service->getUserActiveMemberships(Auth::id());
    }

    /**
     * Check if content should be hidden for non-members
     */
    public static function shouldHideContent($creatorId, $contentType = 'post')
    {
        // Define which content types require membership
        $memberOnlyContent = ['exclusive_post', 'premium_content', 'members_only'];
        
        if (in_array($contentType, $memberOnlyContent)) {
            return !self::userHasAccess($creatorId);
        }
        
        return false;
    }

    /**
     * Get membership access summary for display
     */
    public static function getAccessSummary($creatorId)
    {
        $access = self::getUserMembership($creatorId);
        
        if (!$access || !$access['has_access']) {
            return [
                'has_access' => false,
                'message' => 'No active membership',
                'action' => 'Subscribe to access exclusive content'
            ];
        }

        $membership = $access['membership'] ?? null;
        $level = $access['membership_level'] ?? 'Unknown';

        return [
            'has_access' => true,
            'level' => $level,
            'message' => "You have {$level} membership access",
            'access_method' => $access['access_method'] ?? 'unknown',
            'subscription_id' => $access['subscription_id'] ?? null
        ];
    }

    /**
     * Format membership level for display
     */
    public static function formatLevel($level)
    {
        return ucfirst($level ?? 'Basic');
    }

    /**
     * Check if membership level meets requirement
     */
    public static function levelMeetsRequirement($userLevel, $requiredLevel)
    {
        $hierarchy = [
            'bronze' => 1,
            'silver' => 2,
            'gold' => 3,
            'platinum' => 4,
            'lifetime' => 5
        ];

        $userRank = $hierarchy[strtolower($userLevel)] ?? 0;
        $requiredRank = $hierarchy[strtolower($requiredLevel)] ?? 0;

        return $userRank >= $requiredRank;
    }
}