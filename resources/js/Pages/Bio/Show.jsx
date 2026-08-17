import { Head, Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import VerifiedBadge from "@/Components/VerifiedBadge";
import {
    STABLECOIN_COPY,
    STABLECOIN_TIPS_ANNOUNCED,
    STABLECOIN_TIPS_LIVE,
} from "@/constants/stablecoinTips";

/**
 * The public link-in-bio page — `/{username}/bio`.
 *
 * 🚨 IT RENDERS NO LAYOUT, DELIBERATELY. This is the page a creator puts in an
 * Instagram bio, so its whole job is to open instantly on a phone and answer
 * "what can I get from this person" in one screen. AuthenticatedLayout mounts
 * the header, the bottom bar and the toaster — app chrome, for someone already
 * inside the app, which is not who arrives here.
 *
 * 🚨 EVERY BUTTON GOES SOMEWHERE THAT ALREADY EXISTS. Internal links land on
 * profile pages that are already gated; external ones leave through the counting
 * redirect, which rebuilds its destination server-side. There is no checkout, no
 * price and no payment method on this page, and adding one would make it a new
 * Stripe surface rather than a layout change.
 *
 * ── Design ────────────────────────────────────────────────────────────────
 *
 * 🚨 THE LINKS ARE ONE BLOCK, NOT A STACK OF PILLS. A column of identical
 * floating buttons on a coloured ground is Linktree, and it says nothing about
 * a platform where every one of those buttons has a product behind it. The rows
 * ABUT inside a single black frame and share hairlines — the platform's own
 * device (`WaysToGetPaid`, `StatStrip`), whose docblock gives the reason: many
 * sources, one income. Here: many ways in, one creator.
 *
 * ⚠️ THE HAIRLINE IS THE PAGE'S OWN GREEN, not black — `gap-px` over an
 * `#A2E4B8` parent. A black rule would read as a table; the ground showing
 * through makes the block belong to this page rather than sit on it.
 *
 * ⚠️ THE TWO GROUPS ENCODE A REAL DIFFERENCE — on-platform costs money,
 * off-platform does not — and that is the only thing a visitor needs to sort by.
 * ONE accent per group, never per row: pink carries the paid group because pink
 * is this platform's money colour, and the external group carries no accent at
 * all. That restraint IS the hierarchy.
 *
 * ⚠️ NO ENTRANCE ANIMATION. The page is opened from a social app on whatever
 * connection the visitor has, and staggering the content delays the one thing it
 * exists to show. The single animated moment is the featured pot's progress bar,
 * because that is the number with momentum and the reason the tile converts.
 */
export default function BioShow({
    creator,
    links = [],
    featured = null,
    bioUrl,
    isOwner = false,
    stats = null,
}) {
    const [showQr, setShowQr] = useState(false);
    const [copied, setCopied] = useState(false);

    const internal = links.filter((l) => l.kind !== "external");
    const external = links.filter((l) => l.kind === "external");

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(bioUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard is blocked in plenty of contexts. The QR and the address
            // are both still on screen, so failing quietly is honest — an error
            // here would be about the browser, not the page.
        }
    };

    const share = async () => {
        // The OS share sheet is how sharing actually happens on a phone, and the
        // only route to Instagram, Messages and Signal. Copy is the fallback.
        if (navigator.share) {
            try {
                await navigator.share({ title: creator.name, url: bioUrl });
                return;
            } catch {
                /* dismissed — not an error */
            }
        }
        copyLink();
    };

    const nothingToShow = links.length === 0 && !featured;

    return (
        <>
            <Head title={`${creator.name || creator.username} — links`} />

            <div className="min-h-dvh bg-fixed bg-[#A2E4B8] px-4 pb-14 pt-9">
                <main className="mx-auto w-full max-w-[520px]">
                    <Header creator={creator} />

                    {featured ? <Featured item={featured} /> : null}

                    {internal.length > 0 ? (
                        <LinkGroup
                            eyebrow="Get my content"
                            accent="#FF007F"
                            links={internal}
                            isOwner={isOwner}
                        />
                    ) : null}

                    {external.length > 0 ? (
                        <LinkGroup
                            eyebrow="Find me elsewhere"
                            links={external}
                            isOwner={isOwner}
                        />
                    ) : null}

                    {STABLECOIN_TIPS_ANNOUNCED ? <Stablecoin /> : null}

                    {nothingToShow ? <Empty creator={creator} /> : null}

                    <Tools
                        bioUrl={bioUrl}
                        showQr={showQr}
                        setShowQr={setShowQr}
                        copied={copied}
                        copyLink={copyLink}
                        share={share}
                    />

                    {isOwner ? <OwnerBar stats={stats} /> : null}

                    <Footer creator={creator} />
                </main>
            </div>
        </>
    );
}

/**
 * ⚠️ The avatar is a SQUIRCLE, not a circle. `rounded-box-sm` is the house
 * avatar shape (the leaderboard uses it for the same reason) and a circular
 * avatar over a stack of links is the one shape that would make this page
 * indistinguishable from every other link-in-bio.
 */
function Header({ creator }) {
    return (
        <header className="text-center">
            {/*
                ⚠️ Arbitrary sizing: this project remaps the numeric spacing
                scale, so `h-24` is not a size you can predict from the class
                name. Comment sits here, not between the attributes — `/* *​/`
                in JSX attribute position is a syntax error.
            */}
            {creator.avatar_url ? (
                <img
                    src={creator.avatar_url}
                    alt=""
                    width={92}
                    height={92}
                    className="mx-auto h-[92px] w-[92px] rounded-box-sm border-[3px] border-[#000] object-cover"
                />
            ) : null}

            <h1 className="mt-4 flex items-center justify-center gap-2 font-gulfs text-[30px] uppercase leading-[1.02] tracking-tight text-black">
                {creator.name || creator.username}
                <VerifiedBadge tier={creator.verified_badge} founder={creator.is_founder} />
            </h1>

            {/*
                ⚠️ The handle is the BODY face, not `gulfs`. Set in the display
                face it reads as a smaller copy of the name directly above it
                rather than as a different kind of information.
            */}
            <p className="mt-1.5 font-poppins text-[14px] leading-[1.4] text-black/55">
                @{creator.username}
            </p>

            {creator.bio ? (
                <p className="mx-auto mt-3 max-w-[38ch] font-poppins text-[14px] leading-[1.6] text-black/75">
                    {creator.bio}
                </p>
            ) : null}
        </header>
    );
}

/**
 * The pinned item — the one thing on the page with momentum.
 *
 * ⚠️ The target is progress CONTEXT, never a fundraising goal: a pot is a
 * content product and its deliverable is what is bought. `percent` is null when
 * no target is set, and a null bar is omitted rather than drawn at 0 — "no goal"
 * and "nobody has bought" are different things and a 0% bar states the second.
 */
function Featured({ item }) {
    const target = item.percent ?? 0;

    // ⚠️ Read `prefers-reduced-motion` in the INITIAL state, never in an effect.
    // Defaulting to 0 and correcting afterwards makes the bar visibly jump for
    // someone who asked for no motion — the documented `useIsDesktop` trap.
    const [width, setWidth] = useState(() =>
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            ? target
            : 0,
    );

    useEffect(() => {
        const id = requestAnimationFrame(() => setWidth(target));

        return () => cancelAnimationFrame(id);
    }, [target]);

    return (
        <Link
            href={item.url}
            className="mt-7 block overflow-hidden rounded-box border-[3px] border-[#000] bg-white transition-[filter] duration-200 hover:brightness-[1.04] active:brightness-95"
        >
            {item.image ? (
                <img
                    src={item.image}
                    alt=""
                    className="h-44 w-full border-b-[3px] border-[#000] object-cover"
                    loading="lazy"
                />
            ) : null}

            <div className="p-4">
                <span className="inline-block rounded-box-xs bg-[#FF007F] px-2 py-1 font-gulfs text-[10px] uppercase tracking-[0.18em] text-black">
                    Open now
                </span>

                <p className="mt-2.5 font-gulfs text-[20px] uppercase leading-[1.1] text-black">
                    {item.title}
                </p>

                {item.percent !== null ? (
                    <div className="mt-3.5">
                        <div className="h-4 w-full overflow-hidden rounded-box-xs border-2 border-[#000] bg-white">
                            <div
                                className="h-full bg-[#FF007F] transition-[width] duration-700 ease-out motion-reduce:transition-none"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                        {/*
                            ⚠️ Zero is an INVITATION, not a report. "0% of the
                            way there" states a failure nobody caused yet, on
                            the tile whose whole job is to be the first thing
                            someone buys.
                        */}
                        <p className="mt-1.5 font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/55">
                            {item.percent === 0
                                ? "Be the first"
                                : `${item.percent}% of the way there`}
                        </p>
                    </div>
                ) : null}
            </div>
        </Link>
    );
}

/**
 * 🚨 ONE FRAME, ROWS ABUTTING. See the page docblock — this is the platform's
 * own grouping device and it is what stops the page reading as a link list.
 *
 * ⚠️ The hairline is `gap-px` over the green parent. Do NOT give each row its
 * own border: adjacent borders double up and need a per-position reset at every
 * breakpoint, which is the mistake this device exists to avoid.
 */
function LinkGroup({ eyebrow, accent, links, isOwner }) {
    return (
        <section className="mt-7">
            <div className="mb-2.5 flex items-center gap-2.5 px-1">
                <span className="font-gulfs text-[11px] uppercase tracking-[0.22em] text-black/60">
                    {eyebrow}
                </span>
                <span
                    className="h-[3px] flex-1 rounded-full"
                    style={{ backgroundColor: accent || "rgba(0,0,0,0.18)" }}
                />
            </div>

            <div className="overflow-hidden rounded-box border-[3px] border-[#000] bg-[#A2E4B8]">
                <div className="flex flex-col gap-px">
                    {links.map((link) => (
                        <LinkRow
                            key={link.uuid || `${link.kind}-${link.target_type}`}
                            link={link}
                            accent={accent}
                            isOwner={isOwner}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * ⚠️ An INTERNAL link is a plain Inertia visit — same site, no redirect hop.
 * An EXTERNAL one goes through `/bio/go/{uuid}`, which counts the click and then
 * rebuilds the destination from the stored platform and handle. The href is
 * never the destination itself.
 *
 * ⚠️ The mark on the right encodes something true rather than decorating: `↗`
 * means this leaves Spenny Piggy, `→` means it stays. A visitor about to be
 * taken off the page should be told before they tap, not after.
 */
function LinkRow({ link, accent, isOwner }) {
    const external = link.kind === "external";
    const hidden = isOwner && !link.is_active;

    const className = [
        "group flex min-h-[58px] items-center gap-3 px-4 py-3.5",
        "transition-[background-color,opacity] duration-200",
        hidden
            ? "bg-white/55 text-black/45"
            : "bg-white text-black hover:bg-[#FFF3F8] active:bg-[#FFE7F2]",
    ].join(" ");

    const body = (
        <>
            <span className="min-w-0 flex-1 truncate font-gulfs text-[15px] uppercase leading-[1.2] tracking-tight">
                {link.label}
            </span>

            {hidden ? (
                <span className="shrink-0 font-poppins text-[11px] leading-[1.4] text-black/45">
                    Hidden
                </span>
            ) : null}

            <span
                aria-hidden="true"
                className="shrink-0 font-poppins text-[17px] leading-none"
                style={{ color: accent || "rgba(0,0,0,0.35)" }}
            >
                {external ? "↗" : "→"}
            </span>
        </>
    );

    if (external) {
        return (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
                {body}
            </a>
        );
    }

    return (
        <Link href={link.url} className={className}>
            {body}
        </Link>
    );
}

/**
 * 🚨 STABLECOIN TIPS IS ANNOUNCED, NOT BUILT — there is no route, no model and
 * no provider adapter. The block is deliberately inert.
 *
 * 🚨 EVERY WORD COMES FROM `constants/stablecoinTips.js` AND IS NEVER RETYPED
 * HERE. That file is the one source, it is checked against the agreed
 * specification, and it carries the switch that turns the whole thing on.
 *
 * ⚠️ NO AMOUNT AND NO DATE. The spec flags GBP-vs-USD as unresolved and the
 * build has not started, so either would publish a decision nobody has taken.
 *
 * ⚠️ THE DASHED EDGE IS THE HOUSE SIGNAL for "announced, not built" — the same
 * device the landing page uses — and it sits OUTSIDE the solid frames above so
 * it cannot be mistaken for something buyable. It also states that it settles on
 * its own rail: every other button here is a Stripe-processed content purchase
 * and this one is not, so saying so is what keeps the two from reading as one.
 */
function Stablecoin() {
    const live = STABLECOIN_TIPS_LIVE;

    return (
        <section
            className={[
                "mt-7 rounded-box px-4 py-4",
                live
                    ? "border-[3px] border-[#000] bg-[#8C52FF]"
                    : "border-2 border-dashed border-black/35 bg-white/35",
            ].join(" ")}
        >
            <div className="flex items-center justify-between gap-3">
                <span
                    className={[
                        "min-w-0 flex-1 truncate font-gulfs text-[14px] uppercase leading-[1.2] tracking-tight",
                        live ? "text-black" : "text-black/55",
                    ].join(" ")}
                >
                    {STABLECOIN_COPY.card.title}
                </span>

                <span
                    className={[
                        "shrink-0 rounded-box-xs px-2 py-1 font-gulfs text-[10px] uppercase tracking-[0.16em]",
                        live ? "bg-black text-white" : "bg-black/10 text-black/50",
                    ].join(" ")}
                >
                    {STABLECOIN_COPY.card.detail}
                </span>
            </div>

            <p
                className={[
                    "mt-2 font-poppins text-[12.5px] leading-[1.55]",
                    live ? "text-black/80" : "text-black/50",
                ].join(" ")}
            >
                {STABLECOIN_COPY.card.line}
            </p>

            <p
                className={[
                    "mt-1 font-poppins text-[11.5px] leading-[1.55]",
                    live ? "text-black/65" : "text-black/40",
                ].join(" ")}
            >
                {STABLECOIN_COPY.railNote}
            </p>
        </section>
    );
}

function Tools({ bioUrl, showQr, setShowQr, copied, copyLink, share }) {
    return (
        <section className="mt-7">
            <div className="grid grid-cols-3 gap-2">
                <ToolButton onClick={share} primary>
                    Share
                </ToolButton>
                <ToolButton onClick={copyLink}>{copied ? "Copied" : "Copy link"}</ToolButton>
                <ToolButton onClick={() => setShowQr((v) => !v)}>
                    {showQr ? "Hide QR" : "QR code"}
                </ToolButton>
            </div>

            {showQr ? (
                <div className="mt-3 rounded-box border-[3px] border-[#000] bg-white p-5 text-center">
                    {/* White ground and a quiet zone: a scanner needs both to read it at all. */}
                    <QRCodeSVG value={bioUrl} size={168} level="M" includeMargin />
                    <p className="mt-2 break-all font-poppins text-[12px] leading-[1.5] text-black/55">
                        {bioUrl}
                    </p>
                </div>
            ) : null}
        </section>
    );
}

/** ⚠️ Black on pink, never white — 5.56:1 against white's 3.78:1. */
function ToolButton({ onClick, primary, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "min-h-[46px] rounded-box-sm border-[3px] border-[#000] px-2",
                "font-gulfs text-[11px] uppercase tracking-[0.14em] text-black",
                "transition-[filter,background-color] duration-200 hover:brightness-110 active:brightness-95",
                primary ? "bg-[#FF007F]" : "bg-white",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

/**
 * ⚠️ Owner only. A visitor has no business reading a creator's reach, and the
 * server sends `stats` as null for anyone else — this never guards it alone.
 */
function OwnerBar({ stats }) {
    return (
        <section className="mt-7 rounded-box border-[3px] border-[#000] bg-[#E6EA7B] px-4 py-3.5">
            <p className="font-poppins text-[13px] leading-[1.55] text-black/75">
                Only you can see this.
                {stats ? (
                    <>
                        {" "}
                        <span className="font-semibold text-black">
                            {stats.views} {stats.views === 1 ? "view" : "views"}
                        </span>{" "}
                        so far.
                    </>
                ) : null}
            </p>
            <Link
                href={route("bio.edit")}
                className="mt-2 inline-block font-gulfs text-[12px] uppercase tracking-[0.14em] text-black underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
            >
                Edit this page
            </Link>
        </section>
    );
}

/** An empty screen is an invitation to act, not a dead end. */
function Empty({ creator }) {
    return (
        <section className="mt-7 rounded-box border-2 border-dashed border-black/35 px-5 py-9 text-center">
            <p className="font-gulfs text-[15px] uppercase leading-[1.2] text-black/60">
                Nothing on sale yet
            </p>
            <Link
                href={creator.profile_url}
                className="mt-3 inline-block font-gulfs text-[12px] uppercase tracking-[0.14em] text-black underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
            >
                See their profile
            </Link>
        </section>
    );
}

function Footer({ creator }) {
    return (
        <footer className="mt-9 text-center">
            {/*
                ⚠️ 44px comes from PADDING, not from the type size — a text link
                small enough to look quiet and small enough to miss is worse than
                no link. Same device the account page's switches use.
            */}
            <Link
                href={creator.profile_url}
                className="inline-flex min-h-[44px] items-center px-4 font-gulfs text-[12px] uppercase tracking-[0.16em] text-black/70 underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
            >
                Full profile
            </Link>
            <p className="mt-3.5 font-gulfs text-[10px] uppercase tracking-[0.24em] text-black/35">
                Spenny Piggy
            </p>
        </footer>
    );
}
