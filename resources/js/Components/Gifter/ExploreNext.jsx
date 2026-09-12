import { Link } from "@inertiajs/react";
import { Compass, Tag, Trophy } from "lucide-react";

/**
 * Where a supporter goes next, from their own profile.
 *
 * 🚨 THIS RAIL EXISTED FOR CREATORS AND NOT FOR FANS. `ProfileRightRail` returns
 * null for `role != 1`, so the whole left column of a supporter's profile was
 * their identity card and then nothing — on a page whose other two tabs are
 * empty until they have bought something. A fan landed on their own page and had
 * no route anywhere.
 *
 * 🚨 EVERY DESTINATION HERE IS LIVE FOR EVERYBODY, WHATEVER THE DATA SAYS.
 * `/discover/birthdays` was considered and left out on purpose: that page greys
 * itself below `collection_min_creators`, and Discover's own tile for it is
 * gated on a `birthdaysReady` prop this page does not receive — so linking it
 * from here is a link into a coming-soon screen on the exact page being fixed
 * for dead ends. **Do not add a destination whose content can be empty without
 * the prop that says so.**
 *
 * ⚠️ Shown to a VISITOR as well as the owner. These are public browse surfaces
 * and carry nothing about whose page this is, so there is nothing to gate — and
 * a stranger who arrived on a fan's profile is at the same dead end the owner
 * was.
 *
 * ⚠️ Literal paths, never `route()`. `resources/js/ziggy.js` is a generated
 * snapshot and `route()` THROWS for a name it does not carry — which here would
 * take the whole profile down to draw a nav rail.
 *
 * ⚠️ House rules: `border-black` ALONE (the project redefines it as a full
 * `border: 2px solid` shorthand, so a width class beside it is discarded), rows
 * share hairlines through `divide-y` rather than a border each, no shadow, no
 * scale on hover, and the hover is an OPAQUE near-white — `hover:bg-black/[0.04]`
 * replaces the background rather than tinting it and washes green on this page's
 * mint ground.
 */

/*
 * ⚠️ "Under £10" is the platform's OWN label for that band
 * (`DiscoveryService::PRICE_BANDS`), and Discover already prints it. The band is
 * decided in GBP-equivalent server-side, so the figure is the rule rather than a
 * conversion of the reader's own currency — restating it in different words here
 * would be a second, drifting name for one filter.
 */
const STOPS = [
    {
        href: "/discover",
        icon: Compass,
        title: "Discover",
        line: "Everything on sale, from every creator.",
        tint: "bg-[#A2E4B8]",
    },
    {
        href: "/discover?priceBand=under10",
        icon: Tag,
        title: "Under £10",
        line: "The cheapest way to unlock something today.",
        tint: "bg-[#E6EA7B]",
    },
    {
        href: "/leaderboard",
        icon: Trophy,
        title: "Leaderboard",
        line: "Which creators are climbing this week.",
        tint: "bg-[#FF007F]",
    },
];

export default function ExploreNext() {
    return (
        <section
            aria-labelledby="explore-next-heading"
            className="overflow-hidden rounded-box border border-black/10 bg-white md:border-2 md:border-black"
        >
            <div className="px-4 pb-3 pt-4 sm:px-5">
                <h2
                    id="explore-next-heading"
                    className="font-poppins text-[15px] font-bold text-black"
                >
                    Have a look around
                </h2>
            </div>

            <div className="divide-y divide-black/10 border-t border-black/10">
                {STOPS.map(({ href, icon: Icon, title, line, tint }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-start gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-[#F4F4F5] motion-reduce:transition-none sm:px-5"
                    >
                        {/* Black glyph on every tint — the house rule for brand
                            pink (white is 3.78:1 and fails AA) applied to all
                            three so the set reads as one control. */}
                        <span
                            aria-hidden
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-box-xs border border-black ${tint} text-black`}
                        >
                            <Icon size={17} strokeWidth={2.25} />
                        </span>

                        <span className="min-w-0">
                            <span className="block font-poppins text-[14px] font-bold leading-[1.3] text-black">
                                {title}
                            </span>
                            {/* ⚠️ `leading-N` is PIXELS in this project — a ratio,
                                never a number. */}
                            <span className="mt-0.5 block font-poppins text-[12.5px] leading-[1.45] text-black/60">
                                {line}
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
