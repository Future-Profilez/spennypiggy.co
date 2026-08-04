<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\LinkUserToCrmCreator;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('user.show', ['username' => $request->user()->username]).'?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
            // Email is now confirmed — retry CRM prospect linking (email match is gated on verification).
            LinkUserToCrmCreator::dispatch($request->user()->id);
        }

        return redirect()->intended(route('user.show', ['username' => $request->user()->username]).'?verified=1');
    }

    /**
     * Verify from the emailed link.
     *
     * 🚨 The uuid is a PUBLIC identifier (it appears in profile payloads and item
     * routes), so on its own it is not proof that the person read the mail. This
     * endpoint is unauthenticated, so anyone who learned a uuid could mark that
     * account's address verified — including an address they had registered but
     * do not own.
     *
     * The link is now a temporary signed URL. The signature is checked in the
     * controller rather than by the `signed` middleware so a stale link gets a
     * readable message instead of a bare 403 — the same shape as
     * `/unsubscribe/{user}`.
     */
    public function emailVerify(Request $request, $uuid)
    {
        if (! $request->hasValidSignature()) {
            return redirect()->route('login')
                ->with('error', 'This verification link is invalid or has expired. Sign in and request a new one.');
        }

        try {
            $user = User::where('uuid', $uuid)
                ->firstOrFail(); // Use firstOrFail to catch non-existing user

            if ($user->hasVerifiedEmail()) {
                return redirect()->route('login')->with('success', 'Your email is already verified.');
            }

            $user->email_verified_at = Carbon::now();
            $user->save();

            // Email is now confirmed — retry CRM prospect linking (email match is gated on verification).
            LinkUserToCrmCreator::dispatch($user->id);

            return redirect()->route('user.show', [$user->username])
                ->with('success', 'Email verified successfully');
        } catch (\Throwable $th) {
            Log::error('Email verification failed: '.$th->getMessage());

            return redirect()->route('login')->with('error', 'Invalid verification link or user.');
        }
    }
}
