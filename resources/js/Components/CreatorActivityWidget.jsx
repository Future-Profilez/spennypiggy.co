import React from "react";
import { Link } from "@inertiajs/react";
import { PostMeter } from "@/Components/Creator/ActivityStatusBanner";

/**
 * The creator's two payment rules, on one card, saying which is which.
 *
 * ⚠️ Rebuilt 3 Aug 2026. The old card set its whole body in dark red, so the
 * failure ("Payments are paused"), the reassurance ("Note: payments resume
 * automatically") and a neutral count all shouted equally and none of them read
 * as the point. It also had no action at all — a creator was told their income
 * had stopped and given a "View Details" outline pill to a page that told them
 * again. Colour now appears in exactly one place, the state plate; the body is
 * black; and every state that needs an action has one.
 *
 * The two rules stay separate, deliberately (see the divider): the top half is
 * the purchase-time content gate (CreatorActivityService, 28 days, any content)
 * and the bottom half is the posting cadence (PostingCadenceService, 30 days,
 * member posts only). They measure different things and can legitimately
 * disagree — which without the divider read as one card contradicting itself.
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
 "inline-flex min-h-[48px] items-center justify-center rounded-box-sm border-2 border-black bg-[#FF007F] px-6 text-xs font-black uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

const BTN_QUIET =
    "inline-flex min-h-[48px] items-center text-xs font-black uppercase tracking-[0.14em] text-black/60 underline decoration-black/25 underline-offset-4 hover:text-black";

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

const CreatorActivityWidget = (props) => {
    const { activityStatus, className = "" } = props;
    const postingCadence =
        props.postingCadence ?? activityStatus?.postingCadence;

    if (!activityStatus || activityStatus.status === "not_creator") {
        return null;
    }

    const status = activityStatus.status;
    const have =
        activityStatus.content_count || activityStatus.current_content || 0;
    const required = activityStatus.required ?? 3;
    const needed = Math.max(0, activityStatus.needed ?? required - have);
    const days = activityStatus.days_remaining ?? 0;

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
                    <Link href="/creator/activity" className={BTN_QUIET}>
                        See what is outstanding
                    </Link>
                </div>
            </div>
        );
    }

    // The headline IS the state — "Activity Status" was a label, and a label
    // tells the creator nothing they did not already know from the card's place
    // on the page.
    const headline = {
        grace_period: "Payments are running while you get started",
        active: "Your payments are running normally",
        grace_period_ending: "Your starter period is ending",
        insufficient_content: "Your payments are paused",
    }[status] || "We cannot check your payment status right now";

    const body = {
        grace_period: `You have ${days} ${days === 1 ? "day" : "days"} left of your starter period, so payments run whatever you post. After that you need ${required} pieces of content published in any ${activityStatus.period_days ?? 28} days.`,
        active: `You have ${have} published ${have === 1 ? "piece" : "pieces"} of content in the last ${activityStatus.period_days ?? 28} days. Nothing to do.`,
        grace_period_ending: `Your starter period ends in ${days} ${days === 1 ? "day" : "days"} and you have ${have} of ${required} pieces of content. Add ${needed} more before then and nothing changes.`,
        insufficient_content: `Add ${needed} more ${needed === 1 ? "piece" : "pieces"} of content to start being paid again. A post, a listing, a shop item or a paid request all count, and payments resume by themselves within a few minutes of approval.`,
    }[status] || "Try again shortly. Your payments are not affected by this check failing.";

    const needsAction =
        status === "insufficient_content" || status === "grace_period_ending";

    return (
        <div className={`${CARD} ${className}`}>
            <Plate status={status} />

            <h3 className="mt-3 font-gulfs text-2xl uppercase leading-[1.05] text-black">
                {headline}
            </h3>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/70">
                {body}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
                {needsAction && (
                    <Link href={route("dashboard", { add: "post" })} className={BTN_PRIMARY}>
                        Add content
                    </Link>
                )}
                <Link href="/creator/activity" className={BTN_QUIET}>
                    {needsAction ? "What counts?" : "View details"}
                </Link>
            </div>

            {/* ⚠️ A SECOND, separate rule — not a restatement of the one above.
                Above: the purchase-time content gate (28 days, any content).
                Below: the posting cadence (30 days, member posts only). They are
                deliberately not merged and can disagree, which without this
                divider read as one card contradicting itself — "Payments are
                paused" in red directly above a blue "Grace" badge. */}
            {postingCadence && (
                <div className="mt-6 border-t border-black/10 pt-5">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-black/60">
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
