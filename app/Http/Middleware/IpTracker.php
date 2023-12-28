<?php

namespace App\Http\Middleware;

use App\IpTracker as AppIpTracker;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
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

        if(!in_array($request->getHttpHost(), ['::1:8000', 'localhost:8000', '127.0.0.1:8000'])){
            $geo = $request->cookie("locale") ? json_decode($request->cookie('locale'), true) : false;
            if(!$geo OR $geo['ip'] != $request->ip()){
                AppIpTracker::getIpInfo();
                $locale = [
                    'ip'    =>  AppIpTracker::$ipInfo->ip ?? NULL,
                    'country'   => AppIpTracker::$ipInfo->country ?? NULL,
                    'name'  => AppIpTracker::$ipInfo->country_name ?? NULL,
                    'city'  =>  AppIpTracker::$ipInfo->city ?? NULL,
                    'region'=>  AppIpTracker::$ipInfo->region ?? NULL,
                    'currency'  => AppIpTracker::$ipInfo->country_currency->code ?? NULL,
                ];
                Cookie::queue('locale', json_encode($locale), 60*24*365); // for one year
            }

        }
        return $next($request);
    }
}
