import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ONBOARDING_SLIDES } from "./slides";
import SlideMark from "./SlideMark";
import { shouldShowOnboarding, markOnboardingSeen } from "../../utils/pwaInstall";

/**
 * First-launch onboarding for the installed PWA.
 *
 * Self-gating: renders nothing unless running standalone AND not seen before
 * (see utils/pwaInstall.js). Non-blocking — the app mounts underneath; this just
 * overlays it until the person finishes or skips once.
 *
 * 🚨 IT CONTINUES THE LAUNCH SCREEN, and that is the whole design. The launch
 * screen (`app.blade.php`) is a pink ground with a violet field risen to ~70%;
 * this opens on the same pink with the field at 74% and CLIMBS IT ONE STEP PER
 * SLIDE, ending with the field covering the screen. So the field is the progress
 * indicator — there are no dots — and the handoff from launch art to onboarding
 * to app has no seam. It replaced a black overlay with emoji tiles, three
 * off-palette accents (#8B7CFF / #FF9F45 / #FF5FA2) and a glow `boxShadow`,
 * which read as a different product from the one that had just launched.
 *
 * ⚠️ ALL TYPE IS FULL BLACK. Black measures 5.56:1 on brand pink and 4.76:1 on
 * the violet field — both clear AA, and both fail the moment an opacity is put
 * on them. Hierarchy comes from size, weight and tracking, which costs no
 * contrast. Same rule the toast component follows.
 *
 * Mobile-first: full dvh, safe-area insets, 44px controls, works by tap (swipe
 * is a progressive enhancement). Honours reduced motion.
 */
export default function OnboardingOverlay() {
    // Evaluate the gate once on mount (client-only; SSR-safe helper returns false).
    const [visible, setVisible] = useState(() => shouldShowOnboarding());
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
    const reduceMotion = useReducedMotion();

    const slides = ONBOARDING_SLIDES;
    const isLast = index === slides.length - 1;
    const slide = slides[index];

    const dismiss = useCallback(() => {
        markOnboardingSeen();
        setVisible(false);
    }, []);

    const goTo = useCallback(
        (next) => {
            if (next < 0 || next >= slides.length) return;
            setDirection(next > index ? 1 : -1);
            setIndex(next);
        },
        [index, slides.length]
    );

    const handleNext = useCallback(() => {
        if (isLast) {
            dismiss();
        } else {
            goTo(index + 1);
        }
    }, [isLast, dismiss, goTo, index]);

    const variants = useMemo(
        () => ({
            enter: (dir) => ({ y: reduceMotion ? 0 : dir * 18, opacity: 0 }),
            center: { y: 0, opacity: 1 },
            exit: (dir) => ({ y: reduceMotion ? 0 : dir * -18, opacity: 0 }),
        }),
        [reduceMotion]
    );

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[99999999] flex flex-col overflow-hidden bg-[#FF007F] text-black"
            style={{
                // fixed inset-0 already fills the viewport; a min-height of 100dvh
                // on top of that overflowed on iOS PWA and hid the Next button
                height: "100dvh",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Spenny Piggy"
        >
            {/* The launch screen's own mint circle, carried over so the first slide
                opens on the frame the launch art closed on. It is the only piece of
                decoration here; the rising field is doing the work.

                ⚠️ Declared BEFORE the field. Both are absolutely positioned with no
                z-index, so paint order is DOM order — declared after, the mint circle
                would sit on top of the field and the last slide would show a mint
                disc floating on violet instead of the field having covered it. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full border-[3px] border-[#000] bg-[#05EFB8]"
                style={{
                    width: "60vw",
                    height: "60vw",
                    left: "calc(2% - 30vw)",
                    top: "calc(4% - 30vw)",
                }}
            />

            {/* The field. One very large circle, so only its top arc is on screen —
                the same shape the launch images carry, and the reason the two
                surfaces read as one. `top` is what animates; it is the progress.

                🚨 NO BLACK OUTLINE, unlike the same arc on the launch screen. Here
                it travels THROUGH the copy, and a 3px black rule crossing a
                headline or a paragraph reads as a rendering fault. The pink/violet
                boundary is its own hard edge, and black type clears AA on both
                sides (5.56:1 and 4.76:1), so nothing is lost but the line. */}
            <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 rounded-full bg-[#8C52FF]"
                style={{ width: "280vw", height: "280vw", marginLeft: "-140vw" }}
                initial={false}
                animate={{ top: `${slide.field}%` }}
                transition={
                    reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 120, damping: 22 }
                }
            />

            {/* Utility row: which step, and the way out. */}
            <div
                className="relative z-10 flex items-center justify-between px-6"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}
            >
                <p className="font-gulfs text-[11px] uppercase tracking-[0.22em]">
                    {index + 1} / {slides.length} · {slide.step}
                </p>

                {!isLast && (
                    <button
                        type="button"
                        onClick={dismiss}
                        className="-mr-2 min-h-[44px] px-2 font-gulfs text-[11px] uppercase tracking-[0.22em] underline underline-offset-4 transition-opacity duration-200 active:opacity-60"
                    >
                        Skip
                    </button>
                )}
            </div>

            {/* Slide body (swipeable) */}
            <div className="relative z-10 flex-1 overflow-hidden">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={slide.key}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: reduceMotion ? 0 : 0.26, ease: "easeOut" }}
                        drag={reduceMotion ? false : "x"}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (info.offset.x < -60) handleNext();
                            else if (info.offset.x > 60) goTo(index - 1);
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
                    >
                        <SlideMark name={slide.mark} className="mb-9 h-[132px] w-[132px]" />

                        {/* ⚠️ `leading-[0.9]` as a RATIO. Numeric line-heights are
                            remapped to PIXELS by this project's Tailwind config, so
                            `leading-9` on 34px display type is text drawn on top of
                            itself. */}
                        <h2 className="mb-4 font-gulfs text-[34px] uppercase leading-[0.9] tracking-[0.01em]">
                            {slide.title.map((line) => (
                                <span key={line} className="block">
                                    {line}
                                </span>
                            ))}
                        </h2>

                        <p className="max-w-[19rem] text-[15px] leading-[1.55]">
                            {slide.body}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom actions — shrink-0 so a tall slide can never push these
                off-screen, and mt-auto keeps them pinned to the bottom edge. They
                always sit ON the violet field, which is why mint reads as loudly as
                it does and why it is spent on nothing else. */}
            <div
                className="relative z-10 mt-auto shrink-0 px-6 pt-2"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
            >
                <button
                    type="button"
                    onClick={handleNext}
                    className="flex min-h-[54px] w-full items-center justify-center rounded-box-sm border-[3px] border-[#000] bg-[#05EFB8] font-gulfs text-[15px] uppercase tracking-[0.14em] text-black transition-[filter,transform] duration-200 hover:brightness-110 active:translate-y-[2px] active:brightness-95"
                >
                    {isLast ? "Start browsing" : "Next"}
                </button>

                <button
                    type="button"
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0}
                    className="mt-1 min-h-[44px] w-full font-gulfs text-[11px] uppercase tracking-[0.22em] transition-opacity duration-200 active:opacity-60 disabled:opacity-0"
                >
                    Back
                </button>
            </div>
        </div>
    );
}
