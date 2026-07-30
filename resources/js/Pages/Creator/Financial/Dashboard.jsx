import { useState, useRef, Fragment } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import LedgerHistoryTable from '@/Components/Financial/LedgerHistoryTable';
import StatementDownloadCard from './StatementDownloadCard';
import EnableBankPaymentsCard from '@/Components/EnableBankPaymentsCard';
import { WalletIcon, TrendingUpIcon, TrendingDownIcon, DownloadIcon, PlusIcon, TriangleAlertIcon, CircleCheckIcon, UsersIcon, ChevronRightIcon, ChartPieIcon, ShieldCheckIcon } from '@animateicons/react/lucide';
import { Calculator, FileText, Building2, HelpCircle, Pencil, RefreshCw, Clock, Landmark, Receipt, BadgeCheck } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

/* ---------------------------------------------------------------------------
 * Shared display tokens. One card shape, one money style, one label style —
 * the old page mixed rounded-[30px]/rounded-xl/rounded-lg and three different
 * label treatments, which is what made it read as unfinished.
 * ------------------------------------------------------------------------ */
const CARD = 'bg-white border border-gray-200 rounded-box';
const MONEY = 'tabular-nums tracking-tight font-bold';
const LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const BTN = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-box-sm text-[14px] font-semibold transition-colors';

const PAYOUT_TYPE_STYLES = {
    fast_start: 'bg-[#FF007F]/10 text-[#FF007F] border-[#FF007F]/20',
    founder: 'bg-purple-100 text-purple-700 border-purple-200',
    reserve_release: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    weekly: 'bg-gray-100 text-gray-600 border-gray-200',
};

const payoutStatusBadgeCls = (status) =>
    status === 'paid' ? 'bg-green-100 text-green-700' :
    status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
    (status === 'failed' || status === 'skipped') ? 'bg-red-100 text-red-700' :
    status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
    'bg-yellow-100 text-yellow-700';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'tax', label: 'Tax' },
];

function Section({ title, sub, children, action = null }) {
    return (
        <section className="mt-10 first:mt-0">
            <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
                    {sub ? <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">{sub}</p> : null}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

/* A single explained figure. Used for every "what is this money" tile so the
   creator learns one pattern instead of five. */
function Stat({ label, value, sub, tone = 'default', icon = null }) {
    const toneCls = {
        default: 'text-gray-900',
        good: 'text-emerald-600',
        warn: 'text-amber-600',
        bad: 'text-red-600',
    }[tone];
    return (
        <div className={`${CARD} p-5 flex flex-col justify-between`}>
            <div>
                <div className={`${LABEL} flex items-center gap-2`}>
                    {icon}{label}
                </div>
                <div className={`text-2xl md:text-[28px] ${MONEY} mt-2 ${toneCls}`}>{value}</div>
            </div>
            {sub ? <div className="text-[13px] text-gray-500 font-medium mt-3 leading-snug">{sub}</div> : null}
        </div>
    );
}

export default function Dashboard({ auth, summary, tax_estimate, tax_year, tax_year_number, date_range, tax_band_label, display_currency, profile, recent_transactions, analytics, top_supporters, status_breakdown = [], reserve_breakdown = [], reserve_released_breakdown = [], reserve_total_released = 0, reserve_total_held = 0, upcoming_payout = null, reserve_reason, reserve_policy = null, payout_cycle = null, payout_history = [], fast_start_bonus = null, founder_bonus = null, active_tab = 'overview' }) {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [expandedPayout, setExpandedPayout] = useState(null);
    const [showPayoutBreakdown, setShowPayoutBreakdown] = useState(false);
    const [showReserveDetails, setShowReserveDetails] = useState(false);
    const [reserveDetails, setReserveDetails] = useState(null);
    const [reserveLoading, setReserveLoading] = useState(false);
    const [reserveLoadError, setReserveLoadError] = useState(null);
    const logExpenseIconRef = useRef(null);
    const exportCsvIconRef = useRef(null);

    const { post: refreshPost, processing: refreshProcessing } = useForm({});

    const displayCurrency = display_currency || summary?.currency || auth?.user?.default_currency || 'GBP';

    // The route only knows the tabs the controller passes through; anything else
    // falls back to Overview rather than rendering an empty page.
    const tab = TABS.some((t) => t.key === active_tab) ? active_tab : 'overview';

    const { data, setData, post, processing } = useForm({
        business_name: profile?.business_name || '',
        business_address_line1: profile?.business_address_line1 || '',
        business_city: profile?.business_city || '',
        business_postal_code: profile?.business_postal_code || '',
        vat_registered: profile?.vat_registered || false,
        vat_registration_number: profile?.vat_registration_number || '',
        tax_percentage: profile?.tax_percentage || 20,
    });

    const submitProfile = (e) => {
        e.preventDefault();
        post(route('financial.profile.update'), {
            onSuccess: () => setIsEditingProfile(false),
        });
    };

    const formatCurrency = (amount, currency = 'GBP') =>
        new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP' }).format(Number(amount || 0));

    // Bare currency symbol for chart axes (Intl currency formatting is too wide for a tick).
    const currencySymbol = (() => {
        try {
            const parts = new Intl.NumberFormat('en-GB', { style: 'currency', currency: displayCurrency || 'GBP' }).formatToParts(0);
            return parts.find((p) => p.type === 'currency')?.value || '£';
        } catch (e) {
            return '£';
        }
    })();

    const chartData = analytics?.monthly?.map((item) => ({
        name: new Date(item.month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
        total: parseFloat(item.total),
    })) || [];

    const reserves = reserveDetails?.breakdown || [];
    const reserveTotal = Number(reserveDetails?.total_held ?? summary?.held_reserves ?? 0);
    const releasedReserves = reserveDetails?.released_breakdown ?? reserve_released_breakdown ?? [];
    const releasedTotal = Number(reserveDetails?.total_released ?? reserve_total_released ?? 0);

    const openReserveDetails = async () => {
        setShowReserveDetails(true);
        setReserveLoadError(null);
        setReserveLoading(true);
        try {
            const res = await axios.get(route('creator.payouts.reserves'), { params: { currency: displayCurrency } });
            setReserveDetails(res.data);
        } catch (e) {
            setReserveLoadError(e?.response?.data?.error || e?.message || 'Failed to load reserves.');
        } finally {
            setReserveLoading(false);
        }
    };

    const cycleWindowLabel = (() => {
        if (!payout_cycle?.window_start || !payout_cycle?.window_end) return null;
        const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
        return `${fmt(payout_cycle.window_start)} to ${fmt(payout_cycle.window_end)}`;
    })();

    const nextPayoutLabel = payout_cycle?.next_payout_at
        ? new Date(payout_cycle.next_payout_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    // Days until the next Friday payout (0 = today).
    const daysToPayout = (() => {
        if (!payout_cycle?.next_payout_at) return null;
        const ms = new Date(payout_cycle.next_payout_at).getTime() - Date.now();
        return Math.max(0, Math.ceil(ms / 86400000));
    })();

    // Soonest reserve to be released (per-transaction 30-day rolling window).
    const nextReserveRelease = (() => {
        const held = (Array.isArray(reserve_breakdown) ? reserve_breakdown : [])
            .filter((r) => (r?.reserve_status ?? 'held') !== 'released' && Number(r?.amount ?? 0) > 0);
        if (!held.length) return null;
        return held.reduce((best, r) => {
            const days = Math.max(0, Number(r?.days_remaining ?? 9999));
            return best === null || days < best.days ? { days, date: r?.release_date ?? null } : best;
        }, null);
    })();

    const plural = (n) => (Number(n) === 1 ? '' : 's');

    // This Friday's payout. HEADLINE figures come from the authoritative payout engine
    // (summary.payout_preview = calculatePayouts, already in display currency).
    // upcoming_payout is used ONLY for the per-transaction breakdown list.
    const upcomingTx = Array.isArray(upcoming_payout?.transactions) ? upcoming_payout.transactions : [];
    const upcomingPayable = Number(summary?.payout_preview?.net_payout ?? summary?.payoutable_balance ?? 0);
    const upcomingReserveHeld = Number(summary?.payout_preview?.reserve_held ?? upcoming_payout?.total_reserve ?? 0);
    const upcomingCount = Number(summary?.payout_preview?.payment_count ?? upcomingTx.length);

    // Reserve due to settle back within the days-to-Friday horizon.
    const releasingThisWeek = (() => {
        const horizon = daysToPayout ?? 7;
        return (Array.isArray(reserve_breakdown) ? reserve_breakdown : [])
            .filter((r) => (r?.reserve_status ?? 'held') !== 'released' && Number(r?.days_remaining ?? 9999) <= horizon)
            .reduce((sum, r) => sum + Number(r?.amount_converted ?? Number(r?.amount ?? 0) / 100), 0);
    })();

    // Real payout state — a paused / negative / below-threshold creator must never
    // be shown a green "on schedule" badge.
    const payoutState = (() => {
        const pp = summary?.payout_preview;
        if (auth?.user?.payout_paused_at) {
            return { tone: 'bad', label: 'Payouts paused', note: 'Payouts are on hold. Contact support if you were not expecting this.' };
        }
        if (Number(pp?.negative_balance_after || 0) > 0) {
            return { tone: 'warn', label: 'Balance recovery', note: 'A previous refund left a negative balance. It is recovered from new earnings before the next payout.' };
        }
        if (pp?.is_below_threshold) {
            return { tone: 'warn', label: 'Below minimum', note: 'Your payable balance is under the minimum payout amount. It carries over and pays once it clears.' };
        }
        return { tone: 'good', label: daysToPayout === 0 ? 'Sending today' : 'On schedule', note: 'Your account is in good standing and payouts run every Friday.' };
    })();

    const stateChip = {
        good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warn: 'bg-amber-50 text-amber-700 border-amber-200',
        bad: 'bg-red-50 text-red-700 border-red-200',
    }[payoutState.tone];

    const stateDot = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500' }[payoutState.tone];

    // Where the rest of the money sits, in lifecycle order.
    const moneyRows = (() => {
        const rows = [
            {
                key: 'clearing',
                label: 'Clearing',
                amount: summary?.clearing_balance,
                hint: 'Paid by supporters. Becomes payable after the 7-day safety hold.',
                dot: 'bg-blue-500',
            },
            {
                key: 'pending',
                label: 'Pending delivery',
                amount: summary?.pending_balance,
                hint: 'Yours once you fulfil the order or task.',
                dot: 'bg-yellow-500',
            },
            {
                key: 'reserve',
                label: 'Reserve held',
                amount: summary?.held_reserves,
                hint: nextReserveRelease === null
                    ? 'Nothing held right now.'
                    : nextReserveRelease.days === 0
                        ? 'Next reserve frees today.'
                        : `Next frees in ${nextReserveRelease.days} day${plural(nextReserveRelease.days)}${nextReserveRelease.date ? ` · ${nextReserveRelease.date}` : ''}`,
                dot: 'bg-cyan-500',
                onClick: openReserveDetails,
            },
        ];
        const riskAmount = Number(summary?.review_holds || 0) + Number(summary?.disputes || 0);
        if (riskAmount > 0) {
            rows.push({
                key: 'risk',
                label: 'Under review or disputed',
                amount: riskAmount,
                hint: 'On hold while we resolve a review or dispute. Released once cleared.',
                dot: 'bg-orange-500',
            });
        }
        if (releasedTotal > 0) {
            rows.push({
                key: 'released',
                label: 'Reserve released to date',
                amount: releasedTotal,
                hint: 'Already paid back to you. Lifetime total, not part of your current balance.',
                dot: 'bg-emerald-500',
                muted: true,
                onClick: openReserveDetails,
            });
        }
        return rows;
    })();

    // "Why is my payable lower than my earnings" — built from the fields the
    // backend actually returns.
    const payableLines = (() => {
        const pp = summary?.payout_preview;
        if (!pp) return [];
        const lines = [
            { label: 'Net earnings', amount: Number(pp.net_earnings || 0) },
            { label: 'Reserve held (returned later)', amount: -Number(pp.reserve_held || 0) },
            { label: 'Refunds & disputes', amount: -Number(pp.refund_disputes || 0) },
            { label: 'Under review', amount: -Number(pp.review_holds || 0) },
            { label: 'Balance recovery', amount: -Number(pp.negative_balance_before || 0) },
        ].filter((l) => Math.abs(l.amount) > 0.005);
        return lines.length > 1 ? lines : [];
    })();

    const statusBuckets = [
        { key: 'queued', label: 'Queued for Friday', text: 'text-emerald-700', dot: 'bg-emerald-500', note: 'In the next payout batch.' },
        { key: 'clearing', label: 'Clearing', text: 'text-blue-700', dot: 'bg-blue-500', note: 'Paid, clearing for 7 days.' },
        { key: 'pending', label: 'Pending completion', text: 'text-yellow-700', dot: 'bg-yellow-500', note: 'Waiting on task or shop delivery.' },
        { key: 'review_hold', label: 'Review hold', text: 'text-purple-700', dot: 'bg-purple-500', note: 'Held for safety or compliance checks.' },
        { key: 'disputed', label: 'Disputed', text: 'text-orange-700', dot: 'bg-orange-500', note: 'Removed from your payout balance.' },
        { key: 'refunded', label: 'Refunded', text: 'text-red-700', dot: 'bg-red-500', note: 'Returned to the supporter.' },
    ];

    const taxYearProgress = (() => {
        const now = new Date();
        const year = now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6) ? now.getFullYear() - 1 : now.getFullYear();
        const start = new Date(year, 3, 6);
        const end = new Date(year + 1, 3, 5);
        return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    })();

    const records = [
        { label: 'Income statement', sub: 'For your accountant', href: route('financial.statement'), icon: <FileText size={16} className="text-[#FF007F]" /> },
        { label: 'Verified certificate', sub: 'Proof of income', href: route('financial.certificate'), icon: <BadgeCheck size={16} className="text-emerald-600" /> },
        { label: 'Transaction history', sub: 'Every payment & payout status', href: route('financial.history'), icon: <Receipt size={16} className="text-amber-600" /> },
        { label: 'Expenses', sub: 'Costs you track against tax', href: route('financial.expenses.index'), icon: <TrendingDownIcon size={16} className="text-red-500" /> },
    ];

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Money & tax" />

            {/* ---------------------------------------------------------------
                Reserve detail modal
            --------------------------------------------------------------- */}
            <Modal show={showReserveDetails} onClose={() => setShowReserveDetails(false)} maxWidth="2xl">
                <div className="bg-white text-gray-900 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className={LABEL}>Reserves</div>
                            <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mt-2">
                                <div>
                                    <div className={`text-xl md:text-2xl ${MONEY} text-gray-900`}>{formatCurrency(reserveTotal, displayCurrency)}</div>
                                    <div className="text-[12px] font-semibold text-cyan-700 mt-0.5">Still to be released</div>
                                </div>
                                <div>
                                    <div className={`text-lg md:text-xl ${MONEY} text-emerald-600`}>{formatCurrency(releasedTotal, displayCurrency)}</div>
                                    <div className="text-[12px] font-semibold text-emerald-600 mt-0.5">Released to date</div>
                                </div>
                            </div>
                            <div className="text-[13px] text-gray-500 font-medium mt-2">{reserve_reason || 'Reserves currently held on your earnings.'}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowReserveDetails(false)}
                            className={`${BTN} bg-gray-100 hover:bg-gray-200 text-gray-700 shrink-0`}
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
                        {reserveLoading ? (
                            <div className="text-gray-500 text-sm font-medium">Loading reserves…</div>
                        ) : reserveLoadError ? (
                            <div className="text-red-600 text-sm font-semibold">{reserveLoadError}</div>
                        ) : (reserves || []).length === 0 ? (
                            <div className="text-gray-500 text-sm font-medium">No held reserves right now.</div>
                        ) : (
                            <>
                                {/* Mobile: card rows. A 6-column table is unusable at 390px. */}
                                <div className="md:hidden divide-y divide-gray-100 border border-gray-200 rounded-box overflow-hidden">
                                    {(reserves || []).map((r, idx) => {
                                        const txDate = r.transaction_date ? new Date(r.transaction_date) : null;
                                        const relDays = r.days_remaining === null || r.days_remaining === undefined ? null : Math.max(0, Number(r.days_remaining));
                                        const isReleased = r.reserve_status === 'released';
                                        return (
                                            <div key={`m-${r.financial_transaction_id || idx}-${idx}`} className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-[14px] font-semibold text-gray-900 line-clamp-2">{r.source_name || 'Reserve'}</div>
                                                        <div className="text-[12px] text-gray-500 font-medium mt-1">
                                                            {txDate ? txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                                                            {r.supporter ? ` · @${r.supporter.username}` : ' · Guest'}
                                                        </div>
                                                    </div>
                                                    <div className={`${MONEY} text-gray-900 shrink-0`}>{formatCurrency(Number(r.amount || 0) / 100, r.currency || displayCurrency)}</div>
                                                </div>
                                                <div className="mt-2 text-[13px] font-semibold">
                                                    {isReleased ? (
                                                        <span className="text-emerald-600">Released{r.release_date ? ` · ${r.release_date}` : ''}</span>
                                                    ) : relDays !== null ? (
                                                        <span className="text-cyan-700">{relDays === 0 ? 'Frees today' : `Frees in ${relDays} day${plural(relDays)}`}{r.release_date ? ` · ${r.release_date}` : ''}</span>
                                                    ) : (
                                                        <span className="text-gray-600">{r.release_date || '-'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="hidden md:block overflow-x-auto rounded-box border border-gray-200">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                            <tr className="text-gray-500 text-[11px] uppercase font-semibold tracking-wide">
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Supporter</th>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3">Releases</th>
                                                <th className="px-4 py-3 text-right">Reserved</th>
                                                <th className="px-4 py-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(reserves || []).map((r, idx) => {
                                                const txDate = r.transaction_date ? new Date(r.transaction_date) : null;
                                                const dateLabel = txDate
                                                    ? txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                                                    : (r.run_date && r.run_date !== 'Pending' ? new Date(r.run_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-');
                                                const statusKey = (r.status || '').toString();
                                                const statusMeta = (() => {
                                                    const map = {
                                                        completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                                        review_hold: { label: 'Review hold', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                                                        disputed: { label: 'Disputed', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
                                                        refunded: { label: 'Refunded', cls: 'bg-red-50 text-red-700 border-red-200' },
                                                        pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                                    };
                                                    return map[statusKey] || (statusKey ? { label: statusKey.replaceAll('_', ' '), cls: 'bg-gray-100 text-gray-600 border-gray-200' } : null);
                                                })();
                                                const isReleased = r.reserve_status === 'released';
                                                const relDays = r.days_remaining === null || r.days_remaining === undefined ? null : Math.max(0, Number(r.days_remaining));
                                                return (
                                                    <tr key={`${r.financial_transaction_id || r.payout_run_id || idx}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-[14px] text-gray-900 font-medium whitespace-nowrap">{dateLabel}</td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                            {r.supporter ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-900 font-medium capitalize">{r.supporter.name}</span>
                                                                    <span className="text-[13px] text-gray-500">@{r.supporter.username}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500 text-[14px]">Guest / System</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm min-w-[240px]">
                                                            <div className="font-medium text-gray-900 line-clamp-2">{r.source_name || 'Reserve'}</div>
                                                            {r.label || r.source_type === 'payout_run' ? (
                                                                <div className="text-[12px] text-gray-500 font-medium mt-0.5">{r.label || 'Payout run'}</div>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {isReleased ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[13px] font-semibold text-emerald-600">Released</span>
                                                                    {r.release_date ? <span className="text-[12px] text-gray-400 font-medium">{r.release_date}</span> : null}
                                                                </div>
                                                            ) : relDays !== null ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[13px] font-semibold text-cyan-700">{relDays === 0 ? 'Frees today' : `in ${relDays} day${plural(relDays)}`}</span>
                                                                    {r.release_date ? <span className="text-[12px] text-gray-400 font-medium">{r.release_date}</span> : null}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[13px] text-gray-600 font-medium">{r.release_date || '-'}</span>
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right whitespace-nowrap ${MONEY} text-gray-900`}>
                                                            {formatCurrency(Number(r.amount || 0) / 100, r.currency || displayCurrency)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                                            {statusMeta ? (
                                                                <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusMeta.cls}`}>{statusMeta.label}</span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {!reserveLoading && !reserveLoadError && (releasedReserves || []).length > 0 && (
                            <div className="mt-6">
                                <div className="text-[13px] font-semibold text-emerald-700 mb-2">Released history — reserves already paid back to you</div>
                                <div className="divide-y divide-gray-100 border border-gray-200 rounded-box overflow-hidden">
                                    {(releasedReserves || []).map((r, idx) => {
                                        const relAt = r.released_at ? new Date(r.released_at) : null;
                                        const verified = r.verified !== false;
                                        return (
                                            <div key={`rel-${r.financial_transaction_id || idx}-${idx}`} className="flex items-start justify-between gap-3 p-4">
                                                <div className="min-w-0">
                                                    <div className="text-[14px] font-medium text-gray-900 line-clamp-2">{r.source_name || 'Reserve'}</div>
                                                    <div className="text-[12px] text-gray-500 font-medium mt-1">
                                                        {relAt ? relAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                        {r.supporter ? ` · @${r.supporter.username}` : ' · Guest'}
                                                    </div>
                                                    <div className={`text-[12px] font-semibold mt-1 ${verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {verified ? 'Paid to you' : 'Settled with base earning'}
                                                    </div>
                                                </div>
                                                <div className={`${MONEY} text-gray-900 shrink-0`}>{formatCurrency(Number(r.amount || 0) / 100, r.currency || displayCurrency)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="bg-gray-50 min-h-dvh pb-28 md:pb-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

                    {/* -----------------------------------------------------------
                        Header — one line of purpose, then the actions.
                    ----------------------------------------------------------- */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Money &amp; tax</h1>
                            <p className="text-[14px] md:text-[15px] text-gray-600 font-medium mt-1.5 leading-snug">
                                You keep 100% of your listed price — supporters cover the fees. Payouts go out every Friday.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/20 text-[12px] font-semibold px-3 py-1.5 rounded-full">
                                    Tax year {tax_year}
                                </span>
                                <span className="text-[12px] text-gray-500 font-medium">{date_range?.start} – {date_range?.end}</span>
                                {tax_band_label ? <span className="text-[12px] text-gray-400 font-medium">· {tax_band_label}</span> : null}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:flex gap-2 shrink-0">
                            <Link
                                href={route('financial.expenses.index')}
                                onMouseEnter={() => logExpenseIconRef.current?.startAnimation?.()}
                                onMouseLeave={() => logExpenseIconRef.current?.stopAnimation?.()}
                                className={`${BTN} bg-[#FF007F] hover:bg-[#d8006c] text-white`}
                            >
                                <PlusIcon ref={logExpenseIconRef} size={18} />
                                <span>Log expense</span>
                            </Link>
                            <a
                                href={route('financial.export.csv')}
                                target="_blank"
                                rel="noreferrer"
                                onMouseEnter={() => exportCsvIconRef.current?.startAnimation?.()}
                                onMouseLeave={() => exportCsvIconRef.current?.stopAnimation?.()}
                                className={`${BTN} bg-white border border-gray-200 hover:bg-gray-100 text-gray-800`}
                            >
                                <DownloadIcon ref={exportCsvIconRef} size={18} />
                                <span>Export CSV</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => refreshPost(route('financial.refresh'))}
                                disabled={refreshProcessing}
                                className={`${BTN} col-span-2 lg:col-auto bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-60 text-gray-800`}
                            >
                                <RefreshCw size={18} className={refreshProcessing ? 'animate-spin' : ''} />
                                <span>{refreshProcessing ? 'Refreshing…' : 'Refresh'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Payouts paused — the single most important thing on the page when it applies. */}
                    {auth?.user?.payout_paused_at ? (
                        <div className="mt-6 rounded-box border border-red-200 bg-red-50 p-5">
                            <div className="flex items-start gap-3">
                                <TriangleAlertIcon size={22} className="text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[16px] font-bold text-red-800">Payouts are paused</div>
                                    <div className="text-[14px] text-red-800 font-medium mt-1">
                                        {auth.user.payout_pause_reason || 'Under review by SpennyPiggy support.'}
                                    </div>
                                    <div className="text-[13px] text-red-700 font-medium mt-1">
                                        Paused {new Date(auth.user.payout_paused_at).toLocaleString('en-GB')} · your earnings are safe and will be sent once this clears.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Bank payments self-service — renders only when a capability is missing. */}
                    <div className="mt-6">
                        <EnableBankPaymentsCard />
                    </div>

                    {/* -----------------------------------------------------------
                        HERO — the one answer the page exists for. Shown on every
                        tab so the creator never has to hunt for it.
                    ----------------------------------------------------------- */}
                    <div className="mt-6 rounded-box border border-emerald-100 bg-white overflow-hidden">
                        <div className="p-6 md:p-8 bg-gradient-to-br from-emerald-50/80 via-white to-white">
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                                <div className="min-w-0">
                                    <div className={`${LABEL} flex items-center gap-2`}>
                                        <WalletIcon size={15} className="text-[#FF007F]" /> Your next payout
                                    </div>
                                    <div className="mt-3 flex items-end gap-3 flex-wrap">
                                        <div className="text-[40px] md:text-5xl font-bold tracking-tight tabular-nums text-emerald-600 leading-[0.95]">
                                            {formatCurrency(upcomingPayable, displayCurrency)}
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold mb-1 ${stateChip}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${stateDot}`} />
                                            {payoutState.label}
                                        </span>
                                    </div>
                                    <div className="mt-2.5 text-[14px] text-gray-600 font-medium leading-snug">
                                        {daysToPayout === null
                                            ? 'Sent automatically every Friday.'
                                            : daysToPayout === 0
                                                ? 'Sending today.'
                                                : `Arrives in ${daysToPayout} day${plural(daysToPayout)}${nextPayoutLabel ? ` · ${nextPayoutLabel}` : ''}.`}
                                        {' '}
                                        {upcomingCount > 0
                                            ? `${upcomingCount} sale${plural(upcomingCount)} included.`
                                            : 'Nothing eligible yet — sales clear after a 7-day hold.'}
                                    </div>
                                    {payoutState.tone !== 'good' ? (
                                        <div className="mt-2 text-[13px] text-gray-600 font-medium leading-snug max-w-xl">{payoutState.note}</div>
                                    ) : null}
                                </div>

                                <div className="shrink-0 flex items-center gap-3">
                                    <Link href={route('financial.dashboard', { tab: 'payouts' })} className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#FF007F] hover:underline min-h-[44px]">
                                        Payout history <ChevronRightIcon size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Three numbers that explain the one above. */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-gray-100 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            <div className="p-5">
                                <div className={`${LABEL} flex items-center gap-2`}><Clock size={14} className="text-blue-500" /> Clearing</div>
                                <div className={`text-xl ${MONEY} text-gray-900 mt-2`}>{formatCurrency(summary?.clearing_balance, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 font-medium mt-1">Payable after the 7-day hold</div>
                            </div>
                            <button type="button" onClick={openReserveDetails} className="p-5 text-left hover:bg-gray-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50">
                                <div className={`${LABEL} flex items-center gap-2`}><ShieldCheckIcon size={14} className="text-cyan-600" /> Reserve held</div>
                                <div className={`text-xl ${MONEY} text-gray-900 mt-2`}>{formatCurrency(summary?.held_reserves, displayCurrency)}</div>
                                <div className="text-[12px] font-semibold text-[#FF007F] mt-1">
                                    {releasingThisWeek > 0 ? `${formatCurrency(releasingThisWeek, displayCurrency)} frees this week →` : 'View release schedule →'}
                                </div>
                            </button>
                            <div className="p-5">
                                <div className={`${LABEL} flex items-center gap-2`}><HelpCircle size={14} className="text-yellow-600" /> Pending delivery</div>
                                <div className={`text-xl ${MONEY} text-gray-900 mt-2`}>{formatCurrency(summary?.pending_balance, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 font-medium mt-1">Yours once you fulfil the order</div>
                            </div>
                        </div>
                    </div>

                    {/* -----------------------------------------------------------
                        Tabs
                    ----------------------------------------------------------- */}
                    <div className="mt-8 sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                        <div className="flex items-center gap-1 overflow-x-auto">
                            {TABS.map((t) => (
                                <Link
                                    key={t.key}
                                    href={route('financial.dashboard', { tab: t.key })}
                                    className={`px-4 min-h-[48px] flex items-center font-semibold text-[14px] border-b-2 whitespace-nowrap transition-colors ${
                                        tab === t.key ? 'border-[#FF007F] text-[#FF007F]' : 'border-transparent text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {t.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ===========================================================
                        OVERVIEW
                    =========================================================== */}
                    {tab === 'overview' && (
                        <div className="pt-8">
                            <Section title="Where your money is" sub="Every pound you've earned, and which stage it's at right now.">
                                <div className={`${CARD} overflow-hidden`}>
                                    <div className="divide-y divide-gray-100">
                                        {moneyRows.map((row) => {
                                            const Cmp = row.onClick ? 'button' : 'div';
                                            return (
                                                <Cmp
                                                    key={row.key}
                                                    type={row.onClick ? 'button' : undefined}
                                                    onClick={row.onClick}
                                                    className={`w-full text-left flex items-center justify-between gap-4 px-5 py-4 min-h-[44px] ${
                                                        row.onClick ? 'hover:bg-gray-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF007F]/40' : ''
                                                    } ${row.muted ? 'bg-emerald-50/40' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${row.dot}`} />
                                                        <div className="min-w-0">
                                                            <div className="text-[15px] font-semibold text-gray-900 leading-tight">
                                                                {row.label}
                                                                {row.onClick ? <span className="text-[13px] text-[#FF007F] font-semibold ml-2">View →</span> : null}
                                                            </div>
                                                            <div className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">{row.hint}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-lg ${MONEY} whitespace-nowrap ${row.muted ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                        {formatCurrency(row.amount, displayCurrency)}
                                                    </div>
                                                </Cmp>
                                            );
                                        })}
                                    </div>
                                    <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 text-[13px] text-gray-600 font-medium flex items-center gap-2">
                                        <ShieldCheckIcon size={16} className="text-emerald-600 shrink-0" />
                                        Reserves are returned automatically 30 days after each sale.
                                    </div>
                                </div>

                                {upcomingTx.length > 0 && (
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowPayoutBreakdown((v) => !v)}
                                            aria-expanded={showPayoutBreakdown}
                                            className={`${CARD} w-full flex items-center justify-between gap-2 px-5 py-4 min-h-[44px] text-left hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40`}
                                        >
                                            <span className="text-[14px] font-semibold text-gray-800">
                                                {showPayoutBreakdown ? 'Hide' : 'Show'} the {upcomingTx.length} sale{plural(upcomingTx.length)} in this payout
                                            </span>
                                            <ChevronRightIcon size={18} className={`text-gray-400 transition-transform duration-200 ${showPayoutBreakdown ? 'rotate-90' : ''}`} />
                                        </button>
                                        {showPayoutBreakdown && (
                                            <div className={`${CARD} mt-3 overflow-hidden`}>
                                                <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                                                    {upcomingTx.map((t, idx) => {
                                                        const d = t.transaction_date ? new Date(t.transaction_date) : null;
                                                        return (
                                                            <div key={t.financial_transaction_id || idx} className="flex items-center justify-between gap-4 px-5 py-3.5">
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-gray-900 text-[14px] truncate">{t.description || 'Payment'}</div>
                                                                    <div className="text-[12px] text-gray-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                                        {t.label ? <span>{t.label}</span> : null}
                                                                        {t.supporter?.username ? <span>@{t.supporter.username}</span> : <span>Guest</span>}
                                                                        {d ? <span>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span> : null}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <div className={`${MONEY} text-emerald-600`}>{formatCurrency(t.payable_converted, displayCurrency)}</div>
                                                                    {Number(t.reserve_converted) > 0 ? (
                                                                        <div className="text-[12px] text-cyan-700 font-semibold mt-0.5 tabular-nums">{formatCurrency(t.reserve_converted, displayCurrency)} held</div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Section>

                            <Section title={`Earnings this tax year`} sub={`Totals for ${tax_year}. Full breakdown lives in the Tax tab.`}>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Stat
                                        label="Gross earnings"
                                        value={formatCurrency(summary.gross_income, displayCurrency)}
                                        sub="Total your supporters sent you."
                                        icon={<TrendingUpIcon size={14} className="text-emerald-600" />}
                                    />
                                    <Stat
                                        label="Net earnings"
                                        value={formatCurrency(summary.profit, displayCurrency)}
                                        tone="good"
                                        sub="What you keep after the expenses you logged."
                                        icon={<CircleCheckIcon size={14} className="text-emerald-600" />}
                                    />
                                    <Stat
                                        label="Estimated tax"
                                        value={formatCurrency(tax_estimate, displayCurrency)}
                                        tone="warn"
                                        sub={`Put aside about ${formatCurrency((tax_estimate || 0) / 12, displayCurrency)} a month.`}
                                        icon={<Calculator size={14} className="text-amber-600" />}
                                    />
                                </div>
                            </Section>

                            <Section title="Earnings trend" sub={`Month by month across ${tax_year}.`}>
                                <div className={`${CARD} p-5 md:p-6`}>
                                    <div className="h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#FF007F" stopOpacity={0.28} />
                                                        <stop offset="95%" stopColor="#FF007F" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px' }} itemStyle={{ color: '#111827' }} />
                                                <Area type="monotone" dataKey="total" stroke="#FF007F" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Section>

                            <Section title="What's earning" sub="Which products bring the money in, and who your best supporters are.">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className={`${CARD} p-5 md:p-6`}>
                                        <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <ChartPieIcon className="text-[#FF007F]" size={18} /> Income by type
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { key: 'Content Unlock', emoji: '🔓', color: '#FF007F' },
                                                { key: 'Piggy Pot', emoji: '🐷', color: '#ec4899' },
                                                { key: 'Wish Content', emoji: '🛒', color: '#05EFB8' },
                                                { key: 'Bill', emoji: '📄', color: '#3b82f6' },
                                                { key: 'Membership', emoji: '⭐', color: '#8b5cf6' },
                                                { key: 'Task', emoji: '✅', color: '#f59e0b' },
                                                { key: 'Shop Purchase', emoji: '🛍️', color: '#f97316' },
                                            ].map(({ key, emoji, color }) => {
                                                const t = analytics?.tribute_types?.find((tt) => tt.label === key);
                                                const percentage = summary.gross_income > 0 ? ((t?.total ?? 0) / summary.gross_income) * 100 : 0;
                                                return (
                                                    <div key={key}>
                                                        <div className="flex items-center justify-between gap-3 mb-1.5">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-base">{emoji}</span>
                                                                <span className="text-[14px] font-semibold text-gray-900 truncate">{key}</span>
                                                            </div>
                                                            <span className={`text-[14px] ${MONEY} text-gray-900`}>{formatCurrency(t?.total ?? 0, displayCurrency)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} />
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-[12px] text-gray-500 font-medium">{t?.count ?? 0} payment{(t?.count ?? 0) === 1 ? '' : 's'}</span>
                                                            <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>{percentage.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className={`${CARD} overflow-hidden flex flex-col`}>
                                        <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2 p-5 md:p-6 pb-4">
                                            <UsersIcon className="text-emerald-600" size={18} /> Top supporters
                                        </h3>
                                        {(top_supporters || []).length === 0 ? (
                                            <div className="px-5 pb-6 text-[14px] text-gray-500 font-medium">No supporters yet this tax year.</div>
                                        ) : (
                                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                                {top_supporters.map((s) => (
                                                    <div key={s.supporter_id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                                {s.supporter?.avatar_url
                                                                    ? <img src={s.supporter.avatar_url} alt={s.supporter?.name || ''} className="w-full h-full object-cover" />
                                                                    : <span className="text-[13px] font-semibold text-gray-400">{s.supporter?.name?.[0] ?? '?'}</span>}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-[14px] font-semibold text-gray-900 truncate">{s.supporter?.name ?? 'Guest'}</div>
                                                                <div className="text-[12px] text-gray-500 font-medium truncate">@{s.supporter?.username ?? 'guest'}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`text-[15px] ${MONEY} text-gray-900 shrink-0`}>{formatCurrency(s.total_spent, displayCurrency)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <Link
                                            href={route('financial.opportunities')}
                                            className="mt-auto flex items-center gap-3 px-5 py-4 border-t border-gray-100 hover:bg-[#FF007F]/[0.04] transition-colors min-h-[44px]"
                                        >
                                            <span className="w-9 h-9 rounded-full bg-[#FF007F]/10 flex items-center justify-center shrink-0">
                                                <TrendingUpIcon size={17} className="text-[#FF007F]" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[14px] font-semibold text-gray-900">Grow your income</div>
                                                <div className="text-[12px] text-gray-500 font-medium">Who's gone quiet, and what to do next.</div>
                                            </div>
                                            <ChevronRightIcon size={18} className="text-[#FF007F] shrink-0" />
                                        </Link>
                                    </div>
                                </div>
                            </Section>

                            <Section title="Recent activity" sub={`Every payment recorded in ${tax_year}.`}>
                                <LedgerHistoryTable transactions={recent_transactions} tax_year={tax_year} active_tab="overview" displayCurrency={displayCurrency} />
                            </Section>
                        </div>
                    )}

                    {/* ===========================================================
                        PAYOUTS
                    =========================================================== */}
                    {tab === 'payouts' && (
                        <div className="pt-8">
                            <Section title="How this payout is worked out" sub="From what you earned, to what lands in your bank.">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className={`${CARD} p-5 md:p-6`}>
                                        <div className={LABEL}>Payable this Friday</div>
                                        <div className={`text-3xl ${MONEY} text-emerald-600 mt-2`}>{formatCurrency(summary.payoutable_balance, displayCurrency)}</div>
                                        {payableLines.length > 0 ? (
                                            <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                                                {payableLines.map((line, idx) => (
                                                    <div key={idx} className="flex justify-between items-center gap-3 text-[13px] font-medium">
                                                        <span className="text-gray-500">{line.label}</span>
                                                        <span className={`tabular-nums font-semibold whitespace-nowrap ${line.amount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                                            {line.amount >= 0 ? '+' : ''}{formatCurrency(line.amount, displayCurrency)}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center gap-3 text-[14px] font-bold border-t border-gray-100 pt-2.5">
                                                    <span className="text-gray-800">Payable now</span>
                                                    <span className="tabular-nums text-emerald-600 whitespace-nowrap">{formatCurrency(summary.payoutable_balance, displayCurrency)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[13px] text-gray-500 font-medium mt-3 leading-snug">
                                                Excludes reserves, orders awaiting delivery, disputes and refunds.
                                            </div>
                                        )}
                                        {summary.carry_over_amount > 0 ? (
                                            <div className="text-[13px] text-gray-500 font-medium mt-3">Includes {formatCurrency(summary.carry_over_amount, displayCurrency)} carried over from the previous tax year.</div>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className={`${CARD} p-5 md:p-6`}>
                                            <div className={`${LABEL} flex items-center gap-2`}><Landmark size={14} className="text-[#FF007F]" /> Payout schedule</div>
                                            <div className="text-[16px] font-semibold text-gray-900 mt-2">{nextPayoutLabel || 'Every Friday'}</div>
                                            <div className="text-[13px] text-gray-500 font-medium mt-1.5">
                                                Earning window: {cycleWindowLabel || 'the last 7 days'}
                                                {payout_cycle?.timezone ? ` · ${payout_cycle.timezone}` : ''}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openReserveDetails}
                                            className={`${CARD} p-5 md:p-6 text-left hover:bg-gray-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50`}
                                        >
                                            <div className={`${LABEL} flex items-center gap-2`}><ShieldCheckIcon size={14} className="text-cyan-600" /> Reserve</div>
                                            <div className={`text-[22px] ${MONEY} text-gray-900 mt-2`}>{formatCurrency(summary?.held_reserves ?? 0, displayCurrency)}</div>
                                            <div className="text-[13px] text-gray-500 font-medium mt-1.5 leading-snug">
                                                {(reserve_policy?.effective_percent ?? 0) > 0
                                                    ? `${reserve_policy.effective_percent}% is held on new sales and returned 30 days later.`
                                                    : 'No reserve is being held on your new sales.'}
                                            </div>
                                            {reserve_reason ? <div className="text-[13px] text-gray-500 font-medium mt-1">{reserve_reason}</div> : null}
                                            {reserve_policy?.onboarding_percent > 0 && reserve_policy?.onboarding_ends_at ? (
                                                <div className="text-[13px] text-gray-500 font-medium mt-1">New-creator hold ends {reserve_policy.onboarding_ends_at}.</div>
                                            ) : null}
                                            <div className="text-[13px] font-semibold text-[#FF007F] mt-2">See every held reserve →</div>
                                        </button>
                                    </div>
                                </div>
                            </Section>

                            <Section title="Every pound, by status" sub="Nothing is lost — each bucket says exactly why it isn't payable yet.">
                                <div className={`${CARD} overflow-hidden divide-y divide-gray-100`}>
                                    {statusBuckets.map(({ key, label, dot, note }) => {
                                        const s = status_breakdown.find((sb) => sb.status === key);
                                        const total =
                                            key === 'queued' ? summary?.payoutable_balance ?? 0 :
                                            key === 'clearing' ? summary?.clearing_balance ?? 0 :
                                            s?.total ?? 0;
                                        const count =
                                            key === 'queued' ? summary?.payout_preview?.payment_count ?? 0 :
                                            key === 'clearing' ? null :
                                            s?.count ?? 0;
                                        return (
                                            <div key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
                                                    <div className="min-w-0">
                                                        <div className="text-[15px] font-semibold text-gray-900 leading-tight">{label}</div>
                                                        <div className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">
                                                            {note}{count === null ? '' : ` · ${count} payment${count === 1 ? '' : 's'}`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`text-lg ${MONEY} text-gray-900 whitespace-nowrap`}>{formatCurrency(total, displayCurrency)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Section>

                            {(fast_start_bonus || founder_bonus) && (
                                <Section title="Your bonuses" sub="Platform rewards paid on top of your earnings.">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {fast_start_bonus ? (() => {
                                            const start = fast_start_bonus.window_start ? new Date(fast_start_bonus.window_start) : null;
                                            const end = fast_start_bonus.window_end ? new Date(fast_start_bonus.window_end) : null;
                                            const totalMs = start && end ? Math.max(1, end.getTime() - start.getTime()) : 1;
                                            const progress = start && end ? Math.min(100, Math.max(0, ((Date.now() - start.getTime()) / totalMs) * 100)) : 0;
                                            const isActive = fast_start_bonus.status === 'active';
                                            return (
                                                <div className={`${CARD} p-5 md:p-6`}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className={LABEL}>Fast Start bonus</div>
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                            {String(fast_start_bonus.status || '').replaceAll('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className={`text-3xl ${MONEY} text-gray-900 mt-3`}>{formatCurrency(fast_start_bonus.bonus_so_far || 0, fast_start_bonus.currency)}</div>
                                                    <div className="text-[14px] text-gray-600 font-medium mt-1.5">
                                                        On {formatCurrency(fast_start_bonus.earnings_so_far || 0, fast_start_bonus.currency)} of tracked earnings
                                                    </div>
                                                    {isActive ? (
                                                        <div className="mt-4">
                                                            <div className="flex justify-between text-[13px] text-gray-500 font-medium mb-1.5">
                                                                <span>{fast_start_bonus.days_remaining ?? '-'} day{plural(fast_start_bonus.days_remaining)} left</span>
                                                                <span>Ends {end ? end.toLocaleDateString('en-GB') : '-'}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                                <div className="bg-[#FF007F] h-full rounded-full" style={{ width: `${progress}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    <div className="text-[13px] text-gray-500 font-medium mt-3 leading-snug">Paid as a one-off payout after your 30-day window ends.</div>
                                                    <Link href={route('financial.fast-start-bonus')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF007F] hover:underline mt-3 min-h-[44px]">
                                                        Full details <ChevronRightIcon size={15} />
                                                    </Link>
                                                </div>
                                            );
                                        })() : null}

                                        {founder_bonus ? (() => {
                                            const start = founder_bonus.month_start ? new Date(founder_bonus.month_start) : null;
                                            const end = founder_bonus.month_end ? new Date(founder_bonus.month_end) : null;
                                            const totalMs = start && end ? Math.max(1, end.getTime() - start.getTime()) : 1;
                                            const progress = start && end ? Math.min(100, Math.max(0, ((Date.now() - start.getTime()) / totalMs) * 100)) : 0;
                                            const qualification = founder_bonus.qualification_payout || null;
                                            const lastMonth = founder_bonus.last_month || null;
                                            const isActive = founder_bonus.status === 'active';
                                            return (
                                                <div className={`${CARD} p-5 md:p-6`}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className={LABEL}>Founder bonus</div>
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                                            isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : founder_bonus.status === 'payout_paused' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}>
                                                            {String(founder_bonus.status || '').replaceAll('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className={`text-3xl ${MONEY} text-gray-900 mt-3`}>{formatCurrency(founder_bonus.bonus_so_far || 0, founder_bonus.currency)}</div>
                                                    <div className="text-[14px] text-gray-600 font-medium mt-1.5">
                                                        On {formatCurrency(founder_bonus.earnings_so_far || 0, founder_bonus.currency)} earned this month
                                                    </div>
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-[13px] text-gray-500 font-medium mb-1.5">
                                                            <span>Month ends {end ? end.toLocaleDateString('en-GB') : '-'}</span>
                                                            <span>{founder_bonus.months_left === null || founder_bonus.months_left === undefined ? '-' : `${founder_bonus.months_left} month${plural(founder_bonus.months_left)} left`}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${progress}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="text-[13px] text-gray-500 font-medium mt-3 leading-snug">
                                                        {Math.round((founder_bonus.bonus_percentage || 0) * 100)}% bonus · min {formatCurrency(founder_bonus.min_monthly_earnings || 0, founder_bonus.currency)} · cap {formatCurrency(founder_bonus.max_bonus_per_month || 0, founder_bonus.currency)}
                                                    </div>

                                                    {qualification ? (
                                                        <div className="mt-4 rounded-box-sm bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="text-[13px] font-semibold text-gray-900">Qualification payout</div>
                                                                <div className="text-[12px] text-gray-500 font-medium mt-0.5">
                                                                    {String(qualification.status || '').replaceAll('_', ' ')}
                                                                    {qualification.estimated_payout_date ? ` · due ${new Date(qualification.estimated_payout_date).toLocaleDateString('en-GB')}` : ''}
                                                                </div>
                                                            </div>
                                                            <div className={`${MONEY} text-gray-900 shrink-0`}>{formatCurrency(qualification.bonus_amount || 0, founder_bonus.currency)}</div>
                                                        </div>
                                                    ) : null}

                                                    {lastMonth ? (
                                                        <div className="mt-3 rounded-box-sm bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="text-[13px] font-semibold text-gray-900">Last month ({lastMonth.month})</div>
                                                                <div className="text-[12px] text-gray-500 font-medium mt-0.5">
                                                                    {String(lastMonth.payout_status || '').replaceAll('_', ' ')}
                                                                    {lastMonth.payout_date ? ` · ${new Date(lastMonth.payout_date).toLocaleDateString('en-GB')}` : ''}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className={`${MONEY} text-gray-900`}>{formatCurrency(lastMonth.bonus_amount || 0, founder_bonus.currency)}</div>
                                                                <div className="text-[12px] text-gray-500 font-medium">on {formatCurrency(lastMonth.monthly_earnings || 0, founder_bonus.currency)}</div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })() : null}
                                    </div>
                                </Section>
                            )}

                            <Section
                                title="Payout history"
                                sub="Every payout sent to your bank."
                                action={<span className="text-[13px] text-gray-500 font-medium tabular-nums">{payout_history.length} payout{plural(payout_history.length)}</span>}
                            >
                                <div className={`${CARD} overflow-hidden`}>
                                    {payout_history.length === 0 ? (
                                        <div className="px-6 py-14 text-center flex flex-col items-center gap-2">
                                            <WalletIcon className="text-gray-300" size={30} />
                                            <span className="text-gray-600 text-[14px] font-semibold">No payouts yet</span>
                                            <span className="text-gray-400 text-[13px] font-medium">Your first payout goes out the Friday after your first sale clears.</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile: stacked cards. */}
                                            <div className="md:hidden divide-y divide-gray-100">
                                                {payout_history.map((p) => {
                                                    const hasBonus = p.fast_start_bonus > 0 || p.founder_bonus > 0;
                                                    const bonusAmt = p.type_key === 'fast_start' ? p.fast_start_bonus : p.founder_bonus;
                                                    const isOpen = expandedPayout === p.uuid;
                                                    const isFail = p.status === 'failed' || p.status === 'skipped';
                                                    return (
                                                        <div key={p.uuid} className="p-5">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className={`text-xl ${MONEY} text-gray-900`}>{formatCurrency(p.amount, p.currency)}</div>
                                                                    <div className="text-[13px] text-gray-500 font-medium mt-0.5">{p.date}{p.time ? ` · ${p.time}` : ''}</div>
                                                                </div>
                                                                <span className={`whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${payoutStatusBadgeCls(p.status)}`}>
                                                                    {p.status === 'in_transit' ? 'On its way' : p.status?.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${PAYOUT_TYPE_STYLES[p.type_key] || PAYOUT_TYPE_STYLES.weekly}`}>
                                                                    {p.type_label}
                                                                </span>
                                                                {hasBonus ? (
                                                                    <span className="text-[12px] font-semibold text-[#FF007F] tabular-nums">Bonus {formatCurrency(bonusAmt, p.currency)}</span>
                                                                ) : null}
                                                            </div>
                                                            <div className="mt-2 text-[13px] font-medium">
                                                                {isFail ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedPayout(isOpen ? null : p.uuid)}
                                                                        className="text-left text-red-600 font-semibold min-h-[44px]"
                                                                    >
                                                                        {p.failure_reason || 'Payout failed'}
                                                                        <span className="block text-[12px] text-gray-400 font-medium mt-0.5">{isOpen ? 'Hide details' : 'Show details'}</span>
                                                                    </button>
                                                                ) : p.status === 'paid' ? (
                                                                    <span className="text-emerald-700 font-semibold">Arrived {p.arrival_date || ''}</span>
                                                                ) : (
                                                                    <span className="text-gray-600">{p.arrival_date ? `Expected ${p.arrival_date}` : 'Processing…'}</span>
                                                                )}
                                                            </div>
                                                            {isFail && isOpen && (
                                                                <div className="mt-3 rounded-box-sm border border-red-200 bg-red-50 p-4">
                                                                    <p className="text-[13px] text-gray-700 break-words">{p.failure_detail || 'No additional detail provided by Stripe.'}</p>
                                                                    {p.failure_code ? <div className="text-[12px] text-gray-400 font-mono mt-2">Code: {p.failure_code}</div> : null}
                                                                    <p className="text-[13px] text-gray-600 mt-3">
                                                                        The money stays in your balance and retries next Friday. Need help? <a href="mailto:support@spennypiggy.co" className="text-[#FF007F] font-semibold underline">support@spennypiggy.co</a>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Desktop: table. */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr className="text-gray-500 text-[11px] uppercase font-semibold tracking-wide">
                                                            <th className="px-6 py-3.5">Sent on</th>
                                                            <th className="px-6 py-3.5">Type</th>
                                                            <th className="px-6 py-3.5 text-right">Amount</th>
                                                            <th className="px-6 py-3.5">Arrival</th>
                                                            <th className="px-6 py-3.5 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {payout_history.map((p) => {
                                                            const hasBonus = p.fast_start_bonus > 0 || p.founder_bonus > 0;
                                                            const bonusAmt = p.type_key === 'fast_start' ? p.fast_start_bonus : p.founder_bonus;
                                                            const isOpen = expandedPayout === p.uuid;
                                                            const isFail = p.status === 'failed' || p.status === 'skipped';
                                                            return (
                                                                <Fragment key={p.uuid}>
                                                                    <tr className="hover:bg-gray-50 transition-colors align-top">
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-[14px] text-gray-900 font-semibold leading-tight">{p.date}</div>
                                                                            {p.time ? <div className="text-[12px] text-gray-400 font-medium mt-0.5">{p.time}</div> : null}
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <span className={`whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${PAYOUT_TYPE_STYLES[p.type_key] || PAYOUT_TYPE_STYLES.weekly}`}>
                                                                                {p.type_label}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className={`text-[15px] ${MONEY} text-gray-900`}>{formatCurrency(p.amount, p.currency)}</div>
                                                                            {hasBonus ? (
                                                                                <div className="text-[12px] font-semibold tabular-nums text-[#FF007F] mt-0.5">Bonus {formatCurrency(bonusAmt, p.currency)}</div>
                                                                            ) : null}
                                                                            {p.reference ? (
                                                                                <div className="text-[11px] text-gray-400 font-mono mt-1 truncate max-w-[140px] ml-auto" title={p.reference}>{p.reference}</div>
                                                                            ) : null}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-[14px] text-gray-600 font-medium">
                                                                            {isFail ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setExpandedPayout(isOpen ? null : p.uuid)}
                                                                                    className="text-left text-red-600 font-semibold"
                                                                                >
                                                                                    {p.failure_reason || 'Payout failed'}
                                                                                    <span className="block text-[12px] text-gray-400 font-medium mt-0.5">{isOpen ? 'Hide details' : 'Show details'}</span>
                                                                                </button>
                                                                            ) : p.status === 'paid' ? (
                                                                                <span className="text-emerald-700 font-semibold">{p.arrival_date || 'Delivered'}</span>
                                                                            ) : p.status === 'scheduled' ? (
                                                                                <span>{p.arrival_date ? `Est. ${p.arrival_date}` : 'To be scheduled'}</span>
                                                                            ) : (
                                                                                <span>{p.arrival_date || 'Processing…'}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <span className={`whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${payoutStatusBadgeCls(p.status)}`}>
                                                                                {p.status === 'in_transit' ? 'On its way' : p.status?.replace('_', ' ')}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    {isFail && isOpen && (
                                                                        <tr className="bg-red-50/60">
                                                                            <td colSpan="5" className="px-6 py-4">
                                                                                <div className="rounded-box-sm border border-red-200 bg-white p-4">
                                                                                    <p className="text-[13px] text-gray-700 break-words">{p.failure_detail || 'No additional detail provided by Stripe.'}</p>
                                                                                    {p.failure_code ? <div className="text-[12px] text-gray-400 font-mono mt-2">Code: {p.failure_code}</div> : null}
                                                                                    <p className="text-[13px] text-gray-600 mt-3">
                                                                                        The money stays in your balance and retries in the next run. Need help? <a href="mailto:support@spennypiggy.co" className="text-[#FF007F] font-semibold underline">support@spennypiggy.co</a>
                                                                                    </p>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Section>

                            <Section title="Full ledger" sub="Every transaction, all time.">
                                <LedgerHistoryTable transactions={recent_transactions} tax_year={tax_year} active_tab="payouts" displayCurrency={displayCurrency} />
                            </Section>
                        </div>
                    )}

                    {/* ===========================================================
                        TAX
                    =========================================================== */}
                    {tab === 'tax' && (
                        <div className="pt-8">
                            <Section title={`Tax year ${tax_year}`} sub={`${date_range?.start} to ${date_range?.end}${tax_band_label ? ` · ${tax_band_label} bands` : ''}. Estimates only — not tax advice.`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Stat
                                        label="Gross earnings"
                                        value={formatCurrency(summary.gross_income, displayCurrency)}
                                        sub="Everything supporters paid you."
                                        icon={<TrendingUpIcon size={14} className="text-emerald-600" />}
                                    />
                                    <Stat
                                        label="Expenses logged"
                                        value={formatCurrency(summary.expenses, displayCurrency)}
                                        tone="bad"
                                        sub="Costs you've recorded against this year."
                                        icon={<TrendingDownIcon size={14} className="text-red-500" />}
                                    />
                                    <Stat
                                        label="Net earnings"
                                        value={formatCurrency(summary.profit, displayCurrency)}
                                        tone="good"
                                        sub="Gross minus expenses. This is what tax is estimated on."
                                        icon={<CircleCheckIcon size={14} className="text-emerald-600" />}
                                    />
                                    <Stat
                                        label="Estimated tax"
                                        value={formatCurrency(tax_estimate, displayCurrency)}
                                        tone="warn"
                                        sub={`Around ${formatCurrency((tax_estimate || 0) / 12, displayCurrency)} a month set aside.`}
                                        icon={<Calculator size={14} className="text-amber-600" />}
                                    />
                                </div>

                                <div className={`${CARD} mt-4 p-5 md:p-6`}>
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className={LABEL}>Tax year progress</div>
                                            <div className="text-[15px] font-semibold text-gray-900 mt-1.5">{Math.round(taxYearProgress)}% through {tax_year}</div>
                                        </div>
                                        <div className="text-[13px] text-gray-500 font-medium">6 April → 5 April</div>
                                    </div>
                                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-[#FF007F] h-full rounded-full" style={{ width: `${taxYearProgress}%` }} />
                                    </div>
                                    <div className="mt-3 text-[13px] text-gray-600 font-medium leading-snug">
                                        {(summary?.expenses ?? 0) > (summary?.gross_income ?? 0) * 0.3
                                            ? 'Your expenses are high relative to your earnings — worth reviewing what you have logged.'
                                            : 'Your margins look healthy. Keep logging expenses so your tax estimate stays accurate.'}
                                    </div>
                                </div>
                            </Section>

                            <Section title="Statements & records" sub="Everything you or your accountant might need to download.">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <StatementDownloadCard taxYear={tax_year_number} />
                                        </div>
                                        {records.map((item, idx) => (
                                            <Link
                                                key={idx}
                                                href={item.href}
                                                className={`${CARD} p-5 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-start gap-3 min-h-[44px]`}
                                            >
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">{item.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[15px] font-semibold text-gray-900">{item.label}</div>
                                                    <div className="text-[13px] text-gray-500 font-medium mt-0.5 leading-snug">{item.sub}</div>
                                                </div>
                                                <ChevronRightIcon size={18} className="text-gray-400 shrink-0 mt-1" />
                                            </Link>
                                        ))}
                                    </div>

                                    <div className={`${CARD} p-5 md:p-6 h-fit`}>
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                                                <Building2 className="text-gray-500" size={18} /> Business details
                                            </h3>
                                            {!isEditingProfile && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingProfile(true)}
                                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-box-sm hover:bg-gray-100"
                                                    aria-label="Edit business details"
                                                >
                                                    <Pencil size={17} />
                                                </button>
                                            )}
                                        </div>
                                        {isEditingProfile ? (
                                            <form onSubmit={submitProfile} className="space-y-3">
                                                <label className="block">
                                                    <span className="text-[13px] font-semibold text-gray-700">Business or trading name</span>
                                                    <input
                                                        type="text"
                                                        value={data.business_name}
                                                        onChange={(e) => setData('business_name', e.target.value)}
                                                        className="mt-1.5 w-full bg-white border-gray-200 rounded-box-sm text-gray-900 text-[14px] p-3 min-h-[44px] focus:border-[#FF007F] focus:ring-[#FF007F]"
                                                        placeholder={auth.user.name}
                                                    />
                                                </label>
                                                <div className="flex gap-2 justify-end pt-1">
                                                    <button type="button" onClick={() => setIsEditingProfile(false)} className={`${BTN} text-gray-600 hover:bg-gray-100`}>Cancel</button>
                                                    <button type="submit" disabled={processing} className={`${BTN} bg-[#FF007F] hover:bg-[#d8006c] disabled:opacity-60 text-white`}>
                                                        {processing ? 'Saving…' : 'Save'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <div className={LABEL}>Name on statements</div>
                                                    <div className="text-[15px] font-semibold text-gray-900 mt-1">{profile?.business_name || auth.user.name}</div>
                                                </div>
                                                {profile?.vat_registered ? (
                                                    <div>
                                                        <div className={LABEL}>VAT registered</div>
                                                        <div className="text-[15px] font-semibold text-gray-900 mt-1">{profile?.vat_registration_number || 'Yes'}</div>
                                                    </div>
                                                ) : null}
                                                <div>
                                                    <div className={LABEL}>Tax set-aside rate</div>
                                                    <div className="text-[15px] font-semibold text-gray-900 mt-1 tabular-nums">{profile?.tax_percentage ?? 20}%</div>
                                                </div>
                                                <Link href={route('financial.statement')} className={`${BTN} w-full bg-gray-900 hover:bg-black text-white`}>
                                                    Download tax statement
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Section>

                            <Section title="Transactions this tax year" sub={`Everything counted towards your ${tax_year} figures.`}>
                                <LedgerHistoryTable transactions={recent_transactions} tax_year={tax_year} active_tab="overview" displayCurrency={displayCurrency} />
                            </Section>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
