import { motion } from "framer-motion";

/**
 * Reusable fade-in scroll animation wrapper.
 *
 * Props:
 *  - delay     (number)  – animation delay in seconds (default 0)
 *  - duration  (number)  – animation duration in seconds (default 0.6)
 *  - x         (number)  – initial horizontal offset in px (default 0)
 *  - y         (number)  – initial vertical offset in px (default 40)
 *  - scale     (number)  – initial scale (default 1, use 0.95 for a zoom-in feel)
 *  - className (string)  – optional extra classes
 *  - children  (node)
 */
export default function FadeIn({
    children,
    delay = 0,
    duration = 0.6,
    x = 0,
    y = 40,
    scale = 1,
    className = "",
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x, y, scale }}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1], // custom ease-out for premium feel
            }}
            style={{ willChange: "transform, opacity" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
