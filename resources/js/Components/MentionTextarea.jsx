import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

/**
 * Textarea that suggests creators while you type `@`.
 *
 * Only creators are searchable — a fan has no public creator page, so tagging
 * one would produce a link to nowhere.
 */

// Matches the handle being typed at the caret: `@` plus what follows it, with
// nothing but a boundary in front (so an email address never opens the menu).
const TRIGGER = /(?:^|[\s(])@([a-zA-Z0-9_.]{0,50})$/;

const DEBOUNCE_MS = 200;

export default function MentionTextarea({
    value,
    onChange,
    name = "content",
    maxLength,
    placeholder,
    className = "",
    rows,
    searchUrl = "/post/mention-search",
    max = 5,
}) {
    const ref = useRef(null);
    const [query, setQuery] = useState(null); // null = menu closed
    const [results, setResults] = useState([]);
    const [active, setActive] = useState(0);
    const [loading, setLoading] = useState(false);
    const anchor = useRef({ start: 0, end: 0 });

    const mentionCount = useMemo(
        () => new Set((value?.match(/(?:^|[\s(])@([a-zA-Z0-9_.]{2,50})/g) || []).map((m) => m.trim().toLowerCase())).size,
        [value],
    );

    useEffect(() => {
        if (query === null) return undefined;

        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(searchUrl, { params: { q: query } });
                if (!cancelled) {
                    setResults(data?.users || []);
                    setActive(0);
                }
            } catch {
                if (!cancelled) setResults([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, searchUrl]);

    const closeMenu = () => {
        setQuery(null);
        setResults([]);
    };

    const handleChange = (e) => {
        onChange?.(e);

        const el = e.target;
        const caret = el.selectionStart ?? el.value.length;
        const match = TRIGGER.exec(el.value.slice(0, caret));

        if (!match) {
            closeMenu();
            return;
        }

        anchor.current = { start: caret - match[1].length - 1, end: caret };
        setQuery(match[1]);
    };

    const insert = (user) => {
        const el = ref.current;
        if (!el) return;

        const { start, end } = anchor.current;
        const before = value.slice(0, start);
        const after = value.slice(end);
        const next = `${before}@${user.username} ${after}`;

        // Synthesised so the parent's existing `onChange({target:{name,value}})`
        // handler keeps working — this component owns no state of its own.
        onChange?.({ target: { name, value: next } });
        closeMenu();

        requestAnimationFrame(() => {
            const caret = before.length + user.username.length + 2;
            el.focus();
            el.setSelectionRange(caret, caret);
        });
    };

    const handleKeyDown = (e) => {
        if (query === null || results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + results.length) % results.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            insert(results[active]);
        } else if (e.key === "Escape") {
            closeMenu();
        }
    };

    const atLimit = mentionCount >= max;

    return (
        <div className="relative">
            <textarea
                ref={ref}
                name={name}
                value={value}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(closeMenu, 120)}
                className={className}
            />

            {query !== null && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-box-sm border border-gray-200 bg-white shadow-lg">
                    {loading && results.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-gray-500">Searching creators…</p>
                    ) : results.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-gray-500">
                            No creator found for “@{query}”.
                        </p>
                    ) : (
                        <>
                            {atLimit && (
                                <p className="border-b border-gray-100 px-3 py-2 text-xs font-bold text-yellow-700">
                                    You can notify {max} creators per post — extra tags stay as
                                    plain text.
                                </p>
                            )}
                            {results.map((user, i) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    // onMouseDown, not onClick: blur fires first and would
                                    // close the menu before the click ever landed.
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insert(user);
                                    }}
                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                                        i === active ? "bg-pink-50" : "bg-white"
                                    }`}
                                >
                                    <img
                                        src={user.avatar_url}
                                        alt=""
                                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-black">
                                            {user.name}
                                        </span>
                                        <span className="block truncate text-xs text-gray-500">
                                            @{user.username}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
