import React, { useMemo, useState } from "react";
import PostingWindow from "@/Components/Creator/PostingWindow";
import ActivityStatusBanner from "@/Components/Creator/ActivityStatusBanner";
import CadenceChecklist from "@/Components/Creator/CadenceChecklist";
import { Head, Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";

/* Status → presentation. `error` is a real backend state (validation temporarily
   unavailable) and used to fall through to a bare "Unknown" chip with no explanation. */
const STATUS_BADGES = {
    grace_period: {
        color: "bg-blue-600 text-white",
        text: "Grace period",
        icon: "🆕",
    },
    active: {
        color: "bg-green-600 text-white",
        text: "Payments active",
        icon: "✅",
    },
    insufficient_content: {
        color: "bg-red-600 text-white",
        text: "Payments paused",
        icon: "⚠️",
    },
    not_fully_verified: {
        color: "bg-yellow-500 text-black",
        text: "Verification pending",
        icon: "⏳",
    },
    error: {
        color: "bg-gray-600 text-white",
        text: "Check unavailable",
        icon: "ℹ️",
    },
};

const CADENCE_STYLES = {
    paused: ["bg-red-100 text-red-800 border-red-300", "⛔ Paused"],
    active: ["bg-green-100 text-green-800 border-green-400", "✅ Active"],
    grace: ["bg-blue-100 text-blue-800 border-blue-300", "🆕 Grace period"],
    at_risk: ["bg-yellow-100 text-yellow-900 border-yellow-400", "⚠️ At risk"],
};

const BREAKDOWN_ROWS = [
    ["posts", "📝", "Posts"],
    ["wishes", "🎁", "Wish Items"],
    ["memberships", "💎", "Memberships"],
    ["shops", "🛍️", "Shop Items"],
    ["bills", "🧾", "Subscriptions"],
    ["tasks", "📋", "Paid Tasks"],
];

const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
};

const Card = ({ children, className = "" }) => (
    <div
        className={`bg-white rounded-box border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-5 md:p-6 ${className}`}
    >
        {children}
    </div>
);

const Note = ({ tone, children }) => {
    const tones = {
        red: "bg-red-50 border-red-300 text-red-800",
        green: "bg-green-50 border-green-300 text-green-800",
        yellow: "bg-yellow-50 border-yellow-400 text-yellow-900",
        blue: "bg-blue-50 border-blue-300 text-blue-800",
        gray: "bg-gray-50 border-gray-300 text-gray-700",
    };
    return (
        <div
            className={`border rounded-box-sm p-4 mt-4 text-sm leading-relaxed ${tones[tone] || tones.gray}`}
        >
            {children}
        </div>
    );
};

/**
 * 30-day activity, drawn as a calendar-style heatmap.
 *
 * The old chart was 30 stacked full-width bars inside a scroll box, and the only way to
 * read a day's number was a hover tooltip — which never fires on a touch device, and was
 * styled `text-black` on `bg-gray-900` so it was unreadable even with a mouse.
 */
const ActivityHeatmap = ({ timeline = [] }) => {
    const [selected, setSelected] = useState(null);

    const stats = useMemo(() => {
        const total = timeline.reduce((sum, d) => sum + d.content_count, 0);
        const activeDays = timeline.filter((d) => d.content_count > 0).length;
        const lastWeek = timeline
            .slice(-7)
            .reduce((s, d) => s + d.content_count, 0);
        const prevWeek = timeline
            .slice(-14, -7)
            .reduce((s, d) => s + d.content_count, 0);
        const best = timeline.reduce(
            (a, b) => (a && a.content_count >= b.content_count ? a : b),
            null,
        );

        return {
            total,
            activeDays,
            lastWeek,
            trend: lastWeek - prevWeek,
            best,
        };
    }, [timeline]);

    if (!timeline.length) {
        return (
            <p className="text-sm text-gray-600">No activity recorded yet.</p>
        );
    }

    const today = new Date().toISOString().split("T")[0];
    const max = Math.max(1, ...timeline.map((d) => d.content_count));

    const shade = (count) => {
        if (count === 0) return "bg-gray-100 text-gray-400";
        const ratio = count / max;
        if (ratio > 0.66) return "bg-green-600 text-white";
        if (ratio > 0.33) return "bg-green-400 text-black";
        return "bg-green-200 text-black";
    };

    const label = (d) =>
        new Date(d).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });

    return (
        <div>
            <div className="flex flex-wrap gap-3 text-sm mb-4">
                <span className="bg-gray-100 rounded-box-sm px-3 py-1.5">
                    <strong>{stats.total}</strong> items in 30 days
                </span>
                <span className="bg-gray-100 rounded-box-sm px-3 py-1.5">
                    Active on <strong>{stats.activeDays}</strong> days
                </span>
                <span className="bg-gray-100 rounded-box-sm px-3 py-1.5">
                    This week <strong>{stats.lastWeek}</strong>
                    {stats.trend !== 0 && (
                        <span
                            className={
                                stats.trend > 0
                                    ? "text-green-700 ml-1"
                                    : "text-red-700 ml-1"
                            }
                        >
                            ({stats.trend > 0 ? "+" : ""}
                            {stats.trend})
                        </span>
                    )}
                </span>
            </div>

            {/* Tap, not hover — the detail below updates on touch as well as mouse. */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {timeline.map((day) => {
                    const isToday = day.date === today;
                    const isSelected = selected === day.date;
                    return (
                        <button
                            key={day.date}
                            type="button"
                            onClick={() =>
                                setSelected(isSelected ? null : day.date)
                            }
                            aria-label={`${label(day.date)}: ${day.content_count} item${day.content_count === 1 ? "" : "s"}`}
                            aria-pressed={isSelected}
                            className={`aspect-square rounded-box-sm text-xs font-bold flex items-center justify-center border-2 transition-all
                                ${shade(day.content_count)}
                                ${isToday ? "border-black ring-2 ring-yellow-400" : "border-black/20"}
                                ${isSelected ? "scale-105 ring-2 ring-[#FF007F]" : ""}`}
                        >
                            {day.content_count > 0 ? day.content_count : ""}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 min-h-[24px] text-sm text-gray-700">
                {selected ? (
                    (() => {
                        const day = timeline.find((d) => d.date === selected);
                        return (
                            <span>
                                <strong>{label(selected)}</strong> —{" "}
                                {day.content_count > 0
                                    ? `${day.content_count} item${day.content_count === 1 ? "" : "s"} created`
                                    : "no activity"}
                            </span>
                        );
                    })()
                ) : (
                    <span className="text-gray-500">
                        Tap any day for detail. Darker means more content.
                    </span>
                )}
            </div>

            {stats.best?.content_count > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                    🏆 Busiest day: <strong>{label(stats.best.date)}</strong> (
                    {stats.best.content_count} items)
                </p>
            )}
        </div>
    );
};

const ActivityStatus = ({
    activityStatus,
    postingCadence,
    contentBreakdown,
    blockedPayments,
    activityTimeline,
    suggestions = [],
    user,
}) => {
    const [refreshing, setRefreshing] = useState(false);

    // These all come from the backend now — the page used to hard-code "3" and "28 days"
    // in six places, and read `current_content`, a key most branches never sent.
    const required =
        activityStatus?.required ?? contentBreakdown?.required ?? 3;
    const periodDays =
        activityStatus?.period_days ?? contentBreakdown?.period_days ?? 28;
    const contentCount =
        activityStatus?.current_content ??
        activityStatus?.content_count ??
        contentBreakdown?.total ??
        0;
    const needed =
        activityStatus?.needed ?? Math.max(0, required - contentCount);

    const badge = STATUS_BADGES[activityStatus?.status] || STATUS_BADGES.error;

    // A fan/gifter who lands here directly has no creator activity to show — the page
    // used to render a bare "Check unavailable" chip with no explanation.
    if (activityStatus?.status === "not_creator") {
        return (
            <Authenticated>
                <Head title="Activity Status" />
                <div className="bg-[#A2E4B8] min-h-dvh flex items-center justify-center px-4">
                    <Card className="max-w-md text-center">
                        <p className="text-4xl mb-3">📊</p>
                        <h1 className="font-gulfs uppercase text-2xl">
                            For creators
                        </h1>
                        <p className="text-gray-700 mt-2">
                            Activity status tracks a creator's content and
                            payment eligibility. Your account isn't a creator
                            account, so there's nothing to show here.
                        </p>
                        <Link
                            href="/"
                            className="mt-5 inline-flex items-center justify-center min-h-[44px] px-5 bg-black text-white font-black uppercase text-sm tracking-wide rounded-box-sm"
                        >
                            Back home
                        </Link>
                    </Card>
                </div>
            </Authenticated>
        );
    }

    const refresh = () => {
        setRefreshing(true);
        router.reload({
            only: [
                "activityStatus",
                "contentBreakdown",
                "blockedPayments",
                "activityTimeline",
                "postingCadence",
                "suggestions",
            ],
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <Authenticated>
            <Head title="Activity Status" />

            <div className="bg-[#A2E4B8] min-h-dvh pb-28">
                <div className="container mx-auto px-4 pt-8 pb-8 max-w-5xl">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                        <div>
                            <h1 className="font-gulfs uppercase text-3xl md:text-4xl text-black">
                                Activity Status
                            </h1>
                            <p className="text-black/70 mt-1">
                                Keep posting to keep your payments running
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={refresh}
                            disabled={refreshing}
                            className="min-h-[44px] px-4 bg-white border-[3px] border-black rounded-box-sm font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                        >
                            {refreshing ? "Refreshing…" : "↻ Refresh"}
                        </button>
                    </div>

                    {/* ⚠️ The verdict comes FIRST, in money, and it is the same
                        component the creator's profile shows — one wording for one
                        state. This page used to open with a badge and a heatmap,
                        and creators left it still not knowing whether they were
                        being paid. `showDetailsLink` is off because that link
                        points here. */}
                    {postingCadence && (
                        <ActivityStatusBanner
                            cadence={postingCadence}
                            className="mb-6"
                            showDetailsLink={false}
                        />
                    )}

                    {/* The steps, before any of the reporting below. A creator who
                        does these does not need to read the rest of the page. */}
                    <CadenceChecklist
                        checklist={postingCadence?.checklist ?? []}
                        className="mb-6"
                    />

                    {/* ---- Headline: are payments running, and what closes the gap ---- */}
                    <Card className="mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-gulfs uppercase">
                                Payments
                            </h2>
                            <span
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${badge.color}`}
                            >
                                <span aria-hidden="true">{badge.icon}</span>
                                {badge.text}
                            </span>
                        </div>

                        {/* ⚠️ A window, not a progress bar. The rule is a ROLLING
                            30 days: a post counting today drops out on a known
                            date and the total falls by one, so "3 of 3" is not a
                            finish line. The bar that used to sit here said the
                            opposite, and hid the only date the creator can act on
                            before it bites. */}
                        {/* ⚠️ A SECOND, separate rule — the same divider
                            CreatorActivityWidget carries, for the same reason. The
                            badge above is the purchase-time content gate
                            (CreatorActivityService, 28 days); this window is the
                            posting cadence (PostingCadenceService, 30 days, member
                            posts only). They measure different posts over different
                            periods and can legitimately disagree, so without the
                            heading the card reads as contradicting itself — a green
                            "safe" badge above a window saying 1 / 3. */}
                        <div className="mt-6 border-t border-black/10 pt-4">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-black/50">
                                Separate rule &middot; Content membership posting
                            </p>
                            {/* ⚠️ The cadence payload is nested under
                                `postingCadence` — the controller merges it in
                                under that key. Reading counting_posts from the top
                                level returned undefined and the window rendered
                                "nothing counted yet" for every creator, silently. */}
                            {/* ⚠️ Tone comes from the cadence's OWN status, never
                                from contentCount — that belongs to the other rule,
                                and driving the colour with it painted the window
                                green while it read 1 / 3. */}
                            <PostingWindow
                                posts={
                                    activityStatus?.postingCadence
                                        ?.counting_posts ?? []
                                }
                                required={
                                    activityStatus?.postingCadence?.required ??
                                    required
                                }
                                windowDays={
                                    activityStatus?.postingCadence
                                        ?.window_days ?? periodDays
                                }
                                tone={
                                    {
                                        paused: "paused",
                                        at_risk: "risk",
                                        active: "safe",
                                        grace: "safe",
                                    }[
                                        activityStatus?.postingCadence?.status
                                    ] ?? "risk"
                                }
                            />
                        </div>

                        {activityStatus?.status === "grace_period" && (
                            <Note tone="blue">
                                🎉 You're in your onboarding window —{" "}
                                <strong>
                                    {activityStatus.days_remaining} days
                                </strong>{" "}
                                left. Payments run whatever your activity. After
                                that you need at least {required} approved
                                content items in any {periodDays}-day period.
                            </Note>
                        )}

                        {activityStatus?.status === "active" && (
                            <Note tone="green">
                                ✨ You have{" "}
                                <strong>
                                    {contentCount} approved content items
                                </strong>{" "}
                                in the last {periodDays} days. Payments are
                                running normally.
                            </Note>
                        )}

                        {activityStatus?.status === "insufficient_content" && (
                            <Note tone="red">
                                ⚠️ <strong>Payments are paused.</strong> Add{" "}
                                <strong>{needed}</strong> more approved content{" "}
                                {needed === 1 ? "item" : "items"} to start
                                receiving payments again — it resumes
                                automatically within a few minutes of approval.
                            </Note>
                        )}

                        {activityStatus?.status === "not_fully_verified" && (
                            <Note tone="yellow">
                                ⏳ Finish identity verification and profile
                                approval to start earning.
                            </Note>
                        )}

                        {activityStatus?.status === "error" && (
                            <Note tone="gray">
                                ℹ️ We couldn't run this check just now, so
                                payments are being allowed through. Try
                                refreshing in a few minutes.
                            </Note>
                        )}
                    </Card>

                    {/* ---- The page used to state the problem and offer nothing to do about it ---- */}
                    {suggestions.length > 0 && (
                        <Card className="mb-6">
                            <h2 className="text-xl font-gulfs uppercase">
                                Quick ways to add content
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Each of these counts towards your {required}
                                -item requirement.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                {suggestions.map((s) => (
                                    <Link
                                        key={s.type}
                                        href={s.action_url}
                                        className="flex items-start gap-3 border-2 border-black rounded-box-sm p-4 min-h-[44px] bg-[#fdfbf7] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                    >
                                        <span
                                            className="text-xl"
                                            aria-hidden="true"
                                        >
                                            {s.icon || "➕"}
                                        </span>
                                        <span>
                                            <span className="block font-bold text-sm uppercase tracking-wide">
                                                {s.title}
                                            </span>
                                            <span className="block text-xs text-gray-600 mt-0.5">
                                                {s.description}
                                            </span>
                                            <span className="block text-xs text-gray-500 mt-1">
                                                ~{s.estimated_time}
                                            </span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* ---- Posting cadence (a separate rule from the payment gate above) ---- */}
                    {postingCadence && (
                        <Card className="mb-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-gulfs uppercase">
                                        Member posting
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        A separate rule: recurring subscribers
                                        must keep receiving content.
                                    </p>
                                </div>
                                {(() => {
                                    const [cls, label] =
                                        CADENCE_STYLES[postingCadence.status] ||
                                        CADENCE_STYLES.at_risk;
                                    return (
                                        <span
                                            className={`whitespace-nowrap text-sm font-bold px-4 py-2 rounded-full border ${cls}`}
                                        >
                                            {label}
                                        </span>
                                    );
                                })()}
                            </div>

                            <p className="mt-4 font-bold">
                                {postingCadence.member_posts}/
                                {postingCadence.required} member posts in the
                                last {postingCadence.window_days} days
                            </p>

                            {/* No subscribers yet → the rule can't pause anything, so don't show
                                an "onboarding window" countdown that implies it might. */}
                            {!postingCadence.paused &&
                            postingCadence.subscriber_count === 0 ? (
                                <Note tone="gray">
                                    You have no recurring subscribers yet. Once
                                    someone subscribes, keep posting{" "}
                                    {postingCadence.required} member posts every{" "}
                                    {postingCadence.window_days} days to keep
                                    their subscription active.
                                </Note>
                            ) : postingCadence.paused ? (
                                <Note tone="red">
                                    ⛔{" "}
                                    <strong>
                                        Your recurring subscriptions are paused
                                    </strong>{" "}
                                    — subscribers are not being charged. Post{" "}
                                    <strong>
                                        {postingCadence.posts_needed}
                                    </strong>{" "}
                                    more{" "}
                                    {postingCadence.posts_needed === 1
                                        ? "post"
                                        : "posts"}{" "}
                                    to Members or Subscribers and they resume
                                    automatically.
                                </Note>
                            ) : postingCadence.status === "at_risk" ? (
                                <Note tone="yellow">
                                    ⚠️ Post{" "}
                                    <strong>
                                        {postingCadence.posts_needed}
                                    </strong>{" "}
                                    more member{" "}
                                    {postingCadence.posts_needed === 1
                                        ? "post"
                                        : "posts"}{" "}
                                    within the {postingCadence.window_days}-day
                                    window, or your subscriptions will pause.
                                </Note>
                            ) : postingCadence.status === "grace" ? (
                                <Note tone="blue">
                                    🆕 You're in your onboarding window —
                                    nothing will pause yet. Aim for{" "}
                                    {postingCadence.required} member posts every{" "}
                                    {postingCadence.window_days} days.
                                </Note>
                            ) : (
                                <Note tone="green">
                                    ✅ You're meeting the requirement. Keep it
                                    at {postingCadence.required} member posts
                                    every {postingCadence.window_days} days.
                                </Note>
                            )}

                            {/* Concrete deadline + who is affected — the old copy said "will pause"
                                but never when, or how many subscribers were at stake. */}
                            {!postingCadence.paused &&
                                postingCadence.pause_at &&
                                postingCadence.subscriber_count > 0 && (
                                    <div className="mt-4 flex items-center gap-3 border-2 border-black rounded-box-sm bg-white px-4 py-3">
                                        <span
                                            className="text-2xl"
                                            aria-hidden="true"
                                        >
                                            ⏳
                                        </span>
                                        <p className="text-sm">
                                            {postingCadence.pause_in_days <= 1
                                                ? "Pauses within 24 hours"
                                                : `Pauses in about ${postingCadence.pause_in_days} days`}{" "}
                                            <span className="text-gray-500">
                                                (
                                                {formatDate(
                                                    postingCadence.pause_at,
                                                )}
                                                )
                                            </span>
                                            <span className="block text-gray-600 mt-0.5">
                                                {
                                                    postingCadence.subscriber_count
                                                }{" "}
                                                paying{" "}
                                                {postingCadence.subscriber_count ===
                                                1
                                                    ? "subscriber"
                                                    : "subscribers"}{" "}
                                                affected
                                            </span>
                                        </p>
                                    </div>
                                )}

                            {postingCadence.paused &&
                                postingCadence.subscriber_count > 0 && (
                                    <p className="mt-3 text-sm text-red-700">
                                        {postingCadence.subscriber_count} paying{" "}
                                        {postingCadence.subscriber_count === 1
                                            ? "subscriber is"
                                            : "subscribers are"}{" "}
                                        not being charged while paused.
                                    </p>
                                )}

                            {user?.username && (
                                <Link
                                    href={`/${user.username}?page=feed`}
                                    className="mt-4 inline-flex items-center justify-center min-h-[44px] px-5 bg-[#FF007F] text-white font-black uppercase text-sm tracking-wide border-[3px] border-black rounded-box-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                >
                                    Write a member post
                                </Link>
                            )}
                        </Card>
                    )}

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* ---- Breakdown ---- */}
                        <Card>
                            <h3 className="text-lg font-gulfs uppercase mb-4">
                                Content ({periodDays} days)
                            </h3>
                            <div className="space-y-3">
                                {BREAKDOWN_ROWS.map(([key, icon, label]) => (
                                    <div
                                        key={key}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <span className="text-gray-700">
                                            {icon} {label}
                                        </span>
                                        <span className="font-bold">
                                            {contentBreakdown?.[key] ?? 0}
                                        </span>
                                    </div>
                                ))}
                                <hr className="!my-4" />
                                <div className="flex justify-between items-center font-bold">
                                    <span>Total</span>
                                    <span
                                        className={
                                            contentBreakdown?.total >= required
                                                ? "text-green-700"
                                                : "text-red-700"
                                        }
                                    >
                                        {contentBreakdown?.total ?? 0} /{" "}
                                        {required}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* ---- Blocked payments ---- */}
                        <Card>
                            <h3 className="text-lg font-gulfs uppercase mb-4">
                                Payment impact (30 days)
                            </h3>

                            {blockedPayments?.count > 0 ? (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700">
                                            Blocked payments
                                        </span>
                                        <span className="font-bold text-red-700">
                                            {blockedPayments.count}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-3">
                                        <span className="text-gray-700">
                                            Total blocked
                                        </span>
                                        <span className="font-bold text-red-700">
                                            {blockedPayments.currency}{" "}
                                            {
                                                blockedPayments.total_amount_blocked
                                            }
                                        </span>
                                    </div>
                                    {blockedPayments.last_blocked_at_human && (
                                        <div className="flex justify-between items-center text-sm mt-3">
                                            <span className="text-gray-700">
                                                Most recent
                                            </span>
                                            <span className="font-bold">
                                                {
                                                    blockedPayments.last_blocked_at_human
                                                }
                                            </span>
                                        </div>
                                    )}

                                    <Note tone="red">
                                        💡 Once you meet the requirement,
                                        payments resume automatically within a
                                        few minutes.
                                    </Note>

                                    {blockedPayments.recent_attempts?.length >
                                        1 && (
                                        <details className="mt-3">
                                            <summary className="text-sm text-red-700 cursor-pointer min-h-[44px] flex items-center">
                                                View all{" "}
                                                {
                                                    blockedPayments
                                                        .recent_attempts.length
                                                }{" "}
                                                blocked payments
                                            </summary>
                                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                                {blockedPayments.recent_attempts.map(
                                                    (a) => (
                                                        <div
                                                            key={a.id}
                                                            className="text-xs text-gray-600 flex justify-between gap-2 border-b border-gray-100 pb-1.5"
                                                        >
                                                            <span>
                                                                {a.payment_type}{" "}
                                                                • {a.amount}
                                                            </span>
                                                            <span className="whitespace-nowrap">
                                                                {a.blocked_at}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </details>
                                    )}
                                </>
                            ) : (
                                <Note tone="green">
                                    ✅ No payments have been blocked in the last
                                    30 days.
                                </Note>
                            )}
                        </Card>
                    </div>

                    {/* ---- Timeline ---- */}
                    <Card>
                        <h3 className="text-lg font-gulfs uppercase mb-4">
                            Last 30 days
                        </h3>
                        <ActivityHeatmap timeline={activityTimeline} />
                    </Card>
                </div>
            </div>
        </Authenticated>
    );
};

export default ActivityStatus;
