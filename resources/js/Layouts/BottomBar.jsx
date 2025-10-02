import { Link, usePage } from "@inertiajs/react";
import { useSelector } from "react-redux";
import { RetroHomeIcon, RetroCartIcon, RetroSearchIcon, RetroUserIcon } from '../Components/RetroIcons';
import { useState, useEffect } from 'react';

export default function BottomBar(){
   const count = useSelector((state) => state.data.cart.cart);
   const { auth, ziggy } = usePage().props;
   const [activeTab, setActiveTab] = useState('home');

   // Determine active tab based on current route
   useEffect(() => {
      const currentUrl = window.location.pathname;
      if (currentUrl.includes('/cart')) {
         setActiveTab('cart');
      } else if (currentUrl.includes('/discover')) {
         setActiveTab('discover');
      } else if (currentUrl.includes('/account')) {
         setActiveTab('account');
      } else if (currentUrl === `/${auth?.user?.username}`) {
         setActiveTab('home');
      } else {
         setActiveTab('home'); // default
      }
   }, [auth, ziggy]);

   return <>
         {auth && auth.user ?
            <div className="fixed md:hidden bottom-0 left-0 z-50 w-full h-16 retro-bottom-bar pb-[env(safe-area-inset-bottom)]">
               {/* Retro scanline effect */}
               {/* <div className="scanline"></div> */}
               
               <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium relative z-10 !pb-[10px]">
                  {/* Home Button */}
                  <Link 
                     href={`/${auth && auth.user && auth.user.username}`} 
                     as="button" 
                     className={`retro-nav-button ${activeTab === 'home' ? 'active' : ''}`}
                     onClick={() => setActiveTab('home')}
                  >
                     <RetroHomeIcon size={28} isActive={activeTab === 'home'} />
                  </Link>
                  
                  {/* Cart Button */}
                  <Link 
                     href={route("cart")} 
                     as="button" 
                     className={`retro-nav-button ${activeTab === 'cart' ? 'active' : ''}`}
                     onClick={() => setActiveTab('cart')}
                  >
                     <RetroCartIcon 
                        size={28} 
                        isActive={activeTab === 'cart'} 
                        count={count || 0}
                     />
                  </Link>

                  {/* Discover Button */}
                  <Link 
                     href={route("discover")} 
                     className={`retro-nav-button ${activeTab === 'discover' ? 'active' : ''}`}
                     onClick={() => setActiveTab('discover')}
                  >
                     <RetroSearchIcon size={28} isActive={activeTab === 'discover'} />
                  </Link>

                  {/* Account Button */}
                  <Link 
                     href={'/account'} 
                     as="button" 
                     className={`retro-nav-button ${activeTab === 'account' ? 'active' : ''}`}
                     onClick={() => setActiveTab('account')}
                  >
                     <RetroUserIcon size={28} isActive={activeTab === 'account'} />
                  </Link>

               </div>
            </div>
         : ""}
   </>
}
