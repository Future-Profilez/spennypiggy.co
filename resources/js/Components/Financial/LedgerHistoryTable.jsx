import React from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { FileText as FileTextIcon, ChevronRightIcon, ShieldCheckIcon } from 'lucide-react';

export default function LedgerHistoryTable({ transactions, tax_year, active_tab, displayCurrency }) {
    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
        }).format(Number(amount || 0));
    };

    return (
        <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileTextIcon className="text-gray-400" size={20} />
                    Ledger History {active_tab === 'overview' ? `(${tax_year})` : '(All Time)'}
                </h2>
                <Link href={route('financial.history', { year: tax_year?.split('-')[0] })} className="text-xs text-[#F94F96] hover:text-[#d83a7c] font-bold uppercase tracking-wider flex items-center gap-1 group">
                    Full History <ChevronRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-500/10">
                        <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-widest">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Supporter</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {transactions.map((tx) => {
                            const isPending = tx.status !== 'completed' || (tx.item_status && tx.item_status.endsWith('pending')) || tx.is_grayed_out;
                            return (
                            <tr key={tx.uuid} className={`hover:bg-white/5 transition-colors ${isPending ? 'opacity-40 grayscale-[0.4]' : ''}`}>
                                <td className="px-6 py-4 text-[14px] text-gray-400 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-300">{new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                        <span className="text-[11px] text-gray-500 font-medium">{new Date(tx.transaction_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {tx.supporter ? (
                                        <div className="flex flex-col">
                                            <span className="text-gray-200 font-bold capitalize">{tx.supporter.name}</span>
                                            <span className="text-[13px] text-gray-500">@{tx.supporter.username}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 italic text-[14px] capitalize">Guest / System</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="font-bold text-gray-200 line-clamp-2">{tx.description}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="text-[12px] text-gray-500 font-bold uppercase line-clamp-1 tracking-wider">
                                            {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                        </div>
                                    </div>
                                </td>
                                <td className={`px-4 md:px-6 py-4 text-sm text-right font-mono font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-[#05EFB8]' : 'text-red-400'}`}>
                                    <span className="text-[15px]">{tx.type === 'income' ? '+' : ''}{formatCurrency(tx.type === 'income' ? (tx.gross_amount || tx.net_amount) : tx.gross_amount, tx.currency)}</span>
                                    <div className="mt-2 flex justify-end">
                                        {tx.shipping_amount > 0 && (
                                            <div className="text-[10px] text-gray-500 font-bold uppercase italic text-right mb-1">
                                                Incl. {formatCurrency(tx.shipping_amount, tx.currency)} shipping
                                            </div>
                                        )}
                                        {tx.reserve_amount > 0 && ['completed', 'review_hold'].includes(tx.status) && (
                                        
                                        <div className={`flex text-center gap-0.5 px-3 py-1.5 rounded-xl border w-fit ${
                                            tx.reserve_status === 'released'
                                                ? 'bg-green-500/5 border-green-500/20 text-green-500'
                                                : 'bg-[#182333] border-[#253246] text-[#60A5FA]'
                                        }`}>
                                            <span className="text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 tracking-wider">
                                                {tx.reserve_status === 'released' ? '✓ Reserve Settled' : <><ShieldCheckIcon size={12} className="text-[#Facc15]" /> {tx.reserve_percent}% Reserved</>}
                                            </span>
                                            <span className="text-[10px] font-semibold text-gray-400">
                                                {formatCurrency(tx.reserve_amount, tx.currency)} of your earnings
                                            </span>
                                        </div>
                                    )}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`px-2 py-0.5 whitespace-nowrap rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            tx.status === 'completed' ? 'bg-[#05EFB8]/10 text-[#05EFB8] border border-[#05EFB8]/20' : 
                                            tx.status === 'review_hold' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                                            tx.status === 'disputed' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                                            tx.status === 'refunded' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                            tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                                            tx.status === 'task_pending' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                            tx.status === 'order_pending' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                        }`}>{tx.status?.replace('_', ' ')}
                                        </span>
                                        {tx.item_status && (
                                            <span className={`px-2 py-0.5 whitespace-nowrap rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                tx.item_status.endsWith('completed') || tx.item_status.endsWith('delivered') || tx.item_status.endsWith('accepted') ? 'text-[#05EFB8]' : 
                                                tx.item_status.startsWith('task') ? 'text-blue-400' : 
                                                tx.item_status.startsWith('order') ? 'text-orange-400' :
                                                'text-gray-400'
                                            }`}>Item: {tx.item_status.replace('_', ' ')}
                                            </span>
                                        )}
                                        {tx.type === 'income' && tx.uuid && !String(tx.uuid).startsWith('exp-') && (
                                            <a 
                                                href={route('financial.evidence-pack', { uuid: tx.uuid })} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] font-bold uppercase tracking-wider text-[#F94F96]/70 hover:text-[#F94F96] transition-colors mt-0.5"
                                            >
                                                Evidence Pack
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}