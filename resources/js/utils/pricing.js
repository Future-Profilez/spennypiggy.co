/**
 * The ONE client-side copy of what a supporter pays for a listed price.
 *
 * The creator always receives exactly the listed price; the supporter pays a fee
 * on top. This must stay identical to Helpers::calculateStripeDirectChargeFlow()
 * on the server — the server is authoritative and charges the real amount, so any
 * drift here shows the supporter one price and takes another.
 *
 * 🚨 THERE ARE TWO MODELS AND THIS FILE IMPLEMENTS BOTH, exactly as the server
 * does. Under **all-in** (11 Sep 2026, client direction) the supporter pays the
 * listed price plus ONE advertised percentage and Stripe comes out of that
 * percentage. Under the **legacy markup** the platform rate, the compliance rate
 * and Stripe's estimate were each grossed up ON TOP of one another, with a £1
 * administration fee beside them — a £100 listing charged £130.55, where all-in
 * charges £112.01.
 *
 * ⚠️ WHAT DID NOT CHANGE, and no copy may imply otherwise: the creator receives
 * 100% of their listed price under both. What changed is the size of the
 * supporter's fee and which side of it the processor sits on.
 *
 * 🚨 WHICH MODEL IS LIVE IS THE SERVER'S ANSWER, NEVER A LITERAL HERE. It arrives
 * as the shared `fees` prop (App\Services\Pricing\FeeModel::describe), and a page
 * rendered without it falls back to LEGACY — the model this app charged for its
 * whole life before today, and the one every stored transaction was priced with.
 *
 * ⚠️ Before this file the formula was copy-pasted into EIGHT components, each
 * reading the two GLOBAL fee props. A global prop cannot express a per-creator
 * rate, so every one of them quoted the standard price for a creator on a
 * bespoke deal. Do not reintroduce a local copy — pass `creatorId` and let
 * `feeRatesFor()` resolve it.
 */

// fee-literal-ok: the legacy-model fallback, reached only when the server reports the legacy model. The live rate is the `fees` prop.
const DEFAULT_PLATFORM_RATE = 17;
const DEFAULT_COMPLIANCE_RATE = 2;

/**
 * ⚠️ Mirrors `config/payments.php` → `fee_profiles.card`. Raised 0.029 → 0.034
 * on 11 Aug 2026 so the estimate covers international cards, whose real Stripe
 * cost (~3.25% + 20p) the old figure did not — the shortfall came out of the
 * creator's net.
 *
 * 🚨 Leaving this at 0.029 while the server charges 3.4% would quote every
 * supporter a total ~0.65% below what their card is actually debited: the price
 * on the button and the price on the statement would disagree, on every card
 * checkout on the platform. If the server value changes again, change it here in
 * the same commit.
 *
 * ⚠️ Under ALL-IN this no longer moves the supporter's total — the advertised
 * rate is the whole difference and Stripe is paid from inside it. It is still
 * read, because the breakdown reports what the processor took out of that fee.
 */
// fee-literal-ok: the one client-side mirror of the server's Stripe estimate — see the docblock above.
export const STRIPE_FEE_RATE = 0.034;
export const STRIPE_FIXED_FEE = 0.3;

const STRIPE_RATE = STRIPE_FEE_RATE;

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
 * The `fees` prop, from either the page object or its props.
 *
 * ⚠️ Half this codebase destructures `usePage().props` and half keeps the page.
 * A reader that only accepts one of them is a reader somebody calls wrongly, and
 * the failure here is a silent fall back to the legacy model — a total ~16%
 * higher than the one the checkout actually charges.
 */
function feeBag(pageOrProps) {
    return pageOrProps?.props?.fees ?? pageOrProps?.fees ?? null;
}

/** Is the platform on the all-in supporter fee? The server's answer, never a literal. */
export function isAllIn(pageOrProps = {}) {
    return feeBag(pageOrProps)?.all_in === true;
}

/**
 * The rates that apply to one creator, and which model they belong to.
 *
 * Spread the result straight into `supporterTotal()` — the model travels with
 * the rates so a call site cannot pick the wrong formula.
 *
 * 🚨 UNDER ALL-IN A BESPOKE DEAL SETS THE SUPPORTER RATE. `custom_fee_rates` is
 * built from `creator_fee_overrides.platform_rate`, which was written for the
 * legacy model where it meant "the platform's cut". Under all-in the platform's
 * cut IS the fee minus Stripe, so the same column is read as that creator's
 * all-in rate — one number, one meaning, matching FeeModel::supporterRate().
 *
 * @param {number|string|null} creatorId  the listing owner — resolve it with
 *                                        creatorIdOf(), never `item.user.id`
 * @param {object} props                  usePage().props (or the page)
 * @param {"card"|"bank"} method
 */
export function feeRatesFor(creatorId, props = {}, method = "card") {
    const bag = props?.props ?? props ?? {};

    const {
        platform_fee_percentage,
        transaction_fee_percentage,
        custom_fee_rates,
    } = bag;

    // A bespoke deal may cover one payment method and not the other, so an
    // absent entry falls back to standard rather than to the other method.
    const custom = creatorId != null ? custom_fee_rates?.[creatorId]?.[method] : undefined;
    const bespoke = Number.isFinite(Number(custom)) ? Number(custom) : null;

    const fees = feeBag(props);

    if (fees?.all_in === true) {
        // ⚠️ NO FALLBACK NUMBER. A missing rate must not become a plausible wrong
        // total — `supporterTotal()` answers the listed price rather than invent
        // one, the same bail-out the server takes when it cannot price a charge.
        const standard = Number.isFinite(Number(fees?.rate)) ? Number(fees.rate) : null;
        const supporterRate = bespoke !== null && bespoke > 0 ? bespoke : standard;

        return {
            allIn: true,
            supporterRate,
            isCustom: supporterRate !== null && standard !== null && supporterRate !== standard,
            /*
             * ⚠️ Kept so a legacy reader gets a number rather than NaN, but they
             * describe nothing under all-in: there is no second compliance line,
             * and the platform's own cut is whatever is left after Stripe.
             */
            platform: supporterRate ?? 0,
            compliance: 0,
        };
    }

    const compliance = Number(transaction_fee_percentage ?? DEFAULT_COMPLIANCE_RATE);
    const standard = Number(platform_fee_percentage ?? DEFAULT_PLATFORM_RATE);
    const platform = bespoke !== null ? bespoke : standard;

    return {
        allIn: false,
        supporterRate: null,
        platform,
        compliance,
        isCustom: platform !== standard,
    };
}

/**
 * What the supporter pays for a listed price (VAT already included in `amount`).
 *
 * ALL-IN: `listed × (1 + rate)` plus the flat supporter fee, which is off at
 * launch. There is no gross-up to solve — the rate IS the price difference.
 *
 * LEGACY: platform + compliance + Stripe are grossed up together, with the £1
 * administration fee inside the numerator. `adminFee` is that fee converted into
 * the charge currency — the caller supplies it because the conversion needs the
 * page's rate table. ⚠️ It is IGNORED under all-in; there is no £1 fee any more.
 *
 * Returns the listed amount unchanged when the fee cannot be priced, mirroring
 * the server's bail-out rather than inventing a price.
 */
export function supporterTotal(amount, {
    platform,
    compliance,
    adminFee = 0,
    isZeroDecimal = false,
    allIn = false,
    supporterRate = null,
    fixedFee = 0,
} = {}) {
    const listed = parseFloat(amount || 0) || 0;

    // CEIL, matching the server — rounding down would leave the creator short.
    const ceilTo = (value) => (isZeroDecimal ? Math.ceil(value) : Math.ceil(value * 100) / 100);

    if (allIn) {
        const rate = Number(supporterRate);

        if (!Number.isFinite(rate) || rate < 0) {
            return listed;
        }

        return ceilTo(listed * (1 + rate / 100) + (Number(fixedFee) || 0));
    }

    const stripeFixed = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;
    const totalDeductionRate = STRIPE_RATE + platform / 100 + compliance / 100;

    if (totalDeductionRate >= 1) {
        return listed;
    }

    return ceilTo((listed + stripeFixed + adminFee) / (1 - totalDeductionRate));
}
