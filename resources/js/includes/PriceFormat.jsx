import { usePage } from "@inertiajs/react";
import { feeRatesFor, isAllIn, STRIPE_FEE_RATE, STRIPE_FIXED_FEE } from "@/utils/pricing";

export default function PriceFormat() {
    // ✅ Hook called at top level (LEGAL)
    const pageProps = usePage().props;
    const { rates, global_currency, currencies, platform_fee_percentage, transaction_fee_percentage } = pageProps;

    /*
     * 🚨 THE £1 ADMINISTRATION FEE IS ZERO UNDER THE ALL-IN MODEL (11 Sep 2026,
     * client §2: "No separate £1 fee at launch"). The server stopped charging it
     * the same day — `Helpers::calculateStripeDirectChargeFlow` sets `$adminFee = 0`
     * whenever the all-in model is live — so a client mirror that still adds it
     * quotes every supporter a pound more than their card is debited.
     *
     * ⚠️ The helper SURVIVES rather than being deleted: `config/payments.php` can
     * still be switched back to `legacy_markup`, and the legacy formula needs it.
     * Under all-in it answers 0, so a caller that renders an "Admin fee" row draws
     * nothing rather than erroring.
     */
    const adminFeeInCurrency = (currency) => {
        if (isAllIn(pageProps)) {
            return 0;
        }

        const upCurrency = (currency || "GBP").toUpperCase();
        const rate = rates?.[upCurrency];
        const digits = currencies?.[upCurrency]?.ISOdigits ?? 2;
        const fee = upCurrency === "GBP" ? 1 : Number(rate);
        const safeFee = !fee || !isFinite(fee) || fee <= 0 ? 1 : fee;
        return Number(Number(safeFee).toFixed(digits));
    };

    /**
     * The flat supporter fee (`FeeModel::fixedFee`) converted into the charge
     * currency — zero at launch, and the toggle is why it is read rather than
     * assumed away.
     *
     * ⚠️ The shared `fees` prop is `FeeModel::describe('card')`, i.e. the GBP
     * figure, so the conversion has to happen here where the `rates` table is.
     * Same conversion the administration fee used, for the same reason.
     */
    const supporterFixedFee = (currency) => {
        const gbp = Number(pageProps?.fees?.fixed_fee ?? 0);

        if (!isFinite(gbp) || gbp <= 0) {
            return 0;
        }

        const upCurrency = (currency || global_currency || "GBP").toUpperCase();
        const digits = currencies?.[upCurrency]?.ISOdigits ?? 2;

        if (upCurrency === "GBP") {
            return Number(gbp.toFixed(digits));
        }

        const rate = Number(rates?.[upCurrency]);

        // An unknown rate must not silently drop the fee on one currency and
        // charge it on another — fall back to the GBP figure, as the server does.
        const converted = !rate || !isFinite(rate) || rate <= 0 ? gbp : gbp * rate;

        return Number(converted.toFixed(digits));
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
     * 🚨 THIS MIRRORS `Helpers::calculateStripeDirectChargeFlow` AND MUST FOLLOW IT
     * THROUGH BOTH MODELS. Under **all-in** (11 Sep 2026) the supporter pays the
     * listed price plus ONE advertised percentage and Stripe is paid from inside
     * it — there is no gross-up to solve and no £1 administration fee. Under the
     * **legacy markup** the three rates are grossed up together, which is what
     * this used to do unconditionally.
     *
     * ⚠️ The breakdown keeps EVERY key it had. Several surfaces read
     * `application_fee` / `compliance_fee` / `admin_fee`, and dropping one under
     * all-in would render `undefined` rather than a zero.
     *
     * @param {number|string|null} creatorId  the listing owner — REQUIRED for any
     *   creator on a bespoke rate, or this quotes the standard price while
     *   checkout charges theirs.
     */
    const calculateTotalSupporterPays = (price, currency = 'GBP', reserveRate = 0, creatorId = null) => {
        const listedPrice = parseFloat(price) || 0;
        const upCurrency = (currency || global_currency || "GBP").toUpperCase();
        const targetCurrency = currencies?.[upCurrency];
        const isZeroDecimal = targetCurrency?.ISOdigits === 0;
        const precision = isZeroDecimal ? 0 : 2;

        // Stripe fees. ⚠️ Under all-in these no longer MOVE the supporter's total;
        // they only say how much of the one fee the processor took.
        const stripeFeeRate = STRIPE_FEE_RATE;
        const stripeFixedFee = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;

        // Per creator, falling back to the global props. The model travels with
        // the rates so this cannot pick the wrong formula.
        const rates = feeRatesFor(creatorId, pageProps);

        const ceilTo = (value) => (isZeroDecimal ? Math.ceil(value) : Math.ceil(value * 100) / 100);

        if (rates.allIn) {
            const supporterRate = Number(rates.supporterRate);

            // No rate from the server ⇒ do not invent a price. The server bails
            // out the same way rather than charging a figure it cannot justify.
            if (!isFinite(supporterRate) || supporterRate < 0) {
                return {
                    listed_price: listedPrice,
                    platform_fee: 0,
                    compliance_fee: 0,
                    admin_fee: 0,
                    supporter_fee: 0,
                    supporter_rate: null,
                    reserve_amount: 0,
                    application_fee: 0,
                    stripe_fee: 0,
                    total_supporter_pays: listedPrice,
                    net_to_creator: listedPrice,
                };
            }

            const fixedFee = supporterFixedFee(upCurrency);
            const totalSupporterPays = ceilTo(listedPrice * (1 + supporterRate / 100) + fixedFee);

            const actualStripeFee = Number(((totalSupporterPays * stripeFeeRate) + stripeFixedFee).toFixed(precision));

            // Whatever is left after the creator and the processor. Clamped at
            // zero for the same reason the server clamps it: below
            // FeeModel::minimumSellable() the fixed component outruns the whole
            // percentage and the platform absorbs the shortfall.
            const platformFee = Math.max(
                0,
                Number((totalSupporterPays - listedPrice - actualStripeFee).toFixed(precision))
            );

            const reserveAmount = reserveRate > 0
                ? Number(((listedPrice * reserveRate) / 100).toFixed(precision))
                : 0;

            return {
                listed_price: listedPrice,
                platform_fee: platformFee,
                // Folded into the one advertised rate — there is no second line,
                // which is the whole point of "all-in".
                compliance_fee: 0,
                admin_fee: 0,
                // The ONE figure a supporter-facing breakdown should show.
                supporter_fee: Number((totalSupporterPays - listedPrice).toFixed(precision)),
                supporter_rate: supporterRate,
                reserve_amount: reserveAmount,
                application_fee: platformFee,
                stripe_fee: actualStripeFee,
                total_supporter_pays: totalSupporterPays,
                net_to_creator: Number((totalSupporterPays - actualStripeFee - platformFee).toFixed(precision)),
            };
        }

        const platformFeeRate = rates.platform / 100;
        const complianceFeeRate = rates.compliance / 100;

        // Admin fee in target currency (legacy only — zero under all-in)
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

        const totalSupporterPays = ceilTo((listedPrice + stripeFixedFee + adminFee) / (1 - totalDeductionRate));

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
            supporter_fee: Number((totalSupporterPays - listedPrice).toFixed(precision)),
            supporter_rate: null,
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
     * @param {boolean} adminfee  🚨 IGNORED UNDER THE ALL-IN MODEL — there is no
     *   £1 administration fee to add (client §2, 11 Sep 2026), and adding one here
     *   would print a total a pound above what the checkout charges. No caller in
     *   `resources/js` passes it today; the parameter survives only so the legacy
     *   model keeps working if `config/payments.php` is switched back.
     * @return {string}
     */
    const formatMultiPrice = (amount, currency, adminfee) => {
        adminfee = adminfee && !isAllIn(pageProps);

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

            /*
             * LEGACY ONLY — `adminfee` is forced false under the all-in model
             * above, and no caller in `resources/js` passes it at all today.
             *
             * The fee was a flat £1, so a non-GBP charge needs the GBP rate for
             * that currency rather than the literal 1. (The three lines of
             * thinking-aloud that used to sit here, and a `finalAdminFee`
             * computed and then never used, are replaced by this note.)
             */
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
        supporterFixedFee,
        formatMultiPrice,
        usdtogbp,
        calculateTotalSupporterPays,
    };
}
