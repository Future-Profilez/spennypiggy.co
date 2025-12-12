<?php

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
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\DeliveriesController;
use App\Http\Controllers\FounderBonusController;
use App\Http\Middleware\VerifyCsrfToken;
use App\Jobs\SendRenewMail;
use App\Models\Bills;
use App\Models\BulkPwaNotification;
use App\Models\Logs;
use App\Models\Membership;
use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\StripeControl;
use App\Uploadcare;
use Illuminate\Support\Facades\Http;
use App\SeoMeta;
use AWS\CRT\Log;
use Carbon\Carbon;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Request;
use PHPUnit\Event\Code\Test;
use Symfony\Component\HttpKernel\Profiler\Profile;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::match(['get', 'post'], 'verify/login', [AuthenticatedSessionController::class, 'store'])->name('login-user');

    Route::post('verify-2fa', [AuthenticatedSessionController::class, 'verify2FA'])->name('verify2FA');

    Route::post('/verify-user', [AuthenticatedSessionController::class, 'verifyUser'])->name('verifyUser');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('forgot-password/{uuid}', [PasswordResetLinkController::class, 'forgotPasswordPage']);

    Route::post('change-password/{uuid}', [PasswordResetLinkController::class, 'changePassword'])->name('changePassword');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');

    Route::get('verify-token/{token}', [AuthenticatedSessionController::class, 'authRedirects']);

    Route::get('update-2fa-key', [ProfileController::class, 'update2FaKey']);
});

Route::post('stripe/identity/verify', [StripeController::class, 'createVerificationSession'])->name('stripe.identity.verify');
Route::get('discover', function () {
    return Inertia::render('discover/Discover');
})->name("discover");
Route::get('discover/wishes/{order}/{type}/{price}', [WishitemController::class, 'discover_all_wishes'])->name('discover_wish');
Route::get('discover/creators/{order}/{gender}', [WishitemController::class, 'discover_all_creators'])->name('discover_creators');
Route::get('discover/creators/categories', [WishitemController::class, 'all_creators_categories'])->name('allcreators_categories');
// Route::get('discover/creators_videos', [WishitemController::class, 'discover_creators_videos'])->name('discover_videos');save_social_links
Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
    ->name('password.request');

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
        });

        // Memberships - accessible without subscription
        Route::prefix("membership")->name("membership.")->group(function () {
            Route::post('save', [MembershipController::class, 'membershipLevelSave'])->name('save');
            Route::post('edit/{uuid}', [MembershipController::class, 'updateLevel'])->name('edit');
            Route::get('remove/{uuid}', [MembershipController::class, 'removeLevel'])->name('remove');
            Route::get('dashboard', [MembershipController::class, 'membershipDashboard'])->name('dashboard');
            Route::get('graph', [MembershipController::class, 'membershipGraph'])->name('graph');
        });

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
        });
        // Categories and basic functionality
        Route::post('user/save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');
        Route::post('edit-category/{id}', [WishitemController::class, 'editWishCategory'])->name('edit-category');
        Route::get('delete-category/{id}', [WishitemController::class, 'deleteCategory'])->name('delete-category');
        Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links');
    });

    Route::middleware(['mustCompletedStripeIdentity'])->group(function () {
        Route::middleware('mustHaveToVerify')->group(function () {
            Route::get('gifter-card-verification', [RegisteredUserController::class, 'gifterCardVerification'])->name('gifter.card.verification');
            Route::get('card-verification-success/{uuid}', [RegisteredUserController::class, 'cardVerificationSuccess'])->name('card.verification.success');
            Route::get('card-verification-failed/{id}', [AuthenticatedSessionController::class, 'cardVerificationFailed'])->name('card.verification.failed');
            Route::get('update-vat/{percent}', [AuthenticatedSessionController::class, 'updateVat'])->name('updateVat');
            Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);
            Route::put('password', [PasswordController::class, 'update'])->name('password.update');
            Route::prefix("stripe")->name("stripe.")->group(function () {
                Route::get("authorize", [StripeController::class, "index"])->name("index");
                Route::match(["get", "post"], "/connect-{step}/{country?}/{currency?}", [StripeController::class, "initConnect"])->name("connect");
                Route::get("/response", [StripeController::class, "connectReturn"])->name("return");
                Route::post("/login", [StripeController::class, "loginToStripe"])->name("login");
                Route::get("/enable_card_payments", [StripeController::class, "enableCardPayments"])->name("enable.card.payments");
                Route::get("/upgrade-express-account", [StripeController::class, "upgradeStripeAccount"])->name("upgrade.account");
            });
            Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile');
            Route::get('notification-switch', [ProfileController::class, 'notificationSwitch'])->name('switch-notification');
            Route::post('user/save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');
            Route::post('edit-category/{id}', [WishitemController::class, 'editWishCategory'])->name('edit-category');
            Route::get('delete-category/{id}', [WishitemController::class, 'deleteCategory'])->name('delete-category');
            Route::get('account', function () {
                $user = Auth::user();
                $auto_tweet = $user->auto_tweet == 1;
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
                    ->orderByDesc('current_start_subscription_date')
                    ->first();

                // If no active period found, get the most recent one
                if (!$subscription) {
                    $subscription = MonthlyCharge::where('user_id', $user->id)
                        ->orderByDesc('current_start_subscription_date')
                        ->first();
                }

                // Get complete subscription history for the user
                $subscription_history = MonthlyCharge::where('user_id', $user->id)
                    ->orderByDesc('current_start_subscription_date')
                    ->get()
                    ->map(function ($charge) {
                        return [
                            'id' => $charge->id,
                            'uuid' => $charge->uuid,
                            'stripe_id' => $charge->stripe_id,
                            'amount' => $charge->amount ?? 0,
                            'currency' => $charge->currency ?? 'GBP',
                            'status' => $charge->status ?? 'pending',
                            'current_start_trial_date' => $charge->current_start_trial_date,
                            'current_end_trial_date' => $charge->current_end_trial_date,
                            'current_start_subscription_date' => $charge->current_start_subscription_date,
                            'current_end_subscription_date' => $charge->current_end_subscription_date,
                            'upcoming_payment' => $charge->upcoming_payment,
                            'created_at' => $charge->created_at,
                            'updated_at' => $charge->updated_at,
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

                    if ($subscription && $subscription->status === 'trialing') {
                        $site_subscription['status'] = 'FREE_TRIAL';
                    } elseif ($isSubscriptionActive) {
                        $site_subscription['status'] = 'ACTIVE';
                    } elseif ($isTrialOngoing && !$isSubscriptionActive) {
                        $site_subscription['status'] = 'FREE_TRIAL';
                    } elseif ($isExpired || $user->is_subscribed == 0) {
                        $site_subscription['status'] = 'EXPIRED';
                    }
                } else {
                    $site_subscription['status'] = 'INACTIVE';
                }

                return Inertia::render('accountsetting/Accountsetting', [
                    'auto_tweet' => $auto_tweet,
                    'site_subscription' => $site_subscription,
                    'subscription_history' => $subscription_history,
                    'pwa_notification_details' => $pwaNotificationDetails ?? null,
                    'subscription_status' => $user->subscription_status, // Add numeric status for debugging
                ]);
            });
            Route::get('/scanning/check-adult-content/{uuid}', [ProfileController::class, 'checkAdultContent'])->name('check-adult-content');
            Route::get('auto-tweet-setting', [WishitemController::class, 'enableAutoTweet'])->name('auto-tweet-setting');
            Route::get('unlink-twitter', [AuthenticatedSessionController::class, 'unlinkTwitter'])->name('unlink-twitter');
            Route::get('wish-tracker', [WishitemController::class, 'wishtrackerItems'])->name('wish-tracker');
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
                return Inertia::render('stripe/Stripe', [
                    'bills_count' => $bills,
                    'membership_count' => $membership
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
            if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
                $user = Auth::user();
                $user->identity_admin_status = 0;
                $user->identity_status = 1;
                $user->save();
            }
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

        Route::get('piggy-bank-setting/', [ProfileController::class, 'piggyBankSetting'])->name("piggy-bank-setting");

        Route::get('get-notification/', [ProfileController::class, 'getNotifications'])->name("get-notification");
        Route::get('mark-as-read/', [ProfileController::class, 'markRead'])->name("mark-as-read");

        Route::prefix('earnings')->group(function () {
            Route::get('all-data/{type?}', [LeaderBoardController::class, 'earnings'])->name('earnings');
            Route::get('graph-data/', [LeaderBoardController::class, 'graphData'])->name('graph-data');
            Route::get('top-wishes', [LeaderBoardController::class, 'topWishes'])->name('top-wishes');
            Route::get('top-subscription', [LeaderBoardController::class, 'topSubscription'])->name('top-subscription');
            Route::get('top-bill', [LeaderBoardController::class, 'topBill'])->name('top-bill');
            Route::get('top-shop', [LeaderBoardController::class, 'topShop'])->name('top-shop');
            Route::get('top-piggy-bank', [LeaderBoardController::class, 'topPiggyBank'])->name('top-piggy-bank');
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

        // Intro video
        Route::get('/redirecting', function () {
            return Inertia::render('Redirecting');
        })->name("redirecting");

        Route::get('cancel-subs/{uuid}', [StripeController::class, 'cancelSubs'])->name('cancel-subs');


        // rye product routes start
        Route::post('creator-store-address', [WishitemController::class, 'creatorStoreAddress'])->name('creator.store.address');
        Route::get('get-creator-address', [WishitemController::class, 'getCreatorStoreAddress'])->name('get.creator.address');
        Route::post('create-creator-product', [WishitemController::class, 'createRyeProduct'])->name('create.creator.product');
        Route::get('delete-creator-products/{uuid}', [WishitemController::class, 'deleteAndRestoredRyeProduct'])->name('delete.creator.products');
        Route::post('create-cart', [WishitemController::class, 'createCart'])->name('create.cart');
        Route::get('check-cart-exist/{creator_id}', [WishitemController::class, 'checkCartExist'])->name('check.cart.exist');
        Route::post('handle-rye-product-payment', [WishitemController::class, 'handleRyeProductPayment'])->name('handle.rye.product.payment')->middleware('mustCompletedCardVerification');
        Route::get('remove-cart/{cart_id}', [WishitemController::class, 'removeCart'])->name('remove.cart');
        Route::get('rye-success-payment/{uuid}/{orderUuid}', [WishitemController::class, 'ryeSuccessPayment'])->name('rye.success.payment');
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
    // Route::get('/list/{username}', [ShopsController::class, 'shopList'])->name('shop-list');
    Route::get('/item/{slug}/{uuid}/{session_id?}', [ShopsController::class, 'singleShopList'])->name('single-shop-list');
    Route::match(['get', 'post'], '/buy/{uuid}/{varient_id}', [ShopsController::class, 'buyShopItem'])->name('buy-shop-item');
    Route::post('/answer-to-payment/{payment_id}', [ShopsController::class, 'answerPayment'])->name('answerPayment');
    Route::get('/success-payment/{uuid}', [ShopsController::class, 'successPayment'])->name('shop.success-payment');
    Route::get('/cancel-payment/{uuid}', [ShopsController::class, 'cancelPayment'])->name('shop.cancel-payment');
    Route::get('/shipping-price/{shop_id}', [ShopsController::class, 'shippingPrice'])->name('shop.shipping-price');
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

Route::get('/user/tip/goal/{username?}', [AuthenticatedSessionController::class, 'usergoal'])->name('user.goal');
// subscription webhook
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);
Route::post('/mandatory-status', [StripeWebhookController::class, 'mandatorySubscriptionStatus']);
Route::post('/webhook/payment', [StripeWebhookController::class, 'handle']);
// Route::post('creator-monthly-verification-webhook', [StripeWebhookController::class, 'creatorMonthlyVerificationWebhook'])->name('creator.monthly.verification.webhook');
// Route::post('membership-status/', [MembershipController::class, 'membershipStatus'])->name('membership-status');
Route::post('subs-status/', [StripeController::class, 'subscriptionStatus'])->name('subs-status');
// Route::post('bill-status/', [BillsController::class, 'billStatus'])->name('bill-status');

Route::get('counter/{deviceid}', [WishitemController::class, 'wish_counter'])->name('counter');
// Route::get('user/tip-jar/list/{uuid}', [WishitemController::class, 'listGoal'])->name('list');
Route::get('user/{uuid}', [VerifyEmailController::class, 'emailVerify']);

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

Route::get('/test/test', function () {
    return Inertia::render('Test');
})->name("test");

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

// Route::get('/user_info/{username}/{category?}', [AuthenticatedSessionController::class, 'user_info'])->name('user.info');
// Place specific data routes BEFORE the catch-all username route to avoid interception
Route::get('/items/{username}/{category_id?}', [AuthenticatedSessionController::class, 'userItems'])->name('user.items');
Route::get('/user/category/{username}', [AuthenticatedSessionController::class, 'user_category'])->name('user.category');
Route::get('/shop/user_shop_category/{username}', [AuthenticatedSessionController::class, 'user_shop_category'])->name('user.shop.category');

Route::get('/{username}/{page?}', [AuthenticatedSessionController::class, 'getUserProfile'])
    ->name('user.show');

Route::prefix("wish")->name("wish.")->group(function () {
    Route::match(['get', 'post'], 'checkout/{uuid}/{reccure?}', [StripeController::class, 'wishItemSubscribe'])->name("subscribe.checkout")->middleware('mustCompletedCardVerification');
    Route::get('/handle/{uuid}/{status}', [StripeController::class, 'handleSubscription'])->name('subscribe.handle');
});

Route::get('payment/thankyou/{username}', function ($username) {
    $owner = User::where('username', $username)->first();
    return Inertia::render('Profile/Thankyou', [
        'owner' => $owner
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
Route::match(["get", "post"], '/test-kyc-webhook', [TestController::class, 'reviewWebhook'])->name("test-kyc")->withoutMiddleware(VerifyCsrfToken::class);

Route::get('/remove-from-cart/{uuid}/{device_id?}', [WishitemController::class, 'removeSurpriseFromCart'])->name('remove-from-cart');



// ADD IN ADMIN PANEL
Route::get('/stripe/manual-payout', [TestController::class, 'manualPayout'])->name('stripe-payout');
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