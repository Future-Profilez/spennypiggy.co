<?php

namespace App\Services;

use App\Models\PlatformRiskState;
use App\Models\SignupLead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * The ONE way a refused registration becomes a lead instead of a lost click.
 *
 * Everything here fails SOFT. `capture()` sits on the registration path, and a
 * lead we failed to record costs one email; an exception there costs the person
 * their error message and replaces a bad experience with a 500.
 */
class SignupLeadService
{
    /**
     * Record someone we turned away.
     *
     * Returns the lead, or null when there was nothing to capture — an
     * unusable address, or a person who already has an account.
     */
    public function capture(
        Request $request,
        string $email,
        int $role,
        string $reason = SignupLead::REASON_PLATFORM_FREEZE,
    ): ?SignupLead {
        try {
            $email = $this->normaliseEmail($email);

            if ($email === null || ! in_array($reason, SignupLead::REASONS, true)) {
                return null;
            }

            // 🚨 Someone with an account was not turned away from registering —
            // they were turned away from registering TWICE. Capturing them puts
            // an existing user on a "you can sign up now" list, which reads as
            // the platform having lost their account.
            if (User::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
                return null;
            }

            $lead = SignupLead::firstOrNew(['email' => $email]);

            // A person turned away a second time is still waiting, so a lead
            // that was already notified re-opens rather than staying closed —
            // being told "it's open" and then refused again is worse than never
            // having been told.
            $lead->fill([
                'role' => $role,
                'reason' => $reason,
                'platform_state' => $this->currentState(),
                'notified_at' => null,
            ]);

            // First-touch: attribution is only written once, so a lead captured
            // today keeps the advert that produced it rather than the page they
            // happened to be on when they retried.
            if (! $lead->exists) {
                $lead->source = $this->source($request);
                $lead->landing_page = $this->landingPage($request);
            }

            $lead->save();

            return $lead;
        } catch (\Throwable $e) {
            Log::warning('Signup lead capture failed', [
                'reason' => $reason,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Close a lead because the person now has an account.
     *
     * Called from the successful registration path. Without it, the notify
     * sweep would email people who are already signed up.
     */
    public function close(string $email): void
    {
        try {
            $email = $this->normaliseEmail($email);

            if ($email === null) {
                return;
            }

            SignupLead::query()
                ->where('email', $email)
                ->whereNull('converted_at')
                ->update(['converted_at' => now()]);
        } catch (\Throwable $e) {
            Log::warning('Signup lead close failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Is registration open right now?
     *
     * The notify sweep asks this before it tells anyone anything — a notice
     * sent while the platform is still frozen sends them straight back into
     * the same refusal.
     */
    public function registrationOpen(): bool
    {
        return $this->currentState() !== 'FREEZE';
    }

    protected function currentState(): string
    {
        $record = PlatformRiskState::latest('started_at')->first();

        return $record ? (string) $record->state : 'NORMAL';
    }

    /**
     * ⚠️ Both cookies are VISITOR-SUPPLIED, so a value is stored only when it
     * is one the platform recognises. Without that check anyone could write an
     * arbitrary string into the column the attribution report prints — the same
     * rule `RegisteredUserController` applies to `signup_landing_page`.
     */
    protected function source(Request $request): ?string
    {
        $value = $request->cookie(VisitTracker::ATTRIBUTION_COOKIE);

        return is_string($value) && in_array($value, VisitTracker::SOURCES, true)
            ? $value
            : null;
    }

    protected function landingPage(Request $request): ?string
    {
        $value = $request->cookie(VisitTracker::LANDING_COOKIE);

        return is_string($value) && VisitTracker::isAdLanding($value) ? $value : null;
    }

    protected function normaliseEmail(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));

        if ($email === '' || strlen($email) > 190 || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        return $email;
    }
}
