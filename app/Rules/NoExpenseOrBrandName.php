<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Stripe compliance — Goal / Deliverable two-field model (20 June 2026 spec, §3).
 *
 * Stricter than NoBrandOrExpenseName: rejects BOTH impersonated brands AND
 * bill / debt / recurring-living-expense wording. Applied to:
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
 * NOTE: this supersedes the earlier brand-only NoBrandOrExpenseName decision for these
 * fields. We deliberately do NOT block the bare word "bill" (the feature is called
 * Bills and "Bill" is also a common name); only expense *phrases* and specific
 * living-expense terms are blocked, to avoid false positives.
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
            if (preg_match('/\b' . preg_quote($brand, '/') . '\b/i', $haystack)) {
                $fail('Listings must describe your own content, not a brand or third-party service. Please remove "' . $brand . '".');
                return;
            }
        }

        foreach (self::BLOCKED_EXPENSE_TERMS as $term) {
            if (preg_match('/\b' . preg_quote($term, '/') . '\b/i', $haystack)) {
                $fail('This reads as a bill or personal expense, which can\'t be sold or named here. Describe the content the supporter receives (a goal like "studio upgrade" is fine).');
                return;
            }
        }
    }
}
