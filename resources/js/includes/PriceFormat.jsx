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

    return {format}
}