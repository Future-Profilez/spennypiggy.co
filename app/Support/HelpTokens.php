<?php

namespace App\Support;

use App\Console\Commands\ReleaseReserves;
use App\Helpers;
use App\Services\CreatorPushService;
use App\Services\PostingCadenceService;
use App\Services\Risk\ReservePolicy;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * The ONE reason a help article can never publish a stale price.
 *
 * 🚨 NEVER retype a price, rate, threshold or seat count into an article body.
 * The homepage FAQ published "a service fee, starting at just 8%", "£29.99 per
 * month" and a "2-day roll" payout timing for a year — all typed by hand, all
 * findable in search, none of them true. Article bodies write {{tokens}} and
 * this class resolves them from the same config the platform actually charges
 * from.
 *
 * ⚠️ The map is a WHITELIST. An unknown token is a VALIDATION ERROR at save
 * time (see HelpContent::unknownTokens) and renders as an empty string with a
 * warning at read time — a literal `{{foo}}` on a public page is worse than a
 * gap, and guessing at what it meant is worse than both.
 *
 * ⚠️ Every resolver must be side-effect free and must never throw. These run on
 * a public page; a config key that moved must degrade to a blank, not a 500.
 */
class HelpTokens
{
    /**
     * token => resolver. Keep grouped and alphabetical within a group so a
     * missing one is obvious.
     *
     * @return array<string, callable():string>
     */
    public static function map(): array
    {
        return [
            // ---- Creator subscription -------------------------------------
            'subscription.price' => fn () => SubscriptionPlan::formatted(SubscriptionPlan::price()),
            'subscription.vat' => fn () => SubscriptionPlan::formatted(SubscriptionPlan::vat()),
            'subscription.total' => fn () => SubscriptionPlan::formatted(SubscriptionPlan::total()),
            'subscription.vat_rate' => fn () => self::pct(SubscriptionPlan::vatRate()),
            // ⚠️ A SWITCH, not a fact. free_until_first_sale is intended to be
            // revisited, so the sentence must change with it rather than assert.
            'subscription.when_charged' => fn () => SubscriptionPlan::freeUntilFirstSale()
                ? 'after your first sale'
                : 'as soon as you add your card',

            // ---- Fees -----------------------------------------------------
            // These are the STANDARD rates. A creator on a bespoke agreement
            // pays a negotiated platform rate, which is why no article may
            // present these as universal — the copy around them says "standard".
            'fee.card.platform' => fn () => self::pct(config('payments.fee_profiles.card.platform_rate')),
            'fee.card.compliance' => fn () => self::pct(config('payments.fee_profiles.card.compliance_rate')),
            'fee.bank.platform' => fn () => self::pct(config('payments.fee_profiles.bank.platform_rate')),
            'fee.bank.compliance' => fn () => self::pct(config('payments.fee_profiles.bank.compliance_rate')),
            'fee.admin' => fn () => self::money(config('app.administration_fee', 1)),

            // ---- Payments / checkout --------------------------------------
            'payment.tier.open_max' => fn () => self::money(config('payments.tiers.open_max_gbp', 250)),
            'payment.tier.card_max' => fn () => self::money(config('payments.tiers.card_max_gbp', 1000)),

            // ---- Price limits ---------------------------------------------
            'price.min' => fn () => self::money(Helpers::MIN_PRICE_GBP),
            'price.max.wish' => fn () => self::money(500),
            'price.max.pot' => fn () => self::money(500),
            'price.max.bill' => fn () => self::money(100),
            'price.max.membership' => fn () => self::money(100),
            'price.max.shop' => fn () => self::money(10000),
            'price.max.task' => fn () => self::money(10000),

            // ---- Payouts & reserves ---------------------------------------
            'payout.day' => fn () => 'Friday',
            // ⚠️ Kept for the RESERVE explanation and for legacy article bodies. The payout
            // itself is no longer a bare day count — a sale waits until its Friday-to-Thursday
            // earning week closes and is held a further week, i.e. 8 to 14 days. Use
            // {{payout.period}} / {{payout.wait}} in payout copy, never this.
            'payout.hold_days' => fn () => (string) PayoutCycle::MIN_HOLD_DAYS,
            'payout.period' => fn () => 'Friday to Thursday',
            'payout.wait' => fn () => '8 to 14 days',
            /*
             * 🚨 TWO DIFFERENT CLOCKS, BOTH ABOUT 30 DAYS. Keep them apart in
             * copy or the sentence becomes nonsense:
             *
             *   reserve.window_days     — how long EACH reserve is held, from
             *                             its own sale date. Fixed.
             *   reserve.onboarding_days — how long a CREATOR stays on the
             *                             new-creator RATE. A setting.
             *
             * Writing "new creators are on 10% for their first N days" without
             * that distinction reads as "the money is held N days", which is
             * wrong on both counts. Any copy using these must say which is which.
             */
            'reserve.window_days' => fn () => (string) ReleaseReserves::RESERVE_RELEASE_WINDOW_DAYS,
            'reserve.onboarding_pct' => fn () => self::pct(ReservePolicy::ONBOARDING_PERCENT),
            /*
             * ⚠️ The ONLY token that reads the database (risk_settings, and
             * RiskSetting::get does no caching of its own), so it is cached here
             * for a minute — a category page can render it in several summaries.
             *
             * ⚠️ Cached, NOT memoised into a static. A static survives for the
             * life of the PHP process, and on Vapor a warm Lambda container is
             * reused across requests — a changed setting would stay stale until
             * that container recycled, with nothing to indicate why.
             *
             * Falls back to the constant rather than through the resolver's
             * catch: a blank where "30 days" should be turns a reassuring
             * sentence into a confusing one.
             */
            'reserve.onboarding_days' => function () {
                try {
                    return (string) Cache::remember(
                        'help:token:reserve_onboarding_days',
                        60,
                        fn () => app(ReservePolicy::class)->getOnboardingAgeDays()
                    );
                } catch (\Throwable) {
                    return (string) ReservePolicy::DEFAULT_ONBOARDING_DAYS;
                }
            },

            // ---- Bonuses ---------------------------------------------------
            'founder.min_earnings' => fn () => self::money(config('founder_bonus.qualification.min_first_30d_earnings', 2500)),
            'founder.window_days' => fn () => (string) (int) config('founder_bonus.qualification.qualification_period_days', 30),
            'founder.seats' => fn () => (string) (int) config('founder_bonus.limits.max_founder_seats', 150),
            'founder.monthly_pct' => fn () => self::pct(((float) config('founder_bonus.bonus.bonus_percentage', 0.10)) * 100),
            'founder.monthly_cap' => fn () => self::money(config('founder_bonus.bonus.max_bonus_per_month', 1000)),
            'referral.reward' => fn () => self::money(config('referral.reward_amount', 50)),
            /*
             * 🚨 THE REWARD IS NEVER QUOTED WITHOUT THE THRESHOLD. A referral
             * only counts once the referred creator passes this in lifetime
             * qualifying earnings, so "{{referral.reward}} per creator" on its
             * own sets somebody up to share their link, watch a signup land and
             * be paid nothing. The promo deck follows the same rule.
             */
            'referral.threshold' => fn () => self::money(config('referral.qualifying_gmv', 1000)),

            // ---- Fast Start -----------------------------------------------
            /*
             * ⚠️ A RANGE WHEN TIERED, NEVER ONE BRACKET'S FIGURE. With
             * `enable_tiered` on there is no single rate, and quoting the flat
             * one would understate it for a high earner and overstate it for a
             * new one. The promo card omits the figure entirely in that state;
             * a token cannot omit itself without leaving a gap mid-sentence, so
             * it widens to the real range instead.
             */
            'faststart.rate' => function () {
                if (! config('fast_start_bonus.bonus.enable_tiered')) {
                    return self::pct(((float) config('fast_start_bonus.bonus.flat_rate', 0.05)) * 100);
                }

                $rates = array_map(
                    fn ($t) => (float) ($t['rate'] ?? 0),
                    (array) config('fast_start_bonus.bonus.tiered_rates', [])
                );

                if (! $rates) {
                    return self::pct(((float) config('fast_start_bonus.bonus.flat_rate', 0.05)) * 100);
                }

                return self::pct(min($rates) * 100).'–'.self::pct(max($rates) * 100);
            },
            'faststart.window_days' => fn () => (string) (int) config('fast_start_bonus.bonus.window_days', 30),
            'faststart.settlement_days' => fn () => (string) (int) config('fast_start_bonus.bonus.settlement_buffer_days', 7),

            // ---- Growth Bonus ----------------------------------------------
            /*
             * ⚠️ THE CEILING IS THE SUM OF THE LADDER, NOT A CONFIGURED FIGURE.
             * `ladder` holds INCREMENTAL amounts, so the total a creator can
             * ever be paid is their sum — deriving it means an edited ladder can
             * never leave the help centre advertising a maximum the engine will
             * not pay. Same reason the last rung's own GMV is read from the row
             * rather than typed.
             */
            'growth.max_reward' => fn () => self::money(array_sum(array_map(
                fn ($r) => (float) ($r['amount'] ?? 0),
                (array) config('growth_bonus.ladder', [])
            ))),
            'growth.first_reward' => fn () => self::money(
                (float) (((array) config('growth_bonus.ladder', []))[0]['amount'] ?? 0)
            ),
            'growth.top_gmv' => function () {
                $ladder = (array) config('growth_bonus.ladder', []);

                return self::money((float) (end($ladder)['gmv'] ?? 0));
            },
            'growth.rungs' => fn () => (string) count((array) config('growth_bonus.ladder', [])),
            'growth.activation_gmv' => fn () => self::money(config('growth_bonus.activation.threshold_gmv', 100)),
            'growth.window_days' => fn () => (string) (int) config('growth_bonus.activation.window_days', 30),
            'growth.seats' => fn () => (string) (int) config('growth_bonus.limits.max_seats', 150),
            'growth.expiry_months' => fn () => (string) (int) config('growth_bonus.expiry_months', 12),

            // ---- Content rules --------------------------------------------
            'cadence.min_posts' => fn () => (string) PostingCadenceService::MIN_POSTS,
            'cadence.window_days' => fn () => (string) PostingCadenceService::WINDOW_DAYS,
            'cadence.warning_days' => fn () => (string) PostingCadenceService::WARNING_DAYS,

            // ---- Creator push ----------------------------------------------
            'push.per_day' => fn () => (string) CreatorPushService::MAX_PER_DAY,
            'push.per_month' => fn () => (string) CreatorPushService::MAX_PER_MONTH,
            'push.max_length' => fn () => (string) CreatorPushService::MAX_LENGTH,
            'push.window_days' => fn () => (string) CreatorPushService::MONTH_WINDOW_DAYS,

            // ---- Support / verification ------------------------------------
            'gifter.verification_threshold' => fn () => self::money(500),
            'gifter.verification_charge' => fn () => self::money(GifterVerificationCharge::AMOUNT_GBP),
        ];
    }

    /** Every token name the whitelist accepts. */
    public static function names(): array
    {
        return array_keys(self::map());
    }

    /**
     * Replace every {{token}} in the given text.
     *
     * Unknown tokens resolve to an empty string and are logged.
     *
     * 🚨 NOTHING IS MEMOISED INTO A STATIC HERE. An earlier version cached each
     * resolved token in a `static` for cheapness, which is correct under FPM and
     * wrong everywhere this actually runs: a warm Vapor Lambda container is
     * reused across requests, so a changed rate or setting would keep serving
     * the old value until that container recycled — silently, and only on some
     * requests. Every resolver is a config read (already an in-memory array);
     * the single database-backed one caches itself, with a TTL.
     */
    public static function render(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        // Resolved once per call, not once per process — a page rendering the
        // same token in several summaries still only resolves it once.
        $resolved = [];
        $map = self::map();

        return (string) preg_replace_callback(
            '/\{\{\s*([a-z0-9_.]+)\s*\}\}/i',
            function (array $m) use (&$resolved, $map) {
                $key = strtolower(trim($m[1]));

                if (array_key_exists($key, $resolved)) {
                    return $resolved[$key];
                }

                if (! isset($map[$key])) {
                    Log::warning('Help centre: unknown token in article body', ['token' => $key]);

                    return $resolved[$key] = '';
                }

                try {
                    return $resolved[$key] = (string) $map[$key]();
                } catch (\Throwable $e) {
                    Log::warning('Help centre: token failed to resolve', [
                        'token' => $key,
                        'error' => $e->getMessage(),
                    ]);

                    return $resolved[$key] = '';
                }
            },
            $text
        );
    }

    /** Tokens present in the text that the whitelist does not know. */
    public static function unknown(?string $text): array
    {
        if (! $text) {
            return [];
        }

        preg_match_all('/\{\{\s*([a-z0-9_.]+)\s*\}\}/i', $text, $m);

        $known = self::map();

        return array_values(array_unique(array_filter(
            array_map(fn ($t) => strtolower(trim($t)), $m[1] ?? []),
            fn ($t) => ! isset($known[$t])
        )));
    }

    /** "17%" — trims a trailing .0 so 17.0 does not read as a suspicious figure. */
    private static function pct($value): string
    {
        $n = (float) $value;

        return rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.').'%';
    }

    /** Help centre prices are quoted in GBP; the platform's own figures are GBP. */
    private static function money($value): string
    {
        return '£'.number_format((float) $value, 2);
    }
}
