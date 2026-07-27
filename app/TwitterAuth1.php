<?php

namespace App;

class TwitterAuth1
{
    private $consumerKey;

    private $consumerSecret;

    private $signatureMethod = 'HMAC-SHA1';

    private $oauthVersion = '1.1';

    private $http_status = '';

    private $callback;

    public function __construct()
    {
        $this->consumerKey = env('X_CKEY', null);
        $this->consumerSecret = env('X_CSECRET', null);
        $this->callback = route('x.handle');
    }

    /**
     * Twitter OAuth Url generate
     *
     * @param  string  $callback=''  Callback url after auth
     * @return string
     */
    public function getOauthVerifier($callback = '')
    {
        if (! empty($callback)) {
            $this->callback = $callback;
        }
        $resp = $this->getRequestToken();
        if ($resp['status']) {

            $authUrl = 'https://api.twitter.com/oauth/authenticate';
            $redirectUrl = $authUrl.'?oauth_token='.$resp['token']['request_token'];

            return [
                'status' => true,
                'url' => $redirectUrl,
                'secret' => $resp['token']['request_token_secret'],
            ];
        } else {
            // $resp['c'] = $this->callback;
            return $resp;
        }
    }

    public function getRequestToken()
    {
        $url = 'https://api.twitter.com/oauth/request_token';

        $params = [
            'oauth_callback' => $this->callback,
            'oauth_consumer_key' => $this->consumerKey,
            'oauth_nonce' => $this->getToken(42),
            'oauth_signature_method' => $this->signatureMethod,
            'oauth_timestamp' => time(),
            'oauth_version' => $this->oauthVersion,
        ];

        $params['oauth_signature'] = $this->createSignature('POST', $url, $params);

        $oauthHeader = $this->generateOauthHeader($params);

        $response = $this->curlHttp('POST', $url, $oauthHeader);

        $responseVariables = [];
        parse_str($response, $responseVariables);

        $tokenResponse = [];

        if (empty($responseVariables['oauth_token'])) {
            return [
                'status' => false,
                'msg' => $response,
            ];
        }

        $tokenResponse['request_token'] = $responseVariables['oauth_token'];
        $tokenResponse['request_token_secret'] = $responseVariables['oauth_token_secret'];

        return [
            'status' => true,
            'token' => $tokenResponse,
        ];
        // return $tokenResponse;
    }

    public function getAccessToken($oauthVerifier, $oauthToken, $oauthTokenSecret)
    {
        $url = 'https://api.twitter.com/oauth/access_token';

        $oauthPostData = [
            'oauth_verifier' => $oauthVerifier,
        ];

        $params = [
            'oauth_consumer_key' => $this->consumerKey,
            'oauth_nonce' => $this->getToken(42),
            'oauth_signature_method' => $this->signatureMethod,
            'oauth_timestamp' => time(),
            'oauth_token' => $oauthToken,
            'oauth_version' => $this->oauthVersion,
        ];

        $params['oauth_signature'] = $this->createSignature('POST', $url, $params, $oauthTokenSecret);

        $oauthHeader = $this->generateOauthHeader($params);

        $response = $this->curlHttp('POST', $url, $oauthHeader, $oauthPostData);
        // $fp = fopen("eg.log", "a");
        // fwrite($fp, "AccessToken: " . $response . "\n");

        $responseVariables = [];
        parse_str($response, $responseVariables);

        if (empty($responseVariables['oauth_token'])) {
            return [
                'status' => false,
                'msg' => $response,
            ];
        }

        $tokenResponse = [];
        $tokenResponse['access_token'] = $responseVariables['oauth_token'];
        $tokenResponse['access_token_secret'] = $responseVariables['oauth_token_secret'];

        return [
            'status' => true,
            'token' => $tokenResponse,
        ];
        // return $tokenResponse;
    }

    public function getUserData($oauthVerifier, $oauthToken, $oauthTokenSecret = '')
    {
        $resp = $this->getAccessToken($oauthVerifier, $oauthToken, $oauthTokenSecret);

        if ($resp['status']) {

            $url = 'https://api.twitter.com/1.1/account/verify_credentials.json';

            $params = [
                'oauth_consumer_key' => $this->consumerKey,
                'oauth_nonce' => $this->getToken(42),
                'oauth_signature_method' => $this->signatureMethod,
                'oauth_timestamp' => time(),
                'oauth_token' => $resp['token']['access_token'],
                'oauth_version' => $this->oauthVersion,
                // "include_email" => 'true',
                // 'include_entities' => 'false',
                // 'skip_status' => 'true'

            ];
            $urlParams = [ // url params for endpoint
                'include_email' => 'true',
            ];
            $params['oauth_signature'] = $this->createSignature('GET', $url, $params, $resp['token']['access_token_secret'], $urlParams);

            $oauthHeader = $this->generateOauthHeader($params);

            $response = $this->curlHttp('GET', $url, $oauthHeader, $urlParams);

            return [
                'status' => true,
                'user' => json_decode($response, true),
                'token' => $resp['token'],
            ];
        } else {
            return $resp;
        }

    }

    public function getUser($token)
    {
        $url = 'https://api.twitter.com/1.1/account/verify_credentials.json';

        $params = [
            'oauth_consumer_key' => $this->consumerKey,
            'oauth_nonce' => $this->getToken(42),
            'oauth_signature_method' => $this->signatureMethod,
            'oauth_timestamp' => time(),
            'oauth_token' => $token->token,
            'oauth_version' => $this->oauthVersion,
            // "include_email" => 'true',
            // 'include_entities' => 'false',
            // 'skip_status' => 'true'

        ];
        $urlParams = [ // url params for endpoint
            'include_email' => 'true',
        ];
        $params['oauth_signature'] = $this->createSignature('GET', $url, $params, $token->secret, $urlParams);

        $oauthHeader = $this->generateOauthHeader($params);

        $response = $this->curlHttp('GET', $url, $oauthHeader, $urlParams);

        return [
            'status' => true,
            'user' => json_decode($response, true),
        ];
    }

    public function curlHttp($httpRequestMethod, $url, $oauthHeader, $post_data = null)
    {

        $ch = curl_init();
        // $fp = fopen("eg.log", "a");
        // fwrite($fp, "Header: " . $oauthHeader . "\n");

        $headers = [
            'Authorization: OAuth '.$oauthHeader,
        ];

        $options = [
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_HEADER => false,
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
        ];
        if ($httpRequestMethod == 'POST') {
            $options[CURLOPT_POST] = true;

        }
        if (! empty($post_data)) {
            if ($httpRequestMethod == 'POST') {
                $options[CURLOPT_POSTFIELDS] = $post_data;
            } else {
                $options[CURLOPT_URL] .= '?'.http_build_query($post_data);
            }
        }
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);

        $this->http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $response;
    }

    public function generateOauthHeader($params)
    {
        foreach ($params as $k => $v) {

            $oauthParamArray[] = $k.'="'.rawurlencode($v).'"';
        }
        $oauthHeader = implode(', ', $oauthParamArray);

        return $oauthHeader;
    }

    public function createSignature($httpRequestMethod, $url, $params, $tokenSecret = '', $urlParams = [])
    {
        $authorizationParams = array_merge($params, $urlParams);
        // make sure to sort
        uksort($authorizationParams, 'strcmp');

        $strParams = rawurlencode(http_build_query($authorizationParams));

        $baseString = $httpRequestMethod.'&'.rawurlencode($url).'&'.$strParams;

        // $fp = fopen("eg.log", "a");
        // fwrite($fp, "Baaaase: " . $baseString . "\n");

        $signKey = $this->generateSignatureKey($tokenSecret);
        $oauthSignature = base64_encode(hash_hmac('sha1', $baseString, $signKey, true));

        return $oauthSignature;
    }

    public function generateSignatureKey($tokenSecret)
    {
        $signKey = rawurlencode($this->consumerSecret).'&';
        if (! empty($tokenSecret)) {
            $signKey = $signKey.rawurlencode($tokenSecret);
        }

        return $signKey;
    }

    public function getToken($length)
    {
        $token = '';
        $codeAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $codeAlphabet .= 'abcdefghijklmnopqrstuvwxyz';
        $codeAlphabet .= '0123456789';
        $max = strlen($codeAlphabet) - 1;
        for ($i = 0; $i < $length; $i++) {
            $token .= $codeAlphabet[$this->cryptoRandSecure(0, $max)];
        }

        return $token;
    }

    public function cryptoRandSecure($min, $max)
    {
        $range = $max - $min;
        if ($range < 1) {
            return $min; // not so random...
        }
        $log = ceil(log($range, 2));
        $bytes = (int) ($log / 8) + 1; // length in bytes
        $bits = (int) $log + 1; // length in bits
        $filter = (int) (1 << $bits) - 1; // set all lower bits to 1
        do {
            $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
            $rnd = $rnd & $filter; // discard irrelevant bits
        } while ($rnd >= $range);

        return $min + $rnd;
    }
}
