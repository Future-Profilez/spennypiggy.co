import { Link } from '@inertiajs/react';
import {Fragment, useState, useRef} from "react";
import axios from 'axios';
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from "@animateicons/react/lucide";
import toast from 'react-hot-toast';
import AddItem from './AddItem';
import Nocontent from '@/includes/Nocontent';
import { WaitingCount } from '@/Components/WaitlistButton';
import PriceFormat from '@/includes/PriceFormat';

const ProductCardSkeleton = () => (
   <div className="bg-white border-[3px] border-black rounded-box shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden p-3 md:p-4 animate-pulse">
      <div className="h-[130px] sm:h-[160px] w-full bg-gray-200 rounded-box-sm border border-black" />
      <div className="h-4 bg-gray-200 rounded-box-sm mt-4 w-3/4" />
      <div className="h-3 bg-gray-200 rounded-box-sm mt-2 w-full" />
      <div className="flex items-center justify-between mt-4">
         <div className="h-6 bg-gray-200 rounded-box-sm w-20" />
         <div className="h-6 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="h-11 bg-gray-200 rounded-box-sm mt-4 w-full" />
   </div>
);

export default function MyShopProducts({lists, loading, update}) {
   const { formatMultiPrice } = PriceFormat();
   const editButtonRefs = useRef({});

   const getShippingDetails = (shop) => {
      if (shop.type !== 'physical' || !shop.shop_shipping_info) return null;

      const domestic = shop.shop_shipping_info.find(i => i.country !== 'all');
      const worldwide = shop.shop_shipping_info.find(i => i.country === 'all');

      return {
         domestic: domestic ? formatMultiPrice(domestic.shipping_price, shop.currency) : null,
         worldwide: worldwide ? formatMultiPrice(worldwide.shipping_price, shop.currency) : null
      };
   };

   const slug = (inputString) => {
      return inputString
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
   }

   // Per-product, not shared: one shared flag turned every card's menu to "Copied".
   const [copiedId, setCopiedId] = useState(null);
   const [pendingId, setPendingId] = useState(null);
   const handleCopy = (uuid, text) => {
      navigator.clipboard.writeText(text).then(() => {
         setCopiedId(uuid)
         toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId((current) => (current === uuid ? null : current)), 2000);
      }).catch(err => {
        toast.error('Could not copy the link — copy it from the address bar instead.');
        console.error('Failed to copy: ', err);
      });
   };

   const deleteItem = (s) => {
      if (!window.confirm(`Delete "${s.name}"? Buyers will no longer see it and this cannot be undone.`)) return;
      setPendingId(s.uuid);
      // POST, not GET — a GET has no CSRF token and can be fired from any page.
      axios.post(`/shop/delete/${s.uuid}`).then(res => {
         if (res.data.status) {
            toast.success(res.data.msg);
            update && update();
         } else {
            toast.error(res.data.msg || 'Could not delete this item.');
         }
      }).catch(() => {
         toast.error('Could not delete this item. Please try again.');
      }).finally(() => setPendingId(null));
   };

   const toggleActive = (s) => {
      const turningOff = Number(s.status) === 1;
      if (turningOff && !window.confirm(`Deactivate "${s.name}"? It will be hidden from your profile until you turn it back on.`)) return;
      setPendingId(s.uuid);
      axios.post(`/shop/deactivate/${s.uuid}`).then(() => {
         toast.success(turningOff ? 'Deactivated' : 'Activated');
         update && update();
      }).catch(() => {
         toast.error(`Could not ${turningOff ? 'deactivate' : 'activate'} this item. Please try again.`);
      }).finally(() => setPendingId(null));
   };

   const menuItemClass = (active) =>
      `${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-box-sm px-3 py-3 min-h-[44px] text-sm font-bold text-gray-900 disabled:opacity-50`;

  return (
    <div className='shopLists pt-16 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0' >
         {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
               {[0, 1, 2, 3, 4, 5].map((n) => <ProductCardSkeleton key={n} />)}
            </div>
         ) :
            <>
            {lists && lists?.length ?
               <>
                  <h2 className='font-GillSans uppercase text-2xl md:text-3xl mb-3' >My Products</h2>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' >
                     {lists.map((s)=>{
                        const isDeactivated = Number(s?.status) === 0;
                        const shippingDetails = getShippingDetails(s);
                        const isPending = pendingId === s.uuid;

                        return (
                        <article
                           key={s.uuid}
                           className={`relative bg-white border-[3px] border-black rounded-box shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col justify-between ${isDeactivated ? 'opacity-60 grayscale' : ''} ${isPending ? 'pointer-events-none opacity-50' : ''}`}
                        >
                           <div className="p-3 md:p-4">
                                 <div className="relative">
                                    {/* Status Badges/Messages */}
                                    {s.is_suspended == 1 && (
                                       <div className="absolute top-2 left-5 right-5 bg-red-600 border-2 border-black z-10 text-white text-xs font-black p-2 rounded-box-sm text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                             Suspended
                                             {/* Rendered inline, not on hover — on touch the reason was unreachable. */}
                                             {s.suspend_reason && (
                                                <div className="mt-1 font-bold text-[10px] leading-snug normal-case">
                                                   Reason: {s.suspend_reason}
                                                </div>
                                             )}
                                       </div>
                                    )}
                                    {s.approved == 0 && s.is_suspended != 1 && (
                                       <div className="absolute top-2 left-5 right-5 bg-yellow-300 border-2 border-black z-10 text-black text-xs font-black p-2 rounded-box-sm text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                             Waiting for approval
                                             {s.moderation_reason && (
                                                <div className="mt-1 font-bold text-[10px] leading-snug normal-case">
                                                   {s.moderation_reason}
                                                </div>
                                             )}
                                       </div>
                                    )}
                                    {isDeactivated && s.is_suspended != 1 && (
                                       <div className="absolute top-2 left-5 right-5 bg-gray-800 border-2 border-black z-10 text-white text-xs font-black p-2 rounded-box-sm text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                             Deactivated
                                       </div>
                                    )}
                                    {s.edited_status == 0 && s.edited_reason && (
                                       <div className="absolute top-12 left-5 right-5 bg-red-100 border-2 border-red-500 z-10 text-red-700 text-xs font-black p-2 rounded-box-sm text-center shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
                                             Admin requested changes: {s.edited_reason}
                                       </div>
                                    )}

                                    <Link
                                       href={s.perma_link ? `/shop/item/${slug(s.name)}/${s.uuid}` : '#'}
                                       className="block border border-black rounded-box-sm overflow-hidden relative group/img"
                                    >
                                       <span className={`absolute top-2 left-2 text-[13px] px-3 py-1 rounded-box-sm border-2 border-black font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-[5] ${s.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                                             {s.type === 'physical' ? 'Physical' : 'Digital'}
                                       </span>

                                       <img
                                             className="object-cover h-[130px] sm:h-[160px] w-full group-hover/img:scale-105 transition-transform duration-500"
                                             src={s.perma_link}
                                             alt={s.name}
                                             onError={(e) => {
                                                e.target.style.backgroundColor = '#f3f4f6';
                                                e.target.style.display = 'flex';
                                                e.target.style.alignItems = 'center';
                                                e.target.style.justifyContent = 'center';
                                                e.target.innerHTML = '🛍️';
                                             }}
                                       />

                                       {s.ai_generated == 1 && (
                                             <div className="absolute bottom-2 left-2 z-1 bg-[#FF007F] border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-box-sm px-2 py-1 text-[10px] text-black">
                                                MADE WITH AI
                                             </div>
                                       )}

                                       {/* Always visible on touch; hover only enlarges it on pointer devices. */}
                                       <span className="absolute bottom-2 right-2 bg-white border-2 border-black px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">View Detail</span>
                                    </Link>
                                 </div>

                                 <div className="flex flex-col gap-1 mt-2 sm:mt-4 mb-3">
                                    <div className='flex items-center justify-between gap-2'>
                                       <h2 className="text-sm line-clamp-1 sm:text-lg font-black text-black uppercase tracking-wide">
                                             {s.name}
                                       </h2>

                                       <div className='relative'>
                                             <Menu as="div" className="relative inline-block text-left">
                                                <Menu.Button
                                                   aria-label={`Actions for ${s.name}`}
                                                   disabled={isPending}
                                                   className="inline-flex items-center justify-center rounded-full h-11 w-11 text-sm font-medium hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50"
                                                >
                                                   <EllipsisVerticalIcon size={24} color="#000" />
                                                </Menu.Button>

                                                <Transition
                                                   as={Fragment}
                                                   enter="transition ease-out duration-100"
                                                   enterFrom="transform opacity-0 scale-95"
                                                   enterTo="transform opacity-100 scale-100"
                                                   leave="transition ease-in duration-75"
                                                   leaveFrom="transform opacity-100 scale-100"
                                                   leaveTo="transform opacity-0 scale-95"
                                                >
                                                   <Menu.Items className="p-2 absolute right-0 top-full mt-1 w-44 origin-top-right divide-y divide-gray-100 rounded-box bg-white border-2 border-black focus:outline-none z-40">
                                                         <div className="px-1 py-1">
                                                            <Menu.Item>
                                                               {({ active }) => (
                                                                     <button
                                                                        className={menuItemClass(active)}
                                                                        onClick={() => handleCopy(s.uuid, `${window.location.origin}/shop/item/${slug(s.name)}/${s.uuid}`)}
                                                                     >
                                                                        {copiedId === s.uuid ? "Copied" : "Copy Link"}
                                                                     </button>
                                                               )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                               {({ active }) => (
                                                                     <button
                                                                        className={menuItemClass(active)}
                                                                        onClick={() => editButtonRefs.current[s.uuid]?.querySelector('button')?.click()}
                                                                     >
                                                                        Edit
                                                                     </button>
                                                               )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                               {({ active }) => (
                                                                     <button
                                                                        disabled={isPending}
                                                                        className={menuItemClass(active)}
                                                                        onClick={() => deleteItem(s)}
                                                                     >
                                                                        Delete
                                                                     </button>
                                                               )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                               {({ active }) => (
                                                                     <button
                                                                        disabled={isPending}
                                                                        className={menuItemClass(active)}
                                                                        onClick={() => toggleActive(s)}
                                                                     >
                                                                        {s.status == 1 ? 'Deactivate' : 'Activate'}
                                                                     </button>
                                                               )}
                                                            </Menu.Item>
                                                         </div>
                                                   </Menu.Items>
                                                </Transition>
                                             </Menu>
                                       </div>
                                    </div>
                                    <span className="text-[13px] sm:text-normal font-bold text-gray-700 line-clamp-1">
                                       {s.description}
                                    </span>
                                 </div>

                                 <div className="mb-4 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                       <h2 className="font-black text-lg sm:text-2xl text-black">
                                             {formatMultiPrice(s.price, s.currency)}
                                       </h2>
                                       {/* `slot_limitation` is REMAINING stock, so total = sold + remaining. */}
                                       <span className="text-sm font-black text-black bg-gray-100 px-3 py-1 rounded-full border border-black">
                                             {s.slot_limitation !== null && s.slot_limitation !== undefined
                                                ? `${s.total_sold}/${Number(s.total_sold) + Number(s.slot_limitation)} Sold`
                                                : `${s.total_sold} Sold`
                                             }
                                       </span>
                                    </div>

                                    {s.slot_limitation !== null && s.slot_limitation !== undefined && Number(s.slot_limitation) <= 0 && (
                                       <div className='flex flex-wrap items-center gap-2'>
                                          <span className='text-[11px] font-black uppercase text-red-600'>Sold out — raise the stock limit to sell more</span>
                                          {/* The demand the creator could not see before. This number is
                                              the whole reason the waitlist exists on the supply side. */}
                                          <WaitingCount count={Number(s.waiting_count || 0)} />
                                       </div>
                                    )}

                                    {s.type === 'physical' && shippingDetails && (
                                       <div className='flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 font-bold uppercase'>
                                             {shippingDetails.domestic && (
                                                <span>Domestic: {shippingDetails.domestic}</span>
                                             )}
                                             {shippingDetails.worldwide && (
                                                <span>Worldwide: {shippingDetails.worldwide}</span>
                                             )}
                                       </div>
                                    )}
                                 </div>

                                 <div className="flex items-center gap-2 mt-auto">
                                    {/* One AddItem per card. The menu's Edit clicks this same button —
                                        a second hidden copy doubled every category request on this tab. */}
                                    <div className="flex-grow" ref={(el) => editButtonRefs.current[s.uuid] = el}>
                                       <AddItem
                                             update={update}
                                             classes="w-full font-black cursor-pointer bg-blue-300 border-2 border-black px-4 py-3 min-h-[44px] rounded-box-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all text-black text-sm sm:text-base uppercase text-center block"
                                             pre_title={s.name} title="Edit Item"
                                             pre_description={s.description}
                                             pre_price={s.price}
                                             product_type={s.type}
                                             item={s} isEdit={true}
                                       />
                                    </div>
                                 </div>
                           </div>
                        </article>
                        );
                     })}
                  </div>
               </>
               :
               <Nocontent
                  text="No products yet"
                  subheading="Add your first product and it will show on your profile straight away."
                  actionHref="/shop?type=add"
                  actionText="Add your first product"
               />
            }
            </>
         }
    </div>
  )
}
