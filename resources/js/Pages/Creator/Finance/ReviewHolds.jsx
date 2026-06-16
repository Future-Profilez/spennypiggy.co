import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ReviewHolds({ holds, auth }) {
    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Review Holds</h2>}
        >
            <Head title="Review Holds" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
                            Review Holds & Disputes
                        </h1>
                        <p className="text-gray-400">
                            These payments have been temporarily flagged by our risk management system or disputed by the cardholder. 
                            They are currently under review by our team to ensure the safety of your account.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-[30px]  border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-800/50 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">Supporter</th>
                                        <th className="px-6 py-4 font-semibold">Amount</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {holds.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-lg font-bold text-white mb-1">All Clear</p>
                                                    <p>You have no payments currently on hold.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        holds.map((hold) => (
                                            <tr key={hold.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                                    {new Date(hold.created_at).toLocaleDateString(undefined, { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {hold.user ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                                {hold.user.avatar_url ? (
                                                                    <img src={hold.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                                                                        {hold.user.name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-200">{hold.user.name}</span>
                                                                <span className="text-xs text-gray-500">@{hold.user.username}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Guest Checkout</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-purple-400">
                                                    {formatCurrency(hold.amount, hold.currency)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {hold.status === 'disputed' ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                            Disputed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                                            Under Review
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}