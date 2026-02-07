import { useState, useMemo, useEffect, Suspense, lazy, useRef } from "react";
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, usePage } from "@inertiajs/react";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.jpg";
import { addicon } from "@/includes/Icons";
const Wishlist = lazy(() => import("./Auth/Wishlist"));
const Wishlistbox = lazy(() => import("@/wishlist/Wishlistbox"));
import Userprofile from "@/wishlist/Userprofile";
const ShareProfile = lazy(() => import("@/wishlist/ShareProfile"));
const Nocontent = lazy(() => import("@/includes/Nocontent"));
const LoadingScreen = lazy(() => import("@/includes/LoadingScreen"));
const VersionUpdate = lazy(() => import("@/Components/VersionUpdate"));
const PaymentDashboard = lazy(() => import("./stripe/PaymentDashboard"));
const ChangeCurrency = lazy(() => import("@/Components/ChangeCurrency"));
const Popup = lazy(() => import("@/Components/Popup"));
const MembershipsLists = lazy(() => import("./membership/MembershipsLists"));
import { BiTask } from "react-icons/bi";
const AddMembership = lazy(() => import("./membership/AddMembership"));
const Gifter = lazy(() => import("./gifter/Gifter"));
const AddBills = lazy(() => import("./bills/AddBills"));
const EditCategories = lazy(() => import("@/wishlist/EditCategories"));
const TipInner = lazy(() => import("./TipJar/TipInner"));
const Billslist = lazy(() => import("./bills/Billslist"));
const FeedList = lazy(() => import("./feed/FeedList"));
const AddPost = lazy(() => import("./feed/AddPost"));
const AddIntro = lazy(() => import("./intros/AddIntro"));
const MyGoal = lazy(() => import("./TipJar/MyGoal"));
const SocialLinks = lazy(() => import("@/includes/SocialLinks"));
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
import ProfileSteps from "./Profile/ProfileSteps";
const ProfileProductLists = lazy(
    () => import("./shop/profile/ProfileProductLists"),
);
const ProfileTaskLists = lazy(() => import("./Tasks/Profile/ProfileTaskLists"));
const AddItem = lazy(() => import("./shop/AddItem"));
import AddGift from "./feed/AddGift";
import GiftListing from "./rye/GiftListing";
import { FaRegHeart } from "react-icons/fa";
import { CiGift } from "react-icons/ci";
import { RiUserLine } from "react-icons/ri";
import OldSubscribe from "./webpush/OldSubscribe";
import AddSocial from "./Auth/Social";
// import CreatorVerification from "./Profile/CreatorVerificationNew";
import CreatorVerification from "./Profile/CreatorVerification";
import SiteSubscription from "./Profile/SiteSubscription";
import EnableCardCapabilities from "./stripe/EnableCardCapabilities";
import ActionRequired from "./stripe/ActionRequired";
import { DashboardStripeMigrationWarning } from "@/Components/StripeMigrationWarning";
import ErrorBoundary from "@/Components/ErrorBoundary";
import InstantTabSystem from "@/Components/InstantTabSystem";
import OfferAnnouncement from "@/Components/OfferAnnouncement";
import FounderBadge from "@/Components/FounderBadge";

// Creator Activity and Subscription Components
const CreatorActivityWidget = lazy(
    () => import("@/Components/CreatorActivityWidget"),
);
const CreatorSubscriptionWidget = lazy(
    () => import("@/Components/CreatorSubscriptionWidget"),
);
export default function Dashboard(props) {
    const pageProps = usePage().props || {};
    const { ziggy } = pageProps;
    console.log("Dashboard props:", ziggy);
    const w = useWidthCount();
    const {
        auth,
        user,
        username,
        card_capabilities,
        isNeedToUpgrade,
        global_currency,
        itemid,
        slinks,
        wish_categories,
        items,
        tasks,
        page,
        selectedCategory,
        stripe_requirements,
        migration_status,
    } = props;

    const [wishitems, setWishitems] = useState(items || []);
    const [tab, setTab] = useState(0);

    const memoizedWishItems = useMemo(() => {
        return items && Array.isArray(items) ? items : [];
    }, [items]);

    // Update wishitems when items prop changes (e.g., on category change or page refresh)
    useEffect(() => {
        if (items && Array.isArray(items)) {
            setWishitems(items);
            setIsInitialLoad(false);
        } else if (items === null || items === undefined) {
            // Keep previous items if new items are undefined (loading state)
            // This prevents flickering to empty state during transitions
        }
    }, [items, selectedCategory]);

    const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();
    const [IsloggedIn, setIsLoggedIn] = useState(
        (auth && auth.user && auth.user.username) == (user && user.username),
    );
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [giftsloading, setGiftsLoading] = useState(false);
    const [sLinks, setLinks] = useState(slinks || []);

    // Keep local sLinks state in sync when server props change (e.g., after save/refresh)
    useEffect(() => {
        setLinks(slinks || []);
    }, [slinks]);
    const [gifts, setGifts] = useState([]);
    const [activityStatus, setActivityStatus] = useState(null);
    const [activityLoading, setActivityLoading] = useState(false);

    const tabRendererRef = useRef(null);

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

    // Fetch creator activity status
    const fetchActivityStatus = async () => {
        if (!IsloggedIn || !auth?.user || auth?.user?.role !== 1) {
            return;
        }
        setActivityLoading(true);
        try {
            const response = await axios.get("/creator/activity/status");
            setActivityStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch activity status:", error);
        } finally {
            setActivityLoading(false);
        }
    };

    // Fetch activity status on component mount for logged-in creators
    useEffect(() => {
        if (IsloggedIn && auth?.user?.role === 1) {
            fetchActivityStatus();
        }
    }, [IsloggedIn, auth?.user?.role]);

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
        }),
    );

    const handleDragEnd = (event) => {
        if (!IsloggedIn) {
            return false;
        }
        const { active, over } = event;
        const activeIndex = wishitems.findIndex(
            (item) => item.id === active.id,
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

    // Flash messages now handled centrally by FlashMessenger in layout

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
        if (auth?.user?.email && typeof twq !== "undefined") {
            twq("event", "tw-ozu4h-pt5uc", {
                conversion_id: auth?.user?.uuid,
                email_address: auth?.user?.email,
            });
        }
    }, []);

    const Toggle = () => {
        const [showAdd, setShowAdd] = useState(false);
        useEffect(() => {
            const handleToggleEvent = () => {
                setShowAdd(true);
            };

            window.addEventListener("toggleAddOptions", handleToggleEvent);
            return () => {
                window.removeEventListener(
                    "toggleAddOptions",
                    handleToggleEvent,
                );
            };
        }, []);
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
                            className="addoption-action absolute top-[-3px] right-0 cursor-pointer pl-3 bg-black p-2 "
                            dangerouslySetInnerHTML={{ __html: addicon }}
                        ></div>
                        {showAdd ? (
                            <div className="bg-[#0001] rounded-xl fixed shadow-lg z-[99999999999999999999] flex justify-center items-center top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] w-full h-full">
                                <div className="w-full max-w-[550px]  px-3">
                                    <Suspense fallback={"Loading.."}>
                                        <div className="bg-gray-100 w-full p-6 md:p-10 rounded-xl  shadow-lg z-10">
                                            <h2 className="  text-black font-gulfs uppercase text-xl md:text-2xl mb-4 text-center m-auto ">
                                                Fund your Lifestyle
                                            </h2>
                                            <p>
                                                {" "}
                                                {AuthUserStripeConnected !== 1
                                                    ? "Please complete your Stripe account setup to add your wishlist."
                                                    : ""}{" "}
                                            </p>
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
                                                                <div className="p-1 rounded-xl  bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                    <CiGift
                                                                        color="var(--pink)"
                                                                        size="1.5rem"
                                                                    />
                                                                </div>
                                                                <div className="pl-3 text-left">
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
                                                                        true,
                                                                    )
                                                                }
                                                                className="w-full font-bold addop bg-white rounded-xl p-3 mb-2 text-center cursor-pointer"
                                                            >
                                                                <div className=" flex items-center">
                                                                    <div className="p-1 rounded-xl  bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                        <FaRegHeart
                                                                            color="var(--pink)"
                                                                            size="1.5rem"
                                                                        />
                                                                    </div>
                                                                    <div className="pl-3 text-left">
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

                                                            <Link
                                                                className="w-full block font-bold addop bg-white rounded-xl p-3 mb-2 text-center cursor-pointer"
                                                                href="/task/create"
                                                            >
                                                                <div className=" flex items-center">
                                                                    <div className="p-1 rounded-xl  bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                        <BiTask
                                                                            color="var(--pink)"
                                                                            size="1.5rem"
                                                                        />
                                                                    </div>
                                                                    <div className="pl-3 text-left">
                                                                        <h2 className="text-md font-normal font-GillSans uppercase">
                                                                            Create
                                                                            Task
                                                                        </h2>
                                                                        <p className="text-sm font-poppins">
                                                                            Offer
                                                                            something
                                                                            unique
                                                                            to
                                                                            your
                                                                            supporters.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </Link>

                                                            {/* <AddItem
                                                                classes="w-full font-bold addop bg-white rounded-xl p-3 mb-2 text-center"
                                                                product_type="digital_products"
                                                            /> */}
                                                            <AddPost classes="font-bold py-3 px-3 mb-2 text-center" />
                                                            {/* <AddGift
                                                                text="Add Gift "
                                                                classes="font-bold py-3 px-3 mb-2 text-center"
                                                                fetch_gifts={
                                                                    fetch_gifts
                                                                }
                                                                addressAdded={
                                                                    auth?.user
                                                                        ?.is_creator_address_found
                                                                }
                                                            /> */}
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
                                                className="mx-auto block p-2 mt-3"
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

    const [UserStripeConnected, setUserStripeConnected] = useState(
        parseInt(user && user?.stripe_details_submitted) || 0,
    );
    const [AuthUserStripeConnected, setAuthUserStripeConnected] = useState(
        parseInt(auth && auth?.user && auth?.user?.stripe_details_submitted) ||
            0,
    );

    return (
        <>
            <Guest auth={auth.user} user={user}>
                <Head
                    title={`${user?.name || auth?.user?.name} - Spenny Piggy`}
                />

                <div className="wishlistPage blackbg pb-0 sm:pb-5 ">
                    <div className="">
                        <div className="containerbox mx-auto">
                            <VersionUpdate />
                            <OfferAnnouncement variant="default" />
                        </div>

                        {/* User Profile Banner */}
                        <div className="containerbox !mt-[30px] !p-0 mx-auto">
                            <div className="wishbanner relative rounded-[40px] border-2 border-pink-600 overflow-hidden  ">
                                {user?.is_founder ? (
                                    <div className="absolute top-4 left-4 flex justify-center shadow-xl lg:justify-start mb-2 z-30">
                                        <FounderBadge size="md" />
                                    </div>
                                ) : (
                                    ""
                                )}
                                <Userprofile IsloggedIn={IsloggedIn} />
                            </div>
                        </div>

                        {/* Stripe Account Migration Warning */}

                        {/* {user && user?.role == 1 && AuthUserStripeConnected == 1 && IsloggedIn && showAlert ?
                                <div className="flex p-3 mb-4 text-sm text-blue-700 relative bg-blue-100 border border-blue-300 rounded-xl ">
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
                            : ''} */}
                        <div className="containerbox mx-auto">
                            <div className="max-w-[1000px] mx-auto">
                                {user && user.role == 1 ? (
                                    <div className="wishManage sticky top-8 ">
                                        {/* Creator Subscription Widget - Show on all tabs for creators */}
                                        {/* {IsloggedIn && auth?.user && auth?.user?.role == 1 && (
                                                <Suspense fallback={<div className="mb-4">Loading subscription status...</div>}>
                                                    <CreatorSubscriptionWidget 
                                                        className="mb-4"
                                                    />
                                                </Suspense>
                                            )} */}

                                        <div className="userManageRt mt-4 ">
                                            <div
                                                className={`tabs-container ${IsloggedIn ? "IsloggedIn" : ""}`}
                                            >
                                                <div className="inlinetab ">
                                                    {/* Show rejection message if profile is rejected */}
                                                    {/* {!IsloggedIn && user?.profile_status_lock != 2 && user?.profile_reject_reason != null && (
                                                            <div className="text-red-600 text-xl">
                                                                This creator's profile has been rejected by the admin. Payments to this creator are currently disabled.
                                                            </div>
                                                        )} */}

                                                    {/* Instant Tab System with immediate feedback */}
                                                    <InstantTabSystem
                                                        Toggle={Toggle}
                                                        activeTab={
                                                            page || "about"
                                                        }
                                                        user={user}
                                                        username={user.username}
                                                        IsloggedIn={IsloggedIn}
                                                        onTabChange={(
                                                            tabId,
                                                        ) => {
                                                            // Handle tab change if needed
                                                        }}
                                                    />

                                                    <div className="tabs-containers min-height">
                                                        {page === "about" ||
                                                        page === false ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <div className="flex flex-wrap about-sec self-start">
                                                                    <div className="w-full lg:w-1/2  h-auto">
                                                                        <div className="about-sticky">
                                                                            <DashboardStripeMigrationWarning
                                                                                migrationStatus={
                                                                                    migration_status
                                                                                }
                                                                            />

                                                                            {IsloggedIn &&
                                                                            auth?.user &&
                                                                            auth
                                                                                ?.user
                                                                                ?.role ==
                                                                                1 &&
                                                                            stripe_requirements &&
                                                                            stripe_requirements.has_requirements &&
                                                                            stripe_requirements.requirements &&
                                                                            stripe_requirements
                                                                                .requirements
                                                                                .length >
                                                                                0 &&
                                                                            AuthUserStripeConnected ? (
                                                                                <ActionRequired
                                                                                    requirements={
                                                                                        stripe_requirements.requirements
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                ""
                                                                            )}

                                                                            {IsloggedIn &&
                                                                            auth?.user &&
                                                                            auth
                                                                                ?.user
                                                                                ?.role ==
                                                                                1 &&
                                                                            !card_capabilities &&
                                                                            !isNeedToUpgrade &&
                                                                            AuthUserStripeConnected ? (
                                                                                <EnableCardCapabilities />
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                            {console.log(
                                                                                "subscription check",
                                                                                auth,
                                                                            )}
                                                                            {IsloggedIn &&
                                                                            auth?.user &&
                                                                            auth
                                                                                ?.user
                                                                                ?.role ==
                                                                                1 &&
                                                                            auth
                                                                                ?.user
                                                                                ?.is_subscribed ==
                                                                                0 ? (
                                                                                <SiteSubscription
                                                                                    charges={
                                                                                        auth
                                                                                            ?.user
                                                                                            ?.monthly_charge_enabled
                                                                                    }
                                                                                    user={
                                                                                        auth?.user
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                ""
                                                                            )}

                                                                            {UserStripeConnected ==
                                                                            1 ? (
                                                                                <MyGoal
                                                                                    IsloggedIn={
                                                                                        IsloggedIn
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                ""
                                                                            )}

                                                                            <div className="bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[40px] p-0 mb-8 shadow-2xl transition-all hover:border-white/10 group overflow-hidden">
                                                                                <div className="bg-[#05EFB8] p-5">
                                                                                    <h2 className="text-sm font-black text-black tracking-[0.25em] uppercase flex items-center gap-3">
                                                                                        <div className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center">
                                                                                            <RiUserLine className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                        About
                                                                                        Me
                                                                                    </h2>
                                                                                </div>
                                                                                <div className="p-8 bg-white">
                                                                                    <p
                                                                                        className={`text-black text-lg md:text-xl font-medium leading-relaxed tracking-tight ${
                                                                                            user &&
                                                                                            !user.bio
                                                                                                ? "hidden"
                                                                                                : ""
                                                                                        }`}
                                                                                    >
                                                                                        {(user &&
                                                                                            user.bio) ||
                                                                                            "I believe in good vibes and great creators. Supporting one smile at a time 😊"}
                                                                                    </p>

                                                                                    {IsloggedIn &&
                                                                                    user?.edit_bio_reason &&
                                                                                    user?.bio_approved ==
                                                                                        2 ? (
                                                                                        <div className="mt-6 p-6 rounded-3xl bg-red-500 border border-red-500/10">
                                                                                            <p className="text-white font-black text-xs tracking-widest uppercase mb-2">
                                                                                                Review
                                                                                                Required
                                                                                            </p>
                                                                                            <p className="text-white/70 text-sm leading-relaxed">
                                                                                                Reason:{" "}
                                                                                                {
                                                                                                    user?.edit_bio_reason
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                    ) : (
                                                                                        ""
                                                                                    )}

                                                                                    <div className="pt-8 mt-8 border-t border-gray-100">
                                                                                        <SocialLinks
                                                                                            textcolor="text-black/30 hover:text-black transition-all duration-300"
                                                                                            links={
                                                                                                sLinks
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    {IsloggedIn &&
                                                                                        slinks?.reason && (
                                                                                            <div className="mt-6 p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                                                                                                <p className="text-red-400 font-black text-xs tracking-widest uppercase mb-2">
                                                                                                    Social
                                                                                                    Links
                                                                                                    Review
                                                                                                </p>
                                                                                                <p className="text-red-400/70 text-sm leading-relaxed">
                                                                                                    Reason:{" "}
                                                                                                    {
                                                                                                        slinks.reason
                                                                                                    }
                                                                                                </p>
                                                                                            </div>
                                                                                        )}

                                                                                    {IsloggedIn ? (
                                                                                        <div className="userProfileDate pt-8 flex flex-wrap items-center gap-4">
                                                                                            {auth.user &&
                                                                                            auth
                                                                                                .user
                                                                                                .role ==
                                                                                                1 &&
                                                                                            AuthUserStripeConnected ==
                                                                                                1 ? (
                                                                                                <PaymentDashboard
                                                                                                    classes="px-8 py-3 bg-black/5 hover:bg-black/10 text-black font-black text-[11px] tracking-[0.2em] uppercase rounded-2xl transition-all border border-black/5 backdrop-blur-xl"
                                                                                                    text="Payment Dashboard"
                                                                                                />
                                                                                            ) : null}

                                                                                            <div className="addsocial flex items-center gap-4 ml-auto">
                                                                                                <AddSocial
                                                                                                    sLinks={
                                                                                                        sLinks
                                                                                                    }
                                                                                                />
                                                                                                <ShareProfile
                                                                                                    username={
                                                                                                        user &&
                                                                                                        user.username
                                                                                                    }
                                                                                                    classes="px-8 py-3 bg-black text-white font-black text-[11px] tracking-[0.2em] uppercase rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/5"
                                                                                                    custom={`${ziggy?.location}/${user?.username ?? "creator_test"}/wishes?item=${wishitems[0]?.uuid}`}
                                                                                                >
                                                                                                    Share
                                                                                                    Profile
                                                                                                </ShareProfile>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        ""
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {IsloggedIn ||
                                                                            user
                                                                                ?.intro
                                                                                ?.approved ==
                                                                                1 ? (
                                                                                <AddIntro
                                                                                    uuid={
                                                                                        user?.id ||
                                                                                        null
                                                                                    }
                                                                                    IsloggedIn={
                                                                                        IsloggedIn
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="lg:pl-4 w-full lg:w-1/2">
                                                                        {IsloggedIn &&
                                                                            auth?.user &&
                                                                            auth
                                                                                ?.user
                                                                                ?.role ==
                                                                                1 &&
                                                                            UserStripeConnected ==
                                                                                1 && (
                                                                                <Suspense
                                                                                    fallback={
                                                                                        <div className="mb-4">
                                                                                            Loading
                                                                                            activity
                                                                                            status...
                                                                                        </div>
                                                                                    }
                                                                                >
                                                                                    <CreatorActivityWidget
                                                                                        activityStatus={
                                                                                            activityStatus
                                                                                        }
                                                                                        className="mb-4"
                                                                                    />
                                                                                </Suspense>
                                                                            )}

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
                                                                        w >
                                                                            767 ? (
                                                                            <TipInner
                                                                                classes={`mb-4`}
                                                                            />
                                                                        ) : (
                                                                            ""
                                                                        )}
                                                                        <FeedList
                                                                            user={
                                                                                user
                                                                            }
                                                                            IsloggedIn={
                                                                                IsloggedIn
                                                                            }
                                                                            initialFilter="all"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {IsloggedIn ||
                                                        UserStripeConnected ==
                                                            1 ? (
                                                            <>
                                                                {page ===
                                                                "wishes" ? (
                                                                    <ErrorBoundary>
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
                                                                                                    },
                                                                                                )}
                                                                                                className={`${
                                                                                                    selectedCategory ==
                                                                                                    ""
                                                                                                        ? "active"
                                                                                                        : ""
                                                                                                } mr-2  mb-2  wish-tags cursor-pointer focus:bg-pink`}
                                                                                            >
                                                                                                All
                                                                                            </Link>
                                                                                            {wish_categories.map(
                                                                                                (
                                                                                                    c,
                                                                                                    i,
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
                                                                                                                    },
                                                                                                                )}
                                                                                                                className={`${selectedCategory == c.id ? "active" : ""} mr-2  mb-2  wish-tags cursor-pointer focus:bg-pink`}
                                                                                                                key={`cats-${i}`}
                                                                                                            >
                                                                                                                {
                                                                                                                    c.category
                                                                                                                }
                                                                                                            </Link>
                                                                                                        </>
                                                                                                    );
                                                                                                },
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

                                                                                {loading ||
                                                                                (isInitialLoad &&
                                                                                    (!wishitems ||
                                                                                        wishitems.length ===
                                                                                            0)) ? (
                                                                                    <LoadingScreen />
                                                                                ) : wishitems &&
                                                                                  wishitems.length >
                                                                                      0 ? (
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
                                                                                                    {wishitems.map(
                                                                                                        (
                                                                                                            c,
                                                                                                            i,
                                                                                                        ) => {
                                                                                                            return (
                                                                                                                <Wishlistbox
                                                                                                                    key={`wish-item-${
                                                                                                                        c.id ||
                                                                                                                        c.uuid ||
                                                                                                                        i
                                                                                                                    }`}
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
                                                                                                        },
                                                                                                    )}
                                                                                                </SortableContext>
                                                                                            </DndContext>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <div className="w-full">
                                                                                        <Nocontent text="Nothing to see." />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </Suspense>
                                                                    </ErrorBoundary>
                                                                ) : (
                                                                    ""
                                                                )}

                                                                {page ===
                                                                "feed" ? (
                                                                    <Suspense
                                                                        fallback={
                                                                            <LoadingScreen />
                                                                        }
                                                                    >
                                                                        <FeedList
                                                                            user={
                                                                                user
                                                                            }
                                                                            IsloggedIn={
                                                                                IsloggedIn
                                                                            }
                                                                            initialFilter="all"
                                                                        />
                                                                    </Suspense>
                                                                ) : (
                                                                    ""
                                                                )}

                                                                {page ===
                                                                "tasks" ? (
                                                                    <Suspense
                                                                        fallback={
                                                                            <LoadingScreen />
                                                                        }
                                                                    >
                                                                        <ProfileTaskLists
                                                                            tasks={
                                                                                tasks
                                                                            }
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

                                                                {page ===
                                                                "bills" ? (
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

                                                                {page ===
                                                                "shop" ? (
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

                                                                {page ===
                                                                "gifts" ? (
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
                                                                                        gift,
                                                                                    ) => {
                                                                                        const details =
                                                                                            JSON.parse(
                                                                                                gift.details,
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
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full">
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
                                                                subheading={`Until they activate their wishlist, this user won't be able to receive gifts.`}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Gifter
                                        auth={auth}
                                        sLinks={sLinks}
                                        IsloggedIn={IsloggedIn}
                                    />
                                )}
                            </div>
                        </div>
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
