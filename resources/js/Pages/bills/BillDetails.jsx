// resources/js/Pages/billing/BillDetails.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingScreen from "@/includes/LoadingScreen";

export default function BillDetails(props) {
    const { uuid } = props;
    const [loading, setLoading] = useState(true);
    const [bill, setBill] = useState(null);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);

    const fetchBillDetails = () => {
        setLoading(true);
        axios
            .get(`/billing/api/bill/${uuid}`)
            .then((res) => {
                setBill(res.data.data.bill);
                setPayments(res.data.data.payments.data);
                setStats(res.data.data.stats);
                setPagination({
                    current_page: res.data.data.payments.current_page,
                    last_page: res.data.data.payments.last_page,
                    total: res.data.data.payments.total,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBillDetails();
    }, [uuid]);

    const { auth } = props;
    const currency = bill?.currency
        ? bill.currency === "GBP"
            ? "£"
            : bill.currency
        : "£";

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={bill?.name || "Bill Details"} />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                        {/* Header Section */}
                        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    {bill?.thumbnail && (
                                        <img
                                            src={bill.perma_link}
                                            alt={bill.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    )}
                                    <div>
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                                            {bill?.name}
                                        </h1>
                                        <p className="text-slate-400 mt-1 text-sm">
                                            Bill Details & Payment History
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/billing-dashboard"
                                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm text-white flex items-center gap-2"
                            >
                                ← Back to Dashboard
                            </Link>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Total Revenue
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {currency}
                                    {stats?.total_revenue?.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Total Payments
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats?.total_payments || 0}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Unique Buyers
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats?.unique_buyers || 0}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Bill Price
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {currency}
                                    {bill?.price?.toLocaleString()} /{" "}
                                    {bill?.period}
                                </p>
                            </div>
                        </div>

                        {/* Bill Info Card */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 mb-6">
                            <h2 className="text-xl font-bold text-white mb-4">
                                Bill Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-400 text-sm">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                            bill?.status === 1
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${bill?.status === 1 ? "bg-emerald-500" : "bg-red-500"}`}
                                        ></span>
                                        {bill?.status === 1
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">
                                        Period
                                    </p>
                                    <p className="text-white capitalize">
                                        {bill?.period}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">
                                        Created
                                    </p>
                                    <p className="text-white">
                                        {new Date(
                                            bill?.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                {bill?.content_file && (
                                    <div>
                                        <p className="text-slate-400 text-sm">
                                            Content File
                                        </p>
                                        <a
                                            href={bill.content_file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            Download Content →
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payments Table */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white">
                                    Payment History
                                </h2>
                            </div>

                            {payments.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-white/10 border-b border-white/10">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                        Customer
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                        Amount
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                        Message
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10">
                                                {payments.map(
                                                    (payment, index) => (
                                                        <tr
                                                            key={index}
                                                            className="hover:bg-white/5 transition-colors"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="text-sm text-white">
                                                                        {payment.anonymous
                                                                            ? "Anonymous"
                                                                            : payment.customer_name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {
                                                                            payment.customer_email
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm font-bold text-white">
                                                                    {
                                                                        payment.currency
                                                                    }
                                                                    {payment.amount.toLocaleString()}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 capitalize">
                                                                    {payment.recurring_type ||
                                                                        "one-time"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-slate-300">
                                                                    {new Date(
                                                                        payment.created_at,
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-slate-300 max-w-[200px] truncate">
                                                                    {payment.message ||
                                                                        "-"}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400">
                                        No payments received for this bill yet
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
