<?php

use App\Http\Controllers\Auth\CheckoutController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\TestController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
*/

Route::get('/send-test-mail', function () {
    Mail::raw('This is a test email. If you are seeing this, your mail configuration is working!', function ($message) {
        $message->to('prem@futureprofilez.com')
            ->subject('Test Email');
    });
    return 'Test email sent!';
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

Route::post('stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);

Route::get('send-identity-verification-failed-emails', [TestController::class, 'sendFailedVerificationEmails']);

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


require __DIR__ . '/auth.php';
