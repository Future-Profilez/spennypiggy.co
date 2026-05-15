import { Link, usePage, router } from "@inertiajs/react";
import { route } from 'ziggy-js';
import spennypiggy from "../../assets/img/logo.png";
import { useState, useEffect, useCallback, useRef } from "react";
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
import { 
    SettingsIcon, 
    HeartIcon, 
    ShoppingBagIcon, 
    ClipboardIcon, 
    HandCoinsIcon, 
    ShieldCheckIcon, 
    SearchIcon, 
    MenuIcon, 
    ShoppingCartIcon,
    XIcon,
    LogoutIcon,
    DashboardIcon,
    UserIcon,
    LockIcon,
    EyeIcon,
    HouseIcon,
    InfoIcon,
    TriangleAlertIcon,
} from "@animateicons/react/lucide";
import { 
    ClipboardList, 
    Coins, 
    Shield, 
    Calculator, 
    Home, 
    Gift, 
    LayoutDashboard, 
    FileText, 
    HelpCircle, 
    Lightbulb, 
    Calendar, 
    Cookie,
    LogOut,
    Shield as ShieldIcon,
    FileText as FileTextIcon
} from "lucide-react";
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
    const menuTouchStartRef = useRef({ x: 0, y: 0 });
    const suppressMenuClickUntilRef = useRef(0);

    const toggleClass = () => {
        setActive(!isActive);
        setTimeout(() => {
            setShows(!isActive);
        }, 300);
    };

    const handleMenuTouchStart = useCallback((e) => {
        const touch = e.touches?.[0];
        if (!touch) return;

        menuTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }, []);

    const handleMenuTouchMove = useCallback((e) => {
        const touch = e.touches?.[0];
        if (!touch) return;

        const deltaX = Math.abs(touch.clientX - menuTouchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - menuTouchStartRef.current.y);

        // Finger movement means user is scrolling the drawer, not tapping a link.
        if (deltaX > 8 || deltaY > 8) {
            suppressMenuClickUntilRef.current = Date.now() + 350;
        }
    }, []);

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

    const NavLinkWithIcon = ({ href, icon: Icon, label, onClick, activeColor, isExternal = false, ...props }) => {
        const iconRef = useRef(null);
        const timeoutRef = useRef(null);
        const Component = isExternal ? 'a' : Link;

        useEffect(() => {
            const startLoop = () => {
                if (iconRef.current) {
                    iconRef.current.startAnimation?.();
                }
                // Schedule next animation with some randomness (4-7 seconds) for a natural feel
                const nextDelay = 4000 + Math.random() * 3000;
                timeoutRef.current = setTimeout(startLoop, nextDelay);
            };
            
            // Initial random delay to stagger animations
            const initialDelay = Math.random() * 3000;
            const initialTimeout = setTimeout(startLoop, initialDelay);
            
            return () => {
                clearTimeout(initialTimeout);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        }, []);

        const handleNavClick = (e) => {
            if (Date.now() < suppressMenuClickUntilRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            onClick?.(e);
        };

        return (
            <li>
                <Component
                    onClick={handleNavClick}
                    href={href}
                    onMouseEnter={() => iconRef.current?.startAnimation?.()}
                    className={`${getNavLinkClass(href)} rounded-xl border-[3px] border-transparent hover:border-black ${activeColor} hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all px-2 py-3 mx-2 group`}
                    {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    {...props}
                >
                    <span className="inline-flex justify-center items-center ml-2">
                        <Icon
                            ref={iconRef}
                            className="text-gray-800 group-hover:text-black transition-colors"
                            size={24}
                            duration={1.5}
                        />
                    </span>
                    <span className="ml-3 text-[16px] font-black uppercase tracking-widest truncate text-black">
                        {label}
                    </span>
                </Component>
            </li>
        );
    };

    return (
        <>
            {/* <ReactDebugTest /> */}
            
            <div className="blackbg headermain fixed top-0 left-0 w-full z-[100] py-4 ">
                <div className="container mx-auto px-4">
                    <div className="header flex w-full items-center  justify-between ">
                        <div className="md:flex hidden leftspaces items-center justify-start">
                            <div
                                className=" menu-toggle cursor-pointer cartLink relative"
                                onClick={toggleClass}
                            >
                                <MenuIcon
                                    size={48}
                                    color="#F94F96"
                                />
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
                                <div className="bg-[#F94F96] rounded-full !p-3 md:!p-2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                    <SearchIcon
                                        // size={28}
                                        color="#ffffff"
                                    />
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
                                <div className="bg-[#F94F96] p-3 md:p-2 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                    <ShoppingCartIcon
                                        color="#ffffff"
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
                                className="block ps-2 mt-[10px] me-[-10px] md:hidden menu-toggle cursor-pointer cartLink relative"
                                onClick={toggleClass}
                            >
                                <MenuIcon
                                    size={48}
                                    color="#05EFB8"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-[75px] sm:h-[75px] md:h-[80px] lg:h-[82px] xl:h-[92px]"></div>

            {isActive ? (
                <div
                    className={`fixed top-0 z-[1000001] h-full w-full  rounded-r-xl
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
                className={`fixed top-0 left-0 z-[1000002] h-full w-full md:w-[500px]  rounded-r-xl
                    transform transition-transform duration-500 ease-in-out 
                    ${isActive ? "translate-x-0" : "-translate-x-full  "}
                    flex flex-col p-8 select-none ${isActive ? "Open" : null}`} >
                <div className="fixed menu p-2 z-10 top-0 customScrollbar left-0 bg-[#fdfbf7] max-h-screen overflow-auto w-full sm:max-w-[320px] h-full">
                    <button 
                        onClick={toggleClass}
                        className="absolute h-[45px] top-4 md:top-4 right-4 md:right-4 bg-white border-[3px] border-black rounded-lg p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all z-20" >
                        <XIcon color="#000" size={32} />
                    </button>
                    <div
                        className="overflow-y-auto overflow-x-hidden   flex-grow"
                        onTouchStart={handleMenuTouchStart}
                        onTouchMove={handleMenuTouchMove}
                    >
                        <div className="pb-[110px] pt-[60px] px-2">
                            {auth?.user && (
                                <Link 
                                    href={route('user.show', { username: auth.user.username })}
                                    onClick={(e) => {
                                        if (Date.now() < suppressMenuClickUntilRef.current) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return;
                                        }
                                        toggleClass();
                                    }}
                                    className="flex items-center gap-4 p-4 mb-6 bg-white sborder-[3px] sborder-black srounded-[20px] sshadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:sshadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group"
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
                                            {auth.user.role == 1 && auth.user.default_currency && (
                                                <span className="text-[10px] font-black bg-yellow-300 text-black px-1.5 py-0.5 rounded border border-black uppercase">
                                                    {auth.user.default_currency}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )}
                            <ul className=" flex flex-col pt-[0px] space-y-4 ">
                                <>
                                    {auth?.user?.username ? (
                                        <>
                                            <NavLinkWithIcon
                                                href="/account"
                                                onClick={toggleClass}
                                                icon={SettingsIcon}
                                                label="My Account"
                                                activeColor="hover:bg-yellow-300"
                                            />
                                            <NavLinkWithIcon
                                                href={`/${auth?.user?.username || ""}`}
                                                onClick={toggleClass}
                                                icon={HeartIcon}
                                                label={auth?.user?.role == 1 ? "My Wishlist" : "My Profile"}
                                                activeColor="hover:bg-pink-400"
                                            />
                                            <NavLinkWithIcon
                                                href="https://billing.stripe.com/p/login/4gw3eK9Za0sDf045kk"
                                                icon={Calendar}
                                                label="Subscription Billing"
                                                activeColor="hover:bg-[#A2E4B8]"
                                                isExternal={true}
                                            />
                                        </>
                                    ) :""}
                                    
                                    {auth?.user?.username && (
                                        <NavLinkWithIcon
                                            href="/shop"
                                            onClick={toggleClass}
                                            icon={ShoppingBagIcon}
                                            label="Shop"
                                            activeColor="hover:bg-[#b892ff]"
                                        />
                                    )}

                                    {auth && auth.user  ?
                                        <NavLinkWithIcon
                                            href="/task/dashboard" activeColor="hover:bg-[#A2E4B8]"
                                            onClick={toggleClass} icon={ClipboardIcon} label="Tasks"
                                        /> 
                                    : ''}
                                    
                                    {auth && auth.user && auth.user.role ==1 ? (
                                        <>
                                            <NavLinkWithIcon
                                                href="/financial/dashboard/payouts"
                                                onClick={toggleClass}
                                                icon={DashboardIcon}
                                                label="Payouts"
                                                activeColor="hover:bg-[#A2E4B8]"
                                            />
                                            <NavLinkWithIcon
                                                href="/earnings"
                                                onClick={toggleClass}
                                                icon={HandCoinsIcon}
                                                label="Earnings"
                                                activeColor="hover:bg-[#ff6b6b]"
                                            />
                                            <NavLinkWithIcon
                                                href={route('creator.disputes.index')}
                                                onClick={toggleClass}
                                                icon={ShieldCheckIcon}
                                                label="Disputes Center"
                                                activeColor="hover:bg-[#A2E4B8]"
                                            />
                                            {auth?.user?.role == 1 && (
                                                <NavLinkWithIcon
                                                    href={route('financial.dashboard')}
                                                    onClick={toggleClass}
                                                    icon={DashboardIcon}
                                                    label="Finance & Tax"
                                                    activeColor="hover:bg-yellow-300"
                                                />
                                            )}
                                            <NavLinkWithIcon
                                                href="/membership-dashboard"
                                                onClick={toggleClass}
                                                icon={HouseIcon}
                                                label="Membership Dashboard"
                                                activeColor="hover:bg-pink-400"
                                            />
                                            <NavLinkWithIcon
                                                href="/admin/feature-suggestions"
                                                onClick={toggleClass}
                                                icon={InfoIcon}
                                                label="Feature Suggestions"
                                                activeColor="hover:bg-[#EFEA7B]"
                                            />
                                        </>
                                    ) : (
                                        ""
                                    )}
                                    {auth?.user?.username ? (
                                        <NavLinkWithIcon
                                            href="/history"
                                            onClick={toggleClass}
                                            icon={HandCoinsIcon}
                                            label="Support History"
                                            activeColor="hover:bg-[#b892ff]"
                                        />
                                    ) : (
                                        ""
                                    )}
                                </>

                                {auth?.user?.username ? (
                                    ""
                                ) : (
                                    <>
                                        <NavLinkWithIcon
                                            href={route("register")}
                                            onClick={toggleClass}
                                            icon={UserIcon}
                                            label="Sign Up"
                                            activeColor="hover:bg-[#A2E4B8]"
                                        />
                                        <NavLinkWithIcon
                                            href={route("login")}
                                            onClick={toggleClass}
                                            icon={LockIcon}
                                            label="Login"
                                            activeColor="hover:bg-yellow-300"
                                        />
                                    </>
                                )}

                                <NavLinkWithIcon
                                    href={route("leaderboard")}
                                    onClick={toggleClass}
                                    icon={DashboardIcon}
                                    label="Leaderboard"
                                    activeColor="hover:bg-[#ff6b6b]"
                                />
                                <NavLinkWithIcon
                                    href="/giftstore"
                                    onClick={toggleClass}
                                    icon={HeartIcon}
                                    label="Gift Store"
                                    activeColor="hover:bg-[#b892ff]"
                                />
                                {auth?.user?.role == 1 && (
                                    <>
                                    <NavLinkWithIcon
                                        href="/refer-and-earn"
                                        onClick={toggleClass}
                                        icon={HandCoinsIcon}
                                        label="Refer & Earn"
                                        activeColor="hover:bg-[#A2E4B8]"
                                    />
                                   
                                    </>
                                )}

                                <NavLinkWithIcon
                                    href={route("how-it-works")}
                                    onClick={toggleClass}
                                    icon={SettingsIcon}
                                    label="How it works"
                                    activeColor="hover:bg-yellow-300"
                                />

                                <NavLinkWithIcon
                                    href="#"
                                    onClick={toggleClass}
                                    icon={InfoIcon}
                                    label="Need help ?"
                                    activeColor="hover:bg-pink-400"
                                />
                                <li className="bg-black h-[3px] w-full max-w-[85%] m-auto mt-3"></li>
                            </ul>
                            <ul className="pt-3 text-black space-y-2">
                                <NavLinkWithIcon
                                    href="https://blog.spennypiggy.co"
                                    onClick={toggleClass}
                                    icon={DashboardIcon}
                                    label="Blog"
                                    activeColor="hover:bg-[#A2E4B8]"
                                    isExternal={true}
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={ShieldCheckIcon}
                                    label="Privacy Policy"
                                    activeColor="hover:bg-yellow-300"
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={InfoIcon}
                                    label="Cookies Policy"
                                    activeColor="hover:bg-pink-400"
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={DashboardIcon}
                                    label="Acceptable Use Policy"
                                    activeColor="hover:bg-[#b892ff]"
                                />
                                <NavLinkWithIcon
                                    href={route("terms-and-conditions")}
                                    onClick={toggleClass}
                                    icon={ShieldCheckIcon}
                                    label="Terms"
                                    activeColor="hover:bg-yellow-300"
                                />
                                <NavLinkWithIcon
                                    href={route("promotion-terms")}
                                    onClick={toggleClass}
                                    icon={HeartIcon}
                                    label="Promotion Terms"
                                    activeColor="hover:bg-pink-400"
                                    isExternal={true}
                                />

                                {auth && auth?.user?.username ? (
                                    <NavLinkWithIcon
                                        href={route("logout")}
                                        onClick={toggleClass}
                                        method="post"
                                        as="button"
                                        icon={LogoutIcon}
                                        label="Logout"
                                        activeColor="hover:bg-[#ff6b6b]"
                                    />
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
