import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import { ACCENT, Eyebrow, SectionHead } from './components/Ledger';
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
const VIOLET = ACCENT.bonus;

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
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/link-in-bio"
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content="/siteicon.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* ── 1 · Hero ───────────────────────────────────────── */}
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
                        <div>
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

                        <PhoneMock labels={labels} />
                    </div>

                    {/* ── 2 · The problem with most bio links ───────────── */}
                    <section className="mt-24 md:mt-32">
                        <SectionHead
                            eyebrow="Every tap costs you"
                            accent={VIOLET}
                            lead={BIO_AD_PROBLEM.body}
                        >
                            The problem with{' '}
                            <span className="text-gradient-wishlist">
                                most bio links
                            </span>
                        </SectionHead>

                        {/* The before/after the brief asks for. The row LENGTHS
                            are the argument — four boxes against one — so they
                            sit in the same grid rather than in two cards of
                            equal width, which would flatten the difference. */}
                        <div className="mt-10 grid gap-3 lg:grid-cols-2">
                            <TapPath
                                path={BIO_AD_PROBLEM.before}
                                tone="cold"
                            />
                            <TapPath path={BIO_AD_PROBLEM.after} tone="warm" />
                        </div>
                    </section>

                    {/* ── 3 · Everything you sell, on one page ──────────── */}
                    <section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="One page"
                            accent={MINT}
                            lead={BIO_AD_EVERYTHING.body}
                        >
                            Everything you sell,{' '}
                            <span className="text-gradient-wishlist">
                                on one page
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state={labels[BIO_AD_EVERYTHING.key]} />
                        </div>

                        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
                            <PhoneMock labels={labels} withCards />

                            <ul className="grid gap-3 sm:grid-cols-2">
                                {BIO_AD_EVERYTHING.cards.map((card) => (
                                    <li
                                        key={card}
                                        className="rounded-box-sm border-2 border-white/15 bg-white/[0.04] px-5 py-4 text-base text-white md:text-lg"
                                    >
                                        {card}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* ── 4 · Built for the phone ───────────────────────── */}
                    <section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Where they actually are"
                            accent={MINT}
                            lead={BIO_AD_PHONE.body}
                        >
                            Built for{' '}
                            <span className="text-gradient-wishlist">
                                the phone
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state={labels[BIO_AD_PHONE.key]} />
                        </div>
                    </section>

                    {/* ── 5 · Tips, coming soon ─────────────────────────── */}
                    <section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Nothing exchanged"
                            accent={VIOLET}
                            lead={BIO_AD_TIPS.body}
                        >
                            Tips,{' '}
                            <span className="text-gradient-wishlist">
                                coming soon
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state={labels[BIO_AD_TIPS.key]} />
                        </div>

                        {/* The button as the product draws it, on the bio page's
                            own ground so it is recognisably that page. */}
                        <div
                            className="mt-6 max-w-md rounded-box p-5"
                            style={{ backgroundColor: BIO_GROUND }}
                        >
                            <TipBlock />
                        </div>
                    </section>

                    {/* ── 6 · You control the page ─────────────────────── */}
                    <section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="No code, no designer"
                            accent={MINT}
                            lead={BIO_AD_CONTROL.body}
                        >
                            You{' '}
                            <span className="text-gradient-wishlist">
                                control the page
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state={labels[BIO_AD_CONTROL.key]} />
                        </div>
                    </section>

                    {/* ── 7 · Your traffic — and we count it ────────────── */}
                    <section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Attribution"
                            accent={VIOLET}
                            lead={BIO_AD_TRAFFIC.body}
                        >
                            Your bio link, your traffic —{' '}
                            <span className="text-gradient-wishlist">
                                and we count it
                            </span>
                        </SectionHead>

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
                    <section className="mt-24 text-center md:mt-32">
                        <h2 className="mx-auto max-w-4xl font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Swap your bio link.{' '}
                            <span className="text-gradient-wishlist">
                                Keep 100% of your listed price.
                            </span>
                        </h2>

                        <p className="mx-auto mt-7 max-w-2xl text-base leading-[1.6] text-gray-300 md:text-lg">
                            {BIO_AD_CLOSE.body}
                        </p>

                        <Cta className="mt-9 justify-center">
                            {BIO_AD_CLOSE.cta}
                        </Cta>
                    </section>
                </AdPage>
            </Guest>
        </>
    );
}

/** The one pink call to action. Black type, brightness on hover, never a scale. */
function Cta({ children, className = '' }) {
    return (
        <div className={`flex ${className}`}>
            <Link
                href="/register"
                className="inline-flex min-h-[52px] items-center justify-center rounded-box-sm bg-[#FF007F] px-9 font-gulfs text-[13px] uppercase tracking-[0.16em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
            >
                {children}
            </Link>
        </div>
    );
}

/** LIVE NOW / COMING SOON, read from the shared config map. */
function StateChip({ state }) {
    const isLive = state === 'live';

    return isLive ? (
        <span
            className="inline-flex items-center rounded-box-xs px-3 py-1.5 font-gulfs text-[11px] uppercase tracking-[0.16em] text-black"
            style={{ backgroundColor: MINT }}
        >
            {DISCOVERY_LABEL_TEXT.live}
        </span>
    ) : (
        <span className="inline-flex items-center rounded-box-xs border-2 border-white/25 px-3 py-1.5 font-gulfs text-[11px] uppercase tracking-[0.16em] text-gray-400">
            {DISCOVERY_LABEL_TEXT.coming_soon}
        </span>
    );
}

/**
 * One route to a purchase, drawn as its steps.
 *
 * ⚠️ The competing pattern is DESCRIBED, never named — the brief bans competitor
 * names on this page. "A normal bio link" is doing that work.
 */
function TapPath({ path, tone }) {
    const warm = tone === 'warm';

    return (
        <div
            className="rounded-box border-2 p-6 md:p-7"
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

            <ol className="mt-6 flex flex-wrap items-center gap-2">
                {path.taps.map((tap, i) => (
                    <li key={tap} className="flex items-center gap-2">
                        <span
                            className="inline-flex min-h-[40px] items-center rounded-box-sm border-2 px-4 text-sm text-white md:text-[15px]"
                            style={{
                                borderColor: warm
                                    ? MINT
                                    : 'rgba(255,255,255,0.18)',
                            }}
                        >
                            {tap}
                        </span>
                        {i < path.taps.length - 1 ? (
                            <ArrowRight
                                size={15}
                                aria-hidden="true"
                                className="text-white/35"
                            />
                        ) : null}
                    </li>
                ))}
            </ol>
        </div>
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
function PhoneMock({ labels, withCards = false }) {
    const soon = labels?.bio_direct_sales !== 'live';

    return (
        <div className="mx-auto w-full max-w-[300px]">
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
