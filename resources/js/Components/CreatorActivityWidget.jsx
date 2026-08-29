import React from "react";
import { Link } from "@inertiajs/react";
import { PostMeter } from "@/Components/Creator/ActivityStatusBanner";
import HelpLink from "@/Components/Help/HelpLink";
import { formatPrice } from "@/lib/priceLimits";

/**
 * The creator's payment rules, on one card, saying which is which.
 *
 * ⚠️ Rebuilt 3 Aug 2026. The old card set its whole body in dark red, so the
 * failure ("Payments are paused"), the reassurance ("Note: payments resume
 * automatically") and a neutral count all shouted equally and none of them read
 * as the point. It also had no action at all — a creator was told their income
 * had stopped and given a "View Details" outline pill to a page that told them
 * again. Colour now appears in exactly one place, the state plate; the body is
 * black; and every state that needs an action has one.
 *
 * 🚨 THERE ARE THREE RULES, NOT TWO (29 Aug 2026). The card covered the two
 * CONTENT rules and said nothing about the creator's own platform subscription —
 * which is the gate that actually refuses most blocked purchases. A creator with
 * no subscription read a green "Payments running" plate while every supporter who
 * tried to buy from them was being turned away, and heard about it only from a
 * bell notification that says nothing about what to do. The subscription is the
 * only one of the three that can stop EVERY sale at once, so when it is the thing
 * that is wrong it leads the card and the content rules move below the divider.
 *
 * The rules stay separate, deliberately (see the dividers):
 *   1. the platform subscription (CreatorSubscriptionService — all sales)
 *   2. the purchase-time content gate (CreatorActivityService, 28 days, any content)
 *   3. the posting cadence (PostingCadenceService, 30 days, member posts only)
 * They measure different things and can legitimately disagree — which without the
 * dividers read as one card contradicting itself.
 */

/** state → [plate classes, plate label]. Colour lives here and nowhere else. */
const GATE_PLATE = {
    grace_period: ["bg-[#A2E4B8] text-black", "Getting started"],
    active: ["bg-[#A2E4B8] text-black", "Payments running"],
    grace_period_ending: ["bg-[#FFD34D] text-black", "Ends soon"],
    insufficient_content: ["bg-[#E01B3C] text-white", "Payments paused"],
    not_fully_verified: ["bg-[#FFD34D] text-black", "Verification needed"],
    error: ["bg-black text-white", "Status unavailable"],
};

const CARD =
    "rounded-box border-[3px] border-black bg-white p-5 md:p-6 mt-6 lg:mt-0";

const BTN_PRIMARY =
    "inline-flex min-h-[48px] items-center justify-center rounded-box-sm border-2 border-black bg-[#FF007F] px-6 text-xs font-black uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 motion-reduce:transition-none";

const BTN_QUIET =
    "inline-flex min-h-[48px] items-center text-xs font-black uppercase tracking-[0.14em] text-black/60 underline decoration-black/25 underline-offset-4 hover:text-black";

const EYEBROW =
    "text-[12px] font-black uppercase tracking-[0.18em] text-black/60";

function Plate({ status }) {
    const [cls, label] = GATE_PLATE[status] || GATE_PLATE.error;

    return (
        <span
            className={`inline-flex items-center rounded-box-sm border-2 border-black px-3 py-1 text-[12px] font-black uppercase tracking-[0.16em] ${cls}`}
        >
            {label}
        </span>
    );
}

/** state → [pill classes, dot class, label]. Colour lives here and nowhere else. */
const PAYMENTS_PILL = {
    live: ["bg-[#A2E4B8] text-black", "bg-black", "Payments active"],
    blocked: ["bg-[#E01B3C] text-white", "bg-white", "Payments off"],
    turned_away: ["bg-[#FFD34D] text-black", "bg-black", "Sales turned away"],
};

/**
 * The one-glance answer: can a supporter pay this creator right now.
 *
 * 🚨 IT READS EVERY RULE, not the one the section beneath it happens to be about.
 * A card that says "Payments active" while a rule below it says paused is worse
 * than no indicator, because the creator believes the top line.
 *
 * 🚨 `turned_away` EXISTS BECAUSE ONE GATE CANNOT BE CHECKED FROM HERE. The Stripe
 * card-payments capability is a live API call per account, far too expensive on a
 * dashboard poll, and `users.charges_enabled` is written by nothing in `app/` — a
 * creator whose sales were being refused had it at 0 while the live capability
 * check said yes. So a refusal we cannot predict is reported from the one local
 * fact we do have: sales were turned away. Amber, not green — the card must never
 * claim all-clear over a week in which purchases were refused.
 */
function PaymentsPill({ state }) {
    const [cls, dot, label] = PAYMENTS_PILL[state] || PAYMENTS_PILL.blocked;

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-box-sm border-2 border-black px-3 py-1 text-[12px] font-black uppercase tracking-[0.16em] ${cls}`}
        >
            <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${dot}`}
            />
            {label}
        </span>
    );
}

/**
 * 🚨 THE NUMBER IS THE ARGUMENT. "Your subscription is inactive" is a status; "2
 * sales worth £50 were turned away this week" is a reason to act, and it is the
 * figure BlockedPaymentAlert was written to put in front of the creator.
 *
 * ⚠️ Totals are printed PER CURRENCY and never summed across them — the server
 * groups them for exactly that reason. A row whose currency was never recorded is
 * counted and contributes to no total, so the count can legitimately exceed what
 * the money line accounts for; the count is the sentence's subject, which keeps
 * that honest.
 */
function LostSales({ lostSales }) {
    const count = lostSales?.count ?? 0;

    if (count < 1) {
        return null;
    }

    const days = lostSales?.window_days ?? 7;
    const totals = Array.isArray(lostSales?.totals) ? lostSales.totals : [];
    const money = totals
        .map((t) => formatPrice(t.amount, t.currency))
        .join(" + ");

    return (
        <p className="mt-3 max-w-2xl text-sm font-black leading-[1.55] text-black">
            {count === 1 ? "1 sale" : `${count} sales`}
            {money ? ` worth ${money}` : ""} {count === 1 ? "was" : "were"}{" "}
            turned away in the last {days} days.
        </p>
    );
}

const CreatorActivityWidget = (props) => {
    const { activityStatus, className = "" } = props;
    const postingCadence =
        props.postingCadence ?? activityStatus?.postingCadence;
    const subscription = props.subscription ?? activityStatus?.subscription;
    const lostSales = props.lostSales ?? activityStatus?.lost_sales;
    const links = props.links ?? activityStatus?.links;

    // ⚠️ Named routes come from the server (`sellableState`). The fallbacks exist
    // because this component also renders from a cached status response written
    // before those keys existed — never because the path is the real definition.
    const activityHref = links?.activity || "/creator/activity";
    const subscriptionHref =
        links?.activate_subscription || "/activate-subscription";

    if (!activityStatus || activityStatus.status === "not_creator") {
        return null;
    }

    const status = activityStatus.status;
    const have =
        activityStatus.content_count || activityStatus.current_content || 0;
    const required = activityStatus.required ?? 3;
    const needed = Math.max(0, activityStatus.needed ?? required - have);
    const days = activityStatus.days_remaining ?? 0;

    // ⚠️ Absent means "not reported", which must read as fine — an older cached
    // payload has no `subscription` key and must not tell a paid-up creator their
    // payments are off.
    const subscriptionBlocked = subscription?.eligible === false;

    if (status === "not_fully_verified") {
        return (
            <div className={`${CARD} ${className}`}>
                <Plate status={status} />
                <h3 className="mt-3 font-gulfs text-2xl uppercase leading-[1.05] text-black">
                    Finish verifying to start earning
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-black/70">
                    Your identity check and profile approval have to be done
                    before payments can run. Nothing else is required of you
                    until they are.
                </p>
                <div className="mt-5">
                    <Link href={activityHref} className={BTN_QUIET}>
                        See what is outstanding
                    </Link>
                </div>
            </div>
        );
    }

    // The headline IS the state — "Activity Status" was a label, and a label
    // tells the creator nothing they did not already know from the card's place
    // on the page.
    const headline =
        {
            grace_period: "Payments are running while you get started",
            active: "Your payments are running normally",
            grace_period_ending: "Your starter period is ending",
            insufficient_content: "Your payments are paused",
        }[status] || "We cannot check your payment status right now";

    const body =
        {
            grace_period: `You have ${days} ${days === 1 ? "day" : "days"} left of your starter period, so payments run whatever you post. After that you need ${required} pieces of content published in any ${activityStatus.period_days ?? 28} days.`,
            active: `You have ${have} published ${have === 1 ? "piece" : "pieces"} of content in the last ${activityStatus.period_days ?? 28} days. Nothing to do.`,
            grace_period_ending: `Your starter period ends in ${days} ${days === 1 ? "day" : "days"} and you have ${have} of ${required} pieces of content. Add ${needed} more before then and nothing changes.`,
            insufficient_content: `Add ${needed} more ${needed === 1 ? "piece" : "pieces"} of content to start being paid again. A post, a listing, a shop item or a paid request all count, and payments resume by themselves within a few minutes of approval.`,
        }[status] ||
        "Try again shortly. Your payments are not affected by this check failing.";

    const needsAction =
        status === "insufficient_content" || status === "grace_period_ending";

    const contentGateLive = status === "active" || status === "grace_period";

    const lostSalesCount = lostSales?.count ?? 0;

    // ⚠️ Order matters: a gate we can actually name outranks "something refused a
    // sale", because the named one tells the creator what to go and fix.
    const paymentsState =
        subscriptionBlocked || !contentGateLive
            ? "blocked"
            : lostSalesCount > 0
              ? "turned_away"
              : "live";

    // 🚨 "Your payments are running normally" DIRECTLY ABOVE "1 sale was turned
    // away" is the card contradicting itself, and the creator believes the
    // headline. When every gate we can read is green and sales were still
    // refused, the honest headline is that we do not know why — with a route to
    // the page that lists them.
    const turnedAway = paymentsState === "turned_away";

    const shownHeadline = turnedAway
        ? "Some sales are being turned away"
        : headline;

    const shownBody = turnedAway
        ? "Every check we can run on your account passes, so this is most likely your Stripe payout account. Open your payout settings and finish anything Stripe is asking for."
        : body;

    // ⚠️ The subscription copy is keyed on the SERVER's status code, not on prose
    // built here — "expired" and "never started" are different situations and a
    // creator who let one lapse should not be told to go and start one.
    const subscriptionCopy = {
        subscription_expired: {
            headline: "Your subscription has expired",
            body: "Supporters cannot buy from you until it is active again. Renew it and every listing you already have goes back on sale — you do not have to set anything up twice.",
            cta: "Renew subscription",
        },
        no_subscription: {
            headline: "Supporters cannot buy from you yet",
            body: "Your listings are live, but every purchase is being turned away because your subscription is not active. Activate it and they can buy straight away.",
            cta: "Activate subscription",
        },
    }[subscription?.status] || {
        headline: "We cannot confirm your subscription",
        body: "Purchases are being turned away until it is confirmed. Open your subscription to check it, and get in touch if it already looks active.",
        cta: "Check subscription",
    };

    return (
        <div className={`${CARD} ${className}`}>
            <div className="flex flex-wrap items-center gap-2">
                <PaymentsPill state={paymentsState} />
                {!subscriptionBlocked && <Plate status={status} />}
            </div>

            {/* 🚨 The subscription leads when it is the thing that is wrong. It is
                the only rule that stops every sale at once, so a creator reading
                this card must meet it before the content rules — which are, in
                that moment, not what is costing them money. */}
            {subscriptionBlocked && (
                <>
                    <h3 className="mt-3 font-gulfs text-2xl uppercase leading-[1.05] text-black">
                        {subscriptionCopy.headline}
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/70">
                        {subscriptionCopy.body}
                    </p>

                    <LostSales lostSales={lostSales} />

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link href={subscriptionHref} className={BTN_PRIMARY}>
                            {subscriptionCopy.cta}
                        </Link>
                        <Link href={activityHref} className={BTN_QUIET}>
                            See the turned-away sales
                        </Link>
                    </div>
                </>
            )}

            {/* ⚠️ The content gate is ALWAYS rendered — demoted below a divider
                when the subscription is the headline, never hidden. A creator who
                fixes their subscription and then finds a second rule they were
                never told about has been sent round the loop twice. */}
            <div
                className={
                    subscriptionBlocked
                        ? "mt-6 border-t border-black/10 pt-5"
                        : ""
                }
            >
                {subscriptionBlocked && (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className={EYEBROW}>
                            Separate rule &middot; Content you publish
                        </p>
                        <Plate status={status} />
                    </div>
                )}

                <h3
                    className={`${subscriptionBlocked ? "mt-1 text-[15px] font-black" : "mt-3 font-gulfs text-2xl uppercase leading-[1.05]"} text-black`}
                >
                    {shownHeadline}
                </h3>

                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/70">
                    {shownBody}
                </p>

                {!subscriptionBlocked && <LostSales lostSales={lostSales} />}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                    {needsAction && (
                        <Link
                            href={route("dashboard", { add: "post" })}
                            className={BTN_PRIMARY}
                        >
                            Add content
                        </Link>
                    )}
                    <Link href={activityHref} className={BTN_QUIET}>
                        {needsAction ? "What counts?" : "View details"}
                    </Link>
                    {/* Two rules that can disagree is exactly where a creator stops
                        reading and opens a ticket. The answer opens in place. */}
                    <HelpLink
                        slug="why-were-my-subscriptions-paused"
                        categorySlug="money-and-payouts"
                        label="Why can payments pause?"
                    />
                </div>
            </div>

            {/* ⚠️ A THIRD, separate rule — not a restatement of the one above.
                Above: the purchase-time content gate (28 days, any content).
                Below: the posting cadence (30 days, member posts only). They are
                deliberately not merged and can disagree, which without this
                divider read as one card contradicting itself — "Payments are
                paused" in red directly above a blue "Grace" badge. */}
            {postingCadence && (
                <div className="mt-6 border-t border-black/10 pt-5">
                    <p className={EYEBROW}>
                        Separate rule &middot; Posts for paying members
                    </p>

                    <p className="mt-2 text-[15px] font-black text-black">
                        {postingCadence.headline || "Member posting"}
                    </p>

                    <div className="mt-3">
                        <PostMeter
                            have={postingCadence.member_posts ?? 0}
                            required={postingCadence.required ?? 3}
                            pending={postingCadence.pending_review ?? 0}
                            nextDropOut={
                                [...(postingCadence.counting_posts || [])].sort(
                                    (a, b) =>
                                        String(a.drops_out_at).localeCompare(
                                            String(b.drops_out_at),
                                        ),
                                )[0]?.drops_out_at
                            }
                            dark={false}
                        />
                    </div>

                    {postingCadence.consequence && (
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-black/70">
                            {postingCadence.consequence}
                        </p>
                    )}

                    {postingCadence.status !== "active" && (
                        <Link
                            href={route("dashboard", { add: "post" })}
                            className={`${BTN_PRIMARY} mt-4`}
                        >
                            Write a post for members
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreatorActivityWidget;
