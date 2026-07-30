import React, { useState, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { Bell, BellRing, Check } from "lucide-react";
import Turnstile from "./Turnstile";

/**
 * "Tell me when it's back" for a sold-out shop item.
 *
 * A sold-out card is otherwise a dead end — the buy button is disabled and every
 * visitor after the last sale simply leaves. This is the only thing on that card
 * they can still act on.
 *
 * Guests can join with just an email: making someone create an account on a sold-out
 * page throws away the demand this exists to capture. The email box only appears once
 * they have shown intent by clicking, so the card stays clean.
 *
 * Usage: <WaitlistButton shopUuid={item.uuid} initialWaiting={item.is_waiting} isGuest={!auth?.user} />
 */
export default function WaitlistButton({
    shopUuid,
    initialWaiting = false,
    isGuest = false,
    className = "",
}) {
    const { turnstileSiteKey } = usePage().props;
    const [waiting, setWaiting] = useState(!!initialWaiting);
    const [busy, setBusy] = useState(false);
    const [askEmail, setAskEmail] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const turnstileRef = useRef(null);

    const stop = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
    };

    const join = (e) => {
        stop(e);

        // Re-entrancy guard: the disabled re-render alone loses a double-tap race.
        if (busy || !window.axios || !shopUuid) return;

        // A guest has nowhere to send the notice until they type an address.
        if (isGuest && !email) {
            setAskEmail(true);
            return;
        }

        // If turnstile is loaded and required, make sure we have a token
        if (isGuest && turnstileSiteKey && !turnstileToken) {
            setMessage("Please verify you are not a robot.");
            return;
        }

        setBusy(true);
        setMessage("");

        window.axios
            .post("/waitlist/join", { 
                shop_uuid: shopUuid, 
                email: email || undefined,
                cf_turnstile_response: turnstileToken || undefined
            })
            .then((r) => {
                setWaiting(!!r.data?.waiting);
                setAskEmail(false);
                setMessage(r.data?.msg || "");
                setTurnstileToken("");
            })
            .catch((err) => {
                // Surface the refusal. A silent failure here is indistinguishable
                // from a broken button.
                setMessage(
                    err?.response?.data?.msg ||
                        "Could not add you to the list. Please try again.",
                );
                turnstileRef.current?.reset();
                setTurnstileToken("");
            })
            .finally(() => setBusy(false));
    };

    const leave = (e) => {
        stop(e);
        if (busy || !window.axios) return;

        setBusy(true);
        window.axios
            // No email in the body on purpose — the endpoint identifies the caller by
            // their session. Accepting an address here would let anyone remove anyone
            // else from a list by guessing it.
            .post("/waitlist/leave", { shop_uuid: shopUuid })
            .then(() => {
                setWaiting(false);
                setMessage("");
            })
            .catch(() => setMessage("Could not update. Please try again."))
            .finally(() => setBusy(false));
    };

    if (waiting) {
        return (
            <div className={className} onClick={stop}>
                {isGuest ? (
                    /* A guest has no session to identify them, so there is nothing to
                       press here — their opt-out is the signed link in the email. */
                    <div className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-box-sm border-2 border-black bg-[#A2E4B8] px-4 py-3 text-sm font-black uppercase text-black">
                        <Check size={16} strokeWidth={3} />
                        On the list
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={leave}
                        disabled={busy}
                        className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-box-sm border-2 border-black bg-[#A2E4B8] px-4 py-3 text-sm font-black uppercase text-black transition-all disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    >
                        <Check size={16} strokeWidth={3} />
                        On the list
                    </button>
                )}
                <p className="mt-1 text-center text-[11px] text-zinc-500">
                    {isGuest
                        ? "We'll email you when it's back."
                        : "We'll tell you when it's back. Tap to stop."}
                </p>
            </div>
        );
    }

    return (
        <div className={className} onClick={stop}>
            {askEmail && (
                <>
                    <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && join(e)}
                        placeholder="your@email.com"
                        aria-label="Email address"
                        className="mb-2 w-full min-h-[44px] rounded-box-sm border-2 border-black px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    />
                    {turnstileSiteKey && (
                        <Turnstile
                            ref={turnstileRef}
                            onVerify={(token) => {
                                setTurnstileToken(token);
                                setMessage("");
                            }}
                            className="mb-2"
                        />
                    )}
                </>
            )}

            <button
                type="button"
                onClick={join}
                disabled={busy || (isGuest && askEmail && turnstileSiteKey && !turnstileToken)}
                className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-box-sm border-2 border-black bg-white px-4 py-3 text-sm font-black uppercase text-black transition-all hover:bg-yellow-300 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
                {busy ? (
                    "Processing…"
                ) : (
                    <>
                        <Bell size={16} strokeWidth={2.6} />
                        Notify me
                    </>
                )}
            </button>

            {message && (
                <p className="mt-1 text-center text-[11px] text-zinc-600">{message}</p>
            )}
        </div>
    );
}

/** Creator-facing chip: how many people are waiting for this item to return. */
export function WaitingCount({ count = 0, className = "" }) {
    if (!count) return null;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full bg-[#FF007F] px-2 py-1 text-[10px] font-black uppercase text-white ${className}`}
            title="People waiting for this to come back in stock"
        >
            <BellRing size={11} strokeWidth={2.6} />
            {count} waiting
        </span>
    );
}
