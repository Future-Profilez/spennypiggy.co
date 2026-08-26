import { useState, useRef, Suspense, useEffect } from "react";
import userphoto from "../../assets/siteicon.png";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.png";
import { usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { UserXIcon, InfoIcon, CopyIcon } from "@animateicons/react/lucide";
import {
    Flag,
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
import lazyRetry from "@/utils/lazyRetry";

const EditProfile = lazyRetry(() => import("@/Pages/account/EditProfile"));
const ShareProfile = lazyRetry(() => import("./ShareProfile"));
const AddSocial = lazyRetry(() => import("@/Pages/Auth/Social"));
const SendTip = lazyRetry(() => import("@/Pages/TipJar/SendTip"));
const FollowButton = lazyRetry(() => import("@/Pages/Profile/FollowButton"));
const FounderBadge = lazyRetry(() => import("@/Components/FounderBadge"));
const Popup = lazyRetry(() => import("@/Components/Popup"));
const CoverIdentity = lazyRetry(() => import("@/Components/Profile/CoverIdentity"));
const ReportContentModal = lazyRetry(
    () => import("@/Components/ReportContentModal"),
);

export default function Userprofile({
    blockedByI,
    IsloggedIn,
    payoutAction,
    aboutBlock,
}) {
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
                <span className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-black/70">
                    <Lock size={11} strokeWidth={2.5} />
                    Secure checkout
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="flex h-7 items-center justify-center rounded-box-sm border border-black/10 bg-white px-2">
                        <span className="text-[12px] font-black italic tracking-tight text-[#1A1F71]">
                            VISA
                        </span>
                    </span>
                    <span className="flex h-7 items-center justify-center rounded-box-sm border border-black/10 bg-white px-2">
                        <svg
                            width="22"
                            height="14"
                            viewBox="0 0 22 14"
                            aria-label="Mastercard"
                        >
                            <circle cx="8" cy="7" r="6.5" fill="#EB001B" />
                            <circle
                                cx="14"
                                cy="7"
                                r="6.5"
                                fill="#F79E1B"
                                fillOpacity="0.92"
                            />
                        </svg>
                    </span>
                    <span className="flex h-7 items-center justify-center rounded-box-sm border border-black/10 bg-[#2E77BC] px-2">
                        <span className="text-[12px] font-black tracking-wide text-white">
                            AMEX
                        </span>
                    </span>
                    <span className="flex h-7 items-center justify-center gap-1 rounded-box-sm border border-black/10 bg-white px-2 text-gray-700">
                        <Landmark size={12} strokeWidth={2.5} />
                        <span className="text-[12px] font-bold uppercase tracking-wide">
                            Bank
                        </span>
                    </span>
                </div>
            </div>
        ) : null;

    // A creator's bio already has a home: the About Me card directly below this
    // one in the same rail. Repeating it here printed the same line twice in one
    // viewport. Gifters have no About Me card, so they keep it.
    const showBio =
        user?.bio && user?.role != 1 && (IsloggedIn || user?.bio_approved == 1);

    return (
        <div className="userprofilesec relative">
            <div className="userPr relative -mx-5 sm:mx-0">
                <div className="relative z-10 rounded-none sm:rounded-box bg-white bg-gradient-to-b from-white via-white to-[#A2E4B8]/25 sm:bg-white sm:bg-none p-5 pb-7 sm:p-6 border-0 sm:border-2 sm:border-black">
                    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 text-center md:max-w-none">
                        <div
                            className={`flex flex-col items-center gap-3 ${showBio ? "" : "md:hidden"}`}
                        >
                            <div className="-mt-[68px] sm:-mt-[76px] w-full md:hidden">
                                <Suspense fallback={null}>
                                    <CoverIdentity
                                        variant="card"
                                        IsloggedIn={IsloggedIn}
                                    />
                                </Suspense>
                            </div>

                            <div className="flex min-w-0 flex-col items-center">
                                {showBio ? (
                                    <p className="mt-3 max-w-[260px] text-[13px] font-medium leading-relaxed text-gray-600 line-clamp-4">
                                        {user.bio}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {/* About me — supplied by the page so the approval gates and pending
                            notices stay defined in one place (see Dashboard.jsx). It leads the
                            card because "who is this" is what this column answers. */}
                        {aboutBlock ? (
                            <div className="w-full border-b border-black/10 pb-4">
                                {aboutBlock}
                            </div>
                        ) : null}

                        {/* Stat tiles */}
                        {user && user?.role == 1 ? (
                            <div className="grid w-full grid-cols-3 gap-2">
                                <div className="rounded-box-sm border border-black/5 bg-[#A2E4B8]/25 px-2 py-2.5 text-center">
                                    <span className="block text-lg font-black leading-none tabular-nums text-black">
                                        {user?.followers_count ?? 0}
                                    </span>
                                    <span className="mt-1.5 flex items-center justify-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-black/70">
                                        <Users size={10} strokeWidth={2.5} />
                                        Followers
                                    </span>
                                </div>
                                <div className="rounded-box-sm border border-black/5 bg-[#A2E4B8]/25 px-2 py-2.5 text-center">
                                    <span className="block text-lg font-black leading-none tabular-nums text-black">
                                        {user?.following_count ?? 0}
                                    </span>
                                    <span className="mt-1.5 flex items-center justify-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-black/70">
                                        <UserCheck
                                            size={10}
                                            strokeWidth={2.5}
                                        />
                                        Following
                                    </span>
                                </div>
                                <div className="rounded-box-sm border border-[#FF007F]/15 bg-[#FF007F]/5 px-2 py-2.5 text-center">
                                    <span className="block text-lg font-black leading-none tabular-nums text-[#C4006A]">
                                        {supporters ?? 0}
                                    </span>
                                    <span className="mt-1.5 flex items-center justify-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#C4006A]">
                                        <PiggyBank
                                            size={10}
                                            strokeWidth={2.5}
                                        />
                                        Supporters
                                    </span>
                                </div>
                            </div>
                        ) : (
                            ""
                        )}

                        {/* Actions */}
                        <div className="flex w-full flex-col items-stretch gap-2.5 pt-1">
                            {/* Owner's payout entry point — the first thing a creator comes here for */}
                            {payoutAction}
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

                                    {/* Grow reach: share the profile, and add the social links
                                        that render on the cover */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <Suspense fallback={null}>
                                            <ShareProfile
                                                username={user?.username}
                                                classes="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-box-sm border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-gray-100"
                                                custom={`${window.location.origin}/${user?.username}`}
                                            >
                                                Share
                                            </ShareProfile>
                                        </Suspense>
                                        <Suspense fallback={null}>
                                            <AddSocial
                                                classes="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-box-sm border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-gray-100"
                                                sLinks={slinks}
                                            />
                                        </Suspense>
                                    </div>
                                    {paymentStrip}
                                </>
                            ) : (
                                <>
                                    {!IsloggedIn ? (
                                        <div className="flex w-full flex-col items-stretch gap-2.5">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Suspense fallback={null}>
                                                    <FollowButton
                                                        targetUserId={
                                                            opponantUser?.id
                                                        }
                                                        isInitiallyFollowing={
                                                            follow_status
                                                        }
                                                        classes="w-full uppercase font-bold text-xs md:text-sm whitespace-nowrap rounded-box-sm border-2 border-black px-3 py-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                                                    />
                                                </Suspense>
                                                {user &&
                                                    user.stripe_details_submitted ==
                                                        1 &&
                                                    user.role == 1 &&
                                                    !interactionBlocked && (
                                                        <Suspense
                                                            fallback={null}
                                                        >
                                                            <SendTip
                                                                classes="w-full !border-2 !px-3 justify-center"
                                                                card_capabilities={
                                                                    card_capabilities
                                                                }
                                                            />
                                                        </Suspense>
                                                    )}
                                            </div>
                                            {/* Anyone can pass the profile along */}
                                            <Suspense fallback={null}>
                                                <ShareProfile
                                                    username={user?.username}
                                                    classes="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-box-sm border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-gray-100"
                                                    custom={`${window.location.origin}/${user?.username}`}
                                                >
                                                    Share profile
                                                </ShareProfile>
                                            </Suspense>
                                            <div className="flex items-center justify-center gap-2 pt-0.5">
                                                <Suspense fallback={null}>
                                                    <ReportContentModal
                                                        reportedUser={user}
                                                        classes="flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[12px] font-bold uppercase tracking-wide text-gray-500 transition-colors hover:border-black hover:text-black"
                                                        text={
                                                            <>
                                                                <Flag size={13} strokeWidth={2.5} />
                                                                Report
                                                            </>
                                                        }
                                                    />
                                                </Suspense>

                                                {auth?.user && (
                                                    <>
                                                        {blockState?.blocked_by_me ? (
                                                            <button
                                                                onClick={
                                                                    unblockUser
                                                                }
                                                                onMouseEnter={() =>
                                                                    unblockIconRef.current?.startAnimation?.()
                                                                }
                                                                onMouseLeave={() =>
                                                                    unblockIconRef.current?.stopAnimation?.()
                                                                }
                                                                className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-green-700/25 bg-white px-3 text-[12px] font-bold uppercase tracking-wide text-green-700 transition-colors hover:border-green-700 group"
                                                                title="Unblock User"
                                                            >
                                                                <UserXIcon
                                                                    ref={
                                                                        unblockIconRef
                                                                    }
                                                                    size={13}
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                    className="rotate-180"
                                                                />
                                                                Unblock
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
                                                                    classes="flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[12px] font-bold uppercase tracking-wide text-gray-500 transition-colors hover:border-red-600 hover:text-red-600 group"
                                                                    text={
                                                                        <>
                                                                            <UserXIcon
                                                                                ref={
                                                                                    blockIconRef
                                                                                }
                                                                                size={
                                                                                    13
                                                                                }
                                                                                strokeWidth={
                                                                                    2.5
                                                                                }
                                                                            />
                                                                            Block
                                                                        </>
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
                                                                            Block
                                                                            {" "}
                                                                            {
                                                                                user?.name
                                                                            }
                                                                            ?
                                                                        </h2>
                                                                        <div className="bg-gray-50 border-2 border-black rounded-box-sm p-4 text-left space-y-3 mb-6">
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
 rounded-box-sm
 border-[3px]
 border-black
 bg-white
 px-5
 py-4
 pr-14
 text-sm
 font-black
 text-black
                                                                                
 transition-all
 focus:outline-none
 focus:border-[#FF007F]
                                                                                
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
 rounded-box-sm
 font-black
 uppercase
 tracking-wider
 border-2
 border-black
                                                                                
 active:translate-y-0.5
 
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
