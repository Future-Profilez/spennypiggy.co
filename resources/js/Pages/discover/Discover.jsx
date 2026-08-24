import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { trackClientEvent } from '@/lib/analytics';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import TopBar from './components/TopBar';
import FeaturedCarousel from './components/FeaturedCarousel';
import ResultsGrid from './components/ResultsGrid';
import debounce from 'lodash/debounce';
import { DISCOVERY_SOURCE } from '@/lib/discoveryLink';
import IntroVideos from './IntrosVideos';
import TopSupporters from '../leaderboard/TopSupporters';
import DiscoverHero from './components/DiscoverHero';
import SpotlightRotator from './components/SpotlightRotator';
import RecentlyViewed from './components/RecentlyViewed';
import HowItWorks from './components/HowItWorks';
import CollectionRow from '@/Components/discovery/CollectionRow';

/**
 * Discover.
 *
 * 🚨 THE PAGE IS A SHOP FRONT, NOT A DIRECTORY. Every section below has to
 * answer a buying question — what can I afford, what do I get, has anyone
 * bought before — because a visitor who has to click a profile to find that out
 * mostly does not click.
 *
 * ⚠️ Eight identical rails read as one undifferentiated wall, so the landing
 * carries THREE — the cheapest way in, who is hot, who is new — and everything
 * else is reachable through the filter chips and the grid beneath them. Adding
 * a fourth rail is a decision, not a tidy-up.
 */

/** The result sections a search can return, in the order they are shown. */
const SEARCH_SECTIONS = [
    { key: 'creators', mode: 'creator', label: 'Creators' },
    { key: 'wishes', mode: 'wish', label: 'Wishes' },
    { key: 'bills', mode: 'bill', label: 'Bills' },
    { key: 'memberships', mode: 'membership', label: 'Memberships' },
    { key: 'tasks', mode: 'task', label: 'Tasks' },
    { key: 'shops', mode: 'shop', label: 'Shop items' },
];

const SORT_OPTIONS = ['New', 'Most Supported', 'Price: Low to High', 'Price: High to Low'];

export default function Discover(props) {
    const {
        auth,
        global_currency,
        featuredCreators,
        newVerifiedCreators,
        featuredWishes,
        budgetItems = [],
        boardCreators,
        boardItems = [],
        newItems = [],
        topEarners,
        searchResults,
        intros,
        counts = {},
        priceBands = [],
        unlockTypes = [],
        interests = [],
        interestLabel = null,
        landingCollections = [],
        filters: initialFilters,
        liveUnlocks = [],
        followedCreators = [],
        supportedCreators = [],
        collections = [],
    } = props;

    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
    const [filters, setFilters] = useState(initialFilters || {});
    const [isLoading, setIsLoading] = useState(false);

    const getActiveQuickFilters = (f) => {
        const active = [];
        if (f.type === 'new') active.push('new');
        if (f.type === 'trending') active.push('trending');
        const ct = (f.contentType || '').toLowerCase();
        if (ct) active.push(ct);
        return active;
    };

    const [activeQuickFilters, setActiveQuickFilters] = useState(getActiveQuickFilters(initialFilters || {}));
    useEffect(() => {
        setActiveQuickFilters(getActiveQuickFilters(filters));
    }, [filters]);


    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    const isSearching = !!(
        (searchQuery && searchQuery.trim().length > 0) ||
        filters.type ||
        filters.contentType
    );
    const searchLoading = isSearching && (searchResults === undefined || searchResults === null);

    /*
     * 🚨 "Load more" USED TO REPLACE THE GRID. It incremented the page and let
     * Inertia swap the props, so page 2 wiped page 1 and the visitor lost the
     * rows they were reading — and the four non-creator queries had no offset at
     * all, so page 2 was page 1 again. Pages are accumulated here, keyed on the
     * filter signature so that changing a filter starts a fresh list rather than
     * stacking unrelated results on top of each other.
     */
    const signature = useMemo(
        () => JSON.stringify({
            search: filters.search || searchQuery || '',
            type: filters.type || null,
            contentType: filters.contentType || null,
            priceBand: filters.priceBand || null,
            unlock: filters.unlock || null,
            sortBy: filters.sortBy || null,
            interest: filters.interest || null,
        }),
        [filters, searchQuery],
    );

    const [accumulated, setAccumulated] = useState({ signature: null, page: 0, sections: {} });
    const lastAppliedRef = useRef('');

    /*
     * One list, two sources. The landing page's board and the search grid are
     * the same ranked creator list with different filters, so they share the
     * accumulation path — otherwise "load more" would work on one and not the
     * other, which is exactly the kind of split that rots.
     */
    const resultsSource = isSearching ? searchResults : (boardCreators ? { creators: boardCreators } : null);

    useEffect(() => {
        if (!resultsSource) return;
        const page = Number(filters.page) || 1;
        const stamp = `${signature}|${page}`;
        if (lastAppliedRef.current === stamp) return;
        lastAppliedRef.current = stamp;

        setAccumulated((prev) => {
            const fresh = prev.signature !== signature || page <= 1;
            const sections = fresh ? {} : { ...prev.sections };

            SEARCH_SECTIONS.forEach(({ key }) => {
                const incoming = resultsSource?.[key] || [];
                if (fresh) {
                    sections[key] = incoming;
                    return;
                }
                const seen = new Set((sections[key] || []).map((i) => i.id));
                sections[key] = [...(sections[key] || []), ...incoming.filter((i) => !seen.has(i.id))];
            });

            return { signature, page, sections };
        });
    }, [resultsSource, signature, filters.page]);

    const sectionItems = (key) => accumulated.sections?.[key] || resultsSource?.[key] || [];
    const sectionTotal = (key) => Number(counts?.[key] ?? 0);
    const hasMore = (key) => sectionItems(key).length > 0 && sectionItems(key).length < sectionTotal(key);

    const applyFilters = useCallback((newFilters) => {
        const params = { ...newFilters };
        const hasSearch = params.search && params.search.trim().length > 0;
        const typeParam = params.type || null;
        const contentTypeParam = params.contentType || null;
        const page = params.page || 1;

        // Refinements ride along on every shape of the URL, so a price band
        // survives switching between "Trending" and a content-type tab.
        const refinements = {
            page,
            priceBand: params.priceBand || null,
            unlock: params.unlock || null,
            sortBy: params.sortBy || null,
            interest: params.interest || null,
        };

        let url;
        if (hasSearch) {
            url = route('discover', { search: params.search, contentType: contentTypeParam, ...refinements });
        } else if (typeParam) {
            url = route('discover', { type: typeParam, contentType: contentTypeParam, ...refinements });
        } else if (contentTypeParam) {
            url = route('discover', { type: contentTypeParam.toLowerCase(), ...refinements });
        } else {
            url = route('discover', refinements);
        }

        router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    const debouncedSearch = useCallback(
        debounce((query, currentFilters) => {
            applyFilters({ ...currentFilters, type: null, search: query, page: 1 });
        }, 300),
        [applyFilters],
    );

    /*
     * 🚨 NO QUERY TEXT, NO CREATOR, NO ITEM NAME LEAVES THIS PAGE. A search term is
     * something a person typed and can name anybody; what a funnel needs is whether
     * searching HAPPENED and whether it found anything. Length and result count
     * answer that and identify nobody. Same rule as AnalyticsParams::scrub().
     */
    const trackDiscover = (name, params = {}) => {
        try {
            trackClientEvent(name, params);
        } catch (e) {
            // Analytics must never break browsing.
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setFilters((f) => ({ ...f, search: query, page: 1 }));
        debouncedSearch(query, filters);
    };

    const handleQuickFilter = (id) => {
        const next = { ...filters, page: 1 };

        if (id === 'new' || id === 'trending') {
            next.type = filters.type === id ? null : id;
            next.contentType = null;
        } else {
            const label = id.charAt(0).toUpperCase() + id.slice(1);
            next.type = null;
            next.contentType = filters.contentType === label ? null : label;
        }

        setSearchQuery('');
        next.search = '';
        setFilters(next);
        applyFilters(next);
    };

    const handleFilterChange = (patch) => {
        Object.entries(patch).forEach(([key, value]) => {
            if (value) trackDiscover('discover_filter', { filter: key, value: String(value).slice(0, 40) });
        });
        const next = { ...filters, ...patch, page: 1 };
        setFilters(next);
        applyFilters({ ...next, search: searchQuery || '' });
    };

    const handleLoadMore = () => {
        const nextPage = (Number(filters.page) || 1) + 1;
        trackDiscover('discover_load_more', { page: nextPage });
        const next = { ...filters, page: nextPage };
        setFilters(next);
        applyFilters({ ...next, search: searchQuery || '' });
    };

    const showLanding = !isSearching;
    const showHero = !(searchQuery && searchQuery.trim()) && !filters.contentType;
    const heroCreators = (featuredCreators && featuredCreators.length) ? featuredCreators : (searchResults?.creators || []);
    const heroWishes = (featuredWishes && featuredWishes.length) ? featuredWishes : (searchResults?.wishes || []);

    /*
     * The spotlight pool: trending first, then the new creators, deduped. Built
     * from what the page already has — no extra request.
     *
     * ⚠️ It sits UNDER the banner, not inside it: the banner's drifting face
     * wall is its design and stays (client direction, 24 Aug 2026).
     */
    const spotlightCreators = useMemo(() => {
        const seen = new Set();
        return [...(featuredCreators || []), ...(newVerifiedCreators || [])].filter((c) => {
            if (!c?.username || seen.has(c.username)) return false;
            seen.add(c.username);
            return true;
        });
    }, [featuredCreators, newVerifiedCreators]);

    // One event per settled search, not one per keystroke: the debounce means a
    // props change is a completed search.
    const searchedRef = useRef('');
    useEffect(() => {
        const term = (filters.search || '').trim();
        if (!term || searchedRef.current === signature) return;
        searchedRef.current = signature;
        trackDiscover('discover_search', {
            term_length: term.length,
            results: SEARCH_SECTIONS.reduce((n, { key }) => n + sectionTotal(key), 0),
        });
    }, [signature, counts]);

    /*
     * 🚨 "NO MATCHES" IS NOT AN ANSWER, IT IS A DEAD END. A visitor who has stacked
     * an interest, a price band and an unlock type onto a search cannot tell which
     * one emptied the page, and "try adjusting your search" asks them to guess. Each
     * active refinement is listed with its own remove control, and the primary
     * button drops the NARROWEST one — the last thing that could have emptied it —
     * rather than clearing everything they chose.
     */
    const activeRefinements = useMemo(() => {
        const out = [];
        if (filters.interest) {
            const it = interests.find((i) => i.slug === filters.interest);
            out.push({ key: 'interest', label: it ? it.label : filters.interest });
        }
        if (filters.priceBand) {
            const band = priceBands.find((b) => b.key === filters.priceBand);
            out.push({ key: 'priceBand', label: band ? band.label : filters.priceBand });
        }
        if (filters.unlock) {
            const u = unlockTypes.find((x) => x.key === filters.unlock);
            out.push({ key: 'unlock', label: u ? u.label : filters.unlock });
        }
        if (filters.contentType) out.push({ key: 'contentType', label: filters.contentType });
        return out;
    }, [filters, interests, priceBands, unlockTypes]);

    const emptySearch = isSearching && !searchLoading && SEARCH_SECTIONS.every(({ key }) => sectionItems(key).length === 0);

    return (
        <Authenticated auth={auth?.user || ''}>
            <Head title={"Seek & Search"} />

            <div className="min-h-dvh bg-[#A2E4B8]">
                {showHero && (
                    <DiscoverHero
                        featuredCreators={heroCreators}
                        newVerifiedCreators={newVerifiedCreators}
                        topEarners={topEarners}
                        featuredWishes={heroWishes}
                        liveUnlocks={liveUnlocks}
                        onExplore={() => handleQuickFilter('creators')}
                    />
                )}

                <TopBar
                    onSearch={handleSearch}
                    initialSearch={searchQuery}
                    activeFilters={activeQuickFilters}
                    onQuickFilter={handleQuickFilter}
                    priceBands={priceBands}
                    unlockTypes={unlockTypes}
                    sortOptions={SORT_OPTIONS}
                    interests={interests}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                {/* ⚠️ Filtering rewrites the grid with no visible change of context
                    for a screen-reader user — the count is the only thing that says
                    the page responded, so it is announced. `polite`, never
                    `assertive`: this interrupts nothing. */}
                <p className="sr-only" role="status" aria-live="polite">
                    {isLoading
                        ? 'Loading results'
                        : `${SEARCH_SECTIONS.reduce((n, { key }) => n + sectionItems(key).length, 0)} results shown`}
                </p>

                <div className="container max-w-7xl mx-auto px-4 pb-28 pt-0 md:pb-6 md:pt-6 relative z-0">
                    <div className={`min-w-0 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {showLanding && (
                            <>
                                {/* Sells to someone who has done nothing but
                                    arrive: a real listing, a real price, and a
                                    different creator every six seconds. */}
                                <SpotlightRotator creators={spotlightCreators} className="mb-8 mt-5" />

                                {/* 🚨 What this visitor already chose comes before
                                    what we chose for them. A supporter who
                                    follows six creators does not need to be sold
                                    the trending rail first. Guests have neither
                                    row and the page starts at the price rail. */}
                                {followedCreators.length > 0 && (
                                    <FeaturedCarousel
                                        title="Creators you follow"
                                        kicker="Your list"
                                        subtitle="What the people you follow have on sale right now."
                                        items={followedCreators}
                                        type="creator"
                                        discoverySource={DISCOVERY_SOURCE.PERSONALISED}
                                    />
                                )}

                                {supportedCreators.length > 0 && (
                                    <FeaturedCarousel
                                        title="You've supported these"
                                        kicker="Bought before"
                                        subtitle="Back for more — here's what's new from them."
                                        items={supportedCreators}
                                        type="creator"
                                        discoverySource={DISCOVERY_SOURCE.PERSONALISED}
                                    />
                                )}

                                <RecentlyViewed
                                    excludeUsernames={[
                                        ...followedCreators.map((c) => c.username),
                                        ...supportedCreators.map((c) => c.username),
                                    ]}
                                />

                                {/* The cheapest way in comes first: "what can I
                                    afford" is the first-time supporter's question,
                                    and no rail on this page used to answer it. */}
                                {budgetItems.length > 0 && (
                                    <section className="mb-10">
                                        <div className="mb-5">
                                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF007F]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" />
                                                Cheapest way in
                                            </span>
                                            <h2 className="mt-1 font-anton text-xl uppercase tracking-wide text-black sm:text-2xl md:text-3xl">
                                                Under £10 to unlock
                                            </h2>
                                            <p className="mt-1.5 max-w-xl text-[13px] font-medium leading-snug text-black/60">
                                                Buy once and it unlocks straight away.
                                            </p>
                                        </div>
                                        <ResultsGrid
                                            global_currency={global_currency}
                                            auth={auth}
                                            results={budgetItems.slice(0, 10)}
                                            mode="mixed"
                                            total={0}
                                            hasMore={false}
                                            loading={isLoading}
                                            onClearFilters={() => handleFilterChange({ priceBand: null, unlock: null, sortBy: null, interest: null })}
                                        />
                                    </section>
                                )}

                                {/* 🚨 THINGS BEFORE PEOPLE. A supporter does not buy
                                    a creator, they buy something a creator made —
                                    and this page opened with two rails of accounts
                                    and a grid of accounts. */}
                                {newItems.length > 0 && (
                                    <section className="mb-10">
                                        <div className="mb-5 flex items-end justify-between gap-4">
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF007F]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" />
                                                    Just added
                                                </span>
                                                <h2 className="mt-1 font-anton text-xl uppercase tracking-wide text-black sm:text-2xl md:text-3xl">
                                                    New things to unlock
                                                </h2>
                                                <p className="mt-1.5 max-w-xl text-[13px] font-medium leading-snug text-black/60">
                                                    Fresh from every creator — content, monthly streams, and work made to order.
                                                </p>
                                            </div>
                                        </div>
                                        <ResultsGrid
                                            global_currency={global_currency}
                                            auth={auth}
                                            results={newItems.slice(0, 10)}
                                            mode="mixed"
                                            total={0}
                                            hasMore={false}
                                            loading={isLoading}
                                            onClearFilters={() => handleFilterChange({ priceBand: null, unlock: null, sortBy: null, interest: null })}
                                        />
                                    </section>
                                )}

                                {featuredCreators && featuredCreators.length > 0 && (
                                    <FeaturedCarousel
                                        title="Trending creators"
                                        kicker="Most clicked today"
                                        subtitle="The creators people are backing right now."
                                        items={featuredCreators}
                                        type="creator"
                                        discoverySource={DISCOVERY_SOURCE.TRENDING}
                                    />
                                )}

                                {newVerifiedCreators && newVerifiedCreators.length > 0 && (
                                    <FeaturedCarousel
                                        title="New and verified"
                                        kicker="Just joined"
                                        subtitle="Verified by us and only starting out — be one of their first supporters."
                                        items={newVerifiedCreators}
                                        type="creator"
                                        discoverySource={DISCOVERY_SOURCE.NEW_CREATORS}
                                    />
                                )}

                                {/* Selections nothing else on the page makes:
                                    hidden gems (least SHOWN, never least earning)
                                    and pots close to their goal. They existed since
                                    Phase 5 and only ever rendered on a failed search
                                    — the one moment the visitor is already annoyed. */}
                                {landingCollections.map((collection) => (
                                    <CollectionRow key={collection.key} collection={collection} className="mb-10" />
                                ))}

                                {!auth?.user && <HowItWorks />}
                                <TopSupporters grid={true} />
                                <div className="mb-8">
                                    <IntroVideos intros={intros} onSeeMore={() => handleQuickFilter('creators')} showAll={false} />
                                </div>
                            </>
                        )}

                        {isSearching && searchLoading && (
                            <div className="space-y-12 py-10">
                                <div className="h-8 w-64 bg-black/5 animate-pulse border border-black/10 rounded-box-sm" />
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Array(4).fill(0).map((_, i) => (
                                        <div key={i} className="h-64 bg-black/5 animate-pulse border border-black/10 rounded-box" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {isSearching && !searchLoading && (
                            <div className="space-y-12">
                                {SEARCH_SECTIONS.map(({ key, mode, label }) => {
                                    const items = sectionItems(key);
                                    if (!items.length) return null;

                                    return (
                                        <section key={key} className="pb-6">
                                            <ResultsGrid
                                                heading={label}
                                                global_currency={global_currency}
                                                auth={auth}
                                                results={items}
                                                mode={mode}
                                                total={sectionTotal(key)}
                                                hasMore={hasMore(key)}
                                                loading={isLoading}
                                                onLoadMore={handleLoadMore}
                                                onClearFilters={() => {
                                                    setSearchQuery('');
                                                    setFilters({});
                                                    router.get(route('discover'), {}, { preserveScroll: true });
                                                }}
                                            />
                                        </section>
                                    );
                                })}

                                {emptySearch && (
                                    <>
                                        <div className="rounded-box border border-dashed border-black/15 bg-white px-6 py-12 text-center">
                                            <h3 className="font-anton text-xl uppercase text-black">No matches</h3>
                                            <p className="mt-2 text-black/70">
                                                {activeRefinements.length > 0
                                                    ? 'Nothing matches all of these at once.'
                                                    : searchQuery
                                                        ? `Nothing here matches “${searchQuery}”.`
                                                        : 'Nothing to show here yet.'}
                                            </p>

                                            {activeRefinements.length > 0 && (
                                                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                                    {activeRefinements.map((r) => (
                                                        <button
                                                            key={r.key}
                                                            onClick={() => handleFilterChange({ [r.key]: null })}
                                                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-box-sm border border-black/15 bg-white px-3 text-[13px] font-semibold text-black transition-colors hover:border-black"
                                                        >
                                                            {r.label}
                                                            <span aria-hidden>×</span>
                                                            <span className="sr-only">Remove this filter</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                                {activeRefinements.length > 0 && (
                                                    <button
                                                        onClick={() => handleFilterChange({
                                                            [activeRefinements[activeRefinements.length - 1].key]: null,
                                                        })}
                                                        className="inline-flex min-h-[44px] items-center rounded-box-sm bg-[#FF007F] px-6 font-bold text-black transition-all hover:brightness-110 active:brightness-95"
                                                    >
                                                        Drop “{activeRefinements[activeRefinements.length - 1].label}”
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setFilters({});
                                                        router.get(route('discover'), {}, { preserveScroll: true });
                                                    }}
                                                    className="inline-flex min-h-[44px] items-center rounded-box-sm border-black bg-white px-6 font-bold text-black transition-all hover:brightness-105"
                                                >
                                                    Start again
                                                </button>
                                            </div>
                                        </div>

                                        {/* 🚨 A SEARCH THAT FINDS NOTHING IS THE WORST DEAD END
                                            ON THE PLATFORM. That visitor came looking for
                                            something specific and was told to "try adjusting
                                            your search" — an instruction to work harder with no
                                            idea what would work. Each row drops itself when it
                                            is empty, so a quiet week costs a row rather than
                                            stacking a second empty state under the first. */}
                                        {collections.map((collection) => (
                                            <CollectionRow key={collection.key} collection={collection} className="mt-8" />
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {showLanding && boardItems.length > 0 && (
                            <ResultsGrid
                                heading={interestLabel ? `${interestLabel} creators’ listings` : 'Everything for sale'}
                                global_currency={global_currency}
                                auth={auth}
                                results={boardItems}
                                mode="mixed"
                                total={SEARCH_SECTIONS.filter((s) => s.key !== 'creators').reduce((n, { key }) => n + sectionTotal(key), 0)}
                                hasMore={false}
                                loading={isLoading}
                                onClearFilters={() => handleFilterChange({ priceBand: null, unlock: null, sortBy: null, interest: null })}
                            />
                        )}

                        {/* People, under the goods — and reachable directly from
                            the "People" chip, which renders the creator grid. */}
                        {showLanding && sectionItems('creators').length > 0 && (
                            <div className="mt-12">
                                <ResultsGrid
                                    heading={interestLabel ? `${interestLabel} creators` : 'Creators to follow'}
                                    global_currency={global_currency}
                                    auth={auth}
                                    results={sectionItems('creators')}
                                    mode="creator"
                                    total={sectionTotal('creators')}
                                    hasMore={hasMore('creators')}
                                    loading={isLoading}
                                    onLoadMore={handleLoadMore}
                                    onClearFilters={() => handleFilterChange({ priceBand: null, unlock: null, sortBy: null, interest: null })}
                                />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
