<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Stripe compliance — Goal / Deliverable two-field model (20 June 2026 spec, §3).
 *
 * THE one naming rule. Rejects impersonated brands, bill / debt / living-expense
 * wording, AND wording that names the payment rather than the content. Applied to:
 *   - Field B (the content deliverable title) — must read as content, never an expense.
 *   - Field A (the optional goal label) — aspirational goals are fine ("studio upgrade",
 *     "new camera"), but a living expense / bill / debt named on a public surface
 *     ("rent", "phone bill", "car payment", "vet bill") reads as bill-funding, a
 *     prohibited category for the payment partner.
 *
 * The "delete the money reason" test (spec §6): the value must still make sense as
 * content/aspiration once the money reason is removed. "Exclusive summer set" stands
 * alone; "rent" does not — it is just an expense.
 *
 * NOTE: the earlier brand-only `NoBrandOrExpenseName` and `Helpers::validateItemField()`
 * were both folded into this class and DELETED on 14 Aug 2026 — both had zero
 * production callers, so between them they enforced nothing at all. One rule now, so
 * a field cannot be covered by one definition and missed by another.
 *
 * We deliberately do NOT block the bare word "bill" (the feature is called Bills and
 * "Bill" is also a common name); only expense *phrases* and specific living-expense
 * terms are blocked, to avoid false positives. The same reasoning governs the
 * transfer list below.
 */
class NoExpenseOrBrandName implements ValidationRule
{
    /** Brand / third-party service names that must never be sold as "content". */
    // Distinctive brand tokens only. Common English words that happen to be brands
    // (sky, apple, steam, peacock, paramount) are intentionally excluded as bare words
    // to avoid false positives — their multi-word forms (apple tv, sky sports…) catch
    // the real impersonation cases.
    private const BLOCKED_BRANDS = [
        'netflix', 'spotify', 'disney', 'disney+', 'disney plus', 'hulu', 'hbo',
        'amazon', 'prime video', 'apple tv', 'apple music', 'youtube',
        'youtube premium', 'sky tv', 'sky sports', 'now tv', 'bt sport',
        'playstation', 'xbox', 'nintendo', 'adobe', 'microsoft',
        'office 365', 'onlyfans', 'patreon', 'tiktok', 'instagram', 'facebook',
        'twitch', 'paypal', 'cash app', 'venmo', 'deliveroo', 'just eat',
        'gift card',
    ];

    /**
     * Wording that names the PAYMENT rather than what the buyer receives.
     *
     * 🚨 This category was enforced NOWHERE until 14 Aug 2026, and a live wish was
     * found carrying a "buy me a …" reward title — a phrase the content-first brief
     * names in its ban list by name. `Helpers::validateItemField()` was written to
     * block it and had **zero production callers**; only a unit test called it, and
     * that test passed, which is exactly why nobody saw it. Its terms are folded in
     * here and it is gone.
     *
     * ⚠️ PHRASES, not bare words, wherever a bare word is also legitimate content or
     * a product name — the same reasoning that keeps `bill` out of the expense list:
     *
     *   `tip`   — "one styling tip" is a real listing. `tip me` / `tip jar` are not.
     *   `wish`  — a product name here. Blocking it would refuse the Wish feature's
     *             own listings.
     *   `gift`  — "gift guide: my picks" is content. `a gift for you`, `as a gift`
     *             and `gift card` (in BLOCKED_BRANDS) are the transfer framing.
     *   `fund`  — "fund my" is a transfer; "funding" appears in ordinary prose.
     *
     * A refusal here is recoverable in seconds by rewording. Letting the framing
     * through reaches the card, checkout, the receipt and the payment partner's own
     * record of the sale, where it is not recoverable at all.
     */
    private const BLOCKED_TRANSFER_TERMS = [
        // The payment as a favour or a treat.
        'buy me a', 'buy me an', 'buy me some', 'buy me my', 'buymeacoffee',
        'spoil me', 'treat me', 'tip me', 'tip jar', 'send me a tip',
        'chip in', 'pitch in', 'pay it forward',
        // The payment as a transfer rather than a purchase.
        'donation', 'donations', 'donate', 'donating',
        'a gift for', 'as a gift', 'gift me', 'gifting',
        'contribute to my', 'contribution to my',
        // Fundraising framing.
        'fund my', 'fund me', 'fundraise', 'fundraiser', 'fundraising',
        'crowdfund', 'crowdfunding', 'gofundme', 'go fund me',
        'ko-fi', 'kofi', 'fund your lifestyle',
    ];

    /**
     * Bill / debt / recurring-living-expense wording. Multi-word phrases plus a few
     * targeted single words (word-boundary matched) that only read as an expense.
     */
    private const BLOCKED_EXPENSE_TERMS = [
        'phone bill', 'electric bill', 'electricity bill', 'gas bill', 'water bill',
        'utility bill', 'utilities bill', 'energy bill', 'medical bill', 'vet bill',
        'vet fees', 'council tax', 'car payment', 'car finance', 'car insurance',
        'credit card', 'student loan', 'pay my bill', 'pay my rent', 'rent payment',
        'pay my debt', 'debt payment', 'debt repayment',
        'mortgage', 'rent', 'overdraft',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $haystack = strtolower((string) $value);

        foreach (self::BLOCKED_BRANDS as $brand) {
            if (preg_match('/\b'.preg_quote($brand, '/').'\b/i', $haystack)) {
                $fail('Listings must describe your own content, not a brand or third-party service. Please remove "'.$brand.'".');

                return;
            }
        }

        foreach (self::BLOCKED_EXPENSE_TERMS as $term) {
            if (preg_match('/\b'.preg_quote($term, '/').'\b/i', $haystack)) {
                $fail('This reads as a bill or personal expense, which can\'t be sold or named here. Describe the content the supporter receives (a goal like "studio upgrade" is fine).');

                return;
            }
        }

        foreach (self::BLOCKED_TRANSFER_TERMS as $term) {
            if (preg_match('/\b'.preg_quote($term, '/').'\b/i', $haystack)) {
                // Names what to write instead, because the creator can act on that;
                // quoting their own phrase back adds nothing they do not know.
                $fail('This describes the payment rather than what the supporter receives. Name the content instead — "the full behind-the-scenes set", "a personalised video message".');

                return;
            }
        }
    }
}
