import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";

export default function BillDetails(props) {
    const [loading, setLoading] = useState(true);
    const [bill, setBill] = useState(null);
    const [supporters, setSupporters] = useState([]);
    const uuid = window.location.pathname.split("/").pop();

    useEffect(() => {
        setLoading(true);

        axios
            .get(`/billing/api/bill/${uuid}`)
            .then((res) => {
                const billData = res.data?.bill || {};
                const payments = billData?.payments || [];

                // ONLY PAID PAYMENTS
                const paidPayments = payments.filter(
                    (payment) => payment.status === "paid",
                );

                // TOTAL REVENUE
                const totalRevenue = paidPayments.reduce(
                    (sum, payment) => sum + Number(payment.amount || 0),
                    0,
                );

                // MONTHLY REVENUE
                const monthlyRevenue = paidPayments.reduce((sum, payment) => {
                    const paymentDate = new Date(payment.created_at);

                    const now = new Date();

                    if (
                        paymentDate.getMonth() === now.getMonth() &&
                        paymentDate.getFullYear() === now.getFullYear()
                    ) {
                        return sum + Number(payment.amount || 0);
                    }

                    return sum;
                }, 0);

                // UNIQUE BUYERS
                const uniqueBuyers = [
                    ...new Set(paidPayments.map((payment) => payment.user_id)),
                ];

                setBill({
                    ...billData,

                    total_buyers: uniqueBuyers.length,

                    total_revenue: totalRevenue,

                    monthly_revenue: monthlyRevenue,

                    estimated_next_month: monthlyRevenue,
                });

                setSupporters(paidPayments);

                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    }, []);

    const { auth } = props;
    const displayCurrency = bill?.currency_symbol || "£";

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title="Bill Details" />

            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="max-w-[1500px] mx-auto px-4 py-8">
                        {/* PAGE HEADER */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-5xl shadow-lg shadow-cyan-500/30">
                                        💳
                                    </div>

                                    <div>
                                        <h1 className="text-5xl font-black text-white tracking-tight">
                                            {bill?.name}
                                        </h1>

                                        <p className="text-slate-400 mt-2 text-base">
                                            Full creator bill analytics and
                                            supporter insights
                                        </p>

                                        <div className="flex items-center gap-3 mt-4">
                                            <Link
                                                href="/billing-dashboard"
                                                className="
                                                inline-flex items-center gap-2
                                                px-5 py-3 mt-4 rounded-[30px] 
                                                bg-white/5 border border-white/10
                                                text-white font-semibold
                                                hover:bg-white/10 transition-all
                                            "
                                            >
                                                ← Back to Dashboard
                                            </Link>
                                            <span className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold capitalize">
                                                {bill?.period}
                                            </span>

                                            <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                                                Active Bill
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ANALYTICS CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                                <p className="text-slate-400 uppercase text-xs tracking-widest">
                                    Total Buyers
                                </p>

                                <h2 className="text-5xl font-black text-white mt-4">
                                    {bill?.total_buyers || 0}
                                </h2>

                                <p className="text-emerald-400 mt-3 text-sm font-semibold">
                                    Active Supporters
                                </p>
                            </div>

                            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                                <p className="text-slate-400 uppercase text-xs tracking-widest">
                                    Total Revenue
                                </p>

                                <h2 className="text-5xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mt-4">
                                    {displayCurrency}
                                    {Number(
                                        bill?.total_revenue || 0,
                                    ).toLocaleString()}
                                </h2>

                                <p className="text-pink-400 mt-3 text-sm font-semibold">
                                    Lifetime Earnings
                                </p>
                            </div>

                            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                                <p className="text-slate-400 uppercase text-xs tracking-widest">
                                    Monthly Revenue
                                </p>

                                <h2 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mt-4">
                                    {displayCurrency}
                                    {Number(
                                        bill?.monthly_revenue || 0,
                                    ).toLocaleString()}
                                </h2>

                                <p className="text-cyan-400 mt-3 text-sm font-semibold">
                                    Current Month
                                </p>
                            </div>

                            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                                <p className="text-slate-400 uppercase text-xs tracking-widest">
                                    Estimated Next Month
                                </p>

                                <h2 className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mt-4">
                                    {displayCurrency}
                                    {Number(
                                        bill?.estimated_next_month || 0,
                                    ).toLocaleString()}
                                </h2>

                                <p className="text-emerald-400 mt-3 text-sm font-semibold">
                                    Recurring Projection
                                </p>
                            </div>
                        </div>

                        {/* SUPPORTERS TABLE */}
                        <div className="rounded-[32px] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-6 border-b border-white/10">
                                <div>
                                    <h2 className="text-3xl font-black text-white">
                                        All Supporters
                                    </h2>

                                    <p className="text-slate-400 mt-2 text-sm">
                                        All users who purchased this creator
                                        bill
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Search supporter..."
                                        className="h-[56px] rounded-[30px]  bg-[#0f172a] border border-white/10 px-5 text-white min-w-[320px] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/10 border-b border-white/10">
                                        <tr>
                                            <th className="text-left px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                Supporter
                                            </th>

                                            <th className="text-left px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                Amount
                                            </th>

                                            <th className="text-left px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                Type
                                            </th>

                                            <th className="text-left px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                Date
                                            </th>

                                            <th className="text-left px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/10">
                                        {supporters.length > 0 ? (
                                            supporters.map(
                                                (supporter, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-white/5 transition-all"
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                

                                                                <div>
                                                                    <Avatar user={supporter.user} />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <h3 className="text-2xl font-black text-pink-400">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    supporter.amount,
                                                                ).toLocaleString()}
                                                            </h3>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <span className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold capitalize">
                                                                {supporter.recurring_type ||
                                                                    "one-time"}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <p className="text-white font-semibold">
                                                                {new Date(
                                                                    supporter.created_at,
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                                Paid
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-16 text-center"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-4">
                                                            💳
                                                        </div>

                                                        <h3 className="text-2xl font-bold text-white">
                                                            No Supporters Yet
                                                        </h3>

                                                        <p className="text-slate-400 mt-2">
                                                            This bill has not
                                                            received any
                                                            payments yet.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Authenticated>
    );
}
