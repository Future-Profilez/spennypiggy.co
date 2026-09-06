import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import ArticleBody from "./ArticleBody";
import StillNeedHelp from "./StillNeedHelp";

/**
 * Ask AI as a conversation: the first question opens this panel, and every
 * follow-up is sent with the turns so far.
 *
 * 🚨 THE SERVER STORES NOTHING. This component IS the conversation — `messages`
 * is the only copy, and it is sent back with each follow-up so the model knows
 * what "it" and "that" refer to. Close the panel and it is gone; that is the
 * design, not a gap (a help centre that keeps transcripts is a support desk).
 *
 * 🚨 EVERY TURN IS ANSWERED FROM FRESHLY RETRIEVED ARTICLES. Earlier turns are
 * context for pronouns, never a source of facts — the server enforces that and
 * every assistant turn carries its own "Based on" chips for exactly that
 * reason.
 *
 * ⚠️ Follow-ups are never cached and each one is a paid generation, so the
 * server caps turns (`turns_left`). When it reaches zero the composer becomes
 * "Start a new question" rather than a refusal after typing.
 *
 * 🚨 IN THE FLOW, NEVER FLOATING (client direction, 5 Sep 2026: "floating
 * cheezein design me issue create karti hain"). The panel opens directly
 * under the search bar and pushes the page down — no `absolute`, no `fixed`,
 * no sheet, on any screen size. That is also why it needs no z-index, no
 * bottom-bar device and no transformed-ancestor caveat: nothing is pinned. A
 * long conversation makes a long page, which is what every other page does.
 *
 * DESIGN — A LEDGER, NOT A CHAT APP (6 Sep 2026). The first version drew
 * speech bubbles: black on the right for the reader, white on the left for the
 * answer. On a help centre that reads as a messenger, and a messenger is a
 * promise of a person. This is a transcript: one white frame, hairline rows,
 * a small caps label in the left column saying WHO, the words in the right.
 * The answer is set as article prose because it IS article prose — that is the
 * whole guarantee — and its sources sit under it like a footnote. Colour is
 * spent in one place: the composer's Send, which is the only action.
 *
 * ⚠️ `border-black` is the full 2px `border` shorthand in this project, used
 * ALONE and never as `border-t-2 border-black` (that paints all four sides).
 * Every internal rule here is a `divide-*`, and the one accent rule is inline.
 */

/**
 * 🚨 A FAILURE TO GENERATE IS NOT "WE HAVE NO ANSWER FOR THAT". These say the
 * SERVICE did not run; none of them says anything about the corpus. Telling a
 * reader "we do not have an answer" while the articles that do answer sit right
 * under it is how somebody opens a ticket.
 */
const TECHNICAL_REASONS = new Set([
    "request_failed",
    "exception",
    "embedding_unavailable",
    "no_articles_embedded",
    "rate_limited",
]);

const HISTORY_LIMIT = 10; // mirrors the server's `history` max — five exchanges

let nextId = 1;

export default function HelpChatPanel({
    open,
    question,
    onClose,
    maxQuestion = 200,
    // The keyword results the bar already fetched for the first question, so a
    // failed first generation still lists them instead of an empty row.
    resultsHint = null,
}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [turnsLeft, setTurnsLeft] = useState(null);

    const requestRef = useRef(null);
    const endRef = useRef(null);
    const inputRef = useRef(null);
    const askedRef = useRef(null);

    // ------------------------------------------------------------- transport

    const send = useCallback(
        async (text, history) => {
            const trimmed = text.trim();
            if (trimmed.length < 3 || busy) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;

            const userMessage = { id: nextId++, role: "user", content: trimmed };
            setMessages((prev) => [...prev, userMessage]);
            setBusy(true);

            // Only turns with substance travel: a user question, or an
            // assistant turn that actually answered. An "unavailable right now"
            // row is not context for anything.
            const payloadHistory = history
                .filter((m) => m.role === "user" || (m.role === "assistant" && m.data?.answered && m.data?.answer))
                .map((m) => ({ role: m.role, content: m.role === "user" ? m.content : m.data.answer }))
                .slice(-HISTORY_LIMIT);

            try {
                const res = await axios.post(
                    "/help/ask",
                    { q: trimmed, history: payloadHistory },
                    { signal: controller.signal },
                );
                const data = res?.data ?? {};
                setMessages((prev) => [...prev, { id: nextId++, role: "assistant", data }]);
                if (typeof data.turns_left === "number") setTurnsLeft(data.turns_left);
            } catch (err) {
                if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
                // Never a dead end: the request failed, the articles did not.
                setMessages((prev) => [
                    ...prev,
                    {
                        id: nextId++,
                        role: "assistant",
                        data: { answered: false, reason: "request_failed", results: history.length === 0 ? resultsHint ?? [] : [] },
                    },
                ]);
            } finally {
                if (!controller.signal.aborted) setBusy(false);
            }
        },
        [busy, resultsHint],
    );

    // The bar hands over the first question; ask it the moment the panel opens.
    useEffect(() => {
        if (!open) return;
        if (question && askedRef.current !== question) {
            askedRef.current = question;
            setMessages([]);
            setTurnsLeft(null);
            send(question, []);
        }
    }, [open, question]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // `nearest`, not `end`: the panel is in the page, so this scrolls the
        // PAGE — the minimum needed to show the newest row, never a jump.
        endRef.current?.scrollIntoView({ block: "nearest" });
    }, [messages, busy]);

    useEffect(() => {
        if (open && !busy) inputRef.current?.focus();
    }, [open, busy]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => () => requestRef.current?.abort(), []);

    const reset = () => {
        requestRef.current?.abort();
        askedRef.current = null;
        setMessages([]);
        setInput("");
        setBusy(false);
        setTurnsLeft(null);
        inputRef.current?.focus();
    };

    const submit = (e) => {
        e?.preventDefault?.();
        const text = input;
        setInput("");
        send(text, messages);
    };

    if (!open) return null;

    const atLimit = turnsLeft === 0;
    const asked = messages.filter((m) => m.role === "user").length;

    return (
        <section
            aria-label="Ask the help centre"
            className="mt-3 overflow-hidden rounded-box border-black bg-white text-left"
        >
            <div className="divide-y-2 divide-black">
                {/* ---------------------------------------------------- header */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <p className="flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-black">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Ask the help centre
                        {asked > 0 && (
                            <span className="ml-1 rounded-box-xs bg-[#E6EA7B] px-1.5 py-0.5 font-sans text-[11px] font-bold normal-case tracking-normal text-black">
                                {asked} question{asked === 1 ? "" : "s"}
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={reset}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-box-xs px-2 text-[13px] font-semibold text-black/70 hover:bg-black/[0.05] hover:text-black"
                            >
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                                New question
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-10 w-10 items-center justify-center rounded-box-xs text-black/70 hover:bg-black/[0.05] hover:text-black"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* ------------------------------------------------ transcript */}
                <div className="divide-y divide-black/10" aria-live="polite">
                    {messages.map((m) =>
                        m.role === "user" ? (
                            <Row key={m.id} who="You">
                                <p className="text-[15px] font-medium leading-[1.5] text-black">{m.content}</p>
                            </Row>
                        ) : (
                            <Row key={m.id} who="Spenny Piggy" accent>
                                <Answer data={m.data} onNavigate={onClose} onReset={reset} />
                            </Row>
                        ),
                    )}

                    {busy && (
                        <Row who="Spenny Piggy" accent>
                            <p className="flex items-center gap-2 text-[14px] text-black/60">
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Reading the help articles…
                            </p>
                        </Row>
                    )}

                    <div ref={endRef} />
                </div>

                {/* -------------------------------------------------- composer */}
                <div className="bg-[#F4F4F5] px-4 py-3 sm:px-5">
                    {atLimit ? (
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-black/70">This conversation is at its limit.</p>
                            <button
                                type="button"
                                onClick={reset}
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-black bg-[#FF007F] px-4 font-gulfs text-sm uppercase tracking-widest text-black transition-[filter] hover:brightness-110 active:brightness-95"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                Start a new question
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={submit}
                            className="flex items-stretch overflow-hidden rounded-box-sm border-black bg-white focus-within:ring-2 focus-within:ring-[#8C52FF]/40"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                maxLength={maxQuestion}
                                onChange={(e) => setInput(e.target.value.slice(0, maxQuestion))}
                                placeholder={messages.length ? "Ask a follow-up…" : "Ask a question…"}
                                aria-label="Your question"
                                disabled={busy}
                                className="min-h-[46px] w-full border-0 bg-transparent px-4 text-[15px] text-black placeholder:text-black/60 focus:outline-none focus:ring-0 disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={busy || input.trim().length < 3}
                                aria-label="Send"
                                className="flex w-14 shrink-0 items-center justify-center bg-[#FF007F] text-black transition-[filter] hover:brightness-110 active:brightness-95 disabled:opacity-45"
                                style={{ borderLeft: "2px solid #000" }}
                            >
                                <Send className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </form>
                    )}

                    <p className="mt-2 flex items-center justify-between gap-3 text-[12px] leading-[1.5] text-black/60">
                        <span>Answers come from the help articles. When in doubt, the article is what counts.</span>
                        {typeof turnsLeft === "number" && turnsLeft > 0 && turnsLeft <= 2 && (
                            <span className="shrink-0 font-semibold text-black/70">
                                {turnsLeft} follow-up{turnsLeft === 1 ? "" : "s"} left
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </section>
    );
}

/**
 * One transcript row: who spoke in the left column, what they said in the
 * right. The label is the ONLY place the speaker is marked — no avatar, no
 * bubble, no alignment trick. The answer rows carry a mint tick beside the
 * label so the eye can find them when scanning back up.
 */
function Row({ who, accent = false, children }) {
    return (
        <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 px-4 py-3.5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5 sm:px-5">
            <p className="flex items-start gap-1.5 pt-[3px] font-gulfs text-[11px] uppercase leading-[1.3] tracking-[0.14em] text-black/70">
                {accent && (
                    <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-[#05EFB8] ring-1 ring-black" aria-hidden="true" />
                )}
                <span>{who}</span>
            </p>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

/**
 * One assistant turn. The answer is the point; the sources are a footnote;
 * a failure hands over the articles rather than an apology.
 */
function Answer({ data, onNavigate, onReset }) {
    if (!data) return null;

    if (data.answered) {
        return (
            <div>
                <div className="text-[15px] leading-[1.6] text-black">
                    {data.answer_html ? (
                        <ArticleBody html={data.answer_html} />
                    ) : (
                        <p className="whitespace-pre-line">{data.answer}</p>
                    )}
                </div>

                {/* 🚨 Always shown. A generated sentence with nothing behind it
                    is exactly what this must not produce — one click from the
                    source, every turn. */}
                {data.sources?.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 font-gulfs text-[11px] uppercase tracking-[0.14em] text-black/60">Based on</span>
                        {data.sources.map((s) => (
                            <Link
                                key={s.slug}
                                href={`/help/${s.category_slug}/${s.slug}`}
                                onClick={onNavigate}
                                className="inline-flex min-h-[30px] items-center rounded-full border-black bg-white px-2.5 text-[12px] font-semibold text-black hover:bg-black hover:text-white"
                            >
                                {s.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (data.reason === "conversation_limit") {
        return (
            <div className="text-[15px] text-black">
                <p>This conversation is at its limit.</p>
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-2 inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border-black bg-white px-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
                >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Start a new question
                </button>
            </div>
        );
    }

    const technical = TECHNICAL_REASONS.has(data.reason);
    const results = data.results ?? [];

    /*
     * 🚨 A RATE LIMIT IS NOT AN OUTAGE, AND SAYING SO SENDS THE READER NOWHERE.
     * `rate_limited` means THIS caller has spent their hourly allowance —
     * nothing is broken and nothing will be fixed by waiting for us. "Written
     * answers are unavailable right now" reads as our fault and gives them no
     * idea whether to wait a second or a day, so it gets its own sentence.
     */
    const headline = data.reason === "rate_limited"
        ? (results.length > 0
            ? "You have asked a lot of questions in the last hour. Here is what the help centre has on that:"
            : "You have asked a lot of questions in the last hour. Try searching, or reach us below.")
        : technical
          ? (results.length > 0
              ? "Written answers are unavailable right now. Here is what the help centre has on that:"
              : "Written answers are unavailable right now. Try searching, or reach us below.")
          : (results.length > 0
              ? "I could not answer that from the articles. These come closest:"
              : "That is not covered in the help centre yet.");

    return (
        <div>
            {/* 🚨 Three different sentences for three different situations —
                blaming the corpus for a service outage, with the articles that
                answer it listed underneath, reads as the help centre
                contradicting itself. */}
            <p className="text-[15px] leading-[1.5] text-black">{headline}</p>

            {results.length > 0 && (
                <ul className="mt-3 overflow-hidden rounded-box-sm border-black divide-y divide-black/10">
                    {results.slice(0, 4).map((r) => (
                        <li key={r.slug}>
                            <Link
                                href={`/help/${r.category_slug}/${r.slug}`}
                                onClick={onNavigate}
                                className="block px-3 py-2.5 hover:bg-[#E6EA7B]"
                            >
                                {r.category_title && (
                                    <span className="block font-gulfs text-[10px] uppercase tracking-[0.16em] text-black/60">
                                        {r.category_title}
                                    </span>
                                )}
                                <span className="block text-[14px] font-semibold text-black">{r.title}</span>
                                {r.summary && (
                                    <span className="mt-0.5 block text-[13px] text-black/70 line-clamp-2">{r.summary}</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {!technical && (
                <p className="mt-2.5 text-[13px] text-black/60">
                    Questions we cannot answer are logged, so asking helped even when it did not help you.
                </p>
            )}

            {data.escalation && (
                <div className="mt-3">
                    <StillNeedHelp escalation={data.escalation} compact />
                </div>
            )}
        </div>
    );
}
