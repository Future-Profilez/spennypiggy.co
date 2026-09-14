import { useEffect, useRef, useState } from 'react';

/**
 * The viewport WIDTH, as state.
 *
 * 🚨 IT MUST NOT UPDATE ON A HEIGHT-ONLY RESIZE. The on-screen keyboard fires
 * `resize` on every phone the moment a field is focused, and it changes the
 * HEIGHT, never the width. Re-rendering the consumer for that is how the post
 * composer closed itself mid-sentence: `Dashboard` re-rendered, its inline
 * `Toggle` component got a new identity, and React remounted the whole chooser
 * subtree — `showAdd`, `postOpen` and every `Popup`'s own open flag back to
 * false, with nothing wrong in any log.
 *
 * ⚠️ Guarded with a ref rather than a functional `setWidth`: an identical value
 * passed to a setter can still cost one extra render before React bails out,
 * and one render is all it takes to remount a subtree.
 */
export default function useWidthCount(){

    const [width, setWidth] = useState(null);
    const lastRef = useRef(null);

    useEffect(() => {
        const setWid = () => {
            const next = window.innerWidth;
            if (lastRef.current === next) return;
            lastRef.current = next;
            setWidth(next);
        };

        window && window.addEventListener("resize", setWid);
        setWid();

        // ⚠️ The listener was never removed — every Dashboard mount added
        // another one, all of them holding a dead setter.
        return () => window && window.removeEventListener("resize", setWid);
    }, []);

   return width;  
}
