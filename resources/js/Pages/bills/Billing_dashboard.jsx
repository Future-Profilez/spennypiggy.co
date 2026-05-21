// resources/js/Pages/billing/Billing_dashboard.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";

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
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);

    const fetchdata = () => {
        setLoading(true);
        axios
            .get(`/billing/api/dashboard`)
            .then((res) => {
                setData(res.data.data);
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

    // Filter bills based on status and search
    const filteredBills = data.all_bills?.filter((bill) => {
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && bill.status === 1) ||
            (filterStatus === "inactive" && bill.status === 0);
        const matchesSearch = bill.name
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
        let dataToShow = [...data.monthly_data];
        if (selectedPeriod === "6months") {
            dataToShow = dataToShow.slice(-6);
        } else if (selectedPeriod === "3months") {
            dataToShow = dataToShow.slice(-3);
        }
        return dataToShow;
    };

    // Enhanced Revenue Chart Component
    const RevenueChart = ({ data: chartData, currency }) => {
        const canvasRef = useRef(null);
        const [tooltipData, setTooltipData] = useState(null);
        const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

        useEffect(() => {
            if (!canvasRef.current || !chartData.length) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const container = canvas.parentElement;
            const width = container.clientWidth - 32;
            const height = 300;

            canvas.width = width;
            canvas.height = height;

            const values = chartData.map((item) => item.amount);
            const maxValue = Math.max(...values, 1);
            const minValue = Math.min(...values, 0);
            const valueRange = maxValue - minValue;

            const padding = { top: 20, right: 20, bottom: 30, left: 50 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            const barWidth = (chartWidth / chartData.length) * 0.7;
            const barSpacing = (chartWidth / chartData.length) * 0.3;

            ctx.clearRect(0, 0, width, height);

            // Draw background grid
            ctx.save();
            ctx.translate(padding.left, padding.top);

            // Draw horizontal grid lines and Y-axis labels
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillStyle = "#94a3b8";
            ctx.font = "11px 'Inter', sans-serif";
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";

            for (let i = 0; i <= 5; i++) {
                const value = minValue + (valueRange * i) / 5;
                const y = chartHeight - (chartHeight * i) / 5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(chartWidth, y);
                ctx.stroke();
                ctx.fillStyle = "#94a3b8";
                ctx.fillText(
                    `${currency}${Math.round(value).toLocaleString()}`,
                    -8,
                    y,
                );
            }

            // Draw vertical grid lines and X-axis labels
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#94a3b8";

            chartData.forEach((item, index) => {
                const x = index * (barWidth + barSpacing) + barWidth / 2;
                ctx.fillText(item.month, x, chartHeight + 8);
            });

            // Draw bars with gradient
            chartData.forEach((item, index) => {
                const x = index * (barWidth + barSpacing);
                const barHeight =
                    ((item.amount - minValue) / valueRange) * chartHeight;
                const y = chartHeight - barHeight;

                // Create gradient
                const gradient = ctx.createLinearGradient(
                    x,
                    y,
                    x,
                    y + barHeight,
                );
                gradient.addColorStop(0, "#60a5fa");
                gradient.addColorStop(1, "#3b82f6");

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, barHeight);

                // Add hover highlight
                if (tooltipData && tooltipData.index === index) {
                    ctx.fillStyle = "rgba(96, 165, 250, 0.3)";
                    ctx.fillRect(x, 0, barWidth, chartHeight);

                    // Draw tooltip
                    const mouseX = tooltipPosition.x - padding.left;
                    const mouseY = tooltipPosition.y - padding.top;
                    const tooltipX = Math.min(
                        Math.max(mouseX - 60, 0),
                        chartWidth - 120,
                    );
                    const tooltipY = Math.max(mouseY - 40, 0);

                    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                    ctx.fillRect(tooltipX, tooltipY, 120, 35);
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = "#fff";
                    ctx.font = "bold 12px 'Inter', sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(
                        `${currency}${item.amount.toLocaleString()}`,
                        tooltipX + 60,
                        tooltipY + 15,
                    );
                    ctx.font = "10px 'Inter', sans-serif";
                    ctx.fillStyle = "#94a3b8";
                    ctx.fillText(item.month, tooltipX + 60, tooltipY + 28);
                }
            });

            // Draw value labels on top of bars for tall bars
            ctx.font = "bold 11px 'Inter', sans-serif";
            ctx.fillStyle = "#cbd5e1";
            ctx.textAlign = "center";

            chartData.forEach((item, index) => {
                const x = index * (barWidth + barSpacing) + barWidth / 2;
                const barHeight =
                    ((item.amount - minValue) / valueRange) * chartHeight;
                const y = chartHeight - barHeight;
                if (barHeight > 25 && item.amount > 0) {
                    ctx.fillStyle = "#fff";
                    ctx.fillText(
                        `${currency}${item.amount.toLocaleString()}`,
                        x,
                        y - 5,
                    );
                }
            });

            ctx.restore();

            // Mouse move handler for tooltips
            const handleMouseMove = (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const mouseX = (e.clientX - rect.left) * scaleX - padding.left;

                if (mouseX >= 0 && mouseX <= chartWidth) {
                    const index = Math.floor(mouseX / (barWidth + barSpacing));
                    if (index >= 0 && index < chartData.length) {
                        setTooltipData({
                            index,
                            value: chartData[index].amount,
                            month: chartData[index].month,
                        });
                        setTooltipPosition({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                        });
                    } else {
                        setTooltipData(null);
                    }
                } else {
                    setTooltipData(null);
                }
            };

            const handleMouseLeave = () => {
                setTooltipData(null);
            };

            canvas.addEventListener("mousemove", handleMouseMove);
            canvas.addEventListener("mouseleave", handleMouseLeave);

            return () => {
                canvas.removeEventListener("mousemove", handleMouseMove);
                canvas.removeEventListener("mouseleave", handleMouseLeave);
            };
        }, [chartData, currency, tooltipData, tooltipPosition]);

        return (
            <div className="relative w-full">
                <canvas
                    ref={canvasRef}
                    className="w-full h-[300px]"
                    style={{ width: "100%", height: "300px" }}
                />
            </div>
        );
    };

    // Updated BillDetailsModal component - Replace your existing modal with this
    // Updated BillDetailsModal component - Aligned version

    const BillDetailsModal = ({ bill, onClose }) => {
        if (!bill) return null;

        const performancePercentage =
            bill.total_revenue && bill.price
                ? Math.min(
                      100,
                      Math.round(
                          ((bill.total_revenue || 0) / (bill.price * 10)) * 100,
                      ),
                  )
                : 0;

        return (
            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            >
                <div
                    className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Hero Section */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-t-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute bottom-4 left-6 flex items-center gap-4">
                            {bill.thumbnail ? (
                                <img
                                    src={bill.thumbnail}
                                    alt={bill.name}
                                    className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-xl"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl border-4 border-white shadow-xl">
                                    📄
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {bill.name}
                                </h2>
                                <p className="text-white/80 text-xs">
                                    Bill ID: {bill.uuid?.slice(0, 8)}...
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white text-xl flex items-center justify-center transition-all hover:scale-110"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6">
                        {/* Stats Grid - 4 Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider">
                                    Price
                                </p>
                                <p className="text-xl font-bold text-white mt-1">
                                    {displayCurrency}
                                    {Number(bill.price).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-400 capitalize">
                                    per {bill.period}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider">
                                    Total Revenue
                                </p>
                                <p className="text-xl font-bold text-green-400 mt-1">
                                    {displayCurrency}
                                    {Number(
                                        bill.total_revenue || 0,
                                    ).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-400">
                                    lifetime earnings
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider">
                                    Total Buyers
                                </p>
                                <p className="text-xl font-bold text-purple-400 mt-1">
                                    {bill.total_buyers || 0}
                                </p>
                                <p className="text-xs text-slate-400">
                                    unique customers
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider">
                                    Status
                                </p>
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${bill.status === 1 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${bill.status === 1 ? "bg-green-500" : "bg-red-500"}`}
                                    ></span>
                                    {bill.status === 1 ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Column - Bill Information */}
                            <div className="bg-white/5 rounded-xl p-6">
                                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                                    Bill Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Period
                                        </span>
                                        <span className="text-white capitalize font-medium text-sm">
                                            {bill.period}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Currency
                                        </span>
                                        <span className="text-white font-medium text-sm">
                                            {bill.currency || "GBP"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Created Date
                                        </span>
                                        <span className="text-white font-medium text-sm">
                                            {new Date(
                                                bill.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Last Payment
                                        </span>
                                        <span className="text-white font-medium text-sm">
                                            {bill.last_payment_date
                                                ? new Date(
                                                      bill.last_payment_date,
                                                  ).toLocaleDateString()
                                                : "No payments yet"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Performance Insights */}
                            <div className="bg-white/5 rounded-xl p-6">
                                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                    <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                                    Performance Insights
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-400">
                                                Revenue Target Progress
                                            </span>
                                            <span className="text-white font-bold text-sm">
                                                {performancePercentage}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${performancePercentage}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Target: {displayCurrency}
                                            {(
                                                bill.price * 10
                                            ).toLocaleString()}{" "}
                                            (10 sales)
                                        </p>
                                    </div>
                                    {bill.total_buyers > 0 && (
                                        <>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-slate-400 text-sm">
                                                    Average per Buyer
                                                </span>
                                                <span className="text-white font-semibold text-sm">
                                                    {displayCurrency}
                                                    {Math.round(
                                                        (bill.total_revenue ||
                                                            0) /
                                                            bill.total_buyers,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-sm">
                                                    Monthly Average
                                                </span>
                                                <span className="text-white font-semibold text-sm">
                                                    {displayCurrency}
                                                    {Math.round(
                                                        (bill.total_revenue ||
                                                            0) /
                                                            (bill.months_active ||
                                                                1),
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content File Section */}
                        {bill.content_file && (
                            <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-blue-500/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-400 text-sm font-medium">
                                            Content File Available
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                            Customers get access after payment
                                        </p>
                                    </div>
                                    <a
                                        href={bill.content_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors"
                                    >
                                        Download →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Recent Payments Preview */}
                        {bill.recent_payments &&
                            bill.recent_payments.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                                        <span className="w-1 h-5 bg-yellow-500 rounded-full"></span>
                                        Recent Transactions
                                    </h3>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                        {bill.recent_payments
                                            .slice(0, 3)
                                            .map((payment, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between items-center p-2 bg-white/5 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="text-white text-sm font-medium">
                                                            {payment.customer_name ||
                                                                "Anonymous"}
                                                        </p>
                                                        <p className="text-slate-400 text-xs">
                                                            {new Date(
                                                                payment.created_at,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-green-400 font-semibold text-sm">
                                                            {displayCurrency}
                                                            {Number(
                                                                payment.amount,
                                                            ).toLocaleString()}
                                                        </p>
                                                        <p className="text-slate-400 text-xs capitalize">
                                                            {payment.recurring_type ||
                                                                "one-time"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                        {/* Footer */}
                        <div className="mt-4 pt-3 text-center border-t border-white/10">
                            <p className="text-slate-500 text-xs">
                                Manage your bill and track all payments from one
                                place
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title={"Bill Dashboard"} />
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                        {/* Header Section */}
                        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                                    Bill Dashboard
                                </h1>
                                <p className="text-slate-400 mt-1 text-sm">
                                    Track your bills, payments, and revenue
                                    insights
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/membership-dashboard"
                                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm text-white flex items-center gap-2"
                                >
                                    <span>📊</span>
                                    Membership Dashboard
                                </Link>
                            </div>
                        </div>

                        {/* Stats Grid - Main Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-blue-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">
                                        📄
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                                        Total
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {data.total_bills || 0}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Total Bills Created
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-green-400">
                                        {data.active_bills || 0} active bills
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-emerald-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                                        💰
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                                        Lifetime
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {displayCurrency}
                                    {Number(
                                        data.total_revenue || 0,
                                    ).toLocaleString()}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Total Revenue
                                </p>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Collection rate</span>
                                        <span>
                                            {Math.round(collectionRate)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${collectionRate}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-amber-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                                        📈
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
                                        This Month
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {displayCurrency}
                                    {Number(
                                        data.monthly_revenue || 0,
                                    ).toLocaleString()}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Monthly Revenue
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-green-400">
                                        {data.total_payments || 0} total
                                        payments
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-purple-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg">
                                        👥
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
                                        Unique
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {data.unique_customers || 0}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Unique Customers
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-purple-400">
                                        Across all bills
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Performing Bills & Chart Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                            {/* Top Performing Bills */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-white">
                                        Top Performing Bills
                                    </h2>
                                    <p className="text-slate-400 text-xs">
                                        Bills with highest revenue
                                    </p>
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                    {data.top_bills?.length > 0 ? (
                                        data.top_bills.map((bill, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                                onClick={() => {
                                                    setSelectedBill(bill);
                                                    setShowBillModal(true);
                                                }}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                                                        #{index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-white truncate max-w-[150px]">
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
                                                            <p className="text-xs text-slate-400">
                                                                {
                                                                    displayCurrency
                                                                }
                                                                {Number(
                                                                    bill.price,
                                                                ).toLocaleString()}{" "}
                                                                / {bill.period}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                👥{" "}
                                                                {bill.total_buyers ||
                                                                    0}{" "}
                                                                buyers
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-white">
                                                        {displayCurrency}
                                                        {Number(
                                                            bill.total_revenue ||
                                                                0,
                                                        ).toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        total revenue
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-slate-400 text-sm">
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

                            {/* Revenue Chart - Enhanced Canvas Chart */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Revenue Trends
                                        </h2>
                                        <p className="text-slate-400 text-xs">
                                            Monthly bill payment overview
                                        </p>
                                    </div>
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) =>
                                            setSelectedPeriod(e.target.value)
                                        }
                                        className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-white/20 transition-colors"
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
                                <div className="bg-white/5 rounded-lg p-4">
                                    {data.monthly_data?.length > 0 ? (
                                        <RevenueChart
                                            data={getChartData()}
                                            currency={displayCurrency}
                                        />
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center">
                                            <p className="text-slate-400">
                                                No revenue data available
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* All Bills Section with Filters */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-white/10 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        All Bills
                                    </h2>
                                    <p className="text-slate-400 text-xs">
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
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setFilterStatus("all")
                                            }
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "all" ? "bg-blue-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() =>
                                                setFilterStatus("active")
                                            }
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "active" ? "bg-green-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            onClick={() =>
                                                setFilterStatus("inactive")
                                            }
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === "inactive" ? "bg-red-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredBills?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white/10 border-b border-white/10">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Bill Name
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Period
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Buyers
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Revenue
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
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
                                                                <span className="text-sm text-white font-medium">
                                                                    {bill.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-white">
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
                                                            <p className="text-sm text-white">
                                                                {bill.total_buyers ||
                                                                    0}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                unique customers
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-white">
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
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBill(
                                                                        bill,
                                                                    );
                                                                    setShowBillModal(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                            >
                                                                View Details →
                                                            </button>
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
                                    <h3 className="text-base font-bold text-white mb-1">
                                        No Bills Found
                                    </h3>
                                    <p className="text-slate-400 text-xs mb-4">
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

                        {/* Recent Payments Section */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Recent Bill Payments
                                    </h2>
                                    <p className="text-slate-400 text-xs">
                                        Latest transactions from your bills
                                    </p>
                                </div>
                                <Link
                                    href="/billing/all-payments"
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
                                >
                                    View All Payments
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </Link>
                            </div>

                            {data?.recent_payments?.length > 0 ? (
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
                                            {data.recent_payments.map(
                                                (payment, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-white font-medium">
                                                                {
                                                                    payment.bill_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-slate-400 capitalize">
                                                                {
                                                                    payment.recurring_type
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar
                                                                    user={
                                                                        payment.customer
                                                                    }
                                                                    size="sm"
                                                                />
                                                                <div>
                                                                    <p className="text-sm text-white">
                                                                        {payment.customer_name ||
                                                                            "Guest"}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {
                                                                            payment.customer_email
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-white">
                                                                {payment.currency ||
                                                                    displayCurrency}
                                                                {Number(
                                                                    payment.amount,
                                                                ).toLocaleString()}
                                                            </p>
                                                            {payment.total_paid >
                                                                payment.amount && (
                                                                <p className="text-xs text-slate-400">
                                                                    incl. fees:{" "}
                                                                    {payment.currency ||
                                                                        displayCurrency}
                                                                    {Number(
                                                                        payment.total_paid,
                                                                    ).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                                                {payment.recurring_for ===
                                                                "continue"
                                                                    ? "Recurring"
                                                                    : "One-time"}
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

            {/* Bill Details Modal */}
            {showBillModal && (
                <BillDetailsModal
                    bill={selectedBill}
                    onClose={() => setShowBillModal(false)}
                />
            )}
        </Authenticated>
    );
}
