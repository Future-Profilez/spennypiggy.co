import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Animates grid/list items with staggered fade-in on scroll.
 *
 * Props:
 *  - index      (number)  – item position in the list (0-based)
 *  - stagger    (number)  – delay between each item in seconds (default 0.1)
 *  - duration   (number)  – animation duration (default 0.5)
 *  - x          (number)  – initial X offset (default 0)
 *  - y          (number)  – initial Y offset (default 30)
 *  - scale      (number)  – initial scale (default 0.95)
 *  - rotate     (number)  – initial rotation in degrees (default 0)
 *  - className  (string)  – optional extra classes
 *  - children   (node)
 */
export default function StaggerItem({
    children,
    index = 0,
    stagger = 0.1,
    duration = 0.5,
    x = 0,
    y = 30,
    scale = 0.95,
    rotate = 0,
    className = "",
}) {
    /**
     * 🚨 This was ungated. It is the most-used motion wrapper on the homepage —
     * dozens of instances across 10+ sections — and it animated opacity, x, y,
     * scale AND rotate regardless of `prefers-reduced-motion`, in direct breach
     * of the project rule that framer-motion is always gated. The global CSS
     * reduce block cannot reach it either: framer-motion writes inline styles.
     *
     * Reduced motion still gets the state change (the item appears) — it just
     * arrives without travel, rotation or scale. A `0.01ms`-style kill that
     * destroys the reveal entirely is not the alternative wanted here.
     */
    const reduce = useReducedMotion();
    const [done, setDone] = useState(false);

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x, y, scale, rotate }}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
                duration,
                delay: index * stagger,
                ease: [0.22, 1, 0.36, 1],
            }}
            /**
             * ⚠️ `willChange` is set ONLY while the reveal is running, then
             * released. It used to be a static style prop, so every one of these
             * wrappers held a compositor layer for the entire life of the page —
             * `will-change` is a targeted hint for a known-imminent animation,
             * not a baseline, and left on at rest it is pure memory cost.
             */
            style={done ? undefined : { willChange: "transform, opacity" }}
            onAnimationComplete={() => setDone(true)}
            className={className}
        >
            {children}
        </motion.div>
    );
}
