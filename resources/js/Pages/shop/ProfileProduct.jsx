import PriceFormat from '@/includes/PriceFormat';
import { Link, usePage } from '@inertiajs/react'

export default function ProfileProduct({item}) {

   const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
   const { auth, platform_fee_percentage, transaction_fee_percentage } = usePage().props;

   // Helper to identify zero decimal currencies
   const isZeroDecimalCurrency = (curr) => {
       const zeroDecimalCurrencies = [
           'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
           'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
       ];
       return zeroDecimalCurrencies.includes(curr?.toUpperCase());
   };

   // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
   const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
       const listedPrice = parseFloat(price || 0);
       const isZeroDecimal = isZeroDecimalCurrency(curr);
       const vatAmount = listedPrice * (vatPercent || 0) / 100;
       const priceWithVat = listedPrice + vatAmount;

       // Constants must match backend configuration (Helpers.php)
       const stripeFeeRate = 0.029;
       const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
       const platformFeeRate = (platform_fee_percentage || 20) / 100; 
       const complianceFeeRate = (transaction_fee_percentage || 2) / 100; 
       const adminFee = adminFeeInCurrency(curr); 
       const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
       
       if (totalDeductionRate >= 1) return priceWithVat;

       const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
       
       // Rounding logic to match backend (Helpers.php)
       if (!isZeroDecimal) {
           return Math.ceil(totalSupporterPays * 100) / 100;
       } else {
           return Math.ceil(totalSupporterPays);
       }
   };

   const isCreator = auth?.user?.id === item?.user_id;
   const vatPercentage = item?.user?.vat_amount_percentage || 0;

   const slug = (inputString) => {
      return inputString
      .toLowerCase() // Convert the string to lowercase
      .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters except spaces and hyphens
      .trim() // Remove leading and trailing spaces
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
   }
   const url = `/shop/item/${slug(item.name)}/${item.uuid}`;

  return (
      <article className="max-w-sm w-full bg-white rounded-[30px]  overflow-hidden ">
         <div>
            <Link href={url} >
               <img className="object-cover h-[130px] sm:h-[200px] w-full" src={item.perma_link} alt="Converse sneakers" />
            </Link>
         </div>
         <Link href={url}  className="flex flex-col gap-1 mt-2 sm:mt-4 px-3 sm:px-4">
            <h2 className="text-sm line-clamp-1 sm:text-lg font-semibold text-black ">{item.name}</h2>
            <span className="text-[13px] sm:text-normal font-normal text-gray-600 line-clamp-2">{item.description}</span>
         </Link>
         <div className="mt-2 sm:mt-4 p-3 sm:p-4 border-t flex flex-col border-gray-200">
            <div className="flex justify-between items-center">
               <h2 className='font-bold text-sm sm:text-xl' >
                  {isCreator ? (
                     formatMultiPrice(item.price, item?.currency || 'GBP')
                  ) : (
                     formatMultiPrice(
                        calculateTotalSupporterPays(item.price, item?.currency || 'GBP', vatPercentage),
                        item?.currency || 'GBP'
                     )
                  ) || "FREE"}
               </h2>
               <button className=" font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg">
                   Buy Now
               </button>
            </div>
            {!isCreator && item.price > 0 && (
               <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                  * Includes all applicable fees
               </span>
            )}
         </div>
      </article>
  )
}
