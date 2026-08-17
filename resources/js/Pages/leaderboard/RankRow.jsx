import { Link } from "@inertiajs/react";
import VerifiedBadge from "@/Components/VerifiedBadge";
import userphoto from "../../../assets/siteicon.png";
import { trackSearchClick } from "@/includes/Analytics";
import FollowButton from "@/Pages/Profile/FollowButton";
import MovementChip from "./MovementChip";
import { rankTier } from "./rankTier";

/**
 * One rung on the rail.
 *
 * The rank numeral is set large but pale: it gives the list its spine without
 * competing with the creator's name, which is what a reader is scanning for.
 * Separation between rows comes from a hairline, not a frame.
 *
 * Layout is built for the narrow case first. Everything that describes the
 * creator — handle, supporters, percentile, movement — lives in one wrapping
 * meta line under the name, so the row never fights the Follow button for
 * horizontal space. On a phone that fight is what pushed names to two
 * characters and a hyphen.
 */
export default function RankRow({ row, windowDays, isYou = false }) {
    if (!row) return null;

    const tier = rankTier(row.top);

    return (
        <div
            className={`group relative flex items-center gap-2.5 border-b border-black/[0.06] px-3 py-3 transition-colors last:border-b-0 sm:gap-4 sm:px-4 sm:py-3.5 ${
                isYou ? "bg-brandPink/[0.035]" : "hover:bg-black/[0.015]"
            }`}
        >
            {/* The rail. A continuous hairline the whole list climbs. */}
            <span
                aria-hidden="true"
                className="absolute inset-y-0 left-[30px] w-px bg-black/[0.06] sm:left-[46px]"
            />

            <span className="relative z-10 w-8 shrink-0 bg-white text-center font-gulfs text-16 leading-none text-black/60 sm:w-14 sm:text-22">
                {row.rank}
            </span>

            <Link
                href={`/${row.username}`}
                onClick={() => trackSearchClick(row.id, row.username)}
                className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3"
            >
                <img
                    src={row.avatar || userphoto}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-box-sm object-cover "
                />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate text-14 font-semibold capitalize tracking-tight text-[#0B0B0C] sm:text-15">
                            {row.name || "Anonymous"}
                        </span>
                        <VerifiedBadge user={row} size="sm" />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-12 text-black/60 ">
                        <span className="truncate">@{row.username}</span>
                        {row.supporters > 0 && (
                            <span className="whitespace-nowrap">
                                {row.supporters} {row.supporters === 1 ? "supporter" : "supporters"}
                            </span>
                        )}
                        {/* Where this creator sits on the whole board. A rank
                            number alone gives the order; the percentile is what
                            tells them how far up they are, and it is the figure
                            that moves when they gain supporters — so it stays
                            visible at every width, never hidden on mobile. */}
                        {tier.label && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-12 font-semibold uppercase tracking-[0.08em] ${tier.className}`}
                            >
                                {tier.label}
                            </span>
                        )}
                        <MovementChip
                            direction={row.direction}
                            delta={row.delta}
                            windowDays={windowDays}
                            compact
                        />
                    </div>
                </div>
            </Link>

            {/* Compact by design, but the tap target stays 44px tall — a button
                small enough to look tidy and small enough to miss is worse than
                no button. */}
            {!isYou && (
                <FollowButton
                    targetUserId={row.id}
                    isInitiallyFollowing={row.is_following}
                    classes="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-3 text-12 font-semibold uppercase tracking-[0.08em] ring-1 ring-inset ring-black/12 transition-colors hover:ring-black/30 disabled:opacity-50 sm:px-3.5"
                />
            )}
        </div>
    );
}
