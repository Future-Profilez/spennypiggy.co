import { useAlerts } from '@/Components/Alerts';
import PriceFormat from '@/includes/PriceFormat';
import { Link, router, usePage } from '@inertiajs/react'
import React from 'react'

export default function ProfileProduct({item, IsloggedIn}) {

   const {auth} = usePage().props;
   const { formatMultiPrice} = PriceFormat();

   const slug = (inputString) => { 
      return inputString
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
   }

   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   const url = `/shop/item/${slug(item.name)}/${item.uuid}`;
   const gotologin = () => { 
      errorAlert("You must login first.");
      router.visit(`/login?redirect=${url}`);
   }

  return (
      <article class="max-w-sm w-full bg-white rounded-[22px] overflow-hidden ">
         <div className='relative'>
            {IsloggedIn && item && item.approved === 0 ?  
              <div className='approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2 ' >
                Shop item waiting for approval. Currently only you can see this.</div> 
            : ''}
            <Link href={url} >
               <img class="object-cover h-[130px] sm:h-[200px] w-full" src={item.perma_link} alt={item.name} />
               {item.ai_generated == 1 ? <div className='absolute bottom-2 left-2 z-1 bg-black shadow-sm rounded-xl px-2 py-1 text-[8px] text-white'>MADE WITH AI </div> : ""}
            </Link>
         </div>
         <Link href={url}  class="flex flex-col gap-1 mt-2 sm:mt-4 px-3 sm:px-4">
            <h2 class="text-sm line-clamp-1 sm:text-lg font-semibold text-black ">{item.name}</h2>
            <span class="text-[13px] sm:text-normal font-normal text-gray-600 line-clamp-2">{item.description}</span>
         </Link>
         <div class="mt-2 sm:mt-4 p-3 sm:p-4 border-t flex justify-between border-gray-200">
            <h2 className='font-bold text-sm sm:text-xl' >{formatMultiPrice(item.price, item?.currency || 'GBP') || "FREE"}</h2>
               <>
                  {auth && auth.user !== null ? 
                     <>
                        <Link href={url} class=" font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg">
                           Buy Now 
                        </Link>
                     </>
                     :
                     <>
                        <button onClick={gotologin} class="font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg">
                           Buy Now 
                        </button>
                     </>
                  }
               </>
         </div>
      </article>
  )
}
