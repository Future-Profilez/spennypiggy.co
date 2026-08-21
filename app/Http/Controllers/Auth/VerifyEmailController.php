<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\LinkUserToCrmCreator;
use App\Models\User;
use App\Support\AnalyticsEvent;
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
            // GA4 funnel — stage 2. Only on the transition, never on a revisit
            // to an already-verified link, or the stage out-counts signup.
            AnalyticsEvent::push('email_verified', ['source' => 'in_app']);
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
            // ⚠️ An expired link is a DEAD END unless the person is handed the
            // screen that mints a new one. Someone still signed in goes
            // straight there (it sends a fresh link on arrival); everyone else
            // is told to sign in, and `mustHaveToVerify` lands them on the
            // same screen the moment they do.
            if ($request->user() && ! $request->user()->hasVerifiedEmail()) {
                return redirect()->route('verification.notice')
                    ->with('error', 'That link had expired, so we have sent you a fresh one.');
            }

            return redirect()->route('login')
                ->with('error', 'That verification link has expired. Sign in with the same email and we will send you a new one — there is no need to register again.');
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

            // GA4 funnel — stage 2, reached from the emailed link rather than
            // in-app. Both paths emit the same event name so the funnel stage
            // is one number; `source` keeps them separable.
            AnalyticsEvent::push('email_verified', ['source' => 'email_link']);

            return redirect()->route('user.show', [$user->username])
                ->with('success', 'Email verified successfully');
        } catch (\Throwable $th) {
            Log::error('Email verification failed: '.$th->getMessage());

            return redirect()->route('login')->with('error', 'Invalid verification link or user.');
        }
    }
}
