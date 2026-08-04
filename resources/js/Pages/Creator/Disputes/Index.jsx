import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BiArrowBack, BiCheckCircle, BiLock, BiShield } from 'react-icons/bi';

export default function DisputesIndex({ auth, disputes, tickets, queries }) {
    const { props } = usePage();
    const [activeTab, setActiveTab] = useState('disputes');
    const getStatusBadge = (status) => {
        const styles = {
            needs_response: 'bg-red-100 text-red-800 border-red-200',
            warning_needs_response: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            under_review: 'bg-blue-100 text-blue-800 border-blue-200',
            won: 'bg-green-100 text-green-800 border-green-200',
            lost: 'bg-gray-100 text-gray-800 border-gray-200',
            charge_refunded: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        
        const labels = {
            needs_response: 'Action Required',
            warning_needs_response: 'Action Required',
            under_review: 'Under Review',
            won: 'Won',
            lost: 'Lost',
            charge_refunded: 'Refunded',
        };

        return (
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status.replace('_', ' ')}
            </span>
        );
    };

    const ticketBadge = (status) => {
        const styles = {
            awaiting_creator: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            awaiting_supporter: 'bg-blue-100 text-blue-800 border-blue-200',
            escalated: 'bg-red-100 text-red-800 border-red-200',
            refund_initiated: 'bg-green-100 text-green-800 border-green-200',
            refunded: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-gray-100 text-gray-800 border-gray-200',
            resolved: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        const label = String(status || '').replace(/_/g, ' ');
        return (
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {label}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            user={auth.user}
        >
            <Head title="Dispute & Refund Center" />

            <div className="py-12 bg-black min-h-dvh">
                <div className="containerbox">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl text-white uppercase font-gulfs tracking-wide">Dispute & Refund Center</h2>
                            <p className="text-gray-400 mt-1">Handle disputes and refund requests in one place.</p>
                        </div> 
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('disputes')}
                            className={`px-5 py-2 rounded-[20px] text-sm font-black uppercase tracking-widest border-[3px] border-black transition-all flex items-center gap-2 ${
                                activeTab === 'disputes'
                                    ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                                    : 'bg-white text-black hover:bg-yellow-100'
                            }`}
                        >
                            Disputes
                            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">{disputes?.total || 0}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('refunds')}
                            className={`px-5 py-2 rounded-[20px] text-sm font-black uppercase tracking-widest border-[3px] border-black transition-all flex items-center gap-2 ${
                                activeTab === 'refunds'
                                    ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                                    : 'bg-white text-black hover:bg-yellow-100'
                            }`}
                        >
                            Refund Requests
                            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">{props.unresolvedTicketsCount || 0}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('queries')}
                            className={`px-5 py-2 rounded-[20px] text-sm font-black uppercase tracking-widest border-[3px] border-black transition-all flex items-center gap-2 ${
                                activeTab === 'queries'
                                    ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                                    : 'bg-white text-black hover:bg-yellow-100'
                            }`}
                        >
                            Queries
                            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">{props.unresolvedQueriesCount || 0}</span>
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-[#1a1a1a] rounded-[30px]  p-6 border border-gray-800 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Reserved Amount</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {disputes.data.reduce((acc, curr) => curr.status === 'needs_response' || curr.status === 'warning_needs_response' || curr.status === 'under_review' ? acc + curr.amount : acc, 0) / 100} 
                                    <span className="text-sm text-gray-500 ml-1">
                                        {disputes.data[0]?.currency.toUpperCase() || 'GBP'}
                                    </span>
                                </h3>
                            </div>
                            <div className="bg-yellow-500/10 p-4 rounded-full">
                                <BiLock className="text-yellow-500 w-8 h-8" />
                            </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-[30px]  p-6 border border-gray-800 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Dispute Win Rate</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {(() => {
                                        const closed = disputes.data.filter(d => d.status === 'won' || d.status === 'lost');
                                        const won = closed.filter(d => d.status === 'won');
                                        return closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
                                    })()}%
                                </h3>
                            </div>
                            <div className="bg-green-500/10 p-4 rounded-full">
                                <BiShield className="text-green-500 w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-[30px]  p-6 md:p-8 shadow-xl border border-gray-800">
                        {activeTab === 'disputes' && (
                            disputes.data.length === 0 ? (
                                <div className="text-center py-16 flex flex-col items-center justify-center">
                                    <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                                        <BiCheckCircle className="h-16 w-16 text-[#05EFB8]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">No Disputes Found</h3>
                                    <p className="text-gray-400 max-w-md mx-auto">Great job! You have no active disputes. Keep providing excellent content to your supporters.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full whitespace-nowrap">
                                        <thead>
                                            <tr className="text-left border-b border-gray-700">
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Supporter</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Due By</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {disputes.data.map((dispute) => (
                                                <tr key={dispute.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-5 text-sm text-gray-300">
                                                        {new Date(dispute.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm">
                                                        {dispute.payment?.supporter ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                                                                    {dispute.payment.supporter.avatar ? (
                                                                        <img src={dispute.payment.supporter.avatar} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-gray-500">{dispute.payment.supporter.name[0]}</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-white font-medium text-xs">{dispute.payment.supporter.name}</div>
                                                                    <div className="text-gray-500 text-[10px]">@{dispute.payment.supporter.username}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-xs">Unknown / Guest</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-bold text-white">
                                                        {(dispute.amount / 100).toLocaleString('en-GB', { style: 'currency', currency: dispute.currency.toUpperCase() })}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-gray-300 capitalize">
                                                        {dispute.reason ? dispute.reason.replace(/_/g, ' ') : 'General'}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {getStatusBadge(dispute.status)}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-gray-300">
                                                        {dispute.evidence_due_by ? (
                                                            <span className={new Date(dispute.evidence_due_by) < new Date() ? 'text-[#FF007F] font-bold' : ''}>
                                                                {new Date(dispute.evidence_due_by).toLocaleDateString()}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <Link 
                                                            href={route('creator.disputes.show', dispute.id)}
                                                            className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-[#FF007F] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Review & Evidence
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                        
                        {activeTab === 'refunds' && (
                            (tickets?.data || []).length === 0 ? (
                                <div className="text-center py-16 flex flex-col items-center justify-center">
                                    <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                                        <BiCheckCircle className="h-16 w-16 text-[#05EFB8]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">No Refund Requests</h3>
                                    <p className="text-gray-400 max-w-md mx-auto">You have no pending refund requests.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full whitespace-nowrap">
                                        <thead>
                                            <tr className="text-left border-b border-gray-700">
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Supporter</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {(tickets.data || []).map((t) => (
                                                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-5 text-sm text-gray-300">
                                                        {new Date(t.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm">
                                                        {t.supporter ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                                                                    {t.supporter.avatar_url || t.supporter.avatar ? (
                                                                        <img src={t.supporter.avatar_url || t.supporter.avatar} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-gray-500">{t.supporter.name?.[0] || 'S'}</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-white font-medium text-xs">{t.supporter.name}</div>
                                                                    <div className="text-gray-500 text-[10px]">@{t.supporter.username}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-xs">{t.guest_email || 'Guest'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-gray-300 capitalize">{t.type}</td>
                                                    <td className="px-6 py-5">
                                                        {ticketBadge(t.status)}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <Link
                                                            href={route('support.tickets.show', t.uuid)}
                                                            className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-[#FF007F] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Open
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {activeTab === 'queries' && (
                            (queries?.data || []).length === 0 ? (
                                <div className="text-center py-16 flex flex-col items-center justify-center">
                                    <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                                        <BiCheckCircle className="h-16 w-16 text-[#05EFB8]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">No Queries</h3>
                                    <p className="text-gray-400 max-w-md mx-auto">You have no pending contact queries.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full whitespace-nowrap">
                                        <thead>
                                            <tr className="text-left border-b border-gray-700">
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Supporter</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {(queries.data || []).map((t) => (
                                                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-5 text-sm text-gray-300">
                                                        {new Date(t.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm">
                                                        {t.supporter ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                                                                    {t.supporter.avatar_url || t.supporter.avatar ? (
                                                                        <img src={t.supporter.avatar_url || t.supporter.avatar} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-gray-500">{t.supporter.name?.[0] || 'S'}</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-white font-medium text-xs">{t.supporter.name}</div>
                                                                    <div className="text-gray-500 text-[10px]">@{t.supporter.username}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-xs">{t.guest_email || 'Guest'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-gray-300 capitalize">{t.type}</td>
                                                    <td className="px-6 py-5">
                                                        {ticketBadge(t.status)}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <Link
                                                            href={route('support.tickets.show', t.uuid)}
                                                            className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-[#FF007F] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Open
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                        
                        {/* Pagination would go here */}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
