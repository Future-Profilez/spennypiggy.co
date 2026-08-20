import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { Users, TrendingUp, AlertTriangle, Sparkles, Send, ChevronLeft, ShoppingCart, BarChart3 } from 'lucide-react';

/**
 * Revenue Opportunity Centre.
 *
 * The financial dashboard answers "what did I earn". This answers "what should
 * I do next" — who to thank, who is drifting, and what isn't published yet.
 * It reads as a leaderboard of the creator's supporters on purpose: the same
 * engagement-Level language the platform uses everywhere else.
 *
 * Every supporter suggestion is advisory: the platform never hands a creator a
 * supporter's contact details, and the copy says so.
 */

const money = (amount, currency) =>
    `${currency === 'GBP' ? '£' : ''}${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}${currency !== 'GBP' ? ` ${currency}` : ''}`;

// Compact money for tight spots (e.g. "£1.2k") — keeps big numbers legible.
const moneyShort = (amount, currency) => {
    const n = Number(amount || 0);
    const sym = currency === 'GBP' ? '£' : '';
    const suffix = currency !== 'GBP' ? ` ${currency}` : '';
    if (n >= 1000) return `${sym}${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k${suffix}`;
    return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`;
};

// First-purchase date, rendered short (e.g. "3 Jun 2026"). DB gives "Y-m-d H:i:s".
const shortDate = (value) =>
    value
        ? new Date(String(value).replace(' ', 'T')).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : null;

// Rank badge for the leaderboard — the top three get a medal tint, the rest a number.
const rankStyle = (i) =>
    [
        'bg-[#f59e0b] text-gray-900', // gold — dark text (white-on-amber fails AA)
        'bg-gray-300 text-gray-900',
        'bg-[#b45309] text-white',
    ][i] ?? 'bg-gray-100 text-gray-700';

/**
 * "Send platform reminder" on an at-risk supporter.
 *
 * The platform delivers its standard content-first message with this creator's
 * name on it — the creator writes nothing and never sees contact details.
 * Consent and the once-per-quiet-spell lock are enforced server-side; this
 * component only reflects the answer.
 */
const RemindButton = ({ supporterId }) => {
    const [state, setState] = useState('idle'); // idle | busy | sent | blocked
    const [note, setNote] = useState(null);

    const send = async () => {
        setState('busy');

        try {
            const { data } = await axios.post(route('financial.opportunities.remind', supporterId));
            setState('sent');
            setNote(data.message);
        } catch (error) {
            setState('blocked');
            setNote(error?.response?.data?.message || 'Could not send right now.');
        }
    };

    // Sent is final; blocked is often transient (rate limit, network) so it stays
    // retryable. Both outcomes are announced to assistive tech via aria-live.
    if (state === 'sent') {
        return (
            <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 rounded-box-sm bg-green-100 px-3 py-2 text-[12px] font-bold text-green-800"
            >
                ✓ Reminder sent
            </span>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={send}
                disabled={state === 'busy'}
                title="The platform sends its standard reminder with your name on it — once per quiet spell, and only if the supporter allows reminders."
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-box-sm border-2 border-[#FF007F] px-4 py-2 text-[12px] font-bold text-[#FF007F] transition-colors hover:bg-[#FF007F] hover:text-black disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/50"
            >
                <Send size={13} />
                {state === 'busy' ? 'Sending…' : state === 'blocked' ? 'Try again' : 'Send platform reminder'}
            </button>
            {state === 'blocked' && note && (
                <span role="status" aria-live="polite" className="text-[12px] font-medium text-gray-600">
                    {note}
                </span>
            )}
        </div>
    );
};

/**
 * One side of the listings comparison. Each row names the problem rather than leaving
 * the creator to infer it from three numbers — "seen but not clicked through" and
 * "nobody is finding it" need opposite fixes.
 */
const ListingColumn = ({ title, rows = [], empty, accent }) => (
    <div className="rounded-box-sm border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-black/60">{title}</h3>
        </div>

        {rows.length === 0 ? (
            <p className="text-sm text-black/60">{empty}</p>
        ) : (
            <ul className="space-y-2.5">
                {rows.map((row) => (
                    <li key={`${row.type}-${row.id}`} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-gray-900">{row.title}</div>
                            <div className="text-xs text-black/60">{row.diagnosis}</div>
                        </div>
                        <div className="shrink-0 text-right">
                            <div className="font-anton text-lg leading-none text-gray-900">
                                {row.sold > 0 ? row.sold : row.viewers}
                            </div>
                            <div className="text-[12px] font-bold uppercase tracking-wide text-black/60">
                                {row.sold > 0 ? "sold" : "saw it"}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

const RetentionStat = ({ label, value, hint, accent }) => (
    <div className="rounded-box-sm border border-gray-200 bg-white p-4">
        <div className="h-1 w-8 rounded-full" style={{ backgroundColor: accent }} />
        <div className="mt-3 font-anton text-3xl leading-none text-gray-900">{value}</div>
        <div className="mt-2 text-[13px] font-bold uppercase tracking-wide text-black/60">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-black/60">{hint}</div>}
    </div>
);

export default function Opportunities({
    currency = 'GBP',
    supporters = [],
    tiers = [],
    revenue_by_type = [],
    retention = {},
    alerts = [],
    abandoned = {},
    listings = {},
    actions = [],
    totals = {},
    /*
     * Row 7 of the brief, flagged in `config/earnings_intelligence.php`.
     *
     * 🚨 FALSE HIDES THE CONTROL, IT DOES NOT GREY IT. Every other row on this
     * page is a read; this one queues an email and a push to a supporter. A
     * disabled-looking-but-live control on a sending path is a different class
     * of mistake from a greyed statistic.
     *
     * ⚠️ Defaults TRUE so the button does not disappear if an older cached page
     * payload arrives without the key — the server-side gates in
     * `remindSupporter` (ownership, repeat buyer, 30 days quiet, consent,
     * cross-sender cooldown, dedup claim) are the real enforcement, and they
     * have not moved.
     */
    reminders_enabled = true,
}) {
    // A brand-new creator has no supporters yet, so the supporter/retention/alert
    // sections would all read empty. Show them a "getting started" path instead —
    // the page is useful from day one, not only once money is coming in.
    const hasSupporters = (totals.supporters ?? 0) > 0;

    // Tier bar segments — only tiers anyone actually sits in.
    const tierPresent = tiers.filter((t) => t.count > 0);
    const tierTotal = tierPresent.reduce((sum, t) => sum + t.count, 0) || 1;

    // Revenue-by-feature total, for the share bars.
    const revenueTotal = revenue_by_type.reduce((sum, r) => sum + Number(r.total || 0), 0);
    const revenueRows = [...revenue_by_type].sort((a, b) => Number(b.total || 0) - Number(a.total || 0));

    return (
        <AuthenticatedLayout>
            <Head title="Revenue Opportunities" />

            <div className="min-h-dvh bg-gray-50 py-6 md:py-10">
                <div className="mx-auto max-w-4xl px-4 md:px-6">
                    {/* Header */}
                    <Link
                        href={route('financial.dashboard')}
                        className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-black/60 hover:text-[#FF007F]"
                    >
                        <ChevronLeft size={16} /> Financial dashboard
                    </Link>

                    {/* Hero — the whole point in one glance: how many supporters, worth how much. */}
                    <div className="relative overflow-hidden rounded-box bg-[#16161C] p-6 text-white md:p-8">
                        <div
                            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-2xl"
                            style={{ background: 'radial-gradient(circle, #FF007F, transparent 70%)' }}
                        />
                        <div className="relative">
                            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF007F]">
                                <Users size={14} /> Your supporters
                            </div>

                            {hasSupporters ? (
                                <>
                                    <div className="mt-2 flex items-end gap-3">
                                        <span className="font-anton text-6xl leading-none md:text-7xl">
                                            {totals.supporters ?? 0}
                                        </span>
                                        <span className="mb-1 text-sm text-white/60">
                                            paying supporter{(totals.supporters ?? 0) === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    {/* 🚨 "Paid you" and "You earned" are DIFFERENT NUMBERS and are
                                        labelled as such. The first is LedgerRules.buyerPaid — what the
                                        supporter was charged, and what their own bank statement says.
                                        The second is LedgerRules.creatorGross — the creator's share of
                                        those same sales. This block used to show the first under the
                                        word "Lifetime", which reads as earnings and is short of the
                                        supporter's real spend by the whole fee stack. */}
                                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                                        {[
                                            { label: 'Paid you', value: moneyShort(totals.lifetime_value, currency), tint: 'text-[#FF007F]' },
                                            { label: 'You earned', value: moneyShort(totals.lifetime_earned, currency), tint: 'text-[#05EFB8]' },
                                            { label: 'This month', value: moneyShort(totals.monthly_value, currency), tint: 'text-white' },
                                            { label: 'Avg / supporter', value: moneyShort(totals.average_supporter_value, currency), tint: 'text-white' },
                                        ].map((s) => (
                                            <div key={s.label} className="rounded-box-sm bg-white/5 p-3 ring-1 ring-white/10">
                                                <div className={`font-anton text-xl leading-none tabular-nums ${s.tint}`}>{s.value}</div>
                                                <div className="mt-1.5 text-[12px] font-bold uppercase tracking-wide text-white/60">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="mt-2">
                                    <div className="font-anton text-4xl leading-tight md:text-5xl">Your growth centre</div>
                                    <p className="mt-2 max-w-lg text-sm text-white/60">
                                        The steps to your first sale now — your supporter leaderboard, tiers and
                                        win-back prompts appear here as soon as the money starts coming in.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tier distribution — where your supporters sit on the platform ladder. */}
                    {hasSupporters && tierPresent.length > 0 && (
                        <div className="mt-4 rounded-box border border-gray-200 bg-white p-5 md:p-6">
                            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-black/60">
                                Supporter tiers
                            </h2>
                            <div className="flex h-4 w-full overflow-hidden rounded-full">
                                {tierPresent.map((t) => (
                                    <div
                                        key={t.level}
                                        style={{ width: `${(t.count / tierTotal) * 100}%`, backgroundColor: t.color }}
                                        title={`${t.level}: ${t.count}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {tierPresent.map((t) => (
                                    <span
                                        key={t.level}
                                        className="inline-flex items-center gap-1.5 rounded-box-sm border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-bold text-gray-700"
                                    >
                                        <span aria-hidden>{t.icon}</span>
                                        {t.level}
                                        <span className="tabular-nums text-gray-900">{t.count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Revenue by feature — where the money actually comes from.
                        Gated on revenue, NOT hasSupporters: guest/anonymous checkouts
                        (Piggy Pot / Wish) earn money without a supporter_id. */}
                    {revenueTotal > 0 && (
                        <div className="mt-4 rounded-box border border-gray-200 bg-white p-5 md:p-6">
                            <h2 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-black/60">
                                <BarChart3 size={15} className="text-[#FF007F]" /> Revenue by type
                            </h2>
                            <div className="space-y-3">
                                {revenueRows.map((r) => {
                                    const pct = revenueTotal > 0 ? (Number(r.total || 0) / revenueTotal) * 100 : 0;
                                    return (
                                        <div key={r.label}>
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                {/* ⚠️ The label is the client's current feature name
                                                    (brief §C row 2); `r.product` is what the SAME thing is
                                                    called in the creator's own menu. Without it a creator
                                                    reading "Recurring Content" has to work out that it is
                                                    the feature their nav calls "Bills". Null where they
                                                    already agree, and nothing extra renders. */}
                                                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-800">
                                                    <span aria-hidden>{r.icon}</span>
                                                    <span className="truncate">
                                                        {r.label}
                                                        {r.product && (
                                                            <span className="ml-1.5 font-normal text-black/45">
                                                                ({r.product})
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                                <span className="tabular-nums text-sm font-bold text-gray-900">
                                                    {money(r.total, currency)}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 motion-reduce:transition-none"
                                                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: r.color }}
                                                />
                                            </div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="text-[12px] text-black/60">
                                                    {r.count} payment{r.count === 1 ? '' : 's'}
                                                </span>
                                                <span className="text-[12px] font-bold text-black/60">
                                                    {pct.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Getting started — shown until the first supporter arrives. */}
                    {!hasSupporters && (
                        <div className="mt-4 rounded-box border-2 border-[#FF007F] bg-[#FF007F]/[0.04] p-5 md:p-6">
                            <div className="flex items-center gap-2 font-bold text-gray-900">
                                <Sparkles size={18} className="text-[#FF007F]" /> Get your first supporters
                            </div>
                            <ol className="mt-3 space-y-2.5 text-sm text-gray-700">
                                {[
                                    'Publish content people can buy — a wishlist item or a membership is the quickest start.',
                                    'Make sure payouts are set up so you can be paid (Stripe connected).',
                                    'Share your profile link on your own social channels — that is where your first buyers come from.',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-2.5">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF007F] text-[12px] font-bold text-black">
                                            {i + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-3 text-xs italic text-black/60">
                                The steps below are tailored to what you have not published yet.
                            </p>
                        </div>
                    )}

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div className="mt-6 space-y-2.5">
                            {alerts.map((a) => {
                                const warn = a.severity === 'warning';
                                return (
                                    <div
                                        key={a.key}
                                        className={`flex gap-3 rounded-box-sm border-l-4 bg-white p-4 ${
                                            warn ? 'border-amber-400' : 'border-[#FF007F]'
                                        }`}
                                    >
                                        <div className={warn ? 'text-amber-500' : 'text-[#FF007F]'}>
                                            {warn ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{a.title}</div>
                                            <p className="mt-0.5 text-sm text-gray-600">{a.detail}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/*
                        Abandoned checkouts — the only demand-side signal on this page.
                        Deliberately NOT gated on hasSupporters: a creator with no sales
                        yet is exactly who needs to know people reached their payment
                        screen and stopped.

                        No supporter is named here, ever. An abandoned checkout is a
                        weaker relationship than a purchase, not a stronger one.
                    */}
                    {(abandoned.count > 0 || abandoned.recovered > 0) && (
                        <section className="mt-8">
                            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
                                <ShoppingCart size={18} className="text-[#FF007F]" /> Stopped at checkout
                            </h2>
                            <p className="mb-3 text-sm text-black/60">
                                People who reached your payment screen in the last {abandoned.window_days ?? 30} days
                                and did not finish. We email them a reminder automatically.
                            </p>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                <RetentionStat
                                    label="Did not finish"
                                    value={abandoned.count ?? 0}
                                    hint={money(abandoned.value, currency) + ' not taken'}
                                    accent="#f59e0b"
                                />
                                <RetentionStat
                                    label="Came back"
                                    value={abandoned.recovered ?? 0}
                                    hint="Finished after a reminder"
                                    accent="#05EFB8"
                                />
                                <RetentionStat
                                    label="Completion rate"
                                    /* null means nobody started a checkout at all — which is
                                       not the same as nobody completing one. */
                                    value={abandoned.recovery_rate === null ? '—' : `${abandoned.recovery_rate}%`}
                                    hint="Of checkouts started"
                                    accent="#FF007F"
                                />
                            </div>

                            {abandoned.items?.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {abandoned.items.map((it) => (
                                        <div
                                            key={it.id}
                                            className="flex items-center justify-between gap-3 rounded-box-sm border border-gray-200 bg-white p-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-bold text-gray-900">
                                                    {it.title || `Your ${it.label}`}
                                                </div>
                                                <div className="text-xs text-black/60">
                                                    {it.reminded ? 'Reminder sent' : 'Reminder queued'}
                                                </div>
                                            </div>
                                            <div className="shrink-0 font-anton text-lg text-gray-900">
                                                {money(it.amount, currency)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="mt-3 text-xs italic text-black/60">
                                A listing that collects these is usually priced or described in a way that loses
                                people at the last step. We never share who they were.
                            </p>
                        </section>
                    )}

                    {/*
                        Which listings are working. The per-item line on the shop
                        dashboard answers "how is THIS one doing"; this answers the
                        question that only appears when you look at everything at once —
                        which listing deserves promotion, and which is quietly doing
                        nothing. Comparing eight cards by eye will not surface it.
                    */}
                    {(listings.working?.length > 0 || listings.stuck?.length > 0) && (
                        <section className="mt-8">
                            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
                                <BarChart3 size={18} className="text-[#FF007F]" /> Which listings are working
                            </h2>
                            <p className="mb-3 text-sm text-black/60">
                                Last {listings.window_days ?? 30} days, across your shop and paid tasks.{' '}
                                {/* This panel ranks the two types that have view data. The
                                    catalogue is where the other four — and anything stuck
                                    in review — actually show up. */}
                                <Link
                                    href={route('catalogue.index')}
                                    className="font-semibold text-[#FF007F] underline underline-offset-2"
                                >
                                    See every listing
                                </Link>
                            </p>

                            <div className="grid gap-3 md:grid-cols-2">
                                <ListingColumn
                                    title="Selling"
                                    empty="Nothing has sold in this window yet."
                                    rows={listings.working}
                                    accent="#05EFB8"
                                />
                                <ListingColumn
                                    title="Not selling"
                                    empty="Nothing stuck — everything with traffic is converting."
                                    rows={listings.stuck}
                                    accent="#f59e0b"
                                />
                            </div>
                        </section>
                    )}

                    {/* Suggested actions */}
                    <section className="mt-8">
                        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                            <TrendingUp size={18} className="text-[#FF007F]" /> What to do next
                        </h2>

                        {actions.length === 0 ? (
                            <p className="rounded-box-sm border border-gray-200 bg-white p-4 text-sm text-gray-600">
                                Nothing to suggest yet — this fills up once you have a few sales.
                            </p>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {actions.map((a) => (
                                    <div
                                        key={a.key}
                                        className="flex flex-col rounded-box-sm border border-gray-200 bg-white p-4  "
                                    >
                                        <h3 className="font-bold text-gray-900">{a.title}</h3>
                                        <p className="mt-1 flex-1 text-sm text-gray-600">{a.detail}</p>
                                        {a.hint && <p className="mt-2 text-xs italic text-black/60">{a.hint}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Retention */}
                    {hasSupporters && (
                        <section className="mt-8">
                            <h2 className="mb-3 text-lg font-bold text-gray-900">
                                Supporter movement · last {retention.window_days ?? 30} days
                            </h2>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                <RetentionStat label="New" value={retention.new ?? 0} hint="First ever purchase" accent="#05EFB8" />
                                <RetentionStat label="Returning" value={retention.returning ?? 0} hint="Bought before too" accent="#FF007F" />
                                <RetentionStat label="Reactivated" value={retention.reactivated ?? 0} hint="Back after 60+ days" accent="#a855f7" />
                                <RetentionStat label="Cooling" value={retention.cooling ?? 0} hint="Quiet 30–60 days" accent="#f59e0b" />
                                <RetentionStat label="Lost" value={retention.lost ?? 0} hint="Silent 60+ days" accent="#9ca3af" />
                            </div>
                        </section>
                    )}

                    {/* Supporter leaderboard */}
                    {hasSupporters && (
                        <section className="mt-8">
                            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
                                <Users size={18} className="text-[#FF007F]" /> Top supporters
                            </h2>
                            <p className="mb-3 text-sm text-black/60">
                                Ranked by lifetime spend with you.
                                {(totals.supporters ?? 0) > supporters.length && (
                                    <> Showing your top {supporters.length} of {totals.supporters}.</>
                                )}
                            </p>

                            <div className="space-y-2.5">
                                {supporters.map((s, i) => (
                                    <div
                                        key={s.supporter_id}
                                        className="rounded-box-sm border border-gray-200 bg-white p-4  "
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Rank */}
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-anton ${rankStyle(i)}`}
                                            >
                                                {i + 1}
                                            </span>

                                            {/* Identity */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate font-bold text-gray-900">{s.name || 'Anonymous'}</span>
                                                    {s.vip?.level && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-bold text-gray-900"
                                                            style={{ backgroundColor: `${s.vip.color}22`, borderColor: s.vip.color }}
                                                            title={`Engagement level: ${s.vip.level}`}
                                                        >
                                                            {s.vip.icon} {s.vip.level}
                                                        </span>
                                                    )}
                                                    {s.at_risk && (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-bold text-amber-800">
                                                            At risk
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 text-[13px] text-black/60">
                                                    {s.purchases} purchase{s.purchases === 1 ? '' : 's'} ·{' '}
                                                    {money(s.average_order_value, currency)} avg
                                                    {s.days_since_last_purchase !== null && (
                                                        <span title={s.last_purchase ? `Last purchase: ${shortDate(s.last_purchase)}` : ''}>
                                                            {' '}· {s.days_since_last_purchase}d ago
                                                        </span>
                                                    )}
                                                    {s.first_purchase && (
                                                        <span className="hidden sm:inline"> · since {shortDate(s.first_purchase)}</span>
                                                    )}
                                                    {/* ⚠️ Country completes the three fields a creator is
                                                        allowed to see about a supporter — display name (or
                                                        Anonymous), amount, country. Nothing else about the
                                                        person may join this line, and an email address never
                                                        can: the social-channels prompt on each action is the
                                                        answer to "how do I reach them?". */}
                                                    {s.country && <span> · {s.country}</span>}
                                                </div>
                                            </div>

                                            {/* Spend */}
                                            <div className="shrink-0 text-right">
                                                <div className="font-anton text-xl leading-none tabular-nums text-gray-900">
                                                    {moneyShort(s.lifetime_spent, currency)}
                                                </div>
                                                {/* ⚠️ "spent with you", not "lifetime". The figure is
                                                    LedgerRules.buyerPaid — what this person was charged,
                                                    which is what their own statement says and is NOT the
                                                    creator's share of it. The bare word "lifetime" reads
                                                    as earnings. */}
                                                <div className="text-[12px] font-bold uppercase tracking-wide text-black/60">spent with you</div>
                                                {s.monthly_spent > 0 && (
                                                    <div className="mt-1 text-[13px] font-bold tabular-nums text-[#FF007F]">
                                                        +{money(s.monthly_spent, currency)} this mo.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {s.at_risk && reminders_enabled && (
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                <RemindButton supporterId={s.supporter_id} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-xs italic text-black/60">
                                Supporter contact details are never shared. "Send platform reminder" delivers the
                                platform's standard message with your name on it — once per quiet spell, and only if
                                the supporter allows reminders. For anything personal, use your own social channels.
                            </p>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
