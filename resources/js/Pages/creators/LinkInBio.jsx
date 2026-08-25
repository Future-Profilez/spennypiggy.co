import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, GripVertical } from 'lucide-react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import { ACCENT, Eyebrow, GRID, SectionHead, SectionHeadSplit } from './components/Ledger';
import DiscoveryStatsPanel from '@/Components/discovery/DiscoveryStatsPanel';
import {
    BIO_AD_CLOSE,
    BIO_AD_CONTROL,
    BIO_AD_EVERYTHING,
    BIO_AD_HERO,
    BIO_AD_PHONE,
    BIO_AD_PROBLEM,
    BIO_AD_TIPS,
    BIO_AD_TRAFFIC,
    DISCOVERY_AD_WORTH,
    DISCOVERY_LABEL_TEXT,
} from '@/constants/discovery';
import { STABLECOIN_COPY } from '@/constants/stablecoinTips';

/**
 * A3 — the Link in Bio paid-ads landing page.
 *
 * 🚨 SECTIONS 3 AND 6 SHOW "COMING SOON" WHERE THE BRIEF SAYS "LIVE NOW". This
 * is the one place this page departs from its instructions, it was flagged to
 * Jack rather than decided quietly, and it is driven by the `bio_direct_sales`
 * key in `config/discovery.php` — read that key's note for the full reasoning.
 * Short version: `/{username}/bio` is live but sells nothing (its own docblock
 * says "no checkout, no price and no payment method"), selling from it is the B
 * stream due Fri 28 Aug, and this page goes live Tue 25. The plan lists "Mark
 * anything LIVE NOW in marketing that is not live in the product" under Never.
 * One config flip corrects both sections the day B lands, with no deploy.
 *
 * ⚠️ BANNED ON THIS PAGE, per the brief: "instant" / "immediate" / "seconds"
 * about Tips, competitor names, payment-provider names, and any creator's
 * earnings. The Tip block therefore names no provider and states no settlement
 * speed, and the before/after in section 2 describes the competing pattern
 * rather than naming a product. `DiscoveryMarketingTest` asserts the word list.
 *
 * ⚠️ The Tip block is copied from `Pages/Bio/Show.jsx`'s own `Stablecoin`
 * component — dashed edge, greyed, on the bio page's green ground — because the
 * brief asks for the button "greyed out exactly as it appears in the product".
 * If that component changes, change this with it.
 */

const MINT = ACCENT.earn;
/*
 * 🚨 TWO VIOLETS, AND THE DARK ONE IS NEVER TEXT. Measured on this page's ink
 * ground (#0B0B0C): `#8C52FF` is **4.47:1** — under AA (4.5) — and these labels
 * are 11px, so they are normal text, not large. `#C4A5FF` measures **9.53:1**.
 *
 * This is the same finding `home/StablecoinTipsAnnouncement.jsx` records for the
 * same pair, and it was walked into again the moment violet started carrying
 * meaning rather than decorating a heading. The dark violet is a FILL and a
 * border; the light one is the ink.
 */
const VIOLET = ACCENT.bonus;
const VIOLET_INK = '#C4A5FF';

/** The public bio page's own ground, so the phone mock reads as that page. */
const BIO_GROUND = '#A2E4B8';

export default function LinkInBio({ discovery }) {
    const labels = discovery?.labels ?? {};
    const analyticsLive = Boolean(discovery?.analyticsLive);
    const mockStats = discovery?.mockStats;

    const title = 'One link that sells — Link in Bio for creators | Spenny Piggy';
    const description = BIO_AD_HERO.body;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/link-in-bio" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="https://spennypiggy.co/og-link-in-bio.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/link-in-bio"
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content="https://spennypiggy.co/og-link-in-bio.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* ── 1 · Hero ───────────────────────────────────────── */}
                    <div className="lg:grid lg:grid-cols-12 lg:gap-x-6 lg:items-center gap-y-10">
                        <div className="lg:col-span-6">
                            <Eyebrow accent={MINT}>{BIO_AD_HERO.eyebrow}</Eyebrow>

                            <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                                One link.
                                <br />
                                <span className="text-gradient-wishlist">
                                    Sell straight
                                </span>
                                <br />
                                from your bio.
                            </h1>

                            <p className="mt-7 max-w-lg text-base leading-[1.6] text-gray-300 md:text-xl">
                                {BIO_AD_HERO.body}
                            </p>

                            <p className="mt-6 font-gulfs text-lg uppercase leading-[1.15] tracking-tight text-white md:text-2xl">
                                {BIO_AD_HERO.strapline}
                            </p>

                            <Cta className="mt-9">{BIO_AD_HERO.cta}</Cta>
                        </div>

                        <div className="lg:col-span-5 lg:col-start-8">
                            <PhoneMock labels={labels} alignRight />
                        </div>
                    </div>

                    {/* ── 2 · The problem with most bio links ───────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHeadSplit
                            eyebrow="Every tap costs you"
                            accent={VIOLET_INK}
                            lead={BIO_AD_PROBLEM.body}
                        >
                            The problem with{' '}
                            <span className="text-gradient-wishlist">
                                most bio links
                            </span>
                        </SectionHeadSplit>

                        {/* The before/after the brief asks for. The row LENGTHS
                            are the argument — four boxes against one — so they
                            sit in the same grid rather than in two cards of
                            equal width, which would flatten the difference. */}
                        <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-6 gap-y-4">
                            <div className="lg:col-span-6">
                                <TapPath
                                    path={BIO_AD_PROBLEM.before}
                                    tone="cold"
                                />
                            </div>
                            <div className="lg:col-span-6">
                                <TapPath path={BIO_AD_PROBLEM.after} tone="warm" />
                            </div>
                        </div>
                    </section>

                    {/* ── 3 · Everything you sell, on one page ──────────── */}
                    <section className="mt-12 md:mt-20">
                        <SectionHeadSplit
                            eyebrow={
                                <span className="inline-flex items-center gap-3">
                                    <span>One page</span>
                                    <StateChip state={labels[BIO_AD_EVERYTHING.key]} />
                                </span>
                            }
                            accent={MINT}
                            lead={BIO_AD_EVERYTHING.body}
                        >
                            Everything you sell,{' '}
                            <span className="text-gradient-wishlist">
                                on one page
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-6 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:items-center gap-y-6">
                            <div className="lg:col-span-5">
                                <PhoneMock labels={labels} withCards />
                            </div>

                            <div className="lg:col-span-7 lg:col-start-6">
                                <ul className="grid gap-3 sm:grid-cols-2">
                                    {BIO_AD_EVERYTHING.cards.map((card) => (
                                        <li
                                            key={card}
                                            className="flex items-center gap-3.5 rounded-box-sm border-2 border-white/15 bg-white/[0.04] px-5 py-4 text-base text-white md:text-lg"
                                        >
                                            <span
                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black"
                                                style={{ backgroundColor: MINT }}
                                            >
                                                <Check size={13} strokeWidth={4} />
                                            </span>
                                            <span>{card}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* ── 4 · Built for the phone ─────────────────────────── */}
                    <section className="mt-12 md:mt-20">
                        <SectionHeadSplit
                            eyebrow={
                                <span className="inline-flex items-center gap-3">
                                    <span>Where they actually are</span>
                                    <StateChip state={labels[BIO_AD_PHONE.key]} />
                                </span>
                            }
                            accent={MINT}
                            lead={BIO_AD_PHONE.body}
                        >
                            Built for{' '}
                            <span className="text-gradient-wishlist">
                                the phone
                            </span>
                        </SectionHeadSplit>

                        <ArrivalRoute className="mt-10" />
                    </section>

                    {/* ── 5 · Tips, coming soon ─────────────────────────── */}
                    <section className="mt-12 md:mt-20">
                        <SectionHeadSplit
                            eyebrow={
                                <span className="inline-flex items-center gap-3">
                                    <span>Nothing exchanged</span>
                                    <StateChip state={labels[BIO_AD_TIPS.key]} />
                                </span>
                            }
                            accent={VIOLET_INK}
                            lead={BIO_AD_TIPS.body}
                        >
                            Tips,{' '}
                            <span className="text-gradient-wishlist">
                                coming soon
                            </span>
                        </SectionHeadSplit>

                        {/* The button as the product draws it, on the bio page's
                            own ground so it is recognisably that page. */}
                        <div className="mt-6 lg:grid lg:grid-cols-12 lg:gap-x-6">
                            <div className="lg:col-span-5">
                                <div
                                    className="rounded-box p-5"
                                    style={{ backgroundColor: BIO_GROUND }}
                                >
                                    <TipBlock />
                                </div>
                            </div>
                        </div>
                    </section>



                    {/* ── 6 · You control the page ───────────────────────── */}
                    <section className="mt-12 md:mt-20">
                        <SectionHeadSplit
                            eyebrow={
                                <span className="inline-flex items-center gap-3">
                                    <span>No code, no designer</span>
                                    <StateChip state={labels[BIO_AD_CONTROL.key]} />
                                </span>
                            }
                            accent={MINT}
                            lead={BIO_AD_CONTROL.body}
                        >
                            You{' '}
                            <span className="text-gradient-wishlist">
                                control the page
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-6">
                            <div className="lg:col-span-6">
                                <EditorMock />
                            </div>
                        </div>
                    </section>

                    {/* ── 7 · Your traffic — and we count it ────────────── */}
                    {/* ⚠️ NO violet rule here. An earlier pass gave this section a
                        violet top border, which (a) doubled the rule
                        `SectionHeadSplit` already draws and (b) contradicted the
                        page's own colour rule: violet MEANS "coming soon", and
                        attribution is not. Section rules are neutral; the only
                        coloured ones are mint on the proof and pink on the
                        close. */}
                    <section className="mt-16 md:mt-24">
                        <SectionHeadSplit
                            eyebrow="Attribution"
                            accent={VIOLET_INK}
                            lead={BIO_AD_TRAFFIC.body}
                        >
                            Your bio link, your traffic —{' '}
                            <span className="text-gradient-wishlist">
                                and we count it
                            </span>
                        </SectionHeadSplit>

                        {/* The same panel as the other two surfaces, with the ad
                            page's wording. */}
                        <DiscoveryStatsPanel
                            className="mt-10"
                            live={analyticsLive}
                            stats={mockStats}
                            lines={DISCOVERY_AD_WORTH.lines}
                        />

                        <Link
                            href="/creators/discovery"
                            className="mt-6 inline-flex min-h-[44px] items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
                            style={{ textDecorationColor: MINT }}
                        >
                            {BIO_AD_TRAFFIC.linkLabel}
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </section>

                    {/* ── 8 · Final conversion ─────────────────────────── */}
                    {/* ⚠️ LEFT, LIKE EVERY OTHER SECTION. Centring this read as a
                        finale on a page that centres nowhere else, so it landed
                        as a section off the spine rather than as an ending. */}
                    {/* ⚠️ PINK RULE — the action colour, used as a line only here. Every
                        other section opens on a neutral hairline; the last one opens
                        on the colour of the button it ends with. */}
                    <section
                        className="mt-16 border-t-2 pt-8 md:mt-20 md:pt-10"
                        style={{ borderColor: ACCENT.safe }}
                    >
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl lg:w-[calc((100%-11*1.5rem)/12*9+8*1.5rem)]">
                            Swap your bio link.{' '}
                            <span className="text-gradient-wishlist">
                                Keep 100% of your listed price.
                            </span>
                        </h2>

                        <p className="mt-7 text-base leading-[1.6] text-gray-300 md:text-lg lg:w-[calc((100%-11*1.5rem)/12*6+5*1.5rem)]">
                            {BIO_AD_CLOSE.body}
                        </p>

                        <Cta className="mt-9">{BIO_AD_CLOSE.cta}</Cta>
                    </section>
                </AdPage>
            </Guest>
        </>
    );
}


/**
 * The one pink call to action. Black type, brightness on hover, never a scale.
 *
 * 🚨 THE DESTINATION DEPENDS ON WHO IS READING. This is an ad page, so it was
 * hard-wired to `/register` — which sent a creator who is already signed in to a
 * registration form for an account they have. "Create your link" then read as a
 * dead end to the one person who could act on it.
 *
 *   guest      → `/register`, the page it always went to.
 *   creator    → their OWN bio page. It exists the moment the account does, so
 *                "create" is really "go and see it" — and from there the owner
 *                bar is the way into the editor.
 *   supporter  → their profile. `BioPageController::show()` redirects a role-0
 *                account there anyway (a supporter has nothing to list), so
 *                sending them to the bio URL would be a hop through a redirect
 *                to arrive at the same place.
 *
 * ⚠️ Built from `auth.user`, which is a SHARED Inertia prop — the page's own
 * props carry no user. ⚠️ Literal paths, not `route()`: a named route is
 * invisible to the frontend until `ziggy:generate` runs and `route()` THROWS for
 * a name it does not carry, which on an ad page would surface as a broken CTA
 * rather than as the missing route it is.
 */
function Cta({ children, className = '' }) {
    const user = usePage().props?.auth?.user;

    let href = '/register';

    if (user?.username) {
        href =
            Number(user.role) === 1
                ? `/${user.username}/bio`
                : `/${user.username}`;
    }

    return (
        <div className={`flex ${className}`}>
            <Link
                href={href}
                className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-box-sm bg-[#FF007F] px-9 font-gulfs text-[13px] uppercase tracking-[0.16em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
            >
                <span>{children}</span>
                <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                />
            </Link>
        </div>
    );
}

/** LIVE NOW / COMING SOON, read from the shared config map. */
function StateChip({ state }) {
    const isLive = state === 'live';

    return isLive ? (
        <span
            /* ⚠️ A TRANSPARENT 2px BORDER, so the filled chip and the
               outlined one below are the SAME box. Measured: without it the mint
               chip was 29px tall and the violet one 33px — two labels doing the
               same job at two different sizes in the same row. */
            className="inline-flex items-center rounded-box-xs border-2 border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-black"
            style={{ backgroundColor: MINT }}
        >
            {DISCOVERY_LABEL_TEXT.live}
        </span>
    ) : (
        <span
            className="inline-flex items-center rounded-box-xs border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]"
            style={{ borderColor: `${VIOLET}80`, color: VIOLET_INK }}
        >
            {DISCOVERY_LABEL_TEXT.coming_soon}
        </span>
    );
}

/**
 * One route to a purchase, drawn as the screens a supporter actually taps
 * through — not as words describing them.
 *
 * 🚨 THE FADE IS THE ARGUMENT. The cold path's screens dim step by step, because
 * the section's own lead says "every tap loses supporters" and a row of four
 * identical boxes says the opposite: that all four steps cost the same. The
 * ladder is on the SCREENS only, which are decorative and `aria-hidden`; the
 * step labels stay at full strength, because dimming text to 0.4 on this ink
 * ground fails contrast for the readers who need it most.
 *
 * ⚠️ The competing pattern is DRAWN and DESCRIBED, never named — the brief bans
 * competitor names on this page. "A normal bio link" is doing that work, and the
 * wireframes are generic on purpose: no logo, no recognisable chrome.
 *
 * ⚠️ `h-full` so the two boxes match height in the grid. The warm box holds one
 * screen against four, and that empty space IS the point — but a short box beside
 * a tall one reads as an unfinished card rather than as a shorter journey.
 */
function TapPath({ path, tone }) {
    const warm = tone === 'warm';

    return (
        <div
            className="flex h-full flex-col rounded-box border-2 p-6 md:p-7"
            style={{
                borderColor: warm ? MINT : 'rgba(255,255,255,0.15)',
                backgroundColor: warm
                    ? 'rgba(5,239,184,0.06)'
                    : 'rgba(255,255,255,0.04)',
            }}
        >
            <div className="flex items-baseline justify-between gap-4">
                <p className="font-gulfs text-[12px] uppercase tracking-[0.18em] text-white/70">
                    {path.label}
                </p>
                <p
                    className="shrink-0 font-gulfs text-2xl uppercase leading-none tracking-tight md:text-3xl"
                    style={{ color: warm ? MINT : 'rgba(255,255,255,0.55)' }}
                >
                    {path.count}
                </p>
            </div>

            <ol className="mt-7 flex flex-wrap items-start gap-1.5 md:gap-2.5">
                {path.taps.map((tap, i) => (
                    <li key={tap} className="flex items-start gap-1.5 md:gap-2.5">
                        <div className="w-[50px] md:w-[62px]">
                            <MiniScreen
                                kind={screenKind(tap)}
                                warm={warm}
                                dim={warm ? 1 : 1 - i * 0.18}
                            />
                            <p className="mt-2 break-words text-center font-mono text-[10px] uppercase leading-[1.3] tracking-[0.04em] text-white/70 md:text-[11px]">
                                {tap}
                            </p>
                        </div>

                        {i < path.taps.length - 1 ? (
                            <ArrowRight
                                size={13}
                                aria-hidden="true"
                                className="mt-[30px] shrink-0 text-white/30 md:mt-[38px]"
                            />
                        ) : null}
                    </li>
                ))}
            </ol>
        </div>
    );
}

/**
 * Which wireframe a step is drawn as, read off the step's own label.
 *
 * ⚠️ Keyed on the LABEL, not the index — the labels live in
 * `constants/discovery.js` and the warm path has one step where the cold path
 * has four, so an index would draw "Checkout" as a page of buttons.
 */
const SCREEN_KIND = {
    'page of buttons': 'buttons',
    profile: 'profile',
    item: 'item',
    checkout: 'checkout',
};

function screenKind(label) {
    return SCREEN_KIND[String(label).toLowerCase()] ?? 'buttons';
}

/**
 * One phone screen as a wireframe, small enough that four fit a phone-width
 * card. Decorative — every bar is `aria-hidden`, the step name beside it is the
 * accessible text.
 */
function MiniScreen({ kind, warm = false, dim = 1 }) {
    const bar = warm ? 'bg-black/25' : 'bg-white/25';
    const barStrong = warm ? 'bg-black/45' : 'bg-white/40';

    return (
        <div
            aria-hidden="true"
            className="rounded-box-xs border-2 p-1.5 md:p-2"
            style={{
                opacity: dim,
                borderColor: warm ? '#000' : 'rgba(255,255,255,0.22)',
                backgroundColor: warm ? BIO_GROUND : 'rgba(255,255,255,0.05)',
            }}
        >
            <div className="flex h-[58px] flex-col md:h-[72px]">
                {kind === 'buttons' && (
                    <div className="flex flex-1 flex-col justify-center gap-1.5">
                        {[1, 2, 3, 4].map((n) => (
                            <span
                                key={n}
                                className={`h-1.5 w-full rounded-full ${bar}`}
                            />
                        ))}
                    </div>
                )}

                {kind === 'profile' && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                        <span
                            className={`h-4 w-4 rounded-full md:h-5 md:w-5 ${bar}`}
                        />
                        <span className={`h-1.5 w-4/5 rounded-full ${bar}`} />
                        <span className={`h-1.5 w-1/2 rounded-full ${bar}`} />
                    </div>
                )}

                {kind === 'item' && (
                    <div className="flex flex-1 flex-col gap-1.5">
                        <span className={`flex-1 rounded-[4px] ${bar}`} />
                        <span className={`h-1.5 w-4/5 rounded-full ${bar}`} />
                        <span className={`h-1.5 w-1/3 rounded-full ${barStrong}`} />
                    </div>
                )}

                {kind === 'checkout' && (
                    <div className="flex flex-1 flex-col gap-1.5">
                        <span className={`h-1.5 w-3/4 rounded-full ${bar}`} />
                        <span className={`h-1.5 w-1/2 rounded-full ${bar}`} />
                        <span className="flex-1" />
                        <span
                            className="h-3 w-full rounded-[4px] md:h-3.5"
                            style={{
                                backgroundColor: warm
                                    ? '#000'
                                    : 'rgba(255,255,255,0.35)',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Section 4's picture — where the traffic comes from, and what it does when it
 * lands. Sources, one link, one flow.
 *
 * 🚨 NO WIREFRAME SCREENS HERE, DELIBERATELY. Section 2 already argues in
 * screens two sections above; drawing this in screens too reads as the same
 * picture twice, and the reader stops looking at either. This is a ROUTE set in
 * type — chips, a URL plate, two outcomes — so it carries different material.
 *
 * ⚠️ PLATFORM NAMES ARE TYPE, NEVER LOGOS. The copy already names Instagram,
 * TikTok and X (`BIO_AD_PHONE.body`); a mark would put a third party's brand on
 * a paid advert we do not have permission to use.
 *
 * ⚠️ The URL is `yourname`, not a real handle — same reasoning as `PhoneMock`'s
 * docblock: a real creator's name does not go into an advert.
 */
function ArrivalRoute({ className = '' }) {
    return (
        <div
            className={`rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-8 ${className}`}
        >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
                <div className="lg:w-[180px]">
                    <RouteStep>They're already here</RouteStep>
                    <ul className="mt-3.5 flex flex-wrap gap-2">
                        {['Instagram', 'TikTok', 'X'].map((app) => (
                            <li
                                key={app}
                                className="rounded-box-sm border-2 border-white/20 px-3.5 py-2 text-sm text-white/85"
                            >
                                {app}
                            </li>
                        ))}
                    </ul>
                </div>

                <RouteJoin />

                <div className="min-w-0 flex-1">
                    <RouteStep>One link in your bio</RouteStep>
                    <div
                        className="mt-3.5 flex flex-wrap items-baseline gap-x-0.5 rounded-box-sm border-2 px-4 py-3.5"
                        style={{
                            borderColor: MINT,
                            backgroundColor: 'rgba(5,239,184,0.07)',
                        }}
                    >
                        <span className="font-mono text-[13px] text-white/55">
                            spennypiggy.co/
                        </span>
                        <span
                            className="font-gulfs text-[15px] uppercase tracking-tight"
                            style={{ color: MINT }}
                        >
                            yourname
                        </span>
                    </div>
                </div>

                <RouteJoin />

                <div className="lg:w-[220px]">
                    <RouteStep>One page, one flow</RouteStep>
                    <ul className="mt-3.5 grid gap-2">
                        {['Reads in one scroll', 'Pays without leaving'].map(
                            (line) => (
                                <li
                                    key={line}
                                    className="flex items-center gap-3 rounded-box-sm border-2 border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white"
                                >
                                    <span
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-black"
                                        style={{ backgroundColor: MINT }}
                                    >
                                        <Check size={11} strokeWidth={4} />
                                    </span>
                                    <span>{line}</span>
                                </li>
                            ),
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

/** The step name above each leg of the route. */
function RouteStep({ children }) {
    return (
        <p className="font-gulfs text-[11px] uppercase tracking-[0.2em] text-white/50">
            {children}
        </p>
    );
}

/**
 * The joint between two legs. Turns a quarter-turn on small screens, where the
 * route stacks — an arrow still pointing right down a vertical stack is the
 * commonest way a diagram like this stops making sense on a phone.
 */
function RouteJoin() {
    return (
        <div
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center lg:pt-7"
        >
            <ArrowRight
                size={16}
                className="rotate-90 text-white/30 lg:rotate-0"
            />
        </div>
    );
}

/**
 * Section 6's picture — the editor as the creator meets it: rows they can drag,
 * and a switch that decides what a supporter sees.
 *
 * ⚠️ A WHITE BLOCK ON THE DARK FIELD, like `LedgerFrame` — the page's rule is
 * that solid colour lives on blocks, never on a section. The editor is a piece
 * of product chrome, so it is drawn in the product's own black-on-white, not as
 * another translucent panel.
 *
 * ⚠️ CAPTIONED AS AN ILLUSTRATION, same as `PhoneMock`. Section 6 is gated by
 * `bio_direct_sales` and may be showing COMING SOON right beside this; a mock
 * that looks like a screenshot would contradict its own chip.
 *
 * ⚠️ The last row is OFF on purpose. A list of four identical switches teaches
 * nothing — the one that is off is what says the switch does something.
 */
function EditorMock() {
    const rows = [
        { label: 'Sell Exclusive Content', on: true },
        { label: 'Memberships', on: true },
        { label: 'Content Goals', on: true },
        { label: 'Shop', on: false },
    ];

    return (
        <div>
            <div className="overflow-hidden rounded-box border-2 border-black bg-white">
                <div className="flex items-center justify-between gap-3 border-b-2 border-black px-5 py-3.5">
                    <span className="font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/70">
                        Your link page
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/50">
                        Drag to reorder
                    </span>
                </div>

                <ul className="divide-y-2 divide-black">
                    {rows.map((row) => (
                        <li
                            key={row.label}
                            className="flex items-center gap-4 px-5 py-4"
                        >
                            <GripVertical
                                size={16}
                                aria-hidden="true"
                                className="shrink-0 text-black/30"
                            />
                            <span
                                className={`min-w-0 flex-1 font-gulfs text-[14px] uppercase leading-[1.2] tracking-tight ${
                                    row.on ? 'text-black' : 'text-black/40'
                                }`}
                            >
                                {row.label}
                            </span>
                            <Switch on={row.on} />
                        </li>
                    ))}
                </ul>

                <div className="border-t-2 border-black bg-black px-5 py-3.5">
                    <p className="font-mono text-[11px] leading-[1.5] text-white/70">
                        Shop is switched off — supporters never see it.
                    </p>
                </div>
            </div>

            <p className="mt-3 font-gulfs text-[10px] uppercase tracking-[0.2em] text-white/40">
                Illustration of the link page editor
            </p>
        </div>
    );
}

/**
 * The show/hide switch, drawn as the product draws a control: a black knob in a
 * black frame, mint when on.
 *
 * ⚠️ Decorative — `aria-hidden`, and not a `<button>`. It is a picture of a
 * control on a marketing page, so it must not take keyboard focus or announce
 * itself as something a reader can operate here.
 */
function Switch({ on }) {
    return (
        <span
            aria-hidden="true"
            className="inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-black p-0.5"
            style={{ backgroundColor: on ? MINT : 'rgba(0,0,0,0.08)' }}
        >
            <span
                className={`h-4 w-4 rounded-full bg-black ${
                    on ? 'translate-x-5' : ''
                }`}
            />
        </span>
    );
}

/**
 * The Tip block, as `Pages/Bio/Show.jsx` draws it while the feature is
 * unbuilt: dashed edge (the house signal for "announced, not built"), greyed,
 * no amount, no date, no settlement speed.
 *
 * ⚠️ Rendered in its unbuilt state UNCONDITIONALLY here, because the brief asks
 * to "show the Tip button greyed out exactly as it appears in the product" —
 * this is an illustration of a coming-soon feature, not a live control.
 */
function TipBlock() {
    return (
        <div className="rounded-box border-2 border-dashed border-black/35 bg-white/35 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate font-gulfs text-[14px] uppercase leading-[1.2] tracking-tight text-black/55">
                    {STABLECOIN_COPY.card.title}
                </span>
                <span className="shrink-0 rounded-box-xs bg-black/10 px-2 py-1 font-gulfs text-[10px] uppercase tracking-[0.16em] text-black/50">
                    {STABLECOIN_COPY.card.detail}
                </span>
            </div>

            <p className="mt-2 font-poppins text-[12.5px] leading-[1.55] text-black/50">
                {STABLECOIN_COPY.card.line}
            </p>
        </div>
    );
}

/**
 * The bio page on a phone.
 *
 * ⚠️ Drawn, not screenshotted — same reasoning as the Discover frame on
 * `/creators/discovery`: a screenshot of a real creator's bio page puts their
 * name and face into a paid advert. `withCards` shows the sellable-item cards
 * that the B stream adds; without it, the link rows the page carries today.
 */
function PhoneMock({ labels, withCards = false, alignRight = false }) {
    /* ⚠️ `alignRight` only in the hero, where this IS the right-hand column.
       In section 3 the mock sits in the LEFT column, and `ml-auto` there pushed
       it 190px off the page's spine — the frame drifting away from the heading
       above it. */
    const soon = labels?.bio_direct_sales !== 'live';

    return (
        <div className={`w-full max-w-[300px] ${alignRight ? "lg:ml-auto" : ""}`}>
            <div className="rounded-box border-2 border-white/20 bg-black p-3">
                <div
                    className="rounded-box-sm p-4"
                    style={{ backgroundColor: BIO_GROUND }}
                >
                    {/* Avatar + handle */}
                    <div className="flex flex-col items-center">
                        <div
                            aria-hidden="true"
                            className="h-14 w-14 rounded-full border-2 border-black bg-black/10"
                        />
                        <div
                            aria-hidden="true"
                            className="mt-2.5 h-3 w-24 rounded-full bg-black/25"
                        />
                        <div
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-16 rounded-full bg-black/15"
                        />
                    </div>

                    {withCards ? (
                        <>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-box-xs border-2 border-black/70 bg-white/60 p-2"
                                    >
                                        <div
                                            aria-hidden="true"
                                            className="h-10 w-full rounded-[6px] bg-black/10"
                                        />
                                        <div
                                            aria-hidden="true"
                                            className="mt-1.5 h-2 w-4/5 rounded-full bg-black/25"
                                        />
                                        <div
                                            aria-hidden="true"
                                            className="mt-1 h-2 w-1/3 rounded-full bg-black/40"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 rounded-box-xs bg-black px-3 py-2 text-center font-gulfs text-[10px] uppercase tracking-[0.16em] text-white">
                                Buy now
                            </div>

                            {soon ? (
                                <p className="mt-2 text-center font-gulfs text-[9px] uppercase tracking-[0.16em] text-black/45">
                                    {DISCOVERY_LABEL_TEXT.coming_soon}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        // The rows as the live page draws them: one block, shared
                        // hairlines, never a stack of floating pills.
                        <div className="mt-4 overflow-hidden rounded-box-xs border-2 border-black">
                            <div className="grid gap-px bg-black">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2.5 px-3 py-2.5"
                                        style={{ backgroundColor: BIO_GROUND }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="h-5 w-5 shrink-0 rounded-[5px] bg-black/20"
                                        />
                                        <span
                                            aria-hidden="true"
                                            className="h-2 rounded-full bg-black/25"
                                            style={{ width: `${58 - i * 6}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-3 text-center font-gulfs text-[10px] uppercase tracking-[0.2em] text-white/40">
                Illustration of a Spenny Piggy link page
            </p>
        </div>
    );
}
