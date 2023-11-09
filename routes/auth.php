<?php

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

//email verify get
Route::get('get-verify-email-page/{uuid}', [RegisteredUserController::class, 'getVerifyEmailPage'])
    ->name('get.verify.email.page');
Route::post('verify-email', [RegisteredUserController::class, 'verifyEmail'])
    ->name('verify.email');

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login-user', [AuthenticatedSessionController::class, 'store'])->name('login-user');

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

    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Route::get('dashboard', [AuthenticatedSessionController::class, 'getUserProfile'])->name('dashboard');

    // Route::prefix("/")
    // $owner = Auth::user();
    // ['owner' => $user->id == $owner->id ? true : false// ]

    Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links');

    Route::post('save_wish_item', [WishitemController::class, 'saveWishItem'])->name('save_wish_item');

    Route::prefix("stripe")->name("stripe.")->group(function () {
        Route::get("authorize", [StripeController::class, "index"])->name("index");
        Route::match(["get", "post"], "/connect-{step}", [StripeController::class, "initConnect"])->name("connect");
        Route::get("/response", [StripeController::class, "connectReturn"])->name("return");
    });

    Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile');

    Route::post('save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');

    Route::post('add-to-cart', [WishitemController::class, 'addToCart'])->name('add-to-cart');

    Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart');
});

Route::get('/stripe', function () {
    return Inertia::render('stripe/Stripe');
})->middleware(['auth', 'verified'])->name('stripe');

Route::get('/get_category_data/{category}/{user_id}', [WishitemController::class, 'categoryItems'])->name('get_category_data');

Route::get('users', [MyController::class, 'getUsers'])->name('users');

Route::get('/{username}/{category?}', [AuthenticatedSessionController::class, 'getUserProfile'])->name('user.show');
