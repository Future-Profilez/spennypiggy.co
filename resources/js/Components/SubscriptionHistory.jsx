import React from "react";
import {
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowRight,
    CreditCard,
    RefreshCw,
} from "lucide-react";

// Simple date formatting function
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch (error) {
        return "Invalid Date";
    }
};

const getSubscriptionPhase = (subscription) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trialStart = subscription.current_start_trial_date
        ? new Date(subscription.current_start_trial_date)
        : null;
    const trialEnd = subscription.current_end_trial_date
        ? new Date(subscription.current_end_trial_date)
        : null;

    const subStart = subscription.current_start_subscription_date
        ? new Date(subscription.current_start_subscription_date)
        : null;
    const subEnd = subscription.current_end_subscription_date
        ? new Date(subscription.current_end_subscription_date)
        : null;

    // 🚫 If canceled
    if (subscription.status === "canceled") {
        if (trialEnd && today <= trialEnd) {
            return "trial_canceled";
        }
        return "canceled";
    }

    // 🟡 TRIAL ACTIVE
    if (trialStart && trialEnd && today >= trialStart && today <= trialEnd) {
        return "trial_active";
    }

    // 🔴 TRIAL EXPIRED
    if (trialEnd && today > trialEnd && (!subStart || today < subStart)) {
        return "trial_expired";
    }

    // 🟢 SUBSCRIPTION ACTIVE
    if (subStart && subEnd && today >= subStart && today <= subEnd) {
        return "subscription_active";
    }

    // 🔴 SUBSCRIPTION EXPIRED
    if (subEnd && today > subEnd) {
        return "subscription_expired";
    }

    return "unknown";
};

const getDisplayAmount = (subscription, phase) => {
    if (phase.includes("trial")) {
        return 0;
    }
    return subscription.amount;
};

const SubscriptionHistory = ({ subscriptionHistory = [] }) => {
    const getStatusInfo = (status) => {
        const statusConfig = {
            paid: {
                class: "bg-green-100 text-green-700 border border-green-200",
                text: "Paid",
                icon: <CheckCircle2 size={12} className="mr-1" />,
            },
            active: {
                class: "bg-green-100 text-green-700 border border-green-200",
                text: "Active",
                icon: <CheckCircle2 size={12} className="mr-1" />,
            },
            trialing: {
                class: "bg-yellow-100 text-yellow-700 border border-yellow-200",
                text: "Trial",
                icon: <Clock size={12} className="mr-1" />,
            },
            incomplete: {
                class: "bg-red-100 text-red-700 border border-red-200",
                text: "Incomplete",
                icon: <XCircle size={12} className="mr-1" />,
            },
            incomplete_expired: {
                class: "bg-red-100 text-red-700 border border-red-200",
                text: "Expired",
                icon: <XCircle size={12} className="mr-1" />,
            },
            past_due: {
                class: "bg-orange-100 text-orange-700 border border-orange-200",
                text: "Past Due",
                icon: <Clock size={12} className="mr-1" />,
            },
            canceled: {
                class: "bg-gray-100 text-gray-600 border border-gray-200",
                text: "Canceled",
                icon: <XCircle size={12} className="mr-1" />,
            },
            unpaid: {
                class: "bg-red-100 text-red-700 border border-red-200",
                text: "Unpaid",
                icon: <XCircle size={12} className="mr-1" />,
            },
            initiated: {
                class: "bg-blue-100 text-blue-700 border border-blue-200",
                text: "Processing",
                icon: <RefreshCw size={12} className="mr-1 animate-spin" />,
            },
            trial_expired: {
                class: "bg-red-100 text-red-700 border border-red-200",
                text: "Trial Expired",
                icon: <XCircle size={12} className="mr-1" />,
            },
            trial_canceled: {
                class: "bg-gray-100 text-gray-600 border border-gray-200",
                text: "Trial Canceled",
                icon: <XCircle size={12} className="mr-1" />,
            },
        };

        return (
            statusConfig[status] || {
                class: "bg-gray-100 text-gray-700 border border-gray-200",
                text: status || "Unknown",
                icon: null,
            }
        );
    };

    const formatCurrency = (amount, currency = "GBP") => {
        const currencySymbols = {
            GBP: "£",
            USD: "$",
            EUR: "€",
        };
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
    };

    const getExpiryDate = (subscription, phase) => {
        if (phase === "trial_active" || phase === "trial_expired") {
            return formatDate(subscription.current_end_trial_date);
        }

        if (
            phase === "subscription_active" ||
            phase === "subscription_expired"
        ) {
            return formatDate(subscription.current_end_subscription_date);
        }

        return "N/A";
    };

    const getStartDate = (subscription, phase) => {
        if (phase === "trial_active" || phase === "trial_expired") {
            return formatDate(subscription.current_start_trial_date);
        }

        if (
            phase === "subscription_active" ||
            phase === "subscription_expired"
        ) {
            return formatDate(subscription.current_start_subscription_date);
        }

        return "N/A";
    };

    const getRenewalDate = (subscription, phase) => {
        if (
            (phase === "subscription_active" || phase === "trial_active") &&
            subscription.upcoming_payment
        ) {
            return formatDate(subscription.upcoming_payment);
        }
        return null;
    };

    if (!subscriptionHistory || subscriptionHistory.length === 0) {
        return (
            <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <CreditCard
                            className="mx-auto h-12 w-12 opacity-50"
                            strokeWidth={1.5}
                        />
                    </div>
                    <p className="text-gray-500 font-medium">
                        No billing history yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        Your subscription payments will appear here once
                        processed.
                    </p>
                </div>
            </div>
        );
    }

    const getDisplayStatus = (phase, subscription) => {
        switch (phase) {
            case "trial_active":
                return "trialing";
            case "trial_expired":
                return "trial_expired";
            case "subscription_active":
                return "active";
            case "subscription_expired":
                return "incomplete_expired";
            case "canceled":
                return "canceled";
            case "trial_canceled":
                return "trial_canceled";
            default:
                return subscription.status;
        }
    };

    return (
        <div className="bg-white border-t pt-6 border-gray-200 overflow-hidden">
            <div className="pb-4">
                <p className="text-sm text-gray-500">
                    Your recent subscription billing and payment activity.
                </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                {subscriptionHistory.map((subscription, index) => {
                    const phase = getSubscriptionPhase(subscription);
                    const displayStatus = getDisplayStatus(phase, subscription);
                    const statusInfo = getStatusInfo(displayStatus);
                    const nextPayment = getRenewalDate(subscription, phase);
                    const hasEnded =
                        phase === "trial_expired" ||
                        phase === "subscription_expired" ||
                        phase === "canceled";

                    return (
                        <div
                            key={subscription.id || index}
                            className="bg-white border border-gray-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            {/* Left accent bar based on status */}
                            <div
                                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                    phase === "subscription_active"
                                        ? "bg-green-500"
                                        : phase === "trial_active"
                                          ? "bg-yellow-400"
                                          : hasEnded
                                            ? "bg-gray-400"
                                            : "bg-red-500"
                                }`}
                            ></div>

                            {/* Header: Amount & Status */}
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">
                                        {phase === "trial_active"
                                            ? "Trial Period"
                                            : phase === "trial_expired"
                                              ? "Trial Expired"
                                              : "Subscription Charge"}
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-gulfs tracking-wide text-gray-900">
                                            {formatCurrency(
                                                getDisplayAmount(
                                                    subscription,
                                                    phase,
                                                ),
                                                subscription.currency,
                                            )}
                                        </span>
                                        {subscription.tax &&
                                            parseFloat(subscription.tax) >
                                                0 && (
                                                <span className="text-xs text-gray-500 font-medium">
                                                    +{" "}
                                                    {formatCurrency(
                                                        subscription.tax,
                                                        subscription.currency,
                                                    )}{" "}
                                                    tax
                                                </span>
                                            )}
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusInfo.class}`}
                                >
                                    {statusInfo.icon}
                                    {statusInfo.text}
                                </div>
                            </div>

                            {/* Body: Dates */}
                            <div className="bg-gray-50 rounded-[16px] p-4 flex flex-col gap-3">
                                {/* Start & End Row */}
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="flex items-center text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                                            <Calendar
                                                size={10}
                                                className="mr-1"
                                            />{" "}
                                            {phase === "trial_active"
                                                ? "Trial Started"
                                                : "Period Started"}
                                        </span>
                                        <span className="text-gray-800 font-medium text-sm">
                                            {getStartDate(subscription, phase)}
                                        </span>
                                    </div>

                                    <div className="text-gray-300">
                                        <ArrowRight size={16} />
                                    </div>

                                    <div className="flex flex-col text-right">
                                        <span className="flex items-center justify-end text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                                            {hasEnded
                                                ? "Expired On"
                                                : "Period Ends"}{" "}
                                            <Calendar
                                                size={10}
                                                className="ml-1"
                                            />
                                        </span>
                                        <span className="text-gray-800 font-medium text-sm">
                                            {getExpiryDate(subscription, phase)}
                                        </span>
                                    </div>
                                </div>

                                {/* Next Billing Highlight (if applicable) */}
                                {nextPayment && !hasEnded && (
                                    <div className="mt-2 pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-pink-600 uppercase tracking-wide flex items-center">
                                            <RefreshCw
                                                size={12}
                                                className="mr-1.5"
                                            />{" "}
                                            Next Auto-Renewal
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md">
                                            {nextPayment}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {subscriptionHistory.length > 0 && (
                <div className="pt-4 mt-2 text-center">
                    <p className="text-xs font-medium text-gray-400 bg-gray-50 inline-block px-4 py-1.5 rounded-full">
                        Showing {subscriptionHistory.length} billing record
                        {subscriptionHistory.length !== 1 ? "s" : ""}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionHistory;
