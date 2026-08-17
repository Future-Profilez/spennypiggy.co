<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\FounderBonus;
use App\Models\MonthlyCharge;
use App\Models\RyeProduct;
use App\Models\User;
use App\Models\WishCategory;
use App\SeoMeta;
use App\Services\SeoTemplateService;
use App\Services\Stripe\StripeAccountState;
use App\Services\UserProfileService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
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

        // Check if account needs migration for cross-border payments — derived
        // from the state read above, not a second retrieve of the same account.
        $migrationStatus = $this->getMigrationStatus($user, $isNeedToUpgrade);

        // Load ALL profile data at once for fastest loading
        $categoryId = request()->query('category');
        $allProfileData = $this->profileService->getAllProfileData($user->id, $categoryId);

        // Extract data for current page while keeping all data available
        $pageData = $this->extractPageData($allProfileData, $page);

        // Set SEO meta tags
        $this->setSeoMetaTags($user, $username);

        // Get founder bonus data
        $founderData = $this->getFounderData($user);

        // Also provide shouldShowFounderBanner calculation logic to React
        $shouldShowFounderBanner = false;
        if (! $user->is_founder) {
            $daysSinceCreation = $user->created_at->diffInDays(now());
            if ($daysSinceCreation <= 30) {
                $shouldShowFounderBanner = true;
            }
        }

        // Prepare monthly_charges data (latest relevant MonthlyCharge)
        $now = Carbon::now();
        $subscription = MonthlyCharge::where('user_id', $user->id)
            ->where(function ($query) use ($now) {
                $query->where(function ($q) use ($now) {
                    $q->whereDate('current_start_subscription_date', '<=', $now)
                        ->whereDate('current_end_subscription_date', '>=', $now);
                })->orWhere(function ($q) use ($now) {
                    $q->whereDate('current_start_trial_date', '<=', $now)
                        ->whereDate('current_end_trial_date', '>=', $now);
                });
            })
            ->newestFirst()
            ->first();

        if (! $subscription) {
            $subscription = MonthlyCharge::where('user_id', $user->id)->newestFirst()->first();
        }

        $monthly_charges = null;
        if ($subscription) {
            $fmt = function ($date) {
                try {
                    return $date ? Carbon::parse($date)->format('d F Y') : null;
                } catch (\Throwable $e) {
                    return null;
                }
            };

            $monthly_charges = [
                'id' => $subscription->id,
                'uuid' => $subscription->uuid,
                'status' => $subscription->status ?? 'pending',
                'amount' => (float) ($subscription->amount ?? 0),
                'currency' => $subscription->currency ?? 'GBP',
                'current_start_trial_date' => $fmt($subscription->current_start_trial_date),
                'current_end_trial_date' => $fmt($subscription->current_end_trial_date),
                'current_start_subscription_date' => $fmt($subscription->current_start_subscription_date),
                'current_end_subscription_date' => $fmt($subscription->current_end_subscription_date),
                'upcoming_payment' => $subscription->upcoming_payment ? Carbon::parse($subscription->upcoming_payment)->format('d F Y H:i') : null,
            ];
        }

        $response = Inertia::render('Dashboard', [
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
            ...$pageData,
            'first30DayEarnings' => $founderData['first30DayEarnings'],
            'founderData' => $founderData,
            'shouldShowFounderBanner' => $shouldShowFounderBanner,
            'profile_overview' => $user->role == 1
                ? $this->profileService->overviewForViewer(
                    $this->profileService->getProfileOverview($user->id),
                    $user
                )
                : null,
        ]);

        if (app()->environment('production') && ! Auth::check()) {
            // Inertia\Response is Responsable, not a Response — convert before adding headers.
            return $response->toResponse(request())->withHeaders([
                'Cache-Control' => 'public, max-age=60, s-maxage=300, must-revalidate',
            ]);
        }

        return $response;
    }

    /**
     * Get Stripe account capabilities with caching.
     *
     * Shares one implementation with AuthenticatedSessionController — this was a
     * verbatim copy of it, so a fix to either one silently missed the other.
     */
    private function getStripeCapabilities($user): array
    {
        return StripeAccountState::for($user);
    }

    /**
     * Check if user's Stripe account needs migration for cross-border payments.
     *
     * Takes the answer already computed above rather than retrieving the account
     * again behind its own cache key.
     */
    private function getMigrationStatus($user, bool $needsMigration): array
    {
        if (! Auth::check() || Auth::id() !== $user->id) {
            return ['needs_migration' => false, 'show_warning' => false];
        }

        return [
            'needs_migration' => $needsMigration,
            'show_warning' => $needsMigration,
            'current_agreement' => $needsMigration ? 'recipient' : null,
            'required_agreement' => 'full',
            'country' => $user->country,
            'reason' => $needsMigration
                ? 'Your payment account is on an older agreement and needs upgrading to accept card payments.'
                : 'Account is correctly configured',
        ];
    }

    /**
     * Get only categories that have at least one wishitem
     *
     * @param  User  $user
     * @return Collection
     */
    private function getCategoriesWithItems($user)
    {
        $isPublicView = (auth()->check() && auth()->id() !== $user->id) || ! auth()->check();

        $categoryIds = WishCategory::whereHas('wish', function ($q) use ($user, $isPublicView) {
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
            'tasks' => $allProfileData['tasks'] ?? [],
            // Add metadata for frontend optimization
            '_preloaded' => true,
            '_loadTime' => microtime(true),
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
            'shops' => [],
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
        // ⚠️ No route resolves to this controller — the live profile is served by
        // AuthenticatedSessionController::getUserProfile. Kept in step anyway,
        // because the copy it used to emit ("Financial Gifts, Donations",
        // "Send tributes, adopt bills") is exactly the vocabulary the content-first
        // compliance rules ban, and meta tags are printed publicly in search results.
        // If this is ever wired up, delegate rather than growing a second copy.
        SeoTemplateService::setCreatorMeta($user);
        SeoMeta::addTag('meta', ['name' => 'twitter:site', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['name' => 'twitter:creator', 'content' => '@spennypiggy']);
        SeoMeta::setCanonical(SeoMeta::getPageCanonical('user.show', ['username' => $username]));
    }

    /**
     * Get user goal with optimized queries
     */
    public function usergoal(string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ]);
        }

        // Gated identically to the live handler in AuthenticatedSessionController.
        // This controller is currently routed nowhere, so the gate is here to stop
        // it being a hole the day it IS wired up — not because it leaks today.
        return response()->json([
            'success' => true,
            'goal' => $this->profileService->goalPayloadFor($user),
        ]);
    }

    /**
     * Get user items with optimized pagination
     */
    public function userItems(string $username, ?int $categoryId = null)
    {
        $user = $this->profileService->getUserWithRelations($username);

        if (! $user) {
            return response()->json([
                'success' => false,
                'items' => [],
                'message' => 'User not found',
            ]);
        }

        $items = $this->profileService->getUserWishItems($user->id, $categoryId, 50);

        return response()->json([
            'success' => true,
            'items' => $items,
        ]);
    }

    /**
     * Get user categories with caching
     */
    public function userCategory(string $username)
    {
        try {
            $user = $this->profileService->getUserWithRelations($username);

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'categories' => [],
                    'message' => 'User not found',
                ]);
            }

            $categories = $user->user_categories ?? [];

            return response()->json([
                'success' => true,
                'categories' => $categories,
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'categories' => [],
                'message' => 'Error fetching categories',
            ]);
        }
    }

    /**
     * Check username availability with caching
     */
    public function checkUserName(string $username)
    {
        $exists = User::where('username', $username)
            ->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists,
        ]);
    }

    /**
     * Get social links with caching
     */
    public function sociallinks(string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);

        if (! $user) {
            return response()->json([
                'success' => false,
                'sociallinks' => null,
                'message' => 'User not found',
            ]);
        }

        return response()->json([
            'success' => true,
            'sociallinks' => $user->social_links,
        ]);
    }

    /**
     * Get user gift items with caching
     */
    public function userGiftItems(string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);

        // Ensure user exists
        if (! $user) {
            return response()->json([
                'success' => true,
                'items' => [],
            ]);
        }

        $items = RyeProduct::where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->toArray();

        return response()->json([
            'success' => true,
            'items' => $items,
        ]);
    }

    /**
     * Get founder bonus data for the user
     */
    private function getFounderData($user): array
    {
        $first30DayEarnings = 0;
        $isEligible = false;
        $daysLeft = 0;
        $minEarnings = FounderBonus::getMinFirst30dEarnings();
        $windowStart = null;
        $windowEnd = null;
        $qualificationDays = (int) config('founder_bonus.qualification.qualification_period_days', 30);

        if ($user) {
            $startAt = $user->stripe_connected_at ?: null;
            if ($startAt) {
                $windowStart = $startAt->copy();
                $windowEnd = $startAt->copy()->addDays($qualificationDays);

                if (! $user->is_founder && now()->lessThan($windowEnd)) {
                    $isEligible = true;
                    $daysLeft = max(0, now()->diffInDays($windowEnd, false));
                } elseif (! $user->is_founder) {
                    if ($user->founder_missed_at) {
                        // Window ended without qualifying — keep the tracker visible
                        // (as a "missed" banner) for 14 days after the outcome
                        if ($user->founder_missed_at->gt(now()->subDays(14))) {
                            $isEligible = true;
                            $daysLeft = 0;
                        }
                    } else {
                        $cutoffDate = now()->subDays(60);
                        if ($startAt->greaterThanOrEqualTo($cutoffDate)) {
                            $isEligible = true;
                            $daysLeft = 0;
                        }
                    }
                }

                $first30DayEarnings = 0.0;
                if ($isEligible) {
                    $endDate = $windowEnd->isFuture() ? now() : $windowEnd;
                    // Same net-earnings formula the qualification job uses, so the tracker
                    // shows the number that actually decides qualification
                    $first30DayEarnings = (float) FounderBonus::calculateCompletedNetEarnings($user, $startAt, $endDate, 'GBP');
                }
            }
        }

        return [
            'first30DayEarnings' => $first30DayEarnings,
            'isEligible' => $isEligible,
            'daysLeft' => $daysLeft,
            'minEarnings' => $minEarnings,
            'qualificationDays' => $qualificationDays,
            'windowStart' => $windowStart ? $windowStart->toDateString() : null,
            'windowEnd' => $windowEnd ? $windowEnd->toDateString() : null,
            'missed' => (bool) ($user && ! $user->is_founder && $user->founder_missed_at),
            'missedAt' => $user?->founder_missed_at?->toDateString(),
        ];
    }
}
