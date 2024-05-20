import { Link } from '@inertiajs/react';
import React, {Fragment} from 'react';
import { Menu, Transition } from '@headlessui/react'
import { HiDotsVertical } from "react-icons/hi";

export default function MyShopProducts({lists}) {

   const slug = (inputString) => { 
      return inputString
      .toLowerCase() 
      .replace(/[^a-z0-9\s-]/g, '') 
      .trim() 
      .replace(/\s+/g, '-') 
      .replace(/-+/g, '-'); 
   }

   const handleCopy = (text) => {
      navigator.clipboard.writeText(text).then(() => {
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
   };

   const Menus = ({url}) =>{ 
      return <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex font-semibold text-gray-900  ">
          <HiDotsVertical size="1.4rem" />
        </Menu.Button>
      </div>
      <Transition
         as="div"
         enter="transition ease-out duration-100"
         enterFrom="transform opacity-0 scale-95"
         enterTo="transform opacity-100 scale-100"
         leave="transition ease-in duration-75"
         leaveFrom="transform opacity-100 scale-100" 
         leaveTo="transform opacity-0 scale-95" >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl overflow-hidden bg-white shadow-xl ring-1 ring-black ring-opacity-5">
            <button className='px-[15px] py-[10px] text-start w-full' onClick={() => handleCopy(url)} >Copy Link</button>
            <button className='px-[15px] py-[10px] border-t  text-start w-full' >Edit</button>
            <button className='px-[15px] py-[10px] border-t  text-start w-full' onClick={() => {copyLink}} >Copy Link</button>
        </Menu.Items>
      </Transition>
    </Menu>
   }
   
  return (
    <div className='shopLists pt-12' > 
         <h2 className='font-GillSans text-uppercase text-xl' >My Products</h2>
         <div className='shop-items-lists' >

            {lists && lists.length ? lists.map((s, i)=>{
               return <div className='mt-2 shop-item flex justify-between w-full items-center bg-white p-3 rounded-xl' >
               <div className='shop-item-user flex  items-center max-w-[50%]' >
                  <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-img w-12 h-12 min-w-12' >
                     <img className='w-full h-full object-cover rounded-lg' src={s.perma_link} alt='' />
                  </Link>
                  <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-text ps-3 ' >
                     <h2 className='text-md font-bold'>{s.name}</h2>
                     <p className='text-gray-500 text-sm line-clamp-1 '>{s.description}</p>
                  </Link>
               </div>
               <p>{s.total_sold} Sold</p>
               <p>
               <Menus url={`${window.location.origin}/shop/item/${slug(s.name)}/${s.uuid}`} />
               </p>
            </div>
            }) : <p className='text-gray-400 p-4 text-center bg-white rounded-[20px] my-3 ' >Nothing to see</p>}
            
         </div>
    </div>
  )
}
