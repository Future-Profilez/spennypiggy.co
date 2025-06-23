import { usePage } from "@inertiajs/react";

export default function PriceFormat(){

    /**
     * Format the Price in Multi-currency and Exchange Rate
     *
     * @param   {any}   amount Price Amount
     * @param   {string} currency Price Currency
     * @return {string}
     */

    const adminFees = (currency) => {
        const { rates, global_currency } = usePage().props;
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const up_global_currency = global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = 1;
        const final = gbpamount*rates[up_global_currency || 'GBP']
        return new Intl.NumberFormat('en-GB', {
            currency: global_currency || 'GBP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(final);
    }

    const formatMultiPrice = (amount, currency, adminfee) => {
        const { rates, global_currency } = usePage().props;
        const upCorrency = currency && currency.toUpperCase() || global_currency && global_currency.toUpperCase();
        const up_global_currency = global_currency && global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate;
        console.log("gbpamount", gbpamount)
        const afterAdminfee  = adminfee ? (parseInt(gbpamount+1)) : gbpamount;
        const final = afterAdminfee*rates[up_global_currency || 'GBP'];
        console.log("final",final);
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: global_currency || 'GBP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(final);
    }
    return {formatMultiPrice }
}
