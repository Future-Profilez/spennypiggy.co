import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, usePage } from "@inertiajs/react";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.jpg";
import { addicon } from "@/includes/Icons";
const Wishlist = React.lazy(() => import("./Auth/Wishlist"));
const Wishlistbox = React.lazy(() => import("@/wishlist/Wishlistbox"));
const Userprofile = React.lazy(() => import("@/wishlist/Userprofile"));
const ShareProfile = React.lazy(() => import("@/wishlist/ShareProfile"));
const Nocontent = React.lazy(() => import("@/includes/Nocontent"));
const LoadingScreen = React.lazy(() => import("@/includes/LoadingScreen"));
const VersionUpdate = React.lazy(() => import("@/Components/VersionUpdate"));
const PaymentDashboard = React.lazy(() => import("./stripe/PaymentDashboard"));
const ChangeCurrency = React.lazy(() => import("@/Components/ChangeCurrency"));
const Popup = React.lazy(() => import("@/Components/Popup"));
const MembershipsLists = React.lazy(() =>
    import("./membership/MembershipsLists")
);
const AddMembership = React.lazy(() => import("./membership/AddMembership"));
const Gifter = React.lazy(() => import("./gifter/Gifter"));
const AddBills = React.lazy(() => import("./bills/AddBills"));
const EditCategories = React.lazy(() => import("@/wishlist/EditCategories"));
const TipInner = React.lazy(() => import("./TipJar/TipInner"));
const Billslist = React.lazy(() => import("./bills/Billslist"));
const FeedList = React.lazy(() => import("./feed/FeedList"));
const AddPost = React.lazy(() => import("./feed/AddPost"));
const AddIntro = React.lazy(() => import("./intros/AddIntro"));
const MyGoal = React.lazy(() => import("./TipJar/MyGoal"));
const SocialLinks = React.lazy(() => import("@/includes/SocialLinks"));
import axios from "axios";
import Guest from "@/Layouts/GuestLayout";
import { LazyLoadImage } from "react-lazy-load-image-component";
import useWidthCount from "@/Components/useWidthCount";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import PaymentUnActivated from "@/Components/PaymentUnActivated";
import { Tabs } from "react-tabs-scrollable";
import "react-tabs-scrollable/dist/rts.css";
import ProfileSteps from "./Profile/ProfileSteps";
import ProfileProductLists from "./shop/profile/ProfileProductLists";
import AddItem from "./shop/AddItem";
import AddGift from "./feed/AddGift";
import GiftListing from "./rye/GiftListing";
import { FaRegHeart } from "react-icons/fa";
import { CiGift } from "react-icons/ci";
import OldSubscribe from "./webpush/OldSubscribe";
import AddSocial from "./Auth/Social";
import CreatorVerification from "./Profile/CreatorVerification";
import SiteSubscription from "./Profile/SiteSubscription";
import EnableCardCapabilities from "./stripe/EnableCardCapabilities";
import UpgradeStripeAccount from "./stripe/UpgradeStripeAccount";

export default function Dashboard(props) {

    console.log(props)


    const w = useWidthCount();
    const {
        auth,
        user,
        username, card_capabilities, isNeedToUpgrade,
        global_currency,
        itemid,
        slinks,
        wish_categories,
        items,
        page,
        selectedCategory,
    } = props;
    const [wishitems, setWishitems] = useState(
        useMemo(() => items || [], [items])
    );
    const [tab, setTab] = useState(0);

    const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();
    const [IsloggedIn, setIsLoggedIn] = useState(
        (auth && auth.user && auth.user.username) == (user && user.username)
    );
    const [loading, setLoading] = useState(false);
    const [giftsloading, setGiftsLoading] = useState(false);
    const [sLinks, setLinks] = useState(slinks || []);
    const [gifts, setGifts] = useState([]);

    const fetch_gifts = async (signal) => {
        setGiftsLoading(true);
        axios
            .get(`/gift-items/${username}`, { signal })
            .then((resp) => {
                setGifts(resp?.data?.items);
                setGiftsLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setGiftsLoading(false);
            });
    };

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        fetch_gifts(signal);
        return () => controller.abort();
    }, [tab]);

    const currencyaction = (e) => {
        if (e == "open") {
            setOpenCurrency(true);
        } else {
            setOpenCurrency(false);
        }
    };
    const [openCurrency, setOpenCurrency] = useState(null);
    useEffect(() => {
        if (global_currency == null) {
            setOpenCurrency(true);
        }
    });

    const updateMovement = async (updated) => {
        const array = [];
        updated.forEach((name) => {
            array.push(name.id);
        });
        axios
            .post(`/update/move-wish`, {
                shuffled_items: array,
            })
            .then((resp) => {})
            .catch((_err) => {
                console.error("error", _err);
            });
    };
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 50, tolerance: 10 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        if (!IsloggedIn) {
            return false;
        }
        const { active, over } = event;
        const activeIndex = wishitems.findIndex(
            (item) => item.id === active.id
        );
        const newOverIndex = over
            ? wishitems.findIndex((item) => item.id === over.id)
            : null;
        if (activeIndex !== newOverIndex) {
            const updated = arrayMove(wishitems, activeIndex, newOverIndex, {
                key: "id",
            });
            setWishitems(updated);
            updateMovement(updated);
        }
    };

    const { flash, errors } = usePage().props;
    useEffect(() => {
        if (errors) {
            Object.entries(errors).forEach(([key, value]) => {
                errorAlert(value);
            });
        }
        if (flash?.success) {
            setTimeout(() => {
                successAlert(flash.success);
            }, 500);
        }
        if (flash?.error) {
            setTimeout(() => {
                errorAlert(flash.error);
            }, 500);
        }
        if (flash?.warning) {
            setTimeout(() => {
                warningAlert(flash.warning);
            }, 500);
        }
        if (flash?.info) {
            setTimeout(() => {
                infoAlert(flash.info);
            }, 500);
        }
    }, [errors, flash]);

    const [showAlert, setShowAlert] = useState(true);
    useEffect(() => {
        const dismissedAt = localStorage.getItem("stripeAlertDismissedAt");
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            if (elapsed < oneMonth) {
                setShowAlert(false);
            }
        }
    }, []);
    const handleDismiss = () => {
        localStorage.setItem("stripeAlertDismissedAt", Date.now().toString());
        setShowAlert(false);
    };

    useEffect(() => {
        if (auth?.user?.email && twq) {
            twq("event", "tw-ozu4h-pt5uc", {
                conversion_id: auth?.user?.uuid,
                email_address: auth?.user?.email,
            });
        }
    }, []);

    const Toggle = () => {
        const [showAdd, setShowAdd] = useState(false);
        useEffect(() => {
            if (showAdd) {
                document.body.classList.add("overflow-hidden");
            } else {
                document.body.classList.remove("overflow-hidden");
            }
        }, [showAdd]);

        const [wishOptions, setWishOptions] = useState(false);

        return (
            <>
                {IsloggedIn ? (
                    <>
                        <div
                            onClick={() => setShowAdd(true)}
                            className="addoption-action cursor-pointer px-3 "
                            dangerouslySetInnerHTML={{ __html: addicon }}
                        ></div>
                        {showAdd ? (
                            <div
                                className="bg-[#0001] rounded-xl position-fixed shadow-lg z-[99999999999999999999] flex justify-center items-center
                     top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] w-full h-full"
                            >
                                <div className="w-full max-w-[550px]  px-3">
                                    <Suspense fallback={"Loading.."}>
                                        <div className="bg-gray-100 w-full p-6 md:p-10 rounded-3xl shadow-lg z-10">
                                            <h2 className="  text-black font-gulfs uppercase text-xl md:text-2xl mb-4 text-center m-auto ">
                                                Fund your Lifestyle
                                            </h2>
                                            <div className="max-h-[55vh]  sm:max-h-[40vh] overflow-y-auto">
                                                {wishOptions ? (
                                                    <div>
                                                        <Wishlist
                                                            text="Cash Gift"
                                                            currency={
                                                                global_currency
                                                            }
                                                            setuped={
                                                                AuthUserStripeConnected ==
                                                                1
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <div className="w-full font-bold disabled addop bg-white rounded-xl p-3 mb-2 text-center">
                                                            <div className=" flex items-center">
                                                                <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                    <CiGift
                                                                        color="var(--pink)"
                                                                        size="1.5rem"
                                                                    />
                                                                </div>
                                                                <div className="ps-3 text-start">
                                                                    <h2 className="text-md font-normal font-GillSans uppercase">
                                                                        Add
                                                                        Surprise
                                                                        Gift
                                                                    </h2>
                                                                    <p className="text-sm font-poppins">
                                                                        Lets
                                                                        supporters
                                                                        pick
                                                                        from the
                                                                        1000’s
                                                                        of Gifts
                                                                        in the
                                                                        Oink
                                                                        Gift
                                                                        Zone
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div
                                                            className={`${
                                                                AuthUserStripeConnected ==
                                                                1
                                                                    ? "block"
                                                                    : "disabled"
                                                            }`}
                                                        >
                                                            <div
                                                                onClick={() =>
                                                                    setWishOptions(
                                                                        true
                                                                    )
                                                                }
                                                                className="w-full font-bold addop bg-white rounded-xl p-3 mb-2 text-center cursor-pointer"
                                                            >
                                                                <div className=" flex items-center">
                                                                    <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                        <FaRegHeart
                                                                            color="var(--pink)"
                                                                            size="1.5rem"
                                                                        />
                                                                    </div>
                                                                    <div className="ps-3 text-start">
                                                                        <h2 className="text-md font-normal font-GillSans uppercase">
                                                                            Add
                                                                            Wish
                                                                        </h2>
                                                                        <p className="text-sm font-poppins">
                                                                            Let
                                                                            fans
                                                                            fund
                                                                            your
                                                                            lifestyle
                                                                            for
                                                                            a
                                                                            reward.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <AddItem
                                                                classes="w-full font-bold addop bg-white rounded-xl p-3 mb-2 text-center"
                                                                product_type="digital_products"
                                                            />
                                                            <AddPost classes="font-bold py-3 px-3 mb-2 text-center" />
                                                            <AddGift
                                                                text="Add Gift "
                                                                classes="font-bold py-3 px-3 mb-2 text-center"
                                                                fetch_gifts={
                                                                    fetch_gifts
                                                                }
                                                                addressAdded={
                                                                    auth?.user
                                                                        ?.is_creator_address_found
                                                                }
                                                            />
                                                            <AddMembership />
                                                            <AddBills />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowAdd(false);
                                                    setWishOptions(false);
                                                }}
                                                className="m-auto table p-2 mt-3"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </Suspense>
                                </div>
                            </div>
                        ) : (
                            ""
                        )}
                    </>
                ) : (
                    ""
                )}
            </>
        );
    };

    const [UserStripeConnected, setUserStripeConnected] = useState(parseInt(user && user?.stripe_details_submitted) || 0)
    const [AuthUserStripeConnected, setAuthUserStripeConnected] = useState(parseInt(auth && auth?.user && auth?.user?.stripe_details_submitted) || 0);

    return (
        <>
            <Guest auth={auth.user} user={user}>
                <Head title={`${user?.name || auth?.user?.name} - Spenny Piggy`} />
                <div className="wishlistPage blackbg pt-6 pb-0 pb-sm-5 ">
                    <div className="containerbox">
                        <VersionUpdate />
                        {/* <Side /> */}
                        <div className="wishbanner relative ">
                            <div className="relative">
                                <LazyLoadImage
                                    alt={"image"}
                                    effect="blur"
                                    height={400} 
                                    className="w-full border-black border-2 shadow-mint rounded-[30px]"
                                    src={user?.cover_url || wishlistbannerimg}
                                    width={1200}
                                />
                                {IsloggedIn &&
                                auth &&
                                auth?.user.cover_url &&
                                auth?.user?.cover_approved == 0 ? (
                                    <div className="absolute right-8 bottom-4 mx-auto">
                                        <button className="tooltipbtn">
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z"
                                                    fill="#FF8E25"
                                                />
                                            </svg>
                                            <p>
                                                Cover image is waiting for
                                                approval. Currently only you can
                                                see this.
                                            </p>
                                        </button>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                            <Userprofile IsloggedIn={IsloggedIn} />
                        </div>

                            {user && user?.role == 1 && AuthUserStripeConnected == 1 && IsloggedIn && showAlert ?
                                <div className="flex p-3 mb-4 text-sm text-blue-700 relative bg-blue-100 border border-blue-300 rounded-lg">
                                    <div>
                                        <span className="font-medium">Stripe Policy Notice:</span> To comply with Stripe's requirements, you must regularly post content related to memberships, billing, and subscriptions. Accounts that do not may be suspended.
                                        Please contact <a target="_blank" href="https://spennypiggy.co" className="underline font-medium text-blue-800 hover:text-blue-900 livechat intercom-dud02y e11rlguj1 cursor-pointer">support</a> for more information.
                                        <button
                                            onClick={handleDismiss}
                                            className="absolute top-2 right-2 text-blue-700 hover:text-blue-900"
                                            aria-label="Dismiss alert">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            : ''}


                            {user && user.role == 1 ?
                                <div className="wishManage sticky top-8 ">
                                    <div className="userManageRt mt-4 ">
                                        <div className={`  tabs-container ${IsloggedIn ? "IsloggedIn" : ""}`} >
                                            <div className="inlinetab ">
                                                {/* Show rejection message if profile is rejected */}
                                                {/* {!IsloggedIn && user?.profile_status_lock != 2 && user?.profile_reject_reason != null && (
                                                    <div className="text-red-600 text-xl">
                                                        This creator's profile has been rejected by the admin. Payments to this creator are currently disabled.
                                                    </div>
                                                )} */}
                                            <div className="newnav-tabs flex  justify-between gap-2 mb-4">
                                                <Tabs
                                                    activeTab={1}
                                                    hideNavBtnsOnMobile={false}
                                                >
                                                    <Link
                                                        preserveScroll
                                                        preserveState
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "about",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page === "about" ||
                                                            page === false
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        About
                                                    </Link>
                                                    <Link
                                                        preserveScroll
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "wishes",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page === "wishes"
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        Wishes
                                                    </Link>
                                                    <Link
                                                        preserveScroll
                                                        preserveState
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "feed",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page === "feed"
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        feed
                                                    </Link>
                                                    <Link
                                                        preserveScroll
                                                        preserveState
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "memberships",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page ===
                                                            "memberships"
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        memberships
                                                    </Link>
                                                    <Link
                                                        preserveScroll
                                                        preserveState
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "bills",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page === "bills"
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        bills
                                                    </Link>
                                                    <Link
                                                        preserveScroll
                                                        preserveState
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "shop",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page === "shop"
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        shop
                                                    </Link>
                                                    <Link
                                                        preserveScroll
                                                        preserveState
                                                        href={route(
                                                            "user.show",
                                                            {
                                                                username:
                                                                    user.username,
                                                                page: "gifts",
                                                            }
                                                        )}
                                                        className={`tab !uppercase !border-l-0 !text-xl font-bold !border-t-0 !border-e-0 capitalize !border-transparent ${
                                                            page === "gifts"
                                                                ? "text-pink border-b-2 !border-[#F94F97]"
                                                                : "text-[#b5b5b5]"
                                                        }`}
                                                    >
                                                        gifts
                                                    </Link>
                                                </Tabs>

                                                    {IsloggedIn && <Toggle />}
                                                </div>
                                                <div className="tabs-containers min-height" >
                                                    {page === "about" || page === false ?
                                                        <Suspense fallback={<LoadingScreen />} >
                                                            <div className="row about-sec align-self-start">
                                                                <div className="col-md-6  h-auto">
                                                                    <div className="about-sticky" >

                                                                        {IsloggedIn && auth?.user && auth?.user?.role == 1 && !card_capabilities && !isNeedToUpgrade && AuthUserStripeConnected ?
                                                                            <EnableCardCapabilities  />
                                                                        : ''}

                                                                        {IsloggedIn && auth?.user && auth?.user?.role == 1 && isNeedToUpgrade && AuthUserStripeConnected ?
                                                                            <UpgradeStripeAccount  />
                                                                        : ''}

                                                                        {IsloggedIn && auth?.user && auth?.user?.role == 1 && !auth?.user?.monthly_charge_enabled  ?
                                                                            <SiteSubscription charges={auth?.user?.monthly_charge_enabled} user={auth?.user} />
                                                                        : ''}
                                                                        
                                                                        {UserStripeConnected == 1 ?
                                                                           <MyGoal IsloggedIn={IsloggedIn}  /> :
                                                                        ""}


                                                                        <div className="box p-3 p-md-4 shadow-voilet rounded-lg mb-4">
                                                                            <p className="font-bold">About me</p>
                                                                            <p className={`text-muted text-start mt-2 ${user &&!user.bio? "d-none": ""}`}>
                                                                                {(user &&user.bio) ||""}
                                                                            </p>

                                                                            {IsloggedIn && user?.edit_bio_reason  ?
                                                                                <div className="mt-3">
                                                                                    <p className="text-red-700">Bio Edit Request</p>
                                                                                    <p className="text-red-500 text-sm">Reason : {user?.edit_bio_reason } Please update your bio as per requested.</p>
                                                                                </div>
                                                                            : ''}

                                                                            <SocialLinks links={sLinks} />

                                                                            {IsloggedIn ? (
                                                                                <div className="userProfileDate pt-0 pt-md-3">


                                                                                    {auth.user && auth.user.role == 1 && AuthUserStripeConnected == 1  ? (
                                                                                        <PaymentDashboard classes="btn-pink lg w-100 mt-3 btn-shadow" text="Payment Dashboard" />
                                                                                        ) :
                                                                                        <>
                                                                                        {auth?.user?.identity_status == 1 ? <div className="finish mt-4 d-block">
                                                                                            <p className="mb-4 text-lg"> Finish setting up your account to receive funds. You have more steps to complete your payment setup.</p>
                                                                                            <Link disabled={auth.user && auth.user.monthly_charge_enabled ? '' : true } href={"/stripe"} className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200" > Finish Setup
                                                                                            </Link>
                                                                                        </div> : ''}
                                                                                        </>
                                                                                    }

                                                                                {/* {auth.user && auth.user.stripe_details_submitted == 1 ?
                                                                                        <AddGoal
                                                                                        stripe_enabled={auth.user && auth.user.stripe_details_submitted}
                                                                                        fetch_goal={fetch_goal}
                                                                                        activegoal={goal}
                                                                                        />
                                                                                    : ''} */}

                                                                                <div className="addsocial flex">
                                                                                    <ul>
                                                                                        <li>
                                                                                            <AddSocial
                                                                                                sLinks={
                                                                                                    sLinks
                                                                                                }
                                                                                            />
                                                                                        </li>
                                                                                        <li>
                                                                                            <ShareProfile
                                                                                                username={
                                                                                                    user &&
                                                                                                    user.name
                                                                                                }
                                                                                                classes={
                                                                                                    "flex ms-auto"
                                                                                                }
                                                                                            >
                                                                                                Share
                                                                                                Profile
                                                                                            </ShareProfile>
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            ""
                                                                        )}
                                                                    </div>
                                                                    <AddIntro
                                                                        uuid={
                                                                            user?.id ||
                                                                            null
                                                                        }
                                                                        IsloggedIn={
                                                                            IsloggedIn
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="ps-md-4 col-md-6">
                                                                
                                                                {IsloggedIn &&
                                                                UserStripeConnected !==
                                                                    1 ? (
                                                                    <CreatorVerification
                                                                        IsloggedIn={
                                                                            IsloggedIn
                                                                        }
                                                                    />
                                                                ) : (
                                                                    ""
                                                                )}
                                                                {IsloggedIn &&
                                                                UserStripeConnected ==
                                                                    1 ? (
                                                                    <ProfileSteps
                                                                        sLinks={
                                                                            sLinks
                                                                        }
                                                                        user={
                                                                            user
                                                                        }
                                                                        IsloggedIn={
                                                                            IsloggedIn
                                                                        }
                                                                    />
                                                                ) : (
                                                                    ""
                                                                )}
                                                                {!IsloggedIn &&
                                                                UserStripeConnected ==
                                                                    1 &&
                                                                w > 767 ? (
                                                                    <TipInner
                                                                        classes={`mb-4`}
                                                                    />
                                                                ) : (
                                                                    ""
                                                                )}
                                                                <FeedList
                                                                    IsloggedIn={
                                                                        IsloggedIn
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </Suspense>
                                                 :
                                                    ""
                                                }

                                                {IsloggedIn ||
                                                UserStripeConnected == 1 ? (
                                                    <>
                                                        {page === "wishes" ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <div className="wishes-items pb-6 ">
                                                                    {wish_categories &&
                                                                    wish_categories.length ? (
                                                                        <>
                                                                            <div className="new-wish-cats flex mb-2">
                                                                                <Link
                                                                                    preserveScroll
                                                                                    href={route(
                                                                                        "user.show",
                                                                                        {
                                                                                            username:
                                                                                                user.username,
                                                                                            page: "wishes",
                                                                                        }
                                                                                    )}
                                                                                    className={`${
                                                                                        selectedCategory ==
                                                                                        ""
                                                                                            ? "active"
                                                                                            : ""
                                                                                    } me-2  mb-2  wish-tags cursor-pointer focus:bg-pink`}
                                                                                >
                                                                                    All
                                                                                </Link>
                                                                                {wish_categories.map(
                                                                                    (
                                                                                        c,
                                                                                        i
                                                                                    ) => {
                                                                                        return (
                                                                                            <>
                                                                                                <Link
                                                                                                    preserveScroll
                                                                                                    href={route(
                                                                                                        "user.show",
                                                                                                        {
                                                                                                            username:
                                                                                                                user.username,
                                                                                                            page: "wishes",
                                                                                                            category:
                                                                                                                c.id,
                                                                                                        }
                                                                                                    )}
                                                                                                    className={`${
                                                                                                        selectedCategory ==
                                                                                                        c.id
                                                                                                            ? "active"
                                                                                                            : ""
                                                                                                    } me-2  mb-2  wish-tags cursor-pointer focus:bg-pink`}
                                                                                                    key={`cats-${i}`}
                                                                                                >
                                                                                                    {
                                                                                                        c.category
                                                                                                    }
                                                                                                </Link>
                                                                                            </>
                                                                                        );
                                                                                    }
                                                                                )}
                                                                                {IsloggedIn ? (
                                                                                    <EditCategories
                                                                                        username={
                                                                                            (auth &&
                                                                                                auth
                                                                                                    ?.user
                                                                                                    ?.username) ||
                                                                                            null
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    ""
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        ""
                                                                    )}

                                                                    {wishitems &&
                                                                    wishitems.length ? (
                                                                        <>
                                                                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 md:!gap-4">
                                                                                <DndContext
                                                                                    sensors={
                                                                                        sensors
                                                                                    }
                                                                                    collisionDetection={
                                                                                        closestCenter
                                                                                    }
                                                                                    onDragEnd={
                                                                                        handleDragEnd
                                                                                    }
                                                                                >
                                                                                    <SortableContext
                                                                                        strategy={
                                                                                            rectSortingStrategy
                                                                                        }
                                                                                        items={
                                                                                            wishitems
                                                                                        }
                                                                                    >
                                                                                        {!loading &&
                                                                                            wishitems.map(
                                                                                                (
                                                                                                    c,
                                                                                                    i
                                                                                                ) => {
                                                                                                    return (
                                                                                                        <Wishlistbox
                                                                                                            key={`wish-item-${i}`}
                                                                                                            classes=" "
                                                                                                            currency={
                                                                                                                global_currency
                                                                                                            }
                                                                                                            IsloggedIn={
                                                                                                                IsloggedIn
                                                                                                            }
                                                                                                            auth={
                                                                                                                auth.user
                                                                                                            }
                                                                                                            itemid={
                                                                                                                itemid
                                                                                                            }
                                                                                                            setuped={
                                                                                                                AuthUserStripeConnected ==
                                                                                                                1
                                                                                                                    ? true
                                                                                                                    : false
                                                                                                            }
                                                                                                            itm={
                                                                                                                c
                                                                                                            }
                                                                                                        />
                                                                                                    );
                                                                                                }
                                                                                            )}
                                                                                    </SortableContext>
                                                                                </DndContext>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {loading ? (
                                                                                <LoadingScreen />
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                            {(!loading && (
                                                                                <div className="col-md-12">
                                                                                    <Nocontent text="Nothing to see." />
                                                                                </div>
                                                                            )) ||
                                                                                ""}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {page === "feed" ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <FeedList
                                                                    user={user}
                                                                    IsloggedIn={
                                                                        IsloggedIn
                                                                    }
                                                                />
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {page ===
                                                        "memberships" ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <MembershipsLists
                                                                    IsloggedIn={
                                                                        IsloggedIn
                                                                    }
                                                                    username={
                                                                        user?.username ||
                                                                        auth
                                                                            ?.user
                                                                            ?.username
                                                                    }
                                                                />
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {page === "bills" ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <Billslist
                                                                    IsloggedIn={
                                                                        IsloggedIn
                                                                    }
                                                                />
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {page === "shop" ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <ProfileProductLists
                                                                    profileuser={
                                                                        user
                                                                    }
                                                                    IsloggedIn={
                                                                        IsloggedIn
                                                                    }
                                                                />
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {page === "gifts" ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                {giftsloading ? (
                                                                    <LoadingScreen />
                                                                ) : gifts &&
                                                                  gifts.length >
                                                                      0 ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                                                                        {gifts.map(
                                                                            (
                                                                                gift
                                                                            ) => {
                                                                                const details =
                                                                                    JSON.parse(
                                                                                        gift.details
                                                                                    ); // Parse the details JSON
                                                                                return (
                                                                                    <>
                                                                                        {(IsloggedIn ||
                                                                                            gift?.deleted_at ===
                                                                                                null) && (
                                                                                            <GiftListing
                                                                                                key={
                                                                                                    gift.id
                                                                                                }
                                                                                                gift={
                                                                                                    gift
                                                                                                }
                                                                                                details={
                                                                                                    details
                                                                                                }
                                                                                                user={
                                                                                                    user
                                                                                                }
                                                                                                IsloggedIn={
                                                                                                    IsloggedIn
                                                                                                }
                                                                                                fetch_gifts={
                                                                                                    fetch_gifts
                                                                                                }
                                                                                                auth={
                                                                                                    auth
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                    </>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="col-md-12">
                                                                        <Nocontent text="Nothing to see." />
                                                                    </div>
                                                                )}
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}
                                                    </>
                                                ) : (
                                                    <PaymentUnActivated
                                                        heading={`WishList not activated yet. `}
                                                        subheading={`Until they activate their wishlist, this user won't be able to receive gifts.`} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                :
                                <Gifter
                                auth={auth}
                                sLinks={sLinks}
                                IsloggedIn={IsloggedIn} />
                            }
                        </div>
                </div>

                {IsloggedIn ? (
                    <Popup
                        action={openCurrency}
                        space="4"
                        modalclassName="pinkmodal"
                    >
                        <ChangeCurrency
                            currencyaction={currencyaction}
                            defaultvalue={global_currency}
                        />
                    </Popup>
                ) : (
                    ""
                )}

                <OldSubscribe />
            </Guest>
        </>
    );
}
