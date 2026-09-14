<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A bio may not carry an email address, a phone number or an outbound link.
 *
 * 🚨 REFUSED AT SAVE, NOT FLAGGED FOR A REVIEWER (10 Sep 2026, client direction). Until
 * now these three were ATTENTION findings in `ProfileSelfCheck` — advice on the creator's
 * own screen, and a hint to the admin console. With the profile auto-approving, an
 * advisory is a hole: a bio that says "pay me on PayPal, DM me at …" would go live the
 * instant it was typed and nobody would read the hint until the daily report.
 *
 * ⚠️ WHY THESE THREE AND NOT MORE. Each is a route off the platform — money outside
 * Stripe, a conversation outside the record, a page we cannot moderate. The banned
 * WORDING lives in `NoExpenseOrBrandName`, deliberately separate: that rule is about
 * what is being sold, this one is about where the supporter is being sent.
 *
 * ⚠️ THE PATTERNS ARE `ProfileSelfCheck`'S, MOVED HERE AND MADE PUBLIC. That class now
 * reads them from this one, so the form and the self-check screen cannot disagree about
 * what counts as a phone number. Two regexes for one rule is two answers.
 *
 * ⚠️ A bare "@handle" is NOT an email — the pattern needs a dot-suffixed domain. Creators
 * write "follow @me on Instagram" constantly and that is exactly what the socials field
 * is for; refusing it here would send them to remove the one line that is fine.
 */
class NoContactDetails implements ValidationRule
{
    /** Needs a domain with a TLD, so "@handle" does not match. */
    public const EMAIL_PATTERN = '/[\w.+-]+@[\w-]+\.[\w.]{2,}/i';

    /** International-shaped: a leading + and at least nine digits with separators. */
    public const PHONE_PATTERN = '/(?:\+\d[\d\s().-]{7,}\d)/';

    /** A scheme or a www — a bare "spennypiggy.co" in prose is left alone. */
    public const URL_PATTERN = '#(?:https?://|www\.)\S+#i';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $text = trim((string) $value);

        if ($text === '') {
            return;
        }

        if ($reason = self::firstMatch($text)) {
            $fail($reason);
        }
    }

    /**
     * The creator-facing sentence for the first contact detail found, or null.
     *
     * Public so `ProfileAutoApproval` and `ProfileSelfCheck` can ask the same question
     * without instantiating a validator — and so the sentence a creator reads on the
     * form is the same one they read on their steps page.
     */
    public static function firstMatch(string $text): ?string
    {
        if (preg_match(self::EMAIL_PATTERN, $text)) {
            return 'Your bio contains an email address. Supporters reach you through Spenny Piggy, '
                .'so everything you sell stays covered by the platform — please take it out.';
        }

        if (preg_match(self::PHONE_PATTERN, $text)) {
            return 'Your bio looks like it contains a phone number. Supporters reach you through '
                .'Spenny Piggy, so everything you sell stays covered by the platform — please take it out.';
        }

        if (preg_match(self::URL_PATTERN, $text)) {
            return 'Your bio links out to another site. Add your profiles under social links '
                .'instead, where we can check them.';
        }

        return null;
    }
}
