<?php

namespace App\Providers;

use App\Services\ModernImageService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class ModernImageServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ModernImageService::class, function ($app) {
            return new ModernImageService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Blade component for responsive images
        Blade::component('responsive-image', 'components.responsive-image');
        
        // Register custom Blade directives for image optimization
        Blade::directive('modernImage', function ($expression) {
            return "<?php echo app(App\Services\ModernImageService::class)->generatePictureElement($expression); ?>";
        });
        
        // Directive for getting optimized image URL
        Blade::directive('optimizedImageUrl', function ($expression) {
            $parts = explode(',', str_replace(['(', ')', ' '], '', $expression));
            $src = trim($parts[0], '"\'');
            $format = isset($parts[1]) ? trim($parts[1], '"\'') : 'webp';
            $quality = isset($parts[2]) ? (int)$parts[2] : 85;
            
            return "<?php echo app(App\Services\ModernImageService::class)->getOptimizedImageUrl('$src', '$format', $quality); ?>";
        });
    }
}
