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

        if (! $user) {
            return response()->json(['status' => false, 'message' => 'Not signed in.'], 401);
        }

        // Already verified is not an error, but it must not send another mail.
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'status' => true,
                'verified' => true,
                'message' => 'Your email is already verified.',
            ]);
        }

        VerifyEmail::dispatch($user);

        return response()->json([
            'status' => true,
            'verified' => false,
            'message' => 'Verification link sent to your registered email address.',
        ]);
    }

    /**
     * Cheap poll for the verification screen.
     *
     * The page used to `window.location.reload()` every 5 seconds forever while
     * waiting — a full page load per tick, on every open tab, which also made the
     * screen impossible to read.
     */
    public function status()
    {
        return response()->json([
            'verified' => (bool) optional(Auth::user())->hasVerifiedEmail(),
        ]);
    }
}
