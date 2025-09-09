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


require __DIR__ . '/auth.php';
