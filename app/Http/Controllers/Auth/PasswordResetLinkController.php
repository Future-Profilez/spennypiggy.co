<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\ForgotPassword;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
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
     * 🚨 The reset link used to carry ONLY the user's `uuid`, which is a PUBLIC
     * identifier — it is in profile payloads, item routes and admin URLs all over
     * this codebase. Combined with an unauthenticated, unthrottled `forgot-password`
     * endpoint (which sets `expired_at` for anybody's email), that made
     * `POST /change-password/{uuid}` a complete account takeover: request a reset
     * for the victim, then post a new password against their uuid.
     *
     * The link now carries a single-use random token stored (hashed) in
     * `password_reset_tokens` by Laravel's own broker. The uuid stays in the URL
     * only so the page knows which account it is resetting; it proves nothing.
     *
     * @throws ValidationException
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = Str::lower(trim((string) $request->input('email')));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (empty($user)) {
            return response()->json([
                'status' => false,
                'message' => "Email address is invalid or didn't match with our records.",
            ]);
        }

        // `createToken` deletes any existing row for this user first, so an older
        // link stops working the moment a new one is issued.
        $token = Password::broker()->createToken($user);

        $user->expired_at = Carbon::now()->addMinutes(self::LINK_TTL_MINUTES);
        $user->save();

        ForgotPassword::dispatch($user, $token);

        return response()->json([
            'status' => true,
            'message' => 'Password reset link has been sent to your email address. Please check your inbox. This link expires in '.self::LINK_TTL_MINUTES.' minutes.',
        ]);
    }

    /** How long a reset link stays usable. */
    public const LINK_TTL_MINUTES = 10;

    public function forgotPasswordPage(Request $request, $uuid)
    {
        // The token arrives on the query string so the same page URL works whether it
        // is opened from the mail or reloaded. It is NOT trusted here — `changePassword`
        // verifies it against the broker before anything is written.
        return Inertia::render('Auth/ConfirmPassword', [
            'uuid' => $uuid,
            'token' => (string) $request->query('token', ''),
        ]);
    }

    public function changePassword(Request $request, $uuid)
    {
        $request->validate([
            // Same strength rules as registration. `min:6` here meant the one place a
            // password can be replaced was the weakest gate on the platform.
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'token' => ['required', 'string'],
        ], [
            'token.required' => 'This reset link is invalid. Please request a new one.',
        ]);

        $user = User::where('uuid', $uuid)->first();

        // One message for every failure: a reset form that distinguishes "no such
        // account" from "wrong token" is an account-existence oracle.
        $invalid = fn () => back()->with('error', 'This reset link is invalid or has expired. Please request a new one.');

        if (empty($user)) {
            return $invalid();
        }

        if (! Password::broker()->tokenExists($user, $request->input('token'))) {
            return $invalid();
        }

        if (empty($user->expired_at) || Carbon::parse($user->expired_at)->isPast()) {
            return $invalid();
        }

        $user->forceFill([
            'password' => Hash::make($request->input('password')),
            // Kills every "remember me" cookie issued before the reset — otherwise a
            // session opened by whoever prompted the reset survives it.
            'remember_token' => Str::random(60),
            'expired_at' => Carbon::now(),
        ])->save();

        // Single use: the token is spent whether or not the person reloads the page.
        Password::broker()->deleteToken($user);

        return redirect(route('login'))->with('success', 'Password updated successfully. Please log in.');
    }
}
