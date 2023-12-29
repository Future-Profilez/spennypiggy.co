<?php

use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\CheckoutController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\LeaderBoardController;
use App\Http\Controllers\Auth\MyController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\SocialLinksController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WishtenderController;
use App\Http\Middleware\VerifyCsrfToken;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\StripeControl;
use Illuminate\Support\Facades\Http;

// Route::get('/frd', function () {
//     print_r('ffff');
//     die;
// });



Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login-user', [AuthenticatedSessionController::class, 'store'])->name('login-user')->middleware('mustHaveToVerify');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('forgot-password/{uuid}', [PasswordResetLinkController::class, 'forgotPasswordPage']);


    Route::post('change-password/{uuid}', [PasswordResetLinkController::class, 'changePassword'])->name('changePassword');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});


Route::middleware('auth')->group(function () {

    /*send surprise amount*/
    Route::get('verification', [EmailVerificationPromptController::class, '__invoke'])->name('verification.notice');
    Route::get('email/send-verification-email', [EmailVerificationNotificationController::class, 'sendVerificationEmail'])
        ->name('verification.email');

    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::post('/say-thankyou/{payment_id}', [WishitemController::class, 'sayThanks'])->name('say-thankyou');

    Route::post('move-wish', [WishitemController::class, 'moveWishes'])->name('move-wish');

    Route::middleware('mustHaveToVerify')->group(function () {

        Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

        Route::put('password', [PasswordController::class, 'update'])->name('password.update');

        Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links');

        Route::post('save_wish_item', [WishitemController::class, 'addWishItem'])->name('save_wish_item');


        Route::post('/update_wish_item/{uuid}', [WishitemController::class, 'updateWishItem'])->name('update_wish_item');

        Route::prefix("stripe")->name("stripe.")->group(function () {
            Route::get("authorize", [StripeController::class, "index"])->name("index");
            Route::match(["get", "post"], "/connect-{step}/{country?}/{currency?}", [StripeController::class, "initConnect"])->name("connect");
            Route::get("/response", [StripeController::class, "connectReturn"])->name("return");
            Route::post("/login", [StripeController::class, "loginToStripe"])->name("login");
        });

        Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile');

        Route::post('save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');

        Route::get('account', function () {
            $auto_tweet = Auth::user()->auto_tweet == 1 ? true : false;
            return Inertia::render('accountsetting/Accountsetting',[
                'auto_tweet' => $auto_tweet
            ]);
        })->name("account");

        Route::get('auto-tweet-setting', [WishitemController::class, 'enableAutoTweet'])->name('auto-tweet-setting');

        Route::get('wish-tracker', [WishitemController::class, 'wishtrackerItems'])->name('wish-tracker');

        Route::get('user-tips', [WishitemController::class, 'userTips'])->name('user-tips');

        Route::get('subscriptions', [WishitemController::class, 'creatorSubscriptions'])->name('subscriptions');

        Route::get('subscribed', [WishitemController::class, 'userSubscribed'])->name('subscribed');

        Route::get('cancel-subscription/{subscription_id}', [WishitemController::class, 'cancelSubscription'])->name('cancel-subscription');

        Route::get('/read-status/{payment_id}/{type}', [WishitemController::class, 'readStatus'])->name('read-status');

        Route::get('/stripe', function () {
            return Inertia::render('stripe/Stripe');
        })->middleware(['auth', 'verified'])->name('stripe');

        Route::get('/pin-item/{wish_id}/', [WishitemController::class, 'pinItem'])->name('pin-item');

        // Twitter
        Route::prefix("twitter")->name("x.")->group(function () {
            Route::get('init', [TwitterController::class, 'authInit'])->name('init');
            Route::get('authorize', [TwitterController::class, 'handleAuth'])->name('handle');
            // Route::get('authorize', [TwitterController::class, 'handleOauth1'])->name('handle');
        });

        Route::post('add-goal', [WishitemController::class, 'addTipGoal'])->name('add-goal');
        Route::get('mark-complete-goal/{uuid}', [WishitemController::class, 'markJarComplete'])->name('mark-goal');
        Route::get('all-goals', [WishitemController::class, 'allGoalsCreators'])->name('all-goals');
    });
});

Route::get('counter/{deviceid}', [WishitemController::class, 'wish_counter'])->name('counter');

Route::get('cart-update-quantity/{uuid}/{quantity}', [WishitemController::class, 'updateCartQuantity'])->name('cart.updatequantity');

Route::get('cancel-subs/{uuid}', [StripeController::class, 'cancelSubs'])->name('cancel-subs');

Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
    ->name('password.request');

Route::get('/remove-from-cart/{uuid}', [WishitemController::class, 'removeSurpriseFromCart'])->name('remove-from-cart');

Route::get('/add-to-cart/{uuid}/{device_id}/{sub}/{amount?}', [WishitemController::class, 'addToCart'])->name('add-to-cart');

Route::get('/clear-cart/{device_id}/{ownerid}', [WishitemController::class, 'clearCart'])->name('clear-cart');

Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart');

Route::get('anonymous-cart/{deviceId}', [WishitemController::class, 'anonymousCartItems'])->name('anonymous-cart');

Route::get('user/{uuid}', [VerifyEmailController::class, 'emailVerify']);

Route::get('/create-checkout-session/{id}', [CheckoutController::class, 'createCheckout'])->name('create.checkout');

Route::get('/success-checkout/{id}', [CheckoutController::class, 'successCheckout'])->name('checkout.success');

Route::get('/cancel-checkout/{id}', [CheckoutController::class, 'cancelCheckout'])->name('checkout.cancel');

Route::get('/get_category_data/{category}/{user_id}', [WishitemController::class, 'categoryItems'])->name('get_category_data');

Route::get('users', [MyController::class, 'getUsers'])->name('users');

Route::post('/send-surprize', [WishitemController::class, 'sendSurprise'])->name('send-surprize');

Route::get('/how-it-works', function () {
    return Inertia::render('howitworks/Works');
})->name("how-it-works");

Route::get('/terms-and-conditions', function () {
    return Inertia::render('Terms');
})->name("terms-and-conditions");


Route::get('/promotion-terms', function () {
    return Inertia::render('Promotions');
})->name("promotion-terms");

Route::get('/files/{filename}', function (string $filename) {
    $fullPath = asset($filename);
    return Storage::response($fullPath);
});

Route::post('subs-status/', [StripeController::class, 'subscriptionStatus'])->name('subs-status')->withoutMiddleware(VerifyCsrfToken::class);

/* wishtender */
Route::get('leaderboard/{type?}', [LeaderBoardController::class, 'wishtenderWishers'])->name('wishtender-wishes');
Route::get('largest-gifts/{type?}', [LeaderBoardController::class, 'largestGifts'])->name('largest-gifts');

Route::get('/leaderboard/{type?}', [LeaderBoardController::class, 'wishtenderWishers'])->name('/leaderboard');

Route::prefix("tip-jar")->name("tip-jar.")->group(function () {
    Route::post('pay/{uuid}/', [StripeController::class, 'tipToJar'])->name("pay");
    Route::get('/handle/{uuid}/{status}', [StripeController::class, 'handleTipJarPayment'])->name('handle');
    Route::get('/list/{uuid}', [WishitemController::class, 'listGoal'])->name('list');
});

/*check username exist*/
// Route::get('/data-check', function () {
//     $ret = StripeControl::getSubscription("sub_1OND8tG7xsNScLmXLFzAhobA");

//     return $ret;
// });

Route::get('/test/test', function () {
    return Inertia::render('Test');
})->name("test");

Route::get('twitter-token/', [TwitterController::class, 'twitterAuthUrl']);
Route::get('twitter/login', [TwitterController::class, 'twitterLogin']);
Route::get('check-username/{username}', [AuthenticatedSessionController::class, 'checkUserName'])->name('check.username');

Route::get('sociallinks/{username}', [AuthenticatedSessionController::class, 'sociallinks'])->name('user.sociallinks');

Route::get('/{username}', [AuthenticatedSessionController::class, 'getUserProfile'])->name('user.show');
Route::get('/user_info/{username}/{category?}', [AuthenticatedSessionController::class, 'user_info'])->name('user.info');
Route::get('/items/{username}/{category_id?}', [AuthenticatedSessionController::class, 'userItems'])->name('user.items');
Route::get('/user_category/{username}', [AuthenticatedSessionController::class, 'user_category'])->name('user.info');

Route::prefix("wish")->name("wish.")->group(function () {
    Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [StripeController::class, 'wishItemSubscribe'])->name("subscribe.checkout");
    Route::get('/handle/{uuid}/{status}', [StripeController::class, 'handleSubscription'])->name('subscribe.handle');
});
