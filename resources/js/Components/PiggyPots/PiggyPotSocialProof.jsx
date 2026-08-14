import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@inertiajs/react";

/**
 * MySQL-style "Y-m-d H:i:s" is Invalid Date in Safari/iOS, and
 * formatDistanceToNow throws a RangeError on it — which took the whole
 * profile tree down. Parse defensively and render nothing on failure.
 */
const relativeTime = (value) => {
    if (!value) return null;
    const parsed = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return null;
    try {
        return formatDistanceToNow(parsed, { addSuffix: true });
    } catch (e) {
        return null;
    }
};

const initial = (name) => String(name || "A").charAt(0).toUpperCase();

export default function PiggyPotSocialProof({ topSupporters, feed, user }) {
    // Hooks must run before any early return, or the first render where the
    // lists go from empty to populated throws "Rendered more hooks…".
    const [activeTab, setActiveTab] = useState("top");

    const top = topSupporters || [];
    const recent = feed || [];

    if (top.length === 0 && recent.length === 0) return null;

    const activeList = activeTab === "top" ? top : recent;

    // A segmented control, not two competing black buttons — this is a filter,
    // not the section's primary action.
    const tab = (id, label, count) => (
        <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-pressed={activeTab === id}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-1.5 text-[12px] font-black uppercase tracking-wider transition-colors ${
                activeTab === id
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-black"
            }`}
        >
            {label}
            {count > 0 && (
                <span
                    className={
                        activeTab === id ? "text-white/60" : "text-gray-500"
                    }
                >
                    {" "}
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="w-full rounded-box border border-black/10 bg-white p-4 sm:p-5 md:border-2 md:border-black">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-black">
                    Community activity
                </h3>
                <div className="flex items-center gap-1 rounded-full bg-[#F3F4F6] p-1">
                    {tab("top", "Top", top.length)}
                    {tab("feed", "Recent", recent.length)}
                </div>
            </div>

            {activeTab === "top" ? (
                top.length === 0 ? (
                    <p className="py-6 text-center text-[13px] font-semibold text-gray-500">
                        No supporters yet — be the first.
                    </p>
                ) : (
                    <div className="scrollbar-hide -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
                        {top.map((item, idx) => {
                            const username =
                                item.username || item.user?.username || "";
                            const isClickable =
                                Boolean(username) && item.name !== "Anonymous";

                            const content = (
                                <>
                                    <div className="relative">
                                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[#A2E4B8] text-xl font-black text-black">
                                            {item.avatar ? (
                                                <img
                                                    src={item.avatar}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                initial(item.name)
                                            )}
                                        </div>
                                        {/* Rank, small — the ordering is the point, not a medal */}
                                        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-black bg-white px-1 text-[12px] font-black leading-none">
                                            {idx + 1}
                                        </span>
                                    </div>

                                    <div title={item.name} className="mt-2.5 w-full truncate text-center text-[12px] font-black text-black">
                                        {item.name}
                                    </div>

                                    {/* Ranked and labelled by unlocks, never by amount */}
                                    <div className="mt-0.5 text-[12px] font-bold uppercase tracking-wider text-[#FF007F]">
                                        {item.purchases ?? 0}{" "}
                                        {item.purchases === 1
                                            ? "unlock"
                                            : "unlocks"}
                                    </div>

                                    {item.vip && (
                                        <div
                                            title={`${item.vip.level} supporter · engagement score ${item.vip.score}`}
                                            aria-label={`${item.vip.level} supporter`}
                                            className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#FAFAF8] px-2 py-0.5 text-[12px] font-black uppercase tracking-wider"
                                            style={{ color: item.vip.color }}
                                        >
                                            <span aria-hidden="true">
                                                {item.vip.icon}
                                            </span>
                                            {item.vip.level}
                                        </div>
                                    )}
                                </>
                            );

                            const cardClasses = `flex w-[124px] shrink-0 flex-col items-center rounded-box-sm border border-black/10 bg-[#FAFAF8] p-3 transition-all ${
                                isClickable
                                    ? "cursor-pointer hover:-translate-y-0.5 hover:border-black"
                                    : "cursor-default"
                            }`;

                            return isClickable ? (
                                <Link
                                    key={idx}
                                    href={route("user.show", username)}
                                    className={cardClasses}
                                >
                                    {content}
                                </Link>
                            ) : (
                                <div key={idx} className={cardClasses}>
                                    {content}
                                </div>
                            );
                        })}

                        {/* Open seats: the row reads as a board with room on it,
                            not as a list that ran out. */}
                        {Array.from({
                            length: Math.min(3, Math.max(0, 4 - top.length)),
                        }).map((_, i) => (
                            <div
                                key={`seat-${i}`}
                                className="flex w-[124px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-box-sm border border-dashed border-black/15 bg-[#FAFAF8] p-3 text-center"
                            >
                                <span className="text-2xl opacity-40" aria-hidden="true">
                                    🐷
                                </span>
                                <span className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                                    Be the next
                                </span>
                            </div>
                        ))}
                    </div>
                )
            ) : recent.length === 0 ? (
                <p className="py-6 text-center text-[13px] font-semibold text-gray-500">
                    No unlocks yet.
                </p>
            ) : (
                <div className="scrollbar-hide flex max-h-[340px] flex-col divide-y divide-black/5 overflow-y-auto">
                    {recent.map((item, idx) => {
                        const username =
                            item.username || item.user?.username || "";
                        const isClickable =
                            Boolean(username) && item.name !== "Anonymous";

                        const content = (
                            <div className="flex items-start gap-3 py-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[#A2E4B8] text-[13px] font-black">
                                    {item.avatar ? (
                                        <img
                                            src={item.avatar}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initial(item.name)
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold leading-snug text-gray-700">
                                        <span className="font-black text-black">
                                            {item.name}
                                        </span>{" "}
                                        unlocked content
                                        {relativeTime(item.created_at) && (
                                            <span className="text-gray-500">
                                                {" · "}
                                                {relativeTime(item.created_at)}
                                            </span>
                                        )}
                                    </p>

                                    {item.message && (
                                        <p className="mt-1.5 border-l-2 border-[#FF007F]/30 pl-2.5 text-[12px] font-medium italic leading-relaxed text-gray-600">
                                            {item.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );

                        return isClickable ? (
                            <Link
                                key={idx}
                                href={route("user.show", username)}
                                className="block transition-colors hover:bg-[#FAFAF8]"
                            >
                                {content}
                            </Link>
                        ) : (
                            <div key={idx}>{content}</div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
