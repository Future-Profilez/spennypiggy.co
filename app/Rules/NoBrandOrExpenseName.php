<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Stripe compliance: the listing TITLE/headline may name the creator's goal or expense
 * ("Phone Bill", "Rent", "new shoes") — per the Dev Check Sheet, the title field is NOT
 * blocked. What it must NOT do is impersonate a brand / third-party service, since selling
 * a brand's name as "your content" is misleading and a trademark risk.
 *
 * Expense/wish wording is allowed here; it is blocked only in the payment-facing item text
 * (checkout line, receipt, descriptor) via Helpers::validateItemField().
 *
 * Shared by Bills (recurring content) and Wishlist (one-off content).
 */
class NoBrandOrExpenseName implements ValidationRule
{
    /**
     * Brand / third-party service names that must never be sold as "content".
     */
    private const BLOCKED_BRANDS = [
        'netflix', 'spotify', 'disney', 'disney+', 'disney plus', 'hulu', 'hbo',
        'amazon', 'prime video', 'apple', 'apple tv', 'apple music', 'youtube',
        'youtube premium', 'paramount', 'peacock', 'sky', 'now tv', 'bt sport',
        'playstation', 'xbox', 'nintendo', 'steam', 'adobe', 'microsoft',
        'office 365', 'onlyfans', 'patreon', 'tiktok', 'instagram', 'facebook',
        'twitch', 'paypal', 'cash app', 'venmo', 'uber', 'deliveroo', 'just eat',
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
    }
}
