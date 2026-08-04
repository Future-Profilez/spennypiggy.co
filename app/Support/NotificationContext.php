<?php

namespace App\Support;

use App\Models\NotificationLog;

/**
 * The transaction a message is about, carried alongside the send.
 *
 * The platform sends mail from 121 call sites and pushes from 107, most of them
 * several hops from the payment that caused them — a webhook processor
 * dispatches a job, the job builds a mailable, the mailer fires an event. None
 * of those layers passes a payment id, so the delivery log had no way to say
 * WHICH purchase a receipt belonged to.
 *
 * Rather than thread an argument through every one of them, the fulfilment
 * entry points open a context here and everything downstream reads it:
 *
 *     NotificationContext::for([
 *         'context_type' => 'wish',
 *         'context_id' => $wish->id,
 *         'stripe_session_id' => $session->id,
 *         'buyer_id' => $buyer->id,
 *         'creator_id' => $creator->id,
 *     ]);
 *
 * ⚠️ The context is propagated across the queue automatically (see
 * NotificationLogServiceProvider): every job dispatched while a context is open
 * carries a snapshot in its payload, and restores it while it runs. That is
 * what makes a receipt mailed from inside a queued job land on the right
 * payment with no change to the job itself.
 */
class NotificationContext
{
    /** Key the snapshot travels under inside a queue payload. */
    public const PAYLOAD_KEY = 'spenny_notification_context';

    private static array $current = [];

    /**
     * Fields carried. Anything else passed in is dropped, so a caller cannot
     * accidentally push a whole model (or supporter PII) into a job payload.
     */
    private const FIELDS = [
        'context_type',
        'context_id',
        'stripe_session_id',
        'stripe_payment_intent_id',
        'financial_transaction_id',
        'campaign_id',
        'buyer_id',
        'buyer_email',
        'creator_id',
    ];

    /**
     * Open a context. Merges into whatever is already open, so an inner
     * processor can add the payment intent without restating the product.
     *
     * Never throws: this sits on the money path, and a purchase must not fail
     * because its delivery log could not be labelled.
     */
    public static function for(array $attributes): void
    {
        try {
            $clean = [];

            foreach (self::FIELDS as $field) {
                if (! array_key_exists($field, $attributes)) {
                    continue;
                }

                $value = $attributes[$field];

                if ($value === null || $value === '') {
                    continue;
                }

                // Cast ids to string/int rather than keeping a Ramsey uuid object
                // or a model — both serialise badly into a queue payload.
                $clean[$field] = in_array($field, ['buyer_id', 'creator_id', 'financial_transaction_id', 'campaign_id'], true)
                    ? (int) $value
                    : (string) $value;
            }

            self::$current = array_merge(self::$current, $clean);
        } catch (\Throwable $e) {
            // Deliberately silent — see the class docblock.
        }
    }

    /** Run a callback with an additional context, restoring the previous one after. */
    public static function scoped(array $attributes, callable $callback)
    {
        $previous = self::$current;

        try {
            self::for($attributes);

            return $callback();
        } finally {
            self::$current = $previous;
        }
    }

    public static function current(): array
    {
        return self::$current;
    }

    public static function isEmpty(): bool
    {
        return self::$current === [];
    }

    public static function clear(): void
    {
        self::$current = [];
    }

    /** Replace wholesale — used when restoring a snapshot from a queue payload. */
    public static function restore(array $snapshot): void
    {
        self::$current = array_intersect_key($snapshot, array_flip(self::FIELDS));
    }

    /**
     * The columns a NotificationLog row takes from the open context. `buyer_*`
     * and `creator_id` are used to resolve the recipient's role and are not
     * themselves stored — the log records who RECEIVED the message, not who else
     * was party to the transaction.
     */
    public static function logColumns(): array
    {
        $c = self::$current;

        return [
            'context_type' => $c['context_type'] ?? null,
            'context_id' => $c['context_id'] ?? null,
            'stripe_session_id' => $c['stripe_session_id'] ?? null,
            'stripe_payment_intent_id' => $c['stripe_payment_intent_id'] ?? null,
            'financial_transaction_id' => $c['financial_transaction_id'] ?? null,
            'campaign_id' => $c['campaign_id'] ?? null,
        ];
    }

    /**
     * Which side of the transaction a recipient is on. Matching on the email as
     * well as the id matters because a guest buyer has no account at all.
     */
    public static function roleFor(?int $userId, ?string $email = null): string
    {
        $c = self::$current;

        if ($userId !== null) {
            if (! empty($c['creator_id']) && (int) $c['creator_id'] === $userId) {
                return NotificationLog::ROLE_CREATOR;
            }

            if (! empty($c['buyer_id']) && (int) $c['buyer_id'] === $userId) {
                return NotificationLog::ROLE_BUYER;
            }
        }

        if ($email !== null && ! empty($c['buyer_email'])
            && strcasecmp((string) $c['buyer_email'], $email) === 0) {
            return NotificationLog::ROLE_BUYER;
        }

        return NotificationLog::ROLE_OTHER;
    }
}
