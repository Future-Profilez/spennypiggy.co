import { Link } from "@inertiajs/react";

export default function SiteSubscription({
    children,
    auth,
    subscription_status,
    user,
    card_capabilities,
    site_subscription,
}) {
    const creatorUser = user ?? auth?.user;

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
    return (
        <>
            <div className="w-full finishs mb-6  bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 rounded-[20px] md:rounded-[30px]  ">
                <h2 className="text-[22px] font-bold uppercase pb-3 goaltitle text-black  ">
                    Subscription Status
                </h2>
                {resolvedStatus === "EXPIRED" ? (
                    <>
                        <p className="mb-3 text-[18px] font-poppins text-start text-red-600">
                            Your monthly subscription has expired. Activate
                            again to keep creator tools and payments enabled.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                ) : resolvedStatus === "INACTIVE" ? (
                    <>
                        <p className="mb-3 font-bold text-[16px] font-poppins text-start text-gray-700">
                            Activate your monthly subscription to unlock creator
                            tools and accept payments.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                ) : isActive ? (
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
                ) : isTrial ? (
                    <>
                        <p className="mb-3 text-[18px] font-poppins text-start text-green-700">
                            Your free trial is active.
                        </p>
                        <SUBSCRIPTIONBOX />
                    </>
                ) : (
                    ""
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
