import { useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";

/*
 * "Get help with this" — opens a help ticket with the Spenny Piggy team and
 * takes the creator straight into the conversation.
 *
 * 🚨 REPLACES EVERY `mailto:support@…` DEAD END (client decision, 7 Sep 2026).
 * A mailto inside the installed app opens nothing, and a mail the back office
 * cannot see is a conversation nobody tracks. The ticket carries the item
 * (`source` / `sourceId`) so the person reading it is looking at the thing the
 * creator is asking about.
 *
 * ⚠️ Literal path, not `route()` — `resources/js/ziggy.js` is a generated
 * snapshot and `route()` THROWS for a name it does not carry until
 * `ziggy:generate` runs. A help button that throws is the dead end again.
 *
 * `code` must be a tier-2 key in config/creator_help.php; the server refuses
 * anything else. Same-code open ticket → the server returns THAT ticket.
 */
export default function GetHelpButton({
    code = "general",
    source = null,
    sourceId = null,
    message = null,
    label = "Get help with this",
    className = "",
    variant = "button",
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const open = async (e) => {
        e?.preventDefault?.();
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            const { data } = await axios.post("/support/help", {
                code,
                source,
                source_id: sourceId,
                message,
            });
            if (data?.redirect) {
                router.visit(data.redirect);
                return;
            }
            setError("Could not open a conversation. Please try again.");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    "Could not open a conversation. Please try again.",
            );
        } finally {
            setBusy(false);
        }
    };

    const base =
        variant === "link"
            ? "text-sm font-semibold underline text-black hover:opacity-70 transition-opacity duration-200 disabled:opacity-60"
            : "inline-flex min-h-[44px] items-center justify-center rounded-box-sm border-black bg-white px-4 text-xs font-black uppercase tracking-widest text-black transition-colors duration-200 hover:bg-[#F4F4F5] disabled:opacity-60";

    return (
        <span className="inline-flex flex-col gap-1">
            <button
                type="button"
                onClick={open}
                disabled={busy}
                className={`${base} ${className}`}
            >
                {busy ? "Opening…" : label}
            </button>
            {error ? (
                <span className="text-xs text-red-700" role="alert">
                    {error}
                </span>
            ) : null}
        </span>
    );
}
