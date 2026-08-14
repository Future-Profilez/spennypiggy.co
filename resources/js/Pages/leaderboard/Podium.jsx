import { Link } from "@inertiajs/react";
import VerifiedBadge from "@/Components/VerifiedBadge";
import userphoto from "../../../assets/siteicon.png";
import { trackSearchClick } from "@/includes/Analytics";
import MovementChip from "./MovementChip";
import { rankTier } from "./rankTier";

/**
 * The top three, given the room they earn.
 *
 * Each place carries its own metal — gold, silver, bronze — as a tinted
 * surface and ring rather than a filled block. The tint is what makes the
 * three read as highlighted at a glance; a fill at this size would swallow the
 * creator's name, which is the thing the eye should land on first.
 *
 * First place takes the full width on mobile with second and third sharing a
 * denser row beneath it; the classic 2·1·3 arrangement returns from `sm` up.
 */

const PLACE = {
    1: { label: "First", ordinal: "01", metal: "#C9A227", tint: "rgba(201,162,39,0.07)", ring: "rgba(201,162,39,0.38)" },
    2: { label: "Second", ordinal: "02", metal: "#7C838D", tint: "rgba(124,131,141,0.07)", ring: "rgba(124,131,141,0.3)" },
    3: { label: "Third", ordinal: "03", metal: "#B0764A", tint: "rgba(176,118,74,0.07)", ring: "rgba(176,118,74,0.32)" },
};

function PodiumCard({ row, place, dense = false, windowDays }) {
    if (!row) return null;

    const { label, ordinal, metal, tint, ring } = PLACE[place];
    const first = place === 1;
    const tier = rankTier(row.top);

    return (
        <Link
            href={`/${row.username}`}
            onClick={() => trackSearchClick(row.id, row.username)}
            style={{ background: tint, boxShadow: `inset 0 0 0 1px ${ring}` }}
            className={`group relative flex flex-col items-center overflow-hidden rounded-box text-center transition-all duration-300 hover:-translate-y-1 ${
                dense ? "px-3 py-5" : "px-5 py-7"
            } ${first && !dense ? "sm:-mt-10" : ""}`}
        >
            {/* The metal reads across the top of the card, so the three places
                are distinguishable before any text is read. */}
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, transparent, ${metal}, transparent)` }}
            />

            <span
                className={`font-gulfs leading-none tracking-tight ${dense ? "text-30" : "text-40 sm:text-48"}`}
                style={{ color: metal }}
            >
                {ordinal}
            </span>
            <span
                className="mt-1 text-12 font-semibold uppercase tracking-[0.26em]"
                style={{ color: metal }}
            >
                {label}
            </span>

            {/* Squircle, not a circle — the avatar reads as a card of its own
                and sits with the rest of the page's 20px radius. */}
            <img
                src={row.avatar || userphoto}
                alt=""
                loading="lazy"
                style={{ boxShadow: `0 0 0 1px ${ring}` }}
                className={`mt-4 rounded-box-sm object-cover ${
                    dense ? "h-16 w-16" : first ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20 sm:h-24 sm:w-24"
                }`}
            />

            <div className="mt-3 flex max-w-full items-center justify-center gap-1.5">
                <span
                    className={`truncate font-semibold capitalize tracking-tight text-[#0B0B0C] ${
                        dense ? "text-14" : first ? "text-19" : "text-16"
                    }`}
                >
                    {row.name || "Anonymous"}
                </span>
                <VerifiedBadge user={row} size="sm" />
            </div>
            <span className="mt-0.5 max-w-full truncate text-12 text-black/60">@{row.username}</span>

            {/* The standing itself — a rank without its percentile tells you the
                order, not how far up the board it sits. */}
            {tier.label && (
                <span
                    className={`mt-3 rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.1em] ${
                        dense ? "text-12" : "text-12"
                    } ${tier.className}`}
                >
                    {tier.label}
                </span>
            )}

            <div
                className={`mt-3 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-3 text-12 text-black/60 ${
                    dense ? "" : "border-t"
                }`}
                style={dense ? undefined : { borderColor: ring }}
            >
                {row.supporters > 0 && (
                    <span>
                        <span className="font-semibold text-[#0B0B0C]">{row.supporters}</span>{" "}
                        {row.supporters === 1 ? "supporter" : "supporters"}
                    </span>
                )}
                <MovementChip direction={row.direction} delta={row.delta} windowDays={windowDays} />
            </div>
        </Link>
    );
}

export default function Podium({ rows = [], windowDays }) {
    const [first, second, third] = rows;

    if (!first) return null;

    return (
        <div className="mb-10 sm:pt-12">
            <div className="sm:hidden">
                <PodiumCard row={first} place={1} windowDays={windowDays} />
                {(second || third) && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <PodiumCard row={second} place={2} dense windowDays={windowDays} />
                        <PodiumCard row={third} place={3} dense windowDays={windowDays} />
                    </div>
                )}
            </div>

            <div className="hidden items-start gap-5 sm:grid sm:grid-cols-3">
                <PodiumCard row={second} place={2} windowDays={windowDays} />
                <PodiumCard row={first} place={1} windowDays={windowDays} />
                <PodiumCard row={third} place={3} windowDays={windowDays} />
            </div>
        </div>
    );
}
