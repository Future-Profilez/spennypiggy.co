import Guest from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';
import React from 'react'
import { useState } from 'react';
import AddShop from './AddShop';
import MyShopProducts from './MyShopProducts';
import axios from 'axios';
import { useEffect } from 'react';
export default function AddShopItem(props) {

   const { auth, user } = props;
   const [tab, setTab] = useState(1);

   const [lists, setLists] = useState([]);
   const fetchItems = () =>{
        axios.get(`/shop/list/${auth.user && auth.user&&auth.user.username}`)
       .then(res =>{
            setLists(res.data.shops);
        })
       .catch(err =>{
            console.log(err);
        })
   }

   useEffect(()=>{
      fetchItems();
   }, []);
   


  return (
    <>
      <Guest auth={auth.user} user={user}>
         <div className='bg-gray-200 min-vh-100' >
            <div className='containerbox m-auto' >
               <div className='py-8 md:py-16 max-w-[900px] m-auto' >
                  <Head title={'Add Shop Item'}  />
                  <h2 className='font-GillSans text-uppercase text-3xl' >Shop</h2>

                  <div className=" font-medium text-center text-gray-500 border-b border-gray-300 dark:text-gray-400 my-3 md:my-4">
                     <ul className="flex flex-wrap-mb-px">
                        <li className="me-2">
                           <button onClick={(e)=>setTab(1)} className={` text-lg inline-block p-2 ps-0 pe-3 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 ${tab == 1 ? 'border-blue-600 text-blue-600' : ""}`}>Products</button>
                        </li>
                        <li className="me-2">
                           <button onClick={(e)=>setTab(2)}  className={` text-lg inline-block p-2 ps-0 pe-3 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 ${tab == 2 ? 'border-blue-600 text-blue-600' : ""}`}  >Settings</button>
                        </li>
                     </ul>
                  </div>

                  <div className="mb-6">

                     {tab == 1 ? <div className=" transition-opacity duration-150 ease-linear"
                        id="tabs-home"
                        role="tabpanel"
                        aria-labelledby="tabs-home-tab"
                        data-twe-tab-active>
                         <AddShop update={fetchItems} />
                         <MyShopProducts lists={lists} />
                     </div> : ''}

                     {tab == 2 ? <div className=" transition-opacity duration-150 ease-linear"
                        id="tabs-home"
                        role="tabpanel"
                        aria-labelledby="tabs-home-tab"
                        data-twe-tab-active>
                          Settings
                     </div> : ''}
                     
                  </div>
               </div>
            </div>
         </div>
      </Guest>
    </>
  )
}
