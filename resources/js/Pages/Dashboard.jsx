import { useState, useMemo, useEffect, Suspense, lazy, useRef } from "react";
import { createPortal } from "react-dom";
import { Head, Link, usePage } from "@inertiajs/react";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.png";
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
import useWidthCount from "@/Components/useWidthCount";
import PiggyPotModal from "@/Components/PiggyPotModal";
import BlockedProfileNotice from "../Components/BlockedProfileNotice";

import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
    closestCorners,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    MeasuringStrategy,
    defaultDropAnimation,
} from "@dnd-kit/core";
import PaymentUnActivated from "@/Components/PaymentUnActivated";
import ProfileSteps from "./Profile/ProfileSteps";
import AddGift from "./feed/AddGift";
import { CiGift } from "react-icons/ci";
import { DashboardStripeMigrationWarning } from "@/Components/StripeMigrationWarning";
import { FaRegHeart } from "react-icons/fa";
import InstantTabSystem from "@/Components/InstantTabSystem";
import AddMoreTile from "@/Components/AddMoreTile";

const ProfileProductLists = lazy(
    () => import("./shop/profile/ProfileProductLists"),
);
const ProfileTaskLists = lazy(() => import("./Tasks/Profile/ProfileTaskLists"));
const AddItem = lazy(() => import("./shop/AddItem"));

const ReferralBanner = lazy(() => import("@/Components/ReferralBanner"));
const GiftListing = lazy(() => import("./rye/GiftListing"));
const OldSubscribe = lazy(() => import("./webpush/OldSubscribe"));
const AddSocial = lazy(() => import("./Auth/Social"));
const CreatorVerification = lazy(() => import("./Profile/CreatorVerification"));
const SiteSubscription = lazy(() => import("./Profile/SiteSubscription"));
const EnableCardCapabilities = lazy(
    () => import("./stripe/EnableCardCapabilities"),
);
const ActionRequired = lazy(() => import("./stripe/ActionRequired"));
const ErrorBoundary = lazy(() => import("@/Components/ErrorBoundary"));
const OfferAnnouncement = lazy(() => import("@/Components/OfferAnnouncement"));
const FounderProgressTracker = lazy(
    () => import("@/Components/FounderProgressTracker"),
);
const FounderBadge = lazy(() => import("@/Components/FounderBadge"));
const CreatorRiskBanner = lazy(
    () => import("@/Components/Risk/CreatorRiskBanner"),
);
const CreatorActivityWidget = lazy(
    () => import("@/Components/CreatorActivityWidget"),
);
const PiggyPotWidget = lazy(
    () => import("@/Components/PiggyPots/PiggyPotWidget"),
);
const PiggyPotSocialProof = lazy(
    () => import("@/Components/PiggyPots/PiggyPotSocialProof"),
);
const PiggyPotsGrid = lazy(
    () => import("@/Components/PiggyPots/PiggyPotsGrid"),
);

const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this Piggy Pot?")) {
        destroy(route("piggy-pots.destroy", id), {
            onSuccess: () => {
                successAlert("Piggy Pot deleted successfully!");
            },

            onError: () => {
                errorAlert("Failed to delete Piggy Pot.");
            },
        });
    }
};

export default function Dashboard(props) {
    const { ziggy } = usePage().props;
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
        has_stripe_account,
        founderData,
        monthly_charges,
    } = props;

    const [showPotModal, setShowPotModal] = useState(false);
    const [selectedPot, setSelectedPot] = useState(null);
    const [modalMode, setModalMode] = useState("create");

    const openCreateModal = () => {
        setModalMode("create");
        setSelectedPot(null);
        setShowPotModal(true);
    };

    const openEditModal = (pot) => {
        setModalMode("edit");
        setSelectedPot(pot);
        setShowPotModal(true);
    };

    const [wishitems, setWishitems] = useState(items || []);
    const [tab, setTab] = useState(0);
    const [activeId, setActiveId] = useState(null);

    const defaultPotValues = {
        title: "",
        description: "",
        target_amount: "",
        currency: auth.user?.default_currency || "GBP",
        deadline: "",
        is_pinned: false,
        enable_leaderboard: true,
        allow_anonymous: true,
        status: "active",
        content_file: "",
        content_description: "",
        cover_media:
            "https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/",
    };

    const activeItem = useMemo(
        () =>
            activeId
                ? wishitems.find((item) => (item.id || item.uuid) === activeId)
                : null,
        [activeId, wishitems],
    );

    useEffect(() => {
        if (items && Array.isArray(items)) {
            setWishitems(items);
            setIsInitialLoad(false);
        } else if (items === null || items === undefined) {
        }
    }, [items, selectedCategory]);

    const [IsloggedIn, setIsLoggedIn] = useState(
        auth?.user?.username == user?.username,
    );

    const { is_blocked } = usePage().props;
    const isInteractionBlocked = !IsloggedIn && is_blocked?.blocked;
    const blockedByMe = is_blocked?.blocked_by_me;

    const hasPendingCardPayments = useMemo(() => {
        return (
            stripe_requirements?.requirements?.some(
                (r) => r.type === "card_payments_pending",
            ) || false
        );
    }, [stripe_requirements]);

    const shouldShowFounderBannerClient = useMemo(() => {
        // Only logged-in creators (role 1), never gifters
        if (!IsloggedIn || auth?.user?.role !== 1) return false;
        // Already a founder — no need to pitch them
        if (auth?.user?.is_founder) return false;
        // Hide if Stripe connected more than 45 days ago (window opportunity is over)
        const stripeConnectedAt = auth?.user?.stripe_connected_at;
        if (stripeConnectedAt) {
            const daysSinceConnected =
                (Date.now() - new Date(stripeConnectedAt).getTime()) / 86400000;
            if (daysSinceConnected > 45) return false;
        }
        return !props.founderData?.isEligible;
    }, [
        IsloggedIn,
        auth?.user?.role,
        auth?.user?.is_founder,
        auth?.user?.stripe_connected_at,
        props.founderData?.isEligible,
    ]);

    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [giftsloading, setGiftsLoading] = useState(false);
    const [sLinks, setLinks] = useState(slinks || []);

    useEffect(() => {
        setLinks(slinks || []);
    }, [slinks]);
    const [gifts, setGifts] = useState([]);
    const [activityStatus, setActivityStatus] = useState(null);
    const [activityLoading, setActivityLoading] = useState(false);

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
        // return () => controller.abort();
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
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragStart = (event) => {
        if (!IsloggedIn) return;
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeIndex = wishitems.findIndex(
                (item) => (item.id || item.uuid) === active.id,
            );
            const newOverIndex = wishitems.findIndex(
                (item) => (item.id || item.uuid) === over.id,
            );

            const updated = arrayMove(wishitems, activeIndex, newOverIndex);
            setWishitems(updated);
            updateMovement(updated);
        }
        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

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
            if (!showAdd) return;
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }, [showAdd]);
        useEffect(() => {
            const handleToggleEvent = () => {
                setShowAdd(true);
            };

            const handleCloseEvent = () => {
                setShowAdd(false);
            };

            window.addEventListener("toggleAddOptions", handleToggleEvent);
            window.addEventListener("closeAddOptions", handleCloseEvent);
            return () => {
                window.removeEventListener(
                    "toggleAddOptions",
                    handleToggleEvent,
                );
                window.removeEventListener("closeAddOptions", handleCloseEvent);
            };
        }, []);
        useEffect(() => {
            if (showAdd) {
                document.body.style.overflow = "hidden";
                document.documentElement.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "";
                document.documentElement.style.overflow = "";
                setWishOptions(false);
            }
            return () => {
                document.body.style.overflow = "";
                document.documentElement.style.overflow = "";
            };
        }, [showAdd]);

        const [wishOptions, setWishOptions] = useState(false);

        return (
            <>
                {IsloggedIn ? (
                    <>
                        <div
                            onClick={() => setShowAdd(true)}
                            className="addoption-action cursor-pointer p-2 py-[8px] bg-[#FF007F] border-4 border-black !rounded-[16px] 
                            shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] 
                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all z-50  "
                            // dangerouslySetInnerHTML={{ __html: addicon.replace('fill="#fff"', 'fill="#000"') }}
                        >
                            <b className="text-2xl md:text-3xl px-3 text-white !leading-[8px] top-[4px] relative">
                                +
                            </b>
                        </div>
                        {showAdd
                            ? createPortal(
                                  <div
                                      onClick={() => setShowAdd(false)}
                                      data-lenis-prevent
                                      className="bg-[#00000088] backdrop-blur-sm fixed shadow-lg z-[9990] flex justify-center items-start top-0 left-0 w-full h-full overflow-y-auto overscroll-contain py-6"
                                  >
                                      <div
                                          onClick={(e) => e.stopPropagation()}
                                          className=" w-full md:max-w-[520px] lg:max-w-[660px]  px-6 py-4"
                                      >
                                          <Suspense fallback={"Loading.."}>
                                              <div
                                                  className="
                                                    relative
                                                    bg-[#FFF6EC] 
                                                    border-[3px]
                                                    border-black
                                                    shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                                                    w-full
                                                    rounded-[30px]
                                                    p-6 md:p-8 
                                                "
                                              >
                                                  <button
                                                      type="button"
                                                      onClick={() =>
                                                          setShowAdd(false)
                                                      }
                                                      aria-label="Close"
                                                      className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FF007F] hover:text-white font-black text-2xl leading-none pb-1 transition-colors z-20"
                                                  >
                                                      ×
                                                  </button>
                                                  <div className="text-center mb-5 max-w-[480px] mx-auto">
                                                      <div className="inline-block bg-gradient-to-r from-[#FF007F] to-[#FF8E25] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded-[22px] px-6 py-3 mb-3 -rotate-1">
                                                          <h2 className="text-white font-anton tracking-wide uppercase text-2xl md:text-2xl !leading-none m-0 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.35)]">
                                                              🐷 Turn Content
                                                              Into Cash 💰
                                                          </h2>
                                                      </div>
                                                      <p className="text-[#3d2b1f] font-bold text-sm md:text-base leading-snug">
                                                          Sell content, rewards,
                                                          memberships, and
                                                          exclusive experiences.
                                                      </p>
                                                  </div>

                                                  {AuthUserStripeConnected !==
                                                  1 ? (
                                                      <p className="!mb-2 text-center">
                                                          Please complete your
                                                          Stripe account setup
                                                          to add your wishlist.
                                                      </p>
                                                  ) : (
                                                      ""
                                                  )}
                                                  <div className="!max-h-[50vh] !overflow-y-auto px-3 md:px-4 pt-2">
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
                                                              <div className="w-full font-bold disabled addop bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[30px]  p-3 mb-4 text-center">
                                                                  <div className=" flex items-center">
                                                                      <div className="p-1 rounded-[30px]  border-2 border-black bg-pink-100 flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                          <CiGift
                                                                              color="#000"
                                                                              size="1.5rem"
                                                                          />
                                                                      </div>
                                                                      <div className="pl-3 text-left">
                                                                          <h2 className="font-gulfs font-light text-md font-black uppercase text-black">
                                                                              Add
                                                                              Surprise
                                                                              Gift
                                                                          </h2>
                                                                          <p className="text-sm font-bold text-gray-700">
                                                                              Lets
                                                                              supporters
                                                                              pick
                                                                              from
                                                                              the
                                                                              1000’s
                                                                              of
                                                                              Gifts
                                                                              in
                                                                              the
                                                                              Oink
                                                                              Gift
                                                                              Zone
                                                                          </p>
                                                                      </div>
                                                                  </div>
                                                              </div>

                                                              <div className="flex justify-center">
                                                                  <button
                                                                      onClick={() =>
                                                                          setWishOptions(
                                                                              !wishOptions,
                                                                          )
                                                                      }
                                                                      className="bg-gray-200 text-back rounded-[30px]  px-3 py-2"
                                                                  >
                                                                      Back
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      ) : (
                                                          <>
                                                              <div
                                                                  className={`${AuthUserStripeConnected == 1 ? "block" : "disabled"}`}
                                                              >
                                                                  <div className="w-full grid grid-cols-1 lg:grid-cols-1 gap-x-4 gap-y-1">
                                                                      <div
                                                                          onClick={() =>
                                                                              setWishOptions(
                                                                                  true,
                                                                              )
                                                                          }
                                                                          className="w-full font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]  p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                      >
                                                                          <div className=" flex items-center">
                                                                              <div className="p-1 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ml-2">
                                                                                  <FaRegHeart
                                                                                      color="#FF007F"
                                                                                      size="1.6rem"
                                                                                  />
                                                                              </div>
                                                                              <div className="pl-4 text-left">
                                                                                  <h2 className="font-gulfs text-base md:text-xl !font-light font-black text-black uppercase tracking-normal md:tracking-wide leading-tight">
                                                                                      Sell
                                                                                      exclusive
                                                                                      content
                                                                                  </h2>
                                                                                  <p className="text-sm font-bold text-gray-700">
                                                                                      Offer
                                                                                      a
                                                                                      one-off
                                                                                      piece
                                                                                      of
                                                                                      exclusive
                                                                                      content.
                                                                                  </p>
                                                                              </div>
                                                                          </div>
                                                                      </div>

                                                                      {auth
                                                                          ?.user
                                                                          ?.role ===
                                                                          1 && (
                                                                          <Link
                                                                              className="w-full block font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]  p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                              href="/task/create"
                                                                          >
                                                                              <div className=" flex items-center">
                                                                                  <div className="p-1 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ml-2">
                                                                                      <BiTask
                                                                                          color="#FF007F"
                                                                                          size="1.6rem"
                                                                                      />
                                                                                  </div>
                                                                                  <div className="pl-4 text-left">
                                                                                      <h2 className="font-gulfs text-base md:text-xl !font-light font-black text-black uppercase tracking-normal md:tracking-wide leading-tight">
                                                                                          Create
                                                                                          Task
                                                                                      </h2>
                                                                                      <p className="text-sm font-bold text-gray-700">
                                                                                          Sell
                                                                                          a
                                                                                          personalised
                                                                                          service
                                                                                          or
                                                                                          shoutout.
                                                                                      </p>
                                                                                  </div>
                                                                              </div>
                                                                          </Link>
                                                                      )}

                                                                      {auth
                                                                          ?.user
                                                                          ?.role ===
                                                                          1 && (
                                                                          <div
                                                                              onClick={() => {
                                                                                  setShowAdd(
                                                                                      false,
                                                                                  );
                                                                                  openCreateModal();
                                                                              }}
                                                                              className="w-full font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]  p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                          >
                                                                              <div className=" flex items-center">
                                                                                  <div className="p-1 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ml-2">
                                                                                      <span className="text-2xl">
                                                                                          🐷
                                                                                      </span>
                                                                                  </div>
                                                                                  <div className="pl-4 text-left">
                                                                                      <h2 className="font-gulfs text-base md:text-xl !font-light font-black text-black uppercase tracking-normal md:tracking-wide leading-tight">
                                                                                          Content
                                                                                          goal
                                                                                      </h2>
                                                                                      <p className="text-sm font-bold text-gray-700">
                                                                                          Sell
                                                                                          content
                                                                                          toward
                                                                                          a
                                                                                          visible
                                                                                          goal.
                                                                                      </p>
                                                                                  </div>
                                                                              </div>
                                                                          </div>
                                                                      )}

                                                                      <AddItem
                                                                          classes="w-full font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]  p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                          product_type="digital_products"
                                                                      />
                                                                      <AddPost classes="font-bold p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px] relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]" />
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
                                                                      <AddMembership classes=" font-bold p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center bg-white hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]  !w-full relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]" />
                                                                      <AddBills classes="font-bold p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center bg-white hover:bg-[#FFF0DF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px] relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]" />
                                                                  </div>
                                                              </div>
                                                          </>
                                                      )}
                                                  </div>
                                                  {!wishOptions && (
                                                      <div className="sticky bottom-0 bg-[#FFF6EC] pt-4 pb-2 flex justify-center">
                                                          <button
                                                              onClick={() =>
                                                                  setShowAdd(
                                                                      false,
                                                                  )
                                                              }
                                                              className="
                                                                w-full
                                                                max-w-[220px]
                                                                h-[56px]
                                                                bg-[#E9E1D7]
                                                                border-[3px]
                                                                border-black
                                                                rounded-[20px]
                                                                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                                                font-black
                                                                uppercase
                                                                tracking-wider
                                                                text-black
                                                                hover:translate-x-[2px]
                                                                hover:translate-y-[2px]
                                                                hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                                transition-all
                                                            "
                                                          >
                                                              Cancel
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                          </Suspense>
                                      </div>
                                  </div>,
                                  document.body,
                              )
                            : ""}
                    </>
                ) : (
                    ""
                )}
            </>
        );
    };

    const [UserStripeConnected, setUserStripeConnected] = useState(
        user && user?.stripe_details_submitted == 1 ? 1 : 0,
    );

    const [AuthUserStripeConnected, setAuthUserStripeConnected] = useState(
        auth && auth?.user && auth?.user?.stripe_details_submitted == 1 ? 1 : 0,
    );

    useEffect(() => {
        setUserStripeConnected(
            user && user?.stripe_details_submitted == 1 ? 1 : 0,
        );
    }, [user?.stripe_details_submitted]);

    useEffect(() => {
        setAuthUserStripeConnected(
            auth && auth?.user && auth?.user?.stripe_details_submitted == 1
                ? 1
                : 0,
        );
    }, [auth?.user?.stripe_details_submitted]);

    return (
        <>
            <Guest auth={auth.user} user={user} className="bg-fixed bg-[#A2E4B8]">
                <Head
                    title={`${user?.name || auth?.user?.name} - Spenny Piggy`}
                />
                <div className="wishlistPage overflow-x-hidden min-h-screen !pt-8 sm:!pt-6 pb-0 sm:pb-5 ">
                    <div className="containerbox relative z-10">
                        <VersionUpdate />
                        {props.founderData?.isEligible &&
                        IsloggedIn &&
                        auth?.user?.role === 1 ? (
                            <FounderProgressTracker
                                founderData={props.founderData}
                                variant="mini"
                            />
                        ) : (
                            ""
                        )}
                        {shouldShowFounderBannerClient ? (
                            <OfferAnnouncement variant="default" />
                        ) : (
                            ""
                        )}

                        {IsloggedIn && <ReferralBanner />}

                        <div className="wishbanner relative ">
                            <div className="relative w-full overflow-hidden rounded-box border-2 border-black">
                                {user?.is_founder ? (
                                    <div className="absolute top-4 left-4 md:top-5 md:left-5 flex justify-center lg:justify-start z-10 rounded-full bg-black/45 backdrop-blur-md ring-1 ring-white/25 p-1.5">
                                        <FounderBadge size="md" />
                                    </div>
                                ) : (
                                    ""
                                )}
                                <img
                                    alt={`${user?.name} - Cover Image`}
                                    height={400}
                                    width={1200}
                                    className="w-full cover object-cover !min-h-0 !h-[160px] sm:!h-[210px] md:!h-[260px] lg:!h-[300px]"
                                    src={
                                        IsloggedIn
                                            ? user?.cover_url ||
                                              wishlistbannerimg
                                            : user?.cover_url &&
                                                Number(user?.cover_approved) ===
                                                    1
                                              ? user.cover_url
                                              : wishlistbannerimg
                                    }
                                    loading="eager"
                                    fetchpriority="high"
                                />
                                {/* Light scrim: keeps the founder badge and cover notice legible on any image */}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/20" />
                                {IsloggedIn &&
                                auth?.user?.cover_url &&
                                auth?.user?.cover_approved == 0 ? (
                                    <div className="absolute right-3 bottom-3 z-10 max-w-[85%] rounded-box-sm border-2 border-black bg-white px-3 py-2 text-xs font-semibold text-black md:text-sm">
                                        <button className="flex items-center gap-2 text-left">
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
                                                {" "}
                                                Cover image is waiting for
                                                approval. Currently only you can
                                                see this.{" "}
                                            </p>
                                        </button>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </div>
                            <Userprofile blockedByI={blockedByMe} IsloggedIn={IsloggedIn} />
                        </div>

                        {/* Stripe Account Migration Warning */}

                        {/* {user && user?.role == 1 && AuthUserStripeConnected == 1 && IsloggedIn && showAlert ?
                                <div className="flex p-3 mb-4 text-sm text-blue-700 relative bg-blue-100 border border-blue-300 rounded-[30px]   ">
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
                            <div className="wishManage sticky top-8 w-full max-w-[1200px] mx-auto">
                                {/* Creator Subscription Widget - Show on all tabs for creators */}
                                {/* {IsloggedIn && auth?.user && auth?.user?.role == 1 && (
                                        <Suspense fallback={<div className="mb-4">Loading subscription status...</div>}>
                                            <CreatorSubscriptionWidget 
                                                className="mb-4"
                                            />
                                        </Suspense>
                                    )} */}

                                {IsloggedIn && <CreatorRiskBanner />}

                                {/* Owner-only shortcut into the Revenue Opportunity Centre —
                                    surfaced here so a creator discovers it while looking at their
                                    own profile. Neo-brutalist to match the surrounding profile UI. */}
                                {IsloggedIn && (
                                    <Link
                                        href={route('financial.opportunities')}
                                        className="group mt-3 flex items-center gap-4 rounded-[25px] border-[3px] border-black bg-white px-4 py-4   transition-all duration-150  hover:bg-gray-200"
                                    >
                                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] border-[3px] border-black bg-[#FF007F] text-2xl shadow-[2px_2px_0px_0px_#000]">
                                            📈
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[12px] font-black uppercase tracking-widest text-[#FF007F]">Grow your income</div>
                                            <div className="text-[17px] py-1 font-gulfs font-black uppercase tracking-widest text-black leading-tight">See your top supporters</div>
                                            <div className="text-[13px] font-semibold text-gray-600 mt-0.5">Who spends the most, who&apos;s gone quiet, and how to earn more.</div>
                                        </div>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-[#05EFB8] text-black text-lg font-black shadow-[2px_2px_0px_0px_#000] transition-transform group-hover:translate-x-0.5">
                                            ›
                                        </span>
                                    </Link>
                                )}

                                <div className="userManageRt mt-4 mb-10">
                                    {blockedByMe ? (
                                        <BlockedProfileNotice
                                            blockedByMe={true}
                                            username={user.username}
                                            userId={user.id}
                                        />
                                    ) : (
                                        <div
                                            className={`tabs-container ${IsloggedIn ? "IsloggedIn" : ""}`}
                                        >
                                            <div className="inlinetab ">
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
                                                    <>
                                                        {page === "about" ||
                                                        page === false ? (
                                                            <Suspense
                                                                fallback={
                                                                    <LoadingScreen />
                                                                }
                                                            >
                                                                <div className="flex flex-wrap about-sec self-start ">
                                                                    {props.piggyPotTopSupporters &&
                                                                        (props
                                                                            .piggyPotTopSupporters
                                                                            .length >
                                                                            0 ||
                                                                            (props.piggyPotFeed &&
                                                                                props
                                                                                    .piggyPotFeed
                                                                                    .length >
                                                                                    0)) && (
                                                                            <Suspense
                                                                                fallback={
                                                                                    <div className="mb-4">
                                                                                        Loading
                                                                                        community
                                                                                        activity...
                                                                                    </div>
                                                                                }
                                                                            >
                                                                                <PiggyPotSocialProof
                                                                                    topSupporters={
                                                                                        props.piggyPotTopSupporters
                                                                                    }
                                                                                    feed={
                                                                                        props.piggyPotFeed
                                                                                    }
                                                                                    user={
                                                                                        user
                                                                                    }
                                                                                />
                                                                            </Suspense>
                                                                        )}
                                                                    <div className="w-full lg:w-1/2 h-auto ">
                                                                        <div className="!sticky !top-[113px]">
                                                                            {IsloggedIn ||
                                                                            user
                                                                                ?.intro
                                                                                ?.approved ==
                                                                                1 ? (
                                                                                <Suspense
                                                                                    fallback={
                                                                                        <div className="h-40 bg-gray-100 rounded-3xl animate-pulse border-3 border-black"></div>
                                                                                    }
                                                                                >
                                                                                    <AddIntro
                                                                                        uuid={
                                                                                            user?.id ||
                                                                                            null
                                                                                        }
                                                                                        IsloggedIn={
                                                                                            IsloggedIn
                                                                                        }
                                                                                        user={
                                                                                            user
                                                                                        }
                                                                                    />
                                                                                </Suspense>
                                                                            ) : (
                                                                                ""
                                                                            )}

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
                                                                            (AuthUserStripeConnected ||
                                                                                has_stripe_account) ? (
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
                                                                            !hasPendingCardPayments &&
                                                                            (AuthUserStripeConnected ||
                                                                                has_stripe_account) ? (
                                                                                <EnableCardCapabilities />
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                            {IsloggedIn &&
                                                                            auth?.user &&
                                                                            auth
                                                                                ?.user
                                                                                ?.role ==
                                                                                1 &&
                                                                            (auth
                                                                                ?.user
                                                                                ?.subscription_status ==
                                                                                3 ||
                                                                                auth
                                                                                    ?.user
                                                                                    ?.subscription_status ==
                                                                                    0) ? (
                                                                                <SiteSubscription
                                                                                    auth={
                                                                                        auth
                                                                                    }
                                                                                    subscription_status={
                                                                                        auth
                                                                                            ?.user
                                                                                            ?.subscription_status
                                                                                    }
                                                                                    charges={
                                                                                        auth
                                                                                            ?.user
                                                                                            ?.monthly_charge_enabled
                                                                                    }
                                                                                    user={
                                                                                        auth?.user
                                                                                    }
                                                                                    card_capabilities={
                                                                                        card_capabilities
                                                                                    }
                                                                                    monthly_charges={
                                                                                        monthly_charges
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                ""
                                                                            )}

                                                                            {IsloggedIn &&
                                                                            ((user?.profile_status_lock ==
                                                                                0 &&
                                                                                user?.profile_reject_reason) ||
                                                                                (user?.edit_bio_reason &&
                                                                                    user?.bio_approved ==
                                                                                        2) ||
                                                                                slinks?.reason ||
                                                                                user?.avatar_approved ==
                                                                                    2) ? (
                                                                                <div className="bg-white  border-1 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.9)] rounded-[30px]  mb-4 p-4">
                                                                                    <h2 className="text-red-600 font-bold text-xl ">
                                                                                        Action
                                                                                        Required{" "}
                                                                                    </h2>
                                                                                    {user?.profile_status_lock ==
                                                                                        0 &&
                                                                                        user?.profile_reject_reason && (
                                                                                            <div className="mt-3">
                                                                                                <p className="text-red-700 font-bold">
                                                                                                    Profile
                                                                                                    Edit
                                                                                                    Request
                                                                                                </p>
                                                                                                <p className="text-red-500 text-sm">
                                                                                                    Reason:{" "}
                                                                                                    {
                                                                                                        user.profile_reject_reason
                                                                                                    }
                                                                                                </p>
                                                                                            </div>
                                                                                        )}
                                                                                    {user?.edit_bio_reason &&
                                                                                    user?.bio_approved ==
                                                                                        2 ? (
                                                                                        <div className="mt-3 ">
                                                                                            <p className="text-red-700 font-bold">
                                                                                                {" "}
                                                                                                Bio
                                                                                                Edit
                                                                                                Request{" "}
                                                                                            </p>
                                                                                            <p className="text-red-500 text-sm">
                                                                                                Reason
                                                                                                :
                                                                                                {
                                                                                                    user?.edit_bio_reason
                                                                                                }
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

                                                                                    {user?.avatar_approved ==
                                                                                        2 && (
                                                                                        <div className="mt-3">
                                                                                            <p className="text-red-700 font-semibold">
                                                                                                Avatar
                                                                                                Edit
                                                                                                Request
                                                                                            </p>
                                                                                            <p className="text-red-500 text-sm">
                                                                                                Profile
                                                                                                avatar
                                                                                                has
                                                                                                been
                                                                                                rejected
                                                                                                by
                                                                                                admin.
                                                                                                Please
                                                                                                upload
                                                                                                a
                                                                                                new
                                                                                                avatar.
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                    {slinks?.reason && (
                                                                                        <div className="mt-3">
                                                                                            <p className="text-red-700 font-semibold">
                                                                                                Social
                                                                                                Media
                                                                                                Edit
                                                                                                Request
                                                                                            </p>
                                                                                            <p className="text-red-500 text-sm">
                                                                                                Reason:
                                                                                                {
                                                                                                    slinks.reason
                                                                                                }
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
                                                                                </div>
                                                                            ) : (
                                                                                ""
                                                                            )}

                                                                            <div className="bg-white border-[3px] border-black rounded-[30px]  shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
                                                                                <div className="p-4 md:p-8">
                                                                                    <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-wide">
                                                                                        About
                                                                                        Me
                                                                                    </h2>
                                                                                    <p
                                                                                        className={`text-gray-700 font-bold text-md md:text-lg text-left mt-4 ${
                                                                                            user &&
                                                                                            !user.bio
                                                                                                ? "hidden"
                                                                                                : ""
                                                                                        }`}
                                                                                    >
                                                                                        {(user &&
                                                                                            user.bio) ||
                                                                                            "Hy, I am a creator on SpennyPiggy."}
                                                                                    </p>

                                                                                    {IsloggedIn &&
                                                                                        user?.bio_approved ==
                                                                                            0 && (
                                                                                            <div className="mt-4 text-sm font-bold text-[#FF8E25] bg-orange-50 p-3 rounded-[15px] border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                                                                <div className="flex items-center gap-2">
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
                                                                                                        Your
                                                                                                        bio
                                                                                                        is
                                                                                                        waiting
                                                                                                        for
                                                                                                        admin
                                                                                                        approval.
                                                                                                        Currently
                                                                                                        only
                                                                                                        you
                                                                                                        can
                                                                                                        see
                                                                                                        this.
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}

                                                                                    {user?.creator_category && (
                                                                                        <div className="mt-6 flex flex-wrap gap-1 md:gap-2">
                                                                                            {(() => {
                                                                                                try {
                                                                                                    const tags =
                                                                                                        typeof user.creator_category ===
                                                                                                        "string"
                                                                                                            ? JSON.parse(
                                                                                                                  user.creator_category,
                                                                                                              )
                                                                                                            : user.creator_category;

                                                                                                    if (
                                                                                                        !Array.isArray(
                                                                                                            tags,
                                                                                                        )
                                                                                                    )
                                                                                                        return null;

                                                                                                    return tags.map(
                                                                                                        (
                                                                                                            tag,
                                                                                                            index,
                                                                                                        ) => (
                                                                                                            <span
                                                                                                                key={
                                                                                                                    index
                                                                                                                }
                                                                                                                className="px-4 py-1.5 bg-pink-100 text-pink-700 rounded-xl text-[12px] md:text-sm font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase"
                                                                                                            >
                                                                                                                {
                                                                                                                    tag
                                                                                                                }
                                                                                                            </span>
                                                                                                        ),
                                                                                                    );
                                                                                                } catch (e) {
                                                                                                    return null;
                                                                                                }
                                                                                            })()}
                                                                                        </div>
                                                                                    )}

                                                                                    <Suspense
                                                                                        fallback={
                                                                                            null
                                                                                        }
                                                                                    >
                                                                                        <SocialLinks
                                                                                            links={
                                                                                                sLinks
                                                                                            }
                                                                                        />
                                                                                    </Suspense>

                                                                                    {IsloggedIn &&
                                                                                        slinks?.status ===
                                                                                            0 && (
                                                                                            <div className="mt-4 text-sm font-bold text-[#FF8E25] bg-orange-50 p-3 rounded-[20px] border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                                                                <div className="flex items-center gap-2">
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
                                                                                                        Your
                                                                                                        social
                                                                                                        media
                                                                                                        links
                                                                                                        are
                                                                                                        waiting
                                                                                                        for
                                                                                                        admin
                                                                                                        approval.
                                                                                                        Currently
                                                                                                        only
                                                                                                        you
                                                                                                        can
                                                                                                        see
                                                                                                        them.
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}

                                                                                    {IsloggedIn ? (
                                                                                        <div className="userProfileDate pt-0 md:pt-3">
                                                                                            {/* {auth.user && auth.user.stripe_details_submitted == 1 ?
                                                                                            <AddGoal stripe_enabled={auth.user && auth.user.stripe_details_submitted}
                                                                                            fetch_goal={fetch_goal} activegoal={goal} />
                                                                                        : ''}
                                                                                    */}

                                                                                            <div className="addsocial flex">
                                                                                                <ul>
                                                                                                    <li>
                                                                                                        <AddSocial
                                                                                                            classes={`bg-[#A2E4B8] hover:bg-[#A2E4B8] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[15px] px-4 py-2 text-black flex ml-auto font-black capitalize  transition-colors font-cera-medium !text-[18px] !text-black`}
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
                                                                                                                " bg-yellow-300 hover:bg-yellow-500 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[15px] px-4 py-2 text-black flex ml-auto font-black capitalize  transition-colors font-cera-medium !text-[18px] !text-black"
                                                                                                            }
                                                                                                            custom={
                                                                                                                wishitems &&
                                                                                                                wishitems.length >
                                                                                                                    0
                                                                                                                    ? `${ziggy?.location}/${user?.username ?? "creator_test"}/wishes?item=${wishitems[0]?.uuid}`
                                                                                                                    : `${ziggy?.location}/${user?.username ?? "creator_test"}`
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

                                                                                    {auth
                                                                                        ?.user
                                                                                        ?.role ==
                                                                                        1 &&
                                                                                    AuthUserStripeConnected ==
                                                                                        1 ? (
                                                                                        <PaymentDashboard
                                                                                            classes="!tracking-wider text-sm md:!text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] mt-6 !bg-pink-600 text-white !px-4 py-3 w-full border-[3px] border-black rounded-[30px]  bg-pink-600 hover:bg-pink-700   transition-all duration-200"
                                                                                            text="Creator Payment Dashboard"
                                                                                        />
                                                                                    ) : (
                                                                                        <>
                                                                                            {auth
                                                                                                ?.user
                                                                                                ?.identity_status ==
                                                                                            1 ? (
                                                                                                <div className="finish mt-4 block">
                                                                                                    <p className="mb-4 text-lg font-bold text-black">
                                                                                                        {" "}
                                                                                                        Finish
                                                                                                        setting
                                                                                                        up
                                                                                                        your
                                                                                                        account
                                                                                                        to
                                                                                                        receive
                                                                                                        funds.
                                                                                                        You
                                                                                                        have
                                                                                                        more
                                                                                                        steps
                                                                                                        to
                                                                                                        complete
                                                                                                        your
                                                                                                        payment
                                                                                                        setup.
                                                                                                    </p>
                                                                                                    <Link
                                                                                                        disabled={
                                                                                                            auth
                                                                                                                ?.user
                                                                                                                ?.monthly_charge_enabled
                                                                                                                ? ""
                                                                                                                : true
                                                                                                        }
                                                                                                        href={
                                                                                                            "/stripe"
                                                                                                        }
                                                                                                        className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] mt-6 text-white !p-4 w-full border-[3px] border-black rounded-xl bg-pink-600 hover:bg-pink-700 font-black uppercase tracking-widest text-sm transition-all duration-200 block text-center"
                                                                                                    >
                                                                                                        {" "}
                                                                                                        Finish
                                                                                                        Setup
                                                                                                    </Link>
                                                                                                </div>
                                                                                            ) : (
                                                                                                ""
                                                                                            )}
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {!IsloggedIn &&
                                                                            auth
                                                                                ?.user
                                                                                ?.username &&
                                                                            auth
                                                                                ?.user
                                                                                ?.username !==
                                                                                user?.username ? (
                                                                                <div className="mb-6 !mt-6 relative group">
                                                                                    {/* <div className="absolute -inset-1 bg-gradient-to-r from-[#8C52FF] via-[#FF007F] to-[#05EFB8] rounded-[34px] md:rounded-[44px] blur opacity-20 group-hover:opacity-40 transition duration-700"></div> */}
                                                                                    <div className="relative overflow-hidden p-5 md:p-6 rounded-[30px]  bg-[#fdfbf7] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[120px] md:min-h-[140px]">
                                                                                        <div className="items-stretch md:items-center justify-between gap-5 relative z-10">
                                                                                            <div className="flex items-center gap-4 order-1 w-full md:w-auto justify-center md:justify-start">
                                                                                                <div className="relative">
                                                                                                    <img
                                                                                                        src={
                                                                                                            auth
                                                                                                                ?.user
                                                                                                                ?.avatar_url ||
                                                                                                            ""
                                                                                                        }
                                                                                                        alt="you"
                                                                                                        className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="text-black text-xl font-black tracking-widest">
                                                                                                    +
                                                                                                </div>
                                                                                                <div className="relative">
                                                                                                    <img
                                                                                                        src={
                                                                                                            user?.avatar_url ||
                                                                                                            ""
                                                                                                        }
                                                                                                        alt="creator"
                                                                                                        className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex-1 order-2 text-center md:text-left mt-6">
                                                                                                <p className="text-[11px] font-black tracking-[0.25em] uppercase text-gray-700 mb-1">
                                                                                                    Support
                                                                                                    Story
                                                                                                </p>
                                                                                                <p className="text-black font-black uppercase   text-xl md:text-xl leading-snug">
                                                                                                    Relive
                                                                                                    your
                                                                                                    moments
                                                                                                    with{" "}
                                                                                                    {user?.name ||
                                                                                                        "@" +
                                                                                                            user?.username}
                                                                                                </p>
                                                                                                <p className="text-gray-700 font-bold text-sm md:text-sm mt-1">
                                                                                                    Gifts,
                                                                                                    thank‑yous
                                                                                                    and
                                                                                                    milestones
                                                                                                    —
                                                                                                    beautifully
                                                                                                    in
                                                                                                    one
                                                                                                    place.
                                                                                                </p>
                                                                                            </div>
                                                                                            <div className="order-3 w-full md:w-auto md:shrink-0 mt-6">
                                                                                                <Link
                                                                                                    href={`/support/${user?.username}/${auth?.user?.username}`}
                                                                                                    className="w-full md:w-auto block text-center px-6 py-3 font-black rounded-xl text-sm uppercase tracking-widest bg-yellow-300 border-[3px] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 "
                                                                                                >
                                                                                                    View
                                                                                                    Your
                                                                                                    Story
                                                                                                </Link>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="lg:pl-6 w-full lg:w-1/2">
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
                                                                            <Suspense
                                                                                fallback={
                                                                                    <div className="mb-4">
                                                                                        Loading
                                                                                        steps...
                                                                                    </div>
                                                                                }
                                                                            >
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
                                                                            </Suspense>
                                                                        ) : (
                                                                            ""
                                                                        )}

                                                                        {props.piggyPots &&
                                                                            props
                                                                                .piggyPots
                                                                                .length >
                                                                                0 && (
                                                                                <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-6">
                                                                                    <Suspense
                                                                                        fallback={
                                                                                            <div className="mb-4">
                                                                                                Loading
                                                                                                Piggy
                                                                                                Pot...
                                                                                            </div>
                                                                                        }
                                                                                    >
                                                                                        <PiggyPotWidget
                                                                                            piggyPots={
                                                                                                props.piggyPots
                                                                                            }
                                                                                            user={
                                                                                                user
                                                                                            }
                                                                                            global_currency={
                                                                                                global_currency
                                                                                            }
                                                                                        />
                                                                                    </Suspense>
                                                                                </div>
                                                                            )}

                                                                        {!IsloggedIn &&
                                                                        UserStripeConnected ==
                                                                            1 &&
                                                                        w >
                                                                            767 &&
                                                                        (!props.piggyPots ||
                                                                            props
                                                                                .piggyPots
                                                                                .length ===
                                                                                0) ? (
                                                                            <Suspense
                                                                                fallback={
                                                                                    null
                                                                                }
                                                                            >
                                                                                <TipInner
                                                                                    classes={`mb-4`}
                                                                                />
                                                                            </Suspense>
                                                                        ) : (
                                                                            ""
                                                                        )}
                                                                        <Suspense
                                                                            fallback={
                                                                                <div className="mb-4">
                                                                                    Loading
                                                                                    posts...
                                                                                </div>
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
                                                                                        <div className="new-wish-cats flex items-center mb-6 gap-2 flex-wrap p-2">
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
                                                                                                className={` ${
                                                                                                    selectedCategory ==
                                                                                                    ""
                                                                                                        ? "bg-[#FF007F] text-black border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                                                                                                        : "bg-[#1c1c24] text-white border-[3px] border-black hover:bg-gray-800"
                                                                                                } px-4 py-1 rounded-xl font-black uppercase tracking-widest text-sm transition-all`}
                                                                                            >
                                                                                                All
                                                                                            </Link>
                                                                                            {wish_categories.map(
                                                                                                (
                                                                                                    c,
                                                                                                    i,
                                                                                                ) => {
                                                                                                    return (
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
                                                                                                            className={`${
                                                                                                                selectedCategory ==
                                                                                                                c.id
                                                                                                                    ? "bg-[#FF007F] text-black border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                                                                                                                    : "bg-[#1c1c24] text-white border-[3px] border-black hover:bg-gray-800"
                                                                                                            } px-4 py-1 rounded-xl font-black uppercase tracking-widest text-sm transition-all`}
                                                                                                            key={`cats-${i}`}
                                                                                                        >
                                                                                                            {
                                                                                                                c.category
                                                                                                            }
                                                                                                        </Link>
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
                                                                                        <DndContext
                                                                                            sensors={
                                                                                                sensors
                                                                                            }
                                                                                            collisionDetection={
                                                                                                closestCorners
                                                                                            }
                                                                                            onDragStart={
                                                                                                handleDragStart
                                                                                            }
                                                                                            onDragEnd={
                                                                                                handleDragEnd
                                                                                            }
                                                                                            onDragCancel={
                                                                                                handleDragCancel
                                                                                            }
                                                                                        >
                                                                                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 md:!gap-4">
                                                                                                <SortableContext
                                                                                                    strategy={
                                                                                                        rectSortingStrategy
                                                                                                    }
                                                                                                    items={wishitems.map(
                                                                                                        (
                                                                                                            item,
                                                                                                        ) =>
                                                                                                            item.id ||
                                                                                                            item.uuid,
                                                                                                    )}
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
                                                                                                {IsloggedIn && (
                                                                                                    <AddMoreTile
                                                                                                        title="Add Wish"
                                                                                                        subtitle="Create a new wish for your supporters."
                                                                                                        onClick={() =>
                                                                                                            window.dispatchEvent(
                                                                                                                new Event(
                                                                                                                    "toggleAddOptions",
                                                                                                                ),
                                                                                                            )
                                                                                                        }
                                                                                                        minHeightClass="min-h-[300px]"
                                                                                                    />
                                                                                                )}
                                                                                            </div>
                                                                                            {createPortal(
                                                                                                <DragOverlay
                                                                                                    dropAnimation={{
                                                                                                        duration: 250,
                                                                                                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                                                                                                        sideEffects:
                                                                                                            defaultDropAnimationSideEffects(
                                                                                                                {
                                                                                                                    styles: {
                                                                                                                        active: {
                                                                                                                            opacity:
                                                                                                                                "0.3",
                                                                                                                        },
                                                                                                                    },
                                                                                                                },
                                                                                                            ),
                                                                                                    }}
                                                                                                    zIndex={
                                                                                                        999999
                                                                                                    }
                                                                                                >
                                                                                                    {activeItem ? (
                                                                                                        <div
                                                                                                            style={{
                                                                                                                width: "320px",
                                                                                                                maxWidth:
                                                                                                                    "90vw",
                                                                                                            }}
                                                                                                        >
                                                                                                            <Wishlistbox
                                                                                                                itm={
                                                                                                                    activeItem
                                                                                                                }
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
                                                                                                                }
                                                                                                                classes=" "
                                                                                                                isOverlay
                                                                                                            />
                                                                                                        </div>
                                                                                                    ) : null}
                                                                                                </DragOverlay>,
                                                                                                document.body,
                                                                                            )}
                                                                                        </DndContext>
                                                                                    </>
                                                                                ) : (
                                                                                    <div className="w-full">
                                                                                        {IsloggedIn ? (
                                                                                            <>
                                                                                                <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                                                                                    <div className="text-4xl mb-3">
                                                                                                        🎁
                                                                                                    </div>
                                                                                                    <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                                        No
                                                                                                        Wishes
                                                                                                        Yet
                                                                                                    </h3>
                                                                                                    <p className="text-gray-600 font-bold mb-6">
                                                                                                        Add
                                                                                                        items
                                                                                                        to
                                                                                                        your
                                                                                                        wishlist
                                                                                                        and
                                                                                                        let
                                                                                                        your
                                                                                                        fans
                                                                                                        buy
                                                                                                        them
                                                                                                        for
                                                                                                        you.
                                                                                                    </p>
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            window.dispatchEvent(
                                                                                                                new Event(
                                                                                                                    "toggleAddOptions",
                                                                                                                ),
                                                                                                            )
                                                                                                        }
                                                                                                        className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                                                                                                    >
                                                                                                        Add
                                                                                                        Wish
                                                                                                    </button>
                                                                                                </div>
                                                                                            </>
                                                                                        ) : (
                                                                                            <Nocontent
                                                                                                showdiscover={
                                                                                                    true
                                                                                                }
                                                                                                text="Nothing to see."
                                                                                            />
                                                                                        )}
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
                                                                            profileUser={
                                                                                user
                                                                            }
                                                                            suppressEmptyState={
                                                                                IsloggedIn &&
                                                                                (!tasks ||
                                                                                    tasks.length ===
                                                                                        0)
                                                                            }
                                                                        />
                                                                        {IsloggedIn &&
                                                                            (!tasks ||
                                                                                tasks.length ===
                                                                                    0) && (
                                                                                <>
                                                                                    <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                                                                        <div className="text-4xl mb-3">
                                                                                            📋
                                                                                        </div>
                                                                                        <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                            No
                                                                                            Active
                                                                                            Tasks
                                                                                        </h3>
                                                                                        <p className="text-gray-600 font-bold mb-6">
                                                                                            Create
                                                                                            tasks
                                                                                            and
                                                                                            let
                                                                                            your
                                                                                            fans
                                                                                            pay
                                                                                            you
                                                                                            to
                                                                                            complete
                                                                                            them.
                                                                                        </p>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                window.dispatchEvent(
                                                                                                    new Event(
                                                                                                        "toggleAddOptions",
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                                                                                        >
                                                                                            Create
                                                                                            Task
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
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
                                                                            suppressEmptyState={
                                                                                IsloggedIn &&
                                                                                (!props.memberships ||
                                                                                    props
                                                                                        .memberships
                                                                                        ?.length ===
                                                                                        0)
                                                                            }
                                                                        />
                                                                        {IsloggedIn &&
                                                                            (!props.memberships ||
                                                                                props
                                                                                    .memberships
                                                                                    ?.length ===
                                                                                    0) && (
                                                                                <>
                                                                                    <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                                                                        <div className="text-4xl mb-3">
                                                                                            ⭐
                                                                                        </div>
                                                                                        <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                            No
                                                                                            Memberships
                                                                                            Yet
                                                                                        </h3>
                                                                                        <p className="text-gray-600 font-bold mb-6">
                                                                                            Create
                                                                                            membership
                                                                                            tiers
                                                                                            for
                                                                                            your
                                                                                            most
                                                                                            loyal
                                                                                            supporters.
                                                                                        </p>
                                                                                        <Link
                                                                                            href={route(
                                                                                                "membershipDashboard",
                                                                                            )}
                                                                                            className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                                                                                        >
                                                                                            Create
                                                                                            Membership
                                                                                        </Link>
                                                                                    </div>
                                                                                </>
                                                                            )}
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
                                                                            suppressEmptyState={
                                                                                IsloggedIn &&
                                                                                (!props.bills ||
                                                                                    props
                                                                                        .bills
                                                                                        ?.length ===
                                                                                        0)
                                                                            }
                                                                        />
                                                                        {IsloggedIn &&
                                                                            (!props.bills ||
                                                                                props
                                                                                    .bills
                                                                                    ?.length ===
                                                                                    0) && (
                                                                                <>
                                                                                    <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                                                                        <div className="text-4xl mb-3">
                                                                                            🧾
                                                                                        </div>
                                                                                        <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                            No
                                                                                            Active
                                                                                            Bills
                                                                                        </h3>
                                                                                        <p className="text-gray-600 font-bold mb-6">
                                                                                            Offer
                                                                                            a
                                                                                            content
                                                                                            membership
                                                                                            your
                                                                                            fans
                                                                                            can
                                                                                            subscribe
                                                                                            to.
                                                                                        </p>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                window.dispatchEvent(
                                                                                                    new Event(
                                                                                                        "toggleAddOptions",
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                                                                                        >
                                                                                            Create
                                                                                            Bill
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
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
                                                                            suppressEmptyState={
                                                                                IsloggedIn &&
                                                                                (!props.shops ||
                                                                                    props
                                                                                        .shops
                                                                                        .length ===
                                                                                        0)
                                                                            }
                                                                        />
                                                                        {IsloggedIn &&
                                                                            (!props.shops ||
                                                                                props
                                                                                    .shops
                                                                                    .length ===
                                                                                    0) && (
                                                                                <>
                                                                                    <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                                                                        <div className="text-4xl mb-3">
                                                                                            🛍️
                                                                                        </div>
                                                                                        <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                            No
                                                                                            Shop
                                                                                            Items
                                                                                            Yet
                                                                                        </h3>
                                                                                        <p className="text-gray-600 font-bold mb-6">
                                                                                            Create
                                                                                            physical
                                                                                            or
                                                                                            digital
                                                                                            products
                                                                                            for
                                                                                            your
                                                                                            fans
                                                                                            to
                                                                                            buy.
                                                                                        </p>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                window.dispatchEvent(
                                                                                                    new Event(
                                                                                                        "toggleAddOptions",
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                                                                                        >
                                                                                            Add
                                                                                            Item
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                    </Suspense>
                                                                ) : (
                                                                    ""
                                                                )}

                                                                {page ===
                                                                "piggy-pots" ? (
                                                                    <Suspense
                                                                        fallback={
                                                                            <LoadingScreen />
                                                                        }
                                                                    >
                                                                        <PiggyPotsGrid
                                                                            piggyPots={
                                                                                props.piggyPots
                                                                            }
                                                                            IsloggedIn={
                                                                                IsloggedIn
                                                                            }
                                                                            user={
                                                                                user
                                                                            }
                                                                            global_currency={
                                                                                global_currency
                                                                            }
                                                                            topSupporters={
                                                                                props.piggyPotTopSupporters
                                                                            }
                                                                            feed={
                                                                                props.piggyPotFeed
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
                                                                                {IsloggedIn ? (
                                                                                    <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                                                                                        <div className="text-4xl mb-3">
                                                                                            🎁
                                                                                        </div>
                                                                                        <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                            No
                                                                                            Active
                                                                                            Gifts
                                                                                        </h3>
                                                                                        <p className="text-gray-600 font-bold mb-6">
                                                                                            Create
                                                                                            physical
                                                                                            gifts
                                                                                            for
                                                                                            your
                                                                                            fans
                                                                                            to
                                                                                            buy
                                                                                            for
                                                                                            you.
                                                                                        </p>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                window.dispatchEvent(
                                                                                                    new Event(
                                                                                                        "toggleAddOptions",
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                                                                                        >
                                                                                            Add
                                                                                            Gift
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <Nocontent
                                                                                        showdiscover={
                                                                                            true
                                                                                        }
                                                                                        text="Nothing to see."
                                                                                    />
                                                                                )}
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
                                                    </>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Suspense fallback={<LoadingScreen />}>
                                <Gifter
                                    auth={auth}
                                    sLinks={sLinks}
                                    IsloggedIn={IsloggedIn}
                                    blockData={is_blocked}
                                />
                            </Suspense>
                        )}
                    </div>
                </div>

                {IsloggedIn ? (
                    <Popup
                        action={openCurrency}
                        space="4"
                        modalclass="pinkmodal"
                    >
                        <ChangeCurrency
                            currencyaction={currencyaction}
                            defaultvalue={global_currency}
                        />
                    </Popup>
                ) : (
                    ""
                )}

                <PiggyPotModal
                    show={showPotModal}
                    onClose={() => setShowPotModal(false)}
                    mode={modalMode}
                    pot={selectedPot}
                    auth={auth}
                />

                <OldSubscribe />
            </Guest>
        </>
    );
}
