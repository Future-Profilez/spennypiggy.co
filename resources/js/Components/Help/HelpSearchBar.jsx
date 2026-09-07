import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import { Search, X, Loader2, Sparkles, CornerDownLeft } from "lucide-react";
import HelpChatPanel from "./HelpChatPanel";
import StillNeedHelp from "./StillNeedHelp";

/**
 * ONE control: type to search, or ask a question.
 *
 * This replaces the two separate boxes that stood here before. A search field
 * and an ask field side by side is one decision more than the reader should
 * have to make, and they were asking for the same thing in two ways.
 *
 * 🚨 THE LENGTH OF WHAT WAS TYPED DECIDES WHICH IT IS (client direction,
 * 6 Sep 2026). A word or two — "payout", "reserve held" — is a lookup, and a
 * list of articles answers it faster than a sentence would. Four words or more
 * is a QUESTION, and a question gets asked: the Ask row becomes the default
 * action on Enter and, once the reader stops typing, the question is sent on
 * its own. Below the threshold the AI is never called unless the reader asks
 * for it — a keyword search costs nothing, a generation costs quota.
 *
 * 🚨 ASK AI OPENS A CONVERSATION, NOT A DROPDOWN. The first question hands off
 * to `HelpChatPanel`, which owns the transcript, the follow-ups and every
 * answer bubble — this component only searches, and only ever renders keyword
 * results. Two places rendering an answer is two copies of the "failure is not
 * a gap in the corpus" copy waiting to disagree.
 *
 * 🚨 The Ask action is only rendered when the server can genuinely answer
 * (`ai` prop, from HelpAnswer::enabled()). An "Ask AI" control that quietly
 * runs a keyword search is a promise the product does not keep.
 *
 * ⚠️ NO OFFSET SHADOW ON THE DARK HERO. A 5px coloured offset under a
 * full-width bar does not read as the house frame at that size — it reads as a
 * misaligned slab sticking out from behind the field. The frame here is the
 * border, and colour arrives on focus.
 *
 * ⚠️ `border-black` is the full 2px `border` shorthand in this project, so it
 * is used ALONE — never beside a width class, and never as `border-b-2
 * border-black` (that paints all four sides). Internal rules are `divide-*`.
 */

/** A query with at least this many words is a question, and is asked. */
export const AUTO_ASK_WORDS = 4;

const ASK_ROW = "__ask__";

export function wordCount(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}

export default function HelpSearchBar({
    ai = false,
    autoFocus = false,
    placeholder = "Search, or ask a question…",
    onDark = false,
    className = "",
    // ⚠️ Mirrors config('help.ai.max_question_length'). This is a courtesy — the
    // real cap is enforced server-side, because the endpoint is public and a
    // pasted essay is an expensive embedding plus an expensive prompt.
    maxQuestion = 200,
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [fallback, setFallback] = useState(null);
    const [searching, setSearching] = useState(false);
    const [open, setOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatQuestion, setChatQuestion] = useState("");
    // Which row the keyboard is on: a result's slug, ASK_ROW, or null.
    const [active, setActive] = useState(null);

    const searchRef = useRef(null);
    /*
     * ⚠️ A REF, NOT A DEPENDENCY. The panel needs the latest keyword results
     * for a failed FIRST generation, and putting `results` in `ask`'s
     * dependency array would rebuild it on every keystroke.
     */
    const resultsRef = useRef(null);
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    // The last question handed to the panel, so re-committing the identical
    // string reopens the same transcript rather than starting a second one.
    const autoAskedRef = useRef(null);

    const trimmed = query.trim();
    const canAsk = ai && trimmed.length >= 3;
    const isQuestion = canAsk && wordCount(trimmed) >= AUTO_ASK_WORDS;

    // ---------------------------------------------------------------- search

    const runSearch = useCallback((value) => {
        const q = value.trim();

        if (q.length < 2) {
            setResults(null);
            setFallback(null);
            setSearching(false);
            return;
        }

        searchRef.current?.abort();
        const controller = new AbortController();
        searchRef.current = controller;

        setSearching(true);

        axios
            // Literal path, never route(): ziggy.js is a generated snapshot and
            // route() throws for a name it has not been regenerated for — which
            // would land in this catch and read as "search is broken".
            .get("/help/search", { params: { q }, signal: controller.signal })
            .then((res) => {
                setResults(res?.data?.results ?? []);
                setFallback(res?.data?.fallback ?? null);
            })
            .catch((err) => {
                if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
                setResults([]);
                setFallback(null);
            })
            .finally(() => {
                if (!controller.signal.aborted) setSearching(false);
            });
    }, []);

    useEffect(() => {
        resultsRef.current = results;
    }, [results]);

    useEffect(() => {
        const id = setTimeout(() => runSearch(query), 220);
        return () => clearTimeout(id);
    }, [query, runSearch]);

    // ------------------------------------------------------------------- ask

    const ask = useCallback(() => {
        const q = query.trim();

        // ⚠️ An empty field FOCUSES the input rather than being refused. The
        // Ask action is the loudest thing in the hero, so a visitor arriving to
        // find it greyed out reads the page as broken before they have typed a
        // character — a disabled primary action is the worst possible first
        // impression of a help centre.
        if (q.length < 3) {
            inputRef.current?.focus();
            return;
        }

        // The panel asks it. Same question re-sent opens the same transcript;
        // a different one starts fresh — the panel keys on the string.
        setOpen(false);
        autoAskedRef.current = q;
        setChatQuestion(q);
        setChatOpen(true);
    }, [query]);

    /*
     * 🚨 NOTHING OPENS THE CONVERSATION ON A TIMER (client direction, 6 Sep 2026:
     * "page ko hila dete h").
     *
     * A 4+ word query used to open the chat by itself 1.4s after the last
     * keystroke. The panel is IN THE FLOW — that is the whole point of it, and
     * the client's own earlier direction — so it appeared under the bar and shoved
     * the directory below it down the page, while the reader was still typing and
     * looking at the box. A surface that rearranges itself under a person mid-
     * sentence reads as a fault whatever it is doing.
     *
     * The word count still decides — it picks which row Enter commits to (see
     * `isQuestion` and the Ask row below). What changed is that the READER
     * commits, always: Enter, the Ask row, the Ask AI button, or Cmd/Ctrl+Enter.
     */

    useEffect(() => () => searchRef.current?.abort(), []);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    // -------------------------------------------------------------- keyboard

    /*
     * 🚨 `!chatOpen` IS LOAD-BEARING. Once the conversation is open it handles
     * everything (client direction: "chat me hi karo sab handle") — a floating
     * results layer over a panel that already lists its own sources is two
     * answers to one question, stacked on top of each other. Dropping this guard
     * is what let the dropdown reopen over the transcript.
     */
    const showPanel = open && !chatOpen && trimmed.length >= 2;
    const showAskRow = canAsk;

    // The rows the arrow keys walk, in the order they are drawn.
    const rows = useMemo(() => {
        const list = (results ?? []).map((r) => r.slug);
        if (showAskRow) list.push(ASK_ROW);
        return list;
    }, [results, showAskRow]);

    // A question defaults to the Ask row; a lookup defaults to the top article.
    useEffect(() => {
        if (rows.length === 0) {
            setActive(null);
            return;
        }
        setActive(isQuestion && showAskRow ? ASK_ROW : rows[0]);
    }, [rows, isQuestion, showAskRow]);

    const openRow = (slug) => {
        if (slug === ASK_ROW) {
            ask();
            return;
        }
        const r = results?.find((x) => x.slug === slug);
        if (!r) return;
        setOpen(false);
        router.visit(`/help/${r.category_slug}/${r.slug}`);
    };

    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            setOpen(false);
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (!rows.length) return;
            e.preventDefault();
            setOpen(true);
            const i = rows.indexOf(active);
            const step = e.key === "ArrowDown" ? 1 : -1;
            const next = (i + step + rows.length) % rows.length;
            setActive(rows[next]);
            return;
        }
        if (e.key !== "Enter") return;
        e.preventDefault();
        // ⌘/Ctrl+Enter always asks, whatever the row.
        if ((e.metaKey || e.ctrlKey) && canAsk) {
            ask();
            return;
        }
        if (active) {
            openRow(active);
            return;
        }
        if (canAsk) ask();
    };

    const optionId = (slug) => `help-search-opt-${slug === ASK_ROW ? "ask" : slug}`;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {/*
              🚨 THE BAR HANDS OVER TO THE CONVERSATION (client direction,
              6 Sep 2026: "ak baar in chat aa gaya tab chat me hi karo sab
              handle"). While the panel is open the field is NOT a second place
              to type: the panel has its own composer, its own history and its
              own sources, and two inputs stacked six pixels apart is a reader
              choosing between two things that do the same job. The strip names
              what is being asked and offers the one way back.
            */}
            {chatOpen ? (
                <div
                    className={[
                        "flex items-center gap-3 rounded-box-sm px-4 py-2.5",
                        onDark ? "bg-white/10" : "border-black bg-white",
                    ].join(" ")}
                >
                    <Sparkles
                        className={`h-4 w-4 shrink-0 ${onDark ? "text-[#05EFB8]" : "text-[#D1006A]"}`}
                        aria-hidden="true"
                    />
                    <p className="min-w-0 flex-1">
                        <span
                            className={`block font-gulfs text-[10px] uppercase tracking-[0.16em] ${onDark ? "text-white/60" : "text-black/60"}`}
                        >
                            Asking
                        </span>
                        <span
                            className={`block truncate text-[14px] font-semibold ${onDark ? "text-white" : "text-black"}`}
                        >
                            {chatQuestion}
                        </span>
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setChatOpen(false);
                            setQuery("");
                            setResults(null);
                            autoAskedRef.current = null;
                            inputRef.current?.focus();
                        }}
                        className={[
                            "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-box-sm px-3 text-[13px] font-semibold transition-colors duration-200",
                            onDark
                                ? "help-focus-invert bg-white text-black hover:bg-white/90"
                                : "help-focus border-black bg-white text-black hover:bg-[#F4F4F5]",
                        ].join(" ")}
                    >
                        <Search className="h-3.5 w-3.5" aria-hidden="true" />
                        New search
                    </button>
                </div>
            ) : (
                <>
                {/*
                  One object: field and action share a single border and a single
                  radius, divided by a hairline rather than floating apart.
                */}
                <div
                    className={[
                        "flex flex-col overflow-hidden rounded-box-sm border-black bg-white sm:flex-row sm:items-stretch",
                        onDark ? "focus-within:ring-2 focus-within:ring-[#05EFB8]" : "focus-within:ring-2 focus-within:ring-[#8C52FF]/40",
                    ].join(" ")}
                >
                    {/* 🚨 A FIXED ROW HEIGHT, NOT PADDING. With `py-3` the row was
                        sized by its tallest child, so the 44px Clear button
                        appearing on the FIRST KEYSTROKE grew the bar by 20px and
                        shoved the whole page down — a twitch on every search, and
                        one the reader causes themselves by typing. `min-h` equal
                        to the Ask button's keeps the bar one height, always. */}
                    <div className="flex min-h-[52px] flex-1 items-center gap-3 px-4">
                        <Search className="h-5 w-5 shrink-0 text-black/60" aria-hidden="true" />
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            autoFocus={autoFocus}
                            onFocus={() => setOpen(true)}
                            maxLength={maxQuestion}
                            onChange={(e) => {
                                setQuery(e.target.value.slice(0, maxQuestion));
                                setOpen(true);
                            }}
                            onKeyDown={onKeyDown}
                            placeholder={placeholder}
                            aria-label="Search the help centre, or ask a question"
                            role="combobox"
                            aria-expanded={showPanel}
                            aria-controls="help-search-listbox"
                            aria-autocomplete="list"
                            aria-activedescendant={showPanel && active ? optionId(active) : undefined}
                            className="w-full border-0 bg-transparent p-0 text-base text-black placeholder:text-black/60 focus:outline-none focus:ring-0"
                        />
                        {searching && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-black/60" aria-hidden="true" />
                        )}
                        {!searching && query && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    setResults(null);
                                    inputRef.current?.focus();
                                }}
                                aria-label="Clear"
                                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-black/60 hover:text-black"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {ai && (
                        <button
                            type="button"
                            onClick={ask}
                            // Black ink on brand pink: measured, white on #FF007F
                            // is 3.78:1 and under AA at this size.
                            className="flex min-h-[52px] shrink-0 items-center justify-center gap-2 bg-[#FF007F] px-6 font-gulfs text-[16px] uppercase tracking-widest text-black transition-[filter] hover:brightness-110 active:brightness-95 md:text-[18px]"
                        >
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Ask AI
                        </button>
                    )}
                </div>

                {ai && (
                    <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${onDark ? "text-white/60" : "text-black/60"}`}>
                        <span>
                            A word or two searches. Ask a full question ({AUTO_ASK_WORDS}+ words) and Enter answers it.
                        </span>
                        {/* Only appears near the ceiling. A counter on an empty field
                            is a limit announced before anyone was near it. */}
                        {query.length > maxQuestion * 0.75 && (
                            <span className={query.length >= maxQuestion ? "font-bold text-[#FF007F]" : ""}>
                                {query.length}/{maxQuestion}
                            </span>
                        )}
                    </div>
                )}
                </>
            )}

            {showPanel && (
                <div
                    id="help-search-listbox"
                    role="listbox"
                    aria-label="Search results"
                    className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70dvh] overflow-y-auto rounded-box border-black bg-white text-left"
                >
                    <div className="divide-y-2 divide-black">
                        {/* -------------------------------------------- caption */}
                        <div className="flex items-center justify-between gap-3 bg-[#F4F4F5] px-4 py-2">
                            <p className="font-gulfs text-[11px] uppercase tracking-[0.18em] text-black/70">
                                {results === null
                                    ? "Searching"
                                    : results.length === 0
                                      ? "No articles"
                                      : `${results.length} article${results.length === 1 ? "" : "s"}`}
                            </p>
                            <p className="hidden items-center gap-2 text-[11px] text-black/60 sm:flex" aria-hidden="true">
                                <Key>↑</Key>
                                <Key>↓</Key>
                                <span>move</span>
                                <Key>↵</Key>
                                <span>{isQuestion ? "ask" : "open"}</span>
                            </p>
                        </div>

                        {/* ------------------------------------------ results */}
                        {results === null && (
                            <div className="flex items-center gap-2 px-4 py-4 text-sm text-black/60">
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Searching the help articles…
                            </div>
                        )}

                        {results?.length > 0 && (
                            <ul className="divide-y divide-black/10">
                                {results.map((r) => {
                                    const isActive = active === r.slug;
                                    return (
                                        <li
                                            key={r.slug}
                                            id={optionId(r.slug)}
                                            role="option"
                                            aria-selected={isActive}
                                        >
                                            <Link
                                                href={`/help/${r.category_slug}/${r.slug}`}
                                                onClick={() => setOpen(false)}
                                                onMouseEnter={() => setActive(r.slug)}
                                                // Brand yellow = "where you are", the
                                                // house device for the active tab.
                                                className={`grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 ${
                                                    isActive ? "bg-[#E6EA7B]" : "hover:bg-black/[0.03]"
                                                }`}
                                            >
                                                <span className="min-w-0">
                                                    <span className="block font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/60">
                                                        {r.category_title ?? r.category_slug?.replace(/-/g, " ")}
                                                    </span>
                                                    <span className="mt-0.5 block text-[15px] font-semibold leading-[1.35] text-black">
                                                        {r.title}
                                                    </span>
                                                    {r.summary && (
                                                        <span className="mt-0.5 block text-[13px] leading-[1.5] text-black/70 line-clamp-1 sm:line-clamp-2">
                                                            {r.summary}
                                                        </span>
                                                    )}
                                                </span>
                                                <CornerDownLeft
                                                    className={`h-4 w-4 shrink-0 text-black ${isActive ? "opacity-100" : "opacity-0"}`}
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {results?.length === 0 && (
                            // 🚨 Never a bare "no results". That is the moment
                            // a reader decides the platform has no answer and
                            // opens a ticket instead.
                            <div className="px-4 py-4">
                                <p className="text-[15px] font-semibold text-black">
                                    Nothing matched “{trimmed}”.
                                </p>
                                <p className="mt-1 text-[13px] text-black/70">
                                    {canAsk
                                        ? "Ask it as a question below, or browse a section."
                                        : "Try different words, or browse a section."}
                                </p>

                                {fallback?.categories?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {fallback.categories.map((c) => (
                                            <Link
                                                key={c.slug}
                                                href={`/help/${c.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border-black bg-white px-3 text-[13px] font-semibold text-black hover:bg-black hover:text-white"
                                            >
                                                {c.icon && <span aria-hidden="true">{c.icon}</span>}
                                                {c.title}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {fallback?.escalation && (
                                    <div className="mt-4">
                                        <StillNeedHelp escalation={fallback.escalation} compact />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --------------------------------------------- ask row */}
                        {showAskRow && (
                            <div id={optionId(ASK_ROW)} role="option" aria-selected={active === ASK_ROW}>
                                <button
                                    type="button"
                                    onClick={ask}
                                    onMouseEnter={() => setActive(ASK_ROW)}
                                    className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-[filter] ${
                                        active === ASK_ROW ? "bg-[#FF007F] brightness-110" : "bg-[#FF007F]"
                                    } hover:brightness-110 active:brightness-95`}
                                >
                                    <Sparkles className="h-4 w-4 shrink-0 text-black" aria-hidden="true" />
                                    <span className="min-w-0">
                                        <span className="block font-gulfs text-[11px] uppercase tracking-[0.16em] text-black/70">
                                            {isQuestion ? "Ask AI · default" : "Ask AI"}
                                        </span>
                                        <span className="block truncate text-[15px] font-semibold text-black">
                                            “{trimmed}”
                                        </span>
                                    </span>
                                    {active === ASK_ROW ? (
                                        <CornerDownLeft className="h-4 w-4 shrink-0 text-black" aria-hidden="true" />
                                    ) : (
                                        <span className="hidden text-[11px] font-semibold text-black/70 sm:inline">⌘↵</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <HelpChatPanel
                open={chatOpen}
                question={chatQuestion}
                onClose={() => setChatOpen(false)}
                maxQuestion={maxQuestion}
                resultsHint={resultsRef.current}
            />
        </div>
    );
}

/** A keycap, for the caption's keyboard hint. */
function Key({ children }) {
    return (
        <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-box-xs border border-black/30 bg-white px-1 font-sans text-[10px] font-semibold text-black">
            {children}
        </kbd>
    );
}
