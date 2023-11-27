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

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

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


    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm')->middleware('mustHaveToVerify');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store'])->middleware('mustHaveToVerify');

    Route::put('password', [PasswordController::class, 'update'])->name('password.update')->middleware('mustHaveToVerify');

    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout')->middleware('mustHaveToVerify');
    // Route::get('dashboard', [AuthenticatedSessionController::class, 'getUserProfile'])->name('dashboard');

    // Route::prefix("/")
    // $owner = Auth::user();
    // ['owner' => $user->id == $owner->id ? true : false// ]

<<<<<<< HEAD
    Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links')->middleware('mustHaveToVerify');

    Route::post('save_wish_item', [WishitemController::class, 'saveWishItem'])->name('save_wish_item')->middleware('mustHaveToVerify');

    /*update wishitems */
    Route::post('/update_wish_item/{uuid}', [WishitemController::class, 'updateWishItem'])->name('update_wish_item')->middleware('mustHaveToVerify');
    Route::get('/create-checkout-session/{owner_id}', [StripeController::class, 'createCheckout'])->name('create.checkout')->middleware('mustHaveToVerify');
    Route::get('/sucess-checkout/{id}', [StripeController::class, 'successCheckout'])->name('checkout.success')->middleware('mustHaveToVerify');
    Route::get('cancel-checkout/{id}', [StripeController::class, 'cancelCheckout'])->name('checkout.cancel')->middleware('mustHaveToVerify');
=======
    Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links');

    Route::post('save_wish_item', [WishitemController::class, 'saveWishItem'])->name('save_wish_item');

    /*update wishitems */
    Route::post('/update_wish_item/{uuid}', [WishitemController::class, 'updateWishItem'])->name('update_wish_item');
    Route::get('/create-checkout-session/{owner_id}', [StripeController::class, 'createCheckout'])->name('create.checkout');
    Route::get('/sucess-checkout/{id}', [StripeController::class, 'successCheckout'])->name('checkout.success');
    Route::get('cancel-checkout/{id}', [StripeController::class, 'cancelCheckout'])->name('checkout.cancel');
>>>>>>> 622d15854988f8958ae978670e705b71e59a2821


    Route::prefix("stripe")->name("stripe.")->group(function () {
        Route::get("authorize", [StripeController::class, "index"])->name("index")->middleware('mustHaveToVerify');
        Route::match(["get", "post"], "/connect-{step}/{country?}", [StripeController::class, "initConnect"])->name("connect")->middleware('mustHaveToVerify');
        Route::get("/response", [StripeController::class, "connectReturn"])->name("return")->middleware('mustHaveToVerify');
        Route::post("/login", [StripeController::class, "loginToStripe"])->name("login")->middleware('mustHaveToVerify');
    });

<<<<<<< HEAD
    Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile')->middleware('mustHaveToVerify');

    Route::post('save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category')->middleware('mustHaveToVerify');

    Route::get('/add-to-cart/{uuid}/{amount?}', [WishitemController::class, 'addToCart'])->name('add-to-cart')->middleware('mustHaveToVerify');

    Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart')->middleware('mustHaveToVerify')->middleware('mustHaveToVerify');

    Route::get('account', function () {
        return Inertia::render('accountsetting/Accountsetting');
    })->name("account")->middleware('mustHaveToVerify');
=======
    Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile');

    Route::post('save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');

    Route::get('/add-to-cart/{uuid}/{amount?}', [WishitemController::class, 'addToCart'])->name('add-to-cart');

    Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart');

    Route::get('account', function () {
        return Inertia::render('accountsetting/Accountsetting');
    })->name("account");
>>>>>>> 622d15854988f8958ae978670e705b71e59a2821

    Route::get('/stripe', function () {
        return Inertia::render('stripe/Stripe');
    })->middleware(['auth', 'verified'])->name('stripe')->middleware('mustHaveToVerify');
});

Route::get('user/{uuid}', [VerifyEmailController::class, 'emailVerify']);
/*Anonymous checkout*/
// Route::get('/anonymous-create-checkout-session/{priceid}/{quantity}', [StripeController::class, 'createAnonymousCheckout'])->name('anonymous.create.checkout');
Route::get('/anonymous-create-checkout-session/{wishid}/{amount?}', [StripeController::class, 'createAnonymousCheckout'])->name('anonymous.create.checkout');

Route::get('/anonymous-sucess-checkout/{id}/{cart_id?}', [StripeController::class, 'anonymousSuccessCheckout'])->name('checkout.anonymous.success');
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
