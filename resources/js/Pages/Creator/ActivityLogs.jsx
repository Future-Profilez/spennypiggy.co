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

    const formatValueDisplay = (value) => {
        if (value === null || value === "—" || value === "null") return "—";
        if (value === true || value === "true" || value === 1 || value === "1")
            return "Yes";
        if (
            value === false ||
            value === "false" ||
            value === 0 ||
            value === "0"
        )
            return "No";

        if (typeof value === "string" && value.length > 50) {
            return value.substring(0, 50) + "...";
        }

        return value;
    };

    // Enhanced field value formatter with better status detection
    const formatFieldValue = (field, value) => {
        // Handle empty values
        if (value === null || value === undefined || value === "") return "—";

        // Handle approval fields
        if (field?.toLowerCase().includes("approved")) {
            if (value === 2 || value === "2" || value === "rejected")
                return "Rejected";
            if (
                value === 1 ||
                value === "1" ||
                value === true ||
                value === "approved"
            )
                return "Approved";
            if (
                value === 0 ||
                value === "0" ||
                value === false ||
                value === "pending"
            )
                return "Pending";
            return value;
        }

        // Handle status fields
        if (field?.toLowerCase().includes("status")) {
            if (value === 2 || value === "2") return "Inactive";
            if (value === 1 || value === "1") return "Active";
            return String(value)
                .replaceAll("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
        }

        // Handle lock/profile status
        if (
            field?.toLowerCase().includes("lock") ||
            field?.toLowerCase().includes("profile_status")
        ) {
            if (value === 2 || value === "2") return "Locked";
            if (value === 1 || value === "1") return "Unlocked";
            return value;
        }

        // Handle price/amount fields
        if (
            field?.toLowerCase().includes("price") ||
            field?.toLowerCase().includes("amount")
        ) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return `$${num.toFixed(2)}`;
            }
        }

        return formatValueDisplay(value);
    };

    // Enhanced badge system with proper color mapping for numeric values
    const getStatusBadge = (field, value) => {
        if (value === null || value === undefined || value === "") return null;

        const fieldLower = field?.toLowerCase() || "";

        // Handle approval status
        if (
            fieldLower.includes("approved") ||
            fieldLower.includes("approval")
        ) {
            if (value === 2 || value === "2" || value === "rejected") {
                return {
                    label: "Rejected",
                    color: "red",
                    bgColor: "bg-red-50",
                    textColor: "text-red-700",
                    borderColor: "border-red-200",
                    icon: XCircle,
                };
            }
            if (
                value === 1 ||
                value === "1" ||
                value === true ||
                value === "approved"
            ) {
                return {
                    label: "Approved",
                    color: "green",
                    bgColor: "bg-green-50",
                    textColor: "text-green-700",
                    borderColor: "border-green-200",
                    icon: CheckCircle,
                };
            }
            if (
                value === 0 ||
                value === "0" ||
                value === false ||
                value === "pending"
            ) {
                return {
                    label: "Pending",
                    color: "yellow",
                    bgColor: "bg-yellow-50",
                    textColor: "text-yellow-700",
                    borderColor: "border-yellow-200",
                    icon: AlertCircle,
                };
            }
        }

        // Handle status fields (active/inactive)
        if (fieldLower.includes("status")) {
            if (value === 2 || value === "2" || value === "inactive") {
                return {
                    label: "Inactive",
                    color: "gray",
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-600",
                    borderColor: "border-gray-200",
                    icon: XCircle,
                };
            }
            if (value === 1 || value === "1" || value === "active") {
                return {
                    label: "Active",
                    color: "green",
                    bgColor: "bg-green-50",
                    textColor: "text-green-700",
                    borderColor: "border-green-200",
                    icon: CheckCircle,
                };
            }
        }

        // Handle lock/profile status fields
        if (
            fieldLower.includes("lock") ||
            fieldLower.includes("profile_status")
        ) {
            if (value === 2 || value === "2" || value === "locked") {
                return {
                    label: "Locked",
                    color: "red",
                    bgColor: "bg-red-50",
                    textColor: "text-red-700",
                    borderColor: "border-red-200",
                    icon: Lock,
                };
            }
            if (value === 1 || value === "1" || value === "unlocked") {
                return {
                    label: "Unlocked",
                    color: "green",
                    bgColor: "bg-green-50",
                    textColor: "text-green-700",
                    borderColor: "border-green-200",
                    icon: Unlock,
                };
            }
        }

        return null;
    };

    // Helper to get value display with proper formatting
    const getValueDisplay = (field, value, type = "old") => {
        const formattedValue = formatFieldValue(field, value);
        const badge = getStatusBadge(field, value);

        if (badge) {
            return {
                display: badge.label,
                bgColor: badge.bgColor,
                textColor: badge.textColor,
                borderColor: badge.borderColor,
                icon: badge.icon,
                isBadge: true,
            };
        }

        return {
            display: formattedValue,
            bgColor: type === "old" ? "bg-red-50" : "bg-green-50",
            textColor: type === "old" ? "text-red-700" : "text-green-700",
            borderColor: type === "old" ? "border-red-200" : "border-green-200",
            isBadge: false,
        };
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
            Order: <Activity size={14} />,
        };
        return icons[cleanType] || <Tag size={14} />;
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Showing{" "}
                                    <span className="font-semibold text-gray-900">
                                        {logs.from || 0}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-semibold text-gray-900">
                                        {logs.to || 0}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold text-gray-900">
                                        {logs.total || 0}
                                    </span>{" "}
                                    entries
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                Page {logs.current_page} of {logs.last_page}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {filteredRows.length > 0 ? (
                                filteredRows.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 cursor-pointer"
                                        onClick={() => toggleDetails(log.id)}
                                    >
                                        <div className="max-w-7xl">
                                            {/* HEADER */}
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div
                                                        className={`flex items-center justify-center h-12 w-12 rounded-xl border ${getActionColor(log.action_type)}`}
                                                    >
                                                        {getActionIcon(
                                                            log.action_type,
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span
                                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action_type)}`}
                                                            >
                                                                {getActionIcon(
                                                                    log.action_type,
                                                                )}
                                                                <span className="ml-1">
                                                                    {log.action_type?.replace(
                                                                        /_/g,
                                                                        " ",
                                                                    )}
                                                                </span>
                                                            </span>

                                                            {log.changes
                                                                ?.length >
                                                                0 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
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
                                                                    field(s)
                                                                    updated
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                            {log.reference_name ||
                                                                `Reference #${log.reference_id}`}
                                                        </h3>

                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
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
                                                                <>
                                                                    <span>
                                                                        •
                                                                    </span>
                                                                    <span className="font-mono text-xs">
                                                                        ID:{" "}
                                                                        {
                                                                            log.reference_id
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}

                                                            <span>•</span>
                                                            <div className="flex items-center gap-1">
                                                                <Clock
                                                                    size={12}
                                                                />
                                                                <span className="text-xs">
                                                                    {formatDate(
                                                                        log.created_at,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDetails(log.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 font-medium"
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

                                            {/* CHANGES - Improved Design with Better Alignment */}
                                            {expandedDetails[log.id] &&
                                                log.changes?.length > 0 && (
                                                    <div className="mt-6 animate-fadeIn">
                                                        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                                            <div className="px-4 py-3 border-b border-gray-200 bg-white">
                                                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                    <Edit
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    Detailed
                                                                    Changes
                                                                </h4>
                                                            </div>

                                                            <div className="divide-y divide-gray-200">
                                                                {log.changes.map(
                                                                    (
                                                                        change,
                                                                        idx,
                                                                    ) => {
                                                                        const oldDisplay =
                                                                            getValueDisplay(
                                                                                change.field,
                                                                                change.old,
                                                                                "old",
                                                                            );
                                                                        const newDisplay =
                                                                            getValueDisplay(
                                                                                change.field,
                                                                                change.new,
                                                                                "new",
                                                                            );
                                                                        const isImageField =
                                                                            change.field
                                                                                ?.toLowerCase()
                                                                                .includes(
                                                                                    "avatar",
                                                                                ) ||
                                                                            change.field
                                                                                ?.toLowerCase()
                                                                                .includes(
                                                                                    "cover",
                                                                                ) ||
                                                                            change.field
                                                                                ?.toLowerCase()
                                                                                .includes(
                                                                                    "image",
                                                                                );

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="p-4 hover:bg-white transition-colors"
                                                                            >
                                                                                {/* Field Label */}
                                                                                <div className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                                                                    {
                                                                                        change.label
                                                                                    }
                                                                                </div>

                                                                                {change.type ===
                                                                                "change" ? (
                                                                                    isImageField ? (
                                                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                                            <div className="flex items-center gap-2 text-blue-700">
                                                                                                🖼️
                                                                                                Image
                                                                                                Updated
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        /* Improved Two-Column Layout with Better Alignment */
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                            {/* Old Value Column */}
                                                                                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                                                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                                                                                                        Old
                                                                                                        Value
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div
                                                                                                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm ${oldDisplay.bgColor} ${oldDisplay.textColor} ${oldDisplay.borderColor} break-words max-w-full`}
                                                                                                >
                                                                                                    {oldDisplay.isBadge &&
                                                                                                        oldDisplay.icon && (
                                                                                                            <oldDisplay.icon
                                                                                                                size={
                                                                                                                    14
                                                                                                                }
                                                                                                                className="mr-2 flex-shrink-0"
                                                                                                            />
                                                                                                        )}
                                                                                                    <span className="break-words">
                                                                                                        {oldDisplay.display !==
                                                                                                        "—"
                                                                                                            ? oldDisplay.display
                                                                                                            : "—"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* New Value Column */}
                                                                                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                                                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                                                                                        New
                                                                                                        Value
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div
                                                                                                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${newDisplay.bgColor} ${newDisplay.textColor} ${newDisplay.borderColor} break-words max-w-full`}
                                                                                                >
                                                                                                    {newDisplay.isBadge &&
                                                                                                        newDisplay.icon && (
                                                                                                            <newDisplay.icon
                                                                                                                size={
                                                                                                                    14
                                                                                                                }
                                                                                                                className="mr-2 flex-shrink-0"
                                                                                                            />
                                                                                                        )}
                                                                                                    <span className="break-words">
                                                                                                        {newDisplay.display !==
                                                                                                        "—"
                                                                                                            ? newDisplay.display
                                                                                                            : "—"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                ) : (
                                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                                        <div className="flex items-center gap-2 text-green-700">
                                                                                            <CheckCircle
                                                                                                size={
                                                                                                    16
                                                                                                }
                                                                                            />
                                                                                            <span>
                                                                                                {formatValueDisplay(
                                                                                                    change.value,
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* TECHNICAL DETAILS */}
                                            {expandedDetails[log.id] &&
                                                (log.ip_address ||
                                                    log.user_agent) && (
                                                    <div className="mt-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Server
                                                                size={14}
                                                                className="text-gray-500"
                                                            />
                                                            <h5 className="text-sm font-semibold text-gray-700">
                                                                Technical
                                                                Information
                                                            </h5>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            {log.ip_address && (
                                                                <div className="flex items-start gap-2">
                                                                    <Globe
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-gray-400 mt-0.5"
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
                                                                        className="text-gray-400 mt-0.5"
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
                                                )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center">
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
                            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row items-center justify-between gap-3">
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
