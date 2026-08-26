/**
 * Per-feature price limits, expressed in the CREATOR'S OWN currency.
 *
 * 🚨 The server rule (`Helpers::priceWithinLimits`) is GBP-EQUIVALENT: it converts
 * the listing price to GBP and compares against £4.99 / £100 / £500 / £10,000.
 * Every client-side mirror of that rule used to compare the raw number against
 * those same figures, which is only correct for a GBP creator. A JPY creator was
 * told "Maximum is JPY 100 per month" (≈ £0.52) and could not price a membership
 * at all — every legal value was refused by the form, and every value the form
 * accepted was refused by the server.
 *
 * `rates` is the globally shared Inertia prop (`HandleInertiaRequests`) and holds
 * units-per-GBP, GBP itself being 1 — the same table `Helpers::priceFormat` reads,
 * so the form and the server cannot disagree.
 *
 * ⚠️ Rounding is directional on purpose. The minimum rounds UP and the maximum
 * rounds DOWN, so a value sitting exactly on a displayed bound still converts
 * back inside the server's range instead of failing by a rounding penny.
 */

/** GBP minimum, every paid feature. */
export const MIN_PRICE_GBP = 4.99;

/** GBP maximums by feature — mirrors the per-feature figures in CLAUDE.md. */
export const MAX_PRICE_GBP = {
    bill: 100,
    membership: 100,
    wish: 500,
    piggyPot: 500,
    shop: 10000,
    task: 10000,
};

/** Currencies Stripe treats as zero-decimal — a fractional bound is meaningless there. */
const ZERO_DECIMAL = new Set([
    "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
    "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

export function currencyDecimals(currency) {
    return ZERO_DECIMAL.has(String(currency || "GBP").toUpperCase()) ? 0 : 2;
}

/**
 * Units-per-GBP for a currency. Returns 1 when the rate is unknown, which makes
 * every helper below fall back to the raw GBP figures — the old behaviour, and
 * still the safest guess when the rate table has not loaded.
 */
export function rateFor(currency, rates) {
    const iso = String(currency || "GBP").toUpperCase();
    if (iso === "GBP") return 1;
    const rate = Number(rates?.[iso]);
    return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

/** Convert a price typed in `currency` to its GBP equivalent. */
export function toGbp(value, currency, rates) {
    return Number(value) / rateFor(currency, rates);
}

/** Convert a GBP figure into `currency`, rounding in the given direction. */
export function fromGbp(gbp, currency, rates, direction = "up") {
    const decimals = currencyDecimals(currency);
    const factor = 10 ** decimals;
    const raw = Number(gbp) * rateFor(currency, rates) * factor;
    const rounded = direction === "down" ? Math.floor(raw) : Math.ceil(raw);
    return rounded / factor;
}

/**
 * The bounds to show and enforce for one feature in one currency.
 *
 * @param {string} currency  Creator/listing currency
 * @param {object} rates     Shared `rates` Inertia prop
 * @param {number} maxGbp    Feature maximum in GBP (see MAX_PRICE_GBP)
 */
export function priceLimits(currency, rates, maxGbp) {
    const decimals = currencyDecimals(currency);
    return {
        min: fromGbp(MIN_PRICE_GBP, currency, rates, "up"),
        max: fromGbp(maxGbp, currency, rates, "down"),
        decimals,
        step: decimals === 0 ? "1" : "0.01",
    };
}

/** `4.99` → `£4.99`, `963` → `¥963`. Falls back to `ISO 1,234` if Intl refuses the code. */
export function formatPrice(value, currency) {
    const iso = String(currency || "GBP").toUpperCase();
    const decimals = currencyDecimals(iso);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: iso,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(Number(value));
    } catch {
        return `${iso} ${Number(value).toFixed(decimals)}`;
    }
}

/**
 * Validate a typed price against a feature's limits.
 *
 * @returns {string|null} User-facing error, or null when the price is allowed.
 */
export function priceLimitError(value, currency, rates, maxGbp, { per = "" } = {}) {
    const price = Number(value);
    if (!price || Number.isNaN(price)) return "Set a price.";

    const { min, max } = priceLimits(currency, rates, maxGbp);
    const suffix = per ? ` ${per}` : "";

    if (price < min) return `Minimum is ${formatPrice(min, currency)}${suffix}.`;
    if (price > max) return `Maximum is ${formatPrice(max, currency)}${suffix}.`;
    return null;
}
