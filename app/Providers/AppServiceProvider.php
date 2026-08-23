<?php

namespace App\Providers;

use App\Channels\MagicBellChannel;
use App\Models\Bills;
use App\Models\Deliverable;
use App\Models\Dispute;
use App\Models\Follow;
use App\Models\GifterCardVerification;
use App\Models\Membership;
use App\Models\MonthlyCharge;
use App\Models\Payment;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostCommentReplies;
use App\Models\PostLike;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\SocialLinks;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\Task;
use App\Models\TipGoal;
use App\Models\User;
use App\Models\UserCategory;
use App\Models\UserIntro;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Observers\ActivityObserver;
use App\Observers\CreatorContentObserver;
use App\Observers\DeliverableObserver;
use App\Services\BioPageService;
use App\Services\ResourcePreloadService;
use App\Support\Testing\OfflineStripeHttpClient;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\NotPwnedVerifier;
use Illuminate\Validation\Rules\Password;
use Stripe\ApiRequestor;
use Stripe\HttpClient\CurlClient;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Models that should be observed by ActivityObserver
     */
    protected $activityLogModels = [
        WishItem::class,
        WishItemSubscription::class,
        MonthlyCharge::class,
        Subscription::class,
        SubscriptionEvent::class,
        // \App\Models\StripePaymentDetail::class,
        // \App\Models\StripePaymentItems::class,
        TipGoal::class,
        // \App\Models\TipGoalsPayment::class,
        // \App\Models\BillPayment::class,
        // \App\Models\MembershipPayment::class,
        Membership::class,
        Bills::class,
        Task::class,
        // \App\Models\TaskPurchase::class,
        PiggyPot::class,
        // \App\Models\PiggyPotContribution::class,
        User::class,
        UserCategory::class,
        GifterCardVerification::class,
        PostLike::class,
        Follow::class,
        PostComment::class,
        PostCommentReplies::class,
        UserIntro::class,
        SocialLinks::class,
        Post::class,
        Shop::class,
        ShopPayment::class,
        Deliverable::class,
        Dispute::class,
        Payment::class,
        // Add more models as needed for additional audit coverage.
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        /*
         * ⚠️ HaveIBeenPwned gets 3 seconds, not Laravel's default 30.
         *
         * `Password::defaults()->uncompromised()` fails open on error, which is the
         * behaviour we want — but the stock verifier waits THIRTY SECONDS before
         * deciding there is an error. On Vapor that is longer than the Lambda will
         * live, so a slow HIBP would turn a fail-open into a 504 on registration
         * and password reset: exactly the third-party outage the fail-open exists
         * to survive.
         *
         * ⚠️ `extend`, not `singleton`. Illuminate\Validation\ValidationServiceProvider
         * is DEFERRED and binds this contract as a singleton when it eventually
         * loads, which would overwrite a plain re-bind made here. An extender is
         * keyed separately and is applied at resolve time, so it survives that.
         */
        $this->app->extend(UncompromisedVerifier::class, function ($verifier, $app) {
            /*
             * 🚨 THE TEST SUITE MUST NEVER CALL HaveIBeenPwned. `Password::defaults()`
             * applies everywhere, tests included, so the moment `uncompromised()` was
             * switched on the suite started making a real HTTP request on every
             * registration and password-reset test. That makes the result depend on a
             * third party being up and on the machine having a network — the exact
             * fault `EmailDomainPolicyTest` documents ("a suite whose result depends on
             * the network ... fails for reasons unrelated to this code"), and it is how
             * `RegistrationValidationTest` began failing with a 422 for a password that
             * was perfectly valid by our own policy: `Password123!` is 12 characters and
             * clears `min(12)`, but it sits in the breach corpus.
             *
             * Offline in `testing`, real everywhere else. `min(12)` still applies in
             * tests, so length is exercised; the breach check is Laravel's own rule and
             * is not ours to re-test. `PasswordPolicyTest` asserts the CONFIGURED policy
             * still carries `uncompromised`, so switching it off in production would
             * still fail the suite.
             */
            if ($app->environment('testing')) {
                return new class implements UncompromisedVerifier
                {
                    public function verify($data): bool
                    {
                        return true;
                    }
                };
            }

            return new NotPwnedVerifier($app[HttpFactory::class], 3);
        });

        // Configure storage paths for Laravel Vapor
        if (app()->environment('production')) {
            // Use temporary storage path in Lambda
            app()->useStoragePath('/tmp/storage');
        }

        $this->app->singleton(ResourcePreloadService::class, function ($app) {
            return new ResourcePreloadService;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /*
         |----------------------------------------------------------------------
         | Password policy — ONE definition, read by every call site
         |----------------------------------------------------------------------
         |
         | 🚨 `Password::defaults()` was called at EVERY password call site in this
         | app (register, reset, change) and CONFIGURED NOWHERE, so all of them
         | silently fell back to Laravel's stock rule: minimum 8 characters and no
         | breach check. Client Security Checklist §2 (Developer Master Plan,
         | 19 Aug 2026): min 12 + breached-list check, no forced rotation.
         |
         | Length and a breach check, deliberately WITHOUT composition rules
         | (mixedCase/numbers/symbols). That is current NIST guidance and it is what
         | the checklist asks for: composition rules push people towards
         | `Password1!` — short, predictable, and already in the breach corpus this
         | rule checks against.
         |
         | ⚠️ THIS IS NOT APPLIED AT LOGIN. Existing accounts on 8-character
         | passwords keep signing in as before; the new floor bites only when a
         | password is next SET (registration, reset, change). There is no forced
         | rotation, per the checklist.
         |
         | ⚠️ `uncompromised()` calls the HaveIBeenPwned range API
         | (api.pwnedpasswords.com) with the first five characters of the SHA-1 —
         | the password itself never leaves this server. It FAILS OPEN: Laravel's
         | NotPwnedVerifier catches the exception, reports it, and treats an empty
         | response body as "no match", so an HIBP outage lets the password through
         | rather than refusing every signup on the platform. See the timeout note
         | in register() — the fail-open only helps if the request also gives up
         | quickly.
         */
        Password::defaults(fn () => Password::min(12)->uncompromised());

        // Prevent Cloudflare Rocket Loader from interfering with Vite scripts
        Vite::useScriptTagAttributes([
            'data-cfasync' => 'false',
        ]);

        /*
         * 🚨 TESTS DO NOT CALL STRIPE. Measured 22 Aug 2026: one full suite run
         * made over 2,000 live requests, which is most of its hour and the most
         * likely cause of `StripeOnboardingFlowTest` failing in a full run while
         * passing in isolation. See `OfflineStripeHttpClient` for why it answers
         * with a Stripe ERROR rather than a fake success.
         *
         * ⚠️ Checked BEFORE the local branch: the test environment is also
         * `local` on a developer machine, and the IPv4 curl client below would
         * otherwise win and put the network back.
         */
        if (app()->environment('testing') && ! env('STRIPE_ALLOW_LIVE_CALLS_IN_TESTS', false)) {
            ApiRequestor::setHttpClient(new OfflineStripeHttpClient);
        } elseif (app()->environment('local')) {
            // Fix Stripe connection timeout issues in local/dev environments by forcing IPv4
            $curl = new CurlClient([CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
            ApiRequestor::setHttpClient($curl);
        }

        // Register model observers
        Deliverable::observe(DeliverableObserver::class);

        // Tell a creator's followers when new content goes live (moderation-aware —
        // held items only notify once approved). See CreatorContentObserver.
        foreach ([
            WishItem::class,
            Shop::class,
            PiggyPot::class,
            Membership::class,
            Bills::class,
        ] as $contentModel) {
            $contentModel::observe(CreatorContentObserver::class);
        }

        // Register ActivityObserver for all models
        $this->registerActivityObservers();

        // Register custom notification channel for MagicBell push notifications
        Notification::extend('push', function ($app) {
            return new MagicBellChannel;
        });

        // Ensure storage directories exist in Lambda environment
        if (app()->environment('production')) {
            $this->ensureLambdaStorageDirectories();
        }

        $this->registerBioCacheBusting();
    }

    /**
     * Drop the `/{username}/bio` payload cache when one of the six sellable
     * models changes.
     *
     * 🚨 A CARD IS DRAWN FROM THE LIVE LISTING, BUT THE ASSEMBLED PAYLOAD IS
     * CACHED for 60s, and only the bio editor cleared it. So a creator who
     * corrected a price in Shop, closed a pot or unpublished a membership kept
     * advertising the old state on the page they share everywhere, with nothing
     * on screen to say why. The listing's own save is the moment that is known.
     *
     * ⚠️ `saved` and `deleted`, not `updated`: a new listing changes the
     * AVAILABILITY map (which internal buttons the page draws) as much as an
     * edit changes a card.
     *
     * ⚠️ Task owns its creator through `creator_id`, not `user_id` — the same
     * trap `CheckMediaModeration` documents.
     */
    private function registerBioCacheBusting(): void
    {
        $owned = [
            Shop::class => 'user_id',
            WishItem::class => 'user_id',
            Bills::class => 'user_id',
            Membership::class => 'user_id',
            PiggyPot::class => 'user_id',
            Task::class => 'creator_id',
        ];

        foreach ($owned as $model => $column) {
            if (! class_exists($model)) {
                continue;
            }

            $forget = function ($row) use ($column) {
                // A vanity-adjacent cache key must never be why a listing fails
                // to save — same rule as the click counters on this feature.
                rescue(function () use ($row, $column) {
                    $ownerId = (int) ($row->{$column} ?? 0);

                    if ($ownerId > 0) {
                        BioPageService::forgetCachesForUserId($ownerId);
                    }
                }, report: false);
            };

            $model::saved($forget);
            $model::deleted($forget);
        }
    }

    /**
     * Register ActivityObserver for all required models
     */
    protected function registerActivityObservers(): void
    {
        foreach ($this->activityLogModels as $model) {
            if (class_exists($model)) {
                $model::observe(ActivityObserver::class);
            }
        }
    }

    /**
     * Ensure required storage directories exist in Lambda
     */
    private function ensureLambdaStorageDirectories(): void
    {
        $directories = [
            '/tmp/storage',
            '/tmp/storage/framework',
            '/tmp/storage/framework/cache',
            '/tmp/storage/framework/sessions',
            '/tmp/storage/framework/views',
            '/tmp/storage/app',
            '/tmp/storage/logs',
        ];

        foreach ($directories as $directory) {
            if (! is_dir($directory)) {
                @mkdir($directory, 0755, true);
            }
        }
    }
}
