import { useEffect, useRef, useState } from "react";
import { PLATFORM_LABEL, STEPS, detectPlatform } from "@/lib/pwaInstall";
import { CARD_FRAME, Chip, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Install the app — THE PUSH, ON A PHONE.
 *
 * ⚠️ Two earlier versions showed an "SP" app tile beside a row of empty dock squares.
 * That is an ICON, not a REASON: it says the app exists and nothing about why a creator
 * would want it. What installing actually buys them is being told the second they sell,
 * so the card draws that — a lock screen with the notification on it.
 *
 * ⚠️ THIS IS A DRAWING OF A DEVICE AT ABOUT A THIRD OF LIFE SIZE, so it carries its own
 * radii rather than the house `rounded-box` tokens — a 30px corner on a 150px phone is
 * not a phone. Same deliberate exception the landing page's product mocks take (see the
 * root CLAUDE.md note on `home/WishlistPreview.jsx`). Do not "fix" these to tokens.
 *
 * 🚨 THE NOTIFICATION CARRIES NO AMOUNT. A figure invented for a mock is still a figure
 * on a promo card, and this deck already shipped one wrong price that way.
 *
 * ⚠️ The stack is TWO notifications — a dimmed one tucked behind the live one. One
 * notification alone reads as a screenshot; two read as a phone that keeps telling you
 * things, which is the actual offer. The highlight is the accent fill plus the black
 * frame, never a shadow or a scale.
 */
function LockScreen({ accent }) {
    return (
        <div
            aria-hidden="true"
            className="w-full overflow-hidden rounded-t-[28px] border-black md:rounded-t-[34px]"
            style={{ backgroundColor: "#0B0B10", borderBottom: "none" }}
        >
            {/* Status bar. ⚠️ The screen is #0B0B10 rather than pure black precisely so
                the dynamic island reads as a cutout — on a black screen it is invisible,
                which is what made the first attempt look like a plain rectangle. */}
            <div className="relative flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="font-CeraGR text-[8px] text-white md:text-[9px]">9:41</span>
                <span className="absolute left-1/2 top-2 h-[13px] w-10 -translate-x-1/2 rounded-full bg-black md:h-[15px] md:w-12" />
                <span className="flex items-center gap-[3px]">
                    {[4, 6, 8].map((h) => (
                        <span key={h} className="block w-[2px] rounded-sm bg-white" style={{ height: h }} />
                    ))}
                    <span className="ml-[3px] block h-[8px] w-[14px] rounded-[2px] border border-white/70 p-[1px]">
                        <span className="block h-full w-2/3 rounded-[1px] bg-white" />
                    </span>
                </span>
            </div>

            <div className="px-3 pt-2 text-center">
                <p className="font-CeraGR text-[7px] uppercase tracking-[0.18em] text-white/55 md:text-[8px]">
                    Tuesday 12 March
                </p>
                <p className="font-CeraGR text-[30px] font-bold leading-[1] tracking-[-0.02em] text-white md:text-[36px]">9:41</p>
            </div>

            {/* The stack. The dimmed card sits behind and inset, so the live one is what
                the eye lands on — the highlight is the accent fill and the black frame,
                never a shadow or a scale. */}
            <div className="px-2 pt-3">
                <div
                    className="mx-auto w-[90%] rounded-[10px] border border-white/25 px-2 py-1"
                    style={{ backgroundColor: "rgba(255,255,255,0.13)" }}
                >
                    <p className="font-CeraGR text-[6px] uppercase tracking-[0.14em] text-white/70 md:text-[7px]">
                        Spenny Piggy · earlier
                    </p>
                </div>

                <div
                    className="-mt-1 rounded-[12px] border-black px-2 py-2"
                    style={{ backgroundColor: accent }}
                >
                    <div className="flex items-center gap-1.5">
                        <span
                            className="flex h-[16px] w-[16px] items-center justify-center rounded-[5px] font-CeraGR text-[6px] font-bold md:h-[19px] md:w-[19px] md:text-[8px]"
                            style={{ border: "2px solid #000", backgroundColor: "#FFF", color: "#000" }}
                        >
                            SP
                        </span>
                        <span className="font-CeraGR text-[6px] uppercase tracking-[0.14em] text-black md:text-[7px]">
                            Spenny Piggy · now
                        </span>
                    </div>
                    <p className="mt-1 font-CeraGR text-[12px] font-bold leading-[1.15] text-black md:text-[14px]">
                        You made a sale
                    </p>
                    <p className="mt-1 font-CeraGR text-[7px] leading-tight text-black/75 md:text-[8px]">
                        Someone just bought from you
                    </p>
                </div>
            </div>

            {/* Bled. Everything above this line has to stay on the card; this is the
                only part the bottom edge is allowed to eat. */}
            <div className="h-24 md:h-32" />
        </div>
    );
}

export default function InstallAppCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    /*
     * 🚨 TWO DIFFERENT CARDS DEPENDING ON THE BROWSER, and the difference is not
     * cosmetic. Chrome and Edge can install in one tap through `beforeinstallprompt`;
     * iOS Safari cannot, and never will — there is no API, only a menu the reader has
     * to find. Offering "Install the app" on an iPhone is a button that does nothing,
     * so on those browsers the card shows the actual taps instead.
     *
     * ⚠️ The event fires ONCE and often before this card mounts, so the listener is
     * registered on the first render and the event is stashed. If it never arrives the
     * card falls back to steps, which is also the right answer for iOS.
     */
    const [installEvent, setInstallEvent] = useState(null);
    const [showSteps, setShowSteps] = useState(false);
    const platform = useRef(null);
    if (platform.current === null) platform.current = detectPlatform();

    useEffect(() => {
        const capture = (event) => {
            event.preventDefault();
            setInstallEvent(event);
        };

        window.addEventListener("beforeinstallprompt", capture);

        return () => window.removeEventListener("beforeinstallprompt", capture);
    }, []);

    const steps = STEPS[platform.current] ?? STEPS.other;
    const canInstallDirectly = Boolean(installEvent);

    const install = () => {
        if (installEvent) {
            installEvent.prompt();
            setInstallEvent(null);

            return;
        }

        setShowSteps((open) => ! open);
    };

    const ctaPromo = {
        ...promo,
        href: null,
        cta: canInstallDirectly ? promo.cta : showSteps ? "Hide the steps" : "How to install",
    };

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            {/* Bled off the bottom edge so it reads as a device standing on the card,
                not a picture pasted into it. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-7 right-5 hidden w-[150px] sm:block md:right-8 md:w-[176px]"
            >
                <LockScreen accent={accent} />
            </div>

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[60%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <h3 className={`${display("mt-3 text-[22px] sm:text-[29px] md:text-[37px]")} max-w-[13ch]`} style={{ color: g.ink }}>
                    Know the second you sell
                </h3>

                <p className="mt-2 max-w-[30ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    A push the second someone buys — not an email you find hours later.
                </p>

                <div
                    aria-hidden="true"
                    className="mt-3 rounded-box-sm border-black px-2.5 py-2 sm:hidden"
                    style={{ backgroundColor: accent }}
                >
                    <div className="flex items-center gap-1.5">
                        <span
                            className="flex h-4 w-4 items-center justify-center rounded-[5px] font-CeraGR text-[6px] font-bold"
                            style={{ border: "2px solid #000", backgroundColor: "#FFF", color: "#000" }}
                        >
                            SP
                        </span>
                        <span className="font-CeraGR text-[7px] uppercase tracking-[0.14em] text-black">
                            Spenny Piggy · now
                        </span>
                    </div>
                    <p className="mt-1 font-CeraGR text-[13px] font-bold leading-[1.15] text-black">
                        You made a sale
                    </p>
                </div>

                {showSteps ? (
                    <ol className="mt-3 space-y-1.5">
                        <li
                            className="font-CeraGR text-[8px] uppercase tracking-[0.16em] md:text-[9px]"
                            style={{ color: g.body }}
                        >
                            {PLATFORM_LABEL[platform.current] ?? PLATFORM_LABEL.other}
                        </li>
                        {steps.map((step, i) => (
                            <li key={step} className="flex items-start gap-2">
                                <span
                                    className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-box-xs font-gulfs text-[9px] md:h-5 md:w-5 md:text-[10px]"
                                    style={{ border: "2px solid #000", backgroundColor: accent, color: "#000" }}
                                >
                                    {i + 1}
                                </span>
                                <span
                                    className="text-[11px] font-semibold leading-[1.35] md:text-[12px]"
                                    style={{ color: g.body }}
                                >
                                    {step}
                                </span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <ul className="mt-3 hidden space-y-1 sm:block" aria-hidden="true">
                        {["Opens straight to your dashboard", "Works on a bad connection"].map((line) => (
                            <li
                                key={line}
                                className="flex items-center gap-2 font-CeraGR text-[11px] md:text-[12px]"
                                style={{ color: g.body }}
                            >
                                <span className="block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                                {line}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto pt-3">
                    <Cta promo={ctaPromo} g={g} onAction={install} />
                </div>
            </div>
        </article>
    );
}
