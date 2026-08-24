<?php

namespace App\Support;

/**
 * The stablecoin Tip button's rules — the amounts, the fee, and the switch.
 *
 * A tip is the ONE thing a supporter can pay for on this platform that has no
 * deliverable: it is voluntary, nothing is exchanged, and nothing is unlocked.
 * That is why it does not go anywhere near the Stripe content-first machinery —
 * `Helpers::priceWithinLimits`, `Deliverable`, the fee profiles and the reserve
 * regime all describe a purchase of creator content, and a tip is not one.
 * Its limits therefore live here, separately and deliberately.
 *
 * 🚨 NEVER NAME THE PAYMENT PROVIDER ON A USER-FACING SURFACE, AND NEVER PROMISE
 * INSTANT, IMMEDIATE OR SECONDS SETTLEMENT. Both are standing client
 * prohibitions (Master Plan 19 Aug 2026, §A3 "Never" and §B "Do not"), and no
 * settlement speed has been confirmed by anybody. Nothing in this class or its
 * copy names a provider; the rail is referred to as "its own rail".
 *
 * ⚠️ THE PROVIDER IS UNSETTLED IN OUR OWN DOCUMENTS. `resources/js/constants/
 * stablecoinTips.js` records it as Coinflow (account approved, spec dated 6 Aug
 * 2026); the 19 Aug Developer Master Plan states the rail is Bridge and says it
 * supersedes older references. Neither name is user-facing, so nothing rendered
 * is wrong either way — but the two documents disagree and it is not this
 * class's decision to make. Everything here is therefore PROVIDER-AGNOSTIC:
 * amounts, fee and FX are ours, and the single call that would hand an order to
 * a rail is one unimplemented seam (`BioTipService::send()`).
 *
 * 🚨 THE SWITCH IS `config('discovery.labels.tips')`, THE SAME KEY THE THREE
 * MARKETING SURFACES READ. One flip turns the button on in the product and
 * removes COMING SOON from the ad pages at the same moment — which is exactly
 * the failure the shared label map exists to prevent, and it is a config change
 * with no deploy (Master Plan §F).
 */
class BioTipRail
{
    /**
     * The tip is denominated in USD and settles in USDC.
     *
     * ⚠️ This resolves the GBP-vs-USD question the 6 Aug specification left open
     * and flagged as blocking: the 19 Aug plan states USD/USDC with a $5–$1,000
     * range, and it is the later document.
     */
    public const CURRENCY = 'USD';

    public const STABLECOIN = 'USDC';

    /** Minimum tip, in CURRENCY. */
    public const MIN = 5.00;

    /** Maximum tip, in CURRENCY. */
    public const MAX = 1000.00;

    /**
     * The one-tap amounts, in CURRENCY, exactly as the plan prints them.
     *
     * ⚠️ $500 is a preset and $1,000 is the ceiling — a custom amount fills the
     * gap between them, and between every other pair. The presets are not the
     * limits.
     */
    public const PRESETS = [10, 25, 50, 100, 250, 500];

    /**
     * The platform's admin fee, ADDED TO the tip rather than taken out of it.
     *
     * 🚨 The creator receives the full tip; the supporter pays the tip plus this.
     * Stated in GBP by the plan and converted at the frozen rate, so the figure
     * the supporter is shown and the figure charged are the same number.
     */
    public const ADMIN_FEE_GBP = 1.00;

    public const ADMIN_FEE_CURRENCY = 'GBP';

    /**
     * How long a frozen quote stands.
     *
     * "FX frozen at transaction point" means the supporter is charged the rate
     * they were shown, not the rate at the moment the rail settles. A quote that
     * never expired would let someone hold a favourable rate indefinitely.
     */
    public const QUOTE_TTL_SECONDS = 900;

    /**
     * Is the rail switched on?
     *
     * ⚠️ Defaults to OFF for anything that is not the exact string `live`. A
     * missing key, a typo or a half-written config value must leave the button
     * greyed — the safe direction, and the one the standing prohibition on
     * advertising something that is not live requires.
     */
    public static function enabled(): bool
    {
        return config('discovery.labels.tips') === 'live';
    }
}
