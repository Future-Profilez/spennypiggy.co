<?php

namespace App\Support;

use App\Models\IdentityReview;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

/**
 * Tell the reviewers the moment a refused creator passes Stripe again.
 *
 * 🚨 THIS PERSON IS LOCKED OUT WHILE THEY WAIT. A refusal suspends the account,
 * so between passing Stripe again and a human signing it off they cannot sell
 * anything at all — every purchase is refused and their page is hidden. That is
 * why the client asked for a message the moment it happens rather than leaving
 * it to the half-hourly digest, which still carries the row.
 *
 * ⚠️ ONLY FOR A CREATOR WHO WAS ACTUALLY REFUSED. An ordinary first check is
 * routine work and belongs in the digest; mailing on every verified creator is
 * how a reviewer learns to filter the address this arrives from.
 */
class IdentityReverifiedAlert
{
    public const CHANNEL = 'identity_reverified';

    /**
     * ⚠️ NEVER THROWS. The caller is the Stripe webhook that has just marked the
     * creator verified; an alert failing must not fail the verification.
     */
    public static function notify(User $user): bool
    {
        try {
            if (! self::wasPreviouslyRefused($user)) {
                return false;
            }

            $recipients = AlertRouter::recipients(self::CHANNEL);

            if (empty($recipients)) {
                return false;
            }

            /*
             * ⚠️ A LINK ONLY WHEN THE ADDRESS IS CONFIGURED. `ADMIN_APP_URL` is
             * unset by default, and an invented admin hostname in an alert is
             * worse than a sentence telling the reader where to look — it sends
             * them to a domain that may not be ours.
             */
            $adminUrl = rtrim((string) config('services.admin.url'), '/');
            $where = $adminUrl !== ''
                ? "Review: {$adminUrl}/users-stripe-identity-detail"
                : 'Review: admin panel → Moderation → ID Sign-off';

            Mail::raw(
                "{$user->username} was refused at ID sign-off, has run the check again, and Stripe has passed it.\n\n".
                "They are suspended until somebody signs this off, so they cannot sell anything meanwhile.\n\n".
                $where,
                function ($message) use ($recipients, $user) {
                    $message->to($recipients)
                        ->subject("Re-verified after a refusal: {$user->username}");
                }
            );

            return true;
        } catch (\Throwable $e) {
            Log::warning('Could not send identity re-verified alert', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * ⚠️ Guarded on the table: `identity_reviews` is new, and an alert path must
     * never be the thing that takes a Stripe webhook down.
     */
    private static function wasPreviouslyRefused(User $user): bool
    {
        if (! Schema::hasTable('identity_reviews')) {
            return false;
        }

        return IdentityReview::where('user_id', $user->id)
            ->where('decision', IdentityReview::DECISION_REJECTED)
            ->exists();
    }
}
