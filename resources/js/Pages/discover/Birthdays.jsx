import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";

/**
 * Discovery Phase 4 — the "Birthdays This Week" collection on Discover.
 *
 * 🚨 THE BIRTH YEAR IS NEVER DISPLAYED. A card prints `birthday_label`, which
 * the server builds from day and month only — the year is not selected from the
 * database and is not in these props. Never add a date field to this component.
 *
 * 🚨 CREATOR EARNINGS ARE NEVER SHOWN. A card carries an image, a display name,
 * an @username, one short line and "View profile" — the five things the brief
 * names, plus the day-and-month birthday. The server sends no figure, so there
 * is nothing here to render even by accident, and nothing money-shaped may be
 * added.
 *
 * 🚨 EVERY CARD IS DISCOVERY-TAGGED. `creator.url` arrives already carrying
 * `?sp_d=birthdays-this-week`, built server-side by `DiscoverySources::profileUrl()`
 * so this page and the Monday e-mail tag identically. An untagged link here is a
 * placement that never appears in any creator's numbers, and there is no
 * backfill for it.
 *
 * ⚠️ `ready === false` is the brief's greyed "Coming soon" state, shown until
 * enough opted-in creators exist. It is a DESIGNED state, not an error — the
 * feature is already advertised as COMING SOON on three marketing pages, so this
 * page must always answer.
 *
 * ⚠️ House rules this file follows deliberately: no shadow anywhere (the build
 * fails on one), no scale/rotate on hover or tap, radius only through
 * `rounded-box` / `-sm` / `-xs`, and `border-2 border-[#000]` rather than
 * `border-black` — the project redefines `.border-black` as a full
 * `border: 2px solid` shorthand, so pairing it with a width class silently
 * discards the width. `leading-*` is a RATIO, never a number: numeric
 * `leading-N` is PIXELS in this project.
 */

function CreatorCard({ creator }) {
    return (
        <Link
            href={creator.url || `/${creator.username}`}
            aria-label={`View ${creator.name}'s profile`}
            /* Hover is a background change only — no lift, no scale. */
            className="group flex h-full flex-col overflow-hidden rounded-box-sm border-2 border-[#000] bg-white transition-colors duration-200 hover:bg-black/[0.04] motion-reduce:transition-none"
        >
            <div className="relative h-[104px] w-full overflow-hidden border-b-2 border-[#000] bg-[#A2E4B8]">
                {creator.cover_url ? (
                    <img
                        src={creator.cover_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-[1.08] motion-reduce:transition-none"
                    />
                ) : (
                    /* No cover is a designed state, not a broken one. */
                    <div className="h-full w-full bg-gradient-to-br from-[#A2E4B8] to-[#E6EA7B]" />
                )}

                {/* 🚨 Day and month. There is no year in these props.
                    Black on brand pink: white on #FF007F is 3.78:1 and fails AA,
                    black is 5.56:1 — the house rule in both apps. */}
                {creator.birthday_label ? (
                    <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border-2 border-[#000] bg-[#FF007F] px-3 py-1 font-poppins text-[11px] font-semibold uppercase tracking-[0.12em] text-black">
                        {creator.birthday_label}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="-mt-10 mb-3">
                    {/* Plain img, not the shared Avatar component: Avatar pins
                        itself to 60px through an injected stylesheet and nests
                        height-less wrappers, which collapses inside a card this
                        size. The server only ever sends an APPROVED avatar. */}
                    <img
                        src={creator.avatar_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-full border-2 border-[#000] bg-white object-cover"
                    />
                </div>

                {/* `truncate` must keep the value recoverable — a name cut at the
                    card edge with no `title` is simply lost. */}
                <h3
                    title={creator.name}
                    className="truncate font-gulfs text-[17px] uppercase leading-[1.15] tracking-wide text-black"
                >
                    {creator.name}
                </h3>
                <p
                    title={`@${creator.username}`}
                    className="mt-0.5 truncate font-poppins text-xs text-black/60"
                >
                    @{creator.username}
                </p>

                {creator.line ? (
                    <p className="mt-2 line-clamp-2 font-poppins text-[13px] leading-[1.5] text-black/70">
                        {creator.line}
                    </p>
                ) : null}

                <span className="mt-auto flex items-center gap-1.5 pt-4 font-poppins text-[13px] font-semibold uppercase tracking-[0.08em] text-black">
                    View profile
                    <span
                        aria-hidden
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                    >
                        →
                    </span>
                </span>
            </div>
        </Link>
    );
}

/**
 * The greyed state the brief asks for.
 *
 * ⚠️ Dashed edge and no colour fill — the house signal for "announced, not
 * built", the same device the stablecoin Tip block uses. It says plainly what is
 * missing rather than rendering an empty grid, because a heading over nothing is
 * a dead end wearing a title.
 */
function ComingSoonTile({ needed }) {
    return (
        <div className="rounded-box border-2 border-dashed border-black/40 bg-black/[0.03] p-8 text-center md:p-12">
            <div
                aria-hidden
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-black/40 text-2xl grayscale"
            >
                🎂
            </div>

            <h2 className="font-gulfs text-xl uppercase leading-[1.1] tracking-tight text-black/70 md:text-2xl">
                Coming soon
            </h2>

            <p className="mx-auto mt-3 max-w-md font-poppins text-sm leading-[1.55] text-black/55">
                Creators are still adding their birthdays. Once enough have
                opted in, this collection fills up with everyone celebrating
                that week.
                {needed > 0 ? (
                    <>
                        {" "}
                        <span className="whitespace-nowrap">
                            {needed} more to go.
                        </span>
                    </>
                ) : null}
            </p>
        </div>
    );
}

export default function Birthdays({
    auth,
    user,
    creators = [],
    ready = false,
    weekLabel = "",
    needed = 0,
    discoverUrl = "/discover",
}) {
    return (
        /* ⚠️ `AuthenticatedLayout` reads `auth` from its PROPS, not from
           `usePage()` — Header and Footer are handed it directly — so it has to
           be passed through. Omitting it renders a signed-in visitor a
           logged-out header on a page they reached while logged in. This page is
           public, exactly like /discover, and the layout handles a null auth. */
        <Authenticated auth={auth} user={user}>
            <Head title="Birthdays This Week" />

            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
                <div className="rounded-box border-2 border-[#000] bg-white p-5 md:p-8">
                    <div className="mb-6 md:mb-8">
                        <span className="inline-block rounded-full border-2 border-[#000] bg-[#E6EA7B] px-3 py-1 font-poppins text-[11px] font-semibold uppercase tracking-[0.12em] text-black">
                            Discover
                        </span>

                        <h1 className="mt-3 font-gulfs text-3xl uppercase leading-[1.05] tracking-tight text-black md:text-4xl">
                            Birthdays this week
                        </h1>

                        {/* 🚨 A day-and-month range. Never a year. */}
                        <p className="mt-2 font-poppins text-sm leading-[1.55] text-black/60">
                            {weekLabel
                                ? `Creators celebrating between ${weekLabel}. `
                                : "Creators celebrating this week. "}
                            Have a look at what they have published.
                        </p>
                    </div>

                    {ready ? (
                        /* One column on a phone so the cards stack cleanly. */
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {creators.map((c) => (
                                <CreatorCard key={c.username} creator={c} />
                            ))}
                        </div>
                    ) : (
                        <ComingSoonTile needed={needed} />
                    )}

                    <div className="mt-8 border-t-2 border-black/10 pt-6">
                        <Link
                            href={discoverUrl}
                            className="inline-flex items-center gap-1.5 font-poppins text-[13px] font-semibold uppercase tracking-[0.08em] text-black transition-opacity duration-200 hover:opacity-70"
                        >
                            Browse all of Discover
                            <span aria-hidden>→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
