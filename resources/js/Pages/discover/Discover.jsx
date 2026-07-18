import { useState, useEffect, useCallback } from "react";
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import TopBar from './components/TopBar';
import FeaturedCarousel from './components/FeaturedCarousel';
import ResultsGrid from './components/ResultsGrid';
import debounce from 'lodash/debounce';
import { 
    FlameIcon, 
    CircleCheckIcon, 
    PoundSterlingIcon
} from "@animateicons/react/lucide";
import { Gift } from "lucide-react";
import IntroVideos from './IntrosVideos';
import TopSupporters from '../leaderboard/TopSupporters';
import DiscoverHero from './components/DiscoverHero';

export default function Discover(props) {
    
    const { auth, global_currency, featuredCreators, newVerifiedCreators, featuredWishes, topEarners, featuredBills, featuredMemberships, featuredTasks, featuredShops, searchResults, intros, filters: initialFilters } = props;
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
    const [filters, setFilters] = useState(initialFilters || {});
    
    const getActiveQuickFilters = () => {
        const active = [];
        if (filters.type === 'new') active.push('new');
        if (filters.type === 'trending') active.push('trending');
        if ((filters.contentType || '').toLowerCase() === 'creators') active.push('creators');
        if ((filters.contentType || '').toLowerCase() === 'wishes') active.push('wishes');
        if ((filters.contentType || '').toLowerCase() === 'bills') active.push('bills');
        if ((filters.contentType || '').toLowerCase() === 'memberships') active.push('memberships');
        if ((filters.contentType || '').toLowerCase() === 'tasks') active.push('tasks');
        if ((filters.contentType || '').toLowerCase() === 'shops') active.push('shops');
        return active;
    };

    const [activeQuickFilters, setActiveQuickFilters] = useState(getActiveQuickFilters());
    useEffect(() => {
        setActiveQuickFilters(getActiveQuickFilters());
    }, [filters]);
    
    const [viewMode, setViewMode] = useState(() => {
        const ct = initialFilters?.contentType;
        if (ct === 'Wishes') return 'wish';
        if (ct === 'Bills') return 'bill';
        if (ct === 'Memberships') return 'membership';
        if (ct === 'Tasks') return 'task';
        if (ct === 'Shops') return 'shop';
        return 'creator';
    });

    const [isLoading, setIsLoading] = useState(false);
    const updateContentTypeUrl = (ct, currentFilters) => {
        const url = new URL(window.location.href);
        const type = currentFilters?.type;
        
        let path = '/discover';
        if (type) {
            path += `/${type.toLowerCase()}`;
            if (ct) url.searchParams.set('contentType', ct);
            else url.searchParams.delete('contentType');
        } else if (ct) {
            path += `/${ct.toLowerCase()}`;
            url.searchParams.delete('contentType');
        } else {
            url.searchParams.delete('contentType');
        }
        
        url.pathname = path;
        url.searchParams.delete('page');
        window.history.replaceState({}, '', url.toString());
    };

    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            removeStart();
            removeFinish();
        };
    }, []);
    
    const isSearching = (() => {
        const hasQuery = !!(searchQuery && searchQuery.trim().length > 0);
        const hasTypeSelection = !!(filters.type);
        const hasContentTypeSelection = !!(filters.contentType);
        return hasQuery || hasTypeSelection || hasContentTypeSelection;
    })();

    // Handle loading state for lazy props
    const searchLoading = isSearching && (searchResults === undefined || searchResults === null);
    const shouldUseFeaturedForType = !!filters.type && !filters.contentType && !(searchQuery && searchQuery.trim().length > 0);
    const displayedTasks = shouldUseFeaturedForType && !(searchResults?.tasks?.length)
        ? (featuredTasks || [])
        : (searchResults?.tasks || []);
    const displayedShops = shouldUseFeaturedForType && !(searchResults?.shops?.length)
        ? (featuredShops || [])
        : (searchResults?.shops || []);

    const results = isSearching 
        ? (searchResults || [])
        : (
            viewMode === 'creator' ? (featuredCreators || []) :
            viewMode === 'wish' ? (featuredWishes || []) :
            viewMode === 'bill' ? (featuredBills || []) :
            viewMode === 'membership' ? (featuredMemberships || []) :
            (featuredCreators || [])
        );

    const applyFilters = useCallback((newFilters) => {
        const params = { ...newFilters };
        const hasSearch = params.search && params.search.trim().length > 0;
        const typeParam = params.type || null;
        const page = params.page || 1;
        const contentTypeParam = params.contentType || null;
        
        let url;
        if (hasSearch) {
            url = route('discover', { search: params.search, page, contentType: contentTypeParam });
        } else if (typeParam) {
            url = route('discover', { type: typeParam, page, contentType: contentTypeParam });
        } else if (contentTypeParam && ['creators', 'wishes', 'bills', 'memberships', 'tasks', 'shops'].includes(contentTypeParam.toLowerCase())) {
             url = route('discover', { type: contentTypeParam.toLowerCase(), page });
        } else {
            url = route('discover', { page, contentType: contentTypeParam });
        }
        
        const onlyProps = [];
        if (contentTypeParam && !hasSearch && !typeParam) {
            onlyProps.push('filters','searchResults');
        }
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            ...(onlyProps.length > 0 ? { only: onlyProps } : {})
        });
    }, []);

    const debouncedSearch = useCallback(
        debounce((query, currentFilters) => {
            applyFilters({
                type: null,
                search: query,
                page: 1,
                contentType: currentFilters.contentType || null
            });
        }, 300),
        [applyFilters]
    );

    const handleSearch = (query) => {
        setSearchQuery(query);
        debouncedSearch(query, filters);
    };
    
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        applyFilters({
            type: filters.type || null,
            search: searchQuery || '',
            page: 1,
            contentType: filters.contentType || null
        });
    }
    
    const handleFilterUpdate = (newFiltersOrUpdater) => {
        let updatedFilters;
        if (typeof newFiltersOrUpdater === 'function') {
            updatedFilters = newFiltersOrUpdater(filters);
        } else {
            updatedFilters = newFiltersOrUpdater;
        }
        setFilters(updatedFilters);
        applyFilters({
            type: updatedFilters.type || null,
            search: searchQuery || '',
            page: updatedFilters.page || 1,
            contentType: updatedFilters.contentType || null
        });
    };
    
    const handleQuickFilter = (id) => {
        let newFilters = { ...filters };
        switch(id) {
            case 'new':
                // Clear contentType, set type
                newFilters = { type: newFilters.type === 'new' ? null : 'new', contentType: null, page: 1 };
                setSearchQuery('');
                break;
            case 'trending':
                // Clear contentType, set type
                newFilters = { type: newFilters.type === 'trending' ? null : 'trending', contentType: null, page: 1 };
                setSearchQuery('');
                break;
            case 'creators':
                // Clear type, set contentType
                newFilters = { type: null, contentType: (newFilters.contentType === 'Creators' ? null : 'Creators'), page: 1 };
                setSearchQuery('');
                setViewMode('creator');
                break;
            case 'wishes':
                // Clear type, set contentType
                newFilters = { type: null, contentType: (newFilters.contentType === 'Wishes' ? null : 'Wishes'), page: 1 };
                setSearchQuery('');
                setViewMode('wish');
                break;
            case 'bills':
                // Clear type, set contentType
                newFilters = { type: null, contentType: (newFilters.contentType === 'Bills' ? null : 'Bills'), page: 1 };
                setSearchQuery('');
                setViewMode('bill');
                break;
            case 'memberships':
                // Clear type, set contentType
                newFilters = { type: null, contentType: (newFilters.contentType === 'Memberships' ? null : 'Memberships'), page: 1 };
                setSearchQuery('');
                setViewMode('membership');
                break;
            case 'tasks':
                // Clear type, set contentType
                newFilters = { type: null, contentType: (newFilters.contentType === 'Tasks' ? null : 'Tasks'), page: 1 };
                setSearchQuery('');
                setViewMode('task');
                break;
            case 'shops':
                // Clear type, set contentType
                newFilters = { type: null, contentType: (newFilters.contentType === 'Shops' ? null : 'Shops'), page: 1 };
                setSearchQuery('');
                setViewMode('shop');
                break;
            default:
                break;
        }
        setFilters(newFilters);
        applyFilters(newFilters);
    };
    
    const handleLoadMore = () => {
        const nextPage = (filters.page || 1) + 1;
        const newFilters = { ...filters, page: nextPage };
        setFilters(newFilters);
        applyFilters({
            type: newFilters.type || null,
            search: searchQuery || '',
            page: nextPage
        });
    };

    return (
        <Authenticated auth={auth?.user || ''} >
            <Head title={"Seek & Search"} />
            
            <div className="min-h-screen bg-[#A2E4B8]">

                {/* Hero shows on landing + trending/new browse states (not keyword search
                    or a specific content-type tab). Falls back to searchResults when the
                    backend serves the trending grid instead of featured carousels. */}
                {!(searchQuery && searchQuery.trim()) && !filters.contentType && (
                    <DiscoverHero
                        featuredCreators={(featuredCreators && featuredCreators.length) ? featuredCreators : (searchResults?.creators || [])}
                        newVerifiedCreators={newVerifiedCreators}
                        topEarners={topEarners}
                        featuredWishes={(featuredWishes && featuredWishes.length) ? featuredWishes : (searchResults?.wishes || [])}
                        onExplore={() => handleQuickFilter('creators')}
                    />
                )}

                <TopBar
                    onSearch={handleSearch}
                    initialSearch={searchQuery}
                    activeFilters={activeQuickFilters}
                    onQuickFilter={handleQuickFilter}
                />

                <div className="container max-w-7xl mx-auto px-4 pb-6 pt-0 md:pb-6 md:pt-6 relative z-0">
                    <div className={`min-w-0 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {!isSearching && (
                            <>
                                {(!filters.contentType || filters.contentType === 'All') && (
                                    <>
                                        {featuredWishes && featuredWishes.length > 0 && (
                                            <FeaturedCarousel 
                                                title="Wishes Trending Now 🎁" 
                                                items={featuredWishes} 
                                                type="wish"
                                                icon={<Gift />}
                                            />
                                        )}
                                    </>
                                )}
                                
                                {(filters.contentType === 'Creators' || !filters.contentType || filters.contentType === 'All') && (
                                    <div className="space-y-2 mb-8">
                                        {featuredCreators && featuredCreators.length > 0 && (
                                            <FeaturedCarousel 
                                                title="Trending Creators 🔥" 
                                                items={featuredCreators} 
                                                type="creator"
                                                icon={<FlameIcon />}
                                            />
                                        )}
                                        {newVerifiedCreators && newVerifiedCreators.length > 0 && (
                                            <FeaturedCarousel 
                                                title="New & Verified 🆕" 
                                                items={newVerifiedCreators} 
                                                type="creator"
                                                icon={<CircleCheckIcon />}
                                            />
                                        )}
                                        
                                        {topEarners && topEarners.length > 0 && (
                                            <FeaturedCarousel 
                                                title="Top Earners This Week 💰" 
                                                items={topEarners} 
                                                type="creator"
                                                icon={<PoundSterlingIcon />}
                                            />
                                        )}
                                    </div>
                                )}

                                {(!filters.contentType || filters.contentType === 'All') && (
                                    <>
                                        <div className="">
                                            <TopSupporters grid={true} />
                                        </div>
                                        <div className="mb-8">
                                             <IntroVideos intros={intros} onSeeMore={() => handleQuickFilter('creators')} showAll={filters.contentType === 'Creators'} />
                                         </div>
                                    </>
                                )}

                                {filters.contentType === 'Wishes' && featuredWishes && featuredWishes.length > 0 && (
                                    <FeaturedCarousel 
                                        title="Wishes Trending Now 🎁" 
                                        items={featuredWishes} 
                                        type="wish"
                                        icon={<Gift />}
                                    />
                                )}

                                {(filters.contentType === 'Bills' || (!filters.contentType && filters.contentType !== 'Creators')) && featuredBills && featuredBills.length > 0 && (
                                    <FeaturedCarousel 
                                        title="Featured Bills" 
                                        items={featuredBills} 
                                        type="bill"
                                        icon={<Gift />}
                                    />
                                )}

                                {(filters.contentType === 'Memberships' || (!filters.contentType && filters.contentType !== 'Creators')) && featuredMemberships && featuredMemberships.length > 0 && (
                                    <FeaturedCarousel 
                                        title="Featured Memberships" 
                                        items={featuredMemberships} 
                                        type="membership"
                                        icon={<Gift />}
                                    />
                                )}

                                {(filters.contentType === 'Tasks' || (!filters.contentType && filters.contentType !== 'Creators')) && featuredTasks && featuredTasks.length > 0 && (
                                    <FeaturedCarousel 
                                        title="Featured Tasks" 
                                        items={featuredTasks} 
                                        type="task"
                                        icon={<Gift />}
                                    />
                                )}

                                {(filters.contentType === 'Shops' || (!filters.contentType && filters.contentType !== 'Creators')) && featuredShops && featuredShops.length > 0 && (
                                    <FeaturedCarousel 
                                        title="Featured Shop Items" 
                                        items={featuredShops} 
                                        type="shop"
                                        icon={<Gift />}
                                    />
                                )}
                            </>
                        )}



                        {isSearching ? (
                            searchLoading ? (
                                <div className="space-y-12 py-10">
                                    <div className="h-8 w-64 bg-black/5 animate-pulse border border-black/10 rounded-[20px]" />
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {Array(4).fill(0).map((_, i) => (
                                            <div key={i} className="h-64 bg-black/5 animate-pulse border border-black/10 rounded-[30px]" />
                                        ))}
                                    </div>
                                </div>
                            ) : searchResults ? (
                                <div className="space-y-12">
                                {searchResults.creators && searchResults.creators.length > 0 && (
                                        <div className="pb-6 mt-5">
                                            <h2 className=" text-2xl text-black font-gulfs uppercase text-black"><span className="text-pink">Creators</span> : Showing  {searchResults.creators.length} Results</h2>
                                            {filters.type === 'trending' && (
                                                <p className="text-gray-700">Trending creators are selected based on their recent activity, supporter engagement, and overall popularity on the platform.</p>
                                            )}
                                            {filters.type === 'new' && (
                                                <p className="text-gray-700">Fresh faces just joining the platform. Be one of their first supporters!</p>
                                            )}
                                            {searchQuery && (
                                                <p className="text-gray-700">Found these creators matching your search terms "{searchQuery}".</p>
                                            )}
                                            {filters.contentType === 'Creators' && !filters.type && !searchQuery && (
                                                <p className="text-gray-700">Explore our diverse community of creators.</p>
                                            )}
                                            <ResultsGrid  global_currency={global_currency} auth={auth}
                                                results={searchResults.creators}
                                                mode="creator"
                                                totalCount={searchResults.creators.length}
                                                activeFilters={{}}
                                                removeFilter={() => {}}
                                                onLoadMore={handleLoadMore}
                                            />
                                        </div>
                                    )}

                                    {searchResults.wishes && searchResults.wishes.length > 0 && (
                                        <div className="pb-6 ">
                                            <h2 className="text-2xl text-black !mt-8 mb-0 font-gulfs uppercase text-black"><span className="text-pink">WishLists</span> : Showing  {searchResults.wishes.length} Results</h2>
                                            {filters.type === 'trending' && (
                                                <p className="text-gray-700 mt-0">These wishes are currently receiving the most attention and support from the community.</p>
                                            )}
                                            {filters.type === 'new' && (
                                                <p className="text-gray-700 mt-0">Recently added wishes from creators.</p>
                                            )}
                                            {searchQuery && (
                                                <p className="text-gray-700 mt-0">Wishes matching your search criteria "{searchQuery}".</p>
                                            )}
                                            {filters.contentType === 'Wishes' && !filters.type && !searchQuery && (
                                                <p className="text-gray-700 mt-0">Browse through wishes from various creators.</p>
                                            )}
                                            <ResultsGrid 
                                                results={searchResults.wishes}
                                                mode="wish"
                                                totalCount={searchResults.wishes.length}
                                                activeFilters={{}}
                                                removeFilter={() => {}}
                                                onLoadMore={handleLoadMore}
                                            />
                                        </div>
                                    )}

                                    {(!filters.contentType || filters.contentType === 'All' || filters.contentType === 'Creators') && (
                                         <div className="mb-4">
                                             <IntroVideos intros={intros} onSeeMore={() => handleQuickFilter('creators')} showAll={filters.contentType === 'Creators'} />
                                         </div>
                                     )}

                                    {searchResults.bills && searchResults.bills.length > 0 && (
                                        <div className="pb-8 ">
                                            <h2 className="text-2xl text-black font-gulfs uppercase text-black"><span className="text-pink">Bills</span> : Showing  {searchResults.bills.length} Results</h2>
                                            {filters.type === 'trending' && (
                                                <p className="text-gray-700 mt-0">Bills that are urgently seeking support or have high community interest right now.</p>
                                            )}
                                            {filters.type === 'new' && (
                                                <p className="text-gray-700 mt-0">Latest bills posted by creators needing support.</p>
                                            )}
                                            {searchQuery && (
                                                <p className="text-gray-700 mt-0">Bills matching your search "{searchQuery}".</p>
                                            )}
                                            {filters.contentType === 'Bills' && !filters.type && !searchQuery && (
                                                <p className="text-gray-700 mt-0">Support creators by helping with their bills.</p>
                                            )}
                                            <ResultsGrid 
                                                results={searchResults.bills}
                                                mode="bill"
                                                totalCount={searchResults.bills.length}
                                                activeFilters={{}}
                                                removeFilter={() => {}}
                                                onLoadMore={handleLoadMore}
                                            />
                                        </div>
                                    )}

                                    {searchResults.memberships && searchResults.memberships.length > 0 && (
                                        <div className="pb-6 ">
                                            <h2 className="text-2xl  text-black font-gulfs uppercase text-black"><span className="text-pink">Memberships</span> : Showing  {searchResults.memberships.length} Results</h2>
                                            {filters.type === 'trending' && (
                                                <p className="text-gray-700 mt-0">The most popular membership tiers offering exclusive perks and content.</p>
                                            )}
                                            {filters.type === 'new' && (
                                                <p className="text-gray-700 mt-0">Newest membership tiers available.</p>
                                            )}
                                            {searchQuery && (
                                                <p className="text-gray-700 mt-0">Membership tiers matching your search "{searchQuery}".</p>
                                            )}
                                            {filters.contentType === 'Memberships' && !filters.type && !searchQuery && (
                                                <p className="text-gray-700 mt-0">Exclusive membership options.</p>
                                            )}
                                            <ResultsGrid 
                                                results={searchResults.memberships}
                                                mode="membership"
                                                totalCount={searchResults.memberships.length}
                                                activeFilters={{}}
                                                removeFilter={() => {}}
                                                onLoadMore={handleLoadMore}
                                            />
                                        </div>
                                    )}

                                    {displayedTasks && displayedTasks.length > 0 && (
                                        <div className="pb-6 ">
                                            <h2 className="text-2xl  text-black font-gulfs uppercase text-black"><span className="text-pink">Tasks</span> : Showing  {displayedTasks.length} Results</h2>
                                            {filters.contentType === 'Tasks' && !filters.type && !searchQuery && (
                                                <p className="text-gray-700 mt-0">Explore featured tasks.</p>
                                            )}
                                            <ResultsGrid 
                                                results={displayedTasks}
                                                mode="task"
                                                totalCount={displayedTasks.length}
                                                activeFilters={{}}
                                                removeFilter={() => {}}
                                                onLoadMore={handleLoadMore}
                                            />
                                        </div>
                                    )}

                                    {displayedShops && displayedShops.length > 0 && (
                                        <div className="pb-6 ">
                                            <h2 className="text-2xl  text-black font-gulfs uppercase text-black"><span className="text-pink">Shop Items</span> : Showing  {displayedShops.length} Results</h2>
                                            {filters.contentType === 'Shops' && !filters.type && !searchQuery && (
                                                <p className="text-gray-700 mt-0">Explore featured shop items.</p>
                                            )}
                                            <ResultsGrid 
                                                results={displayedShops}
                                                mode="shop"
                                                totalCount={displayedShops.length}
                                                activeFilters={{}}
                                                removeFilter={() => {}}
                                                onLoadMore={handleLoadMore}
                                            />
                                        </div>
                                    )}

                                    {(!searchResults.creators?.length && !searchResults.wishes?.length && !searchResults.bills?.length && !searchResults.memberships?.length && !displayedTasks?.length && !displayedShops?.length) && (
                                        <div className="text-center py-20 px-10 bg-white rounded-[30px] border border-dashed border-black/15">
                                            <div className="text-gray-400 text-5xl mb-4">🔍</div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                                            <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
                                        </div>
                                    )}
                                </div>
                            ) : null
                        ) : (
                            <>
                                <ResultsGrid 
                                    results={results}
                                    mode={viewMode}
                                    setMode={handleViewModeChange}
                                    totalCount={results?.length || 0}
                                    activeFilters={{}}
                                    removeFilter={() => {}}
                                    onLoadMore={handleLoadMore}
                                />
                            </>
                        )}  
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
