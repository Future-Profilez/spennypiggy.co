<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Notification;
use App\Channels\MagicBellChannel;
use App\Models\Deliverable;
use App\Observers\DeliverableObserver;
use Stripe\ApiRequestor;
use Stripe\HttpClient\CurlClient;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Configure storage paths for Laravel Vapor
        if (app()->environment('production')) {
            // Use temporary storage path in Lambda
            app()->useStoragePath('/tmp/storage');

            // Respect Vapor environment variables for cache/session drivers
            config([
                'session.driver' => env('SESSION_DRIVER', 'redis'),
                'session.store' => env('SESSION_STORE', 'redis'),
                'cache.default' => env('CACHE_DRIVER', 'redis'),
                'filesystems.default' => 's3',
                'view.compiled' => '/tmp/storage/framework/views',
                'queue.default' => 'sqs'
            ]);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix Stripe connection timeout issues in local/dev environments by forcing IPv4
        if (app()->environment('local')) {
            $curl = new CurlClient([CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
            ApiRequestor::setHttpClient($curl);
        }

        // Register model observers
        Deliverable::observe(DeliverableObserver::class);
        
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
