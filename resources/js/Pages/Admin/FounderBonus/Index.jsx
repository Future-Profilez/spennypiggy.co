import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FounderBadge from '@/Components/FounderBadge';
import useHideBottomBar from '@/hooks/useHideBottomBar';
import { 
    FaCrown, 
    FaCheckCircle, 
    FaHourglassHalf, 
    FaTimesCircle, 
    FaSearch, 
    FaSync, 
    FaDownload, 
    FaCheck, 
    FaBan, 
    FaMoneyBillWave,
    FaCalendarAlt,
    FaExclamationTriangle,
    FaCog,
    FaArrowRight
} from 'react-icons/fa';
import PriceFormat from '@/includes/PriceFormat';
import { toast } from 'react-hot-toast';

export default function AdminFounderBonusIndex({ 
    auth, 
    stats, 
    availableMonths = [], 
    initialMonthlyBonuses = [], 
    initialQualificationBonuses = [] 
}) {
    const { formatMultiPrice } = PriceFormat();

    // Active tab: 'monthly' or 'qualification'
    const [activeTab, setActiveTab] = useState('monthly');
    const [bonuses, setBonuses] = useState(activeTab === 'monthly' ? initialMonthlyBonuses : initialQualificationBonuses);
    const [loading, setLoading] = useState(false);
    
    // Pagination & meta
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: (activeTab === 'monthly' ? initialMonthlyBonuses.length : initialQualificationBonuses.length),
    });

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');

    // Trigger loading states
    const [triggeringQual, setTriggeringQual] = useState(false);
    const [triggeringMonthly, setTriggeringMonthly] = useState(false);

    // Modals
    const [selectedBonus, setSelectedBonus] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'approve' | 'reject' | 'mark_paid'
    const [actionReason, setActionReason] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    useHideBottomBar(Boolean(modalMode));

    // Fetch bonuses from API
    const fetchBonuses = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: activeTab,
                page: String(page),
                status: statusFilter,
            });
            if (monthFilter && monthFilter !== 'all') {
                params.append('month', monthFilter);
            }
            if (search.trim()) {
                params.append('search', search.trim());
            }

            const res = await fetch(`/admin/founder/bonuses/data?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load bonus data');
            const data = await res.json();

            setBonuses(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
            });
        } catch (err) {
            toast.error(err.message || 'Error loading bonuses');
        } finally {
            setLoading(false);
        }
    }, [activeTab, statusFilter, monthFilter, search]);

    // Reload when tab or filters change
    useEffect(() => {
        fetchBonuses(1);
    }, [activeTab, statusFilter, monthFilter]);

    // Search submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchBonuses(1);
    };

    // Trigger qualification check
    const handleTriggerQualification = async () => {
        if (triggeringQual) return;
        setTriggeringQual(true);
        try {
            const res = await fetch('/admin/founder/bonuses/trigger-qualification-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Qualification check completed successfully');
                fetchBonuses(pagination.current_page);
            } else {
                toast.error(data.error || 'Failed to trigger qualification check');
            }
        } catch (err) {
            toast.error('Network error triggering qualification check');
        } finally {
            setTriggeringQual(false);
        }
    };

    // Trigger monthly bonus calculation
    const handleTriggerMonthly = async () => {
        if (triggeringMonthly) return;
        setTriggeringMonthly(true);
        try {
            const res = await fetch('/admin/founder/bonuses/trigger-monthly-calculation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Monthly calculation dispatched');
                fetchBonuses(pagination.current_page);
            } else {
                toast.error(data.error || 'Failed to trigger monthly calculation');
            }
        } catch (err) {
            toast.error('Network error triggering monthly calculation');
        } finally {
            setTriggeringMonthly(false);
        }
    };

    // Action handlers
    const openApproveModal = (bonus) => {
        setSelectedBonus(bonus);
        setActionReason('Approved by admin');
        setModalMode('approve');
    };

    const openRejectModal = (bonus) => {
        setSelectedBonus(bonus);
        setActionReason('');
        setModalMode('reject');
    };

    const openMarkPaidModal = (bonus) => {
        setSelectedBonus(bonus);
        setPaymentReference('');
        setActionReason('Manual settlement completed');
        setModalMode('mark_paid');
    };

    const closeModal = () => {
        setSelectedBonus(null);
        setModalMode(null);
        setActionReason('');
        setPaymentReference('');
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBonus || !modalMode || submittingAction) return;

        setSubmittingAction(true);
        const type = selectedBonus.type || activeTab;
        const id = selectedBonus.id;

        try {
            let url = '';
            let body = {};

            if (modalMode === 'approve') {
                url = `/admin/founder/bonuses/${type}/${id}/approve`;
                body = { reason: actionReason };
            } else if (modalMode === 'reject') {
                if (!actionReason.trim()) {
                    toast.error('Rejection reason is required');
                    setSubmittingAction(false);
                    return;
                }
                url = `/admin/founder/bonuses/${type}/${id}/reject`;
                body = { reason: actionReason };
            } else if (modalMode === 'mark_paid') {
                if (!paymentReference.trim()) {
                    toast.error('Payment reference is required');
                    setSubmittingAction(false);
                    return;
                }
                url = `/admin/founder/bonuses/${type}/${id}/mark-paid`;
                body = { 
                    payment_reference: paymentReference.trim(),
                    reason: actionReason.trim()
                };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Action processed successfully');
                closeModal();
                fetchBonuses(pagination.current_page);
            } else {
                toast.error(data.error || 'Failed to process action');
            }
        } catch (err) {
            toast.error('Network error processing action');
        } finally {
            setSubmittingAction(false);
        }
    };

    // CSV export URL
    const getExportUrl = () => {
        const params = new URLSearchParams({
            type: activeTab,
            status: statusFilter,
        });
        if (monthFilter && monthFilter !== 'all') {
            params.append('month', monthFilter);
        }
        return `/admin/founder/bonuses/export?${params.toString()}`;
    };

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Admin - Founder Bonus Management" />

            <div className="min-h-dvh bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-box border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 rounded-box border border-yellow-200">
                                <FounderBadge size="md" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Founder Bonus Management</h1>
                                <p className="text-sm text-black/60 font-medium">
                                    Track qualifications, monthly liabilities, seats, and founder payout settlements
                                </p>
                            </div>
                        </div>

                        {/* Top Action Toolbar */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={handleTriggerQualification}
                                disabled={triggeringQual}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-box-sm text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FaCrown className={triggeringQual ? 'animate-spin' : ''} />
                                {triggeringQual ? 'Checking...' : 'Run Qualification Check'}
                            </button>

                            <button
                                onClick={handleTriggerMonthly}
                                disabled={triggeringMonthly}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-box-sm text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FaMoneyBillWave className={triggeringMonthly ? 'animate-spin' : ''} />
                                {triggeringMonthly ? 'Calculating...' : 'Calculate Monthly Bonuses'}
                            </button>

                            <a
                                href={getExportUrl()}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-box-sm text-xs font-bold transition-colors"
                            >
                                <FaDownload /> Export CSV
                            </a>

                            <Link
                                href="/admin/founder/bonus-settings-page"
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-box-sm text-xs font-bold transition-colors"
                            >
                                <FaCog /> Settings
                            </Link>

                            <Link
                                href="/founder/bonus"
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 rounded-box-sm hover:bg-gray-200 transition-colors"
                            >
                                Leaderboard ↗
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid per Spec Section 4 */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white p-5 rounded-box border border-gray-100">
                                <div className="text-[11px] font-black uppercase tracking-wider text-black/60">Total Founders</div>
                                <div className="text-2xl font-black text-gray-900 mt-1">{stats.total_founders || 0}</div>
                                <div className="text-xs text-black/60 mt-1 font-medium">{stats.seats_remaining || 0} of {stats.max_seats || 150} seats left</div>
                            </div>

                            <div className="bg-white p-5 rounded-box border border-gray-100">
                                <div className="text-[11px] font-black uppercase tracking-wider text-black/60">Potential Liability</div>
                                <div className="text-2xl font-black text-purple-600 mt-1">{formatMultiPrice(stats.potential_monthly_liability || 0, 'GBP')}</div>
                                <div className="text-xs text-purple-700/70 mt-1 font-medium">{stats.current_month_label} run rate</div>
                            </div>

                            <div className="bg-white p-5 rounded-box border border-gray-100">
                                <div className="text-[11px] font-black uppercase tracking-wider text-black/60">Confirmed Liability</div>
                                <div className="text-2xl font-black text-indigo-600 mt-1">{formatMultiPrice(stats.confirmed_monthly_liability || 0, 'GBP')}</div>
                                <div className="text-xs text-indigo-700/70 mt-1 font-medium">{stats.target_month || 'Last month'} checks</div>
                            </div>

                            <div className="bg-white p-5 rounded-box border border-gray-100">
                                <div className="text-[11px] font-black uppercase tracking-wider text-black/60">Total Bonuses Paid</div>
                                <div className="text-2xl font-black text-green-600 mt-1">{formatMultiPrice(stats.total_bonuses_paid || 0, 'GBP')}</div>
                                <div className="text-xs text-green-700/70 mt-1 font-medium">Settled via Stripe/wire</div>
                            </div>

                            <div className="bg-white p-5 rounded-box border border-gray-100 col-span-2 md:col-span-1">
                                <div className="text-[11px] font-black uppercase tracking-wider text-black/60">Pending Settlement</div>
                                <div className="text-2xl font-black text-amber-600 mt-1">{stats.total_pending_payouts || 0}</div>
                                <div className="text-xs text-amber-700/70 mt-1 font-medium">Awaiting review/payout</div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="bg-white rounded-box border border-gray-100 overflow-hidden">
                        
                        {/* Tabs Header */}
                        <div className="border-b border-gray-200 px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex space-x-6">
                                <button
                                    onClick={() => setActiveTab('monthly')}
                                    className={`pb-4 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                                        activeTab === 'monthly'
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span>📅 Monthly Bonuses</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                                        10% Ongoing
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('qualification')}
                                    className={`pb-4 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                                        activeTab === 'qualification'
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span>🏆 30-Day Qualification Bonuses</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                                        Initial
                                    </span>
                                </button>
                            </div>

                            <button
                                onClick={() => fetchBonuses(pagination.current_page)}
                                className="text-xs font-bold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 pb-4 sm:pb-0"
                            >
                                <FaSync className={loading ? 'animate-spin' : ''} /> Refresh Table
                            </button>
                        </div>

                        {/* Filters Bar */}
                        <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        placeholder="Search creator name, email or username..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-box-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                                </div>
                                <button
                                    type="submit"
                                    className="px-3 py-2 bg-gray-900 text-white rounded-box-sm text-xs font-bold hover:bg-black transition-colors"
                                >
                                    Search
                                </button>
                            </form>

                            <div className="flex items-center gap-3">
                                {/* Month Filter */}
                                <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-bold text-gray-600">Month:</span>
                                    <select
                                        value={monthFilter}
                                        onChange={(e) => setMonthFilter(e.target.value)}
                                        className="py-1.5 px-2.5 border border-gray-300 rounded-box-sm text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    >
                                        <option value="all">All Months</option>
                                        {availableMonths.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-bold text-gray-600">Status:</span>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="py-1.5 px-2.5 border border-gray-300 rounded-box-sm text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="paid">Paid</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Bonuses Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-black/60 uppercase text-[11px] font-black tracking-wider border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-3.5">Creator</th>
                                        <th className="px-5 py-3.5">
                                            {activeTab === 'monthly' ? 'Month' : 'Qual Date'}
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            {activeTab === 'monthly' ? 'Monthly Earnings' : 'First 30d Earnings'}
                                        </th>
                                        <th className="px-5 py-3.5 text-right">Bonus Amount</th>
                                        <th className="px-5 py-3.5 text-center">Payout Status</th>
                                        <th className="px-5 py-3.5">Payment Ref / Date</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-500">
                                                <div className="inline-flex items-center gap-2">
                                                    <FaSync className="animate-spin text-indigo-600" />
                                                    <span>Loading records...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : bonuses.length > 0 ? (
                                        bonuses.map((b) => (
                                            <tr key={`${b.type || activeTab}-${b.id}`} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-gray-900">{b.creator?.name || b.creator_name || '—'}</div>
                                                    <div className="text-xs text-black/60">
                                                        {b.creator?.email || b.creator_email}
                                                        {b.creator?.username ? ` · @${b.creator.username}` : ''}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-gray-700">
                                                    <div className="font-semibold">{b.month || b.qualification_date || '—'}</div>
                                                    {b.qualification_date && b.type === 'qualification' && (
                                                        <div className="text-[11px] text-gray-400">Month: {b.month}</div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right font-semibold text-gray-800">
                                                    {formatMultiPrice(b.qualifying_amount || 0, 'GBP')}
                                                </td>

                                                <td className="px-5 py-4 text-right font-bold text-gray-900">
                                                    <div>{formatMultiPrice(b.bonus_amount || 0, 'GBP')}</div>
                                                    {b.referral_multiplier && Number(b.referral_multiplier) > 1.0 && (
                                                        <div className="text-[10px] text-purple-600 font-bold">
                                                            Referral +{Math.round((Number(b.referral_multiplier) - 1.0) * 100)}%
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    {b.payout_status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                                                            <FaCheckCircle className="text-green-600" /> Paid
                                                        </span>
                                                    ) : b.payout_status === 'approved' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                                                            <FaCheck className="text-blue-600" /> Approved
                                                        </span>
                                                    ) : b.payout_status === 'pending' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                                            <FaHourglassHalf className="text-amber-600" /> Pending
                                                        </span>
                                                    ) : (
                                                        <span 
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold"
                                                            title={b.payout_rejection_reason || 'Rejected'}
                                                        >
                                                            <FaTimesCircle className="text-red-600" /> Rejected
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-xs text-gray-600">
                                                    {b.payment_reference ? (
                                                        <div className="font-mono text-[11px] text-gray-800 font-bold truncate max-w-[160px]" title={b.payment_reference}>
                                                            {b.payment_reference}
                                                        </div>
                                                    ) : b.stripe_payout_id ? (
                                                        <div className="font-mono text-[10px] text-gray-500 truncate max-w-[150px]">
                                                            {b.stripe_payout_id}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                    {b.paid_date && (
                                                        <div className="text-[11px] text-gray-500 mt-0.5">Paid {b.paid_date}</div>
                                                    )}
                                                    {b.payout_rejection_reason && (
                                                        <div className="text-[11px] text-red-600 mt-0.5 max-w-[160px] truncate" title={b.payout_rejection_reason}>
                                                            {b.payout_rejection_reason}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        {b.payout_status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => openApproveModal(b)}
                                                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold transition-colors"
                                                                    title="Approve payout"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => openRejectModal(b)}
                                                                    className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-bold transition-colors"
                                                                    title="Reject payout"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {(b.payout_status === 'pending' || b.payout_status === 'approved') && (
                                                            <button
                                                                onClick={() => openMarkPaidModal(b)}
                                                                className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                                                                title="Record payment reference and mark paid"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}

                                                        {b.payout_status === 'paid' && (
                                                            <span className="text-xs text-gray-400 font-semibold px-2 py-1">
                                                                Settled
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-black/60 font-medium">
                                                No founder bonus records found matching filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {pagination.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 bg-gray-50/50">
                                <div>
                                    Showing page <span className="font-bold text-gray-900">{pagination.current_page}</span> of <span className="font-bold text-gray-900">{pagination.last_page}</span> ({pagination.total} total records)
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchBonuses(pagination.current_page - 1)}
                                        disabled={pagination.current_page <= 1}
                                        className="px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => fetchBonuses(pagination.current_page + 1)}
                                        disabled={pagination.current_page >= pagination.last_page}
                                        className="px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </div>

            {/* ACTION MODALS */}

            {/* 1. Approve Modal */}
            {modalMode === 'approve' && selectedBonus && (
                // bottom-bar-safe: useHideBottomBar(Boolean(modalMode)) hides the bar while open
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-box max-w-md w-full p-6 border-2 border-black">
                        <div className="flex items-center gap-3 text-blue-600 mb-4">
                            <FaCheck className="text-2xl" />
                            <h3 className="text-lg font-black text-gray-900">Approve Founder Bonus</h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to approve this bonus for{' '}
                            <span className="font-bold text-gray-900">{selectedBonus.creator?.name || selectedBonus.creator_name}</span>?
                        </p>

                        <div className="bg-gray-50 p-3 rounded-box-sm text-xs space-y-1 mb-4 border border-gray-200">
                            <div><span className="text-gray-500">Bonus Amount:</span> <span className="font-bold text-gray-900">{formatMultiPrice(selectedBonus.bonus_amount, 'GBP')}</span></div>
                            <div><span className="text-gray-500">Period:</span> <span className="font-bold text-gray-900">{selectedBonus.month || selectedBonus.qualification_date}</span></div>
                        </div>

                        <form onSubmit={handleModalSubmit}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Approval Note / Reason
                                </label>
                                <input
                                    type="text"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder="Approved by admin"
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-box-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submittingAction}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-box-sm text-xs font-bold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-box-sm text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submittingAction ? 'Approving...' : 'Confirm Approval'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Reject Modal */}
            {modalMode === 'reject' && selectedBonus && (
                // bottom-bar-safe: useHideBottomBar(Boolean(modalMode)) hides the bar while open
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-box max-w-md w-full p-6 border-2 border-black">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <FaBan className="text-2xl" />
                            <h3 className="text-lg font-black text-gray-900">Reject Founder Bonus Payout</h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                            You are rejecting the bonus payout of{' '}
                            <span className="font-bold text-gray-900">{formatMultiPrice(selectedBonus.bonus_amount, 'GBP')}</span> for{' '}
                            <span className="font-bold text-gray-900">{selectedBonus.creator?.name || selectedBonus.creator_name}</span>.
                        </p>

                        <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-box-sm border border-amber-200 mb-4 flex items-center gap-2">
                            <FaExclamationTriangle /> The creator will receive a rejection notification email detailing next steps.
                        </p>

                        <form onSubmit={handleModalSubmit}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Rejection Reason (Required)
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder="Explain why this payout is rejected (e.g., Stripe verification incomplete, suspicious volume, terms violation)..."
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-box-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submittingAction}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-box-sm text-xs font-bold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className="px-4 py-2 bg-red-600 text-white rounded-box-sm text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                                >
                                    {submittingAction ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Mark Paid Modal */}
            {modalMode === 'mark_paid' && selectedBonus && (
                // bottom-bar-safe: useHideBottomBar(Boolean(modalMode)) hides the bar while open
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-box max-w-md w-full p-6 border-2 border-black">
                        <div className="flex items-center gap-3 text-green-600 mb-4">
                            <FaCheckCircle className="text-2xl" />
                            <h3 className="text-lg font-black text-gray-900">Record Settlement / Mark Paid</h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Record external manual wire or payment reference to mark{' '}
                            <span className="font-bold text-gray-900">{formatMultiPrice(selectedBonus.bonus_amount, 'GBP')}</span> as paid for{' '}
                            <span className="font-bold text-gray-900">{selectedBonus.creator?.name || selectedBonus.creator_name}</span>.
                        </p>

                        <form onSubmit={handleModalSubmit}>
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Payment Reference (Required)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="e.g. BANK-WIRE-99214, CHK-8812, STRIPE-MANUAL-REF..."
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-box-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <span className="text-[11px] text-gray-500">This reference is saved in the audit log for financial reconciliation.</span>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Internal Note / Reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder="Manual wire sent from treasury account"
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-box-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submittingAction}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-box-sm text-xs font-bold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className="px-4 py-2 bg-green-600 text-white rounded-box-sm text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                                >
                                    {submittingAction ? 'Recording...' : 'Mark as Paid'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
