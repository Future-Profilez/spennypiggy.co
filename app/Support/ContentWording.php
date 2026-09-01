<?php

namespace App\Support;

/**
 * The content-first naming lists, and the one place they are defined.
 *
 * These were constants inside `App\Rules\NoExpenseOrBrandName`, which is a
 * validation rule and can therefore only ever answer one question: pass or fail,
 * at submit time. Two other callers need the SAME lists to answer a different
 * question — "what is wrong with this text, so I can tell someone how to fix it
 * before they submit it":
 *
 *   · `App\Support\ProfileSelfCheck` — the creator's own review screen.
 *   · the admin app's `CreatorReviewAdvisor` — the reviewer's suggestion.
 *
 * 🚨 THE LISTS DID NOT CHANGE when they moved here, and must not be "tidied".
 * Every omission below is deliberate and reasoned in the comments — `bill`,
 * `gift`, `tip`, `wish` and `fund` are all legitimate content words as bare
 * terms, and adding them refuses real listings. `NoExpenseOrBrandName` now
 * delegates here, so its 20+ live call sites keep exactly the behaviour they had.
 *
 * ⚠️ MIRRORED IN `admin.spennypiggy.co/app/Support/ContentWording.php`. The apps
 * share a database but not code, and the admin app has to reach the same verdict
 * about a bio as the website does — a phrase the website accepts and the admin
 * console then flags is the exact round trip this class was extracted to close.
 * Change one, change both.
 *
 * ⚠️ NOT the same list as `CampaignCopyRules` in the admin app, deliberately.
 * That one governs bulk campaign email — a surface which goes to every account
 * and lands in inboxes we do not control — and it bans bare `gift`, `tip` and
 * `donation`, which are legitimate here ("gift guide: my picks" is real content).
 * Keeping them separate is the decision; merging them would refuse listings.
 */
final class ContentWording
{
    /** A third-party service is being named as though we sold it. */
    public const BRAND = 'brand';

    /** The text names a bill, a debt or a living expense. */
    public const EXPENSE = 'expense';

    /** The text names the PAYMENT rather than what the supporter receives. */
    public const TRANSFER = 'transfer';

    /**
     * Brand / third-party service names that must never be sold as "content".
     *
     * Distinctive brand tokens only. Common English words that happen to be brands
     * (sky, apple, steam, peacock, paramount) are intentionally excluded as bare words
     * to avoid false positives — their multi-word forms (apple tv, sky sports…) catch
     * the real impersonation cases.
     */
    public const BLOCKED_BRANDS = [
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
     *
     * ⚠️ We deliberately do NOT block the bare word "bill" — the feature is called
     * Bills and "Bill" is also a common name.
     */
    public const BLOCKED_EXPENSE_TERMS = [
        'phone bill', 'electric bill', 'electricity bill', 'gas bill', 'water bill',
        'utility bill', 'utilities bill', 'energy bill', 'medical bill', 'vet bill',
        'vet fees', 'council tax', 'car payment', 'car finance', 'car insurance',
        'credit card', 'student loan', 'pay my bill', 'pay my rent', 'rent payment',
        'pay my debt', 'debt payment', 'debt repayment',
        'mortgage', 'rent', 'overdraft',
    ];

    /**
     * Wording that names the PAYMENT rather than what the buyer receives.
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
     */
    public const BLOCKED_TRANSFER_TERMS = [
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
     * The first thing wrong with this text, or null when nothing is.
     *
     * 🚨 ORDER IS PART OF THE CONTRACT: brands, then expenses, then transfer
     * framing — the order `NoExpenseOrBrandName` has always checked in. "gift card"
     * is a brand token AND contains transfer wording, and the brand message is the
     * one that tells the creator what to do about it.
     *
     * @param  array<int, string>  $allowedBrands  tokens the field's own platform needs;
     *                                             see NoExpenseOrBrandName's constructor.
     * @return array{term: string, category: string, message: string}|null
     */
    public static function firstMatch(string $value, array $allowedBrands = []): ?array
    {
        $haystack = strtolower($value);

        $allowed = array_map(
            static fn ($brand) => strtolower(trim((string) $brand)),
            $allowedBrands
        );

        foreach (self::BLOCKED_BRANDS as $term) {
            if (in_array($term, $allowed, true)) {
                continue;
            }

            if (self::hits($haystack, $term)) {
                return self::match($term, self::BRAND);
            }
        }

        foreach (self::BLOCKED_EXPENSE_TERMS as $term) {
            if (self::hits($haystack, $term)) {
                return self::match($term, self::EXPENSE);
            }
        }

        foreach (self::BLOCKED_TRANSFER_TERMS as $term) {
            if (self::hits($haystack, $term)) {
                return self::match($term, self::TRANSFER);
            }
        }

        return null;
    }

    /**
     * ⚠️ Word-boundary matched, so "billing" does not match "bill" and "gifted"
     * does not match "gift me". `preg_quote` because the list contains `disney+`
     * and `ko-fi`.
     */
    private static function hits(string $haystack, string $term): bool
    {
        return (bool) preg_match('/\b'.preg_quote($term, '/').'\b/i', $haystack);
    }

    /** @return array{term: string, category: string, message: string} */
    private static function match(string $term, string $category): array
    {
        return [
            'term' => $term,
            'category' => $category,
            'message' => self::messageFor($term, $category),
        ];
    }

    /**
     * The refusal a creator reads on a listing form.
     *
     * ⚠️ The transfer message deliberately does NOT quote the creator's own phrase
     * back at them — it names what to write instead, which is the part they can act
     * on. `ProfileSelfCheck` overrides these for the bio, where the surface and the
     * fix are different.
     */
    public static function messageFor(string $term, string $category): string
    {
        return match ($category) {
            self::BRAND => 'Listings must describe your own content, not a brand or third-party service. Please remove "'.$term.'".',
            self::EXPENSE => 'This reads as a bill or personal expense, which can\'t be sold or named here. Describe the content the supporter receives (a goal like "studio upgrade" is fine).',
            default => 'This describes the payment rather than what the supporter receives. Name the content instead — "the full behind-the-scenes set", "a personalised video message".',
        };
    }
}
