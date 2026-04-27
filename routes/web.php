<?php

use App\Services\DiscoveryService;
use App\Http\Controllers\FeatureSuggestionController;
use App\Http\Controllers\Auth\CheckoutController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\FounderBonusController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\PendingApprovalController;
use App\StripeControl;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Str;


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
*/

// Health check endpoint for Vapor
use App\Http\Controllers\Admin\EmulationLoginController;

// Emulation Bridge
Route::get('/admin/emulate-login/{user}', [EmulationLoginController::class, 'login'])
    ->name('admin.emulate.login');

Route::post('/admin/emulate-stop', [EmulationLoginController::class, 'stop'])
    ->name('admin.emulate.stop');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'app' => config('app.name'),
        'environment' => config('app.env')
    ], 200);
})->name('health.check');

// Cache Check Route
Route::get('/debug/cache-check', function () {
    $key = 'debug_cache_test_' . time();
    $value = 'working';
    
    // Put in cache for 1 minute
    \Illuminate\Support\Facades\Cache::put($key, $value, 60);
    
    // Retrieve
    $retrieved = \Illuminate\Support\Facades\Cache::get($key);
    
    return response()->json([
        'status' => $retrieved === $value ? 'ok' : 'failed',
        'driver' => config('cache.default'),
        'timestamp' => now()->toDateTimeString(),
        'test_key' => $key,
        'retrieved_value' => $retrieved
    ]);
});

// CSRF Cookie route for SPA authentication
Route::get('/csrf-cookie', function () {
    return response()->noContent(204);
})->middleware('web');


// Debug route to test subscription status
if (app()->environment('local')) {
    Route::get('/debug-subscription/{userId}', function ($userId) {
        $user = App\Models\User::find($userId);
        if (!$user) {
            return response()->json(['error' => 'User not found']);
        }
        
        $subscription = $user->creatorMonthlySubscription;
        
        return response()->json([
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'is_subscribed' => $user->is_subscribed,
            'created_at' => $user->created_at,
            'subscription_status_accessor' => $user->subscription_status,
            'has_monthly_charge_record' => $subscription ? true : false,
            'monthly_charge_data' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'stripe_id' => $subscription->stripe_id,
                'current_start_trial_date' => $subscription->current_start_trial_date,
                'current_end_trial_date' => $subscription->current_end_trial_date,
                'current_start_subscription_date' => $subscription->current_start_subscription_date,
                'current_end_subscription_date' => $subscription->current_end_subscription_date,
                'created_at' => $subscription->created_at,
            ] : null,
            'trial_calculation' => [
                'user_created_at' => $user->created_at,
                'trial_end_date' => \Carbon\Carbon::parse($user->created_at)->addDays(3),
                'now' => \Carbon\Carbon::now(),
                'is_within_trial' => \Carbon\Carbon::now()->lessThan(\Carbon\Carbon::parse($user->created_at)->addDays(3)),
            ],
            'timestamp' => now(),
        ]);
    })->middleware('auth');

    // Debug route to test cart API
    Route::get('/debug-cart-api', function () {
        $controller = app(App\Http\Controllers\Auth\WishitemController::class);
        $response = $controller->authenticatedCartItems();
        
        $authUser = Auth::user();
        return response()->json([
            'timestamp' => now(),
            'auth_id' => Auth::id(),
            'auth_user' => $authUser instanceof App\Models\User ? [
                'id' => $authUser->id,
                'name' => $authUser->name,
                'email' => $authUser->email,
            ] : null,
            'cart_api_response' => json_decode($response->getContent(), true),
            'db_cart_count' => App\Models\UserCart::count()
        ]);
    })->name('debug.cart.api');

    Route::get('/send-test-mail', function () {
        Mail::raw('This is a test email. If you are seeing this, your mail configuration is working!', function ($message) {
            $message->to('prem@futureprofilez.com')
                ->subject('Test Email');
        });
        return 'Test email sent!';
    });

    // seeding command
    Route::get('seed/{seeder}', function ($seeder) {
        Artisan::call("db:seed --class=$seeder");
        return response()->json([
            'seed completed'
        ]);
    });
}



Route::get('/', function (DiscoveryService $discoveryService) {
    $period = request()->query('top_earners_period', '');
    $limit = (int) request()->query('top_earners_limit', 9);

    if (Auth::check()) {
        $trendingCreators = $discoveryService->getTrendingCreators();
        $newVerifiedCreators = $discoveryService->getNewVerifiedCreators();
        $topEarnersData = $discoveryService->getTopEarners($period, $limit);
    } else {
        $trendingCreators = \Illuminate\Support\Facades\Cache::remember('home_trending_creators', 900, function() use ($discoveryService) {
            return $discoveryService->getTrendingCreators();
        });
        $newVerifiedCreators = \Illuminate\Support\Facades\Cache::remember('home_new_verified_creators', 900, function() use ($discoveryService) {
            return $discoveryService->getNewVerifiedCreators();
        });
        $ttl = match ($period) {
            'daily' => 600, 
            'weekly' => 1200,
            'monthly' => 1800,
            default => 1200,
        };
        $topEarnersData = \Illuminate\Support\Facades\Cache::remember('home_top_earners_'.$period.'_'.$limit, $ttl, function() use ($discoveryService, $period, $limit) {
            return $discoveryService->getTopEarners($period, $limit);
        });
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'founderBonus' => [
            'minMonthlyEarnings' => config('founder_bonus.bonus.min_monthly_earnings'),
            'bonusPercentage' => config('founder_bonus.bonus.bonus_percentage') * 100, // Convert to percentage
            'maxBonusPerMonth' => config('founder_bonus.bonus.max_bonus_per_month'),
            'maxFounderSeats' => config('founder_bonus.limits.max_founder_seats'),
            'currencySymbol' => config('founder_bonus.display.currency_symbol'),
        ],
        'trendingCreators' => $trendingCreators,
        'newVerifiedCreators' => $newVerifiedCreators,
        'topEarners' => $topEarnersData['data'],
        'topEarnersLabel' => $topEarnersData['label'],
    ]);
})->name("home");

Route::get('/membership-dashboard', function () {
    return Inertia::render('membership/Membership_dashboard');
})->name('membershipDashboard');

// Route::get('/stripe-identity', function () {
//     return Inertia::render('IdentityVerification');
// })->name('stripe.identity');

// Route::post('create-cart', [TestController::class, 'createCart'])->name('create.cart');
// Route::get('get-all-products', [TestController::class, 'fetchRyeProducts'])->name('get.all.products');


// Route::get('rey-test', function () {
//     return Inertia::render('ReyTest');
// })->name('rey.test');

Route::get('get-cart', function () {
    return Inertia::render('GetCart');
})->name('get.cart');

// Analytics
Route::post('/analytics/search-click', [\App\Http\Controllers\AnalyticsController::class, 'searchClick'])->name('analytics.search-click');
Route::post('/feature-suggestion', [FeatureSuggestionController::class, 'store'])->middleware('throttle:5,1')->name('feature-suggestion.store');
Route::post('rye-webhook', [WishitemController::class, 'handleWebhook'])->name('rye.webhook');

// Unified Stripe Webhook Endpoint
Route::post('/webhook/payment', [StripeWebhookController::class, 'handle'])->name('stripe.webhook.unified');

// Deliverable Access Tracking
Route::get('/deliverable/access/{uuid}', [\App\Http\Controllers\DeliveriesController::class, 'access'])->name('deliverable.access');

// Legacy route for Stripe Identity Verification
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle']);
// Route::post('creator-monthly-verification-webhook', [StripeWebhookController::class, 'creatorMonthlyVerificationWebhook'])->name('creator.monthly.verification.webhook');


// GiftStore Route
Route::get('/giftstore', function () {
    return Inertia::render('rye/GiftStore');
})->name('giftStore');

Route::get('/creators', function () {
    return Inertia::render('creators/Index');
})->name('creators');

Route::get('/creators/stripe-safe', function () {
    return Inertia::render('creators/StripeSafe');
})->name('creators.stripe-safe');

Route::get('/creators/keep-100', function () {
    return Inertia::render('creators/Keep100');
})->name('creators.keep-100');

Route::get('/creators/features', function () {
    return Inertia::render('creators/Features');
})->name('creators.features');

Route::get('/creators/disputes', function () {
    return Inertia::render('creators/Disputes');
})->name('creators.disputes');

Route::get('/creators/founder-bonus', function () {
    return Inertia::render('creators/FounderBonus');
})->name('creators.founder-bonus');


// Route::post('test-stripe', function (Request $request) {
//     $request = json_encode($request->all());
//     Log::info("webhook run: $request");
//     $a = "come in this condition";
//     return response()->json(['status' => 'done', 'message' => $a], 200);
// })->name('test.stripe');


if (app()->environment('local')) {
    Route::get('create-product-for-creator-and-gifter', [StripeWebhookController::class, 'CreateProductForCreatorAndGifter']);
    
    // routes/web.php or routes/api.php
    Route::get('delete-all-products', [TestController::class, 'deleteAllProducts'])->name('delete.all.products');
    
    // delete all products from stripe
    Route::get('archived-all-products', [TestController::class, 'archiveAllStripeProducts'])->name('archived.all.products');
    Route::get('send-identity-verification-failed-emails', [TestController::class, 'sendFailedVerificationEmails']);
    Route::get('create-product/{price}', [StripeController::class, 'makeProductId'])->name('create.product');
}

//check referal code
Route::get('check-coupon-code/{code}', [RegisteredUserController::class, 'checkCouponCode'])->name('checkCouponCode');
Route::post("/username-availablity", [RegisteredUserController::class, "checkUsername"])->name("check.username");
Route::post('/register/validate', [RegisteredUserController::class, 'validateRegistration'])->name('register.validate');

Route::get('/dashboard', function () {
    // return Inertia::render('Dashboard');
    return redirect()->route('user.show', ['username' => Auth::user()->username]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Creator Risk Status (Moved from api.php to support session auth)
    Route::get('/api/creator/risk-status', [\App\Http\Controllers\Api\CreatorRiskController::class, 'getRiskStatus']);

    Route::get('/risk-test-panel', function () {
        return Inertia::render('RiskTestPanel');
    })->name('risk.test.panel');

    // Test Routes (Using Web Session)
    Route::prefix('api/test')->group(function () {
        Route::post('/risk/on', [\App\Http\Controllers\Api\TestRiskController::class, 'triggerRisk']);
        Route::post('/risk/off', [\App\Http\Controllers\Api\TestRiskController::class, 'clearRisk']);
        Route::post('/platform/freeze', [\App\Http\Controllers\Api\TestRiskController::class, 'triggerFreeze']);
        Route::post('/platform/normal', [\App\Http\Controllers\Api\TestRiskController::class, 'triggerNormal']);
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Purchases routes
    Route::get('/purchases', [\App\Http\Controllers\PurchasesController::class, 'index'])->name('purchases');
    Route::post('/purchases/cancel-subscription/{type}/{uuid}', [\App\Http\Controllers\PurchasesController::class, 'cancelSubscription'])
         ->name('purchases.cancel-subscription');
    
    // Alternative subscription cancellation route to match frontend expectation
    Route::post('/subscriptions/{id}/cancel', [\App\Http\Controllers\PurchasesController::class, 'cancelSubscriptionById'])
         ->name('subscriptions.cancel');
         
    // Comprehensive subscription management routes
    Route::prefix('subscriptions')->name('subscriptions.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SubscriptionsController::class, 'index'])->name('index');
        Route::get('/{id}', [\App\Http\Controllers\SubscriptionsController::class, 'show'])->name('show');
    });
});

// Select Default Currency
Route::get('/currency/{c}', function (Request $request, $c) {
    if (in_array($c, ['USD', 'GBP', 'EUR', 'INR', 'AUD', 'JPY', 'HKD', 'CAD', 'CHF', 'SEK', 'NZD'])) {
        Cookie::queue('currency', $c, 60 * 24 * 365);
        return back()->with('success', "Currency set to $c");
    }
    return back()->with('error', 'Invalid Currency!');
})->name('change.currency');

Route::prefix("test")->name("test.")->group(function () {
    Route::prefix("stripe")->name("stripe.")->group(function () {
        Route::get("search", [TestController::class, "stripeSearch"])->name("search");
        Route::get("checkout", [CheckoutController::class, 'testCheckout'])->name('checkout');
        Route::get('checkout-callback/{status?}', [CheckoutController::class, 'testCallback'])->name("callback");
    });
    Route::get('adult-content-check', [TestController::class, 'testAdultContent'])->name("adult-check");
    Route::get("email", [TestController::class, "testEmail"]);
    Route::get("founder-email", [TestController::class, "testFounderEmail"]);
    Route::get("debug-user-status", [TestController::class, "debugUserStatus"])->middleware('auth');
    Route::get("rates/{c?}", [TestController::class, "getRates"]);
    Route::get("c-data", [TestController::class, "testCurrencyData"]);
    Route::get("x-api", [TwitterController::class, 'testToken']);
    Route::get("meta", [TestController::class, 'testMeta']);
    Route::get("x-1", [TestController::class, 'testX']);
    Route::get("items/{c?}", [TestController::class, 'testItems']);
    Route::get('/ip', [TestController::class, 'testIp']);
});

// PWA Test Route (authenticated)
Route::middleware('auth')->get('/pwa-test', function () {
    return Inertia::render('PwaTest');
})->name('pwa.test');

// PWA debugging route
Route::get('/pwa-debug', function () {
    return response()->json([
        'manifest_url' => url('/site.webmanifest'),
        'service_worker_url' => url('/service-worker.js'),
        'manifest_exists' => file_exists(public_path('site.webmanifest')),
        'service_worker_exists' => file_exists(public_path('service-worker.js')),
        'is_https' => request()->isSecure(),
        'host' => request()->getHost(),
        'user_agent' => request()->userAgent(),
        'manifest_content' => file_exists(public_path('site.webmanifest')) 
            ? json_decode(file_get_contents(public_path('site.webmanifest')), true) 
            : null
    ]);
})->name('pwa.debug');

// Manual trigger for pending approval job (accessible in all environments)
Route::get('/pending-approval/manual-trigger', [PendingApprovalController::class, 'manualTrigger'])->name('pending-approval.trigger');

if (app()->environment('local')) {
    // create bypass entry for all users in userVerificationEntry
    Route::get("seed-user-verification-status", [TestController::class, "seedUserVerificationStatus"]);

    Route::get('/magicbell/user-key', [NotificationController::class, 'getUserKey']);
    Route::post('/magicbell/send-notification', [NotificationController::class, 'sendNotification']);
    Route::get('/test-push', [NotificationController::class, 'testSendNotification']);

    // Debug: Test support image generation end-to-end (Node + PHP fallback)
    Route::get('/debug/test-support-image', [\App\Http\Controllers\Debug\SupportImageTestController::class, 'run'])
        ->name('debug.test-support-image');
}

// Creator Activity Routes
Route::middleware('auth')->prefix('creator')->name('creator.')->group(function () {
    Route::get('/activity', [\App\Http\Controllers\CreatorActivityController::class, 'index'])->name('activity');
    Route::get('/activity/status', [\App\Http\Controllers\CreatorActivityController::class, 'getActivityStatus'])->name('activity.status');
    Route::post('/activity/refresh', [\App\Http\Controllers\CreatorActivityController::class, 'refreshActivity'])->name('activity.refresh');
    Route::get('/activity/suggestions', [\App\Http\Controllers\CreatorActivityController::class, 'getSuggestions'])->name('activity.suggestions');
    
    // Creator Subscription Routes
    Route::get('/subscription/status', [\App\Http\Controllers\CreatorSubscriptionController::class, 'getSubscriptionStatus'])->name('subscription.status');
    Route::post('/subscription/validate-payment', [\App\Http\Controllers\CreatorSubscriptionController::class, 'validatePaymentSubscription'])->name('subscription.validate-payment');
    Route::get('/subscription/dashboard', [\App\Http\Controllers\CreatorSubscriptionController::class, 'getDashboardInfo'])->name('subscription.dashboard');
    Route::get('/subscription/warnings', [\App\Http\Controllers\CreatorSubscriptionController::class, 'getCreatorsNeedingWarnings'])->name('subscription.warnings');
    Route::post('/subscription/sync', [\App\Http\Controllers\SubscriptionSyncController::class, 'syncCurrentUser'])->name('subscription.sync');

    // Dispute Portal Routes
    Route::get('/disputes', [\App\Http\Controllers\Creator\DisputeController::class, 'index'])->name('disputes.index');
    Route::get('/disputes/{id}', [\App\Http\Controllers\Creator\DisputeController::class, 'show'])->name('disputes.show');
    Route::post('/disputes/{id}/submit', [\App\Http\Controllers\Creator\DisputeController::class, 'submitEvidence'])->name('disputes.submit');
    
    // Payout/Reserve Routes
    Route::get('/payouts/reserves', [\App\Http\Controllers\Api\CreatorPayoutController::class, 'getReserves'])->name('payouts.reserves');

    // Security Zone Routes
    Route::prefix('security')->name('security.')->group(function () {
        Route::get('/sessions', [\App\Http\Controllers\SecurityController::class, 'getSessions'])->name('sessions');
        Route::post('/sessions/revoke', [\App\Http\Controllers\SecurityController::class, 'revokeSession'])->name('sessions.revoke');
        Route::get('/blocked-users', [\App\Http\Controllers\SecurityController::class, 'getBlockedUsers'])->name('blocked-users');
        Route::post('/block-user', [\App\Http\Controllers\SecurityController::class, 'blockUser'])->name('block-user');
        Route::delete('/unblock-user/{id}', [\App\Http\Controllers\SecurityController::class, 'unblockUser'])->name('unblock-user');
        Route::get('/search-users', [\App\Http\Controllers\SecurityController::class, 'searchUsers'])->name('search-users');
    });
});

Route::get('/service-worker.js', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(resource_path("proxy/service-worker.js"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "text/javascript",
    ]);
})->name('service.worker');

Route::get('/new-service-worker.js', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(resource_path("proxy/service-worker.js"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "text/javascript",
    ]);
})->name('new-service-worker');

Route::get('/site.webmanifest', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(resource_path("proxy/site.webmanifest.json"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "text/json",
    ]);
})->name('site.manifest.file');

Route::get('/manifest.json', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(resource_path("proxy/manifest.json"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "text/json",
    ]);
})->name('manifest.file');

Route::get('/android-chrome-192x192.png', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(filename: resource_path("proxy/android-chrome-192x192.png"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "image/png",
    ]);
})->name('192.image.file');

Route::get('/android-chrome-512x512.png', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(filename: resource_path("proxy/android-chrome-512x512.png"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "image/png",
    ]);
})->name('512.image.file');

Route::get('/favicon-16x16.png', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(filename: resource_path("proxy/favicon-16x16.png"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "image/png",
    ]);
})->name('16.image.file');

Route::get('/favicon-32x32.png', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(filename: resource_path("proxy/favicon-32x32.png"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "image/png",
    ]);
})->name('32.image.file');

Route::get('/splashscreen.png', function () {
    $assetRoot = rtrim(asset("/"), "/");
    $content = file_get_contents(filename: resource_path("proxy/splash.png"));
    $content = Str::replace("[ASSET_ROOT]", $assetRoot, $content);
    return response($content, 200, [
        "Content-Type" => "image/png",
    ]);
})->name('splash.image.file');

// SEO Routes - Completely different paths to bypass all caching
Route::withoutMiddleware([])->group(function () {
    // New robots route with different name
    Route::get('/app-robots-file', [\App\Http\Controllers\SeoController::class, 'robotsTxt'])->name('app.robots');
    
    // New sitemap routes with different names
    Route::get('/app-sitemap-index', [\App\Http\Controllers\SitemapController::class, 'index'])->name('app.sitemap.index');
    Route::get('/app-sitemap-pages', [\App\Http\Controllers\SitemapController::class, 'static'])->name('app.sitemap.static');
    Route::get('/app-sitemap-users', [\App\Http\Controllers\SitemapController::class, 'creators'])->name('app.sitemap.creators');
    Route::get('/app-sitemap-items', [\App\Http\Controllers\SitemapController::class, 'wishlists'])->name('app.sitemap.wishlists');
    
    // Inline robots.txt that bypasses all file systems
    Route::get('/dynamic-robots', function () {
        $siteUrl = config('app.url');
        $content = "User-agent: *\n";
        $content .= "Disallow: /admin/\n";
        $content .= "Disallow: /api/webhooks/\n";
        $content .= "Disallow: /*.json\n";
        $content .= "Disallow: /staging/\n";
        $content .= "Disallow: /test/\n";
        $content .= "Disallow: /debug*/\n";
        $content .= "Disallow: /seed*/\n";
        $content .= "Disallow: /*-test\n";
        $content .= "Disallow: /pwa-debug\n";
        $content .= "\n# Allow main content\n";
        $content .= "Allow: /\n";
        $content .= "Allow: /discover\n";
        $content .= "Allow: /leaderboard\n";
        $content .= "Allow: /how-it-works\n";
        $content .= "\n# Sitemap location\n";
        $content .= "Sitemap: {$siteUrl}/dynamic-sitemap\n";
        
        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Thu, 01 Jan 1970 00:00:00 GMT',
        ]);
    })->name('dynamic.robots');
    
    // Inline sitemap that bypasses all file systems
    Route::get('/dynamic-sitemap', function () {
        $siteUrl = config('app.url');
        $content = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $content .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        $content .= '  <sitemap>' . "\n";
        $content .= '    <loc>' . $siteUrl . '/dynamic-sitemap-pages</loc>' . "\n";
        $content .= '    <lastmod>' . now()->toW3cString() . '</lastmod>' . "\n";
        $content .= '  </sitemap>' . "\n";
        $content .= '  <sitemap>' . "\n";
        $content .= '    <loc>' . $siteUrl . '/dynamic-sitemap-users</loc>' . "\n";
        $content .= '    <lastmod>' . now()->toW3cString() . '</lastmod>' . "\n";
        $content .= '  </sitemap>' . "\n";
        $content .= '  <sitemap>' . "\n";
        $content .= '    <loc>' . $siteUrl . '/dynamic-sitemap-items</loc>' . "\n";
        $content .= '    <lastmod>' . now()->toW3cString() . '</lastmod>' . "\n";
        $content .= '  </sitemap>' . "\n";
        $content .= '</sitemapindex>' . "\n";
        
        return response($content, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Thu, 01 Jan 1970 00:00:00 GMT',
        ]);
    })->name('dynamic.sitemap');
    
    // Dynamic sub-sitemaps
    Route::get('/dynamic-sitemap-pages', function () {
        $siteUrl = config('app.url');
        $staticPages = [
            ['url' => '/', 'priority' => '1.0', 'changefreq' => 'daily'],
            ['url' => '/discover', 'priority' => '0.9', 'changefreq' => 'daily'],
            ['url' => '/leaderboard', 'priority' => '0.8', 'changefreq' => 'daily'],
            ['url' => '/how-it-works', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/terms-and-conditions', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/paid-tasks-terms', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/register', 'priority' => '0.6', 'changefreq' => 'weekly'],
            ['url' => '/login', 'priority' => '0.6', 'changefreq' => 'weekly'],
            ['url' => '/creators', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/stripe-safe', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['url' => '/creators/keep-100', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/features', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/disputes', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['url' => '/creators/founder-bonus', 'priority' => '0.7', 'changefreq' => 'weekly'],
        ];
        
        $content = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $content .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        foreach ($staticPages as $page) {
            $content .= '  <url>' . "\n";
            $content .= '    <loc>' . $siteUrl . $page['url'] . '</loc>' . "\n";
            $content .= '    <lastmod>' . now()->toW3cString() . '</lastmod>' . "\n";
            $content .= '    <changefreq>' . $page['changefreq'] . '</changefreq>' . "\n";
            $content .= '    <priority>' . $page['priority'] . '</priority>' . "\n";
            $content .= '  </url>' . "\n";
        }
        
        $content .= '</urlset>' . "\n";
        
        return response($content, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Thu, 01 Jan 1970 00:00:00 GMT',
        ]);
    })->name('dynamic.sitemap.pages');
    
    Route::get('/dynamic-sitemap-users', [\App\Http\Controllers\SitemapController::class, 'creators'])->name('dynamic.sitemap.users');
    Route::get('/dynamic-sitemap-items', [\App\Http\Controllers\SitemapController::class, 'wishlists'])->name('dynamic.sitemap.items');
    
    // SEO Status Page
    Route::get('/seo-status', function () {
        $siteUrl = config('app.url');
        $html = '<!DOCTYPE html><html><head><title>SEO Files Status</title></head><body>';
        $html .= '<h1>SEO Files - Working URLs</h1>';
        $html .= '<p>These URLs bypass all caching and serve dynamic content:</p>';
        $html .= '<ul>';
        $html .= '<li><strong>Robots.txt:</strong> <a href="' . $siteUrl . '/dynamic-robots" target="_blank">' . $siteUrl . '/dynamic-robots</a></li>';
        $html .= '<li><strong>Sitemap Index:</strong> <a href="' . $siteUrl . '/dynamic-sitemap" target="_blank">' . $siteUrl . '/dynamic-sitemap</a></li>';
        $html .= '<li><strong>Pages Sitemap:</strong> <a href="' . $siteUrl . '/dynamic-sitemap-pages" target="_blank">' . $siteUrl . '/dynamic-sitemap-pages</a></li>';
        $html .= '<li><strong>Users Sitemap:</strong> <a href="' . $siteUrl . '/dynamic-sitemap-users" target="_blank">' . $siteUrl . '/dynamic-sitemap-users</a></li>';
        $html .= '<li><strong>Items Sitemap:</strong> <a href="' . $siteUrl . '/dynamic-sitemap-items" target="_blank">' . $siteUrl . '/dynamic-sitemap-items</a></li>';
        $html .= '</ul>';
        $html .= '<h2>Submit to Search Engines:</h2>';
        $html .= '<p>Use this URL for search engine submission:</p>';
        $html .= '<code>' . $siteUrl . '/dynamic-sitemap</code>';
        $html .= '</body></html>';
        
        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    })->name('seo.status');
});

// Redirect old URLs to new SEO URLs
Route::get('/robots.txt', [\App\Http\Controllers\SeoController::class, 'robots'])->name('robots.txt');

Route::get('/sitemap.xml', function () {
    return redirect('/seo/sitemap.xml', 301);
})->name('sitemap.redirect');

Route::get('/sitemap/static.xml', function () {
    return redirect('/seo/sitemap-static.xml', 301);
})->name('sitemap.static.redirect');

Route::get('/sitemap/creators.xml', function () {
    return redirect('/seo/sitemap-creators.xml', 301);
})->name('sitemap.creators.redirect');

Route::get('/sitemap/wishlists.xml', function () {
    return redirect('/seo/sitemap-wishlists.xml', 301);
})->name('sitemap.wishlists.redirect');

// SEO Cache management route (for post-deployment cache clearing)
Route::get('/seo/clear-cache', [\App\Http\Controllers\SitemapController::class, 'clearCache'])->name('seo.clear.cache');

// Enhanced 404 Error Page
Route::get('/404', [\App\Http\Controllers\ErrorController::class, 'show404'])->name('error.404');

// Health Check Endpoints for CI/CD Pipeline
Route::get('/health', [HealthController::class, 'index'])->name('health.check');
Route::get('/health/detailed', [HealthController::class, 'detailed'])->name('health.detailed');


// require __DIR__.'/auth.php'; // moved below founder routes

// Debug routes for wish creation issue
require __DIR__.'/debug-wish.php';

// Founder routes are now defined in auth.php

// Admin Founder Bonus Routes
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->group(function () {
    Route::get('/founder/bonuses', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'index'])->name('admin.founder/bonuses.index');
    Route::get('/founder/bonuses/data', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'getBonuses'])->name('admin.founder/bonuses.data');
    Route::post('/founder/bonuses/{bonus}/reject', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'rejectPayout'])->name('admin.founder/bonuses.reject');
    Route::post('/founder/bonuses/{bonus}/approve', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'approvePayout'])->name('admin.founder/bonuses.approve');
    Route::get('/founder/bonus-settings', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'getSettings'])->name('admin.founder/bonus-settings.get');
    Route::post('/founder/bonus-settings', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'updateSettings'])->name('admin.founder/bonus-settings.update');
    Route::get('/founder/bonus-settings-page', function () {
        return Inertia::render('Admin/FounderBonus/Settings');
    })->name('admin.founder/bonus-settings.page');
    Route::post('/founder/bonuses/trigger-qualification-check', [App\Http\Controllers\Admin\FounderBonusAdminController::class, 'triggerQualificationCheck'])->name('admin.founder/bonuses.trigger-qualification');
    
    // Feature Suggestions Admin
    Route::get('/feature-suggestions', function (Illuminate\Http\Request $request) {
        $query = \App\Models\FeatureSuggestion::with('user')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('suggestion', 'like', "%{$term}%")
                  ->orWhere('name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%");
            });
        }

        return Inertia::render('Admin/FeatureSuggestions', [
            'suggestions' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['status', 'search']),
        ]);
    })->name('admin.feature-suggestions.index');

    Route::patch('/feature-suggestions/{suggestion}/status', [FeatureSuggestionController::class, 'updateStatus'])->name('admin.feature-suggestions.update-status');
});

// Ensure auth routes (including catch-all) load AFTER explicit founder routes
require __DIR__.'/auth.php';

// Quick middleware test
Route::middleware(['auth', 'mustCompletedStripeIdentity', 'mustHaveToVerify'])
    ->get('/debug-middleware-test', function() {
        $user = auth()->user();
        return response()->json([
            'success' => true,
            'message' => 'Middleware passed successfully',
            'user' => $user instanceof \App\Models\User ? [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'subscription_status' => $user->subscription_status,
            ] : null,
        ]);
    });
require __DIR__.'/test-date.php';

// Test subscription routes (remove in production)
if (config('app.env') !== 'production') {
require __DIR__.'/test-subscription.php';
}


// Routes already defined above
// Removed duplicate purchases route

// Local preview route for pending approval email
// Only available in local/dev and for authenticated admins
Route::middleware(['web'])->group(function () {
    Route::get('/_preview/pending-approval', function () {
        if (!app()->isLocal()) {
            abort(403);
        }

        $items = app(\App\Services\PendingApprovalService::class)->collectPendingItems();
        return view('email.pending_approval_summary', [
            'pendingItems' => $items,
        ]);
    })->name('preview.pending-approval');
});

// Intercom test route (local only)
if (app()->environment('local')) {
    Route::get('/test-intercom', function () {
        return Inertia::render('TestIntercom');
    })->name('test.intercom');
}

// Intercom debug route
Route::get('/debug-intercom', [\App\Http\Controllers\IntercomDebugController::class, 'debug'])->name('debug.intercom');



// Moved /task/* routes to routes/auth.php to respect username catch-all ordering

// Test Scheduler Route
Route::get('/test/scheduler/is/running', function () {
    // Caching disabled for production stability
    $lastRun = null;
    $lastRunDynamo = null;

    // Determine effective last run
    $effectiveLastRun = $lastRun ?: $lastRunDynamo;

    return response()->json([
        'status' => $effectiveLastRun ? 'active' : 'inactive',
        'last_run' => $lastRun,
        'last_run_dynamodb' => $lastRunDynamo,
        'server_time' => now()->toDateTimeString(),
        'diff_seconds' => $effectiveLastRun ? now()->diffInSeconds(\Carbon\Carbon::parse($effectiveLastRun)) : null,
        'cache_driver' => config('cache.default'),
        'cache_store' => config('cache.stores.' . config('cache.default') . '.driver'),
    ]);
});
