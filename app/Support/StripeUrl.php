<?php

namespace App\Support;

/**
 * 🚨 A URL WE HAND STRIPE IS BUILT FROM CREATOR TEXT, AND STRIPE REFUSES A RAW
 * NON-ASCII BYTE OUTRIGHT.
 *
 * `products->create` answers
 *   "Invalid URL: Non-ASCII characters in URLs must be percent-encoded in order
 *    for the URL to be valid."
 * and the WHOLE product create fails — so a creator whose listing is called
 * "Café night" or "мой контент" cannot publish at all, and the listing row is
 * rolled back behind them (App\Support\ListingRollback). Sentry
 * JAVASCRIPT-REACT-CF / -CE, 16 Sep 2026, /shop/add.
 *
 * ⚠️ THIS IS THE ONE DEFINITION and it is applied at the two Stripe CHOKEPOINTS
 * (StripeControl::createProduct and ::updateSubscription), never at a call site.
 * A `url` or an `images` entry is decoration on a product; a call site that
 * forgets to encode one is a creator who cannot sell, and no build step or
 * scanner can see it coming.
 *
 * ⚠️ AN UNUSABLE URL IS DROPPED, NEVER GUESSED AT AND NEVER PASSED THROUGH.
 * Omitting `url` costs a link in the Stripe dashboard; sending a bad one costs
 * the creator the listing. Same rule as the Connect prefill: a convenience may
 * never be the reason a creator cannot trade.
 */
class StripeUrl
{
    /**
     * Characters legal unescaped in a path segment (RFC 3986 pchar), plus `/`
     * because whole paths are passed through at once.
     */
    private const PATH_SAFE = "-._~!$&'()*+,;=:@/";

    /** As above, plus `?` — legal inside a query string and common in encoded urls. */
    private const QUERY_SAFE = "-._~!$&'()*+,;=:@/?";

    /**
     * Percent-encode a URL so Stripe accepts it, or null when it cannot be made
     * into one. Already-encoded sequences (%20) are preserved, never doubled.
     */
    public static function safe(?string $url): ?string
    {
        $url = trim((string) $url);

        if ($url === '') {
            return null;
        }

        $parts = parse_url($url);

        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);

        // Stripe only ever wants a web address here. A `javascript:` or `data:`
        // value reaching a dashboard link is worth refusing on its own account.
        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        $host = self::asciiHost($parts['host']);

        if ($host === null) {
            return null;
        }

        $out = $scheme.'://'.$host;

        if (! empty($parts['port'])) {
            $out .= ':'.$parts['port'];
        }

        // ⚠️ Any userinfo is dropped deliberately — credentials have no business
        // in a product link, and Stripe renders this to whoever opens the account.

        if (isset($parts['path']) && $parts['path'] !== '') {
            $out .= self::encode($parts['path'], self::PATH_SAFE);
        }

        if (isset($parts['query']) && $parts['query'] !== '') {
            $out .= '?'.self::encode($parts['query'], self::QUERY_SAFE);
        }

        if (isset($parts['fragment']) && $parts['fragment'] !== '') {
            $out .= '#'.self::encode($parts['fragment'], self::QUERY_SAFE);
        }

        return $out;
    }

    /**
     * Sanitise every entry of an `images` array, dropping the ones that cannot be
     * made valid. ⚠️ A product with no picture still publishes; a product with one
     * bad image url does not publish at all.
     */
    public static function safeImages(mixed $images): array
    {
        if (! is_array($images)) {
            return [];
        }

        $clean = [];

        foreach ($images as $image) {
            if (! is_string($image)) {
                continue;
            }

            $safe = self::safe($image);

            if ($safe !== null) {
                $clean[] = $safe;
            }
        }

        return $clean;
    }

    /**
     * Apply both rules to a product payload. Absent keys stay absent; a `url`
     * that cannot be salvaged is REMOVED rather than sent through.
     */
    public static function sanitiseProductPayload(array $payload): array
    {
        if (array_key_exists('url', $payload)) {
            $safe = self::safe(is_string($payload['url']) ? $payload['url'] : null);

            if ($safe === null) {
                unset($payload['url']);
            } else {
                $payload['url'] = $safe;
            }
        }

        if (array_key_exists('images', $payload)) {
            $payload['images'] = self::safeImages($payload['images']);
        }

        return $payload;
    }

    /**
     * ⚠️ Encoding walks BYTES, not characters — a UTF-8 character is several
     * bytes and each one becomes its own %XX triple, which is what the standard
     * asks for. A `%` followed by two hex digits is left alone so a url that is
     * already encoded is not encoded a second time.
     */
    private static function encode(string $value, string $safe): string
    {
        $out = '';
        $length = strlen($value);

        for ($i = 0; $i < $length; $i++) {
            $char = $value[$i];

            if ($char === '%' && $i + 2 < $length && ctype_xdigit($value[$i + 1]) && ctype_xdigit($value[$i + 2])) {
                $out .= strtoupper(substr($value, $i, 3));
                $i += 2;

                continue;
            }

            /*
             * ⚠️ THE `ord` GUARD IS LOAD-BEARING. `ctype_alnum` reads the C
             * LOCALE, and under a Latin-1 locale it answers TRUE for bytes like
             * 0xC3 — so half of a UTF-8 pair was passed through raw and the other
             * half escaped, producing the exact invalid url this class exists to
             * prevent. Anything at or above 0x80 is encoded, whatever the locale.
             */
            if (ord($char) < 0x80 && (ctype_alnum($char) || str_contains($safe, $char))) {
                $out .= $char;

                continue;
            }

            $out .= '%'.strtoupper(bin2hex($char));
        }

        return $out;
    }

    /**
     * ⚠️ A HOST IS NOT PERCENT-ENCODED — it is punycoded. `café.example` has to
     * become `xn--caf-dma.example`; percent-escapes in a host are not a valid
     * address and Stripe refuses those too. Without ext-intl there is no way to
     * do that conversion, so the url is dropped rather than mangled.
     */
    private static function asciiHost(string $host): ?string
    {
        if (preg_match('/^[\x20-\x7E]*$/', $host) === 1) {
            return strtolower($host);
        }

        if (! function_exists('idn_to_ascii')) {
            return null;
        }

        $ascii = @idn_to_ascii($host, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);

        return is_string($ascii) && $ascii !== '' ? strtolower($ascii) : null;
    }
}
