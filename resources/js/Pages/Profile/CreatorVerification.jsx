import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import EditProfile from "../account/EditProfile";
import Social from "../Auth/Social";
import { parseIdentityError } from "@/utils/identityError";

import { PRICE_FORMATTED, SUBSCRIPTION_COPY } from "@/constants/creatorSubscription";
// One status vocabulary for the whole checklist, so a step never says "Approved"
// in one shape and "Verified" in another. Mint = done, amber = in review,
// red = needs a fix, gray = not started / locked.
const CHIP = {
    done: "bg-mint text-black",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-700",
    todo: "bg-gray-100 text-gray-500",
};
function StatusChip({ state, children }) {
    return (
        <span
            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${
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
                let node = "bg-white text-gray-400 border-black";
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
                                className={`mt-1.5 text-[10px] font-bold text-center leading-tight ${
                                    current
                                        ? "text-[#FF007F]"
                                        : done
                                          ? "text-gray-600"
                                          : "text-gray-400"
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
function ActionCard({ step }) {
    const isRejected = step.state === "rejected";
    // No offset shadow on these cards. A checklist is a stack of near-identical rows, and
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
                        <h3 className="text-gray-900 font-bold">{step.title}</h3>
                        <span className="text-[11px] font-bold text-gray-400">
                            ~{step.mins} min
                        </span>
                        {isRejected && (
                            <StatusChip state="rejected">Needs a fix</StatusChip>
                        )}
                    </div>
                    <p className="text-gray-600 text-[14px] mt-0.5">
                        {step.description}
                    </p>
                </div>
            </div>

            {isRejected && (
                <div className="mt-3 bg-white border-2 border-red-500 rounded-box-sm p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-1">
                        Why it came back
                    </p>
                    <p className="text-sm text-gray-800">
                        {step.reason ||
                            "Our team asked for a change. Update it and submit again."}
                    </p>

                    {step.note && (
                        <p className="mt-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-box-sm p-2">
                            <span className="font-bold">Note from our team: </span>
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

            {step.hint?.length > 0 && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-box-sm p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        What we check
                    </p>
                    <ul className="space-y-1">
                        {step.hint.map((h, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-[13px] text-gray-600"
                            >
                                <span className="text-gray-400 mt-0.5">•</span>
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
              : "bg-gray-100 text-gray-400";
    return (
        <div className="flex items-center justify-between gap-3 border-2 border-gray-200 rounded-box-sm px-3 py-2.5 mb-2 bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
                <span
                    className={`grid place-items-center w-6 h-6 shrink-0 rounded-full text-[11px] font-bold ${iconCls}`}
                >
                    {icon}
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                        {step.title}
                    </p>
                    {step.note && (
                        <p className="text-[12px] text-gray-500 leading-snug">
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
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-5 mb-2">
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
    const hasAnySocialMedia =
        slinks &&
        Object.values(slinks).some((value) => value !== null && value !== "");
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
    const hasBasicDetails =
        hasAnySocialMedia && creatorUser?.avatar && creatorUser?.bio;
    const isSubmittedForReview = profileStatusLock == 1 && hasBasicDetails;
    const isProfileFullyApproved =
        isSocialApproved &&
        avatarStatus == 1 &&
        bioStatus == 1 &&
        hasSubscription;
    const canSubmitForReview =
        profileStatusLock != 1 &&
        profileStatusLock != 2 &&
        isProfileFullyApproved;

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
    const onboardingComplete =
        isSocialApproved &&
        avatarStatus == 1 &&
        bioStatus == 1 &&
        hasSubscription &&
        creatorUser?.identity_status == 1 &&
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

    // "Submit for review" stays locked until socials, photo and bio are APPROVED
    // and the trial is active. Name what's still outstanding — a bare "Locked"
    // tells the creator nothing about why, or what would unlock it.
    const submitBlockers = [
        !isSocialApproved && "socials",
        avatarStatus != 1 && "photo",
        bioStatus != 1 && "bio",
        !hasSubscription && "payment method",
    ].filter(Boolean);
    const listItems = (items) =>
        items.length > 1
            ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
            : items[0];

    const editorBtn =
        "inline-block bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-box-sm px-4 py-2.5 text-sm font-bold text-black transition-colors";
    const primaryBtn =
        "inline-block bg-[#FF007F] text-white border-2 border-black rounded-box-sm px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all";

    const REVIEW_NOTE = "Usually reviewed within a few hours.";

    // The whole journey as one registry: status, what we check, the editor that
    // acts on it, and why it's locked. Everything below renders from this.
    const steps = [
        {
            key: "social",
            label: "Socials",
            title: "Add a social handle",
            mins: 1,
            description:
                "Add at least one social account so fans can find and trust you.",
            hint: [
                "At least one handle you actually post on",
                "Account must be active and older than 6 months",
                "Profile must be publicly visible",
            ],
            state: isSocialApproved
                ? "done"
                : isSocialRejected
                  ? "rejected"
                  : isSocialPending
                    ? "pending"
                    : "todo",
            reason: slinks?.reason,
            reviewNote: REVIEW_NOTE,
            action: (
                <Social
                    buttontext={isSocialRejected ? "Update handles" : "Add socials"}
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
            description: "A clear photo of you — this is the first thing fans see.",
            hint: [
                "A clear photo of you, face visible",
                "No nudity or explicit content",
                "No logos, group photos or screenshots",
            ],
            state:
                avatarStatus == 1
                    ? "done"
                    : avatarStatus == 2
                      ? "rejected"
                      : creatorUser?.avatar && avatarStatus == 0
                        ? "pending"
                        : "todo",
            reviewNote: REVIEW_NOTE,
            action: (
                <EditProfile
                    text={avatarStatus == 2 ? "Upload a new photo" : "Upload photo"}
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
            state:
                bioStatus == 1
                    ? "done"
                    : bioStatus == 2
                      ? "rejected"
                      : creatorUser?.bio && bioStatus == 0
                        ? "pending"
                        : "todo",
            reason: creatorUser?.edit_bio_reason || user?.edit_bio_reason,
            reviewNote: REVIEW_NOTE,
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
        {
            key: "trial",
            label: "Payment method",
            title: "Add your card",
            mins: 1,
            description:
                `${SUBSCRIPTION_COPY.promise} — then ${PRICE_FORMATTED} + VAT a month. Needed before we can verify you.`,
            hint: [
                SUBSCRIPTION_COPY.reassurance,
                "Cancel any time from your account settings",
            ],
            state: hasSubscription ? "done" : "todo",
            action: (
                <Link className={primaryBtn} href="/activate-subscription">
                    Add your card
                </Link>
            ),
        },
        {
            key: "submit",
            label: "Submit",
            title: "Submit profile for review",
            mins: 1,
            description: canSubmitForReview
                ? "Everything’s approved — send your profile for final verification."
                : "Send your profile to our team for final approval.",
            hint: [
                "We check your socials, photo and bio together",
                "You’ll get an email as soon as it’s decided",
            ],
            state:
                profileStatusLock == 2
                    ? "done"
                    : isSubmittedForReview
                      ? "pending"
                      : profileRejectReason
                        ? "rejected"
                        : "todo",
            reason: profileRejectReason,
            reviewNote: REVIEW_NOTE,
            locked: !canSubmitForReview && !profileRejectReason,
            lockReason: submitBlockers.length
                ? `Unlocks once your ${listItems(submitBlockers)} ${
                      submitBlockers.length > 1 ? "are" : "is"
                  } approved.`
                : null,
            action: (
                <Link
                    className={primaryBtn}
                    href={route("update.profile.lock.status")}
                    method="get"
                >
                    {profileRejectReason ? "Submit again" : "Submit for review"}
                </Link>
            ),
        },
        {
            key: "identity",
            label: "Verify ID",
            title: "Verify your identity",
            mins: 3,
            description:
                "A quick ID check by Stripe. This unlocks payments on your account.",
            hint: [
                "A government photo ID — passports only",
                "A quick selfie on your phone",
                "Handled securely by Stripe; we never see your documents",
            ],
            // identity_status: 1 = verified · 2 = submitted, waiting on Stripe ·
            // 3 = flagged by the security review · 0 = failed. A submitted check
            // used to fall through to "todo", so a creator returning from Stripe
            // was invited to start a second (billable) session.
            state:
                creatorUser?.identity_status == 1
                    ? "done"
                    : creatorUser?.identity_status == 3 || identityError
                      ? "rejected"
                      : creatorUser?.identity_status == 2
                        ? "pending"
                        : "todo",
            reason: identityError
                ? `${identityError.title} — ${identityError.whatHappened}`
                : creatorUser?.identity_status == 3
                  ? "Your identity check didn’t pass our security review. Please contact support."
                  : null,
            // The steps that actually fix it, straight from the stored payload.
            fixSteps: identityError?.whatToDo || [],
            note: identityError?.note || null,
            reviewNote: "Stripe usually decides within a few minutes.",
            locked: profileStatusLock != 2 || !hasSubscription,
            lockReason:
                profileStatusLock != 2
                    ? "Unlocks once your profile is approved."
                    : "Needs an active subscription.",
            action: (
                <Link className={primaryBtn} href="/stripe/identity-verification">
                    {identityError
                        ? "Try verification again"
                        : creatorUser?.identity_status == 2
                          ? "Check status"
                          : "Verify identity"}
                </Link>
            ),
        },
        {
            key: "stripe",
            label: "Get paid",
            title: "Connect payments",
            mins: 3,
            description:
                "Connect Stripe so supporters can pay you and money reaches your bank.",
            hint: [
                "Your country and bank details",
                "Takes about 3 minutes on Stripe, then you come straight back",
            ],
            state: creatorUser?.stripe_details_submitted == 1 ? "done" : "todo",
            locked: creatorUser?.identity_status != 1,
            lockReason: "Unlocks once your identity is verified.",
            action: (
                <Link className={primaryBtn} href="/stripe/authorize">
                    Connect with Stripe
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
    const waiting = steps.filter((s) => s.state === "pending");
    const needsYou = steps.filter(
        (s) => s.state === "rejected" || (s.state === "todo" && !s.locked),
    );
    const upcoming = steps.filter((s) => s.state === "todo" && s.locked);
    const rejectedCount = needsYou.filter((s) => s.state === "rejected").length;

    return (
        <div className="mt-4 lg:mt-0 profileSteps bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-box mb-4 p-4 lg:!p-8">
            <div className="flex gap-3 items-start justify-between mb-1">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF007F]">
                        Get set up to earn
                    </p>
                    <h2 className="text-[22px] uppercase font-bold leading-none">
                        Set up your creator account
                    </h2>
                </div>
                <button
                    onClick={refreshSteps}
                    disabled={isRefreshing}
                    className="bg-pink-100 hover:bg-pink-200 text-[#FF007F] px-3 py-1.5 rounded-full text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 shrink-0"
                >
                    {isRefreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            <p className="text-gray-500 mb-4 text-sm">
                {onboardingComplete
                    ? "All set — supporters can now pay you for your content."
                    : minsLeft > 0
                      ? `${doneCount} of ${steps.length} done — about ${minsLeft} min of setup left.`
                      : `${doneCount} of ${steps.length} done — the rest is with our team.`}
            </p>

            <MilestoneRail milestones={steps} activeIndex={activeMilestone} />

            {onboardingComplete ? (
                <div className="bg-mint/30 border-2 border-black rounded-box-sm p-4 flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                        <p className="font-bold text-black">You’re all set!</p>
                        <p className="text-gray-700 text-sm mt-0.5">
                            Your creator account is fully verified. Start posting
                            content and earning.
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
                                {rejectedCount > 1 ? "s need" : " needs"} a quick
                                fix — the reason is on the card
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
                                <ActionCard key={s.key} step={s} />
                            ))}
                        </>
                    )}

                    {waiting.length > 0 && (
                        <>
                            <SectionHeading>
                                With our team · {waiting.length}
                            </SectionHeading>
                            {waiting.map((s) => (
                                <StepRow
                                    key={s.key}
                                    step={{
                                        ...s,
                                        note: s.reviewNote,
                                        chip: (
                                            <StatusChip state="pending">
                                                In review
                                            </StatusChip>
                                        ),
                                    }}
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
                                chip: <StatusChip state="done">Approved</StatusChip>,
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
