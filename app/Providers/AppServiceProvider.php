<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Notification;
use App\Channels\MagicBellChannel;
use App\Models\Deliverable;
use App\Observers\DeliverableObserver;
use Stripe\ApiRequestor;
use Stripe\HttpClient\CurlClient;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use App\Observers\ActivityObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Models that should be observed by ActivityObserver
     */
    protected $activityLogModels = [
        \App\Models\WishItem::class,
        \App\Models\WishItemSubscription::class,
        \App\Models\MonthlyCharge::class,
        \App\Models\TipGoalsPayment::class,
        \App\Models\BillPayment::class,
        \App\Models\MembershipPayment::class,
        \App\Models\GifterCardVerification::class,
        \App\Models\PostLike::class,
        \App\Models\Follow::class,
        \App\Models\PostComment::class,
        \App\Models\PostCommentReplies::class,
        \App\Models\TaskPurchase::class,
        \App\Models\Dispute::class,
        \App\Models\UserIntro::class,
        \App\Models\SocialLinks::class,
        \App\Models\Post::class,
        \App\Models\Shop::class,
        \App\Models\ShopPayment::class,
        \App\Models\Deliverable::class,
        \App\Models\Membership::class,
        \App\Models\Bills::class,
        \App\Models\Task::class,
        \App\Models\PiggyPot::class,
        \App\Models\User::class,
        \App\Models\UserCategory::class,
        // Add more models as needed:
        // \App\Models\Comment::class,
        // \App\Models\Payment::class,
        // \App\Models\Subscription::class,
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

        $this->app->singleton(\App\Services\ResourcePreloadService::class, function ($app) {
            return new \App\Services\ResourcePreloadService();
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

        // Register ActivityObserver for all models
        $this->registerActivityObservers();

        // Register custom notification channel for MagicBell push notifications
        Notification::extend('push', function ($app) {
            return new MagicBellChannel();
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
            '/tmp/storage/logs'
        ];

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                @mkdir($directory, 0755, true);
            }
        }
    }
}
