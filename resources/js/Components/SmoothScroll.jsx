import { useEffect } from "react";
import Lenis from "lenis";
import { router } from "@inertiajs/react";

/**
 * Global buttery/elastic smooth scroll for the whole site. Mounted once at the
 * app root (persists across Inertia navigations). Native scroll position is
 * preserved, so sticky sections + framer scroll animations keep working.
 *
 * `prevent` makes Lenis ignore wheel/touch inside modals & overlays so they
 * scroll natively and the page behind stays put (Headless UI dialogs render
 * into #headlessui-portal-root; lightbox uses .lightbox-overlay). Add
 * `data-lenis-prevent` to any other custom scrollable overlay.
 *
 * Skipped for prefers-reduced-motion; touch stays native.
 */
export default function SmoothScroll() {
    useEffect(() => {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

        // Per-element overflow decision cache — avoids getComputedStyle on
        // every wheel/touch event (a style flush → scroll jank).
        const scrollCache = new WeakMap();

        const lenis = new Lenis({
            lerp: 0.14,
            wheelMultiplier: 1.25,
            smoothWheel: true,
            touchMultiplier: 2,
            prevent: (node) => {
                if (
                    node.closest(
                        '#headlessui-portal-root, [role="dialog"], [aria-modal="true"], [data-lenis-prevent], .lightbox-overlay, .ReactModalPortal'
                    )
                ) return true;
                // Yield to native scroll for genuine INNER scrollers only —
                // positioned overlays (modals/dropdowns) or bounded panels
                // shorter than the viewport. A tall in-flow element that merely
                // overflows IS the page scroll; yielding there desyncs Lenis and
                // snaps the page up when the gesture stops. Also skip page-level
                // `overflow-x-hidden` wrappers, whose overflow-y computes to
                // `auto` per the CSS spec.
                let el = node;
                while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
                    if (el.hasAttribute("data-lenis-prevent")) return true;
                    let info = scrollCache.get(el);
                    if (info === undefined) {
                        const cs = getComputedStyle(el);
                        const oy = cs.overflowY;
                        const inFlowClip =
                            cs.overflowX === "hidden" &&
                            (cs.position === "static" || cs.position === "relative");
                        info = {
                            scroller: (oy === "auto" || oy === "scroll") && !inFlowClip,
                            positioned: cs.position === "fixed" || cs.position === "absolute",
                        };
                        scrollCache.set(el, info);
                    }
                    if (
                        info.scroller &&
                        el.scrollHeight > el.clientHeight + 1 &&
                        (info.positioned || el.clientHeight < window.innerHeight)
                    ) {
                        return true;
                    }
                    el = el.parentElement;
                }
                return false;
            },
        });
        window.__lenis = lenis;

        let raf = requestAnimationFrame(function loop(t) {
            lenis.raf(t);
            raf = requestAnimationFrame(loop);
        });

        // Lenis owns the scroll position — reset to top on Inertia navigation.
        const off = router.on("navigate", () => lenis.scrollTo(0, { immediate: true }));

        return () => {
            cancelAnimationFrame(raf);
            if (typeof off === "function") off();
            lenis.destroy();
            delete window.__lenis;
        };
    }, []);

    return null;
}
