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
    const mirrorRef = useRef(null);
    const [query, setQuery] = useState(null); // null = menu closed
    const [results, setResults] = useState([]);
    const [active, setActive] = useState(0);
    const [loading, setLoading] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, flip: false });
    const anchor = useRef({ start: 0, end: 0 });

    /** Height the menu is allowed to take; also the flip threshold. */
    const MENU_MAX = 256;

    /**
     * Where the caret actually is, in pixels inside the textarea.
     *
     * ⚠️ The menu used to have no `top` at all, so it fell into normal flow and
     * rendered at the BOTTOM of the box. That was survivable at 150px tall; in
     * the full-page composer the textarea is 280px, and the suggestions appeared
     * a third of a screen below the word being typed — far enough that they read
     * as belonging to something else entirely, and far enough to be clipped by
     * the composer sheet's `overflow-hidden`.
     *
     * Measured with a mirror element rather than by counting newlines: lines
     * WRAP, so a line count puts the menu on the wrong row the moment someone
     * writes a real sentence.
     */
    const measureCaret = () => {
        const ta = ref.current;
        const mirror = mirrorRef.current;
        if (!ta || !mirror) return;

        const cs = window.getComputedStyle(ta);
        [
            "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
            "lineHeight", "textTransform", "wordSpacing", "textIndent",
            "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
            "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
            "boxSizing",
        ].forEach((p) => {
            mirror.style[p] = cs[p];
        });
        mirror.style.width = `${ta.clientWidth}px`;

        mirror.textContent = ta.value.slice(0, ta.selectionStart);
        const marker = document.createElement("span");
        marker.textContent = "​";
        mirror.appendChild(marker);

        const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
        const caretTop = marker.offsetTop - ta.scrollTop;
        // Below the caret's own line, so the menu never covers what is being typed.
        const below = caretTop + lineHeight + 4;
        const flip = below + MENU_MAX > ta.clientHeight && caretTop > MENU_MAX;

        setMenuPos({ top: flip ? caretTop - 4 : below, flip });
    };

    // Re-measured on every keystroke that keeps the menu open: the caret moves.
    useEffect(() => {
        if (query !== null) measureCaret();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, value]);

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

            {/* Hidden twin of the textarea, used only to find the caret. Kept in
                the DOM rather than built per keystroke so the browser is not
                asked to re-resolve fonts on every character. */}
            <div
                ref={mirrorRef}
                aria-hidden="true"
                className="pointer-events-none invisible absolute left-0 top-0 -z-10 whitespace-pre-wrap break-words"
            />

            {query !== null && (
                <div
                    style={
                        menuPos.flip
                            ? { bottom: `calc(100% - ${menuPos.top}px)` }
                            : { top: `${menuPos.top}px` }
                    }
                    className="absolute left-0 z-30 max-h-64 w-full max-w-[360px] overflow-y-auto rounded-box-sm border-2 border-black bg-white "
                >
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
                                        <span title={user.name} className="block truncate text-sm font-bold text-black">
                                            {user.name}
                                        </span>
                                        <span title={`@${user.username}`} className="block truncate text-xs text-gray-500">
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
