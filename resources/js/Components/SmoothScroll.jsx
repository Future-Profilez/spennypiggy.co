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
                // Any inner vertically-scrollable element scrolls natively
                // (lists, customScrollbar, dropdowns) instead of moving the page.
                let el = node;
                while (el && el !== document.body && el !== document.documentElement) {
                    if (el.nodeType === 1) {
                        const oy = getComputedStyle(el).overflowY;
                        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
                            return true;
                        }
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
