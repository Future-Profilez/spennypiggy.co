import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import {
    AlertCircle,
    Check,
    ChevronRight,
    ClipboardList,
    Crown,
    Gift,
    Newspaper,
    PiggyBank,
    RefreshCw,
    ShoppingBag,
    Sparkles,
    X,
} from "lucide-react";
import {
    FaDiscord,
    FaInstagram,
    FaLink,
    FaSpotify,
    FaTiktok,
    FaTwitch,
    FaXTwitter,
    FaYoutube,
} from "react-icons/fa6";
import VerifiedBadge from "@/Components/VerifiedBadge";
import { BIO_TIP_COPY } from "@/constants/bioTip";
import { bioThemeVars } from "@/constants/bioThemes";
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
 * 🚨 THIS PAGE SELLS, AND IT STILL CONTAINS NO CHECKOUT. (Superseded 21 Aug 2026
 * — this docblock previously said "there is no checkout, no price and no payment
 * method on this page", which was true until the B stream and is not any more.)
 * An item card shows a LISTED price and leads, in one tap, to the buying path
 * that listing already had on the main site: `/bio/buy/{uuid}` counts the click,
 * stamps the visitor as `bio-link`, and redirects to a checkout rebuilt
 * server-side from the stored row. There is still no payment form, no price
 * calculation and no payment-method choice in this file, and adding one would
 * make it a second checkout rather than a second way in to the first.
 *
 * 🚨 THE PRICE ON A CARD IS THE CREATOR'S LISTED PRICE, NOT THE SUPPORTER'S
 * TOTAL. What a supporter pays is grossed up per fee profile by
 * `Helpers::calculateStripeDirectChargeFlow` at the checkout, once. Never
 * compute, adjust or "estimate" a price in this file — the page and the checkout
 * would print different numbers on the one screen a creator shares everywhere.
 *
 * 🚨 EVERY OTHER BUTTON GOES SOMEWHERE THAT ALREADY EXISTS. Internal links land
 * on profile pages that are already gated; external ones leave through the
 * counting redirect, which rebuilds its destination server-side.
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
 * ⚠️ THREE RADII, AND EVERY CORNER IS ONE OF THEM. `rounded-box` (24/30px) is
 * for things that CONTAIN other things — the featured card, the item block, the
 * QR panel, the owner and empty panels. `rounded-box-sm` (16/20px) is for what
 * sits inside one: avatar, thumbnails, link tiles, buttons, CTA pills, and the
 * announced-tip strip, which is an alert ROW and not a panel however wide it
 * looks. `rounded-box-xs` (10/12px) is badges and progress bars. The bars were
 * the last `rounded-full` on the page apart from the circular social chips, and
 * a pill bar beside a 10px badge is exactly the mixed-radius look the house
 * tokens exist to stop. ⚠️ Never hardcode a pixel radius here — the tokens are
 * responsive (`resources/css/theme.css`) and a fixed number breaks at one width
 * or the other.
 *
 * ⚠️ EVERY LINE ON THIS PAGE IS 2px (14 Aug 2026 house rule, tightened here
 * 20 Aug 2026). It was 3px on the frames and 2px on the controls, which is a
 * difference nobody reads as hierarchy and everybody reads as inconsistency —
 * on a phone-width page, a 3px frame around a 2px frame is just a thicker blob.
 * Depth is border COLOUR and SPACE, never weight. ⚠️ Do NOT write it as
 * `border-2 border-black`: `resources/css/index.css` defines `.border-black` as
 * a full `border` SHORTHAND, which silently overwrites the width. Every border
 * here is `border border-[#000]`.
 *
 * ⚠️ THE HEADER IS A CARD, NOT LOOSE TYPE ON THE GROUND. The name, handle and
 * bio sat directly on the green while everything below them was framed, so the
 * one block naming the creator was the only unstructured thing on the page. The
 * avatar overlaps the card's top edge, which is what keeps it from reading as a
 * fourth stacked frame.
 *
 * ⚠️ THE TWO GROUPS ENCODE A REAL DIFFERENCE — on-platform costs money,
 * off-platform does not — and that is the only thing a visitor needs to sort by.
 * ONE accent per group, never per row: pink carries the paid group because pink
 * is this platform's money colour, and the external group carries no accent at
 * all. That restraint IS the hierarchy.
 *
 * ⚠️ THE OFF-PLATFORM GROUP IS A ROW OF MARKS, NOT ROWS — see `SocialStrip`.
 * The one-frame device below applies to the PAID group; seven social accounts
 * rendered at full row width outweighed the things that earn money.
 *
 * ⚠️ NO ENTRANCE ANIMATION. The page is opened from a social app on whatever
 * connection the visitor has, and staggering the content delays the one thing it
 * exists to show. The single animated moment is the featured pot's progress bar,
 * because that is the number with momentum and the reason the tile converts.
 */
export default function BioShow({
    creator,
    links = [],
    items = [],
    featured = null,
    tip = null,
    bioUrl,
    isOwner = false,
    stats = null,
    theme = null,
    itemLayout = null,
}) {
    const [showQr, setShowQr] = useState(false);
    const [copied, setCopied] = useState(false);

    /*
        🚨 THIS PAGE HAD NO WAY TO SHOW A REFUSAL, AND EVERY BUY PATH ANSWERS
        WITH ONE. `buyLevel`, `buyBill`, `TaskController::purchase` and the shop
        checkout all end their guard clauses in `redirect()->back()->with('error',
        …)` — "You can't buy your own membership", "this tier is awaiting review",
        "the creator has paused payments", the login gate. Every one of those
        lands back HERE, and this page deliberately mounts no layout, so it
        mounted no toaster either: the supporter tapped a button, the page
        reloaded unchanged, and the reason was thrown away. That is the whole of
        "the button does nothing".

        ⚠️ Read from `usePage()`, not from a page prop — `flash` is a SHARED prop
        (`HandleInertiaRequests`) pulled from the session, so it arrives once, on
        the response that follows the redirect, and only then.
    */
    const flash = usePage().props?.flash || {};
    const notice = flash.error || flash.warning || flash.success || null;
    const noticeIsError = Boolean(flash.error || flash.warning);

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

    /*
        🚨 "NOTHING TO SELL" IS NOT "NOTHING ON THE PAGE". This asked for links,
        items AND the pot to be empty, and the internal buttons are derived — a
        creator with a single post has seven of them — so the one creator who
        genuinely had nothing buyable got a tidy navigation list and no prompt at
        all. A supporter who followed a link expecting to buy something needs to
        be told there is nothing yet, and the creator needs to be told to add
        something. It is now keyed on the sellable things only.
    */
    const nothingToSell = items.length === 0 && !featured;

    return (
        <>
            <Head title={`${creator.name || creator.username} — links`} />

            {/*
                🚨 BLACK GROUND, AND THE FRAMES ARE GONE WITH IT (20 Aug 2026,
                client direction). The page was mint with a black 2px outline
                around every block — and outlines on a pale ground are what made
                it read as a form rather than a shopfront. Depth is now SOLID
                FILL and SPACE: near-black page, one raised surface (#151515) for
                anything you can tap, hairlines only INSIDE a surface. The house
                rule that produced the outlines (border weight → colour → space)
                is unchanged; this is the third of its three tools, which this
                page had never used.

                ⚠️ Black is also what makes the creator's own pictures the
                loudest thing here. On mint, every cover and every product photo
                sat inside a competing colour.
            */}
            {/*
                🚨 THE TOP SPACING LIVES ON THE SHELL, NEVER ON THE HERO. A
                `mt` on the first child COLLAPSES THROUGH this container, so the
                shell itself started 20px down the page — and `html`/`body` are
                BLACK in this app's stylesheet, so that gap rendered as a black
                band across the top of the page on desktop. Padding does not
                collapse.
            */}
            <div
                className="min-h-dvh bg-[color:var(--bio-ground)] pb-16 md:pt-5"
                style={bioThemeVars(theme)}
            >
                <main className="mx-auto w-full max-w-[520px]">
                    <Notice message={notice} isError={noticeIsError} />

                    <Header
                        creator={creator}
                        social={external}
                        isOwner={isOwner}
                    />

                    {isOwner ? (
                        <OwnerBar
                            stats={stats}
                            featuredClicks={featured?.clicks || 0}
                        />
                    ) : null}

                    {featured ? <Featured item={featured} /> : null}

                    {/*
                        🚨 The items come FIRST, above every link. The whole
                        argument for switching to this page is that the thing a
                        supporter wants to buy is on the first screen they land
                        on — a card under a list of buttons is the four-tap
                        journey the brief exists to remove.
                    */}
                    {items.length > 0 ? (
                        <ItemList
                            items={items}
                            isOwner={isOwner}
                            layout={itemLayout}
                        />
                    ) : null}

                    {internal.length > 0 ? (
                        <LinkGroup
                            eyebrow="Get my content"
                            links={internal}
                            isOwner={isOwner}
                        />
                    ) : null}

                    {STABLECOIN_TIPS_ANNOUNCED ? (
                        <Stablecoin tip={tip} />
                    ) : null}

                    {nothingToSell ? (
                        <Empty creator={creator} isOwner={isOwner} />
                    ) : null}

                    <Tools
                        bioUrl={bioUrl}
                        showQr={showQr}
                        setShowQr={setShowQr}
                        copied={copied}
                        copyLink={copyLink}
                        share={share}
                    />

                    <Footer creator={creator} />
                </main>
            </div>
        </>
    );
}

/**
 * The refusal, and the confirmation — the only thing on this page that speaks
 * back to a tap.
 *
 * 🚨 IT FLOATS OVER THE PAGE, IT IS NOT A BAR ABOVE IT. Rendered in the flow it
 * pushed the whole hero down and sat above a full-bleed cover as a strip bolted
 * to the top of the design — the page's first impression became an error box.
 * Fixed and centred, the layout underneath never moves, so a supporter who
 * reads it and dismisses it is looking at exactly the page they were on.
 *
 * ⚠️ IT DISMISSES ITSELF, AND IT CAN BE DISMISSED. `flash` arrives once per
 * response, so a notice that never left would still be on screen while the
 * person scrolled a page it no longer describes. Eight seconds is long enough
 * to read two lines; the close button is for everyone who read it in two.
 *
 * ⚠️ `role="status"`, not `alert`: this is the result of something the person
 * just did, and `alert` interrupts a screen reader mid-sentence. The timer
 * respects `prefers-reduced-motion` only in the FADE, never in the timing — a
 * message that vanishes without warning is worse than one that fades.
 */
function Notice({ message, isError }) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (!message) return undefined;

        // A frame before the class flips, or the entry transition never runs.
        const raf = requestAnimationFrame(() => setShown(true));
        const hide = setTimeout(() => setShown(false), 8000);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(hide);
        };
    }, [message]);

    if (!message) return null;

    return (
        <div
            role="status"
            className={[
                "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4",
                "transition-opacity duration-300 motion-reduce:transition-none",
                shown ? "opacity-100" : "opacity-0",
            ].join(" ")}
        >
            <div
                className={[
                    "pointer-events-auto flex w-full max-w-[420px] items-start gap-3",
                    "rounded-box-sm border border-[#000] px-4 py-3",
                    isError ? "bg-[#FFD3E8]" : "bg-[#A2E4B8]",
                ].join(" ")}
            >
                <span
                    aria-hidden="true"
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#000] bg-white"
                >
                    {isError ? (
                        <AlertCircle size={13} strokeWidth={2.5} />
                    ) : (
                        <Check size={13} strokeWidth={3} />
                    )}
                </span>

                <p className="min-w-0 flex-1 font-poppins text-[13px] leading-[1.45] text-black">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={() => setShown(false)}
                    aria-label="Dismiss"
                    className="-mr-1 -mt-1 shrink-0 p-1 text-black/50 transition-opacity duration-200 hover:opacity-60"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

/**
 * The hero — ONE CARD THAT INTRODUCES A PERSON, not a centred avatar floating
 * on a coloured ground.
 *
 * 🚨 IT IS LEFT-ALIGNED AND PHOTO-LED, which is the single biggest thing
 * separating this from a link list. Every reference the client sent leads with
 * the creator at size — a cover photo bled to the edges with the name over or
 * under it — and every one of them centres nothing. A centred circle above a
 * stack of buttons IS the Linktree layout; it is what a visitor has already
 * seen a hundred times, and it says the page is a menu rather than a shopfront.
 *
 * ⚠️ THE COVER IS OPTIONAL AND THE CARD MUST LOOK FINISHED WITHOUT IT. Most
 * creators have no cover approved, so the no-cover branch is the DEFAULT case,
 * not the fallback: the card simply starts at the avatar row with the mint
 * ground showing through, and nothing is left hanging where a band would be.
 *
 * ⚠️ Both images are approval-gated in `User` (`avatar_url` / `cover_url` return
 * null for an unreviewed upload to everyone but the owner). Nothing here checks
 * moderation again — and nothing here may bypass it.
 *
 * ⚠️ The avatar stays a SQUIRCLE. `rounded-box-sm` is the house avatar shape
 * (the leaderboard uses it for the same reason) and a circular avatar over a
 * stack of links is the one shape that would make this page indistinguishable
 * from every other link-in-bio.
 */
function Header({ creator, social = [], isOwner }) {
    const hasCover = Boolean(creator.cover_url);

    return (
        /*
            🚨 THE COVER IS FRAMED, NOT BLED (20 Aug 2026, after three passes at
            blending it). A bled cover has to dissolve into the page, and a
            creator's cover is usually a dark banner — faded into a cream ground
            it goes grey and muddy at exactly the size it is most visible, and no
            amount of mask tuning fixes an image that is fighting the ground. In
            a frame it is simply the picture the creator uploaded: full strength,
            straight edges, one hairline around it. It also matches how every
            other card on this page (and in the app) is built, which is what
            makes the page read as one thing.

            ⚠️ The avatar overlaps the seam and is the only element allowed to
            cross it. That overlap is what stops the card reading as two stacked
            rectangles.
        */
        <header className="md:mx-4 md:overflow-hidden md:rounded-box md:border md:border-[#000] md:bg-white">
            {hasCover ? (
                /*
                    🚨 TWO BEHAVIOURS, ONE MARKUP. On a PHONE the cover is
                    full-bleed and fades out of its own bottom edge — the screen
                    is the frame, and a bordered card inside a 390px viewport
                    just adds two lines nobody needed. On DESKTOP it is a framed
                    card, because a bled banner in a 520px column floating on a
                    wide cream page has three hard edges and looks like a stray
                    image.

                    ⚠️ The fade is a MASK (removes alpha) and not an overlay
                    (adds paint): a wash in the page colour turned this dark
                    cover grey. Both spellings are declared — unprefixed for
                    Chrome/Firefox, `-webkit-` for Safari and the iOS in-app
                    browsers this page is mostly opened in — and both are
                    switched OFF at `md`, where the frame does the work instead.
                */
                <div
                    className={[
                        "w-full bg-[color:var(--bio-ground)]",
                        "h-[200px] [mask-image:linear-gradient(to_bottom,#000_0%,#000_58%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_58%,transparent_100%)]",
                        "md:h-[142px] md:border-b md:border-[#000] md:[mask-image:none] md:[-webkit-mask-image:none]",
                    ].join(" ")}
                >
                    <img
                        src={creator.cover_url}
                        alt=""
                        className="h-full w-full object-cover object-center"
                    />
                </div>
            ) : null}

            <div
                className={[
                    // 🚨 `relative z-10`, and it is load-bearing on the PHONE.
                    // `mask-image` creates a stacking context, so the masked
                    // cover painted OVER this block and its own fade dimmed the
                    // top of the avatar — an overlay nobody drew. The same trap
                    // bit the earlier gradient version for the same reason.
                    "relative z-10 px-5 pb-6 text-center md:pb-5",
                    hasCover ? "pt-0" : "pt-6",
                ].join(" ")}
            >
                {creator.avatar_url ? (
                    <img
                        src={creator.avatar_url}
                        alt=""
                        width={92}
                        height={92}
                        className={[
                            "mx-auto h-[92px] w-[92px] rounded-box-sm border border-[#000] bg-white object-cover",
                            hasCover ? "-mt-[70px] md:-mt-[46px]" : "",
                        ].join(" ")}
                    />
                ) : (
                    <span
                        className={[
                            "mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-box-sm border border-[#000] bg-[color:var(--bio-cta)] text-[color:var(--bio-cta-ink)] font-gulfs text-[32px] uppercase leading-none",
                            hasCover ? "-mt-[70px] md:-mt-[46px]" : "",
                        ].join(" ")}
                    >
                        {(creator.name || creator.username || "?").charAt(0)}
                    </span>
                )}

                {/*
                    🚨 THE DISPLAY FACE IS SPENT HERE AND ALMOST NOWHERE ELSE.
                    `gulfs` caps was carrying the name, every item title, every
                    link, every button and every eyebrow, so nothing on the page
                    could be emphasised. It now sets the creator's name and the
                    small section rules; Poppins with real weights carries
                    everything a person actually reads.
                */}
                {/*
                    ⚠️ THE TICK SITS ON THE NAME'S OPTICAL CENTRE, NOT ITS TOP.
                    `items-start` on a 30px display cap floated the badge level
                    with the cap height, which reads as a stray dot beside the
                    word rather than as part of it. `items-center` on the flex
                    row plus the explicit `md` size (18px) locks it to the middle
                    of the word at any name length. ⚠️ Never size it with a
                    Tailwind text class — the component draws an SVG at a fixed
                    pixel size from its own `SIZES` map (`lg` = 24px here, which
                    is the tick reading as part of the name rather than as a
                    footnote to it).
                */}
                <h1 className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-gulfs text-[24px] uppercase leading-[1.05] tracking-tight text-[color:var(--bio-ink)] md:text-black">
                    <span className="min-w-0 break-words">
                        {creator.name || creator.username}
                    </span>
                    <VerifiedBadge
                        tier={creator.verified_badge}
                        founder={creator.is_founder}
                        size="lg"
                    />
                </h1>

                <p className="mt-1.5 font-poppins text-[13.5px] leading-[1.3] text-[color:var(--bio-ink45)] md:text-black/45">
                    @{creator.username}
                </p>

                {creator.bio ? (
                    <p className="mx-auto mt-2.5 max-w-[38ch] font-poppins text-[13.5px] leading-[1.6] text-[color:var(--bio-ink70)] md:text-black/70">
                        {creator.bio}
                    </p>
                ) : null}

                {social.length > 0 ? (
                    <SocialChips links={social} isOwner={isOwner} />
                ) : null}
            </div>
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
            className="mx-4 mt-8 block overflow-hidden rounded-box border border-[#000] bg-white transition-[background-color] duration-200 hover:bg-[#FFF3F8] active:brightness-[0.98]"
        >
            {item.image ? (
                <img
                    src={item.image}
                    alt=""
                    className="h-48 w-full object-cover"
                    loading="lazy"
                />
            ) : null}

            <div className="p-4">
                <span className="inline-block rounded-box-xs border border-[#000] bg-[color:var(--bio-cta)] text-[color:var(--bio-cta-ink)] px-2 py-1 font-gulfs text-[10px] uppercase tracking-[0.18em]">
                    Open now
                </span>

                <p className="mt-3 font-poppins text-[19px] font-bold leading-[1.2] text-black">
                    {item.title}
                </p>

                {item.percent !== null ? (
                    <div className="mt-4">
                        {/*
                            ⚠️ MINT IS THE PROGRESS COLOUR, PINK IS THE MONEY
                            COLOUR. They were the same, so a full bar and a buy
                            button competed. Mint also survives the dark ground,
                            which the old white track did not.
                        */}
                        <div className="h-3 w-full overflow-hidden rounded-box-xs border border-[#000] bg-white">
                            <div
                                className="h-full bg-[#A2E4B8] transition-[width] duration-700 ease-out motion-reduce:transition-none"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                        {/*
                            ⚠️ Zero is an INVITATION, not a report. "0% of the
                            way there" states a failure nobody caused yet, on
                            the tile whose whole job is to be the first thing
                            someone buys.
                        */}
                        <p className="mt-2 font-poppins text-[12px] leading-[1.4] text-black/50">
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
 * ⚠️ THE LISTED PRICE, FORMATTED — NEVER CALCULATED. `Intl` puts the right
 * symbol on the number the creator set; nothing here adds a fee, a tax or a
 * gross-up. What the supporter pays is produced once, at the checkout, by
 * `Helpers::calculateStripeDirectChargeFlow`.
 */
/**
 * The cover a listing draws when it has none of its own — the module's mark on
 * the same tint its link tile carries, so a card with no photo still belongs to
 * this page instead of looking broken.
 */
const ITEM_MARKS = {
    membership: Crown,
    task: ClipboardList,
    bill: RefreshCw,
    shop: ShoppingBag,
    wish: Gift,
    piggy_pot: PiggyBank,
};

const ITEM_TINTS = {
    membership: "#C9B6FF",
    task: "#A2E4B8",
    bill: "#C9B6FF",
    shop: "#E6EA7B",
    wish: "#A2E4B8",
    piggy_pot: "#FFD3E8",
};

function ItemMark({ type }) {
    const Mark = ITEM_MARKS[type] || Sparkles;

    return (
        <Mark
            aria-hidden="true"
            className="h-[26px] w-[26px] text-black/70"
            strokeWidth={2}
        />
    );
}

const money = (value, currency) =>
    new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: (currency || "GBP").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

/**
 * The things this creator sells — the reason to switch to this page.
 *
 * 🚨 A PRODUCT ROW, NOT A TILE IN A GRID. The two-column grid gave each listing
 * a 126px thumbnail, a truncated title and a price squeezed under it, which is
 * how you lay out a catalogue nobody is expected to read. Every commerce
 * reference the client sent lays a purchase out the same way instead — picture
 * left, what it is and what it costs beside it, one unmistakable button — and
 * that is also what a supporter arriving from a story needs: not twelve options
 * scanned at speed, but one they can act on. Measured: a row is ~112px tall
 * against ~125px per item in the grid, so this is SHORTER as well as clearer.
 *
 * 🚨 ONE FRAME, ROWS ABUTTING, hairline via `gap-px` over the mint parent —
 * the house device, unchanged. Never a border per row: adjacent borders double
 * up and need a per-position reset at every breakpoint.
 *
 * ⚠️ THE TITLE IS SET IN THE BODY FACE. It is the creator's own words, of any
 * length, in any language; `gulfs` caps mangles a long one and cannot render
 * accents at all. Display caps stay for OUR words — section rules and buttons.
 */
function ItemList({ items, isOwner, layout }) {
    /*
        The GRID is the creator's own choice (`bio_item_layout = grid`), never
        the default — the row layout above is the one the client references
        argued for, and the grid exists for a creator with picture-led listings
        who wants a storefront. Same contract either way: counting redirect,
        LISTED price, no checkout here.
    */
    if (layout === "grid") {
        const odd = items.length % 2 === 1;

        return (
            <section className="mt-8 px-4">
                <Eyebrow label="Buy from me" accent="var(--bio-accent)" />

                <div className="grid grid-cols-2 gap-2">
                    {items.map((item, index) => (
                        <ItemTile
                            key={item.uuid}
                            item={item}
                            isOwner={isOwner}
                            wide={odd && index === items.length - 1}
                        />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="mt-8 px-4">
            <Eyebrow label="Buy from me" accent="var(--bio-accent)" />

            {/*
                🚨 ONE SURFACE, ROWS ABUTTING, hairline INSIDE it. The block used
                to be an outlined frame over a coloured ground with the ground
                showing through as the divider. On black there is nothing to show
                through, so the divider is a real hairline (`white/8`) and the
                surface is a fill — fewer parts, and no outline anywhere.
            */}
            <div className="overflow-hidden rounded-box border border-[#000] bg-white">
                {items.map((item, index) => (
                    <ItemRow
                        key={item.uuid}
                        item={item}
                        isOwner={isOwner}
                        first={index === 0}
                    />
                ))}
            </div>
        </section>
    );
}

/**
 * ⚠️ THE HREF IS THE COUNTING REDIRECT, NEVER THE CHECKOUT ITSELF. `/bio/buy/
 * {uuid}` counts the tap, stamps the visitor as `bio-link` so the sale is
 * recorded as the creator's own traffic, and rebuilds the destination
 * server-side from the stored row. A card that linked straight to a checkout
 * would be an unattributed sale and an unrecorded click, neither of which can be
 * recovered afterwards.
 *
 * ⚠️ It is a plain `<a>`, not an Inertia `<Link>` — the destination is a 302 to
 * a page outside this component tree, several of them Stripe-hosted.
 *
 * ⚠️ THE PRICE IS THE CREATOR'S LISTED PRICE, FORMATTED — never calculated.
 *
 * ⚠️ "Sign in to buy" is a WARNING, not the gate. Each buy path refuses a guest
 * itself; saying so here only stops the supporter meeting a login screen with no
 * explanation.
 */
function ItemRow({ item, isOwner, first }) {
    const hidden = isOwner && !item.is_active;
    const priced = item.price !== null && item.price !== undefined;
    const hasProgress = item.percent !== null && item.percent !== undefined;

    return (
        <a
            href={item.url}
            className={[
                "group flex items-center gap-3.5 p-3",
                first ? "" : "border-t border-[#000]",
                "transition-[background-color] duration-200",
                hidden
                    ? "text-black/35"
                    : "text-black hover:bg-[#FFF3F8] active:bg-[#FFE7F2]",
            ].join(" ")}
        >
            <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-box-sm border border-[#000] bg-[#FFF6EC]">
                {item.image ? (
                    <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-[1.08]"
                    />
                ) : (
                    /*
                        🚨 MOST MEMBERSHIPS AND PAID TASKS HAVE NO PICTURE —
                        `memberships.thumbnail` and `tasks.media_url` are both
                        nullable and both commonly empty. The type name set small
                        and grey inside an empty box read as an image that failed
                        to load; the module's own mark on its own tint reads as a
                        deliberate cover, and it is the SAME mark the link tiles
                        use for that module, so the two blocks teach each other.

                        ⚠️ A placeholder, never a claim: no creator photo is
                        substituted in. A face on a card the creator never
                        illustrated is us advertising on their behalf.
                    */
                    <span
                        className="flex h-full w-full items-center justify-center"
                        style={{
                            backgroundColor: ITEM_TINTS[item.type] || "#FFF6EC",
                        }}
                    >
                        <ItemMark type={item.type} />
                    </span>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-gulfs text-[9px] uppercase tracking-[0.18em] text-black/35">
                    {item.type_label}
                </span>

                {/*
                    ⚠️ `first-letter:uppercase`, NOT `capitalize`. A membership
                    title is the tier name as the creator typed it ("bronze"),
                    which reads as a typo on a card — but `capitalize` would also
                    rewrite every other word of a creator's own sentence ("Create
                    A Reel For You"), and that copy is theirs, not ours. Only the
                    opening letter is ours to fix.
                */}
                <p className="mt-1 line-clamp-2 font-poppins text-[14.5px] font-semibold leading-[1.3] first-letter:uppercase">
                    {item.title}
                </p>

                {priced ? (
                    <p className="mt-0.5 font-poppins text-[14px] font-bold leading-[1.3] tabular-nums text-black">
                        {money(item.price, item.currency)}
                        {item.price_note ? (
                            <span className="font-normal text-black/45">
                                {" "}
                                {item.price_note}
                            </span>
                        ) : null}
                    </p>
                ) : null}

                {/*
                    ⚠️ A pot has no price — any amount within the platform limits
                    buys it — so it shows progress instead. `percent` is null when
                    no target is set, and a null bar is omitted rather than drawn
                    at 0: "no goal" and "nobody has bought" are different things.
                */}
                {hasProgress ? (
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-box-xs border border-[#000] bg-white">
                        <div
                            className="h-full bg-[#A2E4B8]"
                            style={{ width: `${item.percent}%` }}
                        />
                    </div>
                ) : null}

                {item.requires_account ? (
                    <span className="mt-1 font-poppins text-[10.5px] leading-[1.4] text-black/35">
                        Sign in to buy
                    </span>
                ) : null}
            </div>

            {/*
                ⚠️ A SPAN inside the row's own anchor — the whole row is the tap
                target, and a nested button here would be invalid markup and a
                second, smaller thing to hit. Black on pink, never white.
            */}
            <span
                className={[
                    "flex shrink-0 items-center self-center rounded-box-sm px-3.5 py-2.5",
                    "font-gulfs text-[10.5px] uppercase tracking-[0.14em]",
                    hidden
                        ? "border border-black/25 bg-black/[0.04] text-black/40"
                        : "border border-[#000] bg-[color:var(--bio-cta)] text-[color:var(--bio-cta-ink)]",
                ].join(" ")}
            >
                {hidden ? "Hidden" : item.cta}
            </span>
        </a>
    );
}

/**
 * The grid tile — one sellable listing as a card: picture on top, title, the
 * LISTED price, and the same CTA pill the row uses.
 *
 * ⚠️ Same contract as ItemRow, restated because a second renderer is exactly
 * where a rule quietly stops holding: the href is the counting redirect
 * `/bio/buy/{uuid}` (a plain <a>, the destination is a 302 out of this tree),
 * the price is formatted and never calculated, and "Sign in to buy" is a
 * warning, not the gate. An odd count spans the last tile (LinkGroup's rule).
 */
function ItemTile({ item, isOwner, wide }) {
    const hidden = isOwner && !item.is_active;
    const priced = item.price !== null && item.price !== undefined;
    const hasProgress = item.percent !== null && item.percent !== undefined;

    return (
        <a
            href={item.url}
            className={[
                "group flex flex-col overflow-hidden rounded-box border border-[#000] bg-white",
                "transition-[background-color] duration-200",
                wide ? "col-span-2" : "",
                hidden
                    ? "text-black/35"
                    : "text-black hover:bg-[#FFF3F8] active:bg-[#FFE7F2]",
            ].join(" ")}
        >
            <div
                className={[
                    "w-full shrink-0 overflow-hidden border-b border-[#000] bg-[#FFF6EC]",
                    wide ? "h-[140px]" : "h-[112px]",
                ].join(" ")}
            >
                {item.image ? (
                    <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-[1.08]"
                    />
                ) : (
                    <span
                        className="flex h-full w-full items-center justify-center"
                        style={{
                            backgroundColor: ITEM_TINTS[item.type] || "#FFF6EC",
                        }}
                    >
                        <ItemMark type={item.type} />
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-3">
                <span className="font-gulfs text-[9px] uppercase tracking-[0.18em] text-black/35">
                    {item.type_label}
                </span>

                <p className="mt-1 line-clamp-2 font-poppins text-[13.5px] font-semibold leading-[1.3] first-letter:uppercase">
                    {item.title}
                </p>

                {priced ? (
                    <p className="mt-0.5 font-poppins text-[13.5px] font-bold leading-[1.3] tabular-nums text-black">
                        {money(item.price, item.currency)}
                        {item.price_note ? (
                            <span className="font-normal text-black/45">
                                {" "}
                                {item.price_note}
                            </span>
                        ) : null}
                    </p>
                ) : null}

                {hasProgress ? (
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-box-xs border border-[#000] bg-white">
                        <div
                            className="h-full bg-[#A2E4B8]"
                            style={{ width: `${item.percent}%` }}
                        />
                    </div>
                ) : null}

                {item.requires_account ? (
                    <span className="mt-1 font-poppins text-[10.5px] leading-[1.4] text-black/35">
                        Sign in to buy
                    </span>
                ) : null}

                {/* mt-auto on the WRAPPER pins the pill to the tile's foot,
                    so a one-line title and a two-line one end level. */}
                <div className="mt-auto pt-3">
                    <span
                        className={[
                            "flex items-center justify-center rounded-box-sm px-3 py-2.5",
                            "font-gulfs text-[10.5px] uppercase tracking-[0.14em]",
                            hidden
                                ? "border border-black/25 bg-black/[0.04] text-black/40"
                                : "border border-[#000] bg-[color:var(--bio-cta)] text-[color:var(--bio-cta-ink)]",
                        ].join(" ")}
                    >
                        {hidden ? "Hidden" : item.cta}
                    </span>
                </div>
            </div>
        </a>
    );
}

/**
 * The on-platform destinations — TWO COLUMNS OF TILES, not seven full-width
 * rows.
 *
 * 🚨 NAVIGATION IS NOT MERCHANDISE. These are free destinations, and at full
 * width one under another, seven of them took more of the page than everything
 * for sale on it — the exact inversion this page exists to correct. As a 2-up
 * grid the same seven read in four lines, and the product rows above are then
 * the only full-width things on the page, which is what makes them read as the
 * important ones.
 *
 * ⚠️ AN ODD COUNT SPANS THE LAST TILE, or the grid ends on a hole.
 */
function LinkGroup({ eyebrow, accent, links, isOwner }) {
    const odd = links.length % 2 === 1;

    /*
        🚨 THE SPANNING TILE IS THE LONGEST LABEL, NOT WHATEVER SORTED LAST. An
        odd count spans one tile across both columns, and that slot is the only
        one where a long label fits on one line — so "Subscriptions" belongs in
        it, not "Shop". Ordering otherwise stays exactly as the server sent it:
        this moves ONE tile, and only when the count is odd.
    */
    const ordered = [...links];

    if (odd && ordered.length > 1) {
        // ⚠️ SUBSCRIPTIONS TAKES THE WIDE SLOT WHEN IT IS ON THE PAGE (client
        // direction). It is the longest label of the eight and the only one that
        // wrapped in a half tile. Any other page falls back to "whichever label
        // is longest", so the rule still holds for a creator who has no
        // subscriptions at all.
        const wide =
            ordered.find((link) => link.target_type === "bills") ||
            ordered.reduce(
                (best, link) =>
                    (link.label || "").length > (best.label || "").length
                        ? link
                        : best,
                ordered[0],
            );

        ordered.splice(ordered.indexOf(wide), 1);
        ordered.push(wide);
    }

    return (
        <section className="mt-8 px-4">
            <Eyebrow label={eyebrow} accent={accent} />

            <div className="grid grid-cols-2 gap-2">
                {ordered.map((link, index) => (
                    <LinkRow
                        key={link.uuid || `${link.kind}-${link.target_type}`}
                        link={link}
                        isOwner={isOwner}
                        wide={odd && index === ordered.length - 1}
                    />
                ))}
            </div>
        </section>
    );
}

/**
 * ⚠️ EVERY TILE CARRIES THE MARK OF WHAT IT OPENS. `target_type` is the server's
 * own key for the module, so the glyph cannot drift from the destination — and
 * these seven are seven DIFFERENT products, which seven identical lines of text
 * made read as near-synonyms.
 *
 * ⚠️ An unknown key falls back to the arrow, never to nothing: an empty chip
 * beside neighbours that have a mark reads as a broken image.
 */
const LINK_MARKS = {
    wishes: Gift,
    shop: ShoppingBag,
    "piggy-pots": PiggyBank,
    memberships: Crown,
    bills: RefreshCw,
    tasks: ClipboardList,
    "piggy-bank": Sparkles,
    feed: Newspaper,
};

/**
 * 🚨 ONE COLOUR PER MODULE, AND IT IS THE SAME COLOUR EVERY TIME (20 Aug 2026,
 * client direction). The tiles were seven identical white rectangles, which is
 * the flattest thing on a page whose whole job is to be scanned in a second.
 * Keyed on the server's own `target_type`, so a creator who reorders their page
 * keeps the colour they learned — a palette that shuffles with position teaches
 * nothing and just looks busy.
 *
 * ⚠️ ALL FIVE ARE THE BRAND'S OWN, and all five take BLACK type and a black
 * edge: mint, yellow and violet are the app's pastels, pink is the money colour
 * (black on pink, never white — 5.56:1), cream is the page's own ground.
 * Nothing here is a new hue invented for this page.
 */
const LINK_TINTS = {
    "piggy-bank": "#FFD3E8",
    wishes: "#A2E4B8",
    "piggy-pots": "#FFD3E8",
    shop: "#E6EA7B",
    memberships: "#C9B6FF",
    tasks: "#A2E4B8",
    feed: "#E6EA7B",
    bills: "#C9B6FF",
};

/**
 * ⚠️ An INTERNAL link is a plain Inertia visit — same site, no redirect hop. An
 * EXTERNAL one goes through `/bio/go/{uuid}`, which counts the click and then
 * rebuilds the destination from the stored platform and handle. The href is
 * never the destination itself.
 */
function LinkRow({ link, isOwner, wide }) {
    const external = link.kind === "external";
    const hidden = isOwner && !link.is_active;
    const Mark = LINK_MARKS[link.target_type] || ChevronRight;

    const tint = LINK_TINTS[link.target_type] || "#FFFFFF";

    const className = [
        // ⚠️ A ONE-WORD LABEL CANNOT WRAP, SO THE TILE HAS TO GIVE IT ROOM.
        // "Memberships" and "Subscriptions" ran off the edge on a 360px screen:
        // `line-clamp` only breaks between words, and there is no space in
        // either. Narrow gutters, a smaller mark and a smaller type size on the
        // small breakpoint — plus `break-words`, which is what actually lets a
        // long single word split rather than overflow.
        "flex min-h-[60px] items-center gap-2 rounded-box-sm border border-[#000] px-2.5 py-2.5",
        "sm:min-h-[62px] sm:gap-3 sm:px-3.5 sm:py-3",
        "transition-[filter] duration-200",
        wide ? "col-span-2" : "",
        hidden
            ? "text-black/40"
            : "text-black hover:brightness-[1.06] active:brightness-95",
    ].join(" ");

    const body = (
        <>
            <span
                aria-hidden="true"
                className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-box-xs border border-[#000] sm:h-8 sm:w-8",
                    hidden ? "bg-white text-black/30" : "bg-white text-black",
                ].join(" ")}
            >
                <Mark
                    className="h-[15px] w-[15px] sm:h-[16px] sm:w-[16px]"
                    strokeWidth={2.25}
                />
            </span>

            {/*
                ⚠️ TWO LINES, NOT AN ELLIPSIS. At tile width "Subscriptions" and
                "Memberships" both truncated to a stem — a label that cannot say
                its own name is worse than a taller tile.
            */}
            <span className="line-clamp-2 min-w-0 flex-1 break-words font-poppins text-[12px] font-semibold leading-[1.25] sm:text-[13px]">
                {hidden ? `${link.label} · hidden` : link.label}
            </span>

            {/*
                ⚠️ THE MARK IS ONLY DRAWN WHEN IT SAYS SOMETHING. `↗` means this
                leaves Spenny Piggy and a visitor should be told before they tap;
                `→` on an internal tile said "this is a link", which the tile
                already said, and it cost the label the width it needed.
            */}
            {external ? (
                <span
                    aria-hidden="true"
                    className="shrink-0 font-poppins text-[15px] leading-none text-black/30"
                >
                    ↗
                </span>
            ) : null}
        </>
    );

    if (external) {
        return (
            <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                style={{ backgroundColor: hidden ? "#FFFFFF" : tint }}
            >
                {body}
            </a>
        );
    }

    return (
        <Link
            href={link.url}
            className={className}
            style={{ backgroundColor: hidden ? "#FFFFFF" : tint }}
        >
            {body}
        </Link>
    );
}

/**
 * The section rule. One shape for every heading on the page, so a group reads as
 * a group before a word of it is read.
 *
 * ⚠️ 2px, like every other line here — see the page docblock.
 */
function Eyebrow({ label, accent }) {
    return (
        <div className="mb-3 flex items-center gap-3">
            <span className="font-gulfs text-[11px] uppercase tracking-[0.22em] text-[color:var(--bio-ink45)]">
                {label}
            </span>
            <span
                className="h-px flex-1"
                style={{ backgroundColor: accent || "var(--bio-rule)" }}
            />
        </div>
    );
}

/**
 * ⚠️ The mark, never a wordmark image. `react-icons/fa6` is already in the
 * bundle (Header, Footer, ProfileTabs), so this costs nothing extra and no
 * platform logo is copied into the repo. An unknown or withdrawn platform falls
 * back to a chain link rather than rendering nothing — a tile with no mark on it
 * reads as a broken image.
 */
const SOCIAL_MARKS = {
    instagram: { icon: FaInstagram, label: "Instagram" },
    tiktok: { icon: FaTiktok, label: "TikTok" },
    twitter: { icon: FaXTwitter, label: "X" },
    youtube: { icon: FaYoutube, label: "YouTube" },
    twitch: { icon: FaTwitch, label: "Twitch" },
    discord: { icon: FaDiscord, label: "Discord" },
    spotify: { icon: FaSpotify, label: "Spotify" },
};

/**
 * The off-platform links — A ROW OF MARKS INSIDE THE HERO, not a section.
 *
 * 🚨 THEY BELONG TO THE PERSON, NOT TO THE PAGE. Every reference the client
 * sent puts the social icons directly under the name, in one compact row, and
 * none of them gives those links a heading or a frame of their own: a supporter
 * decides whether to follow while they are still reading who this is. Ours sat
 * at the very bottom under a section rule, below a nine-row navigation list and
 * a nine-hundred-pixel announcement, which is where a footer goes.
 *
 * 🚨 SIZE IS THE HIERARCHY. These are 40px chips; every paid thing on this page
 * is a full-width row or a card. That difference is the whole argument for
 * putting them this high — high does not have to mean loud, and a free follow
 * must never outweigh a purchase.
 *
 * ⚠️ NO WORDS AND NO BRAND COLOUR. The mark IS the name — "TikTok" printed
 * under its own logo says less than the logo did — and seven brand hues under
 * the one pink accent would leave nothing for the money to be loud with. The
 * label survives as the accessible name, and only a link with no mark of ours
 * falls back to the chain glyph.
 *
 * ⚠️ THE HREF IS STILL `/bio/go/{uuid}`, the counting redirect.
 */
function SocialChips({ links, isOwner }) {
    return (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {links.map((link) => {
                const Mark = SOCIAL_MARKS[link.platform]?.icon || FaLink;
                const hidden = isOwner && !link.is_active;

                return (
                    <a
                        key={link.uuid || link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={
                            hidden ? `${link.label} (hidden)` : link.label
                        }
                        title={link.label}
                        className={[
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            "transition-[background-color] duration-200",
                            hidden
                                ? "border border-dashed border-black/40 text-black/30"
                                : "border border-[#000] bg-white text-black hover:bg-[#FF007F] active:brightness-95",
                        ].join(" ")}
                    >
                        <Mark
                            aria-hidden="true"
                            className="h-[17px] w-[17px]"
                        />
                    </a>
                );
            })}
        </div>
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
function Stablecoin({ tip }) {
    // ⚠️ TWO SWITCHES, AND THE SERVER'S ONE WINS. `STABLECOIN_TIPS_LIVE` is a JS
    // constant that governs the marketing tense; the button may only be pressed
    // when `config('discovery.labels.tips')` says so, which arrives as
    // `tip.live`. A label flip must be a config change with no deploy (Master
    // Plan §F), so the constant can never be what enables a payment.
    const live = STABLECOIN_TIPS_LIVE && !!tip?.live;

    /*
        🚨 WHILE IT IS ANNOUNCED, IT IS ONE LINE — NOT A DISABLED CHECKOUT.
        Measured at 390px before this change: the greyed block ran ~900px, more
        than the pot, every item card and every link put together, on the one
        page a creator shares everywhere. A supporter scrolled past six preset
        amounts, an amount field, a dead button and three fee notes, none of
        which they could use, to reach the things they could buy. An announcement
        earns a line; only a working payment earns a form.

        ⚠️ The amount picker below is kept, wired and tested — it renders the
        moment BOTH switches say live. Deleting it would mean rebuilding it, and
        the disabled state is still the thing that is legally load-bearing when
        the rail turns on.
    */
    if (!live) {
        return (
            <section className="mx-4 mt-8 flex items-center gap-3 rounded-box-sm border border-dashed border-[color:var(--bio-ink40)] px-4 py-3.5">
                <span className="min-w-0 flex-1 font-poppins text-[12.5px] leading-[1.45] text-[color:var(--bio-ink45)]">
                    <span className="font-semibold text-[color:var(--bio-ink70)]">
                        {STABLECOIN_COPY.card.title}
                    </span>{" "}
                    — {STABLECOIN_COPY.railNote}
                </span>

                <span className="shrink-0 rounded-box-xs bg-[color:var(--bio-chip)] px-2 py-1 font-gulfs text-[9px] uppercase tracking-[0.16em] text-[color:var(--bio-ink50)]">
                    {STABLECOIN_COPY.card.detail}
                </span>
            </section>
        );
    }

    return (
        <section className="mx-4 mt-8 rounded-box border border-[#000] bg-[#8C52FF] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate font-gulfs text-[14px] uppercase leading-[1.2] tracking-tight text-black">
                    {STABLECOIN_COPY.card.title}
                </span>

                <span className="shrink-0 rounded-box-xs bg-black px-2 py-1 font-gulfs text-[10px] uppercase tracking-[0.16em] text-white">
                    {STABLECOIN_COPY.card.detail}
                </span>
            </div>

            <p className="mt-2 font-poppins text-[12.5px] leading-[1.55] text-black/80">
                {STABLECOIN_COPY.card.line}
            </p>

            <p className="mt-1 font-poppins text-[11.5px] leading-[1.55] text-black/65">
                {STABLECOIN_COPY.railNote}
            </p>

            {tip ? <TipAmounts tip={tip} live={live} /> : null}
        </section>
    );
}

/**
 * The Tip flow — built in full, switched off.
 *
 * 🚨 EVERY NUMBER COMES FROM THE SERVER. The presets, the minimum, the maximum
 * and the admin fee arrive in `tip` from `BioTipService::payload()`, and the
 * total is priced by `POST /bio/tip/quote`, which freezes the rate it used. This
 * component never computes a total and never converts a currency — the same rule
 * that keeps a listed price off the item cards, for the same reason: two places
 * that can each produce a figure will eventually produce two figures.
 *
 * 🚨 THE GREYED STATE IS NOT A STYLE. While the rail is off, the controls are
 * `disabled`, the fieldset is inert, and the server answers 503 to both
 * endpoints regardless — a disabled button is a rendering decision and anyone
 * can post past it. The "Coming soon" badge is the only thing separating an
 * illustration from an offer, exactly as it is on the marketing pages.
 *
 * ⚠️ LITERAL PATHS, NOT `route()`. A named route is invisible to the frontend
 * until `ziggy:generate` runs, and `route()` THROWS for a name it does not carry
 * — which surfaces as whatever the nearest catch handler says rather than as the
 * missing route it is. Vapor regenerates on deploy, so this only bites local and
 * dev, which is exactly where it wastes the time.
 *
 * ⚠️ No settlement speed is stated anywhere, and the provider is never named.
 */
function TipAmounts({ tip, live }) {
    const [amount, setAmount] = useState("");
    const [custom, setCustom] = useState("");
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState(null);

    const chosen = Number(custom || amount) || 0;

    // ⚠️ Client-side range checking is a COURTESY, never the rule.
    // `BioTipService::amountError()` refuses the same values on the server, and
    // that is the one that decides.
    const outOfRange = chosen > 0 && (chosen < tip.min || chosen > tip.max);

    useEffect(() => {
        if (!live || chosen <= 0 || outOfRange) {
            setQuote(null);

            return undefined;
        }

        // ⚠️ axios, NOT `fetch`. `bootstrap.js` configures axios with the app's
        // XSRF handling; a raw `fetch` POST carries no CSRF token and is answered
        // 419 by the `web` group, which surfaces as "the quote never loads".
        //
        // The rate is frozen by the QUOTE, so a keystroke must not mint one per
        // character — that would also freeze a rate nobody asked for.
        const controller = new AbortController();
        const id = setTimeout(() => {
            axios
                .post(
                    "/bio/tip/quote",
                    { amount: chosen },
                    { signal: controller.signal },
                )
                .then(({ data }) => {
                    if (data?.status) {
                        setQuote(data.quote);
                        setError(null);
                    } else {
                        setQuote(null);
                        setError(data?.message || null);
                    }
                })
                .catch((e) => {
                    // A failed quote CLEARS the figure rather than leaving a
                    // stale one beside a new amount.
                    setQuote(null);
                    setError(e?.response?.data?.message || null);
                });
        }, 400);

        return () => {
            clearTimeout(id);
            controller.abort();
        };
    }, [chosen, live, outOfRange]);

    return (
        <div
            className={[
                "mt-4 border-t-2 pt-3.5",
                live ? "border-black/20" : "border-black/10",
            ].join(" ")}
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={[
                        "font-gulfs text-[10.5px] uppercase tracking-[0.16em]",
                        live ? "text-black/70" : "text-black/40",
                    ].join(" ")}
                >
                    {BIO_TIP_COPY.chooseLabel}
                </span>

                {live ? null : (
                    <span className="shrink-0 rounded-box-xs bg-black/10 px-2 py-1 font-gulfs text-[9px] uppercase tracking-[0.16em] text-black/50">
                        {BIO_TIP_COPY.comingSoon}
                    </span>
                )}
            </div>

            {/*
                ⚠️ `fieldset[disabled]` turns off every control inside it in one
                place — including ones added later. Greying them individually is
                how one eventually stays live.
            */}
            <fieldset disabled={!live} className="mt-2.5 min-w-0">
                <div className="grid grid-cols-3 gap-1.5">
                    {(tip.presets || []).map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => {
                                setAmount(String(preset));
                                setCustom("");
                            }}
                            className={[
                                "min-h-[40px] rounded-box-xs border-2 px-1",
                                "font-gulfs text-[11px] uppercase tracking-[0.1em]",
                                "transition-[background-color,opacity] duration-200",
                                live
                                    ? "border-[#000] text-black"
                                    : "border-black/20 text-black/35",
                                live && String(preset) === amount && !custom
                                    ? "bg-[#FF007F]"
                                    : "bg-white/60",
                            ].join(" ")}
                        >
                            ${preset}
                        </button>
                    ))}
                </div>

                <label className="mt-2.5 block">
                    <span
                        className={[
                            "font-gulfs text-[10px] uppercase tracking-[0.14em]",
                            live ? "text-black/60" : "text-black/35",
                        ].join(" ")}
                    >
                        {BIO_TIP_COPY.customLabel} (${tip.min} – ${tip.max})
                    </span>
                    <input
                        type="number"
                        inputMode="decimal"
                        min={tip.min}
                        max={tip.max}
                        step="0.01"
                        value={custom}
                        onChange={(e) => {
                            setCustom(e.target.value);
                            setAmount("");
                        }}
                        placeholder={BIO_TIP_COPY.customPlaceholder}
                        className={[
                            "mt-1 min-h-[44px] w-full rounded-box-xs border-2 px-3",
                            "font-poppins text-[14px] leading-[1.4]",
                            live
                                ? "border-[#000] bg-white text-black"
                                : "border-black/20 bg-white/50 text-black/40",
                        ].join(" ")}
                    />
                </label>

                <button
                    type="button"
                    className={[
                        "mt-2.5 min-h-[46px] w-full rounded-box-sm border-2 px-3",
                        "font-gulfs text-[12px] uppercase tracking-[0.14em]",
                        "transition-[filter] duration-200",
                        // ⚠️ ONE text-colour utility per branch. Two on the same
                        // element under the same variant is a conflicting pair
                        // `npm run check` fails the build on — and the one that
                        // wins is decided by stylesheet order, not source order.
                        live
                            ? "border-[#000] bg-[#FF007F] text-black hover:brightness-110 active:brightness-95"
                            : "border-black/20 bg-black/[0.06] text-black/40",
                    ].join(" ")}
                >
                    {live ? BIO_TIP_COPY.action : BIO_TIP_COPY.actionDisabled}
                </button>
            </fieldset>

            {outOfRange ? (
                <p className="mt-2 font-poppins text-[11.5px] leading-[1.5] text-[#B91C1C]">
                    Tips are ${tip.min} to ${tip.max}.
                </p>
            ) : null}

            {error ? (
                <p className="mt-2 font-poppins text-[11.5px] leading-[1.5] text-[#B91C1C]">
                    {error}
                </p>
            ) : null}

            {/*
                The frozen quote. It prints the tip and the fee as two numbers
                because they are two numbers — the creator receives the first and
                the second is added on top.
            */}
            {quote ? (
                <dl className="mt-2.5 font-poppins text-[11.5px] leading-[1.6] text-black/70">
                    <div className="flex justify-between gap-3">
                        <dt>Tip</dt>
                        <dd className="tabular-nums">
                            ${quote.amount.toFixed(2)}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt>Admin fee</dt>
                        <dd className="tabular-nums">
                            ${quote.admin_fee.toFixed(2)}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-3 font-semibold text-black">
                        <dt>Total</dt>
                        <dd className="tabular-nums">
                            ${quote.total.toFixed(2)} {quote.currency}
                        </dd>
                    </div>
                    {quote.display ? (
                        <div className="flex justify-between gap-3 text-black/50">
                            <dt>Approximately</dt>
                            <dd className="tabular-nums">
                                {money(
                                    quote.display.total,
                                    quote.display.currency,
                                )}
                            </dd>
                        </div>
                    ) : null}
                </dl>
            ) : null}

            <p
                className={[
                    "mt-2.5 font-poppins text-[11px] leading-[1.5]",
                    live ? "text-black/55" : "text-black/40",
                ].join(" ")}
            >
                {BIO_TIP_COPY.feeNote}
            </p>
            <p
                className={[
                    "mt-1 font-poppins text-[11px] leading-[1.5]",
                    live ? "text-black/55" : "text-black/40",
                ].join(" ")}
            >
                {BIO_TIP_COPY.fxNote}
            </p>
            <p
                className={[
                    "mt-1 font-poppins text-[11px] leading-[1.5]",
                    live ? "text-black/55" : "text-black/40",
                ].join(" ")}
            >
                {BIO_TIP_COPY.natureNote}
            </p>
        </div>
    );
}

function Tools({ bioUrl, showQr, setShowQr, copied, copyLink, share }) {
    return (
        <section className="mt-8 px-4">
            <div className="grid grid-cols-3 gap-2">
                <ToolButton onClick={share} primary>
                    Share
                </ToolButton>
                <ToolButton onClick={copyLink}>
                    {copied ? "Copied" : "Copy link"}
                </ToolButton>
                <ToolButton onClick={() => setShowQr((v) => !v)}>
                    {showQr ? "Hide QR" : "QR code"}
                </ToolButton>
            </div>

            {showQr ? (
                <div className="mt-3 rounded-box border border-[#000] bg-white p-5 text-center">
                    {/* White ground and a quiet zone: a scanner needs both to read it at all. */}
                    {/*
                        ⚠️ `mx-auto block`, not the parent's `text-center`. The
                        component renders an <svg>, which the browser lays out as
                        a replaced inline-block of its own width — so it sat hard
                        left inside a centred panel.
                    */}
                    <QRCodeSVG
                        value={bioUrl}
                        size={168}
                        level="M"
                        includeMargin
                        className="mx-auto block"
                    />
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
                "min-h-[46px] rounded-box-sm px-2",
                "font-gulfs text-[11px] uppercase tracking-[0.14em]",
                "transition-[filter,background-color] duration-200 hover:brightness-110 active:brightness-95",
                // ⚠️ Black on pink, never white — 5.56:1 against white's 3.78:1.
                "border border-[#000]",
                primary
                    ? "bg-[color:var(--bio-cta)] text-[color:var(--bio-cta-ink)]"
                    : "bg-white text-black hover:bg-[#FFF3F8]",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

/**
 * The owner's own bar — first thing under the hero, on the owner's view only.
 *
 * 🚨 IT USED TO SIT AT THE FOOT OF THE PAGE, under the tip strip and the share
 * buttons. A creator opening their own bio page had to scroll past everything
 * they had built to find out they could change any of it — so "edit" was the
 * one action on this page that nobody discovered. It is now the first thing
 * after the hero, which is where the person who can act on it is looking.
 *
 * ⚠️ EDIT IS A BUTTON, NOT AN UNDERLINED WORD. It was a text link inside a
 * sentence, which reads as a footnote to the stats; as a filled control beside
 * them it reads as the thing to press. 44px minimum, per the house tap target.
 *
 * ⚠️ Owner only. A visitor has no business reading a creator's reach, and the
 * server sends `stats` as null for anyone else — this never guards it alone.
 */
function OwnerBar({ stats, featuredClicks }) {
    return (
        <section className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-box-sm border border-[#000] bg-[#E6EA7B] px-4 py-3">
            <div className="min-w-0 flex-1">
                <p className="font-gulfs text-[10px] uppercase tracking-[0.18em] text-black/55">
                    Only you can see this
                </p>

                <p className="mt-1 font-poppins text-[13px] leading-[1.45] text-black/75">
                    {stats ? (
                        <>
                            <span className="font-semibold text-black">
                                {stats.views}{" "}
                                {stats.views === 1 ? "view" : "views"}
                            </span>{" "}
                            so far
                        </>
                    ) : null}
                    {/*
                        ⚠️ Only when there IS a pinned tile and it has been
                        tapped — a creator with no pot should not read "0 taps"
                        about something their page does not show.
                    */}
                    {featuredClicks ? (
                        <>
                            {stats ? " · " : null}
                            <span className="font-semibold text-black">
                                {featuredClicks}{" "}
                                {featuredClicks === 1 ? "tap" : "taps"}
                            </span>{" "}
                            on your pinned tile
                        </>
                    ) : null}
                </p>
            </div>

            <Link
                href={route("bio.edit")}
                className="flex min-h-[44px] shrink-0 items-center rounded-box-sm border border-[#000] bg-white px-4 font-gulfs text-[11px] uppercase tracking-[0.14em] text-black transition-colors duration-200 hover:bg-[#FFF3F8] active:brightness-95"
            >
                Edit page
            </Link>
        </section>
    );
}

/**
 * An empty screen is an invitation to act, not a dead end — and the act is a
 * different one for each reader. A visitor is offered the profile, because the
 * creator may well be posting there; the owner is offered the editor, because
 * they are two taps from having something to sell and nobody else can fix it.
 */
function Empty({ creator, isOwner }) {
    return (
        <section className="mx-4 mt-8 rounded-box border border-dashed border-[color:var(--bio-ink40)] px-5 py-9 text-center">
            <p className="font-gulfs text-[15px] uppercase leading-[1.2] text-[color:var(--bio-ink55)]">
                {isOwner ? "Nothing to buy here yet" : "Nothing on sale yet"}
            </p>

            <p className="mx-auto mt-2 max-w-[34ch] font-poppins text-[13px] leading-[1.55] text-[color:var(--bio-ink55)]">
                {isOwner
                    ? "Add a wish, a pot or a shop item and it shows up here as a card people can buy from."
                    : "Check back soon — or see what they are posting."}
            </p>

            <Link
                href={isOwner ? route("bio.edit") : creator.profile_url}
                className="mt-3 inline-block font-gulfs text-[12px] uppercase tracking-[0.14em] text-[color:var(--bio-link)] underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
            >
                {isOwner ? "Choose what to sell" : "See their profile"}
            </Link>
        </section>
    );
}

function Footer({ creator }) {
    return (
        <footer className="mt-10 px-4 text-center">
            {/*
                ⚠️ 44px comes from PADDING, not from the type size — a text link
                small enough to look quiet and small enough to miss is worse than
                no link. Same device the account page's switches use.
            */}
            <Link
                href={creator.profile_url}
                className="inline-flex min-h-[44px] items-center px-4 font-gulfs text-[12px] uppercase tracking-[0.16em] text-[color:var(--bio-ink60)] underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
            >
                Full profile
            </Link>
            <p className="mt-3.5 font-gulfs text-[10px] uppercase tracking-[0.24em] text-[color:var(--bio-ink30)]">
                Spenny Piggy
            </p>
        </footer>
    );
}
