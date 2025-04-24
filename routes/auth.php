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
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\ShopsController;
use App\Http\Controllers\Auth\SocialLinksController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\TestController;
use App\Http\Controllers\Auth\TwitterController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WishtenderController;
use App\Http\Middleware\CheckGifterCardVerification;
use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Bills;
use App\Models\Logs;
use App\Models\Membership;
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
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Request;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::match(['get', 'post'], 'verify/login', [AuthenticatedSessionController::class, 'store'])->name('login-user')->middleware('mustHaveToVerify');

    Route::post('verify-2fa', [AuthenticatedSessionController::class, 'verify2FA'])->name('verify2FA')->middleware('mustHaveToVerify');

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

Route::middleware('auth')->group(function () {

    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    // Route::post('verify-2fa', [AuthenticatedSessionController::class, 'verify2FA'])->name('verify2FA');

    /*send surprise amount*/
    Route::get('verification', [EmailVerificationPromptController::class, '__invoke'])->name('verification.notice');
    Route::get('email/send-verification-email', [EmailVerificationNotificationController::class, 'sendVerificationEmail'])
        ->name('verification.email');

    Route::middleware(['mustCompletedStripeIdentity'])->group(function () {
        Route::middleware('mustHaveToVerify')->group(function () {

            // gifter card verification routes
            Route::get('gifter-card-verification', [RegisteredUserController::class, 'gifterCardVerification'])->name('gifter.card.verification');
            Route::get('card-verification-success/{uuid}', [RegisteredUserController::class, 'cardVerificationSuccess'])->name('card.verification.success');
            Route::get('card-verification-failed/{id}', [RegisteredUserController::class, 'cardVerificationFailed'])->name('card.verification.failed');

            Route::get('update-vat/{percent}', [AuthenticatedSessionController::class, 'updateVat'])->name('updateVat');

            Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

            Route::put('password', [PasswordController::class, 'update'])->name('password.update');

            Route::post('save_social_links', [SocialLinksController::class, 'saveSocialLinks'])->name('save_social_links');

            Route::post('save_wish_item', [WishitemController::class, 'addWishItem'])->name('save_wish_item');

            Route::post('/update_wish_item/{uuid}', [WishitemController::class, 'updateWishItem'])->name('update_wish_item');

            Route::get('/delete-wish-item/{uuid}', [WishitemController::class, 'deleteWishItem'])->name('delete_wish_item');

            Route::prefix("stripe")->name("stripe.")->group(function () {
                Route::get("authorize", [StripeController::class, "index"])->name("index");
                Route::match(["get", "post"], "/connect-{step}/{country?}/{currency?}", [StripeController::class, "initConnect"])->name("connect");
                Route::get("/response", [StripeController::class, "connectReturn"])->name("return");
                Route::post("/login", [StripeController::class, "loginToStripe"])->name("login");
            });

            Route::post('edit-profile', [ProfileController::class, 'updateProfile'])->name('edit-profile');

            Route::get('notification-switch', [ProfileController::class, 'notificationSwitch'])->name('switch-notification');

            Route::post('save-category', [WishitemController::class, 'saveUserCategory'])->name('save-category');

            Route::post('edit-category/{id}', [WishitemController::class, 'editWishCategory'])->name('edit-category');

            Route::get('delete-category/{id}', [WishitemController::class, 'deleteCategory'])->name('delete-category');

            Route::get('account', function () {
                $auto_tweet = Auth::user()->auto_tweet == 1 ? true : false;
                return Inertia::render('accountsetting/Accountsetting', [
                    'auto_tweet' => $auto_tweet
                ]);
            })->name("account");

            Route::get('check-adult-content/{uuid}', [ProfileController::class, 'checkAdultContent'])->name('check-adult-content');

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
            Route::prefix("intro")->name("intro.")->group(function () {
                Route::post('save', [ProfileController::class, 'saveIntroVideo'])->name('save');
                Route::get('list', [ProfileController::class, 'getIntroVideo'])->name('list');
                Route::get('remove', [ProfileController::class, 'removeIntro'])->name('remove');
                // Route::get('/{uuid}', [ProfileController::class, 'getIntroById'])->name('get-intro-id');
            });

            Route::prefix("membership")->name("membership.")->group(function () {
                Route::post('save', [MembershipController::class, 'membershipLevelSave'])->name('save');
                Route::post('edit/{uuid}', [MembershipController::class, 'updateLevel'])->name('edit');
                Route::get('remove/{uuid}', [MembershipController::class, 'removeLevel'])->name('remove');
                Route::get('dashboard', [MembershipController::class, 'membershipDashboard'])->name('dashboard');
                Route::get('graph', [MembershipController::class, 'membershipGraph'])->name('graph');
            });

            Route::prefix("post")->name("post.")->group(function () {
                Route::post('save', [PostsController::class, 'savePost'])->name('save');
                Route::post('edit/{uuid}', [PostsController::class, 'editPost'])->name('edit');
                Route::get('delete/{uuid}', [PostsController::class, 'deletePost'])->name('delete');
                Route::get('like/{uuid}', [PostsController::class, 'postLike'])->name('like');
                Route::post('comment/{uuid}', [PostsController::class, 'commentOnPost'])->name('comment');
                Route::post('comment-reply/{comment_uid}', [PostsController::class, 'replyOnComment'])->name('comment-reply');
            });

            Route::prefix("bill")->name("bill.")->group(function () {
                Route::post('save', [BillsController::class, 'billSave'])->name('save');
                Route::post('edit/{id}', [BillsController::class, 'billEdit'])->name('edit');
                Route::get('remove/{uuid}', [BillsController::class, 'removeBill'])->name('remove');
            });

            Route::match(['get', 'delete'], 'delete-stripe-account', [StripeController::class, 'deleteStripeAccount'])->name('deleteStripeAccount');

            Route::get('mandatory-checkout/', [StripeController::class, 'payMonthlyCharge'])->name("mandatory.checkout");
            Route::get('/handle/{uuid}/{status}', [StripeController::class, 'handleMandatorySubscription'])->name('mandatory.handle');

            Route::get('/stripe-subscription', function () {
                return Inertia::render('Profile/ActivateSubscription');
            })->name('stripe-subscription');

            Route::post('/dalle-image', [ProfileController::class, 'getImageGenerateAI'])->name('dalle.image');
            Route::post('/upload-dalle-image', [ProfileController::class, 'uploadDalleImage'])->name('upload.dalle.image');
        });

        Route::post('/say-thankyou/{payment_id}', [WishitemController::class, 'sayThanks'])->name('say-thankyou');

        Route::post('move-wish', [WishitemController::class, 'moveWishes'])->name('move-wish');

        Route::get('/earnings', function () {
            return Inertia::render('earnings/Earnings');
        })->name('earnings-page');
        Route::get('profile-steps-status/', [ProfileController::class, 'profileStepsStatus'])->name("profle-steps-status");

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

        Route::prefix('shop')->group(function () {
            Route::post('/add', [ShopsController::class, 'addShopItems'])->name('add-shop');
            Route::post('/update/{uuid}', [ShopsController::class, 'updateShopItems'])->name('update-shop');
            Route::post('/save-category', [ShopsController::class, 'saveUserShopCategory'])->name('save-category');
            Route::get('/delete/{uuid}', [ShopsController::class, 'deleteShop'])->name('delete-shop');
            Route::get('/deactivate/{uuid}', [ShopsController::class, 'deactivateShop'])->name('deactivate-shop');
            Route::get('orders-list', [ShopsController::class, 'ordersList'])->name('orders-list');
        });

        Route::get('create-applicant', [TestController::class, 'createApplicant']);
        Route::get('generate-verification-link', [TestController::class, 'generateVerificationLink']);

        Route::get('generate-backup-code', [AuthenticatedSessionController::class, 'generateBackupCode']);
        Route::get('show-2fa-qr', [ProfileController::class, 'show2faQR']);
        Route::post('switch-2fa', [ProfileController::class, 'update2faStatus']);
        Route::post('verification-2fa', [ProfileController::class, 'verification2FA']);

        Route::post('/report-content/', [ProfileController::class, 'reportContent'])->name('report-content');

        Route::prefix('shop')->group(function () {
            Route::get('/list/{username}', [ShopsController::class, 'shopList'])->name('shop-list');
            Route::get('/item/{slug}/{uuid}/{session_id?}', [ShopsController::class, 'singleShopList'])->name('single-shop-list')->middleware('mustCompletedCardVerification');
            Route::match(['get', 'post'], '/buy/{uuid}/{varient_id}', [ShopsController::class, 'buyShopItem'])->name('buy-shop-item');
            Route::post('/answer-to-payment/{payment_id}', [ShopsController::class, 'answerPayment'])->name('answerPayment');
            Route::get('/success-payment/{uuid}', [ShopsController::class, 'successPayment'])->name('shop.success-payment');
            Route::get('/cancel-payment/{uuid}', [ShopsController::class, 'cancelPayment'])->name('shop.cancel-payment');
            Route::get('/shipping-price/{shop_id}', [ShopsController::class, 'shippingPrice'])->name('shop.shipping-price');
        });

        Route::get('gifter-wish-items/{username}', [ProfileController::class, 'gifterWishitems'])->name('gifter-items');
        Route::get('gifter-subs/{username}', [ProfileController::class, 'gifterSubs'])->name('gifter-subscriptions');
        Route::get('gifter-tips/{username}', [ProfileController::class, 'gifterTips'])->name('gifter-tips');
        Route::get('gifter-access-posts/{username}', [ProfileController::class, 'gifterAccessPosts'])->name('gifter-access-posts');
        Route::get('gifter-memberships/{username}', [ProfileController::class, 'gifterMemberships'])->name('gifter-memberships');
        Route::get('gifter-medias/{username}', [ProfileController::class, 'gifterMedia'])->name('gifter-media');
        Route::get('gifter-thanks-message/{username}', [ProfileController::class, 'gifterThanksMessages'])->name('gifter-thanks-message');
        Route::get('gifter-subscriptions/{username}', [ProfileController::class, 'gifterSubscription'])->name('gifter-subscription');

        // Intro video
        Route::get('/redirecting', function () {
            return Inertia::render('Redirecting');
        })->name("redirecting");


        Route::get('my-intro/{id}', [ProfileController::class, 'getIntroById'])->name('get-intro-id');

        Route::get('counter/{deviceid}', [WishitemController::class, 'wish_counter'])->name('counter');
        Route::get('cart-update-quantity/{uuid}/{quantity}', [WishitemController::class, 'updateCartQuantity'])->name('cart.updatequantity');
        Route::get('cancel-subs/{uuid}', [StripeController::class, 'cancelSubs'])->name('cancel-subs');
        Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
            ->name('password.request');

        Route::get('/remove-from-cart/{uuid}', [WishitemController::class, 'removeSurpriseFromCart'])->name('remove-from-cart');

        Route::get('/add-to-cart/{uuid}/{device_id}/{sub}/{amount?}', [WishitemController::class, 'addToCart'])->name('add-to-cart');

        // rye product routes start
        Route::post('creator-store-address', [WishitemController::class, 'creatorStoreAddress'])->name('creator.store.address');
        Route::get('get-creator-address', [WishitemController::class, 'getCreatorStoreAddress'])->name('get.creator.address');
        Route::post('create-creator-product', [WishitemController::class, 'createRyeProduct'])->name('create.creator.product');
        Route::get('delete-creator-products/{uuid}', [WishitemController::class, 'deleteAndRestoredRyeProduct'])->name('delete.creator.products');
        Route::post('create-cart', [WishitemController::class, 'createCart'])->name('create.cart');
        Route::get('check-cart-exist/{creator_id}', [WishitemController::class, 'checkCartExist'])->name('check.cart.exist');
        Route::post('handle-rye-product-payment', [WishitemController::class, 'handleRyeProductPayment'])->name('handle.rye.product.payment')->middleware('mustCompletedCardVerification');
        Route::get('remove-cart/{cart_id}', [WishitemController::class, 'removeCart'])->name('remove.cart');
        Route::get('get-cart-details', [WishitemController::class, 'getCartDetails'])->name('get.cart.details');
        Route::get('rye-success-payment/{uuid}/{orderUuid}', [WishitemController::class, 'ryeSuccessPayment'])->name('rye.success.payment');
        Route::get('rye-cancel-payment/{uuid}', [WishitemController::class, 'ryeCancelPayment'])->name('rye.cancel.payment');
        Route::post('store-product-order-details', [WishitemController::class, 'storeProductOrderDetails'])->name('store.product.order.details');
        // rye product routes end

        Route::get('/clear-cart/{device_id}/{ownerid}', [WishitemController::class, 'clearCart'])->name('clear-cart');

        Route::get('cart', [WishitemController::class, 'cartItems'])->name('cart')->middleware(['mustCompletedCardVerification','mustCompletedCardVerification']);

        Route::get('anonymous-cart/{deviceId}', [WishitemController::class, 'anonymousCartItems'])->name('anonymous-cart');


        Route::get('/create-checkout-session/{id}', [CheckoutController::class, 'createCheckout'])->name('create.checkout');

        Route::get('/success-checkout/{id}', [CheckoutController::class, 'successCheckout'])->name('checkout.success');

        Route::get('/cancel-checkout/{id}', [CheckoutController::class, 'cancelCheckout'])->name('checkout.cancel');

        Route::get('/get_category_data/{category}/{user_id}', [WishitemController::class, 'categoryItems'])->name('get_category_data');

        Route::get('users', [MyController::class, 'getUsers'])->name('users');

        Route::post('/send-surprize', [WishitemController::class, 'sendSurprise'])->name('send-surprize');

        Route::post('subs-status/', [StripeController::class, 'subscriptionStatus'])->name('subs-status')->withoutMiddleware(VerifyCsrfToken::class);

        Route::post('membership-status/', [MembershipController::class, 'membershipStatus'])->name('membership-status')->withoutMiddleware(VerifyCsrfToken::class);

        Route::post('bill-status/', [BillsController::class, 'billStatus'])->name('bill-status')->withoutMiddleware(VerifyCsrfToken::class);

        Route::post('mandatory-status', [StripeController::class, 'mandatorySubscriptionStatus'])->name('mandatory-status');

        Route::prefix("tip-jar")->name("tip-jar.")->group(function () {
            Route::post('pay/{creator_uid}/', [StripeController::class, 'tipToJar'])->name("pay");
            Route::get('/handle/{uuid}/{status?}', [StripeController::class, 'handleTipJarPayment'])->name('handle');
            Route::get('/list/{uuid}', [WishitemController::class, 'listGoal'])->name('list');
        });
    });
});

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

Route::get('largest-gifts/{type?}', [LeaderBoardController::class, 'largestGifts'])->name('largest-gifts');


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
})->name("test");

Route::get('twitter-token/', [TwitterController::class, 'twitterAuthUrl']);
Route::get('twitter/login', [TwitterController::class, 'twitterLogin']);
Route::get('check-username/{username}', [AuthenticatedSessionController::class, 'checkUserName'])->name('check.username');

Route::get('sociallinks/{username}', [AuthenticatedSessionController::class, 'sociallinks'])->name('user.sociallinks');

Route::get('memberships/{username}', [AuthenticatedSessionController::class, 'user_memberships'])->name('user.memberships');

Route::get('bills/{username}', [AuthenticatedSessionController::class, 'user_bills'])->name('user.bills');

Route::get('gift-items/{username}', [AuthenticatedSessionController::class, 'userGiftItems'])->name('gift.items');

Route::get('posts/{username}', [AuthenticatedSessionController::class, 'user_posts'])->name('user.posts');

Route::get('comments/{uuid}', [PostsController::class, 'allComments'])->name('user.posts.comments');

Route::get('/{username}', [AuthenticatedSessionController::class, 'getUserProfile'])->name('user.show');
Route::get('/user_info/{username}/{category?}', [AuthenticatedSessionController::class, 'user_info'])->name('user.info');
Route::get('/items/{username}/{category_id?}', [AuthenticatedSessionController::class, 'userItems'])->name('user.items');
Route::get('/user_category/{username}', [AuthenticatedSessionController::class, 'user_category'])->name('user.category');
Route::get('/user_shop_category/{username}', [AuthenticatedSessionController::class, 'user_shop_category'])->name('user.shop.category');


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

Route::get('/stripe/manual-payout', [TestController::class, 'manualPayout'])->name('stripe-payout');

Route::get('/delete-connected-account/{accountId}', [StripeController::class, 'deleteConnectedAccount']);
