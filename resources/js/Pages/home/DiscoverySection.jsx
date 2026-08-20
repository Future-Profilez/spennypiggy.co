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
            className="containerbox mx-auto px-4 py-20 md:py-28"
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

                <p className="mt-6 max-w-3xl text-base leading-[1.6] text-gray-300 md:text-xl">
                    {DISCOVERY_LEAD}
                </p>
            </FadeIn>

            <div className="mt-12 grid gap-5 md:mt-16 lg:grid-cols-3">
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
        <div className="flex h-full flex-col rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-7">
            <h3 className="font-gulfs text-2xl uppercase leading-[0.95] tracking-tight text-white md:text-[26px]">
                {block.title}
            </h3>

            <p className="mt-4 text-sm leading-[1.6] text-gray-300 md:text-base">
                {block.body}
            </p>

            {/* `grow` — the LISTS absorb the leftover height, not the footer's
                margin, so the three footers sit on the same line across the row
                even though the blocks carry 12, 9 and 8 items. `mt-auto` on the
                footer would do the same job but collapse its top margin, putting
                the rule hard against the last list item in the tallest card. */}
            <div className="mt-7 grow grid gap-7 sm:grid-cols-2 lg:grid-cols-1">
                <LabelGroup state="live" items={live} />
                <LabelGroup state="coming_soon" items={comingSoon} />
            </div>

            <p className="mt-8 pt-6 border-t-2 border-white/10 text-sm font-medium leading-[1.5] text-white md:text-base">
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
                    className="inline-flex items-center rounded-box-xs px-2.5 py-1 font-gulfs text-[11px] uppercase tracking-[0.16em] text-black"
                    style={{ backgroundColor: MINT }}
                >
                    {DISCOVERY_LABEL_TEXT.live}
                </span>
            ) : (
                <span className="inline-flex items-center rounded-box-xs border-2 border-white/25 px-2.5 py-1 font-gulfs text-[11px] uppercase tracking-[0.16em] text-gray-400">
                    {DISCOVERY_LABEL_TEXT.coming_soon}
                </span>
            )}

            <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                    <li
                        key={`${item.key}-${item.label}`}
                        className={`flex items-start gap-2.5 text-sm leading-[1.45] md:text-[15px] ${
                            isLive ? 'text-white' : 'text-gray-400'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full ${
                                isLive ? '' : 'border-2 border-gray-500'
                            }`}
                            style={isLive ? { backgroundColor: MINT } : undefined}
                        />
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
