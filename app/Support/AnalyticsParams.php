<?php

namespace App\Support;

/**
 * What may appear in an analytics event parameter.
 *
 * 🚨 Load-bearing privacy, not tidiness. These parameters are sent to Google —
 * from the browser by `AnalyticsEvent`, and straight off the server by
 * `MeasurementProtocol`. Both paths scrub through here so a rule added for one
 * cannot be missing from the other.
 *
 * A key whose NAME suggests it identifies a person is dropped WHOLE rather than
 * pattern-matched on its value: matching the value would pass anything the
 * pattern had not been taught about yet, and the failure is silent.
 */
class AnalyticsParams
{
    /**
     * Key fragments that mean "this identifies somebody".
     *
     * 🚨 Matched as whole SEGMENTS of a snake_case key, not as substrings.
     * A substring match reads `ip` inside `descr**ip**tion` and drops the
     * parameter silently — no error, no log, just a dimension that is
     * permanently empty and a reason nobody can find. `card` inside `discard`
     * and `otp` inside a longer word fail the same way.
     *
     * Segment matching still catches everything worth catching, because these
     * keys are snake_case by convention: `guest_email`, `customer_name`,
     * `payment_intent_id`, `client_ip` all match; `description` does not.
     */
    private const BANNED = [
        'email', 'name', 'username', 'phone', 'address', 'ip',
        'password', 'secret', 'token', 'otp', 'card', 'iban',
        'user_id', 'customer', 'account_id', 'payment_intent',
    ];

    /**
     * Does this key contain a banned word as a whole segment?
     *
     * `_` is the boundary, so `payment_intent` matches `payment_intent_id`
     * (prefix segment run) while `description` does not match `ip`.
     */
    private static function isIdentifying(string $key): bool
    {
        foreach (self::BANNED as $word) {
            if (preg_match('/(^|_)'.preg_quote($word, '/').'($|_)/', $key) === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, string|int|float|bool>
     */
    public static function scrub(array $params): array
    {
        $clean = [];

        foreach ($params as $key => $value) {
            // Objects and arrays are dropped too: GA4 accepts scalars only, and
            // a nested payload is exactly how a whole model ends up in an
            // analytics call by accident.
            if (! is_string($key) || ! is_scalar($value)) {
                continue;
            }

            if (self::isIdentifying(strtolower($key))) {
                continue;
            }

            $clean[$key] = $value;
        }

        return $clean;
    }
}
