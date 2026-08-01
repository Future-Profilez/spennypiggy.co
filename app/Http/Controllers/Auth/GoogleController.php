<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

/**
 * Sign in / sign up with Google.
 *
 * ⚠️ This controller NEVER creates a user. A new person is handed to the ordinary registration
 * screen with their name and email pre-filled, and the account is created by
 * `RegisteredUserController::store()` — the same method the password form posts to.
 *
 * That is the whole design. `store()` runs eight gates before it writes a row (platform freeze,
 * device cookie, accounts-per-IP, blocked words, role validation, the supporter country, the
 * creator receipts acknowledgement, and the email domain). A second create path here would have
 * to repeat all eight, and the day one of them was added to `store()` and forgotten here, "Sign
 * in with Google" would quietly become the documented way around a block.
 *
 * What this controller does own: proving the email really belongs to the person, and deciding
 * whether they already have an account.
 */
class GoogleController extends Controller
{
    /** Where the verified Google profile waits while the person finishes signing up. */
    public const SESSION_KEY = 'google_signup';

    /**
     * Attribution that lives in the URL or in localStorage and would not survive the round trip
     * to Google. Stashed on the way out, read by `store()` on the way back.
     */
    private const CARRIED_QUERY = ['ref', 'type', 'utm_source', 'utm_medium', 'utm_campaign', 'redirect'];

    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->configured()) {
            return redirect()->route('register')
                ->with('error', 'Google sign-in is not available right now. Please use your email address.');
        }

        // Determine whether they started from register or login so we can redirect them back to the right page on error.
        $referer = $request->header('referer');
        $origin = ($referer && str_contains($referer, 'register')) ? 'register' : 'login';

        $context = $request->only(self::CARRIED_QUERY);
        $context['auth_origin'] = $origin;

        // A creator's referral code and the campaign tags are read from the URL at submit time.
        // Google sends the person back to a bare callback URL, so without this the code is gone
        // and the referring creator is never credited — silently, with nothing logged.
        $request->session()->put(
            'google_signup_context',
            $context
        );

        // Scopes are not set here on purpose: Socialite's GoogleProvider already defaults to
        // exactly openid + profile + email, and all three are non-sensitive, so the app needs no
        // Google verification review. Adding a scope beyond these three changes that.
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $this->configured()) {
            return redirect()->route('login')->with('error', 'Google sign-in is not available right now.');
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            // Covers a cancelled consent screen, an expired state token and a network failure
            // alike. None of them is the person's problem to debug.
            Log::warning('Google sign-in failed', ['error' => $e->getMessage()]);

            $context = (array) $request->session()->get('google_signup_context', []);
            $fallback = ($context['auth_origin'] ?? 'login') === 'register' ? 'register' : 'login';

            return redirect()->route($fallback)
                ->with('error', 'We could not complete Google sign-in. Please try again.');
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));

        if ($email === '') {
            $context = (array) $request->session()->get('google_signup_context', []);
            $fallback = ($context['auth_origin'] ?? 'login') === 'register' ? 'register' : 'login';

            return redirect()->route($fallback)
                ->with('error', 'Google did not share an email address with us. Please sign up with your email instead.');
        }

        // 🚨 Google reports whether IT has verified the address. A Google Workspace administrator
        // can create any mailbox on a domain they control, so an unchecked match on email alone
        // would let one be pointed at somebody else's Spenny Piggy account. This flag is the only
        // thing standing between "convenient" and "account takeover".
        if (! $this->emailIsVerified($googleUser)) {
            $context = (array) $request->session()->get('google_signup_context', []);
            $fallback = ($context['auth_origin'] ?? 'login') === 'register' ? 'register' : 'login';

            return redirect()->route($fallback)
                ->with('error', 'Your Google account email is not verified. Please verify it with Google, or sign up with your email address.');
        }

        $googleId = (string) $googleUser->getId();
        $user = User::where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->forceFill(['google_id' => $googleId])->save();
            }
        }

        return $user
            ? $this->signIn($request, $user)
            : $this->startSignUp($request, $googleUser, $email);
    }

    /**
     * An existing account. Every refusal the password form makes has to be made here too,
     * otherwise this becomes the easy way past it.
     */
    private function signIn(Request $request, User $user): RedirectResponse
    {
        if (method_exists($user, 'trashed') && $user->trashed()) {
            return redirect()->route('login')
                ->with('error', 'This account is deactivated. Please contact support.');
        }

        if ($user->suspended_account == 1) {
            return redirect()->route('login')
                ->with('error', 'Your account is suspended. Please contact support.');
        }

        // 🚨 Two-factor is not optional because the door is a different one. Signing this person
        // straight in would turn the Google button into a way around the second factor they
        // deliberately switched on.
        //
        // They are sent to the password form rather than to an OTP screen, because the existing
        // OTP step CANNOT complete a Google sign-in: `verify2FA` re-authenticates with
        // `Auth::attempt(['email' => …, 'password' => …])`, and a Google user has no password to
        // supply. Making it work needs a session-authorised login path — new authentication code
        // that signs somebody in without a password, which is written deliberately and with tests,
        // not as a side effect of adding a button. Tracked in TASKS.
        if ($user->is_2fa) {
            $request->session()->put('google_2fa_pending_email', $user->email);
            return redirect()->route('login');
        }

        $context = (array) $request->session()->get('google_signup_context', []);

        Auth::login($user, true);
        $request->session()->regenerate();

        // Clear the google context from session
        $request->session()->forget('google_signup_context');

        if ($target = $this->safeRedirect($context['redirect'] ?? null)) {
            return redirect($target);
        }

        return redirect()->intended(route('user.show', $user->username));
    }

    /**
     * A new person. Nothing is written — the verified profile goes into the session and they are
     * sent to the normal registration screen to choose a role, a username and to accept the terms,
     * none of which a redirect from Google can provide.
     */
    private function startSignUp(Request $request, SocialiteUser $googleUser, string $email): RedirectResponse
    {
        $request->session()->put(self::SESSION_KEY, [
            'email' => $email,
            'name' => trim((string) $googleUser->getName()) ?: null,
            'avatar' => $googleUser->getAvatar(),
            'google_id' => (string) $googleUser->getId(),
            'verified_at' => now()->toIso8601String(),
        ]);

        $context = (array) $request->session()->pull('google_signup_context', []);
        $query = array_filter([
            'ref' => $context['ref'] ?? null,
            'type' => $context['type'] ?? null,
        ]);

        if ($target = $this->safeRedirect($context['redirect'] ?? null)) {
            $request->session()->put('url.intended', $target);
        }

        // The utm values are put back where the register page already looks for them.
        $request->session()->put('google_signup_utm', array_intersect_key($context, array_flip([
            'utm_source', 'utm_medium', 'utm_campaign',
        ])));

        return redirect()->route('register', $query);
    }

    /**
     * Socialite exposes the raw payload on `->user`; the claim is `email_verified` on the
     * userinfo endpoint and can arrive as a boolean or the string "true".
     *
     * Absent is treated as NOT verified. Failing closed costs one person a password signup;
     * failing open costs somebody their account.
     */
    private function emailIsVerified(SocialiteUser $googleUser): bool
    {
        $raw = (array) ($googleUser->user ?? []);
        $claim = $raw['email_verified'] ?? $raw['verified_email'] ?? null;

        return $claim === true || $claim === 'true' || $claim === 1 || $claim === '1';
    }

    /**
     * A landing page the caller asked for, but only if it is on this site.
     *
     * 🚨 `?redirect=` arrives on the query string, so it is attacker-controlled, and Laravel's
     * `redirect()` will happily send someone to another host. Unvalidated, this was an open
     * redirect **on an authentication callback** — the worst place for one: the victim completes a
     * genuine Google sign-in on the real domain, sees the real consent screen, gets a real
     * session, and is then handed to the attacker's page carrying all the trust of a sign-in that
     * just succeeded. A page asking them to "confirm your password" there is very likely to be
     * believed.
     *
     * Rules, in order:
     *  - must start with "/" — a same-origin path, not a URL
     *  - must NOT start with "//" — that is protocol-relative, which browsers read as another
     *    origin ("//evil.com" leaves the site) while still passing the leading-slash test
     *  - must not start with "/\" — some browsers normalise the backslash to "/", making
     *    "/\evil.com" equivalent to "//evil.com"
     *
     * Anything else returns null and the caller falls back to its own default.
     */
    private function safeRedirect(?string $target): ?string
    {
        $target = trim((string) $target);

        if ($target === '' || ! str_starts_with($target, '/')) {
            return null;
        }

        if (str_starts_with($target, '//') || str_starts_with($target, '/\\')) {
            return null;
        }

        return $target;
    }

    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget([self::SESSION_KEY, 'google_signup_utm']);

        return redirect()->route('register');
    }

    private function configured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }
}
