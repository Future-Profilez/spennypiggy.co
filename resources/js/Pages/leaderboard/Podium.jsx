import { Link } from "@inertiajs/react";
import VerifiedBadge from "@/Components/VerifiedBadge";
import userphoto from "../../../assets/siteicon.png";
import { trackSearchClick } from "@/includes/Analytics";
import MovementChip from "./MovementChip";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";

/**
 * The top three, given the room they earn.
 *
 * Each place is a SOLID BRAND BLOCK with black type inside the house 2px frame —
 * pink, mint, yellow. The previous version drew gold, silver and bronze tints,
 * three colours this brand does not own, on a page of hairline greys; the top of
 * the leaderboard is the most memorable thing on it and it read like every other
 * ranking on the internet.
 *
 * The place numeral is set in `gulfs` at display size and is the card's subject —
 * it is what a creator screenshots. Everything else on the card is quiet.
 *
 * ⚠️ `border-black` is a 2px `border` SHORTHAND in this project, and
 * `border-[#000]` DOES NOT COMPILE — a card built on it renders frameless. Use
 * `border-black` alone; for a single side, an inline style.
 * ⚠️ gulfs' ascenders overflow a line box shorter than the glyphs, so a one-line
 * display figure takes `leading-[1]`, never the `0.85` a two-line headline wants.
 */

const PLACE = {
    1: { label: "First", ordinal: "01", ground: "bg-brandPink" },
    2: { label: "Second", ordinal: "02", ground: "bg-mint" },
    3: { label: "Third", ordinal: "03", ground: "bg-brandYellow" },
};

/**
 * The distance between the top three, in words.
 *
 * 🚨 A podium that only says "first, second, third" is a rosette, not a
 * standing. Whether first is eight supporters clear or one is the difference
 * between a settled board and one worth chasing this week — and it was the one
 * fact the biggest element on the page did not carry.
 *
 * ⚠️ Supporters, never money, and only when there is a real number to compare.
 * A period where the whole podium sits at 0 (common on the daily board) gets no
 * line rather than "0 ahead of second", which reads as a bug.
 */
function gapLine(rows, place) {
    const at = (i) => Number(rows[i]?.supporters) || 0;
    const [first, second, third] = [at(0), at(1), at(2)];

    if (place === 1) {
        if (!first || rows[1] === undefined) return null;

        return first > second ? `${first - second} ahead of second` : "Level with second";
    }

    if (place === 2) {
        if (!first) return null;

        return first > second ? `${first - second} behind first` : "Level with first";
    }

    if (!second) return null;

    return second > third ? `${second - third} behind second` : "Level with second";
}

function PodiumCard({ row, place, dense = false, windowDays, gap = null }) {
    if (!row) return null;

    const { label, ordinal, ground } = PLACE[place];
    const first = place === 1;

    return (
        <Link
            href={discoveryLink(row.username, DISCOVERY_SOURCE.TRENDING)}
            onClick={() => trackSearchClick(row.id, row.username)}
            className={`group relative flex flex-col overflow-hidden rounded-box border-black text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 ${ground} ${
                dense ? "px-3 py-4" : "px-5 py-6"
            } ${first && !dense ? "sm:-mt-8" : ""}`}
        >
            {/* Place first, because the place is the point. */}
            <div className="flex items-start justify-between gap-2">
                <span
                    className={`font-gulfs leading-[1] tracking-tight ${
                        dense ? "text-40" : "text-60 sm:text-72"
                    }`}
                >
                    {ordinal}
                </span>
                <span className="mt-1 text-12 font-semibold uppercase tracking-[0.22em]">{label}</span>
            </div>

            {/* Squircle, not a circle — the avatar reads as a card of its own and
                sits with the rest of the page's radius scale. */}
            <img
                src={row.avatar || userphoto}
                alt=""
                loading="lazy"
                className={`mt-4 rounded-box-sm border-black object-cover ${
                    dense ? "h-14 w-14" : first ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20"
                }`}
            />

            <div className="mt-3 flex max-w-full items-center gap-1.5">
                <span
                    className={`truncate font-semibold capitalize tracking-tight ${
                        dense ? "text-14" : first ? "text-19" : "text-16"
                    }`}
                >
                    {row.name || "Anonymous"}
                </span>
                <VerifiedBadge user={row} size="sm" />
            </div>
            <span className="max-w-full truncate text-12 text-black/70">@{row.username}</span>

            {/* ⚠️ NOT `font-gulfs`. Set as display type it outshouted the creator's
                own name, which is Poppins here — and the name is the subject of
                the card. This is the same small caps label the place uses
                ("FIRST"), so it reads as data rather than as a headline. */}
            {gap && (
                <span className="mt-2 max-w-full truncate text-12 font-semibold uppercase tracking-[0.12em] text-black/70">
                    {gap}
                </span>
            )}

            {/* The rule is drawn inline: a one-sided arbitrary border class does
                not compile here, and `border-black` would frame all four sides. */}
            <div
                className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-12 text-black/70"
                style={{ borderTop: "2px solid #000" }}
            >
                {row.supporters > 0 && (
                    <span>
                        <span className="font-semibold text-black">{row.supporters}</span>{" "}
                        {row.supporters === 1 ? "supporter" : "supporters"}
                    </span>
                )}
                <MovementChip direction={row.direction} delta={row.delta} windowDays={windowDays} onColor />
            </div>
        </Link>
    );
}

export default function Podium({ rows = [], windowDays }) {
    const [first, second, third] = rows;

    if (!first) return null;

    return (
        <div className="mb-10 sm:pt-10">
            <div className="sm:hidden">
                <PodiumCard row={first} place={1} windowDays={windowDays} gap={gapLine(rows, 1)} />
                {(second || third) && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <PodiumCard row={second} place={2} dense windowDays={windowDays} gap={gapLine(rows, 2)} />
                        <PodiumCard row={third} place={3} dense windowDays={windowDays} gap={gapLine(rows, 3)} />
                    </div>
                )}
            </div>

            <div className="hidden items-start gap-5 sm:grid sm:grid-cols-3">
                <PodiumCard row={second} place={2} windowDays={windowDays} gap={gapLine(rows, 2)} />
                <PodiumCard row={first} place={1} windowDays={windowDays} gap={gapLine(rows, 1)} />
                <PodiumCard row={third} place={3} windowDays={windowDays} gap={gapLine(rows, 3)} />
            </div>
        </div>
    );
}
