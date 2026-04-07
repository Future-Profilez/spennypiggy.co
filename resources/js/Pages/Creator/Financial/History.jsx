import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FileText, Download, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function History({ auth, transactions }) {
    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
        }).format(Number(amount || 0));
    };

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Financial History" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#A2E4B8] min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fdfbf7] p-6 border-[3px] border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-4">
                        <Link href={route('financial.dashboard')} className="p-3 rounded-xl bg-white border-[3px] border-black hover:bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <ArrowLeft size={24} className="font-black" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-black tracking-widest uppercase">Full History</h1>
                            <p className="text-sm md:text-base text-gray-800 mt-1 font-bold">All income and expenses ledger.</p>
                            <p className="text-xs text-gray-700 mt-1 font-black uppercase">You keep 100% of what you earn. Supporters cover all fees.</p>
                        </div>
                    </div>
                    <a 
                        href={route('financial.export.csv')} 
                        target="_blank"
                        className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-black px-6 py-3 rounded-xl border-[3px] border-black font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </a>
                </div>

                {/* Table */}
                <div className="bg-[#fdfbf7] rounded-3xl border-[3px] border-black overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-yellow-300 border-b-[3px] border-black">
                                <tr className="text-black text-xs md:text-sm uppercase font-black tracking-widest">
                                    <th className="px-6 py-5 border-r-[3px] border-black">Date</th>
                                    <th className="px-6 py-5 border-r-[3px] border-black">Supporter</th>
                                    <th className="px-6 py-5 border-r-[3px] border-black">Description</th>
                                    <th className="px-6 py-5 border-r-[3px] border-black text-right">Earned</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[3px] divide-black">
                                {transactions.data.map((tx) => (
                                    <tr key={tx.uuid} className="hover:bg-yellow-50 transition-colors group">
                                        <td className="px-6 py-5 text-sm font-bold text-gray-800 whitespace-nowrap border-r-[3px] border-black group-hover:text-black">
                                            {new Date(tx.display_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 text-sm border-r-[3px] border-black">
                                            {tx.supporter ? (
                                                <div className="flex flex-col">
                                                    <span className="text-black font-black text-base">{tx.supporter.name}</span>
                                                    <span className="text-[11px] font-bold text-gray-600 uppercase">@{tx.supporter.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 font-bold italic text-xs uppercase">Guest / System</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-sm border-r-[3px] border-black">
                                            <div className="font-black text-base text-black">{tx.description}</div>
                                            <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">
                                                {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-5 text-lg md:text-xl text-right font-black whitespace-nowrap border-r-[3px] border-black ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.type === 'income' ? tx.net_amount : tx.gross_amount, tx.currency)}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                                tx.status === 'completed' ? 'bg-green-400 text-black' : 
                                                tx.status === 'pending' ? 'bg-yellow-300 text-black' : 'bg-red-400 text-black'
                                            }`}>{tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-black font-black uppercase tracking-widest text-lg">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {transactions.last_page > 1 && (
                        <div className="p-6 border-t-[3px] border-black flex justify-center items-center gap-3">
                            {transactions.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-4 py-2 rounded-xl text-sm font-black border-[3px] border-black transition-all ${
                                        link.active 
                                            ? 'bg-pink-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
                                            : link.url 
                                                ? 'bg-white text-black hover:bg-yellow-300 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]' 
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400'
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
