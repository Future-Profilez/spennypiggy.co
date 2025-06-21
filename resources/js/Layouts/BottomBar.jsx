import { Link, usePage } from "@inertiajs/react";
import { useSelector } from "react-redux";
import { CiSearch } from "react-icons/ci";
import { FiShoppingCart } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi2";
import { FaCircleUser } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import { FaRegUserCircle } from "react-icons/fa";

export default function BottomBar(){
   const count = useSelector((state) => state.data.cart.cart);
   const { auth } = usePage().props;

   return <>
         {auth && auth.user ?
            <div class="fixed md:hidden bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 pb-[14px] ">
               <div class="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">

                  <Link href={`/${auth && auth.user && auth.user.username}`} as="button" className="relative inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group" >
                     <HiOutlineHome size="1.5rem" />
                  </Link>
                 

                  <Link href={route("cart")} as="button" className=" inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50  group" >
                     <div className="relative">
                        <FiShoppingCart size="1.5rem" />
                        {count ? 
                        <span className=" absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full site-counter d-block">{count}</span>
                        : ""}
                     </div>
                  </Link>

                  <Link href={route("discover")} className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group">
                        <IoSearch size="1.5rem" />
                        {/* <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Discover</span> */}
                  </Link>


                  <Link href={'/account'} as="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group">
                        <FaRegUserCircle size="1.5rem" />
                        {/* <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">Account</span> */}
                  </Link>
                  
               </div>
            </div> 
         : ""}
   </>
}