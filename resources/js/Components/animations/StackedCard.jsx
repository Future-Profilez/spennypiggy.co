import { useRef } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useMotionTemplate,
    useReducedMotion,
} from "framer-motion";
import useIsMobile from "./useIsMobile";

/**
 * Wraps a single card so it becomes sticky and scales down / dims as the next
 * card scrolls over it, producing a 3D "stacking cards" effect.
 *
 * The sticky runway only applies on md+ screens — on mobile the cards flow
 * normally (a tall card can't fit a 100vh sticky window).
 *
 * Props:
 *  - index      (number) – zero-based position of this card
 *  - totalCards (number) – total number of stacking cards
 *  - topOffset  (string) – CSS top value while sticky (default "6rem" ≈ top-24)
 *  - className  (string) – extra classes on the runway container
 *  - children   (node)
 */
export default function StackedCard({
    children,
    index,
    totalCards,
    topOffset = "6rem",
    className = "",
}) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const isMobile = useIsMobile();

    // Track how far this card's container has scrolled through the viewport.
    // "start start" = when the top of the element hits the top of the viewport
    // "end start"   = when the bottom of the element hits the top of the viewport
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    // Scale shrinks from 1 → targetScale and the card dims as it gets buried.
    const depth = totalCards - 1 - index;
    const targetScale = 1 - depth * 0.04;
    const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);
    const brightness = useTransform(
        scrollYProgress,
        [0, 1],
        [1, depth > 0 ? 0.55 : 1]
    );
    const filter = useMotionTemplate`brightness(${brightness})`;

    // Mobile: cards flow normally — the scale/dim scrub reads as broken
    // half-finished animation on a small screen
    if (reduce || isMobile) {
        return (
            <div ref={ref} className={className}>
                {children}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={`md:h-[100dvh] ${className}`} // md+: full viewport-height scroll runway
        >
            <motion.div
                style={{
                    scale,
                    filter,
                    top: topOffset,
                    willChange: "transform, filter",
                }}
                className="md:sticky origin-top"
            >
                {children}
            </motion.div>
        </div>
    );
}
