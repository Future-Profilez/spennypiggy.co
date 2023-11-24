<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
{
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
{
    $request->validate([
        'email' => 'required|email',
    ]);

    // Attempt to send the password reset link
    $status = Password::sendResetLink(
        $request->only('email')
    );

    // Check different cases and handle errors accordingly
    switch ($status) {
        case Password::RESET_LINK_SENT:
            // Password reset link sent successfully
            return back()->with('status', __($status));
        
        case Password::INVALID_USER:
            // User with the provided email not found
            return back()->with('error', 'Email address not found.');

        case Password::RESET_THROTTLED:
            // Too many password reset requests for this email
            return back()->with('error', 'Too many password reset requests. Please try again later.');

        case Password::INVALID_TOKEN:
            // Invalid or expired password reset token
            return back()->with('error', 'Invalid or expired password reset token. Please request a new one.');

        default:
            // Handle any other cases
            throw ValidationException::withMessages([
                'email' => [trans($status)],
            ]);
    }
}

}
