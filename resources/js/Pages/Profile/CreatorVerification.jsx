import { Link, usePage } from "@inertiajs/react";
import GetHelpButton from "@/Components/Help/GetHelpButton";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import EditProfile from "../account/EditProfile";
import Social from "../Auth/Social";
import {
    parseIdentityError,
} from "@/utils/identityError";

import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from "@/constants/creatorSubscription";
// One status vocabulary for the whole checklist, so a step never says "Approved"
// in one shape and "Verified" in another. Mint = done, amber = in review,
// red = needs a fix, gray = not started / locked.
const CHIP = {
    done: "bg-mint text-black",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-700",
    todo: "bg-gray-100 text-black/60",
};
function StatusChip({ state, children }) {
    return (
        <span
            className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide whitespace-nowrap ${
                CHIP[state] || CHIP.todo
            }`}
        >
            {children}
        </span>
    );
}

// A read-only map of the milestones so a creator always sees the whole journey
// and where they are — the same numbered-node language as the Stripe connect
// page. Completed segments fill mint (the piggy filling up).
function MilestoneRail({ milestones, activeIndex }) {
    return (
        <div
            className="flex items-start mb-5 overflow-x-auto pb-1"
            aria-label="Onboarding progress"
        >
            {milestones.map((m, i) => {
                const done = m.state === "done";
                const rejected = m.state === "rejected";
                const pending = m.state === "pending";
                const current = i === activeIndex;
                const last = i === milestones.length - 1;
                let node = "bg-white text-black/60 border-black";
                let mark = i + 1;
                if (done) {
                    node = "bg-mint text-black border-black";
                    mark = "✓";
                } else if (rejected) {
                    node = "bg-red-500 text-white border-black";
                    mark = "!";
                } else if (pending) {
                    node = "bg-amber-400 text-black border-black";
                } else if (current) {
                    node =
                        "bg-[#FF007F] text-white border-black ring-4 ring-pink-100";
                }
                return (
                    <div key={m.key} className="flex items-start shrink-0">
                        <div className="flex flex-col items-center w-12">
                            <span
                                className={`grid place-items-center w-9 h-9 rounded-full border-2 font-bold text-sm ${node}`}
                            >
                                {mark}
                            </span>
                            <span
                                className={`mt-1.5 text-[12px] font-bold text-center leading-tight ${
                                    current
                                        ? "text-[#FF007F]"
                                        : done
                                          ? "text-gray-600"
                                          : "text-black/60"
                                }`}
                            >
                                {m.label}
                            </span>
                        </div>
                        {!last && (
                            <span
                                aria-hidden
                                className={`h-0.5 w-6 sm:w-10 mt-4 shrink-0 ${
                                    done ? "bg-mint" : "bg-gray-200"
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// A step that needs the creator's hands: full card, what we check, the editor,
// and — when it came back rejected — the reason plus the same editor as the
// "fix it now" path, so a rejection is never a dead end.
function ActionCard({ step, selfCheck }) {
    const isRejected = step.state === "rejected";
    // No offset on these cards. A checklist is a stack of near-identical rows, and
    // giving every one the same heavy drop makes the list read as noise rather than as
    // steps — the border already separates them. Rejection stays distinguished by colour,
    // which is the only difference that matters here.
    return (
        <div
            className={`rounded-box border-[3px] p-4 mb-3 ${
                isRejected
                    ? "border-red-500 bg-red-50/40"
                    : "border-black bg-white"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-gray-900 font-bold">
                            {step.title}
                        </h3>
                        <span className="text-[12px] font-bold text-black/60">
                            ~{step.mins} min
                        </span>
                        {isRejected && (
                            <StatusChip state="rejected">
                                Needs a fix
                            </StatusChip>
                        )}
                    </div>
                    <p className="text-gray-600 text-[14px] mt-0.5">
                        {step.description}
                    </p>
                </div>
            </div>

            {isRejected && (
                <div className="mt-3 bg-white border-2 border-red-500 rounded-box-sm p-3">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-red-600 mb-1">
                        Why it came back
                    </p>
                    <p className="text-sm text-gray-800">
                        {step.reason ||
                            "A check pulled this back. Fix it and save — it is checked again straight away."}
                    </p>
                    {/* A rejection is the moment a creator objects — give them a
                        person, not a mailto (config/creator_help.php, tier 2). */}
                    <div className="mt-2">
                        <GetHelpButton
                            code="rejected_assets"
                            label="Ask our team about this"
                        />
                    </div>

                    {step.note && (
                        <p className="mt-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-box-sm p-2">
                            <span className="font-bold">
                                Note from our team:{" "}
                            </span>
                            {step.note}
                        </p>
                    )}

                    {/* The fix, not just the verdict — an ID check that comes
                        back with only a code leaves the creator guessing. */}
                    {step.fixSteps?.length > 0 && (
                        <ol className="mt-2 space-y-1">
                            {step.fixSteps.map((s, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-[13px] text-gray-700"
                                >
                                    <span className="font-bold text-red-500">
                                        {i + 1}.
                                    </span>
                                    <span>{s}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}

            {/*
                The advisor's note, before anyone decides. Amber, never red —
                red on this card means a person said no, and this is the system
                saying "this will slow you down". Blocking findings name the
                consequence; attention findings just ask for a look.
            */}
            {selfCheck?.length > 0 && step.state !== "done" && (
                <div className="mt-3 bg-[#FFF6D6] border-2 border-black rounded-box-sm p-3">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-black mb-1">
                        {selfCheck.some((f) => f.severity === "blocking")
                            ? "Fix this before you submit"
                            : "Worth a look before review"}
                    </p>
                    {selfCheck.map((f, i) => (
                        <p key={i} className="text-sm text-black/80 mt-1">
                            {f.message}
                        </p>
                    ))}
                </div>
            )}

            {step.hint?.length > 0 && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-box-sm p-3">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-black/60 mb-1.5">
                        What we check
                    </p>
                    <ul className="space-y-1">
                        {step.hint.map((h, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-[13px] text-gray-600"
                            >
                                <span className="text-black/60 mt-0.5">•</span>
                                <span>{h}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {step.action && <div className="mt-3">{step.action}</div>}
        </div>
    );
}

// Everything not asking for action collapses to one line, so the list stays
// short as the creator progresses.
function StepRow({ step }) {
    const icon =
        step.state === "done" ? "✓" : step.state === "pending" ? "◐" : "○";
    const iconCls =
        step.state === "done"
            ? "bg-mint text-black"
            : step.state === "pending"
              ? "bg-amber-400 text-black"
              : "bg-gray-100 text-black/60";
    return (
        <div className="flex items-center justify-between gap-3 border-2 border-gray-200 rounded-box-sm px-3 py-2.5 mb-2 bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
                <span
                    className={`grid place-items-center w-6 h-6 shrink-0 rounded-full text-[12px] font-bold ${iconCls}`}
                >
                    {icon}
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                        {step.title}
                    </p>
                    {step.note && (
                        <p className="text-[12px] text-black/60 leading-snug">
                            {step.note}
                        </p>
                    )}
                </div>
            </div>
            {step.chip}
        </div>
    );
}

function SectionHeading({ children }) {
    return (
        <p className="text-[12px] font-bold uppercase tracking-widest text-black/60 mt-5 mb-2">
            {children}
        </p>
    );
}

export default function CreatorVerification({ IsloggedIn, fetchingLinks }) {
    const {
        auth: initialAuth,
        user: initialUser,
        global_currency,
        slinks: initialSlinks,
        profile_self_check,
    } = usePage().props;

    // Use local state so background polling doesn't trigger a full page re-render
    const [auth, setAuth] = useState(initialAuth);
    const [user, setUser] = useState(initialUser);
    const [slinks, setSlinks] = useState(initialSlinks);

    // Keep local state in sync if page props change from elsewhere
    useEffect(() => {
        setAuth(initialAuth);
        setUser(initialUser);
        setSlinks(initialSlinks);
    }, [initialAuth, initialUser, initialSlinks]);

    const creatorUser = auth?.user || user;
    /*
     * 🚨 THE SERVER ANSWERS THIS, THE PAGE DOES NOT RE-DERIVE IT.
     *
     * This walked EVERY column on the row — `id`, `user_id`, `status`, `source`,
     * the timestamps — so a `social_links` row with all fourteen platforms blank
     * answered true. The step rendered ticked, "Submit for review" unlocked, and
     * the server refused with a message naming a field this screen said was done.
     * `has_any_handle` is appended by the `SocialLinks` model, so the button and
     * the gate behind it cannot disagree.
     */
    const hasAnySocialMedia = Boolean(slinks?.has_any_handle);
    const hasSubscription =
        creatorUser?.subscription_status === 1 ||
        creatorUser?.subscription_status === 2;
    const socialStatus = slinks?.status;
    const isSocialApproved = socialStatus == 1;
    const isSocialPending = hasAnySocialMedia && socialStatus == 0;
    const isSocialRejected = socialStatus == 2;

    const avatarStatus = creatorUser?.avatar_approved;
    const bioStatus = creatorUser?.bio_approved;
    const profileStatusLock = creatorUser?.profile_status_lock;
    const profileRejectReason =
        creatorUser?.profile_reject_reason || user?.profile_reject_reason;
    // Everything the creator supplies themselves. Approval is not part of it — that
    // is `profileHolds`, and the two are deliberately separate: "you have not written
    // a bio" and "your bio was pulled" are different sentences.
    const hasBasicDetails =
        hasAnySocialMedia && creatorUser?.avatar && creatorUser?.bio;
    /*
     * 🚨 THE `reviewSubmission` PROP AND ITS THREE FLAGS STOOD HERE AND ARE GONE
     * (11 Sep 2026). There is no submission and no review team: each asset is judged
     * as it is saved and the page goes live on its own.
     *
     * `profile_holds` is what replaced them — the assets an automated check or an
     * admin has PULLED, which is the only thing that can now stand between a creator
     * and a live page. Server-decided (`ProfileAutoApproval::holding`), shared on the
     * user because three separate steps below read it.
     */
    const profileHolds = auth?.user?.profile_holds || [];
    const isHeld = (asset) => profileHolds.includes(asset);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLatestVerificationData = async () => {
        try {
            const response = await axios.get(window.location.href, {
                headers: {
                    "X-Inertia": "true",
                    "X-Inertia-Partial-Data": "auth,user,slinks",
                    "X-Inertia-Partial-Component": "Dashboard",
                },
            });

            if (response.data && response.data.props) {
                if (response.data.props.auth) setAuth(response.data.props.auth);
                if (response.data.props.user) setUser(response.data.props.user);
                if (response.data.props.slinks)
                    setSlinks(response.data.props.slinks);
            }
        } catch (error) {
            console.error("Failed to fetch verification status", error);
        }
    };

    const refreshSteps = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        await fetchLatestVerificationData();
        setIsRefreshing(false);
    };

    // A full page reload after every avatar/bio save was jarring and lost scroll
    // position. Reuse the partial refresh the poller already trusts so a save
    // updates the steps in place.
    const updateProfileSteps = () => {
        refreshSteps();
    };

    const pollCount = useRef(0);

    // Onboarding is "done" only when every gated step is approved/connected —
    // not just Stripe. The old poll stopped once Stripe was submitted (or after
    // ~100s), so any later decision needed a manual reload.
    // ⚠️ No identity clause (11 Sep 2026): identity is a payout gate and left this
    // rail on 10 Sep. Keeping it here meant "5 of 5 done" with the celebration never
    // firing, and the 15s poller re-arming for ever for a check the page does not show.
    const onboardingComplete =
        isSocialApproved &&
        avatarStatus == 1 &&
        bioStatus == 1 &&
        hasSubscription &&
        creatorUser?.stripe_details_submitted == 1;

    useEffect(() => {
        if (onboardingComplete) return; // nothing left to wait on

        // Refresh as soon as the creator returns to the tab, and reset the cap so
        // a long wait resumes checking instead of sitting stale.
        const onVisible = () => {
            if (!document.hidden) {
                pollCount.current = 0;
                fetchLatestVerificationData();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        // Kept alive past the cap ON PURPOSE (it just no-ops): the visibility
        // listener resets pollCount to 0 when the creator returns, and a live
        // interval then resumes real polling on its next tick. Clearing it here
        // would strand them on a single fetch-on-return with no heartbeat.
        const interval = setInterval(() => {
            if (document.hidden) return;
            if (pollCount.current >= 40) return;
            pollCount.current += 1;
            fetchLatestVerificationData();
        }, 15000);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [onboardingComplete]);

    // Resolved server-side (App\Support\IdentityFailureReason) so this page and
    // the failure email say the same thing.
    const identityError = parseIdentityError(
        creatorUser?.identity_verification_error,
    );

    const listItems = (items) =>
        items.length > 1
            ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
            : items[0];

    /*
     * What the review console's advisor would flag about this profile, shown to
     * the creator while it is still theirs to fix (31 Aug 2026). Server-built
     * (App\Support\ProfileSelfCheck) from the same lists the admin screen reads,
     * so the two cannot disagree.
     *
     * ⚠️ ADVICE, NEVER A VERDICT. Copy below says "hold up your review" — it
     * must never say rejected, because an admin can still decide either way.
     */
    const SELF_CHECK_STEP = { bio: "bio", avatar: "avatar", socials: "social" };
    const selfCheckByStep = {};
    const selfCheckOrphans = [];
    (profile_self_check || []).forEach((f) => {
        const key = SELF_CHECK_STEP[f.asset];
        if (key) {
            (selfCheckByStep[key] = selfCheckByStep[key] || []).push(f);
        } else {
            // A finding with no checklist step of its own (the cover banner).
            selfCheckOrphans.push(f);
        }
    });

    const editorBtn =
        "inline-block bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-box-sm px-4 py-2.5 text-sm font-bold text-black transition-colors";
    const primaryBtn =
        // Black on brand pink — white measures 3.78:1 and fails AA (house rule).
        "inline-block bg-[#FF007F] text-black border-2 border-black rounded-box-sm px-4 py-2.5 text-sm font-bold hover:brightness-110 active:brightness-95 active:translate-x-0.5 active:translate-y-0.5 transition-all";

    /*
     * ⚠️ Kept for the SUBMIT step only. It used to sit on every asset, which
     * told a creator their photo, bio and handles were each queued for their own
     * approval — they are not: they are checked together, once, when the profile
     * is submitted. The page now just asks them to add things and ticks them off.
     */
    // ⚠️ There is no review to note a time for. Checks run as each asset is saved.

    // The whole journey as one registry: status, what we check, the editor that
    // acts on it, and why it's locked. Everything below renders from this.
    // Held assets are named in the creator's words, not the column's.
    const HOLD_LABELS = {
        avatar: "photo",
        bio: "bio",
        socials: "social handle",
        cover: "cover image",
    };

    const steps = [
        {
            key: "social",
            label: "Socials",
            title: "Add a social handle",
            mins: 1,
            /*
             * 🚨 "SO FANS CAN FIND YOU" WAS THE OLD BEHAVIOUR AND IS NO LONGER TRUE
             * (6 Sep 2026). An approved handle used to be published on the profile
             * automatically; `social_links.public_platforms` means nothing is public
             * until the creator chooses it, so the reason we ask is verification and
             * the copy has to say so. The step's own editor carries the per-platform
             * switch.
             */
            description:
                "Add at least one social account you actually post on. It stays private on your page unless you switch it on.",
            hint: [
                "At least one handle you actually post on",
                "Account must be active and older than 6 months",
                "Profile must be publicly visible so it can be checked",
                // 🚨 Said twice on purpose, in the description AND here. It is the most
                // common reason a creator refuses this step, and it is the one thing
                // about it that is not obvious (client direction, 10 Sep 2026).
                "🔒 Private by default — nothing is shown on your page unless you choose to",
                "Checked against your ID when you set up payouts, not now",
            ],
            // Approved on save when the checks pass. "rejected" only ever means a
            // person said no; there is no "pending" — nobody is looking.
            state: isSocialApproved
                ? "done"
                : isSocialRejected || isHeld("socials")
                  ? "rejected"
                  : hasAnySocialMedia
                    ? "done"
                    : "todo",
            approvedState: isSocialApproved ? 1 : 0,
            reason: slinks?.reason,
            action: (
                <Social
                    buttontext={
                        isSocialRejected ? "Update handles" : "Add socials"
                    }
                    classes={editorBtn}
                    links={slinks}
                />
            ),
        },
        {
            key: "avatar",
            label: "Photo",
            title: "Upload a profile photo",
            mins: 1,
            description:
                "A clear photo of you — this is the first thing fans see.",
            hint: [
                "A clear photo of you, face visible",
                "No nudity or explicit content",
                "No logos, group photos or screenshots",
            ],
            /*
             * Approved the moment it is uploaded (client direction: no delay). The
             * automated scan runs behind it and can pull it back down — that is what
             * `isHeld("avatar")` reads, and the reason comes with it.
             */
            state:
                isHeld("avatar")
                    ? "rejected"
                    : avatarStatus == 1
                      ? "done"
                      : avatarStatus == 2
                        ? "rejected"
                        : creatorUser?.avatar
                          ? "done"
                          : "todo",
            reason: creatorUser?.moderation_asset === "avatar"
                ? creatorUser?.moderation_reason
                : null,
            approvedState: avatarStatus == 1 ? 1 : 0,
            action: (
                <EditProfile
                    text={
                        avatarStatus == 2
                            ? "Upload a new photo"
                            : "Upload photo"
                    }
                    updateProfileSteps={updateProfileSteps}
                    user={user}
                    classes={editorBtn}
                    global_currency={global_currency}
                />
            ),
        },
        {
            key: "bio",
            label: "Bio",
            title: "Write your bio",
            mins: 2,
            description: "A few lines about the content you make.",
            hint: [
                "A few lines about the content you create",
                "No contact details or links to other sites",
                "No gift, donation or tribute wording",
            ],
            // Approved on save — the two content rules run in the validator, so a bio
            // that saved at all has passed them. `isHeld` covers an admin's later no.
            state:
                isHeld("bio")
                    ? "rejected"
                    : bioStatus == 1
                      ? "done"
                      : bioStatus == 2
                        ? "rejected"
                        : creatorUser?.bio
                          ? "done"
                          : "todo",
            approvedState: bioStatus == 1 ? 1 : 0,
            reason: creatorUser?.edit_bio_reason || user?.edit_bio_reason,
            action: (
                <EditProfile
                    text={bioStatus == 2 ? "Rewrite bio" : "Write bio"}
                    updateProfileSteps={updateProfileSteps}
                    user={user}
                    classes={editorBtn}
                    global_currency={global_currency}
                />
            ),
        },
        /*
         * 🚨 THE `submit` STEP STOOD HERE AND IS GONE (10 Sep 2026, client direction).
         * There is no Submit-for-review: each asset above is judged by the automated
         * checks as it is saved, and the profile goes live on its own the moment photo,
         * bio and a handle are all approved (App\Support\ProfileAutoApproval). A held
         * asset keeps ITS OWN step open with the reason on it — see `profile_holds`.
         */
        {
            key: "stripe",
            label: "Payouts",
            title: "Connect payments",
            mins: 3,
            description:
                "Connect Stripe so supporters can pay you and money reaches your bank.",
            hint: [
                "Your country and bank details",
                "Takes about 3 minutes on Stripe, then you come straight back",
            ],
            state: creatorUser?.stripe_details_submitted == 1 ? "done" : "todo",
            // 🚨 CONNECT IS NOT LOCKED BEHIND THE CARD (fixed 11 Sep 2026). The
            // journey is profile · social · STRIPE · subscription — the card moved
            // LAST — and `StripeController::index` asks only for a live page. This
            // rail still held Connect shut until a card was added, the exact deadlock
            // `subscriptionGate()` was deleted to remove, while the dashboard card
            // beside it said "Connect your payouts". One creator, two answers.
            locked: profileStatusLock != 2,
            lockReason: "Unlocks once your page is live.",
            action: (
                <Link className={primaryBtn} href="/stripe/authorize">
                    Connect with Stripe
                </Link>
            ),
        },
        /*
         * 🚨 THE `identity` STEP LEFT THIS RAIL ON 10 Sep 2026 (client direction).
         * A creator builds, publishes and sells with no ID check; it is asked at the
         * PAYOUT gate instead, where the money it holds is visible — see
         * Components/PayoutIdentityGate.jsx and App\Support\PayoutEligibility.
         */        {
            key: "trial",
            label: "Payment method",
            title: "Add your card",
            mins: 1,
            /*
             * 🚨 THE CARD IS THE LAST SETUP STEP, AFTER CONNECT (11 Sep 2026). It has
             * moved three times and each move found the same thing: it is the step
             * creators stop on, so everything asked before it is free. It gates
             * nothing — `subscriptionGate()` is deleted — and asks only for a live page.
             */
            description: `Your page is live. Add a card to unlock payouts — ${SUBSCRIPTION_COPY.promise}, then ${PRICE_FORMATTED} + VAT a month.`,
            hint: [
                SUBSCRIPTION_COPY.reassurance,
                "Cancel any time from your account settings",
            ],
            state: hasSubscription ? "done" : "todo",
            approvedState: hasSubscription,
            locked: profileStatusLock != 2,
            lockReason: "Unlocks once your page is live.",
            action: (
                <Link className={primaryBtn} href="/activate-subscription">
                    Add your card
                </Link>
            ),
        },

    ];

    const activeMilestone = steps.findIndex(
        (s) => s.state === "todo" && !s.locked,
    );
    const doneCount = steps.filter((s) => s.state === "done").length;
    const minsLeft = steps
        .filter(
            (s) => (s.state === "todo" || s.state === "rejected") && !s.locked,
        )
        .reduce((sum, s) => sum + s.mins, 0);

    // Four MUTUALLY EXCLUSIVE tiers keyed off the four states, so a step lands
    // in exactly one bucket:
    //   done → completed · pending → waiting · rejected → needsYou (always, so
    //   its reason is never hidden behind a bare "Locked" row) · todo → needsYou
    //   when actionable, else upcoming.
    // A pending step used to match both `waiting` and (locked) `upcoming` and
    // rendered twice; keying on state fixes that.
    const completed = steps.filter((s) => s.state === "done");
    // ⚠️ No `waiting` list (11 Sep 2026): no step produces "pending" any more — nobody
    // is looking. The "With our team · In review" section that read it was dead markup.
    const needsYou = steps.filter(
        (s) => s.state === "rejected" || (s.state === "todo" && !s.locked),
    );
    const upcoming = steps.filter((s) => s.state === "todo" && s.locked);

    /*
     * 🚨 A finding must reach the creator even when its step is NOT rendered as
     * an action card. A submitted profile's bio step is `pending` and renders as
     * a collapsed "In review" row — which is exactly the creator this screen was
     * built for (they submitted the wording that will hold them up). Anything
     * without a visible card lands in the panel at the top instead.
     */
    const needsYouKeys = new Set(needsYou.map((s) => s.key));
    const stepStateByKey = Object.fromEntries(
        steps.map((s) => [s.key, s.state]),
    );
    const topFindings = [
        ...selfCheckOrphans,
        ...Object.entries(selfCheckByStep)
            .filter(
                ([key]) =>
                    !needsYouKeys.has(key) && stepStateByKey[key] !== "done",
            )
            .flatMap(([, findings]) => findings),
    ];
    const rejectedCount = needsYou.filter((s) => s.state === "rejected").length;

    return (
        <div className="mt-4 lg:mt-0 profileSteps bg-white border-[3px] border-black rounded-box mb-4 p-4 lg:!p-8">
            <div className="flex gap-3 items-start justify-between mb-1">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF007F]">
                        Get set up to earn
                    </p>
                    <h2 className="text-[22px] uppercase font-bold leading-none">
                        Set up your creator account
                    </h2>
                </div>
                <button
                    onClick={refreshSteps}
                    disabled={isRefreshing}
                    className="bg-pink-100 hover:bg-pink-200 text-[#FF007F] px-3 py-1.5 rounded-full text-sm font-bold border-2 border-black transition-all disabled:opacity-50 shrink-0"
                >
                    {isRefreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {/*
                🚨 A REJECTED PROFILE SAYS SO AT THE TOP, WITH THE REASON.
                The reason used to live only inside the submit step, which sits
                below several completed ones — so a creator whose profile had
                been turned down saw a page full of green ticks and had to scroll
                to find out nothing was live. It is the whole reason they are
                here, so it goes first.
            */}
            {profileRejectReason && profileStatusLock != 2 ? (
                <div className="mb-4 rounded-box-sm border-2 border-black bg-[#FFE5EF] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#FF007F]">
                        Your profile was not approved
                    </p>
                    <p className="mt-1 text-sm text-black">
                        {profileRejectReason}
                    </p>
                    <p className="mt-2 text-sm text-black/70">
                        Fix the point above and save — your page goes live on its
                        own once it clears. Nothing else needs redoing.
                    </p>
                </div>
            ) : null}

            {/*
                🚨 An asset an automated check or an admin has PULLED. Amber, never
                red: the profile is simply not live yet, and everything it names is
                something the creator can fix and re-save. There is nothing to submit
                again — saving re-judges it and the page goes live on its own.
            */}
            {profileHolds.length > 0 ? (
                <div className="mb-4 rounded-box-sm border-2 border-black bg-[#FFF6D6] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-black">
                        Your page is not live yet
                    </p>
                    <p className="mt-1 text-sm text-black/80">
                        {profileHolds.length > 1
                            ? "Two things on your profile need another look"
                            : `Your ${HOLD_LABELS[profileHolds[0]] || "profile"} needs another look`}
                        . Fix it below and save — your page goes live on its own once
                        it clears.
                    </p>
                </div>
            ) : null}

            <p className="text-black/60 mb-4 text-sm">
                {onboardingComplete
                    ? "All set — supporters can now pay you for your content."
                    : minsLeft > 0
                      ? `${doneCount} of ${steps.length} done — about ${minsLeft} min of setup left.`
                      : `${doneCount} of ${steps.length} done.`}
            </p>

            {/*
                Findings whose step has no visible action card below — a pending
                (submitted) step's collapsed row, or an asset with no step of its
                own (the cover banner). Amber, and it names the fix — the creator
                can edit and resubmit instead of waiting for the rejection.
            */}
            {topFindings.length > 0 && (
                <div className="mb-4 rounded-box-sm border-2 border-black bg-[#FFF6D6] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-black">
                        {topFindings.some((f) => f.severity === "blocking")
                            ? "This will hold your page back"
                            : "Worth a look before you go live"}
                    </p>
                    {topFindings.map((f, i) => (
                        <p key={i} className="mt-1 text-sm text-black/80">
                            <span className="font-bold">{f.label}: </span>
                            {f.message}
                        </p>
                    ))}
                </div>
            )}

            <MilestoneRail milestones={steps} activeIndex={activeMilestone} />

            {onboardingComplete ? (
                <div className="bg-mint/30 border-2 border-black rounded-box-sm p-4 flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                        <p className="font-bold text-black">You’re all set!</p>
                        <p className="text-gray-700 text-sm mt-0.5">
                            Your creator account is fully verified. Start
                            posting content and earning.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {rejectedCount > 0 && (
                        <div className="bg-red-50 border-2 border-red-500 rounded-box-sm p-3 mb-4 flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <p className="text-sm font-bold text-red-700">
                                {rejectedCount} step
                                {rejectedCount > 1 ? "s need" : " needs"} a
                                quick fix — the reason is on the card
                                {rejectedCount > 1 ? "s" : ""} below.
                            </p>
                        </div>
                    )}

                    {needsYou.length > 0 && (
                        <>
                            <SectionHeading>
                                {needsYou.length > 1
                                    ? `Do these next · ${needsYou.length}`
                                    : "Do this next"}
                            </SectionHeading>
                            {needsYou.map((s) => (
                                <ActionCard
                                    key={s.key}
                                    step={s}
                                    selfCheck={selfCheckByStep[s.key]}
                                />
                            ))}
                        </>
                    )}

                    {upcoming.length > 0 && (
                        <>
                            <SectionHeading>Coming up</SectionHeading>
                            {upcoming.map((s) => (
                                <StepRow
                                    key={s.key}
                                    step={{
                                        ...s,
                                        note: s.lockReason,
                                        chip: (
                                            <StatusChip state="todo">
                                                Locked
                                            </StatusChip>
                                        ),
                                    }}
                                />
                            ))}
                        </>
                    )}
                </>
            )}

            {completed.length > 0 && (
                <>
                    <SectionHeading>Done · {completed.length}</SectionHeading>
                    {completed.map((s) => (
                        <StepRow
                            key={s.key}
                            step={{
                                ...s,
                                note: null,
                                chip: (
                                    <StatusChip state="done">
                                        {s.key === "trial"
                                            ? "Connected"
                                            : s.key === "stripe"
                                              ? "Connected"
                                              : s.approvedState === 1
                                              ? "Approved"
                                              : "Ready"}
                                    </StatusChip>
                                ),
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
