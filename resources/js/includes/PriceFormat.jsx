import { usePage } from "@inertiajs/react";

export default function PriceFormat(){

    /**
     * Format the Price in Multi-currency and Exchange Rate
     *
     * @param   {any}   amount Price Amount
     * @param   {string} currency Price Currency
     * @return {string}
     */

    const formatMultiPrice = (amount, currency, adminfee) => {
        const { rates, global_currency, currencies } = usePage().props;
        
        // Input validation
        if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
            amount = 0;
        }
        
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const up_global_currency = global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        
        // Check for valid conversion rate
        if (!conversion_rate || isNaN(conversion_rate) || !isFinite(conversion_rate) || conversion_rate === 0) {
            console.warn('Invalid conversion rate for currency:', upCorrency, 'Rate:', conversion_rate);
            // Fallback to direct amount if conversion rate is invalid
            const final = amount;
            const finaladminfee = adminfee ? 1 : 0;
            
            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: global_currency || 'GBP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(final + finaladminfee);
        }
        
        const gbpamount = amount / conversion_rate;
        
        // Check for valid GBP amount
        if (isNaN(gbpamount) || !isFinite(gbpamount)) {
            console.warn('Invalid GBP amount calculated:', gbpamount, 'from amount:', amount, 'conversion_rate:', conversion_rate);
            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: global_currency || 'GBP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(0);
        }

        const final = gbpamount * rates[up_global_currency || 'GBP'];
        const finaladminfee = adminfee ? 1 * rates[up_global_currency || 'GBP'] : 0;
        
        // Final validation before formatting
        const totalAmount = final + finaladminfee;
        if (isNaN(totalAmount) || !isFinite(totalAmount)) {
            console.warn('Invalid final amount calculated:', totalAmount);
            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: global_currency || 'GBP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(0);
        }
        
        // Get decimal places from currency metadata, default to 2
        const targetCurrency = currencies?.[up_global_currency || 'GBP'];
        const decimalPlaces = targetCurrency?.ISOdigits ?? 2;
        
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: global_currency || 'GBP',
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(totalAmount);
    }


    const usdtogbp = (amount) => {
        const { rates  } = usePage().props;
        const conversion_rate = rates['USD'];
        return amount/conversion_rate;
    }
    return {formatMultiPrice, usdtogbp}
}
