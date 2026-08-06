import React from "react";
import { CalendarClock } from "lucide-react";

/**
 * "Goes live on …" — shown on a creator's own item card.
 *
 * A scheduled listing sits on the creator's own screens looking exactly like a live one,
 * and it is not on sale. Without this the only difference between "selling" and "nobody
 * can buy this yet" is invisible, and the creator finds out when the sales do not arrive.
 *
 * ⚠️ Renders NOTHING unless the date is in the future. `publish_at` stays on the row after
 * a listing goes live, so a past date is just history — labelling a live listing
 * "scheduled" would be the opposite of true.
 *
 * ⚠️ NEVER `leading-<n>` here: this project's tailwind.config maps numeric line-height
 * keys to PIXELS, so `leading-5` is 5px and the text collapses onto itself.
 *
 * Usage: <ScheduledBadge publishAt={item.publish_at} />
 */
export default function ScheduledBadge({ publishAt, className = "" }) {
    if (!publishAt) return null;

    const date = new Date(publishAt);

    if (Number.isNaN(date.getTime()) || date <= new Date()) return null;

    let label;

    try {
        label = date.toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        label = publishAt;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-box-sm border-2 border-black bg-[#E6EA7B] px-2.5 py-1 text-[12px] font-bold text-black ${className}`}
            title="Nobody can see or buy this until then"
        >
            <CalendarClock size={13} /> Goes live {label}
        </span>
    );
}
