// AllMembershipPayments.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";

export default function AllMembershipPayments({ auth }) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        total_members: 0,
        total_earnings: 0,
        average_amount: 0,
    });
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Change the API endpoint from /membership/all-payments to /membership/api/all-payments
    const fetchPayments = () => {
        setLoading(true);
        axios
            .get(`/membership/api/all-payments`) // ← Updated URL
            .then((res) => {
                setPayments(res.data.payments);
                setStats(res.data.stats);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const filteredPayments = payments.filter((payment) => {
        if (filter !== "all" && payment.membership.type !== filter)
            return false;
        if (
            searchTerm &&
            !payment.user.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) &&
            !payment.user.username
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
            return false;
        return true;
    });

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title="All Membership Payments" />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                        {/* Header with Back Button */}
                        <div className="mb-6 sm:mb-8">
                            <Link
                                href="/membership/dashboard"
                                className="inline-flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-pink-400 transition-colors mb-3 sm:mb-4 group text-xs sm:text-sm"
                            >
                                <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                                All Membership Payments
                            </h1>
                            <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                                Complete history of all supporter transactions
                            </p>
                        </div>

                        {/* Stats Overview - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <div className="rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-base sm:text-lg">
                                        👥
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-slate-400">
                                            Total Supporters
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-white">
                                            {stats.total_members}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base sm:text-lg">
                                        💰
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-slate-400">
                                            Total Earnings
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-white">
                                            £{stats.total_earnings}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-base sm:text-lg">
                                        📊
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-slate-400">
                                            Average Payment
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-white">
                                            £{stats.average_amount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search - Responsive */}
                        <div className="rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setFilter("all")}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                            filter === "all"
                                                ? "bg-pink-500 text-white"
                                                : "bg-white/5 text-slate-400 hover:bg-white/10"
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter("monthly")}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                            filter === "monthly"
                                                ? "bg-pink-500 text-white"
                                                : "bg-white/5 text-slate-400 hover:bg-white/10"
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setFilter("yearly")}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                            filter === "yearly"
                                                ? "bg-pink-500 text-white"
                                                : "bg-white/5 text-slate-400 hover:bg-white/10"
                                        }`}
                                    >
                                        Yearly
                                    </button>
                                </div>
                                <div className="relative w-full sm:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Search by name or username..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full sm:w-64 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs sm:text-sm"
                                    />
                                    <svg
                                        className="absolute right-2 sm:right-3 top-2 sm:top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-slate-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Payments Cards View for Mobile, Table for Desktop */}
                        <div className="rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                            {/* Mobile Card View */}
                            <div className="block lg:hidden">
                                {filteredPayments.map((payment, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border-b border-white/10 last:border-b-0"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={
                                                    payment.user.avatar ||
                                                    "/images/user-avatar.png"
                                                }
                                                className="w-10 h-10 rounded-lg object-cover"
                                                alt={payment.user.name}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-white">
                                                        {payment.user.name}
                                                    </p>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${payment.membership.type === "monthly" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}
                                                    >
                                                        {
                                                            payment.membership
                                                                .type
                                                        }
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    @{payment.user.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-slate-400">
                                                    Plan
                                                </p>
                                                <p className="text-white font-medium">
                                                    {payment.membership.title}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">
                                                    Amount
                                                </p>
                                                <p className="text-white font-bold">
                                                    {payment.currency}
                                                    {payment.amount}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">
                                                    Date
                                                </p>
                                                <p className="text-slate-300 text-xs">
                                                    {payment.created_at}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">
                                                    Status
                                                </p>
                                                <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                    Paid
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Supporter
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Membership Plan
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {filteredPayments.map(
                                            (payment, index) => (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                user={
                                                                    payment.user
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-white">
                                                            {
                                                                payment
                                                                    .membership
                                                                    .title
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                                payment
                                                                    .membership
                                                                    .type ===
                                                                "monthly"
                                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                            }`}
                                                        >
                                                            {
                                                                payment
                                                                    .membership
                                                                    .type
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-bold text-white">
                                                            {payment.currency}
                                                            {payment.amount}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-slate-300">
                                                            {payment.created_at}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                            Paid
                                                        </span>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredPayments.length === 0 && (
                                <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 border border-white/10">
                                        📭
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                                        No payments found
                                    </h3>
                                    <p className="text-slate-400 text-xs sm:text-sm">
                                        Try adjusting your filters or search
                                        term
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
