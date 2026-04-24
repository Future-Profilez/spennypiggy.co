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
} from "lucide-react";

const ActivityLogs = ({ auth, logs, filters, actionTypes }) => {
    const [expandedDetails, setExpandedDetails] = useState({});

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const query = Object.fromEntries(
            [...formData.entries()].filter(([_key, value]) => value),
        );
        router.get(route("activity.logs"), query, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClear = () => {
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
        return new Date(value).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatValueDisplay = (value) => {
        if (value === null || value === "—") return "—";
        if (value === "null") return "—";
        if (value === true || value === "true" || value === 1 || value === "1")
            return "Yes";
        if (
            value === false ||
            value === "false" ||
            value === 0 ||
            value === "0"
        )
            return "No";

        if (
            typeof value === "string" &&
            value.match(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            )
        ) {
            return "File/Image (UUID)";
        }

        return value;
    };

    const getStatusBadge = (field, value) => {
        if (
            field?.toLowerCase().includes("approved") ||
            field?.toLowerCase().includes("status")
        ) {
            if (value === 2 || value === "2" || value === "rejected") {
                return { label: "Rejected", color: "red" };
            }
            if (
                value === 1 ||
                value === "1" ||
                value === true ||
                value === "approved"
            ) {
                return { label: "Approved", color: "green" };
            }
            if (
                value === 0 ||
                value === "0" ||
                value === false ||
                value === "pending"
            ) {
                return { label: "Pending", color: "yellow" };
            }
        }
        return null;
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
        return <Tag size={18} />;
    };

    const getActionColor = (actionType) => {
        if (!actionType) return "bg-gray-100 text-gray-700";
        if (actionType.includes("CREATED"))
            return "bg-emerald-50 text-emerald-700";
        if (actionType.includes("UPDATED")) return "bg-blue-50 text-blue-700";
        if (actionType.includes("DELETED")) return "bg-red-50 text-red-700";
        if (actionType.includes("REJECT")) return "bg-red-50 text-red-700";
        if (actionType.includes("APPROVE")) return "bg-green-50 text-green-700";
        return "bg-gray-100 text-gray-700";
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
        };
        // Clean namespace if present
        const cleanType = modelType?.includes("\\")
            ? modelType.split("\\").pop()
            : modelType;
        return names[cleanType] || cleanType || "Item";
    };

    const rows = logs?.data || [];

    return (
        <Authenticated auth={auth.user} user={auth.user}>
            <Head title="Activity Logs" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header - Same as before */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg shadow-pink-200">
                                <History className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Activity Logs
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Track all actions and changes made within
                                    your account
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Same as before */}
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-gray-500" />
                                <h2 className="font-semibold text-gray-700">
                                    Filter Activity
                                </h2>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid gap-5 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Activity Type
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
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        name="date_from"
                                        defaultValue={filters.date_from || ""}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        name="date_to"
                                        defaultValue={filters.date_to || ""}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-pink-700 hover:shadow-md"
                                >
                                    <Filter size={16} />
                                    Apply Filters
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                                >
                                    <RefreshCw size={16} />
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Activity List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header Stats */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                            <div className="text-sm text-gray-500">
                                Page {logs.current_page} of {logs.last_page}
                            </div>
                        </div>

                        {/* Activity Cards */}
                        <div className="divide-y divide-gray-100">
                            {rows.length > 0 ? (
                                rows.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-6 hover:bg-gray-50/30 transition-colors"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left Side - Action Badge & Time */}
                                            <div>
                                                <div
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getActionColor(log.action_type)} mb-2`}
                                                >
                                                    {getActionIcon(
                                                        log.action_type,
                                                    )}
                                                    <span className="font-semibold text-sm">
                                                        {log.action_type?.replace(
                                                            /_/g,
                                                            " ",
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                                                    <Clock size={12} />
                                                    <span>
                                                        {formatDate(
                                                            log.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Middle - Reference Info */}
                                            <div className="flex-1 min-w-0">
                                                {log.reference_name &&
                                                log.reference_name !==
                                                    `#${log.reference_id}` ? (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {
                                                                    log.reference_name
                                                                }
                                                            </span>
                                                            {log.model_type && (
                                                                <span className="text-xs text-gray-400">
                                                                    (
                                                                    {getModelDisplayName(
                                                                        log.model_type,
                                                                    )}
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                        {log.reference_id && (
                                                            <div className="text-xs text-gray-400">
                                                                ID: #
                                                                {
                                                                    log.reference_id
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : log.reference_id ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            Reference #
                                                            {log.reference_id}
                                                        </div>
                                                        {log.model_type && (
                                                            <div className="text-xs text-gray-400 mt-0.5">
                                                                {getModelDisplayName(
                                                                    log.model_type,
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-400">
                                                        System Action
                                                    </div>
                                                )}

                                                {/* Technical Details Toggle Button */}
                                                <button
                                                    onClick={() =>
                                                        toggleDetails(log.id)
                                                    }
                                                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-pink-600 transition-colors mt-3"
                                                >
                                                    {expandedDetails[log.id] ? (
                                                        <>
                                                            <EyeOff size={12} />
                                                            Hide technical
                                                            details
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye size={12} />
                                                            Show technical
                                                            details
                                                        </>
                                                    )}
                                                </button>

                                                {/* Technical Details Content */}
                                                {expandedDetails[log.id] && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="space-y-2 text-xs">
                                                            {log.ip_address &&
                                                                log.ip_address !==
                                                                    "N/A" && (
                                                                    <div className="flex items-start gap-2">
                                                                        <Globe
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="text-gray-400 mt-0.5 flex-shrink-0"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <span className="font-medium text-gray-600">
                                                                                IP
                                                                                Address:
                                                                            </span>
                                                                            <span className="ml-2 text-gray-700 font-mono break-all">
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
                                                                            12
                                                                        }
                                                                        className="text-gray-400 mt-0.5 flex-shrink-0"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <span className="font-medium text-gray-600">
                                                                            User
                                                                            Agent:
                                                                        </span>
                                                                        <span className="ml-2 text-gray-700 break-all">
                                                                            {
                                                                                log.user_agent
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Side - Changes Details - FIXED SECTION */}
                                            <div>
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-center gap-1.5 mb-3">
                                                        <Database
                                                            size={14}
                                                            className="text-gray-400"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                            Changes
                                                        </span>
                                                    </div>

                                                    {/* FIXED: Check log.changes instead of log */}
                                                    {log.changes &&
                                                    log.changes.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {log.changes.map(
                                                                (
                                                                    change,
                                                                    idx,
                                                                ) => {
                                                                    const statusBadge =
                                                                        getStatusBadge(
                                                                            change.field,
                                                                            change.old ||
                                                                                change.new ||
                                                                                change.value,
                                                                        );

                                                                    if (
                                                                        change.type ===
                                                                        "change"
                                                                    ) {
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="text-sm"
                                                                            >
                                                                                <div className="font-medium text-gray-700 mb-1.5">
                                                                                    {
                                                                                        change.label
                                                                                    }
                                                                                </div>
                                                                                <div className="flex flex-col gap-2 text-xs">
                                                                                    {/* OLD VALUE */}
                                                                                    <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                                                                                        <div className="text-[10px] text-red-500 mb-1">
                                                                                            OLD
                                                                                        </div>
                                                                                        <div className="text-red-700 line-through break-all">
                                                                                            {formatValueDisplay(
                                                                                                change.old,
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* ARROW */}
                                                                                    <div className="flex justify-center">
                                                                                        <ArrowRight
                                                                                            size={
                                                                                                14
                                                                                            }
                                                                                            className="text-gray-400 rotate-90"
                                                                                        />
                                                                                    </div>

                                                                                    {/* NEW VALUE */}
                                                                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                                                                                        <div className="text-[10px] text-emerald-600 mb-1">
                                                                                            NEW
                                                                                        </div>
                                                                                        <div className="text-emerald-700 font-medium break-all">
                                                                                            {formatValueDisplay(
                                                                                                change.new,
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="text-sm"
                                                                            >
                                                                                {change.field ===
                                                                                "created_message" ? (
                                                                                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium">
                                                                                        {formatValueDisplay(
                                                                                            change.value,
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="font-medium text-gray-700 mb-1.5">
                                                                                            {
                                                                                                change.label
                                                                                            }
                                                                                        </div>
                                                                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                                                                            <span className="text-gray-700 text-xs break-words">
                                                                                                {formatValueDisplay(
                                                                                                    change.value,
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                },
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4">
                                                            <AlertCircle
                                                                size={20}
                                                                className="text-gray-300 mx-auto mb-1"
                                                            />
                                                            <p className="text-xs text-gray-400">
                                                                No changes
                                                                recorded
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <History
                                            size={32}
                                            className="text-gray-400"
                                        />
                                    </div>
                                    <p className="text-gray-500">
                                        No activity log entries found
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Try adjusting your filters
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {(logs.prev_page_url || logs.next_page_url) && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-sm text-gray-500">
                                    Page {logs.current_page} of {logs.last_page}
                                </div>
                                <div className="flex gap-2">
                                    {logs.prev_page_url && (
                                        <a
                                            href={logs.prev_page_url}
                                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300"
                                        >
                                            <ChevronLeft size={16} />
                                            Previous
                                        </a>
                                    )}
                                    {logs.next_page_url && (
                                        <a
                                            href={logs.next_page_url}
                                            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-pink-700 hover:shadow-md"
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
        </Authenticated>
    );
};

export default ActivityLogs;
