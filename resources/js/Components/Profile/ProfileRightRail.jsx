import { lazy, Suspense } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Sparkles,
    PiggyBank,
    Crown,
    ShoppingBag,
    ClipboardList,
    Coins,
    Share2,
    Flag,
    Gift,
    BadgeCheck,
    Heart,
    Zap,
} from "lucide-react";

const SendTip = lazy(() => import("@/Pages/TipJar/SendTip"));
const ShareProfile = lazy(() => import("@/wishlist/ShareProfile"));
const ReportContentModal = lazy(
    () => import("@/Components/ReportContentModal"),
);

const gbp = (v) =>
    new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
    }).format(v || 0);

// Mobile: light border, no shadow (fewer heavy boxes); desktop: full brutalist card
const cardClasses =
    "rounded-box border border-black/10 bg-white p-4 shadow-none lg:border-2 lg:border-black lg:p-5";

function CardTitle({ children, action }) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-black">
                {children}
            </h3>
            {action}
        </div>
    );
}

function OverviewRow({ icon, label, value, accent }) {
    return (
        <div className="flex items-center justify-between border-b border-black/5 py-3 last:border-b-0 last:pb-0">
            <span className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-black/10 bg-[#F6F6F4] text-gray-600">
                    {icon}
                </span>
                {label}
            </span>
            <span
                className={`text-sm font-black tabular-nums ${accent ? "text-[#12A150]" : "text-black"}`}
            >
                {value}
            </span>
        </div>
    );
}

function HighlightRow({ icon, iconBg, title, subtitle }) {
    return (
        <div className="flex items-center gap-3 border-b border-black/5 py-2.5 last:border-b-0 last:pb-0 first:pt-0">
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-black/10 ${iconBg}`}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <div className="text-[13px] font-black leading-tight text-black">
                    {title}
                </div>
                <div className="text-[11px] font-semibold text-gray-500">
                    {subtitle}
                </div>
            </div>
        </div>
    );
}

const tileClasses =
    "flex flex-col items-center justify-center gap-1.5 rounded-box-sm border border-black/10 py-3.5 text-[11px] font-bold text-black transition-colors hover:border-black";

export default function ProfileRightRail({ IsloggedIn, sections, compact }) {
    // sections: optional allow-list of card keys — lets the sidebar and the About tab
    // each render their own slice of this component without duplicating markup.
    const show = (key) => !sections || sections.includes(key);
    const {
        user,
        profile_overview: ov,
        card_capabilities,
        piggyPotTopSupporters,
    } = usePage().props;

    if (!user || user.role != 1) return null;

    const isVerified = user?.profile_status_lock == 2;
    const hasPremium = (ov?.wishes || 0) > 0 || (ov?.shops || 0) > 0;
    const hasListings =
        (ov?.wishes || 0) +
            (ov?.shops || 0) +
            (ov?.tasks || 0) +
            (ov?.piggy_pots || 0) +
            (ov?.memberships || 0) >
        0;
    const supportersList = Array.isArray(piggyPotTopSupporters)
        ? piggyPotTopSupporters.slice(0, 4)
        : [];

    return (
        <div className="flex flex-col gap-5">
            {/* Creator highlights — badges that are actually true for this creator */}
            {show("highlights") && (isVerified || user?.is_founder || hasPremium) && (
                <div className={cardClasses}>
                    <CardTitle>Creator highlights</CardTitle>
                    <div className={compact ? "" : "sm:grid sm:grid-cols-2 sm:gap-x-6"}>
                    {isVerified && (
                        <HighlightRow
                            icon={<BadgeCheck size={16} className="text-[#12A150]" />}
                            iconBg="bg-[#12A150]/10"
                            title="Verified creator"
                            subtitle="Identity verified"
                        />
                    )}
                    {user?.is_founder ? (
                        <HighlightRow
                            icon={<Crown size={16} className="text-[#D9A400]" />}
                            iconBg="bg-[#FFE600]/30"
                            title="Founder"
                            subtitle="Early community member"
                        />
                    ) : null}
                    {hasPremium && (
                        <HighlightRow
                            icon={<Gift size={16} className="text-[#FF007F]" />}
                            iconBg="bg-[#FF007F]/10"
                            title="Premium content"
                            subtitle="Exclusive wishes & shop"
                        />
                    )}
                    {hasListings && (
                        <HighlightRow
                            icon={<Zap size={16} className="text-[#7C3AED]" />}
                            iconBg="bg-[#7C3AED]/10"
                            title="Active creator"
                            subtitle="Live content to unlock"
                        />
                    )}
                    </div>
                </div>
            )}

            {/* Overview */}
            {show("overview") && ov ? (
                <div className={cardClasses}>
                    <CardTitle>Overview</CardTitle>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-x-8">
                    <OverviewRow
                        icon={<Sparkles size={15} />}
                        label="Wishes"
                        value={ov.wishes}
                    />
                    <OverviewRow
                        icon={<PiggyBank size={15} />}
                        label="Piggy Pots"
                        value={ov.piggy_pots}
                    />
                    <OverviewRow
                        icon={<Crown size={15} />}
                        label="Memberships"
                        value={ov.memberships}
                    />
                    {ov.shops > 0 && (
                        <OverviewRow
                            icon={<ShoppingBag size={15} />}
                            label="Shop items"
                            value={ov.shops}
                        />
                    )}
                    {ov.tasks > 0 && (
                        <OverviewRow
                            icon={<ClipboardList size={15} />}
                            label="Paid tasks"
                            value={ov.tasks}
                        />
                    )}
                    <OverviewRow
                        icon={<Coins size={15} />}
                        label="Total earned"
                        value={gbp(ov.earned)}
                        accent
                    />
                    </div>
                    {ov.earned_target > 0 && (
                        <div className="mt-3">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#FF007F] to-[#FF7AB8]"
                                    style={{
                                        width: `${Math.min(100, Math.round(((ov.earned || 0) / ov.earned_target) * 100))}%`,
                                    }}
                                />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <span>Progress</span>
                                <span>
                                    {gbp(ov.earned)} / {gbp(ov.earned_target)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Membership promo — only when there is a membership to join */}
            {show("membership") && ov?.memberships > 0 && (
                <div className="relative overflow-hidden rounded-box bg-gradient-to-br from-[#FF007F] to-[#9333EA] p-5 text-white border-0 shadow-none lg:border-2 lg:border-black sm:flex sm:items-center sm:justify-between sm:gap-6">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                    <div className="min-w-0">
                        <h3 className="text-lg font-black uppercase leading-tight tracking-wide">
                            Join the inner circle
                        </h3>
                        <ul className="mt-2.5 space-y-1 text-[12px] font-semibold text-white/90 sm:flex sm:items-center sm:gap-4 sm:space-y-0">
                            <li className="flex items-center gap-1.5">
                                <BadgeCheck size={13} /> Premium content
                            </li>
                            <li className="flex items-center gap-1.5">
                                <BadgeCheck size={13} /> Early access
                            </li>
                            <li className="flex items-center gap-1.5">
                                <BadgeCheck size={13} /> Member-only posts
                            </li>
                        </ul>
                    </div>
                    <Link
                        href={`/${user?.username}/memberships`}
                        className="mt-4 flex w-full items-center justify-center rounded-box-sm border-2 border-black bg-white px-4 py-2.5 text-[12px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 sm:mt-0 sm:w-auto sm:shrink-0 sm:px-6"
                    >
                        View memberships
                    </Link>
                </div>
            )}

            {/* Quick actions — icon tiles, visitors only */}
            {show("quick") && !IsloggedIn && (
                <div className={cardClasses}>
                    <CardTitle>Quick actions</CardTitle>
                    <div className={`grid grid-cols-2 gap-2 ${compact ? "" : "sm:grid-cols-4"}`}>
                        {user?.stripe_details_submitted == 1 && (
                            <Suspense fallback={null}>
                                <SendTip
                                    card_capabilities={card_capabilities}
                                    classes={`${tileClasses} !bg-[#FF007F]/10 !text-[#FF007F] !border-[#FF007F]/20 hover:!border-[#FF007F] !shadow-none !normal-case !rounded-box-sm !px-2`}
                                />
                            </Suspense>
                        )}
                        <Link
                            href={`/${user?.username}/wishes`}
                            className={`${tileClasses} bg-[#FFE600]/20 text-black`}
                        >
                            <Gift size={18} className="text-[#D9A400]" />
                            Send a wish
                        </Link>
                        <Suspense fallback={null}>
                            <ShareProfile
                                username={user?.name}
                                classes={`${tileClasses} bg-[#12A150]/5`}
                                custom={`${window.location.origin}/${user?.username}`}
                            >
                                <Share2 size={18} className="text-[#12A150]" />
                                Share
                            </ShareProfile>
                        </Suspense>
                        <Suspense fallback={null}>
                            <ReportContentModal
                                reportedUser={user}
                                classes={`${tileClasses} bg-[#F6F6F4] !text-gray-500 hover:!text-red-600 hover:!border-red-600`}
                                text={
                                    <>
                                        <Flag size={18} />
                                        Report
                                    </>
                                }
                            />
                        </Suspense>
                    </div>
                </div>
            )}

            {/* Recent supporters — ranked by purchase count, never by amount */}
            {show("supporters") && supportersList.length > 0 && (
                <div className={cardClasses}>
                    <CardTitle>Top supporters</CardTitle>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:justify-start">
                        {supportersList.map((s, i) => (
                            <div
                                key={s.username || i}
                                className="flex flex-col items-center gap-1 text-center"
                            >
                                {s.avatar ? (
                                    <img
                                        src={s.avatar}
                                        alt={s.name}
                                        className="!h-12 !w-12 !min-h-0 rounded-full border-2 border-black object-cover"
                                    />
                                ) : (
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#FFE600] text-sm font-black">
                                        {(s.name || "?").charAt(0)}
                                    </span>
                                )}
                                <span className="w-full truncate text-[10px] font-bold text-black">
                                    {s.name}
                                </span>
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                                    ×{s.purchases}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Closing nudge — visitors only */}
            {show("cta") && !IsloggedIn && user?.stripe_details_submitted == 1 && (
                <div className={`${cardClasses} flex items-center justify-between gap-3`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF007F]/10">
                            <Heart size={16} className="text-[#FF007F]" />
                        </span>
                        <span className="text-[13px] font-black leading-tight text-black">
                            Love the content?
                        </span>
                    </div>
                    <Suspense fallback={null}>
                        <SendTip
                            card_capabilities={card_capabilities}
                            classes="!px-4 !py-2 !text-[11px] !rounded-full"
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
