import { useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ensureLoaded, savedCount, subscribe } from "@/lib/savedItems";

/**
 * What this supporter has collected, and a route into each of it.
 *
 * 🚨 THE SUPPORTER PROFILE WAS A DEAD END, AND THIS IS THE HALF THAT POINTS
 * INWARD. `more_creators` (the row at the foot of the page) points a supporter
 * at people they have not met; this points them back at what they already own —
 * unlocks they may not have opened, items they saved and never came back to.
 * Neither existed: the page rendered a level card, an empty About tab and an
 * empty Feed, with nothing on it to click.
 *
 * 🚨 OWNER ONLY, and the gate is the CALLER's. Every figure here is a fact about
 * one person's own buying, and `/{username}` is also the public profile — the
 * same reason `CreatorsBacked` self-hides and `getGifterCreators()` is
 * owner-gated in the service. Do not add a visitor branch to this component;
 * the answer for a visitor is that it does not render.
 *
 * 🚨 NO MONEY, EVER. Counts only — `gifter_stats` carries none (the server
 * strips it), and the platform rule is that a supporter ranks by purchase count
 * and never by amount. A figure with a currency symbol on it does not belong on
 * this card.
 *
 * ⚠️ House rules followed deliberately: `border-black` ALONE (this project
 * redefines it as a full `border: 2px solid` shorthand, so a width class beside
 * it is discarded silently), radius only through `rounded-box` / `-sm`, no
 * shadow (`npm run check` fails the build on one), no scale on hover, and
 * `hover:bg-[#F4F4F5]` rather than `hover:bg-black/[0.04]` — that class REPLACES
 * the background rather than tinting it, so on this page's mint ground a white
 * cell washes green.
 */

/*
 * 🚨 THE HAIRLINES ARE THE BLACK PARENT SHOWING THROUGH `gap-px`, NOT A BORDER
 * PER CELL. Adjacent borders double to 4px and fall out of step the moment one
 * cell is taller than its neighbour — the device is already documented on
 * `Components/UI/StatStrip.jsx` for exactly this reason.
 *
 * ⚠️ Four cells, so the 2×2 and 4×1 arrangements both fill their grid. An ODD
 * count would leave the parent showing through as a solid black block; if a
 * fifth figure is ever added, one cell has to span two columns.
 */
function Cell({ label, value, href }) {
    const body = (
        <>
            <span className="block font-gulfs text-[26px] leading-[1] tabular-nums text-black sm:text-[30px]">
                {value}
            </span>
            <span className="mt-1.5 block font-poppins text-[12px] font-semibold leading-[1.3] text-black/65">
                {label}
            </span>
        </>
    );

    if (!href) {
        return <div className="bg-white px-3 py-3.5 text-left">{body}</div>;
    }

    return (
        <Link
            href={href}
            className="bg-white px-3 py-3.5 text-left transition-colors duration-200 hover:bg-[#F4F4F5] motion-reduce:transition-none"
        >
            {body}
        </Link>
    );
}

export default function SupporterShelf() {
    const { gifter_stats: stats, user } = usePage().props;

    /*
     * ⚠️ Saved items are NOT in the page payload — they are loaded once per page
     * by the same module every SaveButton reads, so this figure and the hearts on
     * screen cannot disagree. It resolves to 0 before the request lands and
     * corrects itself, which is why the count is subscribed to rather than read
     * once on mount.
     */
    const [saved, setSaved] = useState(savedCount);

    useEffect(() => {
        ensureLoaded();

        return subscribe(() => setSaved(savedCount()));
    }, []);

    // The level card above already renders "No unlocks yet" for a supporter with
    // nothing. A second empty block under it says the same thing again.
    if (!stats) return null;

    const purchases = stats.purchases || 0;
    const creators = stats.creators || 0;
    const following = user?.following_count || 0;

    return (
        <section
            aria-labelledby="supporter-shelf-heading"
            className="rounded-box border border-black/10 bg-white p-4 sm:p-5 md:border-2 md:border-black"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2
                    id="supporter-shelf-heading"
                    className="font-poppins text-[15px] font-bold text-black"
                >
                    Your shelf
                </h2>

                {/* ⚠️ Literal path, never `route()`. `resources/js/ziggy.js` is a
                    generated snapshot and `route()` THROWS for a name it does not
                    carry — which on this page would take the profile down to draw
                    a link. */}
                <Link
                    href="/my-purchases"
                    className="font-poppins text-[13px] font-semibold text-[#C4006A] underline underline-offset-2 transition-opacity duration-200 hover:opacity-70"
                >
                    Open everything you own
                </Link>
            </div>

            <p className="mt-1.5 font-poppins text-[13px] leading-[1.5] text-black/60">
                {purchases
                    ? "Everything you have unlocked, and the things you put aside."
                    : "Nothing here yet. Unlock something and it lands in this shelf."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-box-sm border border-black bg-black sm:grid-cols-4">
                <Cell label="Unlocks" value={purchases} href="/my-purchases" />
                <Cell label="Creators backed" value={creators} />
                <Cell
                    label="Saved"
                    value={saved}
                    href="/my-purchases?tab=saved"
                />
                <Cell label="Following" value={following} />
            </div>
        </section>
    );
}
