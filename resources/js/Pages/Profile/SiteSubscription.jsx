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

    // Debug: Uncomment to see the data structure
    // console.log("Monthly Charges Data:", finalMonthlyCharges);

    const hasMonthlyChargeRecord = !!finalMonthlyCharges;

    // Detect whether the creator has ever used a free trial via monthly_charges
    const hasUsedFreeTrial =
        finalMonthlyCharges &&
        (finalMonthlyCharges?.current_start_trial_date ||
            finalMonthlyCharges?.current_end_trial_date);

    // Parse the trial end date properly for comparison
    const parseTrialEndDate = () => {
        if (!finalMonthlyCharges?.current_end_trial_date) return null;
        const dateStr = finalMonthlyCharges.current_end_trial_date;
        // Parse "11 June 2026" format or standard date formats
        try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        } catch (e) {
            return null;
        }
    };

    const trialEndDate = parseTrialEndDate();

    // Check if free trial has been used and has already ended
    const hasTrialEnded =
        hasUsedFreeTrial && trialEndDate && trialEndDate <= new Date();

    // Check if creator already has a paid subscription entry
    const hasPaidSubscriptionRecord =
        finalMonthlyCharges &&
        finalMonthlyCharges?.current_start_subscription_date &&
        finalMonthlyCharges?.status === "paid";

    const resolvedStatus =
        site_subscription?.subscription_status_code === 1
            ? "ACTIVE"
            : site_subscription?.subscription_status_code === 2
              ? "FREE_TRIAL"
              : site_subscription?.subscription_status_code === 3
                ? "INACTIVE"
                : site_subscription?.subscription_status_code === 0
                  ? "EXPIRED"
                  : site_subscription?.status?.toUpperCase().includes("EXPIRED")
                    ? "EXPIRED"
                    : site_subscription?.status
                            ?.toUpperCase()
                            .includes("ACTIVE")
                      ? "ACTIVE"
                      : site_subscription?.status
                              ?.toUpperCase()
                              .includes("TRIAL")
                        ? "FREE_TRIAL"
                        : subscription_status === 1
                          ? "ACTIVE"
                          : subscription_status === 2
                            ? "FREE_TRIAL"
                            : subscription_status === 3
                              ? "INACTIVE"
                              : "EXPIRED";

    const isActive = resolvedStatus === "ACTIVE";
    const isTrial = resolvedStatus === "FREE_TRIAL";
    const isCancelled = creatorUser?.is_subscription_cancelled;
    const isExpiredOrInactive =
        resolvedStatus === "EXPIRED" || resolvedStatus === "INACTIVE";

    const hasCapability = card_capabilities !== false;

    const isEnabled =
        creatorUser?.social_links?.status === 1 &&
        creatorUser?.avatar_approved === 1 &&
        creatorUser?.bio_approved === 1 &&
        hasCapability;

    // Allow activation if expired, inactive, OR if active but cancelled (grace period)
    const canActivate =
        isExpiredOrInactive || isEnabled || (isActive && isCancelled);

    const SUBSCRIPTIONBOX = () => {
        // If creator already took a trial and it has ended, show subscription details
        if (hasTrialEnded && hasPaidSubscriptionRecord) {
            return (
                <>
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <p className="text-[14px] text-blue-800 font-semibold">
                                📋 Your Subscription Details
                            </p>
                            <p className="text-[13px] text-blue-700 mt-1">
                                Free trial period started on:{" "}
                                <span className="font-bold">
                                    {
                                        finalMonthlyCharges?.current_start_trial_date
                                    }
                                </span>
                            </p>
                            <p className="text-[13px] text-blue-700">
                                Free trial ended on:{" "}
                                <span className="font-bold">
                                    {
                                        finalMonthlyCharges?.current_end_trial_date
                                    }
                                </span>
                            </p>
                            <p className="text-[13px] text-blue-700 mt-2">
                                Subscription started on:{" "}
                                <span className="font-bold">
                                    {
                                        finalMonthlyCharges?.current_start_subscription_date
                                    }
                                </span>
                            </p>
                        </div>

                        <p className="text-[14px] text-gray-600 mt-2">
                            Next renewal date:{" "}
                            <span className="font-bold text-black">
                                {finalMonthlyCharges?.current_end_subscription_date ||
                                    creatorUser?.upcoming_payment_date ||
                                    creatorUser?.subscription_end}
                            </span>
                        </p>

                        <p className="text-[13px] text-gray-500 mt-1 italic">
                            Monthly subscription: £8.99 + VAT
                        </p>

                        {!isCancelled ? (
                            <Link
                                href={route("mandatory.cancel")}
                                method="post"
                                as="button"
                                className="text-start text-sm text-red-600 hover:text-red-800 underline font-medium mt-2"
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
                                className="text-start text-sm text-green-600 hover:text-green-800 underline font-medium mt-2"
                                onBefore={() =>
                                    confirm(
                                        "Would you like to re-enable your auto-renewal? You will avoid any interruption to your creator tools.",
                                    )
                                }
                            >
                                Renew Subscription (Re-enable Auto-renewal)
                            </Link>
                        )}
                    </div>
                </>
            );
        }

        // If currently on active subscription or trial, show active details
        if (isActive || isTrial) {
            return (
                <>
                    <div className="flex flex-col gap-2 mt-2">
                        <p className="text-[14px] text-gray-600">
                            {isTrial
                                ? "Trial period ends on: "
                                : "Next renewal date: "}
                            <span className="font-bold text-black">
                                {creatorUser?.upcoming_payment_date ||
                                    creatorUser?.subscription_end}
                            </span>
                        </p>

                        {!isCancelled ? (
                            <Link
                                href={route("mandatory.cancel")}
                                method="post"
                                as="button"
                                className="text-start text-sm text-red-600 hover:text-red-800 underline font-medium"
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
                                className="text-start text-sm text-green-600 hover:text-green-800 underline font-medium"
                                onBefore={() =>
                                    confirm(
                                        "Would you like to re-enable your auto-renewal? You will avoid any interruption to your creator tools.",
                                    )
                                }
                            >
                                Renew Subscription (Re-enable Auto-renewal)
                            </Link>
                        )}
                    </div>
                </>
            );
        }

        // If creator already has a monthly charge record but is not active or on trial,
        // show the re-subscribe / resume subscription flow.
        if (hasMonthlyChargeRecord && !isActive && !isTrial) {
            return (
                <>
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
                        <p className="text-[15px] font-poppins text-start text-amber-900 font-semibold">
                            ⏰ Your Trial Period Has Ended
                        </p>
                        <p className="text-[14px] text-amber-800 mt-2">
                            Your 3-day free trial ended on{" "}
                            <span className="font-bold">
                                {finalMonthlyCharges?.current_end_trial_date}
                            </span>
                            . Continue with your monthly subscription to keep
                            using creator tools and accept payments.
                        </p>
                    </div>

                    <p className="mb-4 text-[15px] font-poppins text-start text-gray-700">
                        Resume your subscription to maintain full access to all
                        creator features. Your subscription renews at{" "}
                        <span className="text-pink-600 font-bold">
                            £8.99 + VAT / month
                        </span>
                        .
                    </p>

                    <Link
                        href={"/activate-subscription"}
                        className={`btn-pink !text-sm sm:!text-normal md:!text-[17px] w-full block text-center 
                        bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-3 transition-all duration-200
                        ${
                            canActivate && (!isActive || isCancelled)
                                ? ""
                                : "cursor-not-allowed opacity-50 pointer-events-none"
                        }`}
                    >
                        Continue Subscription
                    </Link>
                </>
            );
        }

        // Default: Show free trial offer for first-time users (trial never taken)
        return (
            <>
                <p className="mb-4 text-[15px] font-poppins text-start text-gray-700">
                    Enjoy a{" "}
                    <span className="text-green-700 font-bold uppercase">
                        3-days free trial
                    </span>{" "}
                    before your monthly subscription begins! After the trial,
                    your subscription renews at £8.99 + VAT / month to help
                    cover payment processing and compliance requirements.
                </p>

                <Link
                    href={"/activate-subscription"}
                    className={`btn-pink !text-sm sm:!text-normal md:!text-[17px] w-full block text-center 
                    bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-3 transition-all duration-200
                    ${
                        canActivate && (!isActive || isCancelled)
                            ? ""
                            : "cursor-not-allowed opacity-50 pointer-events-none"
                    }`}
                >
                    {isActive && !isCancelled
                        ? "Subscription Active"
                        : isActive && isCancelled
                          ? "Renew Subscription"
                          : creatorUser?.profile_status_lock == 1
                            ? "Restart Subscription Again"
                            : "Start Free Trial"}
                </Link>
            </>
        );
    };

    // Determine which scenario applies
    const getScenario = () => {
        if (hasTrialEnded) return "TRIAL_ENDED";
        if (resolvedStatus === "EXPIRED" && hasUsedFreeTrial)
            return "TRIAL_EXPIRED";
        if (resolvedStatus === "EXPIRED") return "EXPIRED";
        if (isActive) return "ACTIVE";
        if (isTrial) return "TRIAL_ACTIVE";
        if (resolvedStatus === "INACTIVE" && hasUsedFreeTrial)
            return "TRIAL_EXPIRED";
        if (resolvedStatus === "INACTIVE") return "INACTIVE";
        return "DEFAULT";
    };

    const scenario = getScenario();

    return (
        <>
            <div className="w-full finishs mb-6  bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 rounded-[20px] md:rounded-[30px]  ">
                <h2 className="text-[22px] font-bold uppercase pb-3 goaltitle text-black  ">
                    Subscription Status
                </h2>

                {/* Message when trial has ended and showing subscription details */}
                {scenario === "TRIAL_ENDED" && (
                    <>
                        <p className="mb-3 text-[17px] font-poppins text-start text-purple-700 font-semibold">
                            {isActive
                                ? "Your Subscription is Active"
                                : "Your Trial Has Ended"}
                        </p>
                        {isActive && (
                            <p className="mb-3 text-[14px] font-poppins text-start text-gray-600">
                                You've successfully completed your free trial
                                and transitioned to a paid subscription.
                            </p>
                        )}
                        {isCancelled && (
                            <p className="mb-4 text-[15px] font-poppins text-start text-red-600">
                                Your subscription has been cancelled but you
                                still have access until{" "}
                                {creatorUser?.subscription_end}. Renew now to
                                avoid losing access to creator tools.
                            </p>
                        )}
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {/* Expired status */}
                {scenario === "EXPIRED" && (
                    <>
                        <p className="mb-3 text-[18px] font-poppins text-start text-red-600">
                            Your monthly subscription has expired. Activate
                            again to keep creator tools and payments enabled.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {/* Trial expired - user already took free trial */}
                {scenario === "TRIAL_EXPIRED" && (
                    <>
                        <p className="mb-3 text-[18px] font-poppins text-start text-red-600">
                            Your monthly subscription has expired. Activate
                            again to keep creator tools and payments enabled.
                        </p>
                        <p className="mb-3 text-[14px] font-poppins text-start text-gray-600">
                            You previously used your free trial period. Continue
                            with your paid subscription to maintain access.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {/* Active subscription */}
                {scenario === "ACTIVE" && (
                    <>
                        <p className="mb-3 text-[17px] font-poppins text-start text-green-700">
                            Your subscription is active.
                        </p>
                        {isCancelled && (
                            <p className="mb-4 text-[15px] font-poppins text-start text-red-600">
                                Your subscription has been cancelled but you
                                still have access until{" "}
                                {creatorUser?.subscription_end}. Renew now to
                                avoid losing access to creator tools.
                            </p>
                        )}
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {/* Trial currently active */}
                {scenario === "TRIAL_ACTIVE" && (
                    <>
                        <p className="mb-3 text-[18px] font-poppins text-start text-green-700">
                            Your free trial is active.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {/* Inactive subscription */}
                {scenario === "INACTIVE" && (
                    <>
                        <p className="mb-3 font-bold text-[16px] font-poppins text-start text-gray-700">
                            {hasUsedFreeTrial
                                ? "Your trial period has ended. Activate your monthly subscription to continue."
                                : "Activate your monthly subscription to unlock creator tools and accept payments."}
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {/* Default - No trial taken yet */}
                {scenario === "DEFAULT" && (
                    <>
                        <p className="mb-3 text-[16px] font-poppins text-start text-gray-700">
                            Start your free trial to unlock all creator features
                            and begin accepting payments.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                )}

                {!isActive && !isEnabled && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                        {card_capabilities === false ? (
                            <span>
                                Please{" "}
                                <a
                                    href="/stripe/enable_card_payments"
                                    className="underline font-bold text-red-700 hover:text-red-800"
                                >
                                    enable card payments
                                </a>{" "}
                                to activate your subscription.
                            </span>
                        ) : (
                            ""
                        )}
                    </p>
                )}
            </div>
            {children}
        </>
    );
}
