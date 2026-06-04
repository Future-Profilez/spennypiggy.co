import { motion } from "framer-motion";

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
            style={{ willChange: "transform, opacity" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
