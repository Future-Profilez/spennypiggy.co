import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

import Chip from '@/Components/UI/Chip';
import Panel, { PRESS } from '@/Components/UI/Panel';
import { Row } from '@/Components/UI/RowGroup';
import SectionHead from '@/Components/UI/SectionHead';
import StatStrip from '@/Components/UI/StatStrip';
import { ACCENT, TYPE } from '@/Components/UI/tokens';

import {
    EI_COMING_SOON,
    EI_EMPTY_ACTIONS,
    EI_EMPTY_SUPPORTERS,
    EI_FULL_VIEW_LABEL,
    EI_PANEL_LEAD,
    EI_PANEL_TITLE,
    EI_RETENTION_LABELS,
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
    const tiles = [
        {
            key: 'supporters',
            label: 'Supporters',
            value: fmtCount(totals.supporters),
            accent: 'violet',
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
            label: 'Average order',
            value: fmtMoney(totals.average_supporter_value, currency),
        },
    ];

    return (
        <section className={className} aria-label="Revenue opportunities">
            <SectionHead
                eyebrow="Revenue opportunities"
                title={EI_PANEL_TITLE}
                accent="pink"
            />

            <p className={`${TYPE.body} -mt-2 mb-4 text-black/60`}>
                {EI_PANEL_LEAD}
            </p>

            {/* Rows 1 + 3, as one balance. The StatStrip is the house device for
                "this money arrives from many places and is one number" — see its
                own docblock; do not replace it with a gapped grid of Panels. */}
            <RowFrame
                rowKey="lifetime_value"
                live={isLive('top_supporters') || isLive('lifetime_value')}
            >
                <StatStrip items={tiles} cols={2} />
            </RowFrame>

            {/* Row 5 — VIP alerts. Above the lists deliberately: an alert is the
                one thing here that is time-sensitive. */}
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

            {/* Rows 1 + 3 — the supporters themselves. */}
            <RowFrame
                rowKey="top_supporters"
                live={isLive('top_supporters')}
                className="mt-3"
            >
                <Panel pad="none">
                    <div className="border-b border-black/10 px-4 py-3 md:px-5">
                        <p className={`${TYPE.eyebrow} text-black/55`}>
                            Top supporters
                        </p>
                    </div>

                    {supporters.length === 0 ? (
                        <p className="px-4 py-5 text-[13px] leading-[1.5] text-black/55 md:px-5">
                            {EI_EMPTY_SUPPORTERS}
                        </p>
                    ) : (
                        /* `divide-y` on the container, never a border per row —
                           adjacent borders double up. Same rule as RowGroup,
                           which is not used here only because it brings its own
                           Panel and this section already has one. */
                        <div className="divide-y divide-black/10">
                            {supporters.map((s, i) => (
                                <Row
                                    key={`${s.name}-${i}`}
                                    title={s.name}
                                    meta={supporterMeta(s, currency)}
                                    figure={fmtMoney(s.lifetime_spent, currency)}
                                    figureSub={`${fmtCount(s.purchases)} purchase${
                                        s.purchases === 1 ? '' : 's'
                                    }`}
                                    lead={
                                        s.vip?.level ? (
                                            <span
                                                className="flex h-8 w-8 items-center justify-center rounded-box-xs border-2 border-black text-[13px]"
                                                style={{
                                                    backgroundColor:
                                                        s.vip.color ||
                                                        ACCENT.violet.hex,
                                                }}
                                                title={`Level ${s.vip.level}`}
                                                aria-label={`Level ${s.vip.level} supporter`}
                                            >
                                                {s.vip.icon || s.vip.level}
                                            </span>
                                        ) : null
                                    }
                                />
                            ))}
                        </div>
                    )}
                </Panel>
            </RowFrame>

            {/* Row 2 — where the money came from. */}
            <RowFrame
                rowKey="revenue_by_feature"
                live={isLive('revenue_by_feature')}
                className="mt-3"
            >
                <Panel pad="none">
                    <div className="border-b border-black/10 px-4 py-3 md:px-5">
                        <p className={`${TYPE.eyebrow} text-black/55`}>
                            Revenue by feature
                        </p>
                    </div>
                    <div className="divide-y divide-black/10">
                        {revenue.map((r) => (
                            <Row
                                key={r.label}
                                title={`${r.icon || ''} ${r.label}`.trim()}
                                /* The in-product name, where it differs. A creator
                                   whose menu says "Bills" should not have to work
                                   out that "Recurring Content" is the same thing. */
                                meta={
                                    r.product
                                        ? `In your menu: ${r.product}`
                                        : null
                                }
                                figure={fmtMoney(r.total, currency)}
                                figureSub={`${fmtCount(r.count)} sale${
                                    r.count === 1 ? '' : 's'
                                }`}
                            />
                        ))}
                    </div>
                </Panel>
            </RowFrame>

            {/* Row 4 — retention. Every bucket shows at zero: "you lost nobody" is
                an answer, and a blank is not. */}
            <RowFrame
                rowKey="retention"
                live={isLive('retention')}
                className="mt-3"
            >
                {retention && (
                    <Panel pad="sm">
                        <p className={`${TYPE.eyebrow} mb-3 text-black/55`}>
                            Supporters · last {retention.window_days} days
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {['new', 'returning', 'reactivated', 'lost'].map(
                                (k) => (
                                    <div key={k}>
                                        <p
                                            className={`${TYPE.figure} text-[22px]`}
                                        >
                                            {fmtCount(retention[k])}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-black/55">
                                            {EI_RETENTION_LABELS[k]}
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </Panel>
                )}
            </RowFrame>

            {/* Row 6 — what to do next. */}
            <RowFrame
                rowKey="suggested_actions"
                live={isLive('suggested_actions')}
                className="mt-3"
            >
                <Panel pad="none">
                    <div className="border-b border-black/10 px-4 py-3 md:px-5">
                        <p className={`${TYPE.eyebrow} text-black/55`}>
                            Suggested actions
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

            {/* Rows 7 + 8. The prompt is the standing answer to "how do I contact
                them?", and the sentence about reminders is what tells a creator the
                platform can do it for them without handing over an address. */}
            {panel.social_prompt && (
                <p className="mt-3 text-[12px] leading-[1.5] text-black/50">
                    {panel.social_prompt}
                    {panel.reminders_enabled && (
                        <>
                            {' '}
                            Quiet repeat supporters can also be sent the
                            platform&apos;s own reminder from the Opportunity
                            Centre.
                        </>
                    )}
                </p>
            )}

            <Link
                href={route('financial.opportunities')}
                className={`mt-3 flex min-h-[44px] items-center justify-between gap-3 rounded-box-sm border-2 border-black bg-[#FF007F] px-4 py-3 ${PRESS}`}
            >
                {/* 🚨 Black on pink, never white — measured 5.56:1 against white's
                    3.78:1, which fails AA at label size. */}
                <span className="font-gulfs text-[14px] uppercase tracking-[0.04em] text-black">
                    {EI_FULL_VIEW_LABEL}
                </span>
                <span aria-hidden="true" className="text-[18px] text-black">
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

/**
 * The meta line under a supporter's name.
 *
 * ⚠️ Country is here because supporter privacy on this screen is exactly three
 * things — display name (or Anonymous), amount, country. Nothing else about the
 * person may be added to this line.
 */
function supporterMeta(s, currency) {
    const parts = [];

    if (s.country) parts.push(s.country);

    if (s.monthly_spent > 0) {
        parts.push(`${fmtMoney(s.monthly_spent, currency)} this month`);
    }

    if (s.days_since_last_purchase !== null && s.days_since_last_purchase !== undefined) {
        parts.push(
            s.days_since_last_purchase === 0
                ? 'bought today'
                : `${s.days_since_last_purchase}d since last purchase`,
        );
    }

    /*
     * ⚠️ "Quiet" and not "at risk" or a red chip. A regular who has not bought
     * for a month is a prompt, not a failure — `Chip`'s `danger` tone is reserved
     * for money that actually went wrong, and colouring this one red teaches the
     * creator to ignore the colour when it matters.
     */
    if (s.at_risk) parts.push('quiet');

    return parts.length ? parts.join(' · ') : null;
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
