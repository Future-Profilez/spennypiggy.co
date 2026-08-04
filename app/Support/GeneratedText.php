<?php

namespace App\Support;

/**
 * Cleans up text the platform generates on a creator's behalf before it is
 * published under their name.
 *
 * ⚠️ **The reason this exists is the literal `?` that kept appearing at the front
 * of auto-generated thank-you posts** — "? Incredible Generosity!". The source
 * strings carry real emoji, the columns are `utf8mb4` and a round trip is clean
 * today, so the loss happens upstream of the write: a connection negotiated as
 * 3-byte `utf8` replaces a 4-byte emoji with `?` rather than failing, and by the
 * time anyone sees it the original character is gone. Verified in the database:
 * post 42's title begins `0x3f`, a plain question mark, not a broken sequence.
 *
 * A question mark reads as "something went wrong here" — on a public post
 * thanking a supporter by name, that is the worst place for it. This does not
 * try to recover the emoji (it no longer exists); it makes sure its absence is
 * invisible instead of conspicuous.
 */
class GeneratedText
{
    /**
     * A title that is safe to publish.
     *
     * Drops decorative characters that failed to encode, rather than leaving the
     * creator's post opening on a question mark. A title with no emoji reads
     * perfectly well; one that starts with `?` looks broken.
     */
    public static function title(?string $value, string $fallback = 'Thank you'): string
    {
        $clean = self::clean($value);

        // A leading run of orphaned replacement characters — `?`, `�`, or the
        // literal `??` a pair of surrogates degrades to.
        $clean = preg_replace('/^[\s\?\x{FFFD}]+/u', '', $clean) ?? '';
        // And the same trailing, for templates that put the emoji at the end.
        $clean = preg_replace('/[\s\?\x{FFFD}]+$/u', '', $clean) ?? '';

        $clean = trim($clean);

        // Everything was decoration: fall back rather than publish an empty
        // headline, which renders as a bare avatar and a date.
        return $clean !== '' ? $clean : $fallback;
    }

    /**
     * Body text. Interior punctuation is left alone — a `?` mid-sentence is
     * usually a real question, and stripping those would edit the creator's
     * message rather than repair it. Only a dangling one at either end goes.
     */
    public static function body(?string $value): string
    {
        $clean = self::clean($value);

        $clean = preg_replace('/^[\s\x{FFFD}]+/u', '', $clean) ?? '';
        $clean = preg_replace('/[\s\x{FFFD}]+$/u', '', $clean) ?? '';

        return trim($clean);
    }

    /**
     * Guarantee valid UTF-8 before anything else looks at the string.
     *
     * An invalid sequence — a title cut mid-emoji by a byte-based `substr`, for
     * instance — makes every `preg_*` call with the `u` flag return null, so the
     * cleanup silently does nothing and hands back an empty string.
     */
    private static function clean(?string $value): string
    {
        $value = (string) $value;

        if ($value === '' || mb_check_encoding($value, 'UTF-8')) {
            return $value;
        }

        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
    }
}
