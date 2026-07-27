import React, { useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { 
    DownloadIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon
} from "@animateicons/react/lucide";
import { ArrowLeftIcon, FileTextIcon } from "lucide-react";


export default function History({ auth, transactions }) {
    const downloadIconRef = useRef(null);
    const backIconRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            downloadIconRef.current?.startAnimation?.();
            backIconRef.current?.startAnimation?.();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
        }).format(Number(amount || 0));
    };

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Financial History" />

            <div className="bg-[#A2E4B8] min-h-dvh pb-12">
                <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border-[3px] border-black rounded-[32px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <Link 
                                href={route('financial.dashboard')} 
                                className="p-3 rounded-xl bg-white border-[2px] border-black hover:bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                onMouseEnter={() => backIconRef.current?.startAnimation()} >
                                <ArrowLeftIcon ref={backIconRef} size={22} duration={1.5} />
                            </Link>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-none uppercase">FULL HISTORY</h1>
                                <p className="text-sm text-gray-800 mt-1 font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[#FF007F] rounded-full"></span>
                                    All income and expenses ledger
                                </p>
                                <p className="text-[12px] text-gray-600 mt-1.5 font-black uppercase tracking-[0.15em] bg-gray-100 px-2 py-0.5 rounded-full border-2 border-black inline-block">
                                    You keep 100% • Supporters cover all fees
                                </p>
                            </div>
                        </div>
                        
                        <a 
                            href={route('financial.export.csv')} 
                            target="_blank"
                            className="flex items-center gap-2 bg-[#FF90E8] hover:bg-[#ff7ae4] text-black px-6 py-3 rounded-xl border-[3px] border-black font-black uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            onMouseEnter={() => downloadIconRef.current?.startAnimation()}
                        >
                            <DownloadIcon ref={downloadIconRef} size={16} duration={1.5} />
                            <span>Export CSV</span>
                        </a>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white border-[1px] border-black rounded-[32px] !overflow-hidden ">
                        <div className="overflow-x-auto  ">
                            <table className=" rounded-[45px] w-full text-left border-collapse">
                                <thead className="bg-[#FFE951]  border-b-[3px] !border-r-[2px] !border-l-0 !border-t-0 border-black">
                                    <tr className="text-black text-[10px]   !border-l-0 !border-t-0 md:text-xs uppercase font-black tracking-widest">
                                        <th className="px-6 py-4 border-r-[2px] !border-r-2 !border-l-0 !border-t-0 border-black">Date</th>
                                        <th className="px-6 py-4 border-r-[2px]  !border-l-0 !border-t-0 border-black">Supporter</th>
                                        <th className="px-6 py-4 border-r-[2px] !border-l-0 !border-t-0 border-black">Description</th>
                                        <th className="px-6 py-4 border-r-[2px]  !border-l-0 !border-t-0 border-black text-center">Reserve</th>
                                        <th className="px-6 py-4 border-r-[2px] !border-r-0 !border-l-0 !border-t-0 border-black text-right">Earned</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-[2px] divide-black">
                                    {transactions.data.map((tx) => (
                                        <TransactionRow key={tx.uuid} tx={tx} formatCurrency={formatCurrency} />
                                    ))}
                                    {transactions.data.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-[3px] border-black border-dashed">
                                                        <FileTextIcon size={24} className="text-gray-400" />
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
                                    <PaginationLink key={i} link={link} index={i} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

const TransactionRow = ({ tx, formatCurrency }) => {
    const iconRef = useRef(null);
    const isPending = tx.status !== 'completed' || (tx.item_status && tx.item_status.endsWith('pending')) || tx.is_grayed_out;

    const getPayoutStage = (tx) => {
        if (tx.status === 'review_hold') return { label: 'Review Hold', tone: 'purple', title: 'Payments temporarily reviewed for fraud prevention, safety or compliance checks.' };
        if (tx.status === 'disputed') return { label: 'Disputed', tone: 'orange', title: 'Removed from payout balance until dispute is resolved.' };
        if (tx.status === 'refunded') return { label: 'Refunded', tone: 'red', title: 'Removed from payout balance.' };
        if (tx.status !== 'completed' || (tx.item_status && tx.item_status.endsWith('pending')) || tx.is_grayed_out) {
            return { label: 'Pending Completion', tone: 'yellow', title: 'Waiting for tasks or shop items to be completed.' };
        }

        try {
            const txDate = new Date(tx.transaction_date || tx.display_date);
            const days = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24);
            if (days < 7) {
                return { label: 'Pending (Clearing)', tone: 'yellow', title: 'Payment received. Clearing for 7 days before it becomes available for Friday payout.' };
            }
        } catch (e) {
        }

        return null;
    };

    const payoutStage = getPayoutStage(tx);

    useEffect(() => {
        if (tx.type === 'income' && tx.uuid && !String(tx.uuid).startsWith('exp-')) {
            const startLoop = () => {
                iconRef.current?.startAnimation?.();
                const nextDelay = 5000 + Math.random() * 5000;
                return setTimeout(startLoop, nextDelay);
            };
            const initialDelay = 2000 + Math.random() * 5000;
            const initialTimeout = setTimeout(startLoop, initialDelay);
            return () => clearTimeout(initialTimeout);
        }
    }, [tx.uuid, tx.type]);

    return (
        <tr className={`hover:bg-yellow-50/50 transition-colors group ${isPending ? 'opacity-30 grayscale-[0.4]' : ''}`}>
            <td className="px-6 py-4 text-xs font-bold text-gray-800 whitespace-nowrap border-r-[2px] border-black group-hover:text-black">
                <div className="flex flex-col">
                    <span>{new Date(tx.display_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-[10px] text-gray-500 font-black">{new Date(tx.display_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-xs border-r-[2px] border-black">
                {tx.supporter ? (
                    <div className="flex flex-col">
                        <span className="text-black font-black text-base leading-tight capitalize">{tx.supporter.name}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 tracking-wider">@{tx.supporter.username}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-600 font-bold italic text-[13px] uppercase tracking-widest">Guest User</span>
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-xs border-r-[2px] border-black">
                <div className="font-black text-sm text-black leading-tight">{tx.description}</div>
                <div className="inline-block mt-1.5 px-1.5 py-0.5 bg-gray-100 border-[1.5px] border-black rounded text-[8px] text-gray-600 font-black uppercase tracking-widest">
                    {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                </div>
                {tx.payout_badge === 'this_week' && (
                    <div className="inline-block mt-1.5 ml-1.5 px-2 py-0.5 bg-[#FFE951] border-[1.5px] border-black rounded text-[8px] text-black font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        In this week's payout
                    </div>
                )}
                {tx.payout_badge === 'paid_out' && (
                    <div className="inline-block mt-1.5 ml-1.5 px-2 py-0.5 bg-[#90FFB1] border-[1.5px] border-black rounded text-[8px] text-black font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        Paid out
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-xs border-r-[2px] border-black text-center">
                {tx.reserve_amount > 0 ? (
                    <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border-[1.5px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            tx.reserve_status === 'released' ? 'bg-[#90FFB1]' : 'bg-[#90E0FF]'
                        }`}>
                            {tx.reserve_status === 'released' ? 'Settled' : 'Held'}
                        </span>
                        <span className="text-[10px] font-black text-gray-800">{tx.reserve_percent}%</span>
                        <span className="text-[9px] font-bold text-gray-500">
                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: tx.currency || 'GBP' }).format(tx.reserve_amount)}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">of your amount</span>
                    </div>
                ) : (
                    <span className="text-gray-300 font-black">—</span>
                )}
            </td>
            <td className={`px-6 py-4 text-lg md:text-xl text-right font-black whitespace-nowrap border-r-[2px] border-black ${tx.type === 'income' ? 'text-[#00A84E]' : 'text-[#E83F3F]'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.type === 'income' ? (tx.gross_amount || tx.net_amount) : tx.gross_amount, tx.currency)}
                {tx.shipping_amount > 0 && (
                    <div className="text-[9px] text-gray-500 font-black uppercase italic mt-1">
                        Incl. {formatCurrency(tx.shipping_amount, tx.currency)} shipping
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-xs text-center">
                <div className="flex flex-col items-center gap-2">
                    {tx.status && (
                        <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border-[1.5px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            tx.status === 'completed' ? 'bg-[#90FFB1] text-black' : 
                            tx.status === 'pending' ? 'bg-[#FFE951] text-black' : 
                            tx.status === 'review_hold' ? 'bg-[#C590FF] text-black' :
                            tx.status === 'disputed' ? 'bg-[#FFB190] text-black' :
                            tx.status === 'refunded' ? 'bg-[#FF9090] text-black' :
                            'bg-gray-300 text-black'
                        }`}>{tx.status.replace('_', ' ')}
                        </span>
                    )}
                    {payoutStage && (
                        <span
                            title={payoutStage.title}
                            className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] border-[1px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                payoutStage.tone === 'purple' ? 'bg-[#C590FF] text-black' :
                                payoutStage.tone === 'orange' ? 'bg-[#FFB190] text-black' :
                                payoutStage.tone === 'red' ? 'bg-[#FF9090] text-black' :
                                'bg-[#FFE951] text-black'
                            }`}
                        >
                            Payout: {payoutStage.label}
                        </span>
                    )}
                    {tx.item_status && (
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] border-[1px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            ['complete', 'delivered', 'accepted'].some(s => tx.item_status.endsWith(s)) ? 'bg-[#90FFB1] text-black' : 
                            tx.item_status === 'shipped' ? 'bg-[#90E0FF] text-black' :
                            'bg-[#FFE951] text-black'
                        }`}>
                            Status: {tx.item_status.replace('_', ' ')}
                        </span>
                    )}
                    {tx.type === 'income' && tx.uuid && !String(tx.uuid).startsWith('exp-') && (
                        <a 
                            href={route('financial.evidence-pack', { uuid: tx.uuid })} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-white border-[1.5px] border-black rounded-md text-[8px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] flex items-center gap-1 group/evidence"
                            onMouseEnter={() => iconRef.current?.startAnimation?.()}
                        >
                            <FileTextIcon ref={iconRef} size={10} duration={1.2} />
                            Evidence Pack
                        </a>
                    )}
                </div>
            </td>
        </tr>
    );
};

const PaginationLink = ({ link, index }) => {
    const iconRef = useRef(null);
    
    useEffect(() => {
        if (link.url) {
            const interval = setInterval(() => {
                iconRef.current?.startAnimation?.();
            }, 6000);
            return () => clearInterval(interval);
        }
    }, [link.url]);

    return (
        <Link
            href={link.url || '#'}
            className={`px-4 py-2 rounded-xl text-[10px] font-black border-[2px] border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 ${
                link.active 
                    ? 'bg-[#FF90E8] text-black translate-x-[-1px] translate-y-[-1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                    : link.url 
                        ? 'bg-white text-black hover:bg-[#FFE951] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none'
            }`}
            onMouseEnter={() => iconRef.current?.startAnimation?.()}
        >
            {link.label.includes('Previous') ? (
                <ChevronLeftIcon ref={iconRef} size={14} duration={1.2} />
            ) : link.label.includes('Next') ? (
                <ChevronRightIcon ref={iconRef} size={14} duration={1.2} />
            ) : null}
            <span dangerouslySetInnerHTML={{ __html: link.label.replace('Previous', '').replace('Next', '') }} />
        </Link>
    );
};
