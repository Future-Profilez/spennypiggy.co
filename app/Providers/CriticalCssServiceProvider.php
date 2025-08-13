<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;

class CriticalCssServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Blade directive for inlining critical CSS
        Blade::directive('criticalCss', function ($expression) {
            return "<?php echo app('critical-css')->inline({$expression}); ?>";
        });

        // Blade directive for deferring non-critical CSS
        Blade::directive('deferCss', function ($expression) {
            return "<?php echo app('critical-css')->defer({$expression}); ?>";
        });

        // Register the critical CSS service
        $this->app->singleton('critical-css', function () {
            return new \App\Services\CriticalCssService();
        });
    }
}
