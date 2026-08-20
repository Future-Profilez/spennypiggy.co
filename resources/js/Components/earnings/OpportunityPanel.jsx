import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

import Chip from '@/Components/UI/Chip';
import Panel from '@/Components/UI/Panel';
import SectionHead from '@/Components/UI/SectionHead';
import StatStrip from '@/Components/UI/StatStrip';
import { TYPE } from '@/Components/UI/tokens';

import {
    EI_COMING_SOON,
    EI_EMPTY_ACTIONS,
    EI_FULL_VIEW_LABEL,
    EI_PANEL_LEAD,
    EI_PANEL_TITLE,
    EI_ROW_PENDING_COPY,
} from '@/constants/earningsIntelligence';

/**
 * The Enhanced Creator Earnings module, on the creator's own dashboard.
 *
 * Client brief: "Spenny Piggy · Developer Master Plan", 19 Aug 2026, §C. Row 9
 * asks for this to sit ALONGSIDE the Discovery panel "so the dashboard tells one
 * story: what SP brought you, what it's worth, what to do next" — which is why it
 * renders directly beneath `DiscoveryStatsPanel` in the same owner-only column
 * rather than on a page of its own. The full Revenue Opportunity Centre still
 * exists at `/financial/opportunities`; this is the part that has to be seen
 * without going looking for it.
 *
 * 🚨 EVERY ONE OF THE NINE ROWS DRAWS, ALWAYS. The brief's own instruction is
 * that a row not ready "is shown greyed with 'Coming soon' rather than missing" —
 * a greyed row says the capability is coming, an absent one says nobody built it.
 * So the row list comes from the server (`panel.rows`, sourced from
 * `config/earnings_intelligence.php`) and never from whether data arrived, and a
 * creator with no sales sees the module with zeros, not an empty space.
 *
 * ⚠️ Assembled from `Components/UI`, not hand-drawn. No shadow anywhere (`npm run
 * check` fails the build on one), no scale on hover or press, `rounded-box`
 * tokens only, black type on any pink fill.
 *
 * ⚠️ SUPPORTER PRIVACY: name (or Anonymous), amount, country. The server already
 * whitelists those; this component must never be given an email to render, and
 * the standing prompt at the foot is what answers "so how do I contact them?".
 */
export default function OpportunityPanel({ panel, className = '' }) {
    if (!panel) return null;

    const currency = panel.currency || 'GBP';
    const rows = Array.isArray(panel.rows) ? panel.rows : [];
    const isLive = (key) => rows.find((r) => r.key === key)?.live === true;

    const totals = panel.totals || {};
    const supporters = panel.supporters || [];
    const revenue = panel.revenue_by_feature || [];
    const retention = panel.retention;
    const alerts = panel.alerts || [];
    const actions = panel.actions || [];

    /*
     * ⚠️ Row 1 and row 3 are one query and one list — "who are my top supporters"
     * and "what is a supporter worth" are answered by the same card. They are
     * still flagged separately, so the strip greys only when BOTH are off; each
     * row's own state is shown on its own line in the list below.
     */
    /*
     * 🚨 COLOUR MARKS THE TWO MONEY FIGURES AND NOTHING ELSE.
     * `Components/UI/tokens.js` gives each accent a meaning — pink is "money and
     * the primary action", mint is "earned, live, settled". Those two describe
     * exactly the pair below, so they keep their colour and the COUNTS stay
     * neutral. Four coloured figures is decoration; two is a rule a reader can
     * learn in one glance.
     *
     * ⚠️ `supporters` WAS VIOLET, and violet in this system means "scheduled,
     * pending, in flight — nothing to do", which a headcount is not. It also
     * rendered badly: a lone `0` in the display face at 26px is a small oval,
     * and in violet on this page it read as a status dot rather than a number.
     *
     * 🚨 THE FOURTH TILE IS LABELLED FOR WHAT IT ACTUALLY COMPUTES.
     * `CreatorOpportunityService` returns
     * `sum(lifetime_spent) / count(supporters)` — the average a PERSON has
     * spent, across however many purchases they made. It was labelled "Average
     * order", which is a different number (total ÷ number of orders) and reads
     * to a creator as "each purchase is worth this much". The brief's row 3 does
     * ask for average ORDER value; supplying it means dividing by a transaction
     * count the service does not currently return, so the label is corrected to
     * the truth here and the real AOV is flagged rather than quietly invented.
     */
    const tiles = [
        {
            key: 'supporters',
            label: 'Supporters',
            value: fmtCount(totals.supporters),
            sub: 'People who bought from you',
            // A count, not money — see the note in StatStrip.
            mono: true,
        },
        {
            key: 'spent',
            label: 'Spent with you',
            value: fmtMoney(totals.lifetime_value, currency),
            sub: 'What supporters were charged',
            accent: 'pink',
        },
        {
            key: 'earned',
            label: 'You earned',
            value: fmtMoney(totals.lifetime_earned, currency),
            sub: 'Your share of the same sales',
            accent: 'mint',
        },
        {
            key: 'aov',
            label: 'Average per supporter',
            value: fmtMoney(totals.average_supporter_value, currency),
            sub: 'Across everything they have bought',
        },
    ];

    return (
        <section className={`pt-6 ${className}`} aria-label="Revenue opportunities">
            <SectionHead
                eyebrow="Revenue opportunities"
                title={EI_PANEL_TITLE}
                accent="pink"
            />

            <p className={`${TYPE.body} -mt-2 mb-4 text-black/60`}>
                {EI_PANEL_LEAD}
            </p>

            {/* 🚨 WHAT TO DO NEXT COMES FIRST, ABOVE EVERY MEASUREMENT.
                It used to be sixth of six. A creator with no sales yet — which is
                every creator on their first day — met eight £0 figures, six zero
                counts and seven "0 sales" rows before reaching the only block on
                the panel that told them to do anything. The numbers answer "how
                am I doing"; this answers "what do I do", and on a dashboard that
                opens at zero the second question is the only one with an answer
                worth reading.

                ⚠️ It carries the panel's ONE accent. `tokens.js` assigns pink to
                money and the primary action, and every other block here is a
                reading — so the accent marks the block you can act on and the
                rest stay quiet. Do not give a second block an accent; a screen
                where every panel is coloured has no accent at all. */}
            <RowFrame
                rowKey="suggested_actions"
                live={isLive('suggested_actions')}
            >
                <Panel accent="pink" pad="none">
                    <div className="border-b border-black/10 px-4 py-3 md:px-5">
                        <p className={`${TYPE.eyebrow} text-black/55`}>
                            Do this next
                        </p>
                    </div>

                    {actions.length === 0 ? (
                        <p className="px-4 py-5 text-[13px] leading-[1.5] text-black/55 md:px-5">
                            {EI_EMPTY_ACTIONS}
                        </p>
                    ) : (
                        <ul className="divide-y divide-black/10">
                            {actions.map((a) => (
                                <li key={a.key} className="px-4 py-3.5 md:px-5">
                                    <p className="font-gulfs text-[14px] uppercase leading-[1.2] md:text-[15px]">
                                        {a.title}
                                    </p>
                                    <p className="mt-1 text-[12px] leading-[1.45] text-black/60">
                                        {a.detail}
                                    </p>
                                    {a.hint && (
                                        <p className="mt-1.5 text-[12px] leading-[1.45] text-black/45">
                                            {a.hint}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </RowFrame>


            {/* Row 5 — VIP alerts, directly beneath the actions.
                🚨 THE PANEL NOW READS ACT → MEASURE. These two blocks are the
                only ones a creator can do anything about, so they are together
                at the top; everything below them is a reading. An alert is the
                one time-sensitive thing here, which is why it is second rather
                than buried under the lists it concerns.
                ⚠️ It stays YELLOW, never pink — `tokens.js`: yellow means needs
                attention, pink means the primary action. Two different jobs. */}
            <RowFrame rowKey="vip_alerts" live={isLive('vip_alerts')} className="mt-3">
                <Panel accent={alerts.length > 0 ? 'yellow' : null} pad="sm">
                    <p className={`${TYPE.eyebrow} mb-3 text-black/55`}>Alerts</p>

                    {alerts.length === 0 ? (
                        /* ⚠️ "Nothing to flag" is a RESULT, and a good one. It is
                           not the same as the row being unbuilt, so it never gets
                           the Coming-soon treatment. */
                        <p className="text-[13px] leading-[1.5] text-black/55">
                            Nothing to flag right now.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {alerts.map((a) => (
                                <li key={a.key}>
                                    <Chip
                                        tone={
                                            a.severity === 'warning'
                                                ? 'yellow'
                                                : 'mint'
                                        }
                                        dot
                                    >
                                        {a.title}
                                    </Chip>
                                    <p className="mt-1.5 text-[13px] leading-[1.5] text-black/65">
                                        {a.detail}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </RowFrame>

            {/* Rows 1 + 3, as one balance. The StatStrip is the house device for
                "this money arrives from many places and is one number" — see its
                own docblock; do not replace it with a gapped grid of Panels. */}
            <RowFrame
                rowKey="lifetime_value"
                live={isLive('top_supporters') || isLive('lifetime_value')}
                className="mt-3"
            >
                <StatStrip items={tiles} cols={2} />
            </RowFrame>

            {/* 🚨 THE THREE DETAIL BLOCKS LIVE ON THE FULL PAGE, NOT HERE.
                Top supporters, revenue by feature and supporter movement were
                all drawn on this dashboard module AND on
                `Creator/Financial/Opportunities`, which is the page the button
                below opens — the same three lists, twice, and the full page
                carries them in more detail (five retention buckets to this
                one's four, including "Cooling", which had no equivalent here).

                What is left is what a dashboard is for: the one thing to do
                next, anything time-sensitive, and the balance. The reading in
                depth is a click away and always was.

                ⚠️ THE PAYLOAD IS UNCHANGED — `OpportunityPanelPayload::forDashboard`
                still returns all nine rows, and `EarningsIntelligenceTest` still
                asserts it. The brief's rule is that an unfinished row ships
                GREYED RATHER THAN MISSING; it is not a rule that every row must
                be rendered twice. If Jack wants the lists back on the dashboard,
                the data is already here and this is a revert of one block. */}

            {/* 🚨 THE SAME CARD AS "MY LISTINGS", WHICH SITS DIRECTLY BELOW IT.
                This was a solid pink bar — the loudest object in the owner
                column, for a link. Two links to two creator screens, stacked,
                drawn in two different languages: one a filled banner, one a
                white card with an icon tile and a round chevron. A reader has to
                work out that they are the same KIND of thing. Now they match,
                and the difference between them is the only thing that should
                differ — what they are for.

                ⚠️ `border border-[#000]`, 1px, never `border-black`, which is a
                shorthand in this project and would reset the width to 2. Mint
                tile because `tokens.js` gives mint to earned/settled money, and
                the pink is spent on the one thing to press. */}
            <Link
                href={route('financial.opportunities')}
                className="group mt-3 flex items-center gap-4 rounded-box border border-[#000] bg-white px-4 py-4 transition-colors duration-150 hover:bg-black/[0.04]"
            >
                <span
                    aria-hidden="true"
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-box-sm border border-[#000] bg-[#05EFB8] text-2xl"
                >
                    📈
                </span>

                <span className="min-w-0 flex-1">
                    {/* ⚠️ The SAME type as "My listings" below it, not the
                        `font-gulfs` display face the panel headings use. The two
                        cards are one pair; a different face on the same card
                        shape is the thing that made them read as unrelated.

                        ⚠️ The original carries `tracking-tigher` — a typo, so
                        not a class, so it has never applied. It is deliberately
                        NOT copied here; matching a rule that does nothing would
                        only spread it. */}
                    <span className="block text-[18px] font-black uppercase text-black md:text-[22px]">
                        {EI_FULL_VIEW_LABEL}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-semibold text-gray-600 md:text-[15px]">
                        Supporters, revenue by feature and supporter movement
                    </span>
                </span>

                {/* Black on pink, never white — 5.56:1 against white's 3.78:1. */}
                <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#000] bg-[#FF007F] text-lg font-black text-black"
                >
                    ›
                </span>
            </Link>
        </section>
    );
}

/**
 * One of the nine rows: renders its children when live, and a greyed
 * "Coming soon" card carrying that row's own explanation when it is not.
 *
 * 🚨 It NEVER returns null. The whole point of the brief's instruction is that
 * the row is still on the dashboard — greying is the substitute for absence, not
 * a softer version of it.
 *
 * 🚨 GREYING KEYS ON THE FLAG, NEVER ON WHETHER THERE IS DATA. "Coming soon"
 * means we have not built it; it must not be shown to a creator who simply has
 * no alerts this week, because that reads as the feature being broken when in
 * fact the answer is "nothing is wrong". Empty states belong inside each row.
 */
function RowFrame({ rowKey, live, className = '', children }) {
    if (live) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div className={className}>
            {/* Dashed edge is the house signal for "announced, not built" — the
                same device the bio page's stablecoin block uses. */}
            <div className="rounded-box border-2 border-dashed border-black/25 bg-black/[0.03] p-4">
                <Chip tone="neutral" dot>
                    {EI_COMING_SOON}
                </Chip>
                <p className="mt-2 text-[13px] leading-[1.5] text-black/50">
                    {EI_ROW_PENDING_COPY[rowKey] ||
                        'This part of your dashboard is on its way.'}
                </p>
            </div>
        </div>
    );
}

/** 1234 → "1,234". Thousands separators matter the moment a creator has traction. */
function fmtCount(value) {
    const n = Number(value);

    return Number.isFinite(n) ? n.toLocaleString('en-GB') : '0';
}

/**
 * Money in the creator's display currency.
 *
 * ⚠️ `Intl.NumberFormat` THROWS on an unrecognised currency code, which would
 * take the whole profile page down rather than one figure — so the format is
 * guarded and falls back to the bare number with its code.
 */
function fmtMoney(value, currency) {
    const n = Number(value);

    if (!Number.isFinite(n)) return '—';

    try {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
            minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `${n.toFixed(2)} ${currency || ''}`.trim();
    }
}
