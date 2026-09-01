import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import useHideBottomBar from "@/hooks/useHideBottomBar";
import Avatar from "../../Components/Avatar";
import CreatorDashboardTabs from "@/Components/CreatorDashboardTabs";
import DashboardHero from "@/Components/Dashboard/DashboardHero";
import { useMemo } from "react";
import { FiUsers, FiDollarSign, FiTrendingUp, FiZap, FiDownload } from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import { exportCsv, csvDateStamp } from "@/utils/exportCsv";

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
                                border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: "16px",
                                color: "#111",
                                
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

    const handleExport = () => {
        const rows = membershipsWithStats.map((m) => [
            m.title,
            `${displayCurrency}${Number(m.price || 0)}`,
            m.total_members || 0,
            `${displayCurrency}${Number(m.total_revenue || 0)}`,
        ]);
        exportCsv(
            `memberships-${csvDateStamp()}.csv`,
            ["Tier", "Price", "Members", "Total revenue"],
            rows,
        );
    };

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

    // Only plot once there is real revenue — otherwise the chart draws a flat line
    // pinned to the axis and looks broken. Mirrors Billing_dashboard.
    const hasChartRevenue = (monthlyData || []).some(
        (d) => Number(d?.amount || 0) > 0,
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
        // z-[10000] is still under the z-999999 bottom bar.
        useHideBottomBar(Boolean(payment));
        if (!payment) return null;

        return (
            // bottom-bar-safe: useHideBottomBar(Boolean(payment)) hides the bar while open
            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div
                    className="
                    relative
                    w-full
                    max-w-5xl
                    rounded-box
                    overflow-hidden
                    border border-gray-100
 bg-white 
                "
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="relative px-8 py-7 border-b border-gray-100 bg-yellow-300">
                        <button
                            onClick={onClose}
                            aria-label="Close payment details"
                            className="absolute top-5 right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white border border-gray-100 text-black text-xl hover:bg-gray-50 transition-all"
                        >
                            ×
                        </button>

                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-box-sm bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                                {payment.membership?.thumbnail ? (
                                    <img
                                        src={payment.membership.thumbnail}
                                        alt={`${payment.membership?.title || "Membership"} thumbnail`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-black">
                                        <FaCrown size="2rem" />
                                    </span>
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
 bg-green-200 border border-gray-100 
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
 bg-pink-200 border border-gray-100 
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
                            <div className="rounded-box  bg-white border border-gray-100 p-5">
                                <p className="text-gray-600 text-xs uppercase">
                                    Amount Paid
                                </p>

                                <h3 className="text-3xl font-bold text-pink-600 mt-3">
                                    {payment.currency || displayCurrency}
                                    {Number(payment.amount).toLocaleString()}
                                </h3>
                            </div>

                            <div className="rounded-box  bg-white border border-gray-100 p-5">
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

                            <div className="rounded-box  bg-white border border-gray-100 p-5">
                                <p className="text-gray-600 text-xs uppercase">
                                    Payment Date
                                </p>

                                <h3 className="text-lg font-black text-black mt-3">
                                    {payment.created_at}
                                </h3>
                            </div>

                            <div className="rounded-box  bg-white border border-gray-100 p-5">
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
 bg-green-200 border border-gray-100 
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
                                    rounded-box
                                    bg-white
                                    border border-gray-100
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
                                rounded-box
                                bg-white
                                border border-gray-100
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

                                <div className="mt-8 rounded-box bg-pink-50 border border-gray-100 p-5">
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
            <div className="min-h-dvh bg-gray-50">
                <div className="containerbox m-auto">
                    <div className="py-6 md:py-10 w-full m-auto">
                        {/* Header Section */}
                        <CreatorDashboardTabs />

                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-6 md:gap-8">
                                {/* Hero Skeleton */}
                                <div className="relative bg-gray-200 rounded-box p-6 md:p-8 mb-4 overflow-hidden min-h-[180px] w-full">
                                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-11 h-11 bg-gray-300 rounded-box-sm" />
                                                <div className="h-4 w-32 bg-gray-300 rounded" />
                                            </div>
                                            <div className="h-12 w-48 bg-gray-300 rounded mt-2" />
                                        </div>
                                        <div className="flex flex-wrap gap-3 shrink-0">
                                            {[0, 1, 2].map((i) => (
                                                <div key={i} className="bg-gray-300/60 rounded-box-sm px-4 py-3 min-w-[112px] h-[68px]" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid Skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="bg-white border border-gray-100 rounded-box p-5 h-[170px] flex flex-col justify-between ">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 bg-gray-200 rounded-box-sm" />
                                                <div className="h-6 w-20 bg-gray-200 rounded-box-sm" />
                                            </div>
                                            <div>
                                                <div className="h-8 w-24 bg-gray-200 rounded mt-2" />
                                                <div className="h-4 w-32 bg-gray-200 rounded mt-2" />
                                            </div>
                                            <div className="h-3 w-40 bg-gray-100 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Top Performing Memberships Skeleton */}
                                <div className="bg-white border border-gray-100 rounded-box p-5 ">
                                    <div className="mb-4">
                                        <div className="h-6 w-56 bg-gray-200 rounded" />
                                        <div className="h-3 w-40 bg-gray-200 rounded mt-2" />
                                    </div>
                                    <div className="space-y-3">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-box-sm">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-8 h-8 rounded-box-xs bg-gray-200" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-32 bg-gray-200 rounded" />
                                                        <div className="h-3 w-48 bg-gray-200 rounded" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-5 w-16 bg-gray-200 rounded" />
                                                    <div className="h-3 w-20 bg-gray-200 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Revenue Chart Skeleton */}
                                <div className="bg-white border border-gray-100 rounded-box p-5 ">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="h-6 w-36 bg-gray-200 rounded" />
                                            <div className="h-3 w-56 bg-gray-200 rounded mt-2" />
                                        </div>
                                        <div className="h-[44px] w-36 bg-gray-200 rounded-box-sm" />
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-box p-5 h-[360px] flex items-end justify-between gap-2">
                                        {[30, 45, 35, 60, 50, 70, 65, 80, 75, 90, 85, 100].map((h, i) => (
                                            <div key={i} className="bg-pink-100 rounded-t w-full" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>

                                {/* All Memberships Table Skeleton */}
                                <div className="bg-white border border-gray-100 rounded-box overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                                        <div>
                                            <div className="h-6 w-40 bg-gray-200 rounded" />
                                            <div className="h-3 w-56 bg-gray-200 rounded mt-2" />
                                            <div className="h-6 w-32 bg-gray-200 rounded-box-sm mt-3" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-[44px] w-48 bg-gray-200 rounded-box-sm" />
                                            <div className="h-[44px] w-24 bg-gray-200 rounded-box-sm" />
                                        </div>
                                    </div>

                                    {/* Desktop Table Skeleton */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                                        <th key={i} className="px-4 py-3"><div className="h-3 w-16 bg-gray-200 rounded" /></th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {[0, 1, 2].map((row) => (
                                                    <tr key={row}>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-box-sm bg-gray-200" />
                                                                <div className="space-y-2">
                                                                    <div className="h-4 w-28 bg-gray-200 rounded" />
                                                                    <div className="h-3 w-16 bg-gray-200 rounded" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                                                        <td className="px-4 py-4"><div className="h-6 w-16 bg-gray-200 rounded-box-sm" /></td>
                                                        <td className="px-4 py-4">
                                                            <div className="space-y-2">
                                                                <div className="h-4 w-10 bg-gray-200 rounded" />
                                                                <div className="h-3 w-20 bg-gray-200 rounded" />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                                                        <td className="px-4 py-4"><div className="h-3 w-12 bg-gray-200 rounded" /></td>
                                                        <td className="px-4 py-4"><div className="h-9 w-28 bg-gray-200 rounded-box-sm" /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile List Skeleton */}
                                    <div className="block lg:hidden divide-y divide-gray-100">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="p-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-box-sm bg-gray-200" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-28 bg-gray-200 rounded" />
                                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                                    </div>
                                                    <div className="h-6 w-16 bg-gray-200 rounded-box-sm" />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[0, 1, 2].map((j) => (
                                                        <div key={j} className="space-y-1">
                                                            <div className="h-3 w-10 bg-gray-200 rounded" />
                                                            <div className="h-4 w-16 bg-gray-200 rounded" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="h-9 w-full bg-gray-200 rounded-box-sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <DashboardHero
                                accent="pink"
                                Icon={FaCrown}
                                sticker="Memberships"
                                label="Total revenue"
                                amount={Number(data.all_time || 0)}
                                prefix={displayCurrency}
                                trend={
                                    Number(growthPercentage) !== 0
                                        ? {
                                              value: Number(growthPercentage),
                                              positive: isGrowthPositive,
                                          }
                                        : null
                                }
                                stats={[
                                    {
                                        label: "Active members",
                                        value: data.members || 0,
                                        Icon: FiUsers,
                                    },
                                    {
                                        label: "This month",
                                        value: `${displayCurrency}${Number(
                                            data.per_month || 0,
                                        ).toLocaleString()}`,
                                        Icon: FiDollarSign,
                                    },
                                    {
                                        label: "Forecast",
                                        value: `${displayCurrency}${Number(
                                            estimatedNextMonth || 0,
                                        ).toLocaleString()}`,
                                        Icon: FiZap,
                                    },
                                ]}
                            />

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
                            {/* MEMBERS */}

                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-pink-200 flex items-center justify-center text-black border border-gray-100 rounded-box-sm ">
                                        <FiUsers size="1.35rem" />
                                    </div>

                                    <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                        Supporters
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black text-black">
                                        {data.members || 0}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Active Members
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>

                                    <span className="text-xs text-emerald-700">
                                        {uniqueMemberships.length || 0} active
                                        memberships
                                    </span>
                                </div>
                            </div>

                            {/* MONTHLY */}

                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-pink-200 flex items-center justify-center text-black border border-gray-100 rounded-box-sm ">
                                        <FiDollarSign size="1.35rem" />
                                    </div>

                                    <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                        This Month
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black text-black">
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

                                    <div className="h-2 rounded-full bg-gray-200 border border-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isGrowthPositive ? "bg-green-500" : "bg-red-500"}`}
                                            style={{
                                                width: `${Math.min(100, Math.abs(Number(growthPercentage)))}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* LIFETIME */}

                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-pink-200 flex items-center justify-center text-black border border-gray-100 rounded-box-sm ">
                                        <FiTrendingUp size="1.35rem" />
                                    </div>

                                    <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                        Lifetime
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black text-black">
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
                                    <div className="w-2 h-2 rounded-full bg-[#FF007F]"></div>

                                    <span className="text-xs text-[#FF007F] font-bold">
                                        Recurring earnings
                                    </span>
                                </div>
                            </div>

                            {/* FORECAST */}

                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-pink-200 flex items-center justify-center text-black border border-gray-100 rounded-box-sm ">
                                        <FiZap size="1.35rem" />
                                    </div>

                                    <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                        Forecast
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black text-black">
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
                                    <div className="w-2 h-2 rounded-full bg-[#FF007F]"></div>

                                    <span className="text-xs text-[#FF007F] font-bold">
                                        Based on active recurring supporters
                                    </span>
                                </div>
                            </div>

                            {/* MRR */}
                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-pink-50 flex items-center justify-center rounded-box-sm">
                                        <FaCrown className="text-[#FF007F]" size="1.3rem" />
                                    </div>
                                    <span className="text-xs bg-white text-gray-700 border border-gray-100 rounded-box-sm px-3 py-1 font-semibold uppercase">
                                        Recurring
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-black">
                                        {displayCurrency}
                                        {Number(data.mrr || 0).toLocaleString()}
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Monthly recurring revenue
                                    </p>
                                </div>
                                <span className="text-xs text-emerald-700">
                                    {data.active_recurring || 0} active members
                                </span>
                            </div>

                            {/* CHURN */}
                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-pink-50 flex items-center justify-center rounded-box-sm">
                                        <FiTrendingUp className="text-[#FF007F] rotate-180" size="1.35rem" />
                                    </div>
                                    <span className="text-xs bg-white text-gray-700 border border-gray-100 rounded-box-sm px-3 py-1 font-semibold uppercase">
                                        This month
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-black">
                                        {Number(data.churn_rate || 0)}%
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Churn rate
                                    </p>
                                </div>
                                <span
                                    className={`text-xs ${
                                        (data.cancelled_this_month || 0) > 0
                                            ? "text-red-600"
                                            : "text-emerald-700"
                                    }`}
                                >
                                    {data.cancelled_this_month || 0} cancelled this
                                    month
                                </span>
                            </div>
                        </div>

                        {/* Top Memberships & Chart */}
                        <div className="flex flex-col gap-6 md:gap-8 mb-10">
                            {/* Top Performing Memberships */}
                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-4">
                                <div className="mb-4">
                                    <h2 className="text-lg font-bold tracking-tight text-gray-900">
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
                                                    className="flex items-center justify-between p-3 bg-gray-100 border border-gray-100 rounded-box-sm mb-2 "
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-8 h-8 rounded-box-xs bg-pink-200 border border-gray-100 flex items-center justify-center text-sm font-bold text-[#FF007F]">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-black truncate max-w-[150px]">
                                                                    {
                                                                        membership.title
                                                                    }
                                                                </p>
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 border border-gray-100 text-green-800">
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
                                                                <p className="inline-flex items-center gap-1 text-xs text-gray-600">
                                                                    <FiUsers size="0.85rem" />
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
                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-gray-900">
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
                                        className="bg-white border border-gray-100 rounded-box-sm px-3 py-1.5 min-h-[44px] text-sm text-black focus:outline-none "
                                    >
                                        <option value="3months">
                                            Last 3 months
                                        </option>
                                        <option value="6months">
                                            Last 6 months
                                        </option>
                                        <option value="12months">
                                            Last 12 months
                                        </option>
                                    </select>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-box p-5">
                                    {hasChartRevenue ? (
                                        <RevenueChart
                                            data={getChartData()}
                                            currency={displayCurrency}
                                        />
                                    ) : (
                                        <div className="h-[300px] flex flex-col items-center justify-center text-center px-6">
                                            <div className="w-16 h-16 bg-pink-100 border border-gray-100 rounded-box-sm flex items-center justify-center mb-4">
                                                <FiTrendingUp className="text-[#FF007F]" size="1.9rem" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase text-black">
                                                No revenue yet
                                            </h3>
                                            <p className="text-gray-600 mt-2 text-sm max-w-sm">
                                                Your monthly membership earnings
                                                appear here once members join.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* All Memberships */}
                        <div className="bg-white border border-gray-100 rounded-box  duration-200 overflow-hidden mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4  gap-4">
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight text-gray-900">
                                        All Memberships
                                    </h2>

                                    <p className="text-gray-600 text-xs">
                                        Manage and track all your memberships
                                    </p>

                                    <div
                                        className={`
                                            mt-3 inline-flex items-center gap-2
 px-4 py-2 rounded-box-sm border border-gray-100 
                                            ${
                                                isGrowthPositive
                                                    ? "bg-emerald-200 text-green-800"
                                                    : "bg-red-200 text-red-700"
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
                                        aria-label="Search memberships"
                                        value={membershipSearch}
                                        onChange={(e) =>
                                            setMembershipSearch(e.target.value)
                                        }
                                        className="
                                        bg-white
                                        border border-gray-100
 rounded-box-sm 
                                        px-4 py-2 min-h-[44px]
                                        text-sm
                                        text-black
                                        placeholder-gray-500
                                        focus:outline-none
                                        focus:ring-1
                                        focus:ring-black
                                    "
                                    />
                                    <button
                                        onClick={handleExport}
                                        disabled={!membershipsWithStats.length}
                                        aria-label="Export memberships to CSV"
                                        className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-box-sm text-sm font-semibold bg-gray-900 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                    >
                                        <FiDownload size="0.95rem" /> Export
                                    </button>
                                </div>
                            </div>

                            {filteredMemberships.length > 0 ? (
                                <>
                                {/* Mobile card list */}
                                <div className="block lg:hidden">
                                    {filteredMemberships.map(
                                        (membership, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border-b border-gray-100/10 last:border-b-0"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-box-sm bg-pink-200 border border-gray-100 flex items-center justify-center text-black shrink-0">
                                                        <FaCrown size="1.1rem" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-black truncate">
                                                            {membership.title}
                                                        </p>
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-800 font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Active
                                                        </span>
                                                    </div>
                                                    <span className="px-3 py-1.5 rounded-box-sm bg-pink-200 border border-gray-100 text-black text-[12px] font-bold uppercase capitalize">
                                                        {membership.type}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                            Price
                                                        </p>
                                                        <p className="text-black font-black">
                                                            {displayCurrency}
                                                            {Number(
                                                                membership.price ||
                                                                    0,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                            Members
                                                        </p>
                                                        <p className="text-black font-black">
                                                            {membership.total_members ||
                                                                0}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-700 uppercase font-bold text-[12px] tracking-widest">
                                                            Revenue
                                                        </p>
                                                        <p className="text-black font-black">
                                                            {displayCurrency}
                                                            {Number(
                                                                membership.total_revenue ||
                                                                    0,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/membership/details/${membership.uuid || membership.id}`}
                                                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF007F] text-black text-sm font-black uppercase border border-gray-100 rounded-box-sm "
                                                >
                                                    View Details
                                                    <span>→</span>
                                                </Link>
                                            </div>
                                        ),
                                    )}
                                </div>
                                {/* Desktop table */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 ">
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

                                        <tbody className="divide-y divide-gray-100">
                                            {filteredMemberships.map(
                                                (membership, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="
 w-10 h-10 rounded-box-sm bg-pink-200 border border-gray-100 
                                                                    flex items-center justify-center text-black
                                                                "
                                                                >
                                                                    <FaCrown size="1.1rem" />
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
                                                            <span className="text-xs px-3 py-1.5 rounded-box-sm bg-pink-200 border border-gray-100 text-black font-bold uppercase capitalize">
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
                                                                px-4 py-2
 bg-[#FF007F] text-black text-sm font-black uppercase border border-gray-100 rounded-box-sm hover:bg-[#e00070] transition-colors duration-200
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
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-6">
                                    <div className="w-24 h-24 rounded-box bg-pink-100 border border-gray-100 flex items-center justify-center text-black mb-6">
                                        <FaCrown size="2.5rem" />
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
 bg-[#FF007F] text-black font-black uppercase border border-gray-100 rounded-box-sm hover:bg-[#e00070] transition-colors duration-200
                                        "
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
            {showPaymentModal && (
                <PaymentDetailsModal
                    payment={selectedPayment}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}
        </Authenticated>
    );
}
