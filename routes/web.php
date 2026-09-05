<?php

use App\Http\Controllers\Admin\EmulationLoginController;
use App\Http\Controllers\Admin\FounderBonusAdminController;
use App\Http\Controllers\Admin\PolicyNotificationController;
use App\Http\Controllers\Admin\SystemDiagnosticsController;
use App\Http\Controllers\Admin\TaskPurchaseController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Api\CreatorPayoutController;
use App\Http\Controllers\Api\CreatorRiskController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TestRiskController;
use App\Http\Controllers\AppController;
use App\Http\Controllers\Auth\BillsController;
use App\Http\Controllers\Auth\CheckoutController;
use App\Http\Controllers\Auth\MembershipController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\BrandAssetController;
use App\Http\Controllers\ComparisonController;
use App\Http\Controllers\Creator\DisputeController;
use App\Http\Controllers\Creator\ReviewHoldController;
use App\Http\Controllers\CreatorActivityController;
use App\Http\Controllers\CreatorLandingController;
use App\Http\Controllers\CreatorPushController;
use App\Http\Controllers\CreatorSubscriptionController;
use App\Http\Controllers\Debug\SupportImageTestController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
*/

// Health check endpoint for Vapor
use App\Http\Controllers\DeliveriesController;
use App\Http\Controllers\EmailPreferenceController;
use App\Http\Controllers\ErrorController;
use App\Http\Controllers\FeatureSuggestionController;
use App\Http\Controllers\GrowthBonusController;
use App\Http\Controllers\GuestPurchaseController;
use App\Http\Controllers\GuestSupportTicketController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\HelpController;
use App\Http\Controllers\MagicBellProxyController;
use App\Http\Controllers\MaintenanceAccessController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OutreachUnsubscribeController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\SignupWaitlistController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\StockWaitlistController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\SubscriptionsController;
use App\Http\Controllers\SubscriptionSyncController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\ThankYouController;
use App\Http\Controllers\VideoPosterController;
use App\Models\FeatureSuggestion;
use App\Models\FounderBonus;
use App\Models\GrowthBonusProfile;
use App\Models\User;
use App\Models\UserCart;
use App\Services\Discovery\CollectionService;
use App\Services\DiscoveryService;
use App\Services\PendingApprovalService;
use App\Support\CompetitorSheet;
use App\Support\DiscoveryPayload;
use App\Support\MonetisationPillars;
use App\Support\PresetCovers;
use App\Support\PwaSplash;
use Carbon\Carbon;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

// Emulation Bridge
Route::get('/admin/emulate-login/{user}', [EmulationLoginController::class, 'login'])
    ->name('admin.emulate.login');

Route::post('/admin/emulate-stop', [EmulationLoginController::class, 'stop'])
    ->name('admin.emulate.stop');

// Route::get('/health', function () {
//     return response()->json([
//         'status' => 'ok',
//         'timestamp' => now()->toISOString(),
//         'app' => config('app.name'),
//         'environment' => config('app.env')
//     ], 200);
// })->name('health.check');

// Cache Check Route — local/testing only. Unauthenticated in production it wrote a
// fresh cache key on every hit and leaked the cache driver in use.
if (app()->environment('local', 'testing')) {
    Route::get('/debug/cache-check', function () {
        $key = 'debug_cache_test_'.time();
        $value = 'working';

        // Put in cache for 1 minute
        Cache::put($key, $value, 60);

        // Retrieve
        $retrieved = Cache::get($key);

        return response()->json([
            'status' => $retrieved === $value ? 'ok' : 'failed',
            'driver' => config('cache.default'),
            'timestamp' => now()->toDateTimeString(),
            'test_key' => $key,
            'retrieved_value' => $retrieved,
        ]);
    });
}

// CSRF Cookie route for SPA authentication
Route::get('/csrf-cookie', function () {
    return response()->noContent(204);
})->middleware('web');

Route::match(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], '/magicbell/{path?}', MagicBellProxyController::class)
    ->where('path', '.*')
    ->middleware('auth');

Route::get('activity/logs', [CreatorActivityController::class, 'logs'])->name('activity.logs')->middleware('auth');

// Debug route to test subscription status
if (app()->environment('local')) {
    Route::get('/debug-subscription/{userId}', function ($userId) {
        $user = User::find($userId);
        if (! $user) {
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
                'trial_end_date' => Carbon::parse($user->created_at)->addDays(3),
                'now' => Carbon::now(),
                'is_within_trial' => Carbon::now()->lessThan(Carbon::parse($user->created_at)->addDays(3)),
            ],
            'timestamp' => now(),
        ]);
    })->middleware('auth');

    // Debug route to test cart API
    Route::get('/debug-cart-api', function () {
        $controller = app(WishitemController::class);
        $response = $controller->authenticatedCartItems();

        $authUser = Auth::user();

        return response()->json([
            'timestamp' => now(),
            'auth_id' => Auth::id(),
            'auth_user' => $authUser instanceof User ? [
                'id' => $authUser->id,
                'name' => $authUser->name,
                'email' => $authUser->email,
            ] : null,
            'cart_api_response' => json_decode($response->getContent(), true),
            'db_cart_count' => UserCart::count(),
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
            'seed completed',
        ]);
    });
}

Route::get('/', function (DiscoveryService $discoveryService) {
    $period = request()->query('top_earners_period', '');

    // Use shared cache for both guests and authenticated users for public discovery data
    $trendingCreators = function () use ($discoveryService) {
        return Cache::remember('home_trending_creators_v3_limit_6', 900, function () use ($discoveryService) {
            return $discoveryService->getTrendingCreators(6);
        });
    };

    $newVerifiedCreators = function () use ($discoveryService) {
        return Cache::remember('home_new_verified_creators_v3_limit_6', 900, function () use ($discoveryService) {
            return $discoveryService->getNewVerifiedCreators(6);
        });
    };

    $topEarnersData = function () use ($discoveryService, $period) {
        $limit = 6;
        $ttl = match ($period) {
            'daily' => 600,
            'weekly' => 1200,
            'monthly' => 1800,
            default => 1200,
        };

        return Cache::remember('home_top_earners_v3_'.$period.'_limit_6', $ttl, function () use ($discoveryService, $period, $limit) {
            return $discoveryService->getTopEarners($period, $limit);
        });
    };

    $founderSpots = Cache::remember('home_founder_spots_remaining_v1', 900, function () {
        $maxSeats = (int) config('founder_bonus.limits.max_founder_seats', 150);
        $used = (int) FounderBonus::getTotalFounderCount();

        return max(0, $maxSeats - $used);
    });

    /*
     * Growth Bonus figures for the landing page. NULL while the scheme is dark,
     * and the component keys on that — never on the JS constants mirror, which
     * is always importable and would advertise a /growth-bonus that 404s.
     */
    $growthBonus = null;
    if (config('growth_bonus.enabled')) {
        $ladder = (array) config('growth_bonus.ladder', []);
        $maxSeats = (int) config('growth_bonus.limits.max_seats', 150);
        $claimed = Cache::remember(
            'growth_bonus_seats_claimed_v1',
            300,
            fn () => GrowthBonusProfile::seatsClaimed(),
        );

        $growthBonus = [
            'maxTotal' => array_sum(array_column($ladder, 'amount')),
            'activationGmv' => (float) config('growth_bonus.activation.threshold_gmv', 100),
            'firstReward' => (float) ($ladder[0]['amount'] ?? 0),
            'windowDays' => (int) config('growth_bonus.activation.window_days', 30),
            'maxSeats' => $maxSeats,
            'seatsRemaining' => max(0, $maxSeats - $claimed),
        ];
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        // The three earning shapes, above the seven-product catalogue. One
        // definition in config/monetisation.php — the list used to be typed
        // here and again on /creators, with Memberships last in both.
        'pillars' => MonetisationPillars::forInertia(),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'founderBonus' => [
            'minMonthlyEarnings' => config('founder_bonus.bonus.min_monthly_earnings'),
            'bonusPercentage' => config('founder_bonus.bonus.bonus_percentage') * 100, // Convert to percentage
            'maxBonusPerMonth' => config('founder_bonus.bonus.max_bonus_per_month'),
            'maxFounderSeats' => config('founder_bonus.limits.max_founder_seats'),
            'currencySymbol' => config('founder_bonus.display.currency_symbol'),
            'founderSpotsRemaining' => $founderSpots,
        ],
        'growthBonus' => $growthBonus,
        // Load cached creator lists directly for the homepage showcase
        'trendingCreators' => $trendingCreators(),
        'newVerifiedCreators' => $newVerifiedCreators(),
        'topEarners' => $topEarnersData()['data'],
        'topEarnersLabel' => $topEarnersData()['label'],
        // Discovery section (A1). Passed per-route rather than shared globally
        // in HandleInertiaRequests — only the marketing surfaces and, later, the
        // creator dashboard need it, and the shared payload rides on every
        // request in the app.
        'discovery' => DiscoveryPayload::forInertia(),

        /*
         * Discovery Phase 6 — homepage collections (Developer Master Plan,
         * 19 Aug 2026, §C).
         *
         * ⚠️ ONLY THE TWO THE HOMEPAGE DOES NOT ALREADY HAVE. Trending and
         * "new" are already on this page as `trendingCreators` /
         * `newVerifiedCreators`, drawn by `CreatorShowcase`'s own tabs — adding
         * the collection versions beside them would show the same creators
         * twice under two headings.
         *
         * ⚠️ `many()` DROPS AN EMPTY COLLECTION rather than drawing a titled
         * row with nothing in it, so a quiet week costs a row, not a dead end.
         */
        'collections' => app(CollectionService::class)->many(
            ['hidden_gems', 'almost_funded'],
            8
        ),
    ]);
})->middleware('ssr')->name('home');

Route::get('/pride', function () {
    return Inertia::render('Pride/Index');
})->middleware('ssr')->name('pride.landing');

// =====================================================
// Creator Dashboards
// =====================================================

Route::middleware(['auth'])->group(function () {

    // ================= BILL DASHBOARD =================

    Route::get('/billing-dashboard', function () {
        return Inertia::render('bills/Billing_dashboard');
    })->name('billing.dashboard');

    Route::get('/billing/api/dashboard', [BillsController::class, 'getDashboardData']);

    // ================= BILL DETAILS =================

    Route::get('/billing/bill/{uuid}', function ($uuid) {
        return Inertia::render('bills/BillDetails', [
            'uuid' => $uuid,
        ]);
    })->name('billing.bill.details');

    Route::get('/billing/api/bill/{uuid}', [BillsController::class, 'getBillDetails']);

    /*
    |--------------------------------------------------------------------------
    | CANCEL MEMBERSHIP SUBSCRIPTION
    |--------------------------------------------------------------------------
    */
    Route::post('/membership/cancel-subscription', [MembershipController::class, 'cancelSubscription'])->name('membership.cancel.subscription');

    // ================= MEMBERSHIP DASHBOARD =================

    /*
    |--------------------------------------------------------------------------
    | CANCEL BILL SUBSCRIPTION
    |--------------------------------------------------------------------------
    */
    Route::post('/billing/cancel-subscription', [BillsController::class, 'cancelSubscription'])->name('billing.cancel.subscription');

    Route::get('/membership-dashboard', function () {
        return Inertia::render('membership/Membership_dashboard');
    })->name('membershipDashboard');

    Route::get('/membership/details/{uuid}', [MembershipController::class, 'membershipDetails']);

    Route::get('/membership/api/details/{uuid}', [MembershipController::class, 'getMembershipDetails']);

    // ================= CREATOR SUBSCRIPTIONS =================

    Route::get('/creator/subscriptions', function () {
        return Inertia::render('creator/MySubscriptions');
    })->name('creator.subscriptions');

    // ================= REVENUE ANALYTICS =================

    Route::get('/creator/revenue', function () {
        return Inertia::render('creator/RevenueAnalytics');
    })->name('creator.revenue');

    Route::get('/billing/my-subscriptions', [BillsController::class, 'mySubscriptions']);
    Route::get('/billing/api/my-subscriptions', [BillsController::class, 'getMySubscriptions']);
});

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
Route::post('/analytics/search-click', [AnalyticsController::class, 'searchClick'])->name('analytics.search-click');
Route::post('/feature-suggestion', [FeatureSuggestionController::class, 'store'])->middleware('throttle:5,1')->name('feature-suggestion.store');
Route::post('/api/report-content', [ReportController::class, 'store'])->middleware('throttle:5,1')->name('api.report.store');
Route::post('rye-webhook', [WishitemController::class, 'handleWebhook'])->middleware('rye.enabled')->name('rye.webhook');

// Unified Stripe Webhook Endpoint
Route::post('/webhook/payment', [StripeWebhookController::class, 'handle'])->name('stripe.webhook.unified');

/*
 * Maintenance bypass — exchange the token for a cookie so the site can be checked
 * while the wall is up for everyone else.
 *
 * ⚠️ Must stay ABOVE `require auth.php`, which ends with the `/{username}/{page?}`
 * profile catch-all: declared below it, this single-segment-prefixed path is read
 * as a username and answered with the profile 404, and `route:list` shows it
 * either way. Exempt from the wall in MaintenanceMode::EXEMPT_PREFIXES.
 */
Route::get('/maintenance-access/{token}', MaintenanceAccessController::class)
    ->middleware('throttle:10,1')
    ->name('maintenance.access');

// Deliverable Access Tracking
Route::get('/deliverable/access/{uuid}', [DeliveriesController::class, 'access'])->name('deliverable.access');

Route::middleware('signed')->group(function () {
    Route::get('/support/guest/create/{paymentId}', [GuestSupportTicketController::class, 'create'])->name('support.guest.create');
    Route::post('/support/guest/create/{paymentId}', [GuestSupportTicketController::class, 'store'])->name('support.guest.store');
    Route::get('/support/guest/tip/{tipPaymentId}', [GuestSupportTicketController::class, 'createTip'])->name('support.guest.tip.create');
    Route::post('/support/guest/tip/{tipPaymentId}', [GuestSupportTicketController::class, 'storeTip'])->name('support.guest.tip.store');
    Route::get('/support/guest/tickets/{uuid}', [GuestSupportTicketController::class, 'show'])->name('support.guest.tickets.show');
    Route::post('/support/guest/tickets/{uuid}/message', [GuestSupportTicketController::class, 'message'])->name('support.guest.tickets.message');
    Route::post('/support/guest/tickets/{uuid}/resolve', [GuestSupportTicketController::class, 'resolve'])->name('support.guest.tickets.resolve');
});

// Legacy route for Stripe Identity Verification
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle']);
// Route::post('creator-monthly-verification-webhook', [StripeWebhookController::class, 'creatorMonthlyVerificationWebhook'])->name('creator.monthly.verification.webhook');

// GiftStore Route
// RYE is still kill-switched (see EnsureRyeEnabled). The store PAGE answers with
// a coming-soon screen rather than a 404 — every other RYE entry point stays 404'd.
Route::get('/giftstore', function () {
    if (! config('services.rye.enabled')) {
        return Inertia::render('ComingSoon', [
            // "Oink Store" is what the FOOTER calls it (it moved out of the
            // header nav on 20 Aug 2026) — keep the two in step.
            'title' => 'Oink Store',
            'message' => "The Oink Store isn't open yet. Soon you'll be able to buy real products from creators and have them shipped straight to your door.",
            'highlights' => [
                'Order physical products from the creators you follow.',
                'Shipped direct to your door, tracked end to end.',
                'Your address stays private — creators never see it.',
            ],
        ]);
    }

    return Inertia::render('rye/GiftStore');
})->middleware('ssr')->name('giftStore');

/*
 * The paid-ads landing pages, and the only routes on the site that are
 * server-rendered. `ssr` (App\Http\Middleware\EnableSsr) turns Inertia SSR on
 * for guests on these routes alone — the rest of the app stays client-rendered,
 * because nothing else here is crawled and SSR costs a round trip to the render
 * host. Every new /creators page belongs INSIDE this group; without it the page
 * is an empty shell to Google and to link previews.
 */
Route::middleware('ssr')->group(function () {
    Route::get('/creators', function () {
        return Inertia::render('creators/Index', [
            'pillars' => MonetisationPillars::forInertia(),
            // Client spec v4.3 §7 — the "how we compare" cards. Only published
            // comparisons are sent, so the overview can never link to a page
            // that is still being checked.
            'comparisons' => array_map(fn ($sheet) => [
                'slug' => $sheet->slug,
                'name' => $sheet->name(),
                'what' => $sheet->get('what'),
            ], CompetitorSheet::published()),
        ]);
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

    /*
     * The memberships landing page — client note, 4 Sep 2026.
     *
     * 🚨 A CONTROLLER, NOT A CLOSURE, and that is not tidiness. The page prints
     * the membership benefit list and a fee example, and both must come from
     * `config/rewards.php` and `Helpers::calculateStripeDirectChargeFlow()`
     * rather than from the component. It also needs its <title> set server-side
     * or `SeoMeta`'s default renders first and the crawler takes that one.
     */
    Route::get('/creators/memberships', [CreatorLandingController::class, 'memberships'])
        ->name('creators.memberships');

    Route::get('/creators/disputes', function () {
        return Inertia::render('creators/Disputes');
    })->name('creators.disputes');

    Route::get('/creators/founder-bonus', function () {
        return Inertia::render('creators/FounderBonus');
    })->name('creators.founder-bonus');

    // A2 — the Discovery ad landing page. It reads the SAME label map as the
    // homepage Discovery section, so the two pages can never disagree about which
    // capabilities are live (see config/discovery.php).
    Route::get('/creators/discovery', function () {
        return Inertia::render('creators/Discovery', [
            'discovery' => DiscoveryPayload::forInertia(),
        ]);
    })->name('creators.discovery');

    // A3 — the Link in Bio ad landing page. Reads the same label map, which is why
    // its sections 3 and 6 correctly show COMING SOON until the B stream ships the
    // direct-checkout bio page (see config/discovery.php, `bio_direct_sales`).
    Route::get('/creators/link-in-bio', function () {
        return Inertia::render('creators/LinkInBio', [
            'discovery' => DiscoveryPayload::forInertia(),
        ]);
    })->name('creators.link-in-bio');

    /*
     * The comparison pages — client spec "Comparison Build FINAL v4.3",
     * 24 Aug 2026. One template, one config file per competitor.
     *
     * 🚨 `/creators/compare` MUST be declared before `/creators/vs/{slug}`?
     * No — they do not overlap ("compare" is not under "vs"). But the INDEX is
     * declared first anyway so the pair reads in the order a person meets them.
     *
     * ⚠️ The slug is the config file name and nothing else is consulted, so an
     * unknown competitor 404s rather than rendering an empty template.
     */
    /*
     * The wishlist keyword landing page (spec Section 5c). NOT a comparison —
     * it is where the whole wishlist keyword cluster lands, which today points
     * at /creators/features, a page that never uses the word "wishlist".
     *
     * ⚠️ Declared before `/creators/vs/{slug}` for readability only; "wishlist"
     * is not under "vs", so the two cannot collide.
     */
    Route::get('/creators/wishlist', [ComparisonController::class, 'wishlist'])
        ->name('creators.wishlist');

    Route::get('/creators/compare', [ComparisonController::class, 'index'])
        ->name('creators.compare');

    Route::get('/creators/vs/{slug}', [ComparisonController::class, 'show'])
        ->where('slug', '[a-z0-9-]+')
        ->name('creators.vs');
});

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

// REMOVED: GET /migrate-covers — a public, unauthenticated closure that wrote
// cover + cover_approved=1 on every user with a default/empty cover, and
// re-randomised them on every call. A one-shot data migration belongs in an
// Artisan command, not an anonymous GET that mass-mutates the users table.

// check referal code
// ⚠️ Throttled: both of these answer "does this code exist?" to anyone, unauthenticated,
// which is a code-guessing oracle. A person typing their own code needs a handful of
// attempts; a script working through a keyspace needs thousands.
Route::get('check-coupon-code/{code}', [RegisteredUserController::class, 'checkCouponCode'])
    ->middleware('throttle:40,1')
    ->name('checkCouponCode');
// ⚠️ Both answer "is this username/email already taken?" to anyone. The register
// form calls them per keystroke (debounced), so they need a limit that a real
// signup never reaches but a scraper does.
Route::post('/username-availablity', [RegisteredUserController::class, 'checkUsername'])
    ->middleware('throttle:120,1')
    ->name('check.username');
Route::post('/register/validate', [RegisteredUserController::class, 'validateRegistration'])
    ->middleware('throttle:120,1')
    ->name('register.validate');

Route::get('/dashboard', function (Request $request) {
    // ⚠️ The query string MUST survive this redirect. `/dashboard?add=post` is
    // the URL the app links to itself — CreatorJourneyCard's `first_post` CTA
    // and the "Write a post for members" link on the activity strip both use
    // it — and `Dashboard.jsx` reads `?add=` exactly once during render to
    // decide which creation form to open. Dropping it landed the creator on
    // their profile with no composer and nothing explaining why, so the one
    // step the journey card was nudging them towards did nothing.
    //
    // `username` is applied AFTER the query so a `?username=` in the URL can
    // never redirect the caller to somebody else's profile.
    return redirect()->route('user.show', array_merge(
        $request->query(),
        ['username' => Auth::user()->username],
    ));
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Creator Risk Status (Moved from api.php to support session auth)
    Route::get('/api/creator/risk-status', [CreatorRiskController::class, 'getRiskStatus']);

    Route::get('/risk-test-panel', function () {
        return Inertia::render('RiskTestPanel');
    })->name('risk.test.panel');

    // Test Routes (Using Web Session)
    Route::prefix('api/test')->group(function () {
        Route::post('/risk/on', [TestRiskController::class, 'triggerRisk']);
        Route::post('/risk/off', [TestRiskController::class, 'clearRisk']);
        Route::post('/platform/freeze', [TestRiskController::class, 'triggerFreeze']);
        Route::post('/platform/normal', [TestRiskController::class, 'triggerNormal']);
        Route::post('/creator/reserve', [TestRiskController::class, 'setReservePercent']);
        Route::post('/creator/joined-days-ago', [TestRiskController::class, 'setCreatorJoinedDaysAgo']);
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Alternative subscription cancellation route to match frontend expectation
    Route::post('/subscriptions/{id}/cancel', [SubscriptionsController::class, 'cancelSubscriptionById'])
        ->name('subscriptions.cancel');

    // Undo a pending cancellation while the paid period is still running.
    Route::post('/subscriptions/{id}/resume', [SubscriptionsController::class, 'resumeSubscriptionById'])
        ->name('subscriptions.resume');

    // Comprehensive subscription management routes
    Route::prefix('subscriptions')->name('subscriptions.')->group(function () {
        Route::get('/', [SubscriptionsController::class, 'index'])->name('index');
        Route::get('/{id}', [SubscriptionsController::class, 'show'])->name('show');
    });

    // Email preference management routes
    Route::middleware(['auth'])->group(function () {
        Route::get('/email-preferences', [EmailPreferenceController::class, 'showPreferences'])->name('email.preferences');
        Route::post('/email-preferences/update', [EmailPreferenceController::class, 'updatePreferences'])->name('email.preferences.update');
        Route::post('/email-preferences/thankyou', [EmailPreferenceController::class, 'updatePreferencesFromThankyou'])->name('email.preferences.thankyou');
    });
});

// One-click unsubscribe route (no authentication required — must stay outside the auth group
// so logged-out users clicking the email link aren't bounced to login).
// The controller validates the signature itself via hasValidSignature() and redirects
// home with an error on an invalid/expired link, instead of the 'signed' middleware's
// bare 403 — friendlier for users clicking a stale link from an old email.
Route::get('/unsubscribe/{user}', [EmailPreferenceController::class, 'unsubscribe'])
    ->name('email.unsubscribe');

/*
 * Cold-outreach unsubscribe — for a CRM LEAD (`crm_creators`), not a user. The
 * link is minted by the ADMIN app with the shared APP_KEY; the controller
 * validates the signature. Three segments, so it can never be shadowed by the
 * `/{username}/{page?}` profile catch-all. POST is RFC 8058 one-click from the
 * mail client — no session, no CSRF token (exempted in VerifyCsrfToken).
 */
Route::get('/outreach/unsubscribe/{lead}', [OutreachUnsubscribeController::class, 'show'])
    ->whereNumber('lead')
    ->name('outreach.unsubscribe');
Route::post('/outreach/unsubscribe/{lead}', [OutreachUnsubscribeController::class, 'oneClick'])
    ->whereNumber('lead')
    ->name('outreach.unsubscribe.one-click');

/*
 * The preference centre, reachable from an e-mail WITHOUT logging in.
 *
 * 🚨 OUTSIDE THE `auth` GROUP, AND THAT IS THE WHOLE POINT. Two things used to
 * make it impossible for a non-active creator to stop the mail — which the
 * client brief calls out by name:
 *
 *   1. `/email-preferences` sits behind `auth`, and at the time
 *      `CheckSuspendedUser` force-logged-out `suspended_account = 1` on EVERY web
 *      request, so a suspended creator could neither reach the page nor sign in to
 *      reach it. ⚠️ SUPERSEDED 3 Sep 2026 — a suspended account signs in and reads
 *      now. Somebody with no session at all still has only this route.
 *   2. The e-mailed link expired after 24 hours, so opening Monday's e-mail on
 *      Wednesday ended at "invalid or expired link".
 *
 * Together: mail you cannot turn off. The link is signed and now lives 30 days
 * (matching `generateCheckoutReminderOptOut`, which already used 30 for this
 * reason), and the controller validates the signature itself.
 *
 * ⚠️ Run `php artisan ziggy:generate` after adding these — `generateManageToken()`
 * returns null for an unregistered route rather than throwing, because it is
 * called from inside `Mailable::content()` and a missing route would otherwise
 * take the whole birthday e-mail down instead of dropping one footer link.
 */
Route::get('/email-preferences/manage/{user}', [EmailPreferenceController::class, 'manage'])
    ->name('email.preferences.manage');
Route::post('/email-preferences/manage/{user}', [EmailPreferenceController::class, 'updateManaged'])
    ->name('email.preferences.manage.update');

// Dismiss membership offer via signed link in email
Route::get('/membership-offer/dismiss-link', [ThankYouController::class, 'dismissMembershipOfferViaLink'])
    ->name('membership-offer.dismiss-link');

// Guest opt-out from abandoned-checkout reminders. A guest has no account, so the
// route above (which needs a user id) cannot serve them — the opt-out is recorded
// against the email address instead. Signature validated in the controller, same as
// the route above, so a stale link redirects home rather than showing a bare 403.
Route::get('/checkout-reminders/stop/{checkout}', [EmailPreferenceController::class, 'stopCheckoutReminders'])
    ->name('checkout-reminders.stop');

// Sold-out waitlist. Public on purpose: making someone create an account on a sold-out
// page throws away the demand this exists to capture. Throttled, and `join` carries the
// same Turnstile gate as the other endpoints a logged-out visitor can POST to.
Route::post('/waitlist/join', [StockWaitlistController::class, 'join'])
    ->middleware('throttle:20,1')
    ->name('waitlist.join');
Route::post('/waitlist/leave', [StockWaitlistController::class, 'leave'])
    ->middleware('throttle:20,1')
    ->name('waitlist.leave');
// Signature checked in the controller so a stale link redirects home rather than 403ing.
Route::get('/waitlist/stop/{waitlist}', [StockWaitlistController::class, 'leaveViaLink'])
    ->name('waitlist.leave-link');

// Select Default Currency
Route::get('/currency/{c}', function (Request $request, $c) {
    if (in_array($c, ['USD', 'GBP', 'EUR', 'INR', 'AUD', 'JPY', 'HKD', 'CAD', 'CHF', 'SEK', 'NZD'])) {
        Cookie::queue('currency', $c, 60 * 24 * 365);

        return back()->with('success', "Currency set to $c");
    }

    return back()->with('error', 'Invalid Currency!');
})->name('change.currency');

/*
| Scratch/test routes — local and testing only.
|
| These were reachable on every deployed environment with no authentication:
| they send real email, hit Stripe, and expose currency/API debug output. Dev is
| a publicly reachable host, so "not production" would not have been a guard
| either — this group is closed everywhere except a developer's own machine.
*/
Route::prefix('test')->name('test.')->middleware('localonly')->group(function () {
    Route::prefix('stripe')->name('stripe.')->group(function () {
        Route::get('search', [TestController::class, 'stripeSearch'])->name('search');
        Route::get('checkout', [CheckoutController::class, 'testCheckout'])->name('checkout');
        Route::get('checkout-callback/{status?}', [CheckoutController::class, 'testCallback'])->name('callback');
    });
    Route::get('adult-content-check', [TestController::class, 'testAdultContent'])->name('adult-check');
    Route::get('email', [TestController::class, 'testEmail']);
    Route::get('founder-email', [TestController::class, 'testFounderEmail']);
    Route::get('debug-user-status', [TestController::class, 'debugUserStatus'])->middleware('auth');
    Route::get('rates/{c?}', [TestController::class, 'getRates']);
    Route::get('c-data', [TestController::class, 'testCurrencyData']);
    Route::get('x-api', [TwitterController::class, 'testToken']);
    Route::get('meta', [TestController::class, 'testMeta']);
    Route::get('x-1', [TestController::class, 'testX']);
    Route::get('items/{c?}', [TestController::class, 'testItems']);
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
        // ⚠️ Both files are served by ROUTES reading `resources/proxy/`, not from
        // `public/` — which is not reachable on this domain at all. These checks
        // read `public_path()`, so the one endpoint written to diagnose a missing
        // service worker reported it missing on every environment including the
        // ones where it works, and `manifest_content` was always null.
        'manifest_exists' => file_exists(resource_path('proxy/site.webmanifest')),
        'service_worker_exists' => file_exists(resource_path('proxy/service-worker.js')),
        'is_https' => request()->isSecure(),
        'host' => request()->getHost(),
        'user_agent' => request()->userAgent(),
        'manifest_content' => file_exists(resource_path('proxy/site.webmanifest'))
            ? json_decode(file_get_contents(resource_path('proxy/site.webmanifest')), true)
            : null,
    ]);
})->name('pwa.debug');

Route::get('/app/check', [AppController::class, 'appCheck'])->name('app.check');

if (app()->environment('local')) {
    // create bypass entry for all users in userVerificationEntry
    Route::get('seed-user-verification-status', [TestController::class, 'seedUserVerificationStatus']);

    Route::get('/magicbell/user-key', [NotificationController::class, 'getUserKey']);
    Route::post('/magicbell/send-notification', [NotificationController::class, 'sendNotification']);
    Route::get('/test-push', [NotificationController::class, 'testSendNotification']);

    // Debug: Test support image generation end-to-end (Node + PHP fallback)
    Route::get('/debug/test-support-image', [SupportImageTestController::class, 'run'])
        ->name('debug.test-support-image');
}

// Creator Dispute Pack Public Download (served from admin storage)
Route::get('/creator/dispute-packs/{disputeId}/{fileName}', function (Request $request, $disputeId, $fileName) {
    if (! $request->hasValidSignature()) {
        abort(Response::HTTP_FORBIDDEN, 'Invalid or expired link.');
    }

    $fileName = basename($fileName);

    /*
    | ⚠️ This reads the ADMIN app's storage over a sibling-directory path, which only
    | resolves when both apps sit in one folder on one machine. In production they are
    | two separate Vapor deployments with their own ephemeral Lambda filesystems, so
    | this path does not exist and the creator's emailed link cannot work.
    |
    | The admin's own "Download" button no longer depends on this — it streams the ZIP
    | back in the same request (see Admin\CreatorDisputePackController::download).
    | Fixing the *emailed* link needs shared storage (an S3 disk both apps can write to
    | and read from), because that link is opened hours or days later.
    */
    $adminStoragePath = base_path('../admin.spennypiggy.co/storage/app/dispute-packs/');
    $path = $adminStoragePath.$fileName;

    if (! File::exists($path)) {
        Log::warning('Dispute pack download failed: file not reachable from this app', [
            'file' => $fileName,
            'looked_in' => $adminStoragePath,
            'hint' => 'Expected on a shared filesystem. On Vapor the two apps do not share storage — this needs an S3 disk.',
        ]);

        abort(Response::HTTP_NOT_FOUND, 'This dispute pack is no longer available. Ask an admin to re-send it.');
    }

    return response()->download($path, $fileName);
})->middleware('signed')->name('creator.dispute-pack.download');

// Creator Activity Routes
Route::middleware('auth')->prefix('creator')->name('creator.')->group(function () {
    Route::get('/activity', [CreatorActivityController::class, 'index'])->name('activity');
    Route::get('/activity/status', [CreatorActivityController::class, 'getActivityStatus'])->name('activity.status');
    Route::post('/activity/refresh', [CreatorActivityController::class, 'refreshActivity'])->name('activity.refresh');
    Route::get('/activity/suggestions', [CreatorActivityController::class, 'getSuggestions'])->name('activity.suggestions');

    // Creator Subscription Routes
    Route::get('/subscription/status', [CreatorSubscriptionController::class, 'getSubscriptionStatus'])->name('subscription.status');
    Route::post('/subscription/validate-payment', [CreatorSubscriptionController::class, 'validatePaymentSubscription'])->name('subscription.validate-payment');
    Route::get('/subscription/dashboard', [CreatorSubscriptionController::class, 'getDashboardInfo'])->name('subscription.dashboard');
    Route::get('/subscription/warnings', [CreatorSubscriptionController::class, 'getCreatorsNeedingWarnings'])->name('subscription.warnings');
    Route::post('/subscription/sync', [SubscriptionSyncController::class, 'syncCurrentUser'])->name('subscription.sync');

    // Dispute Portal Routes
    Route::get('/disputes', [DisputeController::class, 'index'])->name('disputes.index');
    Route::get('/disputes/{id}', [DisputeController::class, 'show'])->name('disputes.show');
    Route::post('/disputes/{id}/submit', [DisputeController::class, 'submitEvidence'])->name('disputes.submit');

    // Payout/Reserve Routes
    Route::get('/payouts/reserves', [CreatorPayoutController::class, 'getReserves'])->name('payouts.reserves');

    Route::get('/finance/review-holds', [ReviewHoldController::class, 'index'])->name('finance.review_holds');

    // Security Zone Routes
    Route::prefix('security')->name('security.')->group(function () {
        Route::get('/sessions', [SecurityController::class, 'getSessions'])->name('sessions');
        Route::post('/sessions/revoke', [SecurityController::class, 'revokeSession'])->name('sessions.revoke');
        Route::get('/blocked-users', [SecurityController::class, 'getBlockedUsers'])->name('blocked-users');
        Route::post('/block-user', [SecurityController::class, 'blockUser'])->name('block-user');
        Route::delete('/unblock-user/{id}', [SecurityController::class, 'unblockUser'])->name('unblock-user');
        Route::get('/search-users', [SecurityController::class, 'searchUsers'])->name('search-users');
    });
});

// 🚨 THIS ROUTE IS THE SERVICE WORKER — `public/service-worker.js` is not served
// on this domain and never was (only `public/build/**` is). `scripts/build-sw.js`
// writes `resources/proxy/service-worker.js`, and `MagicBellNotification.jsx`
// registers `/service-worker.js`. All three have to keep naming the same file.
Route::get('/service-worker.js', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(resource_path('proxy/service-worker.js'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'text/javascript',
        // ⚠️ A cached service-worker script is a deploy that never reaches the
        // installed app. Browsers bypass the HTTP cache for the worker only once
        // its cached copy is 24h old, so without this a creator can sit a full
        // day behind on the worker that decides their push and their caching.
        'Cache-Control' => 'no-cache, must-revalidate',
    ]);
})->name('service.worker');

// ⚠️ The offline page is PRECACHED by the service worker, so this route existing
// is what makes install succeed — `precacheAndRoute` fetches every entry during
// install and one 404 rejects the whole install, leaving the worker inactive and
// push dead with it. It answered 404 in production until 2026-08-15, which also
// meant `setCatchHandler` had nothing to serve and the branded offline screen had
// never been seen by anyone.
// 🚨 THE SOURCE FILE LIVES IN `resources/proxy/`, NOT IN `public/`.
//
// Vapor uploads everything under `public/` to S3/CloudFront and STRIPS IT FROM
// THE LAMBDA PACKAGE, so `file_get_contents(public_path('offline.html'))` threw
// `Failed to open stream: No such file or directory` in production while working
// perfectly on every developer's machine. That 500 also broke service-worker
// INSTALL — `precacheAndRoute` fetches this URL during install and one failure
// rejects the whole worker, taking push and offline caching with it.
//
// `resources/proxy/` is the existing house location for exactly this: the PWA
// icons are served the same way, for the same reason. `scripts/build-sw.js`
// hashes the file from there too — the two must name the same path.
Route::get('/offline.html', function () {
    $path = resource_path('proxy/offline.html');

    abort_unless(is_file($path), 404);

    // ⚠️ The page carries a real inline <script> and the CSP has no 'unsafe-inline',
    // so the per-request nonce SecurityHeaders shares must be substituted in. Without
    // it the block is refused and the offline screen cannot report the connection
    // returning — on the one screen a user sees when everything else has failed.
    $html = str_replace(
        '__CSP_NONCE__',
        e((string) view()->shared('cspNonce', '')),
        file_get_contents($path)
    );

    return response($html, 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'X-Robots-Tag' => 'noindex, nofollow',
    ]);
})->name('offline.page');

Route::get('/new-service-worker.js', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(resource_path('proxy/service-worker.js'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'text/javascript',
    ]);
})->name('new-service-worker');

Route::get('/site.webmanifest', function () {
    $assetRoot = rtrim(asset('/'), '/');
    // ⚠️ The file is `site.webmanifest`, with no extension. This read asked for
    // `site.webmanifest.json`, so the route answered 500 on every request —
    // silently, because nothing renders a manifest failure.
    $content = file_get_contents(resource_path('proxy/site.webmanifest'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'text/json',
    ]);
})->name('site.manifest.file');

Route::get('/manifest.json', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(resource_path('proxy/manifest.json'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'text/json',
    ]);
})->name('manifest.file');

/*
 * 🚨 `/apple-touch-icon.png` answered 404 in production (measured 14 Aug 2026)
 * while every sibling icon resolved, because a file under `public/` is not served
 * on the app domain and this one had no proxy route. That is the iOS home-screen
 * icon AND the 180x180 entry in `site.webmanifest`, so an installed app carried a
 * blank tile. Do not delete this in favour of the file in `public/`.
 */
Route::get('/apple-touch-icon.png', function () {
    return response()->file(resource_path('proxy/apple-touch-icon.png'), [
        'Content-Type' => 'image/png',
        'Cache-Control' => 'public, max-age=31536000, immutable',
    ]);
})->name('apple.touch.icon.file');

/*
 * iOS launch images (`apple-touch-startup-image`).
 *
 * ⚠️ The basename is resolved against `PwaSplash::knows()`, never joined from raw
 * request input — it becomes a filesystem path. The route pattern only narrows
 * the shape; the allow-list is what makes it safe.
 */
Route::get('/ios-splash/{file}.png', function (string $file) {
    abort_unless(PwaSplash::knows($file), 404);

    return response()->file(resource_path('proxy/splash/'.$file.'.png'), [
        'Content-Type' => 'image/png',
        'Cache-Control' => 'public, max-age=31536000, immutable',
    ]);
})->where('file', '[0-9]{3,4}x[0-9]{3,4}')->name('ios.splash');

Route::get('/android-chrome-192x192.png', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(filename: resource_path('proxy/android-chrome-192x192.png'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'image/png',
    ]);
})->name('192.image.file');

Route::get('/android-chrome-512x512.png', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(filename: resource_path('proxy/android-chrome-512x512.png'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'image/png',
    ]);
})->name('512.image.file');

Route::get('/favicon-16x16.png', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(filename: resource_path('proxy/favicon-16x16.png'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'image/png',
    ]);
})->name('16.image.file');

Route::get('/favicon-32x32.png', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(filename: resource_path('proxy/favicon-32x32.png'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'image/png',
    ]);
})->name('32.image.file');

Route::get('/splashscreen.png', function () {
    $assetRoot = rtrim(asset('/'), '/');
    $content = file_get_contents(filename: resource_path('proxy/splash.png'));
    $content = Str::replace('[ASSET_ROOT]', $assetRoot, $content);

    return response($content, 200, [
        'Content-Type' => 'image/png',
    ]);
})->name('splash.image.file');

// SEO Routes - Completely different paths to bypass all caching
Route::withoutMiddleware([])->group(function () {
    // New robots route with different name
    Route::get('/app-robots-file', [SeoController::class, 'robotsTxt'])->name('app.robots');

    // New sitemap routes with different names
    Route::get('/app-sitemap-index', [SitemapController::class, 'index'])->name('app.sitemap.index');
    Route::get('/app-sitemap-pages', [SitemapController::class, 'static'])->name('app.sitemap.static');
    Route::get('/app-sitemap-users', [SitemapController::class, 'creators'])->name('app.sitemap.creators');
    Route::get('/app-sitemap-items', [SitemapController::class, 'wishlists'])->name('app.sitemap.wishlists');
    Route::get('/app-sitemap-posts', [SitemapController::class, 'posts'])->name('app.sitemap.posts');

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
        $content .= "Allow: /how-spenny-piggy-works\n";
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
        $content = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $content .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        $content .= '  <sitemap>'."\n";
        $content .= '    <loc>'.$siteUrl.'/dynamic-sitemap-pages</loc>'."\n";
        $content .= '    <lastmod>'.now()->toW3cString().'</lastmod>'."\n";
        $content .= '  </sitemap>'."\n";
        $content .= '  <sitemap>'."\n";
        $content .= '    <loc>'.$siteUrl.'/dynamic-sitemap-users</loc>'."\n";
        $content .= '    <lastmod>'.now()->toW3cString().'</lastmod>'."\n";
        $content .= '  </sitemap>'."\n";
        $content .= '  <sitemap>'."\n";
        $content .= '    <loc>'.$siteUrl.'/dynamic-sitemap-items</loc>'."\n";
        $content .= '    <lastmod>'.now()->toW3cString().'</lastmod>'."\n";
        $content .= '  </sitemap>'."\n";
        $content .= '  <sitemap>'."\n";
        $content .= '    <loc>'.$siteUrl.'/dynamic-sitemap-posts</loc>'."\n";
        $content .= '    <lastmod>'.now()->toW3cString().'</lastmod>'."\n";
        $content .= '  </sitemap>'."\n";
        $content .= '</sitemapindex>'."\n";

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
            ['url' => '/how-spenny-piggy-works', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/terms-and-conditions', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/paid-tasks-terms', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/content-payment-policy', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/register', 'priority' => '0.6', 'changefreq' => 'weekly'],
            ['url' => '/login', 'priority' => '0.6', 'changefreq' => 'weekly'],
            ['url' => '/creators', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/stripe-safe', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['url' => '/creators/keep-100', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/features', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/memberships', 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['url' => '/creators/disputes', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['url' => '/creators/founder-bonus', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/discovery', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/link-in-bio', 'priority' => '0.7', 'changefreq' => 'weekly'],

            /*
             * The comparison build (client spec v4.3). ⚠️ Server-rendering a page
             * is only half of being found — a page in no sitemap is discovered
             * only by crawling an internal link to it, which is slower and less
             * reliable on a site this size. The four live pages were missing here
             * until 29 Aug 2026.
             *
             * 🚨 THE `/creators/vs/{slug}` PAGES ARE DELIBERATELY NOT LISTED AS A
             * GROUP. Each is added by name only once its sheet is published —
             * submitting a URL that answers 404 (which every draft sheet does in
             * production) teaches Search Console the path is dead.
             */
            ['url' => '/creators/wishlist', 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['url' => '/creators/compare', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/creators/vs/wishlist', 'priority' => '0.7', 'changefreq' => 'monthly'],
            ['url' => '/creators/vs/link-in-bio', 'priority' => '0.7', 'changefreq' => 'monthly'],
            // Published 30 Aug 2026. Every fee row on that sheet carries a value
            // read from Throne's own help centre with the date it was read, and
            // `CompetitorSheet::assertValid()` now REFUSES to build a published
            // sheet that still has a `verify` row — so "published" and "checked"
            // can no longer drift apart the way the by-name rule above assumes.
            ['url' => '/creators/vs/throne', 'priority' => '0.7', 'changefreq' => 'monthly'],
            // Published 31 Aug 2026. Sourced to WishTender's own posts; no fee
            // table and no `verify` row, which the publish guard enforces.
            ['url' => '/creators/vs/wishtender', 'priority' => '0.7', 'changefreq' => 'monthly'],
            // Published 31 Aug 2026 once all five fee rows were cleared against
            // Linktree's own pages. See the sheet's docblock.
            ['url' => '/creators/vs/linktree', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ];

        $content = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $content .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($staticPages as $page) {
            $content .= '  <url>'."\n";
            $content .= '    <loc>'.$siteUrl.$page['url'].'</loc>'."\n";
            $content .= '    <lastmod>'.now()->toW3cString().'</lastmod>'."\n";
            $content .= '    <changefreq>'.$page['changefreq'].'</changefreq>'."\n";
            $content .= '    <priority>'.$page['priority'].'</priority>'."\n";
            $content .= '  </url>'."\n";
        }

        $content .= '</urlset>'."\n";

        return response($content, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Thu, 01 Jan 1970 00:00:00 GMT',
        ]);
    })->name('dynamic.sitemap.pages');

    Route::get('/dynamic-sitemap-users', [SitemapController::class, 'creators'])->name('dynamic.sitemap.users');
    Route::get('/dynamic-sitemap-items', [SitemapController::class, 'wishlists'])->name('dynamic.sitemap.items');
    Route::get('/dynamic-sitemap-posts', [SitemapController::class, 'posts'])->name('dynamic.sitemap.posts');

    // SEO Status Page
    Route::get('/seo-status', function () {
        $siteUrl = config('app.url');
        $html = '<!DOCTYPE html><html><head><title>SEO Files Status</title></head><body>';
        $html .= '<h1>SEO Files - Working URLs</h1>';
        $html .= '<p>These URLs bypass all caching and serve dynamic content:</p>';
        $html .= '<ul>';
        $html .= '<li><strong>Robots.txt:</strong> <a href="'.$siteUrl.'/dynamic-robots" target="_blank">'.$siteUrl.'/dynamic-robots</a></li>';
        $html .= '<li><strong>Sitemap Index:</strong> <a href="'.$siteUrl.'/dynamic-sitemap" target="_blank">'.$siteUrl.'/dynamic-sitemap</a></li>';
        $html .= '<li><strong>Pages Sitemap:</strong> <a href="'.$siteUrl.'/dynamic-sitemap-pages" target="_blank">'.$siteUrl.'/dynamic-sitemap-pages</a></li>';
        $html .= '<li><strong>Users Sitemap:</strong> <a href="'.$siteUrl.'/dynamic-sitemap-users" target="_blank">'.$siteUrl.'/dynamic-sitemap-users</a></li>';
        $html .= '<li><strong>Items Sitemap:</strong> <a href="'.$siteUrl.'/dynamic-sitemap-items" target="_blank">'.$siteUrl.'/dynamic-sitemap-items</a></li>';
        $html .= '</ul>';
        $html .= '<h2>Submit to Search Engines:</h2>';
        $html .= '<p>Use this URL for search engine submission:</p>';
        $html .= '<code>'.$siteUrl.'/dynamic-sitemap</code>';
        $html .= '</body></html>';

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    })->name('seo.status');
});

// Redirect old URLs to new SEO URLs
Route::get('/robots.txt', [SeoController::class, 'robots'])->name('robots.txt');

// Added to ensure the direct route works without any redirection interference
Route::get('/sitemap.xml', [SitemapController::class, 'customSitemap'])->name('sitemap.custom');

Route::get('/seo/sitemap-static.xml', [SitemapController::class, 'static'])->name('sitemap.static.redirect');
Route::get('/seo/sitemap-creators.xml', [SitemapController::class, 'creators'])->name('sitemap.creators.redirect');
Route::get('/seo/sitemap-wishlists.xml', [SitemapController::class, 'wishlists'])->name('sitemap.wishlists.redirect');
Route::get('/seo/sitemap-posts.xml', [SitemapController::class, 'posts'])->name('sitemap.posts.redirect');
Route::get('/seo/sitemap-shop-items.xml', [SitemapController::class, 'shopItems'])->name('sitemap.shop-items.redirect');
Route::get('/seo/sitemap-tasks.xml', [SitemapController::class, 'tasks'])->name('sitemap.tasks.redirect');
Route::get('/seo/sitemap-help.xml', [SitemapController::class, 'help'])->name('sitemap.help');

// SEO Cache management route (for post-deployment cache clearing)
Route::get('/seo/clear-cache', [SitemapController::class, 'clearCache'])->name('seo.clear.cache');

// Enhanced 404 Error Page
Route::get('/404', [ErrorController::class, 'show404'])->name('error.404');

// Health Check Endpoints for CI/CD Pipeline
Route::get('/ping', function () {
    return response('pong', 200)->header('Content-Type', 'text/plain');
})->name('ping');
Route::get('/health', [HealthController::class, 'index'])->name('health.check');
Route::get('/health/detailed', [HealthController::class, 'detailed'])->name('health.detailed');

// The cover picker's catalogue. Fetched when the picker opens rather than
// shared on every page: it is a static list behind a button, and shipping it
// with every response is 2.5KB nobody asked for.
//
// ⚠️ MUST stay above the auth.php require: that file ends with the
// `/{username}/{page?}` profile catch-all, and Laravel matches in registration
// order — a single-segment path declared after it is read as a username and
// answered with the profile 404, never reaching this closure.
Route::get('/cover-banners', fn () => response()->json(PresetCovers::forPicker())
    ->header('Cache-Control', 'public, max-age=3600'))
    ->middleware(['auth', 'throttle:30,1'])
    ->name('cover-banners');

/*
| Creator Growth Bonus — the ladder, the rules, and a signed-in creator's own
| progress. Public: it is advertised on the landing page, so a logged-out
| visitor deciding whether to sign up has to be able to read it.
|
| 404s while `growth_bonus.enabled` is false (guard in the controller), so the
| scheme stays dark until the client's terms are published.
|
| ⚠️ Single-segment path, so it MUST stay above the auth.php require or the
| profile catch-all reads `growth-bonus` as a username.
*/
Route::get('/growth-bonus', [GrowthBonusController::class, 'index'])
    ->name('growth.bonus');

/*
| Sign-up waitlist — the lead we used to throw away.
|
| Public and unauthenticated by necessity: the whole audience is people the
| platform has just refused an account to, so there is nobody to authenticate.
| Turnstile + a tight throttle stand in for that, and the endpoint answers
| identically whatever it stores, so it cannot be used to ask whether an address
| already has an account.
|
| ⚠️ Above the auth.php require, same reason as `/cover-banners` — the profile
| catch-all would otherwise read this as a username.
*/
Route::post('/signup-waitlist', [SignupWaitlistController::class, 'join'])
    ->middleware('throttle:5,1')
    ->name('signup.waitlist');

/*
| Web-push heartbeat — the browser telling us it still has a live subscription.
|
| Push is registered entirely client-side, so this is the ONLY signal the server
| has that a user's notifications still work. Client-side throttled to once every
| PushReachability::HEARTBEAT_THROTTLE_HOURS; the rate limit here is the
| backstop for a client that ignores it.
|
| ⚠️ Same catch-all rule as above — must stay ABOVE the auth.php require.
*/
Route::post('/push/heartbeat', [PushSubscriptionController::class, 'heartbeat'])
    ->middleware(['auth', 'throttle:20,1'])
    ->name('push.heartbeat');

/*
| Guest purchase lookup — "where did my purchase go?" for someone with no account.
|
| Public by definition: guest checkout is allowed on Piggy Pot, Wishes and the Piggy
| Bank, so these supporters have nothing to sign in to. Same catch-all rule as above —
| single-segment paths must stay ABOVE the auth.php require.
|
| Throttled hard: `send` is an unauthenticated endpoint that sends mail, and `show`
| renders paid content.
*/
Route::get('/find-my-purchase', [GuestPurchaseController::class, 'form'])->name('guest-purchases.form');
Route::post('/find-my-purchase', [GuestPurchaseController::class, 'send'])
    ->middleware('throttle:5,1')
    ->name('guest-purchases.send');
Route::get('/my-purchases-link', [GuestPurchaseController::class, 'show'])
    ->middleware('throttle:30,1')
    ->name('guest-purchases.show');

/*
| Brand assets — the email signatures, handed to the team and to partners.
|
| Public and unauthenticated on purpose: the people who install these do not all
| have accounts, and the page discloses nothing that is not already on the site
| footer and in the Terms of Service. It carries noindex in two places
| (StaticPageSeoMiddleware and the controller) and a robots.txt Disallow.
|
| ⚠️ Same catch-all rule as the routes above — `/{username}/{page?}` matches two
| segments as readily as one, so `/brand/email-signatures` declared after the
| auth.php require would be read as the profile of a user called "brand".
*/
Route::get('/brand/email-signatures', [BrandAssetController::class, 'emailSignatures'])
    ->name('brand.email-signatures');

// require __DIR__.'/auth.php'; // moved below founder routes

// Debug routes for wish creation issue.
// Local/testing only — it reports the caller's account_id, charges_enabled,
// identity_status and subscription_status, which is diagnostic data with no place
// on a public host (the deployed dev environment is publicly reachable).
if (app()->environment('local', 'testing')) {
    require __DIR__.'/debug-wish.php';
}

// Email template preview / send debug tool
require __DIR__.'/debug-emails.php';

// Founder routes are now defined in auth.php

// Admin Founder Bonus Routes
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->group(function () {
    Route::get('/founder/bonuses', [FounderBonusAdminController::class, 'index'])->name('admin.founder/bonuses.index');
    Route::get('/founder/bonuses/data', [FounderBonusAdminController::class, 'getBonuses'])->name('admin.founder/bonuses.data');
    Route::get('/founder/bonuses/export', [FounderBonusAdminController::class, 'exportCsv'])->name('admin.founder/bonuses.export');
    Route::post('/founder/bonuses/{type}/{id}/approve', [FounderBonusAdminController::class, 'approvePayout'])->name('admin.founder/bonuses.approve');
    Route::post('/founder/bonuses/{type}/{id}/reject', [FounderBonusAdminController::class, 'rejectPayout'])->name('admin.founder/bonuses.reject');
    Route::post('/founder/bonuses/{type}/{id}/mark-paid', [FounderBonusAdminController::class, 'markAsPaid'])->name('admin.founder/bonuses.mark-paid');
    Route::post('/founder/bonuses/trigger-qualification-check', [FounderBonusAdminController::class, 'triggerQualificationCheck'])->name('admin.founder/bonuses.trigger-qualification');
    Route::post('/founder/bonuses/trigger-monthly-calculation', [FounderBonusAdminController::class, 'triggerMonthlyCalculation'])->name('admin.founder/bonuses.trigger-monthly-calculation');
    Route::get('/founder/bonus-settings', [FounderBonusAdminController::class, 'getSettings'])->name('admin.founder/bonus-settings.get');
    Route::post('/founder/bonus-settings', [FounderBonusAdminController::class, 'updateSettings'])->name('admin.founder/bonus-settings.update');
    Route::get('/founder/bonus-settings-page', function () {
        return Inertia::render('Admin/FounderBonus/Settings');
    })->name('admin.founder/bonus-settings.page');

    // Task Purchases Admin
    Route::get('/tasks', [TaskPurchaseController::class, 'index'])->name('admin.tasks.index');
    Route::post('/tasks/{uuid}/resolve', [TaskPurchaseController::class, 'resolve'])->name('admin.tasks.resolve');

    // Policy Change Notifications
    Route::get('/policy-notifications', [PolicyNotificationController::class, 'index'])->name('admin.policy-notifications.index');
    Route::post('/policy-notifications/trigger', [PolicyNotificationController::class, 'trigger'])->name('admin.policy-notifications.trigger');
    Route::post('/policy-notifications/deactivate', [PolicyNotificationController::class, 'deactivate'])->name('admin.policy-notifications.deactivate');

    // Feature Suggestions Admin
    Route::get('/feature-suggestions', function (Request $request) {
        $query = FeatureSuggestion::with('user')->latest();

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
            'suggestions' => $query->paginate(20)->appends($request->query()),
            'filters' => $request->only(['status', 'search']),
        ]);
    })->name('admin.feature-suggestions.index');

    Route::patch('/feature-suggestions/{suggestion}/status', [FeatureSuggestionController::class, 'updateStatus'])->name('admin.feature-suggestions.update-status');
});

/*
| System Diagnostics.
|
| Open (no auth) on local/testing so the page can be used while developing.
|
| Everywhere else it is reachable ONLY by clicking through from the admin app.
| It returns the last ERROR/CRITICAL lines of the application log (payment intent
| ids, buyer emails, stack traces), platform financial-integrity row ids, disk and
| migration state, and which secrets are configured — and its Stripe test path
| creates a real Connect Express account on every deep run.
|
| It cannot be gated with this app's `admin` middleware, which tests
| `users.role === '2'` and therefore answers 403 to literally everyone: the real
| administrators are rows in the `admins` table, which this app has no auth guard
| for. So the gate is a hand-off instead — admin.spennypiggy.co authenticates the
| admin (`auth:admin` + `2fa`), signs a short-lived link with a shared secret, and
| `unlock` below trades that link for a session flag. See
| App\Http\Middleware\EnsureSystemDiagnosticsAccess.
|
| Note the deployed `development` environment is a publicly reachable host, so it
| is NOT on the open list.
*/
Route::get('admin/system-diagnostics/unlock', [SystemDiagnosticsController::class, 'unlock'])
    ->middleware('throttle:10,1')
    ->name('admin.system-diagnostics.unlock');

Route::get('admin/system-diagnostics', [SystemDiagnosticsController::class, 'index'])
    ->middleware('sysdiag')
    ->name('admin.system-diagnostics.index');

// Throttled because the sweep is real work (~10s, 538 routes + 210 files parsed) — a limit
// belongs here even behind the hand-off gate, since one unlocked session can still hold the
// button down.
Route::post('admin/system-diagnostics/run', [SystemDiagnosticsController::class, 'run'])
    ->middleware(['sysdiag', 'throttle:10,1'])
    ->name('admin.system-diagnostics.run');

Route::get('admin/system-diagnostics/history', [SystemDiagnosticsController::class, 'history'])
    ->middleware(['sysdiag', 'throttle:30,1'])
    ->name('admin.system-diagnostics.history');

// Ensure auth routes (including catch-all) load AFTER explicit founder routes
// Sentry smoke test — anyone could write an event into the production Sentry project.
if (app()->environment('local', 'testing')) {
    Route::get('/debug-sentry', function () {
        if (app()->bound('sentry')) {
            app('sentry')->captureMessage('Sentry Test Message from spennypiggy.co Backend');

            return response()->json(['message' => 'Sentry test message sent from Backend. Check your dashboard!']);
        }

        return response()->json(['error' => 'Sentry not bound in container'], 500);
    });
}

/*
|--------------------------------------------------------------------------
| Help Centre
|--------------------------------------------------------------------------
| ⚠️ MUST stay above `require auth.php`. That file ends with the
| `/{username}/{page?}` profile catch-all and Laravel matches in registration
| order — `/help` declared below it is read as a creator named "help" and
| answered with the profile 404. `route:list` shows the route either way, which
| is exactly what makes this invisible.
|
| ⚠️ Order WITHIN this group matters too: `/help/search` must be declared before
| `/help/{category}` or "search" is matched as a category slug.
|
| Public and unauthenticated by design. Guests get no Intercom (its provider
| returns early when logged out), so for them this is the only self-serve route
| there is.
*/
Route::prefix('help')->name('help.')->group(function () {
    // Server-rendered — the Help Centre index is a public, crawlable page.
    // ⚠️ The three PAGE routes in this group carry 'ssr'; the rest are JSON.
    Route::get('/', [HelpController::class, 'index'])->middleware('ssr')->name('index');

    // JSON. Throttled because search sorts a corpus on every keystroke.
    Route::get('/search', [HelpController::class, 'search'])
        ->middleware('throttle:60,1')
        ->name('search');

    // Ask a question in ordinary language. Generation costs money on a public
    // endpoint, so this carries a tighter throttle than search AND a per-IP
    // hourly cap inside the controller.
    Route::post('/ask', [HelpController::class, 'ask'])
        ->middleware('throttle:20,1')
        ->name('ask');

    // Aggregate counters only; nothing here identifies the voter.
    Route::post('/feedback', [HelpController::class, 'feedback'])
        ->middleware('throttle:30,1')
        ->name('feedback');

    // JSON, one article by exact slug, for contextual help panels. Declared
    // above /help/{category} or "inline" is matched as a category slug.
    Route::get('/inline/{slug}', [HelpController::class, 'inline'])
        ->middleware('throttle:60,1')
        ->name('inline');

    // 🚨 SERVER-RENDERED, and that is the whole point of a help centre.
    // Without 'ssr' these two answered with the app shell and nothing else: the
    // meta tags and the header, then an empty <div id="app">. Google renders JS
    // and could read them; Bing and every AI assistant people now ask questions
    // of cannot, so ~70 answers existed and were machine-unreadable while the
    // index above them was fine — which is exactly what makes it invisible.
    // Reported 4 Sep 2026 by a client fetching the live site.
    //
    // ⚠️ Both were checked before the flag went on, not assumed: Article.jsx and
    // Category.jsx use the same AuthenticatedLayout and the same Help components
    // the index already renders, and every browser global they touch
    // (document.addEventListener in HelpSearchBar/HelpLink, window.Intercom in
    // StillNeedHelp) is inside a useEffect or an event handler. Nothing reads a
    // browser global at module scope or during render.
    Route::get('/{category}', [HelpController::class, 'category'])->middleware('ssr')->name('category');
    Route::get('/{category}/{article}', [HelpController::class, 'article'])->middleware('ssr')->name('article');
});

/*
|--------------------------------------------------------------------------
| /.well-known/security.txt (RFC 9116)
|--------------------------------------------------------------------------
| Client Security Checklist §3 (Developer Master Plan, 19 Aug 2026).
|
| 🚨 MUST stay ABOVE `require auth.php`. That file ends with the
| `/{username}/{page?}` profile catch-all, which matches TWO segments — so
| `.well-known/security.txt` declared below it is read as a creator called
| ".well-known" and answered with the profile 404. `route:list` shows the route
| either way, which is exactly what makes this invisible.
|
| 🚨 SERVED FROM A ROUTE, not from `public/.well-known/security.txt`. Vapor runs
| on Lambda and does not serve arbitrary files out of `public/` on the app domain
| — the same reason this app parks `public/robots.txt.backup` and answers robots
| from `SeoController::robotsTxt`. The static file is kept in the repo for plain
| web servers and must be kept in step with the literals below.
|
| ⚠️ `security@spennypiggy.co` MUST BE CONFIRMED TO EXIST AND BE MONITORED before
| this ships. An address in this file that bounces is worse than no file: it tells
| a finder we invite reports and then swallows them. Whoever owns the Google
| Workspace domain needs to create or alias it.
|
| ⚠️ `Expires` is a HARD DATE, deliberately not `now()->addYear()`. The field's
| whole purpose is to prove somebody still maintains this; a date that rolls
| forward on every request proves nothing. RFC 9116 requires under a year out —
| renew it, and the static copy, before 19 Aug 2027.
*/
Route::get('/.well-known/security.txt', function () {
    $content = implode("\n", [
        'Contact: mailto:security@spennypiggy.co',
        'Expires: 2027-08-19T23:59:59.000Z',
        'Preferred-Languages: en',
        'Canonical: https://spennypiggy.co/.well-known/security.txt',
    ])."\n";

    return response($content, 200, [
        'Content-Type' => 'text/plain; charset=utf-8',
        'Cache-Control' => 'public, max-age=86400',
        'X-Robots-Tag' => 'noindex',
    ]);
})->name('security.txt');

/*
 * Creator-controlled push — Developer Master Plan, 19 Aug 2026, §E.
 *
 * 🚨 THROTTLED ON TOP OF THE SERVICE'S OWN LIMIT. The service allows one send a
 * day and records every attempt; this stops somebody hammering the endpoint to
 * discover what the moderation rules are, which is reconnaissance rather than
 * use. Two different jobs, both needed.
 *
 * ⚠️ Declared ABOVE `auth.php`, whose `/{username}/{page?}` catch-all would
 * otherwise read `creator-push` as a username and answer with the profile 404 —
 * `route:list` shows the route either way, which is what makes that hard to see.
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/creator-push/status', [CreatorPushController::class, 'status'])
        ->name('creator.push.status')
        ->middleware('throttle:30,1');

    Route::post('/creator-push', [CreatorPushController::class, 'send'])
        ->name('creator.push.send')
        ->middleware('throttle:10,60');
});

require __DIR__.'/auth.php';

// Quick middleware test — echoes the caller's email/role/subscription_status.
// Local/testing only; it exists to verify middleware wiring, not to run in production.
if (app()->environment('local', 'testing')) {
    Route::middleware(['auth', 'mustCompletedStripeIdentity', 'mustHaveToVerify'])
        ->get('/debug-middleware-test', function () {
            $user = auth()->user();

            return response()->json([
                'success' => true,
                'message' => 'Middleware passed successfully',
                'user' => $user instanceof User ? [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'subscription_status' => $user->subscription_status,
                ] : null,
            ]);
        });

    // Date-simulation helpers for subscription testing.
    require __DIR__.'/test-date.php';
}

// Test subscription routes (remove in production)
if (config('app.env') !== 'production') {
    require __DIR__.'/test-subscription.php';
}

// Dev helper: refresh logged-in creator's content dates to today.
// NEVER expose in production — it clears content_posting_paused_at and back-dates
// content, which would let a creator self-bypass the posting-cadence pause and the
// creator-activity payment gate (both are content-compliance controls).
if (config('app.env') !== 'production') {
    require __DIR__.'/dev-refresh-dates.php';
}

// Routes already defined above
// Removed duplicate purchases route

// Local preview route for pending approval email
// Only available in local/dev and for authenticated admins
Route::middleware(['web'])->group(function () {
    Route::get('/_preview/pending-approval', function () {
        if (! app()->isLocal()) {
            abort(403);
        }

        $items = app(PendingApprovalService::class)->collectPendingItems();

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

// Moved /task/* routes to routes/auth.php to respect username catch-all ordering

// Test Scheduler Route.
//
// Local only: it reports the cache driver and store names, which is deployment
// detail with no reason to be public. (Its own logic is also dead — $lastRun is
// hardcoded null, so it always answers "inactive". Real scheduler health is
// checked by the admin app's infra:health-check.)
Route::middleware('localonly')->get('/test/scheduler/is/running', function () {
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
        'diff_seconds' => $effectiveLastRun ? now()->diffInSeconds(Carbon::parse($effectiveLastRun)) : null,
        'cache_driver' => config('cache.default'),
        'cache_store' => config('cache.stores.'.config('cache.default').'.driver'),
    ]);
});

// Country detection — reads Cloudflare CF-IPCountry header, no external API needed
Route::get('/api/user-country', function (Request $request) {
    $country = $request->header('CF-IPCountry')
        ?? $request->header('X-Country-Code')
        ?? 'GB';
    // CF-IPCountry returns 'XX' for unknown — fall back to GB
    if ($country === 'XX' || strlen($country) !== 2) {
        $country = 'GB';
    }

    return response()->json(['country_code' => strtoupper($country)]);
})->name('api.user-country');

// Lazy video poster resolver — returns cached Uploadcare thumbnails, generates misses.
Route::post('/video-posters', [VideoPosterController::class, 'resolve'])
    ->middleware('throttle:60,1')
    ->name('video-posters.resolve');

// Method-aware supporter price preview (card vs bank) for the checkout selector.
Route::post('/payments/price-preview', [PaymentMethodController::class, 'preview'])
    ->middleware('throttle:60,1')
    ->name('payments.price-preview');

// Creator self-service: see / request bank payment capabilities on their own
// connected account (drives the "Enable bank payments" dashboard card).
Route::middleware('auth')->group(function () {
    Route::get('/payments/bank-status', [PaymentMethodController::class, 'bankStatus'])
        ->middleware('throttle:30,1')
        ->name('payments.bank-status');
    Route::post('/payments/enable-bank', [PaymentMethodController::class, 'enableBank'])
        ->middleware('throttle:6,1')
        ->name('payments.enable-bank');
});
