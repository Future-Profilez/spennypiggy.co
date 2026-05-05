import { Link, usePage } from '@inertiajs/react';
import {Fragment, useState, useEffect, useRef} from "react";
import axios from 'axios';
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from "@animateicons/react/lucide";
import toast from 'react-hot-toast';
import AddItem from './AddItem';
import LoadingScreen from '@/includes/LoadingScreen';
import { Suspense } from 'react';
import Nocontent from '@/includes/Nocontent';
import PriceFormat from '@/includes/PriceFormat';

export default function MyShopProducts({lists, loading, update}) {
   const { auth } = usePage().props;
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

   const [copied, setCopied] =  useState(false);
   const handleCopy = (text) => {
      navigator.clipboard.writeText(text).then(() => {
         setCopied(true)
         toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
   };

    
   
  return (
    <div className='shopLists pt-12' > 
         <h2 className='font-GillSans uppercase text-xl mb-3' >My Products</h2>
         <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6' >

         {loading ? <LoadingScreen /> : 
            <>
            {lists && lists.length ? lists.map((s, i)=>{
               const isDeactivated = Number(s?.status) === 0;
               const shippingDetails = getShippingDetails(s);

               return (
                <article 
                    key={s.uuid}
                    className={`relative bg-white border-[3px] border-black rounded-[20px] md:rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col justify-between ${isDeactivated ? 'opacity-60 grayscale' : ''}`}
                >
                    <div className="p-3 md:p-4">
                        <div className="relative">
                            {/* Status Badges/Messages */}
                            {s.approved == 0 && (
                                <div className="absolute top-2 left-5 right-5 bg-yellow-300 border-2 border-black z-10 text-black text-xs font-black p-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Waiting for approval
                                </div>
                            )}
                            {isDeactivated && (
                                <div className="absolute top-2 left-5 right-5 bg-gray-800 border-2 border-black z-10 text-white text-xs font-black p-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Deactivated
                                </div>
                            )}
                            {s.edited_status == 0 && s.edited_reason && (
                                <div className="absolute top-12 left-5 right-5 bg-red-100 border-2 border-red-500 z-10 text-red-700 text-xs font-black p-2 rounded-lg text-center shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
                                    Admin requested changes: {s.edited_reason}
                                </div>
                            )}

                            <div className="block border border-black rounded-[20px] overflow-hidden relative">
                                <span className={`absolute top-2 left-2 text-[13px] px-3 py-1 rounded-lg border-2 border-black font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-[5] ${s.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                                    {s.type === 'physical' ? 'Physical' : 'Digital'}
                                </span>
                                
                                <img
                                    className="object-cover h-[130px] sm:h-[160px] w-full"
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
                                    <div className="absolute bottom-2 left-2 z-1 bg-pink-400 border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg px-2 py-1 text-[10px] text-black">
                                        MADE WITH AI
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2 sm:mt-4 mb-3">
                            <div className='flex items-center justify-between gap-2'>
                                <h2 className="text-sm line-clamp-1 sm:text-lg font-black text-black uppercase tracking-wide">
                                    {s.name}
                                </h2>
                                
                                <div className='relative'>
                                    <Menu as="div" className="relative inline-block text-left">
                                        <Menu.Button 
                                            className="inline-flex justify-center rounded-full p-1 text-sm font-medium hover:bg-gray-100 focus:outline-none group/menu"
                                            onMouseEnter={(e) => {
                                                const icon = e.currentTarget.querySelector('svg');
                                                if (icon && icon.__animate_start) icon.__animate_start();
                                            }}
                                        >
                                            <EllipsisVerticalIcon 
                                                size={24} 
                                                color="#000" 
                                                onMount={(ctrl) => {
                                                    const btns = document.querySelectorAll('.group\\/menu');
                                                    const btn = btns[i];
                                                    if (btn) btn.querySelector('svg').__animate_start = ctrl.startAnimation;
                                                }}
                                            />
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
                                            <Menu.Items className="p-2 absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-[20px] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black focus:outline-none z-40">
                                                <div className="px-1 py-1">
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-lg px-2 py-2 text-sm font-bold text-gray-900`}
                                                                onClick={() => handleCopy(`${window.location.origin}/shop/item/${slug(s.name)}/${s.uuid}`)}
                                                            >
                                                                {copied ? "Copied" : "Copy Link"}
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-lg px-2 py-2 text-sm font-bold text-gray-900`}
                                                                onClick={() => editButtonRefs.current[s.uuid]?.querySelector('button')?.click()}
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-lg px-2 py-2 text-sm font-bold text-gray-900`}
                                                                onClick={() => {
                                                                    if (window.confirm('Are you sure you want to delete this item?')) {
                                                                        axios.get(`/shop/delete/${s.uuid}`).then(res => {
                                                                            if(res.data.status) {
                                                                                toast.success(res.data.msg);
                                                                                update && update();
                                                                            } else {
                                                                                toast.error(res.data.msg);
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-lg px-2 py-2 text-sm font-bold text-gray-900`}
                                                                onClick={() => {
                                                                    axios.get(`/shop/deactivate/${s.uuid}`).then(res => {
                                                                        toast.success(s.status == 1 ? 'Deactivated' : 'Activated');
                                                                        update && update();
                                                                    });
                                                                }}
                                                            >
                                                                {s.status == 1 ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu.Items>
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
                                <span className="text-sm font-black text-black bg-gray-100 px-3 py-1 rounded-full border border-black">
                                    {s.slot_limitation !== null && s.type === 'physical'
                                        ? `${s.total_sold}/${s.total_sold + s.slot_limitation} Sold` 
                                        : `${s.total_sold} Sold`
                                    }
                                </span>
                            </div>

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
                            <div className="flex-grow">
                                <AddItem 
                                    update={update}
                                    classes="w-full font-black cursor-pointer bg-blue-300 border-2 border-black px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 text-black text-sm sm:text-base uppercase text-center block"
                                    pre_title={s.name} title="Edit Item"
                                    pre_description={s.description} 
                                    pre_price={s.price} 
                                    product_type={s.type}
                                    item={s} isEdit={true}
                                />
                            </div>
                            {/* Hidden AddItem component to manage the modal outside the Menu context */}
                            <div className="hidden" ref={(el) => editButtonRefs.current[s.uuid] = el}>
                                <AddItem update={update}
                                    classes={"hidden"}
                                    pre_title={s.name} title="Edit"
                                    pre_description={s.description} 
                                    pre_price={s.price} 
                                    product_type={s.type}
                                    item={s} isEdit={true} />
                            </div>
                        </div>
                    </div>
                </article>
               );
            }) : <Nocontent/>
             }
            </>
         }
         </div>
    </div>
  )
}
