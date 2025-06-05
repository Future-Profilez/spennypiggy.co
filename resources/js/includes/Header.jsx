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
import { RiPagesLine } from "react-icons/ri";
import { FiGift } from "react-icons/fi";
import { LiaShoppingCartSolid } from "react-icons/lia";
import MagicBellNotification from "@/Pages/webpush/MagicBellNotification";

export default function Header({classMagicword}) {
    const { global_currency, auth } = usePage().props;
    
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
    async function fetchCounter() {
        axios
            .get(`/counter/${deviceid}`)
            .then((resp) => {
                setCount(resp.data.counter);
                dispatch(add_to_cart(resp.data.counter));
            })
            .catch((_err) => {
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
                        
                        <div className="md:flex hidden leftspaces items-center justify-content-start">
                            <div
                                className=" menu-toggle cursor-pointer cartLink position-relative"
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
                                        stroke-width="2.625"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </div>
                            <Link
                                className="d-none d-md-block focus:border-0 ms-3 text-[30px]"
                                href={"/leaderboard"}
                            >
                                🌟
                            </Link>
                            <Link
                                className="d-none d-md-block ms-3"
                                href={"/giftstore"}
                            >
                                <span className="flex items-center text-xl uppercase text-white font-gulfs">
                                    Gift Store
                                </span>
                            </Link>
                        </div>

                        <div className="spennylogo">
                            <Link href={route("home")}>
                                <LazyLoadImage
                                    alt={"image"}
                                    height={60}
                                    useIntersectionObserver={true}
                                    effect="blur"
                                    src={spennypiggy}
                                    width={210}
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
                            {auth && auth.user ? 
                                <div className="mr-2">
                                    <MagicBellNotification word={classMagicword} />
                                </div>
                            : ""}

{/* hidden md:block */}
                            <Link
                                href={route("discover")}
                                className="me-2 md:me-3 discover-icon  " >
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

                            {auth?.user && (
                                <Link
                                    href={route("cart")}
                                    as="button"
                                    className="cartLink hidden me-3 position-relative  md:flex" >
                                    <div className="bg-[#F94F96] p-1 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                        <LiaShoppingCartSolid
                                            color="#ffffff"  size={32}
                                        />
                                    </div>

                                    {count ? (
                                        <span className="site-counter d-block">
                                            {cart}
                                        </span>
                                    ) : (
                                        ""
                                    )}
                                </Link>
                            )}



                            {auth?.user?.username || false ? (
                                ""
                            ) : (
                                <div className="hidden lg:flex gap-2">
                                    <Link
                                        href={route("login")}
                                        className="bg-white uppercase text-lg  font-gulfs rounded-full px-4 py-2"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href={route("register")}
                                        className="hidden xl:block bg-[#F94F96] text-white uppercase text-lg  font-gulfs rounded-full px-4 py-2"
                                    >
                                        Sign Up{" "}
                                    </Link>
                                </div>
                            )}
                            <div
                                className= "block md:hidden menu-toggle cursor-pointer cartLink position-relative"
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
                                        stroke-width="2.625"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`MegaMenu ${isActive ? "Open" : null}`}>
                <div
                    class={`${
                        shows ? "shows" : "unshow"
                    } menutoggle min-h-screen text-gray-800`}
                >
                    <div
                        className={`${
                            shows
                                ? "showsblur opacity-[1] max-w-[5000px] "
                                : "unshowblur opacity-[0] max-w-[1px]"
                        } blur bg-[#0005] min-h-screen w-full min-w-screen fixed top-0 left-0`}
                        onClick={toggleClass}
                    ></div>
                    <div class="fixed menu p-2 z-10 top-0 left-0 pinkbg max-h-screen overflow-auto w-full sm:max-w-[320px] h-full border-r">
                        <button
                            onClick={toggleClass}
                            className="absolute top-3 right-4"
                        >
                            <MdClose color="#fff" size={"2rem"} />
                        </button>
                        <div class="overflow-y-auto overflow-x-hidden flex-grow">
                            <ul class=" flex flex-col pt-8 space-y-1">
                                <>
                                    {auth?.user?.username ? 
                                        <>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={"/account"}
                                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                >
                                                    <span class="inline-flex justify-center items-center ml-4">
                                                        <IoSettingsOutline
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                        My Account
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/${
                                                        (auth &&
                                                            auth?.user?.username) ||
                                                        ""
                                                    }`}
                                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                >
                                                    <span class="inline-flex justify-center items-center ml-4">
                                                        <FaHeart
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                    {auth?.user?.role == 1 ? "My Wishlist" : "My Profile" } 
                                                    </span>
                                                </Link>
                                            </li>
                                        </> 
                                    : ''}
                                    <li>
                                        <a
                                            href="https://billing.stripe.com/p/login/4gw3eK9Za0sDf045kk"
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <SlCalender
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                Subscription Billing
                                            </span>
                                        </a>
                                    </li>

                                    {auth &&
                                    auth.user &&
                                    auth.user.stripe_details_submitted ==
                                        "1" ? (
                                        <>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/shop`}
                                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                >
                                                    <span class="inline-flex justify-center items-center ml-4">
                                                        <FaBasketShopping
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span class="ml-2 text-[17px]  tracking-wide truncate text-white">
                                                        Shop
                                                    </span>
                                                </Link>
                                            </li>
                                            {/* <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={"giftstore"}
                                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                >
                                                    <span class="inline-flex justify-center items-center ml-4">
                                                        <FiGift
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                        Gift Store
                                                    </span>
                                                </Link>
                                            </li> */}
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/earnings`}
                                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                >
                                                    <span class="inline-flex justify-center items-center ml-4">
                                                        <GiTwoCoins
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span class="ml-2 text-[17px] tracking-wide truncate text-white" >
                                                        Earnings
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    onClick={toggleClass}
                                                    href={`/membership-dashboard`}
                                                    class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                                >
                                                    <span class="inline-flex justify-center items-center ml-4">
                                                        <FaHouseChimneyUser
                                                            color="#fff"
                                                            size={"1.2rem"}
                                                        />
                                                    </span>
                                                    <span
                                                        class="ml-2 text-[17px]
                            tracking-wide truncate text-white"
                                                    >
                                                        Membership Dashboard
                                                    </span>
                                                </Link>
                                            </li>
                                        </>
                                    ) : (
                                        ""
                                    )}

                                    <li>
                                        <Link
                                            onClick={toggleClass}
                                            href={`/wish-tracker`}
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <SlCalculator
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span
                                                class="ml-2 text-[17px]
                        tracking-wide truncate text-white"
                                            >
                                                Wish tracker
                                            </span>
                                        </Link>
                                    </li>
                                </>
                                 
                                {auth?.user?.username ? 
                                '' : (
                                    <>
                                        <li>
                                            <Link
                                                onClick={toggleClass}
                                                href={route("register")}
                                                class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                            >
                                                <span class="inline-flex justify-center items-center ml-4">
                                                    <FaUserAlt
                                                        color="#fff"
                                                        size={"1.2rem"}
                                                    />
                                                </span>
                                                <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                    {" "}
                                                    Sign Up{" "}
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                onClick={toggleClass}
                                                href={route("login")}
                                                class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                            >
                                                <span class="inline-flex justify-center items-center ml-4">
                                                    <IoIosUnlock
                                                        color="#fff"
                                                        size={"1.2rem"}
                                                    />
                                                </span>
                                                <span class="ml-2 text-[17px] tracking-wide truncate text-white">
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
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                    >
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <FaRegStar
                                                color="#fff"
                                                size={"1.2rem"}
                                            />
                                        </span>
                                        <span class="ml-2 text-[17px] tracking-wide truncate text-white" >
                                            Leaderboard
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={"giftstore"}
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                    >
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <FiGift
                                                color="#fff"
                                                size={"1.2rem"}
                                            />
                                        </span>
                                        <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                            Gift Store
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        href={route("how-it-works")}
                                        class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                    >
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <TbSettingsCog
                                                color="#fff"
                                                size={"1.2rem"}
                                            />
                                        </span>
                                        <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                            {" "}
                                            How it works
                                        </span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        onClick={toggleClass}
                                        
                                        class="livechat relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                    >
                                        <span class="inline-flex justify-center items-center ml-4">
                                            <MdOutlineSupportAgent
                                                color="#fff"
                                                size={"1.2rem"}
                                            />
                                        </span>
                                        <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                            Need help ?
                                        </span>
                                    </Link>
                                </li>
                                <div className="bg-[#ff87b8] h-[1px] w-full max-w-[85%] m-auto mt-3"></div>
                                <ul className="pt-3 text-white ">
                                    <li>
                                        <a target="_blank"
                                            onClick={toggleClass}
                                            href="https://blog.spennypiggy.co"
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <ImBlog
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span
                                                class="ml-2 text-[17px] tracking-wide truncate text-white" >
                                                Blog
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            onClick={toggleClass}
                                            target="_blank"
                                            href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <MdOutlinePrivacyTip
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span
                                                class="ml-2 text-[17px]
                                    tracking-wide truncate text-white"
                                            >
                                                Privacy Policy
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            onClick={toggleClass}
                                            target="_blank"
                                            href="https://app.termly.io/document/cookie-policy/45944c26-6e99-4065-833a-8fa224fb8e20"
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <BsCookie
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span
                                                class="ml-2 text-[17px]
                                    tracking-wide truncate text-white"
                                            >
                                                Cookies Policy
                                            </span>
                                        </a>
                                    </li>

                                    <li>
                                        <a
                                            onClick={toggleClass}
                                            target="_blank"
                                            href="https://app.termly.io/document/acceptable-use/458f5fac-0c41-406f-a02f-b50adff1ec9c"
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <LuBookMinus
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span
                                                class="ml-2 text-[17px]
                                    tracking-wide truncate text-white"
                                            >
                                                Acceptable Use Policy
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <Link
                                            onClick={toggleClass}
                                            target="_blank"
                                            href={route("terms-and-conditions")}
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <GiInjustice
                                                    color="#fff"
                                                    size={"1.2rem"}
                                                />
                                            </span>
                                            <span
                                                class="ml-2 text-[17px]
                                    tracking-wide truncate text-white"
                                            >
                                                Terms
                                            </span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            onClick={toggleClass}
                                            target="_blank"
                                            href={route("promotion-terms")}
                                            class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                        >
                                            <span class="inline-flex justify-center items-center ml-4">
                                                <CiDiscount1
                                                    color="#fff"
                                                    size={"1.4rem"}
                                                />
                                            </span>
                                            <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                Promotion Terms
                                            </span>
                                        </Link>
                                    </li>

                                    {auth && auth?.user?.username ? (
                                        <li className="d-block">
                                            <Link
                                                onClick={toggleClass}
                                                method="get"
                                                href={route("logout")}
                                                class="relative flex flex-row items-center h-11 focus:outline-none hover:opacity-[0.8] text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
                                            >
                                                <span class="inline-flex justify-center items-center ml-4">
                                                    <AiOutlineLogout
                                                        color="#fff"
                                                        size={"1.4rem"}
                                                    />
                                                </span>
                                                <span class="ml-2 text-[17px] tracking-wide truncate text-white">
                                                    Logout
                                                </span>
                                            </Link>
                                        </li>
                                    ) : (
                                        ""
                                    )}
                                </ul>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
