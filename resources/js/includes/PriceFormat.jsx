import { usePage } from "@inertiajs/react";

export default function PriceFormat(){

    /**
     * Format the Price in Multi-currency and Exchange Rate
     *
     * @param   {any}   amount Price Amount
     * @param   {string} currency Price Currency
     * @return {string}
     */

    const formatMultiPrice = (amount, currency) => {

        const { rates, global_currency } = usePage().props;
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const up_global_currency = global_currency && global_currency.toUpperCase();
console.log("currency,global_currency ",amount, currency,global_currency)
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate;
        const final = gbpamount*rates[up_global_currency || 'GBP']
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: global_currency || 'GBP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(final);
    }

    return {formatMultiPrice }
}
