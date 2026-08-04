import { usePage } from "@inertiajs/react";
import { feeRatesFor } from "@/utils/pricing";

export default function PriceFormat() {
    // ✅ Hook called at top level (LEGAL)
    const pageProps = usePage().props;
    const { rates, global_currency, currencies, platform_fee_percentage, transaction_fee_percentage } = pageProps;

    const adminFeeInCurrency = (currency) => {
        const upCurrency = (currency || "GBP").toUpperCase();
        const rate = rates?.[upCurrency];
        const digits = currencies?.[upCurrency]?.ISOdigits ?? 2;
        const fee = upCurrency === "GBP" ? 1 : Number(rate);
        const safeFee = !fee || !isFinite(fee) || fee <= 0 ? 1 : fee;
        return Number(Number(safeFee).toFixed(digits));
    };

    /**
     * Calculate what the supporter actually pays (Gross-up logic)
     * 
     * @param {number} price The base price the creator wants to receive
     * @param {string} currency The currency of the transaction
     * @param {number} reserveRate Optional reserve rate (percentage)
     * @returns {object} Breakdown of fees and total
     */
    /**
     * @param {number|string|null} creatorId  the listing owner — REQUIRED for any
     *   creator on a bespoke platform rate, or this quotes the standard price
     *   while checkout charges theirs.
     */
    const calculateTotalSupporterPays = (price, currency = 'GBP', reserveRate = 0, creatorId = null) => {
        const listedPrice = parseFloat(price) || 0;
        const upCurrency = (currency || global_currency || "GBP").toUpperCase();
        const targetCurrency = currencies?.[upCurrency];
        const isZeroDecimal = targetCurrency?.ISOdigits === 0;
        
        // Stripe fees
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
        
        // Platform fees — per creator, falling back to the global props.
        const rates = feeRatesFor(creatorId, pageProps);
        const platformFeeRate = rates.platform / 100;
        const complianceFeeRate = rates.compliance / 100;
        
        // Admin fee in target currency
        const adminFee = adminFeeInCurrency(upCurrency);

        // Gross-up formula
        const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
        
        if (totalDeductionRate >= 1) {
            return {
                total_supporter_pays: listedPrice,
                net_to_creator: listedPrice,
                application_fee: 0,
                stripe_fee: 0
            };
        }

        let totalSupporterPays = (listedPrice + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        
        // Rounding
        if (!isZeroDecimal) {
            totalSupporterPays = Math.ceil(totalSupporterPays * 100) / 100;
        } else {
            totalSupporterPays = Math.ceil(totalSupporterPays);
        }
        
        const precision = isZeroDecimal ? 0 : 2;
        const actualStripeFee = Number(((totalSupporterPays * stripeFeeRate) + stripeFixedFee).toFixed(precision));
        
        const platformFee = Number((totalSupporterPays * platformFeeRate).toFixed(precision));
        const complianceFee = Number((totalSupporterPays * complianceFeeRate).toFixed(precision));
        let applicationFee = platformFee + complianceFee + adminFee;

        // Reserve — metadata only, NOT added to applicationFee
        // Reserve stays in creator's connected account, withheld at payout time
        let reserveAmount = 0;
        if (reserveRate > 0) {
            reserveAmount = Number(((listedPrice * reserveRate) / 100).toFixed(precision));
        }

        return {
            listed_price: listedPrice,
            platform_fee: platformFee,
            compliance_fee: complianceFee,
            admin_fee: adminFee,
            reserve_amount: reserveAmount,
            application_fee: applicationFee,
            stripe_fee: actualStripeFee,
            total_supporter_pays: totalSupporterPays,
            net_to_creator: Number((totalSupporterPays - actualStripeFee - applicationFee).toFixed(precision))
        };
    };

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

        // 🚀 Optimization: If currencies match, skip all conversion logic
        if (upCurrency === upGlobalCurrency) {
            const final = amount;
            const finalAdminFee = adminfee ? 1 : 0; // Admin fee is 1 in native GBP, but wait...
            
            // Wait, if it's native currency, admin fee might need conversion if it's not GBP
            // Actually, the admin fee is fixed £1.00. 
            // If the transaction is in EUR, we need the EUR equivalent of £1.00.
            
            let totalAmount = final;
            if (adminfee) {
                const adminFeeInNative = upCurrency === "GBP" ? 1 : (rates?.[upCurrency] || 1);
                totalAmount += adminFeeInNative;
            }

            const targetCurrency = currencies?.[upCurrency];
            const decimalPlaces = targetCurrency?.ISOdigits ?? 2;

            return new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: upCurrency,
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            }).format(totalAmount);
        }

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
        adminFeeInCurrency,
        formatMultiPrice,
        usdtogbp,
        calculateTotalSupporterPays,
    };
}
