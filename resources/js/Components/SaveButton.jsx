import React, { useState } from "react";
import { Heart } from "lucide-react";

/**
 * Drop-in save-for-later toggle. Posts to /saved/toggle (CSRF-aware axios).
 * Usage: <SaveButton productType="wish" itemId={wish.id} initialSaved={wish.is_saved} />
 * productType ∈ wish | shop | membership | bill | piggypot | task.
 */
export default function SaveButton({ productType, itemId, initialSaved = false, label = false, className = "" }) {
    const [saved, setSaved] = useState(!!initialSaved);
    const [busy, setBusy] = useState(false);

    const toggle = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (busy || !window.axios || !itemId) return;
        const next = !saved;
        setSaved(next); // optimistic
        setBusy(true);
        window.axios
            .post("/saved/toggle", { product_type: productType, item_id: itemId })
            .then((r) => setSaved(!!r.data?.saved))
            .catch(() => setSaved(!next))
            .finally(() => setBusy(false));
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={saved}
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
