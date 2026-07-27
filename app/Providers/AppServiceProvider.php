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
use App\Services\ResourcePreloadService;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
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
        // Prevent Cloudflare Rocket Loader from interfering with Vite scripts
        Vite::useScriptTagAttributes([
            'data-cfasync' => 'false',
        ]);

        // Fix Stripe connection timeout issues in local/dev environments by forcing IPv4
        if (app()->environment('local')) {
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
