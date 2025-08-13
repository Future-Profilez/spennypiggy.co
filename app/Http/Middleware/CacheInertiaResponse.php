<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CacheInertiaResponse
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        // Skip caching for non-GET requests and authenticated users with write operations
        if (!$request->isMethod('GET') || $this->shouldSkipCache($request)) {
            return $next($request);
        }

        // Generate cache key based on request
        $cacheKey = $this->generateCacheKey($request);

        // Try to get cached response
        $cachedResponse = Cache::get($cacheKey);
        
        if ($cachedResponse) {
            return $this->createResponseFromCache($cachedResponse);
        }

        // Process request
        $response = $next($request);

        // Cache the response if it's successful
        if ($response->isSuccessful() && $this->shouldCache($response)) {
            $this->cacheResponse($cacheKey, $response);
        }

        // Add compression headers
        return $this->addCompressionHeaders($response);
    }

    /**
     * Determine if caching should be skipped
     */
    private function shouldSkipCache(Request $request): bool
    {
        // Skip cache for authenticated users on certain routes
        if ($request->user() && $this->isUserSpecificRoute($request)) {
            return true;
        }

        // Skip cache for pages with dynamic content
        $skipRoutes = [
            'dashboard',
            'profile.edit',
            'checkout.*',
            'admin.*',
        ];

        foreach ($skipRoutes as $route) {
            if ($request->routeIs($route)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if route is user-specific
     */
    private function isUserSpecificRoute(Request $request): bool
    {
        $userSpecificRoutes = [
            'user.show',
            'profile.*',
            'dashboard',
            'notifications.*',
        ];

        foreach ($userSpecificRoutes as $route) {
            if ($request->routeIs($route)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate cache key for request
     */
    private function generateCacheKey(Request $request): string
    {
        $key = 'inertia_response:' . md5(
            $request->getRequestUri() .
            $request->header('X-Inertia-Version', '') .
            ($request->user() ? $request->user()->id : 'guest')
        );

        return $key;
    }

    /**
     * Determine if response should be cached
     */
    private function shouldCache(SymfonyResponse $response): bool
    {
        // Only cache successful responses
        if (!$response->isSuccessful()) {
            return false;
        }

        // Check if response is Inertia response
        if (!$response->headers->has('X-Inertia')) {
            return false;
        }

        // Don't cache responses with user-specific content
        $content = $response->getContent();
        if (str_contains($content, '"auth"') || str_contains($content, '"user"')) {
            return false;
        }

        return true;
    }

    /**
     * Cache the response
     */
    private function cacheResponse(string $key, SymfonyResponse $response): void
    {
        $cacheData = [
            'content' => $response->getContent(),
            'headers' => $response->headers->all(),
            'status' => $response->getStatusCode(),
        ];

        // Compress content before caching
        if (function_exists('gzcompress')) {
            $cacheData['content'] = gzcompress($cacheData['content'], 6);
            $cacheData['compressed'] = true;
        }

        // Cache for different durations based on content type
        $ttl = $this->getCacheDuration($response);
        
        Cache::put($key, $cacheData, $ttl);
    }

    /**
     * Get cache duration based on response
     */
    private function getCacheDuration(SymfonyResponse $response): int
    {
        // Static pages - cache longer
        if ($this->isStaticContent($response)) {
            return 3600; // 1 hour
        }

        // Dynamic pages - cache shorter
        return 300; // 5 minutes
    }

    /**
     * Check if response contains static content
     */
    private function isStaticContent(SymfonyResponse $response): bool
    {
        $content = $response->getContent();
        
        // Check for indicators of static content
        $staticIndicators = [
            '"component":"Welcome"',
            '"component":"About"',
            '"component":"Terms"',
            '"component":"Privacy"',
        ];

        foreach ($staticIndicators as $indicator) {
            if (str_contains($content, $indicator)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create response from cached data
     */
    private function createResponseFromCache(array $cachedData): Response
    {
        $content = $cachedData['content'];
        
        // Decompress if needed
        if (isset($cachedData['compressed']) && $cachedData['compressed']) {
            $content = gzuncompress($content);
        }

        $response = new Response(
            $content,
            $cachedData['status'],
            $cachedData['headers']
        );

        // Add cache hit header
        $response->headers->set('X-Cache-Status', 'HIT');
        
        return $this->addCompressionHeaders($response);
    }

    /**
     * Add compression headers to response
     */
    private function addCompressionHeaders(SymfonyResponse $response): SymfonyResponse
    {
        // Enable compression for text-based responses
        if ($this->shouldCompress($response)) {
            $response->headers->set('Content-Encoding', 'gzip');
            $response->headers->set('Vary', 'Accept-Encoding');
        }

        // Add cache control headers
        if ($response->isSuccessful()) {
            $response->headers->set('Cache-Control', 'public, max-age=300, s-maxage=600');
            $response->headers->set('ETag', md5($response->getContent()));
        }

        return $response;
    }

    /**
     * Check if response should be compressed
     */
    private function shouldCompress(SymfonyResponse $response): bool
    {
        $contentType = $response->headers->get('content-type', '');
        
        $compressibleTypes = [
            'text/html',
            'application/json',
            'text/css',
            'text/javascript',
            'application/javascript',
        ];

        foreach ($compressibleTypes as $type) {
            if (str_contains($contentType, $type)) {
                return true;
            }
        }

        return false;
    }
}
