import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ExternalLink, Pencil, ImageOff, Copy, CalendarClock } from "lucide-react";
import StatusChip from "./StatusChip";
import ShareButton from "@/Components/ShareButton";
import ItemFunnelLine from "@/Components/ItemFunnelLine";

/**
 * One listing, whatever type it is.
 *
 * Six modules, one row shape — the whole point of the screen is that a Piggy Pot and a
 * shop item can be compared at a glance, which they cannot be while each keeps its own
 * card design.
 *
 * ⚠️ Mobile is a card, not a horizontally-scrolling table. A creator's catalogue is a
 * primary flow, and the PWA rule is that those never live behind a sideways scroll.
 */

const MONEY = "tabular-nums tracking-tight font-bold";
const LABEL = "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const ACTION =
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-box-sm border border-gray-200 px-3 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50";

/** ISO → the `datetime-local` shape, in the viewer's own timezone. */
function toLocalInput(iso) {
    if (!iso) return "";

    try {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, "0");

        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return "";
    }
}

function whenLabel(iso) {
    if (!iso) return null;

    try {
        return new Date(iso).toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return null;
    }
}

function money(amount, currency) {
    if (amount === null || amount === undefined) return null;

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "GBP",
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // An unlisted ISO code is a worse symbol than a real one and a far better
        // outcome than a row that throws.
        return `${currency || ""} ${Number(amount).toFixed(2)}`.trim();
    }
}

export default function ListingRow({ item }) {
    const price = money(item.price, item.currency);

    // ⚠️ Re-entrancy guard, not just a disabled attribute. Each press creates a REAL
    // Stripe product on the creator's connected account, and the disabled re-render
    // loses the double-tap race.
    const [duplicating, setDuplicating] = useState(false);

    // The picker is opened per row rather than always rendered: a datetime input on
    // every card is a form control the width of the cell, on a value nobody edits most
    // days, out-shouting the status beside it.
    const [scheduling, setScheduling] = useState(false);
    const [when, setWhen] = useState(() => toLocalInput(item.publish_at));

    const saveSchedule = (value) => {
        router.post(
            route("catalogue.schedule", { type: item.type, id: item.id }),
            { publish_at: value || null },
            { preserveScroll: true, onFinish: () => setScheduling(false) },
        );
    };

    const duplicate = () => {
        if (duplicating) return;

        setDuplicating(true);

        router.post(
            route("catalogue.duplicate", { type: item.type, id: item.id }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setDuplicating(false),
            },
        );
    };

    return (
        <article className="bg-white border border-gray-200 rounded-box p-4">
            <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-box-sm bg-gray-100 sm:h-20 sm:w-20">
                    {item.thumbnail ? (
                        <img
                            src={item.thumbnail}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageOff size={22} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={LABEL}>{item.type_label}</span>
                        <StatusChip
                            label={item.status_label}
                            tone={item.status_tone}
                        />
                        {item.stock !== null && item.stock !== undefined && (
                            <span className="text-[12px] font-semibold text-gray-500">
                                {item.stock > 0
                                    ? `${item.stock} left`
                                    : "Sold out"}
                            </span>
                        )}
                        {/* "Scheduled" alone is the one status that raises a question it
                            does not answer. The date belongs beside it. */}
                        {item.status === "scheduled" && whenLabel(item.publish_at) && (
                            <span className="text-[12px] font-semibold text-gray-500">
                                {whenLabel(item.publish_at)}
                            </span>
                        )}
                    </div>

                    <h3 className="mt-1 truncate text-[16px] font-bold text-gray-900" title={item.title}>
                        {item.title}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500">
                        {price && (
                            <span className={`${MONEY} text-gray-900`}>
                                {price}
                            </span>
                        )}
                        <span>
                            <span className={`${MONEY} text-gray-900`}>
                                {item.sales}
                            </span>{" "}
                            sold
                        </span>
                        {item.reward_title && (
                            <span className="truncate" title={item.reward_title}>
                                🎁 {item.reward_title}
                            </span>
                        )}
                    </div>

                    {/*
                        The only thing that says WHY an item is stuck. Without it this
                        screen would send a creator back to the six pages it replaces
                        just to read one sentence.
                    */}
                    {item.moderation_reason && (
                        <p className="mt-2 rounded-box-sm border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">
                            {item.moderation_reason}
                        </p>
                    )}
                </div>
            </div>

            {/*
                Views exist for shop items and paid requests only — nothing else on the
                platform has a public page of its own to count. Rendering an empty
                funnel for the other four would read as "nobody looked", which is a
                different and much more alarming finding.
            */}
            {item.funnel && <ItemFunnelLine funnel={item.funnel} className="mt-3" />}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href={item.manage_url} className={ACTION}>
                    <Pencil size={15} /> Manage
                </Link>

                {item.public_url && (
                    <a
                        href={item.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ACTION}
                    >
                        <ExternalLink size={15} /> View
                    </a>
                )}

                {/*
                    Relist something almost identical without retyping the form. The copy
                    goes through the module's own create path, so it is created unapproved
                    and gets its own price — it is a re-submission, not a row copy.
                */}
                <button
                    type="button"
                    onClick={duplicate}
                    disabled={duplicating}
                    className={`${ACTION} disabled:opacity-50`}
                >
                    <Copy size={15} />{" "}
                    {duplicating ? "Duplicating…" : "Duplicate"}
                </button>

                <button
                    type="button"
                    onClick={() => setScheduling((open) => !open)}
                    aria-expanded={scheduling}
                    className={ACTION}
                >
                    <CalendarClock size={15} />{" "}
                    {item.status === "scheduled" ? "Reschedule" : "Schedule"}
                </button>

                {item.share && <ShareButton share={item.share} />}
            </div>
            {scheduling && (
                <div className="mt-3 rounded-box-sm border border-gray-200 bg-gray-50 p-3">
                    <label
                        htmlFor={`schedule-${item.key}`}
                        className={LABEL}
                    >
                        Go on sale at
                    </label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {/*
                            ⚠️ The value is sent as a full ISO instant. A raw
                            `datetime-local` string carries no timezone and would be read
                            against the SERVER's clock — the creator picks 9am and the
                            listing appears at some other hour.
                        */}
                        <input
                            id={`schedule-${item.key}`}
                            type="datetime-local"
                            value={when}
                            onChange={(e) => setWhen(e.target.value)}
                            className="min-h-[44px] rounded-box-sm border border-gray-300 px-3 text-[14px]"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                saveSchedule(
                                    when ? new Date(when).toISOString() : null,
                                )
                            }
                            className="min-h-[44px] rounded-box-sm bg-black px-4 text-[14px] font-semibold text-white"
                        >
                            Save
                        </button>
                        {item.publish_at && (
                            <button
                                type="button"
                                onClick={() => {
                                    setWhen("");
                                    saveSchedule(null);
                                }}
                                className={ACTION}
                            >
                                Publish now
                            </button>
                        )}
                    </div>
                    <p className="mt-2 text-[12px] text-gray-500">
                        Nobody can see or buy this until then. It still needs to pass
                        review first.
                    </p>
                </div>
            )}
        </article>
    );
}
