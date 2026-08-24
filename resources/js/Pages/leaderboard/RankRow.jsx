import { Link } from "@inertiajs/react";
import VerifiedBadge from "@/Components/VerifiedBadge";
import userphoto from "../../../assets/siteicon.png";
import { trackSearchClick } from "@/includes/Analytics";
import FollowButton from "@/Pages/Profile/FollowButton";
import MovementChip from "./MovementChip";
import { rankTier } from "./rankTier";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
import { measureFor } from "./measure";

/**
 * One rung on the rail.
 *
 * The rank numeral is set large but pale: it gives the list its spine without
 * competing with the creator's name, which is what a reader is scanning for.
 * Separation between rows comes from a rule, not a frame — drawn by the LIST
 * (`divide-y-2` on the section), never per row: an inline `border-bottom` on
 * every row cannot be turned off for the last one, because an inline style beats
 * any `last:` variant, and the result is a doubled line above the list's foot.
 *
 * Layout is built for the narrow case first. Everything that describes the
 * creator — handle, supporters, percentile, movement — lives in one wrapping
 * meta line under the name, so the row never fights the buttons for horizontal
 * space. On a phone that fight is what pushed names to two characters and a
 * hyphen.
 *
 * 🚨 The row carries a BUY route, not only a Follow. The leaderboard is the
 * highest-intent discovery surface on the platform and for months the only
 * thing a reader could do from it was follow — the board sent nobody to a
 * checkout. `row.content` is resolved server-side to whichever surface the
 * creator actually sells on; a creator with nothing listed has no button
 * rather than a link to an empty tab.
 *
 * ⚠️ Wording is content-first: the button names the SURFACE (Wishlist, Shop,
 * Membership, Piggy Pot). Gift/tip/donate vocabulary is banned platform-wide.
 * ⚠️ One-sided rules are inline — `border-[#000]` does not compile here and
 * `border-black` is a 2px all-sides shorthand.
 */
export default function RankRow({ row, windowDays, isYou = false, leaderSupporters = 0 }) {
    if (!row) return null;

    const tier = rankTier(row.top);
    const content = row.content;

    // 🚨 THE MEASURE IS WHAT MAKES THIS A LEADERBOARD AND NOT A LIST. Ranks alone
    // give the ORDER and say nothing about the DISTANCE — #4 and #47 rendered
    // identically, so nothing on screen showed that one was within reach of the
    // podium and the other was not. The bar is that gap, drawn against the
    // leader.
    //
    // ⚠️ Reach, never revenue: it measures SUPPORTERS, the figure this row
    // already prints. It publishes no new fact.
    // The arithmetic and its floor live in `measure.js`, so they can be tested
    // without mounting a component that pulls in Inertia, ziggy and the
    // analytics helpers.
    const supporters = Number(row.supporters) || 0;
    const { show: showBar, width: barWidth } = measureFor(supporters, leaderSupporters);

    // The top ten carry more weight than the tail, the way a real board does.
    const numeralSize = row.rank <= 3 ? "text-22 sm:text-32" : row.rank <= 10 ? "text-20 sm:text-28" : "text-18 sm:text-24";

    return (
        <div
            className={`group relative flex items-center gap-2.5 px-3 py-3 transition-colors sm:gap-4 sm:px-4 sm:py-3.5 ${
                isYou ? "bg-brandYellow/40" : "hover:bg-black/[0.04]"
            }`}
        >
            {/* The rail. A continuous line the whole list climbs. */}
            <span
                aria-hidden="true"
                className="absolute inset-y-0 left-[31px] w-0.5 bg-black/10 sm:left-[47px]"
            />

            <span
                className={`relative z-10 w-8 shrink-0 text-center font-gulfs leading-none sm:w-14 ${
                    isYou ? "bg-brandYellow text-black" : row.rank <= 10 ? "bg-white text-black" : "bg-white text-black/70"
                } ${numeralSize}`}
            >
                {row.rank}
            </span>

            <Link
                href={discoveryLink(row.username, DISCOVERY_SOURCE.TRENDING)}
                onClick={() => trackSearchClick(row.id, row.username)}
                className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3"
            >
                <img
                    src={row.avatar || userphoto}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-box-sm border-black object-cover"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate text-14 font-semibold capitalize tracking-tight text-black sm:text-15">
                            {row.name || "Anonymous"}
                        </span>
                        <VerifiedBadge user={row} size="sm" />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-12 text-black/70">
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

                    {/* The gap, drawn. Black on a light track — the podium already
                        owns the brand colours, and a measure is not money. */}
                    {showBar && (
                        <div
                            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10"
                            role="img"
                            aria-label={`${supporters} of the leader's ${leaderSupporters} supporters`}
                        >
                            <div
                                className={`h-full rounded-full ${isYou ? "bg-brandPink" : "bg-black"}`}
                                style={{ width: `${barWidth}%` }}
                            />
                        </div>
                    )}
                </div>
            </Link>

            {/* Compact by design, but the tap target stays 44px tall — a button
                small enough to look tidy and small enough to miss is worse than
                no button. */}
            <div className="flex shrink-0 items-center gap-2">
                {content && (
                    <Link
                        href={discoveryLink(row.username, DISCOVERY_SOURCE.TRENDING, null, content.page)}
                        aria-label={`${content.aria} from ${row.name || row.username}`}
                        className="inline-flex min-h-[44px] items-center rounded-full border-black bg-brandPink px-3.5 text-12 font-semibold uppercase tracking-[0.08em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                    >
                        {content.label}
                    </Link>
                )}

                {/* 🚨 NO `bg-*` OR `text-*` IN `classes`. FollowButton APPENDS its
                    own (`bg-black text-white` / `bg-white text-black`) after this
                    string, and the winner between two utilities setting the same
                    property is decided by STYLESHEET order, not source order — a
                    `bg-white text-black` passed in rendered white type on a white
                    pill, i.e. an empty button. `npm run check` cannot see it: the
                    pair is only formed at runtime. */}
                {/* 🚨 Where the row has a buy route, Follow steps aside on a PHONE.
                    Both buttons plus the rank, the avatar and the name do not fit
                    at 390px — one of them has to lose, and it is not the one that
                    reaches a checkout. Follow is on the creator's own profile,
                    one tap away, which is where the row already leads. */}
                {!isYou && (
                    <FollowButton
                        targetUserId={row.id}
                        isInitiallyFollowing={row.is_following}
                        classes={`${
                            content ? "hidden sm:inline-flex" : "inline-flex"
                        } min-h-[44px] shrink-0 items-center rounded-full border-black px-3 text-12 font-semibold uppercase tracking-[0.08em] transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-50 sm:px-3.5`}
                    />
                )}
            </div>
        </div>
    );
}
