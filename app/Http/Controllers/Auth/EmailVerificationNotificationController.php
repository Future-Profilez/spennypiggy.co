<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\VerifyEmail;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\EmailDomainPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EmailVerificationNotificationController extends Controller
{
    /**
     * How long a creator must wait between MANUAL resends, in seconds.
     *
     * The route throttle (3 per 10 min) is the abuse backstop; this is the
     * number the screen counts down, so the button can say when it will work
     * again instead of failing with a 429 the caller cannot predict.
     */
    public const RESEND_COOLDOWN = 60;

    /**
     * How long before an AUTOMATIC send (registration, or landing on the
     * verification screen) is allowed to fire again.
     *
     * `mustHaveToVerify` redirects to the verification screen on every blocked
     * navigation, so without this a creator clicking around the app would mail
     * themselves a link per page view.
     */
    public const AUTO_SEND_COOLDOWN = 600;

    public static function cacheKey(int $userId): string
    {
        return "verification_email_sent_at:{$userId}";
    }

    /**
     * Send the link and record WHEN.
     *
     * Every send goes through here so the cooldown, the screen's "sent a moment
     * ago" line and the resend button all read one timestamp.
     */
    public static function dispatchLink(User $user): void
    {
        VerifyEmail::dispatch($user);
        Cache::put(self::cacheKey($user->id), now()->timestamp, now()->addDay());
    }

    public static function lastSentAt(int $userId): ?int
    {
        $ts = Cache::get(self::cacheKey($userId));

        return $ts ? (int) $ts : null;
    }

    public static function secondsUntilResend(int $userId): int
    {
        $last = self::lastSentAt($userId);

        if (! $last) {
            return 0;
        }

        return max(0, self::RESEND_COOLDOWN - (now()->timestamp - $last));
    }

    /**
     * Send on arrival at the verification screen, unless something went out
     * recently. Returns whether a mail was actually dispatched.
     */
    public static function sendIfDue(User $user): bool
    {
        $last = self::lastSentAt($user->id);

        if ($last && (now()->timestamp - $last) < self::AUTO_SEND_COOLDOWN) {
            return false;
        }

        self::dispatchLink($user);

        return true;
    }

    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('user.show', ['username' => $request->user()->username]));
        }

        self::dispatchLink($request->user());

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

        // The screen counts this down, so a caller who is early gets a number
        // rather than a refusal it cannot explain.
        $wait = self::secondsUntilResend($user->id);

        if ($wait > 0) {
            return response()->json([
                'status' => false,
                'verified' => false,
                'retry_after' => $wait,
                'email' => $user->email,
                'message' => 'We have just sent one. Try again in a moment.',
            ], 429);
        }

        self::dispatchLink($user);

        return response()->json([
            'status' => true,
            'verified' => false,
            'email' => $user->email,
            'retry_after' => self::RESEND_COOLDOWN,
            'last_sent_at' => self::lastSentAt($user->id),
            'message' => 'Verification link sent to '.$user->email.'.',
        ]);
    }

    /**
     * Correct the address BEFORE it is verified.
     *
     * 🚨 Without this the only exit from the verification screen was to log
     * out. A creator who typo'd their address at signup could not receive the
     * link, could not sign in anywhere else, and could not register again —
     * the email and username are unique — so the account was unreachable and
     * the only fix was a support ticket.
     */
    public function changeEmail(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('error', 'Your email is already verified.');
        }

        $validated = $request->validate([
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $email = strtolower(trim($validated['email']));

        if ($email === strtolower((string) $user->email)) {
            throw ValidationException::withMessages([
                'email' => 'That is already the address on your account. Send the link again instead.',
            ]);
        }

        // The same rules registration enforces — a disposable domain, and a
        // domain with no mail server, are refused here too. Without it this
        // endpoint is a way around the signup gate.
        if ($error = EmailDomainPolicy::errorFor($email)) {
            throw ValidationException::withMessages(['email' => $error]);
        }

        if (EmailDomainPolicy::aliasOfExistingAccount($email, $user->id)) {
            throw ValidationException::withMessages([
                'email' => 'An account already exists for this mailbox.',
            ]);
        }

        $previous = $user->email;

        $user->email = $email;
        $user->email_verified_at = null;
        $user->save();

        // A new address gets a link immediately — the cooldown belongs to the
        // old one.
        Cache::forget(self::cacheKey($user->id));
        self::dispatchLink($user);

        try {
            ActivityLogger::log('USER_EMAIL_CHANGED_BEFORE_VERIFICATION', (string) $user->id, [
                'previous_email' => $previous,
                'new_email' => $email,
            ]);
        } catch (\Throwable $e) {
            // An audit failure must never be why the creator cannot fix their
            // own address.
        }

        return back()->with('success', 'Address updated. We have sent a new link to '.$email.'.');
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
        $user = Auth::user();

        return response()->json([
            'verified' => (bool) optional($user)->hasVerifiedEmail(),
            'retry_after' => $user ? self::secondsUntilResend($user->id) : 0,
        ]);
    }
}
