import React from "react";
import { Link, usePage, router } from "@inertiajs/react";
import spennypiggy from "../../assets/img/logo.png";
import { useState } from "react";
import { useEffect } from "react";
import DeviceID from "./DeviceID";
import axios from "axios";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { add_to_cart } from "../Pages/redux/UserSlice";
import ChangeCurrency from "@/Components/ChangeCurrency";
import Notifications from "./Notifications";
import { IoSettingsOutline } from "react-icons/io5";
import { FaHeart, FaRegStar, FaUserAlt } from "react-icons/fa";
import { SlCalender } from "react-icons/sl";
import { FaBasketShopping, FaHouseChimneyUser } from "react-icons/fa6";
import { GiInjustice, GiTwoCoins } from "react-icons/gi";
import { IoIosUnlock } from "react-icons/io";
import { MdOutlinePrivacyTip, MdOutlineSupportAgent } from "react-icons/md";
import { TbSettingsCog } from "react-icons/tb";
import { ImBlog } from "react-icons/im";
import { BsCookie } from "react-icons/bs";
import { CiDiscount1 } from "react-icons/ci";
import { LuBookMinus } from "react-icons/lu";
import { MdClose } from "react-icons/md";

export default function Header() {

    const { global_currency, auth } = usePage().props;
    const deviceid = DeviceID();
    const [isActive, setActive] = useState(false);
    const [shows, setShows] = useState(false);
    const toggleClass = () => {
        setActive(!isActive);
        setTimeout(()=>{
            setShows(!isActive);
        },300);
    };

    const cart = useSelector((state) => state.data.cart.cart);
    const [count, setCount] = useState();
    const dispatch = useDispatch();
    async function fetchCounter() {
        axios.get(`/counter/${deviceid}`).then((resp) => {
            setCount(resp.data.counter);
            dispatch(add_to_cart(resp.data.counter));
        }).catch((_err) => {
            console.error("error", _err);
        });
    }
    useEffect(() => {
        fetchCounter();
    }, [cart]);

    return (
        <>
            <div className="blackbg headermain py-6 ">
                <div className="containerbox">
                    <div className="header flex w-full items-center  justify-between ">
                        {/* {auth?.user?.username ? (
                            <Link
                                href={`/${auth?.user?.username || ""}`}
                                className="headtitle text-wh font-GillSans d-none d-lg-flex" >
                                My Wishlist 
                            </Link>
                        ) : (
                            <Link
                                href="/register"
                                className="headtitle text-wh font-GillSans d-none d-lg-flex" >
                                Sign Up
                            </Link>
                        )} */} 
                        <div className="d-none d-md-flex  leftspaces items-center justify-content-start" >
                            <div className="  menu-toggle cursor-pointer cartLink position-relative" onClick={toggleClass} >
                                <svg width="49" height="48" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.42188 36.75H40.5781M8.42188 24.75H40.5781M8.42188 12.75H40.5781" stroke="#05EFB8" stroke-width="2.625" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <Link className="d-none d-md-block ms-3 text-[30px]"  href={"/leaderboard"} >🌟</Link>
                        </div>

                        <div className="spennylogo">
                            <Link href={route("home")}>
                                <LazyLoadImage
                                    alt={"image"}
                                    height={170}
                                    useIntersectionObserver={true}
                                    effect="blur"
                                    src={spennypiggy}
                                    width={292}
                                />
                            </Link>
                        </div>

                        <div className="leftspaces cartLogin">
                            {auth && auth.user && auth.user.stripe_details_submitted == "1" ? ( "" ) : 
                                router.page && router.page && router.page.component == "Dashboard" ? (
                                <ChangeCurrency
                                    defaultvalue={global_currency}
                                    changer={true}
                                />) 
                            : ""}

                            {auth && auth.user ? <Notifications /> : ""}

                            <Link href={route("discover")} className="me-3 ms-1 discover-icon">
                                <svg
                                    width="36"
                                    height="36"
                                    viewBox="0 0 36 36"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <g clip-path="url(#clip0_1439_828)">
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M15.7504 3C13.7173 3.00017 11.7137 3.48655 9.90677 4.41854C8.09985 5.35054 6.54202 6.70113 5.36323 8.35763C4.18445 10.0141 3.4189 11.9285 3.13044 13.9411C2.84199 15.9536 3.039 18.006 3.70505 19.9269C4.37109 21.8478 5.48685 23.5816 6.95924 24.9836C8.43162 26.3856 10.2179 27.4152 12.1692 27.9864C14.1204 28.5576 16.1799 28.654 18.1759 28.2674C20.1719 27.8808 22.0466 27.0224 23.6434 25.764L29.1214 31.242C29.4043 31.5152 29.7832 31.6664 30.1765 31.663C30.5698 31.6596 30.946 31.5018 31.2241 31.2237C31.5022 30.9456 31.66 30.5694 31.6634 30.1761C31.6668 29.7828 31.5156 29.4039 31.2424 29.121L25.7644 23.643C27.2464 21.7629 28.1691 19.5036 28.427 17.1236C28.6849 14.7436 28.2676 12.339 27.2227 10.1851C26.1779 8.03125 24.5477 6.21503 22.5188 4.94435C20.49 3.67366 18.1443 2.99984 15.7504 3ZM6.00038 15.75C6.00038 13.1641 7.02761 10.6842 8.85609 8.85571C10.6846 7.02723 13.1645 6 15.7504 6C18.3362 6 20.8162 7.02723 22.6447 8.85571C24.4732 10.6842 25.5004 13.1641 25.5004 15.75C25.5004 18.3359 24.4732 20.8158 22.6447 22.6443C20.8162 24.4728 18.3362 25.5 15.7504 25.5C13.1645 25.5 10.6846 24.4728 8.85609 22.6443C7.02761 20.8158 6.00038 18.3359 6.00038 15.75Z"
                                            fill="#05EFB8"
                                        />{" "}
                                    </g>{" "}
                                    <defs>
                                        {" "}
                                        <clipPath id="clip0_1439_828">
                                            {" "}
                                            <rect
                                                width="36"
                                                height="36"
                                                fill="white"
                                            />{" "}
                                        </clipPath>{" "}
                                    </defs>{" "}
                                </svg>
                            </Link>
                            <Link
                                href={route("cart")}
                                as="button"
                                className="cartLink d-flex me-3 position-relative" >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="36"
                                    height="36"
                                    viewBox="0 0 36 36"
                                    fill="none"
                                >
                                    <path
                                        d="M25.5002 27.0002C23.8352 27.0002 22.5002 28.3352 22.5002 30.0002C22.5002 30.7959 22.8163 31.559 23.3789 32.1216C23.9415 32.6842 24.7046 33.0002 25.5002 33.0002C26.2959 33.0002 27.059 32.6842 27.6216 32.1216C28.1842 31.559 28.5002 30.7959 28.5002 30.0002C28.5002 29.2046 28.1842 28.4415 27.6216 27.8789C27.059 27.3163 26.2959 27.0002 25.5002 27.0002ZM1.50024 3.00024L1.50024 6.00024H4.50024L9.90024 17.3852L7.86024 21.0602C7.63524 21.4802 7.50024 21.9752 7.50024 22.5002C7.50024 23.2959 7.81631 24.059 8.37892 24.6216C8.94153 25.1842 9.70459 25.5002 10.5002 25.5002H28.5002V22.5002H11.1302C11.0308 22.5002 10.9354 22.4607 10.8651 22.3904C10.7948 22.3201 10.7552 22.2247 10.7552 22.1252C10.7552 22.0502 10.7702 21.9902 10.8002 21.9452L12.1502 19.5002H23.3252C24.4502 19.5002 25.4402 18.8702 25.9502 17.9552L31.3202 8.25024C31.4252 8.01024 31.5002 7.75524 31.5002 7.50024C31.5002 7.10242 31.3422 6.72089 31.0609 6.43958C30.7796 6.15828 30.3981 6.00024 30.0002 6.00024L7.81524 6.00024L6.40524 3.00024M10.5002 27.0002C8.83524 27.0002 7.50024 28.3352 7.50024 30.0002C7.50024 30.7959 7.81631 31.559 8.37892 32.1216C8.94153 32.6842 9.70459 33.0002 10.5002 33.0002C11.2959 33.0002 12.059 32.6842 12.6216 32.1216C13.1842 31.559 13.5002 30.7959 13.5002 30.0002C13.5002 29.2046 13.1842 28.4415 12.6216 27.8789C12.059 27.3163 11.2959 27.0002 10.5002 27.0002Z"
                                        fill="#3CFCCF"
                                    />
                                </svg>
                                {count ? 
                                    <span className="site-counter d-block">
                                        {cart}
                                    </span>
                                : "" }
                            </Link>

                            {auth?.user?.username || false ? "" : 
                                <Link href={route("login")} className="btn-pink sm text-uppercase bg-none px-4 mx-3 d-none d-xl-flex"> Login </Link>
                            }
                            <div className="d-block d-md-none menu-toggle cursor-pointer cartLink position-relative" onClick={toggleClass} >
                                <svg width="49" height="48" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.42188 36.75H40.5781M8.42188 24.75H40.5781M8.42188 12.75H40.5781" stroke="#05EFB8" stroke-width="2.625" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                           
                        </div>
                    </div>
                </div>
            </div>

            <div className={`MegaMenu ${isActive ? "Open" : null}`}>
                <div class={`${shows ? 'shows' : 'unshow'} menutoggle min-h-screen text-gray-800`}>
                    <div className={`${shows ? 'showsblur opacity-[1] max-w-[5000px] '  : 'unshowblur opacity-[0] max-w-[1px]'} blur bg-[#0005] min-h-screen w-full min-w-screen fixed top-0 left-0`} onClick={toggleClass} ></div>
                    <div class="fixed menu p-2 z-10 top-0 left-0 bg-white max-h-screen overflow-auto w-full max-w-[320px] h-full border-r">
                       {shows ? <button onClick={toggleClass} className="absolute top-4 right-4"><MdClose size={'2rem'} /></button> : ''}
                       <div class="overflow-y-auto overflow-x-hidden flex-grow">
                        <ul class=" flex flex-col pt-8 space-y-1">
                        {auth?.user?.username || false ? 
                        <>

                            <li>
                                <Link onClick={toggleClass}
                                href={"/account"}class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <IoSettingsOutline size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px] tracking-wide truncate">My Account</span>
                                </Link>
                            </li>                        
                            <li>
                                <Link onClick={toggleClass}
                                href={`/${
                                    (auth &&
                                        auth?.user?.username) ||
                                    ""
                                }`}
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <FaHeart
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px] tracking-wide truncate">My Wishlist</span>
                                </Link>
                            </li>
                            <li>
                                <a 
                                href="https://billing.stripe.com/p/login/28o3cgbav9kzbYccMM" 
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <SlCalender
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px] 
                                tracking-wide truncate">Subscription Billing</span>
                                </a>
                            </li>

                            { auth && auth.user && auth.user.stripe_details_submitted == "1" ?
                                <>
                                <li>
                                    <Link onClick={toggleClass}
                                    href={`/shop`}
                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                    <span class="inline-flex justify-center items-center ml-4">
                                    <FaBasketShopping
                                    size={'1.2rem'} />
                                    </span>
                                    <span class="ml-2 text-[17px]
                                    tracking-wide truncate">Shop</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={toggleClass}
                                    href={`/earnings`}
                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                    <span class="inline-flex justify-center items-center ml-4">
                                    <GiTwoCoins
                                    size={'1.2rem'} />
                                    </span>
                                    <span class="ml-2 text-[17px]
                                    tracking-wide truncate">Earnings</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={toggleClass}
                                    href={`/membership-dashboard`}
                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                    <span class="inline-flex justify-center items-center ml-4">
                                    <FaHouseChimneyUser
                                    size={'1.2rem'} />
                                    </span>
                                    <span class="ml-2 text-[17px]
                                    tracking-wide truncate">Membership Dashboard</span>
                                    </Link>
                                </li>
                                </>
                            : ''}

                            <li>
                                <Link onClick={toggleClass}
                                href={`/wish-tracker`}
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <FaHouseChimneyUser
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px]
                                tracking-wide truncate">Wish tracker</span>
                                </Link>
                            </li>
                        </> 
                        :

                        <>
                            <li>
                                <a 
                                href="https://billing.stripe.com/p/login/28o3cgbav9kzbYccMM" 
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <SlCalender
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px] 
                                tracking-wide truncate">Subscription Billing</span>
                                </a>
                            </li>

                            <li>
                                    <Link onClick={toggleClass}
                                    href={route("register")}
                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                    <span class="inline-flex justify-center items-center ml-4">
                                    <FaUserAlt
                                    size={'1.2rem'} />
                                    </span>
                                    <span class="ml-2 text-[17px]
                                    tracking-wide truncate">Sign Up</span>
                                    </Link>
                            </li>

                            <li>
                                <Link onClick={toggleClass}
                                href={route("login")}
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <IoIosUnlock
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px]
                                tracking-wide truncate">Login</span>
                                </Link>
                            </li>

                            <li>
                                <Link onClick={toggleClass}
                                href={route("leaderboard")}
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <FaRegStar 
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px]
                                tracking-wide truncate">Leaderboard</span>
                                </Link>
                            </li>
                            <li>
                                <Link onClick={toggleClass}
                                href={route("how-it-works")}
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <TbSettingsCog 
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px]
                                tracking-wide truncate"> How it works</span>
                                </Link>
                            </li>
                            <li>
                                <Link onClick={toggleClass}
                                href="https://blog.spennypiggy.co"
                                class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <ImBlog 
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px]
                                tracking-wide truncate">Blog</span>
                                </Link>
                            </li>
                            <li>
                                <Link onClick={toggleClass}
                                href="https://blog.spennypiggy.co"
                                class="livechat relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                <span class="inline-flex justify-center items-center ml-4">
                                <MdOutlineSupportAgent
                                size={'1.2rem'} />
                                </span>
                                <span class="ml-2 text-[17px]
                                tracking-wide truncate">Need help ?</span>
                                </Link>
                            </li>
                        </>
                        }

                            <div className="bg-gray-200 h-[1px] w-full max-w-[85%] m-auto mt-3" ></div>
                            <ul className="pt-3 ">
                                    <li>
                                        <a onClick={toggleClass}
                                        target="_blank" href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <MdOutlinePrivacyTip
                                        size={'1.2rem'} />
                                        </span>
                                        <span class="ml-2 text-[17px]
                                        tracking-wide truncate">Privacy Policy</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a onClick={toggleClass}
                                        target="_blank" href="https://app.termly.io/document/cookie-policy/45944c26-6e99-4065-833a-8fa224fb8e20"
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <BsCookie 
                                        size={'1.2rem'} />
                                        </span>
                                        <span class="ml-2 text-[17px]
                                        tracking-wide truncate">Cookies Policy</span>
                                        </a>
                                    </li>
                        
                                    <li>
                                        <a onClick={toggleClass}
                                        target="_blank" href="https://app.termly.io/document/acceptable-use/458f5fac-0c41-406f-a02f-b50adff1ec9c"
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <LuBookMinus  
                                        size={'1.2rem'} />
                                        </span>
                                        <span class="ml-2 text-[17px]
                                        tracking-wide truncate">Acceptable Use Policy</span>
                                        </a>
                                    </li>
                                    <li>
                                        <Link onClick={toggleClass}
                                        target="_blank" href={route("terms-and-conditions")}
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <GiInjustice  
                                        size={'1.2rem'} />
                                        </span>
                                        <span class="ml-2 text-[17px]
                                        tracking-wide truncate">Terms</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link onClick={toggleClass}
                                            target="_blank" href={route("promotion-terms")}
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
                                            <span class="inline-flex justify-center items-center ml-4"><CiDiscount1  size={'1.4rem'} /></span>
                                            <span class="ml-2 text-[17px] tracking-wide truncate">Promotion Terms</span>
                                        </Link>
                                    </li>
                            </ul>
                        </ul>
                        </div>
                    </div>
                    
                </div>
            </div>
        </>
    );
}
