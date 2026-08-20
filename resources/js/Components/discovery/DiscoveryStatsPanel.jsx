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
    const heroScale = scale === 'hero';
    const skin = isLight
        ? {
              panel: 'rounded-box border-black bg-white p-6 md:p-6',
              badge: 'rounded-box-xs border-black bg-[#E6EA7B] px-3 py-1.5 text-black',
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
              dot: 'bg-[#E6EA7B]',
              title: 'text-white/60',
              figure: 'text-white',
              line: 'text-gray-300',
              empty: 'border-white/10 text-gray-400',
          };
    const introduced = Number(stats?.introduced ?? 0);
    const newSupporters = Number(stats?.newSupporters ?? stats?.new_supporters ?? 0);
    const earnings = Number(
        stats?.attributedEarnings ?? stats?.attributed_earnings ?? 0,
    );

    // Only a live panel can legitimately be empty — the mock figures are never
    // zero, so this never fires on a marketing surface.
    const isEmpty = live && introduced === 0 && newSupporters === 0 && earnings === 0;

    const figures = [
        { value: formatCount(introduced), line: lines[0] },
        { value: formatCount(newSupporters), line: lines[1] },
        { value: `${currencySymbol}${formatMoney(earnings)}`, line: lines[2] },
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

            <div
                className={`grid ${isHero ? 'gap-10 md:grid-cols-3 md:gap-8' : 'gap-8 md:grid-cols-3 md:gap-6'}`}
            >
                {figures.map((figure) => (
                    <div key={figure.line}>
                        <div
                            className={`font-gulfs leading-[0.82] tracking-tight ${skin.figure} ${
                                isHero
                                    ? 'text-[68px] sm:text-[88px] md:text-[104px]'
                                    : 'text-5xl leading-[0.9] md:text-[56px]'
                            }`}
                        >
                            {figure.value}
                        </div>
                        <p
                            className={
                                isHero
                                    ? `mt-4 max-w-[26ch] font-mono text-[12px] uppercase leading-[1.6] tracking-[0.06em] md:text-[13px] ${skin.line}`
                                    : `mt-3 max-w-[30ch] text-sm leading-[1.5] md:text-base ${skin.line}`
                            }
                        >
                            {figure.line}
                        </p>
                    </div>
                ))}
            </div>

            {isEmpty && (
                <p
                    className={`mt-7 border-t-2 pt-6 text-sm leading-[1.55] md:text-base ${skin.empty}`}
                >
                    {DISCOVERY_ZERO_STATE_LINE}
                </p>
            )}
        </div>
    );
}

/** 1234 → "1,234". Thousands separators matter at dashboard scale. */
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
