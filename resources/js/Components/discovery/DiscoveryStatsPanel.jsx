import { Fragment } from 'react';

import {
    DISCOVERY_ANALYTICS_PENDING_LABEL,
    DISCOVERY_PROOF_LINES,
    DISCOVERY_ZERO_STATE_LINE,
} from '@/constants/discovery';

/**
 * The Discovery three-number panel.
 *
 * 🚨 ONE COMPONENT, THREE SURFACES — this is a hard requirement of the client
 * brief, not a tidiness preference. The landing-page proof point (A1), the
 * /creators/discovery ad page (A2) and, from Discovery Phase 2, the creator
 * dashboard all render THIS FILE. The brief's wording: "build as the real
 * dashboard component with mock data + flag". A second component drawn to look
 * like this one would drift from the real dashboard the moment either changed,
 * and the marketing would then be showing something the product does not.
 *
 * `live` decides everything:
 *   false → the figures are illustrative and the coming-soon badge is shown.
 *   true  → the figures are that creator's real Phase 1 attribution numbers and
 *           the badge is gone.
 * It comes from `config/discovery.php` (`analytics_live`), so the flip is a
 * config change with no deploy — see Section F of the plan.
 *
 * ⚠️ THE BADGE IS NOT OPTIONAL WHILE `live` IS FALSE. The figures are invented
 * (428 / 62 / £625, supplied by the client) and appear on a public marketing
 * page; the badge is the only thing separating an illustration from a claim. It
 * is rendered as a chip on the panel rather than a caption underneath for the
 * same reason — a caption reads as a footnote, and the numbers are 56px.
 *
 * ⚠️ ZERO IS A STATE, NOT AN ABSENCE. A creator with no Discovery data sees the
 * panel at 0 with an explanatory line — the plan is explicit that the panel
 * "stays visible at 0 … It is the pitch". Never return null for empty data.
 *
 * `tone` decides the palette, and nothing else:
 *   'dark'  → the marketing default. White figures on the near-transparent
 *             field the homepage section and the ad page already sit on.
 *   'light' → the creator dashboard, which is a white brutalist page. The dark
 *             panel rendered white-on-white there and was literally invisible,
 *             which is the one reason this prop exists — the structure, the
 *             wording, the zero-state and the badge rule are all still shared.
 * Both callers that pass `live={false}` pass no tone and are unaffected.
 *
 * House rules this file follows: no shadow of any kind (`npm run check` fails
 * the build on one), `rounded-box`/`-sm` tokens rather than the named radius
 * scale, and — on the dark tone — a transparent background, so the page behind
 * it owns the field.
 *
 * ⚠️ The light tone uses bare `border-black`, with NO width class. In this
 * project `.border-black` is a full `border: 2px solid` shorthand (index.css),
 * so a paired `border-[3px]` is silently discarded; 2px is what every card
 * around it on the dashboard actually draws, so the two now agree.
 */

/**
 * @param {object}   props
 * @param {object}   props.stats  { introduced, newSupporters, attributedEarnings }
 * @param {boolean}  props.live   real numbers (true) vs illustrative (false)
 * @param {string[]} props.lines  three descriptive lines, one per figure
 * @param {string}   props.tone   'dark' (marketing) | 'light' (dashboard)
 * @param {string}   props.title  optional eyebrow above the figures
 * @param {string}   props.currencySymbol
 * @param {string}   props.className
 */
export default function DiscoveryStatsPanel({
    stats,
    live = false,
    lines = DISCOVERY_PROOF_LINES,
    tone = 'dark',
    scale = 'panel',
    title = null,
    currencySymbol = '£',
    className = '',
}) {
    const isLight = tone === 'light';

    /*
     * ⚠️ Defaulted, because both marketing callers hand this component
     * `config('discovery.mock_stats')`, which has no `by_source` key — a bare
     * `.map` on it would take the landing page down.
     */
    const sources = Array.isArray(stats?.by_source) ? stats.by_source : [];

    /*
     * 🚨 SORTED BY PEOPLE HERE, NOT ON THE SERVER — and deliberately.
     * `DiscoveryReportService` returns the sources ordered by EARNINGS, which is
     * the right default for a money question. But this section's heading is
     * "Where they came from", and the panel's first and largest figure is people
     * — so the busiest source was landing THIRD in the list, under two that sent
     * fewer than half as many. A bar chart whose lengths jump around is also
     * simply harder to read than one that steps down.
     *
     * ⚠️ A DISPLAY decision, so it lives here. The service is used by other
     * callers and its order is not this component's to change. `[...sources]`
     * because `sort` mutates, and mutating a prop is how one surface silently
     * re-orders another's data.
     */
    const ranked = [...sources].sort(
        (a, b) => Number(b?.introduced ?? 0) - Number(a?.introduced ?? 0),
    );

    // The longest bar sets the scale, so the busiest source always fills the row
    // and every other length is read against it.
    const busiest = ranked.reduce(
        (max, row) => Math.max(max, Number(row?.introduced ?? 0)),
        0,
    );
    const heroScale = scale === 'hero';
    const skin = isLight
        ? {
              panel: 'rounded-box border-black bg-white p-6 md:p-6',
              breakdownEdge: 'border-black/10',
              breakdownInk: 'text-black',
              badge: 'rounded-box-xs border-black bg-[#E6EA7B] px-3 py-1.5 text-black',
              ruleEdge: 'border-black/10',
              track: 'bg-black/[0.07]',
              fill: 'bg-[#A2E4B8]',
              columnHead: 'text-black/45',
              dot: 'bg-black',
              title: 'text-black/60',
              figure: 'text-black',
              line: 'text-gray-600',
              empty: 'border-black/15 text-gray-600',
          }
        : {
              /*
               * ⚠️ FRAMELESS AT HERO SCALE. `/creators/discovery` wraps this
               * section in its own mint frame; a second border inside it reads
               * as a box in a box and visually shrinks the figures the hero
               * scale exists to enlarge. Done here rather than with `border-0
               * !p-0` at the call site, which is a genuine conflicting-utility
               * pair the class scanner does not flag.
               */
              panel: heroScale
                  ? ''
                  : 'rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-9',
              badge: 'rounded-box-xs border-2 border-[#E6EA7B]/60 px-3 py-1.5 text-[#E6EA7B]',
              ruleEdge: 'border-white/10',
              track: 'bg-white/10',
              fill: 'bg-[#E6EA7B]',
              columnHead: 'text-white/45',
              dot: 'bg-[#E6EA7B]',
              title: 'text-white/60',
              figure: 'text-white',
              line: 'text-gray-300',
              empty: 'border-white/10 text-gray-400',
              // Only reachable if a dark surface is ever given real numbers;
              // the breakdown is gated on `live`, which marketing passes false.
              breakdownEdge: 'border-white/15',
              breakdownInk: 'text-white',
          };
    const introduced = Number(stats?.introduced ?? 0);
    const newSupporters = Number(stats?.newSupporters ?? stats?.new_supporters ?? 0);
    const earnings = Number(
        stats?.attributedEarnings ?? stats?.attributed_earnings ?? 0,
    );

    // Only a live panel can legitimately be empty — the mock figures are never
    // zero, so this never fires on a marketing surface.
    const isEmpty = live && introduced === 0 && newSupporters === 0 && earnings === 0;

    const money = `${currencySymbol}${formatMoney(earnings)}`;

    const figures = [
        { value: formatCount(introduced), line: lines[0] },
        { value: formatCount(newSupporters), line: lines[1] },
        { value: money, line: lines[2] },

    ];

    /*
     * 🚨 `scale='hero'` IS THE ONE LOUD MOMENT ON THE AD PAGE, AND IT HAS TO BE
     * LOUD. Discovery is a counting system — its entire promise is "we can prove
     * what exposure is worth" — so the tally IS the product, not an illustration
     * of it. At 56px it read as a stat widget among other stat widgets, on a page
     * whose client brief calls this "the most prominent section".
     *
     * ⚠️ The caption goes to MONO at this scale, deliberately. The house
     * convention (see the slip in `Pages/Bio/Show.jsx`) is that anything the
     * SYSTEM produced is set in mono — a receipt, a confirmation, a count. It
     * gives the page a second voice, and it makes these read as measurements
     * rather than as more marketing copy.
     */
    const isHero = scale === 'hero';

    if (scale === 'compact') {
        return (
            <CompactPanel
                title={title}
                figures={figures}
                isEmpty={isEmpty}
                live={live}
                sources={sources}
                ranked={ranked}
                currencySymbol={currencySymbol}
                className={className}
            />
        );
    }

    return (
        <div className={`${skin.panel} ${className}`}>
            {!live && (
                <span
                    className={`mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] ${skin.badge}`}
                >
                    {/* A dot, not an icon — the chip has to read at a glance
                        beside three 56px numbers without becoming decoration. */}
                    <span
                        aria-hidden="true"
                        className={`inline-block h-[7px] w-[7px] rounded-full ${skin.dot}`}
                    />
                    {DISCOVERY_ANALYTICS_PENDING_LABEL}
                </span>
            )}

            {title && (
                <p
                    className={`mb-6 font-gulfs text-[11px] uppercase tracking-[0.16em] md:text-[12px] ${skin.title}`}
                >
                    {title}
                </p>
            )}

            {/* 🚨 ONE GRID FOR ALL THREE ROWS — THAT IS WHAT MAKES THEM LINE UP.
                These are three readings of ONE journey (people → supporters →
                money), stacked in that order with a hairline between them.

                ⚠️ The three rows share a SINGLE grid rather than being three
                flex rows, and that is the whole alignment fix. `43`, `7` and
                `£197.48` are wildly different widths, so as independent rows each
                label began at its own x — three ragged starts down the panel. In
                one grid the `auto` column sizes itself to the widest figure and
                every label starts on the same line, with the figures sharing a
                left edge. It also needs no fixed width, so a creator earning
                £12,345.67 widens the column instead of overflowing it.

                ⚠️ It also removed a bug rather than treating it: three equal
                columns gave each figure a third of the panel, and `£197.48`
                needed 175px in a 161px column — the pounds were being clipped off
                a creator's earnings at the one width the dashboard renders at.

                ⚠️ Hero scale keeps the three-across showpiece: on the ad page
                these are 104px and carry the section on their own. */}
            {isHero ? (
                <div className="grid gap-10 md:grid-cols-3 md:gap-8">
                    {figures.map((figure) => (
                        <div key={figure.line}>
                            <div
                                className={`font-gulfs text-[68px] leading-[0.82] tracking-tight sm:text-[88px] md:text-[104px] ${skin.figure}`}
                            >
                                {figure.value}
                            </div>
                            <p
                                className={`mt-4 max-w-[26ch] font-mono text-[12px] uppercase leading-[1.6] tracking-[0.06em] md:text-[13px] ${skin.line}`}
                            >
                                {figure.line}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                /* ⚠️ STACKED ON A PHONE, TWO COLUMNS FROM `sm`. Measured at 390px:
                   the two-column form left the label just 136px beside a 142px
                   figure, so every line wrapped three or four times in a narrow
                   gutter. A figure and its sentence want the full width of a
                   phone, one under the other. From `sm` the grid returns and the
                   labels align on one axis again.

                   WHY THIS IS A PLAIN BLOCK COMMENT: inside a ternary's
                   parenthesised branch, the BRACED JSX comment form is an object
                   literal rather than a comment and fails the whole build. It is
                   documented in CLAUDE.md and was done here anyway.

                   And the fix for it broke the build a second time, because the
                   replacement comment QUOTED the closing token it was warning
                   about, which ended the comment early and turned the rest into
                   code. Do not write that token inside a comment. */
                <div className="grid grid-cols-1 items-baseline gap-x-5 sm:grid-cols-[auto_1fr] sm:gap-x-7">
                    {figures.map((figure, index) => {
                        const first = index === 0;
                        const last = index === figures.length - 1;
                        // Stacked, the figure keeps the top padding and the label
                        // the bottom one, so the pair reads as a single block
                        // rather than two rows with a gap down the middle.
                        const figurePad = first ? '' : 'pt-5';
                        const labelPad = `${last ? '' : 'pb-5'} pt-1 sm:pt-0 ${first ? '' : 'sm:pt-5'}`;

                        return (
                            <Fragment key={figure.line}>
                                {/* 🚨 THE RULE IS ITS OWN FULL-WIDTH CELL, NOT A
                                    BORDER ON EACH SIDE. Bordering the two cells
                                    separately drew TWO half-rules at DIFFERENT
                                    heights: the figure box and the label box are
                                    different heights, and `items-baseline` then
                                    offsets them vertically, so each border-top
                                    landed at its own y. On screen that read as a
                                    staggered, broken line down the panel.

                                    ⚠️ A horizontal-alignment check cannot catch
                                    this — the label x values were identical while
                                    the rules were visibly out of step. It was
                                    found by looking at the panel, which is the
                                    only thing that could have found it. */}
                                {index > 0 && (
                                    <div
                                        aria-hidden="true"
                                        className={`col-span-full border-t-2 ${skin.ruleEdge}`}
                                    />
                                )}

                                <div
                                    className={`font-gulfs text-[34px] leading-[0.95] tracking-tight sm:text-[40px] md:text-[44px] ${skin.figure} ${figurePad}`}
                                >
                                    {figure.value}
                                </div>
                                <p
                                    className={`min-w-0 text-sm leading-[1.45] md:text-base ${skin.line} ${labelPad}`}
                                >
                                    {figure.line}
                                </p>
                            </Fragment>
                        );
                    })}
                </div>
            )}

            {isEmpty && (
                <p
                    className={`mt-7 border-t-2 pt-6 text-sm leading-[1.55] md:text-base ${skin.empty}`}
                >
                    {DISCOVERY_ZERO_STATE_LINE}
                </p>
            )}

            {/* 🚨 WHERE THEY CAME FROM. The platform tells every creator "we show
                you what Discovery is worth" — and three totals do not answer
                that. The per-source figures have been computed since Phase 1 and
                nothing ever rendered them, so a creator could see that 428 people
                were introduced and had no way to tell whether that was the
                homepage, a birthday e-mail or their own bio link. That is the
                difference between a number and something they can act on.

                🚨 THEIR OWN TRAFFIC IS LISTED BESIDE OURS, MARKED AS THEIRS.
                `bio-link` is creator-generated by the brief's own rule; folding
                it into the Discovery total would be the platform taking credit
                for the creator's own audience.

                ⚠️ Only rendered with real numbers. Against the mock figures
                there is nothing true to break down, and an invented breakdown
                would read as data. */}
            {live && sources.length > 0 && (
                <div className={`mt-7 border-t-2 pt-5 ${skin.breakdownEdge}`}>
                    <p className={`text-[11px] uppercase tracking-[0.18em] ${skin.empty}`}>
                        Where they came from
                    </p>

                    {/* ⚠️ Two column headings, because `5 · £60` asked the reader
                        to decode which unit was which. People and money are
                        different measurements and now sit in their own columns. */}
                    <div
                        className={`mt-4 grid grid-cols-[1fr_auto_auto] gap-x-4 font-mono text-[10px] uppercase tracking-[0.1em] ${skin.columnHead}`}
                    >
                        <span />
                        <span className="text-right">People</span>
                        <span className="text-right">Earned</span>
                    </div>

                    <ul className="mt-2 flex flex-col gap-3">
                        {ranked.map((row) => (
                            <li key={row.source}>
                                <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                                    <span className="min-w-0">
                                        <span
                                            className={`block truncate text-sm ${skin.breakdownInk}`}
                                        >
                                            {row.label}
                                        </span>
                                        {row.class === 'creator' && (
                                            <span className={`block text-[11px] ${skin.empty}`}>
                                                Your own audience
                                            </span>
                                        )}
                                    </span>

                                    <span
                                        className={`shrink-0 whitespace-nowrap font-mono text-sm tabular-nums ${skin.breakdownInk}`}
                                    >
                                        {formatCount(row.introduced)}
                                    </span>

                                    <span
                                        className={`shrink-0 whitespace-nowrap font-mono text-sm tabular-nums ${
                                            row.earnings > 0 ? skin.breakdownInk : skin.empty
                                        }`}
                                    >
                                        {row.earnings > 0
                                            ? `${currencySymbol}${formatMoney(row.earnings)}`
                                            : '—'}
                                    </span>
                                </div>

                                {/* 🚨 THE BAR IS THE POINT OF THIS SECTION. Six
                                    numbers in a column tell a creator nothing at a
                                    glance; a length tells them instantly which
                                    surface is doing the work. It measures PEOPLE,
                                    matching this section's own heading and the
                                    panel's first and largest figure.

                                    ⚠️ Width is an inline style: Tailwind's JIT
                                    emits nothing for a class built from a runtime
                                    value, so `w-[${pct}%]` would render as no
                                    width at all. `aria-hidden` because the two
                                    figures beside it already say this out loud. */}
                                <div
                                    aria-hidden="true"
                                    className={`mt-1.5 h-[6px] w-full overflow-hidden rounded-box-xs ${skin.track}`}
                                >
                                    <div
                                        className={`h-full rounded-box-xs ${skin.fill}`}
                                        style={{
                                            width: `${
                                                busiest > 0
                                                    ? Math.max(
                                                          4,
                                                          Math.round(
                                                              (row.introduced / busiest) * 100,
                                                          ),
                                                      )
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/** 1234 → "1,234". Thousands separators matter at dashboard scale. */
/**
 * `scale="compact"` — the creator's own dashboard (31 Aug 2026).
 *
 * The dashboard form of this panel was 706px tall and spoke a different language
 * from everything around it: its own grey skin, MONO column heads, seven
 * separate bars, and three figures stacked down the panel with a rule between
 * each. It is now drawn in the SAME language as `CreatorActivityWidget` — the
 * payments card two blocks below it, which the client picked out as the one to
 * match: a 2px-framed white card, a state pill, a Gulfs headline, one plain
 * sentence, then quiet sections separated by hairlines.
 *
 * 🚨 ONE CARD, NO BOXES INSIDE IT (client direction, 31 Aug 2026). The previous
 * compact form put a bordered StatStrip and a bordered Panel inside the column,
 * so the About tab read as a stack of boxes inside boxes in the same colour.
 * Depth here is the house order — border weight, then colour, then SPACE — so
 * the internal divisions are hairlines and padding, never another frame.
 *
 *   - the three figures are one open row, split by hairlines, not tiles;
 *   - "where they came from" is ONE segmented bar rather than seven, which also
 *     shows the SHARE each source took — something seven separate bars never did;
 *   - the legend is a two-column grid from `sm`, so seven sources take four rows.
 *
 * ⚠️ THE CREATOR'S OWN TRAFFIC IS HATCHED, NEVER A SOLID COLOUR. `bio-link` is
 * creator-generated by the brief's own rule and must stay distinguishable from
 * the platform's placements at a glance — a seventh solid stripe would fold it
 * into ours. The legend also says "yours" in words, so the distinction does not
 * depend on the pattern being noticed.
 *
 * ⚠️ Segment widths are `flex-grow`, not percentages: the browser divides the
 * length in proportion and no rounding can push the bar past its track. The bar
 * is `aria-hidden` — the legend carries every number it draws.
 *
 * ⚠️ Every count in the legend carries its unit ("15 people"). The old list
 * printed `15  £37.49` under two tiny mono headings and asked the reader to
 * decode which was which; in a two-column legend those headings would have to be
 * drawn twice, so the unit rides on the number instead.
 *
 * ⚠️ `border-2 border-[#000]`, never `border-[3px] border-black` — this project
 * redefines `.border-black` as a full `border: 2px solid` shorthand, so the
 * payments card's own `border-[3px]` is silently discarded and renders at 2px.
 * This card asks for 2px directly so the pair actually match.
 *
 * The other two scales — `panel` (marketing, dark) and `hero` (ad page) — are
 * untouched. Only the dashboard passes `compact`.
 */
const SOURCE_FILLS = [
    '#FF007F',
    '#05EFB8',
    '#E6EA7B',
    '#8C52FF',
    '#000000',
    '#FFB3D9',
    '#A2E4B8',
];

const CREATOR_FILL =
    'repeating-linear-gradient(135deg, #000 0 3px, #fff 3px 7px)';

const COMPACT_EYEBROW =
    'text-[12px] font-black uppercase tracking-[0.18em] text-black/60';

function fillFor(row, index) {
    if (row?.class === 'creator') return { backgroundImage: CREATOR_FILL };
    return { backgroundColor: SOURCE_FILLS[index % SOURCE_FILLS.length] };
}

function CompactPanel({
    title,
    figures,
    isEmpty,
    live,
    sources,
    ranked,
    currencySymbol,
    className,
}) {
    const stats = [
        { key: 'introduced', label: 'Discovered you', value: figures[0].value },
        { key: 'supporters', label: 'Became supporters', value: figures[1].value },
        { key: 'earned', label: 'Earned from them', value: figures[2].value },
    ];

    const totalIntroduced = ranked.reduce(
        (sum, row) => sum + Number(row?.introduced ?? 0),
        0,
    );

    /*
     * One sentence, in the payments card's voice — the figures above are the
     * reading, this says what the reading MEANS. A creator should be able to
     * take the panel in without doing arithmetic across three columns.
     */
    const lead = isEmpty
        ? DISCOVERY_ZERO_STATE_LINE
        : `${figures[0].value} ${
              figures[0].value === '1' ? 'person' : 'people'
          } found you through Spenny Piggy this month, ${
              figures[1].value
          } became supporters, and ${figures[2].value} of your earnings came from them.`;

    return (
        <section
            aria-label={title || 'Discovery'}
            className={`rounded-box border-2 border-[#000] bg-white p-5 md:p-6 ${className}`}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-box-sm border-2 border-black bg-[#A2E4B8] px-3 py-1 text-[12px] font-black uppercase tracking-[0.16em] text-black">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-black" />
                    This month
                </span>

                {/* Marketing surfaces never reach this scale, so in practice this
                    chip does not render here — it is kept so the compact form
                    cannot silently present mock figures as real ones. */}
                {!live && (
                    <span className="inline-flex items-center rounded-box-sm border-2 border-black bg-[#E6EA7B] px-3 py-1 text-[12px] font-black uppercase tracking-[0.16em] text-black">
                        {DISCOVERY_ANALYTICS_PENDING_LABEL}
                    </span>
                )}
            </div>

            <h3 className="mt-3 font-gulfs text-2xl uppercase leading-[1.05] text-black">
                {title || 'Discovery this month'}
            </h3>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/70">
                {lead}
            </p>

            {/* 🚨 FIGURES, NOT TILES. Three numbers of wildly different widths
                (`44`, `7`, `£197.48`) line up on one baseline in a shared grid;
                the hairline between them is a `divide-x`, so it cannot fall out
                of step the way two separately-bordered cells can. On a phone the
                columns stack and the rules turn horizontal — three tiny columns
                at 390px would set `£197.48` in a 90px box. */}
            <dl className="mt-5 grid grid-cols-1 divide-y divide-black/10 border-t border-black/10 pt-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-t-0 sm:pt-0">
                {stats.map((stat, i) => (
                    <div
                        key={stat.key}
                        className={`py-3 sm:py-0 ${i === 0 ? 'sm:pr-5' : 'sm:px-5'} ${
                            i === stats.length - 1 ? 'sm:pr-0' : ''
                        }`}
                    >
                        <dt className={COMPACT_EYEBROW}>{stat.label}</dt>
                        {/* 🚨 BLACK, NEVER THE MINT ACCENT. `tokens.js` gives mint
                            to earned money and the old tile used it here — but
                            `#05EFB8` on white is 1.4:1, so the one figure a creator
                            most wants to read was the one they could not. The
                            payments card this block matches sets every figure in
                            black and spends its colour on the pill; so does this. */}
                        <dd className="mt-1.5 font-gulfs text-[32px] leading-[0.95] tracking-tight text-black md:text-[38px]">
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {live && sources.length > 0 && (
                <div className="mt-6 border-t border-black/10 pt-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className={COMPACT_EYEBROW}>Where they came from</p>
                        <p className="text-[13px] font-medium tabular-nums text-black/50">
                            {people(totalIntroduced)}
                        </p>
                    </div>

                    <div
                        aria-hidden="true"
                        className="mt-3 flex h-[14px] w-full gap-[2px] overflow-hidden rounded-full border-2 border-black bg-white p-[2px]"
                    >
                        {ranked.map((row, i) => (
                            <span
                                key={row.source}
                                className="h-full min-w-[6px] rounded-full"
                                style={{
                                    flexGrow: Math.max(Number(row?.introduced ?? 0), 0),
                                    flexBasis: 0,
                                    ...fillFor(row, i),
                                }}
                            />
                        ))}
                    </div>

                    <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                        {ranked.map((row, i) => (
                            <li
                                key={row.source}
                                className="grid grid-cols-[10px_minmax(0,1fr)_auto_auto] items-baseline gap-x-2.5 text-sm leading-[1.5]"
                            >
                                <span
                                    aria-hidden="true"
                                    className="h-[10px] w-[10px] self-center rounded-full border border-[#000]"
                                    style={fillFor(row, i)}
                                />
                                <span
                                    className="truncate font-medium text-black"
                                    title={row.label}
                                >
                                    {row.label}
                                    {row.class === 'creator' && (
                                        <span className="text-black/45"> · yours</span>
                                    )}
                                </span>
                                <span className="whitespace-nowrap tabular-nums text-black/60">
                                    {people(row.introduced)}
                                </span>
                                <span
                                    className={`min-w-[5ch] whitespace-nowrap text-right font-black tabular-nums ${
                                        row.earnings > 0 ? 'text-black' : 'text-black/30'
                                    }`}
                                >
                                    {row.earnings > 0
                                        ? `${currencySymbol}${formatMoney(row.earnings)}`
                                        : '—'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}

function people(value) {
    const n = Number(value ?? 0);
    return `${formatCount(n)} ${n === 1 ? 'person' : 'people'}`;
}

function formatCount(value) {
    return Number.isFinite(value) ? value.toLocaleString('en-GB') : '0';
}

/**
 * Whole pounds when the amount is whole, two decimals otherwise — £625 reads as
 * the brief writes it, while £625.40 is not silently rounded away.
 */
function formatMoney(value) {
    if (!Number.isFinite(value)) return '0';

    return Number.isInteger(value)
        ? value.toLocaleString('en-GB')
        : value.toLocaleString('en-GB', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
}
