import { Link } from '@inertiajs/react';
import {Fragment, useState} from "react";
import { Menu, Transition } from '@headlessui/react'
import { HiDotsVertical } from "react-icons/hi";
import toast from 'react-hot-toast';
import AddItem from './AddItem';
import LoadingScreen from '@/includes/LoadingScreen';
import { Suspense } from 'react';
import Nocontent from '@/includes/Nocontent';

export default function MyShopProducts({lists, loading, update}) {

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
         <div className='shop-items-lists' >

         {loading ? <LoadingScreen /> : 
            <>
            {lists && lists.length ? lists.map((s, i)=>{
               return <div className='mt-2 bg-white p-3 rounded-[30px] md:rounded-[40px] ' > 
                  <div className='shop-item flex justify-between w-full items-center ' >
                     <div className='shop-item-user flex  items-center max-w-[40%] min-w-[40%] ' >
                        <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-img w-12 h-12 min-w-12' >
                           <img 
                             className='w-full h-full object-cover rounded-[30px] md:rounded-[40px]  ' 
                             src={s.perma_link} 
                             alt={s.name || 'Shop item'}
                             onError={(e) => {
                               console.warn('Shop image failed to load:', s.perma_link);
                               e.target.style.backgroundColor = '#f3f4f6';
                               e.target.style.display = 'flex';
                               e.target.style.alignItems = 'center';
                               e.target.style.justifyContent = 'center';
                               e.target.innerHTML = '📷';
                             }}
                           />
                        </Link>
                        <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-text pl-3 ' >
                           <h2 className='text-md font-bold line-clamp-2'>{s.name}</h2>
                           <p className='text-gray-500 text-sm line-clamp-1 '>{s.description}</p>
                        </Link>
                     </div>
                     <p>{s.total_sold} Sold</p>
                     <div className='relative'>
                        <Menu as="div" className="relative inline-block text-left">
                           <div>
                              <Menu.Button className="inline-flex w-full justify-center rounded-[30px] md:rounded-[40px]  px-3 py-2 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                                 <HiDotsVertical size='1.5rem' color="#000" />
                              </Menu.Button>
                           </div>
                           <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                           >
                              <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-[30px] md:rounded-[40px]  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                 <div className="px-1 py-1 ">
                                    <Menu.Item>
                                       {({ active }) => (
                                          <button
                                             className={`${
                                                active ? 'bg-gray-100' : ''
                                             } group flex w-full items-center rounded-[30px] md:rounded-[40px]  px-2 py-2 text-sm text-gray-900`}
                                             onClick={() => handleCopy(`${window.location.origin}/shop/item/${slug(s.name)}/${s.uuid}`)}
                                          >
                                             {copied ? "Copied" : "Copy Link"}
                                          </button>
                                       )}
                                    </Menu.Item>
                                    <Menu.Item>
                                       {({ active }) => (
                                          <div className={`${
                                             active ? 'bg-gray-100' : ''
                                          } group flex w-full items-center rounded-[30px] md:rounded-[40px]  text-sm text-gray-900`}>
                                             <AddItem update={update}
                                                classes={"px-2 py-2 w-full text-left bg-transparent border-0 hover:bg-transparent"}
                                                pre_title={s.name} title="Edit"
                                                pre_description={s.description} 
                                                pre_price={s.price} 
                                                product_type={s.type}
                                                item={s} isEdit={true} />
                                          </div>
                                       )}
                                    </Menu.Item>
                                 </div>
                              </Menu.Items>
                           </Transition>
                        </Menu>
                     </div>
                  </div>
                  {s.approved == 0 ?  <div className='approvalmessage static rounded-[30px] md:rounded-[40px]  p-3 py-2 mt-3 bg-yellow-50 text-yellow-800' >Shop item waiting for approval. Currently only you can see this wish.</div> : ''}
               </div>
            }) : <Nocontent/>
             }
         </>}

            
         </div>
    </div>
  )
}
