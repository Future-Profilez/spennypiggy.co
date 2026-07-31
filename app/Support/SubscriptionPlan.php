<?php

namespace App\Support;

/**
 * The one reader of config/creator_subscription.php.
 *
 * Price, VAT and the promise wording were previously hard-coded at each place
 * they appeared — the checkout in StripeController, four creator screens and
 * seven marketing pages — so a price change meant editing twelve files and a
 * miss left the platform advertising a figure it did not charge.
 *
 * Nothing should read config('creator_subscription.*') directly; go through
 * here so the VAT arithmetic and the copy placeholders have one definition.
 */
class SubscriptionPlan
{
    public static function price(): float
    {
        return round((float) config('creator_subscription.price', 8.99), 2);
    }

    public static function vatRate(): float
    {
        return (float) config('creator_subscription.vat_rate', 20);
    }

    /**
     * VAT on top of the listed price. Matches the arithmetic the Stripe
     * checkout has always used — round half up at two decimals.
     */
    public static function vat(): float
    {
        return round(self::price() * self::vatRate() / 100, 2);
    }

    public static function total(): float
    {
        return round(self::price() + self::vat(), 2);
    }

    public static function currency(): string
    {
        return strtoupper((string) config('creator_subscription.currency', 'GBP'));
    }

    /**
     * Whether a creator is left un-charged until their first completed sale.
     *
     * A switch rather than a constant on purpose: the client's plan is to run
     * this during the platform's early phase and revisit charging from day one
     * once there is a track record.
     */
    public static function freeUntilFirstSale(): bool
    {
        return (bool) config('creator_subscription.free_until_first_sale', true);
    }

    /**
     * How far out the parked trial is set while waiting for a first sale.
     *
     * Clamped to at least a day: a zero or negative value would put trial_end
     * in the past, and Stripe would charge the creator immediately — the exact
     * outcome this feature exists to prevent.
     */
    public static function freePeriodDays(): int
    {
        return max(1, (int) config('creator_subscription.free_period_days', 1095));
    }

    public static function legacyTrialDays(): int
    {
        return max(0, (int) config('creator_subscription.legacy_trial_days', 3));
    }

    /**
     * Money as it is shown to a creator. Zero-decimal currencies are not in
     * play here — the platform subscription is billed in GBP.
     */
    public static function formatted(?float $amount = null): string
    {
        $symbol = self::currency() === 'GBP' ? '£' : self::currency().' ';

        return $symbol.number_format($amount ?? self::price(), 2);
    }

    /**
     * A copy string from config with :price and :total resolved.
     *
     * Returns an empty string for an unknown key rather than throwing — a
     * missing line of marketing copy must never be able to 500 a page.
     */
    public static function copy(string $key): string
    {
        $template = config("creator_subscription.copy.$key");

        if (! is_string($template)) {
            return '';
        }

        return strtr($template, [
            ':price' => self::formatted(self::price()),
            ':total' => self::formatted(self::total()),
        ]);
    }

    /**
     * The digital-content waiver the creator ticks before checkout.
     *
     * Resolved here rather than in the controller so the words stored on the
     * consent record are byte-identical to the words rendered next to the
     * checkbox — a stored consent whose text was assembled separately from the
     * one displayed is not evidence of anything.
     */
    public static function waiverText(): string
    {
        return self::copy('waiver');
    }

    /**
     * Everything the frontend needs, in one array.
     *
     * Handed to the pages that render subscription copy rather than added to
     * the shared Inertia payload — only a handful of screens need it, and the
     * shared payload is sent with every navigation in the app.
     */
    public static function forFrontend(): array
    {
        return [
            'price' => self::price(),
            'vat' => self::vat(),
            'total' => self::total(),
            'currency' => self::currency(),
            'price_formatted' => self::formatted(self::price()),
            'total_formatted' => self::formatted(self::total()),
            'free_until_first_sale' => self::freeUntilFirstSale(),
            'promise' => self::copy('promise'),
            'promise_long' => self::copy('promise_long'),
            'price_line' => self::copy('price_line'),
            'reassurance' => self::copy('reassurance'),
            'active_price_line' => self::copy('active_price_line'),
            'waiver' => self::waiverText(),
        ];
    }
}
