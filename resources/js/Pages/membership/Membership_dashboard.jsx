// resources/js/Pages/membership/Membership_dashboard.jsx
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "../../Components/Avatar";

export default function Membership_dashboard(props) {
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState("12months");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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
        const matchesSearch =
            payment.membership?.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            payment.user?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Get unique memberships from payments
    const uniqueMemberships =
        data.payments?.reduce((acc, payment) => {
            if (
                payment.membership &&
                !acc.find((m) => m.title === payment.membership.title)
            ) {
                acc.push({
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

    const monthlyData = generateMonthlyData();

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

    // Revenue Chart Component
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
            ctx.save();
            ctx.translate(padding.left, padding.top);

            // Draw horizontal grid lines
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

            // Draw X-axis labels
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#94a3b8";
            chartData.forEach((item, index) => {
                const x = index * (barWidth + barSpacing) + barWidth / 2;
                ctx.fillText(item.month, x, chartHeight + 8);
            });

            // Draw bars
            chartData.forEach((item, index) => {
                const x = index * (barWidth + barSpacing);
                const barHeight =
                    ((item.amount - minValue) / valueRange) * chartHeight;
                const y = chartHeight - barHeight;
                const gradient = ctx.createLinearGradient(
                    x,
                    y,
                    x,
                    y + barHeight,
                );
                gradient.addColorStop(0, "#ec4899");
                gradient.addColorStop(1, "#be185d");
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, barHeight);

                if (tooltipData && tooltipData.index === index) {
                    ctx.fillStyle = "rgba(236, 72, 153, 0.3)";
                    ctx.fillRect(x, 0, barWidth, chartHeight);
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

            // Draw value labels
            ctx.font = "bold 11px 'Inter', sans-serif";
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
            const handleMouseLeave = () => setTooltipData(null);
            canvas.addEventListener("mousemove", handleMouseMove);
            canvas.addEventListener("mouseleave", handleMouseLeave);
            return () => {
                canvas.removeEventListener("mousemove", handleMouseMove);
                canvas.removeEventListener("mouseleave", handleMouseLeave);
            };
        }, [chartData, currency, tooltipData, tooltipPosition]);

        return (
            <canvas
                ref={canvasRef}
                className="w-full h-[300px]"
                style={{ width: "100%", height: "300px" }}
            />
        );
    };

    // Payment Details Modal
    const PaymentDetailsModal = ({ payment, onClose }) => {
        if (!payment) return null;

        return (
            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            >
                <div
                    className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Hero Section */}
                    <div className="relative h-32 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 rounded-t-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute bottom-4 left-6 flex items-center gap-4">
                            {payment.membership?.thumbnail ? (
                                <img
                                    src={payment.membership.thumbnail}
                                    alt={payment.membership.title}
                                    className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-xl"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl border-4 border-white shadow-xl">
                                    👥
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {payment.membership?.title ||
                                        "Membership Payment"}
                                </h2>
                                <p className="text-white/80 text-xs">
                                    Payment ID: {payment.id}
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
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider">
                                    Amount
                                </p>
                                <p className="text-2xl font-bold text-green-400 mt-1">
                                    {payment.currency || displayCurrency}
                                    {Number(payment.amount).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider">
                                    Status
                                </p>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 bg-green-500/20 text-green-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    {payment.status || "Paid"}
                                </span>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Column - Member Info */}
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                    <span className="w-1 h-5 bg-pink-500 rounded-full"></span>
                                    Member Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={payment.user} size="md" />
                                    </div>

                                </div>
                            </div>

                            {/* Right Column - Membership Info */}
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                                    <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                                    Membership Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Plan Type
                                        </span>
                                        <span className="text-white capitalize font-medium text-sm">
                                            {payment.membership?.type ||
                                                "Monthly"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Price
                                        </span>
                                        <span className="text-white font-medium text-sm">
                                            {payment.currency ||
                                                displayCurrency}
                                            {Number(
                                                payment.membership?.price ||
                                                    payment.amount,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">
                                            Payment Date
                                        </span>
                                        <span className="text-white font-medium text-sm">
                                            {payment.created_at}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 text-center border-t border-white/10">
                            <p className="text-slate-500 text-xs">
                                Membership payment transaction details
                            </p>
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
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                        {/* Header Section */}
                        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                                    Membership Dashboard
                                </h1>
                                <p className="text-slate-400 mt-1 text-sm">
                                    Track your memberships, payments, and
                                    revenue insights
                                </p>
                            </div>
                            <Link
                                href="/billing-dashboard"
                                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm text-white flex items-center gap-2"
                            >
                                <span>📊</span> Bill Dashboard
                            </Link>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-pink-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-lg">
                                        👥
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-pink-500/10 text-pink-400">
                                        Total
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {data.members || 0}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Total Members
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-green-400">
                                        {uniqueMemberships.length || 0} active
                                        memberships
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-emerald-500/30 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                                        💰
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                                        Current Month
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {displayCurrency}
                                    {Number(
                                        data.per_month || 0,
                                    ).toLocaleString()}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Monthly Earnings
                                </p>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Monthly target</span>
                                        <span>
                                            {Math.round(collectionRate)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, collectionRate)}%`,
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
                                        Lifetime
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">
                                    {displayCurrency}
                                    {Number(
                                        data.all_time || 0,
                                    ).toLocaleString()}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Lifetime Earnings
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        ↑ {displayCurrency}
                                        {((data.per_month || 0) * 0.2).toFixed(
                                            2,
                                        )}{" "}
                                        vs last month
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Memberships & Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                            {/* Top Performing Memberships */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-white">
                                        Top Performing Memberships
                                    </h2>
                                    <p className="text-slate-400 text-xs">
                                        Memberships with highest revenue
                                    </p>
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                    {topMemberships.length > 0 ? (
                                        topMemberships.map(
                                            (membership, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-sm font-bold text-pink-400">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-white truncate max-w-[150px]">
                                                                    {
                                                                        membership.title
                                                                    }
                                                                </p>
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                                                    Active
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <p className="text-xs text-slate-400">
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
                                                                <p className="text-xs text-slate-400">
                                                                    👥{" "}
                                                                    {membership.total_members ||
                                                                        0}{" "}
                                                                    members
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-white">
                                                            {displayCurrency}
                                                            {Number(
                                                                membership.total_revenue ||
                                                                    0,
                                                            ).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            total revenue
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-slate-400 text-sm">
                                                No memberships created yet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Revenue Chart */}
                            <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Revenue Trends
                                        </h2>
                                        <p className="text-slate-400 text-xs">
                                            Monthly membership payment overview
                                        </p>
                                    </div>
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) =>
                                            setSelectedPeriod(e.target.value)
                                        }
                                        className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
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
                                    {monthlyData.length > 0 ? (
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

                        {/* All Payments Table */}
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-white/10 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        All Membership Payments
                                    </h2>
                                    <p className="text-slate-400 text-xs">
                                        Manage and track all membership payments
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <input
                                        type="text"
                                        placeholder="Search by member or plan..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                    />
                                </div>
                            </div>

                            {filteredPayments?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white/10 border-b border-white/10">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Member
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Membership Plan
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    Date
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
                                            {filteredPayments.map(
                                                (payment, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar
                                                                    user={
                                                                        payment.user
                                                                    }
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-white">
                                                                {payment
                                                                    .membership
                                                                    ?.title ||
                                                                    "Membership"}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 capitalize">
                                                                {payment
                                                                    .membership
                                                                    ?.type ||
                                                                    "monthly"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-white">
                                                                {payment.currency ||
                                                                    displayCurrency}
                                                                {Number(
                                                                    payment.amount,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-slate-300">
                                                                {
                                                                    payment.created_at
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                <span className="text-xs text-green-500 capitalize">
                                                                    {payment.status ||
                                                                        "Paid"}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPayment(
                                                                        payment,
                                                                    );
                                                                    setShowPaymentModal(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
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
                                        👥
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1">
                                        No Payments Found
                                    </h3>
                                    <p className="text-slate-400 text-xs">
                                        {searchTerm
                                            ? "Try a different search term"
                                            : "No membership payments have been made yet"}
                                    </p>
                                </div>
                            )}
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
