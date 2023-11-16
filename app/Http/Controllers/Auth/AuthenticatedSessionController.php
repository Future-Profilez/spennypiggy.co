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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
    public function getUserProfile($username, $category = false)
    {
        $user = User::where('username', $username)->first();
        $sociallinks = SocialLinks::where('user_id', $user->id)->get();
        if (!empty($sociallinks)) {
            $sociallinks = $sociallinks;
        } else {
            $sociallinks = [];
        }
        // if(!$user){
        //     return
        // }
        if (!empty(request()->query('item'))) {
            $itemdid = request()->query('item');
        } else {
            $itemdid = false;
        }

        $items = [];
        $categories = [];
        if (!empty($user)) {
            $categories = UserCategory::whereUserId($user->id)->latest()->get();
        }
        if ($category && $user) {
            $query = WishCategory::orderBy('created_at', 'DESC');

            if ($category != 'all') {
                $query->where('category_id', $category);
            }

            $itemId = $query->whereHas('wish', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->pluck('wish_id');

            $items = WishItem::whereIn('id', $itemId)->latest()->get();



            return response()->json([
                "success" => true,
                "items" => $items,
                "categories" => $categories,
                "itemid" => $itemdid,
                "sociallinks" => $sociallinks,
            ]);
        } else {
            if ($user) {
                $items = WishItem::whereUserId($user->id)->latest()->get();
            }
        }

        return Inertia::render('Dashboard', [
            "itemid" => $user,
            "user" => $user,
            "items" => $items,
            "categories" => $categories,
            "itemid" => $itemdid,
            "sociallinks" => $sociallinks,
        ]);
    }
}
