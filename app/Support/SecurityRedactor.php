<?php

namespace App\Support;

/**
 * What may appear in a security alert, and in what form.
 *
 * 🚨 A security alert is the most widely forwarded mail this platform sends. It
 * lands in a shared inbox, gets pasted into a ticket, and is quoted in chat. So
 * it is held to a stricter standard than a log line: it must carry enough to act
 * on and nothing that would itself be worth stealing.
 *
 * NEVER in an alert body: a password, an OTP code, a session or API token, a
 * Stripe secret/publishable/webhook key, a card number, a bank account or sort
 * code, an identity-document URL, or the signed URL of a paid deliverable.
 * Several of those are handled by simply never reading them here; the rest are
 * caught by `scrub()`.
 *
 * ALWAYS masked rather than dropped: identifiers a reader needs in order to
 * recognise the thing being described — an email address, a Stripe account id.
 * A dropped identifier makes the alert unactionable, which is its own failure.
 *
 * ⚠️ `scrub()` delegates to `App\Support\LogFingerprint` where that class exists
 * (it does in spennypiggy.co, where the root CLAUDE.md calls its redaction
 * "load-bearing security, not tidiness"). The inline fallback below is for the
 * admin app, which has no copy of it. Keep the two in step.
 */
class SecurityRedactor
{
    /** Free-text that arrives from outside is capped before it is mailed. */
    private const MAX_TEXT = 300;

    /**
     * Fallback redaction for an app with no LogFingerprint. Ordered
     * longest-prefix-first so a specific label beats a generic one.
     *
     * @var array<string,string>
     */
    private const FALLBACK = [
        '/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9*]+/' => '[stripe-secret-key]',
        '/\b(?:pk)_(?:live|test)_[A-Za-z0-9*]+/' => '[stripe-publishable-key]',
        '/\bwhsec_[A-Za-z0-9*]+/' => '[stripe-webhook-secret]',
        '/\bBearer\s+[A-Za-z0-9._\-]+/i' => 'Bearer [redacted]',
        '/\b[A-Za-z0-9_-]*(?:secret|password|api[_-]?key|token)["\']?\s*[:=]\s*["\']?[A-Za-z0-9._\-\/+]{8,}/i' => '[credential]',
        '/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/' => '[email]',
        '/\b(?:pi|ch|cus|acct|sub|seti|cs|py|po|txn|re|card|ba|price|prod)_[A-Za-z0-9]{8,}/' => '[stripe-id]',
        '/(?:\/Users\/[^\/\s"]+|\/home\/[^\/\s"]+|\/var\/task)/' => '[path]',
    ];

    /**
     * Strip secrets and personal identifiers out of a free-text string, then cap
     * it. Use for anything that came from a request, an exception message, or a
     * user agent — never build an alert row out of raw input.
     */
    public static function scrub(?string $text): string
    {
        $text = trim((string) $text);

        if ($text === '') {
            return '';
        }

        if (class_exists(LogFingerprint::class)) {
            $text = LogFingerprint::redact($text);
        } else {
            foreach (self::FALLBACK as $pattern => $replacement) {
                $text = preg_replace($pattern, $replacement, $text) ?? $text;
            }
        }

        // Collapse whitespace so a pasted multi-line payload cannot smuggle
        // structure (or a fake header) into the mail body.
        $text = preg_replace('/\s+/', ' ', $text) ?? $text;

        return mb_substr($text, 0, self::MAX_TEXT);
    }

    /**
     * `jane.doe@example.com` -> `ja***@example.com`.
     *
     * Enough for the reader to recognise an address they already know, not
     * enough to harvest one they do not. The domain is kept whole: "which domain
     * is being sprayed" is often the whole answer, and a domain is not personal.
     */
    public static function maskEmail(?string $email): string
    {
        $email = trim((string) $email);

        if ($email === '' || ! str_contains($email, '@')) {
            return $email === '' ? '(none)' : '(malformed)';
        }

        [$local, $domain] = explode('@', $email, 2);

        $keep = mb_strlen($local) <= 2 ? 1 : 2;

        return mb_substr($local, 0, $keep).'***@'.$domain;
    }

    /**
     * `acct_1A2B3C4D5E6F` -> `acct_…5E6F`.
     *
     * 🚨 A full Stripe id is banned from an alert body by the root CLAUDE.md.
     * The prefix says WHICH KIND of object it is (a `cus_` sitting in
     * `users.account_id` is itself the bug `ensureManualPayoutSchedule` was
     * hardened against) and the last four let an admin match it against the
     * Stripe dashboard they are already looking at. That is the whole job.
     */
    public static function maskId(?string $id): string
    {
        $id = trim((string) $id);

        if ($id === '') {
            return '(none)';
        }

        $prefix = '';

        if (preg_match('/^([a-z]{2,6})_(.+)$/', $id, $m)) {
            $prefix = $m[1].'_';
            $id = $m[2];
        }

        return mb_strlen($id) <= 4
            ? $prefix.'…'.$id
            : $prefix.'…'.mb_substr($id, -4);
    }

    /**
     * An IP address is the point of the whole exercise, so it is NOT masked —
     * but it is validated, because an unvalidated `X-Forwarded-For` is
     * attacker-controlled text arriving in a mail body.
     */
    public static function ip(?string $ip): string
    {
        $ip = trim((string) $ip);

        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '(unknown)';
    }
}
