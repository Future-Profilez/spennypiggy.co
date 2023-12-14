import { usePage } from "@inertiajs/react";

export default function PriceFormat(){

   const format = ( amount ) => {
      const formattedPrice = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return formattedPrice
    };

    /**
     * Format the Price in Multi-currency and Exchange Rate
     *
     * @param   {any}   amount Price Amount
     * @param   {string} currency Price Currency
     * @return {string}
     */
    const formatMultiPrice = (amount, currency = 'GBP') => {
        const {rates, global_currency} = usePage().props;
        // console.log('Global', global_currency);
        if(rates[currency] || false){
            const toGBP = rates[currency] * amount;
            const toGlobal = toGBP * rates[global_currency];

            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: global_currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(toGlobal);
        }
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    return {format, formatMultiPrice}
}
