<?php

namespace App;

use Exception;
use Illuminate\Support\Facades\Log;
use ipinfo\ipinfo\Details;
use ipinfo\ipinfo\IPinfo;
use ipinfo\ipinfo\IPinfoException;
use stdClass;

class IpTracker
{
    /**
     * IpInfo Token
     *
     * @var string
     *
     * @see https://ipinfo.io/account/token
     */
    private static $token;

    /**
     * IpInfo Client
     *
     * @var IPinfo
     *
     * @see https://github.com/ipinfo/php
     */
    protected static $client;

    /**
     * IpInfo Payload
     *
     * @var Details
     */
    public static $ipInfo;

    /**
     * Visitor's IP Address
     *
     * @var string
     */
    public static $ip;

    /**
     * Set Configs
     *
     * @return void
     */
    public static function setConfs($ip = null)
    {
        if (isset(static::$client)) {
            // static::$client = new IPinfo(env('IP_TOKEN'));
            static::$ip = $ip ?? self::getIp();
        }
    }

    /**
     * Get Visitors Ip Address
     *
     * @return string
     */
    public static function getIp()
    {
        // Get real visitor IP behind CloudFlare network
        if (isset($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $_SERVER['REMOTE_ADDR'] = $_SERVER['HTTP_CF_CONNECTING_IP'];
            $_SERVER['HTTP_CLIENT_IP'] = $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        $client = @$_SERVER['HTTP_CLIENT_IP'];
        $forward = @$_SERVER['HTTP_X_FORWARDED_FOR'];
        $remote = $_SERVER['REMOTE_ADDR'];

        if (filter_var($client, FILTER_VALIDATE_IP)) {
            $ip = $client;
        } elseif (filter_var($forward, FILTER_VALIDATE_IP)) {
            $ip = $forward;
        } else {
            $ip = $remote;
        }

        return $ip;

    }

    /**
     * Get Ip Information
     *
     * @param  string  $ip  IP Address
     * @return void
     */
    public static function getIpInfo($ip = null)
    {
        self::setConfs($ip);
        try {
            $client = new IPinfo(env('IP_TOKEN'), ['timeout' => 2]);
            static::$ipInfo = $client->getDetails(self::$ip);
        } catch (IPinfoException $e) {
            // Silently handle quota exceeded or other IPinfo errors
            // Create a default IP info object to prevent application crashes
            static::$ipInfo = self::createDefaultIpInfo(self::$ip);

            // Optionally log the error for debugging (but don't throw)
            Log::warning('IPinfo API error: '.$e->getMessage(), [
                'ip' => self::$ip,
                'error' => $e->getMessage(),
            ]);
        } catch (Exception $e) {
            // Handle any other exceptions
            static::$ipInfo = self::createDefaultIpInfo(self::$ip);
            Log::warning('Unexpected error in IP tracking: '.$e->getMessage(), [
                'ip' => self::$ip,
            ]);
        }
    }

    /**
     * Create default IP info object when API fails
     *
     * @param  string  $ip
     * @return stdClass
     */
    private static function createDefaultIpInfo($ip)
    {
        $defaultInfo = new stdClass;
        $defaultInfo->ip = $ip;
        $defaultInfo->city = 'Unknown';
        $defaultInfo->region = 'Unknown';
        $defaultInfo->country = 'Unknown';
        $defaultInfo->loc = '0.0,0.0';
        $defaultInfo->org = 'Unknown';
        $defaultInfo->postal = 'Unknown';
        $defaultInfo->timezone = 'UTC';

        return $defaultInfo;
    }
}
