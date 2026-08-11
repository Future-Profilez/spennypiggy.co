import FadeIn from '@/Components/animations/FadeIn';
import { STABLECOIN_TIPS_ANNOUNCED, STABLECOIN_COPY } from '@/constants/stablecoinTips';

/**
 * Every way a creator can be paid, in one place.
 *
 * The page sold the features one at a time, spread over six sections, so a
 * visitor deciding whether to sign up never saw the range — which is the single
 * most persuasive thing this platform has.
 *
 * ⚠️ THE SHAPE IS THE ARGUMENT, and the first version got it wrong. Eight equal
 * bordered cards in a rail is a CATALOGUE, and a catalogue makes eight things
 * read as eight chores rather than as eight places money arrives from. Three
 * things fixed it, and all three are structural rather than decorative:
 *
 *   1. The tiles ABUT. They share hairlines instead of sitting in a gapped grid,
 *      so the group reads as one object made of parts — which is the thesis:
 *      many sources, one income.
 *   2. They are GROUPED BY WHEN THE MONEY ARRIVES (once vs every month). That is
 *      the only axis a creator actually decides on, and it is true of the
 *      products rather than imposed on them.
 *   3. ONE colour per group, not one per tile. Eight accents is no accent, which
 *      is most of why the first pass read as generic.
 *
 * ⚠️ Copy here is a Stripe-facing surface, so the content-first rules apply in
 * full: every line describes a purchase of creator content or a creator service.
 * No gift / donation / fundraising framing, and no brand names.
 *
 * ⚠️ Each entry names a LIVE product. Piggy Bank is a ONE-OFF content purchase
 * at an amount the supporter picks — it is not a recurring subscription, and
 * describing it as ongoing backing would both misdescribe it and undo the
 * content-first reframing it went through.
 */

const MINT = '#05EFB8';
const PINK = '#FF007F';
const VIOLET = '#924DFF';

/** Paid once — the supporter buys a thing and the transaction is finished. */
const ONE_OFF = [
    {
        emoji: '🔓',
        title: 'Exclusive content',
        line: 'Photos, videos, guides, bundles. They pay, it unlocks straight away.',
        note: 'No account needed to buy',
    },
    {
        emoji: '🎯',
        title: 'Content goals',
        line: 'Sell content toward a target and let the progress bar do the asking.',
        note: 'For equipment, projects, big buys',
    },
    {
        emoji: '💖',
        title: 'Piggy Bank',
        line: 'A one-off content purchase, at an amount your supporter picks.',
        note: 'Nothing to set up',
    },
    {
        emoji: '✅',
        title: 'Paid requests',
        line: 'Custom work, paid up front and held until you deliver it.',
        note: 'You approve every request',
    },
    {
        emoji: '🛍️',
        title: 'Your shop',
        line: 'Your own products — digital files, prints, merch.',
        note: 'Your storefront, your prices',
    },
];

/** Paid every month — the same supporter, charged again, until they stop. */
const RECURRING = [
    {
        emoji: '🔁',
        title: 'Recurring content',
        line: 'One content stream on a schedule. They know what is coming, you know what is landing.',
        note: 'Income you can forecast',
    },
    {
        emoji: '💎',
        title: 'Memberships',
        line: 'Tiers, perks and member-only posts for your closest supporters.',
        note: 'Your most committed buyers',
    },
];

/**
 * ⚠️ The heading counts what is on screen rather than stating a number.
 * Stablecoin Tips is behind a switch, so a hardcoded "Eight" becomes a lie the
 * moment the announcement is pulled — and nothing would fail to warn you.
 */
const TOTAL = ONE_OFF.length + RECURRING.length + (STABLECOIN_TIPS_ANNOUNCED ? 1 : 0);
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const countWord = (n) => COUNT_WORDS[n] ?? String(n);

/**
 * One segment of the bar.
 *
 * ⚠️ `leading-*` in this project means PIXELS — `tailwind.config.js` overrides
 * Tailwind's own scale with numeric px keys, so `leading-6` is 6px and stacks
 * paragraphs on top of each other. Arbitrary values only.
 */
function Segment({ way, accent }) {
    return (
        <article className="h-full bg-[#0d0a16] p-5 md:p-6 flex flex-col">
            <span className="text-[22px] leading-[1] mb-3.5" aria-hidden="true">
                {way.emoji}
            </span>
            <h3 className="font-gulfs uppercase text-white text-[15px] md:text-base leading-[1.2] tracking-[0.04em] mb-2">
                {way.title}
            </h3>
            <p className="font-poppins text-white/55 text-[13px] md:text-[13.5px] leading-[1.55] flex-1">
                {way.line}
            </p>
            <p
                className="font-poppins text-[10.5px] uppercase tracking-[0.16em] mt-4 pt-3.5 border-t border-white/[0.08]"
                style={{ color: accent }}
            >
                {way.note}
            </p>
        </article>
    );
}

/**
 * The label above each band. It is not an eyebrow — it is the classification the
 * whole section is organised by, so it carries the band's colour and a rule that
 * runs to the edge of the group it describes.
 */
function BandLabel({ children, accent }) {
    return (
        <div className="flex items-center gap-4 mb-3">
            <span
                className="font-gulfs uppercase text-[11px] tracking-[0.26em] whitespace-nowrap"
                style={{ color: accent }}
            >
                {children}
            </span>
            <span aria-hidden="true" className="h-px flex-1" style={{ background: `${accent}33` }}></span>
        </div>
    );
}

/**
 * The shared hairline is the GROUP's background showing through a 1px gap —
 * not a border on each tile. Borders would double up between neighbours and need
 * per-position resets at every breakpoint; a gap cannot.
 */
function Bar({ children, accent }) {
    return (
        <div
            className="rounded-box overflow-hidden"
            style={{ background: `${accent}2E` }}
        >
            {children}
        </div>
    );
}

export default function WaysToGetPaid() {
    return (
        <section className="relative bg-transparent py-12 md:py-24 overflow-hidden">
            {/* No ambient orbs here. `PageCanvas` is the page's one light source —
                a per-section orb bloomed where its section was and faded before
                the next, which is what made scrolling read as a row of coloured
                stops instead of one continuous field. */}
            

            <div className="container relative z-10 px-4 mx-auto">
                {/* The header runs the full width of the container so it sits over
                    the bar rather than beside a gap — but the SUBHEAD keeps a
                    measure. At 1280px a single column of body copy is ~140
                    characters a line, which nobody reads to the end of. */}
                <div className="mb-10 md:mb-14">
                    <FadeIn y={20}>
                        <span className="font-gulfs uppercase tracking-[0.3em] text-xs md:text-sm text-[#05EFB8]">
                            {countWord(TOTAL)} ways &middot; one income
                        </span>
                    </FadeIn>
                    <FadeIn y={24} delay={0.05}>
                        <h2 className="font-gulfs uppercase text-white text-3xl md:text-5xl leading-[0.95] tracking-tight mt-4 mb-5">
                            {countWord(TOTAL)} ways to <span className="text-gradient-wishlist">get paid</span>
                        </h2>
                    </FadeIn>
                    <FadeIn y={20} delay={0.1}>
                        <p className="font-poppins text-gray-300 text-base md:text-xl leading-relaxed max-w-3xl">
                            Most platforms give you one. Pick the ones that suit you, use them all,
                            or start with one and add more later.
                        </p>
                    </FadeIn>
                </div>

                <div>
                    {/* ── Band 1 · paid once ───────────────────────────────── */}
                    <FadeIn y={26}>
                        <BandLabel accent={MINT}>Paid once</BandLabel>

                        {/* Mobile keeps the rail the client asked for — five tiles
                            is more than a phone can show at a readable width, and
                            squeezing them turns every line into two words a row. */}
                        <div className="md:hidden">
                            <Bar accent={MINT}>
                                <ul
                                    className="flex gap-px overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none"
                                    tabIndex={0}
                                    role="group"
                                    aria-label="Ways you are paid once"
                                >
                                    {ONE_OFF.map((way) => (
                                        <li key={way.title} className="snap-start shrink-0 w-[240px]">
                                            <Segment way={way} accent={MINT} />
                                        </li>
                                    ))}
                                </ul>
                            </Bar>
                            <p className="font-poppins text-[10.5px] uppercase tracking-[0.2em] text-white/30 mt-2.5">
                                Swipe &rarr;
                            </p>
                        </div>

                        <div className="hidden md:block">
                            <Bar accent={MINT}>
                                <ul className="grid grid-cols-5 gap-px">
                                    {ONE_OFF.map((way) => (
                                        <li key={way.title}>
                                            <Segment way={way} accent={MINT} />
                                        </li>
                                    ))}
                                </ul>
                            </Bar>
                        </div>
                    </FadeIn>

                    {/* ── Band 2 · paid every month ────────────────────────── */}
                    <FadeIn y={26} delay={0.05}>
                        <div className="mt-8 md:mt-9">
                            <BandLabel accent={PINK}>Paid every month</BandLabel>
                            <Bar accent={PINK}>
                                <ul className="grid grid-cols-2 gap-px">
                                    {RECURRING.map((way) => (
                                        <li key={way.title}>
                                            <Segment way={way} accent={PINK} />
                                        </li>
                                    ))}
                                </ul>
                            </Bar>
                        </div>
                    </FadeIn>

                    {/* ── The terminus ──────────────────────────────────────────
                        The one filled block in the section, and the whole reason
                        the tiles above are joined rather than gapped: every one of
                        them ends here. Spending the section's boldness anywhere
                        else would leave this reading as another card. */}
                    <FadeIn y={22} delay={0.1}>
                        <div className="mt-4 md:mt-5 rounded-box bg-[#FF007F] px-6 py-6 md:px-8 md:py-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <span
                                aria-hidden="true"
                                className="font-gulfs text-2xl md:text-3xl text-black/40 leading-[1] shrink-0"
                            >
                                &darr;
                            </span>
                            <p className="font-gulfs uppercase text-black text-lg md:text-2xl leading-[1.15] tracking-tight flex-1">
                                All of it lands in one payout, every Friday
                            </p>
                            <p className="font-poppins text-black/70 text-[13px] leading-[1.5] sm:text-right sm:max-w-[210px] shrink-0">
                                You keep 100% of your listed price on every one of them.
                            </p>
                        </div>
                    </FadeIn>

                    {/* ── The exception ─────────────────────────────────────────
                        ⚠️ The DASHED border is the "not built yet" signal, doing the
                        work a caption would otherwise have to. It also keeps this
                        outside the bar above, which is honest twice over: the
                        feature is not live, and when it is it will settle on its
                        own rail rather than into the Friday payout.
                        ⚠️ It must NOT claim to be faster than that payout — the
                        agreed specification says the opposite, and says the
                        mechanics are unconfirmed. See `constants/stablecoinTips`. */}
                    {STABLECOIN_TIPS_ANNOUNCED && (
                        <FadeIn y={20} delay={0.15}>
                            <div
                                className="mt-4 md:mt-5 rounded-box border-2 border-dashed px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
                                style={{ borderColor: `${VIOLET}80` }}
                            >
                                <span className="text-[22px] leading-[1] shrink-0" aria-hidden="true">💠</span>
                                <div className="flex-1">
                                    <h3 className="font-gulfs uppercase text-white text-[15px] tracking-[0.04em] leading-[1.2]">
                                        {STABLECOIN_COPY.card.title}
                                    </h3>
                                    <p className="font-poppins text-white/55 text-[13px] leading-[1.55] mt-1.5">
                                        {STABLECOIN_COPY.card.line}
                                    </p>
                                </div>
                                <span
                                    className="font-poppins text-[10.5px] uppercase tracking-[0.16em] shrink-0"
                                    style={{ color: VIOLET }}
                                >
                                    {STABLECOIN_COPY.card.detail}
                                </span>
                            </div>
                        </FadeIn>
                    )}
                </div>
            </div>
        </section>
    );
}
