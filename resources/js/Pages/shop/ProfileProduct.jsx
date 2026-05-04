import PriceFormat from '@/includes/PriceFormat';
import { Link, usePage } from '@inertiajs/react'

export default function ProfileProduct({item}) {

   const { formatMultiPrice, adminFeeInCurrency, calculateTotalSupporterPays } = PriceFormat();
   const { auth } = usePage().props;

   const isCreator = auth?.user?.id === item?.user_id;
   const vatPercentage = item?.user?.vat_amount_percentage || 0;
   const itemCurrency = (item?.currency || item?.user?.default_currency || "GBP").toUpperCase();
   const isDeactivated = Number(item?.status) === 0;

   // Get baseline shipping price for physical items
   const shippingPrice = item?.type === 'physical' ? (() => {
       const shippingRates = item?.shop_shipping_info || [];
       const baselineRate = shippingRates.find(s => 
           s.country?.toLowerCase() === 'all' || 
           s.country?.toLowerCase() === 'worldwide'
       ) || shippingRates[0];
       return parseFloat(baselineRate?.shipping_price || 0);
   })() : 0;

   const vatAmount = (parseFloat(item.price || 0) * vatPercentage) / 100;
   const basePriceToGrossUp = parseFloat(item.price || 0) + vatAmount + shippingPrice;

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
      <article className={`max-w-sm w-full bg-white rounded-[30px] overflow-hidden relative ${isDeactivated ? 'opacity-60 grayscale' : ''}`}>
         {isDeactivated && isCreator && (
            <div className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
               Deactivated
            </div>
         )}
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
                     formatMultiPrice(item.price, itemCurrency)
                  ) : (
                     formatMultiPrice(
                        calculateTotalSupporterPays(basePriceToGrossUp, itemCurrency).total_supporter_pays,
                        itemCurrency
                     )
                  ) || "FREE"}
               </h2>
               <button className=" font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg">
                   Buy Now
               </button>
            </div>
            
            {!isCreator && item.price > 0 && (
               <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                  *Includes platform and payment processing fees{item?.type === 'physical' ? (shippingPrice > 0 ? " and shipping" : ". Free shipping") : ""}
               </span>
            )}
         </div>
      </article>
  )
}
