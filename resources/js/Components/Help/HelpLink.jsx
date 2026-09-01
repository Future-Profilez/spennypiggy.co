import { useCallback, useEffect, useRef, useState } from "react";
import useHideBottomBar from "@/hooks/useHideBottomBar";
import axios from "axios";
import { HelpCircle, X, ExternalLink, Loader2 } from "lucide-react";
import ArticleBody from "./ArticleBody";
import ArticleFeedback from "./ArticleFeedback";

/**
 * Contextual help — an answer AT the point of confusion.
 *
 * This is where deflection actually happens. A reader who has to leave what they
 * are doing, find the help centre and search for the right words has already
 * half-decided to open a ticket instead. Drop this beside the thing that
 * confuses people:
 *
 *   <HelpLink slug="why-is-my-reserve-held" categorySlug="money-and-payouts" />
 *
 * ⚠️ Fetches NOTHING until it is opened. It is meant to be sprinkled across
 * dashboards; eager loading would put a request per instance on every page load.
 *
 * ⚠️ Fails to a plain link to the article, never to an error. A help affordance
 * must not be able to throw a failure onto the screen it is trying to explain.
 *
 * ⚠️ The wrapper is an inline-block DIV, not a span: the panel contains block
 * elements (the rendered article body), and a <div> inside a <span> is invalid
 * markup.
 */
export default function HelpLink({
    slug,
    label = "What's this?",
    categorySlug = null,
    className = "",
    // ⚠️ The PANEL is always light — it renders article prose and a light sheet
    // is the readable surface for that on either ground. Only the TRIGGER
    // changes, because half this app's headers are a dark or pink band and a
    // `text-black/60` trigger on one is invisible rather than quiet.
    tone = "light",
}) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState({ loading: false, article: null, failed: false });
    const controllerRef = useRef(null);
    const rootRef = useRef(null);

    const fallbackHref = categorySlug ? `/help/${categorySlug}/${slug}` : "/help";

    const load = useCallback(() => {
        if (state.article || state.loading) return;

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setState((s) => ({ ...s, loading: true, failed: false }));

        axios
            // Literal path, never route(): ziggy.js is a generated snapshot and a
            // name it does not carry throws, which would land in this catch and
            // disable contextual help on local and dev with no clue why.
            //
            // 🚨 Exact slug, not /help/search. Search matched on the slug turned
            // back into words, so a near-miss opened the WRONG answer, an
            // audience mismatch opened none, and every failure wrote a fake row
            // into the help-gap backlog the team reads.
            .get(`/help/inline/${encodeURIComponent(slug)}`, { signal: controller.signal })
            .then((res) => {
                const article = res?.data?.article ?? null;
                setState({ loading: false, article, failed: !article });
            })
            .catch((err) => {
                if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
                setState({ loading: false, article: null, failed: true });
            });
    }, [slug, state.article, state.loading]);

    useEffect(() => () => controllerRef.current?.abort(), []);

    // The phone sheet rises from the foot of the screen, where the bottom bar
    // (z 999999) sat over its last lines. Hide the bar while it is open.
    useHideBottomBar(open);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={rootRef} className={`relative inline-block ${className}`}>
            <button
                type="button"
                onClick={() => {
                    setOpen((o) => !o);
                    load();
                }}
                aria-expanded={open}
                // 44px target — this sits inline next to dense figures.
                className={`inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold underline decoration-dotted underline-offset-4 ${
                    tone === "dark"
                        ? "text-white/70 hover:text-white"
                        : "text-black/60 hover:text-black"
                }`}
            >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                {label}
            </button>

            {open && (
                // Bottom sheet on a phone, popover from `sm`. A popover anchored
                // to an inline control is unreadable at 390px.
                // bottom-bar-safe: useHideBottomBar(open) hides the bar while open
                <div className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[min(28rem,90vw)]">
                    <div className="max-h-[75dvh] overflow-y-auto rounded-box border-[3px] border-black bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                            <p className="text-[15px] font-black text-black">
                                {state.article?.title ?? label}
                            </p>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center text-black/60 hover:text-black"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {state.loading && (
                            <p className="flex items-center gap-2 py-3 text-sm text-black/60">
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Loading…
                            </p>
                        )}

                        {state.article && (
                            <>
                                <ArticleBody html={state.article.body_html} />
                                <div className="mt-4 border-t border-black/10 pt-3">
                                    <ArticleFeedback slug={state.article.slug} context="support_form" />
                                </div>
                                <a
                                    href={`/help/${state.article.category_slug}/${state.article.slug}`}
                                    className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#FF007F] underline"
                                >
                                    Open the full answer
                                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                            </>
                        )}

                        {state.failed && !state.loading && (
                            <a
                                href={fallbackHref}
                                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#FF007F] underline"
                            >
                                Read this in the Help Centre
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
