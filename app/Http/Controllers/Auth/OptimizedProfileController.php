<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Auth\StripeController;
use App\Services\UserProfileService;
use App\SeoMeta;
use App\StripeControl;
use App\Models\FounderBonus;
use App\Models\Deliverable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class OptimizedProfileController extends Controller
{
    protected UserProfileService $profileService;

    public function __construct(UserProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    /**
     * Optimized user profile method with better performance
     */
    public function getUserProfile(string $username, string $page = 'about')
    {
        // Preload essential user data
        $profileData = $this->profileService->preloadUserProfileData($username);
        
        if (empty($profileData)) {
            return Inertia::render('NotFound');
        }

        $user = $profileData['user'];

        // Check for suspended account
        if ($user->suspended_account == 1) {
            return Inertia::render('Suspanded');
        }

        // Get Stripe account capabilities with caching
        [$isNeedToUpgrade, $cardCapabilities, $stripeRequirements] = $this->getStripeCapabilities($user);
        
        // Check if account needs migration for cross-border payments
        $migrationStatus = $this->getMigrationStatus($user);

        // Load ALL profile data at once for fastest loading
        $categoryId = request()->query('category');
        $allProfileData = $this->profileService->getAllProfileData($user->id, $categoryId);
        
        // Extract data for current page while keeping all data available
        $pageData = $this->extractPageData($allProfileData, $page);

        // Set SEO meta tags
        $this->setSeoMetaTags($user, $username);

        // Get founder bonus data if user is a founder
        $founderData = $this->getFounderData($user);

        return Inertia::render('Dashboard', [
            'username' => $username,
            'user' => $user,
            'card_capabilities' => $cardCapabilities,
            'isNeedToUpgrade' => $isNeedToUpgrade,
            'stripe_requirements' => $stripeRequirements,
            'migration_status' => $migrationStatus,
            'itemid' => request()->query('item') ?? false,
            'sociallinks' => $user->social_links,
            'slinks' => $user->social_links,
            'page' => $page,
            'intro' => $user->intro,
            'supporters' => $profileData['supporters'],
            'wish_categories' => $this->getCategoriesWithItems($user),
            'selectedCategory' => request()->query('category') ?? false,
            'notification_count' => $profileData['notification_count'],
            'profile_steps' => null,
            'first30DayEarnings' => $founderData['first30DayEarnings'],
            ...$pageData
        ]);
    }

    /**
     * Get Stripe account capabilities with caching
     */
    private function getStripeCapabilities($user): array
    {
        if (empty($user->account_id)) {
            return [false, false, []];
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            
            // Use the proper migration check to determine if upgrade is needed
            $migrationCheck = StripeController::checkAccountMigrationNeeds($user);
            $isNeedToUpgrade = $migrationCheck['needs_migration'] ?? false;
            
            $cardCapabilities = StripeControl::isAccountReadyForCheckout($user->account_id);
            
            // Get comprehensive account requirements
            $requirements = StripeControl::getAccountRequirements($user->account_id);
            
            // Add migration requirement if account needs upgrade
            if ($isNeedToUpgrade) {
                $requirements['has_requirements'] = true;
                $requirements['requirements'][] = [
                    'type' => 'legacy_upgrade',
                    'severity' => 'high',
                    'title' => 'Account Upgrade Required',
                    'message' => 'Your Stripe account needs to be upgraded to the latest version to receive card payments.',
                    'action' => 'Upgrade your Stripe account now.',
                    'action_url' => '/stripe/upgrade-express-account'
                ];
            }
            
            return [$isNeedToUpgrade, $cardCapabilities, $requirements];
        } catch (\Exception $e) {
            // Update user if account is invalid
            $user->update(['stripe_details_submitted' => 0]);
            return [false, false, [
                'has_requirements' => true,
                'requirements' => [[
                    'type' => 'connection_error',
                    'severity' => 'critical',
                    'title' => 'Account Connection Issue',
                    'message' => 'Unable to check your Stripe account status. Please try again or contact support.',
                    'action' => 'Refresh the page or contact support.',
                    'action_url' => null
                ]],
                'account_status' => []
            ]];
        }
    }

    /**
     * Check if user's Stripe account needs migration for cross-border payments
     */
    private function getMigrationStatus($user): array
    {
        // Only check for logged-in users viewing their own profile
        if (!Auth::check() || Auth::id() !== $user->id) {
            return ['needs_migration' => false, 'show_warning' => false];
        }

        try {
            $migrationCheck = StripeController::checkAccountMigrationNeeds($user);
            
            return [
                'needs_migration' => $migrationCheck['needs_migration'] ?? false,
                'show_warning' => $migrationCheck['needs_migration'] ?? false,
                'current_agreement' => $migrationCheck['current_agreement'] ?? null,
                'required_agreement' => $migrationCheck['required_agreement'] ?? null,
                'country' => $migrationCheck['country'] ?? $user->country,
                'reason' => $migrationCheck['reason'] ?? 'Account check not available'
            ];
        } catch (\Exception $e) {
            return [
                'needs_migration' => false,
                'show_warning' => false,
                'error' => 'Unable to check migration status'
            ];
        }
    }
    
    /**
     * Get only categories that have at least one wishitem
     * 
     * @param \App\Models\User $user
     * @return \Illuminate\Support\Collection
     */
    private function getCategoriesWithItems($user)
    {
        $isPublicView = (auth()->check() && auth()->id() !== $user->id) || !auth()->check();
        
        $categoryIds = \App\Models\WishCategory::whereHas('wish', function ($q) use ($user, $isPublicView) {
            $q->where('user_id', $user->id);
            if ($isPublicView) {
                $q->where('is_approved', 1);
            }
        })->pluck('user_category_id')->unique()->filter();

        return $user->user_categories()->whereIn('id', $categoryIds)->get();
    }

    /**
     * Extract page-specific data from preloaded profile data
     */
    private function extractPageData(array $allProfileData, string $page): array
    {
        // Return ALL data to frontend for instant tab switching
        return [
            'items' => $allProfileData['wishes'] ?? [],
            'posts' => $allProfileData['posts'] ?? [],
            'memberships' => $allProfileData['memberships'] ?? [],
            'bills' => $allProfileData['bills'] ?? [],
            'shops' => $allProfileData['shops'] ?? [],
            // Add metadata for frontend optimization
            '_preloaded' => true,
            '_loadTime' => microtime(true)
        ];
    }

    /**
     * Get page-specific data efficiently (legacy method - kept for compatibility)
     */
    private function getPageSpecificData(int $userId, string $page): array
    {
        $data = [
            'items' => [],
            'posts' => [],
            'memberships' => [],
            'bills' => [],
            'shops' => []
        ];

        switch ($page) {
            case 'wishes':
                $categoryId = request()->query('category');
                $data['items'] = $this->profileService->getUserWishItems($userId, $categoryId);
                break;
                
            case 'feed':
            case 'about':
                $data['posts'] = $this->profileService->getUserPosts($userId);
                break;
                
            case 'memberships':
                $data['memberships'] = $this->profileService->getUserMemberships($userId);
                break;
                
            case 'bills':
                $data['bills'] = $this->profileService->getUserBills($userId);
                break;
                
            case 'shop':
                $data['shops'] = $this->profileService->getUserShopItems($userId);
                break;
        }

        return $data;
    }

    /**
     * Set SEO meta tags
     */
    private function setSeoMetaTags($user, string $username): void
    {
        $image = $user->social_image ? "https://ucarecdn.com/{$user->social_image}/-/preview/" : null;
        
        SeoMeta::addTag('title', "{$user->name} - Spenny Piggy - Financial Gifts, Exclusive Content & Memberships");
        SeoMeta::addTag('meta', ['property' => 'twitter:title', 'content' => 'Financial Gifts,Donations & Memberships']);
        SeoMeta::addTag('meta', ['property' => 'twitter:card', 'content' => 'summary_large_image']);
        SeoMeta::addTag('meta', ['property' => 'twitter:description', 'content' => 'Send tributes, adopt bills & more. Safe for Spicy Creators who receive 100% payouts!']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image', 'content' => $image]);
        SeoMeta::addTag('meta', ['property' => 'twitter:site', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['property' => 'twitter:creator', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image:alt', 'content' => 'Financial Gifts,Donations & Memberships']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image:src', 'content' => $image]);
        SeoMeta::addTag('meta', ['property' => 'og:image', 'content' => $image]);
        SeoMeta::addTag('link', ['rel' => 'canonical', 'href' => "https://spennypiggy.co/{$username}"]);
    }

    /**
     * Get user goal with optimized queries
     */
    public function usergoal(string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ]);
        }

        $earnings = $this->profileService->getUserEarnings($user->id);

        return response()->json([
            "success" => true,
            "goal" => [
                'fullfilled' => $earnings['fulfilled'],
                'target' => $earnings['target'],
                'currency' => $user->default_currency,
            ]
        ]);
    }

    /**
     * Get user items with optimized pagination
     */
    public function userItems(string $username, ?int $categoryId = null)
    {
        $user = $this->profileService->getUserWithRelations($username);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'items' => [],
                'message' => 'User not found'
            ]);
        }

        $items = $this->profileService->getUserWishItems($user->id, $categoryId, 50);

        return response()->json([
            'success' => true,
            'items' => $items
        ]);
    }

    /**
     * Get user categories with caching
     */
    public function userCategory(string $username)
    {
        try {
            $user = $this->profileService->getUserWithRelations($username);
            
            if (!$user) {
                return response()->json([
                    "success" => false,
                    "categories" => [],
                    "message" => "User not found"
                ]);
            }

            $categories = $user->user_categories ?? [];

            return response()->json([
                "success" => true,
                "categories" => $categories,
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                "success" => false,
                "categories" => [],
                "message" => "Error fetching categories"
            ]);
        }
    }

    /**
     * Check username availability with caching
     */
    public function checkUserName(string $username)
    {
        $exists = \App\Models\User::where('username', $username)
            ->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists
        ]);
    }

    /**
     * Get social links with caching
     */
    public function sociallinks(string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'sociallinks' => null,
                'message' => 'User not found'
            ]);
        }

        return response()->json([
            'success' => true,
            'sociallinks' => $user->social_links
        ]);
    }

    /**
     * Get user gift items with caching
     */
    public function userGiftItems(string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);
        
        // Ensure user exists
        if (!$user) {
             return response()->json([
                'success' => true,
                'items' => []
            ]);
        }

        $items = \App\Models\RyeProduct::where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->toArray();

        return response()->json([
            'success' => true,
            'items' => $items
        ]);
    }

    /**
     * Get founder bonus data for the user
     */
    private function getFounderData($user): array
    {
        $first30DayEarnings = 0;

        // Calculate first 30-day earnings for the user
        if ($user) {
            $createdAt = $user->created_at;
            $thirtyDaysAfterCreation = $createdAt->copy()->addDays(30);
            
            // Get total earnings from deliverables within first 30 days
            $first30DayEarnings = Deliverable::where('creator_id', $user->id)
                ->where('created_at', '>=', $createdAt)
                ->where('created_at', '<=', $thirtyDaysAfterCreation)
                ->where('status', 'delivered')
                ->sum('transaction_amount');
        }

        return [
            'first30DayEarnings' => $first30DayEarnings
        ];
    }
}
