<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * The symbol half of the naming rules — refused at save, as a field error.
 *
 * 🚨 WHY THIS EXISTS AT ALL (11 Sep 2026). Every text check on this platform reads
 * WORDS: `App\Support\ContentWording` (brands, expenses, transfer framing) and
 * `Helpers::checkBlockText` (the blocked-word list). A symbol carries the same
 * meaning and passes both — 🍆💦 says what a banned word says, and a zero-width
 * space inside "r​ent" defeats every word list we have. With profiles and listings
 * now publishing without a human in the path (see "A PROFILE APPROVES ITSELF",
 * 11 Sep 2026), the automated checks are the only thing between a creator and a
 * live payment-facing surface, so the symbol hole is not an academic one.
 *
 * 🚨 REFUSED, NEVER HELD. A hold needs somebody to release it; a character the
 * creator typed is something they can delete in two seconds, and telling them so
 * at the moment they press Save is both cheaper and kinder than a queue. Same
 * decision, same reasoning, as `NoContactDetails`.
 *
 * ⚠️ WIRED WHEREVER `NoExpenseOrBrandName` IS WIRED, AND NOWHERE ELSE. That rule
 * already marks the boundary of "creator text a supporter reads before they pay" —
 * item names, titles, goal labels, `reward_title`, the bio, bio-link labels.
 * `tests/Feature/BlockedSymbolWiringTest` pins the two counts equal per file, so a
 * new field guarded by one and not the other fails the build.
 *
 * ⚠️ DELIBERATELY NOT ON `reward_body`. That is the paid deliverable, read AFTER
 * purchase, and it is the one field where a money emoji in a thank-you note is
 * ordinary rather than a solicitation. It is not unguarded: a link body goes
 * through `RewardService::submittedLinkError` and the whole listing goes through
 * `ItemTextModeration`.
 *
 * ⚠️ IT OVERLAPS `Helpers::checkBlockText`'s emoji list ON PURPOSE, and the overlap
 * is not redundant — it changes the OUTCOME. That list HOLDS the listing for a
 * reviewer; this one refuses the save. A creator who types 🍆 into a title now
 * reads a sentence naming the character instead of watching a listing they thought
 * they had published sit invisible. The sexual group below is that list's sexual
 * subset, kept identical so the two checks cannot disagree about what a banana is.
 */
class NoBlockedSymbols implements ValidationRule
{
    /**
     * GROUP 1 — invisible and direction-controlling characters.
     *
     * None of these draws anything. Their only use in a listing title is to make
     * the stored text differ from the rendered text: a zero-width space splits a
     * banned word so no word list matches it, and a bidi override (U+202A–U+202E,
     * U+2066–U+2069) reverses what a reader sees while the bytes say something
     * else — the classic spoof, and the reason it matters most in a link.
     *
     * 🚨 U+200D (ZWJ) AND U+FE0F ARE DELIBERATELY ABSENT. ZWJ is what builds the
     * rainbow flag 🏳️‍🌈 and every family and profession emoji, and this platform
     * ships pride badges; banning it would refuse the flag itself. U+200C (ZWNJ)
     * is load-bearing in Persian and Hindi, and U+200E/U+200F are ordinary marks in
     * mixed-direction text. Those four are text, not tricks.
     */
    public const INVISIBLE_PATTERN = '/[\x{00AD}\x{200B}\x{2060}\x{FEFF}\x{202A}-\x{202E}\x{2066}-\x{2069}]/u';

    /**
     * GROUP 2 — sexual-innuendo emoji.
     *
     * The set an adult listing uses to say what it is without typing a word any
     * filter would catch. This is `Helpers::checkBlockText`'s sexual subset exactly;
     * its other four (💩 💬 💎 🌽) are left to that list, which holds rather than
     * refuses — 💎 in particular is ordinary on a jewellery listing and is not worth
     * a hard refusal.
     *
     * ⚠️ Base codepoints only, so a form that appends U+FE0F (🌶️) still matches.
     */
    public const SEXUAL_EMOJI = ['🍆', '🍑', '🍌', '🌶', '💦', '👅', '😈'];

    /**
     * GROUP 3 — the money ask.
     *
     * Stripe content-first compliance: a listing sells content, it never asks for
     * money. The word list already refuses "donation", "tip" and "fundraise"; a
     * headline that DRAWS cash says the same thing in a form no word list sees.
     * ⚠️ Money as a SUBJECT is fine — a creator selling a budgeting guide writes the
     * word, and 💳 (a card, i.e. paying for something) is not on this list.
     */
    public const MONEY_EMOJI = ['🤑', '💸', '💰', '💵', '💴', '💶', '💷', '🏧'];

    /**
     * GROUP 4 — hate symbols.
     *
     * The image scan already carries a hate category (`RekognitionModeration::REST_WORDS`)
     * and the AUP prohibits monetising hateful content, so a text field that accepts
     * the symbol version is the same rule with a hole in it.
     *
     * ⚠️ BOTH SWASTIKA ORIENTATIONS ARE REFUSED, AND U+534D HAS A LEGITIMATE
     * BUDDHIST USE. A payment-facing listing headline is not the place to tell the
     * two apart, the cost of being wrong is one deleted character on a form, and the
     * cost of being wrong the other way is a swastika on a Stripe-facing marketplace.
     * Kept to these two: runes, lightning bolts and numerals all have overwhelming
     * ordinary use, and a list that refuses ᛋ is a list creators route around.
     */
    public const HATE_SYMBOLS = ['卐', '卍'];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($reason = self::firstMatch((string) $value)) {
            $fail($reason);
        }
    }

    /**
     * The creator-facing sentence for the first blocked symbol found, or null.
     *
     * Public for the same reason `NoContactDetails::firstMatch()` is: a surface that
     * wants to warn before the form is submitted must reach the same verdict, and
     * two implementations of "is this allowed" is two answers.
     */
    public static function firstMatch(string $text): ?string
    {
        if ($text === '') {
            return null;
        }

        // Group 1 first: an invisible character is what hides the others, so a value
        // carrying both should be reported for the thing the creator cannot see.
        if (preg_match(self::INVISIBLE_PATTERN, $text)) {
            return 'This contains a hidden character (a zero-width space or a text-direction mark) '
                .'that makes the text read differently from what is stored. Retype the line, or paste '
                .'it into a plain-text editor first, and save again.';
        }

        foreach (self::SEXUAL_EMOJI as $emoji) {
            if (mb_strpos($text, $emoji) !== false) {
                return self::refusal($emoji, 'Everything on Spenny Piggy has to read as a purchase of your content.');
            }
        }

        foreach (self::MONEY_EMOJI as $emoji) {
            if (mb_strpos($text, $emoji) !== false) {
                return self::refusal($emoji, 'A listing sells your content — it never asks for money. '
                    .'Describe what the supporter receives instead.');
            }
        }

        foreach (self::HATE_SYMBOLS as $symbol) {
            if (mb_strpos($text, $symbol) !== false) {
                return self::refusal($symbol, 'This symbol is not allowed anywhere on the platform.');
            }
        }

        return null;
    }

    /**
     * The symbol IS quoted back, unlike an image-scan reason.
     *
     * Same split the text check already makes: a Rekognition label is a guess and
     * reads as an accusation when it is wrong, but a character the creator typed is
     * something only they can find and remove — and an emoji is invisible in a wall
     * of text unless you are told which one.
     */
    private static function refusal(string $symbol, string $why): string
    {
        return "The symbol \"{$symbol}\" isn't allowed here. {$why}";
    }
}
