<?php

namespace App;

use Exception;
use ipinfo\ipinfo\IPinfo;
use ipinfo\ipinfo\IPinfoException;
use stdClass;

class IpTracker {


    /**
     * IpInfo Token
     * @var string
     * @see https://ipinfo.io/account/token
     */
    private static $token;

    /**
     * IpInfo Client
     * @var \ipinfo\ipinfo\IPinfo
     * @see https://github.com/ipinfo/php
     */
    protected static $client;

    /**
     * IpInfo Payload
     * @var \ipinfo\ipinfo\Details
     */
    public static $ipInfo;

    /**
     * Visitor's IP Address
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
        if(isset(static::$client)){
            // static::$client = new IPinfo(env('IP_TOKEN'));
            static::$ip =   $ip ?? self::getIp();
        }
    }

    /**
     * Get Visitors Ip Address
     * @return string
     */
    public static function getIp(){
        // Get real visitor IP behind CloudFlare network
        if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
                $_SERVER['REMOTE_ADDR'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
                $_SERVER['HTTP_CLIENT_IP'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
        }
        $client  = @$_SERVER['HTTP_CLIENT_IP'];
        $forward = @$_SERVER['HTTP_X_FORWARDED_FOR'];
        $remote  = $_SERVER['REMOTE_ADDR'];

        if(filter_var($client, FILTER_VALIDATE_IP))
        {
            $ip = $client;
        }
        elseif(filter_var($forward, FILTER_VALIDATE_IP))
        {
            $ip = $forward;
        }
        else
        {
            $ip = $remote;
        }

        return $ip;

    }


    /**
     * Get Ip Information
     *
     * @param string $ip IP Address
     * @return void
     */
    public static function getIpInfo($ip = NULL)
    {
        self::setConfs($ip);
        try {
            $client = new IPinfo(env("IP_TOKEN"));
            static::$ipInfo = $client->getDetails(self::$ip);
        } catch (IPinfoException $e){
            throw new Exception($e->getMessage());
        }

    }
}
