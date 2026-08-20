<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * The ONE place a PAID deliverable's CDN URL is signed.
 *
 * 🚨 THE PROBLEM THIS EXISTS FOR. Everything a supporter pays for resolves to a
 * bare `https://ucarecdn.com/{uuid}/…` — no expiry, no revocation. The access
 * control around it is real, but it only ever HIDES the URL (see
 * `UserProfileService::stripLockedMedia()`, `Shop::withDeliverable()`,
 * `Membership::$hidden`). Once a buyer has seen the URL they keep a shareable,
 * permanent link — after a refund, after a cancelled membership, after a
 * chargeback, and after the creator deletes the listing.
 *
 * Signing turns that permanent grant into a short-lived one. Uploadcare's
 * "secure delivery" (Akamai-style token auth) validates a `?token=` query on
 * the edge and answers 403 without it.
 *
 * 🚨 THIS DEPENDS ON AN UPLOADCARE ACCOUNT SETTING WE CANNOT SET FROM CODE.
 * Secure delivery must be switched on for the project, and it hands you a
 * dedicated CDN secret key. Until both are true, a signed URL 403s and every
 * paid download breaks — so this ships behind `media.secure.enabled`, DEFAULT
 * OFF, and every method here FAILS OPEN: on any doubt at all the caller's own
 * unsigned URL is returned byte-for-byte unchanged. See `media:secure-check`
 * for the pre-flight verification, and config/media.php for the runbook.
 *
 * ⚠️ THE SIGNING KEY MAY NOT BE THE API SECRET. Uploadcare issues a dedicated
 * CDN secret in the project's Delivery settings when secure delivery is turned
 * on, and it is that value the edge verifies against. `UPLOADCARE_SECRET_KEY`
 * on this project happens to be a valid 20-character hex string, so it is kept
 * as a fallback — but a project whose two keys differ would sign with the wrong
 * one and 403 every paid download, silently. Set `UPLOADCARE_SECURE_KEY`
 * explicitly and confirm with `media:secure-check` before enabling anything.
 *
 * ⚠️ SIGNING MUST NEVER TOUCH PUBLIC MARKETING MEDIA — avatars, covers, item
 * thumbnails, public post images, OG images. A token would break CDN caching,
 * break link previews, and put an expiry on things that are meant to be public
 * and permanent. Signing the wrong things is a worse outcome than signing none.
 * Nothing here decides that; the CALL SITE does, and only paid accessors call.
 *
 * ⚠️ Image operations are preserved exactly. A paid reward file is never
 * width-capped (see MediaUrl) and this must not change that: the token is a
 * query string appended AFTER the whole operation path, so the bytes the buyer
 * paid for are the bytes they get.
 */
final class SecureMedia
{
    public const CDN_HOST = 'ucarecdn.com';

    /**
     * A rendered page's links: long enough to start (and retry, and range-
     * request) a large video download, short enough that a leaked URL is not a
     * grant. See config/media.php for why 300s was rejected.
     */
    public const DEFAULT_TTL = 3600;

    /**
     * A link that leaves the site inside a receipt or delivery e-mail. The
     * supporter may not open their mail for days, so a page-lifetime token
     * would land them on a 403 for content they legitimately bought.
     *
     * ⚠️ This is an INTERIM. The right shape is a signed redirect route that
     * re-checks entitlement and mints a fresh token per click — reported, not
     * built, because this pass may not touch routes/.
     */
    public const DEFAULT_DELIVERY_TTL = 2592000; // 30 days

    /** A bare Uploadcare file uuid — deliberately rejects group ids (`uuid~3`). */
    private const UUID = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    /** Warn once per process, not once per image on a grid of forty. */
    private static bool $warned = false;

    public static function enabled(): bool
    {
        return (bool) config('media.secure.enabled', false);
    }

    public static function ttl(): int
    {
        return self::clampTtl((int) config('media.secure.ttl', self::DEFAULT_TTL));
    }

    public static function deliveryTtl(): int
    {
        return self::clampTtl((int) config('media.secure.delivery_ttl', self::DEFAULT_DELIVERY_TTL));
    }

    /**
     * Sign a paid deliverable's URL.
     *
     * @param  string|false|null  $url  Whatever the calling accessor produced.
     *                                  `false` and `null` are meaningful return
     *                                  values ("this item has no file") and must
     *                                  survive untouched.
     * @return string|false|null The input, unchanged, unless every check passes.
     */
    public static function sign($url, ?int $ttl = null)
    {
        if (! self::enabled()) {
            return $url;
        }

        if (! is_string($url) || $url === '') {
            return $url;
        }

        $uuid = self::uuidFrom($url);

        if ($uuid === null) {
            return $url;
        }

        // Already carries a token (a URL stored pre-signed, or double-signed by
        // two accessors in a chain). A second token would land after the first
        // in the query string and the edge reads the first.
        if (str_contains($url, 'token=')) {
            return $url;
        }

        $key = self::signingKey();

        if ($key === null) {
            return $url;
        }

        $expires = time() + self::clampTtl($ttl ?? self::ttl());

        // The ACL covers the file AND every transformation of it: our paid URLs
        // carry operation paths (`-/format/jpeg/`, a crop chain), and an ACL of
        // the bare `/{uuid}/` would authorise only the untransformed original.
        $acl = '/'.strtolower($uuid).'/*';

        $token = 'exp='.$expires.'~acl='.$acl;
        $hmac = hash_hmac('sha256', $token, $key);

        return $url.(str_contains($url, '?') ? '&' : '?').'token='.$token.'~hmac='.$hmac;
    }

    /**
     * Sign a link that will sit in a supporter's inbox rather than on a page
     * they have open. Same signature, longer window.
     *
     * @param  string|false|null  $url
     * @return string|false|null
     */
    public static function signForDelivery($url)
    {
        return self::sign($url, self::deliveryTtl());
    }

    /**
     * The hex CDN secret, or null when it is missing or malformed.
     *
     * Falls back to the API secret only because a project MAY have the two set
     * to the same value. ⚠️ That fallback is a convenience, not a guarantee:
     * if the project's CDN secret differs, the fallback signs with the wrong key
     * and the edge answers 403 — which looks identical to "secure delivery is
     * misconfigured". `media:secure-check` is what tells the two apart.
     * A missing or malformed key degrades to "unsigned", never to a broken URL.
     */
    private static function signingKey(): ?string
    {
        $raw = (string) (config('services.uploadcare.secure_key')
            ?: config('services.uploadcare.secret'));

        if ($raw === '') {
            self::warnOnce('Uploadcare secure delivery is enabled but no signing key is configured.');

            return null;
        }

        if (preg_match('/^[a-f0-9]+$/i', $raw) !== 1 || strlen($raw) % 2 !== 0) {
            self::warnOnce('Uploadcare secure delivery is enabled but the signing key is not an even-length hex string. Set UPLOADCARE_SECURE_KEY to the CDN secret from the project Delivery settings.');

            return null;
        }

        $binary = @hex2bin($raw);

        return $binary === false ? null : $binary;
    }

    /**
     * The file uuid this URL points at, or null when the URL is not a plain
     * Uploadcare file we can reason about (a group id, a proxied remote URL, a
     * different host, an already-transformed reference).
     */
    public static function uuidFrom(string $url): ?string
    {
        $parts = parse_url($url);

        if (($parts['scheme'] ?? '') !== 'https') {
            return null;
        }

        if (strtolower($parts['host'] ?? '') !== self::CDN_HOST) {
            return null;
        }

        $ref = strtok(ltrim($parts['path'] ?? '', '/'), '/');

        if ($ref === false || $ref === '') {
            return null;
        }

        return preg_match(self::UUID, $ref) === 1 ? $ref : null;
    }

    /**
     * 60s floor (a token that has already expired by the time the page renders
     * is worse than none) and a 30-day ceiling (past that it is a permanent
     * link with extra steps, which is the thing this replaces).
     */
    private static function clampTtl(int $ttl): int
    {
        return max(60, min(2592000, $ttl));
    }

    private static function warnOnce(string $message): void
    {
        if (self::$warned) {
            return;
        }

        self::$warned = true;

        Log::warning('[SecureMedia] '.$message.' Paid content is being served on unsigned, permanent URLs.');
    }

    /** Test seam — the once-per-process warning latch. */
    public static function resetWarningLatch(): void
    {
        self::$warned = false;
    }
}
