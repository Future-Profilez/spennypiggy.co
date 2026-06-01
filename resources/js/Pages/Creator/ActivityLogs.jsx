import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Filter,
    History,
    ChevronLeft,
    ChevronRight,
    Clock,
    Globe,
    Wifi,
    Database,
    Eye,
    EyeOff,
    RefreshCw,
    Trash2,
    PlusCircle,
    Edit,
    Archive,
    Tag,
    ArrowRight,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Calendar,
    User,
    Server,
    Activity,
    Lock,
    Unlock,
    Info,
    TrendingUp,
    DollarSign,
    FileText,
    Link,
    Hash,
} from "lucide-react";

const ActivityLogs = ({ auth, logs, filters, actionTypes }) => {
    const [expandedDetails, setExpandedDetails] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({
        from: filters.date_from || "",
        to: filters.date_to || "",
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const query = Object.fromEntries(
            [...formData.entries()].filter(
                ([_key, value]) => value && value !== "",
            ),
        );
        router.get(route("activity.logs"), query, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClear = () => {
        setSearchTerm("");
        setDateRange({ from: "", to: "" });
        router.get(
            route("activity.logs"),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const toggleDetails = (logId) => {
        setExpandedDetails((prev) => ({
            ...prev,
            [logId]: !prev[logId],
        }));
    };

    const formatDate = (value) => {
        if (!value) return "–";
        const date = new Date(value);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60)
            return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7)
            return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (value) => {
        const str = String(value).toLowerCase();
        if (
            str === "approved" ||
            str === "active" ||
            str === "completed" ||
            str === "unlocked" ||
            str === "yes"
        )
            return {
                bg: "bg-green-100",
                text: "text-green-700",
                border: "border-green-300",
                icon: CheckCircle,
            };
        if (str === "pending")
            return {
                bg: "bg-yellow-100",
                text: "text-yellow-700",
                border: "border-yellow-300",
                icon: AlertCircle,
            };
        if (
            str === "rejected" ||
            str === "inactive" ||
            str === "locked" ||
            str === "expired" ||
            str === "no"
        )
            return {
                bg: "bg-red-100",
                text: "text-red-700",
                border: "border-red-300",
                icon: XCircle,
            };
        return {
            bg: "bg-gray-100",
            text: "text-gray-600",
            border: "border-gray-300",
            icon: null,
        };
    };

    const getModelDisplayName = (modelType) => {
        const names = {
            User: "User Account",
            Task: "Task",
            WishlistItem: "Wishlist Item",
            WishItem: "Wishlist Item",
            Membership: "Membership Plan",
            Product: "Product",
            Cover: "Cover Image",
            Order: "Order",
            Payment: "Payment",
            Review: "Review",
            PiggyPot: "Piggy Pot",
            TipGoal: "Tip Goal",
            Post: "Post",
            Shop: "Shop Item",
            Bills: "Bill",
            Deliverable: "Deliverable",
        };
        const cleanType = modelType?.includes("\\")
            ? modelType.split("\\").pop()
            : modelType;
        return names[cleanType] || cleanType || "Item";
    };

    const getModelIcon = (modelType) => {
        const cleanType = modelType?.includes("\\")
            ? modelType.split("\\").pop()
            : modelType;
        const icons = {
            User: <User size={14} />,
            Product: <Database size={14} />,
            Payment: <DollarSign size={14} />,
            PiggyPot: <TrendingUp size={14} />,
            Post: <FileText size={14} />,
            Task: <CheckCircle size={14} />,
        };
        return icons[cleanType] || <Tag size={14} />;
    };

    const getActionIcon = (actionType) => {
        if (!actionType) return <Tag size={18} />;
        if (actionType.includes("CREATED")) return <PlusCircle size={18} />;
        if (actionType.includes("UPDATED")) return <Edit size={18} />;
        if (actionType.includes("DELETED")) return <Trash2 size={18} />;
        if (actionType.includes("REJECT")) return <XCircle size={18} />;
        if (actionType.includes("APPROVE")) return <CheckCircle size={18} />;
        if (actionType.includes("ARCHIVED")) return <Archive size={18} />;
        if (actionType.includes("RESTORED")) return <RefreshCw size={18} />;
        return <Activity size={18} />;
    };

    const getActionColor = (actionType) => {
        if (!actionType) return "bg-gray-100 text-gray-700";
        if (actionType.includes("CREATED"))
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (actionType.includes("UPDATED"))
            return "bg-blue-50 text-blue-700 border-blue-200";
        if (actionType.includes("DELETED"))
            return "bg-red-50 text-red-700 border-red-200";
        if (actionType.includes("REJECT"))
            return "bg-red-50 text-red-700 border-red-200";
        if (actionType.includes("APPROVE"))
            return "bg-green-50 text-green-700 border-green-200";
        return "bg-gray-100 text-gray-700 border-gray-200";
    };

    const rows = logs?.data || [];
    const filteredRows = searchTerm
        ? rows.filter(
              (log) =>
                  log.reference_name
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  log.action_type
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  getModelDisplayName(log.model_type)
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
          )
        : rows;

    return (
        <Authenticated auth={auth.user} user={auth.user}>
            <Head title="Activity Logs" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl blur-xl opacity-30"></div>
                                    <div className="relative p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg">
                                        <History
                                            className="text-white"
                                            size={28}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Activity Logs
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Track all actions and changes made
                                        within your account
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
                                    <div className="text-xs text-gray-500">
                                        Total Activities
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {logs.total || 0}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
                                    <div className="text-xs text-gray-500">
                                        This Page
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {rows.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-pink-500" />
                                <h2 className="font-semibold text-gray-700">
                                    Filter Activity
                                </h2>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Activity size={14} />
                                            Activity Type
                                        </div>
                                    </label>
                                    <select
                                        name="action_type"
                                        defaultValue={filters.action_type || ""}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    >
                                        <option value="">All Actions</option>
                                        {actionTypes?.map((type) => (
                                            <option key={type} value={type}>
                                                {type.replace(/_/g, " ")}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            From Date
                                        </div>
                                    </label>
                                    <input
                                        type="date"
                                        name="date_from"
                                        value={dateRange.from}
                                        onChange={(e) =>
                                            setDateRange({
                                                ...dateRange,
                                                from: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            To Date
                                        </div>
                                    </label>
                                    <input
                                        type="date"
                                        name="date_to"
                                        value={dateRange.to}
                                        onChange={(e) =>
                                            setDateRange({
                                                ...dateRange,
                                                to: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Search size={14} />
                                            Quick Search
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search by name, action..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-pink-700 hover:to-pink-800 hover:shadow-md transform hover:scale-[1.02]"
                                >
                                    <Filter size={16} />
                                    Apply Filters
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400"
                                >
                                    <RefreshCw size={16} />
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Activity List */}
                    <div className="space-y-4">
                        {filteredRows.length > 0 ? (
                            filteredRows.map((log) => {
                                const hasStatusChange = log.changes?.some(
                                    (c) =>
                                        c.field
                                            ?.toLowerCase()
                                            .includes("status") ||
                                        c.field
                                            ?.toLowerCase()
                                            .includes("approved"),
                                );

                                return (
                                    <div
                                        key={log.id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                                    >
                                        {/* Activity Header */}
                                        <div
                                            className={`p-5 cursor-pointer transition-all ${expandedDetails[log.id] ? "border-b border-gray-200" : ""}`}
                                            onClick={() =>
                                                toggleDetails(log.id)
                                            }
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    {/* Icon */}
                                                    <div
                                                        className={`flex items-center justify-center h-12 w-12 rounded-xl ${getActionColor(log.action_type)}`}
                                                    >
                                                        {getActionIcon(
                                                            log.action_type,
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        {/* Action Type Badge */}
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getActionColor(log.action_type)}`}
                                                            >
                                                                {log.action_type?.replace(
                                                                    /_/g,
                                                                    " ",
                                                                )}
                                                            </span>
                                                            {hasStatusChange && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs">
                                                                    <AlertCircle
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    Status
                                                                    Changed
                                                                </span>
                                                            )}
                                                            {log.changes
                                                                ?.length >
                                                                0 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">
                                                                    <Edit
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    {
                                                                        log
                                                                            .changes
                                                                            .length
                                                                    }{" "}
                                                                    change
                                                                    {log.changes
                                                                        .length >
                                                                    1
                                                                        ? "s"
                                                                        : ""}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Title */}
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                            {log.reference_name ||
                                                                `Item #${log.reference_id}`}
                                                        </h3>

                                                        {/* Model & ID Info */}
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                                                            <div className="flex items-center gap-1">
                                                                {getModelIcon(
                                                                    log.model_type,
                                                                )}
                                                                <span>
                                                                    {getModelDisplayName(
                                                                        log.model_type,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {log.reference_id && (
                                                                <div className="flex items-center gap-1">
                                                                    <Hash
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    <span className="font-mono">
                                                                        ID:{" "}
                                                                        {
                                                                            log.reference_id
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* What Changed Summary */}
                                                        {log.what_changed &&
                                                            log.what_changed
                                                                .length > 0 &&
                                                            !expandedDetails[
                                                                log.id
                                                            ] && (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {log.what_changed
                                                                        .slice(
                                                                            0,
                                                                            2,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                change,
                                                                                idx,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 max-w-full"
                                                                                >
                                                                                    <Info
                                                                                        size={
                                                                                            10
                                                                                        }
                                                                                        className="flex-shrink-0"
                                                                                    />
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            change
                                                                                        }
                                                                                    </span>
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    {log
                                                                        .what_changed
                                                                        .length >
                                                                        2 && (
                                                                        <span className="text-xs text-gray-400">
                                                                            +
                                                                            {log
                                                                                .what_changed
                                                                                .length -
                                                                                2}{" "}
                                                                            more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                        {/* Timestamp */}
                                                        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                                                            <Clock size={12} />
                                                            <span>
                                                                {formatDate(
                                                                    log.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expand Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDetails(log.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 font-medium px-3 py-1.5 rounded-lg hover:bg-pink-50 transition-all"
                                                >
                                                    {expandedDetails[log.id] ? (
                                                        <>
                                                            Hide Details{" "}
                                                            <EyeOff size={14} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            View Details{" "}
                                                            <Eye size={14} />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Detailed Changes - Expanded View */}
                                        {expandedDetails[log.id] && (
                                            <div className="p-5 bg-gray-50 border-t border-gray-200 animate-fadeIn">
                                                {/* Changes Section */}
                                                {log.changes?.length > 0 && (
                                                    <>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                                            <Edit size={14} />
                                                            Detailed Changes
                                                        </h4>
                                                        <div className="space-y-3 mb-6">
                                                            {log.changes.map(
                                                                (
                                                                    change,
                                                                    idx,
                                                                ) => {
                                                                    const oldStatus =
                                                                        getStatusColor(
                                                                            change.old_formatted,
                                                                        );
                                                                    const newStatus =
                                                                        getStatusColor(
                                                                            change.new_formatted,
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                                                                        >
                                                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                                                    <h5 className="font-semibold text-gray-800">
                                                                                        {
                                                                                            change.label
                                                                                        }
                                                                                    </h5>
                                                                                    {change.field
                                                                                        ?.toLowerCase()
                                                                                        .includes(
                                                                                            "status",
                                                                                        ) && (
                                                                                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                                                                            Status
                                                                                            Change
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-4">
                                                                                {change.type ===
                                                                                "change" ? (
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                        {/* Old Value */}
                                                                                        <div
                                                                                            className={`rounded-lg p-4 border ${oldStatus.border} ${oldStatus.bg}`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                                                <span className="text-xs font-semibold text-red-600 uppercase">
                                                                                                    Previous
                                                                                                    Value
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {oldStatus.icon && (
                                                                                                    <oldStatus.icon
                                                                                                        size={
                                                                                                            14
                                                                                                        }
                                                                                                        className={
                                                                                                            oldStatus.text
                                                                                                        }
                                                                                                    />
                                                                                                )}
                                                                                                <span
                                                                                                    className={`text-sm font-medium ${oldStatus.text}`}
                                                                                                >
                                                                                                    {change.old_formatted ||
                                                                                                        "—"}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* New Value */}
                                                                                        <div
                                                                                            className={`rounded-lg p-4 border ${newStatus.border} ${newStatus.bg}`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                                                <span className="text-xs font-semibold text-green-600 uppercase">
                                                                                                    Updated
                                                                                                    Value
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {newStatus.icon && (
                                                                                                    <newStatus.icon
                                                                                                        size={
                                                                                                            14
                                                                                                        }
                                                                                                        className={
                                                                                                            newStatus.text
                                                                                                        }
                                                                                                    />
                                                                                                )}
                                                                                                <span
                                                                                                    className={`text-sm font-medium ${newStatus.text}`}
                                                                                                >
                                                                                                    {change.new_formatted ||
                                                                                                        change.value ||
                                                                                                        "—"}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                                                        <div className="flex items-center gap-2 text-blue-700">
                                                                                            <Info
                                                                                                size={
                                                                                                    16
                                                                                                }
                                                                                            />
                                                                                            <span>
                                                                                                {
                                                                                                    change.value
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Technical Details */}
                                                {(log.ip_address !== "N/A" ||
                                                    log.user_agent ||
                                                    log.method ||
                                                    log.url) && (
                                                    <>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                            <Server size={14} />
                                                            Technical
                                                            Information
                                                        </h4>
                                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                            <div className="p-4 space-y-3 text-sm">
                                                                {log.method &&
                                                                    log.url && (
                                                                        <div className="flex items-start gap-2">
                                                                            <Link
                                                                                size={
                                                                                    14
                                                                                }
                                                                                className="text-gray-400 mt-0.5 flex-shrink-0"
                                                                            />
                                                                            <div className="flex-1">
                                                                                <span className="font-medium text-gray-600">
                                                                                    Request:
                                                                                </span>
                                                                                <span className="ml-2 text-gray-700 font-mono text-xs break-all">
                                                                                    {
                                                                                        log.method
                                                                                    }{" "}
                                                                                    {
                                                                                        log.url
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                {log.ip_address &&
                                                                    log.ip_address !==
                                                                        "N/A" && (
                                                                        <div className="flex items-start gap-2">
                                                                            <Globe
                                                                                size={
                                                                                    14
                                                                                }
                                                                                className="text-gray-400 mt-0.5 flex-shrink-0"
                                                                            />
                                                                            <div>
                                                                                <span className="font-medium text-gray-600">
                                                                                    IP
                                                                                    Address:
                                                                                </span>
                                                                                <span className="ml-2 text-gray-700 font-mono text-xs">
                                                                                    {
                                                                                        log.ip_address
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                {log.user_agent && (
                                                                    <div className="flex items-start gap-2">
                                                                        <Wifi
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-gray-400 mt-0.5 flex-shrink-0"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <span className="font-medium text-gray-600">
                                                                                User
                                                                                Agent:
                                                                            </span>
                                                                            <div className="text-gray-600 text-xs mt-1 break-all font-mono">
                                                                                {
                                                                                    log.user_agent
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                                    <History
                                        size={36}
                                        className="text-gray-400"
                                    />
                                </div>
                                <p className="text-gray-500 font-medium">
                                    No activity log entries found
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Try adjusting your filters or clear the
                                    search
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {(logs.prev_page_url || logs.next_page_url) && (
                        <div className="mt-6 bg-white rounded-2xl px-6 py-4 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-sm text-gray-500">
                                Showing page {logs.current_page} of{" "}
                                {logs.last_page}
                            </div>
                            <div className="flex gap-3">
                                {logs.prev_page_url && (
                                    <a
                                        href={logs.prev_page_url}
                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm"
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </a>
                                )}
                                {logs.next_page_url && (
                                    <a
                                        href={logs.next_page_url}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 px-5 py-2 text-sm font-semibold text-white transition-all hover:from-pink-700 hover:to-pink-800 hover:shadow-md transform hover:scale-[1.02]"
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </Authenticated>
    );
};

export default ActivityLogs;
