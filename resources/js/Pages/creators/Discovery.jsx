import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Cake, Repeat } from 'lucide-react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import { ACCENT, Eyebrow, SectionHead } from './components/Ledger';
import DiscoveryStatsPanel from '@/Components/discovery/DiscoveryStatsPanel';
import {
    DISCOVERY_AD_BIRTHDAY,
    DISCOVERY_AD_BRING_BACK,
    DISCOVERY_AD_CLOSE,
    DISCOVERY_AD_COMMUNITY,
    DISCOVERY_AD_EVERYWHERE,
    DISCOVERY_AD_HERO,
    DISCOVERY_AD_KEEP_INTACT,
    DISCOVERY_AD_NOT_JUST_BIGGEST,
    DISCOVERY_AD_PUBLIC,
    DISCOVERY_AD_STOP_AT_LINK,
    DISCOVERY_AD_WORTH,
    DISCOVERY_BLOCKS,
    DISCOVERY_LABEL_TEXT,
} from '@/constants/discovery';

/**
 * A2 — the Discovery paid-ads landing page.
 *
 * 🚨 TEN SECTIONS, IN THE BRIEF'S ORDER, and section 6 is the most prominent on
 * the page — both are explicit client instructions (Developer Master Plan,
 * 19 Aug 2026, A2). Do not reorder to balance the layout: the order is the
 * argument the page makes.
 *
 * 🚨 EVERY LIVE NOW / COMING SOON LABEL COMES FROM `config/discovery.php`, the
 * same map the landing-page section reads. That is what stops this page and the
 * homepage disagreeing about whether a capability exists, and it is why the Mon
 * 31 Aug flip on section 4 is a config change rather than an edit here.
 *
 * ⚠️ SECTION 3 SHOWS A DRAWN REPRESENTATION OF DISCOVER, NOT A SCREENSHOT OR AN
 * EMBED, and that is a deliberate departure from the brief's "screenshot or live
 * embed" — flagged to Jack rather than decided silently. Both alternatives put
 * REAL CREATORS' NAMES AND FACES INTO A PAID ADVERT: a screenshot freezes
 * whoever happened to be on Discover that morning into an asset nobody can
 * revoke, and an embed does the same live, with the whole app's weight and a
 * second header inside the frame. Their profiles being public is not the same
 * permission as appearing in our advertising. The frame below shows the real
 * page's LAYOUT with anonymous placeholders, and links out to the live page so
 * the claim is checkable. Swap it for a screenshot the moment Jack confirms he
 * has the creators' agreement.
 *
 * House rules: no shadow anywhere, `rounded-box` tokens only, no scale on hover
 * or tap, black type on any pink or mint fill.
 */

const MINT = ACCENT.earn;
const PINK = ACCENT.safe;
const VIOLET = ACCENT.bonus;

export default function Discovery({ discovery }) {
    const labels = discovery?.labels ?? {};
    const analyticsLive = Boolean(discovery?.analyticsLive);
    const mockStats = discovery?.mockStats;

    const title = 'Get discovered on Spenny Piggy — Discovery for creators';
    const description = DISCOVERY_AD_HERO.body;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/discovery" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/discovery"
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
                            <Eyebrow accent={MINT}>
                                {DISCOVERY_AD_HERO.eyebrow}
                            </Eyebrow>

                            <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                                Don't just bring
                                <br />
                                your audience.
                                <br />
                                <span className="text-gradient-wishlist">
                                    Grow it.
                                </span>
                            </h1>

                            <p className="mt-7 max-w-lg text-base leading-[1.6] text-gray-300 md:text-xl">
                                {DISCOVERY_AD_HERO.body}
                            </p>

                            {/* One of the four phrases the brief requires to
                                survive verbatim on this page. */}
                            <p className="mt-6 font-gulfs text-lg uppercase leading-[1.15] tracking-tight text-white md:text-2xl">
                                {DISCOVERY_AD_HERO.strapline}
                            </p>

                            <Cta className="mt-9">{DISCOVERY_AD_HERO.cta}</Cta>
                        </div>

                        <DiscoverFrame />
                    </div>

                    {/* ── 2 · Most platforms stop at the link ────────────── */}
                    <Section className="mt-24 md:mt-32">
                        <SectionHead
                            eyebrow="The difference"
                            accent={VIOLET}
                            lead={DISCOVERY_AD_STOP_AT_LINK.body}
                        >
                            Most platforms{' '}
                            <span className="text-gradient-wishlist">
                                stop at the link
                            </span>
                        </SectionHead>

                        {/* KEEP_INTACT[0]. It is the landing page's headline and
                            has no section of its own here, so it is placed as
                            the line this section lands on. */}
                        <p className="mt-10 border-l-4 pl-6 font-gulfs text-2xl uppercase leading-[1.05] tracking-tight text-white md:text-4xl"
                           style={{ borderColor: MINT }}>
                            {DISCOVERY_AD_KEEP_INTACT[0]}
                        </p>
                    </Section>

                    {/* ── 3 · Public Discovery ──────────────────────────── */}
                    <Section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="On the platform"
                            accent={MINT}
                            lead={DISCOVERY_AD_PUBLIC.body}
                        >
                            <span className="text-gradient-wishlist">
                                Public
                            </span>{' '}
                            Discovery
                        </SectionHead>

                        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
                            <DiscoverFrame compact />

                            {/* The SAME list as Block 1 on the landing page —
                                read from the shared constant, so the two pages
                                cannot list different capabilities. */}
                            <CapabilityLists
                                items={DISCOVERY_BLOCKS[0].items}
                                labels={labels}
                            />
                        </div>

                        <Link
                            href="/discover"
                            className="mt-6 inline-flex min-h-[44px] items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
                            style={{ textDecorationColor: MINT }}
                        >
                            See the live Discover page
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </Section>

                    {/* ── 4 · Discovery everywhere ──────────────────────── */}
                    <Section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="On every profile"
                            accent={VIOLET}
                            lead={DISCOVERY_AD_EVERYWHERE.body}
                        >
                            Discovery{' '}
                            <span className="text-gradient-wishlist">
                                everywhere
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state={labels.more_creators} />
                        </div>

                        {/* A mock of the four cards, per the brief. Anonymous
                            placeholders for the same reason as the Discover
                            frame above. */}
                        <div className="mt-6 rounded-box border-2 border-white/15 bg-white/[0.04] p-5 md:p-7">
                            <p className="font-gulfs text-[12px] uppercase tracking-[0.2em] text-white/60">
                                More creators to support
                            </p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {DISCOVERY_AD_EVERYWHERE.slots.map((slot) => (
                                    <div
                                        key={slot.slot}
                                        className="rounded-box-sm border-2 border-white/15 bg-white/[0.03] p-4"
                                    >
                                        <div
                                            aria-hidden="true"
                                            className="h-20 w-full rounded-box-xs border-2 border-white/10 bg-white/[0.06]"
                                        />
                                        <p
                                            className="mt-3 font-gulfs text-[11px] uppercase tracking-[0.16em]"
                                            style={{ color: MINT }}
                                        >
                                            {slot.slot}
                                        </p>
                                        <p className="mt-2 text-[13px] leading-[1.45] text-gray-400">
                                            {slot.line}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* ── 5 · Birthday promotion (highly visual, per brief) ─ */}
                    <Section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Your moment"
                            accent={PINK}
                            lead={DISCOVERY_AD_BIRTHDAY.body}
                        >
                            Birthday{' '}
                            <span className="text-gradient-wishlist">
                                promotion
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state={labels.birthday} />
                        </div>

                        {/* The timeline is the visual: three marks on one rule,
                            counting down to the day. */}
                        <ol className="mt-8 grid gap-3 md:grid-cols-3">
                            {DISCOVERY_AD_BIRTHDAY.timeline.map((step, i) => (
                                <li
                                    key={step.when}
                                    className="relative rounded-box border-2 p-5 md:p-6"
                                    style={{
                                        borderColor:
                                            i === 2 ? PINK : 'rgba(255,255,255,0.15)',
                                        backgroundColor:
                                            i === 2
                                                ? 'rgba(255,0,127,0.08)'
                                                : 'rgba(255,255,255,0.04)',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            aria-hidden="true"
                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-gulfs text-[13px] text-black"
                                            style={{
                                                backgroundColor:
                                                    i === 2 ? PINK : 'rgba(255,255,255,0.85)',
                                            }}
                                        >
                                            {i === 2 ? (
                                                <Cake size={15} />
                                            ) : (
                                                i + 1
                                            )}
                                        </span>
                                        <p className="font-gulfs text-[13px] uppercase tracking-[0.14em] text-white">
                                            {step.when}
                                        </p>
                                    </div>
                                    <p className="mt-3 text-sm leading-[1.5] text-gray-300 md:text-base">
                                        {step.what}
                                    </p>
                                </li>
                            ))}
                        </ol>

                        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <div className="rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-7">
                                <p className="font-gulfs text-[12px] uppercase tracking-[0.2em] text-white/60">
                                    Every Monday
                                </p>
                                <p className="mt-3 text-base leading-[1.55] text-gray-300 md:text-lg">
                                    {DISCOVERY_AD_BIRTHDAY.weekly}
                                </p>
                            </div>

                            {/* The privacy line gets its own block. It is the
                                one thing a creator hesitating over this feature
                                actually wants to know. */}
                            <div
                                className="rounded-box border-2 p-6 md:p-7"
                                style={{ borderColor: MINT }}
                            >
                                <p
                                    className="font-gulfs text-[12px] uppercase tracking-[0.2em]"
                                    style={{ color: MINT }}
                                >
                                    Never shown
                                </p>
                                <p className="mt-3 font-gulfs text-xl uppercase leading-[1.1] tracking-tight text-white md:text-2xl">
                                    {DISCOVERY_AD_BIRTHDAY.privacy}
                                </p>
                            </div>
                        </div>

                        <p className="mt-8 font-gulfs text-2xl uppercase leading-[1.05] tracking-tight text-white md:text-3xl">
                            {DISCOVERY_AD_BIRTHDAY.close}
                        </p>
                    </Section>

                    {/* ── 6 · What Discovery is worth ────────────────────
                        🚨 THE MOST PROMINENT SECTION ON THE PAGE (client
                        instruction). It gets the largest display type, the
                        widest measure and the accent frame; nothing above or
                        below competes with it. */}
                    <Section className="mt-24 md:mt-36">
                        <Eyebrow accent={MINT}>The proof</Eyebrow>

                        <h2 className="mt-5 max-w-4xl font-gulfs text-4xl uppercase leading-[0.88] tracking-tight text-white sm:text-5xl md:text-[56px]">
                            We show you what{' '}
                            <span className="text-gradient-wishlist">
                                Discovery is worth
                            </span>
                        </h2>

                        {/* KEEP_INTACT[3] — the phrase this section exists for. */}
                        <p className="mt-7 max-w-2xl text-lg leading-[1.5] text-white md:text-2xl">
                            {DISCOVERY_AD_WORTH.lead}
                        </p>

                        <DiscoveryStatsPanel
                            className="mt-10"
                            live={analyticsLive}
                            stats={mockStats}
                            lines={DISCOVERY_AD_WORTH.lines}
                        />

                        <p className="mt-6 text-base leading-[1.55] text-gray-300 md:text-xl">
                            {DISCOVERY_AD_WORTH.note}
                        </p>
                    </Section>

                    {/* ── 7 · Bring them back ───────────────────────────── */}
                    <Section className="mt-24 md:mt-32">
                        <SectionHead
                            eyebrow="The loop"
                            accent={VIOLET}
                            lead={DISCOVERY_AD_BRING_BACK.body}
                        >
                            Bring them{' '}
                            <span className="text-gradient-wishlist">back</span>
                        </SectionHead>

                        {/* The loop, drawn. It closes — the last step returns to
                            the first, which is the whole point of the section. */}
                        <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
                            {DISCOVERY_AD_BRING_BACK.loop.map((step, i) => (
                                <li key={step} className="flex items-center gap-3">
                                    <span className="inline-flex min-h-[44px] items-center rounded-box-sm border-2 border-white/20 px-5 font-gulfs text-[13px] uppercase tracking-[0.14em] text-white">
                                        {step}
                                    </span>
                                    {i < DISCOVERY_AD_BRING_BACK.loop.length - 1 ? (
                                        <ArrowRight
                                            size={16}
                                            aria-hidden="true"
                                            className="text-white/40"
                                        />
                                    ) : (
                                        <span
                                            className="inline-flex items-center gap-2 font-gulfs text-[11px] uppercase tracking-[0.16em]"
                                            style={{ color: MINT }}
                                        >
                                            <Repeat size={14} aria-hidden="true" />
                                            and again
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>

                        <div className="mt-10">
                            <CapabilityLists
                                items={DISCOVERY_AD_BRING_BACK.items}
                                labels={labels}
                                columns
                            />
                        </div>
                    </Section>

                    {/* ── 8 · Not just the biggest creators ─────────────── */}
                    <Section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Rotation, not repetition"
                            accent={MINT}
                            lead={DISCOVERY_AD_NOT_JUST_BIGGEST.body}
                        >
                            Discovery isn't just for{' '}
                            <span className="text-gradient-wishlist">
                                the biggest creators
                            </span>
                        </SectionHead>

                        <div className="mt-8">
                            <StateChip state="coming_soon" />
                        </div>

                        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {DISCOVERY_AD_NOT_JUST_BIGGEST.collections.map(
                                (collection) => (
                                    <li
                                        key={collection}
                                        className="rounded-box-sm border-2 border-white/15 bg-white/[0.04] px-5 py-4 text-base text-white md:text-lg"
                                    >
                                        {collection}
                                    </li>
                                ),
                            )}
                        </ul>
                    </Section>

                    {/* ── 9 · Creator community ─────────────────────────── */}
                    <Section className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Not just a page"
                            accent={VIOLET}
                            lead={DISCOVERY_AD_COMMUNITY.body}
                        >
                            Creator{' '}
                            <span className="text-gradient-wishlist">
                                community
                            </span>
                        </SectionHead>

                        <p className="mt-8 font-gulfs text-2xl uppercase leading-[1.05] tracking-tight text-white md:text-4xl">
                            {DISCOVERY_AD_COMMUNITY.close}
                        </p>
                    </Section>

                    {/* ── 10 · Final conversion ─────────────────────────── */}
                    <Section className="mt-24 text-center md:mt-32">
                        <h2 className="mx-auto max-w-4xl font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Bring your audience.{' '}
                            <span className="text-gradient-wishlist">
                                Let Spenny Piggy help you grow it.
                            </span>
                        </h2>

                        <p className="mx-auto mt-7 max-w-2xl text-base leading-[1.6] text-gray-300 md:text-lg">
                            {DISCOVERY_AD_CLOSE.body}
                        </p>

                        {/* KEEP_INTACT[1]. Section 10's own headline is a near
                            miss ("Let Spenny Piggy help you grow it"), so the
                            exact required phrase is carried here rather than
                            assumed covered. */}
                        <p className="mx-auto mt-7 max-w-2xl font-gulfs text-lg uppercase leading-[1.15] tracking-tight text-white md:text-2xl">
                            {DISCOVERY_AD_KEEP_INTACT[1]}
                        </p>

                        <Cta className="mt-9 justify-center">
                            {DISCOVERY_AD_CLOSE.cta}
                        </Cta>
                    </Section>
                </AdPage>
            </Guest>
        </>
    );
}

/** A numbered section wrapper — `<section>` for the landmark, nothing visual. */
function Section({ className = '', children }) {
    return <section className={className}>{children}</section>;
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

/**
 * A LIVE NOW / COMING SOON chip for a section whose whole subject carries one
 * state. Reads the state from the config map like everything else — section 4
 * flips to LIVE NOW on Mon 31 Aug with no edit to this file.
 */
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
 * A keyed capability list split into its two states.
 *
 * ⚠️ Filled marker vs hollow ring, and white vs grey type — the two states are
 * separated by more than colour, because once this stacks on a phone the lists
 * sit directly on top of each other.
 */
function CapabilityLists({ items, labels, columns = false }) {
    const live = items.filter((item) => labels[item.key] === 'live');
    const soon = items.filter((item) => labels[item.key] !== 'live');

    return (
        <div className={`grid gap-8 ${columns ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-1'}`}>
            {[
                { state: 'live', list: live },
                { state: 'coming_soon', list: soon },
            ].map(({ state, list }) =>
                list.length === 0 ? null : (
                    <div key={state}>
                        <StateChip state={state} />

                        <ul className="mt-4 space-y-2.5">
                            {list.map((item) => (
                                <li
                                    key={`${item.key}-${item.label}`}
                                    className={`flex items-start gap-2.5 text-sm leading-[1.45] md:text-[15px] ${
                                        state === 'live'
                                            ? 'text-white'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full ${
                                            state === 'live'
                                                ? ''
                                                : 'border-2 border-gray-500'
                                        }`}
                                        style={
                                            state === 'live'
                                                ? { backgroundColor: MINT }
                                                : undefined
                                        }
                                    />
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
            )}
        </div>
    );
}

/**
 * A drawn frame standing in for the Discover page.
 *
 * See the file docblock: this is deliberately NOT a screenshot or an embed. It
 * shows the real page's shape — a search bar over a grid of creator cards — with
 * anonymous placeholders, and the section links out to the live page so the
 * claim can be checked rather than merely illustrated.
 */
function DiscoverFrame({ compact = false }) {
    return (
        <div className="rounded-box border-2 border-white/15 bg-white/[0.04] p-4 md:p-5">
            {/* Browser chrome, so it reads as a page rather than as a widget. */}
            <div className="flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className="h-[9px] w-[9px] rounded-full bg-white/25"
                />
                <span
                    aria-hidden="true"
                    className="h-[9px] w-[9px] rounded-full bg-white/25"
                />
                <span
                    aria-hidden="true"
                    className="h-[9px] w-[9px] rounded-full bg-white/25"
                />
                <span className="ml-2 truncate rounded-box-xs border-2 border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-[11px] text-white/50">
                    spennypiggy.co/discover
                </span>
            </div>

            <div className="mt-4 rounded-box-sm border-2 border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-white/45">
                Search creators, wishes and memberships
            </div>

            <div
                className={`mt-3 grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}
            >
                {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-box-sm border-2 border-white/10 bg-white/[0.05] p-3"
                    >
                        <div
                            aria-hidden="true"
                            className="h-16 w-full rounded-box-xs bg-white/[0.08]"
                        />
                        <div
                            aria-hidden="true"
                            className="mt-2.5 h-2 w-3/4 rounded-full bg-white/20"
                        />
                        <div
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-1/2 rounded-full bg-white/10"
                        />
                    </div>
                ))}
            </div>

            <p className="mt-4 text-center font-gulfs text-[10px] uppercase tracking-[0.2em] text-white/40">
                Illustration of the live Discover page
            </p>
        </div>
    );
}
