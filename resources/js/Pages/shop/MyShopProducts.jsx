import { Link } from '@inertiajs/react';
import React from 'react';
export default function MyShopProducts({lists}) {

   const slug = (inputString) => { 
      return inputString
      .toLowerCase() // Convert the string to lowercase
      .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters except spaces and hyphens
      .trim() // Remove leading and trailing spaces
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
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
               <p>View</p>
            </div>
            }) : <p className='text-gray-400 p-4 text-center bg-white rounded-[20px] my-3 ' >Nothing to see</p>}
            
         </div>
    </div>
  )
}
