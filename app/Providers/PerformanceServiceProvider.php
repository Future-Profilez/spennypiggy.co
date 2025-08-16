<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Response;

class PerformanceServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        // Add performance headers to all responses
        $this->addPerformanceHeaders();
        
        // Optimize Blade rendering
        $this->optimizeBladeRendering();
    }

    /**
     * Add performance-related headers to improve Core Web Vitals
     */
    private function addPerformanceHeaders()
    {
        // Add headers for better caching and performance
        Response::macro('withPerformanceHeaders', function ($response) {
            return $response->withHeaders([
                'X-Content-Type-Options' => 'nosniff',
                'X-Frame-Options' => 'SAMEORIGIN',
                'X-XSS-Protection' => '1; mode=block',
                'Referrer-Policy' => 'strict-origin-when-cross-origin',
                // Preload key resources
                'Link' => '</build/assets/app.css>; rel=preload; as=style, </build/assets/app.js>; rel=preload; as=script',
            ]);
        });
    }

    /**
     * Optimize Blade rendering for better performance
     */
    private function optimizeBladeRendering()
    {
        // Share performance data with all views
        View::composer('*', function ($view) {
            $view->with([
                'performanceMetrics' => [
                    'timestamp' => now()->timestamp,
                    'memory_usage' => memory_get_usage(true),
                ]
            ]);
        });

        // Add critical resource hints globally
        View::composer('app', function ($view) {
            $criticalResources = [
                'dns_prefetch' => [
                    '//fonts.googleapis.com',
                    '//fonts.gstatic.com',
                    '//widget.trustpilot.com',
                    '//static.ads-twitter.com'
                ],
                'preconnect' => [
                    'https://fonts.gstatic.com'
                ]
            ];
            
            $view->with('criticalResources', $criticalResources);
        });
    }
}
