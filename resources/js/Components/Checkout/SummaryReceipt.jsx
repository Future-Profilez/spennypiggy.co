/**
 * Checkout order summary, styled as the receipt the supporter is about to earn.
 * Shared by every payment page so all checkouts answer the same five questions,
 * in the same order: who you're paying, what it is, what you get, how much, and
 * what happens next.
 *
 * Props:
 *  - image            item thumbnail URL (optional)
 *  - itemTitle        what they're buying ("Content membership")
 *  - itemSub          item name / plan name
 *  - typeBadge        short kind chip ("Membership", "One-off content", "Paid request")
 *  - payingLabel      eyebrow over the creator ("You're supporting" — default)
 *  - creatorName      creator display name
 *  - creatorUsername  creator @handle (links to profile)
 *  - creatorAvatar    creator avatar URL (optional)
 *  - whatYouGet       string[] — benefit lines rendered with a check ("Instant access to the file")
 *  - rows             [{ label, value }] — extra ledger lines (renewal date, delivery window…)
 *  - total            formatted total string (already currency-formatted)
 *  - totalNote        small print under total ("Includes all fees…")
 *  - nextStep         one line on what happens after payment ("Access unlocks instantly")
 *  - renewalNote      recurring pill ("Renews monthly · cancel anytime") or null
 *  - children         pay button + anything below it (turnstile, errors)
 */
export default function SummaryReceipt({
    image = null,
    itemTitle,
    itemSub = null,
    typeBadge = null,
    payingLabel = "You're supporting",
    creatorName = null,
    creatorUsername = null,
    creatorAvatar = null,
    whatYouGet = [],
    rows = [],
    total,
    totalNote = null,
    nextStep = null,
    renewalNote = null,
    children,
}) {
    const avatarSrc = imageSrc(creatorAvatar);
    const itemImageSrc = imageSrc(image);

    return (
        <div className="relative bg-white border-[3px] border-black rounded-box shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#A2E4B8] border-b-[3px] border-black px-5 py-3">
                <p className="font-black uppercase tracking-widest text-[11px]">Order summary</p>
            </div>

            <div className="p-5">
                {/* WHO — the creator the money goes to */}
                {creatorName && (
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b-2 border-dashed border-black/15">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt=""
                                className="w-11 h-11 rounded-full border-[3px] border-black object-cover shrink-0"
                            />
                        ) : (
                            <span className="w-11 h-11 rounded-full border-[3px] border-black bg-[#A2E4B8] flex items-center justify-center font-black text-lg shrink-0">
                                {creatorName.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="font-black uppercase tracking-widest text-[10px] text-black/60 leading-none">
                                {payingLabel}
                            </p>
                            <p className="font-black text-sm truncate mt-1 leading-tight">{creatorName}</p>
                            {creatorUsername && (
                                <a
                                    href={`/${creatorUsername}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] font-bold text-[#FF007F] hover:underline"
                                >
                                    @{creatorUsername}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* WHAT — the item */}
                <div className="flex items-start gap-3">
                    {itemImageSrc && (
                        <img
                            src={itemImageSrc}
                            alt=""
                            className="w-14 h-14 rounded-box-sm border-[3px] border-black object-cover shrink-0"
                        />
                    )}
                    <div className="min-w-0">
                        {typeBadge && (
                            <span className="inline-block bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5">
                                {typeBadge}
                            </span>
                        )}
                        <p className="font-black uppercase tracking-wide text-sm leading-tight">{itemTitle}</p>
                        {itemSub && (
                            <p className="text-[12px] font-bold text-black/60 truncate mt-0.5">{itemSub}</p>
                        )}
                    </div>
                </div>

                {/* WHAT YOU GET — the reason to pay, spelled out */}
                {whatYouGet.length > 0 && (
                    <div className="mt-4 bg-[#F2FBF5] border-2 border-black/10 rounded-box-sm p-4">
                        <p className="font-black uppercase tracking-widest text-[10px] text-black/60 mb-2.5">
                            What you get
                        </p>
                        <ul className="space-y-2">
                            {whatYouGet.filter(Boolean).map((line, i) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] font-bold text-black/80 leading-snug">
                                    <span className="mt-[2px] w-4 h-4 shrink-0 rounded-full bg-[#A2E4B8] border-2 border-black flex items-center justify-center">
                                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                            <path d="M2 6.5L4.5 9L10 3" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

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

            {/* Perforated tear line with ticket notches — the signature */}
            <div className="relative h-0 border-t-[3px] border-dashed border-black/40 mx-5">
                <span className="absolute -left-[32px] -top-[14px] w-6 h-6 bg-white border-[3px] border-black rounded-full" />
                <span className="absolute -right-[32px] -top-[14px] w-6 h-6 bg-white border-[3px] border-black rounded-full" />
            </div>

            <div className="p-5">
                <div className="flex items-end justify-between gap-2">
                    <span className="font-black uppercase tracking-widest text-[11px] text-black/70 pb-1">
                        Total
                    </span>
                    <span className="font-black text-3xl leading-none">{total}</span>
                </div>
                {totalNote && (
                    <p className="text-[10px] font-bold text-black/60 text-right mt-1.5 leading-snug">
                        {totalNote}
                    </p>
                )}

                {nextStep && (
                    <p className="flex items-start gap-1.5 text-[11px] font-bold text-black/70 mt-3 leading-snug">
                        <span aria-hidden="true">→</span>
                        {nextStep}
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
                    ? "bg-gray-200 text-black/60 cursor-not-allowed"
                    : "bg-[#FF007F] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
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

/**
 * Compact "who / what / what-you-get" context card for the checkout surfaces that
 * keep their own total+form layout (shop, task, tip, wish, pot, cart). Drop it in
 * above the form so every checkout, not just bills/memberships, tells the buyer who
 * they're paying and what they'll receive. Additive — no total, no button.
 */
/**
 * Every checkout passed the raw `avatar` column — a bare Uploadcare uuid, not a
 * URL — so each one rendered a broken-image icon. The display URL lives on
 * `avatar_url`, but resolving a uuid here too means a call site that passes the
 * wrong one still shows a picture instead of a broken tile.
 */
function imageSrc(value) {
    const source = String(value || "").trim();

    if (!source) return null;
    if (/^(https?:)?\/\//i.test(source) || source.startsWith("data:")) return source;

    return `https://ucarecdn.com/${source.replace(/^\/+|\/+$/g, "")}/`;
}

export function OrderContextCard({
    image = null,
    typeBadge = null,
    itemTitle,
    itemSub = null,
    payingLabel = "You're supporting",
    creatorName = null,
    creatorUsername = null,
    creatorAvatar = null,
    whatYouGet = [],
    className = "",
}) {
    const avatarSrc = imageSrc(creatorAvatar);
    const itemImageSrc = imageSrc(image);

    return (
        <div className={`bg-white border-[3px] border-black rounded-box shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 ${className}`}>
            {creatorName && (
                <div className="flex items-center gap-3 pb-3 mb-3 border-b-2 border-dashed border-black/15">
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt=""
                            className="w-10 h-10 rounded-full border-[3px] border-black object-cover shrink-0"
                        />
                    ) : (
                        <span className="w-10 h-10 rounded-full border-[3px] border-black bg-[#A2E4B8] flex items-center justify-center font-black shrink-0">
                            {creatorName.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="font-black uppercase tracking-widest text-[10px] text-black/60 leading-none">
                            {payingLabel}
                        </p>
                        <p className="font-black text-sm truncate mt-1 leading-tight">{creatorName}</p>
                        {creatorUsername && (
                            <a
                                href={`/${creatorUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[12px] font-bold text-[#FF007F] hover:underline"
                            >
                                @{creatorUsername}
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-start gap-3">
                {itemImageSrc && (
                    <img
                        src={itemImageSrc}
                        alt=""
                        className="w-12 h-12 rounded-box-sm border-[3px] border-black object-cover shrink-0"
                    />
                )}
                <div className="min-w-0">
                    {typeBadge && (
                        <span className="inline-block bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5">
                            {typeBadge}
                        </span>
                    )}
                    <p className="font-black uppercase tracking-wide text-sm leading-tight">{itemTitle}</p>
                    {itemSub && (
                        <p className="text-[12px] font-bold text-black/60 mt-0.5 line-clamp-2">{itemSub}</p>
                    )}
                </div>
            </div>

            {whatYouGet.filter(Boolean).length > 0 && (
                <div className="mt-3 bg-[#F2FBF5] border-2 border-black/10 rounded-box-sm p-3">
                    <p className="font-black uppercase tracking-widest text-[10px] text-black/60 mb-2">
                        What you get
                    </p>
                    <ul className="space-y-1.5">
                        {whatYouGet.filter(Boolean).map((line, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] font-bold text-black/80 leading-snug">
                                <span className="mt-[2px] w-4 h-4 shrink-0 rounded-full bg-[#A2E4B8] border-2 border-black flex items-center justify-center">
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                        <path d="M2 6.5L4.5 9L10 3" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
