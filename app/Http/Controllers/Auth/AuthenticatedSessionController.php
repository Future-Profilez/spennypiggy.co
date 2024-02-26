<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuthRedirect;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\SocialLinks;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Providers\RouteServiceProvider;
use App\SeoMeta;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();
        $request->session()->regenerate();
        $user = Auth::user();

        // $auth = AuthRedirect::create([
        //     "user_id"   =>  $user->id,
        //     'country'   =>  $user->country,
        //     'origin'    =>  'localhost',
        //     'target'    =>  'localhost',
        // ]);
        // Auth::logout();
        // return Inertia::location("http://localhost:8000/verify-token/{$auth->uuid}");
        // if()
        if ($request->getHttpHost() == "uk.spennypiggy.co" and $user->country != "GB") {
            // return Inertia::location("https://spennypiggy.com/{$user->username}");
            $auth = AuthRedirect::create([
                "user_id"   =>  $user->id,
                'country'   =>  $user->country,
                'origin'    =>  $request->getHttpHost(),
                'target'    =>  'spennypiggy.co',
            ]);

            Auth::logout();
            return Inertia::location("https://spennypiggy.co/verify-token/{$auth->uuid}");
        } else if (!in_array($request->getHttpHost(), ['::1', 'localhost:8000', '127.0.0.1:8000']) and $request->getHttpHost() == 'spennypiggy.co' and $user->country == 'GB') {
            // return Inertia::location("https://uk.spennypiggy.com/{$user->username}");
            $auth = AuthRedirect::create([
                "user_id"   =>  $user->id,
                'country'   =>  $user->country,
                'origin'    =>  $request->getHttpHost(),
                'target'    =>  'uk.spennypiggy.co',
            ]);

            Auth::logout();
            return Inertia::location("https://uk.spennypiggy.co/verify-token/{$auth->uuid}");
        }
        return redirect(route("user.show", ['username' => $user->username]))->with("success", "Logged in successfully.");
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(): RedirectResponse
    {
        Auth::guard('web')->logout();

        // $request->session()->invalidate();

        // $request->session()->regenerateToken();

        return redirect(route("login"))->with("success", "Logged out successfully.");
    }

    /**
     * Private user profile info
     */
    public function getUserProfile($username)
    {
        $user = User::where('username', $username)->where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->first();
        if (!$user) {
            return Inertia::render('NotFound');
        }
        if (!empty(request()->query('item'))) {
            $itemdid = request()->query('item');
        } else {
            $itemdid = false;
        }
        $userfield = $user->name;
        $userName = str_replace(' ', '%20', $userfield);
        $image = "https://ucarecdn.com/8dfae4ba-cd77-406f-8b70-7cf360b4c18c/-/preview/900x900/-/text_align/center/center/-/font/14/000000/-/text/100px30p/100p,100p/spennypiggy.co~s" . $user->username . "/-/text_align/center/center/-/font/19/e6ea82/-/text/100px78p/100p,100p/" . $userName . "/";

        SeoMeta::addTag('title', "{$user->name} - Spenny Piggy - Financial Gifts, Donations & Memberships");
        SeoMeta::addTag('meta', ['property' => 'twitter:title', 'content' => 'Financial Gifts,Donations & Memberships']);
        SeoMeta::addTag('meta', ['property' => 'twitter:card', 'content' => 'summary_large_image']);
        SeoMeta::addTag('meta', ['property' => 'twitter:description', 'content' => 'Send tributes,adopt bills & more. Safe for Spicy Creators who receive 100% payouts!']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image', 'content' => $image]);
        SeoMeta::addTag('meta', ['property' => 'twitter:site', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['property' => 'twitter:creator', 'content' => '@spennypiggy']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image:alt', 'content' => 'Financial Gifts,Donations & Memberships']);
        SeoMeta::addTag('meta', ['property' => 'twitter:image:src', 'content' => $image]);
        SeoMeta::addTag('meta', ['property' => 'og:image', 'content' => $image]);

        return Inertia::render('Dashboard', [
            "username" => $username,
            "user" => $user,
            "itemid" => $itemdid,
        ]);
    }

    public function user_info($username, $category = false)
    {
        $user = User::where('username', $username)->where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->first();
        $items = [];
        if ($category && $user) {
            $query = WishCategory::orderBy('created_at', 'DESC');
            if ($category != 'all') {
                $query->where('user_category_id', $category);
            }

            $itemId = $query->whereHas('wish', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->pluck('wish_item_id');

            $q = WishItem::where('is_pin', 0)->with(['user']);
            if ($category != 'all') {
                $q->whereIn('id', $itemId);
            } else {
                $q->where('user_id', $user->id);
            }
            $items = $q->latest()->get();

            $pin = WishItem::where('is_pin', 1)->with(['user']);
            if ($category != 'all') {
                $pin->whereIn('id', $itemId);
            } else {
                $pin->where('user_id', $user->id);
            }
            $pinned = $pin->get();
            return response()->json([
                "success" => true,
                "items" => ['list' => $items, "pinned" => $pinned],
            ]);
        } else {
            if ($user) {
                $items = WishItem::where('is_pin', 0)->whereUserId($user->id)->with(['user'])->latest()->get();
                $pinned = WishItem::where('is_pin', 1)->whereUserId($user->id)->with(['user'])->get();
            }
        }
        return response()->json([
            "success" => true,
            "items" => ['list' => $items, "pinned" => $pinned],
        ]);
    }

    /**
     * Get User Wish Items
     *
     * @param string $username Username
     * @param int   $category_id Category Id
     * @return mixed
     */
    public function userItems($username, $category_id = null)
    {
        $user = User::where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->firstWhere('username', $username);

        if ($user) {
            $items = $user->wishItems()
                ->when($category_id, function ($query) use ($category_id) {
                    // If $categoryID is specified, filter by the specific category
                    $query->whereHas('wishCategories', function ($query) use ($category_id) {
                        $query->where('user_category_id', $category_id);
                    });
                })
                // ->orderBy('is_pin', 'DESC')
                ->orderBy('sort', 'ASC')
                ->latest()
                ->get();

            // $count = 1;
            // $items->map(function ($item) use ($count) {
            //     $item->key = $count;
            //     $count++;

            //     return $item;
            // });

            return response()->json([
                'success'   => true,
                'items'     =>  $items
            ]);
        }
        return response()->json([
            'success'   => false,
            'items'     => [],
            'message'   =>  'User not found'
        ]);
    }

    public function user_category($username)
    {
        try {
            $user = User::where('username', $username)->where(function ($q) {
                $q->whereNot('country', 'GB')->orWhereNull('country');
            })->first();
            $categories = [];
            if (!empty($user)) {
                $categories = $user->user_categories()->get();
                // $categories = UserCategory::whereUserId($user->id)->latest()->get();
            }
            return response()->json([
                "success" => true,
                "categories" => $categories,
            ]);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }


    public function user_memberships($username)
    {
        $user = User::where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->firstWhere('username', $username);

        if ($user) {
            $membership = $user->memberships()
                ->latest()
                ->get();


            return response()->json([
                'success'   => true,
                'memberships' => $membership
            ]);
        }
        return response()->json([
            'success'   => false,
            'items'     => [],
            'message'   =>  'User not found'
        ]);
    }

    public function user_posts($username)
    {
        $user = User::where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->firstWhere('username', $username);

        if ($user) {
            $post = $user->posts()
                ->latest()
                ->get();


            $post->map(function ($p) use($user) {

                if($user->id == Auth::id()){
                    $p->is_lock = 0;
                }
                elseif($p->type == 'image'){
                    if(Auth::check()){
                        $u = User::where('id',Auth::id())->first();

                        $tip = [];
                        if($p->for_module == 'support'){
                            $tip = TipGoalsPayment::where('creator_id',$user->id)
                            ->where(function($q) use($u){
                                $q->where('user_id',$u->id)->orWhere('guest_email',$u->email);
                            })->first();
                        }

                        $mem = [];
                        $lifetime = [];
                        if($p->for_module == 'membership'){
                            $mem = MembershipPayment::where('recurring_type','!=','lifetime')->where(function($que){
                                $que->where('created_at','<=',Carbon::now())->where('upcoming_payment','>=',Carbon::now());
                            })->whereHas('membership',function($q) use($user){
                                $q->where('user_id',$user->id);
                            })->where(function($q) use($u){
                                $q->where('user_id',$u->id)->orWhere('guest_email',$u->email);
                            })->first();

                            $lifetime = MembershipPayment::where('recurring_type','lifetime')->whereHas('membership',function($q) use($user){
                                $q->where('user_id',$user->id);
                            })->where(function($q) use($u){
                                $q->where('user_id',$u->id)->orWhere('guest_email',$u->email);
                            })->first();
                        }

                        $subs = [];
                        $bills = [];
                        if ($p->for_module == 'subscription') {
                            $subs = WishItemSubscription::where(function($que){
                                $que->where('created_at','<=',Carbon::now())->where('upcoming_payment','>=',Carbon::now());
                            })->whereHas('wish_item',function($q) use($user){
                                $q->where('user_id',$user->id);
                            })->where(function($q) use($u){
                                $q->where('user_id',$u->id)->orWhere('guest_email',$u->email);
                            })->first();

                            $bills = BillPayment::where(function($que){
                                $que->where('created_at','<=',Carbon::now())->where('upcoming_payment','>=',Carbon::now());
                            })->whereHas('bill',function($q) use($user){
                                $q->where('user_id',$user->id);
                            })->where(function($q) use($u){
                                $q->where('user_id',$u->id)->orWhere('guest_email',$u->email);
                            })->first();
                        }

                        if((!empty($tip) && $p->for_module == 'support') || ((!empty($mem) || !empty($lifetime)) && $p->for_module == 'membership') || ((!empty($subs) || !empty($bills)) && $p->for_module == 'subscription')){
                            $p->is_lock = 0;
                        }
                        else{
                            $p->is_lock = 1;
                        }
                    }
                    else{
                        $p->is_lock = 1;
                    }
                }
                else{
                    $p->is_lock = 0;
                }

                return $p;
            });

            return response()->json([
                'success'   => true,
                'posts' => $post
            ]);
        }

        return response()->json([
            'success'   => false,
            'items'     => [],
            'message'   =>  'User not found'
        ]);
    }


    public function user_bills($username)
    {
        $user = User::where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->firstWhere('username', $username);

        if ($user) {
            $bills = $user->bills()
                ->latest()
                ->get();


            return response()->json([
                'success'   => true,
                'bills' => $bills
            ]);
        }
        return response()->json([
            'success'   => false,
            'items'     => [],
            'message'   =>  'User not found'
        ]);
    }

    public function sociallinks($username)
    {
        try {
            $user = User::where('username', $username)->where(function ($q) {
                $q->whereNot('country', 'GB')->orWhereNull('country');
            })->first();
            $slinks = [];
            $sociallinks = [];
            if (!empty($user)) {
                $slinks = $user->social_links()->first();
                if (!empty($slinks)) {
                    $sociallinks = [
                        [
                            'social' => 'facebook',
                            'url'    => $slinks->facebook ?? null,
                        ],
                        [
                            'social' => 'twitter',
                            'url'    => $slinks->twitter ?? null,
                        ],
                        [
                            'social' => 'instagram',
                            'url'    => $slinks->instagram ?? null,
                        ],
                        [
                            'social' => 'reddit',
                            'url'    => $slinks->reddit ?? null,
                        ],
                        [
                            'social' => 'youtube',
                            'url'    => $slinks->youtube ?? null,
                        ],
                        [
                            'social' => 'tumblr',
                            'url'    => $slinks->tumblr ?? null,
                        ],
                        [
                            'social' => 'twitch',
                            'url'    => $slinks->twitch ?? null,
                        ],
                        [
                            'social' => 'other',
                            'url'    => $slinks->other ?? null,
                        ]
                    ];
                }
            } else {
                return response()->json([
                    "success" => false,
                    "msg" => 'User not found !!'
                ]);
            }
            return response()->json([
                "success" => true,
                "sociallinks" => $sociallinks,
                "slinks" => $slinks
            ]);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }


    public function checkUserName($username)
    {
        try {
            if (preg_match("/^[a-z0-9_]+$/", $username)) {
                // Username contains only lowercase letters, numbers, and underscores
                $user = User::where('username', $username)->where(function ($q) {
                    $q->whereNot('country', 'GB')->orWhereNull('country');
                })->first();
                if (!empty($user)) {
                    return response()->json(['status' => false, 'msg' => 'Username is not available']);
                } else {
                    return response()->json(['status' => true, 'msg' => 'Username is available']);
                }
            } else {
                // Username contains spaces, special characters, or capital letters
                return response()->json(['status' => false, 'msg' => 'Username should contains only lowercase letters, numbers, and underscores']);
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function unlinkTwitter(){
        $user = User::where('id',Auth::id())->first();

        if(!empty($user->twitter_token)){
        //     $req = TwitterAuthService::revokeToken($user->twitter_token);
        //     return response()->json($req);
            // if($req->successful()){
                $user->twitter_token->delete();

                return back()->with('success','Twitter unlinked successfully.');
            // }

            // return back()->with('error','Something Went Wrong.');
        }

        return back()->with('error','No linked twitter account found.');
    }


     /**
     * Handle Redirect from cross domain
     *
     */
    public function authRedirects(Request $request, $token)
    {
        $ref = $request->header('Referer', 'http://localhost:8000/');
        if (!$ref) {
            // RateLimiter::hit($request->throttleKey())
            return to_route('home')->with('error', 'Invalid redirection or parameters!');
        }

        $ref = parse_url($ref);
        $origin = $ref['host'];
        $token = AuthRedirect::whereUuid($token)
            ->whereNull('used_at')
            ->where('target', $request->getHttpHost())
            ->where('origin', $origin)
            ->first();

        if (!$token) {
            abort(404, "Not Found!");
        }

        if (!$token->created_at->isAfter(Carbon::now()->subMinutes(2))) {
            return to_route('home')->with('error', 'Link Expired!');
        }
        // return response()->json([
        //     'sucess'    => true,
        //     'ref'    => $ref,
        //     'token'     => $token
        // ]);

        $user = User::firstWhere('id', $token->user_id);
        if (!$user) {
            return to_route('home')->with('error', 'Link is invalid!');
        }

        Auth::login($user, true);
        $request->session()->regenerate();
        $token->update([
            'used_at'   =>  Carbon::now()
        ]);
        $token->delete();
        return to_route('user.show', ['username' => $user->username])->with('success', 'Welcome back. Login successfull.');
    }
}
