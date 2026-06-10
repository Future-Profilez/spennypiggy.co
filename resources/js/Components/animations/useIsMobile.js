import { useState, useEffect } from "react";

/**
 * True below the md breakpoint (768px). Used by the motion primitives to
 * swap heavy scroll-scrubbed effects for lighter, settle-in-place ones —
 * on a narrow screen a scrubbed element never reaches its resting position
 * while the user is reading it, so content looks shifted/overlapped.
 */
export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    return isMobile;
}
