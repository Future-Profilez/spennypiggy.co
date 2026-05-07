import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import userdefaultphoto from '../../../../assets/siteicon.png';
import { TimeFormat } from '@/includes/TimeFormat';
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
   const { global_currency, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
   const [orderloading, setOrderLoading] = useState(false);
   const [orders, setOrders] = useState([]);
   const [userCurrency, setUserCurrency] = useState(global_currency);

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
         setUserCurrency(res.data.user_currency || global_currency);
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
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' >
         <div className='bg-white p-6 border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' >
            <h2 className='font-black text-3xl mb-1' >{claims}</h2>
            <p className='text-gray-700 font-bold uppercase text-sm tracking-wide'>Claims</p>
         </div>
         <div className='bg-white p-6 border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' >
            <h2 className='font-black text-3xl mb-1' >{formatMultiPrice(monthEarning, userCurrency)}</h2>
            <p className='text-gray-700 font-bold uppercase text-sm tracking-wide'>Last 30 Days</p>
         </div>
         <div className='bg-white p-6 border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' >
            <h2 className='font-black text-3xl mb-1' >{formatMultiPrice(allEarning, userCurrency)}</h2>
            <p className='text-gray-700 font-bold uppercase text-sm tracking-wide'>All Time</p>
         </div>
      </div>
      )}

      {type === 'sales' ? <h2 className='font-GillSans uppercase text-xl mb-4 pt-3' >Recent Claims</h2> : <h2 className='font-GillSans uppercase text-xl mb-4 pt-3' >My Purchases</h2>}

      {orders && orders.length > 0 && (
         <div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {orders.map((item, index) =>
                  <article 
                    key={index} 
                    className="relative bg-white border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-3 md:p-4">
                        <div className="relative">
                            <div className="block border border-black rounded-[20px] overflow-hidden relative">
                                <span className={`absolute top-2 left-2 text-[11px] px-3 py-1 rounded-lg border-2 border-black font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-[5] ${item?.shop?.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                                    {item?.shop?.type === 'physical' ? 'Physical' : 'Digital'}
                                </span>
                                
                                <Link href={item.shop ? `/shop/item/${slug(item.shop.name)}/${item.shop.uuid}` : '#'}>
                                    <img
                                        className="object-cover h-[130px] sm:h-[160px] w-full"
                                        src={item?.shop?.perma_link || 'https://via.placeholder.com/400?text=🛍️'}
                                        alt={item?.shop?.name || "Product"}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400?text=🛍️';
                                        }}
                                    />
                                 <div className="absolute top-2 right-2 flex items-center gap-2">
                                       {item.payment_status === 'refunded' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-lg border border-black bg-gray-200 text-gray-700 uppercase">Refunded</span>
                                       ) : item.status === 'delivered' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-lg border border-black bg-green-100 text-green-700 uppercase">Completed</span>
                                       ) : item.status === 'shipped' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-lg border border-black bg-blue-100 text-blue-700 uppercase">Shipped</span>
                                       ) : item.status === 'processing' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-lg border border-black bg-indigo-100 text-indigo-700 uppercase">Processing</span>
                                       ) : item.is_delayed ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-lg border border-black bg-red-100 text-red-700 uppercase">Delayed</span>
                                       ) : (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-lg border border-black bg-yellow-100 text-yellow-700 uppercase">Pending</span>
                                       )}
                                 </div>
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2 sm:mt-4 mb-3">
                            <h2 className="text-sm line-clamp-1 sm:text-lg font-black text-black uppercase tracking-wide">
                                {item?.shop?.name || ""}
                            </h2>
                            <div className="flex flex-col gap-1 text-[13px] sm:text-sm font-bold text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 uppercase text-[11px]">{type === 'sales' ? 'Buyer' : 'Seller'}:</span>
                                    <Link href={`/${item.username}`} className="text-blue-500 hover:underline">
                                        @{item.username}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <h2 className="font-black text-lg sm:text-2xl text-black">
                                    {item && item?.gross_amount ? (
                                        type === 'sales' ? (
                                            formatMultiPrice(item.net_amount || 0, item?.currency || userCurrency)
                                        ) : (
                                            formatMultiPrice(item.gross_amount || 0, item?.currency || userCurrency)
                                        )
                                    ) : "FREE"}
                                </h2>
                                <div className="text-gray-500 text-[11px] font-bold uppercase">
                                    <TimeFormat dateString={item.created_at} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <OrderDetail 
                                date={<TimeFormat dateString={item.created_at} />} 
                                item={item} 
                                text={'View Info'} 
                                classes="w-full font-black cursor-pointer bg-gray-100 border-2 border-black px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 text-black text-sm sm:text-base uppercase text-center block" 
                                onSuccess={fetchorders} 
                            />
                        </div>
                    </div>
                </article>
            )}
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
