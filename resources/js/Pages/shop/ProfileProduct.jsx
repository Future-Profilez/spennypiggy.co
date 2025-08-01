import PriceFormat from '@/includes/PriceFormat';
import { Link } from '@inertiajs/react'
import React from 'react'

export default function ProfileProduct({item}) {

   const { formatMultiPrice} = PriceFormat();
   const slug = (inputString) => {
      return inputString
      .toLowerCase() // Convert the string to lowercase
      .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters except spaces and hyphens
      .trim() // Remove leading and trailing spaces
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
   }
   const url = `/shop/item/${slug(item.name)}/${item.uuid}`;

  return (
      <article className="max-w-sm w-full bg-white rounded-[22px] overflow-hidden ">
         <div>
            <Link href={url} >
               <img className="object-cover h-[130px] sm:h-[200px] w-full" src={item.perma_link} alt="Converse sneakers" />
            </Link>
         </div>
         <Link href={url}  className="flex flex-col gap-1 mt-2 sm:mt-4 px-3 sm:px-4">
            <h2 className="text-sm line-clamp-1 sm:text-lg font-semibold text-black ">{item.name}</h2>
            <span className="text-[13px] sm:text-normal font-normal text-gray-600 line-clamp-2">{item.description}</span>
         </Link>
         <div className="mt-2 sm:mt-4 p-3 sm:p-4 border-t flex justify-between border-gray-200">
            <h2 className='font-bold text-sm sm:text-xl' >{formatMultiPrice(item.price, item?.currency || 'GBP') || "FREE"}</h2>
            <button className=" font-bold cursor-pointer hover:underline text-black text-sm sm:text-lg">
                Buy Now
            </button>
         </div>
      </article>
  )
}
