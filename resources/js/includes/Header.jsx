import { Link, usePage, router } from "@inertiajs/react";
import { route } from 'ziggy-js';
import spennypiggy from "../../assets/img/logo.png";
import { useState, useEffect, useCallback } from "react";
import DeviceID from "./DeviceID";
import axios from "axios";
import { SiBuymeacoffee } from "react-icons/si";
import { BiTask, BiShield } from "react-icons/bi";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { add_to_cart } from "../Pages/redux/UserSlice";
import ChangeCurrency from "@/Components/ChangeCurrency";
import { IoSettingsOutline } from "react-icons/io5";
import { FaHeart, FaRegStar, FaUserAlt, FaLightbulb } from "react-icons/fa";
import { SlCalculator, SlCalender } from "react-icons/sl";
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
import { AiOutlineLogout } from "react-icons/ai";
import { FiGift } from "react-icons/fi";
import { LiaShoppingCartSolid } from "react-icons/lia";
import MagicBellNotification from "@/Pages/webpush/MagicBellNotification";

export default function Header({ classMagicword }) {
    const { global_currency, auth } = usePage().props;
    const { url } = usePage();


    const getNavLinkClass = (path) => {
        let pathName = path;
        if (typeof path === 'string' && path.startsWith('http')) {
            try { pathName = new URL(path).pathname; } catch(e) {}
        }
        const isActive = url === pathName || (typeof pathName === 'string' && pathName !== '/' && url.startsWith(pathName));
        return `relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] pr-6 border-l-4 transition-all duration-200 ${
            isActive 
            ? "border-indigo-500 text-white bg-white/10" 
            : "border-transparent hover:border-indigo-500 text-white/90 hover:text-white"
        }`;
    };

    const deviceid = DeviceID();
    const [isActive, setActive] = useState(false);
    const [shows, setShows] = useState(false);
    const toggleClass = () => {
        setActive(!isActive);
        setTimeout(() => {
            setShows(!isActive);
        }, 300);
    };

    const cart = useSelector((state) => state.data.cart.cart);
    const [count, setCount] = useState();
    const dispatch = useDispatch();

    const fetchCounter = useCallback(async () => {
        try {
            const resp = await axios.get(`/counter/${deviceid}`);
            setCount(Number(resp.data.counter));
        } catch (_err) {
            console.error("Error fetching cart counter:", _err);
        }
    }, [deviceid, dispatch, auth?.user?.id]);

    // Listen to global cart counter refresh events
    useEffect(() => {
        const handleCartCounterRefresh = (event) => {
            if (event.detail.counter !== undefined) {
                // setCount(event.detail.counter);
                // dispatch(add_to_cart(event.detail.counter));
            }
        };

        // Add event listener for global cart counter refresh
        window.addEventListener(
            "cartCounterRefreshed",
            handleCartCounterRefresh,
        );
        fetchCounter();
        return () => {
            window.removeEventListener(
                "cartCounterRefreshed",
                handleCartCounterRefresh,
            );
        };
    }, [fetchCounter, dispatch]);
    return (
        <>
            {/* <ReactDebugTest /> */}
            
            <div className="blackbg headermain fixed top-0 left-0 w-full z-40 py-4 ">
                <div className="container mx-auto px-4">
                    <div className="header flex w-full items-center  justify-between ">
                        <div className="md:flex hidden leftspaces items-center justify-start">
                            <div
                                className=" menu-toggle cursor-pointer cartLink relative"
                                onClick={toggleClass}
                            >
                                <svg
                                    width="49"
                                    height="48"
                                    viewBox="0 0 49 48"
                                    fill="#F94F96"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M8.42188 36.75H40.5781M8.42188 24.75H40.5781M8.42188 12.75H40.5781"
                                        stroke="#F94F96"
                                        strokeWidth="2.625"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <Link
                                className="hidden md:block focus:border-0 ml-3 text-[30px]"
                                href={"/leaderboard"}
                            >
                                🌟
                            </Link>
                            <Link
                                className="hidden md:block ml-3"
                                href={"/giftstore"}
                            >
                                <span className="flex items-center text-xl !font-light tracking-wider uppercase text-white font-gulfs">
                                    Gift Store
                                </span>
                            </Link>
                        </div>

                        <div className="spennylogo">
                            <Link href={route("home")}>
                                <img
                                    alt="Spenny Piggy - Financial Gifts, Exclusive Content & Memberships"
                                    height={60}
                                    width={210}
                                    src={spennypiggy}
                                    loading="eager"
                                />
                            </Link>
                        </div>

                        <div className="leftspaces cartLogin">
                            {/* {auth && auth.user && auth.user.stripe_details_submitted == "1" ? ( "" ) :
                                router.page && router.page && router.page.component == "Dashboard" ? ( */}
                            <ChangeCurrency
                                defaultvalue={global_currency}
                                changer={true}
                            />

                            {/* {auth && auth.user ? <Notifications /> : ""} */}
                            {auth && auth.user ? (
                                <div className="ms-3">
                                    <MagicBellNotification
                                        word={classMagicword}
                                    />
                                </div>
                            ) : (
                                ""
                            )}

                            <Link
                                title="Discover"
                                href={route("discover")}
                                className="ms-2 md:ms-3 discover-icon  "
                            >
                                <div className="bg-[#F94F96] rounded-full p-2 md:p-1 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 36 36"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <g clipPath="url(#clip0_1439_828)">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M15.7504 3C13.7173 3.00017 11.7137 3.48655 9.90677 4.41854C8.09985 5.35054 6.54202 6.70113 5.36323 8.35763C4.18445 10.0141 3.4189 11.9285 3.13044 13.9411C2.84199 15.9536 3.039 18.006 3.70505 19.9269C4.37109 21.8478 5.48685 23.5816 6.95924 24.9836C8.43162 26.3856 10.2179 27.4152 12.1692 27.9864C14.1204 28.5576 16.1799 28.654 18.1759 28.2674C20.1719 27.8808 22.0466 27.0224 23.6434 25.764L29.1214 31.242C29.4043 31.5152 29.7832 31.6664 30.1765 31.663C30.5698 31.6596 30.946 31.5018 31.2241 31.2237C31.5022 30.9456 31.66 30.5694 31.6634 30.1761C31.6668 29.7828 31.5156 29.4039 31.2424 29.121L25.7644 23.643C27.2464 21.7629 28.1691 19.5036 28.427 17.1236C28.6849 14.7436 28.2676 12.339 27.2227 10.1851C26.1779 8.03125 24.5477 6.21503 22.5188 4.94435C20.49 3.67366 18.1443 2.99984 15.7504 3ZM6.00038 15.75C6.00038 13.1641 7.02761 10.6842 8.85609 8.85571C10.6846 7.02723 13.1645 6 15.7504 6C18.3362 6 20.8162 7.02723 22.6447 8.85571C24.4732 10.6842 25.5004 13.1641 25.5004 15.75C25.5004 18.3359 24.4732 20.8158 22.6447 22.6443C20.8162 24.4728 18.3362 25.5 15.7504 25.5C13.1645 25.5 10.6846 24.4728 8.85609 22.6443C7.02761 20.8158 6.00038 18.3359 6.00038 15.75Z"
                                                fill="#FFFFFF"
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_1439_828">
                                                <rect
                                                    width="36"
                                                    height="36"
                                                    fill="white"
                                                />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                            </Link>

                            <Link
                                title="cart page"
                                href={route("cart")}
                                as="button"
                                className={`cartLink ms-3 relative flex ${
                                    auth?.user && window?.innerWidth < 768
                                        ? "hidden"
                                        : ""
                                }`}
                            >
                                <div className="bg-[#F94F96] p-1 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                    <LiaShoppingCartSolid
                                        color="#ffffff"
                                        size={32}
                                    />
                                </div>
                                {count > 0 ? (
                                    <span className="site-counter block">
                                        {count}
                                    </span>
                                ) : (
                                    ""
                                )}
                            </Link>

                            {auth?.user?.username || false ? (
                                ""
                            ) : (
                                <div className="hidden lg:flex gap-2 ms-3 ">
                                    <Link
                                        href={route("login")}
                                        className="bg-white uppercase text-lg  font-gulfs rounded-full px-4 py-2"
                                    >
                                        Login 
                                    </Link>
                                    <Link
                                        href={route("register")}
                                        className=" btn-shadow  hidden xl:block bg-[#F94F96] text-white uppercase text-lg  font-gulfs rounded-full px-4 py-2"
                                    >
                                        Sign Up{" "}
                                    </Link>
                                </div>
                            )}
                            <div
                                className="block ps-2 me-[-10px] md:hidden menu-toggle cursor-pointer cartLink relative"
                                onClick={toggleClass}
                            >
                                <svg
                                    width="49"
                                    height="48"
                                    viewBox="0 0 49 48"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M8.42188 36.75H40.5781M8.42188 24.75H40.5781M8.42188 12.75H40.5781"
                                        stroke="#05EFB8"
                                        strokeWidth="2.625"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-[75px] sm:h-[75px] md:h-[80px] lg:h-[82px] xl:h-[92px]"></div>

            {isActive ? (
                <div
                    className={`fixed top-0 z-50 h-full w-full  rounded-r-xl
                    transform transition-transform duration-600 ease-in-out
                     {isActive ? 'opacity-100' : '-opacity-100'}
                    flex flex-col p-8 bg-[#0008]
                    select-none  opacity-[0]
                    `}
                    onClick={toggleClass}
                ></div>
            ) : (
                ""
            )}
            <div
                className={`fixed top-0 left-0 z-50 h-full w-full md:w-[500px]  rounded-r-xl
                    transform transition-transform duration-500 ease-in-out 
                    ${isActive ? "translate-x-0" : "-translate-x-full  "}
                    flex flex-col p-8 select-none ${isActive ? "Open" : null}`} >
                <div className="fixed menu p-2 z-10 top-0 customScrollbar left-0 bg-[#fdfbf7] max-h-screen overflow-auto w-full sm:max-w-[320px] h-full">
                    <button 
                        onClick={toggleClass}
                        className="absolute top-4 md:top-4 right-4 md:right-4 bg-white border-[3px] border-black rounded-full p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all z-20" >
                        <MdClose color="#000" size={"2rem"} />
                    </button>
                    <div className="overflow-y-auto overflow-x-hidden   flex-grow">
                        <div className="pb-[110px] pt-[60px] px-2">
                            {auth?.user && (
                                <Link 
                                    href={route('user.show', { username: auth.user.username })}
                                    onClick={toggleClass}
                                    className="flex items-center gap-4 p-4 mb-6 bg-white border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group"
                                >
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-xl border-[3px] border-black overflow-hidden bg-pink-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-3 transition-transform">
                                            <img 
                                                src={auth.user.avatar_url} 
                                                alt={auth.user.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-[2px] border-black rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-black text-base uppercase tracking-tight truncate leading-tight">
                                            {auth.user.name}
                                        </span>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest truncate">
                                            @{auth.user.username}
                                        </span>
                                        <div className="mt-1 inline-flex items-center gap-1">
                                            <span className="text-[10px] font-black bg-pink-500 text-white px-1.5 py-0.5 rounded border border-black uppercase">
                                                {auth.user.role == 1 ? 'Creator' : 'User'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )}
                            <ul className=" flex flex-col pt-[0px] space-y-4 ">
                                <>
                                    {auth?.user?.username ? (
                                        <>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={"/account"}
                                                    className={`${getNavLinkClass("/account")} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <IoSettingsOutline
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        My Account
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/${
                                                        (auth &&
                                                            auth?.user
                                                                ?.username) ||
                                                        ""
                                                    }`}
                                                    className={`${getNavLinkClass(`/${(auth && auth?.user?.username) || ""}`)} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-pink-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <FaHeart
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        {auth?.user?.role == 1
                                                            ? "My Wishlist"
                                                            : "My Profile"}
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <a
                                                    href="https://billing.stripe.com/p/login/4gw3eK9Za0sDf045kk"
                                                    className={`${getNavLinkClass("https://billing.stripe.com/p/login/4gw3eK9Za0sDf045kk")} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#A2E4B8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}>
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <SlCalender
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Subscription Billing
                                                    </span>
                                                </a>
                                            </li>
                                        </>
                                    ) :""}
                                    

                                    {auth &&
                                    auth.user &&
                                    auth.user.role ==1 ? (
                                        <>
                                         <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/task/dashboard`}
                                                    className={`${getNavLinkClass('/task/dashboard')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#A2E4B8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <BiTask
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Tasks
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/shop`}
                                                    className={`${getNavLinkClass('/shop')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#b892ff] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <FaBasketShopping
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Shop
                                                    </span>
                                                </Link>
                                            </li>
                                            {/* <li>
                                                        <Link
                                                            onClick={toggleClass}
                                                            href={"giftstore"}
                                                            className="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-white/90 hover:text-white border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                        >
                                                            <span className="inline-flex justify-center items-center ml-4">
                                                                <FiGift
                                                                    color="#fff"
                                                                    size={"1.2rem"}
                                                                />
                                                            </span>
                                                            <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                                Gift Store
                                                            </span>
                                                        </Link>
                                                    </li> */}
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/earnings`}
                                                    className={`${getNavLinkClass('/earnings')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#ff6b6b] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <GiTwoCoins
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Earnings
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={route('creator.disputes.index')}
                                                    className={`${getNavLinkClass(route('creator.disputes.index'))} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#A2E4B8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <BiShield
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Disputes Center
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={route('financial.dashboard')}
                                                    className={`${getNavLinkClass(route('financial.dashboard'))} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <SlCalculator
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span> 
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Finance & Tax
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/membership-dashboard`}
                                                    className={`${getNavLinkClass('/membership-dashboard')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-pink-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <FaHouseChimneyUser
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Membership Dashboard
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/admin/feature-suggestions`}
                                                    className={`${getNavLinkClass('/admin/feature-suggestions')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#EFEA7B] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <FaLightbulb
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Feature Suggestions
                                                    </span>
                                                </Link>
                                            </li>
                                        </>
                                    ) : (
                                        ""
                                    )}
                                    {auth?.user?.username ? (
                                        <>
                                            {/* <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/purchases`}
                                                    className={getNavLinkClass('/purchases')}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-4">
                                                        <SiBuymeacoffee
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-2 text-[17px] tracking-wide truncate text-white">
                                                        All Purchases
                                                    </span>
                                                </Link>
                                            </li> */}
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/history`}
                                                    className={`${getNavLinkClass('/history')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#b892ff] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                                >
                                                    <span className="inline-flex justify-center items-center ml-2">
                                                        <SiBuymeacoffee
                                                            className="text-gray-800 group-hover:text-black transition-colors"
                                                            size={"1.5rem"}
                                                        />
                                                    </span>
                                                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                        Support History
                                                    </span>
                                                </Link>
                                            </li>
                                           
                                        </>
                                    ) : (
                                        ""
                                    )}
                                </>

                                {auth?.user?.username ? (
                                    ""
                                ) : (
                                    <>
                                        <li>
                                            <Link
                                                onClick={toggleClass}
                                                href={route("register")}
                                                className={`${getNavLinkClass(route("register"))} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#A2E4B8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                            >
                                                <span className="inline-flex justify-center items-center ml-2">
                                                    <FaUserAlt
                                                        className="text-gray-800 group-hover:text-black transition-colors"
                                                        size={"1.5rem"}
                                                    />
                                                </span>
                                                <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                    Sign Up
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                onClick={toggleClass}
                                                href={route("login")}
                                                className={`${getNavLinkClass(route("login"))} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                            >
                                                <span className="inline-flex justify-center items-center ml-2">
                                                    <IoIosUnlock
                                                        className="text-gray-800 group-hover:text-black transition-colors"
                                                        size={"1.5rem"}
                                                    />
                                                </span>
                                                <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                    Login
                                                </span>
                                            </Link>
                                        </li>
                                    </>
                                )}

                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("leaderboard")}
                                        className={`${getNavLinkClass(route("leaderboard"))} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#ff6b6b] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <FaRegStar
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                            Leaderboard
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={"/giftstore"}
                                        className={`${getNavLinkClass('/giftstore')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#b892ff] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <FiGift
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                            Gift Store
                                        </span>
                                    </Link>
                                </li>
                                {auth?.user?.role == 1 && (
                                    <li>
                                        <Link
                                            onClick={toggleClass}
                                            href={`/refer-and-earn`}
                                            className={`${getNavLinkClass('/refer-and-earn')} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#A2E4B8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                        >
                                            <span className="inline-flex justify-center items-center ml-2">
                                                <GiTwoCoins
                                                    className="text-gray-800 group-hover:text-black transition-colors"
                                                    size={"1.5rem"}
                                                />
                                            </span>
                                            <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                Refer & Earn
                                            </span>
                                        </Link>
                                    </li>
                                )}

                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("how-it-works")}
                                        className={`${getNavLinkClass(route("how-it-works"))} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <TbSettingsCog
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                            How it works
                                        </span>
                                    </Link>
                                </li>

                                <li>
                                    <div
                                        onClick={toggleClass}
                                        className={`livechat ${getNavLinkClass()} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-pink-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group cursor-pointer`}
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <MdOutlineSupportAgent
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                            Need help ?
                                        </span>
                                    </div>
                                </li>
                                <li className="bg-black h-[3px] w-full max-w-[85%] m-auto mt-3"></li>
                            </ul>
                            <ul className="pt-3 text-black space-y-2">
                                <li>
                                    <a
                                        target="_blank"
                                        onClick={toggleClass}
                                        href="https://blog.spennypiggy.co"
                                        className={`${getNavLinkClass("https://blog.spennypiggy.co")} rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#A2E4B8] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <ImBlog
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                            Blog
                                        </span>
                                    </a>
                                </li>
                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("terms-and-conditions")}
                                        className="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] border-l-4 border-transparent hover:border-indigo-500 pr-6 rounded-xl border-[3px] border-transparent hover:border-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group"
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <MdOutlinePrivacyTip
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span
                                            className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black"
                                        >
                                            Privacy Policy
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("terms-and-conditions")}
                                        className="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] border-l-4 border-transparent hover:border-indigo-500 pr-6 rounded-xl border-[3px] border-transparent hover:border-black hover:bg-pink-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group"
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <BsCookie
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span
                                            className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black"
                                        >
                                            Cookies Policy
                                        </span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("terms-and-conditions")}
                                        className="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] border-l-4 border-transparent hover:border-indigo-500 pr-6 rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#b892ff] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group"
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <LuBookMinus
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span
                                            className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black"
                                        >
                                            Acceptable Use Policy
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("terms-and-conditions")}
                                        className="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] border-l-4 border-transparent hover:border-indigo-500 pr-6 rounded-xl border-[3px] border-transparent hover:border-black hover:bg-yellow-300 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group"
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <GiInjustice
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span
                                            className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black"
                                        >
                                            Terms
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        onClick={toggleClass}
                                        target="_blank"
                                        href={route("promotion-terms")}
                                        className="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] border-l-4 border-transparent hover:border-indigo-500 pr-6 rounded-xl border-[3px] border-transparent hover:border-black hover:bg-pink-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group"
                                    >
                                        <span className="inline-flex justify-center items-center ml-2">
                                            <CiDiscount1
                                                className="text-gray-800 group-hover:text-black transition-colors"
                                                size={"1.5rem"}
                                            />
                                        </span>
                                        <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                            Promotion Terms
                                        </span>
                                    </a>
                                </li>

                                {auth && auth?.user?.username ? (
                                    <li className="block pe-3">
                                        <Link
                                            onClick={toggleClass}
                                            method="post"
                                            href={route("logout")}
                                            as="button"
                                            className="relative  w-full flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] border-l-4 border-transparent hover:border-indigo-500 pr-6 rounded-xl border-[3px] border-transparent hover:border-black hover:bg-[#ff6b6b] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group"
                                        >
                                            <span className="inline-flex justify-center items-center ml-2">
                                                <AiOutlineLogout
                                                    className="text-gray-800 group-hover:text-black transition-colors"
                                                    size={"1.5rem"}
                                                />
                                            </span>
                                            <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                                                    Logout
                                            </span>
                                        </Link>
                                    </li>
                                ) : (
                                    ""
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
