import { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import LedgerHistoryTable from '@/Components/Financial/LedgerHistoryTable';
import { 
    WalletIcon, 
    TrendingUpIcon, 
    TrendingDownIcon, 
    DownloadIcon, 
    PlusIcon, 
    TriangleAlertIcon, 
    CircleCheckIcon,
    ChartBarIcon,
    UsersIcon,
    ChevronRightIcon,
    ChartPieIcon,
    ShieldCheckIcon,
} from "@animateicons/react/lucide";
import { 
    Calculator, 
    FileText, 
    Building2, 
    ScrollText, 
    HelpCircle,
    Pencil,
    RefreshCw,
    ScrollText as ScrollTextIcon,
    Calculator as CalculatorIcon,
    FileText as FileTextIcon
} from "lucide-react";
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function Dashboard({ auth, summary, tax_estimate, tax_year, date_range, tax_band_label, display_currency, profile, recent_transactions, analytics, top_supporters, status_breakdown = [], reserve_breakdown = [], reserve_reason, reserve_policy = null, payout_cycle = null, payout_history = [], active_tab = 'overview' }) {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
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

    const chartData = analytics?.monthly?.map(item => ({
        name: new Date(item.month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
        total: parseFloat(item.total)
    })) || [];

    const reserves = reserveDetails?.breakdown || [];
    const reserveTotal = Number(reserveDetails?.total_held ?? summary?.held_reserves ?? 0);

    const openReserveDetails = async () => {
        setShowReserveDetails(true);
        setReserveLoadError(null);
        setReserveLoading(true);
        try {
            const res = await axios.get(route('creator.payouts.reserves'));
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
        return `${fmt(start)} — ${fmt(end)}`;
    })();

    const nextPayoutLabel = (() => {
        if (!payout_cycle?.next_payout_at) return null;
        const d = new Date(payout_cycle.next_payout_at);
        return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    })();

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Financial Dashboard" />

            <Modal show={showReserveDetails} onClose={() => setShowReserveDetails(false)} maxWidth="2xl">
                <div className="bg-gray-950 text-white p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[15px] font-bold uppercase tracking-widest text-gray-400">Held Reserves</div>
                            <div className="text-xl md:text-2xl font-bold mt-1">{formatCurrency(reserveTotal, displayCurrency)}</div>
                            <div className="text-[12px] text-gray-500 font-bold mt-2">{reserve_reason || 'Reserves currently held on your earnings.'}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowReserveDetails(false)}
                            className="px-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-colors text-sm font-bold"
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
                        {reserveLoading ? (
                            <div className="text-gray-400 text-sm font-bold">Loading reserves…</div>
                        ) : reserveLoadError ? (
                            <div className="text-red-300 text-sm font-bold">{reserveLoadError}</div>
                        ) : (reserves || []).length === 0 ? (
                            <div className="text-gray-400 text-sm font-bold">No held reserves right now.</div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/40">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-gray-950 border-b border-gray-800">
                                        <tr className="text-gray-500 text-[12px] uppercase font-bold tracking-widest">
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Supporter</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Releases</th>
                                            <th className="px-4 py-3 text-right">Reserved</th>
                                            <th className="px-4 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {(reserves || []).map((r, idx) => {
                                            const txDate = r.transaction_date ? new Date(r.transaction_date) : null;
                                            const dateLabel = txDate ? txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : (r.run_date && r.run_date !== 'Pending' ? new Date(r.run_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—');
                                            const timeLabel = txDate ? txDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                                            const statusKey = (r.status || '').toString();
                                            const statusMeta = (() => {
                                                const map = {
                                                    completed: { label: 'COMPLETED', cls: 'bg-green-500/10 text-green-400 border border-green-500/20' },
                                                    review_hold: { label: 'REVIEW HOLD', cls: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' },
                                                    disputed: { label: 'DISPUTED', cls: 'bg-orange-500/10 text-orange-300 border border-orange-500/20' },
                                                    refunded: { label: 'REFUNDED', cls: 'bg-red-500/10 text-red-300 border border-red-500/20' },
                                                    pending: { label: 'PENDING', cls: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' },
                                                };
                                                return map[statusKey] || (statusKey ? { label: statusKey.replaceAll('_', ' ').toUpperCase(), cls: 'bg-gray-800 text-gray-300 border border-gray-700' } : null);
                                            })();
                                            return (
                                                <tr key={`${r.financial_transaction_id || r.payout_run_id || idx}-${idx}`} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 text-[14px] text-gray-400 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span>{dateLabel}</span>
                                                            {timeLabel ? (
                                                                <span className="text-[11px] text-gray-500 font-medium">{timeLabel}</span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                        {r.supporter ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-200 font-medium capitalize">{r.supporter.name}</span>
                                                                <span className="text-[15px] text-gray-500">@{r.supporter.username}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-[14px] capitalize">{r.source_type === 'transaction' ? 'Guest / System' : 'System'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm min-w-[260px]">
                                                        <div className="font-medium text-gray-200 line-clamp-2">{r.source_name || 'Reserve'}</div>
                                                        <div className="text-[12px] text-gray-500 font-bold mt-1 uppercase">
                                                            {r.label || (r.source_type === 'payout_run' ? 'Payout Run' : '')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[13px] text-gray-300 font-bold whitespace-nowrap">
                                                        {r.release_date || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="text-white font-bold">{formatCurrency((Number(r.amount || 0) / 100), (r.currency || displayCurrency))}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        {statusMeta ? (
                                                            <div className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusMeta.cls}`}>
                                                                {statusMeta.label}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <div className='container mx-auto '>
                <div className="py-8 px-4 sm:px-6 lg:px-8 ">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Financial Hub</h1>
                    <p className="text-sm md:text-base text-gray-400 mt-1">Real-time tax tracking and business insights.</p>
                    <p className="text-normal text-green-500 mt-1 font-bold flex items-center gap-1"><ShieldCheckIcon size={12} /> Your earnings are protected.</p>
                    <div className="pt-6 flex flex-col gap-4">
                        <div className="flex flex-col lg:flex-row lg:justify-between items-start md:items-center gap-4">
                            <div className='w-full lg:w-full'>
                                <p className="text-normal  text-gray-500 mb-2 font-bold">You keep 100% of what you earn. Supporters cover all fees.</p>
                                <p className="text-normal  text-gray-500 mb-2 font-bold">Payouts are sent every Friday.</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="bg-[#F94F96]/10 text-[#F94F96] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-[#F94F96]/20">
                                        Tax Year {tax_year}
                                    </span>
                                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                        {date_range?.start} — {date_range?.end}
                                    </span>
                                </div>
                            </div>
                            <div className="md:flex w-full justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => refreshPost(route('financial.refresh'))}
                                    disabled={refreshProcessing}
                                    className="mb-3 w-full md:w-fit flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-[30px] font-medium transition-all border border-gray-700 text-[14px]"
                                >
                                    <RefreshCw size={18} className={refreshProcessing ? 'animate-spin' : ''} />
                                    <span>{refreshProcessing ? 'Refreshing…' : 'Refresh Records'}</span>
                                </button>
                                <Link 
                                    href={route('financial.expenses.index')} 
                                    onMouseEnter={() => logExpenseIconRef.current?.startAnimation?.()}
                                    onMouseLeave={() => logExpenseIconRef.current?.stopAnimation?.()}
                                    className="mb-3 flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#F94F96] hover:bg-[#d83a7c] text-white px-4 py-2.5 rounded-[30px] font-medium transition-all shadow-lg shadow-pink-500/20 text-[14px]"
                                >
                                    <PlusIcon ref={logExpenseIconRef} size={18} />
                                    <span>Log Expense</span>
                                </Link>
                                <a 
                                    href={route('financial.export.csv')} 
                                    target="_blank"
                                    onMouseEnter={() => exportCsvIconRef.current?.startAnimation?.()}
                                    onMouseLeave={() => exportCsvIconRef.current?.stopAnimation?.()}
                                    className="mb-3 flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-[30px] font-medium transition-all border border-gray-700 text-[14px]"
                                >
                                    <DownloadIcon ref={exportCsvIconRef} size={18} />
                                    <span>Export CSV</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className='pt-8 space-y-8'>
                        <div className="flex items-center gap-2 border-b border-gray-800 pb-px">
                            <Link
                                href={route('financial.dashboard', { tab: 'overview' })}
                                className={`px-5 py-3 font-bold text-[14px] uppercase tracking-wider transition-colors border-b-2 ${
                                    active_tab === 'overview' 
                                        ? 'border-[#F94F96] text-[#F94F96]' 
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                Overview
                            </Link>
                            <Link
                                href={route('financial.dashboard', { tab: 'payouts' })}
                                className={`px-5 py-3 font-bold text-[14px] uppercase tracking-wider transition-colors border-b-2 ${
                                    active_tab === 'payouts' 
                                        ? 'border-[#F94F96] text-[#F94F96]' 
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                Payouts
                            </Link>
                        </div>

                        {active_tab === 'payouts' && (
                            <div className="space-y-8 ">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 shadow-xl">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-gray-400 text-[15px] font-bold uppercase tracking-wider mb-1">Weekly Payout Window</div>
                                                <div className="mt-3 text-white text-lg md:text-xl font-bold">{cycleWindowLabel || '—'}</div>
                                                <div className="mt-3 text-[15px] text-gray-500 mt-2 font-bold">Next payout: <span className="text-white">{nextPayoutLabel || '—'}</span></div>
                                                {payout_cycle?.timezone && (
                                                    <div className="text-[13px] text-gray-600 mt-3 font-bold uppercase tracking-widest">{payout_cycle.timezone} timezone</div>
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
                                        className="text-left bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 shadow-xl hover:border-purple-500/30 transition-colors relative group"
                                    >
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-gray-400 text-[15px] font-bold uppercase tracking-wider mb-1">Reserve Hold</div>
                                                <div className="text-white text-lg md:text-xl font-bold">
                                                    {(reserve_policy?.effective_percent ?? 0) > 0 ? `${reserve_policy.effective_percent}%` : '0%'}
                                                </div>
                                                <div className="text-[12px] text-gray-500 mt-2 font-bold">
                                                    Funds held: <span className="text-white">{formatCurrency(summary?.held_reserves ?? 0, displayCurrency)}</span>
                                                </div>
                                                {reserve_reason && (
                                                    <div className="text-[12px] text-gray-500 mt-1 font-bold">{reserve_reason}</div>
                                                )}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                                                <ShieldCheckIcon size={18} className="text-purple-300" />
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center px-2 py-2 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-300 text-[12px] font-bold uppercase tracking-wider group-hover:bg-purple-500 group-hover:text-white transition-all">
                                            View Transactions &gt;
                                        </div>
                                    </button>

                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 shadow-xl">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-gray-400 text-[15px] font-bold uppercase tracking-wider mb-1">How Releases Work</div>
                                                <div className="text-white text-sm md:text-base font-bold">Reserves release after 30 days</div>
                                                <div className="text-[14px] text-gray-500 mt-2 font-bold">Held reserves automatically become available for payout once the release date is reached.</div>
                                                {reserve_policy?.onboarding_percent > 0 && reserve_policy?.onboarding_ends_at && (
                                                    <div className="text-[14px] text-gray-500 mt-2 font-bold">
                                                        New creator hold ends: <span className="text-white">{reserve_policy.onboarding_ends_at}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-10 h-10 rounded-full sbg-yellow-500/10 flex items-center justify-center sborder sborder-yellow-500/20">
                                                <HelpCircle size={18} className="text-yellow-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br flex gap-6 from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors shadow-xl">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ShieldCheckIcon size={80} className="text-blue-500" />
                                    </div>
                                    <div className="relative z-10 w-full">
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="text-[16px] uppercase text-gray-500 font-bold mb-1">Expected Next Payout</div>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(summary.payoutable_balance, displayCurrency)}</div>
                                                <div className="text-[15px] text-gray-600 mt-1">
                                                    Paid out every Friday. {summary.carry_over_amount > 0 ? `Includes ${formatCurrency(summary.carry_over_amount, displayCurrency)} from previous tax year.` : ''} {summary.has_adjustment ? 'Includes recovery for previous payouts.' : 'Excludes reserves, unfulfilled tasks & disputes.'}
                                                </div>
                                                {summary.payout_preview?.lines && summary.payout_preview.lines.length > 0 && (
                                                    <div className="mt-4 space-y-1.5 border-t border-gray-800 pt-3">
                                                        {summary.payout_preview.lines.map((line, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-400">{line.label}</span>
                                                                <span className={line.amount >= 0 ? 'text-gray-200' : 'text-red-400'}>
                                                                    {line.amount >= 0 ? '+' : ''}{formatCurrency(line.amount, displayCurrency)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-l border-gray-800 px-4 flex-1">
                                                <div className="text-[16px] uppercase text-gray-500 font-bold mb-1">Pending Fulfillment</div>
                                                <div className="text-2xl font-bold text-yellow-500">{formatCurrency(summary.pending_balance || 0, displayCurrency)}</div>
                                                <div className="text-[15px] text-gray-600 mt-1">Awaiting delivery of tasks or shop items.</div>
                                            </div>
                                            <div className="text-right border-l text-start border-gray-800 pl-4 flex-1">
                                                <div className="text-[16px] uppercase text-gray-500 font-bold mb-1">Status</div>
                                                <div className="inline-block bg-green-500/10 text-green-400 text-[15px] font-bold px-3 py-2 rounded-xl uppercase">Healthy</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Status Breakdown */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { key: 'completed', label: 'Paid', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', inPayout: true, note: 'Included in payout' },
                                        { key: 'pending', label: 'Pending', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', inPayout: false, note: 'Awaiting confirmation' },
                                        { key: 'review_hold', label: 'Review Hold', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', inPayout: false, note: 'Not in payout or reserve' },
                                        { key: 'disputed', label: 'Disputed', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', inPayout: false, note: 'Not in payout or reserve' },
                                        { key: 'refunded', label: 'Refunded', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', inPayout: false, note: 'Deducted from future payout' },
                                    ].map(({ key, label, bg, border, text, inPayout, note }) => {
                                        const s = status_breakdown.find(sb => sb.status === key);
                                        return (
                                            <div key={key} className={`bg-gray-900/40 border-2 ${border} rounded-[25px] overflow-hidden`}>
                                                <div className={`p-4 ${bg} flex flex-col gap-1`}>
                                                    <div className={`text-[16px] font-bold uppercase tracking-widest ${text}`}>{label}</div>
                                                    <div className="text-2xl font-bold text-white">{formatCurrency(s?.total ?? 0, displayCurrency)}</div>
                                                    <div className="text-[15px] text-gray-500">{s?.count ?? 0} payment{(s?.count ?? 0) !== 1 ? 's' : ''}</div>
                                                    <div className={`text-[10px] font-semibold mt-1 ${inPayout ? 'text-green-500' : 'text-gray-500'}`}>
                                                        {inPayout ? '✓ In payout' : `✗ ${note}`}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Payout History */}
                                <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 overflow-hidden shadow-xl">
                                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <WalletIcon className="text-green-400" size={20} />
                                            Payout History
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-500/10">
                                                <tr className="text-gray-500 text-[13px] uppercase font-bold tracking-widest">
                                                    <th className="px-6 py-4">Requested On</th>
                                                    <th className="px-6 py-4">Amount</th>
                                                    <th className="px-6 py-4">Expected Arrival</th>
                                                    <th className="px-6 py-4 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {payout_history.length > 0 ? (
                                                    payout_history.map((p) => (
                                                        <tr key={p.uuid} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 text-[14px] text-gray-200 font-medium">{p.date}</td>
                                                            <td className="px-6 py-4 text-sm font-bold text-white">{formatCurrency(p.amount, p.currency)}</td>
                                                            <td className="px-6 py-4 text-[14px] text-gray-400">
                                                                {p.status === 'failed' ? (
                                                                    <span className="text-red-500 font-bold text-[11px] italic">{p.failure_reason || 'Declined by Stripe'}</span>
                                                                ) : (
                                                                    p.arrival_date || 'Processing…'
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-right">
                                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                                    p.status === 'paid' ? 'bg-green-500/10 text-green-400' : 
                                                                    p.status === 'in_transit' ? 'bg-blue-500/10 text-blue-400' : 
                                                                    p.status === 'failed' ? 'bg-red-500/10 text-red-400' : 
                                                                    'bg-yellow-500/10 text-yellow-400'
                                                                }`}>
                                                                    {p.status === 'in_transit' ? 'In Bank Soon' : p.status?.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">No payouts have been processed yet.</td>
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
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                    {[
                                        { label: `Gross Earnings (${tax_year})`, value: summary.gross_income, icon: <WalletIcon size={80} />, trend: <TrendingUpIcon size={14} className="text-green-400" />, sub: 'Total sent to you by supporters.' },
                                        { label: 'Net Earnings', value: summary.profit, icon: <CircleCheckIcon size={80} className="text-[#05EFB8]" />, color: 'text-[#05EFB8]', sub: 'What you keep after expenses.' },
                                        { label: 'Expenses', value: summary.expenses, icon: <TrendingDownIcon size={80} className="text-red-500" />, color: 'text-red-400', sub: 'Optional costs you track.' },
                                        { label: 'Est. Tax', value: tax_estimate, icon: <Calculator size={80} className="text-yellow-500" />, color: 'text-yellow-400', sub: `Set aside ${formatCurrency(tax_estimate/12, displayCurrency)}/mo` },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-gray-600 transition-colors shadow-xl">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">{stat.icon}</div>
                                            <div className="relative z-10">
                                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                                    {stat.trend || <div className="w-2 h-2 rounded-full bg-current"></div>}
                                                    {stat.label}
                                                </div>
                                                <div className={`text-2xl md:text-3xl font-bold mt-2 ${stat.color || 'text-white'}`}>{formatCurrency(stat.value, displayCurrency)}</div>
                                                <div className="text-[12px] text-gray-500 mt-2 font-bold">{stat.sub}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress & Tips */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                                    <div className="bg-[#1e1e1e] p-6 rounded-[20px] md:rounded-[30px] border border-gray-800 shadow-xl">
                                        <h3 className="text-white font-bold text-normal mb-4 flex items-center gap-2"><TrendingUpIcon size={16} className="text-[#F94F96]" /> Tax Year Progress ({tax_year})</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-normal text-gray-400 mb-1"><span>April 6</span><span>April 5</span></div>
                                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                                {(() => {
                                                    const now = new Date();
                                                    const year = now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6) ? now.getFullYear() - 1 : now.getFullYear();
                                                    const start = new Date(year, 3, 6);
                                                    const end = new Date(year + 1, 3, 5);
                                                    const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                                                    return <div className="bg-gradient-to-r from-[#F94F96] to-[#ff7eb3] h-full rounded-full" style={{ width: `${progress}%` }}></div>;
                                                })()}
                                            </div>
                                            <p className="text-[14px] text-gray-500 mt-2 italic text-center">Tip: High income months? Increase your tax set-aside.</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#1e1e1e] p-6 rounded-[20px] md:rounded-[30px] border border-gray-800 shadow-xl">
                                        <h3 className="text-white font-bold text-normal mb-4 flex items-center gap-2"><TriangleAlertIcon size={16} className="text-yellow-500" /> Financial Health Tip</h3>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-yellow-500/10 p-3 rounded-2xl"><CalculatorIcon size={24} className="text-yellow-500" /></div>
                                            <div>
                                                <p className="text-gray-300 text-normal leading-relaxed">{summary.expenses > (summary.gross_income * 0.3) ? "Your expenses are quite high." : "Your profit margins look healthy."}</p>
                                                <Link href={route('financial.expenses.index')} className="text-[#F94F96] text-[10px] font-bold uppercase mt-2 inline-block hover:underline">Review Expenses</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Chart */}
                                        <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><ChartBarIcon className="text-[#F94F96]" size={20} /> Earnings Trend</h2>
                                                <span className="text-xs text-gray-500 font-medium bg-gray-800 px-3 py-1 rounded-full">{tax_year}</span>
                                            </div>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData}>
                                                        <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F94F96" stopOpacity={0.3}/><stop offset="95%" stopColor="#F94F96" stopOpacity={0}/></linearGradient></defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                        <XAxis dataKey="name" stroke="#d1d5db" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#d1d5db" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                                        <Area type="monotone" dataKey="total" stroke="#F94F96" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Top Supporters */}
                                        <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 shadow-xl overflow-hidden">
                                            <div className="p-6 border-b border-gray-800"><h2 className="text-lg font-bold text-white flex items-center gap-2"><UsersIcon className="text-[#05EFB8]" size={20} /> Top Supporters</h2></div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-500/10"><tr className="text-gray-500 text-[10px] uppercase font-bold tracking-widest"><th className="px-6 py-4">Supporter</th><th className="px-6 py-4 text-right">Total</th></tr></thead>
                                                    <tbody className="divide-y divide-gray-800">
                                                        {top_supporters?.map((s) => (
                                                            <tr key={s.supporter_id} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-6 py-4 text-sm flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                                                        {s.supporter.avatar_url ? <img src={s.supporter.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-400">{s.supporter.name[0]}</span>}
                                                                    </div>
                                                                    <div><div className="text-gray-200 font-medium">{s.supporter.name}</div><div className="text-[14px] text-gray-500">@{s.supporter.username}</div></div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-right font-bold text-white">{formatCurrency(s.total_spent)}</td>
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
                                        <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl">
                                            <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Building2 className="text-gray-400" size={20} /> Business Profile</h2>{!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg"><Pencil size={18} /></button>}</div>
                                            {isEditingProfile ? (
                                                <form onSubmit={submitProfile} className="space-y-4">
                                                    <input type="text" value={data.business_name} onChange={e => setData('business_name', e.target.value)} className="w-full bg-[#2a2a2a] border-gray-700 rounded-lg text-white text-sm p-2.5" placeholder="Business Name" />
                                                    <div className="flex gap-2 justify-end"><button type="button" onClick={() => setIsEditingProfile(false)} className="text-xs font-bold text-gray-500">Cancel</button><button type="submit" className="bg-[#F94F96] text-white text-xs font-bold px-4 py-1.5 rounded-lg">Save</button></div>
                                                </form>
                                            ) : (
                                                <div className="space-y-4"><div><span className="block text-[13px] text-gray-500 uppercase font-bold">Entity Name</span><span className="text-gray-100 font-bold">{profile?.business_name || auth.user.name}</span></div><Link href={route('financial.statement')} className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-[30px] font-bold">Download Tax Statement</Link></div>
                                            )}
                                        </div>

                                        {/* Income Types */}
                                        <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl">
                                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ChartPieIcon className="text-[#F94F96]" size={20} /> Income by Type</h2>
                                            <div className="space-y-3">
                                                {[
                                                    { key: 'Support/Tip', emoji: '💝', color: '#F94F96' },
                                                    { key: 'Wish Gift', emoji: '🛒', color: '#05EFB8' },
                                                    { key: 'Bill', emoji: '📄', color: '#60a5fa' },
                                                    { key: 'Membership', emoji: '⭐', color: '#a78bfa' },
                                                    { key: 'Task', emoji: '✅', color: '#fbbf24' },
                                                    { key: 'Shop Purchase', emoji: '🛍️', color: '#fb923c' },
                                                ].map(({ key, emoji, color }) => {
                                                    const t = analytics?.tribute_types?.find(tt => tt.label === key);
                                                    const percentage = summary.gross_income > 0 ? ((t?.total ?? 0) / summary.gross_income) * 100 : 0;
                                                    return (
                                                        <div key={key} className="bg-gray-800/40 rounded-[20px] p-3 border border-gray-700/50">
                                                            <div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-2"><span className="text-base">{emoji}</span><span className="text-sm font-semibold text-gray-200">{key}</span></div><span className="text-sm font-bold text-white">{formatCurrency(t?.total ?? 0, displayCurrency)}</span></div>
                                                            <div className="w-full bg-gray-700 rounded-full h-1 mb-1.5"><div className="h-1 rounded-full transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} /></div>
                                                            <div className="flex justify-between items-center"><span className="text-[11px] text-gray-500">{t?.count ?? 0} payments</span><span className="text-[11px] font-bold" style={{ color }}>{percentage.toFixed(1)}%</span></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Records */}
                                        <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ScrollTextIcon size={100} className="text-[#F94F96]" /></div>
                                            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2 relative z-10"><ShieldCheckIcon className="text-[#05EFB8]" size={20} /> Tax & Financial Records</h2>
                                            <p className="text-normal text-gray-400 mb-6 leading-relaxed relative z-10">Download statements and payout history.</p>
                                            <div className="space-y-4 relative z-10">
                                                {[
                                                    { label: 'Income Statement', sub: 'For Your Accountant', href: route('financial.statement'), icon: <FileText size={12} className="text-[#F94F96]" /> },
                                                    { label: 'Verified Certificate', sub: 'Proof of Income', href: route('financial.certificate'), icon: <CircleCheckIcon size={12} className="text-[#05EFB8]" /> },
                                                    { label: 'Transaction History', sub: 'Payout Status', href: route('financial.history'), icon: <TrendingUpIcon size={12} className="text-yellow-500" /> },
                                                ].map((item, idx) => (
                                                    <div key={idx} className="group bg-gray-800/40 hover:bg-gray-800 rounded-[20px] md:rounded-[30px] p-4 border border-gray-700/50 transition-all">
                                                        <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-[14px] text-gray-500 uppercase font-bold">{item.sub}</span></div>
                                                        <h4 className="text-normal font-bold text-white mb-3">{item.label}</h4>
                                                        <Link href={item.href} className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-[#F94F96] text-white py-2 rounded-lg text-xs font-bold transition-all">View / Download</Link>
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
        </AuthenticatedLayout>
    );
}