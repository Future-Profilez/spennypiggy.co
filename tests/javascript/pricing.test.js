import { creatorIdOf, feeRatesFor, supporterTotal } from '../../resources/js/utils/pricing';

/**
 * The client-side half of bespoke creator pricing.
 *
 * These exist because the bug they cover was invisible to everything else: the
 * build succeeded, every PHP test passed, and the shop item page still quoted
 * the STANDARD price while checkout charged the bespoke one. It was only found
 * by opening the page in a browser.
 */

const PROPS = {
    platform_fee_percentage: '17',
    transaction_fee_percentage: 2,
    custom_fee_rates: { 134: { card: 12, bank: 8 } },
};

describe('creatorIdOf', () => {
    /**
     * 🚨 The regression. The shop item page serialises `shop.user` WITHOUT `id`
     * — only uuid/name/username/default_currency/vat_amount_percentage/
     * suspended_account/avatar_url — while `shop.user_id` carries the real id.
     * Reading the nested path resolved to undefined and silently fell back to
     * standard pricing on the one page a buyer actually pays from.
     */
    it('reads the foreign key when the nested relation has been trimmed', () => {
        const shop = {
            user_id: 134,
            user: {
                uuid: 'abc',
                name: 'Boom',
                username: 'boom_boom01',
                default_currency: 'GBP',
                vat_amount_percentage: null,
                suspended_account: 0,
                avatar_url: 'https://example.test/a.jpg',
            },
        };

        expect(creatorIdOf(shop)).toBe(134);
    });

    it('falls back to the nested relation when there is no foreign key', () => {
        expect(creatorIdOf({ user: { id: 7 } })).toBe(7);
        expect(creatorIdOf({ creator: { id: 9 } })).toBe(9);
    });

    it('handles the other foreign keys this codebase uses', () => {
        // Tasks key the creator as `creator_id`, not `user_id`.
        expect(creatorIdOf({ creator_id: 42 })).toBe(42);
        expect(creatorIdOf({ owner_id: 43 })).toBe(43);
    });

    it('returns null rather than a falsy id for an absent or empty value', () => {
        expect(creatorIdOf(null)).toBeNull();
        expect(creatorIdOf({})).toBeNull();
        expect(creatorIdOf({ user_id: null, user: {} })).toBeNull();
        expect(creatorIdOf({ user_id: '' })).toBeNull();
    });
});

/**
 * The shared `fees` prop, as App\Services\Pricing\FeeModel::describe('card')
 * sends it. ⚠️ Its ABSENCE is what selects the legacy model, which is why
 * PROPS above deliberately does not carry one.
 */
const ALL_IN = { model: 'all_in', all_in: true, rate: 12, rate_label: '12%', fixed_fee: 0 };

describe('feeRatesFor', () => {
    it('returns the standard rates for a creator with no agreement', () => {
        expect(feeRatesFor(999, PROPS)).toEqual({
            allIn: false,
            supporterRate: null,
            platform: 17,
            compliance: 2,
            isCustom: false,
        });
    });

    it('returns the bespoke platform rate per payment method', () => {
        expect(feeRatesFor(134, PROPS, 'card')).toEqual({
            allIn: false,
            supporterRate: null,
            platform: 12,
            compliance: 2,
            isCustom: true,
        });

        expect(feeRatesFor(134, PROPS, 'bank')).toEqual({
            allIn: false,
            supporterRate: null,
            platform: 8,
            compliance: 2,
            isCustom: true,
        });
    });

    /**
     * 🚨 THE MODEL TRAVELS WITH THE RATES. `supporterTotal` picks its formula
     * from `allIn`, so a call site spreading this result cannot apply the legacy
     * gross-up to an all-in platform — which is the fault that would have quoted
     * every supporter ~16% above what their card is debited.
     */
    it('reads the live model off the shared fees prop', () => {
        expect(feeRatesFor(999, { ...PROPS, fees: ALL_IN })).toEqual({
            allIn: true,
            supporterRate: 12,
            isCustom: false,
            platform: 12,
            compliance: 0,
        });
    });

    /**
     * `creator_fee_overrides.platform_rate` was written for the legacy model,
     * where it meant "the platform's cut". Under all-in the platform's cut IS
     * the fee minus Stripe, so the same column is that creator's ALL-IN rate —
     * matching FeeModel::supporterRate(), which reads the identical column.
     */
    it('reads a bespoke deal as the supporter rate under all-in', () => {
        const rates = feeRatesFor(134, { ...PROPS, fees: ALL_IN }, 'bank');

        expect(rates.allIn).toBe(true);
        expect(rates.supporterRate).toBe(8);
        expect(rates.isCustom).toBe(true);
    });

    /**
     * 🚨 A MISSING RATE MUST NOT BECOME A PLAUSIBLE WRONG TOTAL. The server bails
     * out rather than charging a figure it cannot justify, and so does this —
     * see the supporterTotal case below.
     */
    it('reports no supporter rate when the server sent none', () => {
        const rates = feeRatesFor(999, { ...PROPS, fees: { all_in: true } });

        expect(rates.allIn).toBe(true);
        expect(rates.supporterRate).toBeNull();
    });

    /**
     * ⚠️ A page rendered without the prop falls back to LEGACY — the model this
     * app charged for its whole life, and the one every stored transaction was
     * priced with. Never the other way round.
     */
    it('falls back to the legacy model when the fees prop is absent', () => {
        expect(feeRatesFor(999, PROPS).allIn).toBe(false);
        expect(feeRatesFor(999, { ...PROPS, fees: { all_in: false } }).allIn).toBe(false);
    });

    /**
     * The map arrives from JSON with STRING keys; the id is a number. A strict
     * lookup would miss every bespoke creator.
     */
    it('matches a numeric id against the map\'s string keys', () => {
        const props = { ...PROPS, custom_fee_rates: { 134: { card: 12 } } };

        expect(feeRatesFor(134, props, 'card').platform).toBe(12);
        expect(feeRatesFor('134', props, 'card').platform).toBe(12);
    });

    /**
     * A deal may cover one method only — the other keeps the STANDARD rate, and
     * must never inherit the negotiated one.
     */
    it('leaves a method the deal does not mention on the standard rate', () => {
        const props = { ...PROPS, custom_fee_rates: { 134: { bank: 8 } } };

        expect(feeRatesFor(134, props, 'bank').platform).toBe(8);
        expect(feeRatesFor(134, props, 'card').platform).toBe(17);
        expect(feeRatesFor(134, props, 'card').isCustom).toBe(false);
    });

    it('falls back to the standard rates when the map is missing entirely', () => {
        expect(feeRatesFor(134, { platform_fee_percentage: 17, transaction_fee_percentage: 2 }))
            .toEqual({ allIn: false, supporterRate: null, platform: 17, compliance: 2, isCustom: false });

        expect(feeRatesFor(null, {}))
            .toEqual({ allIn: false, supporterRate: null, platform: 17, compliance: 2, isCustom: false });
    });

    /**
     * Half this codebase destructures `usePage().props` and half keeps the page.
     * A reader that only accepts one of them is a reader somebody calls wrongly,
     * and the failure is a SILENT fall back to the legacy model.
     */
    it('accepts either the page object or its props', () => {
        expect(feeRatesFor(999, { props: { ...PROPS, fees: ALL_IN } }).allIn).toBe(true);
    });
});

describe('supporterTotal', () => {
    /**
     * These figures are the server's, verified against
     * Helpers::calculateStripeDirectChargeFlow. If this drifts, the page quotes
     * one price and Stripe charges another.
     */
    it('matches the server for a £100 listing', () => {
        const adminFee = 1;

        // 130.55, not 129.71: the card Stripe estimate was raised 2.9% -> 3.4%
        // on 11 Aug 2026 so an international card can never leave the creator
        // short. Both figures come from calculateStripeDirectChargeFlow.
        expect(supporterTotal(100, { platform: 17, compliance: 2, adminFee })).toBe(130.55);
        expect(supporterTotal(100, { platform: 12, compliance: 2, adminFee })).toBe(122.64);
    });

    it('rounds UP, never down — rounding down would leave the creator short', () => {
        const total = supporterTotal(100, { platform: 17, compliance: 2, adminFee: 1 });
        const exact = (100 + 0.3 + 1) / (1 - (0.034 + 0.17 + 0.02));

        // ⚠️ Compared against the UNROUNDED figure, not against
        // Math.ceil(total * 100) / 100 — re-ceiling an already-ceiled value is
        // not a rounding test, and it fails on any total whose float
        // representation sits a hair above the penny (130.55 * 100 is
        // 13055.000000000002, so it re-ceils to 130.56).
        expect(total).toBeGreaterThanOrEqual(exact);
        expect(total - exact).toBeLessThan(0.01);
    });

    it('drops the fixed fee for a zero-decimal currency and rounds to a whole unit', () => {
        const zeroDecimal = supporterTotal(1000, {
            platform: 17, compliance: 2, adminFee: 0, isZeroDecimal: true,
        });

        // No 0.30 fixed fee in the numerator, and CEIL to a whole unit rather
        // than to 2dp — which is why this can exceed the 2dp figure rather than
        // simply being smaller.
        expect(zeroDecimal).toBe(Math.ceil(1000 / (1 - (0.034 + 0.17 + 0.02))));
        expect(Number.isInteger(zeroDecimal)).toBe(true);
    });

    /**
     * Mirrors the server's bail-out: when the fees cannot be covered it returns
     * the listed amount rather than inventing a price.
     */
    it('returns the listed amount when the fees cannot be covered', () => {
        expect(supporterTotal(100, { platform: 90, compliance: 8, adminFee: 1 })).toBe(100);
    });
});

describe('supporterTotal — the all-in model', () => {
    /**
     * 🚨 THE FIGURES ARE THE SERVER'S. Verified against
     * Helpers::calculateStripeDirectChargeFlow's all-in branch, which is
     * `ceil((listed × (1 + rate)) × 100) / 100`.
     *
     * ⚠️ £112.01 IS NOT A TYPO FOR £112.00. `100 * 1.12` is 112.00000000000001 in
     * both PHP and JavaScript, so the shared ceil-to-the-penny lands a penny
     * above. Rounding "sensibly" to 112.00 here would show a price a penny below
     * what Stripe charges — which is exactly the drift this mirror exists to
     * prevent. Confirmed identical in `php -r` and in node.
     */
    it('matches the server for a £100 listing', () => {
        expect(supporterTotal(100, { allIn: true, supporterRate: 12 })).toBe(112.01);
        expect(supporterTotal(100, { allIn: true, supporterRate: 9 })).toBe(109.01);
    });

    /**
     * The point of the change, stated as a number: the same listing used to
     * charge £130.55 under the legacy stack of platform + compliance + a
     * grossed-up Stripe estimate + the £1 administration fee.
     */
    it('charges far less than the legacy markup did for the same listing', () => {
        const legacy = supporterTotal(100, { platform: 17, compliance: 2, adminFee: 1 });
        const allIn = supporterTotal(100, { allIn: true, supporterRate: 12 });

        expect(legacy).toBe(130.55);
        expect(allIn).toBeLessThan(legacy);
    });

    /**
     * 🚨 THE £1 ADMINISTRATION FEE IS GONE (client §2). A caller spreading a
     * legacy-shaped options object must not smuggle it back in — `adminFee` is
     * ignored outright on this branch, because the callers all pass it.
     */
    it('ignores the administration fee entirely', () => {
        expect(supporterTotal(100, { allIn: true, supporterRate: 12, adminFee: 1 }))
            .toBe(supporterTotal(100, { allIn: true, supporterRate: 12 }));
    });

    /**
     * Stripe is paid from INSIDE the advertised rate now, so its estimate must
     * not move the supporter's total. If it ever does, the checkout and the page
     * are computing two different prices again.
     */
    it('does not add the Stripe estimate on top', () => {
        expect(supporterTotal(100, { allIn: true, supporterRate: 12 })).toBeLessThan(100 * 1.13);
    });

    it('rounds UP, never down — rounding down would leave the creator short', () => {
        const exact = 4.99 * 1.12;
        const total = supporterTotal(4.99, { allIn: true, supporterRate: 12 });

        expect(total).toBeGreaterThanOrEqual(exact);
        expect(total - exact).toBeLessThan(0.01);
    });

    /**
     * ⚠️ A fractional yen is meaningless, and the gross-up would carry the
     * fraction into the supporter's total. Same rule as the legacy branch.
     */
    it('rounds to a whole unit for a zero-decimal currency', () => {
        const total = supporterTotal(1000, { allIn: true, supporterRate: 12, isZeroDecimal: true });

        expect(total).toBe(1120);
        expect(Number.isInteger(total)).toBe(true);
    });

    /**
     * 🚨 NO RATE ⇒ NO PRICE INVENTED. A page rendered without the `fees` prop
     * must not print a plausible wrong total on a buy button; the server bails
     * out the same way rather than charging a figure it cannot justify.
     */
    it('returns the listed amount when the server sent no rate', () => {
        expect(supporterTotal(100, { allIn: true, supporterRate: null })).toBe(100);
        expect(supporterTotal(100, { allIn: true })).toBe(100);
    });

    /** The flat supporter fee is off at launch, and the toggle is why it is read. */
    it('adds the flat supporter fee when one is configured', () => {
        expect(supporterTotal(100, { allIn: true, supporterRate: 12, fixedFee: 1 })).toBe(113.01);
    });

    /**
     * The whole point of spreading `feeRatesFor()` into this function: the model
     * travels with the rates, so a call site cannot pick the wrong formula.
     */
    it('takes its model straight from feeRatesFor', () => {
        const props = { fees: { all_in: true, rate: 12 }, custom_fee_rates: {} };

        expect(supporterTotal(100, { ...feeRatesFor(999, props), adminFee: 1 })).toBe(112.01);
    });
});
