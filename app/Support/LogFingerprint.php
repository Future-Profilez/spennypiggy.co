<?php

namespace App\Support;

/**
 * Turns raw log lines into something safe to put on a screen.
 *
 * Two jobs, and both were missing:
 *
 * 1. REDACTION. The diagnostics page rendered log lines verbatim, which meant Stripe secret-key
 *    fragments, payment intent ids, customer ids, buyer email addresses, Sentry public keys and
 *    whole serialized queue payloads were printed into an admin page. A diagnostics report is
 *    pasted into tickets and chat; it must not carry any of that.
 *
 * 2. GROUPING. The old dedup key was `substr($line, 0, 100)` — the first 100 characters, which
 *    start with the timestamp. Three occurrences of the same error one minute apart therefore
 *    counted as three distinct errors, so "11 unique errors" was really a handful repeating. The
 *    signature strips everything variable (timestamps, ids, hashes, quoted strings, numbers)
 *    before hashing, so the same fault collapses to one row with a count and a first/last seen.
 */
class LogFingerprint
{
    /**
     * Patterns are ordered longest-prefix-first where they could overlap (`sk_live_` before a
     * generic token rule) so a more specific label wins.
     *
     * @var array<string,string> regex => replacement
     */
    private const REDACTIONS = [
        // Secrets first — these must never survive, even partially.
        '/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9*]+/' => '[stripe-secret-key]',
        '/\b(?:pk)_(?:live|test)_[A-Za-z0-9*]+/' => '[stripe-publishable-key]',
        '/\bwhsec_[A-Za-z0-9*]+/' => '[stripe-webhook-secret]',
        '/\bBearer\s+[A-Za-z0-9._\-]+/i' => 'Bearer [redacted]',
        '/\b[A-Za-z0-9_-]*(?:secret|password|api[_-]?key|token)["\']?\s*[:=]\s*["\']?[A-Za-z0-9._\-\/+]{8,}/i' => '[credential]',

        // Sentry tracing metadata — no diagnostic value, and it identifies the project.
        '/sentry-public_key=[A-Za-z0-9]+/' => 'sentry-public_key=[redacted]',
        '/sentry-trace_id=[A-Za-z0-9]+/' => 'sentry-trace_id=[id]',
        '/sentry-org_id=\d+/' => 'sentry-org_id=[id]',

        // Personal / payment identifiers.
        '/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/' => '[email]',
        '/\b(?:pi|ch|cus|acct|sub|in|seti|cs|py|po|txn|re|card|ba|price|prod)_[A-Za-z0-9]{8,}/' => '[stripe-id]',
        '/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i' => '[uuid]',

        // Absolute paths leak the server layout and the developer's name.
        '/(?:\/Users\/[^\/\s"]+|\/home\/[^\/\s"]+|\/var\/task)/' => '[path]',
    ];

    /**
     * A serialized queue payload is hundreds of characters of escaped closure internals. It is
     * pure noise on a screen and is where most of the leaked material was hiding.
     */
    private const PAYLOAD_MARKERS = ['{"uuid":"', 'O:34:\\"Illuminate', 'displayName', 'serializable'];

    private const MAX_LINE_LENGTH = 400;

    /** Strip anything that identifies a person, a payment, or a secret. */
    public static function redact(string $line): string
    {
        foreach (self::REDACTIONS as $pattern => $replacement) {
            $line = preg_replace($pattern, $replacement, $line) ?? $line;
        }

        return $line;
    }

    /**
     * Cut a serialized job payload down to a note. Everything after the first marker is dropped —
     * there is nothing in it a reader can act on.
     */
    public static function stripPayload(string $line): string
    {
        foreach (self::PAYLOAD_MARKERS as $marker) {
            $pos = strpos($line, $marker);

            if ($pos !== false) {
                return rtrim(substr($line, 0, $pos)).' […serialized job payload omitted]';
            }
        }

        return $line;
    }

    /**
     * Collapse a line to its shape, so two occurrences of the same fault hash identically.
     * Everything variable goes: timestamps, ids, quoted values, numbers, line numbers.
     */
    public static function signature(string $line): string
    {
        $s = self::redact(self::stripPayload($line));

        $s = preg_replace('/^\[[^\]]+\]\s*/', '', $s) ?? $s;                 // leading timestamp
        $s = preg_replace('/\b\d{4}-\d{2}-\d{2}[ T][\d:.]+/', '', $s) ?? $s;  // inline timestamps
        $s = preg_replace('/"[^"]*"/', '""', $s) ?? $s;                       // quoted values
        $s = preg_replace("/'[^']*'/", "''", $s) ?? $s;
        $s = preg_replace('/:\d+/', ':N', $s) ?? $s;                          // file line numbers
        $s = preg_replace('/\b\d+\b/', 'N', $s) ?? $s;                        // remaining numbers
        $s = preg_replace('/\s+/', ' ', $s) ?? $s;

        return substr(md5(trim($s)), 0, 12);
    }

    /**
     * Group raw log lines by signature.
     *
     * @param  string[]  $lines
     * @return array<int,array{signature:string,message:string,count:int,first_seen:?string,last_seen:?string}>
     *                                                                                                          Ordered most-frequent first — the thing happening 400 times is the thing to fix.
     */
    public static function group(array $lines, int $limit = 15): array
    {
        $groups = [];

        foreach ($lines as $line) {
            $line = trim((string) $line);

            if ($line === '') {
                continue;
            }

            $signature = self::signature($line);
            $timestamp = self::timestamp($line);

            if (! isset($groups[$signature])) {
                $groups[$signature] = [
                    'signature' => $signature,
                    'message' => self::presentable($line),
                    'count' => 0,
                    'first_seen' => $timestamp,
                    'last_seen' => $timestamp,
                ];
            }

            $groups[$signature]['count']++;

            if ($timestamp !== null) {
                $first = $groups[$signature]['first_seen'];
                $last = $groups[$signature]['last_seen'];
                $groups[$signature]['first_seen'] = ($first === null || $timestamp < $first) ? $timestamp : $first;
                $groups[$signature]['last_seen'] = ($last === null || $timestamp > $last) ? $timestamp : $last;
            }
        }

        $groups = array_values($groups);

        usort($groups, static fn ($a, $b) => $b['count'] <=> $a['count']);

        return array_slice($groups, 0, $limit);
    }

    /** The line as a reader should see it: payload dropped, redacted, truncated. */
    public static function presentable(string $line): string
    {
        $line = self::redact(self::stripPayload($line));
        $line = preg_replace('/\s+/', ' ', trim($line)) ?? $line;

        return strlen($line) > self::MAX_LINE_LENGTH
            ? substr($line, 0, self::MAX_LINE_LENGTH).'…'
            : $line;
    }

    public static function timestamp(string $line): ?string
    {
        return preg_match('/^\[(\d{4}-\d{2}-\d{2}[ T][\d:]{8})/', $line, $m) ? $m[1] : null;
    }
}
