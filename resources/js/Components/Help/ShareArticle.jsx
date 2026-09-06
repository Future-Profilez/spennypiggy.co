import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

/**
 * Hand this answer to somebody else.
 *
 * The commonest thing a person does with a help article is send it to the
 * person who asked them the question — and on a phone that meant selecting the
 * address bar, which in the INSTALLED APP does not exist at all. A PWA in
 * standalone display mode has no URL bar, so before this the link to an answer
 * was genuinely unreachable from inside the app.
 *
 * 🚨 `navigator.share` IS FEATURE-DETECTED IN AN EFFECT, NEVER DURING RENDER.
 * SSR is on for /help, so a `navigator` read while rendering runs on the render
 * host, where it is undefined. Detecting in an effect also means the button
 * renders identically on the server and on the first client paint (the copy
 * form), then upgrades — a label that differs between the two is a hydration
 * mismatch.
 *
 * ⚠️ The share sheet is only offered where it is the BETTER answer: a phone or
 * an installed app. On a desktop browser that supports it, `share()` opens a
 * list of apps nobody has, and "Copy link" is what the person wanted.
 */
export default function ShareArticle({ title, className = "" }) {
    const [state, setState] = useState("idle"); // idle | copied | failed
    const [canShare, setCanShare] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        try {
            const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
            const standalone =
                window.matchMedia?.("(display-mode: standalone)")?.matches ||
                window.navigator?.standalone === true;

            setCanShare(typeof navigator.share === "function" && (coarse || standalone));
        } catch {
            // A blocked matchMedia or navigator read is not worth a broken page:
            // the copy button below works everywhere.
            setCanShare(false);
        }
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    const flash = useCallback((next) => {
        setState(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 2200);
    }, []);

    const copy = useCallback(
        async (url) => {
            try {
                await navigator.clipboard.writeText(url);
                flash("copied");

                return;
            } catch {
                // Clipboard is refused without a secure context or permission.
            }

            // ⚠️ The deprecated path is kept deliberately — it is the ONLY one
            // that works in an insecure context and in several in-app webviews,
            // which is where a shared link most often gets opened.
            try {
                const box = document.createElement("textarea");
                box.value = url;
                box.setAttribute("readonly", "");
                box.style.position = "fixed";
                box.style.opacity = "0";
                document.body.appendChild(box);
                box.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(box);
                flash(ok ? "copied" : "failed");
            } catch {
                flash("failed");
            }
        },
        [flash],
    );

    const onClick = useCallback(async () => {
        const url = window.location.href;

        if (canShare) {
            try {
                await navigator.share({ title, url });

                return;
            } catch (err) {
                // 🚨 A DISMISSED SHEET IS NOT A FAILURE. The promise rejects with
                // AbortError when the person taps away, and falling through to
                // "copied" there would tell them we did something they cancelled.
                if (err?.name === "AbortError") return;
            }
        }

        copy(url);
    }, [canShare, copy, title]);

    const label = state === "copied" ? "Link copied" : state === "failed" ? "Could not copy" : canShare ? "Share" : "Copy link";
    const Icon = state === "copied" ? Check : canShare ? Share2 : Link2;

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "help-focus inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border-black px-3 text-[13px] font-semibold text-black transition-colors duration-200",
                state === "copied" ? "bg-[#05EFB8]" : "bg-white hover:bg-[#F4F4F5]",
                className,
            ].join(" ")}
            /* The state change is announced: on a phone the label is the only
               confirmation that anything happened. */
            aria-live="polite"
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
        </button>
    );
}
