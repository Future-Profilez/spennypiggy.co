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
 * Scroll-linked parallax drift. Children translate vertically as the
 * element moves through the viewport.
 *
 * Props:
 *  - speed     (number) – total px drift across the viewport (default 60).
 *                         Positive = drifts up as you scroll down.
 *  - className (string)
 *  - children  (node)
 */
export default function Parallax({ children, speed = 60, className = "" }) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const isMobile = useIsMobile();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // big vertical drifts overlap neighbouring content on small screens
    const effectiveSpeed = isMobile ? speed * 0.35 : speed;
    const raw = useTransform(scrollYProgress, [0, 1], [effectiveSpeed, -effectiveSpeed]);
    const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.5 });

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            style={{ y, willChange: "transform" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
