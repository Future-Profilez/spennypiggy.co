import { motion, useReducedMotion } from "framer-motion";

/**
 * Splits text into words and reveals them one-by-one with a 3D flip-up,
 * triggered on scroll into view.
 *
 * Props:
 *  - text          (string) – the text to split & animate
 *  - delay         (number) – delay before the first word (default 0)
 *  - stagger       (number) – delay between words (default 0.06)
 *  - className     (string) – classes for the wrapping span
 *  - wordClassName (string) – classes applied to each word. Required for
 *                             gradient text (bg-clip-text / text-transparent
 *                             must sit on the word itself — it does not render
 *                             through the nested inline-block spans).
 */
export default function WordReveal({
    text,
    delay = 0,
    stagger = 0.06,
    className = "",
    wordClassName = "",
}) {
    const reduce = useReducedMotion();

    if (!text) return null;
    const words = String(text).split(" ");

    if (reduce) {
        return <span className={className}>{text}</span>;
    }

    return (
        <motion.span
            className={`inline-block ${className}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ staggerChildren: stagger, delayChildren: delay }}
            style={{ transformPerspective: 800 }}
        >
            {words.map((word, i) => (
                <span
                    key={i}
                    className={`inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em] ${i < words.length - 1 ? "mr-[0.25em]" : ""}`}
                >
                    <motion.span
                        className={`inline-block ${wordClassName}`}
                        variants={{
                            hidden: { y: "110%", rotateX: -45, opacity: 0 },
                            visible: { y: 0, rotateX: 0, opacity: 1 },
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 24,
                        }}
                        style={{ willChange: "transform" }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </motion.span>
    );
}
