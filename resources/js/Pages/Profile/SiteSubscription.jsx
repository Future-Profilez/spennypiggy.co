import { Link, usePage } from "@inertiajs/react";

export default function SiteSubscription({
    children,
    auth,
    subscription_status,
    user,
    card_capabilities,
    site_subscription,
    charges,
    monthly_charges, // This is coming from Dashboard
}) {
    const creatorUser = user ?? auth?.user;

    // Use the prop directly, with fallback to page props if needed
    const page = usePage();
    const finalMonthlyCharges =
        monthly_charges || page.props?.monthly_charges || null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /*
    |--------------------------------------------------------------------------
    | Determine subscription and trial status from monthly_charges data
    |--------------------------------------------------------------------------
    */

    // Check if we have subscription dates
    const isSubscription =
        !!finalMonthlyCharges?.current_start_subscription_date &&
        !!finalMonthlyCharges?.current_end_subscription_date;

    // Check if we have trial dates
    const hasTrial =
        !!finalMonthlyCharges?.current_start_trial_date &&
        !!finalMonthlyCharges?.current_end_trial_date;

    // Get the relevant dates based on what exists
    const startDate = isSubscription
        ? finalMonthlyCharges.current_start_subscription_date
        : finalMonthlyCharges?.current_start_trial_date;

    const endDate = isSubscription
        ? finalMonthlyCharges.current_end_subscription_date
        : finalMonthlyCharges?.current_end_trial_date;

    // Parse and normalize dates for comparison
    const parsedEndDate = endDate ? new Date(endDate) : null;
    if (parsedEndDate) {
        parsedEndDate.setHours(0, 0, 0, 0);
    }

    const isExpired = parsedEndDate && parsedEndDate < today;

    // Check if subscription is currently active (not expired)
    const isActive = !isExpired && (isSubscription || hasTrial);

    // Check if user has cancelled auto-renewal
    const isCancelled = creatorUser?.is_subscription_cancelled || false;

    // Check if user has card payment capabilities
    const hasCapability = card_capabilities !== false;

    // Check if creator is fully enabled
    const isEnabled =
        creatorUser?.social_links?.status === 1 &&
        creatorUser?.avatar_approved === 1 &&
        creatorUser?.bio_approved === 1 &&
        hasCapability;

    /*
    |--------------------------------------------------------------------------
    | Determine current scenario
    |--------------------------------------------------------------------------
    */
    const getScenario = () => {
        if (!finalMonthlyCharges) {
            return "DEFAULT"; // No trial taken yet
        }

        if (isSubscription) {
            return isExpired ? "SUBSCRIPTION_EXPIRED" : "SUBSCRIPTION_ACTIVE";
        }

        if (hasTrial) {
            return isExpired ? "TRIAL_EXPIRED" : "TRIAL_ACTIVE";
        }

        return "DEFAULT";
    };

    const scenario = getScenario();

    /*
    |--------------------------------------------------------------------------
    | Helper functions for displaying dates
    |--------------------------------------------------------------------------
    */
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusBadge = () => {
        switch (scenario) {
            case "SUBSCRIPTION_ACTIVE":
                return {
                    color: "bg-green-100 text-green-800 border-green-300",
                    icon: "✅",
                    text: "Active",
                };
            case "TRIAL_ACTIVE":
                return {
                    color: "bg-blue-100 text-blue-800 border-blue-300",
                    icon: "🎯",
                    text: "Free Trial",
                };
            case "TRIAL_EXPIRED":
                return {
                    color: "bg-amber-100 text-amber-800 border-amber-300",
                    icon: "⏰",
                    text: "Trial Ended",
                };
            case "SUBSCRIPTION_EXPIRED":
                return {
                    color: "bg-red-100 text-red-800 border-red-300",
                    icon: "⚠️",
                    text: "Expired",
                };
            default:
                return {
                    color: "bg-gray-100 text-gray-800 border-gray-300",
                    icon: "📋",
                    text: "Not Started",
                };
        }
    };

    const statusBadge = getStatusBadge();

    /*
    |--------------------------------------------------------------------------
    | Subscription Box Component
    |--------------------------------------------------------------------------
    */
    const SUBSCRIPTIONBOX = () => {
        // Scenario: Active Subscription
        if (scenario === "SUBSCRIPTION_ACTIVE") {
            return (
                <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl p-4">
                        <h4 className="text-[14px] font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <span>📋</span> Subscription Details
                        </h4>
                        <div className="space-y-2 text-sm">
                            {finalMonthlyCharges?.current_start_trial_date && (
                                <div className="flex justify-between items-center py-1 border-b border-blue-200/50">
                                    <span className="text-blue-700">
                                        Free Trial Started
                                    </span>
                                    <span className="font-medium text-blue-900">
                                        {formatDate(
                                            finalMonthlyCharges.current_start_trial_date,
                                        )}
                                    </span>
                                </div>
                            )}
                            {finalMonthlyCharges?.current_end_trial_date && (
                                <div className="flex justify-between items-center py-1 border-b border-blue-200/50">
                                    <span className="text-blue-700">
                                        Free Trial Ended
                                    </span>
                                    <span className="font-medium text-blue-900">
                                        {formatDate(
                                            finalMonthlyCharges.current_end_trial_date,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-1 border-b border-blue-200/50">
                                <span className="text-blue-700">
                                    Subscription Started
                                </span>
                                <span className="font-medium text-blue-900">
                                    {formatDate(
                                        finalMonthlyCharges?.current_start_subscription_date,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-blue-700 font-semibold">
                                    Next Renewal
                                </span>
                                <span className="font-bold text-blue-900">
                                    {formatDate(
                                        finalMonthlyCharges?.current_end_subscription_date,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-[13px] text-gray-600">
                            💳 Monthly subscription:{" "}
                            <span className="font-semibold">£8.99 + VAT</span>
                        </p>
                        {!isCancelled ? (
                            <Link
                                href={route("mandatory.cancel")}
                                method="post"
                                as="button"
                                className="text-sm text-red-600 hover:text-red-800 underline font-medium"
                                onBefore={() =>
                                    confirm(
                                        "Are you sure you want to cancel your auto-renewal? You will keep access until the end of your current period.",
                                    )
                                }
                            >
                                Cancel Auto-Renewal
                            </Link>
                        ) : (
                            <Link
                                href={route("mandatory.resume")}
                                method="post"
                                as="button"
                                className="text-sm text-green-600 hover:text-green-800 underline font-medium"
                                onBefore={() =>
                                    confirm(
                                        "Would you like to re-enable your auto-renewal? You will avoid any interruption to your creator tools.",
                                    )
                                }
                            >
                                Re-enable Auto-renewal
                            </Link>
                        )}
                    </div>
                </div>
            );
        }

        // Scenario: Active Trial
        if (scenario === "TRIAL_ACTIVE") {
            return (
                <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 rounded-xl p-4">
                        <h4 className="text-[14px] font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <span>🎯</span> Trial Details
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1 border-b border-green-200/50">
                                <span className="text-green-700">
                                    Trial Started
                                </span>
                                <span className="font-medium text-green-900">
                                    {formatDate(
                                        finalMonthlyCharges?.current_start_trial_date,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-green-700 font-semibold">
                                    Trial Ends
                                </span>
                                <span className="font-bold text-green-900">
                                    {formatDate(
                                        finalMonthlyCharges?.current_end_trial_date,
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200/50">
                            <p className="text-xs text-green-700">
                                ⏳{" "}
                                {Math.ceil(
                                    (parsedEndDate - today) /
                                        (1000 * 60 * 60 * 24),
                                )}{" "}
                                days remaining
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-[13px] text-gray-600">
                            💳 After trial:{" "}
                            <span className="font-semibold">
                                £8.99 + VAT / month
                            </span>
                        </p>
                        {!isCancelled ? (
                            <Link
                                href={route("mandatory.cancel")}
                                method="post"
                                as="button"
                                className="text-sm text-red-600 hover:text-red-800 underline font-medium"
                                onBefore={() =>
                                    confirm(
                                        "Are you sure you want to cancel your trial? You will lose access to creator tools.",
                                    )
                                }
                            >
                                Cancel Trial
                            </Link>
                        ) : (
                            <Link
                                href={route("mandatory.resume")}
                                method="post"
                                as="button"
                                className="text-sm text-green-600 hover:text-green-800 underline font-medium"
                            >
                                Resume Subscription
                            </Link>
                        )}
                    </div>
                </div>
            );
        }

        // Scenario: Trial Expired
        if (scenario === "TRIAL_EXPIRED") {
            return (
                <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">⏰</span>
                            </div>
                            <div>
                                <h4 className="text-[15px] font-semibold text-amber-900">
                                    Your Free Trial Has Ended
                                </h4>
                                <p className="text-[13px] text-amber-800 mt-1">
                                    Your 3-day free trial ended on{" "}
                                    <span className="font-bold">
                                        {formatDate(
                                            finalMonthlyCharges?.current_end_trial_date,
                                        )}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-[14px] text-gray-700">
                            Subscribe now to maintain full access to all creator
                            features. Your subscription renews at{" "}
                            <span className="text-pink-600 font-bold">
                                £8.99 + VAT / month
                            </span>
                            .
                        </p>
                    </div>

                    <Link
                        href={"/activate-subscription"}
                        className="w-full block text-center bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        Subscribe Now - £8.99/month
                    </Link>
                </div>
            );
        }

        // Scenario: Subscription Expired
        if (scenario === "SUBSCRIPTION_EXPIRED") {
            return (
                <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div>
                                <h4 className="text-[15px] font-semibold text-red-900">
                                    Your Subscription Has Expired
                                </h4>
                                <p className="text-[13px] text-red-800 mt-1">
                                    Your subscription expired on{" "}
                                    <span className="font-bold">
                                        {formatDate(endDate)}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-[14px] text-gray-700">
                            Renew your subscription to regain access to all
                            creator features. Your subscription renews at{" "}
                            <span className="text-pink-600 font-bold">
                                £8.99 + VAT / month
                            </span>
                            .
                        </p>
                    </div>

                    <Link
                        href={"/activate-subscription"}
                        className="w-full block text-center bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        Renew Subscription - £8.99/month
                    </Link>
                </div>
            );
        }

        // Default: No trial taken yet
        return (
            <div className="mt-4 space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <div>
                            <h4 className="text-[15px] font-semibold text-purple-900">
                                Start Your Free Trial
                            </h4>
                            <p className="text-[13px] text-purple-800 mt-1">
                                Enjoy a{" "}
                                <span className="font-bold uppercase">
                                    3-day free trial
                                </span>{" "}
                                before your monthly subscription begins!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-[14px] text-gray-700">
                        After the trial, your subscription renews at{" "}
                        <span className="text-pink-600 font-bold">
                            £8.99 + VAT / month
                        </span>
                        .
                    </p>
                </div>

                <Link
                    href={"/activate-subscription"}
                    className="w-full block text-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    Start Free Trial
                </Link>
            </div>
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Main Render
    |--------------------------------------------------------------------------
    */
    return (
        <>
            <div className="w-full finishs mb-6 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 rounded-[20px] md:rounded-[30px]">
                {/* Header with Status Badge */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[22px] font-bold uppercase text-black">
                        Subscription Status
                    </h2>
                    <span
                        className={`${statusBadge.color} border-2 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}
                    >
                        <span>{statusBadge.icon}</span>
                        {statusBadge.text}
                    </span>
                </div>

                {/* Status Message based on scenario */}
                {scenario === "DEFAULT" && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-[15px] font-poppins text-gray-700">
                            Unlock all creator features and start accepting
                            payments.
                        </p>
                    </div>
                )}

                {scenario === "TRIAL_ACTIVE" && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-[15px] font-poppins text-green-800">
                            🎉 You're on a free trial! Full access to all
                            features until{" "}
                            <span className="font-bold">
                                {formatDate(
                                    finalMonthlyCharges?.current_end_trial_date,
                                )}
                            </span>
                            .
                        </p>
                    </div>
                )}

                {scenario === "TRIAL_EXPIRED" && (
                    <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-[15px] font-poppins text-amber-800">
                            ⏰ Your free trial has ended. Subscribe now to
                            continue using creator tools.
                        </p>
                    </div>
                )}

                {scenario === "SUBSCRIPTION_ACTIVE" && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-[15px] font-poppins text-green-800">
                            ✅ Your subscription is active. Next renewal on{" "}
                            <span className="font-bold">
                                {formatDate(
                                    finalMonthlyCharges?.current_end_subscription_date,
                                )}
                            </span>
                            .
                        </p>
                        {isCancelled && (
                            <p className="mt-1 text-sm text-red-600">
                                ⚠️ Auto-renewal is cancelled. You'll lose access
                                after {formatDate(endDate)}.
                            </p>
                        )}
                    </div>
                )}

                {scenario === "SUBSCRIPTION_EXPIRED" && (
                    <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-[15px] font-poppins text-red-800">
                            ⚠️ Your subscription expired on{" "}
                            <span className="font-bold">
                                {formatDate(endDate)}
                            </span>
                            . Renew now to regain access.
                        </p>
                    </div>
                )}

                {/* Subscription Box Content */}
                <SUBSCRIPTIONBOX />

                {/* Card payments disabled warning */}
                {!isActive && !isEnabled && card_capabilities === false && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700 text-center">
                            ⚠️ Please{" "}
                            <a
                                href="/stripe/enable_card_payments"
                                className="underline font-bold text-red-800 hover:text-red-900"
                            >
                                enable card payments
                            </a>{" "}
                            to activate your subscription.
                        </p>
                    </div>
                )}
            </div>
            {children}
        </>
    );
}
