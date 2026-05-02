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
       const platformFeeRate = (platform_fee_percentage || 17) / 100; 
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

   // Get baseline shipping price for physical items
   let shippingPrice = 0;
   if (item.type === 'physical') {
       const shippingRates = item.shop_shipping_info || [];
       // Priority: "all" or "worldwide" (any case), otherwise first available
       const baselineRate = shippingRates.find(s => 
           s.country?.toLowerCase() === 'all' || 
           s.country?.toLowerCase() === 'worldwide'
       ) || shippingRates[0];
       
       shippingPrice = parseFloat(baselineRate?.shipping_price || 0);
   }

   const isCreator = auth?.user?.id === item?.user_id;
   const isMember = item?.is_member === 1;
   const vatPercentage = item?.user?.vat_amount_percentage || 0;

   // Choose base price: use special_member_price if user is a member
   const priceToUse = (isMember && item?.special_member_price) ? parseFloat(item.special_member_price) : parseFloat(item.price || 0);
   const basePriceWithShipping = priceToUse + shippingPrice;

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
            {isCreator && item.edited_status == 0 && (
               <div className='text-xs bg-red-50 text-red-800 p-2 rounded-lg mb-1 font-medium'>
                  Admin requested changes: {item.edited_reason}
               </div>
            )}
            <div className='flex items-center gap-2'>
               <h2 className="text-sm line-clamp-1 sm:text-lg font-semibold text-black ">{item.name}</h2>
               <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.type === 'physical' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {item.type === 'physical' ? 'Physical' : 'Digital'}
               </span>
            </div>
            <span className="text-[13px] sm:text-normal font-normal text-gray-600 line-clamp-2">{item.description}</span>
         </Link>
         <div className="mt-2 sm:mt-4 p-3 sm:p-4 border-t flex flex-col border-gray-200">
            <div className="flex justify-between items-center">
               <h2 className='font-bold text-sm sm:text-xl' >
                  {isCreator ? (
                     formatMultiPrice(priceToUse, item?.currency || 'GBP')
                  ) : (
                     isMember && item?.special_member_price ? (
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span>{formatMultiPrice(calculateTotalSupporterPays(basePriceWithShipping, item?.currency || 'GBP', vatPercentage), item?.currency || 'GBP')}</span>
                                <span className="line-through text-gray-400 text-sm">
                                    {formatMultiPrice(calculateTotalSupporterPays(parseFloat(item.price || 0) + shippingPrice, item?.currency || 'GBP', vatPercentage), item?.currency || 'GBP')}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 uppercase">Member Discount Applied</span>
                        </div>
                     ) : (
                        formatMultiPrice(
                           calculateTotalSupporterPays(basePriceWithShipping, item?.currency || 'GBP', vatPercentage),
                           item?.currency || 'GBP'
                        )
                     )
                  ) || "FREE"}
               </h2>
               <button className=" font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg">
                   Buy Now
               </button>
            </div>
            {!isCreator && item.price > 0 && (
               <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                  {item.type === 'physical' 
                    ? (shippingPrice > 0 ? "*Includes platform and payment processing fees and shipping" : "*Includes platform and payment processing fees. Free shipping.")
                    : "*Includes platform and payment processing fees"}
               </span>
            )}
         </div>
      </article>
  )
}
