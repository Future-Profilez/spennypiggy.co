import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BiError, BiCheckCircle, BiTime, BiFile } from 'react-icons/bi';

export default function DisputesIndex({ auth, disputes }) {
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

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Disputes" />

            <div className="py-12 bg-black min-h-screen">
                <div className="containerbox">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white uppercase font-gulfs tracking-wide">Disputes Center</h2>
                            <p className="text-gray-400 mt-1">Manage and respond to payment disputes.</p>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-[40px] p-6 md:p-8 shadow-xl border border-gray-800">
                        {disputes.data.length === 0 ? (
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
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Due By</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {disputes.data.map((dispute) => (
                                            <tr key={dispute.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5 text-sm text-gray-300">
                                                    {new Date(dispute.created_at).toLocaleDateString()}
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
                                                        <span className={new Date(dispute.evidence_due_by) < new Date() ? 'text-[#F94F96] font-bold' : ''}>
                                                            {new Date(dispute.evidence_due_by).toLocaleDateString()}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium">
                                                    <Link 
                                                        href={route('creator.disputes.show', dispute.id)}
                                                        className="inline-flex items-center justify-center px-4 py-2 bg-white text-black font-bold rounded-full text-xs uppercase tracking-wide hover:bg-[#05EFB8] transition-all duration-200 transform group-hover:scale-105"
                                                    >
                                                        View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {/* Pagination would go here */}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
