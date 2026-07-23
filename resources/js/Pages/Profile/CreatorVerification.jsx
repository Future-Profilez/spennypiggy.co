import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import AddIntro from "../intros/AddIntro";
import EditProfile from "../account/EditProfile";
import AddPost from "../feed/AddPost";
import ChangeVat from "../account/ChangeVat";
import Popup from "@/Components/Popup";
import { checkedItem } from "@/includes/Icons";
import Social from "../Auth/Social";
import AddBills from "../bills/AddBills";
import AddMembership from "../membership/AddMembership";
import ActivateSubscription from "./ActivateSubscription";
import SiteSubscription from "./SiteSubscription";
import { BsStopwatch } from "react-icons/bs";
import { FaLock } from "react-icons/fa";
import { MdOutlinePayment, MdInfoOutline } from "react-icons/md";

// One status vocabulary for the whole checklist, so a step never says "Approved"
// in one shape and "Verified" in another. Mint = done, amber = in review,
// red = needs a fix, gray = not started.
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

// A read-only map of the six milestones so a creator always sees the whole
// journey and where they are — the same numbered-node language as the Stripe
// connect page, for one consistent onboarding system. Completed segments fill
// mint (the piggy filling up).
function MilestoneRail({ milestones, activeIndex }) {
    return (
        <div className="flex items-start mb-5 overflow-x-auto pb-1" aria-label="Onboarding progress">
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
                    node = "bg-[#FF007F] text-white border-black ring-4 ring-pink-100";
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
                                    current ? "text-[#FF007F]" : done ? "text-gray-600" : "text-gray-400"
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

    const [status, setStatus] = useState();
    const [introStatus, setIntroStatus] = useState(status && status.intro);
    const [filledSteps, setFilledSteps] = useState(0);
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
    const isProfileFullyApproved = isSocialApproved && avatarStatus == 1 && bioStatus == 1 && hasSubscription;

    const canSubmitForReview = profileStatusLock != 1 && profileStatusLock != 2 && isProfileFullyApproved;
    // A full page reload after every avatar/bio save was jarring and lost scroll
    // position. The component already refreshes auth/user/slinks via a partial
    // Inertia fetch for its poller — reuse that so a save updates the steps in
    // place instead of reloading the whole dashboard.
    const updateProfileSteps = () => {
        refreshSteps();
    };

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

    const pollCount = useRef(0);

    useEffect(() => {
        let interval;
        if (creatorUser?.stripe_details_submitted !== 1) {
            interval = setInterval(() => {
                // To save server load, don't poll if the tab is not visible/active
                if (document.hidden) return;

                // Limit maximum automatic polling to 20 times to avoid infinite polling
                if (pollCount.current >= 20) {
                    clearInterval(interval);
                    return;
                }

                pollCount.current += 1;
                fetchLatestVerificationData();
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [creatorUser?.stripe_details_submitted]);

    useEffect(() => {
        let steps = 0;
        if (creatorUser?.bio && (bioStatus == 0 || bioStatus == 1)) steps += 1;
        if (creatorUser?.avatar && (avatarStatus == 0 || avatarStatus == 1))
            steps += 1;
        if (hasSubscription) steps += 1;
        if (creatorUser?.identity_status == 1) steps += 1;
        if (creatorUser?.stripe_details_submitted == 1) steps += 1;
        if (hasAnySocialMedia && (socialStatus == 0 || socialStatus == 1))
            steps += 1;
        setFilledSteps(steps);
    }, [
        creatorUser?.bio,
        creatorUser?.avatar,
        bioStatus,
        avatarStatus,
        hasSubscription,
        creatorUser?.identity_status,
        creatorUser?.stripe_details_submitted,
        hasAnySocialMedia,
        socialStatus,
    ]);

    const error = (() => {
        try {
            return JSON.parse(auth?.user?.identity_verification_error);
        } catch {
            return null;
        }
    })();

    // The six countable milestones, in order, each resolved to one status.
    const milestones = [
        {
            key: "social",
            label: "Socials",
            state: isSocialApproved
                ? "done"
                : isSocialRejected
                  ? "rejected"
                  : hasAnySocialMedia && socialStatus == 0
                    ? "pending"
                    : "todo",
        },
        {
            key: "avatar",
            label: "Photo",
            state:
                avatarStatus == 1
                    ? "done"
                    : avatarStatus == 2
                      ? "rejected"
                      : creatorUser?.avatar && avatarStatus == 0
                        ? "pending"
                        : "todo",
        },
        {
            key: "bio",
            label: "Bio",
            state:
                bioStatus == 1
                    ? "done"
                    : bioStatus == 2
                      ? "rejected"
                      : creatorUser?.bio && bioStatus == 0
                        ? "pending"
                        : "todo",
        },
        { key: "trial", label: "Free trial", state: hasSubscription ? "done" : "todo" },
        {
            key: "identity",
            label: "Verify ID",
            state:
                creatorUser?.identity_status == 1
                    ? "done"
                    : creatorUser?.identity_status == 2
                      ? "rejected"
                      : "todo",
        },
        {
            key: "stripe",
            label: "Get paid",
            state: creatorUser?.stripe_details_submitted == 1 ? "done" : "todo",
        },
    ];
    const activeMilestone = milestones.findIndex((m) => m.state === "todo");
    const doneCount = milestones.filter((m) => m.state === "done").length;

    const nextStep = (() => {
        if (profileStatusLock == 2) {
            if (creatorUser?.identity_status != 1) {
                return {
                    title: "Complete identity verification",
                    description: hasSubscription
                        ? "This unlocks payments and helps keep your account secure."
                        : "Active subscription or free trial required to verify identity.",
                    action: hasSubscription ? (
                        <Link
                            className={"text-pink font-bold"}
                            href="/stripe/identity-verification"
                        >
                            Verify identity
                        </Link>
                    ) : (
                        <span className="text-gray-400 font-bold cursor-not-allowed">
                            Verify identity
                        </span>
                    ),
                };
            }
            if (creatorUser?.stripe_details_submitted != 1) {
                return {
                    title: "Connect your Stripe account",
                    description:
                        "Finish setting up Stripe so you can receive funds.",
                    action: (
                        <Link className={"text-pink font-bold"} href="/stripe/authorize">
                            Connect Stripe
                        </Link>
                    ),
                };
            }
            return {
                title: "All steps completed",
                description:
                    "Your creator profile is ready. You can now use creator features.",
                action: null,
            };
        }

        if (isSubmittedForReview) {
            return {
                title: "Waiting for admin review",
                description:
                    "Your profile is under review. You can still complete other steps while waiting.",
                action: null,
            };
        }

        if (profileStatusLock == 0 && profileRejectReason) {
            return {
                title: "Fix issues and resubmit",
                description:
                    "Update your profile based on the rejection reason and submit again.",
                action: (
                    <Link
                        className="text-pink font-bold"
                        href={route("update.profile.lock.status")}
                        method="get"
                    >
                        Submit for re-verification
                    </Link>
                ),
            };
        }

        if (!hasSubscription) {
            return {
                title: "Start your 3-day free trial",
                description:
                    "You can do this anytime. It doesn't block other steps.",
                action: (
                    <Link
                        className="text-pink font-bold"
                        href="/activate-subscription"
                    >
                        Start free trial
                    </Link>
                ),
            };
        }

        if (!hasAnySocialMedia) {
            return {
                title: "Add at least one social handle",
                description:
                    "You can add socials now. Approval can happen in parallel.",
                action: null,
            };
        }

        if (isSocialRejected) {
            return {
                title: "Update your social handles",
                description:
                    "Your social handles were rejected. Update and resubmit.",
                action: null,
            };
        }

        if (!creatorUser?.avatar || avatarStatus == 2) {
            return {
                title: "Upload a profile picture",
                description:
                    "Upload a clear avatar. Review will happen in parallel.",
                action: null,
            };
        }

        if (!creatorUser?.bio || bioStatus == 2) {
            return {
                title: "Write your bio",
                description:
                    "Add your bio now. Review will happen in parallel.",
                action: null,
            };
        }

        if (canSubmitForReview) {
            return {
                title: "Submit your profile for review",
                description:
                    "Submit now once your socials, avatar, bio, and subscription are added.",
                action: (
                    <Link
                        className="text-pink font-bold"
                        href={route("update.profile.lock.status")}
                        method="get"
                    >
                        Submit for review
                    </Link>
                ),
            };
        }

        if (isSocialPending || avatarStatus == 0 || bioStatus == 0) {
            return {
                title: "Some steps are under review",
                description:
                    "You can keep working on other parts of your profile while we review.",
                action: null,
            };
        }

        return {
            title: "Continue completing steps",
            description: "You can complete steps in any order.",
            action: null,
        };
    })();

    return (
        <>
            <style>{`
                .check-icon.checked svg path { fill: #139700 !important; }
                .locked-section {
                    background-color: #f9f9f9;
                    border: 1px dashed #bbb;
                    padding: 20px;
                    border-radius: 12px;
                    position: relative;
                }
                .locked-overlay {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    align-items: center;
                    color: #555;
                }
            `}</style>

            <div className="mt-4 lg:mt-0 profileSteps bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-box mb-4 p-4 lg:!p-8">
                <div className="flex gap-3 items-center justify-between mb-1">
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
                        className="bg-pink-100 hover:bg-pink-200 text-[#FF007F] px-3 py-1.5 rounded-full text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 disabled:opacity-50 shrink-0"
                    >
                        {isRefreshing ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
                <p className="text-gray-500 mb-4 text-sm">
                    {doneCount} of {milestones.length} done — finish these and
                    supporters can start paying you for your content.
                </p>

                <MilestoneRail
                    milestones={milestones}
                    activeIndex={activeMilestone}
                />

                {/* Do this next — one clear pointer, not "any order" which fought
                    the numbered list above it. */}
                <div className="bg-[#FDF3F8] border-2 border-black rounded-box-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF007F] mb-0.5">
                                Do this next
                            </p>
                            <p className="text-gray-900 font-bold">
                                {nextStep.title}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                                {nextStep.description}
                            </p>
                        </div>
                        {nextStep.action ? (
                            <div className="shrink-0">{nextStep.action}</div>
                        ) : (
                            ""
                        )}
                    </div>
                </div>

                {profileStatusLock == 0 && profileRejectReason ? (
                    <div className="text-red-600 bg-red-50 border !border-red-500 p-3 rounded-box-sm mt-3">
                        <strong className="text-red-800">
                            Profile Verification Rejected
                        </strong>
                        <p className="text-sm capitalize mb-2">
                            {profileRejectReason}
                        </p>
                        <Link
                            className="text-xs px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full "
                            href={route("update.profile.lock.status")}
                            method="get"
                        >
                            Submit For Re-Verification
                        </Link>
                    </div>
                ) : (
                    ""
                )}

                {creatorUser?.bio &&
                creatorUser?.avatar &&
                profileStatusLock == 1 ? (
                    <div className="text-yellow-600 bg-yellow-50 border !border-yellow-500 p-4 rounded-box-sm mt-3">
                        <>
                            <strong className="text-yellow-800">
                                Profile Under Review
                            </strong>
                            <p className="text-sm">
                                Your submitted profile avatar, bio, and social
                                media handles are under administrative review.
                                Should any issues arise, we will notify you via
                                email or you may check the status here.
                            </p>
                            <p className="text-sm mt-2 ">
                                🎉 You're almost done. Your profile is currently
                                under review. Please wait for the review to
                                complete.
                            </p>
                        </>

                        {slinks?.status == 2 ? (
                            <div className="mt-3">
                                <span className="text-red-500 text-sm font-bold">
                                    Social Media Handle Update Request
                                </span>
                                <p className="text-red-500 text-sm">
                                    Rejected due to{" "}
                                    {slinks?.reason ? slinks?.reason : ""}
                                </p>
                                <p className="text-red-500 text-sm">
                                    Please update your social media handles and
                                    resubmit.
                                </p>
                            </div>
                        ) : null}

                        {IsloggedIn &&
                        user?.edit_bio_reason &&
                        user?.bio_approved == 2 ? (
                            <div className="mt-3 ">
                                <p className="text-red-500 text-sm font-bold">
                                    {" "}
                                    Bio Edit Request{" "}
                                </p>
                                <p className="text-red-500 text-sm">
                                    Reason : {user?.edit_bio_reason} Please
                                    update your bio as per requested.
                                </p>
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                ) : (
                    ""
                )}

                {/* Step 1: Social Handles */}
                <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box p-4 mt-3">
                    <div className="md:flex items-center justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div
                                className={`check-icon mr-2 pt-1 ${
                                    slinks?.status == 1 ? "checked" : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>

                            <div>
                                <h2 className="text-gray-900 font-bold">
                                    Add Social Handles
                                </h2>

                                <p className="text-gray-500 text-[14px]">
                                    Update at least one social media handle to
                                    help fans connect with you.
                                    {slinks?.status !== 1 && (
                                        <span className="text-pink text-[14px]">
                                            {" "}
                                            It must show an active account older
                                            than 6 months.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto md:ms-[30px]">
                            {isSocialApproved ? (
                                <StatusChip state="done">Approved</StatusChip>
                            ) : isSocialPending ? (
                                <StatusChip state="pending">In review</StatusChip>
                            ) : isSocialRejected ? (
                                <StatusChip state="rejected">Rejected</StatusChip>
                            ) : (
                                <StatusChip state="todo">Required</StatusChip>
                            )}

                            {slinks?.status !== 1 && (
                                <Social
                                    buttontext="Add"
                                    classes="bg-gray-200 my-2 rounded-box-sm px-2 py-2 w-full text-sm"
                                    links={slinks}
                                />
                            )}
                        </div>
                    </div>

                    {/* 🟡 UNDER REVIEW */}
                    {hasAnySocialMedia && slinks?.status == 0 && (
                        <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-box-sm">
                            <p className="text-yellow-600 text-sm">
                                <strong>Verification Pending:</strong> Your
                                social media handle is under review.
                            </p>
                        </div>
                    )}

                    {slinks?.status == 2 && (
                        <div className="mt-3 px-3 py-3 bg-red-50 border border-red-200 rounded-box-sm">
                            <p className="text-red-700 font-semibold text-sm">
                                Social Media Edit Request Rejected
                            </p>
                            {slinks?.reason && (
                                <p className="text-gray-600 text-sm mt-1">
                                    <span className="font-medium text-gray-700">
                                        Reason:
                                    </span>{" "}
                                    {slinks.reason}
                                </p>
                            )}
                            <p className="text-red-500 text-xs mt-2">
                                Please update your social links as per the
                                requested changes.
                            </p>
                        </div>
                    )}
                </div>
                {/* Step 2: Avatar */}
                {avatarStatus == 2 ? (
                    <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div className="check-icon mr-2 pt-1">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-red-600 font-bold">
                                    Avatar Rejected
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Your profile picture was rejected. Please
                                    upload a new one for review.
                                </p>
                            </div>
                        </div>
                        <EditProfile
                            text="Update Avatar"
                            updateProfileSteps={updateProfileSteps}
                            user={user}
                            classes="updatebtn whitespace-nowrap text-pink"
                            global_currency={global_currency}
                        />
                    </div>
                ) : creatorUser?.avatar ? (
                    avatarStatus == 0 ? (
                        <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className={`check-icon mr-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Avatar Approval Pending
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile picture is currently under
                                        review.
                                    </p>
                                </div>
                            </div>
                            <BsStopwatch color="#dd9100" size={"28px"} />
                        </div>
                    ) : (
                        <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className={`check-icon checked mr-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Profile Avatar Approved
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile picture has been approved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div
                                className={`check-icon mr-2 pt-1 ${
                                    avatarStatus == 1 ? "checked" : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-gray-900 font-bold">
                                    Update Profile Picture
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Add a profile picture. This is required.
                                </p>
                            </div>
                        </div>
                        <EditProfile
                            text="Update Avatar"
                            updateProfileSteps={updateProfileSteps}
                            user={user}
                            classes="updatebtn whitespace-nowrap text-pink"
                            global_currency={global_currency}
                        />
                    </div>
                )}

                {/* Step 3: Bio */}
                {creatorUser?.bio ? (
                    bioStatus === 0 ? (
                        /* 🔄 UNDER REVIEW */
                        <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className="check-icon mr-2 pt-1">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Bio Approval Pending
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio is currently under
                                        review.
                                    </p>
                                </div>
                            </div>
                            <BsStopwatch color="#dd9100" size="28px" />
                        </div>
                    ) : bioStatus === 1 ? (
                        /* ✅ APPROVED */
                        <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className="check-icon checked mr-2 pt-1">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Profile Bio Approved
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio has been approved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ❌ REJECTED */
                        <div className="profile-steps  border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className="check-icon mr-2 pt-1">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-red-600 font-bold">
                                        Bio Rejected
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio was rejected. Please
                                        update and resubmit.
                                    </p>
                                </div>
                            </div>
                            <EditProfile
                                text="Edit Bio"
                                updateProfileSteps={updateProfileSteps}
                                user={user}
                                classes="updatebtn whitespace-nowrap text-pink"
                                global_currency={global_currency}
                            />
                        </div>
                    )
                ) : (
                    <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div className="check-icon mr-2 pt-1">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-gray-900 font-bold">
                                    Update Profile Bio
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Add a short bio to complete your profile.
                                </p>
                            </div>
                        </div>
                        <EditProfile
                            text="Update Bio"
                            updateProfileSteps={updateProfileSteps}
                            user={user}
                            classes="updatebtn whitespace-nowrap text-pink"
                            global_currency={global_currency}
                        />
                    </div>
                )}

                {auth?.user?.subscription_status == 0 &&
                auth?.user?.bio &&
                auth?.user?.avatar &&
                auth?.user?.profile_status_lock == 1 ? (
                    <div className="text-green-600 bg-green-50 border !border-green-500 p-4 rounded-box mt-4">
                        <>
                            <strong className="text-green-800">
                                Final Setup : Payment Subscription
                            </strong>
                            <p className="text-sm text-green-600 mt-2">
                                Start 3 days free trial to submit your profile
                                for final verification.
                            </p>
                        </>
                    </div>
                ) : (
                    ""
                )}

                <div className="mt-6 relative mt-4">
                    <h2 className="flex font-bold">
                        <MdOutlinePayment className="mr-2 relative top-[2px]" />
                        Subscription Payment Setup
                    </h2>
                    <p className="text-gray-500 text-[14px]">
                        Set up your subscription payment method to continue
                        using Spennypiggy.
                    </p>
                </div>
                {/* Step 4: Subscription */}
                <div
                    className={
                        "profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between"
                    }
                >
                    <div className="step-title flex max-w-[390px] pr-3">
                        <div
                            className={`check-icon mr-2 pt-1 ${
                                hasSubscription ? "checked" : ""
                            }`}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: checkedItem,
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-gray-900 font-bold">
                                Start 3-Days Free Trial
                            </h2>
                            <p className="text-gray-500 text-[14px]">
                                Unlock full access with a{" "}
                                <strong className="text-black">
                                    Free Trial
                                </strong>{" "}
                                subscription of £8.99 + VAT / month. No charges
                                until the trial period ends.
                            </p>
                        </div>
                    </div>

                    {!hasSubscription ? (
                        <Link
                            className="bg-[#FF007F] my-2 text-center max-w-[130px] rounded-box-sm px-2 py-2 w-full text-sm md:ms-[30px] !text-white"
                            href="/activate-subscription"
                        >
                            Start for Free
                        </Link>
                    ) : (
                        <span className="md:ms-[30px]">
                            <StatusChip state="done">Active</StatusChip>
                        </span>
                    )}
                </div>

                <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-box flex items-center p-4 mt-3 justify-between">
                    <div className="step-title flex max-w-[390px] pr-3">
                        <div
                            className={`check-icon mr-2 pt-1 ${
                                profileStatusLock == 2 ? "checked" : ""
                            }`}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: checkedItem,
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-gray-900 font-bold">
                                Submit Profile For Review
                            </h2>
                            <p className="text-gray-500 text-[14px]">
                                Send your profile to admins for final approval.
                            </p>
                        </div>
                    </div>

                    {profileStatusLock == 2 ? (
                        <StatusChip state="done">Approved</StatusChip>
                    ) : isSubmittedForReview ? (
                        <StatusChip state="pending">Under review</StatusChip>
                    ) : profileRejectReason ? (
                        <StatusChip state="rejected">Rejected</StatusChip>
                    ) : canSubmitForReview ? (
                        <Link
                            className="text-pink font-semibold"
                            href={route("update.profile.lock.status")}
                            method="get"
                        >
                            Submit
                        </Link>
                    ) : (
                        <StatusChip state="todo">Locked</StatusChip>
                    )}
                </div>

                {auth?.user?.profile_status_lock == 2 ? (
                    <div className="text-green-700 bg-green-50 border !border-green-700 p-3 rounded-box-sm mt-3">
                        <strong className="text-green-700">
                            Profile Verification Completed
                        </strong>
                        <p className="mt-1">
                            🎉 Congratulations! Your profile is now verified.
                            You can proceed with final setup.
                        </p>
                    </div>
                ) : (
                    ""
                )}

                {auth?.user?.profile_status_lock == 2 ? (
                    ""
                ) : (
                    <div className="mt-6 relative">
                        <h2 className="flex">
                            <FaLock className="mr-2" /> Final setup requires
                            verification
                        </h2>
                    </div>
                )}
                <div>
                    <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box p-4 mt-3 ">
                        <div className=" flex items-center justify-between ">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div
                                    className={`check-icon mr-2 pt-1 ${
                                        auth?.user?.identity_status == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Identity Verification
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Secure your account and meet compliance
                                        requirements.
                                    </p>
                                </div>
                            </div>
                            
                            <>
                                {auth?.user?.identity_status == 1 ? (
                                    <StatusChip state="done">Verified</StatusChip>
                                ) : auth?.user?.identity_status == 2 ? (
                                    <Link
                                        className={"text-pink"}
                                        href="/stripe/identity-verification"
                                    >
                                        Re-verify
                                    </Link>
                                ) : auth?.user?.profile_status_lock == 2 ? (
                                    hasSubscription ? (
                                        <Link
                                            className={"text-pink"}
                                            href="/stripe/identity-verification"
                                        >
                                            Verify
                                        </Link>
                                    ) : (
                                        <span
                                            className="text-gray-400 flex items-center gap-1 cursor-not-allowed"
                                            title="Active subscription required"
                                        >
                                            Verify <MdInfoOutline size={14} />
                                        </span>
                                    )
                                ) : (
                                    <p className={"text-gray-400"}>Verify</p>
                                )}
                            </>
                        </div>

                        {/* {auth?.user?.identity_admin_status !== 2 && auth?.user?.identity_status == 1 && auth?.user?.identity_admin_status != 1 && (
                            <div className="mt-2 text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
                                ⏳ Your documents has been submitted. Waiting for admin review. Please check again after 1-2 hrs.
                            </div>
                        )} */}

                        {auth?.user?.identity_verification_error && (
                            <div className="mt-3 mb-2 text-red-700 bg-red-100 p-3 rounded-box-sm border border-red-200 text-start">
                                <p className="font-semibold mb-2">
                                    Why are you seeing this error?
                                </p>
                                <p className="text-sm">
                                    Your last attempt to complete identity
                                    verification was unsuccessful. Please review
                                    the details below and try again.
                                </p>
                            </div>
                        )}

                        {auth?.user?.identity_verification_error && (
                            <div className="text-red-700 bg-red-100 p-3 rounded-box-sm border border-red-200 text-red-600 text-start flex flex-col gap-1 capitalize">
                                <p>
                                    Error:{" "}
                                    {error?.code?.replaceAll("_", " ") ||
                                        error?.code ||
                                        "Unknown Error Occurred"}
                                </p>
                                <p>Possible Reason: {error?.reason || "N/A"}</p>
                            </div>
                        )}

                        {/* {auth?.user?.identity_admin_status == 2 && (
                            <div className="mt-2">
                                {auth?.user?.identity_admin_notes && (
                                    <div className="mt-2 p-4 bg-red-100 text-red-800 rounded-[30px]    text-sm">
                                        <h2 className="mb-1 text-normal font-bold">Your Identity Is Rejected By Admin</h2>
                                        <p>Reason : {auth?.user?.identity_admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        )} */}
                    </div>

                    <div className="profile-steps border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]   rounded-box flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div
                                className={`check-icon mr-2 pt-1 ${
                                    auth?.user?.stripe_details_submitted == 1
                                        ? "checked"
                                        : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-gray-900 font-bold">
                                    Connect Stripe Account
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Finish setting up your account to receive
                                    funds. You have more steps to complete your
                                    payment setup.
                                </p>
                            </div>
                        </div>

                        {auth?.user?.stripe_details_submitted == 0 ||
                        auth?.user?.stripe_details_submitted == null ? (
                            <div>
                                {auth?.user?.identity_status == 1 ? (
                                    <Link
                                        className={"text-pink"}
                                        href="/stripe/authorize"
                                    >
                                        Connect
                                    </Link>
                                ) : (
                                    <p className={"text-gray-400"}>Connect</p>
                                )}
                            </div>
                        ) : (
                            ""
                        )}

                        {auth?.user?.stripe_details_submitted == 1 ? (
                            <StatusChip state="done">Connected</StatusChip>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
