import { usePage } from "@inertiajs/react";
function PriceFormat() {
  const format = (amount, currency = "GBP") => {
    const { rates, global_currency } = usePage().props;
    const upCorrency = currency.toUpperCase();
    if (global_currency && rates[upCorrency] || false) {
      const toGBP = rates[upCorrency] * amount;
      const toGlobal = toGBP * rates[global_currency];
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: global_currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(toGlobal);
    }
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  const formatMultiPrice = (amount, currency = "GBP") => {
    const { rates, global_currency } = usePage().props;
    const upCorrency = currency.toUpperCase();
    if (global_currency && rates[upCorrency] || false) {
      const toGBP = rates[upCorrency] * amount;
      const toGlobal = toGBP * rates[global_currency];
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: global_currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(toGlobal);
    }
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  return { format, formatMultiPrice };
}
export {
  PriceFormat as P
};
