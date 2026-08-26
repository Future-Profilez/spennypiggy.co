import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { RotateCcw, ArrowLeft, Home, Copy, Check } from "lucide-react";
import * as Sentry from "@sentry/react";
import Guest from "@/Layouts/GuestLayout";

/**
 * The status code is the only thing on this page that is actually known, so it
 * drives everything: the accent colour, the headline and what we tell the user
 * to do next. A 403 is not broken — the page works and the account cannot open
 * it — and telling that person to "try again later" sends them round a loop
 * that can never end. Copy says what happened and what fixes it, in the
 * interface's voice, and never apologises.
 *
 * Accent meaning: yellow = our fault / caution, violet = locked, pink = the
 * catch-all. Every one of them clears AA on black at body size.
 */
const STATES = {
    500: {
        label: "Server error",
        accent: "#E6EA7B",
        onAccent: "text-black",
        headline: "Our end broke",
        body: "The page failed while we were building it, so nothing loaded. The fault is logged on our side. Try again — if it keeps happening, send us the reference below.",
        primary: "retry",
    },
    503: {
        label: "Service unavailable",
        accent: "#E6EA7B",
        onAccent: "text-black",
        headline: "We're briefly offline",
        body: "The site is unavailable while we work on it. Nothing you did caused this and nothing you were part-way through has been lost. Try again in a few minutes.",
        primary: "retry",
    },
    403: {
        label: "Not authorized",
        accent: "#8C52FF",
        onAccent: "text-white",
        headline: "This isn't yours to open",
        body: "The page exists, but the account you're signed in as can't reach it. Sign in with the account that owns it, or head back to where you were.",
        primary: "back",
    },
    404: {
        label: "Not found",
        accent: "#FF007F",
        onAccent: "text-black",
        headline: "That page isn't here",
        body: "The link may be broken, or a creator may have changed their username. Start again from the front page.",
        primary: "home",
    },
    419: {
        label: "Session expired",
        accent: "#05EFB8",
        onAccent: "text-black",
        headline: "Your session timed out",
        body: "You were away long enough that we signed the page out for safety. Reload it and you can carry on.",
        primary: "retry",
    },
};

const FALLBACK = {
    label: "Unexpected error",
    accent: "#FF007F",
    onAccent: "text-black",
    headline: "Something stopped this page",
    body: "We couldn't finish loading this page and we don't have a clearer reason to give you. Try again, and send us the reference below if it repeats.",
    primary: "retry",
};

/**
 * Fallback only.
 *
 * 🚨 THE REFERENCE IS THE SERVER'S. `Handler::reference()` generates it, writes
 * it into the `Unhandled exception` log line and tags the Sentry event with it,
 * then passes it here as a prop — so the string on screen is searchable in both
 * places the moment the page renders, whether or not the user ever clicks
 * anything. This local generator exists only for a render that arrives without
 * the prop; it produces a string support cannot look up, so it is deliberately
 * marked `-LOCAL` rather than passed off as the real one.
 */
function fallbackReference() {
    const now = new Date();
    const stamp = [
        String(now.getUTCFullYear()).slice(2),
        String(now.getUTCMonth() + 1).padStart(2, "0"),
        String(now.getUTCDate()).padStart(2, "0"),
    ].join("");
    const clock =
        String(now.getUTCHours()).padStart(2, "0") +
        String(now.getUTCMinutes()).padStart(2, "0");

    return `SP-${stamp}-${clock}-LOCAL`;
}

const REPORT_LABELS = {
    idle: "Report this in chat",
    working: "Opening chat…",
    chat: "Chat opened",
    form: "Report form opened",
    email: "Email opened",
};

function Row({ term, children }) {
    return (
        <div className="flex flex-col gap-1 border-t-2 border-white/15 px-5 py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6">
            <dt className="shrink-0 font-mono uppercase tracking-[0.18em] text-white/45 text-[11px] sm:w-[104px]">
                {term}
            </dt>
            <dd className="min-w-0 font-mono break-all text-white leading-[1.5] text-[13px] sm:text-[14px]">
                {children}
            </dd>
        </div>
    );
}

export default function ErrorPage({
    status = 500,
    message = "",
    consoleMessage = "",
    reference: serverReference = "",
    auth,
}) {
    const state = STATES[status] || FALLBACK;

    const [path, setPath] = useState("");
    const [time, setTime] = useState("");
    const [canGoBack, setCanGoBack] = useState(false);
    const [copied, setCopied] = useState(false);
    // idle → working → chat | form | email. The end state names the channel that
    // actually opened, because all three are reachable and telling someone their
    // chat is open when a mail client opened is the kind of small lie that makes
    // them stop trusting the page they are already on.
    const [reportState, setReportState] = useState("idle");
    const eventIdRef = useRef(null);

    // The server's value when there is one. Memoised so a re-render can never
    // hand the user a second reference for one fault.
    const reference = useMemo(
        () => serverReference || fallbackReference(),
        [serverReference]
    );

    useEffect(() => {
        if (consoleMessage) {
            console.error("[Application Error]:", consoleMessage);
        }
    }, [consoleMessage]);

    useEffect(() => {
        const raw = window.location.pathname + window.location.search;
        setPath(raw.length > 72 ? `${raw.slice(0, 72)}…` : raw);
        setCanGoBack(window.history.length > 1);
        setTime(
            new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
            }) + " UTC"
        );
    }, []);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 2000);

        return () => clearTimeout(t);
    }, [copied]);

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
        } catch {
            // Clipboard is blocked in some embedded browsers. The reference is
            // on screen and selectable, so this is a convenience failing, not
            // the user losing anything.
        }
    };

    /**
     * One click does two things, in this order:
     *
     *   1. Raises a Sentry issue tagged with the reference on screen, so support
     *      can paste that string into Sentry and land on the exact event.
     *   2. Opens the Intercom messenger with the reference, page and status
     *      already written into the composer.
     *
     * Sentry FIRST and awaited, because its event id goes into the chat message.
     * If the messenger is blocked or never booted we still have the issue filed,
     * and the user falls through to the Sentry feedback form, then to email —
     * this button is the last exit on the page, so it may not dead-end.
     *
     * ⚠️ The Sentry event is captured ONCE per mount. Clicking twice must not
     * file two issues for one fault; the second click reuses the first event id.
     */
    async function reportBug() {
        if (reportState === "working") return;
        setReportState("working");

        let eventId = eventIdRef.current;

        try {
            if (!eventId) {
                eventId = Sentry.captureMessage(
                    `Reported by user: ${status} ${state.label}`,
                    {
                        level: "error",
                        // Grouped by status + route, NOT by the click handler's
                        // stack — every report would otherwise collapse into one
                        // issue titled after this function.
                        fingerprint: ["user-reported", String(status), path || "unknown"],
                        tags: {
                            reference,
                            http_status: String(status),
                            reported_by_user: "true",
                        },
                        contexts: {
                            error_page: {
                                reference,
                                status,
                                page: path,
                                occurred_at: time,
                                server_message: message || null,
                                // The exception text the server put on the page.
                                // It is the only description of the real fault
                                // available on the client.
                                server_detail: consoleMessage || null,
                            },
                        },
                        user: auth?.user?.id ? { id: auth.user.id } : undefined,
                    }
                );
                eventIdRef.current = eventId || null;
            }
        } catch {
            // Sentry not initialised, or blocked. The chat handoff below is the
            // part the user can see, so it must not depend on this succeeding.
        }

        const summary = [
            "I hit an error on Spenny Piggy.",
            "",
            `Reference: ${reference}`,
            `Page: ${path || "unknown"}`,
            `Status: ${status} — ${state.label}`,
            eventId ? `Sentry: ${eventId}` : null,
            "",
            "What I was doing: ",
        ]
            .filter((line) => line !== null)
            .join("\n");

        // 1. Intercom — the messenger the rest of the site uses.
        //
        // 🚨 `typeof window.Intercom === "function"` IS NOT ENOUGH. IntercomProvider
        // installs a stub that QUEUES calls until the widget script loads, so when
        // that script is blocked (ad blocker, strict DNS) or Intercom is disabled
        // for this visitor, the call is accepted, nothing opens, and the user is
        // told their chat is open. `booted` is set by the real widget only.
        // A false negative here costs the user the Sentry form instead of chat;
        // a false positive costs them the report entirely, so this fails toward
        // the fallback deliberately.
        if (typeof window !== "undefined" && window.Intercom?.booted === true) {
            try {
                window.Intercom("showNewMessage", summary);
                setReportState("chat");

                return;
            } catch {
                // fall through
            }
        }

        // 2. Sentry's own feedback form.
        try {
            const feedback = Sentry.getFeedback();
            if (feedback) {
                const form = await feedback.createForm({
                    formTitle: "Report this error",
                    submitButtonLabel: "Send report",
                    messagePlaceholder: summary,
                    name: auth?.user?.name || "",
                    email: auth?.user?.email || "",
                });
                form.appendToDom();
                form.open();
                setReportState("form");

                return;
            }
        } catch {
            // fall through
        }

        // 3. Email, prefilled. Nothing left to load or block.
        window.location.href =
            `mailto:support@spennypiggy.co?subject=${encodeURIComponent(`Error ${status} — ${reference}`)}` +
            `&body=${encodeURIComponent(summary)}`;
        setReportState("email");
    }

    const btnBase =
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-box-sm px-6 font-gulfs uppercase tracking-wider text-[15px] transition-[filter,background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

    return (
        <Guest auth={auth}>
            <Head title={`${status} — ${state.label}`} />

            <section className="blackbg relative min-h-dvh overflow-hidden px-4 pb-20 pt-12 md:pt-20">
                {/* Ambient wash in the status accent. Decoration only, and the
                    one place any colour is allowed to be soft on this page. */}
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center"
                    aria-hidden="true"
                >
                    <div
                        className="h-72 w-72 rounded-full opacity-[0.18] blur-3xl md:h-[420px] md:w-[420px]"
                        style={{ background: state.accent }}
                    />
                </div>

                <div className="relative z-10 mx-auto max-w-3xl">
                    {/* SIGNATURE: the status code set at display size, with the
                        readout panel overlapping its lower half — one composition
                        rather than a stack of centred blocks. The number is
                        aria-hidden because the panel states it as real text. */}
                    <div className="relative">
                        <span
                            className="block select-none text-center font-gulfs uppercase leading-[0.78] text-[112px] md:text-[190px] lg:text-[228px]"
                            style={{ color: state.accent }}
                            aria-hidden="true"
                        >
                            {status}
                        </span>

                        <div className="-mt-6 md:-mt-10">
                            <div className="overflow-hidden rounded-box border-2 border-[#FFF]/85 bg-black/85 backdrop-blur-sm">
                                {/* The window chrome from the old page, kept
                                    because it is already this site's shorthand
                                    for "a screen that failed" — redrawn on the
                                    house 2px line instead of a mixed border. */}
                                <div className="flex items-center gap-2 border-b-2 border-white/85 px-5 py-3 sm:px-6">
                                    <span className="block h-3.5 w-3.5 rounded-full border-2 border-[#000] bg-[#E23B3B]" />
                                    <span className="block h-3.5 w-3.5 rounded-full border-2 border-[#000] bg-[#F5C518]" />
                                    <span className="block h-3.5 w-3.5 rounded-full border-2 border-[#000] bg-mint" />
                                    <span className="ms-auto font-mono uppercase tracking-[0.2em] text-white/45 text-[11px]">
                                        Error report
                                    </span>
                                </div>

                                <dl className="py-1">
                                    <Row term="Status">
                                        <span
                                            className={`me-2 inline-block rounded-box-xs px-2 py-0.5 font-bold ${state.onAccent}`}
                                            style={{ background: state.accent }}
                                        >
                                            {status}
                                        </span>
                                        {message || state.label}
                                    </Row>
                                    {path && <Row term="Page">{path}</Row>}
                                    {time && <Row term="Time">{time}</Row>}
                                    <Row term="Reference">
                                        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span>{reference}</span>
                                            <button
                                                type="button"
                                                onClick={copyReference}
                                                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-box-xs border-2 border-white/30 px-2.5 font-mono uppercase tracking-wider text-white/80 text-[11px] transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                            >
                                                {copied ? (
                                                    <Check size={13} aria-hidden="true" />
                                                ) : (
                                                    <Copy size={13} aria-hidden="true" />
                                                )}
                                                {copied ? "Copied" : "Copy"}
                                            </button>
                                        </span>
                                    </Row>
                                </dl>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <h1 className="font-gulfs uppercase leading-[1.05] text-white text-[30px] md:text-[46px]">
                            {state.headline}
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl font-CeraGR text-white/70 leading-[1.6] text-[16px] md:text-[17px]">
                            {state.body}
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                        {state.primary === "retry" && (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className={`${btnBase} ${state.onAccent} hover:brightness-110 active:brightness-95 focus-visible:ring-white`}
                                style={{ background: state.accent }}
                            >
                                <RotateCcw size={17} aria-hidden="true" />
                                Try again
                            </button>
                        )}

                        {state.primary !== "home" && canGoBack && (
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className={`${btnBase} border-2 border-[#FFF] bg-transparent text-white hover:bg-white/10 focus-visible:ring-white`}
                            >
                                <ArrowLeft size={17} aria-hidden="true" />
                                Go back
                            </button>
                        )}

                        <Link
                            href="/"
                            className={
                                state.primary === "home"
                                    ? `${btnBase} bg-[#FF007F] text-black hover:brightness-110 active:brightness-95 focus-visible:ring-white`
                                    : `${btnBase} border-2 border-[#FFF]/35 bg-transparent text-white/80 hover:bg-white/10 focus-visible:ring-white`
                            }
                        >
                            <Home size={17} aria-hidden="true" />
                            Home
                        </Link>
                    </div>

                    <p className="mt-10 text-center font-CeraGR text-white/55 leading-[1.6] text-[14px]">
                        Still stuck?{" "}
                        <button
                            type="button"
                            onClick={reportBug}
                            disabled={reportState === "working"}
                            className="min-h-[44px] font-bold text-[#05EFB8] underline underline-offset-4 transition-opacity duration-200 hover:opacity-70 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#05EFB8]"
                        >
                            {REPORT_LABELS[reportState] || REPORT_LABELS.idle}
                        </button>{" "}
                        — the reference goes with it.
                    </p>

                </div>
            </section>
        </Guest>
    );
}
