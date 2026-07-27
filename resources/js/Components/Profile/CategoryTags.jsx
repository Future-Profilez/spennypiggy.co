import { useState } from "react";

const VISIBLE = 6;

/**
 * What the creator makes, as metadata — not as the loudest thing on the card.
 * A creator with seventeen tags used to bury their own bio under a wall of
 * pills, so only the first few show until asked for the rest.
 */
export default function CategoryTags({ value, className = "" }) {
    const [expanded, setExpanded] = useState(false);

    let tags = [];
    try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (Array.isArray(parsed)) tags = parsed.filter(Boolean);
    } catch (e) {
        tags = [];
    }

    if (!tags.length) return null;

    const shown = expanded ? tags : tags.slice(0, VISIBLE);
    const hidden = tags.length - shown.length;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {shown.map((tag, i) => (
                <span
                    key={i}
                    className="rounded-full border border-black/10 bg-[#FF007F]/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#C4006A]"
                >
                    {tag}
                </span>
            ))}
            {hidden > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-500 underline decoration-dotted underline-offset-2 transition-colors hover:text-black"
                >
                    +{hidden} more
                </button>
            )}
            {expanded && tags.length > VISIBLE && (
                <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-500 underline decoration-dotted underline-offset-2 transition-colors hover:text-black"
                >
                    Less
                </button>
            )}
        </div>
    );
}
