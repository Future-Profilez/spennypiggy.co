<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('user.show', ['username' => $user->username]));
        }

        // 🚨 The send is SERVER-SIDE. It used to happen only in a mount effect
        // on the page below, gated by a localStorage timestamp — so a blocked
        // script, a failed XHR, a closed tab mid-redirect or a second device
        // meant no verification email was ever sent, while the screen still
        // announced one had been. Registration dispatches too; this covers a
        // creator who comes back later.
        EmailVerificationNotificationController::sendIfDue($user);

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
            'verificationEmail' => $user->email,
            'lastSentAt' => EmailVerificationNotificationController::lastSentAt($user->id),
            'resendAvailableIn' => EmailVerificationNotificationController::secondsUntilResend($user->id),
        ]);
    }
}
