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

describe('feeRatesFor', () => {
    it('returns the standard rates for a creator with no agreement', () => {
        expect(feeRatesFor(999, PROPS)).toEqual({
            platform: 17,
            compliance: 2,
            isCustom: false,
        });
    });

    it('returns the bespoke platform rate per payment method', () => {
        expect(feeRatesFor(134, PROPS, 'card')).toEqual({
            platform: 12,
            compliance: 2,
            isCustom: true,
        });

        expect(feeRatesFor(134, PROPS, 'bank')).toEqual({
            platform: 8,
            compliance: 2,
            isCustom: true,
        });
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
            .toEqual({ platform: 17, compliance: 2, isCustom: false });

        expect(feeRatesFor(null, {})).toEqual({ platform: 17, compliance: 2, isCustom: false });
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
