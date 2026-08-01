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
     */
    public static function freeUntilFirstSale(): bool
    {
        return (bool) config('creator_subscription.free_until_first_sale', true);
    }

    /**
     * Stripe's hard ceiling on a subscription trial.
     *
     * ⚠️ Exceed it and Checkout refuses the whole session with "The maximum
     * number of trial period days is 730 (2 years)" — so the creator cannot
     * subscribe at all. It is an external limit, not a preference, which is why
     * it is enforced here rather than left to whoever edits the config.
     */
    public const STRIPE_MAX_TRIAL_DAYS = 730;

    /**
     * How far out the parked trial is set while waiting for a first sale.
     *
     * Clamped at BOTH ends. A zero or negative value would put trial_end in the
     * past and Stripe would charge the creator immediately — the exact outcome
     * this feature exists to prevent. Anything above Stripe's ceiling breaks
     * checkout outright.
     */
    public static function freePeriodDays(): int
    {
        $days = (int) config('creator_subscription.free_period_days', self::STRIPE_MAX_TRIAL_DAYS);

        return max(1, min(self::STRIPE_MAX_TRIAL_DAYS, $days));
    }

    /** Checkout saves the card and the subscription is created on first sale. */
    public const MODE_SETUP = 'setup';

    /** Legacy: Checkout creates the subscription with a parked trial. */
    public const MODE_SUBSCRIPTION = 'subscription';

    /**
     * How a new checkout collects the card.
     *
     * Anything unrecognised falls back to the legacy path — an unknown value must
     * not silently put creators on the newer flow.
     */
    public static function checkoutMode(): string
    {
        $mode = (string) config('creator_subscription.checkout_mode', self::MODE_SETUP);

        return $mode === self::MODE_SETUP ? self::MODE_SETUP : self::MODE_SUBSCRIPTION;
    }

    public static function usesSetupMode(): bool
    {
        return self::checkoutMode() === self::MODE_SETUP;
    }

    /**
     * Free days applied to the subscription created on first sale.
     *
     * ⚠️ Non-zero means the creator gets billed on a DATE rather than on their
     * sale, so it has to be disclosed in our own copy before the card is taken —
     * Stripe cannot render terms for a subscription that does not exist yet.
     * Clamped to Stripe's ceiling like every other trial value here.
     */
    public static function trialDaysOnSale(): int
    {
        $days = (int) config('creator_subscription.trial_days', 0);

        return max(0, min(self::STRIPE_MAX_TRIAL_DAYS, $days));
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
            'trial_days_on_sale' => self::trialDaysOnSale(),
            'promise' => self::copy('promise'),
            'promise_long' => self::copy('promise_long'),
            'price_line' => self::copy('price_line'),
            'reassurance' => self::copy('reassurance'),
            'active_price_line' => self::copy('active_price_line'),
            'waiver' => self::waiverText(),
        ];
    }
}
