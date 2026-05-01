import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import userdefaultphoto from '../../../../assets/siteicon.png';
import { TimeFormat } from '@/includes/TimeFormat';
import { Menu, Transition } from '@headlessui/react'
import { HiDotsVertical } from "react-icons/hi";
import OrderDetail from './OrderDetail';


export default function OrdersLists({ type = 'sales' }) {
   const slug = (inputString) => {
      return inputString
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
   }
   const { global_currency, auth, user, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
   const [orderloading, setOrderLoading] = useState(false);
   const [orders, setOrders] = useState([]);

   const [allEarning, setAllEarning] = useState(0);
   const [monthEarning, setmonthEarning] = useState(0);
   const [claims, setclaims] = useState(0);

   const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();

   const isZeroDecimalCurrency = (curr) => {
       const zeroDecimalCurrencies = [
           'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
           'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
       ];
       return zeroDecimalCurrencies.includes(curr?.toUpperCase());
   };

   const calculateTotalSupporterPays = (price, curr) => {
       const listedPrice = parseFloat(price || 0);
       const isZeroDecimal = isZeroDecimalCurrency(curr);
       
       const stripeFeeRate = 0.029;
       const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
       const platformFeeRate = (platform_fee_percentage || 17) / 100; 
       const complianceFeeRate = (transaction_fee_percentage || 2) / 100; 
       const adminFee = adminFeeInCurrency(curr); 
       const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
       
       if (totalDeductionRate >= 1) return listedPrice;

       const totalSupporterPays = (listedPrice + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
       
       if (!isZeroDecimal) {
           return Math.ceil(totalSupporterPays * 100) / 100;
       } else {
           return Math.ceil(totalSupporterPays);
       }
   };

   const fetchorders = () =>{
      setOrderLoading(true);
        axios.get(`/shop/orders-list?type=${type}`)
       .then(res =>{
         setOrders(res.data.orders);
         setAllEarning(res.data.all_time);
         setmonthEarning(res.data.thirtydays);
         setclaims(res.data.total_claims);
         setOrderLoading(false);
        })
       .catch(err =>{
            console.log(err);
            setOrderLoading(false);
        });
   }

   useEffect(()=>{
      fetchorders();
   }, [type]);

  return <>

      {!orderloading ?
      <>

      {type === 'sales' && (
      <div className='grid md:grid-cols-3 gap-4 mb-6 ' >
         <div className='bg-white p-4 text-black rounded-[30px] ' >
            <h2 className='font-bold text-2xl' >{claims}</h2>
            <p className='text-gray-500'>Claims</p>
         </div>
         <div className='bg-white p-4 text-black rounded-[30px] ' >
            <h2 className='font-bold text-2xl' >{formatMultiPrice(monthEarning, global_currency)}</h2>
            <p className='text-gray-500'>Last 30 Days</p>
         </div>
         <div className='bg-white p-4 text-black rounded-[30px] ' >
            <h2 className='font-bold text-2xl' >{formatMultiPrice(allEarning, global_currency)}</h2>
            <p className='text-gray-500'>All Time</p>
         </div>
      </div>
      )}

      {type === 'sales' ? <h2 className='font-GillSans uppercase text-xl mb-3 pt-3' >Recent Claims</h2> : <h2 className='font-GillSans uppercase text-xl mb-3 pt-3' >My Purchases</h2>}
      
      {orders && orders.length > 0 && (
         <div  className="bg-white rounded-[30px]   px-0">
            <div className="p-3 py-1 relative ">
               {orders.map((item, index) =>
                  <div key={index} className={`flex justify-between ${index > 0 ? "border-t" : "" } py-3 w-full items-center`}>
                     <Link href={`/${item.username}`} className="flex w-30">
                        <div className="p-relative flex-shrink-0">
                              <img className="border border-gray-200 h-12 w-12 min-w-12 min-h-12 rounded-[30px]  object-cover" src={item.avatar_url || userdefaultphoto} alt='user' />
                        </div>
                        <div className=" ml-3 w-full w-[40%] flex-vert-center">
                           <div>
                                 <div className="text-sm text-dark font-cr-medium flex bmc-pp bmc-pp-sm grey-pp-color">
                                    <span className="limit-text-line-2">
                                     {item.name}
                                    </span>
                                 </div>
                                 <div className='hidden md:block '>
                                    <div className="text-break line-clamp-1 text-sm font-cr-regular text-[#666666] W-95">
                                       {item.email}
                                    </div>
                                 </div>
                                 <div className="block md:hidden">
                                    <div className="text-break line-clamp-1 text-sm font-cr-regular text-[#666666] W-95">
                                       {item.shop.name}
                                    </div>
                                 </div>
                           </div>
                        </div>
                     </Link>
                     <div className="hidden md:block w-40 flex pd-l-16 flex-vert-center">
                        <Link href={`/shop/item/${slug(item.shop.name)}/${item.shop.uuid}`} className=" text-dark  text-sm  font-cr-regular  flex">
                           <span className="limit-text-line-1 leading-4  max-w-60  mr-3">{item.shop.name || ""}</span>
                        </Link>
                     </div>
                     <div className=" flex flex-vert-center flex-col items-end">
                        <div className=" text-dark  font-cr-medium  text-sm  block  leading-4">
                           {item && item.amount ? (
                              type === 'sales' ? (
                                 <> {formatMultiPrice((item.amount), item?.currency || 'GBP') }</>
                              ) : (
                                 <> {formatMultiPrice(calculateTotalSupporterPays(parseFloat(item.amount) + parseFloat(item.shipping_amount || 0) + parseFloat(item.tax_amount || 0) + parseFloat(item.vat_tax_amount || 0), item?.currency || 'GBP'), item?.currency || 'GBP') }</>
                              )
                           ) : "FREE"}
                        </div>
                        {type === 'sales' && item && parseFloat(item.shipping_amount || 0) > 0 && (
                           <div className="text-[11px] text-gray-500 mt-1">
                              + {formatMultiPrice(item.shipping_amount, item?.currency || 'GBP')} shipping
                           </div>
                        )}
                        {type === 'purchases' && item && (parseFloat(item.amount) > 0 || parseFloat(item.shipping_amount || 0) > 0) && (
                           <div className="text-[10px] text-gray-400 mt-1">
                              Includes fees & shipping
                           </div>
                        )}
                        {item.shop?.type === 'physical' && (
                           <div className="mt-1">
                              {item.status === 'delivered' ? (
                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completed</span>
                              ) : item.status === 'shipped' ? (
                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Shipped</span>
                              ) : item.status === 'processing' ? (
                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Processing</span>
                              ) : item.is_delayed ? (
                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Delayed</span>
                              ) : (
                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                              )}
                           </div>
                        )}
                     </div>
                     <div className="flex justify-between items-center">
                        <div className=" text-[#4d4d4d] text-sm hidden lg:block pb-2 me-2">
                            <TimeFormat dateString={item.created_at} />
                        </div>
                        <OrderDetail date={<TimeFormat dateString={item.created_at} />} item={item} text={'View Info'} classes="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-[20px] text-sm font-medium" onSuccess={fetchorders} />
                     </div>
               </div>
            )}
         </div>
      </div>
      )}
      </>
      : ''}

      {orderloading ? <LoadingScreen /> : "" }
      {!orderloading && orders.length < 1 ? <Nocontent bg="none" text="Nothing to see" /> : ""}

      <style>{`
         .dropdown-menu .drop-icon-text svg path{fill:none;}
         .border-bottom-1{border-bottom:1px solid #e5e5e5;}
         .drop-more-opt:hover .icon-bg-new{width:24px;height:24px;left:calc(50% - 12px);top:-2px;border-radius:40px;background-color:rgba(0,0,0,0.05);}
         .dropdown-menu.dropdown-anim #viewInfoTransaction svg path,.dropdown-menu.dropdown-anim #send_single_message svg path{stroke:#717171 !important;}
         .dropdown-menu.dropdown-anim .dont-open-modal svg path{fill:#717171 !important;}
         .dropdown-menu.dropdown-anim #viewInfoTransaction:hover svg path,.dropdown-menu.dropdown-anim #send_single_message:hover svg path{stroke:#222 !important;}
         .dropdown-menu.dropdown-anim .dont-open-modal:hover svg path{fill:#222 !important;}
      `}</style>

  </>
}
