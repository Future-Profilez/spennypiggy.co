<?php

namespace App\Services;

use App\Helpers;
use App\Models\CreatorPushMessage;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Creator-controlled push — Developer Master Plan, 19 Aug 2026, §E:
 * "creator-controlled push with rate limits, settings, unsubscribe, moderation,
 * admin controls."
 *
 * 🚨 THIS IS THE ONLY FEATURE WHERE ONE USER WRITES TEXT THAT LANDS ON ANOTHER
 * USER'S PHONE, so the guards are the feature and the reach is the easy part.
 * All five, in the order they run:
 *
 *   1. RATE LIMIT   — `MAX_PER_DAY` / `MAX_PER_MONTH`, computed from the table,
 *                     never from a cache. A cache flush must not hand every
 *                     creator on the platform a fresh allowance.
 *   2. MODERATION   — length, the platform's blocked-word list, and NO LINKS
 *                     OR CONTACT DETAILS AT ALL (see below).
 *   3. CONSENT      — only supporters with push consent ON, read with `?? true`
 *                     for rows that predate the column, exactly as
 *                     `EmailService` does.
 *   4. RECORD       — written BEFORE dispatch, refusals included with a reason.
 *   5. ADMIN        — every row readable in the back office; a flag marks a
 *                     message that should not have gone.
 *
 * 🚨 NO URLS, NO @HANDLES, NO PHONE NUMBERS, NO EMAIL ADDRESSES. This is the
 * rule that matters most and it is not about tidiness. A push notification is
 * trusted by the person receiving it — it arrives on their lock screen with a
 * creator's name on it. A creator who can put a link in one can move their
 * paying audience to a site with no refunds, no chargeback protection and no
 * moderation, and can be impersonated doing it. Everything a supporter needs is
 * on the creator's own Spenny Piggy page, which is where the notification takes
 * them.
 *
 * ⚠️ A SUPPORTER IS SOMEBODY WHO PAID THIS CREATOR, not a follower. A follow is
 * a low-cost signal; a purchase is a relationship, and it is the one the plan
 * describes ("giving them reasons to come back"). It also bounds the fan-out to
 * a number that means something.
 *
 * ⚠️ NOTHING ON THIS PATH MAY THROW into the caller's request. Same house rule
 * as `VisitTracker` and the security observation path: a broken dispatch must
 * not fail the screen the creator is on.
 */
class CreatorPushService
{
    /**
     * One a day, four a month.
     *
     * ⚠️ Deliberately mean. A creator sending daily is not re-engagement, it is
     * the reason people turn notifications off — and a supporter who does that
     * is lost to EVERY creator they support, not just the one who annoyed them.
     * The limit protects the channel, not the creator.
     */
    public const MAX_PER_DAY = 1;

    public const MAX_PER_MONTH = 4;

    /**
     * The rolling window MAX_PER_MONTH is counted over.
     *
     * ⚠️ It was the literal `30` in three places — the query, the refusal
     * message and the help centre article describing the limit — so a change to
     * the window would have left two of them describing a rule the query no
     * longer enforces. `HelpTokens::push.window_days` reads this.
     */
    public const MONTH_WINDOW_DAYS = 30;

    public const MAX_LENGTH = 160;

    public const MIN_LENGTH = 10;

    /** Matching `CreatorEventNotifier::MAX_RECIPIENTS`. */
    private const MAX_RECIPIENTS = 5000;

    /**
     * Whether this creator may send right now, and why not if they may not.
     *
     * @return array{allowed:bool, reason:?string, sent_today:int, sent_this_month:int}
     */
    public function allowance(User $creator): array
    {
        if (! Schema::hasTable('creator_push_messages')) {
            return ['allowed' => false, 'reason' => 'Not available yet.', 'sent_today' => 0, 'sent_this_month' => 0];
        }

        $today = CreatorPushMessage::where('creator_id', $creator->id)
            ->where('status', CreatorPushMessage::STATUS_SENT)
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->count();

        $month = CreatorPushMessage::where('creator_id', $creator->id)
            ->where('status', CreatorPushMessage::STATUS_SENT)
            ->where('created_at', '>=', Carbon::now()->subDays(self::MONTH_WINDOW_DAYS))
            ->count();

        $reason = null;

        if ($today >= self::MAX_PER_DAY) {
            $reason = 'You have already sent a notification today. You can send another tomorrow.';
        } elseif ($month >= self::MAX_PER_MONTH) {
            $reason = 'You have sent '.self::MAX_PER_MONTH.' notifications in the last '.self::MONTH_WINDOW_DAYS.' days, which is the limit.';
        }

        return [
            'allowed' => $reason === null,
            'reason' => $reason,
            'sent_today' => $today,
            'sent_this_month' => $month,
        ];
    }

    /**
     * Check a message without sending it. Returns null when it is acceptable.
     *
     * 🚨 THE LINK RULE IS FIRST AND IT IS ABSOLUTE. See the class note: a link
     * in a trusted notification is how a paying audience gets moved somewhere
     * with no refunds and no moderation.
     */
    public function moderate(string $body): ?string
    {
        $body = trim($body);

        if (mb_strlen($body) < self::MIN_LENGTH) {
            return 'Write a little more — at least '.self::MIN_LENGTH.' characters.';
        }

        if (mb_strlen($body) > self::MAX_LENGTH) {
            return 'Keep it under '.self::MAX_LENGTH.' characters so it fits on a lock screen.';
        }

        /*
         * ⚠️ E-MAIL IS CHECKED BEFORE THE URL RULE, or `jane@example.com` is
         * caught by the domain pattern and refused with "links are not allowed",
         * which is true but tells the creator to look for the wrong thing. A
         * refusal is only useful if it names what to remove.
         */
        if (preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i', $body)) {
            return 'Email addresses are not allowed in notifications.';
        }

        // A URL in any of its usual disguises, including "example dot com".
        if (preg_match('~(https?://|www\.|\b[a-z0-9-]+\.(com|co|uk|net|org|io|me|ly|link|shop|store|xyz|onl|fans)\b|\bdot\s+(com|co|uk|net|org)\b)~i', $body)) {
            return 'Links are not allowed in notifications. Everything your supporters need is already on your page.';
        }

        // An @handle pointing somewhere else.
        if (preg_match('/(^|\s)@[a-z0-9._]{2,}/i', $body)) {
            return 'Usernames are not allowed in notifications.';
        }

        /*
         * A phone number: seven or more digits, ignoring the spaces, brackets
         * and dashes people write them with. Deliberately loose — a false
         * positive costs a reword; a missed one puts a phone number a supporter
         * trusts onto their lock screen.
         */
        if (preg_match('/(?:\+?\d[\d\s().-]{6,}\d)/', $body)
            && preg_match_all('/\d/', $body) >= 7) {
            return 'Phone numbers are not allowed in notifications.';
        }

        $blocked = Helpers::checkBlockText($body);

        if ($blocked !== false) {
            return 'Please remove "'.$blocked.'" — notifications have to stay suitable for everyone.';
        }

        return null;
    }

    /**
     * Send, or record why not.
     *
     * @return array{sent:bool, reason:?string, recipients:int}
     */
    public function send(User $creator, string $body): array
    {
        $body = trim($body);

        if (! Schema::hasTable('creator_push_messages')) {
            return ['sent' => false, 'reason' => 'Not available yet.', 'recipients' => 0];
        }

        $allowance = $this->allowance($creator);

        if (! $allowance['allowed']) {
            /*
             * ⚠️ A rate-limited attempt is NOT recorded as a blocked message.
             * The table drives the limit, and writing a row here would mean a
             * creator who hits the limit and tries again tomorrow reads as
             * somebody with a moderation history.
             */
            return ['sent' => false, 'reason' => $allowance['reason'], 'recipients' => 0];
        }

        if ($problem = $this->moderate($body)) {
            CreatorPushMessage::create([
                'creator_id' => $creator->id,
                'body' => mb_substr($body, 0, 300),
                'status' => CreatorPushMessage::STATUS_BLOCKED,
                'blocked_reason' => mb_substr($problem, 0, 200),
                'recipients' => 0,
            ]);

            return ['sent' => false, 'reason' => $problem, 'recipients' => 0];
        }

        $recipients = $this->recipients($creator);

        /*
         * 🚨 RECORDED BEFORE DISPATCH. If the fan-out fails halfway the creator
         * has still spent their allowance and the message still went to some
         * people — a row written afterwards would miss both facts. Same
         * reasoning as logging a refund attempt before calling Stripe.
         */
        $row = CreatorPushMessage::create([
            'creator_id' => $creator->id,
            'body' => mb_substr($body, 0, 300),
            'status' => CreatorPushMessage::STATUS_SENT,
            'recipients' => count($recipients),
        ]);

        /*
         * 🚨 QUEUED, NEVER SENT IN THIS LOOP. `NotificationDispatcher::send()`
         * makes a SYNCHRONOUS HTTP call per recipient, and its own docblock says
         * "avoid calling directly from a request or a loop" — which is exactly
         * what this did in its first version. Production runs on Lambda with a
         * 60-SECOND REQUEST TIMEOUT and this fan-out is capped at 5,000 people:
         * a creator with a few hundred supporters would have timed out
         * mid-send, with the row already written as `sent` and a recipient
         * count that never happened. Found while writing the infrastructure
         * notes, not by a test.
         *
         * ⚠️ THIS MEANS THE FEATURE NEEDS `queue:work` RUNNING. Without a worker
         * the row is written, the creator is told it sent, and nothing is ever
         * delivered — the standing gate on every queued feature in this app.
         */
        foreach ($recipients as $supporter) {
            try {
                NotificationDispatcher::queue(
                    $supporter,
                    'creator_push',
                    [
                        'title' => $creator->name,
                        'body' => $body,
                        // ⚠️ The destination is always the creator's own page.
                        // A creator-supplied target would reintroduce the link
                        // rule through the back door.
                        'url' => '/'.$creator->username,
                        'creator_id' => $creator->id,
                        'message_uuid' => $row->uuid,
                    ],
                    /*
                     * ⚠️ THE CONSTANTS, NOT THE STRINGS. `send()` matches the
                     * channel list with `in_array`, so a renamed constant would
                     * leave a literal here matching nothing — and the method
                     * returns void, so every send would quietly reach nobody
                     * with no error anywhere. No e-mail: this is a lock-screen
                     * nudge, and the dispatcher's e-mail channel is a no-op
                     * without a mailable anyway.
                     */
                    [NotificationDispatcher::CHANNEL_PUSH, NotificationDispatcher::CHANNEL_BELL],
                    // Marketing-class: it is promotional, so consent applies.
                    true
                );
            } catch (\Throwable $e) {
                // One failed ENQUEUE must never stop the fan-out.
                Log::warning('Creator push could not be queued for a supporter', [
                    'creator_id' => $creator->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return ['sent' => true, 'reason' => null, 'recipients' => count($recipients)];
    }

    /**
     * Supporters who have paid this creator and still accept push.
     *
     * ⚠️ `?? true` ON THE CONSENT COLUMN. A row created before the column
     * existed reads NULL, and a strict check would treat "we never asked" as
     * "they said no" — the same fault that once silently skipped the platform's
     * largest e-mail fan-out. The column defaults true, so a missing value means
     * the same thing.
     *
     * ⚠️ A suspended account is never messaged, the same rule the birthday
     * campaign learned: somebody who paid before being suspended stays in the
     * transaction list for ever.
     *
     * @return array<int, User>
     */
    private function recipients(User $creator): array
    {
        if (! Schema::hasTable('financial_transactions')) {
            return [];
        }

        $supporterIds = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->whereNotNull('supporter_id')
            ->distinct()
            ->limit(self::MAX_RECIPIENTS)
            ->pluck('supporter_id')
            ->all();

        if ($supporterIds === []) {
            return [];
        }

        return User::query()
            ->whereIn('id', $supporterIds)
            ->where('suspended_account', 0)
            ->limit(self::MAX_RECIPIENTS)
            ->get()
            ->filter(fn (User $u) => ($u->push_notifications_enabled ?? true))
            ->values()
            ->all();
    }
}
