import { CARD_FRAME, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Verified badge — THE PROFILE ROW, BEFORE AND AFTER.
 *
 * ⚠️ A rosette drawn at size showed the MARK; it never showed what the mark does. What a
 * creator actually buys with an ID check is the row a supporter reads before deciding to
 * pay, so the card draws that row twice: theirs today, and theirs with the tick.
 *
 * ⚠️ NO EYEBROW. "Verification" above "Get verified" is a kicker restating its own
 * heading — the heading carries it.
 */
export default function VerifiedCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    const Row = ({ verified }) => (
        <div
            className="flex items-center gap-2 rounded-box-sm px-2.5 py-2"
            style={{
                border: "2px solid #000",
                backgroundColor: verified ? "#FFFFFF" : "rgba(255,255,255,0.35)",
            }}
        >
            <span
                className="h-7 w-7 shrink-0 rounded-full md:h-8 md:w-8"
                style={{ border: "2px solid #000", backgroundColor: verified ? accent : "rgba(0,0,0,0.12)" }}
            />
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                    <span className="truncate font-CeraGR text-[11px] font-bold text-black md:text-[12px]">
                        Your name
                    </span>
                    {verified && (
                        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
                            <path
                                d="M8 1l1.6 1.4 2.1-.3.7 2 1.9 1-1 1.9 1 1.9-1.9 1-.7 2-2.1-.3L8 15l-1.6-1.4-2.1.3-.7-2-1.9-1 1-1.9-1-1.9 1.9-1 .7-2 2.1.3z"
                                fill={accent}
                                stroke="#000"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                            />
                            <path d="M5.6 8.1l1.6 1.6 3.2-3.4" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </span>
                <span className="block truncate font-CeraGR text-[9px] text-black/60 md:text-[10px]">
                    @yourname
                </span>
            </span>
        </div>
    );

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <div className="pointer-events-none absolute right-4 top-1/2 hidden w-[168px] -translate-y-1/2 space-y-2 sm:block md:right-7 md:w-[196px]" aria-hidden="true">
                <Row verified={false} />
                <Row verified />
            </div>

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[56%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <h3 className={`${display("text-[27px] sm:text-[31px] md:text-[40px]")} max-w-[11ch]`} style={{ color: g.ink }}>
                    Get the tick
                </h3>

                <p className="mt-2.5 max-w-[32ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    One ID check puts it on your profile and on everything you sell.
                    Supporters buy more readily from an account the platform has checked.
                </p>

                {/* On a phone the two rows are dropped, so the steps carry the card. */}
                <ol className="mt-3 flex flex-wrap items-center gap-1.5 sm:hidden" aria-hidden="true">
                    {["Upload ID", "We check it", "Tick appears"].map((step, i) => (
                        <li
                            key={step}
                            className="flex items-center gap-1.5 rounded-box-xs px-2 py-0.5 font-CeraGR text-[8px] uppercase tracking-[0.08em]"
                            style={{ border: "2px solid #000", color: g.ink }}
                        >
                            <span className="font-gulfs text-[10px]" style={{ color: accent }}>{i + 1}</span>
                            {step}
                        </li>
                    ))}
                </ol>

                <div className="mt-auto pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
