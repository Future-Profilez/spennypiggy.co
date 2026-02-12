import { usePage } from "@inertiajs/react";

export default function PriceFormat() {
    // ✅ Hook called at top level (LEGAL)
    const { rates, global_currency, currencies } = usePage().props;

    /**
     * Format the Price in Multi-currency and Exchange Rate
     *
     * @param {number} amount
     * @param {string} currency
     * @param {boolean} adminfee
     * @return {string}
     */
    const formatMultiPrice = (amount, currency, adminfee) => {
        // Input validation
        if (
            amount === null ||
            amount === undefined ||
            isNaN(amount) ||
            !isFinite(amount)
        ) {
            amount = 0;
        }

        const upCurrency =
            currency?.toUpperCase() || global_currency?.toUpperCase() || "GBP";

        const upGlobalCurrency = global_currency?.toUpperCase() || "GBP";

        const conversion_rate = rates?.[upCurrency];

        // ❗ Fallback if conversion rate is invalid
        if (
            !conversion_rate ||
            !isFinite(conversion_rate) ||
            conversion_rate === 0
        ) {
            const final = amount;
            const finalAdminFee = adminfee ? 1 : 0;

            return new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: global_currency || "GBP",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(final + finalAdminFee);
        }

        // Convert to GBP base
        const gbpAmount = amount / conversion_rate;

        if (!isFinite(gbpAmount)) {
            return new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: global_currency || "GBP",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(0);
        }

        // Convert GBP to target currency
        const targetRate = rates?.[upGlobalCurrency] || 1;
        const final = gbpAmount * targetRate;
        const finalAdminFee = adminfee ? targetRate : 0;

        const totalAmount = final + finalAdminFee;

        if (!isFinite(totalAmount)) {
            return new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: global_currency || "GBP",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(0);
        }

        // Currency decimal places
        const targetCurrency = currencies?.[upGlobalCurrency];
        const decimalPlaces = targetCurrency?.ISOdigits ?? 2;

        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: global_currency || "GBP",
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(totalAmount);
    };

    /**
     * Convert USD to GBP
     *
     * @param {number} amount
     * @return {number}
     */
    const usdtogbp = (amount) => {
        if (!amount || !rates?.USD) return 0;
        return amount / rates.USD;
    };

    return {
        formatMultiPrice,
        usdtogbp,
    };
}
