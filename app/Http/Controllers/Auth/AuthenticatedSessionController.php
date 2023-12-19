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
    public function getUserProfile($username){
        $user = User::where('username', $username)->first();
        if (!$user) {
            return Inertia::render('NotFound');
        }
        SeoMeta::addTag('title', "{$user->name} - Spenny Piggy - Financial Gifts, Donations & Memberships");
        return Inertia::render('Dashboard', [ 
            "username" => $username,
            "user" => $user,
        ]);
    }

    public function user_info($username, $category = false) {
            $user = User::where('username', $username)->first();
            $items = [];
            if ($category && $user) {
                $query = WishCategory::orderBy('created_at', 'DESC');
                if ($category != 'all') {
                    $query->where('category_id', $category);
                }

                $itemId = $query->whereHas('wish', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->pluck('wish_id');

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

    public function user_category($username) {
        try {
            $user = User::where('username', $username)->first();
            $categories = [];
            if (!empty($user)) {
                $categories = UserCategory::whereUserId($user->id)->latest()->get();
                return response()->json([
                    "success" => true,
                    "categories" => $categories,
                ]);
            } else {
                return response()->json([
                    "success" => true,
                    "categories" => [],
                ]);
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }
    
    public function sociallinks($username) {
        try {
            $user = User::where('username', $username)->first();
            $slinks = [];
            $sociallinks = [];
            if (!empty($user)) {
                $slinks = SocialLinks::where('user_id', $user->id)->first();
                if (!empty($slinks)) {
                    $sociallinks = array(
                        array(
                            'social' => 'whoyouinto',
                            'url'    => $slinks->whoyouinto ?? null,
                        ),
                        array(
                            'social' => 'twitter',
                            'url'    => $slinks->twitter ?? null,
                        ),
                        array(
                            'social' => 'instagram',
                            'url'    => $slinks->instagram ?? null,
                        ), array(
                            'social' => 'reddit',
                            'url'    => $slinks->reddit ?? null,
                        ), array(
                            'social' => 'discord',
                            'url'    => $slinks->discord ?? null,
                        ), array(
                            'social' => 'onlyfans',
                            'url'    => $slinks->onlyfans ?? null,
                        ), array(
                            'social' => 'loyalfans',
                            'url'    => $slinks->loyalfans ?? null,
                        ), array(
                            'social' => 'fansly',
                            'url'    => $slinks->fansly ?? null,
                        ), array(
                            'social' => 'manyvids',
                            'url'    => $slinks->manyvids ?? null,
                        ), array(
                            'social' => 'other',
                            'url'    => $slinks->other ?? null,
                        )
                    );
                } else {
                    return response()->json([
                        "success" => false,
                        "sociallinks" => [],
                        "slinks" => []
                    ]);
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
