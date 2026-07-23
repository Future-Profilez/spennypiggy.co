/**
 * Checkout order summary styled as the receipt the supporter is about to earn.
 * Shared by the payment pages (bills, memberships, …) so every checkout reads
 * the same: item on top, one total, one button, one trust line.
 *
 * Props:
 *  - image          item thumbnail URL (optional)
 *  - itemTitle      what they're buying ("Content membership")
 *  - itemSub        item name / plan name
 *  - creatorName    creator display name
 *  - creatorUsername creator @handle (links to profile)
 *  - rows           [{ label, value }] — optional extra lines (renewal date…)
 *  - total          formatted total string (already currency-formatted)
 *  - totalNote      small print under total ("Includes all fees…")
 *  - renewalNote    recurring line ("Renews monthly · cancel anytime") or null
 *  - children       pay button + anything below it (turnstile note, errors)
 */
export default function SummaryReceipt({
    image = null,
    itemTitle,
    itemSub = null,
    creatorName = null,
    creatorUsername = null,
    rows = [],
    total,
    totalNote = null,
    renewalNote = null,
    children,
}) {
    return (
        <div className="relative bg-white border-[3px] border-black rounded-box shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#A2E4B8] border-b-[3px] border-black px-5 py-3 !border-t-0 !border-r-0 !border-l-0">
                <p className="font-black uppercase tracking-widest text-[11px]"> Order summary </p>
            </div>
            <div className="p-5">
                <div className="flex items-start gap-3">
                    {image && (
                        <img
                            src={image}
                            alt=""
                            className="w-14 h-14 rounded-box-sm border-[3px] border-black object-cover shrink-0"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="font-black uppercase tracking-wide text-sm leading-tight">
                            {itemTitle}
                        </p>
                        {itemSub && (
                            <p className="text-[12px] font-bold text-black/60 truncate mt-0.5">
                                {itemSub}
                            </p>
                        )}
                        {creatorName && (
                            <p className="text-[12px] font-bold text-black/60 mt-0.5">
                                by {creatorName}{" "}
                                {creatorUsername && (
                                    <a
                                        href={`/${creatorUsername}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#FF007F] hover:underline"
                                    >
                                        @{creatorUsername}
                                    </a>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {rows.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                        {rows.map((r) => (
                            <div
                                key={r.label}
                                className="flex justify-between text-[12px] font-bold text-black/70"
                            >
                                <span>{r.label}</span>
                                <span>{r.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {renewalNote && (
                    <p className="mt-4 inline-block bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                        {renewalNote}
                    </p>
                )}
            </div>

            {/* Perforated tear line with ticket notches */}
            <div className="relative h-0 border-t-[3px] border-dashed border-black/40 mx-5">
                <span className="absolute -left-[32px] -top-[14px] w-6 h-6 bg-white border-[3px] border-black rounded-full" />
                <span className="absolute -right-[32px] -top-[14px] w-6 h-6 bg-white border-[3px] border-black rounded-full" />
            </div>

            <div className="p-5">
                <div className="flex items-end justify-between gap-2">
                    <span className="font-black uppercase tracking-widest text-[11px] text-black/70 pb-1">
                        Total
                    </span>
                    <span className="font-black text-3xl leading-none">
                        {total}
                    </span>
                </div>
                {totalNote && (
                    <p className="text-[10px] font-bold text-black/60 text-right mt-1.5 leading-snug">
                        {totalNote}
                    </p>
                )}

                <div className="mt-4">{children}</div>

                <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-black/60 mt-3">
                    <svg
                        width="10"
                        height="12"
                        viewBox="0 0 10 12"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M5 0a3 3 0 0 0-3 3v2H1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H8V3a3 3 0 0 0-3-3ZM3.5 3a1.5 1.5 0 1 1 3 0v2h-3V3Z" />
                    </svg>
                    Payments secured by Stripe
                </p>
            </div>
        </div>
    );
}

/**
 * The one pay action for every checkout. Label says exactly what happens.
 */
export function PayButton({ label, processingLabel = "Processing…", processing = false, disabled = false, onClick }) {
    const off = disabled || processing;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={off}
            className={`w-full border-[3px] border-black rounded-box-sm px-4 py-3.5 font-black uppercase tracking-wide text-sm transition-[transform,box-shadow] duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 ${
                off
                    ? "bg-gray-200 text-black/50 cursor-not-allowed"
                    : "bg-[#FF007F] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
            }`}
        >
            {processing ? processingLabel : label}
        </button>
    );
}

/**
 * Section eyebrow for the left-hand details column.
 */
export function SectionLabel({ children }) {
    return (
        <p className="flex items-center gap-2 font-black uppercase tracking-widest text-[11px] text-black/80 mb-3">
            <span className="w-2.5 h-2.5 bg-[#FF007F] border-2 border-black rounded-[3px] inline-block" />
            {children}
        </p>
    );
}
