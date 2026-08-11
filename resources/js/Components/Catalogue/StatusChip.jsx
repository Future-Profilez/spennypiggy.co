import React from "react";

/**
 * One status vocabulary for six modules.
 *
 * The tone comes from the server (`status_tone`), so the wish screen, the shop screen
 * and this one cannot end up painting the same state three different colours — which is
 * the drift that made "is this live?" a six-page question in the first place.
 *
 * An unrecognised tone renders neutral rather than nothing: a state nobody told this
 * component about is still a state the creator needs to see.
 */
const TONES = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function StatusChip({ label, tone = "neutral", className = "" }) {
    if (!label) return null;

    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-box-sm border px-2.5 py-1 text-[12px] font-semibold ${
                TONES[tone] || TONES.neutral
            } ${className}`}
        >
            {label}
        </span>
    );
}
