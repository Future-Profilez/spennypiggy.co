import Guest from '@/Layouts/GuestLayout'
import { Head, Link } from '@inertiajs/react';
import React from 'react'
import BuyShopItem from './BuyShopItem';
import { RiDiscountPercentFill } from "react-icons/ri";
import { useState } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { useEffect } from 'react';
import { IoChevronBackOutline } from "react-icons/io5";
import axios from 'axios';
import AllContries from '../../includes/AllCountries';

export default function ShopDetailItem(props) {

   const { vat_percent, auth, user, shop } = props;
   console.log("props",props)
   const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (shop && shop.user && shop && shop.user.username));
   const url = window.location.href;
   const [open, setOpen] = useState();

   useEffect(()=>{
      if(props.payment_id && props.opened == 0){
         setOpen(true);
         if(shop.success_page_type == 'url'){
            window.open((shop && shop.success_page_value), '_blank');
         }
      }
   },[]);

   const instashare = () => {
      const shareUrl = `https://www.instagram.com/?url=${encodeURIComponent(url)}&amp;text=${encodeURIComponent(shop.name)}`;
      window.open(shareUrl, '_blank');
   };
   const fbShare = () => {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&amp;quote=${encodeURIComponent(shop.name)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
   };
   const rssShare = () => {
      const shareUrl = `https://feedly.com/i/subscription/feed/${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
   };
   const { formatMultiPrice} = PriceFormat();

   const [price, setPrice] = useState(shop.price);
   const [selectedVarient, setSelectedVarient] = useState(shop && shop.shop_varients[0] && shop.shop_varients[0].id);
   const handleVarient = (e) => { 
      const varient = shop.shop_varients.find(v => v.id == e.target.value);
      setPrice(varient.price);
      setSelectedVarient(varient.id);
   }

   const [currentCountry, setCurrentCountry] = useState();
   const getIp = async () => {
      await axios.get(`https://ipapi.co/json/`).then((resp)=>{
         if(resp.data && resp.data.country_code){
            setCurrentCountry(resp.data.country_code);
            console.log("resp.data.country_code",resp.data.country_code)
         }
      }).catch((err)=>{
         console.error("api err", err)
      });
  };


  const [shippingPrice, setShippingPrice] = useState(0);
  const getShippingPrice = () => {
   axios.get(`/shop/shipping-price/${shop.uuid}`).then((resp)=>{
      setShippingPrice(resp.data && resp.data.shipping_price);
   }).catch((err)=>{
      console.error("api err", err)
   });
  }

  useEffect(()=>{
   getIp();
   getShippingPrice()
  },[shop]);

   
   
  return (
    <>
      <Guest auth={auth.user} user={user}>
         <div className='bg-gray-200 min-vh-100' >
            <div className='containerbox m-auto' >
               <div className='py-6 md:py-14 max-w-[900px] m-auto' >
                  <Head title={shop.name || 'Spenny Piggy Shop'}  />
                  <div className="product-details max-w-[700px] px-2 mx-auto">
                

                     <button className='flex md:hidden items-center text-xl mb-4 ' onClick={()=>history.back()} ><span className='mt-1'><IoChevronBackOutline size="1.5rem" /></span> Back</button>
                     <nav className="hidden md:flex mb-4" aria-label="Breadcrumb">
                        <ol className="inline-flex flex-wrap items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                           <li className="inline-flex items-center">
                              <Link href={`/${shop.user && shop.user.username}`} className="inline-flex items-center text-md font-medium text-gray-700  ">
                                 {shop.user && shop.user.name}
                              </Link>
                           </li>
                           <li>
                              <div className="flex items-center">
                              <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                 <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                              </svg>
                              <p className="ms-1 text-md font-medium text-gray-700 md:ms-2">Shop</p>
                              </div>
                           </li>
                           <li aria-current="page">
                              <div className="flex items-center">
                              <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                 <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                              </svg>
                              <span className="ms-1 text-md font-medium text-gray-500 md:ms-2 dark:text-gray-400">{shop.name}</span>
                              </div>
                           </li>
                        </ol>
                     </nav>

                     <div className="w-full">
                        <img className="w-full max-h-[400px] object-cover rounded-xl" alt="image of a girl posing" src={shop.perma_link}/>
                     </div> 

                     <h2 className='font-GillSans text-uppercase text-3xl pt-4 pb-3' >{shop.name}</h2>
                     <p className=" text-lg lg:leading-tight leading-normal text-gray-600">{shop.description}</p>

                     <p className=" text-md lg:leading-tight leading-normal text-black mt-3 mb-2">
                        Category : <span className='capitalize' >{shop.category && shop.category.map((c, i)=>{
                           return `${c.category.category} `
                        })}</span>
                     </p>

                     {shop && shop.is_member == 0 && shop.special_member_price ? <div className='special-discount flex items-center bg-gray-100 border-gray-200 my-3 rounded-[20px] px-1 py-2 '>
                        <div className='discount-tag w-[50px] h-[50px] me-2' >
                           <RiDiscountPercentFill />
                        </div>
                        <div className='w-full pe-4 discount-text sm:flex items-center justify-between' >
                           <div className='pe-3'>
                              <h2 className='font-bold text-md' >Only {formatMultiPrice(shop.special_member_price, shop?.currency || 'GBP')} for members</h2>
                              <p className='mb-1 font-normal text-[13px]' >Become a member to get a discount and other exclusive benefits.</p>
                           </div>
                           <div className='py-2 ' >
                              <Link href={`/${shop.user && shop.user.username}`} className="button sm Join whitespace-nowrap" >Join Membership</Link>
                           </div>
                        </div>
                     </div> : ''}


                     <div className="col-span-4 sm:col-span-2 md:col-span-2 lg:col-span-1 xl:col-span-1">
                        <div className="mb-1 mt-4 font-medium text-gray-500">Social</div>
                        <ul className="mb-4 -ml-2 flex md:order-1 md:mb-0">
                           <li>
                              <a 
                              href={`https://twitter.com/intent/tweet?url=${url}`} target="_blank"
                               className=" text-break text-muted inline-flex items-center rounded-lg p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                 aria-label="Twitter" ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" className="h-7 w-7">
                                    <path
                                          d="M22 4.01c-1 .49 -1.98 .689 -3 .99c-1.121 -1.265 -2.783 -1.335 -4.38 -.737s-2.643 2.06 -2.62 3.737v1c-3.245 .083 -6.135 -1.395 -8 -4c0 0 -4.182 7.433 4 11c-1.872 1.247 -3.739 2.088 -6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58 -1.04 6.522 -3.723 7.651 -7.742a13.84 13.84 0 0 0 .497 -3.753c0 -.249 1.51 -2.772 1.818 -4.013z">
                                    </path>
                                 </svg>
                              </a>
                           </li>

                           <li>
                              <div onClick={instashare}
                               className="cursor-pointer text-muted inline-flex items-center rounded-lg p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                 aria-label="Instagram"  ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" className="h-7 w-7">
                                    <path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path>
                                    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                                    <path d="M16.5 7.5l0 .01"></path>
                                 </svg>
                              </div>
                           </li>

                           <li>
                              <div className="cursor-pointer text-muted inline-flex items-center rounded-lg p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                    aria-label="Facebook" 
                                     onClick={fbShare}
                                     ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                       stroke-linejoin="round" className="h-7 w-7">
                                       <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3"></path>
                                    </svg>
                              </div>
                           </li>

                           <li>
                              <div className="cursor-pointer text-muted inline-flex items-center rounded-lg p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                                 aria-label="RSS" onClick={rssShare}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" className="h-7 w-7">
                                    <path d="M5 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                    <path d="M4 4a16 16 0 0 1 16 16"></path>
                                    <path d="M4 11a9 9 0 0 1 9 9"></path>
                                 </svg>
                              </div>
                           </li>
                        </ul>
                     </div>

                     {shop.type === 'physical' ?
                        <>
                        <h2 className='text-lg mb-2'>Select Varient</h2>
                        <select onChange={handleVarient} className='bg-white rounded-xl text-lg text-capitalize px-4 py-2.5 mb-3 w-full border-0'>
                           {shop.shop_varients && shop.shop_varients.map((varient) => <option value={varient.id}>{varient.name}</option>)}
                        </select> 
                        </> : ""
                     }
                     
                     <div className='sm:flex items-center justify-between' >
                        <div className=' mb-3'>
                           <h3 className='text-3xl font-bold' >
                              {shop && shop.is_member == 1 && shop.special_member_price ? <>
                                 {formatMultiPrice(shop.special_member_price, shop?.currency || 'GBP') } <span className='line-through text-gray-400' >{price > 0 ? formatMultiPrice(price, shop?.currency || 'GBP') : "FREE"}</span>
                              </>  
                              : 
                              price > 0 ? formatMultiPrice(price, shop?.currency || 'GBP') : "Free"
                              }
                              {shop.slot_limitation ? <span className='ms-3 text-pink text-lg font-light ' >Only {shop.slot_limitation - shop.total_sold} Left</span> :""}
                           </h3>
                           <h2 className='mt-1'>Shipping Price : {formatMultiPrice(shippingPrice, shop?.currency || 'GBP')}</h2>
                        </div>
 
                        { IsloggedIn ? 
                           ""
                           : 
                           <>
                              {(shop.slot_limitation && (shop.slot_limitation - shop.total_sold) === 0 ) ?
                                 <button className='btn-pink sm disabled w-full sm:w-auto' >SOLD</button> 
                              : 
                                 <BuyShopItem shippingPrice={shippingPrice} country={currentCountry} selectedVarient={selectedVarient} vat_percent={vat_percent} opened={props.opened} isPaid={props.payment_id} open={open} s={shop} text={'Get This'} classes="w-full sm:w-auto btn-pink font-light md  mb-3" /> 
                              }
                           </>
                        }  
                     </div>

                  </div>
            </div>
            </div>
         </div>
      </Guest>
    </>
  )
}
