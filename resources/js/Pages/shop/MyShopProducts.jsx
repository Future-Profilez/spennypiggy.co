import { Link } from '@inertiajs/react';
import {Fragment, useState} from "react";
import { Menu, Transition } from '@headlessui/react'
import { HiDotsVertical } from "react-icons/hi";
import toast from 'react-hot-toast';
import AddItem from './AddItem';
import LoadingScreen from '@/includes/LoadingScreen';
import Dropdown from "react-bootstrap/Dropdown";
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
         <h2 className='font-GillSans text-uppercase text-xl mb-3' >My Products</h2>
         <div className='shop-items-lists' >

         {loading ? <LoadingScreen /> : 
            <>
            {lists && lists.length ? lists.map((s, i)=>{
               return <div className='mt-2 bg-white p-3 rounded-xl' > 
                  <div className='shop-item flex justify-between w-full items-center ' >
                     <div className='shop-item-user flex  items-center max-w-[40%] min-w-[40%] ' >
                        <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-img w-12 h-12 min-w-12' >
                           <img 
                             className='w-full h-full object-cover rounded-lg' 
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
                        <Link href={`/shop/item/${slug(s.name)}/${s.uuid}`} className='shop-text ps-3 ' >
                           <h2 className='text-md font-bold line-clamp-2'>{s.name}</h2>
                           <p className='text-gray-500 text-sm line-clamp-1 '>{s.description}</p>
                        </Link>
                     </div>
                     <p>{s.total_sold} Sold</p>
                     <p>
                     <Dropdown className="add-options ">
                        <Dropdown.Toggle
                           className="dropdown-add fixsize px-3"
                           variant="success"
                           id="dropdown-basic" > <HiDotsVertical size='1.5rem'  color="#000" /></Dropdown.Toggle>
                        <Dropdown.Menu>
                              <Suspense fallback={"Add Post"}>
                                    <button className='px-[15px] py-[10px] text-start w-full' onClick={() => handleCopy(`${window.location.origin}/shop/item/${slug(s.name)}/${s.uuid}`)} >{copied ? "Copied" : "Copy Link"}</button>
                                    <AddItem update={update}
                                    classes={" px-[16px]  rounded-0 focus:bg-transparent focus:text-black py-[10px] editclass w-full text-start"} 
                                    pre_title={s.name} title="Edit"
                                    pre_description={s.description} 
                                    pre_price={s.price} 
                                    product_type={s.type}
                                    item={s} isEdit={true} />
                              </Suspense>
                        </Dropdown.Menu>
                     </Dropdown>

                     </p>
                  </div>
                  {s.approved == 0 ?  <div className='approvalmessge static rounded-3 p-3 py-2 mt-3 ' >Shop item waiting for approval. Currently only you can see this wish.</div> : ''}
               </div>
            }) : <Nocontent/>
             }
         </>}

            
         </div>
    </div>
  )
}
