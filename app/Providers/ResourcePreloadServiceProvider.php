<?php

namespace App\Providers;

use App\Services\ResourcePreloadService;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class ResourcePreloadServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton('resource-preload', function () {
            return new ResourcePreloadService;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerBladeDirectives();
    }

    /**
     * Register Blade directives for resource preloading
     */
    private function registerBladeDirectives(): void
    {
        // Preload critical resources automatically
        Blade::directive('preloadCritical', function ($expression) {
            return "<?php echo app('resource-preload')->preloadCriticalResources({$expression})->renderPreloadTags(); ?>";
        });

        // Preload specific resource
        Blade::directive('preloadResource', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->preload(\$args['href'], \$args['as'], \$args['attributes'] ?? []); 
            ?>";
        });

        // Preload CSS
        Blade::directive('preloadCss', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->preloadCss(\$args['href'], \$args['critical'] ?? false); 
            ?>";
        });

        // Preload image
        Blade::directive('preloadImage', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->preloadImage(\$args['href'], \$args['hero'] ?? false); 
            ?>";
        });

        // Preload font
        Blade::directive('preloadFont', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->preloadFont(\$args['href'], \$args['type'] ?? 'font/woff2'); 
            ?>";
        });

        // Preload script
        Blade::directive('preloadScript', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->preloadScript(\$args['href'], \$args['critical'] ?? false); 
            ?>";
        });

        // Module preload
        Blade::directive('modulePreload', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->modulePreload(\$args['href'], \$args['attributes'] ?? []); 
            ?>";
        });

        // Prefetch resources
        Blade::directive('prefetchResource', function ($expression) {
            return "<?php 
                \$args = {$expression}; 
                app('resource-preload')->prefetch(\$args['href'], \$args['attributes'] ?? []); 
            ?>";
        });

        // Prefetch navigation routes
        Blade::directive('prefetchNavigation', function ($expression) {
            return "<?php 
                \$routes = {$expression} ?: app('resource-preload')->getPredictedRoutes(); 
                app('resource-preload')->prefetchNavigationRoutes(\$routes); 
            ?>";
        });

        // Render preload tags
        Blade::directive('renderPreload', function ($expression) {
            return "<?php echo app('resource-preload')->renderPreloadTags(); ?>";
        });

        // Render prefetch tags
        Blade::directive('renderPrefetch', function ($expression) {
            return "<?php echo app('resource-preload')->renderPrefetchTags(); ?>";
        });

        // Combined directive to render all resource optimization tags
        Blade::directive('resourceOptimization', function ($expression) {
            return "<?php 
                \$page = {$expression} ?: 'home';
                echo app('resource-preload')
                    ->preloadCriticalResources(\$page)
                    ->prefetchNavigationRoutes(app('resource-preload')->getPredictedRoutes())
                    ->renderPreloadTags();
                echo app('resource-preload')->renderPrefetchTags();
            ?>";
        });

        // Font optimization directive
        Blade::directive('optimizeFonts', function ($expression) {
            return "<?php
                // Preload critical Google Fonts
                app('resource-preload')
                    ->preloadFont('https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.woff2')
                    ->preloadFont('https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7V1s.woff2')
                    ->preloadFont('https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLDD4V1s.woff2')
                    ->preloadFont('https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm3Kz-C8.woff2')
                    ->preloadFont('https://fonts.gstatic.com/s/fredoka/v14/X7nO4b87HvSqjb_WIy8XY6Cd.woff2');
                
                echo app('resource-preload')->renderPreloadTags();
            ?>";
        });

        // Hero image optimization
        Blade::directive('optimizeHeroImages', function ($expression) {
            return "<?php
                \$images = {$expression} ?: [];
                foreach (\$images as \$image) {
                    app('resource-preload')->preloadImage(\$image, true);
                }
                echo app('resource-preload')->renderPreloadTags();
            ?>";
        });

        // Critical CSS optimization
        Blade::directive('optimizeCriticalCss', function ($expression) {
            return "<?php
                \$cssFiles = {$expression} ?: [];
                foreach (\$cssFiles as \$css) {
                    app('resource-preload')->preloadCss(\$css, true);
                }
                echo app('resource-preload')->renderPreloadTags();
            ?>";
        });

        // JavaScript chunk optimization
        Blade::directive('optimizeJsChunks', function ($expression) {
            return "<?php
                \$chunks = {$expression} ?: [];
                foreach (\$chunks as \$chunk) {
                    app('resource-preload')->modulePreload(\$chunk);
                }
                echo app('resource-preload')->renderPreloadTags();
            ?>";
        });
    }
}
