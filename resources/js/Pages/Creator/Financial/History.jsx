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

            <div className="bg-[#A2E4B8] min-h-screen pb-12">
                <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border-[3px] border-black rounded-[32px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <Link href={route('financial.dashboard')} className="p-3 rounded-xl bg-white border-[2px] border-black hover:bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <ArrowLeft size={22} className="stroke-[2.5px]" />
                            </Link>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight leading-none uppercase">FULL HISTORY</h1>
                                <p className="text-sm text-gray-800 mt-1 font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                                    All income and expenses ledger
                                </p>
                                <p className="text-[9px] text-gray-600 mt-1.5 font-black uppercase tracking-[0.15em] bg-gray-100 px-2 py-0.5 rounded-full border-2 border-black inline-block">
                                    You keep 100% • Supporters cover all fees
                                </p>
                            </div>
                        </div>
                        
                        <a 
                            href={route('financial.export.csv')} 
                            target="_blank"
                            className="flex items-center gap-2 bg-[#FF90E8] hover:bg-[#ff7ae4] text-black px-6 py-3 rounded-xl border-[3px] border-black font-black uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                            <Download size={16} className="stroke-[3px]" />
                            <span>Export CSV</span>
                        </a>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-[32px] !overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="overflow-x-auto  ">
                            <table className=" rounded-[45px] w-full text-left border-collapse">
                                <thead className="bg-[#FFE951]  border-b-[3px] border-black">
                                    <tr className="text-black text-[10px] md:text-xs uppercase font-black tracking-widest">
                                        <th className="px-6 py-4 border-r-[2px] border-black">Date</th>
                                        <th className="px-6 py-4 border-r-[2px] border-black">Supporter</th>
                                        <th className="px-6 py-4 border-r-[2px] border-black">Description</th>
                                        <th className="px-6 py-4 border-r-[2px] border-black text-center">Reserve</th>
                                        <th className="px-6 py-4 border-r-[2px] border-black text-right">Earned</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-[2px] divide-black">
                                    {transactions.data.map((tx) => (
                                        <tr key={tx.uuid} className="hover:bg-yellow-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-xs font-bold text-gray-800 whitespace-nowrap border-r-[2px] border-black group-hover:text-black">
                                                {new Date(tx.display_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-xs border-r-[2px] border-black">
                                                {tx.supporter ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-black font-black text-base leading-tight">{tx.supporter.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 tracking-wider">@{tx.supporter.username}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                                        <span className="text-gray-400 font-bold italic text-[10px] uppercase tracking-widest">System</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs border-r-[2px] border-black">
                                                <div className="font-black text-sm text-black leading-tight">{tx.description}</div>
                                                <div className="inline-block mt-1.5 px-1.5 py-0.5 bg-gray-100 border-[1.5px] border-black rounded text-[8px] text-gray-600 font-black uppercase tracking-widest">
                                                    {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs border-r-[2px] border-black text-center">
                                                {tx.reserve_amount > 0 ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border-[1.5px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                                            tx.reserve_status === 'released' ? 'bg-[#90FFB1]' : 'bg-[#90E0FF]'
                                                        }`}>
                                                            {tx.reserve_status === 'released' ? 'Settled' : 'Held'}
                                                        </span>
                                                        <span className="text-[9px] font-black text-gray-500 mt-0.5">{tx.reserve_percent}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 font-black">—</span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-lg md:text-xl text-right font-black whitespace-nowrap border-r-[2px] border-black ${tx.type === 'income' ? 'text-[#00A84E]' : 'text-[#E83F3F]'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.type === 'income' ? tx.net_amount : tx.gross_amount, tx.currency)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border-[1.5px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                                        tx.status === 'completed' ? 'bg-[#90FFB1] text-black' : 
                                                        tx.status === 'review_hold' ? 'bg-[#C590FF] text-black' : 
                                                        tx.status === 'disputed' ? 'bg-[#FFB190] text-black' : 
                                                        tx.status === 'refunded' ? 'bg-[#FF9090] text-black' : 
                                                        tx.status === 'pending' ? 'bg-[#FFE951] text-black' : 
                                                        'bg-gray-300 text-black'
                                                    }`}>{tx.status?.replace('_', ' ')}
                                                    </span>
                                                    {tx.type === 'income' && tx.uuid && !String(tx.uuid).startsWith('exp-') && (
                                                        <a 
                                                            href={route('financial.evidence-pack', { uuid: tx.uuid })} 
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2 py-0.5 bg-white border-[1.5px] border-black rounded-md text-[8px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] flex items-center gap-1"
                                                        >
                                                            <FileText size={10} className="stroke-[2.5px]" />
                                                            Evidence Pack
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.data.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-[3px] border-black border-dashed">
                                                        <FileText size={24} className="text-gray-400" />
                                                    </div>
                                                    <span className="text-black font-black uppercase tracking-[0.15em] text-lg">No transactions found</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Section */}
                        {transactions.last_page > 1 && (
                            <div className="p-6 bg-gray-50 border-t-[3px] border-black flex flex-wrap justify-center items-center gap-3">
                                {transactions.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black border-[2px] border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                                            link.active 
                                                ? 'bg-[#FF90E8] text-black translate-x-[-1px] translate-y-[-1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                                : link.url 
                                                    ? 'bg-white text-black hover:bg-[#FFE951] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        disabled={!link.url}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
