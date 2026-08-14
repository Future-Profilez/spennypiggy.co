<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Str;

class SeoController extends Controller
{
    /**
     * Serve robots.txt with aggressive anti-caching headers
     */
    public function robotsTxt()
    {
        // Same rule as robots(): a non-production host serves a permissive file
        // with no sitemaps, so the crawler can reach the noindex on every page.
        if (! config('seo.indexable')) {
            return $this->noStoreTextResponse(
                "# Non-production environment. Crawling is allowed ONLY so that\n"
                ."# the noindex on every page can be read; nothing here should be indexed.\n"
                ."User-agent: *\n"
                ."Allow: /\n"
            );
        }

        $siteUrl = config('app.url');
        $content = file_get_contents(resource_path('proxy/robots.txt'));
        $content = Str::replace('[SITE_URL]', $siteUrl, $content);

        // Create response with aggressive cache prevention
        $response = new Response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);

        // Add aggressive cache prevention headers
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s').' GMT');
        $response->headers->set('X-Accel-Expires', '0');
        $response->headers->set('Surrogate-Control', 'no-store');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        // Remove any etag to prevent conditional caching
        $response->headers->remove('ETag');

        return $response;
    }

    /**
     * A text/plain response nothing is allowed to cache.
     *
     * robots.txt is the one file where a stale cached copy is expensive: a CDN
     * holding yesterday's version keeps directing crawlers by rules that have
     * been replaced.
     */
    private function noStoreTextResponse(string $content): Response
    {
        $response = new Response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);

        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s').' GMT');
        $response->headers->set('X-Accel-Expires', '0');
        $response->headers->set('Surrogate-Control', 'no-store');
        $response->headers->remove('ETag');

        return $response;
    }

    /**
     * Serve robots.txt directly without file system dependency
     */
    public function robots()
    {
        $siteUrl = rtrim(config('app.url'), '/');

        // Keep this list in step with StaticPageSeoMiddleware's noindex rules.
        // robots.txt stops the crawl; the meta tag stops the indexing — a URL that
        // is only Disallow'd here can still be indexed from an external link, so
        // anything that must never appear in results needs both.
        $disallow = [
            '/admin/',
            '/api/',
            '/dashboard',
            '/account',
            '/cart',
            '/checkout',
            '/thank-you',
            '/my-purchases',
            '/history',
            '/settings',
            '/subscriptions',
            '/email-preferences',
            '/unsubscribe/',
            '/financial',
            '/creator/',
            '/emulate',
            '/webhook',
            '/debug*',
            '/test*',
            '/seed*',
            '/dev/',
        ];

        // ⚠️ A non-production host does NOT get `Disallow: /`. Google has to CRAWL
        // a page to see the noindex on it, so blocking the crawler is exactly what
        // keeps an already-indexed dev site in the results forever. The crawl stays
        // open, every response carries noindex (StaticPageSeoMiddleware), and the
        // pages drop out. No sitemaps are advertised — there is nothing here that
        // should be discovered in the first place.
        if (! config('seo.indexable')) {
            $content = "# Non-production environment. Crawling is allowed ONLY so that\n"
                ."# the noindex on every page can be read; nothing here should be indexed.\n"
                ."User-agent: *\n"
                ."Allow: /\n";

            return $this->noStoreTextResponse($content);
        }

        $content = "User-agent: *\n";
        $content .= "Allow: /\n\n";
        foreach ($disallow as $path) {
            $content .= "Disallow: {$path}\n";
        }
        $content .= "\n";
        // /sitemap.xml is the sitemap INDEX — it links the static, creator, wishlist
        // and post sitemaps. The children are listed too so a crawler that only reads
        // robots.txt still finds them.
        $content .= "Sitemap: {$siteUrl}/sitemap.xml\n";
        $content .= "Sitemap: {$siteUrl}/seo/sitemap-static.xml\n";
        $content .= "Sitemap: {$siteUrl}/seo/sitemap-creators.xml\n";
        $content .= "Sitemap: {$siteUrl}/seo/sitemap-wishlists.xml\n";
        $content .= "Sitemap: {$siteUrl}/seo/sitemap-posts.xml\n";
        $content .= "Sitemap: {$siteUrl}/seo/sitemap-shop-items.xml\n";
        $content .= "Sitemap: {$siteUrl}/seo/sitemap-tasks.xml\n";

        // Create response with aggressive cache prevention
        $response = new Response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);

        // Add aggressive cache prevention headers
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s').' GMT');
        $response->headers->set('X-Accel-Expires', '0');
        $response->headers->set('Surrogate-Control', 'no-store');

        // Remove any etag to prevent conditional caching
        $response->headers->remove('ETag');

        return $response;
    }
}
