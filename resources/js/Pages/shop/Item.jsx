import Guest from '@/Layouts/GuestLayout'
import { Head, Link, usePage } from '@inertiajs/react';
import BuyShopItem from './BuyShopItem';
import { RiDiscountPercentFill } from "react-icons/ri";
import { useState } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { useEffect } from 'react';
import { IoChevronBackOutline } from "react-icons/io5";
import axios from 'axios';
import AllContries from '../../includes/AllCountries';

export default function ShopDetailItem(props) {

   const { vat_percent, auth, user, shop, card_capabilities } = props;
   const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (shop && shop.user && shop && shop.user.username));
   const url = window.location.href;
   const [open, setOpen] = useState();

   useEffect(()=>{
      if(props.payment_id && props.opened == 0){
         setOpen(true);
         if(shop.success_page_type == 'url'){
            window.open((shop && shop.success_page_value), '_blank');
         }
      }
   },[]);

   const instashare = () => {
      const shareUrl = `https://www.instagram.com/?url=${encodeURIComponent(url)}&amp;text=${encodeURIComponent(shop.name)}`;
      window.open(shareUrl, '_blank');
   };
   const fbShare = () => {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&amp;quote=${encodeURIComponent(shop.name)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
   };
   const rssShare = () => {
      const shareUrl = `https://feedly.com/i/subscription/feed/${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
   };
   const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
   const { global_currency, turnstileSiteKey, platform_fee_percentage, transaction_fee_percentage } = usePage().props;

   // Helper to identify zero decimal currencies
   const isZeroDecimalCurrency = (curr) => {
       const zeroDecimalCurrencies = [
           'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
           'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
       ];
       return zeroDecimalCurrencies.includes(curr?.toUpperCase());
   };

   // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
   const calculateTotalSupporterPays = (basePrice, curr, vatPercent = 0, shopTaxRate = 20, shipping = 0) => {
       const price = parseFloat(basePrice || 0);
       const isZeroDecimal = isZeroDecimalCurrency(curr);
       const taxAmount = price * ((shopTaxRate || 20) / 100);
       const vatAmount = (price + taxAmount) * (vatPercent || 0) / 100;
       const listedPriceToGrossUp = price + taxAmount + vatAmount + (parseFloat(shipping || 0) || 0);

       // Constants must match backend configuration (Helpers.php)
       const stripeFeeRate = 0.029;
       const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
       const platformFeeRate = (platform_fee_percentage || 20) / 100; 
       const complianceFeeRate = (transaction_fee_percentage || 2) / 100; 
       const adminFee = adminFeeInCurrency(curr); 
       const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
       
       if (totalDeductionRate >= 1) return listedPriceToGrossUp;

       const totalSupporterPays = (listedPriceToGrossUp + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
       
       // Rounding logic to match backend (Helpers.php)
       if (!isZeroDecimal) {
           return Math.ceil(totalSupporterPays * 100) / 100;
       } else {
           return Math.ceil(totalSupporterPays);
       }
   };

   const isOwner = auth?.user?.id === shop?.user_id;
   const vatPercentage = shop?.user?.vat_amount_percentage || 0;

  const hasVariants = shop?.type === 'physical' && shop?.shop_varients && shop.shop_varients.length > 0;
  const [price, setPrice] = useState(hasVariants ? shop.shop_varients[0].price : shop.price);
  const [selectedVarient, setSelectedVarient] = useState(hasVariants ? shop.shop_varients[0].id : 'no_varient');
   const handleVarient = (e) => {
      const varient = shop.shop_varients.find(v => v.id == e.target.value);
      setPrice(varient.price);
      setSelectedVarient(varient.id);
   }

   const [currentCountry, setCurrentCountry] = useState();
   const getIp = async () => {
      try {
         const resp = await axios.get('/api/user-country');
         const code = resp.data?.country_code;
         if (code) {
            setCurrentCountry(code);
            getShippingPrice(code);
         }
      } catch (err) {
         // Silently fall back — shipping price will use default
         getShippingPrice('GB');
      }
   };


  const [shippingPrice, setShippingPrice] = useState(0);
  const getShippingPrice = (c) => {
   axios.get(`/shop/shipping-price/${shop.uuid}?country=${c}`).then((resp)=>{
      setShippingPrice(resp.data && resp.data.shipping_price);
   }).catch((err)=>{
      console.error("api err", err)
   });
  }

  useEffect(()=>{
   getIp();
  },[]); // run once on mount — shop.uuid won't change after render





  return (
    <>
      <Guest auth={auth.user} user={user}>
         <div className='bg-gray-200 min-h-screen' >
            <div className='container mx-auto px-4 m-auto' >
               <div className='py-6 md:py-14 max-w-[900px] m-auto' >
                  <Head title={shop.name || 'Spenny Piggy Shop'}  />
                  <div className="product-details max-w-[700px] px-2 mx-auto">


                     <button className='flex md:hidden items-center text-xl mb-4 ' onClick={()=>window.history.back()} ><span className='mt-1'><IoChevronBackOutline size="1.5rem" /></span> Back</button>
                     <nav className="hidden md:flex mb-4" aria-label="Breadcrumb">
                        <ol className="inline-flex flex-wrap items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                           <li className="inline-flex items-center">
                              <Link href={`/${shop.user && shop.user.username}`} className="inline-flex items-center text-base font-medium text-gray-700  ">
                                 {shop.user && shop.user.name}
                              </Link>
                           </li>
                           <li>
                              <div className="flex items-center">
                              <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                 <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                              </svg>
                              <p className="ml-1 text-base font-medium text-gray-700 md:ml-2">Shop</p>
                              </div>
                           </li>
                           <li aria-current="page">
                              <div className="flex items-center">
                              <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                 <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                              </svg>
                              <span className="ml-1 text-base font-medium text-gray-500 md:ml-2 dark:text-gray-400">{shop.name}</span>
                              </div>
                           </li>
                        </ol>
                     </nav>

                     <div className="w-full relative">
                        <img className="w-full max-h-[400px] object-cover rounded-[30px] " alt="image of a girl posing" src={shop.perma_link}/>
                        {shop.ai_generated == 1 ? <div className='absolute bottom-2 left-2 z-10 bg-black shadow-sm rounded-[30px]  px-2 py-1 text-[8px] text-white'>MADE WITH AI </div> : ""}
                     </div>

                     <h2 className='font-GillSans uppercase text-3xl pt-4 pb-3' >{shop.name}</h2>
                     <p className=" text-lg lg:leading-tight leading-normal text-gray-600">{shop.description}</p>

                     <p className=" text-base lg:leading-tight leading-normal text-black mt-3 mb-2">
                        Category : <span className='capitalize' >{shop?.category && shop.category.map((c, i)=>{
                           return `${c?.category?.category !== null ? c?.category?.category : ''} `
                        }) || 'Not Available'}</span>
                     </p>

                     {shop && shop.is_member == 0 && shop.special_member_price ? <div className='special-discount flex items-center bg-gray-100 border-gray-200 my-3 rounded-[30px]  px-1 py-2 '>
                        <div className='discount-tag w-[50px] h-[50px] mr-2' >
                           <RiDiscountPercentFill />
                        </div>
                        <div className='w-full pr-4 discount-text sm:flex items-center justify-between' >
                           <div className='pr-3'>
                              <h2 className='font-bold text-base' >Only {formatMultiPrice(shop.special_member_price, shop?.currency || 'GBP')} for members</h2>
                              <p className='mb-1 font-normal text-[13px]' >Become a member to get a discount and other exclusive benefits.</p>
                           </div>
                           <div className='py-2 ' >
                              <Link href={`/${shop.user && shop.user.username}`} className="button sm Join whitespace-nowrap" >Join Membership</Link>
                           </div>
                        </div>
                     </div> : ''}


                     <div className="w-full">
                        <div className="mb-1 mt-4 font-medium text-gray-500">Social</div>
                        <ul className="mb-4 -ml-2 flex md:order-1 md:mb-0">
                           <li>
                              <a
                              href={`https://twitter.com/intent/tweet?url=${url}`} target="_blank"
                               className=" break-words text-gray-500 inline-flex items-center rounded-[30px]   p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                 aria-label="Twitter" ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" className="h-7 w-7">
                                    <path
                                          d="M22 4.01c-1 .49 -1.98 .689 -3 .99c-1.121 -1.265 -2.783 -1.335 -4.38 -.737s-2.643 2.06 -2.62 3.737v1c-3.245 .083 -6.135 -1.395 -8 -4c0 0 -4.182 7.433 4 11c-1.872 1.247 -3.739 2.088 -6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58 -1.04 6.522 -3.723 7.651 -7.742a13.84 13.84 0 0 0 .497 -3.753c0 -.249 1.51 -2.772 1.818 -4.013z">
                                    </path>
                                 </svg>
                              </a>
                           </li>

                           <li>
                              <div onClick={instashare}
                               className="cursor-pointer text-gray-500 inline-flex items-center rounded-[30px]   p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                 aria-label="Instagram"  ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" className="h-7 w-7">
                                    <path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path>
                                    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                                    <path d="M16.5 7.5l0 .01"></path>
                                 </svg>
                              </div>
                           </li>

                           <li>
                              <div className="cursor-pointer text-gray-500 inline-flex items-center rounded-[30px]   p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                    aria-label="Facebook"
                                     onClick={fbShare}
                                     ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                       strokeLinejoin="round" className="h-7 w-7">
                                       <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3"></path>
                                    </svg>
                              </div>
                           </li>

                           <li>
                              <div className="cursor-pointer text-gray-500 inline-flex items-center rounded-[30px]   p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                 aria-label="RSS" onClick={rssShare}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" className="h-7 w-7">
                                    <path d="M5 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                    <path d="M4 4a16 16 0 0 1 16 16"></path>
                                    <path d="M4 11a9 9 0 0 1 9 9"></path>
                                 </svg>
                              </div>
                           </li>
                        </ul>
                     </div>

                     {shop.type === 'physical' && hasVariants ?
                        <>
                        <h2 className='text-lg mb-2'>Select Varient</h2>
                        <select onChange={handleVarient} className='bg-white rounded-[30px]  text-lg capitalize px-4 py-2.5 mb-3 w-full border-0'>
                           {shop.shop_varients && shop.shop_varients.map((varient) => <option value={varient.id}>{varient.name}</option>)}
                        </select>
                        </> : ""
                     }

                     <div className='sm:flex items-center justify-between' >
                        <div className=' mb-3'>
                           <h3 className='text-3xl font-bold flex flex-col' >
                              <div className="flex items-baseline">
                                 {shop && shop.is_member == 1 && shop.special_member_price ? <>
                                    {isOwner ? (
                                       formatMultiPrice(shop.special_member_price, shop?.currency || 'GBP')
                                    ) : (
                                       formatMultiPrice(
                                          calculateTotalSupporterPays(shop.special_member_price, shop?.currency || 'GBP', vatPercentage, 20, shop.type === 'physical' ? shippingPrice : 0),
                                          shop?.currency || 'GBP'
                                       )
                                    )} <span className='line-through text-gray-400 text-xl ml-2' >{price > 0 ? (isOwner ? formatMultiPrice(price, shop?.currency || 'GBP') : formatMultiPrice(calculateTotalSupporterPays(price, shop?.currency || 'GBP', vatPercentage, 20, shop.type === 'physical' ? shippingPrice : 0), shop?.currency || 'GBP')) : "FREE"}</span>
                                 </>
                                 : price > 0 ? (
                                    isOwner ? (
                                       formatMultiPrice(price, shop?.currency || 'GBP')
                                    ) : (
                                       formatMultiPrice(
                                          calculateTotalSupporterPays(price, shop?.currency || 'GBP', vatPercentage, 20, shop.type === 'physical' ? shippingPrice : 0),
                                          shop?.currency || 'GBP'
                                       )
                                    )
                                 ) : "Free"
                                 }
                                 {shop.slot_limitation ? <span className='ml-3 text-pink text-lg font-light ' >Only {shop.slot_limitation - shop.total_sold} Left</span> :""}
                              </div>
                              {!isOwner && price > 0 && (
                                 <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                                    * Includes all applicable fees
                                 </span>
                              )}
                           </h3>
                           {shop.type === 'physical' ? <h2 className='mt-1'>
                              Shipping Price : {formatMultiPrice(shippingPrice, shop?.currency || 'GBP')}</h2>
                           : ''}
                        </div>

                        { IsloggedIn ?
                           ""
                           :
                           <>
                              {(shop.slot_limitation && (shop.slot_limitation - shop.total_sold) === 0 ) ?
                                 <button className='btn-pink sm disabled w-full sm:w-auto' >SOLD</button>
                                 :
                              <>
                                 <BuyShopItem card_capabilities={card_capabilities} shippingPrice={shippingPrice} country={currentCountry} selectedVarient={selectedVarient} vat_percent={vat_percent} opened={props.opened} isPaid={props.payment_id} open={open} s={shop} text={'Get This'} classes="w-full sm:w-auto btn-pink font-light md  mb-3" />
                              </>
                              }
                           </>
                        }
                     </div>

                  </div>
            </div>
            </div>
         </div>
      </Guest>
    </>
  )
}