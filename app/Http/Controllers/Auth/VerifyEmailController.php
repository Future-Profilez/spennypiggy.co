<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('user.show', ['username' => $request->user()->username]) . '?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        return redirect()->intended(route('user.show', ['username' => $request->user()->username]) . '?verified=1');
    }

    public function emailVerify($uuid)
    {
        try {
            $user = User::where('uuid', $uuid)
                ->firstOrFail(); // Use firstOrFail to catch non-existing user

            $user->email_verified_at = Carbon::now();
            $user->save();

            return redirect()->route('user.show', [$user->username])
                ->with("success", "Email verified successfully");
        } catch (\Throwable $th) {
            Log::error('Email verification failed: ' . $th->getMessage());
            return redirect()->route('login')->with("error", "Invalid verification link or user.");
        }
    }
}
