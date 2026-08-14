import React from "react";
import { EyeOff, Clock } from "lucide-react";

/**
 * The listing's funnel, as an instrument rather than a sentence.
 *
 * It replaced a run-on line ("0 seen → 0 reached checkout → 0 sold") that wrapped
 * mid-arrow, read as body copy, and gave three unrelated-looking numbers equal weight.
 * Three ruled cells, big tabular numbers, tiny labels: the shape of the drop-off is
 * legible at a glance, which is the entire point.
 *
 * The sequence is real — seen, then checkout, then sold — so a left-to-right structure
 * carries actual information here rather than decorating it.
 *
 * ⚠️ THREE view states, not two. An early version collapsed "tracking was not running
 * yet" and "nobody looked" into one grey "no data" message, which hid the exact problem
 * this component exists to show.
 *
 * Owner-only. Usage: <ItemFunnelLine funnel={item.funnel} />
 */
export default function ItemFunnelLine({ funnel, className = "" }) {
    if (!funnel) return null;

    const {
        views,
        viewers,
        started,
        sold,
        window_days: windowDays,
        view_state: viewState,
        view_to_sale: viewToSale,
    } = funnel;

    const measured = viewState === "ok";

    return (
        <div className={className}>
            {/* Hairline dividers on a tinted panel, not a black-bordered box. The card
                already carries a 3px frame; a second heavy box inside it made the funnel
                compete with the price for the eye, and the price is the card's hero. */}
            <div className="grid grid-cols-3 overflow-hidden rounded-box-sm bg-gray-50 ring-1 ring-inset ring-black/10">
                <Cell
                    value={measured ? viewers : null}
                    label="saw it"
                    title={
                        measured
                            ? `${views} page views from ${viewers} ${viewers === 1 ? "person" : "people"} in the last ${windowDays} days`
                            : undefined
                    }
                    fallback={
                        viewState === "none" ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-black uppercase leading-tight text-yellow-700">
                                <EyeOff size={12} strokeWidth={2.6} />
                                No views
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[12px] font-black uppercase leading-tight text-black/60">
                                <Clock size={12} strokeWidth={2.6} />
                                Counting
                            </span>
                        )
                    }
                    tone={viewState === "none" ? "warn" : "plain"}
                />

                <Cell value={started} label="reached checkout" bordered />

                <Cell
                    value={sold}
                    label="sold"
                    bordered
                    tone={sold > 0 ? "good" : "plain"}
                />
            </div>

            {/* One sentence, and only when it says something the numbers do not. The
                three cells above already carry the counts; this names the problem. */}
            <Verdict
                viewState={viewState}
                viewers={viewers}
                started={started}
                sold={sold}
                viewToSale={viewToSale}
                windowDays={windowDays}
            />

            <Sources sources={funnel.sources} />
        </div>
    );
}

/** Human names for the tracked traffic sources. */
const SOURCE_LABELS = {
    creator_share: "your share link",
    creator_invite: "your invite link",
    direct: "direct",
    referral: "other sites",
    x: "X",
    other: "elsewhere",
};

/**
 * Where the people who saw this came from.
 *
 * `item_view_stats` has stored `source` from the start and nothing surfaced it, so a
 * creator could not tell whether the link they shared did anything — which is the exact
 * question the share tagging was added to answer.
 */
function Sources({ sources }) {
    if (!sources?.length) return null;

    return (
        <p className="mt-1 text-[12px] font-bold uppercase tracking-wide text-black/60">
            From{" "}
            {sources.map((s, i) => (
                <span key={s.source}>
                    {i > 0 && ", "}
                    <span className={s.source === "creator_share" ? "text-[#FF007F]" : ""}>
                        {SOURCE_LABELS[s.source] ?? s.source.replace(/_/g, " ")} ({s.viewers})
                    </span>
                </span>
            ))}
        </p>
    );
}

function Cell({ value, label, title, fallback, bordered = false, tone = "plain" }) {
    const bg = tone === "good" ? "bg-[#A2E4B8]" : tone === "warn" ? "bg-yellow-100" : "";

    return (
        <div
            title={title}
            className={`${bordered ? "border-l border-black/10" : ""} ${bg} px-2 py-2 text-center`}
        >
            <div className="flex h-6 items-center justify-center">
                {value === null ? (
                    fallback
                ) : (
                    <span className="font-black text-xl leading-none tabular-nums text-black">
                        {value}
                    </span>
                )}
            </div>
            <div className="mt-1 text-[12px] font-black uppercase leading-tight tracking-wide text-black/60">
                {label}
            </div>
        </div>
    );
}

/**
 * Says which problem the listing has, in the creator's own terms.
 *
 * "Seen but not bought" and "not being seen" need opposite fixes, and a row of numbers
 * alone leaves the creator to work that out. It stays silent when there is nothing
 * useful to say rather than filling the space.
 */
function Verdict({ viewState, viewers, started, sold, viewToSale, windowDays }) {
    if (viewState === "none") {
        return (
            <p className="mt-1.5 text-[12px] font-bold leading-snug text-yellow-800">
                Nobody found this in {windowDays} days. Share the link — it is not being seen.
            </p>
        );
    }

    if (viewState !== "ok") {
        return (
            <p className="mt-1.5 text-[12px] font-bold leading-snug text-black/60">
                View counting has just started. Checkout and sales are already accurate.
            </p>
        );
    }

    // A rate from a handful of views is noise dressed as a signal, so no verdict yet.
    if (viewers < 10) {
        return null;
    }

    if (sold === 0 && started === 0) {
        return (
            <p className="mt-1.5 text-[12px] font-bold leading-snug text-yellow-800">
                {viewers} people looked and none reached checkout — usually the price or the description.
            </p>
        );
    }

    if (sold === 0) {
        return (
            <p className="mt-1.5 text-[12px] font-bold leading-snug text-yellow-800">
                {started} reached checkout and none finished. Worth checking the total they see at payment.
            </p>
        );
    }

    return (
        <p className="mt-1.5 text-[12px] font-bold leading-snug text-black/80">
            <span className="font-black text-black">{viewToSale}%</span> of people who saw this bought it.
        </p>
    );
}
