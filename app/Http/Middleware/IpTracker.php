<?php

namespace App\Http\Middleware;

use App\IpTracker as AppIpTracker;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class IpTracker
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->getHttpHost(), ['::1:8000', 'localhost:8000', '127.0.0.1:8000'])) {
            $ip = $request->ip();
            $cacheKey = "user_locale_" . md5($ip);

            // 1. Try to get from Cache (Server-side) first - fastest
            $geo = \Illuminate\Support\Facades\Cache::get($cacheKey);

            // 2. If not in cache, try Cookie
            if (!$geo) {
                $geo = $request->cookie("locale") ? json_decode($request->cookie('locale'), true) : false;
            }

            // 3. If still nothing or IP changed, resolve from API
            if (!$geo || $geo['ip'] != $ip) {
                // We wrap this in a try-catch to ensure the site doesn't go down if IPInfo is slow/down
                try {
                    AppIpTracker::getIpInfo($ip);
                    $geo = [
                        'ip'        => AppIpTracker::$ipInfo->ip ?? $ip,
                        'country'   => AppIpTracker::$ipInfo->country ?? 'Unknown',
                        'name'      => AppIpTracker::$ipInfo->country_name ?? 'Unknown',
                        'city'      => AppIpTracker::$ipInfo->city ?? 'Unknown',
                        'region'    => AppIpTracker::$ipInfo->region ?? 'Unknown',
                        'currency'  => AppIpTracker::$ipInfo->country_currency->code ?? 'USD',
                    ];

                    // Cache for 24 hours on server
                    \Illuminate\Support\Facades\Cache::put($cacheKey, $geo, 86400);
                    
                    // Also set cookie for 1 year (as before)
                    \Illuminate\Support\Facades\Cookie::queue('locale', json_encode($geo), 60 * 24 * 365);
                } catch (\Exception $e) {
                    Log::error("IP Tracker failed: " . $e->getMessage());
                }
            }
        }
        return $next($request);
    }
}
