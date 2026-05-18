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
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s') . ' GMT');
        $response->headers->set('X-Accel-Expires', '0');
        $response->headers->set('Surrogate-Control', 'no-store');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        
        // Remove any etag to prevent conditional caching
        $response->headers->remove('ETag');
        
        return $response;
    }
    
    /**
     * Serve robots.txt directly without file system dependency
     */
    public function robots()
    {
        $siteUrl = config('app.url');
        $content = "User-agent: *\n";
        $content .= "Allow: /\n\n";
        $content .= "Disallow: /admin/\n";
        $content .= "Disallow: /api/\n";
        $content .= "Disallow: /dashboard/\n";
        $content .= "Disallow: /account/\n";
        $content .= "Disallow: /login\n";
        $content .= "Disallow: /signup-confirm\n\n";
        $content .= "Sitemap: {$siteUrl}/sitemap.xml\n";
        
        // Create response with aggressive cache prevention
        $response = new Response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
        
        // Add aggressive cache prevention headers
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s') . ' GMT');
        $response->headers->set('X-Accel-Expires', '0');
        $response->headers->set('Surrogate-Control', 'no-store');
        
        // Remove any etag to prevent conditional caching
        $response->headers->remove('ETag');
        
        return $response;
    }
}