import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { FileText as FileTextIcon, ChevronRightIcon, ShieldCheckIcon } from 'lucide-react';

export default function LedgerHistoryTable({ transactions, tax_year, active_tab, displayCurrency }) {
    const [filter, setFilter] = useState('all');

    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
        }).format(Number(amount || 0));
    };

    // "Not yet earned" is the server's decision (LedgerRules), shared with the payout
    // engine — so a row can no longer read "Pending delivery" here while the payout run
    // is paying it. The item_status fallback stays for rows served before this shipped.
    const isPending = (tx) =>
        tx.counts_toward_totals === false ||
        (tx.counts_toward_totals === undefined &&
            (tx.status !== 'completed' || (tx.item_status && tx.item_status.endsWith('pending')) || tx.is_grayed_out));

    // One source of truth for a row's payout state — drives both the single badge and the row tint.
    const payoutInfo = (tx) => {
        if (tx.status === 'refunded') return { key: 'refunded', label: 'Refunded', cls: 'bg-red-50 text-red-700 border-red-200' };
        if (tx.status === 'disputed') return { key: 'held', label: 'Disputed', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
        if (tx.status === 'review_hold') return { key: 'held', label: 'Review hold', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
        if (isPending(tx)) return { key: 'pending', label: 'Pending delivery', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (tx.payout_badge === 'paid_out') return { key: 'paid', label: 'Paid out', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (tx.payout_badge === 'this_week') return { key: 'in_payout', label: 'In this payout', cls: 'bg-green-50 text-green-700 border-green-300' };
        let days = 999;
        try { days = (Date.now() - new Date(tx.transaction_date).getTime()) / 86400000; } catch (e) { /* noop */ }
        if (days < 7) return { key: 'pending', label: 'Clearing (7-day hold)', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { key: 'queued', label: 'Queued', cls: 'bg-gray-50 text-black/80 border-gray-200' };
    };

    // Subtle row wash keyed to the payout state, NOT zebra striping — so a creator can scan
    // "green = on its way / paid, amber = waiting, red = reversed" at a glance.
    const rowTint = (key) => {
        switch (key) {
            case 'in_payout': return 'bg-green-50/50';
            case 'paid': return 'bg-white';
            case 'pending': return 'bg-amber-50/40';
            case 'held': return 'bg-orange-50/40';
            case 'refunded': return 'bg-red-50/40';
            default: return 'bg-white';
        }
    };

    const FILTERS = [
        { key: 'all', label: 'All' },
        { key: 'in_payout', label: 'In this payout' },
        { key: 'paid', label: 'Paid out' },
        { key: 'pending', label: 'Waiting' },
        { key: 'refunded', label: 'Refunded' },
    ];

    // Map each row to a coarse filter bucket (held + clearing fold into "waiting").
    const bucketOf = (tx) => {
        const k = payoutInfo(tx).key;
        if (k === 'held') return 'pending';
        return k;
    };

    const counts = useMemo(() => {
        const c = { all: transactions.length, in_payout: 0, paid: 0, pending: 0, refunded: 0 };
        transactions.forEach((tx) => { const b = bucketOf(tx); if (c[b] !== undefined) c[b] += 1; });
        return c;
    }, [transactions]);

    const visible = useMemo(
        () => (filter === 'all' ? transactions : transactions.filter((tx) => bucketOf(tx) === filter)),
        [transactions, filter]
    );

    return (
        <div className="bg-white rounded-box border border-gray-200 overflow-hidden ">
            <div className="p-5 md:p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                    <FileTextIcon className="text-black/60" size={20} />
                    Ledger history {active_tab === 'overview' ? `(${tax_year})` : '(all time)'}
                </h2>
                <Link href={route('financial.history', { year: tax_year?.split('-')[0] })} className="text-[12px] text-[#FF007F] hover:text-[#d83a7c] font-semibold uppercase tracking-wide flex items-center gap-1 group">
                    Full history <ChevronRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Filter chips - answer "what got paid / what's waiting" in one click. */}
            <div className="px-5 md:px-6 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40 ${
                                active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black/80 hover:bg-gray-200'
                            }`}
                        >
                            {f.label}
                            <span className={`ml-1.5 tabular-nums ${active ? 'text-white/60' : 'text-black/60'}`}>{counts[f.key] ?? 0}</span>
                        </button>
                    );
                })}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr className="text-black/60 text-[12px] uppercase font-semibold tracking-wide">
                            <th className="px-5 md:px-6 py-3.5">Supporter</th>
                            <th className="px-5 md:px-6 py-3.5">Activity</th>
                            <th className="px-5 md:px-6 py-3.5 text-right">Amount</th>
                            <th className="px-5 md:px-6 py-3.5 text-right">Payout</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-black/60 text-sm font-medium">
                                    Nothing here yet.
                                </td>
                            </tr>
                        ) : visible.map((tx) => {
                            const pending = isPending(tx);
                            const po = payoutInfo(tx);
                            return (
                                <tr key={tx.uuid} className={`${rowTint(po.key)} hover:bg-gray-50/80 transition-colors`}>
                                    {/* Supporter + when */}
                                    <td className="px-5 md:px-6 py-4 align-top">
                                        {tx.supporter ? (
                                            <Link href={route('user.show', { username: tx.supporter.username })} className="flex flex-col group/supp">
                                                <span className="text-gray-900 font-semibold capitalize group-hover/supp:text-[#FF007F] transition-colors leading-tight">{tx.supporter.name}</span>
                                                <span className="text-[12px] text-black/60 group-hover/supp:text-[#FF007F]/70 transition-colors">@{tx.supporter.username}</span>
                                            </Link>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-semibold capitalize leading-tight">{tx.guest_name || 'Guest'}</span>
                                                {!tx.guest_name && <span className="text-black/60 italic text-[12px]">Guest user</span>}
                                            </div>
                                        )}
                                        <div className="text-[12px] text-black/60 font-medium mt-1.5 tabular-nums">
                                            {new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            <span className="ms-2 text-black/60">{new Date(tx.transaction_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>

                                    {/* What it was - title + one type chip */}
                                    <td className="px-5 md:px-6 py-4 align-top min-w-[220px]">
                                        <div className="font-semibold text-gray-900 line-clamp-2 leading-snug">{tx.description}</div>
                                        <div className="mt-1.5">
                                            <span className={`inline-block whitespace-nowrap text-[12px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${
                                                ['digital', 'instant'].includes(tx.item_type)
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                    : 'bg-blue-50 border-blue-200 text-blue-600'
                                            }`}>
                                                {tx.item_type ? `${tx.item_type} ` : ''}{tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Amount + reserve subline */}
                                    <td className="px-5 md:px-6 py-4 text-right align-top min-w-[160px]">
                                        <div className={`text-[16px] font-bold tabular-nums tracking-tight ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.type === 'income' ? (tx.gross_amount || tx.net_amount) : tx.gross_amount, tx.currency)}
                                        </div>
                                        {/* What the supporter was actually charged. The ledger
                                            only ever showed the creator's own gross, so the
                                            platform's cut was invisible on the one screen a
                                            creator opens to understand their money. */}
                                        {tx.type === 'income' && Number(tx.buyer_paid || 0) > 0 && (
                                            <div className="text-[12px] text-black/60 font-medium mt-1 tabular-nums">
                                                supporter paid {formatCurrency(tx.buyer_paid, tx.currency)}
                                            </div>
                                        )}
                                        {tx.shipping_amount > 0 && (
                                            <div className="text-[12px] text-black/60 font-medium mt-1 tabular-nums">
                                                incl. {formatCurrency(tx.shipping_amount, tx.currency)} shipping
                                            </div>
                                        )}
                                        {tx.reserve_amount > 0 && !pending && (
                                            <div className="text-[12px] font-semibold mt-1 tabular-nums flex items-center justify-end gap-1">
                                                {tx.reserve_status === 'released' ? (
                                                    <span className="text-emerald-600">✓ {formatCurrency(tx.reserve_amount, tx.currency)} reserve settled</span>
                                                ) : (
                                                    <span className="text-cyan-700 flex items-center gap-1">
                                                        <ShieldCheckIcon size={12} /> {tx.reserve_percent}% held · {formatCurrency(tx.reserve_amount, tx.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Single payout badge (+ order status / evidence only when relevant) */}
                                    <td className="px-5 md:px-6 py-4 text-right align-top">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2.5 py-1 whitespace-nowrap rounded-full text-[12px] font-semibold uppercase tracking-wide border ${po.cls}`}>
                                                {po.label}
                                            </span>
                                            {tx.item_status && (
                                                <span className={`px-2 py-0.5 whitespace-nowrap rounded-full text-[12px] font-medium tracking-wide ${
                                                    ['complete', 'delivered', 'accepted'].some((s) => tx.item_status.endsWith(s)) ? 'text-emerald-600' :
                                                    tx.item_status === 'pending' || tx.item_status === 'processing' ? 'text-amber-600' :
                                                    tx.item_status === 'shipped' ? 'text-blue-600' :
                                                    'text-black/60'
                                                }`}>{tx.item_status.replace('_', ' ')}</span>
                                            )}
                                            {tx.type === 'income' && tx.status === 'disputed' && tx.uuid && !String(tx.uuid).startsWith('exp-') && (
                                                <a
                                                    href={route('financial.evidence-pack', { uuid: tx.uuid })}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[12px] font-semibold uppercase tracking-wide text-[#FF007F]/80 hover:text-[#FF007F] transition-colors"
                                                >
                                                    Evidence pack →
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
