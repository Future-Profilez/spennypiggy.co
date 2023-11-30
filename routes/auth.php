<?php

use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\MyController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\SocialLinksController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\ProfileController;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\UserCategory;
use App\Models\WishCategory;

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

    // Route::post('verification', [RegisteredUserController::class, 'verification'])->name('verification.notice');

    // Route::get('verify-email', [EmailVerificationPromptController::class)])
    //     ->name('verification.notice');

    // Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
    //     ->middleware(['signed', 'throttle:6,1'])
    //     ->name('verification.verify');

    // Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
    //     ->middleware('throttle:6,1')
    //     ->name('verification.send');

    // Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
    //     ->name('password.confirm')->middleware('mustHaveToVerify');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store'])->middleware('mustHaveToVerify');

    Route::put('password', [PasswordController::class, 'update'])->name('password.update')->middleware('mustHaveToVerify');

    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    // Route::get('dashboard', [AuthenticatedSessionController::class, 'getUserProfile'])->name('dashboard');

    // Route::prefix("/")
    // $owner = Auth::user();
    // ['owner' => $user->id == $owner->id ? true : false// ]

    Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links')->middleware('mustHaveToVerify');

    Route::post('save_wish_item', [WishitemController::class, 'saveWishItem'])->name('save_wish_item')->middleware('mustHaveToVerify');

    /*update wishitems */
    Route::post('/update_wish_item/{uuid}', [WishitemController::class, 'updateWishItem'])->name('update_wish_item')->middleware('mustHaveToVerify');
    Route::get('/create-checkout-session/{owner_id}', [StripeController::class, 'createCheckout'])->name('create.checkout');
    Route::get('/sucess-checkout/{id}', [StripeController::class, 'successCheckout'])->name('checkout.success')->middleware('mustHaveToVerify');
    Route::get('cancel-checkout/{id}', [StripeController::class, 'cancelCheckout'])->name('checkout.cancel')->middleware('mustHaveToVerify');

    Route::prefix("stripe")->name("stripe.")->group(function () {
        Route::get("authorize", [StripeController::class, "index"])->name("index")->middleware('mustHaveToVerify');
        Route::match(["get", "post"], "/connect-{step}/{country?}", [StripeController::class, "initConnect"])->name("connect")->middleware('mustHaveToVerify');
        Route::get("/response", [StripeController::class, "connectReturn"])->name("return")->middleware('mustHaveToVerify');
        Route::post("/login", [StripeController::class, "loginToStripe"])->name("login")->middleware('mustHaveToVerify');
    });

    Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile')->middleware('mustHaveToVerify');

    Route::post('save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category')->middleware('mustHaveToVerify');

    Route::get('account', function () {
        return Inertia::render('accountsetting/Accountsetting');
    })->name("account")->middleware('mustHaveToVerify');

    Route::get('/stripe', function () {
        return Inertia::render('stripe/Stripe');
    })->middleware(['auth', 'verified'])->name('stripe')->middleware('mustHaveToVerify');

    //update cart quantity
});

Route::get('counter/{deviceid}', [WishitemController::class, 'wish_counter'])->name('counter');

Route::get('cart-update-quantity/{uuid}/{quantity}', [WishitemController::class, 'updateCartQuantity'])->name('cart.updatequantity');

Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
    ->name('password.request');

Route::get('/remove-from-cart/{uuid}', [WishitemController::class, 'removeSurpriseFromCart'])->name('remove-from-cart');

Route::get('/add-to-cart/{uuid}/{device_id}/{amount?}', [WishitemController::class, 'addToCart'])->name('add-to-cart');

Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart');

Route::get('anonymous-cart/{deviceId}', [WishitemController::class, 'anonymousCartItems'])->name('anonymous-cart');

Route::get('user/{uuid}', [VerifyEmailController::class, 'emailVerify']);

/*Anonymous checkout*/
// Route::get('/anonymous-create-checkout-session/{priceid}/{quantity}', [StripeController::class, 'createAnonymousCheckout'])->name('anonymous.create.checkout');
// Route::get('/anonymous-create-checkout-session/{wishid}/{amount?}', [StripeController::class, 'createAnonymousCheckout'])->name('anonymous.create.checkout');

Route::get('/anonymous-create-checkout-session/{device_id}', [StripeController::class, 'createAnonymousCheckout'])->name('anonymous.create.checkout');

Route::get('/anonymous-sucess-checkout/{id}', [StripeController::class, 'anonymousSuccessCheckout'])->name('checkout.anonymous.success');

Route::get('/anonymous-cancel-checkout/{id}', [StripeController::class, 'anonymousCancelCheckout'])->name('checkout.anonymous.cancel');

Route::get('/get_category_data/{category}/{user_id}', [WishitemController::class, 'categoryItems'])->name('get_category_data');

Route::get('users', [MyController::class, 'getUsers'])->name('users');

Route::post('/send-surprize', [WishitemController::class, 'sendSurprise'])->name('send-surprize');

Route::get('/how-it-works', function () {
    return Inertia::render('howitworks/Works');
})->name("how-it-works");

Route::get('/terms-and-conditions', function () {
    return Inertia::render('Terms');
})->name("terms-and-conditions");

Route::get('/files/{filename}', function (string $filename) {
    $fullPath = asset($filename);
    return Storage::response($fullPath);
});

/*check username exist*/
Route::get('check-username/{username}', [AuthenticatedSessionController::class, 'checkUserName'])->name('check.username');

Route::get('/{username}/{category?}', [AuthenticatedSessionController::class, 'getUserProfile'])->name('user.show');
