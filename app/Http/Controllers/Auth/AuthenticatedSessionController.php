<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Verify2FARequest;
use App\Jobs\SendContractMail;
use App\Models\AuthRedirect;
use App\Models\FanContract;
use App\Models\FounderBonus;
use App\Models\MonthlyCharge;
use App\Models\Post;
use App\Models\RyeProduct;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserBackupCode;
use App\Models\UserBlock;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\SeoMeta;
use App\Services\SeoTemplateService;
use App\Services\UserProfileService;
use App\StripeControl;
use App\TwitterAuthService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FALaravel\Google2FA;
use PragmaRX\Recovery\Recovery;
use Ramsey\Uuid\Uuid;
use Stripe\Exception\InvalidRequestException;
use Uploadcare\Configuration;
use Uploadcare\Uploader\Uploader;

class AuthenticatedSessionController extends Controller
{
    protected $google2FA;

    protected $profileService;

    public function __construct(Google2FA $google2FA, UserProfileService $profileService)
    {
        $this->google2FA = $google2FA;
        $this->profileService = $profileService;
    }

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            // Renders the Google button only when both credentials are configured — a button
            // that can only answer "not available right now" is worse than no button.
            'googleEnabled' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
            'google2faPendingEmail' => session('google_2fa_pending_email'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();
        $user = Auth::user();
        if ($user->suspended_account == 1) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'status' => false,
                'message' => 'Your account is suspended due to a policy violation or payout configuration issue. Please contact support.',
            ], 403);
        }
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => true,
            'message' => 'Logged in successfully',
            'user' => $user,
            'redirect_url' => $this->getRedirectUrl($user),
        ]);
    }

    /**
     * Get redirect URL after login
     */
    protected function getRedirectUrl($user): string
    {
        if (session()->has('url.intended')) {
            return session()->pull('url.intended');
        }

        return route('user.show', ['username' => $user->username]);
    }

    // public function store(LoginRequest $request)
    // {
    //     //saving the google secret of an particular user

    //     $request->authenticate();
    //     $request->session()->regenerate();
    //     $request->session()->regenerateToken();
    //     $user = Auth::user();

    //     $secret = $this->google2FA->generateSecretKey();
    //     if (empty($user->tfa_key) && $user->role == 1) {
    //         $user->tfa_key = $secret;
    //         $user->save();
    //     }
    //     $ipAddress = $request->ip();
    //     $checkIpExist = $user->ip_address;
    //     if (empty($checkIpExist) && $user instanceof \App\Models\User) {
    //         $user->ip_address = $ipAddress;
    //         $user->save();
    //     }

    //     // $auth = AuthRedirect::create([
    //     //     "user_id"   =>  $user->id,
    //     //     'country'   =>  $user->country,
    //     //     'origin'    =>  'localhost',
    //     //     'target'    =>  'localhost',
    //     // ]);
    //     // Auth::logout();
    //     // return Inertia::location("http://localhost:8000/verify-token/{$auth->uuid}");
    //     // if()
    //     // if ($request->getHttpHost() == "uk.spennypiggy.co" and $user->country != "GB") {
    //     //     // return Inertia::location("https://spennypiggy.com/{$user->username}");
    //     //     $auth = AuthRedirect::create([
    //     //         "user_id"   =>  $user->id,
    //     //         'country'   =>  $user->country,
    //     //         'origin'    =>  $request->getHttpHost(),
    //     //         'target'    =>  'spennypiggy.co',
    //     //     ]);
    //     //     Auth::logout();
    //     //     return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
    //     // } else
    //     // if (!in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
    //     //     // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
    //     //     $auth = AuthRedirect::create([
    //     //         "user_id"   =>  $user->id,
    //     //         'country'   =>  $user->country,
    //     //         'origin'    =>  $request->getHttpHost(),
    //     //         'target'    =>  'uk.spennypiggy.co',
    //     //     ]);
    //     //     Auth::logout();
    //     //     return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
    //     // }

    //     // Handle JSON requests differently
    //     if ($request->expectsJson()) {
    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Logged in successfully.',
    //             'redirect_url' => route('user.show', ['username' => $user->username])
    //         ]);
    //     }

    //     return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
    // }

    public function verifyUser(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = Str::lower(trim((string) $validated['email']));
        $user = User::withTrashed()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (empty($user)) {
            return response()->json([
                'status' => false,
                'msg' => 'No account exist with this email.',
            ]);
        }

        if (method_exists($user, 'trashed') && $user->trashed()) {
            return response()->json([
                'status' => false,
                'msg' => 'This account is deactivated. Please contact support.',
            ]);
        }

        $is_2fa = false;
        if ($user->is_2fa) {
            if (! Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Either email or password is wrong.',
                ]);
            }
            $is_2fa = true;
        }

        return response()->json([
            'status' => true,
            'is_2fa' => $is_2fa,
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Log::info('AuthSession: Logout Triggered', [
            'user_id' => Auth::id(),
            'session_id' => $request->session()->getId(),
            'ip' => $request->ip(),
        ]);

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect(route('login'))->with('success', 'Logged out successfully.');
    }

    /**
     * Private user profile info
     */
    /**
     * Optimized user profile method with better performance
     */
    public function getUserProfile($username, $page = 'about')
    {
        $forceRefresh = request()->has('refresh');
        if ($forceRefresh && Auth::check()) {
            $targetUser = User::where('username', $username)->first();
            if ($targetUser && (string) Auth::id() === (string) $targetUser->id) {
                $this->profileService->clearUserCaches($username, $targetUser->id);
            }
        }

        $getData = function () use ($username, $page, $forceRefresh) {
            $profileData = $this->profileService->preloadUserProfileData($username);
            if (empty($profileData)) {
                return ['__page' => 'NotFound'];
            }

            $user = $profileData['user'];
            $isOwner = Auth::check() && (string) Auth::id() === (string) $user->id;

            if ($user->suspended_account == 1) {
                return ['__page' => 'Suspanded'];
            }

            $pageData = $this->getCachedPageSpecificData($user->id, $page, $isOwner, $forceRefresh);

            $this->setSeoMetaTags($user, $username);

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
                $subscription = MonthlyCharge::where('user_id', $user->id)
                    ->newestFirst()
                    ->first();
            }

            $monthlyCharges = null;
            if ($subscription) {
                $fmt = function ($date) {
                    try {
                        return $date ? Carbon::parse($date)->format('d F Y') : null;
                    } catch (\Throwable $e) {
                        return null;
                    }
                };

                $monthlyCharges = [
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

            $sociallinks = null;
            $userIntro = null;
            $isNeedToUpgrade = false;
            $cardCapabilities = true;
            $stripeRequirements = [];

            // Deferred stripe API calls for non-owners using Inertia Lazy
            // Only do it synchronously if viewing OWN profile
            if ($page === 'about' && $user->role == 1 && ! empty($user->account_id) && $isOwner) {
                [$isNeedToUpgrade, $cardCapabilities, $stripeRequirements] = $this->getStripeCapabilities($user);
            }
            // Fetch social links using eager loaded relation or cache
            $sociallinks = $user->social_links;
            if ($sociallinks && $sociallinks->status != 1 && (! Auth::check() || Auth::id() !== $user->id)) {
                $sociallinks = null;
            }
            if ($page == 'about') {
                $userIntro = $user->intro;
            }

            $migrationStatus = ['needs_migration' => false, 'show_warning' => false];
            if ($page === 'about') {
                $migrationStatus = $this->getMigrationStatus($user);
            }
            $founderData = $this->getFounderData($user);

            $blockData = [
                'blocked' => false,
                'blocked_by_me' => false,
            ];

            if (Auth::check() && Auth::id() != $user->id) {

                $viewerId = Auth::id();
                $creatorId = $user->id;

                // Logged in user blocked this profile
                $blockedByMe = UserBlock::where([
                    'creator_id' => $viewerId,
                    'blocked_id' => $creatorId,
                ])->exists();

                // Profile owner blocked logged in user
                $blockedByCreator = UserBlock::where([
                    'creator_id' => $creatorId,
                    'blocked_id' => $viewerId,
                ])->exists();

                $blockData = [
                    // If either side blocked, interaction is blocked
                    'blocked' => ($blockedByMe || $blockedByCreator),

                    // Used only to know whether to show the Unblock button
                    'blocked_by_me' => $blockedByMe,
                ];
            }

            return [
                '__page' => 'Dashboard',
                'username' => $username,
                'user' => $user,
                'itemid' => request()->query('item') ?? false,
                'card_capabilities' => $cardCapabilities,
                'has_stripe_account' => ! empty($user->account_id),
                'isNeedToUpgrade' => $isNeedToUpgrade,
                'stripe_requirements' => $stripeRequirements,
                'migration_status' => $migrationStatus,
                'sociallinks' => $sociallinks,
                'slinks' => $sociallinks,
                'intro' => $userIntro,
                'supporters' => $profileData['supporters'],
                'wish_categories' => $page === 'wishes' ? $this->getCategoriesWithItems($user) : [],
                'all_user_categories' => Auth::check() && Auth::id() === $user->id ? $user->user_categories : [],
                'selectedCategory' => request()->query('category') ?? false,
                'page' => $page,
                'is_blocked' => $blockData,
                'monthly_charges' => $monthlyCharges,
                ...$pageData,
                'first30DayEarnings' => $founderData['first30DayEarnings'],
                'founderData' => $founderData,
                'profile_overview' => $user->role == 1 ? $this->profileService->getProfileOverview($user->id) : null,
                'social_proof' => $user->role == 1 ? $this->profileService->getProfileSocialProof($user->id) : null,
                'viewer_support' => $user->role == 1
                    ? $this->profileService->getViewerSupportHistory($user->id, Auth::id())
                    : null,
            ];
        };
        $data = $getData();

        // Both of these used to render with HTTP 200. To a crawler a 200 means
        // "this URL is a real page", so every unknown or suspended username was
        // indexed as a soft-404 and kept being re-crawled. The status code is the
        // only signal that removes it.
        if (($data['__page'] ?? null) === 'NotFound') {
            SeoMeta::setRobots('noindex,follow');

            return Inertia::render('NotFound')->toResponse(request())->setStatusCode(404);
        }
        if (($data['__page'] ?? null) === 'Suspanded') {
            SeoMeta::setRobots('noindex,follow');

            // 410 Gone, not 404: the profile existed and was withdrawn, and Google
            // drops a 410 from the index faster than a 404.
            return Inertia::render('Suspanded')->toResponse(request())->setStatusCode(410);
        }
        $pageName = $data['__page'] ?? 'Dashboard';
        unset($data['__page']);

        $response = Inertia::render($pageName, $data);
        if (app()->environment('production') && ! Auth::check()) {
            // Inertia\Response is Responsable, not a Response — convert before adding headers.
            return $response->toResponse(request())->withHeaders([
                'Cache-Control' => 'public, max-age=60, s-maxage=300, must-revalidate',
            ]);
        }

        return $response;
    }

    private function getCachedPageSpecificData(int $userId, string $page, bool $isOwner, bool $bypassCache): array
    {
        if ($bypassCache) {
            return $this->getPageSpecificData($userId, $page);
        }

        $version = $this->profileService->getProfileCacheToken($userId);
        $categoryKey = request()->query('category') ?? 'all';
        $cacheKey = "profile_page_data_{$userId}_{$categoryKey}_{$page}_v{$version}";
        $ttl = $isOwner ? 30 : 600;

        return Cache::remember($cacheKey, $ttl, function () use ($userId, $page) {
            return $this->getPageSpecificData($userId, $page);
        });
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
            $cacheKey = 'stripe_caps_v1_'.$user->account_id;

            return Cache::remember($cacheKey, 300, function () use ($user) {
                StripeControl::getAccount($user->account_id);

                $migrationCheck = StripeController::checkAccountMigrationNeeds($user);
                $isNeedToUpgrade = $migrationCheck['needs_migration'] ?? false;

                $cardCapabilities = StripeControl::isAccountReadyForCheckout($user->account_id);

                $requirements = StripeControl::getAccountRequirements($user->account_id);

                if ($isNeedToUpgrade) {
                    $requirements['has_requirements'] = true;
                    $requirements['requirements'][] = [
                        'type' => 'legacy_upgrade',
                        'severity' => 'high',
                        'title' => 'Account Upgrade Required',
                        'message' => 'Your Stripe account needs to be upgraded to the latest version to receive card payments.',
                        'action' => 'Upgrade your Stripe account now.',
                        'action_url' => '/stripe/upgrade-express-account',
                    ];
                }

                return [$isNeedToUpgrade, $cardCapabilities, $requirements];
            });
        } catch (\Exception $e) {
            // Only disable stripe connected details if the account was explicitly deleted from Stripe (404)
            if ($e instanceof InvalidRequestException && $e->getHttpStatus() === 404) {
                $user->update(['stripe_details_submitted' => 0]);
            }

            return [false, false, [
                'has_requirements' => true,
                'requirements' => [[
                    'type' => 'connection_error',
                    'severity' => 'critical',
                    'title' => 'Account Connection Issue',
                    'message' => 'Unable to check your Stripe account status. Please try again or contact support.',
                    'action' => 'Refresh the page or contact support.',
                    'action_url' => null,
                ]],
                'account_status' => [],
            ]];
        }
    }

    /**
     * Get only user categories that have at least one wish item.
     * For public viewers (not the owner), only count approved items.
     */
    private function getCategoriesWithItems($user)
    {
        $callback = function () use ($user) {
            $isPublicView = (auth()->check() && auth()->id() !== $user->id) || ! auth()->check();

            $categoryIds = WishCategory::whereHas('wish', function ($q) use ($user) {
                $q->where('user_id', $user->id);
                // For both public and owner, only show categories with approved items
                // This matches the user's request to only show categories with items (meaning visible items)
                $q->where('is_approved', 1);
            })->pluck('user_category_id')->unique()->filter();

            // Return the filtered categories as a collection
            return $user->user_categories()->whereIn('id', $categoryIds)->get();
        };

        if (Auth::check()) {
            return $callback();
        }

        return Cache::remember('user_categories_with_items_'.$user->id, 600, $callback);
    }

    /**
     * Check if user's Stripe account needs migration for cross-border payments
     */
    private function getMigrationStatus($user): array
    {
        // Only check for logged-in users viewing their own profile
        if (! Auth::check() || Auth::id() !== $user->id) {
            return ['needs_migration' => false, 'show_warning' => false];
        }

        try {
            $cacheKey = 'stripe_migration_status_v1_'.$user->id;

            return Cache::remember($cacheKey, 300, function () use ($user) {
                $migrationCheck = StripeController::checkAccountMigrationNeeds($user);

                return [
                    'needs_migration' => $migrationCheck['needs_migration'] ?? false,
                    'show_warning' => $migrationCheck['needs_migration'] ?? false,
                    'current_agreement' => $migrationCheck['current_agreement'] ?? null,
                    'required_agreement' => $migrationCheck['required_agreement'] ?? null,
                    'country' => $migrationCheck['country'] ?? $user->country,
                    'reason' => $migrationCheck['reason'] ?? 'Account check not available',
                ];
            });
        } catch (\Exception $e) {
            return [
                'needs_migration' => false,
                'show_warning' => false,
                'error' => 'Unable to check migration status',
            ];
        }
    }

    /**
     * Get page-specific data efficiently
     */
    private function getPageSpecificData(int $userId, string $page): array
    {
        $data = [
            'items' => [],
            'posts' => [],
            'memberships' => [],
            'bills' => [],
            'shops' => [],
            'tasks' => [],
            'piggyPots' => [],
            'piggyPotTopSupporters' => [],
            'piggyPotFeed' => [],
        ];

        switch ($page) {
            case 'tasks':
                $data['tasks'] = $this->profileService->getOptimizedTasks($userId, Auth::id() === $userId);
                break;

            case 'wishes':
                $categoryId = request()->query('category');
                $data['items'] = $this->profileService->getUserWishItems($userId, $categoryId);
                break;

            case 'feed':
                $data['posts'] = $this->profileService->getUserPosts($userId);
                break;
            case 'piggy-pots':
                $data['piggyPots'] = $this->profileService->getOptimizedPiggyPots($userId, Auth::id() === $userId, false);
                break;

            case 'about':
                $data['posts'] = $this->profileService->getUserPosts($userId);
                $data['piggyPots'] = $this->profileService->getOptimizedPiggyPots($userId, Auth::id() === $userId, true);
                $data['piggyPotTopSupporters'] = $this->profileService->getPiggyPotTopSupporters($userId);
                $data['piggyPotFeed'] = $this->profileService->getPiggyPotFeed($userId);
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
        $defaultImage = url('/og-image.png');
        $image = $defaultImage;
        if (! empty($user->social_image)) {
            $image = "https://ucarecdn.com/{$user->social_image}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        } elseif (! empty($user->cover)) {
            $image = "https://ucarecdn.com/{$user->cover}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        } elseif (! empty($user->avatar)) {
            $image = "https://ucarecdn.com/{$user->avatar}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }

        $isWishPage = request()->routeIs('wish.show');
        $wish = null;
        if ($isWishPage) {
            $wishId = request()->route('id');
            if ($wishId) {
                $wish = WishItem::find($wishId);
            }
        }
        if ($isWishPage && $wish && ! empty($wish->thumbnail)) {
            $image = "https://ucarecdn.com/{$wish->thumbnail}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }

        $canonicalUrl = $isWishPage && $wish
            ? SeoMeta::getPageCanonical('wish.show', ['username' => $username, 'id' => $wish->id])
            : SeoMeta::getPageCanonical('user.show', ['username' => $username]);

        $title = $isWishPage && $wish
            ? "{$wish->wishname} — {$user->name} | Spenny Piggy"
            : "{$user->name} — Spenny Piggy";

        // Descriptions are what Google prints in the result — they are a Stripe-facing
        // surface and follow the content-first rules (a purchase of creator content,
        // never a gift/tip/donation). SeoTemplateService owns the wording.
        $description = $isWishPage && $wish
            ? SeoTemplateService::getWishItemDescription($user, $wish)
            : SeoTemplateService::getCreatorDescription($user);

        SeoMeta::addTag('title', $title);
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);

        $keywords = "{$user->name}, {$user->username}, creator, exclusive content, memberships, paid requests, Spenny Piggy";
        if (! empty($user->creator_category)) {
            $keywords .= ", {$user->creator_category}";
        }
        if ($isWishPage && $wish) {
            $keywords = "{$wish->wishname}, exclusive content, {$user->name}, {$user->username}, Spenny Piggy";
            if (! empty($wish->category)) {
                $keywords .= ", {$wish->category}";
            }
        }
        SeoMeta::addTag('meta', ['name' => 'keywords', 'content' => $keywords]);

        SeoMeta::setCanonical($canonicalUrl);
        SeoMeta::setOgData($isWishPage ? 'product' : 'profile', $title, $description, $image, $canonicalUrl);
        SeoMeta::setTwitterCard('summary_large_image', $title, $description, $image);

        // One English site — self-referencing hreflang only (see setHreflangTags).
        SeoTemplateService::setHreflangTags(request()->path());

        // Structured data. Both generators existed but were never called from
        // anywhere, so a creator profile carried no Person markup and a wish page —
        // the only per-item public URL on the platform — carried no Product/Offer,
        // which is what a commerce result needs to show price and availability.
        if ($isWishPage && $wish) {
            SeoMeta::addJsonLd(SeoTemplateService::generateProductSchema($wish, $user));
        } else {
            SeoMeta::addJsonLd(SeoTemplateService::generatePersonSchema($user));
        }

        $breadcrumbs = [
            ['name' => 'Home', 'url' => url('/')],
            ['name' => $user->name, 'url' => SeoMeta::getPageCanonical('user.show', ['username' => $username])],
        ];
        if ($isWishPage && $wish) {
            $breadcrumbs[] = ['name' => $wish->wishname, 'url' => $canonicalUrl];
        }
        SeoMeta::addBreadcrumbJsonLd($breadcrumbs);
    }

    public function usergoal($username)
    {
        $user = $this->profileService->getUserWithRelations($username);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ]);
        }

        $earnings = $this->profileService->getUserEarnings($user->id);

        return response()->json([
            'success' => true,
            'goal' => [
                'fullfilled' => $earnings['fulfilled'],
                'target' => $earnings['target'],
                'currency' => $user->default_currency,
            ],
        ]);
    }

    /**
     * Get User Wish Items
     *
     * @param  string  $username  Username
     * @param  int  $category_id  Category Id
     * @return mixed
     */
    public function userItems($username, $category_id = null)
    {
        $user = User::firstWhere('username', $username);

        if ($user) {
            $query = $user->wishItems()
                ->when($category_id, function ($query) use ($category_id) {
                    // If $categoryID is specified, filter by the specific category
                    $query->whereHas('wishCategories', function ($query) use ($category_id) {
                        $query->where('user_category_id', $category_id);
                    });
                });

            if ((Auth::check() && $user->id != Auth::id()) || ! (Auth::check())) {
                $query->where('is_approved', 1);
            }
            // ->orderBy('is_pin', 'DESC')
            $items = $query->orderBy('sort', 'ASC')
                ->latest()
                ->get();

            // $count = 1;
            // $items->map(function ($item) use ($count) {
            //     $item->key = $count;
            //     $count++;

            //     return $item;
            // });

            return response()->json([
                'success' => true,
                'items' => $items,
            ]);
        }

        return response()->json([
            'success' => false,
            'items' => [],
            'message' => 'User not found',
        ]);
    }

    public function user_category($username)
    {
        try {
            $user = User::where('username', $username)->first();
            $categories = [];
            if (! empty($user)) {
                $categories = $user->user_categories()->get();
                // $categories = UserCategory::whereUserId($user->id)->latest()->get();
            }

            return response()->json([
                'success' => true,
                'categories' => $categories,
            ]);
        } catch (\Throwable $th) {
            // throw $th;
        }
    }

    public function user_shop_category($username)
    {
        $user = User::where('username', $username)->first();
        $categories = [];
        if (! empty($user)) {
            $categories = $user->user_shop_categories()->get();
        }

        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    public function userGiftItems($username)
    {
        $authUser = Auth::user(); // Get the logged-in user

        $user = User::firstWhere('username', $username);

        if (! $user) {
            return response()->json([
                'success' => false,
                'items' => [],
                'message' => 'User not found',
            ]);
        }

        // Initialize query for fetching products
        $query = RyeProduct::where('creator_id', $user->id);

        // If the authenticated user is not the owner, include soft-deleted products
        if (isset($authUser) && isset($user)) {
            if ($authUser->id == $user->id) {
                $query->withTrashed();
            }
        }

        $allProducts = $query->get();

        return response()->json([
            'success' => true,
            'items' => $allProducts,
        ]);
    }

    public function sociallinks($username)
    {
        try {
            $user = User::where('username', $username)->first();
            $slinks = [];
            $sociallinks = [];
            if (! empty($user)) {
                $slinks = $user->social_links()->first();
                if (! empty($slinks)) {
                    $sociallinks = [
                        [
                            'social' => 'facebook',
                            'url' => $slinks->facebook ?? null,
                        ],
                        [
                            'social' => 'twitter',
                            'url' => $slinks->twitter ?? null,
                        ],
                        [
                            'social' => 'instagram',
                            'url' => $slinks->instagram ?? null,
                        ],
                        [
                            'social' => 'reddit',
                            'url' => $slinks->reddit ?? null,
                        ],
                        [
                            'social' => 'youtube',
                            'url' => $slinks->youtube ?? null,
                        ],
                        [
                            'social' => 'tumblr',
                            'url' => $slinks->tumblr ?? null,
                        ],
                        [
                            'social' => 'twitch',
                            'url' => $slinks->twitch ?? null,
                        ],
                        [
                            'social' => 'other',
                            'url' => $slinks->other ?? null,
                        ],
                    ];
                }
            } else {
                return response()->json([
                    'success' => false,
                    'msg' => 'User not found !!',
                ]);
            }

            return response()->json([
                'success' => true,
                // "sociallinks" => $sociallinks,
                // "slinks" => $slinks
            ]);
        } catch (\Throwable $th) {
            // throw $th;
        }
    }

    public function checkUserName($username)
    {
        try {
            if (preg_match('/^[a-z0-9_]+$/', $username)) {
                // Username contains only lowercase letters, numbers, and underscores
                $user = User::where('username', $username)->first();
                if (! empty($user)) {
                    return response()->json(['status' => false, 'msg' => 'Username is not available']);
                } else {
                    return response()->json(['status' => true, 'msg' => 'Username is available']);
                }
            } else {
                // Username contains spaces, special characters, or capital letters
                return response()->json(['status' => false, 'msg' => 'Username should contains only lowercase letters, numbers, and underscores']);
            }
        } catch (\Throwable $th) {
            // throw $th;
        }
    }

    public function unlinkTwitter()
    {
        $user = User::where('id', Auth::id())->first();

        if (! empty($user->twitter_token)) {
            //     $req = TwitterAuthService::revokeToken($user->twitter_token);
            //     return response()->json($req);
            // if($req->successful()){
            $user->twitter_token->delete();

            return back()->with('success', 'Twitter unlinked successfully.');
            // }

            // return back()->with('error','Something Went Wrong.');
        }

        return back()->with('error', 'No linked twitter account found.');
    }

    /**
     * Handle Redirect from cross domain
     */
    public function authRedirects(Request $request, $token)
    {
        $ref = $request->header('Referer', 'http://localhost:8000/');
        if (! $ref) {
            // RateLimiter::hit($request->throttleKey())
            return to_route('home')->with('error', 'Invalid redirection or parameters!');
        }

        $ref = parse_url($ref);
        $origin = $ref['host'];
        $token = AuthRedirect::whereUuid($token)
            ->whereNull('used_at')
            ->where('target', $request->getHttpHost())
            ->where('origin', $origin)
            ->first();

        if (! $token) {
            abort(404, 'Not Found!');
        }

        if (! $token->created_at->isAfter(Carbon::now()->subMinutes(2))) {
            return to_route('home')->with('error', 'Link Expired!');
        }
        // return response()->json([
        //     'sucess'    => true,
        //     'ref'    => $ref,
        //     'token'     => $token
        // ]);

        $user = User::firstWhere('id', $token->user_id);
        if (! $user) {
            return to_route('home')->with('error', 'Link is invalid!');
        }

        Auth::login($user, true);
        $request->session()->regenerate();
        $token->update([
            'used_at' => Carbon::now(),
        ]);
        $token->delete();

        return to_route('user.show', ['username' => $user->username])->with('success', 'Welcome back. Login successfull.');
    }

    public function updateVat($percent)
    {
        $user = User::where('id', Auth::id())->first();

        $user->vat_amount_percentage = $percent;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Vat updated successfully',
        ]);
    }

    /**
     * Verify 2FA OTP
     *
     * @param  Verify2FARequest  $verify2faRequest
     * @return \Illuminate\Http\Response JSON
     */
    public function verify2FA(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        $otp = $request->input('otp');
        $backup_code = $request->input('backup_code');

        // Generic failure avoids user-enumeration and the fatal null-deref below
        // ($user->tfa_key / $user->id) when the email doesn't match a user.
        if (! $user) {
            return response()->json(['status' => false, 'msg' => 'Invalid verification code.'], 422);
        }

        $valid = false;

        if (! empty($otp)) {
            $valid = $this->google2FA->verifyKey($user->tfa_key, $otp);
        }

        if (! empty($backup_code)) {
            $backup = UserBackupCode::where('user_id', $user->id)->get();
            foreach ($backup as $value) {
                $code = decrypt($value->code);
                // Constant-time comparison to avoid timing side-channels.
                if (hash_equals((string) $code, (string) $backup_code)) {
                    $valid = true;
                    $value->delete();
                }
            }
        }

        if ($valid) {
            // Check if this is a Google 2FA login pending in session
            $google2faEmail = $request->session()->get('google_2fa_pending_email');

            if ($google2faEmail && strtolower(trim($google2faEmail)) === strtolower(trim($email))) {
                Auth::login($user, $request->boolean('remember'));

                $request->session()->forget('google_2fa_pending_email');
                $request->session()->regenerate();
                $request->session()->regenerateToken();

                return response()->json([
                    'status' => true,
                    'redirect_url' => $this->getRedirectUrl($user),
                    'message' => 'Logged in successfully.',
                ]);
            }

            // $request->authenticate();
            $credentials = [
                'email' => $email,
                'password' => $password,
            ];
            // Persistent login: honour "Remember me" for 2FA users too.
            // Defaults to false when the 2FA form doesn't post `remember`, so no behaviour change.
            if (Auth::attempt($credentials, $request->boolean('remember'))) {

                $request->session()->regenerate();
                $request->session()->regenerateToken();
                $user = Auth::user();

                if ($request->getHttpHost() == 'uk.spennypiggy.co' and $user->country != 'GB') {
                    // return Inertia::location("https://spennypiggy.com/{$user->username}");
                    $auth = AuthRedirect::create([
                        'user_id' => $user->id,
                        'country' => $user->country,
                        'origin' => $request->getHttpHost(),
                        'target' => 'spennypiggy.co',
                    ]);

                    Auth::logout();

                    // return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
                    return response()->json([
                        'status' => true,
                        'redirect_url' => "https://spennypiggy.co/verify-token/{$auth->uuid}",
                        'message' => 'Redirecting...',
                    ]);
                } elseif (! in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
                    // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
                    $auth = AuthRedirect::create([
                        'user_id' => $user->id,
                        'country' => $user->country,
                        'origin' => $request->getHttpHost(),
                        'target' => 'uk.spennypiggy.co',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]);

                    Auth::logout();

                    // return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
                    return response()->json([
                        'status' => true,
                        'redirect_url' => "https://uk.spennypiggy.co/verify-token/{$auth->uuid}",
                        'message' => 'Redirecting...',
                    ]);
                }

                // return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
                return response()->json([
                    'status' => true,
                    'redirect_url' => $this->getRedirectUrl($user),
                    'message' => 'Logged in successfully.',
                ]);
            } else {
                // return back()->with("error", "Unable to login.");
                return response()->json([
                    'status' => false,
                    'msg' => 'Unable to login.',
                ]);
            }
        } else {
            if (! empty($otp)) {
                $text = 'OTP';
            } else {
                $text = 'Backup Code';
            }

            // return back()->with("error", "$text is invalid.");
            return response()->json([
                'status' => false,
                'msg' => "$text is invalid.",
            ]);
        }
    }

    /**
     * Generating the backup codes for 2fa
     *
     * @return \Illuminate\Http\Response json
     */
    public function generateBackupCode()
    {
        $user = User::findOrFail(Auth::id());

        $recovery = new Recovery;
        $codes = $recovery->setCount(5)->toCollection();
        UserBackupCode::where('user_id', $user->id)->delete();
        foreach ($codes as $key => $value) {
            $backup = new UserBackupCode;
            $backup->user_id = $user->id;
            $backup->code = encrypt($value);
            $backup->save();
        }

        return response()->json([
            'status' => true,
            'tfa' => true,
            'msg' => 'Open your authenticator app to get security code.',
            'qr' => request()->query('type') == 1 ? $this->twofQR($user->id) : null,
            'backup_codes' => $codes ?? null,
        ], 200);
    }

    /**
     * Sign Contract
     *
     * @return JSON
     */
    public function signContract(Request $request)
    {
        // $request->validate([
        //     'sign' => [
        //         'required',
        //         'regex:/data:image\/\w+;base64,/i'
        //     ],
        //     'name' => [
        //         'sometimes',
        //         'required',
        //         'string',
        //         'min:5'
        //     ]
        // ], [
        //     'sign.required' => 'Please sign on the contract.',
        //     'sign.rejex' => 'Signature is not in a valid format.',
        //     'name.required' => 'Please enter your real name.',
        // ]);

        $name = $request->query('name');

        $sign = $request->query('sign');

        $user = User::where('id', Auth::guard('sanctum')->id())->first();

        $contract = new FanContract;
        $contract->user_id = $user->id;
        $contract->name = $name ?? $user->name;
        $contract->sign = $sign;
        $contract->save();

        $mpdfFacade = 'Mccarlosen\\LaravelMpdf\\Facades\\LaravelMpdf';
        if (class_exists($mpdfFacade)) {
            $pdf = call_user_func([$mpdfFacade, 'loadView'], 'pdf.creator-contract', [
                'contract' => $contract,
            ]);

            $pdfContent = $pdf->output();

            // Upload the PDF to Uploadcare
            $configuration = Configuration::create((string) $_ENV['UPLOADCARE_PUBLIC_KEY'], (string) $_ENV['UPLOADCARE_SECRET_KEY']);
            $uploader = new Uploader($configuration);

            $fileInfo = $uploader->fromContent($pdfContent, 'application/pdf', Uuid::uuid4().'.pdf');

            $contract->document = $fileInfo->getUuid();
        } else {
            // TODO: Install mccarlosen/laravel-mpdf to enable PDF generation
            Log::error('LaravelMpdf package missing. Contract PDF not generated.');
        }

        $contract->status = 1;
        $contract->save();
        $contract->refresh();

        SendContractMail::dispatch($contract, 'creator', $contract->url);
        // unlink($tempPdfPath);

        return to_route('user.show', ['username' => $contract->user->username])->with('success', 'Thank you for signing the contract.');
        // return response()->json([
        //     'status' => true,
        //     'msg'    => 'Thank you for signing the contract.',
        //     'contract' => $contract->url
        // ]);
    }

    /**
     * Get founder bonus data for a user
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
