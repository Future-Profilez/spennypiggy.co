import { Link } from '@inertiajs/react';
import {Fragment, useState, useRef} from "react";
import axios from 'axios';
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from "@animateicons/react/lucide";
import { Share2, Check, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AddItem from './AddItem';
import Nocontent from '@/includes/Nocontent';
import { WaitingCount } from '@/Components/WaitlistButton';
import ItemFunnelLine from '@/Components/ItemFunnelLine';
import PriceFormat from '@/includes/PriceFormat';
import ScheduledBadge from "@/Components/ScheduledBadge";

const ProductCardSkeleton = () => (
   <div className="overflow-hidden rounded-box border-[3px] border-black bg-white animate-pulse">
      <div className="aspect-[16/10] w-full border-b-[3px] border-black bg-gray-200" />
      <div className="p-4">
         <div className="h-4 w-3/4 rounded-full bg-gray-200" />
         <div className="mt-2 h-3 w-full rounded-full bg-gray-200" />
         <div className="mt-5 h-8 w-28 rounded-box-sm bg-gray-200" />
         <div className="mt-4 h-14 w-full rounded-box-sm bg-gray-200" />
         <div className="mt-4 h-11 w-full rounded-box-sm bg-gray-200" />
      </div>
   </div>
);

/**
 * One status, one place — a full-width strip under the image.
 *
 * These used to float over the product photo, which hid the exact thing an admin
 * (or the creator) needs to look at while it is under review, and stacked into each
 * other when a listing was both unapproved and edited.
 */
const StatusStrip = ({ tone, label, detail }) => {
   const tones = {
      danger: 'bg-red-600 text-white',
      warn: 'bg-yellow-300 text-black',
      muted: 'bg-gray-900 text-white',
      note: 'bg-red-50 text-red-700',
   };

   return (
      <div className={`border-b-[3px] border-black px-4 py-2 ${tones[tone]}`}>
         <p className="text-[12px] font-black uppercase leading-tight tracking-wide">{label}</p>
         {detail && (
            <p className="mt-0.5 text-[12px] font-medium normal-case leading-snug opacity-90">{detail}</p>
         )}
      </div>
   );
};

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
                        const isCopied = copiedId === s.uuid;
                        const itemUrl = `/shop/item/${slug(s.name)}/${s.uuid}`;

                        const tracked = s.slot_limitation !== null && s.slot_limitation !== undefined;
                        const stockLeft = tracked ? Number(s.slot_limitation) : null;
                        const soldCount = Number(s.total_sold) || 0;
                        const soldOut = tracked && stockLeft <= 0;

                        /* The funnel says a listing is not being seen; Share is what fixes
                           that. Light the button up so the diagnosis and the cure are one
                           gesture apart instead of buried in the overflow menu. */
                        const needsSharing = s.funnel?.view_state === 'none';

                        return (
                        <article
                           key={s.uuid}
                           /* flex-col on the ARTICLE with a mt-auto footer: cards in a row
                              end level and every Edit button lands on the same line. The old
                              markup put mt-auto inside a non-flex child, so it did nothing
                              and short listings left a gap under their button. */
                           className={`relative flex h-full flex-col overflow-hidden rounded-box border-[2px] border-black bg-white transition-colors duration-200 hover:bg-black/[0.03] ${isDeactivated ? 'opacity-60 grayscale' : ''} ${isPending ? 'pointer-events-none opacity-50' : ''}`}
                        >
                           {/* Media bleeds to the card edge. One rule under it replaces the
                               old border-inside-a-border-inside-a-border stack. */}
                           <Link
                              href={s.perma_link ? itemUrl : '#'}
                              className="group/img relative block aspect-[16/10] overflow-hidden border-b-[1px]  !border-t-[0px]  !border-r-[0px]  !border-l-[0px] border-black bg-gray-100"
                           >
                              <span className={`absolute left-3 top-3 z-[5] rounded-full border-2 border-black px-2.5 py-0.5 text-[12px] font-black uppercase tracking-wide ${s.type === 'physical' ? 'bg-blue-300' : 'bg-[#A2E4B8]'}`}>
                                 {s.type === 'physical' ? 'Physical' : 'Digital'}
                              </span>

                              <img
                                 className="h-full w-full object-cover transition-[filter,opacity] duration-500 group-hover/img:brightness-[1.08]"
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
                                 <span className="absolute bottom-3 left-3 rounded-full bg-[#FF007F] px-2.5 py-0.5 text-[12px] font-black uppercase tracking-wide text-black">
                                    Made with AI
                                 </span>
                              )}

                              {/* Always visible — hover is not available on touch. Quiet:
                                  it is a way out of the card, not an action on it. */}
                              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-black uppercase tracking-wide text-black">
                                 View <ArrowUpRight size={11} strokeWidth={3} />
                              </span>
                           </Link>

                           {s.is_suspended == 1 && (
                              <StatusStrip tone="danger" label="Suspended" detail={s.suspend_reason} />
                           )}
                           {s.approved == 0 && s.is_suspended != 1 && (
                              <StatusStrip tone="warn" label="Waiting for approval" detail={s.moderation_reason} />
                           )}
                           {isDeactivated && s.is_suspended != 1 && (
                              <StatusStrip tone="muted" label="Deactivated" detail="Hidden from your profile until you turn it back on." />
                           )}
                           {s.edited_status == 0 && s.edited_reason && (
                              <StatusStrip tone="note" label="Admin requested changes" detail={s.edited_reason} />
                           )}

                           {/* A scheduled listing looks exactly like a live one here, and
                               it is not on sale — without this the creator finds out when
                               the sales do not arrive. */}
                           {s.publish_at && (
                              <div className="px-4 pt-3">
                                 <ScheduledBadge publishAt={s.publish_at} />
                              </div>
                           )}

                           <div className="flex flex-1 flex-col p-4">
                              <div className="flex items-start justify-between gap-1">
                                 {/* Reserve both lines: a one-line name would otherwise
                                     shunt this card's price and meta a row higher than
                                     its neighbours' and the grid reads as misaligned. */}
                                 <h3
                                    className="pt-1.5 text-base font-black uppercase leading-tight tracking-wide text-black line-clamp-2 min-h-[40px] sm:min-h-[45px] sm:text-lg"
                                    title={s.name}
                                 >
                                    {s.name}
                                 </h3>

                                 <Menu as="div" className="relative -mr-2 -mt-1 shrink-0 text-left">
                                    <Menu.Button
                                       aria-label={`Actions for ${s.name}`}
                                       disabled={isPending}
                                       className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50"
                                    >
                                       <EllipsisVerticalIcon size={22} color="#000" />
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
                                       <Menu.Items className="absolute right-0 top-full z-40 mt-1 w-44 origin-top-right rounded-box border-2 border-black bg-white p-2 focus:outline-none">
                                          <Menu.Item>
                                             {({ active }) => (
                                                <button
                                                   className={menuItemClass(active)}
                                                   onClick={() => handleCopy(s.uuid, `${window.location.origin}${itemUrl}`)}
                                                >
                                                   {isCopied ? "Copied" : "Copy link"}
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
                                                   onClick={() => toggleActive(s)}
                                                >
                                                   {s.status == 1 ? 'Deactivate' : 'Activate'}
                                                </button>
                                             )}
                                          </Menu.Item>
                                          <Menu.Item>
                                             {({ active }) => (
                                                <button
                                                   disabled={isPending}
                                                   className={`${menuItemClass(active)} text-red-700`}
                                                   onClick={() => deleteItem(s)}
                                                >
                                                   Delete
                                                </button>
                                             )}
                                          </Menu.Item>
                                       </Menu.Items>
                                    </Transition>
                                 </Menu>
                              </div>

                              {s.description && (
                                 <p className="mt-1 text-[13px] leading-snug text-gray-600 line-clamp-2">
                                    {s.description}
                                 </p>
                              )}

                              {/* One hero per card: the price. Everything under it is
                                  instrumentation and is set at half its weight. */}
                              <div className="mt-4 flex items-end justify-between gap-3">
                                 <p className="text-3xl font-black leading-none tabular-nums text-black sm:text-[2rem]">
                                    {formatMultiPrice(s.price, s.currency)}
                                 </p>

                                 {/*
                                    `slot_limitation` is REMAINING stock, so the total is
                                    sold + remaining. A brand-new listing has neither, and
                                    the old markup printed "0/0 Sold" — a fraction of
                                    nothing, which reads as a bug. Say nothing instead:
                                    the funnel below already reports zero sales.
                                 */}
                                 {tracked ? (
                                    <span
                                       className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-black uppercase tracking-wide ${soldOut ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
                                       title={`${soldCount} sold, ${Math.max(0, stockLeft)} left`}
                                    >
                                       {soldOut ? 'Sold out' : `${stockLeft} left`}
                                    </span>
                                 ) : soldCount > 0 ? (
                                    <span className="shrink-0 text-[12px] font-black uppercase tracking-wide text-gray-500">
                                       {soldCount} sold
                                    </span>
                                 ) : null}
                              </div>

                              {/* Seen → checkout → sold. Answers "is this not being
                                  found, or found and not convincing?" — two problems
                                  that looked identical before. */}
                              <ItemFunnelLine funnel={s.funnel} className="mt-3" />

                              {soldOut && (
                                 <div className='mt-3 flex flex-wrap items-center justify-between gap-2 rounded-box-sm bg-red-50 px-3 py-2'>
                                    <span className='text-[12px] font-black uppercase leading-tight tracking-wide text-red-700'>Raise the limit to keep selling</span>
                                    {/* The demand the creator could not see before. This number is
                                        the whole reason the waitlist exists on the supply side. */}
                                    <WaitingCount count={Number(s.waiting_count || 0)} />
                                 </div>
                              )}

                              {s.type === 'physical' && shippingDetails && (
                                 <dl className='mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px]'>
                                    {shippingDetails.domestic && (
                                       <div className="flex items-baseline gap-1.5">
                                          <dt className="font-black uppercase tracking-wide text-black/60">Domestic</dt>
                                          <dd className="font-bold tabular-nums text-gray-700">{shippingDetails.domestic}</dd>
                                       </div>
                                    )}
                                    {shippingDetails.worldwide && (
                                       <div className="flex items-baseline gap-1.5">
                                          <dt className="font-black uppercase tracking-wide text-black/60">Worldwide</dt>
                                          <dd className="font-bold tabular-nums text-gray-700">{shippingDetails.worldwide}</dd>
                                       </div>
                                    )}
                                 </dl>
                              )}

                              <div className="mt-auto flex items-center gap-2 pt-5">
                                 {/* One AddItem per card. The menu's Edit clicks this same button —
                                     a second hidden copy doubled every category request on this tab. */}
                                 <div className="flex-1" ref={(el) => editButtonRefs.current[s.uuid] = el}>
                                    <AddItem
                                       update={update}
                                       classes="block w-full cursor-pointer rounded-box-sm border-2 border-black bg-blue-300 px-4 py-3 min-h-[44px] text-center text-sm font-black uppercase tracking-wide text-black transition-all hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black active:translate-x-[2px] active:translate-y-[2px] "
                                       pre_title={s.name} title="Edit item"
                                       pre_description={s.description}
                                       pre_price={s.price}
                                       product_type={s.type}
                                       item={s} isEdit={true}
                                    />
                                 </div>

                                 <button
                                    type="button"
                                    onClick={() => handleCopy(s.uuid, `${window.location.origin}${itemUrl}`)}
                                    aria-label={`Copy the link to ${s.name}`}
                                    title="Copy the link to this listing"
                                    className={`inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-box-sm border-2 border-black transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black active:translate-x-[2px] active:translate-y-[2px] ${
 isCopied ? 'bg-[#A2E4B8] text-black'
 : needsSharing ? 'bg-[#FF007F] text-black hover:bg-[#e00070]'
 : 'bg-white text-black hover:bg-gray-100'
 }`}
                                 >
                                    {isCopied ? <Check size={18} strokeWidth={3} /> : <Share2 size={17} strokeWidth={2.6} />}
                                 </button>
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
