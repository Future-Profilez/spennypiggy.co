<?php
namespace App;

use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Http;
use Noweh\TwitterApi\Client;

class TwitterAuthService {
    private static $consumerKey;

    private static $consumerSecret;

    /**
     * Twitter APIv2 Client
     * @var \Noweh\TwitterApi\Client
     */
    public static $xClient;

    /**
     * Set basic configurations
     * @return void
     */
    public static function setConfigs()
    {
        if(!isset(self::$consumerKey)){
            self::$consumerKey      = env('TWITTER_CONSUMER_KEY', null);
            self::$consumerSecret   = env('TWITTER_CONSUMER_SECRET', null);
        }
    }

    /**
     * Generate Authorize URL For OAuth2.o
     *
     * @param string $state State Verification
     * @param string $challenge Code Challenge
     * @param string $redirectUrl Callback URL
     * @return string
     */
    public static function getAuth2Url($state, $challenge, $redirectUrl) : string
    {
        self::setConfigs();
        $scopes =   'tweet.read%20users.read%20tweet.write%20offline.access';
        $params =   [
            'response_type' =>  'code',
            'client_id'     =>  self::$consumerKey,
            'redirect_uri'  =>  $redirectUrl,
            'state'         =>  $state,
            'code_challenge'=>  $challenge,
            'code_challenge_method' =>  'plain'
        ];

        return "https://twitter.com/i/oauth2/authorize?" . http_build_query($params) . "&scope=$scopes";
    }

    /**
     * Get Token after Callback
     *
     * @param string $code Authorized Code returned from Twitter
     * @param string $challenge Challenge Code
     * @param string $redirectUrl Callback URL
     * @return array
     */
    public static function getAuthToken($code, $challenge, $redirectUrl)
    {
        self::setConfigs();
        $req = Http::acceptJson()
        ->withBasicAuth(self::$consumerKey, self::$consumerSecret)
        ->asForm()
            ->post('https://api.twitter.com/2/oauth2/token', [
                "grant_type" => "authorization_code",
                "code" => $code,
                "client_id" => self::$consumerKey,
                "redirect_uri" => $redirectUrl,
                "code_verifier" => $challenge,
            ]);

        return [
            'success'   =>  $req->successful(),
            // 'body'      =>  $req->body(),
            'data'      =>  $req->json()
        ];
    }

    /**
     * Refresh Auth Token
     *
     * @param \App\Models\TwitterToken $token
     * @return Throwable|\App\Models\TwitterToken
     */
    public static function refreshToken($token)
    {
        self::setConfigs();
        $req = Http::acceptJson()->asForm()
                ->withBasicAuth(self::$consumerKey, self::$consumerSecret)
                ->post('https://api.twitter.com/2/oauth2/token', [
                    'grant_type'    =>  'refresh_token',
                    'client_id'     =>  self::$consumerKey,
                    'refresh_token' =>  $token->refresh_token
                ]);
        if($req->successful()){
            $token->token   =   $req->json('access_token');
            $token->refresh_token    =  $req->json('refresh_token');
            $token->expires_at  =   Carbon::now()->addSeconds($req->json('expires_in'));
            $token->save();
            return $token;
        }

        throw new Exception($req->json('error') .":". $req->json('error_description'));
    }

    /**
     * Check & Update refresh token if Expired
     *
     * @param \App\Models\TwitterToken $token
     * @return Throwable|\App\Models\TwitterToken
     */
    public static function checkToken($token)
    {
        if($token->expires_at->isPast()){
            $token = self::refreshToken($token);
        }
        return $token->refresh();
    }

    /**
     * Get Self Details
     *
     * @param \App\Models\TwitterToken $token
     * @return array
     */
    public static function getSelf($token)
    {
        $token  =   self::checkToken($token);
        $req    =   Http::acceptJson()->withToken($token->token)
            ->get('https://api.twitter.com/2/users/me');

        return [
            'success'   =>  true,
            'data'      =>  $req->json('data')
        ];
    }

    /**
     * Upload a file to Tweetter
     * only Image
     * @param \App\Models\TwitterToken $token
     * @param string $content base64 encoded Content
     * @return array
     */
    public static function uploadMedia($token,  $content) : array
    {
        self::setConfigs();
        $token  =   self::checkToken($token);
        $payload    =   [
            'media_category'    =>  'tweet_image',
            'media_data'        =>  $content,
            'taged_user_ids'    =>[
                "1715527416569876480"
            ]
        ];

        $req    =   Http::acceptJson()
            ->withToken($token->token)
            // ->withBasicAuth(self::$consumerKey, self::$consumerSecret)
            ->asForm()
            ->post('https://upload.twitter.com/1.1/media/upload.json', $payload);
        return [
            'success'   =>  $req->status(),
            'data'      =>  $req->json(),
            'body'      =>  $req->body()
        ];
    }

    /**
     * Post A Tweet
     *
     * @param \App\Models\TwitterToken $token
     * @param string $text Twitter Text
     * @param array $mediaIds Media IDs in array
     * @return array
     */
    public static function postTweet($token, $text, $mediaIds = []) : array
    {
        $token  =   self::checkToken($token);
        $payload = [
            "text"  =>  $text
        ];
        if(!empty($mediaIds)) {
            $payload["media"]   =   [
                "media_ids" =>  $mediaIds,
                "tagged_user_ids"   => ["1715527416569876480"] //@SpennyPiggy
            ];
        }
        $req    =   Http::acceptJson()->withToken($token->token)
            ->post('https://api.twitter.com/2/tweets', $payload);
        return [
            'success'   =>  $req->successful(),
            'data'      =>  $req->json()
        ];
    }
}
