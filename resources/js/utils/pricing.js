/**
 * The ONE client-side copy of the supporter gross-up.
 *
 * The creator always receives exactly the listed price; the platform and Stripe
 * fees are grossed up into what the supporter pays. This must stay identical to
 * Helpers::calculateStripeDirectChargeFlow() on the server — the server is
 * authoritative and charges the real amount, so any drift here shows the
 * supporter one price and takes another.
 *
 * ⚠️ Before this file the formula was copy-pasted into EIGHT components, each
 * reading the two GLOBAL fee props. A global prop cannot express a per-creator
 * rate, so every one of them quoted the standard price for a creator on a
 * bespoke deal. Do not reintroduce a local copy — pass `creatorId` and let
 * `feeRatesFor()` resolve it.
 */

const DEFAULT_PLATFORM_RATE = 17;
const DEFAULT_COMPLIANCE_RATE = 2;
const STRIPE_RATE = 0.029;
const STRIPE_FIXED_FEE = 0.3;

/**
 * The listing owner's numeric id, whatever shape this particular payload uses.
 *
 * 🚨 NEVER read `item.user.id` directly. Payload shapes differ per endpoint and
 * several TRIM the nested relation: the shop item page serialises `shop.user`
 * with only `uuid, name, username, default_currency, vat_amount_percentage,
 * suspended_account, avatar_url` — no `id` — while the profile page includes it.
 * Reading the nested id there resolved to `undefined`, matched no bespoke rate,
 * and silently quoted the STANDARD price on the buy page while checkout charged
 * the bespoke one. Found in a browser test, invisible to the build and to
 * every unit test.
 *
 * The FOREIGN KEY is checked first because it is a real column on the item and
 * is never trimmed away.
 */
export function creatorIdOf(item) {
    if (!item) return null;

    const id =
        item.user_id ??
        item.creator_id ??
        item.owner_id ??
        item.user?.id ??
        item.creator?.id ??
        item.owner?.id;

    return id === undefined || id === null || id === '' ? null : id;
}

/**
 * The platform + compliance rates that apply to one creator.
 *
 * @param {number|string|null} creatorId  the listing owner — resolve it with
 *                                        creatorIdOf(), never `item.user.id`
 * @param {object} props                  usePage().props
 * @param {"card"|"bank"} method
 */
export function feeRatesFor(creatorId, props = {}, method = "card") {
    const {
        platform_fee_percentage,
        transaction_fee_percentage,
        custom_fee_rates,
    } = props;

    const compliance = Number(transaction_fee_percentage ?? DEFAULT_COMPLIANCE_RATE);
    const standard = Number(platform_fee_percentage ?? DEFAULT_PLATFORM_RATE);

    // A bespoke deal may cover one payment method and not the other, so an
    // absent entry falls back to standard rather than to the other method.
    const custom = creatorId != null ? custom_fee_rates?.[creatorId]?.[method] : undefined;
    const platform = Number.isFinite(Number(custom)) ? Number(custom) : standard;

    return { platform, compliance, isCustom: platform !== standard };
}

/**
 * What the supporter pays for a listed price (VAT already included in `amount`).
 *
 * `adminFee` is the £1 platform fee converted into the charge currency — the
 * caller supplies it because the conversion needs the page's rate table.
 *
 * Returns the listed amount unchanged when the fees cannot be covered, mirroring
 * the server's bail-out rather than inventing a price.
 */
export function supporterTotal(amount, { platform, compliance, adminFee = 0, isZeroDecimal = false }) {
    const listed = parseFloat(amount || 0) || 0;

    const stripeFixed = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;
    const totalDeductionRate = STRIPE_RATE + platform / 100 + compliance / 100;

    if (totalDeductionRate >= 1) {
        return listed;
    }

    const total = (listed + stripeFixed + adminFee) / (1 - totalDeductionRate);

    // CEIL, matching the server — rounding down would leave the creator short.
    return isZeroDecimal ? Math.ceil(total) : Math.ceil(total * 100) / 100;
}
