import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Fixed page-top scroll progress bar.
 *
 * ⚠️ NO PINK. The header is a solid #FF007F bar, so a pink progress line drawn
 * across it is pink on pink — the first half of the gradient was invisible and
 * the bar only appeared to start once it had already crossed a third of the
 * page. It runs yellow → mint → violet now: three colours that all read against
 * the header, and none of them is the header's own.
 *
 * ⚠️ It also sits ABOVE the header (z-110 against the header's z-100). Both are
 * `fixed top-0`, and the header is ~76px tall, so at z-80 this was painted
 * behind it and never visible at any scroll position.
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
            className="fixed top-0 left-0 right-0 h-[4px] z-[110] origin-left pointer-events-none"
            style={{
                scaleX,
                background:
                    "linear-gradient(90deg, #E6EA7B 0%, #05EFB8 52%, #A97BFF 100%)",
            }}
        />
    );
}
