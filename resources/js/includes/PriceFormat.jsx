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
        const { rates, global_currency } = usePage().props;
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const up_global_currency = global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate;

        const final = gbpamount*rates[up_global_currency || 'GBP'];
        const finaladminfee = adminfee ? 1*rates[up_global_currency || 'GBP'] : 0;
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: global_currency || 'GBP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(final+finaladminfee);
    }

    const usdtogbp = (amount, currency) => {
        const { rates, global_currency } = usePage().props;
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate;
        return gbpamount
    }

    return {formatMultiPrice, usdtogbp}
}
