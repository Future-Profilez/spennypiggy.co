// resources/js/Pages/billing/Billing_dashboard.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";
import CreatorDashboardTabs from "@/Components/CreatorDashboardTabs";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

export default function Billing_dashboard(props) {
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState("3months"); // ADD THIS LINE
    const [data, setData] = useState({
        total_bills: 0,
        active_bills: 0,
        total_revenue: 0,
        monthly_revenue: 0,
        total_paid_amount: 0,
        total_payments: 0,
        unique_customers: 0,
        recent_bills: [],
        recent_payments: [],
        monthly_data: [],
        top_bills: [],
        all_bills: [],
        currency: "£",
        currency_code: "GBP",
    });

    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchdata = () => {
        setLoading(true);

        axios
            .get(`/billing/api/dashboard`)
            .then((res) => {
                const bills = res.data?.bills || [];

                // TOP BILLS
                const topBills = [...bills]
                    .sort(
                        (a, b) =>
                            (b.total_revenue || 0) - (a.total_revenue || 0),
                    )
                    .slice(0, 5);

                setData({
                    total_bills: res.data?.stats?.total_bills || 0,

                    active_bills: bills.filter((bill) => bill.status === 1)
                        .length,

                    total_revenue: res.data?.stats?.total_revenue || 0,

                    monthly_revenue: res.data?.stats?.monthly_revenue || 0,

                    total_paid_amount: res.data?.stats?.total_revenue || 0,

                    total_payments: bills.reduce(
                        (total, bill) => total + Number(bill.buyers_count || 0),
                        0,
                    ),

                    unique_customers: res.data?.stats?.unique_customers || 0,

                    estimated_next_month:
                        res.data?.stats?.estimated_next_month || 0,

                    recent_bills: bills.slice(0, 5),

                    recent_payments: [],

                    monthly_data: res.data?.chart || [],

                    top_bills: topBills,

                    all_bills: bills,

                    currency: res.data?.currency || "£",

                    currency_code: res.data?.currency_code || "GBP",
                });

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
    const displayCurrency = data?.currency || "£";

    // Filter bills based on status and search
    const filteredBills = (data?.all_bills || []).filter((bill) => {
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && bill.status === 1) ||
            (filterStatus === "inactive" && bill.status === 0);
        const matchesSearch = (bill?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Calculate collection rate
    const collectionRate =
        data.total_revenue > 0
            ? (data.total_paid_amount / data.total_revenue) * 100
            : 0;

    // Get chart data based on selected period
    const getChartData = () => {
        let dataToShow = [...(data?.monthly_data || [])];
        if (selectedPeriod === "6months") {
            dataToShow = dataToShow.slice(-6);
        } else if (selectedPeriod === "3months") {
            dataToShow = dataToShow.slice(-3);
        }
        return dataToShow;
    };

    const chartData = getChartData();

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

    const peakMonth =
        chartData?.reduce(
            (max, item) => (item.amount > max.amount ? item : max),
            chartData[0] || {
                amount: 0,
                month: "",
            },
        ) || {};

    const averageRevenue =
        chartData?.length > 0
            ? (
                  chartData.reduce(
                      (sum, item) => sum + Number(item.amount || 0),
                      0,
                  ) / chartData.length
              ).toFixed(0)
            : 0;
    const RevenueChart = ({ data, currency }) => {
        return (
            <div className="w-full h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="revenueGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#06b6d4"
                                    stopOpacity={0.45}
                                />

                                <stop
                                    offset="100%"
                                    stopColor="#06b6d4"
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
                                borderRadius: "16px",
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
                            stroke="#06b6d4"
                            strokeWidth={4}
                            fill="url(#revenueGradient)"
                            dot={{
                                r: 5,
                                strokeWidth: 3,
                                fill: "#0f172a",
                                stroke: "#06b6d4",
                            }}
                            activeDot={{
                                r: 8,
                                fill: "#06b6d4",
                                stroke: "#fff",
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={"Bill Dashboard"} />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gray-200">
                    <div className="containerbox m-auto">
                        <div className="py-8 md:py-16 w-full m-auto">
                        {/* Header Section */}
                        <CreatorDashboardTabs />
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-16 h-16 bg-yellow-300 flex items-center justify-center text-3xl bg-white border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            💳
                                        </div>

                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-GillSans uppercase text-black tracking-tight">
                                                Bill Dashboard
                                            </h1>

                                            <p className="text-gray-600 mt-1 text-sm">
                                                Track all creator bill revenue,
                                                payments and supporter analytics
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid - Main Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 md:gap-8 mb-10">
                            {/* TOTAL BILLS */}
                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-blue-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        📄
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        Total
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-black">
                                        {data.total_bills || 0}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Total Bills Created
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>

                                    <span className="text-xs text-green-300">
                                        {data.active_bills || 0} active bills
                                    </span>
                                </div>
                            </div>

                            {/* TOTAL REVENUE */}
                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-emerald-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        💰
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        Lifetime
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-black">
                                        {displayCurrency}
                                        {Number(
                                            data.total_revenue || 0,
                                        ).toLocaleString()}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Total Revenue
                                    </p>
                                </div>

                                <div className="w-full">
                                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                                        <span>Collection Rate</span>

                                        <span>
                                            {Math.round(collectionRate)}%
                                        </span>
                                    </div>

                                    <div className="h-2 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                                            style={{
                                                width: `${collectionRate}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* MONTHLY REVENUE */}
                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6 min-h-[190px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-amber-200 flex items-center justify-center text-2xl border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        📈
                                    </div>

                                    <span className="text-xs bg-white text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 font-black uppercase">
                                        This Month
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-black">
                                        {displayCurrency}
                                        {Number(
                                            data.monthly_revenue || 0,
                                        ).toLocaleString()}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Monthly Revenue
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-green-300">
                                        {data.total_payments || 0} payments
                                    </span>

                                    <span className="text-xs text-amber-300">
                                        Live tracking
                                    </span>
                                </div>
                            </div>

                            {/* NEXT MONTH */}
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
                                    <h2 className="text-4xl md:text-5xl font-black text-black">
                                        {displayCurrency}
                                        {Number(
                                            data.estimated_next_month || 0,
                                        ).toLocaleString()}
                                    </h2>

                                    <p className="text-gray-600 text-sm mt-2">
                                        Estimated Next Month
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>

                                    <span className="text-xs text-cyan-300">
                                        Based on active subscriptions
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Performing Bills & Chart Section */}
                        <div className="flex flex-col gap-6 md:gap-8 mb-10">
                            {/* Top Performing Bills */}
                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-4">
                                <div className="mb-4">
                                    <h2 className="text-xl font-GillSans uppercase font-black text-black">
                                        Top Performing Bills
                                    </h2>
                                    <p className="text-gray-600 text-xs">
                                        Bills with highest revenue
                                    </p>
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                    {data.top_bills?.length > 0 ? (
                                        data.top_bills.map((bill, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 rounded-3xl bg-gray-100 border-2 border-black rounded-[20px] mb-2 hover:bg-gray-200 hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                                                onClick={() =>
                                                    (window.location.href = `/billing/bill/${bill.uuid}`)
                                                }
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center text-sm font-bold text-black border-2 border-black rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                        #{index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-black truncate max-w-[150px]">
                                                                {bill.name}
                                                            </p>
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full ${bill.status === 1 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                                                            >
                                                                {bill.status ===
                                                                1
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-xs text-gray-600">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    bill.price,
                                                                ).toLocaleString()}{" "}
                                                                / {bill.period}
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                👥{" "}
                                                                {bill.buyers_count ||
                                                                    0}{" "}
                                                                buyers
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-black">
                                                        {displayCurrency}
                                                        {Number(
                                                            bill.total_revenue ||
                                                                0,
                                                        ).toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        total revenue
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600 text-sm">
                                                No bills created yet
                                            </p>
                                            <Link
                                                href="/bills/create"
                                                className="text-blue-400 text-sm mt-2 inline-block"
                                            >
                                                Create your first bill →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* REVENUE ANALYTICS */}

                            <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all overflow-hidden">
                                {/* HEADER */}

                                <div className="p-6 border-b-[3px] border-black">
                                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                                        <div>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <h2 className="text-2xl md:text-3xl font-GillSans uppercase text-black">
                                                        Revenue Performance
                                                    </h2>

                                                    <p className="text-gray-600 text-sm mt-1">
                                                        Monthly growth and
                                                        creator earnings trend
                                                    </p>
                                                </div>

                                                <div
                                                    className={`
                                                        px-4 py-2 rounded-[30px]
                                                        flex items-center gap-2
                                                        border
                                                        ${
                                                            isGrowthPositive
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                : "bg-red-500/10 border-red-500/20 text-red-400"
                                                        }
                                                    `}
                                                >
                                                    <span className="text-lg">
                                                        {isGrowthPositive
                                                            ? "↗"
                                                            : "↘"}
                                                    </span>

                                                    <span className="font-black text-lg">
                                                        {growthPercentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <select
                                                value={selectedPeriod}
                                                onChange={(e) =>
                                                    setSelectedPeriod(
                                                        e.target.value,
                                                    )
                                                }
                                                className="
                                                    bg-white/10 border border-white/10
                                                    rounded-[30px] px-5 py-3 text-sm
                                                    text-black focus:outline-none
                                                    focus:ring-2 focus:ring-cyan-500
                                                "
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
                                    </div>
                                </div>

                                {/* ANALYTICS STATS */}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 border-b-[3px] border-black">
                                    {/* GROWTH */}

                                    <div className="rounded-[30px] bg-white/5 border border-white/10 p-5">
                                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                                            Monthly Growth
                                        </p>

                                        <div className="flex items-center gap-3 mt-3">
                                            <h3
                                                className={`text-4xl font-black ${
                                                    isGrowthPositive
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {isGrowthPositive ? "+" : ""}
                                                {growthPercentage}%
                                            </h3>

                                            <div
                                                className={`text-3xl ${
                                                    isGrowthPositive
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {isGrowthPositive ? "↗" : "↘"}
                                            </div>
                                        </div>

                                        <p className="text-gray-500 text-xs mt-2">
                                            Compared to previous month
                                        </p>
                                    </div>

                                    {/* BEST MONTH */}

                                    <div className="rounded-[30px] bg-white/5 border border-white/10 p-5">
                                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                                            Best Performing Month
                                        </p>

                                        <h3 className="text-4xl font-black text-cyan-400 mt-3">
                                            {displayCurrency}
                                            {Number(
                                                peakMonth?.amount || 0,
                                            ).toLocaleString()}
                                        </h3>

                                        <p className="text-gray-700 text-sm mt-2">
                                            {peakMonth?.month || "-"}
                                        </p>
                                    </div>

                                    {/* AVG */}

                                    <div className="rounded-[30px] bg-white/5 border border-white/10 p-5">
                                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                                            Average Revenue
                                        </p>

                                        <h3 className="text-4xl font-black text-amber-400 mt-3">
                                            {displayCurrency}
                                            {Number(
                                                averageRevenue || 0,
                                            ).toLocaleString()}
                                        </h3>

                                        <p className="text-gray-500 text-xs mt-2">
                                            Per selected month range
                                        </p>
                                    </div>
                                </div>

                                {/* CHART */}

                                <div className="p-6">
                                    <div className="rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-5">
                                        {data.monthly_data?.length > 0 ? (
                                            <RevenueChart
                                                data={chartData}
                                                currency={displayCurrency}
                                            />
                                        ) : (
                                            <div className="h-[350px] flex flex-col items-center justify-center">
                                                <div className="text-6xl mb-4">
                                                    📊
                                                </div>

                                                <h3 className="text-2xl font-bold text-black">
                                                    No Analytics Yet
                                                </h3>

                                                <p className="text-gray-600 mt-2">
                                                    Revenue data will appear
                                                    once payments start coming
                                                    in.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Bills Section with Filters */}
                        <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all overflow-hidden mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b-[3px] border-black gap-4">
                                <div>
                                    <h2 className="text-xl font-GillSans uppercase font-black text-black">
                                        All Bills
                                    </h2>
                                    <p className="text-gray-600 text-xs">
                                        Manage and track all your bills
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search bills..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setFilterStatus("all")
                                            }
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "all" ? "bg-blue-500 text-black" : "bg-white/10 text-gray-700 hover:bg-white/20"}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() =>
                                                setFilterStatus("active")
                                            }
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "active" ? "bg-green-500 text-black" : "bg-white/10 text-gray-700 hover:bg-white/20"}`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            onClick={() =>
                                                setFilterStatus("inactive")
                                            }
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "inactive" ? "bg-red-500 text-black" : "bg-white/10 text-gray-700 hover:bg-white/20"}`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredBills?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b-[3px] border-black">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Bill Name
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Period
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Buyers
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Revenue
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-[3px] divide-black">
                                            {filteredBills.map(
                                                (bill, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {bill.thumbnail ? (
                                                                    <img
                                                                        src={
                                                                            bill.thumbnail
                                                                        }
                                                                        alt={
                                                                            bill.name
                                                                        }
                                                                        className="w-8 h-8 rounded-lg object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">
                                                                        📄
                                                                    </div>
                                                                )}
                                                                <span className="text-sm text-black font-medium">
                                                                    {bill.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-black">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    bill.price,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 capitalize">
                                                                {bill.period}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-black">
                                                                {bill.buyers_count ||
                                                                    0}
                                                            </p>
                                                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/10">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>

                                                                <span className="text-[10px] uppercase tracking-wide text-cyan-300">
                                                                    supporters
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-black">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    bill.total_revenue ||
                                                                        0,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bill.status === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                                                            >
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full ${bill.status === 1 ? "bg-emerald-500" : "bg-red-500"}`}
                                                                ></span>
                                                                {bill.status ===
                                                                1
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Link
                                                                href={`/billing/bill/${bill.uuid}`}
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
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-3">
                                        📄
                                    </div>
                                    <h3 className="text-base font-bold text-black mb-1">
                                        No Bills Found
                                    </h3>
                                    <p className="text-gray-600 text-xs mb-4">
                                        {searchTerm
                                            ? "Try a different search term"
                                            : "Create your first bill to start accepting payments"}
                                    </p>
                                    {!searchTerm && filterStatus === "all" && (
                                        <Link
                                            href="/bills/create"
                                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm"
                                        >
                                            Create Bill →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </Authenticated>
    );
}
