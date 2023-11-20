<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }
        $request->user()->save();
        return Redirect::route('profile.edit');
    }




    /**
     * Update the user's profile information.
     */
    public function updateProfile(Request $request)
    {

        $user = User::where('id', Auth::id())->first();

        $request->validate([
            'name' => ['string', 'max:255'],
            'username' => ['string', 'lowercase', 'max:20', Rule::unique('users')->ignore($user->id)],
            'bio' => ['sometimes', 'max:255'],
            'tags' => ['sometimes', 'max:255'],
        ]);

        $user->name = $request->name;
        $user->username = $request->username;
        $user->bio = $request->bio;
        $user->avatar = $request->avatar;
        $user->cover = $request->cover;

        $user->save();
        $user->refresh();
        return redirect(route("user.show", ["username" => $request->username ?? $user->username]))->with('success', "Profile has been updated.");
    }


    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
