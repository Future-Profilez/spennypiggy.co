import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Wraps a single card so it becomes sticky and scales down as the next card
 * scrolls over it, producing a "stacking cards" effect.
 *
 * Props:
 *  - index      (number) – zero-based position of this card
 *  - totalCards  (number) – total number of stacking cards
 *  - topOffset  (string) – CSS top value while sticky (default "6rem" ≈ top-24)
 *  - children   (node)
 */
export default function StackedCard({
    children,
    index,
    totalCards,
    topOffset = "6rem",
}) {
    const ref = useRef(null);

    // Track how far this card's container has scrolled through the viewport.
    // "start start" = when the top of the element hits the top of the viewport
    // "end start"   = when the bottom of the element hits the top of the viewport
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    // Scale shrinks from 1 → targetScale as the card scrolls away.
    const targetScale = 1 - (totalCards - 1 - index) * 0.03;
    const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

    return (
        <div
            ref={ref}
            className="h-[100vh]" // each card gets a full viewport-height scroll runway
            style={{ willChange: "transform" }}
        >
            <motion.div
                style={{
                    scale,
                    top: topOffset,
                    willChange: "transform",
                }}
                className="sticky origin-top"
            >
                {children}
            </motion.div>
        </div>
    );
}
