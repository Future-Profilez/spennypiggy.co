import { useState, useMemo, useEffect, Suspense, lazy, useRef } from "react";
import { createPortal } from "react-dom";
import { Head, Link, usePage } from "@inertiajs/react";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.png";
const Wishlist = lazyRetry(() => import("./Auth/Wishlist"));
const Wishlistbox = lazyRetry(() => import("@/wishlist/Wishlistbox"));
import Userprofile from "@/wishlist/Userprofile";
import ProfileRightRail from "@/Components/Profile/ProfileRightRail";
const CoverIdentity = lazyRetry(
    () => import("@/Components/Profile/CoverIdentity"),
);
import EarningsMilestone from "@/Components/Profile/EarningsMilestone";
import SupporterWall from "@/Components/Profile/SupporterWall";
import CategoryTags from "@/Components/Profile/CategoryTags";
import ReturningSupporter from "@/Components/Profile/ReturningSupporter";
const ShareProfile = lazyRetry(() => import("@/wishlist/ShareProfile"));
const Nocontent = lazyRetry(() => import("@/includes/Nocontent"));
const LoadingScreen = lazyRetry(() => import("@/includes/LoadingScreen"));
const PaymentDashboard = lazyRetry(() => import("./stripe/PaymentDashboard"));
const ChangeCurrency = lazyRetry(() => import("@/Components/ChangeCurrency"));
const Popup = lazyRetry(() => import("@/Components/Popup"));
const MembershipsLists = lazyRetry(
    () => import("./membership/MembershipsLists"),
);
import { BiTask } from "react-icons/bi";
const AddMembership = lazyRetry(() => import("./membership/AddMembership"));
const Gifter = lazyRetry(() => import("./gifter/Gifter"));
const AddBills = lazyRetry(() => import("./bills/AddBills"));
const EditCategories = lazyRetry(() => import("@/wishlist/EditCategories"));
const TipInner = lazyRetry(() => import("./TipJar/TipInner"));
const Billslist = lazyRetry(() => import("./bills/Billslist"));
const FeedList = lazyRetry(() => import("./feed/FeedList"));
const AddPost = lazyRetry(() => import("./feed/AddPost"));
const AddIntro = lazyRetry(() => import("./intros/AddIntro"));
const MyGoal = lazyRetry(() => import("./TipJar/MyGoal"));
const FeatureSuggestionModal = lazyRetry(
    () => import("@/Components/FeatureSuggestionModal"),
);
const SocialLinks = lazyRetry(() => import("@/includes/SocialLinks"));
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
import CreatorPushCard from "@/Components/push/CreatorPushCard";
import CreatorJourneyCard from "@/Components/CreatorJourneyCard";
import DiscoveryStatsPanel from "@/Components/discovery/DiscoveryStatsPanel";
import OpportunityPanel from "@/Components/earnings/OpportunityPanel";
import MoreCreators from "@/Components/discovery/MoreCreators";
import {
    DISCOVERY_DASHBOARD_LINES,
    DISCOVERY_DASHBOARD_TITLE,
} from "@/constants/discovery";
import AddGift from "./feed/AddGift";
import { CiShoppingCart } from "react-icons/ci";
import { DashboardStripeMigrationWarning } from "@/Components/StripeMigrationWarning";
import { FaRegHeart } from "react-icons/fa";
import InstantTabSystem from "@/Components/InstantTabSystem";
import AddMoreTile from "@/Components/AddMoreTile";

const ProfileProductLists = lazyRetry(
    () => import("./shop/profile/ProfileProductLists"),
);
const ProfileTaskLists = lazyRetry(
    () => import("./Tasks/Profile/ProfileTaskLists"),
);
const AddItem = lazyRetry(() => import("./shop/AddItem"));

const GiftListing = lazyRetry(() => import("./rye/GiftListing"));
const OldSubscribe = lazyRetry(() => import("./webpush/OldSubscribe"));
const AddSocial = lazyRetry(() => import("./Auth/Social"));
const CreatorVerification = lazyRetry(
    () => import("./Profile/CreatorVerification"),
);
const SiteSubscription = lazyRetry(() => import("./Profile/SiteSubscription"));
const EnableCardCapabilities = lazyRetry(
    () => import("./stripe/EnableCardCapabilities"),
);
const ActionRequired = lazyRetry(() => import("./stripe/ActionRequired"));
const ErrorBoundary = lazyRetry(() => import("@/Components/ErrorBoundary"));
const SubscriptionNewsPopup = lazyRetry(
    () => import("@/Components/SubscriptionNewsPopup"),
);
// Small, always rendered on the creator's own About tab — not worth a lazy chunk.
const PromoSlider = lazyRetry(() => import("@/Components/Promo/PromoSlider"));
const FounderProgressTracker = lazyRetry(
    () => import("@/Components/FounderProgressTracker"),
);
const GrowthBonusTracker = lazyRetry(
    () => import("@/Components/GrowthBonusTracker"),
);
const FounderBadge = lazyRetry(() => import("@/Components/FounderBadge"));
import PendingChangesNotice from "@/Components/PendingChangesNotice";
import lazyRetry from "@/utils/lazyRetry";

const CreatorRiskBanner = lazyRetry(
    () => import("@/Components/Risk/CreatorRiskBanner"),
);
const CreatorActivityWidget = lazyRetry(
    () => import("@/Components/CreatorActivityWidget"),
);
const PiggyPotWidget = lazyRetry(
    () => import("@/Components/PiggyPots/PiggyPotWidget"),
);
const PiggyPotSocialProof = lazyRetry(
    () => import("@/Components/PiggyPots/PiggyPotSocialProof"),
);
const PiggyPotsGrid = lazyRetry(
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
        profile_overview,
        pending_profile_changes,
        // Discovery Phase 2. An OBJECT of real month-to-date figures for the
        // owner of a creator profile; null on every other view. Null is "not
        // your dashboard", never "no data yet" — zeros are a real payload.
        discovery_panel: discoveryPanel = null,
        // Discovery Phase 3 — up to four cards for the row at the foot of this
        // profile. An ARRAY, and a short one is a correct answer: the server
        // renders fewer rather than padding a slot with an ineligible creator,
        // and never with the creator whose profile this is. Empty = no row.
        // Enhanced Creator Earnings + Revenue Opportunity Centre (brief §C).
        // An OBJECT for the OWNER of a creator profile; null on every other
        // view — it names their supporters and what each has spent, and this
        // page is also the public profile. Null is "not your dashboard", never
        // "no data yet": a creator with no sales gets a real payload of zeros.
        opportunity_panel: opportunityPanel = null,
        growth_bonus_panel: growthBonusPanel = null,
        more_creators: moreCreators = [],
    } = props;

    /*
     * 🚨 AN EMPTY TAB POINTS AT WHAT THIS CREATOR DOES SELL (21 Aug 2026).
     * It used to render `Nocontent` with `showdiscover`, whose only action is a
     * link to OTHER creators — so a supporter who arrived with intent, on the
     * creator's own money page, was handed an exit. `profile_overview` already
     * carries the live count per module, so the page can name the tab that has
     * something in it instead of guessing.
     *
     * ⚠️ Discover survives only for a creator with nothing listed anywhere:
     * there is genuinely no onward step on this profile, and a dead end is worse
     * than a redirect.
     */
    const emptyTabProps = useMemo(() => {
        const ov = profile_overview || {};
        const modules = [
            { page: "wishes", label: "Wishes", count: Number(ov.wishes || 0) },
            { page: "shop", label: "Shop", count: Number(ov.shops || 0) },
            { page: "tasks", label: "Tasks", count: Number(ov.tasks || 0) },
            {
                page: "piggy-pots",
                label: "Piggy Pots",
                count: Number(ov.piggy_pots || 0),
            },
            {
                page: "memberships",
                label: "Memberships",
                count: Number(ov.memberships || 0),
            },
            { page: "bills", label: "Bills", count: Number(ov.bills || 0) },
        ]
            .filter((m) => m.count > 0)
            .sort((a, b) => b.count - a.count);

        const who =
            user?.name ||
            (user?.username ? `@${user.username}` : "This creator");

        if (modules.length === 0) {
            return {
                text: "Nothing listed yet",
                subheading: `${who} hasn't put anything up for sale yet.`,
                showdiscover: true,
            };
        }

        const names = modules.slice(0, 2).map((m) => m.label);
        const list =
            names.length === 2 ? `${names[0]} and ${names[1]}` : names[0];

        return {
            text: "Nothing here yet",
            subheading: `${who} is selling in ${list}.`,
            actionHref: `/${user?.username}/${modules[0].page}`,
            actionText: `See ${modules[0].label}`,
            showdiscover: false,
        };
    }, [profile_overview, user?.name, user?.username]);

    const [showPotModal, setShowPotModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
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

    const { is_blocked, intro: introProp } = usePage().props;
    // The profile OWNER's role, not the viewer's — this page is the profile.
    const isCreatorProfile = Number(user?.role) === 1;
    const isInteractionBlocked = !IsloggedIn && is_blocked?.blocked;
    const blockedByMe = is_blocked?.blocked_by_me;

    const hasPendingCardPayments = useMemo(() => {
        return (
            stripe_requirements?.requirements?.some(
                (r) => r.type === "card_payments_pending",
            ) || false
        );
    }, [stripe_requirements]);

    // The ActionRequired panel and EnableCardCapabilities both send the creator
    // to /stripe/enable_card_payments, so rendering both puts two copies of the
    // same instruction on the page. The server now returns one card describing
    // the actual state, which always says more than the generic block.
    //
    // `connection_error` is the exception: it means we could not READ Stripe, so
    // it describes nothing about the account. Suppressing the standalone CTA on
    // a transient Stripe outage would leave the creator with "we could not check
    // your account" and no way forward.
    const hasStripeActionPanel = useMemo(() => {
        return (stripe_requirements?.requirements || []).some(
            (r) => r.type !== "connection_error",
        );
    }, [stripe_requirements]);

    /*
     * The founder card exists in two forms and only one may render.
     *
     * This tracker carries the creator's OWN figures, so it wins wherever it
     * applies; the promo deck's generic founder card is excluded while it does.
     * Showing both told the same creator the same thing twice, in two tones, four
     * inches apart — which is the fault this whole slider exists to fix.
     */
    const showFounderTracker = useMemo(
        () =>
            Boolean(
                props.founderData?.isEligible &&
                IsloggedIn &&
                auth?.user?.role === 1,
            ),
        [props.founderData?.isEligible, IsloggedIn, auth?.user?.role],
    );

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

    // The activity card only exists once there is money to stop — Stripe
    // connected AND identity verified. Same predicate gates the fetch and the
    // render; two copies would drift and this one costs a request per page load
    // for the largest cohort of creators (everyone still before Connect).
    const canSeeActivityCard =
        IsloggedIn &&
        auth?.user?.role === 1 &&
        auth?.user?.stripe_details_submitted == 1 &&
        auth?.user?.identity_status == 1;

    // Fetch creator activity status
    const fetchActivityStatus = async () => {
        if (!canSeeActivityCard) {
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
        if (canSeeActivityCard) {
            fetchActivityStatus();
        }
        // The predicate itself, not its inputs — a creator who finishes Connect
        // or clears identity in this session gets the card without a full reload.
    }, [canSeeActivityCard]);

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
        // ⚠️ The `?add=` intent is read ONCE, during render, and then handed down as a prop.
        // It used to be re-parsed from window.location by every consumer while this effect
        // stripped the query string on mount — and AddItem is lazy-loaded, so its chunk
        // resolved AFTER the strip and read nothing. That is why `?add=digital` opened only
        // the generic chooser and the dashboard card's three options were indistinguishable.
        // One read, passed explicitly; do not add a second window.location parse.
        const [addIntent] = useState(() => {
            if (typeof window === "undefined") return null;
            return new URLSearchParams(window.location.search).get("add");
        });
        // `?add=menu` opens the chooser and NOTHING else — it is how a screen that is
        // not this one (My Listings) sends a creator here to pick what to sell. The
        // other values each open a specific form on top of the chooser, which is the
        // wrong landing for "add something".
        const [showAdd, setShowAdd] = useState(
            () =>
                addIntent === "menu" ||
                addIntent === "wish" ||
                addIntent === "shop" ||
                addIntent === "digital" ||
                addIntent === "physical",
        );
        const [wishOptions, setWishOptions] = useState(
            () => addIntent === "wish",
        );

        // `?add=post` opens the composer DIRECTLY, deliberately not via `showAdd`. The
        // AddPost inside the chooser would need the chooser open behind it, which is the
        // stacked-modal problem `?add=digital` already had — the creator closes the composer
        // and lands on a menu they never asked for.
        const [postOpen, setPostOpen] = useState(() => addIntent === "post");

        useEffect(() => {
            if (!showAdd) return;
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            // Same full-screen contract as Sheet: while this chooser covers the
            // phone, the fixed bottom nav must not float over its CANCEL button.
            document.body.classList.add("sheet-open");
            return () => {
                document.body.style.overflow = prev;
                document.body.classList.remove("sheet-open");
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

            if (addIntent === "task") {
                window.location.href = route("task.create");
            } else if (addIntent) {
                // Safe to strip now: every consumer took its value from `addIntent` during
                // render, so nothing downstream still needs the query string.
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                );
            }

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

        return (
            <>
                {/* Journey step "Publish your first post" lands here. Rendered outside the
                    chooser so closing it returns the creator to the dashboard, not to a menu. */}
                {postOpen && (
                    <Suspense fallback={null}>
                        <AddPost
                            open={postOpen}
                            onClose={() => setPostOpen(false)}
                        />
                    </Suspense>
                )}
                {IsloggedIn ? (
                    <>
                        {/* Desktop only. On a phone the same action is the "+" in the
                            fixed bottom nav, which is reachable from every screen —
                            two buttons opening one chooser, one of them buried in a
                            horizontally-scrolling tab strip, is the worse of the two. */}
                        <div
                            onClick={() => setShowAdd(true)}
                            className="addoption-action hidden md:block cursor-pointer p-2 py-[8px] bg-[#FF007F] border-4 border-black !rounded-box-sm transition-[filter] duration-200 hover:brightness-110 active:brightness-95 z-50"
                            // dangerouslySetInnerHTML={{ __html: addicon.replace('fill="#fff"', 'fill="#000"') }}
                        >
                            <b className="text-2xl md:text-3xl px-3 text-black !leading-[8px] top-[4px] relative">
                                +
                            </b>
                        </div>
                        {showAdd
                            ? createPortal(
                                  <div
                                      onClick={() => setShowAdd(false)}
                                      data-lenis-prevent
                                      className="bg-[#00000088] backdrop-blur-sm fixed z-[9990] flex items-stretch justify-center top-0 left-0 w-full h-full overflow-y-auto overscroll-contain"
                                  >
                                      {/* ⚠️ Full page on every size, like the post
                                          composer. It was a 660px card whose option
                                          list scrolled inside `max-h-[50vh]`, so a
                                          creator was shown three of six ways to earn
                                          and had to discover the rest by scrolling a
                                          box inside a box. This is the menu the whole
                                          product hangs off — all of it should be
                                          visible at once. */}
                                      <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full"
                                      >
                                          <Suspense fallback={"Loading.."}>
                                              {/* Full-screen on mobile (min-h-dvh,
                                                  no rounding, no gap); a centred
                                                  card on desktop. */}
                                              {/* ⚠️ Installed as a PWA there is no browser
                                                  chrome, so a full-bleed panel runs UNDER the
                                                  status bar and the clock sits on top of the
                                                  heading. The surface still bleeds to the
                                                  screen edge — only the CONTENT is inset. */}
                                              <div
                                                  className="relative flex min-h-dvh w-full flex-col bg-[#FFF6EC] px-4 py-6 sm:px-6 md:px-8 md:py-10"
                                                  style={{
                                                      paddingTop:
                                                          "max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem))",
                                                  }}
                                              >
                                                  <button
                                                      type="button"
                                                      onClick={() =>
                                                          setShowAdd(false)
                                                      }
                                                      aria-label="Close"
                                                      className="absolute right-3 w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-[#FF007F] hover:text-black font-black text-2xl leading-none pb-1 transition-colors z-20"
                                                      // Absolute positioning resolves against the
                                                      // padding EDGE, so the parent's inset does
                                                      // not move this — it needs its own.
                                                      style={{
                                                          top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.25rem))",
                                                      }}
                                                  >
                                                      ×
                                                  </button>
                                                  <div className="text-center mb-5 max-w-[480px] mx-auto">
                                                      <div className="inline-block bg-gradient-to-r from-[#FF007F] to-[#FF8E25] border-[3px] border-black rounded-box-sm px-6 py-3 mb-3 -rotate-1">
                                                          <h2 className="text-white font-anton tracking-wide uppercase text-2xl md:text-2xl !leading-none m-0">
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
                                                  <div className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-y-auto pt-2 pb-24 md:overflow-visible md:pb-0">
                                                      {wishOptions ? (
                                                          <div>
                                                              {/* ⚠️ Content-first: this was "Cash Gift". "Gift" is
                                                                  banned vocabulary on every user-facing surface, and
                                                                  "Cash Gift" describes a money transfer — the exact
                                                                  framing a wish is reframed AWAY from. Matches the
                                                                  chooser row that opens this. */}
                                                              <Wishlist
                                                                  text="Sell exclusive content"
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
                                                              <div className="w-full font-bold disabled addop bg-white border-4 border-black rounded-box p-3 mb-4 text-center">
                                                                  <div className="flex items-center">
                                                                      <div className="p-1 rounded-box border-2 border-black bg-pink-100 flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                                                                          <CiShoppingCart
                                                                              color="#000"
                                                                              size="1.5rem"
                                                                          />
                                                                      </div>
                                                                      <div className="pl-3 text-left">
                                                                          {/* ⚠️ Content-first: this card said "Add
                                                                              Surprise Gift" / "1000's of Gifts in the
                                                                              Oink Gift Zone". "Gift" is banned
                                                                              vocabulary on every user-facing surface,
                                                                              the surface is branded "Oink Store" and
                                                                              never "Gift Store", and a gift-box icon
                                                                              carries the same meaning as the word. */}
                                                                          <h2 className="font-gulfs font-light text-md font-black uppercase text-black">
                                                                              Add
                                                                              Oink
                                                                              Store
                                                                              item
                                                                          </h2>
                                                                          <p className="text-sm font-bold text-gray-700">
                                                                              Lets
                                                                              supporters
                                                                              pick
                                                                              from
                                                                              1000’s
                                                                              of
                                                                              items
                                                                              in
                                                                              the
                                                                              Oink
                                                                              Store
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
                                                                      className="bg-gray-200 text-back rounded-box px-3 py-2"
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
                                                                  {/* Two columns from `md`: six earning routes in one
                                                                      column made the page a list to scroll rather than a
                                                                      menu to read. */}
                                                                  <div className="grid w-full grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
                                                                      <div
                                                                          onClick={() =>
                                                                              setWishOptions(
                                                                                  true,
                                                                              )
                                                                          }
                                                                          className="w-full font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black transition-colors rounded-box p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                      >
                                                                          <div className="flex items-center">
                                                                              <div className="p-1 rounded-box-sm border-2 border-black bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ml-2">
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
                                                                              className="w-full block font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black transition-colors rounded-box p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                              href="/task/create"
                                                                          >
                                                                              <div className="flex items-center">
                                                                                  <div className="p-1 rounded-box-sm border-2 border-black bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ml-2">
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
                                                                              className="w-full font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black transition-colors rounded-box p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                          >
                                                                              <div className="flex items-center">
                                                                                  <div className="p-1 rounded-box-sm border-2 border-black bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ml-2">
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
                                                                          classes="w-full font-bold addop bg-white hover:bg-[#FFF0DF] border-[3px] border-black transition-colors rounded-box p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center cursor-pointer relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]"
                                                                          product_type="digital_products"
                                                                          addIntent={
                                                                              addIntent
                                                                          }
                                                                      />
                                                                      {/* The one row here that is not a way to list something for
                                                                          sale. Every other option adds a product; this one is what
                                                                          keeps a creator's recurring subscription income collecting
                                                                          (`PostingCadenceService` pauses their Bill + Membership
                                                                          subscriptions when they stop posting for members). Drawn
                                                                          identically to its neighbours, that was invisible — so it
                                                                          carries the mint accent the platform already uses for
                                                                          "this is live / this is working", and keeps that accent on
                                                                          hover instead of falling back to the shared cream. */}
                                                                      <AddPost
                                                                          highlight
                                                                          classes="font-bold p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center bg-[#D9F9EE] hover:bg-[#C2F3E1] border-[3px] border-black transition-colors rounded-box relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#00B98C] after:transition-colors hover:after:text-[#05EFB8]"
                                                                      />
                                                                      {/* <AddGift
                                                                            text="Add Gift"
                                                                            classes="font-bold py-3 px-3 mb-2 text-center"
                                                                            fetch_gifts={
                                                                            fetch_gifts
                                                                                                                                                }
                                                                            addressAdded={
                                                                            auth?.user
                                                                            ?.is_creator_address_found
                                                                    }
                                                                /> */}
                                                                      <AddMembership classes=" font-bold p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center bg-white hover:bg-[#FFF0DF] border-[3px] border-black transition-colors rounded-box !w-full relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]" />
                                                                      <AddBills classes="font-bold p-3 md:p-4 pr-10 md:pr-12 mb-4 text-center bg-white hover:bg-[#FFF0DF] border-[3px] border-black transition-colors rounded-box relative group after:content-['→'] after:absolute after:right-4 md:after:right-6 after:top-1/2 after:-translate-y-1/2 after:text-2xl md:after:text-3xl after:font-black after:text-[#FFB3D6] after:transition-colors hover:after:text-[#FF007F]" />
                                                                  </div>
                                                              </div>
                                                          </>
                                                      )}
                                                  </div>
                                                  {!wishOptions && (
                                                      <div
                                                          className="sticky bottom-0 bg-[#FFF6EC] pt-4 flex justify-center"
                                                          style={{
                                                              paddingBottom:
                                                                  "max(0.5rem, env(safe-area-inset-bottom))",
                                                          }}
                                                      >
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
                                                                rounded-box-sm

                                                                font-black
                                                                uppercase
                                                                tracking-wider
                                                                text-black
                                                                transition-colors
                                                                hover:bg-black/[0.04]
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

    // About Me card — rendered in the left sidebar AND (desktop-only) at the top of the About tab.
    // Small amber"waiting for approval" notice — one quiet style for every pending state.
    const pendingNotice = (text) => (
        <div className="mt-3 flex items-start gap-2 rounded-box-sm border border-amber-300 bg-amber-50 px-3 py-2.5">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[12px] font-black text-white">
                i
            </span>
            <p className="text-[12px] font-semibold leading-snug text-amber-800">
                {text}
            </p>
        </div>
    );

    // About me — bio + categories. Lives INSIDE the identity rail card (21 Aug 2026,
    // client direction): it answers "who is this creator", which is what that column is
    // for, and in the centre column it pushed the actual content down the page.
    // Passed into <Userprofile> as a prop rather than duplicated there, so the pending
    // notices and approval gates stay defined in one place.
    //
    // 🚨 THE BIO IS DRAWN AS A SPEECH BUBBLE, TAIL POINTING UP AT THE AVATAR. The bio is
    // written in the creator's own voice ("Hey, I make…"), and the avatar sits directly
    // above this block at every breakpoint — on the cover on desktop, in the card on
    // phones. The tail ties the words to the face, which an "ABOUT ME" eyebrow over a
    // paragraph never did. That eyebrow is gone: a bubble under a face needs no label,
    // and the one label kept ("Makes") carries information the pills alone did not.
    const creatorTags = (() => {
        try {
            const raw = user?.creator_category;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (e) {
            return [];
        }
    })();

    // An empty bio is a prompt for the owner and a plain fact for a visitor — never the
    // old placeholder sentence, which put words in the creator's mouth on their own page.
    const bioText = (user && user.bio) || (IsloggedIn ? "Say what you make in a line or two. It shows up right here, above everything you sell." : `${user?.name || "This creator"} has not written an intro yet.`);

    const aboutMeCard = user && user.role == 1 ? (
            <div className="w-full text-left">
                <div className="relative">
                    {/* Tail: black outline triangle with the fill drawn 1px inside it,
                        so the bubble reads as one continuous hairline. */}
                    <span
                        aria-hidden="true"
                        className="absolute -top-[9px] left-7 h-0 w-0 border-x-[9px] border-b-[9px] border-x-transparent border-b-black"
                    />
                    <span
                        aria-hidden="true"
                        className="absolute -top-[7px] left-[29px] h-0 w-0 border-x-[8px] border-b-[8px] border-x-transparent"
                        style={{ borderBottomColor: "#E8F8ED" }}
                    />

                    <p className="rounded-box-sm border border-[#000] bg-[#E8F8ED] px-3.5 py-3 text-[14px] font-semibold leading-relaxed text-black">
                        {bioText}
                    </p>
                </div>

                {IsloggedIn &&
                    user?.bio_approved == 0 &&
                    pendingNotice(
                        "Your bio is waiting for admin approval. Currently only you can see this.",
                    )}

                {creatorTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-black/45">
                            Makes
                        </span>
                        <CategoryTags value={user?.creator_category} />
                    </div>
                )}

                {IsloggedIn &&
                    slinks?.status === 0 &&
                    pendingNotice(
                        "Your social media links are waiting for admin approval. Currently only you can see them.",
                    )}
            </div>
    ) : null;

    // Earnings against the creator's live goal — the headline figure. About me moved out
    // of this band into the rail, so it is now the earnings card alone and renders only
    // when there is an account behind the number.
    const profileSummaryBand =
        user && user.role == 1 && UserStripeConnected == 1 ? (
            <div className="rounded-box border border-black/10 bg-white p-4 sm:p-5 md:border-2 md:border-black">
                <EarningsMilestone IsloggedIn={IsloggedIn} />
            </div>
        ) : null;

    // Owner-only payment setup. Kept out of the public band above.
    const creatorPayoutAction =
        IsloggedIn && user && user.role == 1 ? (
            <>
                {(auth?.user?.role == 1 && AuthUserStripeConnected == 1 && (
                    <PaymentDashboard
                        classes="w-full rounded-box-sm border-2 border-black bg-black !px-4 py-3 text-sm font-black uppercase tracking-wider text-white transition-colors hover:bg-gray-900"
                        text="Creator Payment Dashboard"
                    />
                )) ||
                    ""}
            </>
        ) : null;

    return (
        <>
            <Guest
                auth={auth.user}
                user={user}
                className="bg-fixed bg-[#A2E4B8]"
            >
                <Head
                    title={`${user?.name || auth?.user?.name} - Spenny Piggy`}
                />
                {/* overflow-x-clip (not hidden): clip keeps position:sticky working for the side rails */}
                <div className="wishlistPage overflow-x-clip min-h-dvh !pt-0 sm:!pt-6 pb-0 sm:pb-5">
                    <div className="container">
                        <div className="relative z-10 flex flex-col">
                            <div className="wishbanner relative mb-0 -mx-5 sm:mx-0 sm:mb-4">
                                <div className="relative w-full overflow-hidden rounded-none border-0 sm:rounded-box sm:border-2 sm:border-black">
                                    <img
                                        alt={`${user?.name} - Cover Image`}
                                        height={400}
                                        width={1200}
                                        className="w-full cover object-cover !min-h-0 !h-[170px] sm:!h-[220px] md:!h-[260px] lg:!h-[300px]"
                                        src={
                                            IsloggedIn
                                                ? user?.cover_url ||
                                                  wishlistbannerimg
                                                : user?.cover_url &&
                                                    Number(
                                                        user?.cover_approved,
                                                    ) === 1
                                                  ? user.cover_url
                                                  : wishlistbannerimg
                                        }
                                        loading="eager"
                                        fetchpriority="high"
                                    />
                                    {/* Scrim: carries the founder badge, the cover notice, and — on
                                        desktop — the creator's name and avatar over any cover image. */}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

                                    {/* Desktop identity overlay. Hidden on phones, where the same
                                        component sits at the top of the identity card instead. */}
                                    <div className="absolute inset-x-0 bottom-0 z-10 hidden md:block bg-gradient-to-t from-black/90 via-black/55 to-transparent">
                                        <div className="px-5 pb-4 pt-20 lg:px-6 lg:pb-5 lg:pt-24 xl:px-8 xl:pb-6">
                                            <Suspense fallback={null}>
                                                <CoverIdentity
                                                    variant="cover"
                                                    IsloggedIn={IsloggedIn}
                                                />
                                            </Suspense>
                                        </div>
                                    </div>
                                    {IsloggedIn &&
                                    auth?.user?.cover_url &&
                                    auth?.user?.cover_approved == 0 ? (
                                        <div className="absolute left-3 top-3 z-20 max-w-[calc(100%-1.5rem)] rounded-box-sm border-2 border-black bg-white px-3 py-2 text-xs font-semibold text-black md:max-w-[70%] md:text-sm">
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
                                                    approval. Currently only you
                                                    can see this.{" "}
                                                </p>
                                            </button>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>

                            {/* Profile layout: identity rail (left) · cover + content (center) · overview rail (right, xl) */}
                            <div className="profileLayout grid grid-cols-1 items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
                                {/* Sticky sidebar: capped to viewport + own scroll, so the lower cards stay reachable */}
                                <aside className="flex min-w-0 flex-col gap-4 -mt-[68px] pt-[68px] sm:-mt-[76px] sm:pt-[76px] lg:mt-0 lg:pt-0 lg:sticky lg:top-[100px]">
                                    <Userprofile
                                        blockedByI={blockedByMe}
                                        IsloggedIn={IsloggedIn}
                                        payoutAction={creatorPayoutAction}
                                        aboutBlock={aboutMeCard}
                                    />
                                    {/* Their own introduction. Moved out of the About tab and
                                        into this rail (31 July 2026): it is part of who the
                                        creator IS, which is what this column answers, and in the
                                        centre column it pushed the actual content down the page.
                                        Renders for the owner always, and for visitors only once
                                        approved — same rule it carried before the move.

                                        ⚠️ Gate on the `intro` PAGE PROP, never `user.intro`. The
                                        relation is eager-loaded in one rare Stripe-resync branch
                                        only, so `user.intro` is undefined on virtually every load
                                        and an approved intro was invisible to every visitor. It is
                                        also the same prop AddIntro itself reads, so the gate and
                                        the card can no longer disagree about whether one exists. */}
                                    {/* ⚠️ role 1 (creator) is part of the gate, not decoration.
                                        Intro videos are a creator surface, and a gifter must not
                                        even be OFFERED the upload — the empty AddIntro card IS
                                        the "add" affordance for the owner (21 Aug 2026). Gating
                                        here also keeps the lazy chunk off a gifter's page. */}
                                    {isCreatorProfile &&
                                        (IsloggedIn ||
                                            introProp?.approved == 1) && (
                                            <Suspense
                                                fallback={
                                                    <div className="h-40 animate-pulse rounded-box border-[3px] border-black bg-gray-100"></div>
                                                }
                                            >
                                                <AddIntro
                                                    uuid={user?.id || null}
                                                    IsloggedIn={IsloggedIn}
                                                    user={user}
                                                />
                                            </Suspense>
                                        )}

                                    <div className="hidden md:block">
                                        <ProfileRightRail
                                            IsloggedIn={IsloggedIn}
                                            compact
                                            sections={["highlights", "quick"]}
                                        />
                                    </div>
                                </aside>

                                <div className="min-w-0">
                                    {/* Stripe Account Migration Warning */}

                                    {/* {user && user?.role == 1 && AuthUserStripeConnected == 1 && IsloggedIn && showAlert ?
                                        <div className="flex p-3 mb-4 text-sm text-blue-700 relative bg-blue-100 border border-blue-300 rounded-box">
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
                                        <div className="wishManage sticky top-8 w-full">
                                            {/* Creator Subscription Widget - Show on all tabs for creators */}
                                            {/* {IsloggedIn && auth?.user && auth?.user?.role == 1 && (
                                        <Suspense fallback={<div className="mb-4">Loading subscription status...</div>}>
                                            <CreatorSubscriptionWidget 
                                            className="mb-4"
                                            />
                                        </Suspense>
                                    )} */}

                                            {/* 🚨 THE FIRST THING A CREATOR SEES ON THEIR OWN
                                                DASHBOARD, ON EVERY TAB.

                                                It used to render inside the About tab, so the one
                                                card that answers "what do I do next" was only
                                                visible if the creator happened to be on that tab —
                                                a creator who landed on Wishes or Shop saw no next
                                                step at all. It now sits in the owner column
                                                OUTSIDE the tab system, for the same reason the
                                                Discovery and Opportunity panels do.

                                                ⚠️ Gated on IsloggedIn (the viewer IS the profile
                                                owner) ONLY — never on UserStripeConnected, which is
                                                where it once sat. Three of the six journey steps
                                                come BEFORE Stripe, so that gate hid the card from
                                                every creator still on profile, identity or payouts
                                                — the ones needing it most. The component self-gates
                                                on auth.journey and disappears once the journey is
                                                done, so a finished creator sees nothing here. */}
                                            {IsloggedIn && (
                                                <div className="mb-3">
                                                    <CreatorJourneyCard />
                                                </div>
                                            )}

                                            {IsloggedIn && (
                                                <PendingChangesNotice
                                                    assets={
                                                        pending_profile_changes
                                                    }
                                                    className="mb-3"
                                                />
                                            )}

                                            {IsloggedIn && (
                                                <CreatorRiskBanner />
                                            )}

                                            {/* Discovery Phase 2 — what Spenny Piggy brought this
                                                creator this month, above every other owner-only
                                                card on their dashboard. The brief asks for it to be
                                                prominent, and it sits outside the tab system on
                                                purpose so it reads on every tab, not only About.

                                                🚨 NEVER CONDITIONALLY UNMOUNTED ON THE NUMBERS. The
                                                plan is explicit that the panel "stays visible at 0
                                                … It is the pitch" — a creator with no Discovery
                                                data yet sees three zeros and the explanatory line,
                                                which is exactly what tells them the feature exists.
                                                The only gate is `discovery_panel != null`, which
                                                the controller sets for the OWNER of a role-1
                                                profile and nobody else: a visitor must not read
                                                this creator's numbers, and a supporter's dashboard
                                                has none to read.

                                                ⚠️ tone="light" because this page is white; the same
                                                component renders dark on the marketing surfaces.
                                                live because these are real Phase 1 figures — it is
                                                NOT read off `discovery.analytics_live`, which
                                                governs the mock numbers in marketing and stays
                                                false until the client flips it. */}
                                            {discoveryPanel && (
                                                <DiscoveryStatsPanel
                                                    className="mt-3"
                                                    stats={discoveryPanel}
                                                    live={true}
                                                    tone="light"
                                                    title={
                                                        DISCOVERY_DASHBOARD_TITLE
                                                    }
                                                    lines={
                                                        DISCOVERY_DASHBOARD_LINES
                                                    }
                                                />
                                            )}

                                            {/* Enhanced Creator Earnings + Revenue Opportunity Centre.
                                                Client brief: Developer Master Plan, 19 Aug 2026, §C row 9 —
                                                "sits alongside the SP Discovery panel so the dashboard tells
                                                one story: what SP brought you, what it's worth, what to do
                                                next". Hence directly beneath the panel above, in the same
                                                owner-only column, outside the tab system so it reads on
                                                every tab.

                                                🚨 THIS REPLACED A PLAIN "Grow your income" LINK, and that is
                                                the whole point of the row. The link was a door to the
                                                numbers; the brief asks for the numbers themselves to be on
                                                the dashboard. The module carries its own link through to the
                                                full Opportunity Centre at the foot, so the old route in is
                                                not lost — it is just no longer the only thing here.

                                                🚨 NEVER CONDITIONALLY UNMOUNTED ON THE FIGURES, for the same
                                                reason as the Discovery panel: a creator with no sales sees
                                                zeros and the empty-state lines, which is what tells them the
                                                capability exists. The only gate is `opportunity_panel != null`,
                                                which the controller sets for the OWNER of a role-1 profile and
                                                nobody else — this payload names their supporters and what each
                                                has spent, and this page is also the PUBLIC profile.

                                                ⚠️ Each of the brief's nine rows draws whether or not it is
                                                ready; `config/earnings_intelligence.php` decides which ones
                                                grey to "Coming soon". A row is never simply absent. */}
                                            {opportunityPanel && (
                                                <OpportunityPanel
                                                    className="mt-3"
                                                    panel={opportunityPanel}
                                                />
                                            )}

                                            {/* ⚠️ THE LINK-IN-BIO CARD LIVED HERE UNTIL 30 Aug 2026.
                                                It moved to Account Settings (Creator Studio) and the
                                                Edit Profile popup: this route is also the PUBLIC
                                                profile, and a creator's own admin controls belong
                                                where the rest of them are. Both new homes are on the
                                                creator's own path, so the feature is no less findable
                                                than it was. See `Components/bio/BioLinkCard.jsx`. */}

                                            {/* 🚨 THE ONLY WAY TO SEND ONE. The push
                                                service, its table, its rate limit, its
                                                moderation rules and both routes all
                                                shipped — and `resources/js` referenced
                                                none of them, so no creator could reach
                                                the feature and `creator_push_messages`
                                                sat at 0 rows. Same fault the bio page
                                                had before the card above it.

                                                Beside "Your link in bio" on purpose:
                                                one is how new supporters find you, the
                                                other is how the ones you already have
                                                come back. The card self-gates — it
                                                fetches its own allowance and renders
                                                nothing for a non-creator. */}
                                            {IsloggedIn && (
                                                <CreatorPushCard className="mt-3" />
                                            )}

                                            {/* Owner-only. The six module tabs below show one type
                                                at a time; this is the only route to the whole catalogue,
                                                which is where a rejected or expired listing surfaces. */}
                                            {IsloggedIn && (
                                                <Link
                                                    href={route(
                                                        "catalogue.index",
                                                    )}
                                                    className="group mt-3 flex items-center gap-4 rounded-box border border-[#000] bg-white px-4 py-4 transition-colors duration-150 hover:bg-black/[0.04]"
                                                >
                                                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-box-sm border border-[#000] bg-[#05EFB8] text-2xl">
                                                        🗂️
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[18px] md:text-[22px] font-black uppercase tracking-tigher text-black">
                                                            My listings
                                                        </div>
                                                        <div className="text-[13px] md:text-[15px] font-semibold text-gray-600 mt-0.5">
                                                            Everything you sell
                                                            in one place — and
                                                            anything that is
                                                            stuck.
                                                        </div>
                                                    </div>
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#000] bg-[#FF007F] text-black text-lg font-black">
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
                                                        <div className="inlinetab">
                                                            <InstantTabSystem
                                                                Toggle={Toggle}
                                                                activeTab={
                                                                    page ||
                                                                    "about"
                                                                }
                                                                user={user}
                                                                username={
                                                                    user.username
                                                                }
                                                                IsloggedIn={
                                                                    IsloggedIn
                                                                }
                                                                onTabChange={(
                                                                    tabId,
                                                                ) => {
                                                                    // Handle tab change if needed
                                                                }}
                                                            />

                                                            <div className="tabs-containers min-height">
                                                                <>
                                                                    {page ===
                                                                        "about" ||
                                                                    page ===
                                                                        false ? (
                                                                        <Suspense
                                                                            fallback={
                                                                                <LoadingScreen />
                                                                            }
                                                                        >
                                                                            {/* About tab: single-column flow — intro, status, highlights, posts */}
                                                                            <div className="flex flex-col gap-4 about-sec self-start w-full">
                                                                                {/* The creator's OWN founder progress — real numbers, so it
                                                                                    stays as an action card above the promo deck. The deck's
                                                                                    founder card is excluded while this renders (see the
                                                                                    `exclude` prop below); one surface per message. */}
                                                                                {showFounderTracker && (
                                                                                    <Suspense
                                                                                        fallback={
                                                                                            null
                                                                                        }
                                                                                    >
                                                                                        <FounderProgressTracker
                                                                                            founderData={
                                                                                                props.founderData
                                                                                            }
                                                                                            variant="mini"
                                                                                        />
                                                                                    </Suspense>
                                                                                )}

                                                                                {/* The creator's OWN Growth Bonus figures, so it wins over the
                                                                                    deck's generic card exactly as the founder tracker does —
                                                                                    `growth_bonus` is excluded below while this renders. The
                                                                                    payload is null for a visitor, for a creator not in the
                                                                                    programme and while the scheme is dark, so there is no
                                                                                    second gate to keep in step here. */}
                                                                                {growthBonusPanel && (
                                                                                    <Suspense
                                                                                        fallback={
                                                                                            null
                                                                                        }
                                                                                    >
                                                                                        <GrowthBonusTracker
                                                                                            data={
                                                                                                growthBonusPanel
                                                                                            }
                                                                                        />
                                                                                    </Suspense>
                                                                                )}

                                                                                {/* 🚨 THE ONE PROMO SURFACE. Five always-on banners used to
                                                                                    stack here — OfferAnnouncement, ReferralBanner and
                                                                                    FeatureSuggestionBanner among them — which is what made
                                                                                    this page read as a noticeboard rather than a profile.
                                                                                    (The right rail's membership block stays: that is the
                                                                                    creator's own offer to their fans, not marketing at the
                                                                                    creator.) A new promo is a
                                                                                    `config/promos.php` entry, NEVER a second banner beside
                                                                                    this one. */}
                                                                                <Suspense
                                                                                    fallback={
                                                                                        null
                                                                                    }
                                                                                >
                                                                                    <PromoSlider
                                                                                        exclude={[
                                                                                            ...(showFounderTracker
                                                                                                ? [
                                                                                                      "founder_bonus",
                                                                                                  ]
                                                                                                : []),
                                                                                            ...(growthBonusPanel
                                                                                                ? [
                                                                                                      "growth_bonus",
                                                                                                  ]
                                                                                                : []),
                                                                                        ]}
                                                                                        onSuggestFeature={() =>
                                                                                            setShowSuggestionModal(
                                                                                                true,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </Suspense>

                                                                                {/* A returning buyer is greeted as one, before anything is sold to them */}
                                                                                <div className="empty:hidden">
                                                                                    <ReturningSupporter />
                                                                                </div>

                                                                                {/* ⚠️ Above About me, deliberately, and there is only ONE of
                                                                                    these. A creator whose subscription income had been paused
                                                                                    for not posting could not learn that from their own
                                                                                    profile — the only surface saying so sat ~1,000 lines
                                                                                    further down the page behind a Stripe gate. A second
                                                                                    strip was briefly added at the top instead, which left
                                                                                    the page telling the creator the same thing twice in two
                                                                                    different tones. This card is the one that carries BOTH
                                                                                    payment rules, so it is the one that moved.

                                                                                    ⚠️ Gated on Stripe connected AND identity verified
                                                                                    (3 Aug 2026, client direction). It briefly ran for every
                                                                                    creator on the reasoning that the component states its
                                                                                    own "finish verifying" case — but its headline is "YOUR
                                                                                    PAYMENTS ARE PAUSED", and a creator who has not finished
                                                                                    Connect has no payments to pause. That reads as a fault
                                                                                    on their account at the exact moment they are being asked
                                                                                    to trust the platform with their bank details. The
                                                                                    journey card is what speaks to a creator before this
                                                                                    point; this card starts once there is money to stop. */}
                                                                                {canSeeActivityCard &&
                                                                                    activityStatus && (
                                                                                        <Suspense
                                                                                            fallback={
                                                                                                null
                                                                                            }
                                                                                        >
                                                                                            <CreatorActivityWidget
                                                                                                activityStatus={
                                                                                                    activityStatus
                                                                                                }
                                                                                                className="!mt-0"
                                                                                            />
                                                                                        </Suspense>
                                                                                    )}

                                                                                {/* About + earnings first: the two things a visitor looks for */}
                                                                                <div>
                                                                                    {
                                                                                        profileSummaryBand
                                                                                    }
                                                                                </div>

                                                                                {/* The creator's pinned goal, right under who they are */}
                                                                                {props.piggyPots &&
                                                                                    props
                                                                                        .piggyPots
                                                                                        .length >
                                                                                        0 && (
                                                                                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
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

                                                                                {/* Proof: who else buys here, and whether this creator delivers.
                                                                                    ⚠️ `empty:hidden` because SupporterWall renders NOTHING for a
                                                                                    creator with no supporters — but this wrapper is still a flex
                                                                                    item, so it ate a 16px gap on each side and produced the one
                                                                                    32px seam in an otherwise uniform 16px card stack. Same fix
                                                                                    already used on the ReturningSupporter wrapper above. */}
                                                                                <div className="empty:hidden">
                                                                                    <SupporterWall />
                                                                                </div>

                                                                                {/* Phone: the rail cards live here so About Me follows the avatar */}
                                                                                <div className="md:hidden">
                                                                                    <ProfileRightRail
                                                                                        IsloggedIn={
                                                                                            IsloggedIn
                                                                                        }
                                                                                        compact
                                                                                        sections={[
                                                                                            "highlights",
                                                                                            "quick",
                                                                                        ]}
                                                                                    />
                                                                                </div>
                                                                                {/* The activity card moved to the top of this tab, above
                                                                                    About me — it is the creator's payment status and was
                                                                                    unreadable buried here. Rendering it in both places
                                                                                    left the page saying the same thing twice. */}
                                                                                {IsloggedIn &&
                                                                                auth
                                                                                    ?.user
                                                                                    ?.role ==
                                                                                    1 &&
                                                                                auth
                                                                                    ?.user
                                                                                    ?.identity_status !==
                                                                                    1 ? (
                                                                                    <CreatorVerification
                                                                                        IsloggedIn={
                                                                                            IsloggedIn
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    ""
                                                                                )}

                                                                                {IsloggedIn && (
                                                                                    <div className="w-full h-auto">
                                                                                        <div>
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
                                                                                            !hasStripeActionPanel &&
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
                                                                                                <div className="bg-white border-1 border-black rounded-box mb-4 p-4">
                                                                                                    <h2 className="text-red-600 font-bold text-xl">
                                                                                                        Action
                                                                                                        Required
                                                                                                        {
                                                                                                            ""
                                                                                                        }
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
                                                                                                                    Reason:
                                                                                                                    {
                                                                                                                        ""
                                                                                                                    }
                                                                                                                    {
                                                                                                                        user.profile_reject_reason
                                                                                                                    }
                                                                                                                </p>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    {user?.edit_bio_reason &&
                                                                                                    user?.bio_approved ==
                                                                                                        2 ? (
                                                                                                        <div className="mt-3">
                                                                                                            <p className="text-red-700 font-bold">
                                                                                                                {
                                                                                                                    ""
                                                                                                                }
                                                                                                                Bio
                                                                                                                Edit
                                                                                                                Request
                                                                                                                {
                                                                                                                    ""
                                                                                                                }
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

                                                                                            {!IsloggedIn &&
                                                                                            auth
                                                                                                ?.user
                                                                                                ?.username &&
                                                                                            auth
                                                                                                ?.user
                                                                                                ?.username !==
                                                                                                user?.username ? (
                                                                                                <div className="mb-6 !mt-6 relative group">
                                                                                                    {/* <div className="absolute -inset-1 bg-gradient-to-r from-[#8C52FF] via-[#FF007F] to-[#05EFB8] rounded-box blur opacity-20 group-hover:opacity-40 transition duration-700"></div> */}
                                                                                                    <div className="relative overflow-hidden p-5 md:p-6 rounded-box bg-[#fdfbf7] border-[3px] border-black min-h-[120px] md:min-h-[140px]">
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
                                                                                                                        className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border-[3px] border-black"
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
                                                                                                                        className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border-[3px] border-black"
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div className="flex-1 order-2 text-center md:text-left mt-6">
                                                                                                                <p className="text-[12px] font-black tracking-[0.25em] uppercase text-gray-700 mb-1">
                                                                                                                    Support
                                                                                                                    Story
                                                                                                                </p>
                                                                                                                <p className="text-black font-black uppercase text-xl md:text-xl leading-snug">
                                                                                                                    Relive
                                                                                                                    your
                                                                                                                    moments
                                                                                                                    with
                                                                                                                    {
                                                                                                                        ""
                                                                                                                    }
                                                                                                                    {user?.name ||
                                                                                                                        "@" +
                                                                                                                            user?.username}
                                                                                                                </p>
                                                                                                                <p className="text-gray-700 font-bold text-sm md:text-sm mt-1">
                                                                                                                    Purchases,
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
                                                                                                                    className="w-full md:w-auto block text-center px-6 py-3 font-black rounded-box-sm text-sm uppercase tracking-widest bg-yellow-300 border-[3px] border-black text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
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
                                                                                )}
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

                                                                                <div className="w-full">
                                                                                    {IsloggedIn &&
                                                                                    UserStripeConnected ==
                                                                                        1 ? (
                                                                                        <>
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
                                                                                        </>
                                                                                    ) : (
                                                                                        ""
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
                                                                                            <div className="pb-4">
                                                                                                <TipInner classes="" />
                                                                                            </div>
                                                                                        </Suspense>
                                                                                    ) : (
                                                                                        ""
                                                                                    )}
                                                                                    {/* Membership promo — About tab slice; highlights + quick actions live in the left sidebar */}
                                                                                    <div>
                                                                                        <ProfileRightRail
                                                                                            IsloggedIn={
                                                                                                IsloggedIn
                                                                                            }
                                                                                            sections={[
                                                                                                "membership",
                                                                                            ]}
                                                                                        />
                                                                                    </div>
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
                                                                                        <div className="wishes-items pb-6">
                                                                                            {wish_categories &&
                                                                                            wish_categories.length ? (
                                                                                                <>
                                                                                                    <div className="new-wish-cats flex items-center mb-3 md:mb-6 gap-2 flex-wrap p-2">
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
                                                                                                                    ? "bg-[#FF007F] text-black border-[3px] border-black translate-x-[-1px] translate-y-[-1px]"
                                                                                                                    : "bg-[#1c1c24] text-white border-[3px] border-black hover:bg-gray-800"
                                                                                                            } px-4 py-1 rounded-box-sm font-black uppercase tracking-widest text-sm transition-all`}
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
                                                                                                                                ? "bg-[#FF007F] text-black border-[3px] border-black translate-x-[-1px] translate-y-[-1px]"
                                                                                                                                : "bg-[#1c1c24] text-white border-[3px] border-black hover:bg-gray-800"
                                                                                                                        } px-4 py-1 rounded-box-sm font-black uppercase tracking-widest text-sm transition-all`}
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
                                                                                                        {/* TWO columns on a phone (client direction, 15 Aug
                                                                                                            2026), reversing the one-column pass of 14 Aug.
                                                                                                            ⚠️ That pass was right about the SYMPTOM — at ~171px
                                                                                                            the old card's title, price, reward line, delivery
                                                                                                            note and CTA each wrapped to two or three lines. The
                                                                                                            fix is the CARD, not the column count:
                                                                                                            `Wishlistbox` now has a compact tier at base and its
                                                                                                            full tier from `sm`, and it drops the two blocks that
                                                                                                            earn no space at this width (a duplicate "You get"
                                                                                                            and a boilerplate line identical on every card).
                                                                                                            Widening this back without that tier reinstates the
                                                                                                            broken text. */}
                                                                                                        <div className="grid grid-cols-2 lg:grid-cols-3 !gap-2.5 sm:!gap-3 md:!gap-4">
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
                                                                                                                                classes=""
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
                                                                                                                    // Exponential ease-out. The old curve overshot to 1.22, the one
                                                                                                                    // bounce in an interface that settles everywhere else.
                                                                                                                    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
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
                                                                                                                            classes=""
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
                                                                                                            <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
                                                                                                                {/* ⚠️ Content-first: a 🎁 emoji and "let your
                                                                                                                    fans buy them for you" framed this as a
                                                                                                                    gift, which is the framing a wish is
                                                                                                                    reframed AWAY from. A wish is a one-off
                                                                                                                    CONTENT sale. */}
                                                                                                                <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                                                    No
                                                                                                                    wishes
                                                                                                                    yet
                                                                                                                </h3>
                                                                                                                <p className="text-gray-600 font-bold mb-6">
                                                                                                                    List
                                                                                                                    exclusive
                                                                                                                    content
                                                                                                                    your
                                                                                                                    supporters
                                                                                                                    can
                                                                                                                    unlock.
                                                                                                                </p>
                                                                                                                <button
                                                                                                                    onClick={() =>
                                                                                                                        window.dispatchEvent(
                                                                                                                            new Event(
                                                                                                                                "toggleAddOptions",
                                                                                                                            ),
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                                                                                                                >
                                                                                                                    Add
                                                                                                                    Wish
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <Nocontent
                                                                                                            {...emptyTabProps}
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
                                                                                                <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
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
                                                                                                        className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
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
                                                                                                <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
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
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            window.dispatchEvent(
                                                                                                                new Event(
                                                                                                                    "toggleAddOptions",
                                                                                                                ),
                                                                                                            )
                                                                                                        }
                                                                                                        className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                                                                                                    >
                                                                                                        Create
                                                                                                        Membership
                                                                                                    </button>
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
                                                                                                <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
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
                                                                                                        className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
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
                                                                                                <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
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
                                                                                                        className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
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
                                                                                                <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
                                                                                                    {/* ⚠️ Content-first: this read "🎁 / No Active
                                                                                                        Gifts / Create physical gifts for your fans to
                                                                                                        buy for you". "Gift" is banned vocabulary on
                                                                                                        every user-facing surface, and an emoji is not
                                                                                                        an icon system. */}
                                                                                                    <h3 className="font-gulfs text-2xl uppercase mb-2">
                                                                                                        No
                                                                                                        items
                                                                                                        listed
                                                                                                        yet
                                                                                                    </h3>
                                                                                                    <p className="text-gray-600 font-bold mb-6">
                                                                                                        List
                                                                                                        a
                                                                                                        physical
                                                                                                        item
                                                                                                        your
                                                                                                        supporters
                                                                                                        can
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
                                                                                                        className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                                                                                                    >
                                                                                                        List
                                                                                                        an
                                                                                                        item
                                                                                                    </button>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <Nocontent
                                                                                                    {...emptyTabProps}
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
                                                                            heading={`WishList not activated yet.`}
                                                                            subheading={`Until this creator finishes setting up payments, they can't sell content here yet.`}
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
                        </div>

                        {/* Discovery Phase 3 — "More creators to support".

                            Inside `.container` and BELOW the profile body, so it is the last
                            thing a supporter reads on any tab rather than a competing block
                            partway down someone else's page.

                            ⚠️ Renders on the OWNER's view too — this one page is both the
                            public profile and the creator's own dashboard, and the row points
                            away from it at four other creators. See the controller note.

                            ⚠️ Returns null on an empty list, so there is no heading with
                            nothing under it and no gap on a fan profile. */}
                        <MoreCreators creators={moreCreators} />
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

                {showSuggestionModal && (
                    <Suspense fallback={null}>
                        <FeatureSuggestionModal
                            show={showSuggestionModal}
                            onClose={() => setShowSuggestionModal(false)}
                            auth={auth}
                        />
                    </Suspense>
                )}

                <Suspense fallback={null}>
                    <SubscriptionNewsPopup isOwnProfile={IsloggedIn} />
                </Suspense>

                <OldSubscribe />
            </Guest>
        </>
    );
}
