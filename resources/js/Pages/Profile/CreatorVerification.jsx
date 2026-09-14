import { Link, usePage } from "@inertiajs/react";
import GetHelpButton from "@/Components/Help/GetHelpButton";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import EditProfile from "../account/EditProfile";
import Social from "../Auth/Social";
import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from "@/constants/creatorSubscription";
// One status vocabulary for the whole checklist, so a step never says "Approved"
// in one shape and "Verified" in another. Mint = done, amber = in review,
// red = needs a fix, gray = not started / locked.
/**
 * How far through setup this creator is.
 *
 * 🚨 A BAR, NOT NUMBERED NODES. The rail this replaces drew five circles reading 1–5 with
 * connector lines between them, which asserts an ORDER the product does not have: a handle,
 * a photo and a bio can be done in any order, and the only real dependency — the card comes
 * after payouts — is stated in words on that row. Numbering content that is not a sequence
 * is the structure telling the creator something untrue.
 *
 * ⚠️ One measure, one number. The count is the accessible name; the bar is decoration of it.
 */
function SetupMeter({ done, total }) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <div className="mt-3">
            <div
                aria-hidden="true"
                className="h-2.5 w-full overflow-hidden rounded-box-xs border-2 border-black bg-white"
            >
                <div
                    className="h-full bg-[#05EFB8] transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="mt-2 text-[13px] font-bold text-black/70">
                {done} of {total} done
            </p>
        </div>
    );
}

/**
 * The one thing to do next, at full weight.
 *
 * 🚨 EXACTLY ONE OF THESE RENDERS. The screen it replaces gave every outstanding step an
 * identical bordered card, so the thing a creator should do now looked the same as the three
 * they could leave — and on a fresh account that was four equal cards and no direction at
 * all. Everything else is a one-line row.
 */
function NextAction({ step, selfCheck }) {
    const isRejected = step.state === "rejected";

    return (
        /* 🚨 `border-t-2 border-black` DREW A FULL BOX, NOT A RULE (fixed 12 Sep 2026).
           `resources/css/index.css:90` redefines `.border-black` as the complete
           `border: 2px solid` SHORTHAND, and it loads AFTER the utilities — so the
           side utility is overwritten and all four edges paint. Reported as "creator
           steps ka design sahi nhi aa raha": this block and the checklist below it
           each drew their own 2px rectangle INSIDE the card's own 2px frame, which is
           the "boxes inside boxes in the same colour" fault the house rules call out.
           A single-side rule is set INLINE here, where the shorthand cannot reach it. */
        <div className="mt-4 pt-4" style={{ borderTop: "2px solid #000" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50">
                {isRejected ? "Needs a fix" : "Next"}
            </p>

            <h3 className="mt-1 font-gulfs text-[19px] font-light uppercase leading-tight text-black">
                {step.title}
            </h3>

            <p className="mt-1.5 text-[14px] leading-[1.55] text-black/70">
                {step.description}
            </p>

            {isRejected && step.reason ? (
                <p className="mt-3 rounded-box-sm border-2 border-[#E8B400] bg-[#FFF6DF] p-3 text-[14px] leading-[1.5] text-black">
                    {step.reason}
                </p>
            ) : null}

            {/* The advisor's note — amber, never red. Red on this screen would mean a person
                said no, and this is the system saying "this will slow you down". */}
            {selfCheck?.length > 0 ? (
                <ul className="mt-3 space-y-1">
                    {selfCheck.map((f, i) => (
                        <li
                            key={i}
                            className="text-[13px] leading-[1.5] text-black/70"
                        >
                            {f.message}
                        </li>
                    ))}
                </ul>
            ) : null}

            {step.hint?.length > 0 ? (
                <ul className="mt-3 space-y-1">
                    {step.hint.map((h, i) => (
                        <li
                            key={i}
                            className="flex gap-2 text-[13px] leading-[1.5] text-black/60"
                        >
                            <span aria-hidden="true" className="text-black/30">
                                ·
                            </span>
                            <span>{h}</span>
                        </li>
                    ))}
                </ul>
            ) : null}

            <div className="mt-4">{step.action}</div>

            {isRejected ? (
                <div className="mt-2">
                    <GetHelpButton
                        code="rejected_assets"
                        label="Get help with this"
                    />
                </div>
            ) : null}
        </div>
    );
}

/**
 * One finished — or not-yet-available — step, on one line.
 *
 * ⚠️ A done step is a RECEIPT, not work. It earns a line, not a card: four completed cards
 * above the one outstanding action is what buried the action on the old screen.
 */
function StepRow({ step }) {
    const done = step.state === "done";

    return (
        <li className="flex items-start gap-3 py-2.5">
            <span
                aria-hidden="true"
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-black text-[11px] font-black ${
                    done ? "bg-[#A2E4B8] text-black" : "bg-white text-black/30"
                }`}
            >
                {done ? "✓" : ""}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-black">
                    {step.label}
                </span>
                {/* 🚨 A LOCKED STEP SAYS WHY. "Locked" on its own reads as a fault the
                    creator has to solve and cannot; naming the thing it waits for turns it
                    into a fact about the order of work. */}
                {step.note ? (
                    <span className="mt-0.5 block text-[13px] leading-[1.45] text-black/55">
                        {step.note}
                    </span>
                ) : null}
            </span>
        </li>
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
            /*
             * 🚨 THREE OF THESE FIVE LINES WERE UNTRUE AND WERE ON SCREEN (fixed 11 Sep
             * 2026). `ProfileAutoApproval::judgeSocials()` checks exactly four things: a
             * known platform, https, no link shortener, and that the handle is not already
             * on another creator. It does NOT check account age, and it does NOT fetch the
             * profile to see whether it is public — so "must be active and older than 6
             * months" and "must be publicly visible so it can be checked" were rules the
             * platform stated and never applied. A creator with a three-week-old account
             * read them and did not add a handle they would in fact have been approved for.
             *
             * ⚠️ "Checked against your ID when you set up payouts" went with the identity
             * check itself (client D5/Q20) — there is no ID check to be compared against.
             *
             * ⚠️ The privacy line is deliberately said TWICE, here and in the description:
             * it is the commonest reason a creator refuses this step.
             */
            hint: [
                "One account you actually post on",
                "Private by default — nothing appears on your page unless you switch it on",
                "Not already used by another creator",
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
            reason:
                slinks?.reason ||
                (profileRejectReason && /social|instagram|tiktok|twitter|handle/i.test(profileRejectReason) ? profileRejectReason : null) ||
                null,
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
            reason:
                (creatorUser?.moderation_asset === "avatar" ? creatorUser?.moderation_reason : null) ||
                (profileRejectReason && /photo|avatar/i.test(profileRejectReason) ? profileRejectReason : null) ||
                creatorUser?.moderation_reason ||
                null,
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
            reason:
                creatorUser?.edit_bio_reason ||
                user?.edit_bio_reason ||
                (creatorUser?.moderation_asset === "bio" ? creatorUser?.moderation_reason : null) ||
                (profileRejectReason && /bio/i.test(profileRejectReason) ? profileRejectReason : null) ||
                null,
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
         * 🚨 THERE IS NO SPENNY PIGGY ID CHECK AT ALL (11 Sep 2026, client D5/Q20).
         * The step left this rail on 10 Sep and moved to the payout gate; the written
         * instruction the next day removed it outright — *"no SP ID upload, no manual
         * face/ID comparison, and no SP payout-stage identity gate."* Stripe Connect
         * runs its own KYC when payment capability requires it, and we follow whatever
         * status Stripe returns.
         */
        {
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

    const doneCount = steps.filter((s) => s.state === "done").length;

    /*
     * 🚨 ONE LIST, ORDERED — NOT FOUR BUCKETS (11 Sep 2026). The screen used to sort every
     * step into completed / waiting / needsYou / upcoming and draw a section per bucket,
     * which is four headings and four groups to read before finding the one thing to do.
     * `needsYou` is now only used to pick the FIRST outstanding step; every other step
     * keeps its place in the rail's own order.
     *
     * ⚠️ A rejected step sorts ahead of a merely unstarted one — it is the only kind that
     * can be silently blocking a page the creator believes is finished.
     */
    const needsYou = steps
        .filter((s) => s.state === "rejected" || (s.state === "todo" && !s.locked))
        .sort((a, b) => (a.state === "rejected" ? -1 : 0) - (b.state === "rejected" ? -1 : 0));

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

    const isLive = profileStatusLock == 2;
    const nextStep = needsYou[0] ?? null;
    const restOfSteps = steps.filter((s) => s.key !== nextStep?.key);

    return (
        <div className="mt-4 lg:mt-0 profileSteps bg-white border-[3px] border-black rounded-box mb-4 p-4 md:p-5">
            {/*
                🚨 THE PAGE'S STATE IS THE SUBJECT, NOT THE CHECKLIST (11 Sep 2026).
                This opened with a tracked-out eyebrow ("GET SET UP TO EARN") over a
                heading ("Set up your creator account") — two lines that named the module
                and answered nothing. The one thing a creator comes here to find out is
                whether their page is live, so that is the first sentence, as a fact.

                ⚠️ The mint block appears ONLY when the answer is yes. A loud panel that
                says "not live yet" would spend the screen's one bold moment on bad news.
            */}
            {isLive ? (
                <div className="rounded-box-sm border-2 border-black bg-[#A2E4B8] p-4">
                    <p className="font-gulfs text-[26px] font-light uppercase leading-none text-black">
                        Your page is live
                    </p>
                    <p className="mt-2 text-[14px] font-bold text-black/70">
                        Supporters can find it and buy from it now.
                    </p>
                </div>
            ) : (
                <div>
                    <p className="font-gulfs text-[24px] font-light uppercase leading-none text-black">
                        Finish your page
                    </p>
                    <p className="mt-2 text-[14px] leading-[1.55] text-black/70">
                        It goes live on its own the moment the last piece is in — there is
                        nothing to submit and nobody to wait for.
                    </p>
                </div>
            )}

            <SetupMeter done={doneCount} total={steps.length} />

            {/*
                🚨 A HELD PROFILE SAYS SO FIRST, WITH THE REASON. It used to live inside
                one step, below several ticked ones — so a creator whose page was held
                read a column of green and had to scroll to find out nothing was live.
            */}
            {profileRejectReason && !isLive ? (
                <div className="mt-4 rounded-box-sm border-2 border-[#E8B400] bg-[#FFF6DF] p-4">
                    <p className="text-[14px] font-bold text-black">
                        Your page is not visible yet
                    </p>
                    <p className="mt-1 text-[14px] leading-[1.5] text-black">
                        {profileRejectReason}
                    </p>
                    <p className="mt-2 text-[13px] leading-[1.5] text-black/70">
                        Fix that and save. The page publishes itself — nothing else needs
                        redoing.
                    </p>
                </div>
            ) : null}

            {/* Findings whose step has no action card of its own still have to reach the
                creator, or the advice is written for a screen they never see. */}
            {topFindings.length > 0 ? (
                <div className="mt-4 rounded-box-sm border-2 border-[#E8B400] bg-[#FFF6DF] p-4">
                    <p className="text-[14px] font-bold text-black">
                        Worth a look before you publish
                    </p>
                    {topFindings.map((f, i) => (
                        <p
                            key={i}
                            className="mt-1 text-[14px] leading-[1.5] text-black/80"
                        >
                            {f.message}
                        </p>
                    ))}
                </div>
            ) : null}

            {nextStep ? (
                <NextAction
                    step={nextStep}
                    selfCheck={selfCheckByStep[nextStep.key]}
                />
            ) : null}

            {restOfSteps.length > 0 ? (
                <ul
                    className="mt-4 divide-y divide-black/10 pt-1"
                    /* Same shorthand trap as `NextAction` above — inline, or this list
                       is drawn as a second box inside the card. */
                    style={{ borderTop: "2px solid #000" }}
                >
                    {restOfSteps.map((s) => (
                        <StepRow
                            key={s.key}
                            step={{
                                ...s,
                                /* A locked step names what it waits for; a done one needs
                                   no note at all — the tick is the whole message. */
                                note:
                                    s.state === "done"
                                        ? null
                                        : s.locked
                                          ? s.lockReason
                                          : s.description,
                            }}
                        />
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
