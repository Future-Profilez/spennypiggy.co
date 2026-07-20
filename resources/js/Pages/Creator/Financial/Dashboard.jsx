import { useState, useRef, Fragment } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import LedgerHistoryTable from '@/Components/Financial/LedgerHistoryTable';
import StatementDownloadCard from './StatementDownloadCard';
import { WalletIcon,TrendingUpIcon,TrendingDownIcon,DownloadIcon,PlusIcon,TriangleAlertIcon,CircleCheckIcon,ChartBarIcon,UsersIcon,ChevronRightIcon,ChartPieIcon,ShieldCheckIcon, } from "@animateicons/react/lucide";
import { Calculator,FileText,Building2,ScrollText,HelpCircle,Pencil,RefreshCw,ScrollText as ScrollTextIcon,Calculator as CalculatorIcon,FileText as FileTextIcon } from "lucide-react";
import { XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area } from 'recharts';

// Group heading - chunks a long page into scannable sections.
function GroupHeader({ title, sub, divider = true }) {
    return (
        <div className={divider ? 'pt-6 mt-2 border-t border-gray-100' : ''}>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
            {sub ? <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">{sub}</p> : null}
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

    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
        }).format(Number(amount || 0));
    };

    // Shared display tokens - one currency + label system across the whole page.
    const MONEY = 'tabular-nums tracking-tight font-bold';        // every currency figure
    const MONEY_POS = 'text-emerald-600';                         // money to the creator (light surfaces)
    const EYEBROW = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500'; // every card label

    const chartData = analytics?.monthly?.map(item => ({
        name: new Date(item.month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
        total: parseFloat(item.total)
    })) || [];

    const reserves = reserveDetails?.breakdown || [];
    const reserveTotal = Number(reserveDetails?.total_held ?? summary?.held_reserves ?? 0);
    // Settled history - reserves already released back to the creator. Falls back to the
    // Inertia props until the live modal fetch resolves.
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
        const start = new Date(payout_cycle.window_start);
        const end = new Date(payout_cycle.window_end);
        const fmt = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
        return `${fmt(start)} to ${fmt(end)}`;
    })();

    const nextPayoutLabel = (() => {
        if (!payout_cycle?.next_payout_at) return null;
        const d = new Date(payout_cycle.next_payout_at);
        return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    })();

    // Days until the next Friday payout (0 = today).
    const daysToPayout = (() => {
        if (!payout_cycle?.next_payout_at) return null;
        const ms = new Date(payout_cycle.next_payout_at).getTime() - Date.now();
        return Math.max(0, Math.ceil(ms / 86400000));
    })();

    // Soonest reserve to be released (per-transaction 30-day rolling window). Emphasis = countdown.
    const nextReserveRelease = (() => {
        const list = Array.isArray(reserve_breakdown) ? reserve_breakdown : [];
        const held = list.filter(r => (r?.reserve_status ?? 'held') !== 'released' && Number(r?.amount ?? 0) > 0);
        if (!held.length) return null;
        return held.reduce((best, r) => {
            const days = Math.max(0, Number(r?.days_remaining ?? 9999));
            return (best === null || days < best.days) ? { days, date: r?.release_date ?? null } : best;
        }, null);
    })();

    const plural = (n) => (Number(n) === 1 ? '' : 's');

    // This Friday's payout. The HEADLINE money figures come from the authoritative payout engine
    // (summary.payout_preview = calculatePayouts, already in display currency) so they match the
    // "Available for Friday payout" row exactly. upcoming_payout is used ONLY for the per-transaction
    // breakdown list (it's a lighter FT scan and can include items the engine later deducts).
    const upcomingTx = Array.isArray(upcoming_payout?.transactions) ? upcoming_payout.transactions : [];
    const upcomingPayable = Number(summary?.payout_preview?.net_payout ?? summary?.payoutable_balance ?? 0);
    const upcomingReserveHeld = Number(summary?.payout_preview?.reserve_held ?? upcoming_payout?.total_reserve ?? 0);
    const upcomingCount = Number(summary?.payout_preview?.payment_count ?? upcomingTx.length);

    // Reserve due to settle back within the days-to-Friday horizon (per-transaction 30-day window).
    const releasingThisWeek = (() => {
        const list = Array.isArray(reserve_breakdown) ? reserve_breakdown : [];
        const horizon = daysToPayout ?? 7;
        return list
            .filter(r => (r?.reserve_status ?? 'held') !== 'released' && Number(r?.days_remaining ?? 9999) <= horizon)
            .reduce((sum, r) => sum + Number(r?.amount_converted ?? (Number(r?.amount ?? 0) / 100)), 0);
    })();

    // Single source of truth for the creator's money lifecycle, in flow order.
    const moneyRows = (() => {
        const rows = [
            {
                key: 'available',
                label: 'Available for Friday payout',
                amount: summary?.payoutable_balance,
                hint: daysToPayout === null
                    ? 'Sent automatically every Friday'
                    : daysToPayout === 0
                        ? 'Sending today'
                        : `Sends in ${daysToPayout} day${plural(daysToPayout)}${nextPayoutLabel ? ` · ${nextPayoutLabel}` : ''}`,
                dot: 'bg-green-500',
                primary: true,
            },
            {
                key: 'clearing',
                label: 'Clearing (7-day hold)',
                amount: summary?.clearing_balance,
                hint: 'Becomes available after the standard 7-day safety hold',
                dot: 'bg-blue-500',
            },
            {
                key: 'reserve',
                label: 'Reserve held',
                amount: summary?.held_reserves,
                hint: nextReserveRelease === null
                    ? 'Nothing held right now'
                    : nextReserveRelease.days === 0
                        ? 'Next reserve frees today'
                        : `Next frees in ${nextReserveRelease.days} day${plural(nextReserveRelease.days)}${nextReserveRelease.date ? ` · ${nextReserveRelease.date}` : ''}`,
                dot: 'bg-cyan-500',
                onClick: openReserveDetails,
            },
            {
                key: 'pending',
                label: 'Pending delivery',
                amount: summary?.pending_balance,
                hint: 'Releases into your balance once you fulfil the order or task',
                dot: 'bg-yellow-500',
            },
        ];
        const riskAmount = Number(summary?.review_holds || 0) + Number(summary?.disputes || 0);
        if (riskAmount > 0) {
            rows.push({
                key: 'risk',
                label: 'Under review / disputed',
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
                hint: 'Reserves already paid back to you. Lifetime total, not part of your current balance.',
                dot: 'bg-emerald-500',
                muted: true,
                onClick: openReserveDetails,
            });
        }
        return rows;
    })();

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Financial Dashboard" />

            

            <Modal show={showReserveDetails} onClose={() => setShowReserveDetails(false)} maxWidth="2xl">
                <div className="bg-white text-gray-900 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[15px] font-bold uppercase tracking-widest text-gray-500">Reserves</div>
                            <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mt-1">
                                <div>
                                    <div className="text-xl md:text-2xl font-bold tabular-nums tracking-tight text-gray-900">{formatCurrency(reserveTotal, displayCurrency)}</div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Still to be released</div>
                                </div>
                                <div>
                                    <div className="text-lg md:text-xl font-bold tabular-nums tracking-tight text-emerald-600">{formatCurrency(releasedTotal, displayCurrency)}</div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Released to date</div>
                                </div>
                            </div>
                            <div className="text-[12px] text-gray-400 font-bold mt-2">{reserve_reason || 'Reserves currently held on your earnings.'}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowReserveDetails(false)}
                            className="px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] text-sm font-bold"
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
                        {reserveLoading ? (
                            <div className="text-gray-500 text-sm font-bold">Loading reserves…</div>
                        ) : reserveLoadError ? (
                            <div className="text-red-600 text-sm font-bold">{reserveLoadError}</div>
                        ) : (reserves || []).length === 0 ? (
                            <div className="text-gray-500 text-sm font-bold">No held reserves right now.</div>
                        ) : (
                            <div className="overflow-x-auto rounded-[30px]  border border-gray-200 bg-gray-50">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white border-b border-gray-200">
                                        <tr className="text-gray-500 text-[12px] uppercase font-bold tracking-widest">
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Supporter</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Releases</th>
                                            <th className="px-4 py-3 text-right">Reserved</th>
                                            <th className="px-4 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {(reserves || []).map((r, idx) => {
                                            const txDate = r.transaction_date ? new Date(r.transaction_date) : null;
                                            const dateLabel = txDate ? txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : (r.run_date && r.run_date !== 'Pending' ? new Date(r.run_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-');
                                            const timeLabel = txDate ? txDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                                            const statusKey = (r.status || '').toString();
                                            const statusMeta = (() => {
                                                const map = {
                                                    completed: { label: 'COMPLETED', cls: 'bg-green-500/10 text-green-600 border border-green-500/20' },
                                                    review_hold: { label: 'REVIEW HOLD', cls: 'bg-purple-500/10 text-purple-600 border border-purple-500/20' },
                                                    disputed: { label: 'DISPUTED', cls: 'bg-orange-500/10 text-orange-600 border border-orange-500/20' },
                                                    refunded: { label: 'REFUNDED', cls: 'bg-red-500/10 text-red-600 border border-red-500/20' },
                                                    pending: { label: 'PENDING', cls: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' },
                                                };
                                                return map[statusKey] || (statusKey ? { label: statusKey.replaceAll('_', ' ').toUpperCase(), cls: 'bg-gray-100 text-gray-600 border border-gray-200' } : null);
                                            })();
                                            const isReleased = (r.reserve_status === 'released');
                                            const relDays = r.days_remaining === null || r.days_remaining === undefined ? null : Math.max(0, Number(r.days_remaining));
                                            return (
                                                <tr key={`${r.financial_transaction_id || r.payout_run_id || idx}-${idx}`} className="hover:bg-gray-100 transition-colors">
                                                    <td className="px-4 py-3 text-[14px] text-gray-600 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900">{dateLabel}</span>
                                                            {timeLabel ? (
                                                                <span className="text-[11px] text-gray-500 font-medium">{timeLabel}</span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                        {r.supporter ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-900 font-medium capitalize">{r.supporter.name}</span>
                                                                <span className="text-[13px] !text-gray-800">@{r.supporter.username}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-[14px] capitalize">{r.source_type === 'transaction' ? 'Guest / System' : 'Guest / System'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm min-w-[260px]">
                                                        <div className="font-medium text-gray-900 line-clamp-2">{r.source_name || 'Reserve'}</div>
                                                        <div className="text-[12px] text-gray-500 font-bold mt-1 uppercase">
                                                            {r.label || (r.source_type === 'payout_run' ? 'Payout Run' : '')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {isReleased ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-bold text-green-600">Released</span>
                                                                {r.release_date ? <span className="text-[11px] text-gray-400 font-medium">{r.release_date}</span> : null}
                                                            </div>
                                                        ) : relDays !== null ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-bold text-cyan-600">{relDays === 0 ? 'Frees today' : `in ${relDays} day${relDays === 1 ? '' : 's'}`}</span>
                                                                {r.release_date ? <span className="text-[11px] text-gray-400 font-medium">{r.release_date}</span> : null}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[13px] text-gray-700 font-bold">{r.release_date || '-'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="text-gray-900 font-bold tabular-nums tracking-tight">{formatCurrency((Number(r.amount || 0) / 100), (r.currency || displayCurrency))}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        {statusMeta ? (
                                                            <div className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusMeta.cls}`}>
                                                                {statusMeta.label}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!reserveLoading && !reserveLoadError && (releasedReserves || []).length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-[13px] font-bold uppercase tracking-widest text-emerald-600">Released history</div>
                                    <div className="text-[12px] text-gray-500 font-bold">Reserves already paid back to you</div>
                                </div>
                                <div className="overflow-x-auto rounded-[30px] border border-gray-200 bg-gray-50">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-white border-b border-gray-200">
                                            <tr className="text-gray-500 text-[12px] uppercase font-bold tracking-widest">
                                                <th className="px-4 py-3">Released</th>
                                                <th className="px-4 py-3">Supporter</th>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                                <th className="px-4 py-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {(releasedReserves || []).map((r, idx) => {
                                                const relAt = r.released_at ? new Date(r.released_at) : null;
                                                const relLabel = relAt ? relAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                                                const verified = r.verified !== false;
                                                return (
                                                    <tr key={`rel-${r.financial_transaction_id || idx}-${idx}`} className="hover:bg-gray-100 transition-colors">
                                                        <td className="px-4 py-3 text-[14px] text-gray-900 font-medium whitespace-nowrap">{relLabel}</td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                            {r.supporter ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-900 font-medium capitalize">{r.supporter.name}</span>
                                                                    <span className="text-[13px] !text-gray-800">@{r.supporter.username}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500 italic text-[14px]">Guest / System</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm min-w-[240px]">
                                                            <div className="font-medium text-gray-900 line-clamp-2">{r.source_name || 'Reserve'}</div>
                                                            <div className="text-[12px] text-gray-500 font-bold mt-1 uppercase">{r.label || ''}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-900 font-bold tabular-nums tracking-tight">{formatCurrency((Number(r.amount || 0) / 100), (r.currency || displayCurrency))}</td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                                            {verified ? (
                                                                <div className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Paid to you</div>
                                                            ) : (
                                                                <div className="inline-flex flex-col items-end gap-0.5">
                                                                    <div className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">Settled (legacy)</div>
                                                                    <span className="text-[10px] text-gray-400 font-bold">paid with base earning</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <div className='bg-white py-4'>
                <div className='container mx-auto min-h-screen'>
                    <div className="py-8 px-4 sm:px-6 lg:px-8 ">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Financial Hub</h1>
                        <p className="text-normal md:text-lg text-gray-600 mt-1">Real-time tax tracking and business insights.</p>
                        <p className="text-normal text-green-600 mt-1 font-bold flex items-center gap-1"><ShieldCheckIcon size={19} /> Your earnings are protected.</p>
                        <div className="pt-6 flex flex-col gap-4">
                            <div className="flex flex-col lg:flex-row lg:justify-between items-start md:items-center gap-4">
                                <div className='w-full lg:w-[60%]'>
                                    <p className="text-normal text-gray-500 mb-2 font-bold">You keep 100% of what you earn. Supporters cover all fees. Payouts are sent every Friday.</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="bg-[#FF007F]/10 text-[#FF007F] text-[14px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-[#FF007F]/20">
                                            Tax Year {tax_year}
                                        </span>
                                        <span className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">
                                            {date_range?.start} to {date_range?.end}
                                        </span>
                                    </div>
                                </div>
                                <div className="md:flex w-full justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => refreshPost(route('financial.refresh'))}
                                        disabled={refreshProcessing}
                                        className="mb-3 w-full md:w-fit flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-900 px-4 py-2.5 rounded-[30px]  font-medium transition-all border border-gray-200 text-[14px]"
                                    >
                                        <RefreshCw size={18} className={refreshProcessing ? 'animate-spin' : ''} />
                                        <span>{refreshProcessing ? 'Refreshing…' : 'Refresh Records'}</span>
                                    </button>
                                    <Link 
                                        href={route('financial.expenses.index')} 
                                        onMouseEnter={() => logExpenseIconRef.current?.startAnimation?.()}
                                        onMouseLeave={() => logExpenseIconRef.current?.stopAnimation?.()}
                                        className="mb-3 flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FF007F] hover:bg-[#d83a7c] text-white px-4 py-2.5 rounded-[30px]  font-medium transition-all shadow-lg shadow-[4px_4px_0px_0px_#FF007F]ink-500/20 text-[14px]" >
                                        <PlusIcon ref={logExpenseIconRef} size={18} />
                                        <span>Log Expense</span>
                                    </Link>
                                    <a  href={route('financial.export.csv')} target="_blank" onMouseEnter={() => exportCsvIconRef.current?.startAnimation?.()} onMouseLeave={() => exportCsvIconRef.current?.stopAnimation?.()}
                                        className="mb-3 flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-[30px]  font-medium transition-all border border-gray-200 text-[14px]" >
                                        <DownloadIcon ref={exportCsvIconRef} size={18} />
                                        <span>Export CSV</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {auth?.user?.payout_paused_at ? (
                            <div className="mx-auto mt-6">
                                <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        
                                        <div className="flex-1">
                                            <div className="text-[20px] font-black uppercase tracking-widest text-red-700"><TriangleAlertIcon className='relative top-1' width={38} height={38} /> Payouts Paused</div>
                                            <div className="text-sm font-bold text-red-900 mt-1">
                                                Your payouts are currently on hold.
                                            </div>
                                            {auth?.user?.payout_pause_reason ? (
                                                <div className="text-normal font-bold text-red-800 mt-1">
                                                    Reason: {auth.user.payout_pause_reason}
                                                </div>
                                            ) : (
                                                <div className="text-normal font-bold text-red-800 mt-1">
                                                    Reason: Under review by SpennyPiggy support.
                                                </div>
                                            )}
                                            <div className="text-normal text-red-700 mt-1">
                                                Paused at: {new Date(auth.user.payout_paused_at).toLocaleString('en-GB')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* "Your money" band - payday hero first, then where the rest sits. */}
                        <section className="mt-10">
                            <div className="mb-4">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Your money</h2>
                                <p className="text-[13px] md:text-sm text-gray-500 font-medium mt-1.5 leading-snug">What lands this Friday, and where the rest is sitting.</p>
                            </div>

                            {/* PAYDAY HERO - light, grouped: figure + reserve split + breakdown in one card. */}
                            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-50/70 via-white to-white border border-emerald-100 p-6 md:p-8 shadow-sm">
                                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                                    <div className="min-w-0">
                                        <div className={`${EYEBROW} flex items-center gap-2`}>
                                            <WalletIcon size={15} className="text-[#FF007F]" /> Next payout
                                            {nextPayoutLabel ? <span className="text-gray-300">·</span> : null}
                                            {nextPayoutLabel ? <span className="text-gray-500 normal-case tracking-normal font-medium">{nextPayoutLabel}</span> : null}
                                        </div>
                                        <div className="mt-3 flex items-end gap-3 flex-wrap">
                                            <div className="text-[42px] md:text-4xl font-black tracking-tight tabular-nums text-emerald-600 leading-[0.92]">{formatCurrency(upcomingPayable, displayCurrency)}</div>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-[12px] font-semibold text-emerald-700 mb-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {daysToPayout === null ? 'Scheduled' : daysToPayout === 0 ? 'Sending today' : `In ${daysToPayout} day${plural(daysToPayout)}`}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 text-[13px] text-gray-500 font-medium leading-snug">
                                            {upcomingCount > 0
                                                ? <>{upcomingCount} sale{plural(upcomingCount)} clearing into this payout</>
                                                : 'Nothing eligible yet. Sales clear after a 7-day safety hold.'}
                                        </div>
                                    </div>
                                    <Link href={route('financial.dashboard', { tab: 'payouts' })} className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF007F] hover:underline">
                                        Payout history <ChevronRightIcon size={15} />
                                    </Link>
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={openReserveDetails}
                                        className="text-left rounded-[20px] bg-cyan-50/60 border border-cyan-100 px-4 py-3.5 transition-transform duration-150 ease-out active:scale-[0.99] hover:bg-cyan-50 hover:border-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                                <ShieldCheckIcon size={14} className="text-cyan-700" />
                                            </span>
                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 leading-tight">Held back this week</div>
                                        </div>
                                        <div className="text-xl font-bold text-gray-900 tabular-nums tracking-tight mt-2">{formatCurrency(upcomingReserveHeld, displayCurrency)}</div>
                                        <div className="text-[12px] text-gray-500 font-medium mt-1">Returned 30 days after each sale</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openReserveDetails}
                                        className="text-left rounded-[20px] bg-emerald-50/60 border border-emerald-100 px-4 py-3.5 transition-transform duration-150 ease-out active:scale-[0.99] hover:bg-emerald-50 hover:border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                                <RefreshCw size={13} className="text-emerald-700" />
                                            </span>
                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight">Settling back this week</div>
                                        </div>
                                        <div className="text-xl font-bold text-emerald-700 tabular-nums tracking-tight mt-2">{formatCurrency(releasingThisWeek, displayCurrency)}</div>
                                        <div className="text-[12px] text-emerald-700 font-semibold mt-1">View release schedule →</div>
                                    </button>
                                </div>

                                {upcomingTx.length > 0 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowPayoutBreakdown(v => !v)}
                                            aria-expanded={showPayoutBreakdown}
                                            className="mt-3 w-full flex items-center justify-between gap-2 rounded-[20px] bg-white border border-gray-200 px-4 py-3 text-left transition-transform duration-150 ease-out active:scale-[0.99] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40"
                                        >
                                            <span className="text-sm font-semibold text-gray-800">{showPayoutBreakdown ? 'Hide' : 'Show'} the {upcomingTx.length} transaction{plural(upcomingTx.length)} clearing this week</span>
                                            <ChevronRightIcon size={18} className={`text-gray-400 transition-transform duration-200 ease-out ${showPayoutBreakdown ? 'rotate-90' : ''}`} />
                                        </button>
                                        {showPayoutBreakdown && (
                                            <div className="mt-3 rounded-[20px] bg-white border border-gray-200 overflow-hidden">
                                                <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                                                    {upcomingTx.map((t, idx) => {
                                                        const d = t.transaction_date ? new Date(t.transaction_date) : null;
                                                        return (
                                                            <div
                                                                key={t.financial_transaction_id || idx}
                                                                className="flex items-center justify-between gap-4 px-4 py-3 fp-row"
                                                                style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-gray-900 text-[14px] truncate">{t.description || 'Payment'}</div>
                                                                    <div className="text-[12px] text-gray-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                                        <span className="uppercase tracking-wide text-gray-600 font-semibold">{t.label || '-'}</span>
                                                                        {t.supporter?.username ? <span>@{t.supporter.username}</span> : <span className="italic">Guest</span>}
                                                                        {d ? <span>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span> : null}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <div className="font-bold text-emerald-600 tabular-nums tracking-tight">{formatCurrency(t.payable_converted, displayCurrency)}</div>
                                                                    {Number(t.reserve_converted) > 0 ? (
                                                                        <div className="text-[11px] text-cyan-700 font-bold mt-0.5 tabular-nums">{formatCurrency(t.reserve_converted, displayCurrency)} held</div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                <style>{`
                                    @keyframes fpRowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                                    .fp-row { animation: fpRowIn 240ms cubic-bezier(0.23, 1, 0.32, 1) both; }
                                    @media (prefers-reduced-motion: reduce) { .fp-row { animation: none; } }
                                `}</style>
                            </div>

                            {/* Money Status - where the rest of your money sits, quiet by design. */}
                            <div className="bg-white mt-4 p-5 md:p-6 rounded-[30px] border border-gray-200 relative overflow-hidden shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-[13px] uppercase tracking-wide text-gray-500 font-semibold flex items-center gap-2">
                                        <WalletIcon size={18} className="text-[#FF007F]" /> Where the rest sits
                                    </div>
                                </div>
                                <p className="text-[13px] text-gray-500 font-medium mb-5 leading-snug">Earned, clearing, reserve, available, paid out. Here's where yours is right now.</p>

                                <div className="divide-y divide-gray-100 border border-gray-100 rounded-[20px] overflow-hidden">
                                    {moneyRows.map((row) => {
                                        const Cmp = row.onClick ? 'button' : 'div';
                                        return (
                                            <Cmp
                                                key={row.key}
                                                type={row.onClick ? 'button' : undefined}
                                                onClick={row.onClick}
                                                className={`w-full text-left flex items-center justify-between gap-4 px-4 py-3.5 transition-[transform,background-color] duration-150 ease-out ${row.onClick ? 'hover:bg-gray-50 cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40 focus-visible:ring-inset' : ''} ${row.primary ? 'bg-green-50/50' : ''} ${row.muted ? 'bg-emerald-50/40' : ''}`}
                                            >
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${row.dot}`} />
                                                    <div className="min-w-0">
                                                        <div className={`leading-tight ${row.primary ? 'text-gray-900 text-[15px] font-bold' : 'text-gray-800 text-sm font-semibold'}`}>
                                                            {row.label}
                                                            {row.onClick ? <span className="text-[13px] text-[#FF007F] font-semibold ml-2">View →</span> : null}
                                                        </div>
                                                        <div className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">{row.hint}</div>
                                                    </div>
                                                </div>
                                                <div className={`${MONEY} whitespace-nowrap ${row.primary ? 'text-2xl md:text-3xl text-emerald-600' : row.muted ? 'text-lg text-emerald-600' : 'text-lg text-gray-900'}`}>
                                                    {row.muted ? '✓ ' : ''}{formatCurrency(row.amount, displayCurrency)}
                                                </div>
                                            </Cmp>
                                        );
                                    })}
                                </div>

                                <div className="text-[12px] text-gray-400 font-bold mt-3 flex items-center gap-1.5">
                                    <ShieldCheckIcon size={15} className="text-green-600" /> You keep 100%. Reserves are returned automatically 30 days after each sale.
                                </div>
                            </div>
                        </section>

                        {/* Earnings & tax band */}
                        <div className="mt-10 mb-4">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Earnings &amp; tax</h2>
                            <p className="text-[13px] md:text-sm text-gray-500 font-medium mt-1.5 leading-snug">Your totals for the {tax_year} tax year.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {[
                                { label: `Gross Earnings (${tax_year})`, value: summary.gross_income, icon: <WalletIcon size={80} />, trend: <TrendingUpIcon size={14} className="text-green-600" />, sub: 'Total sent to you by supporters.' },
                                { label: 'Net Earnings', value: summary.profit, icon: <CircleCheckIcon size={80} className="text-emerald-500" />, color: 'text-emerald-600', sub: 'What you keep after expenses.' },
                                { label: 'Expenses', value: summary.expenses, icon: <TrendingDownIcon size={80} className="text-red-500" />, color: 'text-red-600', sub: 'Optional costs you track.' },
                                { label: 'Est. Tax', value: tax_estimate, icon: <Calculator size={80} className="text-yellow-600" />, color: 'text-yellow-600', sub: `Set aside ${formatCurrency((tax_estimate || 0) / 12, displayCurrency)}/mo.` },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white p-5 md:p-6 rounded-[30px]  border border-gray-200 relative overflow-hidden group hover:border-gray-300 transition-colors shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">{stat.icon}</div>
                                        <div className="relative z-10">
                                            <div className={`${EYEBROW} mb-1 flex items-center gap-2`}>
                                                {stat.trend || <div className="w-2 h-2 rounded-full bg-current"></div>}
                                                {stat.label}
                                            </div>
                                            <div className={`text-2xl md:text-3xl ${MONEY} mt-2 ${stat.color || 'text-gray-900'}`}>{formatCurrency(stat.value, displayCurrency)}</div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-3 pt-3 border-t border-gray-100 text-[14px] text-gray-500 font-medium leading-tight">
                                        {stat.sub}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='pt-8 space-y-8'>
                            <div className="flex items-center gap-2 border-b border-gray-200 pb-px">
                                <Link href={route('financial.dashboard', { tab: 'overview' })} className={`px-5 py-3 font-bold text-[14px] uppercase tracking-wider transition-colors border-b-2 ${
                                active_tab === 'overview' ? 'border-[#FF007F] text-[#FF007F]':'border-transparent text-gray-500 hover:text-gray-900'}`} > Overview </Link>
                                <Link  href={route('financial.dashboard', { tab: 'payouts' })} className={`px-5 py-3 font-bold text-[14px] uppercase tracking-wider transition-colors border-b-2 ${active_tab === 'payouts' ? 'border-[#FF007F] text-[#FF007F]':'border-transparent text-gray-500 hover:text-gray-900'}`} > Payouts
                                </Link> 
                            </div>

                            {active_tab === 'payouts' && (
                                <div className="space-y-6">
                                    <GroupHeader title="Payout schedule & reserves" sub="When money is sent, how much is held back, and when it returns." divider={false} />
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                                        <div className="bg-white p-5 md:p-6 rounded-[30px]  border border-gray-200 shadow-sm">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-gray-500 text-[13px] font-semibold uppercase tracking-wide mb-2">Weekly Payout Window</div>
                                                    <div className="text-gray-900 text-lg md:text-xl font-bold">{cycleWindowLabel || '-'}</div>
                                                    <div className="mt-2 text-[13px] text-gray-500 font-medium">Next payout: <span className="text-gray-900 font-semibold">{nextPayoutLabel || '-'}</span></div>
                                                    {payout_cycle?.timezone && (
                                                        <div className="text-[12px] text-gray-500 mt-2 font-medium uppercase tracking-wide">{payout_cycle.timezone} timezone</div>
                                                    )}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-[#05EFB8]/10 flex items-center justify-center border border-[#05EFB8]/20">
                                                    <WalletIcon size={18} className="text-[#05EFB8]" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openReserveDetails}
                                            className="text-left bg-white p-5 md:p-6 rounded-[30px]  border border-gray-200 shadow-sm hover:border-emerald-300 transition-colors relative group"
                                        >

                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-gray-500 text-[13px] font-semibold uppercase tracking-wide mb-2">Reserve Hold</div>
                                                    <div className="text-gray-900 text-lg md:text-xl font-bold tabular-nums tracking-tight">
                                                        {formatCurrency(summary?.held_reserves ?? 0, displayCurrency)}
                                                    </div>
                                                    <div className="text-[13px] text-gray-500 mt-2 font-medium">
                                                        Current rate on new sales: <span className="text-gray-900 font-semibold tabular-nums">{(reserve_policy?.effective_percent ?? 0) > 0 ? `${reserve_policy.effective_percent}%` : '0%'}</span>
                                                    </div>
                                                    {reserve_reason && (
                                                        <div className="text-[12px] text-gray-500 mt-1.5 font-medium">{reserve_reason}</div>
                                                    )}
                                                    <div className="text-[13px] text-gray-500 mt-2 font-medium leading-snug">
                                                        Temporarily held for account protection &amp; dispute prevention. Released after 30 days.
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 min-w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                                    <ShieldCheckIcon size={18} className="text-emerald-600" />
                                                </div>
                                            </div>
                                            <div className="mt-4 text-center px-2 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[12px] font-semibold uppercase tracking-wide group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                                                View Transactions &gt;
                                            </div>
                                        </button>

                                        <div className="bg-white p-5 md:p-6 rounded-[30px]  border border-gray-200 shadow-sm">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-gray-500 text-[13px] font-semibold uppercase tracking-wide mb-2">How Releases Work</div>
                                                    <div className="text-gray-900 text-sm md:text-base font-semibold leading-snug">Reserves are automatically released after 30 days</div>
                                                    <div className="text-[13px] text-gray-500 mt-2 font-medium leading-snug">This helps protect your account while keeping payouts predictable.</div>
                                                    {reserve_policy?.onboarding_percent > 0 && reserve_policy?.onboarding_ends_at && (
                                                        <div className="text-[13px] text-gray-500 mt-2 font-medium">
                                                            New creator hold ends: <span className="text-gray-900 font-semibold">{reserve_policy.onboarding_ends_at}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-10 w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                                    <HelpCircle size={18} className="text-yellow-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {(fast_start_bonus || founder_bonus) && (
                                        <GroupHeader title="Your bonuses" sub="Platform rewards paid on top of your earnings." />
                                    )}

                                    {fast_start_bonus ? (() => {
                                        const start = fast_start_bonus.window_start ? new Date(fast_start_bonus.window_start) : null;
                                        const end = fast_start_bonus.window_end ? new Date(fast_start_bonus.window_end) : null;
                                        const totalMs = start && end ? Math.max(1, end.getTime() - start.getTime()) : 1;
                                        const nowMs = start ? Date.now() : 0;
                                        const progress = start && end ? Math.min(100, Math.max(0, ((nowMs - start.getTime()) / totalMs) * 100)) : 0;
                                        const statusLabel = String(fast_start_bonus.status || '').replaceAll('_', ' ').toUpperCase();
                                        return (
                                            <div className="bg-gradient-to-br from-[#FF007F]/5 to-white p-6 md:p-8 rounded-[30px] border border-[#FF007F]/15 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-[0.06]">
                                                    <CircleCheckIcon size={110} className="text-[#FF007F]" />
                                                </div>
                                                <div className="relative z-10 flex flex-col gap-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-gray-500 text-[13px] font-semibold uppercase tracking-wide">Fast Start Bonus</div>
                                                                <div className="inline-flex items-center gap-2 bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/20 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                                                                    Platform Bonus
                                                                </div>
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                                                                    fast_start_bonus.status === 'active'
                                                                        ? 'bg-green-500/10 text-green-700 border-green-500/20'
                                                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                                                }`}>
                                                                    {statusLabel}
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 text-3xl md:text-4xl tabular-nums tracking-tight font-bold text-gray-900">
                                                                {formatCurrency(fast_start_bonus.bonus_so_far || 0, fast_start_bonus.currency)}
                                                            </div>
                                                            <div className="text-[15px] text-gray-600 font-bold mt-2">
                                                                Tracked earnings: <span className="text-gray-900">{formatCurrency(fast_start_bonus.earnings_so_far || 0, fast_start_bonus.currency)}</span>
                                                            </div>
                                                            <div className="text-[13px] text-gray-500 font-bold mt-2">
                                                                This bonus is paid as a one-time payout after your 30-day window ends.
                                                            </div>
                                                        </div>

                                                        <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-[#FF007F]/10 border border-[#FF007F]/20">
                                                            <CircleCheckIcon size={22} className="text-[#FF007F]" />
                                                        </div>
                                                    </div>

                                                    {fast_start_bonus.status === 'active' ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Window Ends</div>
                                                                <div className="mt-1 text-[15px] tabular-nums font-bold text-gray-900">{end ? end.toLocaleDateString('en-GB') : '-'}</div>
                                                            </div>
                                                            <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Days Left</div>
                                                                <div className="mt-1 text-[15px] tabular-nums font-bold text-gray-900">{fast_start_bonus.days_remaining ?? '-'}</div>
                                                            </div>
                                                            <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Progress</div>
                                                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                    <div className="bg-[#FF007F] h-full rounded-full" style={{ width: `${progress}%` }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div className="flex justify-end mt-2">
                                                        <Link
                                                            href={route('financial.fast-start-bonus')}
                                                            className="inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-[#FF007F] hover:text-[#cc005e] transition-colors"
                                                        >
                                                            View Full Details
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })() : null}

                                    {founder_bonus ? (() => {
                                        const start = founder_bonus.month_start ? new Date(founder_bonus.month_start) : null;
                                        const end = founder_bonus.month_end ? new Date(founder_bonus.month_end) : null;
                                        const totalMs = start && end ? Math.max(1, end.getTime() - start.getTime()) : 1;
                                        const nowMs = start ? Date.now() : 0;
                                        const progress = start && end ? Math.min(100, Math.max(0, ((nowMs - start.getTime()) / totalMs) * 100)) : 0;
                                        const statusLabel = String(founder_bonus.status || '').replaceAll('_', ' ').toUpperCase();
                                        const monthEnds = end ? end.toLocaleDateString('en-GB') : '-';
                                        const monthsLeft = founder_bonus.months_left ?? null;
                                        const qualification = founder_bonus.qualification_payout || null;
                                        const lastMonth = founder_bonus.last_month || null;
                                        return (
                                            <div className="bg-gradient-to-br from-purple-50/50 to-white p-6 md:p-8 rounded-[30px] border border-purple-100 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-[0.06]">
                                                    <UsersIcon size={110} className="text-purple-600" />
                                                </div>
                                                <div className="relative z-10 flex flex-col gap-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-gray-500 text-[13px] font-semibold uppercase tracking-wide">Founder Bonus</div>
                                                                <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-700 border border-purple-500/20 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                                                                    Monthly Bonus
                                                                </div>
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                                                                    founder_bonus.status === 'active'
                                                                        ? 'bg-green-500/10 text-green-700 border-green-500/20'
                                                                        : founder_bonus.status === 'payout_paused'
                                                                            ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                                                                            : 'bg-gray-100 text-gray-700 border-gray-200'
                                                                }`}>
                                                                    {statusLabel}
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 text-3xl md:text-4xl tabular-nums tracking-tight font-bold text-gray-900">
                                                                {formatCurrency(founder_bonus.bonus_so_far || 0, founder_bonus.currency)}
                                                            </div>
                                                            <div className="text-[15px] text-gray-600 font-bold mt-2">
                                                                This month earnings: <span className="text-gray-900">{formatCurrency(founder_bonus.earnings_so_far || 0, founder_bonus.currency)}</span>
                                                            </div>
                                                            <div className="text-[13px] text-gray-500 font-bold mt-2">
                                                                Bonus: {Math.round((founder_bonus.bonus_percentage || 0) * 100)}% • Min: {formatCurrency(founder_bonus.min_monthly_earnings || 0, founder_bonus.currency)} • Cap: {formatCurrency(founder_bonus.max_bonus_per_month || 0, founder_bonus.currency)}
                                                            </div>
                                                        </div>

                                                        <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20">
                                                            <UsersIcon size={22} className="text-purple-600" />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Month Ends</div>
                                                            <div className="mt-1 text-[15px] tabular-nums font-bold text-gray-900">{monthEnds}</div>
                                                        </div>
                                                        <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Months Left</div>
                                                            <div className="mt-1 text-[15px] tabular-nums font-bold text-gray-900">{monthsLeft === null ? '-' : monthsLeft}</div>
                                                        </div>
                                                        <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Month Progress</div>
                                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${progress}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {qualification ? (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div>
                                                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Founder Qualification Payout</div>
                                                                    <div className="mt-1 text-[15px] tabular-nums font-bold text-gray-900">
                                                                        {String(qualification.status || '').replaceAll('_', ' ').toUpperCase()}
                                                                        {qualification.estimated_payout_date ? ` • ETA ${new Date(qualification.estimated_payout_date).toLocaleDateString('en-GB')}` : ''}
                                                                    </div>
                                                                </div>
                                                                <div className="text-[15px] tabular-nums font-bold text-gray-900">
                                                                    {formatCurrency(qualification.bonus_amount || 0, founder_bonus.currency)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    {lastMonth ? (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-[20px] px-4 py-3">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div>
                                                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Last Month Bonus ({lastMonth.month})</div>
                                                                    <div className="mt-1 text-[15px] tabular-nums font-bold text-gray-900">
                                                                        {String(lastMonth.payout_status || '').replaceAll('_', ' ').toUpperCase()}
                                                                        {lastMonth.payout_date ? ` • ${new Date(lastMonth.payout_date).toLocaleDateString('en-GB')}` : ''}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[15px] tabular-nums font-bold text-gray-900">{formatCurrency(lastMonth.bonus_amount || 0, founder_bonus.currency)}</div>
                                                                    <div className="text-[12px] text-gray-500 font-bold">on {formatCurrency(lastMonth.monthly_earnings || 0, founder_bonus.currency)}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })() : null}

                                    <GroupHeader title="This week's balance" sub="What's payable now, and the status of every bucket." />

                                    <div className="bg-white flex gap-6 p-5 md:p-6 rounded-[30px]  border border-gray-200 relative overflow-hidden group hover:border-gray-300 transition-colors shadow-sm">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <ShieldCheckIcon size={80} className="text-blue-500" />
                                        </div>
                                        <div className="relative z-10 w-full">
                                            <div className="flex flex-col md:flex-row md:justify-between gap-4 text-gray-900">
                                                <div className="flex-1">
                                                    <div className={`${EYEBROW} mb-1.5`}>Available for Friday Payout</div>
                                                    <div className={`text-2xl ${MONEY} text-emerald-600`}>{formatCurrency(summary.payoutable_balance, displayCurrency)}</div>
                                                    <div className="text-[13px] text-gray-500 font-medium mt-1.5 leading-snug">
                                                        Paid out every Friday. {summary.carry_over_amount > 0 ? `Includes ${formatCurrency(summary.carry_over_amount, displayCurrency)} from previous tax year.` : ''} {summary.has_adjustment ? 'Includes recovery for previous payouts.' : 'Excludes reserves, pending completion, disputes and refunds.'}
                                                    </div>
                                                    {summary.payout_preview?.lines && summary.payout_preview.lines.length > 0 && (
                                                        <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-3">
                                                            {summary.payout_preview.lines.map((line, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-[13px] font-medium">
                                                                    <span className="text-gray-500">{line.label}</span>
                                                                    <span className={`tabular-nums tracking-tight font-semibold ${line.amount >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                                                                        {line.amount >= 0 ? '+' : ''}{formatCurrency(line.amount, displayCurrency)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:px-4 flex-1">
                                                    <div className={`${EYEBROW} mb-1.5`}>Pending Completion (Cleared)</div>
                                                    <div className={`text-2xl ${MONEY} text-yellow-600`}>{formatCurrency(summary.pending_balance || 0, displayCurrency)}</div>
                                                    <div className="text-[13px] text-gray-500 font-medium mt-1.5 leading-snug">Waiting for tasks or shop items to be completed (after 7-day clearing).</div>
                                                </div>
                                                <div className="border-t md:border-t-0 md:border-l text-start border-gray-200 pt-4 md:pt-0 md:pl-4 flex-1">
                                                    <div className={`${EYEBROW} mb-1.5`}>Status</div>
                                                    <div className="inline-block bg-emerald-500/10 text-emerald-600 text-[13px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wide">Healthy</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Status Breakdown */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
                                        {[
                                            { key: 'queued', label: 'Queued for Friday Payout', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-600', note: 'Included in upcoming payout batch' },
                                            { key: 'clearing', label: 'Pending (Clearing)', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600', note: 'Payment received, clearing for 7 days' },
                                            { key: 'pending', label: 'Pending Completion', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600', note: 'Waiting for tasks or shop items to be completed' },
                                            { key: 'review_hold', label: 'Review Hold', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600', note: 'Temporarily reviewed for fraud prevention, safety or compliance checks' },
                                            { key: 'disputed', label: 'Disputed', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600', note: 'Removed from payout balance' },
                                            { key: 'refunded', label: 'Refunded', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600', note: 'Removed from payout balance' },
                                        ].map(({ key, label, bg, border, text, note }) => {
                                            const s = status_breakdown.find(sb => sb.status === key);
                                            const total =
                                                key === 'queued' ? (summary?.payoutable_balance ?? 0) :
                                                key === 'clearing' ? (summary?.clearing_balance ?? 0) :
                                                s?.total ?? 0;
                                            const count =
                                                key === 'queued' ? (summary?.payout_preview?.payment_count ?? 0) :
                                                key === 'clearing' ? null :
                                                s?.count ?? 0;
                                            return (
                                                <div key={key} className={`bg-gray-50 border-2 ${border} rounded-[30px] overflow-hidden flex flex-col justify-between`}>
                                                    <div className={`p-4 ${bg} flex flex-col gap-1`}>
                                                        <div className={`text-[11px] font-semibold uppercase tracking-wide ${text}`}>
                                                            {key === 'review_hold' ? (
                                                                <span title="Payments temporarily reviewed for fraud prevention, safety or compliance checks.">
                                                                    {label}
                                                                </span>
                                                            ) : (
                                                                label
                                                            )}
                                                        </div>
                                                        <div className={`text-2xl ${MONEY} text-gray-900`}>{formatCurrency(total ?? 0, displayCurrency)}</div>
                                                        <div className="text-[13px] text-gray-500 font-medium tabular-nums">
                                                            {count === null ? '-' : `${count} payment${count !== 1 ? 's' : ''}`}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 text-[13px] font-medium leading-snug text-gray-500">
                                                        {note}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <GroupHeader title="Payout history" sub="Every payout sent to your bank, and your full ledger." />

                                    {/* Payout History */}
                                    <div className="bg-white rounded-[30px]  border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <WalletIcon className="text-green-600" size={20} />
                                                Payout History
                                            </h2>
                                            <span className="text-[12px] font-bold text-gray-400 tabular-nums">
                                                {payout_history.length} payout{payout_history.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50">
                                                    <tr className="text-gray-500 text-[12px] uppercase font-bold tracking-widest">
                                                        <th className="px-6 py-4">Requested On</th>
                                                        <th className="px-6 py-4">Type</th>
                                                        <th className="px-6 py-4">Amount</th>
                                                        <th className="px-6 py-4">Expected Arrival</th>
                                                        <th className="px-6 py-4 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {payout_history.length > 0 ? (
                                                        payout_history.map((p) => {
                                                            const typeStyles = {
                                                                fast_start: 'bg-[#FF007F]/10 text-[#FF007F] border-[#FF007F]/20',
                                                                founder: 'bg-purple-100 text-purple-700 border-purple-200',
                                                                reserve_release: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                                                                weekly: 'bg-gray-100 text-gray-600 border-gray-200',
                                                            };
                                                            const hasBonus = (p.fast_start_bonus > 0 || p.founder_bonus > 0);
                                                            const bonusAmt = p.type_key === 'fast_start' ? p.fast_start_bonus : p.founder_bonus;
                                                            const isOpen = expandedPayout === p.uuid;
                                                            const isFail = p.status === 'failed' || p.status === 'skipped';
                                                            return (
                                                                <Fragment key={p.uuid}>
                                                                <tr className="hover:bg-gray-50 transition-colors align-top">
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-[14px] text-gray-900 font-bold leading-tight">{p.date}</div>
                                                                        <div className="text-[11px] text-gray-400 font-medium mt-0.5">{p.time}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={` whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${typeStyles[p.type_key] || typeStyles.weekly}`}>
                                                                            {p.type_label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-[15px] tabular-nums font-bold text-gray-900 tabular-nums">{formatCurrency(p.amount, p.currency)}</div>
                                                                        {hasBonus && (
                                                                            <div className="text-[11px] font-bold tabular-nums text-[#FF007F] uppercase tracking-wider mt-0.5">
                                                                                Bonus: {formatCurrency(bonusAmt, p.currency)}
                                                                            </div>
                                                                        )}
                                                                        {p.reference && (
                                                                            <div className="text-[10px] text-gray-400 font-mono mt-1 truncate max-w-[140px]" title={p.reference}>
                                                                                {p.reference}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-[14px] text-gray-600">
                                                                        {isFail ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setExpandedPayout(isOpen ? null : p.uuid)}
                                                                                className="text-left text-red-600 font-bold text-[12px] hover:underline"
                                                                            >
                                                                                {p.failure_reason || 'Payout failed'}
                                                                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                                                    {isOpen ? 'Hide details ▲' : 'Show details ▼'}
                                                                                </span>
                                                                            </button>
                                                                        ) : p.status === 'paid' ? (
                                                                            <span className="text-green-700 font-bold">{p.arrival_date || 'Delivered'}</span>
                                                                        ) : p.status === 'scheduled' ? (
                                                                            <span className="text-gray-600">{p.arrival_date ? `Est. ${p.arrival_date}` : 'To be scheduled'}</span>
                                                                        ) : (
                                                                            <span>{p.arrival_date || 'Processing…'}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-right">
                                                                        <span className={` whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                            p.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                            p.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                                                            isFail ? 'bg-red-100 text-red-700' :
                                                                            p.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                                                                            'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                            {p.status === 'in_transit' ? 'In Bank Soon' : p.status?.replace('_', ' ')}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                                {isFail && isOpen && (
                                                                    <tr className="bg-red-50/50">
                                                                        <td colSpan="5" className="px-6 py-4">
                                                                            <div className="rounded-xl border border-red-200 bg-white p-4">
                                                                                <div className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-1">Failure Detail</div>
                                                                                <p className="text-[13px] text-gray-700 break-words">{p.failure_detail || 'No additional detail provided by Stripe.'}</p>
                                                                                {p.failure_code && (
                                                                                    <div className="text-[11px] text-gray-400 font-mono mt-2">Code: {p.failure_code}</div>
                                                                                )}
                                                                                <p className="text-[12px] text-gray-500 mt-3">
                                                                                    Need help? Contact <a href="mailto:support@spennypiggy.co" className="text-[#FF007F] font-bold underline">support@spennypiggy.co</a>.
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                </Fragment>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-10 text-center">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <WalletIcon className="text-gray-300" size={32} />
                                                                    <span className="text-gray-400 text-sm font-medium">No payouts have been processed yet.</span>
                                                                    <span className="text-gray-300 text-[12px]">Payouts are sent every Friday.</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <LedgerHistoryTable transactions={recent_transactions} tax_year={tax_year} active_tab={active_tab} displayCurrency={displayCurrency} />
                                </div>
                            )}

                            {active_tab === 'overview' && (
                                <>
                                    <GroupHeader title="Insights & tips" sub="A quick read on your tax year and financial health." divider={false} />

                                    {/* Progress & Tips */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                                        <div className="bg-white p-6 rounded-[30px]  border border-gray-200 shadow-sm">
                                            <h3 className="text-gray-900 font-bold text-normal mb-4 flex items-center gap-2"><TrendingUpIcon size={16} className="text-[#FF007F]" /> Tax Year Progress ({tax_year})</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-normal text-gray-500 mb-1"><span>April 6</span><span>April 5</span></div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    {(() => {
                                                        const now = new Date();
                                                        const year = now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6) ? now.getFullYear() - 1 : now.getFullYear();
                                                        const start = new Date(year, 3, 6);
                                                        const end = new Date(year + 1, 3, 5);
                                                        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                                                        return <div className="bg-gradient-to-r from-[#FF007F] to-[#ff7eb3] h-full rounded-full" style={{ width: `${progress}%` }}></div>;
                                                    })()}
                                                </div>
                                                <p className="text-[14px] text-gray-400 mt-2 italic text-center">Note: High income months? Increase your tax set-aside.</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-[30px]  border border-gray-200 shadow-sm">
                                            <h3 className="text-gray-900 font-bold text-normal mb-4 flex items-center gap-2"><TriangleAlertIcon size={16} className="text-yellow-600" /> Financial Health Note</h3>
                                            <div className="flex items-start gap-4">
                                                <div className="bg-yellow-500/10 p-3 rounded-[30px] "><CalculatorIcon size={24} className="text-yellow-600" /></div>
                                                <div>
                                                    <p className="text-gray-700 text-normal leading-relaxed">{(summary?.expenses ?? 0) > ((summary?.gross_income ?? 0) * 0.3) ? "Your expenses are quite high." : "Your profit margins look healthy."}</p>
                                                    <Link href={route('financial.expenses.index')} className="text-[#FF007F] text-[10px] font-bold uppercase mt-2 inline-block hover:underline">Review Expenses</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <GroupHeader title="Earnings & records" sub="Your trend, top supporters, business profile, and downloadable records." />

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                                        <div className="lg:col-span-2 space-y-8">
                                            {/* Chart */}
                                            <div className="bg-white rounded-[30px]  border border-gray-200 p-6 shadow-sm">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><ChartBarIcon className="text-[#FF007F]" size={20} /> Earnings Trend</h2>
                                                    <span className="text-normal text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">{tax_year}</span>
                                                </div>
                                                <div className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF007F" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF007F" stopOpacity={0}/></linearGradient></defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
                                                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} itemStyle={{ color: '#111827' }} />
                                                            <Area type="monotone" dataKey="total" stroke="#FF007F" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Top Supporters */}
                                            <div className="bg-white rounded-[30px]  border border-gray-200 shadow-sm overflow-hidden">
                                                <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><UsersIcon className="text-green-500" size={20} /> Top Supporters</h2></div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-gray-50"><tr className="text-gray-500 text-[10px] uppercase font-bold tracking-widest"><th className="px-6 py-4">Supporter</th><th className="px-6 py-4 text-right">Total</th></tr></thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {top_supporters?.map((s) => (
                                                                <tr key={s.supporter_id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-6 py-4 text-sm flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                                            {s.supporter?.avatar_url ? <img src={s.supporter.avatar_url} className="w-full h-full object-cover" /> : <span className="text-normal font-bold text-gray-400">{s.supporter?.name?.[0] ?? '?'}</span>}
                                                                        </div>
                                                                        <div><div className="text-gray-900 font-medium">{s.supporter?.name ?? 'Guest'}</div><div className="text-[14px] text-gray-500">@{s.supporter?.username ?? 'guest'}</div></div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-right tabular-nums tracking-tight font-bold text-gray-900">{formatCurrency(s.total_spent, displayCurrency)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <LedgerHistoryTable transactions={recent_transactions} tax_year={tax_year} active_tab={active_tab} displayCurrency={displayCurrency} />
                                        </div>

                                        <div className="space-y-8">
                                            {/* Business Profile */}
                                            <div className="bg-white rounded-[30px]  border border-gray-200 p-6 shadow-sm">
                                                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Building2 className="text-gray-500" size={20} /> Business Profile</h2>{!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="text-gray-500 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg"><Pencil size={18} /></button>}</div>
                                                {isEditingProfile ? (
                                                    <form onSubmit={submitProfile} className="space-y-4">
                                                        <input type="text" value={data.business_name} onChange={e => setData('business_name', e.target.value)} className="w-full bg-gray-50 border-gray-200 rounded-lg text-gray-900 text-sm p-2.5" placeholder="Business Name" />
                                                        <div className="flex gap-2 justify-end"><button type="button" onClick={() => setIsEditingProfile(false)} className="text-normal font-bold text-gray-400">Cancel</button><button type="submit" className="bg-[#FF007F] text-white text-normal font-bold px-4 py-1.5 rounded-lg">Save</button></div>
                                                    </form>
                                                ) : (
                                                    <div className="space-y-4"><div><span className="block text-[13px] text-gray-500 uppercase font-bold">Entity Name</span><span className="text-gray-900 font-bold">{profile?.business_name || auth.user.name}</span></div><Link href={route('financial.statement')} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-[30px]  font-bold">Download Tax Statement</Link></div>
                                                )}
                                            </div>

                                            {/* Income Types */}
                                            <div className="bg-white rounded-[30px]  border border-gray-200 p-6 shadow-sm">
                                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><ChartPieIcon className="text-[#FF007F]" size={20} /> Income by Type</h2>
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
                                                        const t = analytics?.tribute_types?.find(tt => tt.label === key);
                                                        const percentage = summary.gross_income > 0 ? ((t?.total ?? 0) / summary.gross_income) * 100 : 0;
                                                        return (
                                                            <div key={key} className="bg-gray-50 rounded-[20px] p-3 border border-gray-200">
                                                                <div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-2"><span className="text-base">{emoji}</span><span className="text-sm font-semibold text-gray-900">{key}</span></div><span className="text-sm tabular-nums tracking-tight font-bold text-gray-900">{formatCurrency(t?.total ?? 0, displayCurrency)}</span></div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1 mb-1.5"><div className="h-1 rounded-full transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} /></div>
                                                                <div className="flex justify-between items-center"><span className="text-[11px] text-gray-500">{t?.count ?? 0} payments</span><span className="text-[11px] font-bold" style={{ color }}>{percentage.toFixed(1)}%</span></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Records */}
                                            <div className="bg-white rounded-[30px]  border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ScrollTextIcon size={100} className="text-[#FF007F]" /></div>
                                                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2 relative z-10"><ShieldCheckIcon className="text-green-600" size={20} /> Tax & Financial Records</h2>
                                                <p className="text-normal text-gray-500 mb-6 leading-relaxed relative z-10">Download statements and payout history.</p>
                                                <div className="space-y-4 relative z-10">
                                                    <StatementDownloadCard taxYear={tax_year_number} />
                                                    {[
                                                        { label: 'Income Statement', sub: 'For Your Accountant', href: route('financial.statement'), icon: <FileText size={12} className="text-[#FF007F]" /> },
                                                        { label: 'Verified Certificate', sub: 'Proof of Income', href: route('financial.certificate'), icon: <CircleCheckIcon size={12} className="text-green-600" /> },
                                                        { label: 'Transaction History', sub: 'Payout Status', href: route('financial.history'), icon: <TrendingUpIcon size={12} className="text-yellow-600" /> },
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="group bg-gray-50 hover:bg-gray-100 rounded-[30px]  p-4 border border-gray-200 transition-all">
                                                            <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-[14px] text-gray-400 uppercase font-bold">{item.sub}</span></div>
                                                            <h4 className="text-normal font-bold text-gray-900 mb-3">{item.label}</h4>
                                                            <Link href={item.href} className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-[#FF007F] text-white py-2 rounded-lg text-normal font-bold transition-all">View / Download</Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </AuthenticatedLayout>
    );
}
