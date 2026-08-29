import { feeGaps, payRatio } from '../../resources/js/Pages/creators/feeGap';

/**
 * The comparison pages' cost difference.
 *
 * These pages promise that every figure of ours is what the checkout charges and
 * every figure of theirs came from their own site on a stated date. The
 * difference between the two is the one number on the page that is neither — it
 * is derived — so it is the one that most needs pinning.
 */
describe('payRatio', () => {
    it('is what a supporter pays per unit the creator receives', () => {
        expect(payRatio(27.45, 20)).toBeCloseTo(1.3725, 4);
        expect(payRatio(23.11, 20)).toBeCloseTo(1.1555, 4);
    });

    /**
     * 🚨 A LINK PAGE QUOTES NO TOTAL, because it does not process the sale. A
     * ratio invented for it would be the single made-up figure on a page whose
     * whole claim is that there are none.
     */
    it('refuses to invent a ratio when a figure is missing', () => {
        expect(payRatio(undefined, 20)).toBeNull();
        expect(payRatio('Depends on where the button sends them', 20)).toBeNull();
        expect(payRatio(23.11, 0)).toBeNull();
        expect(payRatio(23.11, null)).toBeNull();
    });
});

describe('feeGaps', () => {
    const rails = [
        { key: 'card', rail: 'Card', ratio: payRatio(27.45, 20) },
        { key: 'bank', rail: 'Pay by Bank', ratio: payRatio(25.3, 20) },
    ];

    it('states the gap in our currency, on our example sale', () => {
        const gaps = feeGaps(rails, payRatio(23.11, 20), 20);

        expect(gaps).toHaveLength(2);
        expect(gaps[0].amount).toBeCloseTo(4.34, 2);
        expect(gaps[1].amount).toBeCloseTo(2.19, 2);
    });

    /**
     * 🚨 THE WHOLE POINT: no exchange rate is involved, so the answer cannot
     * drift with one. Their example is priced in USD and ours in GBP, and the
     * gap is the same either way because both sides pay the creator 20 of their
     * own unit.
     */
    it('does not depend on the currency either side is priced in', () => {
        const fromUsdExample = feeGaps(rails, payRatio(23.11, 20), 20);
        // The identical deal expressed in a unit worth ten times as much.
        const fromTenXExample = feeGaps(rails, payRatio(231.1, 200), 20);

        expect(fromTenXExample[0].amount).toBeCloseTo(fromUsdExample[0].amount, 6);
    });

    /**
     * 🚨 IT MUST FOLLOW OUR LIVE RATES. The acceptance criterion for this whole
     * build is that changing a rate in config/payments.php moves the figures on
     * these pages with no code change — a test against today's £4.34 would pass
     * just as happily with the number typed into the component.
     */
    it('moves when our own pricing moves', () => {
        const cheaper = [{ key: 'card', rail: 'Card', ratio: payRatio(24.0, 20) }];
        const dearer = [{ key: 'card', rail: 'Card', ratio: payRatio(30.0, 20) }];
        const theirs = payRatio(23.11, 20);

        expect(feeGaps(cheaper, theirs, 20)[0].amount).toBeLessThan(
            feeGaps(dearer, theirs, 20)[0].amount
        );
    });

    /** A competitor we are cheaper than reports a negative gap, not a hidden one. */
    it('reports a negative gap rather than suppressing it', () => {
        const gaps = feeGaps(
            [{ key: 'card', rail: 'Card', ratio: payRatio(21.0, 20) }],
            payRatio(23.11, 20),
            20
        );

        expect(gaps[0].amount).toBeLessThan(0);
    });

    it('compares nothing when the competitor quotes no figure', () => {
        expect(feeGaps(rails, null, 20)).toEqual([]);
    });

    it('compares nothing without a listed price to state it against', () => {
        expect(feeGaps(rails, payRatio(23.11, 20), 0)).toEqual([]);
    });

    /** An announced rail has no charge to compute, so it cannot carry a gap. */
    it('skips a rail with no ratio', () => {
        const withAnnounced = [
            ...rails,
            { key: 'stablecoin', rail: 'Stablecoin Tips', ratio: null },
        ];

        expect(feeGaps(withAnnounced, payRatio(23.11, 20), 20)).toHaveLength(2);
    });
});
