import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
    initiated:          { label: 'Initiated',         color: 'bg-gray-100 text-gray-700' },
    paid:               { label: 'Paid',               color: 'bg-blue-100 text-blue-700' },
    assigned:           { label: 'Assigned',           color: 'bg-indigo-100 text-indigo-700' },
    pending_review:     { label: 'Pending Review',     color: 'bg-yellow-100 text-yellow-800' },
    rejected_once:      { label: 'Rejected Once',      color: 'bg-orange-100 text-orange-700' },
    running_late:       { label: 'Running Late',       color: 'bg-orange-200 text-orange-800' },
    escalated:          { label: '⚠️ Escalated',       color: 'bg-red-100 text-red-700 font-bold' },
    completed:          { label: 'Completed',          color: 'bg-green-100 text-green-700' },
    completed_accepted: { label: 'Accepted',           color: 'bg-green-200 text-green-800' },
    paid_out:           { label: 'Paid Out',           color: 'bg-green-300 text-green-900' },
    refunded:           { label: 'Refunded',           color: 'bg-red-200 text-red-800' },
    expired:            { label: 'Expired',            color: 'bg-gray-200 text-gray-600' },
    sla_missed:         { label: 'SLA Missed',         color: 'bg-red-50 text-red-600' },
};

function ProofModal({ proof, onClose }) {
    if (!proof) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Submitted Proof</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl leading-none">&times;</button>
                </div>
                {proof.text && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">{proof.text}</div>
                )}
                {proof.file && (
                    <div className="mt-2">
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(proof.file) ? (
                            <img src={proof.file} alt="Proof" className="max-w-full rounded-lg border" />
                        ) : (
                            <a href={proof.file} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800">
                                View Proof File
                            </a>
                        )}
                    </div>
                )}
                {!proof.text && !proof.file && (
                    <p className="text-gray-400 text-sm italic">No proof content available.</p>
                )}
            </div>
        </div>
    );
}

function ResolveModal({ purchase, onClose, onDone }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const resolve = (action) => {
        setLoading(true);
        setError(null);
        router.post(route('admin.tasks.resolve', purchase.uuid), { action }, {
            preserveScroll: true,
            onSuccess: () => { onDone(); onClose(); },
            onError: (e) => { setError(Object.values(e)[0]); setLoading(false); },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-2">Resolve Escalated Task</h3>
                <p className="text-sm text-gray-600 mb-1"><strong>Task:</strong> {purchase.task_title}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Creator:</strong> @{purchase.creator_username}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Supporter:</strong> @{purchase.supporter_username}</p>
                <p className="text-sm text-gray-600 mb-4"><strong>Amount:</strong> {purchase.currency_symbol}{purchase.amount}</p>

                {purchase.rejection_reason && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                        <strong>Rejection reason:</strong> {purchase.rejection_reason}
                    </div>
                )}

                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => resolve('refund')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        <XCircle size={18} />
                        Refund<br/><span className="text-xs font-normal">Gifter wins</span>
                    </button>
                    <button
                        onClick={() => resolve('release')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        <CheckCircle size={18} />
                        Release<br/><span className="text-xs font-normal">Creator wins</span>
                    </button>
                </div>

                {loading && <p className="text-center text-sm text-gray-500 mt-3">Processing...</p>}
                <button onClick={onClose} className="mt-3 w-full text-gray-400 text-sm hover:text-black">Cancel</button>
            </div>
        </div>
    );
}

export default function AdminTasksIndex({ auth, purchases, statusCounts, filters }) {
    const [proofModal, setProofModal]     = useState(null);
    const [resolveModal, setResolveModal] = useState(null);
    const { data, setData, get, processing } = useForm({
        status: filters.status || '',
        type:   filters.type   || '',
        search: filters.search || '',
    });

    const applyFilters = (e) => {
        e?.preventDefault();
        get(route('admin.tasks.index'), { preserveScroll: true, preserveState: true });
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const allStatuses = Object.keys(STATUS_CONFIG);

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Admin — Task Orders" />

            {proofModal   && <ProofModal   proof={proofModal}   onClose={() => setProofModal(null)} />}
            {resolveModal && <ResolveModal purchase={resolveModal} onClose={() => setResolveModal(null)} onDone={() => router.reload()} />}

            <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Task Orders</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage all task purchases — view proof, refund or release escalated orders</p>
                    </div>
                    <button onClick={() => router.reload()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 border border-gray-700">
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {/* Status summary chips */}
                <div className="flex flex-wrap gap-2">
                    {allStatuses.map(s => {
                        const count = statusCounts[s] ?? 0;
                        if (count === 0) return null;
                        const cfg = STATUS_CONFIG[s];
                        return (
                            <button key={s}
                                onClick={() => { setData('status', data.status === s ? '' : s); }}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${data.status === s ? 'ring-2 ring-white' : ''} ${cfg.color}`}>
                                {cfg.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <form onSubmit={applyFilters} className="flex flex-wrap gap-3 bg-gray-900 p-4 rounded-2xl border border-gray-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search task, creator, supporter..."
                            value={data.search}
                            onChange={e => setData('search', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                        />
                    </div>
                    <select value={data.status} onChange={e => setData('status', e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500">
                        <option value="">All Statuses</option>
                        {allStatuses.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                    </select>
                    <select value={data.type} onChange={e => setData('type', e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500">
                        <option value="">All Types</option>
                        <option value="instant">Instant</option>
                        <option value="timed">Timed</option>
                    </select>
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                        Filter
                    </button>
                </form>

                {/* Table */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-4">Task</th>
                                    <th className="px-5 py-4">Creator</th>
                                    <th className="px-5 py-4">Supporter</th>
                                    <th className="px-5 py-4">Type</th>
                                    <th className="px-5 py-4 text-right">Amount</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">SLA / Dates</th>
                                    <th className="px-5 py-4 text-center">Proof</th>
                                    <th className="px-5 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {purchases.data.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="px-5 py-12 text-center text-gray-500">No task orders found.</td>
                                    </tr>
                                )}
                                {purchases.data.map((p) => {
                                    const cfg = STATUS_CONFIG[p.status] || { label: p.status, color: 'bg-gray-100 text-gray-700' };
                                    const isEscalated = p.status === 'escalated';
                                    const hasProof = p.proof_content && (p.proof_content.text || p.proof_content.file);

                                    return (
                                        <tr key={p.uuid} className={`hover:bg-gray-800/40 transition-colors ${isEscalated ? 'bg-red-900/10 border-l-2 border-red-500' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-white max-w-[160px] truncate" title={p.task_title}>{p.task_title}</div>
                                                <div className="text-[11px] text-gray-500 mt-0.5">{formatDate(p.created_at)}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-gray-200 font-medium">{p.creator_name}</div>
                                                <div className="text-[11px] text-gray-500">@{p.creator_username}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-gray-200 font-medium">{p.supporter_name}</div>
                                                <div className="text-[11px] text-gray-500">@{p.supporter_username}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${p.task_type === 'instant' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                    {p.task_type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-white whitespace-nowrap">
                                                {p.currency_symbol}{parseFloat(p.amount).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {p.rejection_count > 0 && (
                                                    <div className="text-[10px] text-orange-400 mt-1">{p.rejection_count} rejection{p.rejection_count > 1 ? 's' : ''}</div>
                                                )}
                                                {isEscalated && p.rejection_reason && (
                                                    <div className="text-[10px] text-red-400 mt-1 max-w-[140px] truncate" title={p.rejection_reason}>
                                                        "{p.rejection_reason}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-[11px] text-gray-400">
                                                {p.task_type === 'timed' && p.sla_deadline ? (
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        <span>{formatDate(p.sla_deadline)}</span>
                                                    </div>
                                                ) : p.completed_at ? (
                                                    <div className="flex items-center gap-1 text-green-400">
                                                        <CheckCircle size={11} />
                                                        <span>{formatDate(p.completed_at)}</span>
                                                    </div>
                                                ) : '—'}
                                                {p.refunded_at && (
                                                    <div className="text-red-400 mt-0.5">Refunded: {formatDate(p.refunded_at)}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {hasProof ? (
                                                    <button
                                                        onClick={() => setProofModal(p.proof_content)}
                                                        className="flex items-center gap-1 mx-auto px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[11px] font-bold hover:bg-indigo-500/20 transition-all"
                                                    >
                                                        <Eye size={12} /> View Proof
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-600 text-[11px]">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {isEscalated ? (
                                                    <button
                                                        onClick={() => setResolveModal(p)}
                                                        className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-bold hover:bg-red-500/20 transition-all"
                                                    >
                                                        <AlertTriangle size={12} /> Resolve
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-700 text-[11px]">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {purchases.last_page > 1 && (
                        <div className="p-4 border-t border-gray-800 flex justify-center gap-2 flex-wrap">
                            {purchases.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        link.active ? 'bg-pink-500 text-white' :
                                        link.url    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' :
                                        'bg-gray-900 text-gray-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
