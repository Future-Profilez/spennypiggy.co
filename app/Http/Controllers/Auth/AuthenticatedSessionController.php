<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Providers\RouteServiceProvider;
use App\SeoMeta;
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
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();
        $user = Auth::user();
        return redirect(route("user.show", [$user->username]))->with("success", "Logged in successfully.");
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
        $user = User::where('username', $username)->first();
        if (!$user) {
            return Inertia::render('NotFound');
        }
        if (!empty(request()->query('item'))) {
            $itemdid = request()->query('item');
        } else {
            $itemdid = false;
        }

        SeoMeta::addTag('title', "{$user->name} - Spenny Piggy - Financial Gifts, Donations & Memberships");
        SeoMeta::addTag('meta', [
            ' name'   =>  'twitter:image',
            'content'  =>  'https://ucarecdn.com/96eb6cc4-14a3-4f53-9a56-39acb88653f4/-/overlay/4c42426a-1396-49e2-8b46-2381a2ae5d7b/50px50p/center/'
        ]);
        SeoMeta::addTag('meta', [
            'property'   =>  'og:image',
            'content'  =>  'https://ucarecdn.com/96eb6cc4-14a3-4f53-9a56-39acb88653f4/-/overlay/4c42426a-1396-49e2-8b46-2381a2ae5d7b/50px50p/center/'
        ]);
        return Inertia::render('Dashboard', [
            "username" => $username,
            "user" => $user,
            "itemid" => $itemdid,
        ]);
    }

    public function user_info($username, $category = false)
    {
        $user = User::where('username', $username)->first();
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
        $user = User::firstWhere('username', $username);
        if ($user) {
            $items = $user->wishItems()
                ->when($category_id, function ($query) use ($category_id) {
                    // If $categoryID is specified, filter by the specific category
                    $query->whereHas('wishCategories', function ($query) use ($category_id) {
                        $query->where('user_category_id', $category_id);
                    });
                })
                ->orderBy('is_pin', 'DESC')
                ->latest()
                ->get();
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
            $user = User::where('username', $username)->first();
            $categories = [];
            if (!empty($user)) {
                $categories = $user->userCategories();
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

    public function sociallinks($username)
    {
        try {
            $user = User::where('username', $username)->first();
            $slinks = [];
            $sociallinks = [];
            if (!empty($user)) {
                $slinks = $user->socialLinks();
                if (!empty($slinks)) {
                    $sociallinks = [
                        [
                            'social' => 'whoyouinto',
                            'url'    => $slinks->whoyouinto ?? null,
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
                            'social' => 'discord',
                            'url'    => $slinks->discord ?? null,
                        ],
                        [
                            'social' => 'onlyfans',
                            'url'    => $slinks->onlyfans ?? null,
                        ],
                        [
                            'social' => 'loyalfans',
                            'url'    => $slinks->loyalfans ?? null,
                        ],
                        [
                            'social' => 'fansly',
                            'url'    => $slinks->fansly ?? null,
                        ],
                        [
                            'social' => 'manyvids',
                            'url'    => $slinks->manyvids ?? null,
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
                $user = User::where('username', $username)->first();
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
}
