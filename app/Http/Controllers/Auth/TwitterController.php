<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\FetchSelfTwitterData;
use App\Models\TwitterToken;
use App\TwitterAuthService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;

class TwitterController extends Controller
{

    /**
     * Initialize Auth Process
     *
     * @return mixed
     */
    public function authInit(Request $request)
    {
        $state = (string)Uuid::uuid4();
        $challenge = (string)Uuid::uuid4();
        Session::put("x_state", $state);
        Session::put("x_challenge", $challenge);
        $redirectUrl = route('x.handle');
        $url = TwitterAuthService::getAuth2Url($state, $challenge, $redirectUrl);
        return Inertia::location($url);
        // return response()->json([
        //     'url' => $url
        // ]);
    }

    /**
     * Handle Redirection
     *
     * @param Request $request
     * @return mixed
     */
    public function handleAuth(Request $request)
    {
        $data   =   $request->all();
        $user   =   Auth::user();
        $state  = Session::pull("x_state", "NONE");
        $challenge  =   Session::pull("x_challenge");
        if(!empty($data['code'] AND $data['state'] == $state)){
            try {
                $resp = TwitterAuthService::getAuthToken($data['code'], $challenge, route("x.handle"));
                Session::remove("x_state");
                Session::remove("x_challenge");
                if($resp['success']){
                    $token = TwitterToken::create([
                        'user_id'   =>  $user->id,
                        'token'     =>  $resp['data']['access_token'],
                        'secret'    =>  $resp['data']['token_type'],
                        'refresh_token' =>  $resp['data']['refresh_token'],
                        'expires_at'    => Carbon::now()->addSeconds($resp['data']['expires_in'])
                    ]);

                    FetchSelfTwitterData::dispatch($token);

                    return to_route('user.show',['username' => $user->username])->with('success', 'X.com successfully setup for Auto-tweets.');
                }
                return to_route('user.show',['username' => $user->username])->with('error', 'Failed to connect. '.$resp['data']['error_description']);

            } catch (Exception $e) {
                return to_route('user.show',['username' => $user->username])->with('error', 'Failed to connect. '.$e->getMessage());
            }
        }
        return to_route('user.show',['username' => $user->username])->with('error', 'Invalid payload!');
    }

    /**
     * Test Twitter
     *
     * @return mixed
     */
    public function testToken()
    {
        $token = TwitterToken::find(1);
        $resp = TwitterAuthService::getSelf($token);
        // if($resp['success'])
        // {
        //     $token->update([
        //         'twitter_id'    =>  $resp['data']['id'],
        //         'username'      =>  $resp['data']['username'],
        //     ]);
        // }
        return response()->json($resp);
    }
}
