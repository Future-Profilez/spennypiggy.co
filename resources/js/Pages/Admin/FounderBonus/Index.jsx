import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FounderBadge from '@/Components/FounderBadge';
import { FaCrown, FaCheckCircle, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa';
import PriceFormat from '@/includes/PriceFormat';

export default function AdminFounderBonusIndex({ auth, stats, recentBonuses }) {
    const { formatMultiPrice } = PriceFormat();

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Admin - Founder Bonus Management" />

            <div className="min-h-dvh bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-box border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 rounded-box border border-yellow-200">
                                <FounderBadge size="md" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Founder Bonus Management</h1>
                                <p className="text-sm text-black/60 font-medium">Track qualifications, seats, and founder payout settlements</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/founder/bonus"
                                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 rounded-box-sm hover:bg-gray-200 transition-colors"
                            >
                                Public Leaderboard ↗
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-box border border-gray-100 ">
                                <div className="text-[12px] font-black uppercase tracking-wider text-black/60">Total Founders</div>
                                <div className="text-2xl font-black text-gray-900 mt-1">{stats.total_founders || 0}</div>
                                <div className="text-xs text-black/60 mt-1 font-medium">{stats.seats_remaining || 0} of {stats.max_seats || 150} seats left</div>
                            </div>
                            <div className="bg-white p-5 rounded-box border border-gray-100 ">
                                <div className="text-[12px] font-black uppercase tracking-wider text-black/60">Pending Payouts</div>
                                <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending_payouts || 0}</div>
                                <div className="text-xs text-amber-700/70 mt-1 font-medium">Awaiting settlement</div>
                            </div>
                            <div className="bg-white p-5 rounded-box border border-gray-100 ">
                                <div className="text-[12px] font-black uppercase tracking-wider text-black/60">Total Paid</div>
                                <div className="text-2xl font-black text-green-600 mt-1">{formatMultiPrice(stats.total_bonuses_paid || 0, 'GBP')}</div>
                                <div className="text-xs text-green-700/70 mt-1 font-medium">Settled via Stripe</div>
                            </div>
                            <div className="bg-white p-5 rounded-box border border-gray-100 ">
                                <div className="text-[12px] font-black uppercase tracking-wider text-black/60">Qualification Target</div>
                                <div className="text-2xl font-black text-gray-900 mt-1">£{Number(stats.min_earnings || 2500).toLocaleString()}</div>
                                <div className="text-xs text-black/60 mt-1 font-medium">{stats.bonus_percentage || 10}% bonus rate</div>
                            </div>
                        </div>
                    )}

                    {/* Recent Bonuses Table */}
                    <div className="bg-white rounded-box border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Founder Bonus Records</h2>
                        {recentBonuses && recentBonuses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-black/60 uppercase text-[12px] font-black tracking-wider rounded-box-sm">
                                        <tr>
                                            <th className="px-4 py-3">Creator</th>
                                            <th className="px-4 py-3">Month</th>
                                            <th className="px-4 py-3 text-right">Bonus Amount</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium">
                                        {recentBonuses.map((b) => (
                                            <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-900">{b.creator_name || '—'}</div>
                                                    <div className="text-xs text-black/60">{b.creator_email}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{b.month || '—'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    {formatMultiPrice(b.bonus_amount || 0, 'GBP')}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {b.payout_status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                                                            <FaCheckCircle className="text-green-600" /> Paid
                                                        </span>
                                                    ) : b.payout_status === 'pending' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                                            <FaHourglassHalf className="text-amber-600" /> Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                                                            <FaTimesCircle className="text-red-600" /> {b.payout_status || 'Rejected'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-black/60 font-medium">
                                No founder bonus records found.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
