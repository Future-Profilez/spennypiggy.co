import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll-triggered 3D flip-up reveal (tilts in from rotateX like a card
 * standing up off the page).
 *
 * Props:
 *  - delay     (number) – seconds (default 0)
 *  - rotate    (number) – initial rotateX in degrees (default 35)
 *  - y         (number) – initial Y offset in px (default 60)
 *  - className (string)
 *  - children  (node)
 */
export default function Reveal3D({
    children,
    delay = 0,
    rotate = 35,
    y = 60,
    className = "",
}) {
    const reduce = useReducedMotion();

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, rotateX: rotate, y, scale: 0.95 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
                duration: 0.9,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            style={{
                transformPerspective: 1000,
                transformOrigin: "center bottom",
                willChange: "transform, opacity",
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
