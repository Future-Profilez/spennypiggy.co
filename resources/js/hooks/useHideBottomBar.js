import { useEffect } from "react";

/**
 * Hide the phone's bottom tab bar while a panel is open.
 *
 * 🚨 THE BAR IS `position: fixed; z-index: 999999` AND NOTHING BELOW THAT
 * NUMBER CAN OUTDRAW IT. Every modal, sheet and viewer in this app that sits at
 * `z-50`… `z-[10000]` is UNDER the bar on a signed-in phone, and the thing at
 * the foot of a panel is nearly always its button — found live on the
 * creator-plan page, the bio preview, a help sheet and the Purchase Hub in one
 * day. Raising z-indexes is an arms race that ends with the bar covered by
 * things it should not be; hiding it while a panel owns the screen is the one
 * answer to "who hides the nav", and it is the mechanism `Sheet` and `Popup`
 * already use (`body.sheet-open` → `app.css` hides `.retro-bottom-bar` below
 * 768px and drops the page's bar clearance with it).
 *
 * ⚠️ Nested panels share one body class: an inner one closing un-hides the bar
 * while the outer is still open. Rare, and the same caveat Popup carries.
 * ⚠️ This does NOT lock scroll — callers that need that already do it.
 *
 * `scripts/checks/check-bottom-bar.mjs` fails the build on a pinned element
 * with no device; an element guarded by this hook carries a
 * `bottom-bar-safe:` note naming it.
 */
export default function useHideBottomBar(active) {
    useEffect(() => {
        if (!active) return undefined;
        document.body.classList.add("sheet-open");

        return () => document.body.classList.remove("sheet-open");
    }, [active]);
}
