<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\TwitterAuthService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TwitterController extends Controller
{


    /**
     * Get Twitter Auth Token
     *
     * @return \Illuminate\Http\Response json
     */
    public function twitterAuthUrl()
    {
        // $tAuth = new TwitterAuth;
        $tAuth = new TwitterAuthService;
        $host = request()->getHttpHost();
        if ($host == 'localhost') {
            // $domain = "http://$host";
            $domain = "http://$host:3000";
        } else {
            $domain = "https://$host";
        }

        $resp = $tAuth->getOauthVerifier($domain . '/twitter/login');
        return response()->json($resp, 200);
    }

    /**
     * Twitter Login Token Process
     *
     * @return \Illuminate\Http\Response json
     */
    public function twitterLogin(Request $request)
    {
        $params = $request->all();
        $tOAuth = new TwitterAuthService;
        $resp = $tOAuth->getUserData($params['oauth_verifier'], $params['oauth_token']);
        
        // $params['oauth_token_secret'] = session()->get('oauth_token_secret');
        return response()->json($resp, 200);
    }
}
