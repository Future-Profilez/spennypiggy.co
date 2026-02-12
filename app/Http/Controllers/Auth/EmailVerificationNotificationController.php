<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\VerifyEmail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('user.show', ['username' => $request->user()->username]));
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    public function sendVerificationEmail()
    {
        $user = User::whereId(Auth::id())->first();
        VerifyEmail::dispatch($user);
        return response()->json([
            "status" => true,
            "message" => "Verification link sent on your registred email address."
        ]);
    }
}
