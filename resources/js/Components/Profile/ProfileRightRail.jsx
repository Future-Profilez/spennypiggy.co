import { lazy, Suspense } from "react";
import { Link, usePage } from "@inertiajs/react";
import VerifiedBadge, { verifiedTier } from "@/Components/VerifiedBadge";
import PriceFormat from "@/includes/PriceFormat";
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
    Zap,
} from "lucide-react";

const ShareProfile = lazy(() => import("@/wishlist/ShareProfile"));
const ReportContentModal = lazy(
    () => import("@/Components/ReportContentModal"),
);

// 🚨 This used to hardcode `currency: "GBP"` while the figure it formats is in
// the CREATOR's default_currency — a USD creator's $80 rendered as £80. Use the
// shared formatter, which converts into the viewer's currency like every other
// money figure on the profile.

// Mobile: light border, no shadow (fewer heavy boxes); desktop: full brutalist card
const cardClasses =
    "rounded-box border border-black/10 bg-white p-4 sm:p-5 md:border-2 md:border-black";

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
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[#F6F6F4] text-gray-600">
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
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 ${iconBg}`}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <div className="text-[13px] font-black leading-tight text-black">
                    {title}
                </div>
                <div className="text-[12px] font-semibold text-gray-500">
                    {subtitle}
                </div>
            </div>
        </div>
    );
}

const tileClasses =
    "flex flex-col items-center justify-center gap-1.5 rounded-box-sm border border-black/10 py-3.5 text-[12px] font-bold text-black transition-colors hover:border-black";

export default function ProfileRightRail({ IsloggedIn, sections, compact }) {
    // sections: optional allow-list of card keys — lets the sidebar and the About tab
    // each render their own slice of this component without duplicating markup.
    const show = (key) => !sections || sections.includes(key);
    const {
        user,
        profile_overview: ov,
        piggyPotTopSupporters,
    } = usePage().props;
    const { formatMultiPrice } = PriceFormat();

    // The creator can hide their earnings figures from visitors. The server then
    // omits the amounts entirely and sends the percentage, so the progress bar
    // survives without the money.
    const earningsHidden = Boolean(ov?.earnings_hidden);
    const earnedPercent = earningsHidden
        ? Math.min(100, Math.max(0, Number(ov?.earned_percent) || 0))
        : ov?.earned_target > 0
          ? Math.min(
                100,
                Math.round(((ov?.earned || 0) / ov.earned_target) * 100),
            )
          : 0;
    const money = (v) => formatMultiPrice(Math.round(v || 0), user?.default_currency);

    if (!user || user.role != 1) return null;

    // 🚨 The old row read "Verified creator / Identity verified" for anyone
    // whose PROFILE was approved — a claim about a Stripe identity check that
    // may never have happened. The two tiers now say two different things.
    const verifiedLevel = verifiedTier(user);
    const isVerified = Boolean(verifiedLevel);
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
        <div className="flex flex-col gap-4">
            {/* Creator highlights — badges that are actually true for this creator */}
            {show("highlights") && (isVerified || user?.is_founder || hasPremium) && (
                <div className={cardClasses}>
                    <CardTitle>Creator highlights</CardTitle>
                    <div className={compact ? "" : "sm:grid sm:grid-cols-2 sm:gap-x-6"}>
                    {isVerified && (
                        <HighlightRow
                            icon={<VerifiedBadge tier={verifiedLevel} size="md" />}
                            iconBg={verifiedLevel === "creator" ? "bg-[#FF007F]/10" : "bg-black/[0.06]"}
                            title={verifiedLevel === "creator" ? "Verified creator" : "Verified profile"}
                            subtitle={
                                verifiedLevel === "creator"
                                    ? "Identity confirmed and payouts set up"
                                    : "Reviewed and approved by our team"
                            }
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
                    {!earningsHidden && (
                        <OverviewRow
                            icon={<Coins size={15} />}
                            label="Total earned"
                            value={money(ov.earned)}
                            accent
                        />
                    )}
                    </div>
                    {(earningsHidden || ov.earned_target > 0) && (
                        <div className="mt-3">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#FF007F] to-[#FF7AB8]"
                                    style={{ width: `${earnedPercent}%` }}
                                />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[12px] font-bold uppercase tracking-wider text-gray-500">
                                <span>Progress</span>
                                <span>
                                    {earningsHidden
                                        ? `${earnedPercent}%`
                                        : `${money(ov.earned)} / ${money(ov.earned_target)}`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Quick actions — icon tiles, visitors only */}
            {show("quick") && !IsloggedIn && (
                <div className={cardClasses}>
                    <CardTitle>Quick actions</CardTitle>
                    {/* One neutral tile system — the icon carries the colour, the tile
                        stays quiet. Support Me is the primary above; these are
                        secondary shortcuts, so none competes with it. */}
                    <div className={`grid grid-cols-2 gap-2 ${compact ? "" : "sm:grid-cols-4"}`}>
                        <Link
                            href={`/${user?.username}/wishes`}
                            className={tileClasses}
                        >
                            <Gift size={18} className="text-[#FF007F]" />
                            Send a wish
                        </Link>
                        <Link
                            href={`/${user?.username}/shop`}
                            className={tileClasses}
                        >
                            <ShoppingBag size={18} className="text-black" />
                            Shop
                        </Link>
                        <Suspense fallback={null}>
                            <ShareProfile
                                username={user?.name}
                                classes={tileClasses}
                                custom={`${window.location.origin}/${user?.username}`}
                            >
                                <Share2 size={18} className="text-black" />
                                Share
                            </ShareProfile>
                        </Suspense>
                        <Suspense fallback={null}>
                            <ReportContentModal
                                reportedUser={user}
                                classes={`${tileClasses} !text-gray-500 hover:!text-red-600 hover:!border-red-600`}
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
                                <span title={s.name} className="w-full truncate text-[12px] font-bold text-black">
                                    {s.name}
                                </span>
                                <span className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                    ×{s.purchases}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
