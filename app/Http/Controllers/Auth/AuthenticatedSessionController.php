<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
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

        // if(!$user){
        //     return
        // }
        $categories = UserCategory::whereUserId($user->id)->latest()->get();
        if ($category) {
            $query = WishCategory::orderBy('created_at', 'DESC');

            if ($category != 'all') {
                $query->where('category_id', $category);
            }

            $itemId = $query->whereHas('wish', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->pluck('wish_id');

            $items = WishItem::whereIn('id', $itemId)->latest()->get();

            if (request()->ajax()) {
                return response()->json([
                    "success" => true,
                    "items" => $items,
                    "categories" => $categories,
                ]);
            }
        } else {
            $items = WishItem::whereUserId($user->id)->latest()->get();
        }

        return Inertia::render('Dashboard', [
            "user" => $user,
            "items" => $items,
            "categories" => $categories,
        ]);
    }
}
