<?php

use App\Services\DiscoveryService;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\BillsController;
use App\Http\Controllers\Auth\CheckoutController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\LeaderBoardController;
use App\Http\Controllers\Auth\MembershipController;
use App\Http\Controllers\Auth\MyController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\PostsController;
use App\Http\Controllers\Auth\PwaNotification;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\ShopsController;
use App\Http\Controllers\Auth\SocialLinksController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TestController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\ReferAndEarnController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\PiggyPotController;
use App\Http\Controllers\PiggyPotPaymentController;
use App\Http\Controllers\DeliveriesController;
use App\Http\Controllers\FounderBonusController;
use App\Http\Middleware\VerifyCsrfToken;
use App\Jobs\SendRenewMail;
use App\Models\Bills;
use App\Models\BulkPwaNotification;
use App\Models\Logs;
use App\Models\Membership;
use App\Models\MonthlyCharge;
use App\Models\MorConsent;
use App\Models\SocialLinks;
use App\Models\TipGoalsPayment;
use App\Http\Controllers\WebAuthn\WebAuthnCheckController;
use App\Http\Controllers\WebAuthn\WebAuthnRegisterController;
use App\Http\Controllers\WebAuthn\WebAuthnLoginController;
use Laragear\WebAuthn\Http\Routes as WebAuthnRoutes;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\WishItem;
use App\Models\User;
use Inertia\Inertia;
use Carbon\Carbon;

// Guest routes
Route::middleware('guest')->group(function () {
    // Auth routes
    Route::get('register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'create'])
        ->name('register');
    Route::post('register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'store']);
    Route::get('login', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::match(['get', 'post'], 'verify/login', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store'])->name('login-user');
    Route::post('verify-2fa', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'verify2FA'])->name('verify2FA');
    Route::post('/verify-user', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'verifyUser'])->name('verifyUser');
    Route::post('forgot-password', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('forgot-password/{uuid}', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'forgotPasswordPage']);
    Route::post('change-password/{uuid}', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'changePassword'])->name('changePassword');
    Route::get('reset-password/{token}', [App\Http\Controllers\Auth\NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [App\Http\Controllers\Auth\NewPasswordController::class, 'store'])->name('password.store');
    Route::get('verify-token/{token}', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'authRedirects']);
    Route::get('update-2fa-key', [ProfileController::class, 'update2FaKey']);
});

/*
|--------------------------------------------------------------------------
| WebAuthn Passkey Routes
|--------------------------------------------------------------------------
*/
// debug route
Route::get('/debug/webauthn-credentials', function () {

    return \App\Models\User::with('webAuthnCredentials')->get()
        ->map(function ($user) {

            return [
                'email' => $user->email,

                'credentials' => $user->webAuthnCredentials->map(function ($cred) {

                    return [
                        'device' => $cred->device_name,
                        'browser' => $cred->browser,
                        'platform' => $cred->platform,
                        'last_used' => $cred->last_used_at
                    ];
                })

            ];
        });
})->middleware('auth');


// delete single device
// Route::delete('/webauthn/device/{id}', function ($id) {

//     auth()->user()
//         ->webAuthnCredentials()
//         ->where('id', $id)
//         ->update([
//             'disabled_at' => now()
//         ]);

//     return response()->json([
//         'success' => true
//     ]);
// });



// ========== WEBAUTHN ROUTES ==========
Route::get('/debug-webauthn-credential', function () {
    if (!auth()->check()) {
        return response()->json(['error' => 'Not authenticated'], 401);
    }

    $user = auth()->user();
    $credential = $user->webAuthnCredentials()->first();

    if (!$credential) {
        return response()->json(['error' => 'No passkey found for user'], 404);
    }

    return response()->json([
        'user_id' => $user->id,
        'user_email' => $user->email,
        'credential_exists' => true,
        'credential_id' => $credential->id,
        'rp_id' => $credential->rp_id,
        'origin' => $credential->origin,
        'counter' => $credential->counter,
        'last_used' => $credential->last_used_at
    ]);
})->middleware('auth');

Route::prefix('webauthn')->group(function () {

    // CHECK ROUTE - Check if user has passkey
    Route::post('/check', [WebAuthnCheckController::class, 'check'])->name('webauthn.check');

    // LOGIN ROUTES
    // Email-based login
    Route::post('/login/options', [WebAuthnLoginController::class, 'options'])->name('webauthn.login.options');

    // Userless login (THIS IS THE MISSING ROUTE)
    Route::post('/login/options-userless', [WebAuthnLoginController::class, 'optionsUserless'])->name('webauthn.login.userless.options');

    // Complete login
    Route::post('/login', [WebAuthnLoginController::class, 'login'])->name('webauthn.login');

    // REGISTER ROUTES (require authentication)
    Route::middleware('auth')->group(function () {
        Route::post('/register/options', [WebAuthnRegisterController::class, 'options'])->name('webauthn.register.options');
        Route::post('/register', [WebAuthnRegisterController::class, 'register'])->name('webauthn.register');
        Route::delete('/delete/{id?}', [WebAuthnCheckController::class, 'delete'])->name('webauthn.delete');
    });
});



Route::withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->group(function () {

        WebAuthnRoutes::register();
    });

// Public routes (no middleware)
Route::get('/check-referral-code/{code}', [ReferAndEarnController::class, 'checkCreatorReferral']);
Route::post('stripe/identity/verify', [StripeController::class, 'createVerificationSession'])->name('stripe.identity.verify');
Route::get('discover/wishes/{order}/{type}/{price}', [WishitemController::class, 'discover_all_wishes'])->name('discover_wish');
Route::get('discover/creators/{order}/{gender}', [WishitemController::class, 'discover_all_creators'])->name('discover_creators');
Route::get('discover/creators/categories', [WishitemController::class, 'all_creators_categories'])->name('allcreators_categories');

// Discover route
Route::get('discover/{type?}/{category?}', function (Illuminate\Http\Request $request, DiscoveryService $discoveryService, $type = 'trending', $category = null) {
    $getData = function () use ($request, $discoveryService, $type, $category) {
        $filters = $request->only(['search', 'contentType', 'page', 'sortBy', 'type', 'minPrice', 'maxPrice', 'categories']);
        // Normalize type and apply shortcut filters
        if ($type) {
            $normalizedType = strtolower($type);
            if ($normalizedType === 'trending') {
                $filters['sortBy'] = 'Trending';
                $filters['type'] = 'trending';
            } elseif ($normalizedType === 'new') {
                $filters['sortBy'] = 'New';
                $filters['type'] = 'new';
            } elseif (in_array($normalizedType, ['creators', 'wishes', 'bills', 'memberships'])) {
                $filters['contentType'] = ucfirst($normalizedType);
            }
        } else {
            // If searching by keyword and no explicit content type, search across all
            if (!$request->has('contentType') && $request->has('search')) {
                $filters['contentType'] = 'All';
            }
        }

        // Determine if we should show search results (Grid) or default sections (Carousels)
        $queryParams = $request->query();
        $hasSearchParam = $request->has('search') && strlen((string) $request->input('search')) > 0;
        $hasTypeParamQuery = $request->has('type') && in_array(strtolower($request->input('type')), ['new', 'trending']);
        $hasTypeParamRoute = $type && in_array(strtolower($type), ['new', 'trending']);
        $hasTypeParam = $hasTypeParamQuery || $hasTypeParamRoute;

        // Check contentType from filters (which includes route params) or query params
        $activeContentType = $filters['contentType'] ?? ($request->input('contentType') ?? null);
        $hasContentTypeParam = $activeContentType && in_array($activeContentType, ['Creators', 'Wishes', 'Bills', 'Memberships']);

        // Grid view when searching or selecting a specific content type
        $isSearch = $hasSearchParam || $hasTypeParam || $hasContentTypeParam;
        // Root discover shows sections
        if (!$type && empty($queryParams)) {
            $isSearch = false;
        }

        $searchResults = [];
        $featuredCreators = [];
        $newVerifiedCreators = [];
        $featuredWishes = [];
        $topEarnersData = [];
        $featuredBills = [];
        $featuredMemberships = [];

        if ($isSearch) {
            // Fetch all types unless specific contentType is set
            $ctype = $filters['contentType'] ?? 'All';

            if ($type && in_array(strtolower($type), ['trending', 'new']) && !$request->has('contentType')) {
                $ctype = 'All';
            }

            if ($ctype === 'Creators' || $ctype === 'All') {
                $searchResults['creators'] = $discoveryService->getSearchCreators($filters);
            }
            if ($ctype === 'Wishes' || $ctype === 'All') {
                $searchResults['wishes'] = $discoveryService->getSearchWishes($filters);
            }
            if ($ctype === 'Bills' || $ctype === 'All') {
                $searchResults['bills'] = $discoveryService->getSearchBills($filters);
            }
            if ($ctype === 'Memberships' || $ctype === 'All') {
                $searchResults['memberships'] = $discoveryService->getSearchMemberships($filters);
            }
        } else {
            // Section data (top 10) - ONLY fetch when not searching to save resources
            $limit = 10;
            $sortBy = $filters['sortBy'] ?? null;

            // Creators
            $featuredCreators = $sortBy === 'New' ? $discoveryService->getSearchCreators(['sortBy' => 'New'], $limit) : $discoveryService->getTrendingCreators($limit);

            $newVerifiedCreators = $discoveryService->getNewVerifiedCreators($limit);

            // Wishes
            $featuredWishes = $sortBy ? $discoveryService->getSearchWishes(['sortBy' => $sortBy], $limit) : $discoveryService->getFeaturedWishes($limit);

            // Top earners this week
            $topEarnersData = $discoveryService->getTopEarners('weekly', $limit)['data'];

            // Bills & Memberships
            $featuredBills = $sortBy ? $discoveryService->getSearchBills(['sortBy' => $sortBy], $limit) : $discoveryService->getFeaturedBills($limit);

            $featuredMemberships = $sortBy ? $discoveryService->getSearchMemberships(['sortBy' => $sortBy], $limit) : $discoveryService->getFeaturedMemberships($limit);
        }

        return [
            'featuredCreators' => $featuredCreators,
            'newVerifiedCreators' => $newVerifiedCreators,
            'featuredWishes' => $featuredWishes,
            'topEarnersData' => $topEarnersData,
            'featuredBills' => $featuredBills,
            'featuredMemberships' => $featuredMemberships,
            'filters' => $filters,
            'searchResults' => $searchResults
        ];
    };

    $page = max(1, (int) $request->query('page', 1));
    $nonPageQuery = $request->query();
    unset($nonPageQuery['page']);
    $hasNonPageQuery = !empty(array_filter($nonPageQuery, function ($v) {
        if (is_array($v)) {
            return count(array_filter($v, fn($x) => $x !== null && $x !== '')) > 0;
        }
        return $v !== null && $v !== '';
    }));

    $breadcrumbs = [
        ['name' => 'Home', 'url' => url('/')],
        ['name' => 'Discover', 'url' => url('/discover')],
    ];
    if (!empty($type) && $type !== 'trending') {
        $breadcrumbs[] = ['name' => ucwords(str_replace('-', ' ', (string) $type)), 'url' => $request->url()];
    }
    \App\SeoMeta::addBreadcrumbJsonLd($breadcrumbs);

    if ($hasNonPageQuery) {
        \App\SeoMeta::setRobots('noindex,follow');
    }

    $canonicalBase = $request->url();
    $canonicalUrl = ($page > 1 && !$hasNonPageQuery) ? ($canonicalBase . '?page=' . $page) : $canonicalBase;
    \App\SeoMeta::setCanonical($canonicalUrl);

    // Use cache for everyone, but shorter TTL for auth users if needed
    // However, discovery data is mostly global, so we can use a shared cache key
    // that depends on the request parameters.
    $cacheKey = 'discover_v2_' . ($type ?? 'root') . '_' . ($category ?? 'none') . '_' . md5(json_encode($request->all()));
    $ttl = Auth::check() ? 300 : 1200; // 5 mins for auth, 20 mins for guests

    $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, $ttl, $getData);

    if ($page > 1) {
        \App\SeoMeta::setPaginationLinks($request->fullUrlWithQuery(['page' => $page - 1]), null);
    }

    $limit = 24;
    $hasNext = false;
    if (!empty($data['searchResults']) && is_array($data['searchResults'])) {
        foreach ($data['searchResults'] as $group) {
            if (is_iterable($group) && count($group) >= $limit) {
                $hasNext = true;
                break;
            }
        }
    }

    if ($hasNext) {
        \App\SeoMeta::setPaginationLinks(null, $request->fullUrlWithQuery(['page' => $page + 1]));
    }

    return Inertia::render('discover/Discover', [
        'featuredCreators' => $data['featuredCreators'],
        'newVerifiedCreators' => $data['newVerifiedCreators'],
        'featuredWishes' => $data['featuredWishes'],
        'topEarners' => $data['topEarnersData'],
        'featuredBills' => $data['featuredBills'],
        'featuredMemberships' => $data['featuredMemberships'],
        'filters' => $data['filters'],
        'searchResults' => $data['searchResults'],
    ]);
})->name("discover");

Route::get('forgot-password', [App\Http\Controllers\Auth\PasswordResetLinkController::class, 'create'])->name('password.request');

// Route::withoutMiddleware([VerifyCsrfToken::class])->group(function () {

//     WebAuthnRoutes::register();
// });

Route::middleware('auth')->group(function () {

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    // Route::post('verify-2fa', [AuthenticatedSessionController::class, 'verify2FA'])->name('verify2FA');

    /*send surprise amount*/
    Route::get('verification', [EmailVerificationPromptController::class, '__invoke'])->name('verification.notice');
    Route::get('email/send-verification-email', [EmailVerificationNotificationController::class, 'sendVerificationEmail'])
        ->name('verification.email');

    // Content creation routes - NO subscription requirements
    Route::middleware(['mustHaveToVerify'])->group(function () {
        // Wish item routes - accessible without subscription
        Route::post('save_wish_item', [WishitemController::class, 'addWishItem'])->name('save_wish_item');
        Route::post('/update_wish_item/{uuid}', [WishitemController::class, 'updateWishItem'])->name('update_wish_item');
        Route::get('/delete-wish-item/{uuid}', [WishitemController::class, 'deleteWishItem'])->name('delete_wish_item');

        // Bills - accessible without subscription
        Route::prefix("bill")->name("bill.")->group(function () {
            Route::post('save', [BillsController::class, 'billSave'])->name('save');
            Route::post('edit/{id}', [BillsController::class, 'billEdit'])->name('edit');
            Route::get('remove/{uuid}', [BillsController::class, 'removeBill'])->name('remove');
            Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [BillsController::class, 'buyBill'])->name('checkout.auth');
            Route::get('handle/{uuid}/{status?}', [BillsController::class, 'handlePayment'])->name('handle.auth');
        });

        // Memberships - accessible without subscription
        Route::prefix("membership")->name("membership.")->group(function () {
            Route::post('save', [MembershipController::class, 'membershipLevelSave'])->name('save');
            Route::post('edit/{uuid}', [MembershipController::class, 'updateLevel'])->name('edit');
            Route::get('remove/{uuid}', [MembershipController::class, 'removeLevel'])->name('remove');

            // Page routes (returns Inertia views)
            Route::get('dashboard', [MembershipController::class, 'membershipDashboardPage'])->name('dashboard');
            Route::get('all-payments/page', [MembershipController::class, 'allPaymentsPage'])->name('all-payments.page');

            // API routes (returns JSON)
            Route::get('api/dashboard', [MembershipController::class, 'membershipDashboardData'])->name('api.dashboard');
            Route::get('api/all-payments', [MembershipController::class, 'getAllMembershipPayments'])->name('api.all-payments');

            Route::get('graph', [MembershipController::class, 'membershipGraph'])->name('graph');
            Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [MembershipController::class, 'buyLevel'])->name('checkout.auth');
            Route::get('handle/{uuid}/{status?}', [MembershipController::class, 'handlePayment'])->name('handle.auth');
        });

        // Piggy Pots
        Route::get('/piggy-pots', [PiggyPotController::class, 'index'])->name('piggy-pots.index');
        Route::post('/piggy-pots', [PiggyPotController::class, 'store'])->name('piggy-pots.store');
        Route::post('/piggy-pots/{id}', [PiggyPotController::class, 'update'])->name('piggy-pots.update');
        Route::delete('/piggy-pots/{id}', [PiggyPotController::class, 'destroy'])->name('piggy-pots.destroy');

        // Shop items - accessible without subscription
        Route::prefix('shop')->group(function () {
            Route::post('/add', [ShopsController::class, 'addShopItems'])->name('add-shop');
            Route::post('/update/{uuid}', [ShopsController::class, 'updateShopItems'])->name('update-shop');
            Route::post('/add/save-category', [ShopsController::class, 'saveUserShopCategory'])->name('shop.save-category');
            Route::get('/delete/{uuid}', [ShopsController::class, 'deleteShop'])->name('delete-shop');
            Route::get('/deactivate/{uuid}', [ShopsController::class, 'deactivateShop'])->name('deactivate-shop');
        });

        // Posts - accessible without subscription
        Route::prefix("post")->name("post.")->group(function () {
            Route::post('save', [PostsController::class, 'savePost'])->name('save');
            Route::post('edit/{uuid}', [PostsController::class, 'editPost'])->name('edit');
            Route::get('delete/{uuid}', [PostsController::class, 'deletePost'])->name('delete');
            Route::get('like/{uuid}', [PostsController::class, 'postLike'])->name('like');
            Route::post('comment/{uuid}', [PostsController::class, 'commentOnPost'])->name('comment');
            Route::post('comment-reply/{comment_uid}', [PostsController::class, 'replyOnComment'])->name('comment-reply');
            Route::post('comment-approve/{uuid}', [PostsController::class, 'approveComment'])->name('comment-approve');
            Route::post('reply-approve/{uuid}', [PostsController::class, 'approveReply'])->name('reply-approve');
            Route::post('comment-delete/{uuid}', [PostsController::class, 'deleteComment'])->name('comment-delete');
            Route::post('reply-delete/{uuid}', [PostsController::class, 'deleteReply'])->name('reply-delete');
        });
        // Categories and basic functionality
        Route::post('user/save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');
        Route::post('edit-category/{id}', [WishitemController::class, 'editWishCategory'])->name('edit-category');
        Route::get('delete-category/{id}', [WishitemController::class, 'deleteCategory'])->name('delete-category');
        Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links');
    });

    // Stripe routes - accessible without full identity verification to allow onboarding
    Route::middleware('mustHaveToVerify')->group(function () {
        Route::prefix("stripe")->name("stripe.")->group(function () {
            Route::get("/authorize", [StripeController::class, "index"])->name("index");
            Route::match(["get", "post"], "/connect-init/{country?}/{currency?}", [StripeController::class, "initConnect"])->name("connect");
            // Merchant of Record Consent Routes
            Route::post('/mor-consent', [StripeController::class, 'storeMorConsent'])->name('mor-consent.store');

            Route::get("/response", [StripeController::class, "connectReturn"])->name("return");
            Route::post("/login", [StripeController::class, "loginToStripe"])->name("login");
            Route::get("/enable_card_payments", [StripeController::class, "enableCardPayments"])->name("enable.card.payments");
            Route::get("/upgrade-express-account", [StripeController::class, "upgradeStripeAccount"])->name("upgrade.account");
        });
    });

    Route::middleware(['mustCompletedStripeIdentity'])->group(function () {
        Route::middleware('mustHaveToVerify')->group(function () {
            Route::get('gifter-card-verification', [RegisteredUserController::class, 'gifterCardVerification'])->name('gifter.card.verification');
            Route::get('card-verification-success/{uuid}', [RegisteredUserController::class, 'cardVerificationSuccess'])->name('card.verification.success');
            Route::get('card-verification-failed/{id}', [RegisteredUserController::class, 'cardVerificationFailed'])->name('card.verification.failed');
            Route::get('update-vat/{percent}', [AuthenticatedSessionController::class, 'updateVat'])->name('updateVat');
            Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);
            Route::put('password', [PasswordController::class, 'update'])->name('password.update');

            Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile');
            Route::post('notification-switch', [ProfileController::class, 'notificationSwitch'])->name('notification-switch');
            Route::post('user/save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');
            Route::post('edit-category/{id}', [WishitemController::class, 'editWishCategory'])->name('edit-category');
            Route::get('delete-category/{id}', [WishitemController::class, 'deleteCategory'])->name('delete-category');
            Route::get('setup/multi-step-verification', function () {
                return Inertia::render('account/TwoFactorSetup');
            })->name('account.2fa');

            Route::get('account', function () {
                try {
                    $user = Auth::user();
                    if (!$user) {
                        return redirect()->route('login');
                    }

                    // ... existing logic ...
                    // I need to copy the whole closure or just insert before it.
                    // To avoid copying the massive closure, I will use a different anchor.


                    $auto_tweet = (int)($user->auto_tweet ?? 0) === 1;
                    $pwaNotificationDetails = BulkPwaNotification::where('creator_id', $user->id)->latest()->get();

                    // Find the currently active subscription period
                    $now = Carbon::now();
                    $subscription = MonthlyCharge::where('user_id', $user->id)
                        ->where(function ($query) use ($now) {
                            $query->where(function ($q) use ($now) {
                                // Active subscription period
                                $q->whereDate('current_start_subscription_date', '<=', $now)
                                    ->whereDate('current_end_subscription_date', '>=', $now);
                            })->orWhere(function ($q) use ($now) {
                                // Active trial period
                                $q->whereDate('current_start_trial_date', '<=', $now)
                                    ->whereDate('current_end_trial_date', '>=', $now);
                            });
                        })
                        // Order by start date DESC to get the newest period first (handles overlapping periods on transition dates)
                        ->latest()
                        ->first();

                    // If no active period found, get the most recent one
                    if (!$subscription) {
                        $subscription = MonthlyCharge::where('user_id', $user->id)
                            ->latest()
                            ->first();
                    }

                    // Get complete subscription history for the user
                    $historyCollection = MonthlyCharge::where('user_id', $user->id)
                        ->latest()
                        ->get();
                    $subscription_history = $historyCollection->map(function ($charge) {
                        $fmt = function ($date) {
                            try {
                                return $date ? \Carbon\Carbon::parse($date)->format('d F Y') : null;
                            } catch (\Throwable $e) {
                                return null;
                            }
                        };
                        return [
                            'id' => $charge->id,
                            'uuid' => $charge->uuid,
                            'stripe_id' => $charge->stripe_id,
                            'amount' => (float)($charge->amount ?? 0),
                            'currency' => $charge->currency ?? 'GBP',
                            'status' => $charge->status ?? 'pending',
                            'current_start_trial_date' => $fmt($charge->current_start_trial_date),
                            'current_end_trial_date' => $fmt($charge->current_end_trial_date),
                            'current_start_subscription_date' => $fmt($charge->current_start_subscription_date),
                            'current_end_subscription_date' => $fmt($charge->current_end_subscription_date),
                            'upcoming_payment' => $fmt($charge->upcoming_payment),
                            'created_at' => $fmt($charge->created_at),
                            'updated_at' => $fmt($charge->updated_at),
                        ];
                    });

                    $site_subscription = [
                        'status' => 'INACTIVE',
                        'trial_status' => null,
                        'trial_start' => null,
                        'trial_end_in' => null,
                        'subscription_start' => null,
                        'subscription_end' => null,
                        'subscription_renew_in' => null,
                        'next_payment_date' => null,
                        'expired_at' => null,
                    ];

                    if ($subscription) {
                        $trial_start = $subscription->current_start_trial_date;
                        $trial_end = $subscription->current_end_trial_date;
                        $subscription_start = $subscription->current_start_subscription_date;
                        $subscription_end = $subscription->current_end_subscription_date;

                        $now = Carbon::now();
                        $trialStartCarbon = $trial_start ? Carbon::parse($trial_start) : null;
                        $trialEndCarbon = $trial_end ? Carbon::parse($trial_end) : null;
                        $subStartCarbon = $subscription_start ? Carbon::parse($subscription_start) : null;
                        $subEndCarbon = $subscription_end ? Carbon::parse($subscription_end) : null;

                        $isTrialOngoing = $trialEndCarbon && $now->lessThan($trialEndCarbon);
                        $isTrialEnded = $trialEndCarbon && $now->greaterThanOrEqualTo($trialEndCarbon);
                        $isSubscriptionActive = in_array($subscription->status, ['paid', 'active', 'renew']) && $subEndCarbon && $now->lessThan($subEndCarbon);
                        $isExpired = $subEndCarbon && $now->greaterThanOrEqualTo($subEndCarbon);

                        // Format output
                        $site_subscription['trial_start'] = $trialStartCarbon ? $trialStartCarbon->format('d F Y') : null;
                        $site_subscription['trial_end_in'] = $trialEndCarbon ? $trialEndCarbon->diffForHumans($now) : null;
                        $site_subscription['trial_status'] = $isTrialOngoing ? 'active' : 'ended';

                        $site_subscription['subscription_start'] = $subStartCarbon ? $subStartCarbon->format('d F Y') : null;
                        $site_subscription['subscription_end'] = $subEndCarbon ? $subEndCarbon->format('d F Y') : null;
                        $site_subscription['subscription_renew_in'] = $subEndCarbon ? $subEndCarbon->format('d F Y') : null;
                        $site_subscription['expired_at'] = $isExpired ? $subEndCarbon->diffForHumans($now) : null;

                        $site_subscription['next_payment_date'] = $subEndCarbon ? $subEndCarbon->format('d F Y') : null;
                        $site_subscription['subscription_status_code'] = $user->subscription_status;
                        $site_subscription['status'] = $user->display_subscription_status;
                        $site_subscription['is_cancelled'] = $subscription->status === 'canceled' || !empty($subscription->cancelled_at);
                    } else {
                        $site_subscription['status'] = 'Not Subscribed';
                        $site_subscription['subscription_status_code'] = 3;
                    }

                    return Inertia::render('accountsetting/Accountsetting', [
                        'auto_tweet' => $auto_tweet,
                        'site_subscription' => $site_subscription,
                        'subscription_history' => $subscription_history,
                        'pwa_notification_details' => $pwaNotificationDetails ?? null,
                        'subscription_status' => $user->subscription_status, // Add numeric status for debugging
                        'webAuthnCredentials' => Auth::user()->webAuthnCredentials()->exists(), // Add WebAuthn credentials existence for debugging
                    ]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Account page error', ['user_id' => Auth::id(), 'error' => $e->getMessage()]);
                    return Inertia::render('ErrorPage', [
                        'status' => 500,
                        'message' => 'Something went wrong',
                        'consoleMessage' => $e->getMessage(),
                    ]);
                }
            })->name('account');

            Route::get('/refer-and-earn', [ReferAndEarnController::class, 'index'])->name('refer-and-earn');
            Route::post('/refer-and-earn/create-link', [ReferAndEarnController::class, 'createReferralLink'])->name('create-referral-link');
            Route::post('/refer-and-earn/redeem', [ReferAndEarnController::class, 'requestRedeem'])->name('referral.redeem');

            Route::get('/scanning/check-adult-content/{uuid}', [ProfileController::class, 'checkAdultContent'])->name('check-adult-content');

            Route::get('auto-tweet-setting', [WishitemController::class, 'enableAutoTweet'])->name('auto-tweet-setting');

            Route::get('unlink-twitter', [AuthenticatedSessionController::class, 'unlinkTwitter'])->name('unlink-twitter');

            Route::get('user-tips', [WishitemController::class, 'userTips'])->name('user-tips');

            Route::get('bill-tracker', [WishitemController::class, 'billTracker'])->name('bill-tracker');

            Route::get('membership-tracker', [WishitemController::class, 'membershipTracker'])->name('membership.tracker');

            Route::get('shop-tracker', [WishitemController::class, 'shopTracker'])->name('shop.tracker');

            Route::get('subscriptions', [WishitemController::class, 'creatorSubscriptions'])->name('subscriptions');

            Route::get('subscribed', [WishitemController::class, 'userSubscribed'])->name('subscribed');

            Route::get('cancel-subscription/{subscription_id}', [WishitemController::class, 'cancelSubscription'])->name('cancel-subscription');

            Route::get('/read-status/{payment_id}/{type}', [WishitemController::class, 'readStatus'])->name('read-status');

            Route::get('/stripe', function (Request $request) {
                $auth = Auth::user();
                $bills = Bills::where('user_id', $auth->id)->where('approved', 1)->count();
                $membership = Membership::where('user_id', $auth->id)->where('approved', 1)->count();
                // Check if MoR consent exists in the database
                $morConsentDetails = null;
                $morConsentGiven = MorConsent::userHasGivenConsent($auth->id);
                if ($morConsentGiven) {
                    $latestConsent = MorConsent::getLatestConsent($auth->id);
                    if ($latestConsent) {
                        $morConsentDetails = [
                            'given_at' => $latestConsent->consent_given_at->format('M d, Y h:i A'),
                            'ip_address' => $latestConsent->ip_address,
                            'device' => $latestConsent->device_type,
                            'location' => $latestConsent->city ? $latestConsent->city . ', ' . $latestConsent->country : 'Unknown'
                        ];
                    }
                }
                return Inertia::render('stripe/Stripe', [
                    'bills_count' => $bills,
                    'membership_count' => $membership,
                    'mor_consent_given' => $morConsentGiven,
                    'mor_consent_details' => $morConsentDetails,
                ]);
            })->middleware(['auth', 'verified'])->name('stripe');

            Route::get('/pin-item/{wish_id}/', [WishitemController::class, 'pinItem'])->name('pin-item');

            // Twitter
            Route::prefix("twitter")->name("x.")->group(function () {
                Route::get('init', [TwitterController::class, 'authInit'])->name('init');
                Route::get('authorize', [TwitterController::class, 'handleAuth'])->name('handle');
                Route::get('share/{uuid}/{type}', [WishitemController::class, 'shareOnTwitter'])->name('share');
                // Route::get('authorize', [TwitterController::class, 'handleOauth1'])->name('handle');
            });

            Route::post('add-goal', [WishitemController::class, 'addTipGoal'])->name('add-goal');

            Route::get('mark-complete-goal/{uuid}', [WishitemController::class, 'markJarComplete'])->name('mark-goal');

            Route::get('all-goals', [WishitemController::class, 'allGoalsCreators'])->name('all-goals');

            // Intro video
            Route::post('/update/intro/video', [ProfileController::class, 'saveIntroVideo'])->name('save');

            Route::prefix("intro")->name("intro.")->group(function () {
                Route::post('save', [ProfileController::class, 'saveIntroVideo'])->name('save');
                Route::get('list', [ProfileController::class, 'getIntroVideo'])->name('list');
                Route::get('remove', [ProfileController::class, 'removeIntro'])->name('remove');
                // Route::get('/{uuid}', [ProfileController::class, 'getIntroById'])->name('get-intro-id');
            });

            Route::prefix("deliveries")->name("deliveries.")->group(function () {
                Route::get('dashboard', [DeliveriesController::class, 'index'])->name('dashboard');
                Route::get('stats', [DeliveriesController::class, 'getDeliveryStats'])->name('stats');
            });

            Route::match(['get', 'delete'], 'delete-stripe-account/{accountid}', [StripeController::class, 'deleteStripeAccount'])->name('deleteStripeAccount');

            Route::match(['get', 'post'], 'wish-subscribe/checkout/{uuid}/{reccure?}', [StripeController::class, 'wishItemSubscribe'])->name('wish.subscribe.checkout.auth');

            Route::get('mandatory-checkout/', [StripeController::class, 'payMonthlyCharge'])->name("mandatory.checkout");

            Route::get('/handle/{uuid}/{status}', [StripeController::class, 'handleMandatorySubscription'])->name('mandatory.handle');

            Route::get('/activate-subscription', function () {
                return Inertia::render('Profile/ActivateSubscription');
            })->name('activate-subscription');

            Route::post('/dalle-image', [ProfileController::class, 'getImageGenerateAI'])->name('dalle.image');

            Route::post('/upload-dalle-image', [ProfileController::class, 'uploadDalleImage'])->name('upload.dalle.image');
        });

        // stripe identity verification routes
        Route::get('/stripe/identity-verification', function () {
            $appUrl = config('app.url'); // e.g. https://dev.spennypiggy.co
            // if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
            //     $user = Auth::user();
            //     $user->identity_admin_status = 0;
            //     $user->identity_status = 1;
            //     $user->save();
            // }
            return Inertia::render('Auth/StripeIdentity', [
                'status' => false,
                'message' => 'Please complete your Stripe identity verification.',
            ]);
        })->name('stripe.identity.verification');

        Route::post('/say-thankyou/{payment_id}', [WishitemController::class, 'sayThanks'])->name('say-thankyou');

        Route::post('/update/move-wish', [WishitemController::class, 'moveWishes'])->name('move-wish');

        Route::get('/earnings', function () {
            return Inertia::render('earnings/Earnings');
        })->name('earnings-page');

        Route::post('piggy-bank-setting/', [ProfileController::class, 'piggyBankSetting'])->name("piggy-bank-setting");

        Route::get('get-notification/', [ProfileController::class, 'getNotifications'])->name("get-notification");
        Route::get('mark-as-read/', [ProfileController::class, 'markRead'])->name("mark-as-read");
        Route::get('delete-all-notifications/', [ProfileController::class, 'deleteAllNotifications'])->name("delete-all-notifications");

        // Creator Financial Tools
        Route::prefix('financial')->name('financial.')->group(function () {
            Route::get('/dashboard/{tab?}', [\App\Http\Controllers\CreatorFinancialController::class, 'index'])->name('dashboard');
            Route::post('/refresh', [\App\Http\Controllers\CreatorFinancialController::class, 'refresh'])->name('refresh');
            Route::get('/history', [\App\Http\Controllers\CreatorFinancialController::class, 'history'])->name('history');
            Route::post('/profile', [\App\Http\Controllers\CreatorFinancialController::class, 'updateProfile'])->name('profile.update');
            Route::get('/export/csv', [\App\Http\Controllers\CreatorFinancialController::class, 'exportCsv'])->name('export.csv');
            Route::get('/statement', [\App\Http\Controllers\CreatorFinancialController::class, 'generateIncomeStatement'])->name('statement');
            Route::get('/certificate', [\App\Http\Controllers\CreatorFinancialController::class, 'certificate'])->name('certificate');

            // Expenses
            Route::get('/expenses', [\App\Http\Controllers\CreatorExpenseController::class, 'index'])->name('expenses.index');
            Route::post('/expenses', [\App\Http\Controllers\CreatorExpenseController::class, 'store'])->name('expenses.store');
            Route::put('/expenses/{expense}', [\App\Http\Controllers\CreatorExpenseController::class, 'update'])->name('expenses.update');
            Route::delete('/expenses/{expense}', [\App\Http\Controllers\CreatorExpenseController::class, 'destroy'])->name('expenses.destroy');
        });

        Route::prefix('earnings')->group(function () {
            Route::get('all-data/{type?}', [LeaderBoardController::class, 'earnings'])->name('earnings');
            Route::get('graph-data/', [LeaderBoardController::class, 'graphData'])->name('graph-data');
            Route::get('top-wishes/{type?}', [LeaderBoardController::class, 'topWishes'])->name('top-wishes');
            Route::get('top-subscription/{type?}', [LeaderBoardController::class, 'topSubscription'])->name('top-subscription');
            Route::get('top-paid-task/{type?}', [LeaderBoardController::class, 'topPaidTask'])->name('top.paid.task');
            Route::get('top-bill/{type?}', [LeaderBoardController::class, 'topBill'])->name('top-bill');
            Route::get('top-shop/{type?}', [LeaderBoardController::class, 'topShop'])->name('top-shop');
            Route::get('top-piggy-bank/{type?}', [LeaderBoardController::class, 'topPiggyBank'])->name('top-piggy-bank');
        });

        Route::get('/shop', function () {
            return Inertia::render('shop/ShopPage');
        })->name('shop');

        // Keep orders-list in subscription middleware (requires payment features)
        Route::get('shop/orders-list', [ShopsController::class, 'ordersList'])->name('orders-list');

        Route::get('create-applicant', [TestController::class, 'createApplicant']);
        Route::get('generate-verification-link', [TestController::class, 'generateVerificationLink']);

        Route::get('generate-backup-code', [AuthenticatedSessionController::class, 'generateBackupCode']);
        Route::get('show-2fa-qr', [ProfileController::class, 'show2faQR']);
        Route::post('switch-2fa', [ProfileController::class, 'update2faStatus']);
        Route::post('verification-2fa', [ProfileController::class, 'verification2FA']);

        Route::post('/report-content', [ProfileController::class, 'reportContent'])->name('report-content');


        Route::get('gifter-wish-items/{username}', [ProfileController::class, 'gifterWishitems'])->name('gifter-items');
        Route::get('gifter-subs/{username}', [ProfileController::class, 'gifterSubs'])->name('gifter-subscriptions');
        Route::get('gifter-tips/{username}', [ProfileController::class, 'gifterTips'])->name('gifter-tips');
        Route::get('gifter-access-posts/{username}', [ProfileController::class, 'gifterAccessPosts'])->name('gifter-access-posts');
        Route::get('gifter-memberships/{username}', [ProfileController::class, 'gifterMemberships'])->name('gifter-memberships');
        Route::get('gifter-medias/{username}', [ProfileController::class, 'gifterMedia'])->name('gifter-media');
        Route::get('gifter-content/{username}', [ProfileController::class, 'gifterContentFiles'])->name('gifter-content');
        Route::get('gifter-bills/{username}', [ProfileController::class, 'gifterBills'])->name('gifter-bills');
        Route::get('gifter-thanks-message/{username}', [ProfileController::class, 'gifterThanksMessages'])->name('gifter-thanks-message');
        Route::get('gifter-subscriptions/{username}', [ProfileController::class, 'gifterSubscription'])->name('gifter-subscription');

        Route::post('support/tickets', [\App\Http\Controllers\SupportTicketController::class, 'store'])->name('support.tickets.store');
        Route::get('support/tickets/{uuid}', [\App\Http\Controllers\SupportTicketController::class, 'show'])->name('support.tickets.show');
        Route::post('support/tickets/{uuid}/message', [\App\Http\Controllers\SupportTicketController::class, 'message'])->name('support.tickets.message');
        Route::post('support/tickets/{uuid}/resolve', [\App\Http\Controllers\SupportTicketController::class, 'resolve'])->name('support.tickets.resolve');
        Route::post('support/tickets/{uuid}/creator/approve-refund', [\App\Http\Controllers\SupportTicketController::class, 'creatorApproveRefund'])->name('support.tickets.creator.approve-refund');
        Route::post('support/tickets/{uuid}/creator/reject-refund', [\App\Http\Controllers\SupportTicketController::class, 'creatorRejectRefund'])->name('support.tickets.creator.reject-refund');

        Route::get('support/{creator}/{gifter}', function ($creator, $gifter) {
            return Inertia::render('gifter/SupportStory', [
                'creator' => $creator,
                'gifter' => $gifter
            ]);
        })->middleware('check.block')->name('support.story.page');
        Route::get('support-story/{creator}/{gifter}', [ProfileController::class, 'supportStory'])->middleware('check.block')->name('support.story');
        Route::post('support-story/{creator}/{gifter}/react', [ProfileController::class, 'supportStoryReact'])->middleware('check.block')->name('support.story.react');
        Route::post('support-story/{creator}/{gifter}/reply', [ProfileController::class, 'supportStoryReply'])->middleware('check.block')->name('support.story.reply');
        Route::get('history', [ProfileController::class, 'supportHistory'])->name('support.history.page');
        Route::get('history-feed', [ProfileController::class, 'transactionsFeed'])->name('transactions.feed');


        // Intro video
        Route::get('/redirecting', function () {
            return Inertia::render('Redirecting');
        })->name("redirecting");

        Route::get('cancel-subs/{uuid}', [StripeController::class, 'cancelSubs'])->name('cancel-subs');

        Route::prefix('financial')->name('financial.')->group(function () {
            Route::get('/evidence-pack/{uuid}', [\App\Http\Controllers\EvidencePackController::class, 'generate'])->name('evidence-pack');
        });

        // rye product routes start
        Route::post('creator-store-address', [WishitemController::class, 'creatorStoreAddress'])->name('creator.store.address');
        Route::get('get-creator-address', [WishitemController::class, 'getCreatorStoreAddress'])->name('get.creator.address');
        Route::post('create-creator-product', [WishitemController::class, 'createRyeProduct'])->name('create.creator.product');
        Route::get('delete-creator-products/{uuid}', [WishitemController::class, 'deleteAndRestoredRyeProduct'])->name('delete.creator.products');
        Route::post('create-cart', [WishitemController::class, 'createCart'])->name('create.cart');
        Route::get('check-cart-exist/{creator_id}', [WishitemController::class, 'checkCartExist'])->name('check.cart.exist');
        Route::post('handle-rye-product-payment', [WishitemController::class, 'handleRyeProductPayment'])->name('handle.rye.product.payment')->middleware('mustCompletedCardVerification');
        Route::get('remove-cart/{cart_id}', [WishitemController::class, 'removeCart'])->name('remove.cart');
        Route::get('rye-success-payment/{uuid}', [WishitemController::class, 'ryeSuccessPayment'])->name('rye.success.payment');
        Route::get('rye-cancel-payment/{uuid}', [WishitemController::class, 'ryeCancelPayment'])->name('rye.cancel.payment');
        Route::post('store-product-order-details', [WishitemController::class, 'storeProductOrderDetails'])->name('store.product.order.details');
        // rye product routes end

        Route::get('/get_category_data/{category}/{user_id}', [WishitemController::class, 'categoryItems'])->name('get_category_data');

        Route::get('users', [MyController::class, 'getUsers'])->name('users');

        Route::post('/send-surprize', [WishitemController::class, 'sendSurprise'])->name('send-surprize');

        Route::get('/update-profile-lock-status', [ProfileController::class, 'updateProfileLockStatus'])->name('update.profile.lock.status');

        Route::post('/user-follow-unfollow', [PwaNotification::class, 'userFollowUnFollow'])->name('user.follow.unfollow');
        Route::post('send-pwa-to-follower', [PwaNotification::class, 'sendPwaToFollower'])->name('send.pwa.to.follower');
    });
});
Route::get('send-automatically-follow-request-to-all', [PwaNotification::class, 'sendAutomaticallyFollowRequestToAll'])->name('send.automatically.follow.request.to.all');

Route::prefix('shop')->group(function () {
    Route::get('/list/{username}', [ShopsController::class, 'shopList'])->name('shop-list');
    Route::get('/item/{slug}/{uuid}/{session_id?}', [ShopsController::class, 'singleShopList'])->name('single-shop-list');
    Route::match(['get', 'post'], '/buy/{uuid}', [ShopsController::class, 'buyShopItem'])->name('buy-shop-item');
    Route::post('/answer-to-payment/{payment_id}', [ShopsController::class, 'answerPayment'])->name('answerPayment');
    Route::get('/success-payment/{uuid}', [ShopsController::class, 'successPayment'])->name('shop.success-payment');
    Route::get('/cancel-payment/{uuid}', [ShopsController::class, 'cancelPayment'])->name('shop.cancel-payment');
    Route::get('/shipping-price/{shop_id}', [ShopsController::class, 'shippingPrice'])->name('shop.shipping-price');

    // Shipping Profiles (Authenticated)
    Route::middleware('auth')->group(function () {
        Route::get('/shipping-profiles', [ShopsController::class, 'getShippingProfiles'])->name('shop.shipping-profiles');
        Route::post('/shipping-profile/save', [ShopsController::class, 'saveShippingProfile'])->name('shop.shipping-profile.save');
        Route::delete('/shipping-profile/{id}', [ShopsController::class, 'deleteShippingProfile'])->name('shop.shipping-profile.delete');
        Route::post('/fulfillment/{uuid}', [ShopsController::class, 'updateFulfillment'])->name('shop.fulfillment.update');
    });
});

Route::get('/create-checkout-session/{creator_id}/{user_id_or_device?}', [CheckoutController::class, 'createCheckout'])->name('create.checkout')->middleware('mustCompletedCardVerification');

Route::get('/success-checkout/{id}', [CheckoutController::class, 'successCheckout'])->name('checkout.success');

Route::get('/cancel-checkout/{id}', [CheckoutController::class, 'cancelCheckout'])->name('checkout.cancel');

Route::get('get-cart-details', [WishitemController::class, 'getCartDetails'])->name('get.cart.details');

Route::get('/add-to-cart/{uuid}/{device_id}/{sub}/{amount?}', [WishitemController::class, 'addToCart'])->name('add-to-cart');

Route::get('anonymous-cart/{deviceId}', [WishitemController::class, 'anonymousCartItems'])->name('anonymous-cart');

Route::get('authenticated-cart', [WishitemController::class, 'authenticatedCartItems'])->name('authenticated-cart');

Route::get('/clear-cart/{device_id}/{ownerid}', [WishitemController::class, 'clearCart'])->name('clear-cart');

Route::get('cart-update-quantity/{uuid}/{quantity}', [WishitemController::class, 'updateCartQuantity'])->name('cart.updatequantity');

Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart');

Route::prefix("tip-jar")->name("tip-jar.")->group(function () {
    Route::post('pay/{creator_uid}/', [StripeController::class, 'tipToJar'])->name("pay");
    Route::get('/handle/{uuid}/{status?}', [StripeController::class, 'handleTipJarPayment'])->name('handle');
});

Route::prefix("piggy-pot")->name("piggy-pot.")->group(function () {
    Route::post('pay/{piggy_pot_uuid}/', [PiggyPotPaymentController::class, 'contributeToPiggyPot'])->name("pay");
    Route::get('/handle/{uuid}/{status?}', [PiggyPotPaymentController::class, 'handlePiggyPotPayment'])->name('handle');
});

Route::get('/user/tip/goal/{username?}', [AuthenticatedSessionController::class, 'usergoal'])->name('user.goal');

Route::get('counter/{deviceid}', [WishitemController::class, 'wish_counter'])->name('counter');
// Route::get('user/tip-jar/list/{uuid}', [WishitemController::class, 'listGoal'])->name('list');
Route::get('user/{uuid}', [VerifyEmailController::class, 'emailVerify']);

Route::get('/how-it-works', function () {
    return Inertia::render('howitworks/Works');
})->name("how-it-works");

Route::controller(\App\Http\Controllers\StaticPageController::class)->group(function () {
    Route::get('/terms-and-conditions', 'terms')->name("terms-and-conditions");
    Route::get('/creator-agreement', 'creatorAgreement')->name("creator-agreement");
    Route::get('/supporter-terms', 'supporterTerms')->name("supporter-terms");
    Route::get('/creator-supporter-contract', 'creatorSupporterContract')->name("creator-supporter-contract");
    Route::get('/mor-agreement', 'morAgreement')->name("mor-agreement");
    Route::get('/reserves-and-payments-policy', 'paymentsPolicy')->name("reserves-and-payments-policy");
    Route::get('/paid-tasks-terms', 'paidTasksTerms')->name("paid-tasks-terms");
    Route::get('/return-policy', 'returnPolicy')->name("return-policy");
    Route::get('/us-addendum', 'usAddendum')->name("us-addendum");
    Route::get('/copyright-policy', 'copyrightPolicy')->name("copyright-policy");
    Route::post('/accept-terms', 'acceptTerms')->name("accept-terms")->middleware('auth');
});

Route::get('/promotion-terms', function () {
    return Inertia::render('Promotions');
})->name("promotion-terms");

Route::get('/files/{filename}', function (string $filename) {
    $fullPath = asset($filename);
    return Storage::response($fullPath);
});

Route::get('recent-gifters/{type?}', [LeaderBoardController::class, 'recentGifters'])->name('largest-gifts');
Route::get('leaderboard/star/lists', [LeaderBoardController::class, 'topGiftersAllTime'])->name('leaderboard.stars');
Route::get('largest/gifts/alltime', [LeaderBoardController::class, 'top10UniqueBiggestGifters'])->name('largest.gifts.alltime');
Route::get('top-supporters/frequency', [LeaderBoardController::class, 'topSupportersByFrequency'])->name('top-supporters-frequency');
Route::get('leaderboard/platform-analytics', [LeaderBoardController::class, 'platformAnalytics'])->name('leaderboard.platform-analytics');
Route::get('leaderboard/growth-trends', [LeaderBoardController::class, 'growthTrends'])->name('leaderboard.growth-trends');
Route::get('leaderboard/category-leaders', [LeaderBoardController::class, 'categoryLeaders'])->name('leaderboard.category-leaders');
Route::get('leaderboard/vip-supporters', [LeaderBoardController::class, 'vipSupporters'])->name('leaderboard.vip-supporters');

/* wishtender */
Route::get('leaderboard/{type?}', [LeaderBoardController::class, 'wishtenderWishers'])->name('leaderboard');
Route::get('first-three-leaderboard/{type?}', [LeaderBoardController::class, 'firstThreeWisher'])->name('first-three-wishes');
/*check username exist*/
// Route::get('/data-check', function () {
//     $ret = StripeControl::getSubscription("sub_1OND8tG7xsNScLmXLFzAhobA");
//     return $ret;
// });

if (app()->environment('local')) {
    Route::get('/test/test', function () {
        return Inertia::render('Test');
    })->name("test");
}

Route::get('/test-intercom-diagnostic', function () {
    return view('intercom-test');
})->name("intercom.diagnostic");

Route::get('/problem-solving', function () {
    $nums = [3, 4, 2, 5];
    $a = [];
    foreach ($nums as $key => $value) {
        $multiple = 1;
        foreach ($nums as $k => $v) {
            if ($k != $key) {
                $multiple *= $v;
            }
        }
        array_push($a, $multiple);
    }
    return $a;
})->name("problem-solving");

Route::get('twitter-token/', [TwitterController::class, 'twitterAuthUrl']);
Route::get('twitter/login', [TwitterController::class, 'twitterLogin']);
Route::get('check-username/{username}', [AuthenticatedSessionController::class, 'checkUserName'])->name('username.check');
Route::get('sociallinks/{username}', [AuthenticatedSessionController::class, 'sociallinks'])->name('user.sociallinks');

// Route::get('memberships/{username}', [AuthenticatedSessionController::class, 'user_memberships'])->name('user.memberships');

// Route::get('bills/{username}', [AuthenticatedSessionController::class, 'user_bills'])->name('user.bills');

Route::get('gift-items/{username}', [AuthenticatedSessionController::class, 'userGiftItems'])->name('gift.items');
Route::get('comments/{uuid}', [PostsController::class, 'allComments'])->name('user.posts.comments');

// Founder routes - must come before profile route to prevent interception
Route::get('/founder/bonus', [FounderBonusController::class, 'index'])->name('founder.bonus');
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/founder/data', [FounderBonusController::class, 'getData'])->name('founder.data');
    Route::get('/founder/leaderboard', [FounderBonusController::class, 'getLeaderboard'])->name('founder.leaderboard');
    Route::get('/founder-program', [FounderBonusController::class, 'programInfo'])->name('founder.program');
    Route::get('/founder/qualify-winners', [FounderBonusController::class, 'qualifyWinners'])->name('founder.qualify-winners');
    Route::get('/founder/settle-payouts', [FounderBonusController::class, 'settlePayouts'])->name('founder.settle-payouts');
});

// Paid Tasks Routes (Phase 1) - Prefixed to avoid username collisions
Route::middleware(['auth', 'verified'])->prefix('task')->name('task.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\TaskController::class, 'index'])->name('dashboard');
    Route::get('/create', [\App\Http\Controllers\TaskController::class, 'create'])->name('create');
    Route::post('/', [\App\Http\Controllers\TaskController::class, 'store'])->name('store');
    Route::post('/{uuid}/purchase', [\App\Http\Controllers\TaskController::class, 'purchase'])->name('purchase');
    Route::get('/{uuid}/success', [\App\Http\Controllers\TaskController::class, 'success'])->name('success');
    Route::get('/{uuid}/download', [\App\Http\Controllers\TaskController::class, 'download'])->name('download');
    Route::get('/order/{uuid}', [\App\Http\Controllers\TaskController::class, 'order'])->name('order');
    Route::post('/purchase/{uuid}/upload', [\App\Http\Controllers\TaskController::class, 'uploadProof'])->name('upload-proof');
    Route::post('/purchase/{uuid}/review', [\App\Http\Controllers\TaskController::class, 'reviewProof'])->name('review-proof');
    Route::get('/{uuid}/edit', [\App\Http\Controllers\TaskController::class, 'edit'])->name('edit');
    Route::post('/{uuid}/update', [\App\Http\Controllers\TaskController::class, 'update'])->name('update');
});

Route::get('/task/{uuid}/purchase', function ($uuid) {
    return redirect()->route('task.show', $uuid);
})->name('task.purchase.redirect');

Route::get('/task/{uuid}', [\App\Http\Controllers\TaskController::class, 'show'])->name('task.show');

// Route::get('/user_info/{username}/{category?}', [AuthenticatedSessionController::class, 'user_info'])->name('user.info');
// Place specific data routes BEFORE the catch-all username route to avoid interception
Route::get('/items/{username}/{category_id?}', [AuthenticatedSessionController::class, 'userItems'])->name('user.items');
Route::get('/user/category/{username}', [AuthenticatedSessionController::class, 'user_category'])->name('user.category');
Route::get('/shop/user_shop_category/{username}', [AuthenticatedSessionController::class, 'user_shop_category'])->name('user.shop.category');

Route::get('/{username}/wish/{id}', function ($username, $id) {
    $wish = WishItem::find($id);
    $uuid = $wish?->uuid ?? $id;
    request()->merge(['item' => $uuid]);
    return app(AuthenticatedSessionController::class)->getUserProfile($username, 'wishes');
})->middleware('check.block')->name('wish.show');

Route::get('/{username}/{page?}', [AuthenticatedSessionController::class, 'getUserProfile'])
    ->middleware('check.block')
    ->name('user.show');

Route::prefix("wish")->name("wish.")->group(function () {
    Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [StripeController::class, 'wishItemSubscribe'])->name("subscribe.checkout")->middleware('mustCompletedCardVerification');
    Route::get('/handle/{uuid}/{status}', [StripeController::class, 'handleSubscription'])->name('subscribe.handle');
});

Route::get('payment/thankyou/{username}', function (Illuminate\Http\Request $request, $username) {
    $owner = User::where('username', $username)->first();
    return Inertia::render('Profile/Thankyou', [
        'owner' => $owner,
        'type' => $request->query('type'),
        'item_name' => $request->query('item_name'),
        'amount' => $request->query('amount'),
        'currency' => $request->query('currency'),
        'benefits' => $request->query('benefits'),
        'item_id' => $request->query('item_id'),
        'item_slug' => $request->query('item_slug'),
        'is_instant' => $request->query('is_instant'),
        'wish_content' => $request->query('wish_content'),
        'success_page_type' => $request->query('success_page_type'),
        'ask_question' => $request->query('ask_question'),
        'payment_id' => $request->query('payment_id'),
    ]);
})->name("thank-you");

Route::prefix("membership")->name("membership.")->group(function () {
    Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [MembershipController::class, 'buyLevel'])->name("checkout")->middleware('mustCompletedCardVerification');
    Route::get('/handle/{uuid}/{status}', [MembershipController::class, 'handlePayment'])->name('handle');
});

Route::prefix("bill")->name("bill.")->group(function () {
    Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [BillsController::class, 'buyBill'])->name("checkout")->middleware('mustCompletedCardVerification');
    Route::get('/handle/{uuid}/{status}', [BillsController::class, 'handlePayment'])->name('handle');
});


Route::get('image/dalle', [TestController::class, 'testAiImage'])->name("image-dalle");

Route::get('/remove-from-cart/{uuid}/{device_id?}', [WishitemController::class, 'removeSurpriseFromCart'])->name('remove-from-cart');


// ADD IN ADMIN PANEL
Route::get('/stripe/manual/payout', [TestController::class, 'manualPayout'])->name('stripe-payout');
Route::get('/delete-connected-account/{accountId}', [StripeController::class, 'deleteConnectedAccount']);

// Stripe Service Agreement Migration Routes
Route::post('/stripe/migrate-account/{userId?}', [StripeController::class, 'migrateAccount'])->name('stripe.migrate-account');
Route::get('/stripe/check-migration/{userId?}', [StripeController::class, 'checkMigrationNeeds'])->name('stripe.check-migration');

Route::get('/force-error/error/file', function () {
    throw new \Exception("Testing Handler.php");
});


// Route::get('/test/subscription/email', function () {
//     $array = [
//         'email' => 'naveen@internetbusinesssolutionsindia.com',
//         'name' => 'Naveen',
//         'uuid' => '69586e30-6d8c-4216-958b-d5ec50f56e18',
//         'invoice_pdf' => 'https://example.com/invoice.pdf',
//         'notification' => 1,
//         'trial_end' => '2025-07-17 04:36:30',
//         'amount' => 4.0,
//         'currency' => 'GBP',
//     ];

//     SendRenewMail::dispatch($array, 'trial', 'site');
//     SendRenewMail::dispatch($array, 'start', 'site');
//     SendRenewMail::dispatch($array, 'renew', 'site');
//     SendRenewMail::dispatch($array, 'failed', 'site');
//     SendRenewMail::dispatch($array, 'cancelled', 'site');

//     return 'Subscription email dispatched!';
// });
