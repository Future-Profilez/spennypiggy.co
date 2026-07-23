<<<<<<< Updated upstream
import { lazy, useState, useRef, Suspense, useEffect } from "react";
=======
import { lazy, useState, useRef, useEffect, Suspense } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
>>>>>>> Stashed changes
import userphoto from "../../assets/siteicon.png";
import { usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { UserXIcon, InfoIcon, CopyIcon } from "@animateicons/react/lucide";
import {
    ShieldAlert,
    Ban,
    BadgeCheckIcon,
    CheckCircleIcon,
} from "lucide-react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
const ShareProfile = lazy(() => import("./ShareProfile"));
const SendTip = lazy(() => import("@/Pages/TipJar/SendTip"));
const FollowButton = lazy(() => import("@/Pages/Profile/FollowButton"));
const FounderBadge = lazy(() => import("@/Components/FounderBadge"));
const Popup = lazy(() => import("@/Components/Popup"));
<<<<<<< Updated upstream
const FeatureSuggestionBanner = lazy(
    () => import("@/Components/FeatureSuggestionBanner"),
);
const FeatureSuggestionModal = lazy(
    () => import("@/Components/FeatureSuggestionModal"),
);
const ReportContentModal = lazy(
    () => import("@/Components/ReportContentModal"),
);
=======
const FeatureSuggestionBanner = lazy(() => import("@/Components/FeatureSuggestionBanner"));
const FeatureSuggestionModal = lazy(() => import("@/Components/FeatureSuggestionModal"));
const ReportContentModal = lazy(() => import("@/Components/ReportContentModal"));

const fmt = (n) => {
    const v = Number(n || 0);
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0) + "M";
    if (v >= 1_000) return (v / 1_000).toFixed(v % 1_000 ? 1 : 0) + "K";
    return String(v);
};

// Subtle count-up on mount — DOM-write, never per-frame React state.
function CountUp({ value }) {
    const ref = useRef(null);
    const mv = useMotionValue(0);
    const reduce = useReducedMotion();
    const target = Number(value || 0);

    useEffect(() => {
        if (reduce || target === 0) {
            if (ref.current) ref.current.textContent = fmt(target);
            return;
        }
        const controls = animate(mv, target, {
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => {
                if (ref.current) ref.current.textContent = fmt(Math.round(v));
            },
        });
        return () => controls.stop();
    }, [target, reduce]);

    return <span ref={ref}>{reduce ? fmt(target) : "0"}</span>;
}

export default function Userprofile({ IsloggedIn }) {
>>>>>>> Stashed changes

export default function Userprofile({ blockedByI, IsloggedIn }) {
    const copyIconRef = useRef(null);
    const unblockIconRef = useRef(null);
    const blockIconRef = useRef(null);
    const {
        auth,
        user,
        global_currency,
        supporters,
        follow_status,
        first30DayEarnings,
        card_capabilities,
        is_blocked: initialIsBlocked,
        blockedByMe,
    } = usePage().props;
    const { successAlert, errorAlert } = useAlerts();
    const opponantUser = auth?.opposite_user;
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [blockState, setBlockState] = useState(initialIsBlocked);
    const [isBlocking, setIsBlocking] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [blockReason, setBlockReason] = useState("Spam or unwanted messages");
    const [isBlocked, setIsBlocked] = useState(blockedByMe || false);


    useEffect(() => {
        setIsBlocked(blockedByMe || false);
        setBlockState(initialIsBlocked);
    }, [blockedByMe, initialIsBlocked]);

    const interactionBlocked = blockState?.blocked ?? false;

    const blockUser = async () => {
        setIsBlocking(true);

        try {
<<<<<<< Updated upstream
            const response = await axios.post(
                route("creator.security.block-user"),
                {
                    user_id: user.id,
                    reason: blockReason,
                },
            );

            if (response.data.status) {
                successAlert(response.data.message);

                setIsBlocked(true);
                setShowBlockConfirm(false);
                setBlockReason("Spam or unwanted messages");
                setBlockState({
                    blocked: true,
                    blocked_by_viewer: true,
                    blocked_by_creator: false,
                });

                router.reload({
                    preserveScroll: true,
                });
            }
=======
            await axios.post(route('creator.security.block-user'), { user_id: user.id });
            successAlert(`${user?.name} has been blocked.`);
            setIsBlocked(true);
            setShowBlockConfirm(false);
>>>>>>> Stashed changes
        } catch (error) {
            errorAlert(
                error?.response?.data?.message || "Failed to block user.",
            );
        } finally {
            setIsBlocking(false);
        }
    };

    const unblockUser = async () => {
        try {
            await axios.delete(
                route("creator.security.unblock-user", { id: user.id }),
            );
            successAlert(`${user?.name} has been unblocked.`);
            setBlockState({
                blocked: false,
                blocked_by_viewer: false,
                blocked_by_creator: false,
            });
            setIsBlocked(false);

            // Reload to reflect changes
            router.reload({
                preserveScroll: true,
            });
        } catch (error) {
            errorAlert(
                error.response?.data?.message || "Failed to unblock user",
            );
        }
    };

<<<<<<< Updated upstream
    return (
        <div className="userprofilesec mb-6 relative">
            <div className="userPr max-w-[1200px] mx-auto pt-4 pb-6 md:pb-8 lg:flex lg:items-center justify-center lg:justify-between relative">
                <div className="update-profile text-center lg:flex lg:items-center justify-center lg:justify-start">
                    <div className="fading userphoto relative flex items-center justify-center mb-4 lg:mb-0 -mt-[64px] md:-mt-[72px]">
                        <img
                            alt={`${user?.name || "User"} - Profile Avatar`}
                            src={
                                IsloggedIn
                                    ? user?.avatar_url || userphoto
                                    : user?.avatar_url &&
                                        user?.avatar_approved === 1
                                      ? user?.avatar_url
                                      : userphoto
                            }
                            height={150}
                            width={150}
                            loading="eager"
                            className="rounded-[30px]  !border-[3px] !border-black bg-white !h-[120px] !w-[120px] min-w-[120px] !min-h-[120px] md:!h-[140px] md:!w-[140px] md:min-w-[140px] md:!min-h-[140px] object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />

                        {IsloggedIn &&
                            auth &&
                            auth?.user?.avatar &&
                            auth?.user?.avatar_approved === 0 && (
                                <div className="absolute approvetag top-3 mx-auto">
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
                                            Profile avatar is waiting for
                                            approval. Currently only you can see
                                            this.
                                        </p>
                                    </button>
                                </div>
                            )}
=======
    const isCreator = user && user?.role == 1;
    const showVerified = user?.role == 1 && user?.profile_status_lock == 2;

    let categories = [];
    try {
        categories = Array.isArray(user?.creator_category)
            ? user.creator_category
            : JSON.parse(user?.creator_category || "[]");
    } catch (e) {
        categories = [];
    }
    categories = (categories || []).filter(Boolean).slice(0, 3);
    const chipTones = ["text-cyan-300", "text-lime-300", "text-fuchsia-300"];

    const showBio = (IsloggedIn || user?.bio_approved == 1) && user?.bio;

    const statItems = [
        { key: "followers", value: user?.followers_count, label: "Followers" },
        { key: "following", value: user?.following_count, label: "Following" },
        { key: "supporters", value: supporters, label: "Supporters" },
    ];

    return (
        <div className="userprofilesec mb-6 relative">
            {/* Electric bento panel — dark glass, neon accents */}
            <div className="userPr relative z-[1] bg-[#0c1124] ring-1 ring-white/10 rounded-[26px] shadow-[0_26px_70px_-30px_rgba(34,211,238,0.35)] mt-5 px-6 md:px-8 pt-5 pb-6 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 overflow-hidden">
                {/* ambient neon glow */}
                <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle,#22d3ee,transparent 70%)" }} aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-24 -left-12 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#a3e635,transparent 70%)" }} aria-hidden="true" />

                {/* Identity */}
                <div className="update-profile relative flex-1 min-w-0 flex flex-col lg:flex-row items-center lg:items-end gap-5 text-center lg:text-left">
                    <div className="fading userphoto relative shrink-0 -mt-[86px] md:-mt-[104px] lg:-mt-[110px]">
                        <div className={`rounded-[24px] p-[3px] ${user?.is_founder ? "bg-gradient-to-tr from-cyan-400 to-lime-400" : "bg-white/15"} shadow-[0_16px_38px_-14px_rgba(34,211,238,0.6)]`}>
                            <img
                                alt={`${user?.name || "User"} - Profile Avatar`}
                                src={IsloggedIn ? user?.avatar_url || userphoto : user?.avatar_url && user?.avatar_approved === 1 ? user?.avatar_url : userphoto}
                                height={150}
                                width={150}
                                loading="eager"
                                className="rounded-[21px] ring-4 ring-[#0c1124] bg-[#0c1124] !h-[114px] !w-[114px] min-w-[114px] !min-h-[114px] md:!h-[134px] md:!w-[134px] md:min-w-[134px] md:!min-h-[134px] object-cover"
                            />
                        </div>

                        {IsloggedIn && auth && auth?.user?.avatar && auth?.user?.avatar_approved === 0 && (
                            <div className="absolute approvetag top-2 right-1">
                                <button className="tooltipbtn">
                                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="10" cy="10" r="10" fill="#0c1124" />
                                        <path d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z" fill="#22d3ee" />
                                    </svg>
                                    <p>Profile avatar is waiting for approval. Currently only you can see this.</p>
                                </button>
                            </div>
                        )}
>>>>>>> Stashed changes

                        {IsloggedIn && auth && auth?.user?.avatar_approved === 2 && !auth?.user?.avatar_url && (
                            <div className="absolute top-2 right-1">
                                <button className="tooltipbtn">
                                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#f43f5e" />
                                    </svg>
                                    <p>Profile avatar is missing. Please upload an image to continue.</p>
                                </button>
                            </div>
                        )}
                    </div>

<<<<<<< Updated upstream
                    <div className="lg:ps-6 pt-2 lg:pt-0 lg:pb-1 text-center lg:text-left">
                        <h1 className="font-gulfs uppercase text-2xl md:text-3xl flex items-center justify-center lg:justify-start gap-2 !text-black leading-none">
                            <span className="line-clamp-1">{user?.name}</span>
                            {(user?.role == 1 &&
                                user?.profile_status_lock == 2 && (
                                    <span className="flex items-center">
                                        {user?.is_founder ? (
                                            <Suspense
                                                fallback={
                                                    <span className="min-w-8 min-h-8 w-8 h-8 ml-2"></span>
                                                }
                                            >
                                                <FounderBadge
                                                    classes="min-w-8 min-h-8 w-8 h-8"
                                                    icon={true}
                                                />
                                            </Suspense>
                                        ) : (
                                            <BadgeCheckIcon className=" min-w-8 min-h-8 w-8 h-8 text-[#1d3ef8]" />
                                        )}
                                    </span>
                                )) ||
                                ""}
                        </h1>

                        <div className="userId mt-2 flex items-center justify-center lg:justify-start text-center lg:text-left">
                            <Suspense
                                fallback={
                                    <span className="flex text-gray-800 font-black text-base items-center">
                                        @{user?.username}
                                    </span>
                                }
                            >
                                <ShareProfile
                                    username={user?.name}
                                    classes="flex text-gray-800 font-black text-base transition-all items-center group"
                                    onMouseEnter={() =>
                                        copyIconRef.current?.startAnimation?.()
                                    }
                                    onMouseLeave={() =>
                                        copyIconRef.current?.stopAnimation?.()
                                    }
                                    custom={`${window.location.origin}/${user?.username}`}
                                >
                                    @{user?.username}
                                    <CopyIcon
                                        ref={copyIconRef}
                                        size={16}
                                        className="ml-2 font-black text-black"
                                    />
=======
                    <div className="min-w-0 lg:pb-1">
                        <h1 className="font-gulfs !text-[24px] md:!text-[32px] flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-center lg:text-left !text-white leading-[1.08]">
                            <span className="break-words min-w-0">{user?.name}</span>
                            {showVerified && (
                                <span className="shrink-0 inline-flex">
                                    {user?.is_founder ? (
                                        <Suspense fallback={<span className="min-w-6 min-h-6 w-6 h-6 ml-1"></span>}>
                                            <FounderBadge classes="min-w-6 min-h-6 w-6 h-6 ml-1" icon={true} />
                                        </Suspense>
                                    ) : (
                                        <BadgeCheckIcon className="min-w-6 min-h-6 w-6 h-6 text-cyan-400" />
                                    )}
                                </span>
                            )}
                        </h1>

                        <div className="userId mt-2 flex items-center justify-center lg:justify-start">
                            <Suspense fallback={<span className="text-cyan-300 font-semibold text-[14px]">@{user?.username}</span>}>
                                <ShareProfile
                                    username={user?.name}
                                    classes="inline-flex items-center text-cyan-300 hover:text-cyan-200 font-semibold text-[14px] transition-colors group"
                                    onMouseEnter={() => copyIconRef.current?.startAnimation?.()}
                                    onMouseLeave={() => copyIconRef.current?.stopAnimation?.()}
                                    custom={`${window.location.origin}/${user?.username}`} >
                                    @{user?.username}
                                    <CopyIcon ref={copyIconRef} size={13} className="ml-1.5 text-cyan-400/70 group-hover:text-cyan-300" />
>>>>>>> Stashed changes
                                </ShareProfile>
                            </Suspense>
                        </div>

                        {showBio && (
                            <p className="mt-2.5 max-w-[46ch] mx-auto lg:mx-0 text-[14px] leading-relaxed text-slate-300 line-clamp-2">
                                {user.bio}
                            </p>
                        )}

                        {isCreator && categories.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                {categories.map((cat, i) => (
                                    <span
                                        key={cat + i}
                                        className={`bg-white/10 ${chipTones[i % chipTones.length]} ring-1 ring-white/15 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap`}
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

<<<<<<< Updated upstream
                <div className="flex lg:block justify-center mt-6 lg:mt-0">
                    <div>
                        {user && user?.role == 1 ? (
                            <div className="flex mb-4 justify-center lg:justify-end gap-2 md:gap-3">
                                <div className="sm:flex items-center justify-center text-center min-w-[84px] bg-yellow-300 border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black text-lg md:text-xl leading-none whitespace-nowrap">
                                        👥 {user?.followers_count}
                                    </span>
                                    <p className="sm:ps-1 font-black text-black text-[10px] md:text-xs uppercase mt-1 tracking-wide">
                                        Followers
                                    </p>
                                </div>
                                <div className="sm:flex items-center justify-center text-center min-w-[84px] bg-blue-100 border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black text-lg md:text-xl leading-none whitespace-nowrap">
                                        🤝 {user?.following_count}
                                    </span>
                                    <p className="sm:ps-1 font-black text-black text-[10px] md:text-xs uppercase mt-1 tracking-wide">
                                        Following
                                    </p>
                                </div>
                                <div className="sm:flex items-center justify-center text-center min-w-[84px] bg-[#b892ff] border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black text-lg md:text-xl leading-none whitespace-nowrap">
                                        🐷 {supporters}
                                    </span>
                                    <p className="sm:ps-1 font-black text-black text-[10px] md:text-xs uppercase mt-1 tracking-wide">
                                        Supporters
                                    </p>
                                </div>
                            </div>
                        ) : (
                            ""
                        )}
                        <div className="mt-4 flex items-center justify-center lg:justify-end gap-2">
                            {IsloggedIn ? (
                                <>
                                    <Suspense
                                        fallback={
                                            <button className="bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase text-black font-black text-xs md:text-sm px-6 py-3 rounded-[18px]">
                                                EDIT PROFILE
                                            </button>
                                        }
                                    >
                                        <EditProfile
                                            profilepage={1}
                                            user={user}
                                            classes={
                                                "bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase text-black font-black text-xs md:text-sm px-6 py-3 rounded-[18px] "
                                            }
                                            global_currency={global_currency}
                                        />
                                    </Suspense>
                                </>
                            ) : (
                                <>
                                    {!IsloggedIn ? (
                                        <div className="flex gap-1">
                                            <Suspense fallback={null}>
                                                <ReportContentModal reportedUser={user} />
                                            </Suspense>
                                            <Suspense fallback={null}>
                                                <FollowButton targetUserId={opponantUser?.id } isInitiallyFollowing={follow_status} />
                                            </Suspense>

                                            {auth?.user && (
                                                <>
                                                    {blockState?.blocked_by_me ? (
                                                        <button
                                                            onClick={unblockUser}
                                                            onMouseEnter={() => unblockIconRef.current?.startAnimation?.() }
                                                            onMouseLeave={() => unblockIconRef.current?.stopAnimation?.()}
                                                            className="bg-green-600 border-[3px] me-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 rounded-[18px] text-white group"
                                                            title="Unblock User"
                                                        >
                                                            <UserXIcon
                                                                ref={
                                                                    unblockIconRef
                                                                }
                                                                size={20}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                                className="rotate-180"
                                                            />
                                                        </button>
                                                    ) : (
                                                        // Show Block Button (Red)
                                                        <Suspense
                                                            fallback={null}
                                                        >
                                                            <Popup
                                                                modalclass="pinkmodal"
                                                                size="md"
                                                                space="6"
                                                                onMouseEnter={() =>
                                                                    blockIconRef.current?.startAnimation?.()
                                                                }
                                                                onMouseLeave={() =>
                                                                    blockIconRef.current?.stopAnimation?.()
                                                                }
                                                                classes="bg-red-600 border-[3px] me-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 rounded-[18px] text-white group"
                                                                text={
                                                                    <UserXIcon
                                                                        ref={
                                                                            blockIconRef
                                                                        }
                                                                        size={
                                                                            20
                                                                        }
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    />
                                                                }
                                                                action={
                                                                    showBlockConfirm
                                                                }
                                                                onHide={() =>
                                                                    setShowBlockConfirm(
                                                                        false,
                                                                    )
                                                                }
                                                            >
                                                                <div className="text-center">
                                                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                                                                        <Ban
                                                                            size={
                                                                                40
                                                                            }
                                                                            className="text-red-600"
                                                                        />
                                                                    </div>
                                                                    <h2 className="text-2xl font-gulfs mb-4 uppercase">
                                                                        Block{" "}
                                                                        {
                                                                            user?.name
                                                                        }
                                                                        ?
                                                                    </h2>
                                                                    <div className="bg-gray-50 border-2 border-black rounded-[20px] p-4 text-left space-y-3 mb-6">
                                                                        <div className="flex gap-3">
                                                                            <ShieldAlert
                                                                                size={
                                                                                    20
                                                                                }
                                                                                className="text-red-600 shrink-0"
                                                                            />
                                                                            <p className="text-sm font-bold">
                                                                                They
                                                                                will
                                                                                no
                                                                                longer
                                                                                be
                                                                                able
                                                                                to
                                                                                view
                                                                                your
                                                                                profile
                                                                                or
                                                                                content.
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-3">
                                                                            <Ban
                                                                                size={
                                                                                    20
                                                                                }
                                                                                className="text-red-600 shrink-0"
                                                                            />
                                                                            <p className="text-sm font-bold">
                                                                                They
                                                                                will
                                                                                be
                                                                                blocked
                                                                                from
                                                                                sending
                                                                                you
                                                                                any
                                                                                gifts,
                                                                                tips,
                                                                                or
                                                                                messages.
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-3">
                                                                            <InfoIcon
                                                                                size={
                                                                                    20
                                                                                }
                                                                                className="text-blue-600 shrink-0"
                                                                            />
                                                                            <p className="text-sm font-bold text-gray-500">
                                                                                They
                                                                                won't
                                                                                be
                                                                                notified
                                                                                that
                                                                                you
                                                                                blocked
                                                                                them.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mb-6">
                                                                        <label className="block text-left font-black text-sm uppercase mb-3">
                                                                            Why
                                                                            are
                                                                            you
                                                                            blocking
                                                                            this
                                                                            user?
                                                                        </label>

                                                                        <p className="text-xs text-gray-500 mb-3 ml-0 text-left">
                                                                            Select
                                                                            the
                                                                            reason
                                                                            that
                                                                            best
                                                                            describes
                                                                            why
                                                                            you're
                                                                            blocking
                                                                            this
                                                                            account.
                                                                        </p>

                                                                        <div className="relative">
                                                                            <select
                                                                                value={
                                                                                    blockReason
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setBlockReason(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className="
                                                                                w-full
                                                                                appearance-none
                                                                                rounded-[20px]
                                                                                border-[3px]
                                                                                border-black
                                                                                bg-white
                                                                                px-5
                                                                                py-4
                                                                                pr-14
                                                                                text-sm
                                                                                font-black
                                                                                text-black
                                                                                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                                                                transition-all
                                                                                focus:outline-none
                                                                                focus:border-[#FF007F]
                                                                                focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                                                focus:translate-x-[2px]
                                                                                focus:translate-y-[2px]
                                                                            "
                                                                            >
                                                                                <option value="Spam or unwanted messages">
                                                                                    🚫
                                                                                    Spam
                                                                                    or
                                                                                    unwanted
                                                                                    messages
                                                                                </option>
                                                                                <option value="Harassment or bullying">
                                                                                    😡
                                                                                    Harassment
                                                                                    or
                                                                                    bullying
                                                                                </option>
                                                                                <option value="Inappropriate content">
                                                                                    ⚠️
                                                                                    Inappropriate
                                                                                    content
                                                                                </option>
                                                                                <option value="Scam or fraudulent activity">
                                                                                    💰
                                                                                    Scam
                                                                                    or
                                                                                    fraudulent
                                                                                    activity
                                                                                </option>
                                                                                <option value="Fake account">
                                                                                    👤
                                                                                    Fake
                                                                                    account
                                                                                </option>
                                                                                <option value="Personal reasons">
                                                                                    🤐
                                                                                    Personal
                                                                                    reasons
                                                                                </option>
                                                                            </select>

                                                                            <svg
                                                                                className="
                                                                                absolute
                                                                                right-5
                                                                                top-1/2
                                                                                -translate-y-1/2
                                                                                pointer-events-none
                                                                                text-black
                                                                            "
                                                                                width="20"
                                                                                height="20"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="3"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M19 9l-7 7-7-7"
                                                                                />
                                                                            </svg>
                                                                        </div>

                                                                        <p className="text-xs text-gray-500 mt-2 text-left">
                                                                            This
                                                                            reason
                                                                            may
                                                                            be
                                                                            reviewed
                                                                            by
                                                                            administrators.
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex justify-center">
                                                                        <button
                                                                            onClick={
                                                                                blockUser
                                                                            }
                                                                            disabled={
                                                                                isBlocking
                                                                            }
                                                                            className={`
                                                                                flex-1
                                                                                py-3
                                                                                rounded-xl
                                                                                font-black
                                                                                uppercase
                                                                                tracking-wider
                                                                                border-2
                                                                                border-black
                                                                                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                                                                active:translate-y-0.5
                                                                                active:shadow-none
                                                                                transition-all
                                                                                flex
                                                                                items-center
                                                                                justify-center
                                                                                gap-2
                                                                                ${
                                                                                    isBlocking
                                                                                        ? "bg-red-400 text-white cursor-not-allowed"
                                                                                        : "bg-red-600 text-white hover:bg-red-700"
                                                                                }
                                                                            `}
                                                                        >
                                                                            {isBlocking ? (
                                                                                <>
                                                                                    <svg
                                                                                        className="animate-spin h-5 w-5"
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        fill="none"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <circle
                                                                                            className="opacity-25"
                                                                                            cx="12"
                                                                                            cy="12"
                                                                                            r="10"
                                                                                            stroke="currentColor"
                                                                                            strokeWidth="4"
                                                                                        />
                                                                                        <path
                                                                                            className="opacity-75"
                                                                                            fill="currentColor"
                                                                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                                                        />
                                                                                    </svg>
                                                                                    Blocking...
                                                                                </>
                                                                            ) : (
                                                                                "Block User"
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </Popup>
                                                        </Suspense>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                    {!IsloggedIn && user && 
                                        user.stripe_details_submitted == 1 &&
                                        user.role == 1 &&
                                        !interactionBlocked && (
                                            <Suspense fallback={null}>
                                                <SendTip
                                                    card_capabilities={
                                                        card_capabilities
                                                    }
                                                />
                                            </Suspense>
                                        )}
                                </>
                            )}
=======
                {/* Support rail */}
                <div className="relative w-full lg:w-auto lg:self-stretch flex flex-col justify-center items-center lg:items-end gap-4 shrink-0 pt-5 lg:pt-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-white/10">
                    {isCreator && (
                        <div className="flex items-center divide-x divide-white/10">
                            {statItems.map((s) => (
                                <div key={s.key} className="px-4 md:px-5 first:pl-0 last:pr-0 text-center">
                                    <div className="text-[20px] md:text-[23px] font-extrabold text-white leading-none tabular-nums">
                                        <CountUp value={s.value} />
                                    </div>
                                    <div className="text-[10.5px] md:text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-[0.08em]">{s.label}</div>
                                </div>
                            ))}
>>>>>>> Stashed changes
                        </div>
                    )}

                    <div className="flex items-center justify-center lg:justify-end gap-2.5">
                        {IsloggedIn ? (
                            <Suspense fallback={<button className="text-[#0c1124] text-sm font-bold px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-lime-400">Edit Profile</button>}>
                                <EditProfile
                                    profilepage={1}
                                    user={user}
                                    classes={"bg-gradient-to-r from-cyan-400 to-lime-400 text-[#0c1124] text-sm font-bold px-6 py-2.5 rounded-full shadow-[0_12px_30px_-12px_rgba(34,211,238,0.8)] hover:-translate-y-0.5 transition-all duration-200 normal-case"}
                                    global_currency={global_currency}
                                />
                            </Suspense>
                        ) : (
                            <>
                                <Suspense fallback={null}>
                                    <ReportContentModal reportedUser={user} />
                                </Suspense>
                                <Suspense fallback={null}>
                                    <FollowButton
                                        targetUserId={opponantUser?.id}
                                        isInitiallyFollowing={follow_status} />
                                </Suspense>

                                {auth?.user && (
                                    isBlocked ? (
                                        <button
                                            onClick={unblockUser}
                                            onMouseEnter={() => unblockIconRef.current?.startAnimation?.()}
                                            onMouseLeave={() => unblockIconRef.current?.stopAnimation?.()}
                                            className="bg-white/10 ring-1 ring-white/15 text-emerald-300 p-2.5 rounded-full hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-200"
                                            title="Unblock User"
                                        >
                                            <UserXIcon ref={unblockIconRef} size={18} strokeWidth={2.2} className="rotate-180" />
                                        </button>
                                    ) : (
                                        <Suspense fallback={null}>
                                            <Popup
                                                modalclass="pinkmodal"
                                                size="md"
                                                space="6"
                                                onMouseEnter={() => blockIconRef.current?.startAnimation?.()}
                                                onMouseLeave={() => blockIconRef.current?.stopAnimation?.()}
                                                classes="bg-white/10 ring-1 ring-white/15 text-slate-300 p-2.5 rounded-full hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-200"
                                                text={<UserXIcon ref={blockIconRef} size={18} strokeWidth={2.2} />}
                                                action={showBlockConfirm}
                                                onHide={() => setShowBlockConfirm(false)}
                                            >
                                                <div className="text-center">
                                                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Ban size={40} className="text-rose-600" />
                                                    </div>
                                                    <h2 className="text-2xl font-gulfs mb-4">Block {user?.name}?</h2>
                                                    <div className="bg-gray-50 ring-1 ring-gray-200 rounded-2xl p-4 text-left space-y-3 mb-6">
                                                        <div className="flex gap-3">
                                                            <ShieldAlert size={20} className="text-rose-600 shrink-0" />
                                                            <p className="text-sm font-medium text-gray-700">They will no longer be able to view your profile or content.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Ban size={20} className="text-rose-600 shrink-0" />
                                                            <p className="text-sm font-medium text-gray-700">They will be blocked from sending you any gifts, tips, or messages.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <InfoIcon size={20} className="text-blue-600 shrink-0" />
                                                            <p className="text-sm font-medium text-gray-500">They won't be notified that you blocked them.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={blockUser}
                                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-full font-semibold shadow-lg transition-all"
                                                        >
                                                            Block User
                                                        </button>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Suspense>
                                    )
                                )}

                                {user && user.stripe_details_submitted == 1 && user.role == 1 && (
                                    <Suspense fallback={null}>
                                        <SendTip
                                            card_capabilities={card_capabilities}
                                            classes="!border-0 !rounded-full !px-6 !py-2.5 !bg-gradient-to-r !from-cyan-400 !to-lime-400 !text-[#0c1124] !shadow-[0_14px_30px_-12px_rgba(34,211,238,0.85)] hover:!-translate-x-0 hover:!-translate-y-0.5 !mr-0 normal-case font-bold"
                                        />
                                    </Suspense>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

<<<<<<< Updated upstream

            {IsloggedIn  && (
=======
            {IsloggedIn && (
>>>>>>> Stashed changes
                <div className="mt-8">
                    <Suspense fallback={null}>
                        <FeatureSuggestionBanner
                            onSuggestClick={() => setShowSuggestionModal(true)}
                        />
                    </Suspense>
                </div>
            )}

            {showSuggestionModal && (
                <Suspense fallback={null}>
                    <FeatureSuggestionModal
                        show={showSuggestionModal}
                        onClose={() => setShowSuggestionModal(false)}
                        auth={auth}
                    />
                </Suspense>
            )}
        </div>
    );
}
