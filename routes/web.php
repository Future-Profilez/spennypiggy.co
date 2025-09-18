<?php

use App\Http\Controllers\Auth\CheckoutController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\WishitemController;
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
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'app' => config('app.name'),
        'environment' => config('app.env')
    ], 200);
})->name('health.check');

// Debug route to test subscription status
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
    $controller = new App\Http\Controllers\Auth\WishitemController();
    $response = $controller->authenticatedCartItems();
    
    return response()->json([
        'timestamp' => now(),
        'auth_id' => Auth::id(),
        'auth_user' => Auth::user() ? Auth::user()->only(['id', 'name', 'email']) : null,
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
    Artisan::call("db:seed --className=$seeder");
    return response()->json([
        'seed completed'
    ]);
});

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
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

Route::post('rye-webhook', [WishitemController::class, 'handleWebhook'])->name('rye.webhook');


// GiftStore Route
Route::get('/giftstore', function () {
    return Inertia::render('rye/GiftStore');
})->name('giftStore');


// Route::post('test-stripe', function (Request $request) {
//     $request = json_encode($request->all());
//     Log::info("webhook run: $request");
//     $a = "come in this condition";
//     return response()->json(['status' => 'done', 'message' => $a], 200);
// })->name('test.stripe');

Route::post('subscription-update-status', [StripeController::class, 'subscriptionUpdateStatus']);

Route::get('create-product-for-creator-and-gifter', [StripeWebhookController::class, 'CreateProductForCreatorAndGifter']);

// routes/web.php or routes/api.php

Route::get('delete-all-products', [TestController::class, 'deleteAllProducts'])->name('delete.all.products');

// delete all products from stripe
Route::get('archived-all-products', [TestController::class, 'archiveAllStripeProducts'])->name('archived.all.products');

Route::get('send-identity-verification-failed-emails', [TestController::class, 'sendFailedVerificationEmails']);

Route::get('create-product/{price}', [StripeController::class, 'makeProductId'])->name('create.product');

//check referal code
Route::get('check-coupon-code/{code}', [RegisteredUserController::class, 'checkCouponCode'])->name('checkCouponCode');

Route::post("/username-availablity", [RegisteredUserController::class, "checkUsername"])->name("check.username");

// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Purchases route
    Route::get('/purchases', [\App\Http\Controllers\PurchasesController::class, 'index'])->name('purchases');
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

// create bypass entry for all users in userVerificationEntry
Route::get("seed-user-verification-status", [TestController::class, "seedUserVerificationStatus"]);

Route::get('/magicbell/user-key', [NotificationController::class, 'getUserKey']);
Route::post('/magicbell/send-notification', [NotificationController::class, 'sendNotification']);
Route::get('/test-push', [NotificationController::class, 'testSendNotification']);

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

// Health Check Endpoints for CI/CD Pipeline
Route::get('/health', [HealthController::class, 'index'])->name('health.check');
Route::get('/health/detailed', [HealthController::class, 'detailed'])->name('health.detailed');


require __DIR__.'/auth.php';
require __DIR__.'/test-date.php';

// Test subscription routes (remove in production)
if (config('app.env') !== 'production') {
    require __DIR__ . '/test-subscription.php';
}

// Routes already defined above
// Removed duplicate purchases route
