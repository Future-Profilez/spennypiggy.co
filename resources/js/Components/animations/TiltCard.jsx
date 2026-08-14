import { useRef } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useMotionTemplate,
    useReducedMotion,
} from "framer-motion";

/**
 * 3D mouse-tracking tilt card with a moving light glare.
 *
 * Props:
 *  - max       (number)  – max tilt in degrees (default 10)
 *  - scale     (number)  – ACCEPTED AND IGNORED, see below
 *  - glare     (bool)    – show the moving light reflection (default true)
 *  - className (string)  – must include the card's border-radius if glare is on
 *  - children  (node)
 *
 * ⚠️ The card does NOT grow on hover. Hover-scale is banned across this site by
 * client direction, so the hover state is carried by the tilt and the glare
 * alone. `scale` is kept in the signature purely so the existing call sites that
 * pass it keep working — it is deliberately unused; do not wire it back up.
 */
export default function TiltCard({
    children,
    max = 10,
    scale = 1.02, // eslint-disable-line no-unused-vars -- see note above
    glare = true,
    className = "",
}) {
    const ref = useRef(null);
    const reduce = useReducedMotion();

    // pointer position normalised to 0..1
    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    const sx = useSpring(px, { stiffness: 260, damping: 24 });
    const sy = useSpring(py, { stiffness: 260, damping: 24 });

    const rotateX = useTransform(sy, [0, 1], [max, -max]);
    const rotateY = useTransform(sx, [0, 1], [-max, max]);
    const glareX = useTransform(sx, [0, 1], ["20%", "80%"]);
    const glareY = useTransform(sy, [0, 1], ["20%", "80%"]);
    const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 60%)`;

    if (reduce) {
        return <div className={className}>{children}</div>;
    }

    const onPointerMove = (e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
    };

    const onPointerLeave = (e) => {
        if (e.pointerType !== "mouse") return;
        px.set(0.5);
        py.set(0.5);
    };

    return (
        <motion.div
            ref={ref}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            initial="rest"
            whileHover="hover"
            // Empty variants on purpose: the labels still have to exist so the
            // glare child below inherits `hover`, but the parent itself must not
            // animate a scale.
            variants={{ rest: {}, hover: {} }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                transformPerspective: 900,
                willChange: "transform",
            }}
            className={`relative ${className}`}
        >
            {children}
            {glare && (
                <motion.div
                    aria-hidden
                    variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                    transition={{ duration: 0.3 }}
                    className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
                    style={{ background: glareBg }}
                />
            )}
        </motion.div>
    );
}
