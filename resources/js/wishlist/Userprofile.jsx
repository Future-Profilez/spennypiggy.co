import { lazy, useState, useRef, Suspense, useEffect } from "react";
import userphoto from "../../assets/siteicon.png";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.png";
import { usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { UserXIcon, InfoIcon, CopyIcon } from "@animateicons/react/lucide";
import {
    FaInstagram,
    FaXTwitter,
    FaYoutube,
    FaTwitch,
    FaDiscord,
    FaRedditAlien,
    FaFacebookF,
    FaTumblr,
} from "react-icons/fa6";
import {
    ShieldAlert,
    Ban,
    BadgeCheckIcon,
    CheckCircleIcon,
    Landmark,
    Lock,
    Users,
    UserCheck,
    PiggyBank,
} from "lucide-react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
const ShareProfile = lazy(() => import("./ShareProfile"));
const SendTip = lazy(() => import("@/Pages/TipJar/SendTip"));
const FollowButton = lazy(() => import("@/Pages/Profile/FollowButton"));
const FounderBadge = lazy(() => import("@/Components/FounderBadge"));
const Popup = lazy(() => import("@/Components/Popup"));
const ReportContentModal = lazy(
    () => import("@/Components/ReportContentModal"),
);

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
        slinks,
        profile_overview,
    } = usePage().props;
    const { successAlert, errorAlert } = useAlerts();
    const opponantUser = auth?.opposite_user;
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [blockState, setBlockState] = useState(initialIsBlocked);
    const [isBlocking, setIsBlocking] = useState(false);
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

    // Trust strip: which payment marks this creator's checkout carries.
    // Purely informational — rendered only for creators who can actually take payment.
    const paymentStrip =
        user?.role == 1 && user?.stripe_details_submitted == 1 ? (
            <div className="flex w-full flex-col items-center gap-1.5 pt-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                    <Lock size={11} strokeWidth={2.5} />
                    Secure checkout
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="flex h-7 items-center justify-center rounded-md border border-black/10 bg-white px-2">
                        <span className="text-[11px] font-black italic tracking-tight text-[#1A1F71]">
                            VISA
                        </span>
                    </span>
                    <span className="flex h-7 items-center justify-center rounded-md border border-black/10 bg-white px-2">
                        <svg width="22" height="14" viewBox="0 0 22 14" aria-label="Mastercard">
                            <circle cx="8" cy="7" r="6.5" fill="#EB001B" />
                            <circle cx="14" cy="7" r="6.5" fill="#F79E1B" fillOpacity="0.92" />
                        </svg>
                    </span>
                    <span className="flex h-7 items-center justify-center rounded-md border border-black/10 bg-[#2E77BC] px-2">
                        <span className="text-[9px] font-black tracking-wide text-white">
                            AMEX
                        </span>
                    </span>
                    <span className="flex h-7 items-center justify-center gap-1 rounded-md border border-black/10 bg-white px-2 text-gray-700">
                        <Landmark size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                            Bank
                        </span>
                    </span>
                </div>
            </div>
        ) : null;

    // Compact social row — colored brand squares, only links the creator actually set.
    const SOCIALS = [
        { key: "instagram", Icon: FaInstagram, base: "https://instagram.com/", classes: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
        { key: "twitter", Icon: FaXTwitter, base: "https://twitter.com/", classes: "bg-black" },
        { key: "youtube", Icon: FaYoutube, base: "", classes: "bg-[#FF0000]" },
        { key: "twitch", Icon: FaTwitch, base: "", classes: "bg-[#9146FF]" },
        { key: "discord", Icon: FaDiscord, base: "", classes: "bg-[#5865F2]" },
        { key: "reddit", Icon: FaRedditAlien, base: "", classes: "bg-[#FF4500]" },
        { key: "facebook", Icon: FaFacebookF, base: "", classes: "bg-[#1877F2]" },
        { key: "tumblr", Icon: FaTumblr, base: "https://www.tumblr.com/", classes: "bg-[#36465D]" },
    ];
    const socialItems = SOCIALS.map(({ key, Icon, base, classes }) => {
        const value = slinks?.[key];
        if (!value) return null;
        const isHttp = String(value).trim().toLowerCase().startsWith("http");
        if (!isHttp && !base) return null;
        return (
            <a
                key={key}
                href={isHttp ? value : `${base}${value}`}
                target="_blank"
                rel="noopener noreferrer"
                title={key}
                className={`${classes} flex h-8 w-8 items-center justify-center rounded-[10px] text-white border border-black/10 transition-transform hover:-translate-y-0.5`}
            >
                <Icon size={15} />
            </a>
        );
    }).filter(Boolean);

    const showBio = user?.bio && (IsloggedIn || user?.bio_approved == 1);

    return (
        <div className="userprofilesec mb-0 lg:mb-6 relative">
            <div className="userPr relative -mx-5 lg:mx-0">
                {/* Vertical identity card — the profile's left rail */}
                {/* Mobile: full-bleed borderless section flowing from the cover; desktop: bordered card */}
                <div className="relative z-10 overflow-hidden rounded-none lg:rounded-box bg-white bg-[radial-gradient(circle,rgba(0,0,0,0.045)_1px,transparent_1px)] [background-size:16px_16px] p-5 sm:p-6 border-0 shadow-none lg:border-2 lg:border-black">
                    {/* Corner wash — ties the card to the pink cover without shouting */}
                    <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#FF007F]/10 blur-2xl" />

                    {/* Mobile: the cover lives inside this card (full-bleed strip); desktop keeps the big banner in the center column */}
                    <div className="relative -mx-5 -mt-5 mb-0 sm:-mx-6 sm:-mt-6 lg:hidden">
                        <img
                            alt={`${user?.name} - Cover`}
                            src={
                                IsloggedIn
                                    ? user?.cover_url || wishlistbannerimg
                                    : user?.cover_url && Number(user?.cover_approved) === 1
                                      ? user.cover_url
                                      : wishlistbannerimg
                            }
                            className="!h-44 sm:!h-52 w-full object-cover !min-h-0 bg-gradient-to-r from-[#FF007F] to-[#C084FC]"
                            loading="eager"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/25" />
                    </div>

                    <div className="flex flex-col items-center gap-4 text-center">
                    {/* Avatar + name */}
                    <div className="-mt-12 flex flex-col items-center gap-3 lg:mt-0">
                        <div className="fading userphoto relative group shrink-0 !mb-0 !block">
                            {user?.is_founder ? (
                                <div className="absolute -top-1 -right-6 z-20 rotate-6">
                                    <Suspense fallback={null}>
                                        <FounderBadge size="sm" />
                                    </Suspense>
                                </div>
                            ) : null}
                            <div className="relative rounded-full border-2 border-black p-1 ring-2 ring-[#FF007F] ring-offset-2">
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
                                    className="rounded-full bg-white !border-0 !h-[104px] !w-[104px] min-w-[104px] !min-h-[104px] sm:!h-[116px] sm:!w-[116px] sm:min-w-[116px] sm:!min-h-[116px] object-cover"
                                />
                            </div>

                            {IsloggedIn &&
                                auth &&
                                auth?.user?.avatar &&
                                auth?.user?.avatar_approved === 0 && (
                                    <div className="absolute approvetag top-2 right-2 z-20">
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
                                                Profile avatar is waiting for approval. Currently only you can see this.
                                            </p>
                                        </button>
                                    </div>
                                )}

                            {IsloggedIn && auth && auth?.user?.avatar_approved === 2 && !auth?.user?.avatar_url && (
                                <div className="absolute top-2 right-2 z-20">
                                    <button className="tooltipbtn">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                                                fill="#E53935"
                                            />
                                        </svg>
                                        <p>
                                            Profile avatar is missing. Please upload an image to continue.
                                        </p>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Name + Username text details */}
                        <div className="flex min-w-0 flex-col items-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <h1 className="font-gulfs uppercase flex items-center gap-2 leading-tight !text-black !text-[20px] sm:!text-[24px]">
                                    <span className="line-clamp-1">{user?.name}</span>
                                    {(user?.role == 1 &&
                                        user?.profile_status_lock == 2 && (
                                            <span className="flex items-center inline-block transform hover:scale-110 transition-transform">
                                                {user?.is_founder ? (
                                                    <Suspense
                                                        fallback={
                                                            <span className="min-w-8 min-h-8 w-8 h-8 ml-1"></span>
                                                        }
                                                    >
                                                        <FounderBadge
                                                            classes="min-w-8 min-h-8 w-8 h-8 drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]"
                                                            icon={true}
                                                        />
                                                    </Suspense>
                                                ) : (
                                                    <BadgeCheckIcon className="min-w-7 min-h-7 w-7 h-7 text-[#1d3ef8] drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]" />
                                                )}
                                            </span>
                                        )) ||
                                        ""}
                                </h1>
                            </div>

                            <div className="userId mt-2 flex items-center justify-center">
                                <Suspense
                                    fallback={
                                        <span className="inline-flex items-center rounded-full border border-black/15 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-600">
                                            @{user?.username}
                                        </span>
                                    }
                                >
                                    <ShareProfile
                                        username={user?.name}
                                        classes="inline-flex items-center group rounded-full border border-black/15 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-600 transition-colors hover:border-black hover:bg-gray-100 hover:text-black"
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
                                            size={14}
                                            className="ml-2 text-gray-400 transition-colors group-hover:text-black"
                                        />
                                    </ShareProfile>
                                </Suspense>
                            </div>

                            {socialItems.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                                    {socialItems}
                                </div>
                            )}

                            {showBio ? (
                                <p className="mt-3 max-w-[260px] text-[13px] font-medium leading-relaxed text-gray-600 line-clamp-4">
                                    {user.bio}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {/* Stat tiles */}
                    {user && user?.role == 1 ? (
                        <div className="grid w-full grid-cols-3 gap-2 border-t border-black/10 pt-4">
                            <div className="rounded-box-sm border border-black/5 bg-[#A2E4B8]/25 px-2 py-3 text-center">
                                <span className="block text-lg font-black leading-none tabular-nums text-black">
                                    {user?.followers_count ?? 0}
                                </span>
                                <span className="mt-1.5 flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-500">
                                    <Users size={10} strokeWidth={2.5} />
                                    Followers
                                </span>
                            </div>
                            <div className="rounded-box-sm border border-black/5 bg-[#A2E4B8]/25 px-2 py-3 text-center">
                                <span className="block text-lg font-black leading-none tabular-nums text-black">
                                    {user?.following_count ?? 0}
                                </span>
                                <span className="mt-1.5 flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-500">
                                    <UserCheck size={10} strokeWidth={2.5} />
                                    Following
                                </span>
                            </div>
                            <div className="rounded-box-sm border border-[#FF007F]/15 bg-[#FF007F]/5 px-2 py-3 text-center">
                                <span className="block text-lg font-black leading-none tabular-nums text-[#FF007F]">
                                    {supporters ?? 0}
                                </span>
                                <span className="mt-1.5 flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#FF007F]">
                                    <PiggyBank size={11} strokeWidth={2.5} />
                                    Supporters
                                </span>
                            </div>
                        </div>
                    ) : (
                        ""
                    )}

                    {/* Earnings progress — same numbers as the Overview rail */}
                    {user?.role == 1 && profile_overview?.earned_target > 0 ? (
                        <div className="w-full">
                            <div className="flex items-baseline justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                    Total earned
                                </span>
                                <span className="text-xs font-black tabular-nums text-black">
                                    £{Math.round(profile_overview.earned || 0).toLocaleString()}
                                    <span className="font-bold text-gray-400">
                                        {" "}/ £{Math.round(profile_overview.earned_target).toLocaleString()}
                                    </span>
                                </span>
                            </div>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#FF007F] to-[#FF7AB8]"
                                    style={{
                                        width: `${Math.min(100, Math.round(((profile_overview.earned || 0) / profile_overview.earned_target) * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex w-full flex-col items-stretch gap-2.5 border-t border-black/10 pt-4">
                            {IsloggedIn ? (
                                <>
                                    <Suspense
                                        fallback={
                                            <button className="rounded-box-sm border-2 border-black bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-black md:text-sm">
                                                Edit profile
                                            </button>
                                        }
                                    >
                                        <EditProfile
                                            profilepage={1}
                                            user={user}
                                            classes={
                                                "w-full rounded-box-sm border-2 border-black bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-gray-100 md:text-sm"
                                            }
                                            global_currency={global_currency}
                                        />
                                    </Suspense>
                                    {paymentStrip}
                                </>
                            ) : (
                                <>
                                    {!IsloggedIn ? (
                                        <div className="flex w-full flex-col items-stretch gap-2.5">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Suspense fallback={null}>
                                                    <FollowButton
                                                        targetUserId={opponantUser?.id}
                                                        isInitiallyFollowing={follow_status}
                                                        classes="w-full uppercase font-bold text-xs md:text-sm whitespace-nowrap rounded-box-sm border-2 border-black px-3 py-3 transition-colors hover:bg-gray-100 disabled:opacity-60"
                                                    />
                                                </Suspense>
                                                {user &&
                                                    user.stripe_details_submitted == 1 &&
                                                    user.role == 1 &&
                                                    !interactionBlocked && (
                                                        <Suspense fallback={null}>
                                                            <SendTip
                                                                classes="w-full !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] !border-2 !px-3 justify-center"
                                                                card_capabilities={
                                                                    card_capabilities
                                                                }
                                                            />
                                                        </Suspense>
                                                    )}
                                            </div>
                                            <div className="flex items-center justify-center gap-2">
                                            <Suspense fallback={null}>
                                                <ReportContentModal
                                                    reportedUser={user}
                                                    classes="flex h-10 w-10 items-center justify-center rounded-box-sm border-2 border-black/15 bg-white text-gray-500 transition-colors hover:border-black hover:text-black"
                                                />
                                            </Suspense>

                                            {auth?.user && (
                                                <>
                                                    {blockState?.blocked_by_me ? (
                                                        <button
                                                            onClick={unblockUser}
                                                            onMouseEnter={() => unblockIconRef.current?.startAnimation?.() }
                                                            onMouseLeave={() => unblockIconRef.current?.stopAnimation?.()}
                                                            className="flex h-11 w-11 items-center justify-center rounded-box-sm border-2 border-black/15 bg-white text-green-700 transition-colors hover:border-green-700 group"
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
                                                                classes="flex h-11 w-11 items-center justify-center rounded-box-sm border-2 border-black/15 bg-white text-gray-500 transition-colors hover:border-red-600 hover:text-red-600 group"
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
                                            {paymentStrip}
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </>
                            )}
                    </div>
                    </div>
                </div>
            </div>


        </div>
    );
}
