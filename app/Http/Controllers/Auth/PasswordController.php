<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     *
     * This is the live change-password endpoint — `route('password.update')`,
     * posted by resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->invalidateOtherSessions($request, $validated['password']);

        return back()->with('success', 'Password has been updated.');
    }

    /**
     * Sign every OTHER session for this account out.
     *
     * 🚨 Client Security Checklist §2 (Developer Master Plan, 19 Aug 2026):
     * "sessions invalidated on password change; log out everywhere". Before this,
     * a session opened on a stolen or shared device survived the password change
     * that was made to end it — the one action a person takes when they think
     * someone else is in their account did nothing to that someone else.
     *
     * 🚨 ORDER MATTERS. `logoutOtherDevices()` calls `Hash::check($password, …)`
     * against the user's CURRENT stored hash and throws if it does not match, so
     * it must be called with the NEW password and only AFTER the row has been
     * updated. Calling it with `current_password`, or before the update, throws.
     *
     * ⚠️ THIS IS HALF THE FIX, AND THE HALF THAT CANNOT BREAK ANYTHING. Laravel
     * only actually *rejects* the other sessions when
     * `Illuminate\Session\Middleware\AuthenticateSession` (aliased here as
     * `auth.session` in App\Http\Kernel) is in the request stack — that middleware
     * is what compares each session's stored password hash against the user's
     * current one. It is aliased in this app and applied to NO group and NO route,
     * so what this method does today is rotate the hash and queue a fresh recaller
     * cookie; the other sessions are not yet turned away.
     *
     * Adding `auth.session` to the `web` group is the other half, and it is a
     * deliberate decision for a human, not a follow-on edit: applied wrongly it
     * mass-logs-out every signed-in user at once. It was left undone on purpose
     * here rather than smuggled in on the back of this change — raise it before
     * anyone reports that "log out everywhere" does not work.
     *
     * ⚠️ The session's own copy of the hash is re-stamped below so that when
     * `auth.session` IS enabled, the person who just changed their password is not
     * signed out of the very session they did it from.
     */
    private function invalidateOtherSessions(Request $request, string $newPassword): void
    {
        try {
            Auth::logoutOtherDevices($newPassword);

            if ($request->hasSession() && $request->user()) {
                $request->session()->put(
                    'password_hash_'.Auth::getDefaultDriver(),
                    $request->user()->getAuthPassword()
                );
            }
        } catch (\Throwable $e) {
            // The password itself has already been changed and saved by this point.
            // Failing to sign the other devices out is worth knowing about, but it
            // must never turn a successful password change into a 500 that leaves
            // the user believing it did not work.
            Log::warning('Password changed but other sessions could not be invalidated', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
