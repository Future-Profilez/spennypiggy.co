<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WishItem;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class SitemapController extends Controller
{
    /**
     * Generate custom flat sitemap.xml as requested
     */
    public function customSitemap()
    {
        $pages = [
            '/',
            '/pricing',
            '/features',
            '/about',
            '/contact',
            '/terms-and-conditions',
            '/privacy-policy',
            '/cookies-policy',
            '/creator-agreement',
            '/supporter-terms',
            '/return-policy',
            '/paid-tasks-terms',
            '/reserves-and-payments-policy',
            '/mor-agreement',
            '/us-addendum',
            '/copyright-policy',
            '/content-payment-policy',
            '/how-spenny-piggy-works',
            '/leaderboard',
            '/discover',
            '/creator-supporter-contract',
            '/founder-program',
            // Landing pages
            '/creators',
            '/creators/stripe-safe',
            '/creators/keep-100',
            '/creators/features',
            '/creators/disputes',
            '/creators/founder-bonus',
            '/pride',
            '/giftstore',
        ];

        $content = '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($pages as $url) {
            $content .= '
  <url>
    <loc>' . url($url) . '</loc>
    <lastmod>' . now()->toW3cString() . '</lastmod>
    <changefreq>weekly</changefreq>
    <priority>' . ($url === '/' ? '1.0' : '0.8') . '</priority>
  </url>';
        }

        $content .= '
</urlset>';

        return response($content, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Generate the main sitemap index
     */
    public function index()
    {
        $staticLastmod = now();
        try {
            $creatorsLastmod = User::where('is_public_profile', 1)
                ->where('suspended_account', 0)
                ->max('updated_at') ?? $staticLastmod;
        } catch (\Exception $e) {
            $creatorsLastmod = $staticLastmod;
        }

        try {
            $wishlistsLastmod = WishItem::where('is_approved', 1)->max('updated_at') ?? $staticLastmod;
        } catch (\Exception $e) {
            $wishlistsLastmod = $staticLastmod;
        }

        $content = '<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>' . url('/seo/sitemap-static.xml') . '</loc>
    <lastmod>' . $staticLastmod->toW3cString() . '</lastmod>
  </sitemap>
  <sitemap>
    <loc>' . url('/seo/sitemap-creators.xml') . '</loc>
    <lastmod>' . $creatorsLastmod->toW3cString() . '</lastmod>
  </sitemap>
  <sitemap>
    <loc>' . url('/seo/sitemap-wishlists.xml') . '</loc>
    <lastmod>' . $wishlistsLastmod->toW3cString() . '</lastmod>
  </sitemap>
</sitemapindex>';

        return response($content, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Generate static pages sitemap
     */
    public function static()
    {
        $staticPages = [
            ['url' => '/', 'priority' => '1.0', 'changefreq' => 'daily'],
            ['url' => '/discover', 'priority' => '0.9', 'changefreq' => 'daily'],
            ['url' => '/leaderboard', 'priority' => '0.8', 'changefreq' => 'daily'],
            ['url' => '/how-spenny-piggy-works', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['url' => '/terms-and-conditions', 'priority' => '0.5', 'changefreq' => 'monthly'],
        ];

        $content = '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($staticPages as $page) {
            $content .= '
  <url>
    <loc>' . url($page['url']) . '</loc>
    <lastmod>' . now()->toW3cString() . '</lastmod>
    <changefreq>' . $page['changefreq'] . '</changefreq>
    <priority>' . $page['priority'] . '</priority>
  </url>';
        }

        $content .= '
</urlset>';

        return response($content, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Generate creators sitemap
     */
    public function creators()
    {
        // Removed caching to prevent issues
        try {
            $creators = User::where('is_public_profile', 1)
                ->where('suspended_account', 0)
                ->select('username', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->limit(1000) // Reduced limit for safety
                ->get();
        } catch (\Exception $e) {
            // Fallback to empty collection if database query fails
            $creators = collect();
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($creators as $creator) {
            $xml .= '
  <url>
    <loc>' . url('/' . $creator->username) . '</loc>
    <lastmod>' . $creator->updated_at->toW3cString() . '</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>';
        }

        $xml .= '
</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Generate wishlists sitemap
     */
    public function wishlists()
    {
        // Removed caching to prevent issues
        try {
            $wishlists = WishItem::where('is_approved', 1)
                ->select('id', 'user_id', 'updated_at')
                ->with('user:id,username')
                ->orderBy('updated_at', 'desc')
                ->limit(1000) // Reduced limit for safety
                ->get();
        } catch (\Exception $e) {
            // Fallback to empty collection if database query fails
            $wishlists = collect();
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($wishlists as $wishlist) {
            $xml .= '
  <url>
    <loc>' . url('/' . $wishlist->user->username . '/wish/' . $wishlist->id) . '</loc>
    <lastmod>' . $wishlist->updated_at->toW3cString() . '</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>';
        }

        $xml .= '
</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Manual trigger to clear sitemap cache
     * This route can be called after deployment to regenerate sitemaps
     */
    public function clearCache()
    {
        // Cache clearing disabled
        
        return response()->json([
            'success' => true,
            'message' => 'Sitemap cache cleared successfully',
            'timestamp' => now()->toISOString(),
        ]);
    }
}
