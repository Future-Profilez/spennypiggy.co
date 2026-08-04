import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
import PriceFormat from '@/includes/PriceFormat';
import { TimeFormat } from '@/includes/TimeFormat';
import OrderDetail from './OrderDetail';

const OrderCardSkeleton = () => (
   <div className="bg-white border-[3px] border-black rounded-box shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden p-3 md:p-4 animate-pulse">
      <div className="h-[130px] sm:h-[160px] w-full bg-gray-200 rounded-box-sm border border-black" />
      <div className="h-4 bg-gray-200 rounded-box-sm mt-4 w-3/4" />
      <div className="h-3 bg-gray-200 rounded-box-sm mt-2 w-1/2" />
      <div className="h-6 bg-gray-200 rounded-box-sm mt-4 w-24" />
      <div className="h-11 bg-gray-200 rounded-box-sm mt-4 w-full" />
   </div>
);

export default function OrdersLists({ type = 'sales' }) {
   const slug = (inputString) => {
      return inputString
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
   }
   const { global_currency } = usePage().props;
   const [orderloading, setOrderLoading] = useState(false);
   const [loadingMore, setLoadingMore] = useState(false);
   const [orders, setOrders] = useState([]);
   const [userCurrency, setUserCurrency] = useState(global_currency);

   const [allEarning, setAllEarning] = useState(0);
   const [monthEarning, setmonthEarning] = useState(0);
   const [claims, setclaims] = useState(0);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(false);

   // Filters
   const [statusFilter, setStatusFilter] = useState('all');
   const [search, setSearch] = useState('');
   const [debouncedSearch, setDebouncedSearch] = useState('');

   const STATUS_TABS = [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'processing', label: 'Processing' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Completed' },
   ];

   // Fee maths comes from PriceFormat — a second local copy of the formula drifts.
   const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();

   const [loadError, setLoadError] = useState(false);

   // append=true keeps the loaded pages and adds the next one (load-more).
   const fetchorders = (targetPage = 1, append = false) => {
      if (append) setLoadingMore(true); else setOrderLoading(true);
      setLoadError(false);
      const params = new URLSearchParams({
         type,
         page: String(targetPage),
         status: statusFilter,
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      axios.get(`/shop/orders-list?${params.toString()}`)
         .then(res => {
            setOrders(prev => append ? [...prev, ...res.data.orders] : res.data.orders);
            setAllEarning(res.data.all_time);
            setmonthEarning(res.data.thirtydays);
            setclaims(res.data.total_claims);
            setUserCurrency(res.data.user_currency || global_currency);
            setPage(res.data.pagination?.current_page ?? targetPage);
            setHasMore(Boolean(res.data.pagination?.has_more));
            setOrderLoading(false);
            setLoadingMore(false);
         })
         .catch(() => {
            // An API failure must not render as "you have no orders".
            setLoadError(true);
            setOrderLoading(false);
            setLoadingMore(false);
         });
   };

   // Debounce the search box so we don't fire a request per keystroke.
   useEffect(() => {
      const t = setTimeout(() => setDebouncedSearch(search), 350);
      return () => clearTimeout(t);
   }, [search]);

   // Refetch from page 1 whenever tab, status filter or debounced search change.
   useEffect(() => {
      fetchorders(1, false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [type, statusFilter, debouncedSearch]);


  return <>

      {type === 'sales' && (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' >
         <div className='bg-white p-6 border-[3px] border-black rounded-box  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' >
            <h2 className='font-black text-3xl mb-1' >{claims}</h2>
            <p className='text-gray-700 font-bold uppercase text-sm tracking-wide'>Claims</p>
         </div>
         <div className='bg-white p-6 border-[3px] border-black rounded-box  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' >
            <h2 className='font-black text-3xl mb-1' >{formatMultiPrice(monthEarning, userCurrency)}</h2>
            <p className='text-gray-700 font-bold uppercase text-sm tracking-wide'>Last 30 Days</p>
         </div>
         <div className='bg-white p-6 border-[3px] border-black rounded-box  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' >
            <h2 className='font-black text-3xl mb-1' >{formatMultiPrice(allEarning, userCurrency)}</h2>
            <p className='text-gray-700 font-bold uppercase text-sm tracking-wide'>All Time</p>
         </div>
      </div>
      )}

      {type === 'sales' ? <h2 className='font-GillSans uppercase text-xl mb-4 pt-3' >Recent Claims</h2> : <h2 className='font-GillSans uppercase text-xl mb-4 pt-3' >My Purchases</h2>}

      {/* Filters — always visible so an empty result is still searchable/clearable. */}
      <div className='flex flex-col gap-3 mb-5'>
         <div className='relative'>
            <input
               type='text'
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder={type === 'sales' ? 'Search by item or buyer…' : 'Search by item or creator…'}
               className='w-full bg-white border-[3px] border-black rounded-box-sm px-4 py-3 min-h-[44px] font-bold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F] placeholder:text-gray-400'
            />
            {search && (
               <button
                  type='button'
                  aria-label='Clear search'
                  onClick={() => setSearch('')}
                  className='absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center font-black text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black'
               >×</button>
            )}
         </div>
         <div className='flex gap-2 overflow-x-auto pb-1 -mx-1 px-1'>
            {STATUS_TABS.map(t => (
               <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  aria-pressed={statusFilter === t.key}
                  className={`whitespace-nowrap px-4 py-2 min-h-[40px] rounded-box-sm border-2 border-black font-black uppercase text-[11px] tracking-wide transition-all active:translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F] ${statusFilter === t.key ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}
               >
                  {t.label}
               </button>
            ))}
         </div>
      </div>

      {orders && orders.length > 0 && (
         <div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {orders.map((item) =>
                  <article 
                    key={item.uuid ?? item.id}
                    className="relative bg-white border-[3px] border-black rounded-box  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-3 md:p-4">
                        <div className="relative">
                            <div className="block border border-black rounded-box-sm overflow-hidden relative">
                                <span className={`absolute top-2 left-2 text-[11px] px-3 py-1 rounded-box-sm border-2 border-black font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-[5] ${item?.shop?.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                                    {item?.shop?.type === 'physical' ? 'Physical' : 'Digital'}
                                </span>
                                
                                <Link href={item.shop ? `/shop/item/${slug(item.shop.name)}/${item.shop.uuid}` : '#'}>
                                    <img
                                        className="object-cover h-[130px] sm:h-[160px] w-full"
                                        src={item?.shop?.perma_link || ''}
                                        alt={item?.shop?.name || "Product"}
                                        onError={(e) => {
                                            // Guard, or re-setting src re-fires onError forever.
                                            if (e.target.dataset.fallback) return;
                                            e.target.dataset.fallback = '1';
                                            e.target.style.backgroundColor = '#f3f4f6';
                                            e.target.style.display = 'flex';
                                            e.target.style.alignItems = 'center';
                                            e.target.style.justifyContent = 'center';
                                            e.target.innerHTML = '🛍️';
                                        }}
                                    />
                                 <div className="absolute top-2 right-2 flex items-center gap-2">
                                       {item.payment_status === 'refunded' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-box-sm border border-black bg-gray-200 text-gray-700 uppercase">Refunded</span>
                                       ) : item.status === 'delivered' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-box-sm border border-black bg-green-100 text-green-700 uppercase">Completed</span>
                                       ) : item.status === 'shipped' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-box-sm border border-black bg-blue-100 text-blue-700 uppercase">Shipped</span>
                                       ) : item.status === 'processing' ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-box-sm border border-black bg-indigo-100 text-indigo-700 uppercase">Processing</span>
                                       ) : item.is_delayed ? (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-box-sm border border-black bg-red-100 text-red-700 uppercase">Delayed</span>
                                       ) : (
                                          <span className="text-[11px] font-black px-2 py-1 rounded-box-sm border border-black bg-yellow-100 text-yellow-700 uppercase">Pending</span>
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
                                    {item.username ? (
                                        <Link href={`/${item.username}`} className="text-blue-500 hover:underline">
                                            @{item.username}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-500 italic text-[13px]">{item.name || 'Anonymous'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <h2 className="font-black text-lg sm:text-2xl text-black">
                                    {item && (item?.total_paid || item?.gross_amount || item?.amount) ? (
                                        type === 'sales' ? (
                                            formatMultiPrice(item.net_amount || item.amount || 0, item?.currency || userCurrency)
                                        ) : (
                                            formatMultiPrice(
                                                /*
                                                 * `total_paid` is what the buyer was ACTUALLY charged,
                                                 * and it is written on every new order — always prefer it
                                                 * over recomputing, which would re-price a past order at
                                                 * today's rates.
                                                 *
                                                 * ⚠️ The fallback below is for LEGACY rows only (written
                                                 * before total_paid was stored) and necessarily uses the
                                                 * standard rate — it has no way to know what priced them.
                                                 * It was also missing `.total_supporter_pays`, so it passed
                                                 * the whole breakdown OBJECT to the formatter and rendered
                                                 * garbage on exactly those rows.
                                                 */
                                                item.total_paid ||
                                                calculateTotalSupporterPays(
                                                    ((Number(item.gross_amount || item.amount || 0)) + 
                                                    (Number(item.tax_amount || 0)) + 
                                                    (Number(item.vat_tax_amount || 0)) + 
                                                    (Number(item.shipping_amount || 0))),
                                                    item?.currency || userCurrency
                                                ).total_supporter_pays, 
                                                item?.currency || userCurrency
                                            )
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
                                type={type}
                                text={'View Info'} 
                                classes="w-full font-black cursor-pointer bg-gray-100 border-2 border-black px-4 py-3 min-h-[44px] rounded-box-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all text-black text-sm sm:text-base uppercase text-center block" 
                                onSuccess={fetchorders} 
                            />
                        </div>
                    </div>
                </article>
            )}
         </div>
      )}

      {/* Load more — page-at-a-time, mobile-friendly (no numbered pager). */}
      {orders.length > 0 && hasMore && (
         <div className='text-center mt-6'>
            <button
               onClick={() => fetchorders(page + 1, true)}
               disabled={loadingMore}
               className='font-black uppercase bg-white border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm shadow-[4px_4px_0px_#000] transition-all hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50'
            >
               {loadingMore ? 'Loading…' : 'Load more'}
            </button>
         </div>
      )}

      {/* Skeletons only on the first load; a filter refetch keeps the stale grid. */}
      {orderloading && orders.length === 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((n) => <OrderCardSkeleton key={n} />)}
         </div>
      ) : loadError ? (
         <>
            <Nocontent
               hideImage
               text={type === 'sales' ? "Couldn't load your orders" : "Couldn't load your purchases"}
               subheading="Something went wrong on our side. Nothing has been lost — try again."
            />
            <div className="text-center mt-4">
               <button
                  onClick={fetchorders}
                  className="font-black uppercase bg-yellow-300 border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm shadow-[4px_4px_0px_#000]"
               >
                  Try again
               </button>
            </div>
         </>
      ) : orders.length < 1 ? (
         (debouncedSearch.trim() || statusFilter !== 'all') ? (
            <Nocontent
               hideImage
               text="No matching orders"
               subheading="Nothing matches these filters. Clear them to see everything."
            />
         ) : (
            <Nocontent
               text={type === 'sales' ? "No orders yet" : "No purchases yet"}
               subheading={type === 'sales'
                  ? "When a supporter buys one of your products, the order lands here."
                  : "Anything you buy from a creator shows up here with its delivery status."}
               actionHref={type === 'sales' ? '/shop?type=products' : '/discover'}
               actionText={type === 'sales' ? 'Manage your products' : 'Find creators'}
            />
         )
      ) : ""}

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
