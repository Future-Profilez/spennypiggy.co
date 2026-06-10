import { useRef } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useReducedMotion,
} from "framer-motion";

/**
 * Magnetic hover wrapper — the child is gently pulled toward the cursor
 * and springs back on leave. Wrap CTAs/buttons.
 *
 * Props:
 *  - strength  (number) – pull factor 0..1 (default 0.35)
 *  - className (string)
 *  - children  (node)
 */
export default function Magnetic({ children, strength = 0.35, className = "" }) {
    const ref = useRef(null);
    const reduce = useReducedMotion();

    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const x = useSpring(mx, { stiffness: 200, damping: 18, mass: 0.4 });
    const y = useSpring(my, { stiffness: 200, damping: 18, mass: 0.4 });

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    const onPointerMove = (e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * strength);
        my.set((e.clientY - (r.top + r.height / 2)) * strength);
    };

    const onPointerLeave = (e) => {
        if (e.pointerType !== "mouse") return;
        mx.set(0);
        my.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={{ x, y, willChange: "transform" }}
            className={`inline-block ${className}`}
        >
            {children}
        </motion.div>
    );
}
