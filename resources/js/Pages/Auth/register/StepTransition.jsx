import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Step-to-step motion.
 *
 * The form is a stack of screens, and without motion a Continue press just swaps one block of
 * text for another — nothing tells you whether you moved forward, back, or the page reloaded.
 * The slide carries that: forward comes in from the right, Back comes in from the left, so the
 * direction of travel is legible without reading the progress rail.
 *
 * `ease-out-quart`. No bounce: this is navigation, not a toy.
 *
 * ⚠️ Reduced motion is a crossfade, not "no transition at all" — the screen still needs to read
 * as a change. `useReducedMotion()` is the house pattern (DESIGN.md), not a media query here,
 * because the distance also has to collapse to zero, which CSS alone cannot do to a variant.
 */

const EASE_OUT_QUART = [0.25, 1, 0.5, 1];

export default function StepTransition({ stepKey, direction = 1, children }) {
    const reduced = useReducedMotion();
    const distance = reduced ? 0 : 28;

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={stepKey}
                initial={{ opacity: 0, x: direction * distance }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -distance }}
                transition={{
                    duration: reduced ? 0.12 : 0.26,
                    ease: EASE_OUT_QUART,
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * The panel's contents, staggered.
 *
 * Used for lists whose items arrive together — the category chips, the username suggestions.
 * Staggering a real list is legitimate; the tell is applying one identical entrance to every
 * section, so this is offered rather than applied by the shell.
 */
export function Stagger({ children, className = "" }) {
    const reduced = useReducedMotion();

    if (reduced) return <div className={className}>{children}</div>;

    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="shown"
            variants={{
                shown: { transition: { staggerChildren: 0.035 } },
            }}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = "" }) {
    const reduced = useReducedMotion();

    if (reduced) return <div className={className}>{children}</div>;

    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 6 },
                shown: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
        >
            {children}
        </motion.div>
    );
}
