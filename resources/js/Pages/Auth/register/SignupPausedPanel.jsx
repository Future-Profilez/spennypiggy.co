import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import Turnstile from "@/Components/Turnstile";
import Field from "./Field";

/**
 * Creator sign-ups are paused — leave an address and we'll say when they reopen.
 *
 * 🚨 This replaces a dead end. When the platform risk state is FREEZE the server
 * refuses a creator registration outright, and until this panel existed the
 * person received one sentence and nothing else: no waitlist, no email captured,
 * no way back. Every one of those was a click paid acquisition had bought.
 *
 * ⚠️ It renders IN PLACE, on the screen they are already on. Sending somebody
 * elsewhere to leave an email is one step more than they will take, and this
 * component exists precisely because we were losing them at this exact moment.
 *
 * ⚠️ The body copy is passed in from the server (`RiskMessages`), never written
 * here — that class is the one definition of every account-state message, and a
 * second copy in JSX is how the wording drifts.
 */
export default function SignupPausedPanel({ message, email: initialEmail = "", role = 1 }) {
    const { turnstileSiteKey } = usePage().props;

    const [email, setEmail] = useState(initialEmail);
    const [state, setState] = useState("idle"); // idle | sending | done | error
    const [error, setError] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const turnstileRef = useRef(null);

    // ⚠️ A `useCallback`-stable ref, never an inline arrow. `Turnstile`'s render
    // effect lists this callback in its deps, so a fresh identity each render
    // removes and re-renders the Cloudflare widget — the documented remount storm.
    const onVerify = useCallback((token) => setCaptchaToken(token || ""), []);

    const submit = async (e) => {
        e.preventDefault();

        // Re-entrancy guard. The disabled re-render loses the double-tap race,
        // which is the house rule on every submit in this app.
        if (state === "sending" || state === "done") return;

        const trimmed = email.trim();
        if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
            setError("Enter an email address we can reach you on.");
            return;
        }

        setState("sending");
        setError("");

        try {
            await axios.post(route("signup.waitlist"), {
                email: trimmed,
                role,
                // 🚨 The server runs `ensureTurnstileVerified`, which REFUSES a
                // request carrying no token whenever a secret is configured. Omit
                // this and every join fails in production while passing locally,
                // where the helper returns early.
                cf_turnstile_response: captchaToken,
            });
            setState("done");
        } catch (err) {
            // ⚠️ Surface the first real message. Passing the whole bag renders
            // "[object Object]", the documented trap on every checkout here.
            const bag = err?.response?.data?.errors;
            setError(
                (bag && Object.values(bag).flat()[0]) ||
                    err?.response?.data?.message ||
                    "Could not save that just now — try again in a moment.",
            );
            setState("error");

            // A Turnstile token is single-use — without a reset the retry posts a
            // spent token and fails again, which reads as the form being broken.
            setCaptchaToken("");
            turnstileRef.current?.reset?.();
        }
    };

    return (
        <div className="rounded-box border-black bg-white p-6 md:p-8">
            <p className="font-gulfs text-[22px] uppercase leading-[1.05] text-black md:text-[26px]">
                Sign-ups are paused
            </p>

            {/* Server-authored copy, rendered verbatim. */}
            <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.55] text-black/70">
                {message}
            </p>

            {state === "done" ? (
                <div
                    className="mt-6 rounded-box-sm border-2 border-black bg-[#05EFB8] p-4"
                    role="status"
                    aria-live="polite"
                >
                    {/* Black on mint: 14.05:1. White would be 1.50:1. */}
                    <p className="text-[15px] font-semibold leading-[1.5] text-black">
                        You&apos;re on the list. We&apos;ll email you the moment sign-ups reopen —
                        nothing else to do.
                    </p>
                </div>
            ) : (
                <form onSubmit={submit} className="mt-6" noValidate>
                    <Field
                        id="waitlist-email"
                        label="Your email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={error}
                        status={error ? "error" : "idle"}
                        autoComplete="email"
                        placeholder="you@example.com"
                    />

                    {turnstileSiteKey && (
                        <div className="mt-4">
                            <Turnstile
                                ref={turnstileRef}
                                onVerify={onVerify}
                                size="normal"
                            />
                        </div>
                    )}

                    {/* ⚠️ Gated on the key EXISTING, so an environment with no
                        Turnstile configured is never hard-blocked. This is the
                        house `(siteKey && !verified)` form used on every checkout;
                        a bare `!captchaToken` blocks all joins wherever Cloudflare
                        is not set up. The comment sits ABOVE the element — inside
                        an attribute list `{/* … *\/}` is an object literal, not a
                        comment, and fails the whole Vite build. */}
                    <button
                        type="submit"
                        disabled={
                            state === "sending" ||
                            (!!turnstileSiteKey && !captchaToken)
                        }
                        className="mt-4 min-h-[48px] w-full rounded-box-sm border-2 border-black bg-[#FF007F] px-6 text-[15px] font-bold uppercase tracking-wide text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-60"
                    >
                        {state === "sending" ? "Processing…" : "Tell me when it opens"}
                    </button>

                    <p className="mt-3 text-[13px] leading-[1.5] text-black/55">
                        One email, only when sign-ups reopen. Nothing else.
                    </p>
                </form>
            )}
        </div>
    );
}
