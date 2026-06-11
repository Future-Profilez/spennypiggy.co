import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Fixed page-top scroll progress bar in the brand gradient.
 */
export default function ScrollProgressBar() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 25,
        restDelta: 0.001,
    });

    return (
        <motion.div
            aria-hidden
            className="fixed top-0 left-0 right-0 h-[4px] z-[80] origin-left pointer-events-none"
            style={{
                scaleX,
                background:
                    "linear-gradient(90deg, #FF007F 0%, #E6EA7B 50%, #05EFB8 100%)",
            }}
        />
    );
}
