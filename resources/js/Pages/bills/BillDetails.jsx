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
                <div className="min-h-dvh bg-gray-200">
                    <div className="max-w-[1500px] mx-auto px-4 py-8">
                        {/* PAGE HEADER */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[20px] bg-cyan-400 border-2 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        💳
                                    </div>

                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight">
                                            {bill?.name}
                                        </h1>

                                        <p className="text-gray-600 mt-2 text-sm">
                                            Full creator bill analytics and
                                            supporter insights
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 mt-4">
                                            <Link
                                                href="/billing-dashboard"
                                                className="
                                                inline-flex items-center gap-2
                                                px-5 py-2 rounded-[30px]
                                                bg-white border-2 border-black
                                                text-black font-bold
                                                shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]
                                                hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1
                                                transition-all duration-300
                                            "
                                            >
                                                ← Back to Dashboard
                                            </Link>
                                            <span className="px-3 py-2 rounded-[15px] bg-cyan-300 border-2 border-black text-black text-xs font-bold uppercase">
                                                {bill?.period}
                                            </span>

                                            <span className="px-3 py-2 rounded-[15px] bg-emerald-300 border-2 border-black text-black text-xs font-bold uppercase">
                                                Active Bill
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ANALYTICS CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                            <div className="rounded-[30px] bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-600 uppercase text-xs tracking-widest font-bold">
                                    Total Buyers
                                </p>

                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    {bill?.total_buyers || 0}
                                </h2>

                                <p className="text-emerald-600 mt-3 text-xs font-bold uppercase">
                                    Active Supporters
                                </p>
                            </div>

                            <div className="rounded-[30px] bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-600 uppercase text-xs tracking-widest font-bold">
                                    Total Revenue
                                </p>

                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    {displayCurrency}
                                    {Number(
                                        bill?.total_revenue || 0,
                                    ).toLocaleString()}
                                </h2>

                                <p className="text-pink-600 mt-3 text-xs font-bold uppercase">
                                    Lifetime Earnings
                                </p>
                            </div>

                            <div className="rounded-[30px] bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-600 uppercase text-xs tracking-widest font-bold">
                                    Monthly Revenue
                                </p>

                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    {displayCurrency}
                                    {Number(
                                        bill?.monthly_revenue || 0,
                                    ).toLocaleString()}
                                </h2>

                                <p className="text-cyan-600 mt-3 text-xs font-bold uppercase">
                                    Current Month
                                </p>
                            </div>

                            <div className="rounded-[30px] bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-600 uppercase text-xs tracking-widest font-bold">
                                    Estimated Next Month
                                </p>

                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    {displayCurrency}
                                    {Number(
                                        bill?.estimated_next_month || 0,
                                    ).toLocaleString()}
                                </h2>

                                <p className="text-emerald-600 mt-3 text-xs font-bold uppercase">
                                    Recurring Projection
                                </p>
                            </div>
                        </div>

                        {/* SUPPORTERS TABLE */}
                        <div className="rounded-[30px] bg-white border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-6 ">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-black">
                                        All Supporters
                                    </h2>

                                    <p className="text-gray-600 mt-2 text-sm">
                                        All users who purchased this creator
                                        bill
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Search supporter..."
                                        className="h-[48px] rounded-[30px] bg-white border-2 border-black px-5 text-black min-w-[280px] focus:outline-none font-semibold placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 ">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-black uppercase tracking-wider">
                                                Supporter
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold text-black uppercase tracking-wider">
                                                Amount
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold text-black uppercase tracking-wider">
                                                Type
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold text-black uppercase tracking-wider">
                                                Date
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold text-black uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y-2 ">
                                        {supporters.length > 0 ? (
                                            supporters.map(
                                                (supporter, index) => (
                                                    <tr
                                                        key={index}
                                                        className=""
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <Avatar user={supporter.user} />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <h3 className="text-lg font-black text-emerald-500">
                                                                {displayCurrency}
                                                                {Number(
                                                                    supporter.amount,
                                                                ).toLocaleString()}
                                                            </h3>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <span className="px-3 py-2 rounded-[15px] bg-cyan-300 border-2 border-black text-black text-xs font-bold uppercase">
                                                                {supporter.recurring_type ||
                                                                    "one-time"}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <p className="text-black font-semibold text-sm">
                                                                {new Date(
                                                                    supporter.created_at,
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-[15px] bg-emerald-300 border-2 border-black text-black text-xs font-bold uppercase">
                                                                <span className="w-2 h-2 rounded-full bg-black"></span>
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
                                                        <div className="w-16 h-16 rounded-[20px] bg-gray-200 border-2 border-black flex items-center justify-center text-3xl mb-4">
                                                            💳
                                                        </div>

                                                        <h3 className="text-xl font-black text-black">
                                                            No Supporters Yet
                                                        </h3>

                                                        <p className="text-gray-600 mt-2 text-sm">
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
