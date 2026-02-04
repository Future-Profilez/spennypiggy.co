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
    const { ziggy } = usePage().props;
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
    const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));
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
                            className="addoption-action absolute top-[-3px] right-0 cursor-pointer ps-3 bg-black p-2 "
                            dangerouslySetInnerHTML={{ __html: addicon }}
                        ></div>
                        {showAdd ? (
                            <div className="bg-[#0001] rounded-xl position-fixed shadow-lg z-[99999999999999999999] flex justify-center items-center top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] w-full h-full">
                                <div className="w-full max-w-[550px]  px-3">
                                    <Suspense fallback={"Loading.."}>
                                        <div className="bg-gray-100 w-full p-6 md:p-10 rounded-3xl shadow-lg z-10">
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
                                                                        true,
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

                                                            <Link
                                                                className="w-full block font-bold addop bg-white rounded-xl p-3 mb-2 text-center cursor-pointer"
                                                                href="/task/create"
                                                            >
                                                                <div className=" flex items-center">
                                                                    <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                        <BiTask
                                                                            color="var(--pink)"
                                                                            size="1.5rem"
                                                                        />
                                                                    </div>
                                                                    <div className="ps-3 text-start">
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

                <div className="wishlistPage blackbg pt-6 pb-0 pb-sm-5 ">
                    <div className="containerbox">
                        <VersionUpdate />
                        <OfferAnnouncement variant="default" />
                        {/* <Side /> */}
                        <div className="wishbanner relative ">
                            <div className="relative">
                                {user?.is_founder ? (
                                    <div className="absolute top-4 left-4 flex justify-center shadow-xl lg:justify-start mb-2">
                                        <FounderBadge size="md" />
                                    </div>
                                ) : (
                                    ""
                                )}
                                <img
                                    alt={`${user?.name} - Cover Image`}
                                    height={400}
                                    width={1200}
                                    className="w-full border-black border-2 shadow-mint rounded-[30px]"
                                    src={IsloggedIn ? user?.cover_url || wishlistbannerimg : user?.cover_approved === 1 ? user?.cover_url : wishlistbannerimg}
                                    loading="eager"
                                    fetchPriority="high"
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

                        {/* Stripe Account Migration Warning */}

                        {/* {user && user?.role == 1 && AuthUserStripeConnected == 1 && IsloggedIn && showAlert ?
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
                            : ''} */}

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
                                                activeTab={page || "about"}
                                                user={user}
                                                username={user.username}
                                                IsloggedIn={IsloggedIn}
                                                onTabChange={(tabId) => {
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
                                                        <div className="row about-sec align-self-start">
                                                            <div className="col-lg-6  h-auto">
                                                                <div className="about-sticky">
                                                                    <DashboardStripeMigrationWarning
                                                                        migrationStatus={
                                                                            migration_status
                                                                        }
                                                                    />

                                                                    {IsloggedIn &&
                                                                    auth?.user &&
                                                                    auth?.user
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
                                                                    auth?.user
                                                                        ?.role ==
                                                                        1 &&
                                                                    !card_capabilities &&
                                                                    !isNeedToUpgrade &&
                                                                    AuthUserStripeConnected ? (
                                                                        <EnableCardCapabilities />
                                                                    ) : (
                                                                        ""
                                                                    )}
    {console.log('subscription check', auth)}
                                                                    {IsloggedIn && auth?.user && auth?.user?.role == 1 && auth?.user?.is_subscribed == 0 ? (
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

                                                                    <div className="pink-round mb-4">
                                                                        <h2 className="text-large  font-GillSans text-uppercase pinkbg p-3 text-white btn-shadow">
                                                                            About
                                                                            Me
                                                                        </h2>
                                                                        <div className="p-4">
                                                                            <p
                                                                                className={`text-muted text-start mt-2 ${
                                                                                    user &&
                                                                                    !user.bio
                                                                                        ? "d-none"
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                {(user &&
                                                                                    user.bio) ||
                                                                                    "Hy, I am a creator on SpennyPiggy."}
                                                                            </p>

                                                                            {IsloggedIn &&
                                                                            user?.edit_bio_reason &&
                                                                            user?.bio_approved ==
                                                                                2 ? (
                                                                                <div className="mt-3">
                                                                                    <p className="text-red-700">
                                                                                        Bio
                                                                                        Edit
                                                                                        Request
                                                                                    </p>
                                                                                    <p className="text-red-500 text-sm">
                                                                                        Reason
                                                                                        :{" "}
                                                                                        {
                                                                                            user?.edit_bio_reason
                                                                                        }{" "}
                                                                                        Please
                                                                                        update
                                                                                        your
                                                                                        bio
                                                                                        as
                                                                                        per
                                                                                        requested.
                                                                                    </p>
                                                                                </div>
                                                                            ) : (
                                                                                ""
                                                                            )}

                                                                            <SocialLinks
                                                                                links={
                                                                                    sLinks
                                                                                }
                                                                            />

                                                                            {/* SOCIAL MEDIA REJECT REASON */}
                                                                            {IsloggedIn && slinks?.reason && (
                                                                                    <div className="mt-3">
                                                                                        <p className="text-red-700 font-semibold">
                                                                                            Social
                                                                                            Media
                                                                                            Edit
                                                                                            Request
                                                                                        </p>
                                                                                        <p className="text-red-500 text-sm">
                                                                                            Reason:{" "}
                                                                                            {
                                                                                                slinks.reason
                                                                                            }{" "}
                                                                                            <br />
                                                                                            Please
                                                                                            update
                                                                                            your
                                                                                            social
                                                                                            links
                                                                                            as
                                                                                            per
                                                                                            the
                                                                                            requested
                                                                                            changes.
                                                                                        </p>
                                                                                    </div>
                                                                                )}

                                                                            {IsloggedIn ? (
                                                                                <div className="userProfileDate pt-0 pt-md-3">
                                                                                    {auth.user &&
                                                                                    auth
                                                                                        .user
                                                                                        .role ==
                                                                                        1 &&
                                                                                    AuthUserStripeConnected ==
                                                                                        1 ? (
                                                                                        <PaymentDashboard
                                                                                            classes="b w-full"
                                                                                            text="Payment Dashboard"
                                                                                        />
                                                                                    ) : (
                                                                                        <>
                                                                                            {/* {auth?.user?.identity_status == 1 ? 
                                                                                            <div className="finish mt-4 d-block">
                                                                                                <p className="mb-4 text-lg"> Finish setting up your account to receive funds. You have more steps to complete your payment setup.</p>
                                                                                                <Link disabled={auth.user && auth.user.monthly_charge_enabled ? '' : true } href={"/stripe"} className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200" > Finish Setup
                                                                                                </Link>
                                                                                            </div> 
                                                                                            : ''} */}
                                                                                        </>
                                                                                    )}

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
                                                                                                        user.username
                                                                                                    }
                                                                                                    classes={
                                                                                                        "flex ms-auto"
                                                                                                    }
                                                                                                    custom={`${ziggy?.location}/${user?.username ?? 'creator_test'}/wishes?item=${wishitems[0]?.uuid}`}
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
                                                                    </div>
                                                                    {IsloggedIn ||
                                                                    user?.intro
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
                                                            <div className="ps-lg-4 col-lg-6">
                                                                {IsloggedIn &&
                                                                    auth?.user &&
                                                                    auth?.user
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
                                                                w > 767 ? (
                                                                    <TipInner
                                                                        classes={`mb-4`}
                                                                    />
                                                                ) : (
                                                                    ""
                                                                )}
                                                                <FeedList
                                                                    user={user}
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
                                                UserStripeConnected == 1 ? (
                                                    <>
                                                        {page === "wishes" ? (
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
                                                                                        } me-2  mb-2  wish-tags cursor-pointer focus:bg-pink`}
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
                                                                                                        className={`${selectedCategory == c.id ? "active" : ""} me-2  mb-2  wish-tags cursor-pointer focus:bg-pink`}
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
                                                                            <div className="col-md-12">
                                                                                <Nocontent text="Nothing to see." />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Suspense>
                                                            </ErrorBoundary>
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
                                                                    initialFilter="all"
                                                                />
                                                            </Suspense>
                                                        ) : (
                                                            ""
                                                        )}

                                                        {page === "tasks" ? (
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
