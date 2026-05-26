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
        <div className="bg-white rounded-[20px] md:rounded-[30px]  border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileTextIcon className="text-gray-500" size={20} />
                    Ledger History {active_tab === 'overview' ? `(${tax_year})` : '(All Time)'}
                </h2>
                <Link href={route('financial.history', { year: tax_year?.split('-')[0] })} className="text-xs text-[#FF007F] hover:text-[#d83a7c] font-bold uppercase tracking-wider flex items-center gap-1 group">
                    Full History <ChevronRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr className="text-gray-500 text-[11px] uppercase font-bold tracking-widest">
                            <th className="border border-gray-200 px-6 py-4">Supporter</th>
                            <th className="border border-gray-200 px-6 py-4">Description</th>
                            <th className="border border-gray-200 px-6 py-4 text-right">Amount</th>
                            <th className="border border-gray-200 px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {transactions.map((tx, i) => {
                            const isPending = tx.status !== 'completed' || (tx.item_status && tx.item_status.endsWith('pending')) || tx.is_grayed_out;
                            return (
                            <tr key={tx.uuid} className={` border border-gray-200 hover:bg-gray-50 
                            transition-colors 
                            ${isPending ? ' !bg-yellow-200/50' : ''} 
                            ${i % 2 === 0 ? '!bg-green-200/50' : '!bg-green-50/70'}`}
                            >
                                <td className=" border border-gray-200 px-6 py-4 text-sm">
                                    {tx.supporter ? (
                                        <Link href={route('user.show', { username: tx.supporter.username })} className="flex flex-col group/supp">
                                            <span className="text-gray-900 font-bold capitalize group-hover/supp:text-[#FF007F] transition-colors">{tx.supporter.name}</span>
                                            <span className="text-[13px] text-gray-400 group-hover/supp:text-[#FF007F]/70 transition-colors">@{tx.supporter.username}</span>
                                        </Link>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-bold capitalize">{tx.guest_name || 'Guest / System'}</span>
                                            {!tx.guest_name && <span className="text-gray-400 italic text-[13px]">Guest User</span>}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className=" text-gray-700">
                                         {new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                                         <span className='ms-2 text-gray-500'>{new Date(tx.transaction_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                         </span>
                                    </div>
                                </td>
                                <td className=" border border-gray-200 px-6 py-4 text-sm">
                                    <div className="font-bold text-gray-900 line-clamp-2">{tx.description}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* <div className="min-w-[150px] text-[12px] text-gray-400 font-bold uppercase line-clamp-2 tracking-wider">
                                            {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                        </div> */}
                                        {/* {tx.item_type && ( */}
                                            <div className={`whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                                                ['digital', 'instant'].includes(tx.item_type) 
                                                    ? 'bg-green-50 border-green-200 text-green-600' 
                                                    : 'bg-blue-50 border-blue-200 text-blue-600'
                                            }`}>
                                                {tx.item_type} {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                            </div>
                                        {/* // )} */}
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-sm text-right border border-gray-200 min-w-[180px]`}>
                                    <div className={`font-mono font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="text-[16px]">{tx.type === 'income' ? '+' : ''}{formatCurrency(tx.type === 'income' ? (tx.gross_amount || tx.net_amount) : tx.gross_amount, tx.currency)}</span>
                                    </div>
                                    <div className="mt-1.5 space-y-1.5">
                                        {tx.shipping_amount > 0 && (
                                            <div className="text-[10px] text-gray-400 font-bold uppercase italic leading-none">
                                                Incl. {formatCurrency(tx.shipping_amount, tx.currency)} shipping
                                            </div>
                                        )}
                                        {tx.reserve_amount > 0 && !isPending && (
                                            <div className="flex justify-end">
                                                <div className={`flex flex-col items-end gap-0.5 rounded-xl w-fit ${
                                                    tx.reserve_status === 'released'
                                                        ? ' text-green-700'
                                                        : 'text-blue-600'
                                                }`}>
                                                    <div className='flex gap-3'>
                                                        <div className="whitespace-nowrap text-[13px] font-black uppercase flex items-center gap-1.5 tracking-widest">
                                                            {tx.reserve_status === 'released' ? '✓ Settled' : <><ShieldCheckIcon size={12} className="text-yellow-600" /> {tx.reserve_percent}% Held</>}
                                                        </div>
                                                        <div className="whitespace-nowrap text-[13px] font-bold text-gray-900 uppercase tracking-tighter">
                                                            {formatCurrency(tx.reserve_amount, tx.currency)} Reserved
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className=" border border-gray-200 px-6 py-4 text-sm text-right">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`px-2 py-0.5 whitespace-nowrap rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            tx.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                            tx.status === 'review_hold' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                                            tx.status === 'disputed' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                            tx.status === 'refunded' ? 'bg-red-100 text-red-700 border border-red-200' : 
                                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                            tx.status === 'task_pending' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                                            tx.status === 'order_pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}>{tx.status?.replace('_', ' ')}
                                        </span>
                                        {tx.item_status && (
                                            <span className={`px-2 py-0.5 whitespace-nowrap rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                ['complete', 'delivered', 'accepted'].some(s => tx.item_status.endsWith(s)) ? 'text-green-600 bg-green-50 border border-green-100' : 
                                                tx.item_status === 'pending' || tx.item_status === 'processing' ? 'text-yellow-600 bg-yellow-50 border border-yellow-100' :
                                                tx.item_status === 'shipped' ? 'text-blue-600 bg-blue-50 border border-blue-100' :
                                                'text-gray-500 bg-gray-50 border border-gray-100'
                                            }`}>Status: {tx.item_status.replace('_', ' ')}
                                            </span>
                                        )}
                                        {tx.type === 'income' && tx.status === 'disputed' && tx.uuid && !String(tx.uuid).startsWith('exp-') && (
                                            <a 
                                                href={route('financial.evidence-pack', { uuid: tx.uuid })} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] font-bold uppercase tracking-wider text-[#FF007F]/70 hover:text-[#FF007F] transition-colors mt-0.5"
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