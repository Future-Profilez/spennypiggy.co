import { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiTimeLine, RiCloseLine, RiFilter3Line } from 'react-icons/ri';
import Sheet from '@/Components/Sheet';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";

/**
 * Discover's search + filter bar.
 *
 * 🚨 THE SUGGESTIONS DROPDOWN IS BACK ON. `route('discover.suggestions')` was
 * called here on every keystroke against a route that did not exist — ziggy
 * THROWS for a name it does not carry — while the markup that would have shown
 * the results sat commented out underneath. Both halves are live now, and a
 * suggestion goes straight to the creator's profile rather than re-running the
 * search: the visitor already told us who they wanted.
 *
 * ⚠️ Every suggestion link is Spenny Piggy putting a creator in front of
 * someone, so it carries the `search-recs` Discovery source. An untagged link
 * here is invisible in the report for ever.
 */
export default function TopBar({
    onSearch,
    activeFilters,
    onQuickFilter,
    initialSearch = '',
    priceBands = [],
    unlockTypes = [],
    sortOptions = [],
    interests = [],
    filters = {},
    onFilterChange,
}) {
    const [query, setQuery] = useState(initialSearch || '');
    const [isFocused, setIsFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [suggestions, setSuggestions] = useState({ creators: [], items: [] });
    const inputRef = useRef(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                setRecentSearches([]);
            }
        }
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setSuggestions({ creators: [], items: [] });
            return;
        }

        const timer = setTimeout(() => {
            window.axios
                .get(route('discover.suggestions'), { params: { q: query } })
                .then((res) => setSuggestions({
                    creators: res.data?.creators || [],
                    items: res.data?.items || [],
                }))
                .catch(() => setSuggestions({ creators: [], items: [] }));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const saveRecentSearch = (term) => {
        if (!term.trim()) return;
        const newRecent = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recent_searches', JSON.stringify(newRecent));
    };

    const handleSearchSubmit = (term) => {
        const finalTerm = term || query;
        if (finalTerm.trim()) {
            saveRecentSearch(finalTerm);
            onSearch(finalTerm);
            if (inputRef.current) inputRef.current.blur();
            setIsFocused(false);
        }
    };

    /*
     * 🚨 THE LABELS ARE THE SUPPORTER'S WORDS, THE IDS ARE OURS. Nobody arrives
     * wanting to buy "a Bill" or "a Task" — they want something unlocked now,
     * something new every month, or something made for them. The id still maps
     * to the platform's own contentType, so search, routing and the admin side
     * are untouched; only the word the visitor reads changed.
     */
    const quickFilters = [
        { id: 'trending', label: 'Trending' },
        { id: 'new', label: 'New' },
        { id: 'creators', label: 'People' },
        { id: 'wishes', label: 'Unlock now' },
        { id: 'bills', label: 'Monthly content' },
        { id: 'memberships', label: 'Membership tiers' },
        { id: 'tasks', label: 'Made for you' },
        { id: 'shops', label: 'Buy direct' },
    ];

    const chip = (active) =>
        `flex-shrink-0 px-4 py-2 rounded-box-sm text-[13px] font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
            active
                ? 'bg-[#FF007F] text-black border-black'
                : 'bg-white text-black/70 border-black/15 hover:text-black hover:border-black'
        } border`;

    const set = (patch) => onFilterChange && onFilterChange(patch);
    const activeBand = filters.priceBand || null;
    const activeUnlock = filters.unlock || null;
    const activeSort = filters.sortBy || '';
    const activeInterest = filters.interest || null;
    const appliedChips = [
        activeBand && { key: 'priceBand', label: (priceBands.find((b) => b.key === activeBand) || {}).label || activeBand },
        activeInterest && { key: 'interest', label: (interests.find((i) => i.slug === activeInterest) || {}).label || activeInterest },
        activeUnlock && { key: 'unlock', label: (unlockTypes.find((u) => u.key === activeUnlock) || {}).label || activeUnlock },
        activeSort && { key: 'sortBy', label: activeSort },
    ].filter(Boolean);
    const refinementCount = appliedChips.length;
    const hasRefinement = refinementCount > 0;

    return (
        <div className="sticky top-[63px] sm:top-[68px] md:top-[80px] z-10 bg-[#A2E4B8]/90 backdrop-blur-md pt-2 transition-all">
            <div className="container max-w-7xl mx-auto px-4 pb-0 md:pb-3 pt-3">
                <div className="relative mb-2 md:mb-3">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <RiSearchLine className="text-black/60" size={22} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 rounded-box-sm border-black bg-white focus:ring-2 focus:ring-[#FF007F]/25 focus:outline-none transition-all text-base md:text-lg font-medium text-black placeholder-black/45"
                        placeholder="Search a creator by name"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            onSearch(e.target.value);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(query)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    />

                    {isFocused && (recentSearches.length > 0 || suggestions.creators.length > 0 || suggestions.items.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-box border-black overflow-hidden z-50">
                            <div className="p-2">
                                {suggestions.creators.length > 0 && (
                                    <>
                                        <div className="px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black/50">
                                            Creators
                                        </div>
                                        {suggestions.creators.map((s) => (
                                            <Link
                                                key={`c-${s.id}`}
                                                href={discoveryLink(s.search_term, DISCOVERY_SOURCE.SEARCH_RECS)}
                                                onClick={() => saveRecentSearch(s.search_term)}
                                                className="flex min-h-[44px] items-center gap-3 rounded-box-sm px-3 py-2 hover:bg-black/[0.04]"
                                            >
                                                {s.image && (
                                                    <img
                                                        src={s.image}
                                                        alt=""
                                                        loading="lazy"
                                                        className="h-8 w-8 rounded-full object-cover"
                                                    />
                                                )}
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold text-black">{s.text}</span>
                                                    <span className="block truncate text-xs text-black/50">{s.subtext}</span>
                                                </span>
                                            </Link>
                                        ))}
                                    </>
                                )}

                                {/* ⚠️ Half the searches on a shop front are for a
                                    THING, and this dropdown could only answer
                                    "which creator". An item goes straight to its
                                    own checkout, never back into a search. */}
                                {suggestions.items.length > 0 && (
                                    <>
                                        <div className="mt-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black/50">
                                            Things to unlock
                                        </div>
                                        {suggestions.items.map((it) => (
                                            <a
                                                key={`i-${it.id}`}
                                                href={it.href}
                                                className="flex min-h-[44px] items-center gap-3 rounded-box-sm px-3 py-2 hover:bg-black/[0.04]"
                                            >
                                                {it.image && (
                                                    <img src={it.image} alt="" loading="lazy" className="h-8 w-8 rounded-box-xs object-cover" />
                                                )}
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold text-black">{it.text}</span>
                                                    <span className="block truncate text-xs text-black/50">{it.subtext}</span>
                                                </span>
                                            </a>
                                        ))}
                                    </>
                                )}

                                {recentSearches.length > 0 && !query && (
                                    <>
                                        <div className="flex items-center justify-between px-3 py-2">
                                            <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/50">Recent</div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRecentSearches([]);
                                                    localStorage.removeItem('recent_searches');
                                                }}
                                                className="text-xs font-semibold text-[#FF007F] hover:opacity-70"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {recentSearches.map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => {
                                                    setQuery(term);
                                                    handleSearchSubmit(term);
                                                }}
                                                className="flex w-full min-h-[44px] items-center gap-3 rounded-box-sm px-3 py-2 text-left hover:bg-black/[0.04]"
                                            >
                                                <RiTimeLine className="text-black/40" />
                                                <span className="truncate text-sm font-medium text-black">{term}</span>
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 🚨 ONE ROW OF CHIPS, THEN A FILTERS BUTTON — ON DESKTOP TOO.
                    This bar carried THREE rows (8 type chips + 4 price bands +
                    3 unlock types + 12 interests + a sort control): about 28
                    controls stacked above the first result, with the interest
                    row running off the right edge mid-word and no scroll
                    affordance. A filter bar taller than the thing it filters is
                    not a filter bar.

                    ⚠️ THE UNLOCK CHIPS ARE GONE FROM THE UI (the filter still
                    works on the wire). They restated the type chips in a second
                    vocabulary — "Made for you" appeared TWICE on one screen, and
                    "Unlock now"/"Instant unlock" and "Monthly content"/"Monthly"
                    were the same choice offered twice. The type chips are the
                    more precise of the two. */}
                <div className="flex items-center gap-2 pb-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
                        {onQuickFilter && Array.isArray(activeFilters) && quickFilters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => onQuickFilter(filter.id)}
                                aria-pressed={activeFilters.includes(filter.id)}
                                className={chip(activeFilters.includes(filter.id))}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setSheetOpen(true)}
                        className={`flex-shrink-0 inline-flex min-h-[40px] items-center gap-2 rounded-box-sm border px-4 text-[13px] font-semibold transition-colors ${
                            refinementCount > 0
                                ? 'border-black bg-[#FF007F] text-black'
                                : 'border-black/15 bg-white text-black/70 hover:border-black hover:text-black'
                        }`}
                    >
                        <RiFilter3Line size={18} />
                        Filters
                        {refinementCount > 0 && (
                            <span className="rounded-box-xs bg-black/15 px-1.5 text-[12px] font-bold text-black">{refinementCount}</span>
                        )}
                    </button>
                </div>

                {/* What is actually applied, in one place, each removable. Two
                    active chips in two different rows told the visitor nothing
                    about the combination they had built. */}
                {hasRefinement && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
                        {appliedChips.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => set({ [r.key]: null })}
                                className="flex-shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-box-sm border border-black bg-white px-3 text-[13px] font-semibold text-black transition-colors hover:bg-black/[0.04]"
                            >
                                {r.label}
                                <span aria-hidden>×</span>
                                <span className="sr-only">Remove filter</span>
                            </button>
                        ))}
                        <button
                            onClick={() => set({ priceBand: null, unlock: null, sortBy: null, interest: null })}
                            className="flex-shrink-0 inline-flex min-h-[36px] items-center rounded-box-sm px-2 text-[13px] font-semibold text-black/55 underline underline-offset-2 hover:text-black"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters" size="md">
                    <div className="space-y-6 pb-4">
                        <div>
                            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-black/50">Price</p>
                            <div className="flex flex-wrap gap-2">
                                {priceBands.map((b) => (
                                    <button
                                        key={b.key}
                                        onClick={() => set({ priceBand: activeBand === b.key ? null : b.key })}
                                        aria-pressed={activeBand === b.key}
                                        className={chip(activeBand === b.key)}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {interests.length > 0 && (
                            <div>
                                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-black/50">Interests</p>
                                <div className="flex flex-wrap gap-2">
                                    {interests.map((it) => (
                                        <button
                                            key={it.slug}
                                            onClick={() => set({ interest: activeInterest === it.slug ? null : it.slug })}
                                            aria-pressed={activeInterest === it.slug}
                                            className={chip(activeInterest === it.slug)}
                                        >
                                            {it.emoji ? `${it.emoji} ` : ''}{it.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-black/50">Sort</p>
                            <select
                                value={activeSort}
                                onChange={(e) => set({ sortBy: e.target.value || null })}
                                className="w-full min-h-[44px] rounded-box-sm border-black bg-white px-3 text-[14px] font-semibold text-black focus:outline-none"
                            >
                                <option value="">Trending</option>
                                {sortOptions.map((o) => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Sheet>
            </div>
        </div>
    );
}
