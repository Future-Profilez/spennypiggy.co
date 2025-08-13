<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Request;

class ResourcePreloadService
{
    private array $preloadResources = [];
    private array $prefetchResources = [];
    private array $modulePreloadResources = [];
    private ?array $manifest = null;

    /**
     * Add a resource for preloading with proper attributes
     */
    public function preload(string $href, string $as, array $attributes = []): self
    {
        $resource = array_merge([
            'href' => $href,
            'as' => $as,
            'rel' => 'preload'
        ], $attributes);

        // Add crossorigin for fonts, scripts, and certain images
        if (in_array($as, ['font', 'script', 'fetch']) || 
            (isset($attributes['crossorigin']) && $attributes['crossorigin'])) {
            $resource['crossorigin'] = $attributes['crossorigin'] ?? 'anonymous';
        }

        // Add fetchpriority for critical resources
        if (in_array($as, ['image', 'script']) && !isset($resource['fetchpriority'])) {
            $resource['fetchpriority'] = 'high';
        }

        $this->preloadResources[] = $resource;
        return $this;
    }

    /**
     * Add a resource for prefetching
     */
    public function prefetch(string $href, array $attributes = []): self
    {
        $resource = array_merge([
            'href' => $href,
            'rel' => 'prefetch'
        ], $attributes);

        $this->prefetchResources[] = $resource;
        return $this;
    }

    /**
     * Add a module for module preloading
     */
    public function modulePreload(string $href, array $attributes = []): self
    {
        $resource = array_merge([
            'href' => $href,
            'rel' => 'modulepreload',
            'crossorigin' => 'anonymous'
        ], $attributes);

        $this->modulePreloadResources[] = $resource;
        return $this;
    }

    /**
     * Preload critical CSS with proper attributes
     */
    public function preloadCss(string $href, bool $critical = false): self
    {
        $attributes = ['type' => 'text/css'];
        
        if ($critical) {
            $attributes['fetchpriority'] = 'high';
        }

        return $this->preload($href, 'style', $attributes);
    }

    /**
     * Preload hero/critical images
     */
    public function preloadImage(string $href, bool $isHero = false): self
    {
        $attributes = [];
        
        if ($isHero) {
            $attributes['fetchpriority'] = 'high';
        }

        return $this->preload($href, 'image', $attributes);
    }

    /**
     * Preload fonts with proper crossorigin
     */
    public function preloadFont(string $href, string $type = 'font/woff2'): self
    {
        return $this->preload($href, 'font', [
            'type' => $type,
            'crossorigin' => 'anonymous'
        ]);
    }

    /**
     * Preload JavaScript bundles
     */
    public function preloadScript(string $href, bool $critical = false): self
    {
        $attributes = [];
        
        if ($critical) {
            $attributes['fetchpriority'] = 'high';
        }

        return $this->preload($href, 'script', $attributes);
    }

    /**
     * Auto-detect and preload critical resources from manifest
     */
    public function preloadCriticalResources(string $page = 'home'): self
    {
        $manifest = $this->getManifest();
        
        if (!$manifest) {
            return $this;
        }

        // Preload critical CSS
        $this->preloadCriticalCss($manifest);
        
        // Preload critical JavaScript chunks
        $this->preloadCriticalJs($manifest);
        
        // Preload hero images based on page
        $this->preloadHeroImages($page);
        
        // Preload critical fonts
        $this->preloadCriticalFonts();

        return $this;
    }

    /**
     * Add predicted navigation routes for prefetching
     */
    public function prefetchNavigationRoutes(array $routes): self
    {
        foreach ($routes as $route) {
            $this->prefetch($route);
        }

        return $this;
    }

    /**
     * Get predicted routes based on current page
     */
    public function getPredictedRoutes(): array
    {
        $currentRoute = request()->route()?->getName();
        
        return match($currentRoute) {
            'home' => [
                route('login'),
                route('register') ?? '/register',
                route('discover') ?? '/discover'
            ],
            'login' => [
                route('register') ?? '/register',
                route('home') ?? '/'
            ],
            'register' => [
                route('login'),
                route('home') ?? '/'
            ],
            'profile.show' => [
                route('dashboard') ?? '/dashboard',
                route('profile.edit') ?? '/profile/edit'
            ],
            default => [
                route('home') ?? '/',
                route('discover') ?? '/discover'
            ]
        };
    }

    /**
     * Render all preload tags
     */
    public function renderPreloadTags(): string
    {
        $html = '';
        
        // Render preload resources
        foreach ($this->preloadResources as $resource) {
            $html .= $this->renderLinkTag($resource) . "\n";
        }
        
        // Render modulepreload resources
        foreach ($this->modulePreloadResources as $resource) {
            $html .= $this->renderLinkTag($resource) . "\n";
        }

        return $html;
    }

    /**
     * Render all prefetch tags
     */
    public function renderPrefetchTags(): string
    {
        $html = '';
        
        foreach ($this->prefetchResources as $resource) {
            $html .= $this->renderLinkTag($resource) . "\n";
        }

        return $html;
    }

    /**
     * Get the Vite manifest
     */
    private function getManifest(): ?array
    {
        if ($this->manifest !== null) {
            return $this->manifest;
        }

        $manifestPath = public_path('build/manifest.json');
        
        if (!File::exists($manifestPath)) {
            return $this->manifest = null;
        }

        $this->manifest = json_decode(File::get($manifestPath), true);
        return $this->manifest;
    }

    /**
     * Preload critical CSS from manifest
     */
    private function preloadCriticalCss(array $manifest): void
    {
        foreach ($manifest as $key => $file) {
            if (str_ends_with($key, '.css') && 
                (str_contains($key, 'app') || str_contains($key, 'critical'))) {
                $this->preloadCss(asset('build/' . $file['file']), true);
            }
        }
    }

    /**
     * Preload critical JavaScript chunks
     */
    private function preloadCriticalJs(array $manifest): void
    {
        // Preload main app bundle
        if (isset($manifest['resources/js/app.jsx'])) {
            $appFile = $manifest['resources/js/app.jsx'];
            $this->modulePreload(asset('build/' . $appFile['file']));
        }

        // Preload critical vendor chunks
        foreach ($manifest as $key => $file) {
            if (isset($file['file']) && (
                str_contains($file['file'], 'react-vendor') ||
                str_contains($file['file'], 'inertia-framework') ||
                str_contains($file['file'], 'app-store')
            )) {
                $this->modulePreload(asset('build/' . $file['file']));
            }
        }
    }

    /**
     * Preload hero images based on page
     */
    private function preloadHeroImages(string $page): void
    {
        $heroImages = [
            'home' => [
                // Critical hero background image - prioritize WebP/AVIF formats
                'resources/assets/new/HeroBg.webp',
                'resources/assets/new/HeroBg.avif', 
                'resources/assets/new/HeroBg.png',
                // Mobile-specific hero background
                'resources/assets/new/HeroBg-mobile.webp',
                'resources/assets/new/HeroBg-mobile.avif',
                'resources/assets/new/HeroBg-mobile.png',
                // Other critical images
                'build/assets/logo-164abf9b.png',
                'resources/assets/img/itsfree.png',
                'resources/assets/img/itsfree-mob.png',
                'build/assets/siteicon-cf8a44f4.png'
            ],
            'profile' => [
                'build/assets/logo-164abf9b.png',
                'build/assets/siteicon-cf8a44f4.png'
            ],
            'dashboard' => [
                'build/assets/logo-164abf9b.png'
            ]
        ];

        if (isset($heroImages[$page])) {
            foreach ($heroImages[$page] as $image) {
                $this->preloadImage(asset($image), true);
            }
        }
    }

    /**
     * Preload critical fonts
     */
    private function preloadCriticalFonts(): void
    {
        // Optimized self-hosted fonts - ordered by priority (most critical first)
        $fonts = [
            // Primary font used for body text - highest priority (50% size reduction)
            asset('resources/assets/fonts/optimized/CeraGRMedium.woff2'),
            // Secondary font used for headings - 28% size reduction
            asset('resources/assets/fonts/optimized/newfont.woff2'),
            // Bold variant - lower priority, 49% size reduction
            asset('resources/assets/fonts/optimized/CeraGRBold.woff2')
        ];

        foreach ($fonts as $font) {
            $this->preloadFont($font);
        }
    }

    /**
     * Render a link tag with attributes
     */
    private function renderLinkTag(array $attributes): string
    {
        $attributeString = '';
        
        foreach ($attributes as $key => $value) {
            if (is_bool($value) && $value) {
                $attributeString .= " {$key}";
            } elseif (!is_bool($value) && $value !== null) {
                $attributeString .= " {$key}=\"" . htmlspecialchars($value) . "\"";
            }
        }

        return "<link{$attributeString}>";
    }

    /**
     * Reset all resources (useful for testing)
     */
    public function reset(): self
    {
        $this->preloadResources = [];
        $this->prefetchResources = [];
        $this->modulePreloadResources = [];
        return $this;
    }

    /**
     * Get all resources for debugging
     */
    public function getResources(): array
    {
        return [
            'preload' => $this->preloadResources,
            'prefetch' => $this->prefetchResources,
            'modulepreload' => $this->modulePreloadResources
        ];
    }
}
