import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";
import CreatorDashboardTabs from "@/Components/CreatorDashboardTabs";
import { useMemo } from "react";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

export default function Membership_dashboard(props) {
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState("3months");
    const [filterStatus, setFilterStatus] = useState("all");
    const [membershipSearch, setMembershipSearch] = useState("");
    const [paymentSearch, setPaymentSearch] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const RevenueChart = ({ data, currency }) => {
        return (
            <div className="w-full h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="membershipRevenueGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#ec4899"
                                    stopOpacity={0.45}
                                />

                                <stop
                                    offset="100%"
                                    stopColor="#ec4899"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(0,0,0,0.1)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="month"
                            tick={{
                                fill: "#4b5563",
                                fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                        />

                        <YAxis
                            tick={{
                                fill: "#4b5563",
                                fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${currency}${value}`}
                        />

                        <Tooltip
                            contentStyle={{
                                background: "#fff",
                                border: "2px solid #000",
                                borderRadius: "18px",
                                color: "#000",
                                backdropFilter: "blur(12px)",
                            }}
                            formatter={(value) => [
                                `${currency}${Number(value).toLocaleString()}`,
                                "Revenue",
                            ]}
                        />

                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#ec4899"
                            strokeWidth={4}
                            fill="url(#membershipRevenueGradient)"
                            dot={{
                                r: 5,
                                fill: "#0f172a",
                                stroke: "#ec4899",
                                strokeWidth: 3,
                            }}
                            activeDot={{
                                r: 8,
                                fill: "#ec4899",
                                stroke: "#fff",
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const [data, setData] = useState({
        members: 0,
        per_month: 0,
        all_time: 0,
        payments: [],
        currency: "£",
    });

    const fetchdata = () => {
        setLoading(true);
        axios
            .get(`/membership/api/dashboard`)
            .then((res) => {
                const responseData = res.data.data;
                // Extract currency from first payment if available
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
    const displayCurrency = data.currency || "£";

    // Filter payments based on search
    const filteredPayments = data.payments?.filter((payment) => {
        const search = paymentSearch.toLowerCase();

        return (
            payment.membership?.title?.toLowerCase()?.includes(search) ||
            payment.user?.name?.toLowerCase()?.includes(search) ||
            payment.user?.username?.toLowerCase()?.includes(search)
        );
    });

    // Get unique memberships from payments
    const uniqueMemberships =
        data.payments?.reduce((acc, payment) => {
            if (
                payment.membership &&
                !acc.find((m) => m.title === payment.membership.title)
            ) {
                acc.push({
                    id: payment.membership.id,
                    uuid: payment.membership.uuid,

                    title: payment.membership.title,
                    price: payment.membership.price,
                    type: payment.membership.type,
                    thumbnail: payment.membership.thumbnail,

                    total_revenue: 0,
                    total_members: 0,

                    status: 1,
                    last_payment_date: null,
                });
            }
            return acc;
        }, []) || [];

    // Calculate membership stats from payments
    const membershipsWithStats = uniqueMemberships.map((membership) => {
        const membershipPayments =
            data.payments?.filter(
                (p) => p.membership?.title === membership.title,
            ) || [];
        const total_revenue = membershipPayments.reduce(
            (sum, p) => sum + p.amount,
            0,
        );
        const total_members = membershipPayments.filter(
            (p, i, arr) =>
                arr.findIndex((a) => a.user?.id === p.user?.id) === i,
        ).length;
        const lastPayment = membershipPayments.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
        )[0];

        return {
            ...membership,
            total_revenue,
            total_members,
            last_payment_date: lastPayment?.created_at,
        };
    });

    // Top performing memberships
    const topMemberships = [...membershipsWithStats]
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

    // All memberships for table
    const allMemberships = membershipsWithStats;

    const filteredMemberships = allMemberships.filter((membership) =>
        membership.title
            ?.toLowerCase()
            .includes(membershipSearch.toLowerCase()),
    );

    // Monthly data for chart (generate from payments)
    const generateMonthlyData = () => {
        const months = [];
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

            const monthlyAmount =
                data.payments?.reduce((sum, payment) => {
                    const paymentDate = new Date(payment.created_at);
                    if (
                        paymentDate.getMonth() === date.getMonth() &&
                        paymentDate.getFullYear() === date.getFullYear()
                    ) {
                        return sum + payment.amount;
                    }
                    return sum;
                }, 0) || 0;

            months.push({
                month: monthName,
                amount: monthlyAmount,
            });
        }
        return months;
    };

    const monthlyData = useMemo(() => generateMonthlyData(), [data.payments]);

    // Get chart data based on selected period
    const getChartData = () => {
        let dataToShow = [...monthlyData];
        if (selectedPeriod === "6months") {
            dataToShow = dataToShow.slice(-6);
        } else if (selectedPeriod === "3months") {
            dataToShow = dataToShow.slice(-3);
        }
        return dataToShow;
    };

    // Calculate collection rate
    const collectionRate =
        data.all_time > 0
            ? (data.per_month / (data.all_time / 12 || 1)) * 100
            : 0;

    const chartData = useMemo(
        () => getChartData(),
        [monthlyData, selectedPeriod],
    );

    const currentRevenue =
        chartData?.length > 0
            ? Number(chartData[chartData.length - 1]?.amount || 0)
            : 0;

    const previousRevenue =
        chartData?.length > 1
            ? Number(chartData[chartData.length - 2]?.amount || 0)
            : 0;

    const growthPercentage =
        previousRevenue > 0
            ? (
                  ((currentRevenue - previousRevenue) / previousRevenue) *
                  100
              ).toFixed(1)
            : 0;

    const isGrowthPositive = currentRevenue >= previousRevenue;

    const activeRecurringRevenue =
        filteredPayments?.reduce((sum, payment) => {
            const membershipType = payment?.membership?.type || "";

            const isRecurring =
                membershipType === "monthly" || membershipType === "yearly";

            const isActive =
                payment?.status === "paid" || payment?.status === "active";

            if (isRecurring && isActive) {
                return sum + Number(payment.amount || 0);
            }

            return sum;
        }, 0) || 0;

    const estimatedNextMonth = activeRecurringRevenue;

    // Payment Details Modal
    const PaymentDetailsModal = ({ payment, onClose }) => {
        if (!payment) return null;

        return (
            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div
                    className="
                    relative
                    w-full
                    max-w-5xl
                    rounded-[28px]
                    overflow-hidden
                    border-[3px] border-black
                    bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                "
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="relative px-8 py-7 border-b-[3px] border-black bg-yellow-300 border-b-[3px] border-black">
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white hover:bg-white text-black text-xl
                            transition-all"
                        >
                            ×
                        </button>

                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-[20px] bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                                {payment.membership?.thumbnail ? (
                                    <img
                                        src={payment.membership.thumbnail}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">👑</span>
                                )}
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-black">
                                    {payment.membership?.title || "Membership"}
                                </h2>

                                <p className="text-gray-700 text-sm mt-1">
                                    Payment ID: #{payment.id}
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                    <span
                                        className="
                                    px-3 py-1
                                    rounded-full
                                    bg-green-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                    text-green-800
                                    text-xs
                                    font-semibold
                                "
                                    >
                                        Payment Successful
                                    </span>

                                    <span
                                        className="
                                    px-3 py-1
                                    rounded-full
                                    bg-pink-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                    text-pink-600
                                    text-xs
                                    font-semibold
                                    capitalize
                                "
                                    >
                                        {payment.membership?.type || "monthly"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BODY */}
                    <div className="p-8">
                        {/* TOP CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-10">
                            <div className="rounded-[30px] bg-white border-[3px] border-black p-5">
                                <p className="text-gray-600 text-xs uppercase">
                                    Amount Paid
                                </p>

                                <h3 className="text-3xl font-bold text-pink-600 mt-3">
                                    {payment.currency || displayCurrency}
                                    {Number(payment.amount).toLocaleString()}
                                </h3>
                            </div>

                            <div className="rounded-[30px] bg-white border-[3px] border-black p-5">
                                <p className="text-gray-600 text-xs uppercase">
                                    Membership Price
                                </p>

                                <h3 className="text-2xl font-black text-black mt-3">
                                    {payment.currency || displayCurrency}
                                    {Number(
                                        payment.membership?.price || 0,
                                    ).toLocaleString()}
                                </h3>
                            </div>

                            <div className="rounded-[30px] bg-white border-[3px] border-black p-5">
                                <p className="text-gray-600 text-xs uppercase">
                                    Payment Date
                                </p>

                                <h3 className="text-lg font-black text-black mt-3">
                                    {payment.created_at}
                                </h3>
                            </div>

                            <div className="rounded-[30px] bg-white border-[3px] border-black p-5">
                                <p className="text-gray-600 text-xs uppercase">
                                    Status
                                </p>

                                <div className="mt-4">
                                    <span
                                        className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-4 py-2
                                    rounded-full
                                    bg-green-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                    text-green-800
                                    text-sm
                                    font-semibold
                                "
                                    >
                                        <span
                                            className="
                                        w-2 h-2 rounded-full bg-green-400
                                    "
                                        ></span>

                                        {payment.status || "Paid"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DETAILS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* MEMBER INFO */}
                            <div
                                className="
                                    rounded-3xl
                                    bg-white
                                    border-[3px] border-black
                                    p-6
                                "
                            >
                                <h3
                                    className="
                                text-xl
                                font-bold
                                text-black
                                mb-5
                            "
                                >
                                    Member Information
                                </h3>

                                <div className="flex items-center gap-6 md:gap-8 mb-10">
                                    <Avatar user={payment.user} size="lg" />

                                    <div>
                                        <h4 className="text-black text-lg font-bold">
                                            {payment.user?.name || "Guest"}
                                        </h4>

                                        <p className="text-gray-600 text-sm">
                                            @{payment.user?.username}
                                        </p>

                                        <p className="text-gray-500 text-xs mt-1">
                                            {payment.user?.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Customer Type
                                        </span>

                                        <span className="text-black font-semibold">
                                            Active Member
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Membership Plan
                                        </span>

                                        <span className="text-black font-semibold">
                                            {payment.membership?.title}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PAYMENT DETAILS */}
                            <div
                                className="
                                rounded-3xl
                                bg-white
                                border-[3px] border-black
                                p-6
                            "
                            >
                                <h3
                                    className="
                                    text-xl
                                    font-bold
                                    text-black
                                    mb-5
                                "
                                >
                                    Payment Details
                                </h3>

                                <div className="space-y-5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Payment Method
                                        </span>

                                        <span className="text-black font-semibold">
                                            Stripe
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Billing Type
                                        </span>

                                        <span className="text-black font-semibold capitalize">
                                            {payment.membership?.type}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Currency
                                        </span>

                                        <span className="text-black font-semibold">
                                            {payment.currency}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Revenue Generated
                                        </span>

                                        <span className="text-green-800 font-bold text-lg">
                                            {payment.currency ||
                                                displayCurrency}
                                            {Number(
                                                payment.amount,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="
                                    mt-8
                                    rounded-[30px]
                                    bg-gradient-to-r
                                    from-pink-500/10
                                    to-purple-500/10
                                    border border-pink-500/20
                                    p-5
                                "
                                >
                                    <p className="text-gray-700 text-sm">
                                        This payment was successfully processed
                                        and added to your membership earnings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={"Membership Dashboard"} />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gray-200">
                    <div className="containerbox m-auto">
                        <div className="py-8 md:py-16 w-full">
                            {/* Header Section */}
                            <CreatorDashboardTabs />

                            <div className="mb-8">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-4 mb-3 mt-4">
                                            <div className="w-16 h-16 bg-yellow-300 flex items-center justify-center text-3xl border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                👑
                                            </div>

                                            <div>
                                                <h1 className="text-3xl md:text-4xl font-GillSans uppercase text-black tracking-tight">
                                                    Membership Dashboard
                                                </h1>

                                                <p className="text-gray-600 mt-1 text-sm font-bold">
                                                    Track recurring revenue, supporter retention and creator growth analytics
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 md:gap-8 mb-10">
                            {/* MEMBERS */}

                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-pink-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        👥
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        Supporters
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-5xl font-black text-black">
                                        {data.members || 0}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Active Members
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>

                                    <span className="text-xs text-green-300">
                                        {uniqueMemberships.length || 0} active
                                        memberships
                                    </span>
                                </div>
                            </div>

                            {/* MONTHLY */}

                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-emerald-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        💰
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        This Month
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-5xl font-black text-black">
                                        {displayCurrency}
                                        {Number(
                                            data.per_month || 0,
                                        ).toLocaleString()}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Monthly Revenue
                                    </p>
                                </div>

                                <div className="w-full">
                                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                                        <span>Growth Rate</span>

                                        <span>{growthPercentage}%</span>
                                    </div>

                                    <div className="h-2 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                                            style={{
                                                width: `${Math.min(100, collectionRate)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* LIFETIME */}

                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-amber-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        📈
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        Lifetime
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-5xl font-black text-black">
                                        {displayCurrency}
                                        {Number(
                                            data.all_time || 0,
                                        ).toLocaleString()}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Total Revenue
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>

                                    <span className="text-xs text-amber-300">
                                        Recurring earnings
                                    </span>
                                </div>
                            </div>

                            {/* FORECAST */}

                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-cyan-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        🚀
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        Forecast
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-5xl font-black text-black">
                                        {displayCurrency}
                                        {Number(
                                            estimatedNextMonth || 0,
                                        ).toLocaleString()}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Estimated Next Month
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>

                                    <span className="text-xs text-cyan-300">
                                        Based on active recurring supporters
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Memberships & Chart */}
                        <div className="flex flex-col gap-6 md:gap-8 mb-10">
                            {/* Top Performing Memberships */}
                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-4">
                                <div className="mb-4">
                                    <h2 className="text-xl font-GillSans uppercase font-black text-black">
                                        Top Performing Memberships
                                    </h2>
                                    <p className="text-gray-600 text-xs">
                                        Memberships with highest revenue
                                    </p>
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                    {topMemberships.length > 0 ? (
                                        topMemberships.map(
                                            (membership, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border-2 border-black rounded-[20px] mb-2 hover:bg-gray-200 hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-8 h-8 rounded-lg bg-pink-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-sm font-bold text-pink-600">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-black truncate max-w-[150px]">
                                                                    {
                                                                        membership.title
                                                                    }
                                                                </p>
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-green-800">
                                                                    Active
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <p className="text-xs text-gray-600">
                                                                    {
                                                                        displayCurrency
                                                                    }
                                                                    {Number(
                                                                        membership.price,
                                                                    ).toLocaleString()}{" "}
                                                                    /{" "}
                                                                    {
                                                                        membership.type
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    👥{" "}
                                                                    {membership.total_members ||
                                                                        0}{" "}
                                                                    members
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-black">
                                                            {displayCurrency}
                                                            {Number(
                                                                membership.total_revenue ||
                                                                    0,
                                                            ).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            total revenue
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600 text-sm">
                                                No memberships created yet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Revenue Chart */}
                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-GillSans uppercase font-black text-black">
                                            Revenue Trends
                                        </h2>
                                        <p className="text-gray-600 text-xs">
                                            Monthly membership payment overview
                                        </p>
                                    </div>
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) =>
                                            setSelectedPeriod(e.target.value)
                                        }
                                        className="bg-white border-2 border-black rounded-[20px] px-3 py-1.5 text-sm text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <option value="3months">
                                            Last 3 months
                                        </option>
                                        <option value="6months">
                                            Last 6 months
                                        </option>
                                        {/* <option value="12months">
                                            Last 12 months
                                        </option> */}
                                    </select>
                                </div>
                                <div className="bg-white border-[3px] border-black rounded-[30px] p-5">
                                    {monthlyData.length > 0 ? (
                                        <RevenueChart
                                            data={getChartData()}
                                            currency={displayCurrency}
                                        />
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center">
                                            <p className="text-gray-600">
                                                No revenue data available
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* All Memberships */}
                        <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all overflow-hidden mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b-[3px] border-black gap-4">
                                <div>
                                    <h2 className="text-xl font-GillSans uppercase font-black text-black">
                                        All Memberships
                                    </h2>

                                    <p className="text-gray-600 text-xs">
                                        Manage and track all your memberships
                                    </p>

                                    <div
                                        className={`
                                            mt-3 inline-flex items-center gap-2
                                            px-4 py-2 rounded-[30px] border
                                            ${
                                                isGrowthPositive
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                            }
                                        `}
                                    >
                                        <span className="text-lg">
                                            {isGrowthPositive ? "↗" : "↘"}
                                        </span>

                                        <span className="font-bold">
                                            {growthPercentage}%
                                        </span>

                                        <span className="text-xs opacity-80">
                                            vs previous month
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Search memberships..."
                                        value={membershipSearch}
                                        onChange={(e) =>
                                            setMembershipSearch(e.target.value)
                                        }
                                        className="
                                        bg-white
                                        border-2 border-black
                                        rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                        px-4 py-2
                                        text-sm
                                        text-black
                                        placeholder-gray-500
                                        focus:outline-none
                                        focus:ring-1
                                        focus:ring-black
                                    "
                                    />
                                </div>
                            </div>

                            {filteredMemberships.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b-[3px] border-black">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Membership
                                                </th>

                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Price
                                                </th>

                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Type
                                                </th>

                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Members
                                                </th>

                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Revenue
                                                </th>

                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Status
                                                </th>

                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y-[3px] divide-black">
                                            {filteredMemberships.map(
                                                (membership, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="
                                                                    w-10 h-10 rounded-[20px] bg-pink-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                                    flex items-center justify-center
                                                                "
                                                                >
                                                                    👑
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-semibold text-black">
                                                                        {
                                                                            membership.title
                                                                        }
                                                                    </p>

                                                                    <p className="text-xs text-gray-600">
                                                                        Created
                                                                        membership
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-black font-semibold">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    membership.price ||
                                                                        0,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span
                                                                className="
                                                                text-xs
                                                                px-2 py-1
                                                                rounded-full
                                                                bg-amber-500/20
                                                                text-amber-400
                                                                capitalize
                                                            "
                                                            >
                                                                {
                                                                    membership.type
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-black font-semibold">
                                                                {membership.total_members ||
                                                                    0}
                                                            </p>

                                                            <p className="text-xs text-gray-600">
                                                                unique members
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-black font-bold">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    membership.total_revenue ||
                                                                        0,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span
                                                                className="
                                                                inline-flex
                                                                items-center
                                                                gap-1
                                                                text-xs
                                                                text-green-800
                                                            "
                                                            >
                                                                <span
                                                                    className="
                                                                    w-1.5 h-1.5
                                                                    rounded-full
                                                                    bg-green-500
                                                                "
                                                                ></span>
                                                                Active
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <Link
                                                                href={`/membership/details/${membership.uuid || membership.id}`}
                                                                className="
                                                                inline-flex items-center gap-2
                                                                px-4 py-2 rounded-xl
                                                                bg-blue-300 text-black text-sm font-black uppercase border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all
                                                            "
                                                            >
                                                                View Details
                                                                <span>→</span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-6">
                                    <div
                                        className="
                                        w-24 h-24 rounded-3xl
                                        bg-gradient-to-br
                                        from-pink-500/10
                                        to-purple-500/10
                                        border border-pink-500/20
                                        flex items-center justify-center
                                        text-5xl
                                        mb-6
                                    "
                                    >
                                        👑
                                    </div>

                                    <h3 className="text-2xl font-black text-black mb-3">
                                        No Memberships Found
                                    </h3>

                                    <p className="text-gray-600 text-center max-w-md leading-relaxed">
                                        We couldn't find any memberships
                                        matching your search. Try using a
                                        different keyword or create a new
                                        membership.
                                    </p>

                                    {membershipSearch && (
                                        <button
                                            onClick={() =>
                                                setMembershipSearch("")
                                            }
                                            className="
                                            mt-6
                                            px-5 py-3
                                            rounded-[30px]
                                            bg-blue-300 text-black font-black uppercase border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all
                                        "
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            )}
            {showPaymentModal && (
                <PaymentDetailsModal
                    payment={selectedPayment}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}
        </Authenticated>
    );
}
