import Guest from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AddShop from './AddShop';
import MyShopProducts from './MyShopProducts';
import ShopGuide from './ShopGuide';
import axios from 'axios';
import { useEffect } from 'react';
import OrdersLists from './order/OrdersLists';
export default function AddShopItem(props) {

   const { auth, user } = props;
   const isCreator = auth?.user?.role == 1;
   
   // Read 'type' from URL query params
   const queryParams = new URLSearchParams(window.location.search);
   const typeParam = queryParams.get('type');

   const getInitialTab = () => {
      if (typeParam === 'purchases') return 3;
      if (typeParam === 'orders' || typeParam === 'sales') return 2;
      if (typeParam === 'guide') return 4;
      if (typeParam === 'products') return 1;
      return isCreator ? 1 : 3;
   };

   const tabTypeMap = { 1: 'products', 2: 'orders', 3: 'purchases', 4: 'guide' };

   const [tab, setTab] = useState(getInitialTab());

   const changeTab = (tabNum) => {
      setTab(tabNum);
      const url = new URL(window.location.href);
      url.searchParams.set('type', tabTypeMap[tabNum]);
      window.history.replaceState({}, '', url.toString());
   };

   const [loading, setLoading] = useState(false);
   const [lists, setLists] = useState([]);
   const fetchItems = () =>{
      setLoading(true);
        axios.get(`/shop/list/${auth.user && auth.user&&auth.user.username}`)
       .then(res =>{
            setLists(res.data.shops);
            setLoading(false);
        })
       .catch(err =>{
            console.log(err);
            setLoading(false);
        });
   }

   useEffect(()=>{
      fetchItems();
   }, []);



  return (
    <>
      <Guest auth={auth.user} user={user}>
         <div className='bg-gray-200 min-vh-100' >
            <div className='containerbox m-auto' >
               <div className='py-8 md:py-16 max-w-[900px] m-auto'>
                  <Head title={'Add Shop Item'}  />
                  <h2 className='font-GillSans uppercase text-3xl' >Shop</h2>

                  {isCreator && (
                  <div className=" font-medium text-center text-gray-500 dark:text-gray-400 mt-3 mb-4 md:my-4"> 
                     <ul className="md:flex flex-wrap-mb-px gap-2 !py-3 ">

                        <li className="me-2">
                           <button onClick={()=>changeTab(1)} className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block p-2 !px-4 border border-black rounded-[14px]  md:rounded-[16px] !text-black ${tab == 1 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}>Products</button>
                        </li>

                        <li className="me-2">
                           <button onClick={()=>changeTab(2)}  className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block p-2 !px-4 border border-black rounded-[14px]  md:rounded-[16px] !text-black ${tab == 2 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}  >Orders</button>
                        </li>

                        <li className="me-2">
                           <button onClick={()=>changeTab(3)}  className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block p-2 !px-4 border border-black rounded-[14px]  md:rounded-[16px] !text-black ${tab == 3 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}  >My Purchases</button>
                        </li>

                        <li className="me-2">
                           <button onClick={()=>changeTab(4)}  className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block p-2 !px-4 border border-black rounded-[14px]  md:rounded-[16px] !text-black ${tab == 4 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}  >Shop Guide</button>
                        </li>

                     </ul>
                  </div>
                  )}

                  <div className="mb-6">

                     {tab == 1 ? <div className=" transition-opacity duration-150 ease-linear"
                        id="tabs-home"
                        role="tabpanel"
                        aria-labelledby="tabs-home-tab"
                        data-twe-tab-active>
                         <AddShop update={fetchItems} />
                         <MyShopProducts loading={loading} update={fetchItems} lists={lists} />
                     </div> : ''}

                     {tab == 2 ? <div className=" transition-opacity duration-150 ease-linear"
                        id="tabs-home"
                        role="tabpanel"
                        aria-labelledby="tabs-home-tab"
                        data-twe-tab-active>
                           <OrdersLists type="sales" />
                     </div> : ''}

                     {tab == 3 ? <div className=" transition-opacity duration-150 ease-linear"
                        id="tabs-home"
                        role="tabpanel"
                        aria-labelledby="tabs-home-tab"
                        data-twe-tab-active>
                           <OrdersLists type="purchases" />
                     </div> : ''}

                     {tab == 4 ? <div className=" transition-opacity duration-150 ease-linear"
                        id="tabs-home"
                        role="tabpanel"
                        aria-labelledby="tabs-home-tab"
                        data-twe-tab-active>
                           <ShopGuide />
                     </div> : ''}

                  </div>
               </div>
            </div>
         </div>
      </Guest>
    </>
  )
}
