// resources/js/Pages/membership/Membership_dashboard.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import ChartDashboard from "./ChartDashboard";
import Avatar from "../../Components/Avatar";

export default function Membership_dashboard(props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        members: 0,
        per_month: 0,
        all_time: 0,
        payments: [],
        currency: "£", // Add default currency
    });

    // Change the API endpoint from /membership/dashboard to /membership/api/dashboard
    const fetchdata = () => {
        setLoading(true);
        axios
            .get(`/membership/api/dashboard`) // ← Updated URL
            .then((res) => {
                // Extract currency from first payment if available
                const responseData = res.data.data;
                if (
                    responseData.payments &&
                    responseData.payments.length > 0 &&
                    responseData.payments[0].currency
                ) {
                    responseData.currency = responseData.payments[0].currency;
                }
                setData(responseData);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchdata();
    }, []);

    const { auth } = props;

    // Get the currency from data or from first payment or default to £
    const displayCurrency =
        data.currency ||
        (data.payments &&
            data.payments.length > 0 &&
            data.payments[0].currency) ||
        "£";

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={"Membership Dashboard"} />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                        {/* Header Section */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                                Membership Dashboard
                            </h1>
                            <p className="text-slate-400 mt-1 text-sm">
                                Track your earnings and manage your community
                            </p>
                        </div>

                        {/* Stats Grid - Compact Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {/* Total Members Card */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-pink-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-lg">
                                        👥
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                        Active
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {data.members || 0}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Total Members
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        ↑ 12% this month
                                    </span>
                                </div>
                            </div>

                            {/* Monthly Earnings Card */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-emerald-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                                        💰
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Current Month
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {displayCurrency}
                                    {data.per_month || 0}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Monthly Earnings
                                </p>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Monthly target</span>
                                        <span>
                                            {Math.round(
                                                (data.per_month /
                                                    (data.all_time / 12 || 1)) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (data.per_month / (data.all_time / 12 || 1)) * 100)}`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Lifetime Earnings Card */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-amber-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                                        📈
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        All Time
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {displayCurrency}
                                    {data.all_time || 0}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Lifetime Earnings
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        ↑ {displayCurrency}
                                        {((data.per_month || 0) * 0.2).toFixed(
                                            2,
                                        )}{" "}
                                        vs last month
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Analytics and Chart Section - Compact */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Earnings Analytics
                                    </h2>
                                    <p className="text-slate-400 text-xs">
                                        Revenue insights and membership trends
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        <span className="text-xs text-slate-300">
                                            Live Updates
                                        </span>
                                    </div>
                                    <select className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500">
                                        <option>Last 30 days</option>
                                        <option>Last 3 months</option>
                                        <option>Last year</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                                <ChartDashboard />
                            </div>
                        </div>

                        {/* Recent Payments Section - Compact Table Design */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Recent Membership Payments
                                    </h2>
                                    <p className="text-slate-400 text-xs">
                                        Latest supporter transactions
                                    </p>
                                </div>
                                <Link
                                    href="/membership/all-payments/page"
                                    className="text-sm text-pink-400 hover:text-pink-300 transition-colors font-medium flex items-center gap-1"
                                >
                                    View All Memberships
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </Link>
                            </div>

                            {data?.payments?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white/10 border-b border-white/10">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Supporter
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Membership Plan
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {data.payments
                                                .slice(0, 5)
                                                .map((payment, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar
                                                                    user={
                                                                        payment.user
                                                                    }
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm text-white">
                                                                {
                                                                    payment
                                                                        .membership
                                                                        ?.title
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                                                    payment
                                                                        .membership
                                                                        ?.type ===
                                                                    "monthly"
                                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                                        : "bg-amber-500/20 text-amber-400"
                                                                }`}
                                                            >
                                                                {
                                                                    payment
                                                                        .membership
                                                                        ?.type
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-white">
                                                                {payment.currency ||
                                                                    displayCurrency}
                                                                {payment.amount}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-slate-300">
                                                                {
                                                                    payment.created_at
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                <span className="text-xs text-green-500">
                                                                    Paid
                                                                </span>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-3">
                                        💳
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1">
                                        No Payments Yet
                                    </h3>
                                    <p className="text-slate-400 text-xs">
                                        When supporters subscribe, their
                                        payments will appear here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Authenticated>
    );
}
