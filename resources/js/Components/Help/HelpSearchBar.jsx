import { useCallback, useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import { Search, X, Loader2, Sparkles } from "lucide-react";
import ArticleBody from "./ArticleBody";
import StillNeedHelp from "./StillNeedHelp";

/**
 * ONE control: type to search, or press Ask AI for a written answer.
 *
 * This replaces the two separate boxes that stood here before. A search field
 * and an ask field side by side is one decision more than the reader should
 * have to make, and they were asking for the same thing in two ways.
 *
 * 🚨 THE AI ANSWER IS THE ANSWER — the sources are a footnote. The reader asked
 * a question, so a summary they can read is what they get; the articles it came
 * from sit underneath as small chips they can check. Leading with a list of
 * articles is what search already does, and it is what they pressed this button
 * to avoid.
 *
 * 🚨 The button is only rendered when the server can genuinely answer
 * (`ai` prop, from HelpAnswer::enabled()). An "Ask AI" button that quietly runs
 * a keyword search is a promise the product does not keep.
 *
 * ⚠️ NO OFFSET SHADOW ON THE DARK HERO. A 5px coloured offset under a full-width
 * bar does not read as the house frame at that size — it reads as a misaligned
 * slab sticking out from behind the field. The frame here is the border, and
 * colour arrives on focus.
 */
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
    const [answer, setAnswer] = useState(null);
    const [searching, setSearching] = useState(false);
    const [asking, setAsking] = useState(false);
    const [open, setOpen] = useState(false);

    const searchRef = useRef(null);
    const askRef = useRef(null);
    const rootRef = useRef(null);
    const inputRef = useRef(null);

    // ---------------------------------------------------------------- search

    const runSearch = useCallback((value) => {
        const trimmed = value.trim();

        if (trimmed.length < 2) {
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
            .get("/help/search", { params: { q: trimmed }, signal: controller.signal })
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
        // A new keystroke invalidates a pending answer — leaving it on screen
        // above a different question is the worst kind of stale.
        setAnswer(null);
        const id = setTimeout(() => runSearch(query), 220);
        return () => clearTimeout(id);
    }, [query, runSearch]);

    // ------------------------------------------------------------------- ask

    const ask = useCallback(async () => {
        const trimmed = query.trim();

        // ⚠️ An empty field FOCUSES the input rather than being refused. The
        // button is the loudest thing in the hero, so a visitor arriving to find
        // it greyed out reads the page as broken before they have typed a
        // character — a disabled primary action is the worst possible first
        // impression of a help centre.
        if (trimmed.length < 3) {
            inputRef.current?.focus();
            return;
        }

        // Re-entrancy guard: the disabled re-render loses the double-tap race
        // and each submission costs a generation.
        if (asking) return;

        askRef.current?.abort();
        const controller = new AbortController();
        askRef.current = controller;

        setAsking(true);
        setAnswer(null);
        setOpen(true);

        try {
            const res = await axios.post("/help/ask", { q: trimmed }, { signal: controller.signal });
            setAnswer(res?.data ?? null);
        } catch (err) {
            if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
            // Never a dead end — the unanswered branch still lists the closest
            // articles and a way to reach a person.
            setAnswer({ answered: false, results: [], reason: "request_failed" });
        } finally {
            if (!controller.signal.aborted) setAsking(false);
        }
    }, [query, asking]);

    useEffect(
        () => () => {
            searchRef.current?.abort();
            askRef.current?.abort();
        },
        [],
    );

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const showPanel = open && (query.trim().length >= 2 || asking || answer);
    const canAsk = query.trim().length >= 3;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {/*
              One object: field and action share a single border and a single
              radius, divided by a hairline rather than floating apart.
            */}
            <div
                className={[
                    "flex flex-col overflow-hidden rounded-box-sm border-[3px] border-black bg-white sm:flex-row sm:items-stretch",
                    onDark ? "focus-within:ring-2 focus-within:ring-[#05EFB8]" : "focus-within:ring-2 focus-within:ring-[#8C52FF]/40",
                ].join(" ")}
            >
                <div className="flex flex-1 items-center gap-3 px-4 py-3">
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
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setOpen(false);
                            if (e.key !== "Enter") return;
                            // ⌘/Ctrl+Enter asks; plain Enter opens the top result.
                            // Two intents, one field — the modifier is what keeps
                            // the common case (search) a single keystroke.
                            if ((e.metaKey || e.ctrlKey) && ai) {
                                e.preventDefault();
                                ask();
                            } else if (results?.length) {
                                const first = results[0];
                                router.visit(`/help/${first.category_slug}/${first.slug}`);
                            }
                        }}
                        placeholder={placeholder}
                        aria-label="Search the help centre, or ask a question"
                        className="w-full border-0 bg-transparent p-0 text-base text-black placeholder:text-black/60 focus:outline-none focus:ring-0"
                    />
                    {searching && !asking && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-black/60" aria-hidden="true" />
                    )}
                    {!searching && query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setResults(null);
                                setAnswer(null);
                            }}
                            aria-label="Clear"
                            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-black/60 hover:text-black"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {ai && (
                    <>
                        {/* <span className="h-px w-full bg-black sm:h-auto sm:w-[3px]" aria-hidden="true" /> */}
                        <button
                            type="button"
                            onClick={ask}
                            disabled={asking}
                            // Black ink on brand pink: measured, white on #FF007F
                            // is ~4.2:1 and under AA at this size.
                            className="flex min-h-[52px] shrink-0 items-center justify-center gap-2 bg-[#FF007F] px-6 font-gulfs text-[16px] md:text-[18px] uppercase tracking-widest text-black text-shadow transition-opacity hover:opacity-90 disabled:opacity-45"
                        >
                            {asking ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    Thinking
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                    Ask AI
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            {ai && (
                <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${onDark ? "text-white/60" : "text-black/60"}`}>
                    <span>Type to search, or press Ask AI for a short written answer.</span>
                    {/* Only appears near the ceiling. A counter on an empty field
                        is a limit announced before anyone was near it. */}
                    {query.length > maxQuestion * 0.75 && (
                        <span className={query.length >= maxQuestion ? "font-bold text-[#FF007F]" : ""}>
                            {query.length}/{maxQuestion}
                        </span>
                    )}
                </div>
            )}

            {showPanel && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70dvh] overflow-y-auto rounded-box border-[3px] border-black bg-white text-left ">
                    {asking && (
                        <p className="flex items-center gap-2 px-5 py-6 text-sm text-black/60">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Reading the help articles…
                        </p>
                    )}

                    {/* ---------------------------------------------- answer */}
                    {!asking && answer?.answered && (
                        <div className="px-5 py-5">
                            <p className="flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60">
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                Answer
                            </p>

                            {/* The answer is the point — set larger than the
                                sources under it, not the other way round. */}
                            <div className="mt-3 text-[16px] leading-[1.65] text-black">
                                <ArticleBody html={answer.answer_html} />
                                {!answer.answer_html && (
                                    <p className="whitespace-pre-line">{answer.answer}</p>
                                )}
                            </div>

                            {/* 🚨 Always shown, but as a footnote. A generated
                                sentence with nothing behind it is exactly what
                                this must not produce — the reader has to be one
                                click from the source. */}
                            {answer.sources?.length > 0 && (
                                <div className="mt-4 border-t border-black/10 pt-3">
                                    <p className="text-[12px] font-bold uppercase tracking-wider text-black/60">
                                        Based on
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {answer.sources.map((s) => (
                                            <Link
                                                key={s.slug}
                                                href={`/help/${s.category_slug}/${s.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="inline-flex min-h-[36px] items-center rounded-full border-2 border-black bg-white px-3 text-[13px] font-semibold text-black hover:bg-black hover:text-white"
                                            >
                                                {s.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="mt-3 text-[12px] leading-[1.5] text-black/60">
                                Written from the articles above. If it does not match what you see on your
                                own account, the article is what counts.
                            </p>
                        </div>
                    )}

                    {/* ------------------------------- asked, but no answer */}
                    {!asking && answer && !answer.answered && (
                        <div className="px-5 py-5">
                            <p className="text-[15px] font-semibold text-black">
                                {answer.results?.length > 0
                                    ? "We could not answer that directly. These come closest:"
                                    : "We do not have an answer for that yet."}
                            </p>

                            {answer.results?.length > 0 && (
                                <ul className="mt-3 flex flex-col gap-2">
                                    {answer.results.slice(0, 5).map((r) => (
                                        <li key={r.slug}>
                                            <Link
                                                href={`/help/${r.category_slug}/${r.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="block rounded-box-sm border-2 border-black px-4 py-3 hover:bg-black/[0.03]"
                                            >
                                                <span className="block text-[15px] font-semibold text-black">
                                                    {r.title}
                                                </span>
                                                <span className="mt-0.5 block text-sm text-black/60 line-clamp-2">
                                                    {r.summary}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className="mt-3 text-sm text-black/60">
                                Questions we cannot answer are logged, so asking helped even when it did
                                not help you.
                            </p>

                            {answer.escalation && (
                                <div className="mt-4">
                                    <StillNeedHelp escalation={answer.escalation} compact />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ------------------------------------ keyword results */}
                    {!asking && !answer && (
                        <>
                            {results === null && (
                                <p className="px-5 py-5 text-sm text-black/60">Searching…</p>
                            )}

                            {results?.length > 0 && (
                                <ul className="divide-y divide-black/10">
                                    {results.map((r) => (
                                        <li key={r.slug}>
                                            <Link
                                                href={`/help/${r.category_slug}/${r.slug}`}
                                                onClick={() => setOpen(false)}
                                                className="block px-5 py-3 hover:bg-black/[0.03]"
                                            >
                                                <span className="block text-[15px] font-semibold text-black">
                                                    {r.title}
                                                </span>
                                                <span className="mt-0.5 block text-sm text-black/60 line-clamp-2">
                                                    {r.summary}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {results?.length === 0 && (
                                // 🚨 Never a bare "no results". That is the moment
                                // a reader decides the platform has no answer and
                                // opens a ticket instead.
                                <div className="px-5 py-5">
                                    <p className="text-[15px] font-semibold text-black">
                                        Nothing matched “{query.trim()}”.
                                    </p>

                                    {ai && canAsk && (
                                        <button
                                            type="button"
                                            onClick={ask}
                                            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-2 border-black bg-[#FF007F] px-4 font-gulfs text-sm uppercase tracking-widest text-black"
                                        >
                                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                                            Ask AI instead
                                        </button>
                                    )}

                                    {fallback?.categories?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {fallback.categories.map((c) => (
                                                <Link
                                                    key={c.slug}
                                                    href={`/help/${c.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-2 border-black bg-white px-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
