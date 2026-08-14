// resources/js/Pages/billing/Billing_dashboard.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";
import CreatorDashboardTabs from "@/Components/CreatorDashboardTabs";
import DashboardHero from "@/Components/Dashboard/DashboardHero";
import { exportCsv, csvDateStamp } from "@/utils/exportCsv";
import { FiRefreshCw, FiFileText, FiDollarSign, FiTrendingUp, FiZap, FiDownload } from "react-icons/fi";
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

                    mrr: res.data?.stats?.mrr || 0,
                    active_recurring: res.data?.stats?.active_recurring || 0,
                    churn_rate: res.data?.stats?.churn_rate || 0,
                    cancelled_this_month:
                        res.data?.stats?.cancelled_this_month || 0,

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

    // Share of this month's revenue that is expected to recur next month. Subscriptions
    // are collected by Stripe, so a "collection rate" is always 100% and meaningless —
    // recurring share is the number a creator actually cares about.
    const recurringRate =
        data.monthly_revenue > 0
            ? Math.min(
                  100,
                  (Number(data.estimated_next_month || 0) /
                      Number(data.monthly_revenue || 0)) *
                      100,
              )
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

    const handleExport = () => {
        const rows = (data.all_bills || []).map((bill) => [
            bill.name,
            bill.period,
            `${displayCurrency}${Number(bill.price || 0)}`,
            bill.buyers_count || 0,
            `${displayCurrency}${Number(bill.total_revenue || 0)}`,
            `${displayCurrency}${Number(bill.next_month_estimate || 0)}`,
            bill.status === 1 ? "Active" : "Inactive",
        ]);
        exportCsv(
            `bills-${csvDateStamp()}.csv`,
            ["Bill", "Period", "Price", "Supporters", "Total revenue", "Next month", "Status"],
            rows,
        );
    };

    // The API always returns the last N months, even when every amount is 0.
    // Rendering the chart then draws a flat line pinned to the axis, which reads
    // as a broken widget — only show the chart once there is real revenue to plot.
    const hasChartRevenue = (data.monthly_data || []).some(
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
                                    stopColor="#FF007F"
                                    stopOpacity={0.45}
                                />

                                <stop
                                    offset="100%"
                                    stopColor="#FF007F"
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
                                borderRadius: "20px",
                                color: "#111",
                                boxShadow: "0 12px 34px -14px rgba(0,0,0,0.25)",
                            }}
                            formatter={(value) => [
                                `${currency}${Number(value).toLocaleString()}`,
                                "Revenue",
                            ]}
                        />

                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#FF007F"
                            strokeWidth={4}
                            fill="url(#revenueGradient)"
                            dot={{
                                r: 5,
                                strokeWidth: 3,
                                fill: "#0f172a",
                                stroke: "#FF007F",
                            }}
                            activeDot={{
                                r: 8,
                                fill: "#FF007F",
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
                <div className="min-h-dvh bg-gray-50">
                    <div className="containerbox m-auto">
                        <div className="py-6 md:py-10 w-full m-auto">
                            {/* Header Section */}
                            <CreatorDashboardTabs />

                            <DashboardHero
                                accent="ink"
                                Icon={FiRefreshCw}
                                sticker="Recurring content"
                                label="Total revenue"
                                amount={Number(data.total_revenue || 0)}
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
                                        label: "Active bills",
                                        value: data.active_bills || 0,
                                        Icon: FiFileText,
                                    },
                                    {
                                        label: "This month",
                                        value: `${displayCurrency}${Number(
                                            data.monthly_revenue || 0,
                                        ).toLocaleString()}`,
                                        Icon: FiTrendingUp,
                                    },
                                    {
                                        label: "Payments",
                                        value: data.total_payments || 0,
                                        Icon: FiDollarSign,
                                    },
                                ]}
                            />

                            {/* Stats Grid - Main Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
                                {/* TOTAL BILLS */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-pink-100 flex items-center justify-center border border-gray-100 rounded-box-sm ">
                                            <FiFileText className="text-[#FF007F]" size="1.4rem" />
                                        </div>

                                        <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                            Total
                                        </span>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">
                                            {data.total_bills || 0}
                                        </h2>

                                        <p className="text-gray-600 text-sm mt-2">
                                            Total Bills Created
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>

                                        <span className="text-xs text-emerald-700">
                                            {data.active_bills || 0} active
                                            bills
                                        </span>
                                    </div>
                                </div>

                                {/* TOTAL REVENUE */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-pink-100 flex items-center justify-center border border-gray-100 rounded-box-sm ">
                                            <FiDollarSign className="text-[#FF007F]" size="1.4rem" />
                                        </div>

                                        <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                            Lifetime
                                        </span>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">
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
                                            <span>Recurring share</span>

                                            <span>
                                                {Math.round(recurringRate)}%
                                            </span>
                                        </div>

                                        <div className="h-2 rounded-full bg-gray-200 border border-gray-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-emerald-500"
                                                style={{
                                                    width: `${recurringRate}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* MONTHLY REVENUE */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-pink-100 flex items-center justify-center border border-gray-100 rounded-box-sm ">
                                            <FiTrendingUp className="text-[#FF007F]" size="1.4rem" />
                                        </div>

                                        <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                            This Month
                                        </span>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">
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
                                        <span className="text-xs text-emerald-700">
                                            {data.total_payments || 0} payments
                                        </span>

                                        <span className="text-xs text-gray-600">
                                            Live tracking
                                        </span>
                                    </div>
                                </div>

                                {/* NEXT MONTH */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-pink-100 flex items-center justify-center border border-gray-100 rounded-box-sm ">
                                            <FiZap className="text-[#FF007F]" size="1.4rem" />
                                        </div>

                                        <span className="text-xs bg-white text-black border border-gray-100 rounded-box-sm px-3 py-1 font-black uppercase">
                                            Forecast
                                        </span>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">
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
                                        <div className="w-2 h-2 rounded-full bg-[#FF007F]"></div>

                                        <span className="text-xs text-gray-600">
                                            Based on active subscriptions
                                        </span>
                                    </div>
                                </div>

                                {/* MRR */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-pink-50 flex items-center justify-center rounded-box-sm">
                                            <FiRefreshCw className="text-[#FF007F]" size="1.4rem" />
                                        </div>
                                        <span className="text-xs bg-white text-gray-700 border border-gray-100 rounded-box-sm px-3 py-1 font-semibold uppercase">
                                            Recurring
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">
                                            {displayCurrency}
                                            {Number(
                                                data.mrr || 0,
                                            ).toLocaleString()}
                                        </h2>
                                        <p className="text-gray-600 text-sm mt-2">
                                            Monthly recurring revenue
                                        </p>
                                    </div>
                                    <span className="text-xs text-emerald-700">
                                        {data.active_recurring || 0} active
                                        subscriptions
                                    </span>
                                </div>

                                {/* CHURN */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-5 min-h-[170px] flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-pink-50 flex items-center justify-center rounded-box-sm">
                                            <FiTrendingUp className="text-[#FF007F] rotate-180" size="1.4rem" />
                                        </div>
                                        <span className="text-xs bg-white text-gray-700 border border-gray-100 rounded-box-sm px-3 py-1 font-semibold uppercase">
                                            This month
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">
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
                                        {data.cancelled_this_month || 0} cancelled
                                        this month
                                    </span>
                                </div>
                            </div>

                            {/* Top Performing Bills & Chart Section */}
                            <div className="flex flex-col gap-6 md:gap-8 mb-10">
                                {/* Top Performing Bills */}
                                <div className="bg-white border border-gray-100 rounded-box  duration-200 p-4">
                                    <div className="mb-4">
                                        <h2 className="text-lg font-bold tracking-tight text-gray-900">
                                            Top Performing Bills
                                        </h2>
                                        <p className="text-gray-600 text-xs">
                                            Bills with highest revenue
                                        </p>
                                    </div>
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                        {data.top_bills?.length > 0 ? (
                                            data.top_bills.map(
                                                (bill, index) => (
                                                    <Link
                                                        key={index}
                                                        href={`/billing/bill/${bill.uuid}`}
                                                        className="flex items-center justify-between p-3 rounded-box-sm bg-gray-100 border border-gray-100 mb-2 cursor-pointer transition-colors duration-200 hover:bg-gray-200"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-8 h-8 rounded-box-xs bg-pink-100 flex items-center justify-center text-sm font-bold text-black border border-gray-100 ">
                                                                #{index + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-black truncate max-w-[150px]">
                                                                        {
                                                                            bill.name
                                                                        }
                                                                    </p>
                                                                    <span
                                                                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${bill.status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
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
                                                                        /{" "}
                                                                        {
                                                                            bill.period
                                                                        }
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
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    bill.total_revenue ||
                                                                        0,
                                                                ).toLocaleString()}
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                total revenue
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ),
                                            )
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-600 text-sm">
                                                    No bills created yet
                                                </p>
                                                <Link
                                                    href={route("user.show", { username: auth?.user?.username, page: "bills" })}
                                                    className="text-[#FF007F] font-bold text-sm mt-2 inline-block"
                                                >
                                                    Create your first subscription →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* REVENUE ANALYTICS */}

                                <div className="bg-white border border-gray-100 rounded-box  duration-200 overflow-hidden">
                                    {/* HEADER */}

                                    <div className="p-6 ">
                                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">
                                                            Revenue Performance
                                                        </h2>

                                                        <p className="text-gray-600 text-sm mt-1">
                                                            Monthly growth and
                                                            creator earnings
                                                            trend
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`
                                                        px-4 py-2 rounded-box-sm
                                                        flex items-center gap-2
                                                        border-2
                                                        ${
                                                            isGrowthPositive
                                                                ? "bg-emerald-100 border-emerald-700 text-emerald-700"
                                                                : "bg-red-100 border-red-600 text-red-600"
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
                                                    aria-label="Revenue chart period"
                                                    className="
                                                    bg-white border border-gray-100
                                                    rounded-box-sm min-h-[44px] px-5 py-3 text-sm
                                                    text-black focus:outline-none
                                                    focus:ring-2 focus:ring-pink-500
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

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 border-b-[2px] ">
                                        {/* GROWTH */}

                                        <div className="rounded-box bg-white border border-gray-100 p-5">
                                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                                                Monthly Growth
                                            </p>

                                            <div className="flex items-center gap-3 mt-3">
                                                <h3
                                                    className={`text-3xl font-black ${
                                                        isGrowthPositive
                                                            ? "text-emerald-700"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {isGrowthPositive
                                                        ? "+"
                                                        : ""}
                                                    {growthPercentage}%
                                                </h3>

                                                <div
                                                    className={`text-2xl ${
                                                        isGrowthPositive
                                                            ? "text-emerald-700"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {isGrowthPositive
                                                        ? "↗"
                                                        : "↘"}
                                                </div>
                                            </div>

                                            <p className="text-gray-500 text-xs mt-2">
                                                Compared to previous month
                                            </p>
                                        </div>

                                        {/* BEST MONTH */}

                                        <div className="rounded-box bg-white border border-gray-100 p-5">
                                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                                                Best Performing Month
                                            </p>

                                            <h3 className="text-3xl font-black text-[#FF007F] mt-3">
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

                                        <div className="rounded-box bg-white border border-gray-100 p-5">
                                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                                                Average Revenue
                                            </p>

                                            <h3 className="text-3xl font-black text-black mt-3">
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
                                        <div className="rounded-box bg-white border border-gray-100 p-5">
                                            {hasChartRevenue ? (
                                                <RevenueChart
                                                    data={chartData}
                                                    currency={displayCurrency}
                                                />
                                            ) : (
                                                <div className="h-[350px] flex flex-col items-center justify-center text-center px-6">
                                                    <div className="w-16 h-16 bg-pink-100 border border-gray-100 rounded-box-sm flex items-center justify-center mb-4">
                                                        <FiTrendingUp className="text-[#FF007F]" size="1.9rem" />
                                                    </div>

                                                    <h3 className="text-xl font-black uppercase text-black">
                                                        No revenue yet
                                                    </h3>

                                                    <p className="text-gray-600 mt-2 text-sm max-w-sm">
                                                        Your monthly earnings trend
                                                        appears here once supporters
                                                        start paying.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* All Bills Section with Filters */}
                            <div className="bg-white border border-gray-100 rounded-box  duration-200 overflow-hidden mb-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4  gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-gray-900">
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
                                                aria-label="Search bills"
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                                className="bg-white border border-gray-100 rounded-box-sm min-h-[44px] px-4 py-2 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    setFilterStatus("all")
                                                }
                                                className={`px-3 py-2 min-h-[44px] rounded-box-sm text-sm font-bold border border-gray-100 transition-colors ${filterStatus === "all" ? "bg-[#FF007F] text-black" : "bg-white text-black hover:bg-gray-100"}`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setFilterStatus("active")
                                                }
                                                className={`px-3 py-2 min-h-[44px] rounded-box-sm text-sm font-bold border border-gray-100 transition-colors ${filterStatus === "active" ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-gray-100"}`}
                                            >
                                                Active
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setFilterStatus("inactive")
                                                }
                                                className={`px-3 py-2 min-h-[44px] rounded-box-sm text-sm font-bold border border-gray-100 transition-colors ${filterStatus === "inactive" ? "bg-red-600 text-white" : "bg-white text-black hover:bg-gray-100"}`}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleExport}
                                            disabled={!(data.all_bills || []).length}
                                            aria-label="Export bills to CSV"
                                            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-box-sm text-sm font-semibold bg-gray-900 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                        >
                                            <FiDownload size="0.95rem" /> Export
                                        </button>
                                    </div>
                                </div>

                                {filteredBills?.length > 0 ? (
                                    <>
                                    {/* MOBILE CARD LIST */}
                                    <div className="block lg:hidden divide-y divide-gray-100 border-t border-gray-100">
                                        {filteredBills.map((bill, index) => (
                                            <div key={index} className="p-4">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {bill.thumbnail ? (
                                                            <img
                                                                src={bill.thumbnail}
                                                                alt={bill.name}
                                                                className="w-9 h-9 rounded-box-sm object-cover border border-gray-100"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-box-sm bg-pink-100 border border-gray-100 flex items-center justify-center">
                                                                <FiFileText className="text-[#FF007F]" size="1.1rem" />
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-black text-black truncate">
                                                            {bill.name}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${bill.status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${bill.status === 1 ? "bg-emerald-500" : "bg-red-500"}`}
                                                        ></span>
                                                        {bill.status === 1
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Price
                                                        </p>
                                                        <p className="text-sm font-bold text-black">
                                                            {displayCurrency}
                                                            {Number(
                                                                bill.price,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Period
                                                        </p>
                                                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-box-sm bg-pink-100 border border-gray-100 text-black text-xs font-bold uppercase">
                                                            {bill.period}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Buyers
                                                        </p>
                                                        <p className="text-sm font-bold text-black">
                                                            {bill.buyers_count ||
                                                                0}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Revenue
                                                        </p>
                                                        <p className="text-sm font-bold text-black">
                                                            {displayCurrency}
                                                            {Number(
                                                                bill.total_revenue ||
                                                                    0,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/billing/bill/${bill.uuid}`}
                                                    className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-box-sm bg-[#FF007F] text-black text-sm font-black uppercase border border-gray-100 "
                                                >
                                                    View Details <span>→</span>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>

                                    {/* DESKTOP TABLE */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-100 ">
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
                                            <tbody className="divide-y-[3px] ">
                                                {filteredBills.map(
                                                    (bill, index) => (
                                                        <tr key={index}>
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
                                                                            className="w-8 h-8 rounded-box-xs object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-box-xs bg-pink-100 border border-gray-100 flex items-center justify-center">
                                                                            <FiFileText className="text-[#FF007F]" size="1rem" />
                                                                        </div>
                                                                    )}
                                                                    <span className="text-sm text-black font-medium">
                                                                        {
                                                                            bill.name
                                                                        }
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
                                                                <span className="text-xs px-2 py-1 rounded-box-sm bg-pink-100 text-black border border-gray-100 font-bold capitalize">
                                                                    {
                                                                        bill.period
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-black">
                                                                    {bill.buyers_count ||
                                                                        0}
                                                                </p>
                                                                <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-100">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF007F]"></div>

                                                                    <span className="text-[12px] uppercase tracking-wide text-gray-700">
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
                                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${bill.status === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
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
                                                                px-4 py-2 rounded-box-sm
 bg-[#FF007F] text-black text-sm font-black uppercase border border-gray-100 transition-colors duration-200 hover:brightness-110
                                                            "
                                                                >
                                                                    View Details
                                                                    <span>
                                                                        →
                                                                    </span>
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
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-14 h-14 rounded-box-sm bg-pink-100 border border-gray-100 flex items-center justify-center mb-4">
                                            <FiFileText className="text-[#FF007F]" size="1.6rem" />
                                        </div>
                                        <h3 className="text-base font-bold text-black mb-1">
                                            No Bills Found
                                        </h3>
                                        <p className="text-gray-600 text-xs mb-4">
                                            {searchTerm
                                                ? "Try a different search term"
                                                : "Create your first bill to start accepting payments"}
                                        </p>
                                        {!searchTerm &&
                                            filterStatus === "all" && (
                                                <Link
                                                    href={route("user.show", { username: auth?.user?.username, page: "bills" })}
                                                    className="min-h-[44px] inline-flex items-center px-4 py-2 bg-[#FF007F] text-black font-bold border border-gray-100 rounded-box-sm text-sm"
                                                >
                                                    Create subscription →
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
