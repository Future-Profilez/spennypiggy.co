import { Link } from "@inertiajs/react";
import userphoto from "../../../assets/siteicon.png";
import { trackSearchClick } from "@/includes/Analytics";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";

/**
 * Who won the period that has just closed.
 *
 * A countdown with nothing on the other side of it is a deadline with no
 * consequence. This is the consequence: last week's board, kept, so a creator
 * can see that finishing first is a thing that happens to people and not an
 * abstraction — and so the reset reads as a new race rather than as their rank
 * being deleted.
 *
 * 🚨 RANK AND SUPPORTER COUNT ONLY. No amounts, ever — the public board ranks
 * reach and the earnings are deliberately not public (`amount => 0` in the
 * controller's row payload).
 *
 * ⚠️ Computed from the closed period's own window rather than from
 * `leaderboard_snapshots`: the snapshot command runs at 03:15, so the last
 * capture of a week is taken on Sunday morning and would name a winner chosen
 * with a day still to play.
 */
const PLACE_GROUND = ["bg-brandPink", "bg-mint", "bg-brandYellow"];

export default function PastWinners({ winners = [], label }) {
    if (!winners.length) return null;

    return (
        <section className="mb-8 overflow-hidden rounded-box border-black bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-4">
                <h2 className="text-12 font-semibold uppercase tracking-[0.22em] text-black/70">
                    {label ?? "Last period"} · Winners
                </h2>
                <p className="text-12 text-black/70">Final standing when the board closed</p>
            </div>

            <ul className="grid gap-px bg-black/10 sm:grid-cols-3" style={{ borderTop: "2px solid #000" }}>
                {winners.map((winner, index) => (
                    <li key={winner.id ?? winner.username}>
                        <Link
                            href={discoveryLink(winner.username, DISCOVERY_SOURCE.TRENDING)}
                            onClick={() => trackSearchClick(winner.id, winner.username)}
                            className={`flex h-full items-center gap-3 px-4 py-3.5 text-black transition-[filter] duration-200 hover:brightness-105 active:brightness-95 ${
                                PLACE_GROUND[index] ?? "bg-white"
                            }`}
                        >
                            <span className="font-gulfs text-26 leading-[1]">{String(winner.rank).padStart(2, "0")}</span>

                            <img
                                src={winner.avatar || userphoto}
                                alt=""
                                loading="lazy"
                                className="h-10 w-10 shrink-0 rounded-box-sm border-black object-cover"
                            />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-14 font-semibold capitalize tracking-tight">
                                    {winner.name || "Anonymous"}
                                </span>
                                <span className="block truncate text-12 text-black/70">
                                    {winner.supporters > 0
                                        ? `${winner.supporters} ${
                                              winner.supporters === 1 ? "supporter" : "supporters"
                                          }`
                                        : `@${winner.username}`}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
