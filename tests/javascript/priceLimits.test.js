import {
    MAX_PRICE_GBP,
    formatPrice,
    fromGbp,
    priceLimitError,
    priceLimits,
    toGbp,
} from "@/lib/priceLimits";

// Units per GBP, same shape as the shared `rates` Inertia prop.
const RATES = { GBP: 1, USD: 1.3368, JPY: 212.0008, INR: 130.4786 };

describe("priceLimits", () => {
    it("leaves GBP on the raw figures", () => {
        const { min, max } = priceLimits("GBP", RATES, MAX_PRICE_GBP.membership);
        expect(min).toBe(4.99);
        expect(max).toBe(100);
    });

    it("converts the bounds into the creator's currency", () => {
        const { min, max } = priceLimits("JPY", RATES, MAX_PRICE_GBP.membership);
        expect(min).toBe(1058);
        expect(max).toBe(21200);
    });

    it("drops the decimals for a zero-decimal currency", () => {
        expect(priceLimits("JPY", RATES, MAX_PRICE_GBP.wish).step).toBe("1");
        expect(priceLimits("USD", RATES, MAX_PRICE_GBP.wish).step).toBe("0.01");
    });

    // The server rule is `priceGBP < 4.99` / `priceGBP > max`, so a value sitting
    // exactly on a displayed bound must still convert back inside the range.
    it("rounds the minimum up and the maximum down", () => {
        for (const iso of ["USD", "JPY", "INR"]) {
            const { min, max } = priceLimits(iso, RATES, MAX_PRICE_GBP.membership);
            expect(toGbp(min, iso, RATES)).toBeGreaterThanOrEqual(4.99);
            expect(toGbp(max, iso, RATES)).toBeLessThanOrEqual(100);
        }
    });

    it("falls back to the GBP figures when the rate is unknown", () => {
        const { min, max } = priceLimits("XYZ", RATES, MAX_PRICE_GBP.bill);
        expect(min).toBe(4.99);
        expect(max).toBe(100);
    });
});

describe("priceLimitError", () => {
    // The bug this file exists for: a JPY creator was refused at every price
    // because the form compared ¥ against the £ figures.
    it("accepts a JPY membership priced inside the converted range", () => {
        expect(priceLimitError(1500, "JPY", RATES, MAX_PRICE_GBP.membership)).toBeNull();
        expect(priceLimitError(21200, "JPY", RATES, MAX_PRICE_GBP.membership)).toBeNull();
    });

    it("still refuses a JPY price outside the converted range", () => {
        expect(priceLimitError(150, "JPY", RATES, MAX_PRICE_GBP.membership)).toMatch(/Minimum/);
        expect(priceLimitError(30000, "JPY", RATES, MAX_PRICE_GBP.membership)).toMatch(/Maximum/);
    });

    it("names the bound in the creator's own currency", () => {
        const err = priceLimitError(150, "JPY", RATES, MAX_PRICE_GBP.membership);
        expect(err).toContain(formatPrice(1058, "JPY"));
        expect(err).not.toContain("100");
    });

    it("appends the period label when one is given", () => {
        expect(
            priceLimitError(1, "GBP", RATES, MAX_PRICE_GBP.bill, { per: "per period" }),
        ).toBe("Minimum is £4.99 per period.");
    });

    it("asks for a price when the field is empty", () => {
        expect(priceLimitError("", "JPY", RATES, MAX_PRICE_GBP.membership)).toBe("Set a price.");
    });
});

describe("fromGbp", () => {
    it("rounds in the direction it is asked to", () => {
        expect(fromGbp(25, "JPY", RATES, "down")).toBe(5300);
        expect(fromGbp(25, "JPY", RATES, "up")).toBe(5301);
    });
});
