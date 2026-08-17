import { Link, usePage } from "@inertiajs/react";

import { subscriptionPlan } from "@/constants/creatorSubscription";



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

    const page = usePage();

    // ⚠️ Merge the SERVER plan. Read at module level with no argument this fell back
    // to the hardcoded client constants, so `free_until_first_sale` was always true
    // and the £0.00 promise rendered even with the policy switched off — i.e. while
    // creators were being billed on day one.
    const PLAN = subscriptionPlan(page.props?.subscriptionPlan);
    const PRICE = PLAN.active_price_line;
    const finalMonthlyCharges =
        monthly_charges || page.props?.monthly_charges || null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /*
    |--------------------------------------------------------------------------
    | Determine subscription and trial status from monthly_charges data
    |--------------------------------------------------------------------------
    */
    const isSubscription =
        !!finalMonthlyCharges?.current_start_subscription_date &&
        !!finalMonthlyCharges?.current_end_subscription_date;

    /**
     * ⚠️ The free period is identified by STATUS, never by trial dates.
     *
     * Setup-mode checkout saves a card and creates no Stripe subscription, so it
     * deliberately writes no trial dates — there is no trial for them to describe.
     * Every surface here decided "is this creator in their free period?" by looking
     * for those dates, so a creator who had just saved their card fell through to
     * DEFAULT and was told to add the card they had already added, on the
     * subscription page, the About chip and the Creator Studio row at once.
     */
    const FREE_PERIOD_STATUSES = ["trialing", "trial_ending"];
    const isFreePeriod =
        FREE_PERIOD_STATUSES.includes(finalMonthlyCharges?.status) &&
        !isSubscription;

    // A saved card with no subscription yet — nothing to expire.
    const hasCardOnFile =
        isFreePeriod && !!finalMonthlyCharges?.has_card;

    const hasTrial =
        !!finalMonthlyCharges?.current_start_trial_date &&
        !!finalMonthlyCharges?.current_end_trial_date;

    const startDate = isSubscription
        ? finalMonthlyCharges.current_start_subscription_date
        : finalMonthlyCharges?.current_start_trial_date;

    const endDate = isSubscription
        ? finalMonthlyCharges.current_end_subscription_date
        : finalMonthlyCharges?.current_end_trial_date;

    const atMidnight = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (isNaN(parsed)) return null;
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    };

    const parsedStartDate = atMidnight(startDate);
    const parsedEndDate = atMidnight(endDate);

    const isExpired = parsedEndDate && parsedEndDate < today;
    const isActive = !isExpired && (isSubscription || hasTrial);
    const isCancelled = creatorUser?.is_subscription_cancelled || false;
    const hasCapability = card_capabilities !== false;

    const isEnabled =
        creatorUser?.social_links?.status === 1 &&
        creatorUser?.avatar_approved === 1 &&
        creatorUser?.bio_approved === 1 &&
        hasCapability;

    const hasEverSold = creatorUser?.has_ever_sold || false;

    const scenario = !finalMonthlyCharges
        ? "DEFAULT"
        : finalMonthlyCharges.status === 'failed'
          ? "FAILED"
          : isSubscription
            ? isExpired
                ? "SUBSCRIPTION_EXPIRED"
                : "SUBSCRIPTION_ACTIVE"
            : hasCardOnFile
              ? "CARD_ON_FILE"
              : hasTrial
                ? isExpired
                    ? "TRIAL_EXPIRED"
                    : "TRIAL_ACTIVE"
                : "DEFAULT";

    /*
    |--------------------------------------------------------------------------
    | Period maths — powers the billing-period meter
    |--------------------------------------------------------------------------
    */
    const DAY = 1000 * 60 * 60 * 24;
    const daysBetween = (from, to) => Math.round((to - from) / DAY);

    const daysLeft = parsedEndDate ? daysBetween(today, parsedEndDate) : null;
    const daysOverdue = daysLeft !== null && daysLeft < 0 ? -daysLeft : null;

    const periodLength =
        parsedStartDate && parsedEndDate
            ? Math.max(daysBetween(parsedStartDate, parsedEndDate), 1)
            : null;

    const elapsedPercent = periodLength
        ? Math.min(
              100,
              Math.max(0, (daysBetween(parsedStartDate, today) / periodLength) * 100),
          )
        : 0;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    /*
    |--------------------------------------------------------------------------
    | One theme object per scenario — every surface reads from this
    |--------------------------------------------------------------------------
    */
    const THEMES = {
        SUBSCRIPTION_ACTIVE: {
            // ⚠️ A cancelled subscription is still `SUBSCRIPTION_ACTIVE` until its
            // paid period runs out — deliberately, because the creator paid for that
            // time and must keep selling through it. But every label here described
            // a subscription that renews, so after cancelling the card read
            // "ACTIVE · Subscription active · RENEWS 3 September" directly above the
            // sentence saying auto-renewal was off. The one thing the creator needs
            // to be sure of at that moment is that nothing will be taken again.
            badge: isCancelled ? "Ending" : "Active",
            badgeClass: isCancelled
                ? "bg-[#FFD166] text-black"
                : "bg-[#A2E4B8] text-black",
            meterFill: isCancelled ? "bg-[#FFD166]" : "bg-[#A2E4B8]",
            headline: isCancelled
                ? "Subscription ending"
                : "Subscription active",
            dateLabel: isCancelled ? "Ends" : "Renews",
            cta: null,
        },
        TRIAL_ACTIVE: {
            badge: "No charge yet",
            badgeClass: "bg-[#BFD8FF] text-black",
            meterFill: "bg-[#BFD8FF]",
            headline: hasEverSold ? "Subscription active" : PLAN.promise,
            dateLabel: null,
            cta: null,
        },
        TRIAL_EXPIRED: {
            badge: "Expired",
            badgeClass: "bg-[#FFD166] text-black",
            meterFill: "bg-[#FFD166]",
            headline: "Subscription needs attention",
            dateLabel: "Ended",
            cta: `Subscribe now — ${PLAN.price_formatted}/month`,
        },
        SUBSCRIPTION_EXPIRED: {
            badge: "Expired",
            badgeClass: "bg-[#FF3B30] text-white",
            meterFill: "bg-[#FF3B30]",
            headline: "Subscription expired",
            dateLabel: "Expired",
            cta: `Renew subscription — ${PLAN.price_formatted}/month`,
        },
        FAILED: {
            badge: "Payment failed",
            badgeClass: "bg-[#FF3B30] text-white",
            meterFill: "bg-[#FF3B30]",
            headline: "Payment failed",
            dateLabel: "Failed",
            cta: `Update card and pay — ${PLAN.price_formatted}/month`,
        },
        CARD_ON_FILE: {
            badge: "Card saved",
            badgeClass: "bg-[#A2E4B8] text-black",
            meterFill: "bg-[#A2E4B8]",
            // ⚠️ Branches on hasEverSold like TRIAL_ACTIVE does. A creator who has
            // already sold is billed within 15 minutes by
            // `subscription:activate-on-sale`, so "you're all set" beside a promise
            // of no charge would be false for exactly the people reading it.
            headline: hasEverSold ? "Billing starts shortly" : "You're all set",
            dateLabel: null,
            // No primary CTA — nothing is required of them, and a button asking for
            // a card they already gave us is the bug this scenario exists to fix.
            cta: null,
            // ⚠️ But they DO need a way to replace a stale card. The free period is
            // up to 730 days, longer than a card's expiry, and the saved method is
            // charged off-session on the first sale — without this the only route to
            // updating it is the FAILED screen, i.e. after it has already broken.
            secondaryCta: "Update saved card",
        },
        DEFAULT: {
            badge: "Not started",
            badgeClass: "bg-white text-black",
            meterFill: "bg-black",
            headline: hasEverSold ? "Resume subscription" : PLAN.promise,
            dateLabel: null,
            cta: hasEverSold ? `Subscribe now — ${PLAN.price_formatted}/month` : "Add card and start selling",
        },
    };

    const theme = THEMES[scenario];

    /**
     * ⚠️ Whether cancelling ends access NOW.
     *
     * `StripeController::cancelMandatorySubscription` force-cancels and clears
     * `is_subscribed` when the row has no `stripe_id` and nothing has been billed —
     * which is exactly CARD_ON_FILE, and TRIAL_ACTIVE before a first sale. There is
     * no period to run out and no auto-renewal to turn off, so both the button and
     * the confirmation must say so; the old copy promised access "until the end of
     * the current period" and the creator lost their tools on the spot.
     */
    const cancelsImmediately =
        scenario === "CARD_ON_FILE" ||
        (scenario === "TRIAL_ACTIVE" && !hasEverSold);

    /**
     * The two states where the creator has not been charged yet — a brand new
     * account and one sitting in its free period. Both get the promise treatment;
     * an active or expired subscription is a different question and keeps the
     * plain headline.
     */
    const showPromise =
        PLAN.free_until_first_sale &&
        !hasEverSold &&
        (scenario === "DEFAULT" ||
            scenario === "TRIAL_ACTIVE" ||
            scenario === "CARD_ON_FILE");

    const statusLine = {
        SUBSCRIPTION_ACTIVE: isCancelled
            ? `Auto-renewal is off. Access ends after ${formatDate(endDate)}.`
            : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in this billing period.`,
        CARD_ON_FILE: hasEverSold
            ? `Your card is saved. Billing starts from your next cycle — ${PRICE}.`
            : `Your card is saved. Nothing is charged until you make your first sale — then ${PRICE}.`,
        TRIAL_ACTIVE: hasEverSold
            ? `Your subscription is active. Charging starts from your next billing cycle.`
            : `Nothing is charged until you make your first sale. Then ${PRICE}.`,
        TRIAL_EXPIRED: "Subscribe to keep your creator tools active.",
        SUBSCRIPTION_EXPIRED: `Overdue by ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}. Renew to regain access.`,
        FAILED: `Your subscription payment has failed. Please update your card to resume access and start accepting payments.`,
        DEFAULT: hasEverSold
            ? `Your subscription will start immediately. You will be charged ${PLAN.price_formatted} + VAT today.`
            : PLAN.promise_long,
    }[scenario];

    /*
    |--------------------------------------------------------------------------
    | Billing-period meter: start → today → end, in one bar
    |--------------------------------------------------------------------------
    */
    const PeriodMeter = () => {
        // ⚠️ Never during the free period. The parked trial date is three years
        // out and exists only because Stripe requires a timestamp — drawing it as
        // a progress bar tells the creator a billing period is running down when
        // nothing is counting at all.
        if (showPromise) return null;
        if (!parsedStartDate || !parsedEndDate) return null;

        return (
            <div className="mt-5">
                <div
                    className=" h-4 w-full  rounded-full overflow-hidden bg-gray-300"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(elapsedPercent)}
                    aria-label="Billing period elapsed"
                >
                    <div
                        className={`h-full ${theme.meterFill} transition-[width] duration-500 motion-reduce:transition-none`}
                        style={{ width: `${elapsedPercent}%` }}
                    />
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-3 text-[12px] font-bold uppercase tracking-widest text-black/60">
                    <span>{formatDate(startDate)}</span>
                    <span className="text-black">
                        {theme.dateLabel} {formatDate(endDate)}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="w-full finishs mb-8 bg-white  rounded-box border-[3px] border-black p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[22px] font-bold uppercase text-black">
                        Subscription status
                    </h2>
                    <span
                        className={`${theme.badgeClass} border-[3px] border-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap`}
                    >
                        {theme.badge}
                    </span>
                </div>

                {/* ── Free period: the promise IS the card ──────────────────
                    Before this, £8.99 was the only figure on the screen, so the
                    card answered "what will you be charged?" when the creator's
                    actual question is "what do I pay right now?". £0.00 is the
                    answer, so £0.00 is the biggest thing here and the £8.99 is
                    demoted to the step it actually belongs to. */}
                {showPromise ? (
                    <>
                        <div className="mt-4 rounded-box-sm border-[3px] border-black bg-[#A2E4B8] p-4">
                            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-black/70">
                                You pay today
                            </p>
                            <p className="mt-1 font-gulfs text-[44px] leading-[0.95] tracking-tight text-black">
                                £0.00
                            </p>
                            <p className="mt-2 text-[15px] font-bold leading-snug text-black">
                                {PLAN.promise}
                            </p>
                            <p className="mt-1 text-[13px] leading-snug text-black/70">
                                {PLAN.reassurance}
                            </p>
                        </div>

                        {/* Two rows, because there are exactly two moments that
                            matter. A creator should not have to read a sentence
                            to find out when the money starts. */}
                        <ol className="mt-3 overflow-hidden rounded-box-sm border-[3px] border-black">
                            <li className="flex items-center justify-between gap-3 border-b-[3px] !border-t-[0px] !border-r-[0px] !border-l-[0px] border-black bg-white px-4 py-3">
                                <span className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        aria-hidden="true"
                                        className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-black bg-[#05EFB8]"
                                    />
                                    <span className="truncate text-[13px] font-bold uppercase tracking-wider text-black">
                                        Today
                                    </span>
                                </span>
                                <span className="whitespace-nowrap text-[15px] font-bold text-black">
                                    £0.00
                                </span>
                            </li>
                            <li className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                                <span className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        aria-hidden="true"
                                        className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-black bg-[#FF007F]"
                                    />
                                    <span className="truncate text-[13px] font-bold uppercase tracking-wider text-black">
                                        After your first sale
                                    </span>
                                </span>
                                <span className="whitespace-nowrap text-[15px] font-bold text-black">
                                    {PLAN.price_formatted}
                                    <span className="text-[12px] font-semibold text-black/60">
                                        {" "}
                                        + VAT /mo
                                    </span>
                                </span>
                            </li>
                        </ol>
                    </>
                ) : (
                    <>
                        <p className="mt-4 text-[18px] font-bold text-black leading-tight">
                            {theme.headline}
                        </p>
                        <p className="mt-1 text-[14px] text-black/70">
                            {statusLine}
                        </p>
                    </>
                )}

                <PeriodMeter />

                {/* Price + auto-renewal control. The price line is already stated
                    by the steps above, so it is not repeated in the free period. */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-black/10 pt-4">
                    <p className="text-[13px] font-semibold text-black/70">
                        {/* ⚠️ Once cancelled, printing the monthly price reads as a
                            charge that is still coming. It is the one thing a
                            creator who has just cancelled is checking for. */}
                        {isCancelled
                            ? "No further charges"
                            : showPromise
                              ? "Cancel any time — no exit fee"
                              : PRICE}
                    </p>

                    {scenario === "SUBSCRIPTION_ACTIVE" ||
                    scenario === "TRIAL_ACTIVE" ||
                    scenario === "CARD_ON_FILE" ? (
                        !isCancelled ? (
                            <>
                            <Link
                                href={route("mandatory.cancel")}
                                method="post"
                                as="button"
                                className="text-[13px] font-bold uppercase tracking-wider text-black/60 underline underline-offset-4 hover:text-[#FF3B30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                onBefore={() =>
                                    confirm(
                                        cancelsImmediately
                                            ? "Cancel subscription? Your creator tools will be deactivated immediately."
                                            : "Turn off auto-renewal? You keep access until the end of the current period.",
                                    )
                                }
                            >
                                {cancelsImmediately
                                    ? "Cancel subscription"
                                    : "Turn off auto-renewal"}
                            </Link>

                            {/* Quiet, secondary: nothing is required of them, but a
                                saved card can expire long before the free period
                                ends, and the only other route to replacing it is the
                                FAILED screen — i.e. after it has already broken. */}
                            {theme.secondaryCta && (
                                <Link
                                    href={route("activate-subscription")}
                                    className="ms-4 text-[13px] font-bold uppercase tracking-wider text-black/60 underline underline-offset-4 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                >
                                    {theme.secondaryCta}
                                </Link>
                            )}
                            </>
                        ) : (
                            <Link
                                href={route("mandatory.resume")}
                                method="post"
                                as="button"
                                className="text-[13px] font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:text-[#FF007F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                onBefore={() =>
                                    confirm(
                                        "Turn auto-renewal back on? Your creator tools stay active without interruption.",
                                    )
                                }
                            >
                                Turn on auto-renewal
                            </Link>
                        )
                    ) : null}
                </div>

                {/* Single action */}
                {theme.cta && (
                    <Link
                        href="/activate-subscription"
                        className="mt-4 block w-full rounded-full border-[3px] border-black bg-[#FF007F] px-4 py-3 text-center text-[15px] font-bold uppercase tracking-wider text-black transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        {theme.cta}
                    </Link>
                )}

                {/* Card payments blocked — the only thing that can stop the CTA working */}
                {!isActive && !isEnabled && card_capabilities === false && (
                    <p className="mt-4 rounded-box-sm border-[3px] border-black bg-[#FFD166] p-3 text-center text-[13px] font-semibold text-black">
                        Card payments are off on your account.{" "}
                        <a
                            href="/stripe/enable_card_payments"
                            className="font-bold underline underline-offset-2"
                        >
                            Enable card payments
                        </a>{" "}
                        to activate your subscription.
                    </p>
                )}
            </div>
            {children}
        </>
    );
}
