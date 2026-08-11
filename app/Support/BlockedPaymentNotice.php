<?php

namespace App\Support;

use App\Mail\PaymentCouldNotGoThrough;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Emails a supporter when their payment was stopped before it reached Stripe.
 *
 * The 9 Aug messaging brief asked this twice (questions 5 and 9): everything
 * the risk engine says is on screen only, so someone on a phone who navigates
 * away has nothing — no reference, no explanation, no route back. A guest has
 * it worse, because they have no account to come back to at all.
 *
 * ⚠️ SEND-ONCE, NOT SEND-EVERY-TIME. The behaviour this feature exists to stop
 * is the retry spiral, and a person retrying four times must not receive four
 * emails — that would confirm every fear the copy is written to defuse. One
 * message per address, per state, per day.
 *
 * ⚠️ NEVER THROWS. It runs on the checkout path, after the refusal has already
 * been decided. An email failing must not turn "we couldn't take that payment"
 * into a 500.
 */
class BlockedPaymentNotice
{
    /**
     * How long one recipient is quiet for, per message state.
     *
     * A day, not an hour: someone hitting a spend cap is likely to try again
     * later the same day, and the second attempt tells them nothing new.
     */
    public const QUIET_SECONDS = 86400;

    /**
     * Message states worth an email at all.
     *
     * ⚠️ STEP_UP is deliberately absent — that flow is already sending them a
     * code, and a second email arriving alongside it reads as two separate
     * problems. The guest login gates are absent too: the person is redirected
     * to a page that explains itself and has committed nothing.
     */
    public const EMAILABLE_STATES = [
        'COOLDOWN_ACTIVE',
        'SPEND_CAP_REACHED',
        'CROSS_CREATOR_RESTRICTED',
        'NEW_CREATOR_VOLUME_LIMIT',
        'PLATFORM_STATE_ACTIVE',
        'IDENTITY_BLOCKED',
        'GENERIC_HOLD',
    ];

    /**
     * @param  array  $ui  a rendered message from RiskMessages::get()
     * @param  string|null  $email  the address the payment was attempted with
     */
    public static function send(array $ui, ?string $email, ?User $user = null): void
    {
        try {
            if (! config('services.blocked_payment_notice.enabled', true)) {
                return;
            }

            $key = $ui['key'] ?? null;
            $email = trim((string) $email);

            if (! $key || ! in_array($key, self::EMAILABLE_STATES, true)) {
                return;
            }

            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return;
            }

            // The claim IS the write: Cache::add is atomic, so two concurrent
            // refusals cannot both win and send. Cache rather than a table
            // because this is an anti-spam guard, not a record anyone reads —
            // losing it costs exactly one duplicate email.
            $claim = 'blocked_payment_notice:'.hash('sha256', mb_strtolower($email)).':'.$key;

            if (! Cache::add($claim, 1, self::QUIET_SECONDS)) {
                return;
            }

            // A guest typed this address into a checkout minutes ago and nothing
            // has verified it, so the per-address quiet period above is what
            // stops this becoming a way to mail a stranger repeatedly.
            Mail::to($email)->queue(new PaymentCouldNotGoThrough(
                ui: $ui,
                isGuest: $user === null,
                firstName: $user ? self::firstNameOf($user) : null,
            ));
        } catch (\Throwable $e) {
            Log::warning('BlockedPaymentNotice: could not queue the notice', [
                'state' => $ui['key'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * `users.name` is a DISPLAY name and may be a stage name or a shop name, so
     * it is used only as a greeting and never as anything identifying.
     */
    protected static function firstNameOf(User $user): ?string
    {
        $name = trim((string) ($user->name ?? ''));
        if ($name === '') {
            return null;
        }

        return explode(' ', $name)[0];
    }
}
