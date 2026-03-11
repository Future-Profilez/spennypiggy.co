import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FileText, Download, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function History({ auth, transactions }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Financial History" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('financial.dashboard')} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Full History</h1>
                            <p className="text-sm md:text-base text-gray-400 mt-1">All income and expenses ledger.</p>
                        </div>
                    </div>
                    <a 
                        href={route('financial.export.csv')} 
                        target="_blank"
                        className="flex items-center gap-2 bg-[#F94F96] hover:bg-[#d83a7c] text-white px-5 py-2.5 rounded-xl md:rounded-[30px] font-medium transition-all shadow-lg shadow-pink-500/20"
                    >
                        <Download size={18} />
                        <span>Export All to CSV</span>
                    </a>
                </div>

                {/* Table */}
                <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50">
                                <tr className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Supporter</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {transactions.data.map((tx) => (
                                    <tr key={tx.uuid} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                                            {new Date(tx.display_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {tx.supporter ? (
                                                <div className="flex flex-col">
                                                    <span className="text-gray-200 font-medium">{tx.supporter.name}</span>
                                                    <span className="text-[10px] text-gray-500">@{tx.supporter.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 italic text-xs">Guest / System</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-medium text-gray-200">{tx.description}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase">
                                                {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                            </div>
                                        </td>
                                        <td className={`px-4 md:px-6 py-4 text-sm text-right font-mono font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.gross_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                tx.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                                                tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                                            }`}>{tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {transactions.last_page > 1 && (
                        <div className="p-4 border-t border-gray-800 flex justify-center items-center gap-2">
                            {transactions.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                        link.active 
                                            ? 'bg-[#F94F96] text-white' 
                                            : link.url 
                                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' 
                                                : 'text-gray-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    disabled={!link.url}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}