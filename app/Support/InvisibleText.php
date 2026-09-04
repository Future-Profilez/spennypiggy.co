<?php

namespace App\Support;

use Normalizer;

/**
 * "Is this actually a different value?" — for text a person typed into a profile
 * field and can be asked to justify changing.
 *
 * 🚨 THIS EXISTS BECAUSE AN INVISIBLE DIFFERENCE OPENED A REVIEW REQUEST FOR AN
 * EDIT NOBODY MADE. Live example, `profile_change_requests` #2 (3 Sep 2026),
 * approved by an admin who could see no difference because there was none to see:
 *
 *   previous: "SoftBareLuxury\nPretty soles • soft vibes • paid energy"
 *   proposed: "SoftBareLuxury\r\nPretty soles • soft vibes • paid energy"
 *
 * The creator opened the profile editor, generated a banner and saved. The
 * textarea posted CRLF where the column held LF, a raw `!==` called that an edit,
 * and their published bio was pulled into review with a proposal to replace it
 * with itself.
 *
 * It starts from `CreatorReviewService::normaliseText` in the admin app (collapse
 * whitespace, then trim), which is what decides the MATCH/CHANGED verdict a
 * reviewer reads, and is deliberately STRICTER for three differences nobody on
 * either side can see:
 *
 * 1. ZERO-WIDTH CHARACTERS ARE NOT WHITESPACE. `\s` does not match U+200B-U+200D,
 *    U+FEFF or the soft hyphen even under `/u`, so one pasted in from a web page
 *    or a word processor survives every trim and collapse on both sides and
 *    compares unequal for ever. They are removed outright — none is content.
 * 2. THE ORDER IS COLLAPSE-THEN-TRIM, NOT TRIM-THEN-COLLAPSE. `trim()` strips only
 *    ASCII whitespace, so a leading or trailing NBSP survived it and was then
 *    collapsed INTO a plain space — leaving exactly the padding the trim existed
 *    to remove.
 * 3. AN ACCENTED LETTER HAS TWO LEGAL ENCODINGS. Composed (NFC) and decomposed
 *    (NFD) render identically and are different bytes; a phone keyboard and a
 *    paste from a Mac can disagree about which they produce. Folded to NFC when
 *    `intl` is available, skipped when it is not.
 *
 * ⚠️ BEING STRICTER HERE IS THE SAFE DIRECTION. The worst case is an edit whose
 * only change is invisible not reaching a reviewer — which is the same verdict
 * that reviewer's own screen would have printed. **Never make it looser than the
 * admin's `normaliseText`**, or the queue fills with edits nobody made.
 *
 * ⚠️ IT IS ONLY EVER USED FOR THE COMPARISON. The value written to the column is
 * the creator's own text, byte for byte — case and deliberate line breaks are
 * edits somebody made on purpose.
 */
class InvisibleText
{
    /** Do these two values differ in a way a person could see? */
    public static function same(?string $a, ?string $b): bool
    {
        return self::normalise($a) === self::normalise($b);
    }

    /**
     * Every key in `$fields`, compared the same way. A key missing from either
     * side reads as null, which is what an unset handle column already is.
     */
    public static function sameMap(array $a, array $b, array $fields): bool
    {
        foreach ($fields as $field) {
            $left = $a[$field] ?? null;
            $right = $b[$field] ?? null;

            if (! self::same(is_scalar($left) ? (string) $left : null, is_scalar($right) ? (string) $right : null)) {
                return false;
            }
        }

        return true;
    }

    public static function normalise(?string $value): string
    {
        $value = (string) $value;

        // Invisible by definition: nothing here is a character the creator typed on
        // purpose, and each is a difference nobody on either side can see.
        $value = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}\x{00AD}]/u', '', $value) ?? $value;

        if (class_exists(Normalizer::class)) {
            // Returns false on malformed UTF-8 — keep the original rather than blanking
            // a comparison value and calling every save an edit.
            $value = Normalizer::normalize($value, Normalizer::FORM_C) ?: $value;
        }

        return trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    }
}
