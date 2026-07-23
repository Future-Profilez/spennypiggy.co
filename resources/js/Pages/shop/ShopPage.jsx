import Guest from '@/Layouts/GuestLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Nocontent from '@/includes/Nocontent';
import AddShop from './AddShop';
import MyShopProducts from './MyShopProducts';
import ShopGuide from './ShopGuide';
import axios from 'axios';
import { useEffect } from 'react';
import OrdersLists from './order/OrdersLists';
export default function AddShopItem(props) {

   const { auth, user } = props;
   const isCreator = auth?.user?.role == 1;
   const username = auth?.user?.username;

   // Read 'type' from the Inertia URL rather than window.location so this is
   // SSR-safe and reacts to client-side navigation.
   const { url: pageUrl } = usePage();

   const tabTypeMap = { 1: 'products', 2: 'orders', 3: 'purchases', 4: 'guide' };

   const tabFromType = (typeParam) => {
      if (typeParam === 'purchases') return 3;
      if (typeParam === 'orders' || typeParam === 'sales') return 2;
      if (typeParam === 'guide') return 4;
      if (typeParam === 'products' || typeParam === 'add') return 1;
      return isCreator ? 1 : 3;
   };

   const typeFromUrl = (u) => {
      const query = (u || '').split('?')[1] || '';
      return new URLSearchParams(query).get('type');
   };

   const [tab, setTab] = useState(() => tabFromType(typeFromUrl(pageUrl)));

   const changeTab = (tabNum) => {
      setTab(tabNum);
      const url = new URL(window.location.href);
      url.searchParams.set('type', tabTypeMap[tabNum]);
      // pushState, so Back returns to the previous tab instead of leaving the page.
      window.history.pushState({ shopTab: tabNum }, '', url.toString());
   };

   useEffect(() => {
      const onPop = () => setTab(tabFromType(typeFromUrl(window.location.search ? `?${window.location.search.slice(1)}` : '')));
      window.addEventListener('popstate', onPop);
      return () => window.removeEventListener('popstate', onPop);
   }, [isCreator]);

   const [loading, setLoading] = useState(false);
   const [loadError, setLoadError] = useState(false);
   const [lists, setLists] = useState([]);
   const fetchItems = () =>{
      // Guests have no shop of their own — this used to request /shop/list/undefined.
      if (!isCreator || !username) return;
      setLoading(true);
      setLoadError(false);
        axios.get(`/shop/list/${username}`)
       .then(res =>{
            setLists(res.data.shops);
            setLoading(false);
        })
       .catch(() =>{
            // Distinct from "no products yet" — an API failure must not read as an
            // empty shop.
            setLoadError(true);
            setLoading(false);
        });
   }

   useEffect(()=>{
      fetchItems();
   }, []);



  return (
    <>
      <Guest auth={auth.user} user={user}>
         <div className='bg-gray-200 min-h-dvh' >
            <div className='containerbox m-auto' >
               <div className='py-8 md:py-16 max-w-[900px] m-auto pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-16'>
                  <Head title={'Add Shop Item'}  />
                  <h2 className='font-GillSans uppercase text-3xl' >Shop</h2>

                  {isCreator && (
                  <div className=" font-medium text-center text-gray-500 mt-3 mb-4 md:my-4"> 
                     <ul className="md:flex flex-wrap-mb-px gap-2 !py-3 ">

                        <li className="me-2">
                           <button onClick={()=>changeTab(1)} className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block px-4 py-3 min-h-[44px] border border-black rounded-box-sm !text-black ${tab == 1 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}>Products</button>
                        </li>

                        <li className="me-2">
                           <button onClick={()=>changeTab(2)}  className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block px-4 py-3 min-h-[44px] border border-black rounded-box-sm !text-black ${tab == 2 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}  >Orders</button>
                        </li>

                        <li className="me-2">
                           <button onClick={()=>changeTab(3)}  className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block px-4 py-3 min-h-[44px] border border-black rounded-box-sm !text-black ${tab == 3 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}  >My Purchases</button>
                        </li>

                        <li className="me-2">
                           <button onClick={()=>changeTab(4)}  className={`text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block px-4 py-3 min-h-[44px] border border-black rounded-box-sm !text-black ${tab == 4 ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_#000]' : "bg-white !border-gray-400"} `}  >Shop Guide</button>
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
                         {loadError ? (
                            <div className='pt-16'>
                               <Nocontent
                                  text="Couldn't load your products"
                                  subheading="Something went wrong on our side. Your products are safe — try again."
                                  hideImage
                               />
                               <div className='text-center mt-4'>
                                  <button
                                     onClick={fetchItems}
                                     className='font-black uppercase bg-yellow-300 border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm shadow-[4px_4px_0px_#000]'
                                  >
                                     Try again
                                  </button>
                               </div>
                            </div>
                         ) : (
                            <MyShopProducts loading={loading} update={fetchItems} lists={lists} />
                         )}
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
