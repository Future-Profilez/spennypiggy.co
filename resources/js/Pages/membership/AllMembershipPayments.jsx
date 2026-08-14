// AllMembershipPayments.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import Avatar from "../../Components/Avatar";
import { FiUsers, FiDollarSign, FiBarChart2, FiInbox } from "react-icons/fi";

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
                <div className="min-h-dvh bg-gray-200">
                    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 animate-pulse">
                        <div className="mb-6 sm:mb-8 space-y-3">
                            <div className="h-4 w-40 rounded-box-sm bg-gray-300" />
                            <div className="h-9 w-72 rounded-box-sm bg-gray-300" />
                            <div className="h-4 w-80 rounded-box-sm bg-gray-300" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
 className="h-24 rounded-box bg-white border-[3px] border-black "
                                />
                            ))}
                        </div>
 <div className="h-96 rounded-box bg-white border-[3px] border-black " />
                    </div>
                </div>
            ) : (
                <div className="min-h-dvh bg-gray-200">
                    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                        {/* Header with Back Button */}
                        <div className="mb-6 sm:mb-8">
                            <Link
                                href="/membership/dashboard"
                                className="inline-flex items-center gap-1 sm:gap-2 text-black hover:text-[#FF007F] font-bold transition-colors mb-3 sm:mb-4 group text-xs sm:text-sm"
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
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tight">
                                All Membership Payments
                            </h1>
                            <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                                Complete history of all supporter transactions
                            </p>
                        </div>

                        {/* Stats Overview - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
 <div className="rounded-box bg-white border-[3px] border-black p-4 sm:p-5">
                                <div className="flex items-center gap-3">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-box-sm bg-pink-200 border-2 border-black flex items-center justify-center text-black">
                                        <FiUsers size="1.25rem" />
                                    </div>
                                    <div>
 <p className="text-[12px] sm:text-xs text-gray-700 uppercase font-bold tracking-widest">
                                            Total Supporters
                                        </p>
                                        <p className="text-xl sm:text-2xl font-black text-black">
                                            {stats.total_members}
                                        </p>
                                    </div>
                                </div>
                            </div>
 <div className="rounded-box bg-white border-[3px] border-black p-4 sm:p-5">
                                <div className="flex items-center gap-3">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-box-sm bg-pink-200 border-2 border-black flex items-center justify-center text-black">
                                        <FiDollarSign size="1.25rem" />
                                    </div>
                                    <div>
 <p className="text-[12px] sm:text-xs text-gray-700 uppercase font-bold tracking-widest">
                                            Total Earnings
                                        </p>
                                        <p className="text-xl sm:text-2xl font-black text-black">
                                            £{stats.total_earnings}
                                        </p>
                                    </div>
                                </div>
                            </div>
 <div className="rounded-box bg-white border-[3px] border-black p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-3">
 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-box-sm bg-pink-200 border-2 border-black flex items-center justify-center text-black">
                                        <FiBarChart2 size="1.25rem" />
                                    </div>
                                    <div>
 <p className="text-[12px] sm:text-xs text-gray-700 uppercase font-bold tracking-widest">
                                            Average Payment
                                        </p>
                                        <p className="text-xl sm:text-2xl font-black text-black">
                                            £{stats.average_amount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search - Responsive */}
 <div className="rounded-box bg-white border-[3px] border-black p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setFilter("all")}
                                        className={`px-4 py-2 min-h-[44px] rounded-box-sm text-xs sm:text-sm font-black uppercase border-2 border-black transition-all ${
                                            filter === "all"
 ? "bg-[#FF007F] text-black "
                                                : "bg-white text-black hover:bg-gray-100"
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter("monthly")}
                                        className={`px-4 py-2 min-h-[44px] rounded-box-sm text-xs sm:text-sm font-black uppercase border-2 border-black transition-all ${
                                            filter === "monthly"
 ? "bg-[#FF007F] text-black "
                                                : "bg-white text-black hover:bg-gray-100"
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setFilter("yearly")}
                                        className={`px-4 py-2 min-h-[44px] rounded-box-sm text-xs sm:text-sm font-black uppercase border-2 border-black transition-all ${
                                            filter === "yearly"
 ? "bg-[#FF007F] text-black "
                                                : "bg-white text-black hover:bg-gray-100"
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
 className="w-full sm:w-64 min-h-[44px] px-4 py-2 rounded-box-sm bg-white border-2 border-black text-black placeholder-black/60 font-semibold focus:outline-none text-xs sm:text-sm"
                                    />
                                    <svg
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
 <div className="rounded-box bg-white border-[3px] border-black overflow-hidden">
                            {/* Mobile Card View */}
                            <div className="block lg:hidden">
                                {filteredPayments.map((payment, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border-b-2 border-black/10 last:border-b-0"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={
                                                    payment.user.avatar ||
                                                    "/images/user-avatar.png"
                                                }
                                                className="w-10 h-10 rounded-box-sm border-2 border-black object-cover"
                                                alt={`${payment.user.name} avatar`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-black text-black">
                                                        {payment.user.name}
                                                    </p>
                                                    <span
 className={`px-2 py-0.5 rounded-box-sm text-[12px] font-bold uppercase capitalize border-2 border-black ${payment.membership.type === "monthly" ? "bg-emerald-200 text-black" : "bg-pink-200 text-black"}`}
                                                    >
                                                        {
                                                            payment.membership
                                                                .type
                                                        }
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-700">
                                                    @{payment.user.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
 <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                    Plan
                                                </p>
                                                <p className="text-black font-bold">
                                                    {payment.membership.title}
                                                </p>
                                            </div>
                                            <div>
 <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                    Amount
                                                </p>
                                                <p className="text-black font-black">
                                                    {payment.currency}
                                                    {payment.amount}
                                                </p>
                                            </div>
                                            <div>
 <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                    Date
                                                </p>
                                                <p className="text-black font-semibold text-xs">
                                                    {payment.created_at}
                                                </p>
                                            </div>
                                            <div>
 <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                    Status
                                                </p>
                                                <span className="inline-flex items-center gap-1 text-green-700 font-bold text-xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
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
                                    <thead className="bg-gray-100 border-b-[3px] border-black">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-black uppercase tracking-wider">
                                                Supporter
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-black uppercase tracking-wider">
                                                Membership Plan
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-black uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-black uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-black uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-black uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black/10">
                                        {filteredPayments.map(
                                            (payment, index) => (
                                                <tr key={index}>
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
                                                        <span className="text-sm text-black font-semibold">
                                                            {
                                                                payment
                                                                    .membership
                                                                    .title
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-3 py-1.5 rounded-box-sm text-xs font-bold uppercase capitalize border-2 border-black ${
                                                                payment
                                                                    .membership
                                                                    .type ===
                                                                "monthly"
                                                                    ? "bg-emerald-200 text-black"
                                                                    : "bg-pink-200 text-black"
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
                                                        <p className="text-sm font-black text-black">
                                                            {payment.currency}
                                                            {payment.amount}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-black font-semibold">
                                                            {payment.created_at}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-box-sm bg-emerald-300 border-2 border-black text-black text-xs font-bold uppercase">
                                                            <span className="w-2 h-2 rounded-full bg-black"></span>
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
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-box bg-gray-200 flex items-center justify-center text-black mb-3 sm:mb-4 border-2 border-black">
                                        <FiInbox size="1.75rem" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-black mb-1">
                                        No payments found
                                    </h3>
                                    <p className="text-gray-700 text-xs sm:text-sm">
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
