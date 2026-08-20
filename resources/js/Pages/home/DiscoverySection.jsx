import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import FadeIn from '@/Components/animations/FadeIn';
import DiscoveryStatsPanel from '@/Components/discovery/DiscoveryStatsPanel';
import {
    DISCOVERY_BLOCKS,
    DISCOVERY_CTA,
    DISCOVERY_HEADLINE,
    DISCOVERY_HEADLINE_ACCENT,
    DISCOVERY_LABEL_TEXT,
    DISCOVERY_LEAD,
} from '@/constants/discovery';

/**
 * A1 — the Discovery section, directly beneath the hero.
 *
 * 🚨 THE SECOND THING A VISITOR SEES, so it is imported EAGERLY in
 * `Welcome.jsx` while every other homepage section is `lazy()`. A Suspense
 * placeholder in the most valuable slot on the site would flash on first paint
 * and land inside the LCP window — the code-splitting that helps eighteen
 * below-the-fold sections costs us here.
 *
 * ⚠️ NO COPY IS WRITTEN IN THIS FILE. Every string comes from
 * `@/constants/discovery`, transcribed word for word from the client brief
 * (Developer Master Plan, 19 Aug 2026, A1) and reused by the /creators/discovery
 * ad page. Every LIVE NOW / COMING SOON label comes from `config/discovery.php`
 * via the `labels` prop, so a flip is a config change with no deploy — four are
 * already scheduled.
 *
 * ⚠️ TRANSPARENT BACKGROUND, deliberately. The homepage is one dark `PageCanvas`
 * field and a section with its own background colour cuts it — see the note at
 * the top of `Welcome.jsx` and `PageCanvas`'s own docblock.
 *
 * House rules applied: no shadow anywhere (`npm run check` fails the build on
 * one), `rounded-box` tokens rather than the named radius scale, no scale on
 * hover or tap, and black type on the pink CTA with `hover:brightness-110`.
 */

const MINT = '#05EFB8';

/*
 * 🚨 THE COLOUR IS THE STATE, not decoration. `Components/UI/tokens.js` gives
 * each accent a meaning — mint is "earned, live, settled: anything that has
 * already gone right", violet is "scheduled, pending, in flight: nothing to do"
 * — and this section is ABOUT that distinction: 21 of its 29 capabilities are
 * still to come. In grey they read as a wall of absence; in violet they read as
 * a roadmap, which is both truer and what the section is selling.
 *
 * ⚠️ TWO VIOLETS. Measured on this ground, `#8C52FF` is 4.47:1 — under AA — and
 * these labels are small, so the dark violet is only ever a border and
 * `#C4A5FF` (9.53:1) is the ink. Same pair, same rule as
 * `home/StablecoinTipsAnnouncement.jsx`.
 */
const VIOLET = '#8C52FF';
const VIOLET_INK = '#C4A5FF';

/**
 * The headline, split once at module load so the accent falls on its tail
 * without a second copy of the words existing anywhere. If the accent is ever
 * edited to something the headline does not contain, `lead` is the whole
 * headline and the accent renders after it — the words all still appear, which
 * is the failure mode to prefer on a page of final client copy.
 */
const headlineLead = DISCOVERY_HEADLINE.endsWith(DISCOVERY_HEADLINE_ACCENT)
    ? DISCOVERY_HEADLINE.slice(0, -DISCOVERY_HEADLINE_ACCENT.length)
    : `${DISCOVERY_HEADLINE} `;

export default function DiscoverySection({ discovery }) {
    const labels = discovery?.labels ?? {};
    const analyticsLive = Boolean(discovery?.analyticsLive);
    const mockStats = discovery?.mockStats;

    return (
        <section
            id="act-discover"
            aria-labelledby="discovery-headline"
            className="containerbox mx-auto px-4 py-16 md:py-24"
        >
            <FadeIn y={18}>
                <h2
                    id="discovery-headline"
                    className="max-w-4xl font-gulfs text-4xl uppercase leading-[0.9] tracking-tight text-white sm:text-5xl md:text-6xl"
                >
                    {headlineLead}
                    <span className="text-gradient-wishlist">
                        {DISCOVERY_HEADLINE_ACCENT}
                    </span>
                </h2>

                <p className="mt-6 max-w-xl text-base leading-[1.6] text-gray-300 md:text-lg">
                    {DISCOVERY_LEAD}
                </p>
            </FadeIn>

            {/* 🚨 ONE FRAME, THREE COLUMNS SHARING HAIRLINES — the platform's own
                device (`StatStrip`, `WaysToGetPaid`, the bio page's link block),
                whose docblocks give the reason: many sources, one income. Here:
                three ways to be found, one system.

                It was three separately-bordered cards with a 20px gutter, which
                is both taller (three border sets, three sets of padding) and off
                the house language — a row of unrelated cards says these are
                three products, when the section's whole argument is that they
                are one. ⚠️ The children stay TRANSPARENT and the rules are
                `divide-*`, not a `gap-px` over a coloured parent: this page is
                one dark PageCanvas field and a child with its own background
                cuts it (see the note at the top of `Welcome.jsx`). */}
            <div className="mt-10 overflow-hidden rounded-box border-2 border-white/15 divide-y-2 divide-white/15 md:mt-14 lg:grid lg:grid-cols-3 lg:divide-x-2 lg:divide-y-0">
                {DISCOVERY_BLOCKS.map((block, index) => (
                    <FadeIn key={block.id} y={22} delay={0.05 * (index + 1)}>
                        <Block block={block} labels={labels} />
                    </FadeIn>
                ))}
            </div>

            {/* Proof point — the real dashboard component, per the brief. */}
            <FadeIn y={22} delay={0.1}>
                <DiscoveryStatsPanel
                    className="mt-5"
                    live={analyticsLive}
                    stats={mockStats}
                />
            </FadeIn>

            <FadeIn y={14} delay={0.12}>
                <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    {/* Black type on pink — white measures 3.78:1 and fails AA.
                        Brightness on hover, never a hue change and never a scale. */}
                    <Link
                        href={DISCOVERY_CTA.primary.href}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-box-sm bg-[#FF007F] px-8 font-gulfs text-[13px] uppercase tracking-[0.16em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                    >
                        {DISCOVERY_CTA.primary.label}
                    </Link>

                    <Link
                        href={DISCOVERY_CTA.secondary.href}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-box-sm border-2 border-white/25 px-8 font-gulfs text-[13px] uppercase tracking-[0.16em] text-white transition-opacity duration-200 hover:opacity-70"
                    >
                        {DISCOVERY_CTA.secondary.label}
                        <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
}

/**
 * One block. Its items are sorted into the two label groups at render time from
 * the config map — the constants file deliberately stores them as one flat list
 * with a key, so a capability moving from COMING SOON to LIVE NOW needs no edit
 * here and no edit there.
 *
 * ⚠️ An unknown key falls to COMING SOON. That is the safe direction: the
 * expensive mistake is advertising something as live that is not.
 */
function Block({ block, labels }) {
    const live = block.items.filter((item) => labels[item.key] === 'live');
    const comingSoon = block.items.filter((item) => labels[item.key] !== 'live');

    return (
        <div className="flex h-full flex-col p-6 md:p-7">
            <h3 className="font-gulfs text-xl uppercase leading-[0.95] tracking-tight text-white md:text-2xl">
                {block.title}
            </h3>

            <p className="mt-3 text-sm leading-[1.55] text-gray-300">
                {block.body}
            </p>

            {/* ⚠️ THE SPACER IS ON THE FOOTER, NOT THE LISTS. `grow` here made the
                two groups inside a SHORT column spread apart to fill the height,
                so "We'll Promote You" rendered its one LIVE NOW item, then ~100px
                of nothing, then COMING SOON — a hole in the middle of a column
                that reads as a missing item. The footers still align, because
                `mt-auto` on the footer absorbs the same leftover space at the
                bottom where it belongs, and `pt-5` keeps the rule off the last
                list item. */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                <LabelGroup state="live" items={live} />
                <LabelGroup state="coming_soon" items={comingSoon} />
            </div>

            <p className="mt-auto pt-6 border-t-2 border-white/10 text-sm font-medium leading-[1.5] text-white">
                {block.footer}
            </p>
        </div>
    );
}

/**
 * A labelled group of capabilities.
 *
 * ⚠️ The two states are separated by MORE than colour — a filled mint chip
 * against an outlined muted one, and a filled marker against a hollow ring.
 * Once the block stacks on a phone the two lists sit directly on top of each
 * other, and colour alone would not tell them apart for anyone who cannot
 * distinguish it.
 */
function LabelGroup({ state, items }) {
    if (items.length === 0) return null;

    const isLive = state === 'live';

    return (
        <div>
            {isLive ? (
                <span
                    /* ⚠️ Transparent 2px border so this matches the outlined
                       COMING SOON chip's box exactly — see the note in
                       `Pages/creators/Discovery.jsx`. */
                    className="inline-flex items-center rounded-box-xs border-2 border-transparent px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-black"
                    style={{ backgroundColor: MINT }}
                >
                    {DISCOVERY_LABEL_TEXT.live}
                </span>
            ) : (
                <span
                    className="inline-flex items-center rounded-box-xs border-2 px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.08em]"
                    style={{ borderColor: `${VIOLET}80`, color: VIOLET_INK }}
                >
                    {DISCOVERY_LABEL_TEXT.coming_soon}
                </span>
            )}

            <ul className="mt-3 space-y-2">
                {items.map((item) => (
                    <li
                        key={`${item.key}-${item.label}`}
                        className={`flex items-start gap-2.5 text-sm leading-[1.45] md:text-[15px] ${
                            isLive ? 'text-white' : 'text-gray-300/80'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className="mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full border-2"
                            style={
                                isLive
                                    ? { backgroundColor: MINT, borderColor: MINT }
                                    : { borderColor: VIOLET_INK }
                            }
                        />
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
