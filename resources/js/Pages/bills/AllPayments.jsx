// resources/js/Pages/billing/AllPayments.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";

export default function AllPayments(props) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currency, setCurrency] = useState("£");
    const [search, setSearch] = useState("");
    const [filterBill, setFilterBill] = useState("all");
    const [user, setUser] = useState("");

    const fetchPayments = (page = 1) => {
        setLoading(true);
        axios
            .get(
                `/billing/api/payments?page=${page}&search=${search}&bill=${filterBill}`,
            )
            .then((res) => {
                setPayments(res.data.data.data);
                setPagination({
                    current_page: res.data.data.current_page,
                    last_page: res.data.data.last_page,
                    per_page: res.data.data.per_page,
                    total: res.data.data.total,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPayments();
    }, [search, filterBill]);

    const { auth } = props;

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={"All Bill Payments"} />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                        {/* Header Section */}
                        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                                    All Bill Payments
                                </h1>
                                <p className="text-slate-400 mt-1 text-sm">
                                    View and manage all bill transactions
                                </p>
                            </div>
                            <Link
                                href="/billing-dashboard"
                                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm text-white flex items-center gap-2"
                            >
                                ← Back to Dashboard
                            </Link>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Total Payments
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {pagination?.total || 0}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Total Revenue
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {currency}
                                    {payments
                                        .reduce(
                                            (sum, p) =>
                                                sum + parseFloat(p.amount),
                                            0,
                                        )
                                        .toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <p className="text-slate-400 text-sm">
                                    Unique Customers
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {
                                        new Set(
                                            payments.map(
                                                (p) => p.customer_email,
                                            ),
                                        ).size
                                    }
                                </p>
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
                                                        Bill
                                                    </th>
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
                                                        Status
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
                                                                <Link
                                                                    href={`/billing/bill/${payment.bill_uuid}`}
                                                                    className="text-sm text-white hover:text-blue-400 font-medium"
                                                                >
                                                                    {
                                                                        payment.bill_name
                                                                    }
                                                                </Link>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar user={payment?.user}/>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm font-bold text-white">
                                                                    {
                                                                        payment.currency
                                                                    }
                                                                    {payment.amount.toLocaleString()}
                                                                </p>
                                                                {payment.total_paid >
                                                                    payment.amount && (
                                                                    <p className="text-xs text-slate-400">
                                                                        incl.
                                                                        fees:{" "}
                                                                        {
                                                                            payment.currency
                                                                        }
                                                                        {payment.total_paid.toLocaleString()}
                                                                    </p>
                                                                )}
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
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                    <span className="text-xs text-green-500 capitalize">
                                                                        {
                                                                            payment.status
                                                                        }
                                                                    </span>
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {pagination && pagination.last_page > 1 && (
                                        <div className="flex justify-center gap-2 p-4 border-t border-white/10">
                                            {[
                                                ...Array(pagination.last_page),
                                            ].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        fetchPayments(i + 1)
                                                    }
                                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                                        pagination.current_page ===
                                                        i + 1
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-3">
                                        💳
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1">
                                        No Payments Yet
                                    </h3>
                                    <p className="text-slate-400 text-xs">
                                        When customers pay your bills,
                                        transactions will appear here
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
