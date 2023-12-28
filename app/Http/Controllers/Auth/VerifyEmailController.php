<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use Carbon\Carbon;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(RouteServiceProvider::HOME . '?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        return redirect()->intended(RouteServiceProvider::HOME . '?verified=1');
    }

    public function emailVerify($uuid)
    {
        try {
            $user = User::where(function ($q) {
                $q->whereNot('country', 'GB')->orWhereNull('country');
            })->where('uuid', $uuid)->first();
            User::where('uuid', $uuid)->where(function ($q) {
                $q->whereNot('country', 'GB')->orWhereNull('country');
            })->update([
                'email_verified_at' => Carbon::now(),
            ]);
            return redirect(route("user.show", [$user->username]))->with("success", "Email verified successfully");
        } catch (\Throwable $th) {
            //throw $th;
        }
    }
}
