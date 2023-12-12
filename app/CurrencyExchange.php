<?php

namespace App;

use Illuminate\Support\Facades\Http;

/**
 * Class For Get Exchange of Currency
 * Daily Based
 *
 * @see https://www.exchangerate-api.com/docs/standard-requests
 */
class CurrencyExchange {


    /**
     * Exchange API EndPoint
     * @var string
     */
    public static $host;

    /**
     * Exchange API KEY
     * @var string
     */
    protected static $key;

    /**
     * Set Basic Configs
     *
     * @return void
     */
    public static function setConfings() : void
    {
        if(!isset(self::$host)){
            static::$host   =   env('EXCHANGE_HOST');
            static::$key    =   env('EXCHANGE_KEY');
        }
    }

    /**
     * Get Exchange Rates
     *
     * @param string $base Base Currency
     * @return Throwable|array
     */
    public static function getRates($base = 'GBP')
    {
        self::setConfings();
        $endpoint = self::$host .'/'. self::$key ."/latest/$base";
        $req    =   Http::acceptJson()->get($endpoint);

        return [
            'success'   =>  $req->successful(),
            'data'      =>  $req->json()
        ];
    }



}
