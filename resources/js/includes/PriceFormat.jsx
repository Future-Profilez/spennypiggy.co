import { usePage } from "@inertiajs/react";

export default function PriceFormat(){

    /**
     * Format the Price in Multi-currency and Exchange Rate
     *
     * @param   {any}   amount Price Amount
     * @param   {string} currency Price Currency
     * @return {string}
     */

    const formatMultiPrice = (amount, currency = 'GBP') => {

        const { rates, global_currency } = usePage().props;

        const upCorrency = currency.toUpperCase();
        const up_global_currency = global_currency.toUpperCase();
        const conversion_rate = rates[upCorrency];
        const gbpamount  = amount/conversion_rate
        const final = gbpamount*rates[up_global_currency]

        // if(global_currency && rates[upCorrency] || false){
        //     const toGBP = rates[upCorrency] * amount;
        //     const toGlobal = toGBP * rates[global_currency];
        //     return new Intl.NumberFormat('en-GB', {
        //         style: 'currency',
        //         currency: global_currency,
        //         minimumFractionDigits: 2,
        //         maximumFractionDigits: 2,
        //     }).format(toGlobal);
        // }

        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: global_currency || 'GBP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(final);
    }

    return {formatMultiPrice }
}
