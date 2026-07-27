import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ONBOARDING_SLIDES } from "./slides";
import { shouldShowOnboarding, markOnboardingSeen } from "../../utils/pwaInstall";

/**
 * First-launch onboarding for the installed PWA.
 *
 * Self-gating: renders nothing unless running standalone AND not seen before
 * (see utils/pwaInstall.js). Non-blocking — the app mounts underneath; this
 * just overlays it until the user finishes or skips once.
 *
 * Mobile-first: full dvh, safe-area insets, 44px controls, works by tap
 * (swipe is a progressive enhancement). Honours reduced-motion.
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
            enter: (dir) => ({ x: reduceMotion ? 0 : dir * 40, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (dir) => ({ x: reduceMotion ? 0 : dir * -40, opacity: 0 }),
        }),
        [reduceMotion]
    );

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[99999999] flex flex-col overflow-hidden bg-black text-white"
            style={{
                // fixed inset-0 already fills the viewport; a min-height of 100dvh
                // on top of that overflowed on iOS PWA and hid the Next button
                height: "100dvh",
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Spenny Piggy"
        >
            {/* Top bar: progress dots + skip */}
            <div className="flex items-center justify-between px-5 pt-4">
                <div className="flex items-center gap-2" aria-hidden="true">
                    {slides.map((s, i) => (
                        <span
                            key={s.key}
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                                width: i === index ? 22 : 8,
                                backgroundColor:
                                    i === index ? slide.accent : "rgba(255,255,255,0.25)",
                            }}
                        />
                    ))}
                </div>

                {!isLast && (
                    <button
                        type="button"
                        onClick={dismiss}
                        className="min-h-[44px] px-3 text-sm font-semibold text-white/70 active:text-white"
                    >
                        Skip
                    </button>
                )}
            </div>

            {/* Slide body (swipeable) */}
            <div className="relative flex-1 overflow-hidden">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={slide.key}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
                        drag={reduceMotion ? false : "x"}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (info.offset.x < -60) handleNext();
                            else if (info.offset.x > 60) goTo(index - 1);
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
                    >
                        <div
                            className="mb-8 flex h-28 w-28 items-center justify-center rounded-box text-6xl"
                            style={{
                                backgroundColor: `${slide.accent}1f`, // ~12% alpha tint
                                boxShadow: `0 0 60px ${slide.accent}33`,
                            }}
                        >
                            <span role="img" aria-hidden="true">
                                {slide.emoji}
                            </span>
                        </div>

                        <h2 className="mb-3 text-2xl font-black leading-tight">
                            {slide.title}
                        </h2>
                        <p className="max-w-sm text-base leading-relaxed text-white/70">
                            {slide.body}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom actions — shrink-0 so a tall slide can never push these off-screen,
                and mt-auto keeps them pinned to the bottom edge */}
            <div className="mt-auto shrink-0 px-6 pb-6 pt-2">
                <button
                    type="button"
                    onClick={handleNext}
                    className="flex min-h-[52px] w-full items-center justify-center rounded-box-sm text-base font-bold text-black transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: slide.accent }}
                >
                    {isLast ? "Get started" : "Next"}
                </button>

                {!isLast && (
                    <button
                        type="button"
                        onClick={() => goTo(index - 1)}
                        disabled={index === 0}
                        className="mt-2 min-h-[44px] w-full text-sm font-semibold text-white/50 disabled:opacity-0"
                    >
                        Back
                    </button>
                )}
            </div>
        </div>
    );
}
