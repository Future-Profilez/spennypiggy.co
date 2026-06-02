<?php

namespace App;

use Exception;
use Illuminate\Support\Facades\Http;
use Uploadcare\Api;
use Uploadcare\Apis\FileApi;
use Uploadcare\AuthUrl\AuthUrlConfig;
use Uploadcare\AuthUrl\Token\AkamaiToken;
use Uploadcare\Configuration;
use Uploadcare\File\File;
use Uploadcare\Interfaces\Conversion\ConversionRequestInterface;
use Image;

class Uploadcare
{

    private static $public, $secret, $host;

    /**
     * Set Config Attributes
     */
    private static function setAttrs(): void
    {
        self::$public = config('services.uploadcare.public');
        self::$secret = config('services.uploadcare.secret');
        self::$host = config('services.uploadcare.host', 'https://api.uploadcare.com/');
    }

    /**
     * Create API Object and return it
     *
     * @return \Uploadcare\Api
     */
    public static function getApiObj()
    {
        static::setAttrs();
        $config = Configuration::create(config('services.uploadcare.public'), config('services.uploadcare.secret'));
        $api = new Api($config);
        return $api;
    }

    /**
     * Generate Thumbnail Of an Video
     *
     * @param string $uuid Video's UUID
     * @return array
     */
    public static function generateThumb($uuid, $duration = null): array
    {
        $time = 10;

        if (!empty($duration)) {
            $seconds = round($duration / 1000, 2);
            if ($seconds > 30) {
                $time = 10;
            } else {
                $time = round($seconds / 2);
            }
        }


        $req = Http::accept('application/vnd.uploadcare-v0.7+json')
            ->contentType('application/json')
            ->withHeaders([
                'Authorization' => "Uploadcare.Simple " . config("services.uploadcare.public") . ":" . config('services.uploadcare.secret')
            ])
            ->post(config("services.uploadcare.host", "https://api.uploadcare.com/") . "convert/video/", [
                "paths" => ["$uuid/video/-/cut/0:0:05.001/0:$time.0/"],
                "store" => 1
            ]);

        return [
            'status' => $req->successful(),
            "code" => $req->status(),
            "result" => $req->json()
        ];
    }

    /**
     * Create Video Preview
     * with Thumbnail
     *
     * @param string $uuid Video UUID
     * @return array
     */
    public static function createVideoPreview($uuid): array
    {
        $req = Http::accept('application/vnd.uploadcare-v0.7+json')
            ->contentType('application/json')
            ->withHeaders([
                'Authorization' => "Uploadcare.Simple " . config("services.uploadcare.public") . ":" . config('services.uploadcare.secret')
            ])
            ->post(config("services.uploadcare.host", "https://api.uploadcare.com/") . "convert/video/", [
                "paths" => ["$uuid/video/-/cut/0:0:01.001/0:20.0/"],
                "store" => 1
            ]);

        return [
            'status' => $req->successful(),
            "code" => $req->status(),
            "result" => $req->json()
        ];
    }

    /**
     * Generate File URL oF Uploadcare
     *
     * @param string $uuid Fill UUID
     * @param array $type Type of file Image/Video
     * @param array $watermark Water Image UUID
     * @param array $check Watermark Text
     * @return string
     */
    public static function getUrl($uuid, $type, $watermark = false, $check = false)
    {
        static::setAttrs();
        $publicKey = self::$public;
        $secretKey = self::$secret;


        $authUrlConfig = new AuthUrlConfig('ucarecdn.com', new AkamaiToken($secretKey, 300));
        $config = Configuration::create($publicKey, $secretKey)->setAuthUrlConfig($authUrlConfig);
        $api = new Api($config);


        if ($type == 'image') {

            $secureUrl = $api->file()->generateSecureUrl($uuid . "/-/overlay/$watermark/100p,2p/100p/$check");
        } else {
            $secureUrl = $api->file()->generateSecureUrl($uuid);
        }

        return $secureUrl;
    }


    /**
     * Get File Info From UploadCare
     *
     * @param string $uuid File UUID
     * @return array
     */
    public static function getFileInfo($uuid)
    {
        $api = static::getApiObj();
        $info = $api->file()->fileInfo($uuid);
        if ($info->isImage()) {
            return $info->getContentInfo()->getImage();
        }
        return $info->getContentInfo()->getVideo();
    }
}
