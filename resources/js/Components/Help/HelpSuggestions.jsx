import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, Lightbulb } from "lucide-react";
import ArticleFeedback from "./ArticleFeedback";
import ArticleBody from "./ArticleBody";

/**
 * Deflection: the answers offered BEFORE someone writes a support ticket.
 *
 * 🚨 The articles expand INLINE, with their full body. Sending the reader to
 * another page to read the answer loses the form they were filling in — they
 * either lose their message or never come back, and both outcomes are worse than
 * the ticket we were trying to avoid.
 *
 * ⚠️ Renders NOTHING while it has no suggestions. An "we found no help articles"
 * strip above a support form is noise on the screen where someone is already
 * frustrated.
 */
export default function HelpSuggestions({
    query,
    heading = "This might answer it",
    limit = 3,
    onDeflected,
}) {
    const [items, setItems] = useState([]);
    const [openSlug, setOpenSlug] = useState(null);
    const controllerRef = useRef(null);

    useEffect(() => {
        const trimmed = (query || "").trim();

        if (trimmed.length < 3) {
            setItems([]);
            return undefined;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        const id = setTimeout(() => {
            axios
                // Literal path, never route(): ziggy.js is a generated snapshot
                // and a name it does not carry throws into this catch, which
                // would silently disable deflection on local and dev.
                .get("/help/search", {
                    params: { q: trimmed, with_body: 1, limit },
                    signal: controller.signal,
                })
                .then((res) => setItems(res?.data?.results ?? []))
                // Deflection is an enhancement on the support path. If it fails,
                // the reader still gets the form — never surface an error here.
                .catch(() => setItems([]));
        }, 300);

        return () => {
            clearTimeout(id);
            controller.abort();
        };
    }, [query, limit]);

    useEffect(() => () => controllerRef.current?.abort(), []);

    if (!items.length) return null;

    return (
        <section className="rounded-box border-2 border-black bg-[#F7F7F5] p-4" aria-labelledby="help-suggestions-heading">
            <h3
                id="help-suggestions-heading"
                className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-black"
            >
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                {heading}
            </h3>

            <ul className="mt-3 space-y-2">
                {items.map((item) => {
                    const open = openSlug === item.slug;

                    return (
                        <li key={item.slug} className="overflow-hidden rounded-box-sm border-2 border-black bg-white">
                            <button
                                type="button"
                                onClick={() => setOpenSlug(open ? null : item.slug)}
                                aria-expanded={open}
                                className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            >
                                <span>
                                    <span className="block text-[15px] font-semibold text-black">{item.title}</span>
                                    {!open && (
                                        <span className="mt-0.5 block text-sm text-black/60 line-clamp-2">
                                            {item.summary}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown
                                    className={`h-5 w-5 shrink-0 text-black/60 transition-transform ${open ? "rotate-180" : ""}`}
                                    aria-hidden="true"
                                />
                            </button>

                            {open && (
                                <div className="border-t-2 border-black/10 px-4 pb-4 pt-3">
                                    <ArticleBody html={item.body_html} />
                                    <div className="mt-4 border-t border-black/10 pt-3">
                                        <ArticleFeedback
                                            slug={item.slug}
                                            context="support_form"
                                            onAnswered={(helpful) => helpful && onDeflected?.(item)}
                                        />
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
