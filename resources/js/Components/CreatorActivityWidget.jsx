import React from "react";
import { Link, usePage } from "@inertiajs/react";

const CreatorActivityWidget = (props) => {
    const pge = usePage().props;
    const { activityStatus, className = "" } = props;
    // Posting cadence comes from the fetched activity status (dashboard) or an explicit prop.
    const postingCadence =
        props.postingCadence ?? activityStatus?.postingCadence;
    if (!activityStatus || activityStatus.status === "not_creator") {
        return null;
    }
    if (activityStatus.status === "not_fully_verified") {
        return (
            <div
                className={`rounded-[30px] border-2 p-4 bg-yellow-100 border-yellow-300 text-yellow-800 ${className}`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <span
                            className="text-2xl"
                            role="img"
                            aria-label="status"
                        >
                            ⏳
                        </span>
                        <div>
                            <h3 className="font-semibold text-lg">
                                Complete Your Verification
                            </h3>
                            <p className="text-sm opacity-90">
                                Complete your identity verification and profile
                                approval to start earning with activity
                                requirements.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/creator/activity"
                        className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "grace_period":
                return "bg-white sshadow-pink border-black text-blue-600";
            case "active":
                return "bg-green-100 border-green-500 text-green-800";
            case "insufficient_content":
                return "bg-red-100 border-red-300 text-red-800";
            case "grace_period_ending":
                return "bg-yellow-100 border-yellow-300 text-yellow-800";
            default:
                return "bg-gray-100 border-gray-300 text-gray-800";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "grace_period":
                return "🆕";
            case "active":
                return "✅";
            case "insufficient_content":
                return "⚠️";
            case "grace_period_ending":
                return "⏰";
            default:
                return "ℹ️";
        }
    };

    const getStatusMessage = (status, contentCount, daysRemaining) => {
        switch (status) {
            case "grace_period":
                return `Welcome! You're in your grace period (${daysRemaining || 0} days left). Payments are enabled.`;
            case "active":
                return `Great job! You have ${contentCount} active content items. Payments are enabled.`;
            case "insufficient_content":
                return `Payments are paused. You need ${3 - contentCount} more content items to reactivate payments.`;
            case "grace_period_ending":
                return `Your grace period ends in ${daysRemaining || 0} days. You have ${contentCount} content items.`;
            default:
                return "Activity status unknown";
        }
    };

    const getSuggestions = (status, contentCount) => {
        const suggestions = [];

        if (
            status === "insufficient_content" ||
            (status === "grace_period_ending" && contentCount < 3)
        ) {
            const needed = 3 - contentCount;
            if (needed > 0) {
                suggestions.push(
                    `Create ${needed} more ${needed === 1 ? "item" : "items"}`,
                );
            }
        }

        return suggestions;
    };

    const suggestions = getSuggestions(
        activityStatus.status,
        activityStatus.content_count || activityStatus.current_content || 0,
    );
    return (
        <>
            <div
                className={`rounded-[30px] border-2 p-4 md:p-6 mt-6 lg:mt-0  ${getStatusColor(activityStatus.status)} ${className} !bg-white border-black`}
            >
                <div className="lg:flex items-center justify-between">
                    <div className="md:flex items-centerx gap-3 lg:max-w-[70%] me-3">
                        <div>
                            <h3 className="text-xl font-gulfs uppercase">
                                <span
                                    className="me-2"
                                    role="img"
                                    aria-label="status"
                                >
                                    {getStatusIcon(activityStatus.status)}
                                    {" "}
                                </span>
                                {" "}
                                Activity Status
                            </h3>
                            <p className="text-normal opacity-90 mt-2">
                                {getStatusMessage(
                                    activityStatus.status,
                                    activityStatus.content_count ||
                                        activityStatus.current_content ||
                                        0,
                                    activityStatus.days_remaining || 0,
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="!mt-3">
                        <Link
                            href="/creator/activity"
                            className="text-center border !border-black block lg:inline w-full lg:w-auto whitespace-nowrap text-normal bg-white text-black px-4 py-2 rounded-[30px] text-sm hover:underline opacity-80 hover:opacity-100"
                        >
                            View Details
                        </Link>
                    </div>
                </div>

                {activityStatus.status === "insufficient_content" && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <p className="text-normal opacity-90">
                            <strong>Note:</strong> Once you add the required
                            content, payments will resume automatically within a
                            few minutes.
                        </p>
                    </div>
                )}

                {postingCadence && (
                    <div className="mt-4 pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-normal capitalize font-bold">
                                    Content membership posting
                                </p>
                                <p className="text-sm opacity-80 mt-1">
                                    {postingCadence.member_posts}/
                                    {postingCadence.required} member posts in
                                    the last {postingCadence.window_days} days
                                </p>
                            </div>
                            {(() => {
                                const map = {
                                    paused: [
                                        "bg-red-100 text-red-800 border-red-300",
                                        "⛔ Paused",
                                    ],
                                    active: [
                                        "bg-green-100 text-green-800 border-green-400",
                                        "✅ Active",
                                    ],
                                    grace: [
                                        "bg-blue-100 text-blue-800 border-blue-300",
                                        "🆕 Grace",
                                    ],
                                    at_risk: [
                                        "bg-yellow-100 text-yellow-800 border-yellow-300",
                                        `⚠️ Post ${postingCadence.posts_needed} more`,
                                    ],
                                };
                                const [cls, label] =
                                    map[postingCadence.status] || map.at_risk;
                                return (
                                    <span
                                        className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border ${cls}`}
                                    >
                                        {label}
                                    </span>
                                );
                            })()}
                        </div>
                        {postingCadence.paused && (
                            <p className="text-sm text-red-700 mt-2">
                                Your content memberships are paused. Post{" "}
                                {postingCadence.posts_needed} more member{" "}
                                {postingCadence.posts_needed === 1
                                    ? "post"
                                    : "posts"}
                                {" "}
                                to resume payments.
                            </p>
                        )}
                        {!postingCadence.paused &&
                            postingCadence.pause_in_days != null &&
                            postingCadence.subscriber_count > 0 && (
                                <p className="text-sm text-yellow-800 mt-2">
                                    ⏳{" "}
                                    {postingCadence.pause_in_days <= 1
                                        ? "Pauses within 24 hours"
                                        : `Pauses in ~${postingCadence.pause_in_days} days`}
                                    {" "}— {postingCadence.subscriber_count}{" "}
                                    paying{" "}
                                    {postingCadence.subscriber_count === 1
                                        ? "subscriber"
                                        : "subscribers"}
                                    {" "}
                                    affected.
                                </p>
                            )}
                    </div>
                )}
            </div>
        </>
    );
};

export default CreatorActivityWidget;
