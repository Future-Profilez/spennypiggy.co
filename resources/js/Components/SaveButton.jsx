import React, { useEffect, useReducer, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Heart } from "lucide-react";
import { ensureLoaded, isLoaded, isSaved, setSaved, subscribe } from "@/lib/savedItems";

/**
 * Drop-in save-for-later toggle. Posts to /saved/toggle (CSRF-aware axios).
 * Usage: <SaveButton productType="wish" itemId={wish.id} />
 * productType ∈ wish | shop | membership | bill | piggypot | task.
 *
 * 🚨 SAVED STATE COMES FROM THE STORE, NOT FROM A PROP. This used to read
 * `initialSaved={item.is_saved}` and `is_saved` was set nowhere in the backend, so
 * the heart was empty on every render no matter what the supporter had saved — the
 * row was written and never shown again. `@/lib/savedItems` loads the real map once
 * per page load from `/saved/mine`, the endpoint that was written for exactly this
 * and never called. `initialSaved` is still honoured as a first-paint hint for any
 * caller that genuinely has the flag, but it is no longer the source of truth.
 *
 * ⚠️ RENDERS NOTHING FOR A GUEST. `saved/toggle` is inside the auth group, so a
 * signed-out click was a 401 and a heart that flicked on and back off. Call sites
 * used to each carry their own `!!auth?.user` guard; the guard belongs here so a
 * new mount cannot forget it.
 *
 * ⚠️ AND NOTHING FOR THE ITEM'S OWN CREATOR. Every module card renders on the
 * creator's own management page as well as on a browse surface, so an ungated heart
 * offers a creator the chance to save their own listing. Pass `creatorId` and the
 * check lives here, once, rather than as a condition each of the six call sites has
 * to remember.
 */
export default function SaveButton({ productType, itemId, creatorId = null, initialSaved = false, label = false, className = "" }) {
    const { auth } = usePage().props;
    const signedIn = !!auth?.user;
    const isOwnItem = creatorId != null && Number(auth?.user?.id) === Number(creatorId);

    const [, rerender] = useReducer((x) => x + 1, 0);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!signedIn) {
            return;
        }

        ensureLoaded();

        return subscribe(rerender);
    }, [signedIn]);

    if (!signedIn || !itemId || isOwnItem) {
        return null;
    }

    // Before the map lands, trust the caller's hint if it had one.
    const saved = isLoaded() ? isSaved(productType, itemId) : !!initialSaved;

    const toggle = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (busy || !window.axios) return;

        const next = !saved;
        setSaved(productType, itemId, next); // optimistic
        setBusy(true);
        window.axios
            .post("/saved/toggle", { product_type: productType, item_id: itemId })
            .then((r) => setSaved(productType, itemId, !!r.data?.saved))
            .catch(() => setSaved(productType, itemId, !next))
            .finally(() => setBusy(false));
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={saved}
            aria-label={saved ? "Saved for later" : "Save for later"}
            title={saved ? "Saved for later" : "Save for later"}
            className={`inline-flex items-center gap-1.5 rounded-full font-medium text-xs transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40 backdrop-blur-sm ${
                saved
 ? "bg-[#FF007F] text-black"
 : "bg-white/90 text-zinc-600 border border-zinc-200 hover:text-[#FF007F] "
            } ${label ? "px-3 py-1.5" : "w-9 h-9 justify-center"} ${className}`}
        >
            <Heart size={15} strokeWidth={2.2} fill={saved ? "currentColor" : "none"} />
            {label && (saved ? "Saved" : "Save")}
        </button>
    );
}
