import { useRef } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useReducedMotion,
} from "framer-motion";
import useIsMobile from "./useIsMobile";

/**
 * Scroll-SCRUBBED horizontal motion — the element's X position is tied
 * directly to scroll progress through the viewport, so it keeps moving
 * exactly as much as the user scrolls (and reverses when they scroll back).
 *
 * On mobile (below md) scrubbing is replaced by a short slide-in that
 * COMPLETES and settles at x=0 — a scrubbed element on a narrow screen
 * never reaches its resting spot while the user reads it, leaving content
 * shifted and overlapping. Pass mobile="scrub" for background decorations
 * (watermarks) that can safely keep scrubbing.
 *
 * Props:
 *  - from      (number) – X in px when the element enters the viewport (default -120)
 *  - to        (number) – X in px when the element leaves the viewport (default 60)
 *  - rotate    (number) – optional max rotation in deg, scrubbed alongside X (default 0)
 *  - fade      (bool)   – fade in from the edges of the scrub range (default false)
 *  - as        (string) – HTML tag to render (default "div"; use "span" inside headings)
 *  - mobile    (string) – "settle" (default) or "scrub"
 *  - className (string)
 *  - children  (node)
 */
export default function ScrollX({
    children,
    from = -120,
    to = 60,
    rotate = 0,
    fade = false,
    as = "div",
    mobile = "settle",
    className = "",
}) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const isMobile = useIsMobile();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // mobile scrub keeps moving but over a much smaller range
    const factor = isMobile && mobile === "scrub" ? 0.45 : 1;
    const rawX = useTransform(scrollYProgress, [0, 1], [from * factor, to * factor]);
    const x = useSpring(rawX, { stiffness: 140, damping: 30, mass: 0.4 });
    const rawRotate = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);
    const r = useSpring(rawRotate, { stiffness: 140, damping: 30, mass: 0.4 });
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.18, 0.82, 1],
        fade ? [0, 1, 1, 0] : [1, 1, 1, 1]
    );

    const Tag = as;
    const MotionTag = motion[as] || motion.div;
    const display = as === "span" ? "inline-block" : undefined;

    if (reduce) {
        return (
            <Tag ref={ref} className={className} style={{ display }}>
                {children}
            </Tag>
        );
    }

    // Mobile: one-shot slide-in that finishes and sits at x=0
    if (isMobile && mobile !== "scrub") {
        const startX = Math.max(-44, Math.min(44, from));
        return (
            <MotionTag
                ref={ref}
                initial={{ opacity: 0, x: startX }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ display, willChange: "transform, opacity" }}
                className={className}
            >
                {children}
            </MotionTag>
        );
    }

    return (
        <MotionTag
            ref={ref}
            style={{
                x,
                rotate: r,
                opacity,
                willChange: "transform",
                display,
            }}
            className={className}
        >
            {children}
        </MotionTag>
    );
}
