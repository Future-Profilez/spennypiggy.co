<?php

namespace App\Support;

use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * "Someone tried to pay you, and we had to turn them away."
 *
 * Replaces a bare per-attempt alert. Three things changed and each matters:
 *
 *  - it writes a **bell row** and a push, so a creator who simply opens the site
 *    sees it — the existing SubscriptionBlockedNotification already sends the
 *    email, and this must not send a second one;
 *  - it is **deduped to once a day**, because a blocked popular creator otherwise
 *    gets one email per attempted purchase — which is how a creator mutes the
 *    alert and then misses the real one;
 *  - it states the **count**. A warning is easy to dismiss; "6 purchases were
 *    turned away this week" is not, and that number is what actually gets the
 *    subscription fixed. ⚠️ It counts ATTEMPTS, not distinct buyers — one person
 *    retrying a blocked checkout writes several rows, and no supporter identity is
 *    stored to deduplicate them by. Never word it as "6 people".
 */
class BlockedPaymentAlert
{
    private const CLAIM_TYPE = 'blocked_payment';

    /** How far back the creator-facing count reaches. */
    public const WINDOW_DAYS = 7;

    /**
     * Record one lost sale and tell the creator, at most once a day.
     *
     * ⚠️ Never throws. This runs on the supporter's checkout path, where the
     * purchase has already been refused — an error here would turn a refusal into
     * a crash, and the supporter would see a broken page instead of a message.
     */
    public static function record(?User $creator, $amount = null, ?string $currency = null, ?string $reason = null): void
    {
        if (! $creator) {
            return;
        }

        try {
            DB::table('blocked_payment_attempts')->insert([
                'creator_id' => $creator->id,
                'amount' => is_numeric($amount) ? $amount : null,
                'currency' => $currency ? strtoupper(substr($currency, 0, 8)) : null,
                'reason' => $reason ? substr($reason, 0, 60) : null,
                'created_at' => now(),
            ]);

            // One message a day, whatever the volume. The claim IS the insert, so
            // two simultaneous blocked checkouts cannot both send.
            if (! NotificationDispatcher::claim($creator->id, self::CLAIM_TYPE, now()->toDateString())) {
                return;
            }

            $count = self::countInWindow($creator);

            self::notify($creator, $count);
        } catch (\Throwable $e) {
            Log::warning('BlockedPaymentAlert: could not record a blocked payment: '.$e->getMessage(), [
                'creator_id' => $creator->id,
            ]);
        }
    }

    /**
     * ⚠️ A failed send RELEASES the day's claim.
     *
     * The claim is taken before the dispatch, so without this a queue write that
     * throws would leave the claim spent: the creator hears nothing for the rest of
     * the day while every further blocked purchase is recorded and silently
     * suppressed — the one day they most needed telling.
     */
    private static function notify(User $creator, int $count): void
    {
        try {
            NotificationDispatcher::queue(
                $creator,
                'blocked_payment',
                [
                    'title' => $count > 1
                        ? "{$count} purchases were turned away"
                        : 'A purchase was turned away',
                    'body' => $count > 1
                        ? "{$count} attempts to buy from you were blocked in the last ".self::WINDOW_DAYS.' days because your subscription is not active. Activate it and they can buy again.'
                        : 'Someone tried to buy from you and was turned away because your subscription is not active. Activate it and they can buy again.',
                ],
                // ⚠️ Bell and push only, deliberately. The email on this refusal is
                // already sent by SubscriptionBlockedNotification at the same call
                // site, and NotificationDispatcher's email channel is a no-op
                // without a 'mailable' in the payload — so passing ALL_CHANNELS
                // here looked like a third channel while sending nothing.
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                // Not marketing: this is the creator losing income right now, and
                // there is no version of it they should be able to opt out of.
                false,
            );
        } catch (\Throwable $e) {
            DB::table('engagement_notifications')
                ->where('user_id', $creator->id)
                ->where('type', self::CLAIM_TYPE)
                ->where('dedup_key', now()->toDateString())
                ->delete();

            Log::warning('BlockedPaymentAlert: could not notify a blocked creator: '.$e->getMessage(), [
                'creator_id' => $creator->id,
            ]);
        }
    }

    /** Lost sales in the creator-facing window. */
    public static function countInWindow(User $creator): int
    {
        return (int) DB::table('blocked_payment_attempts')
            ->where('creator_id', $creator->id)
            ->where('created_at', '>=', now()->subDays(self::WINDOW_DAYS))
            ->count();
    }
}
