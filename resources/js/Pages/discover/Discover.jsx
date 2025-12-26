import { useState, useEffect, useCallback } from "react";
import { Head, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import TopBar from './components/TopBar';
import FeaturedCarousel from './components/FeaturedCarousel';
import ResultsGrid from './components/ResultsGrid';
import debounce from 'lodash/debounce';
import { RiFireLine, RiCheckboxCircleLine, RiGiftLine, RiMoneyPoundCircleLine } from 'react-icons/ri';
import IntroVideos from './IntrosVideos';
import TopSupporters from '../leaderboard/TopSupporters';
import Wishlistbox from "../../wishlist/Wishlistbox";

export default function Discover(props) {
    const { auth, global_currency, featuredCreators, newVerifiedCreators, featuredWishes, topEarners, searchResults, filters: initialFilters } = props;

    // State
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
    const [filters, setFilters] = useState(initialFilters || {});
    const getActiveQuickFilters = () => {
        const active = [];
        if (filters.type === 'new') active.push('new');
        if (filters.type === 'trending') active.push('trending');
        if ((filters.contentType || '').toLowerCase() === 'creators') active.push('creators');
        if ((filters.contentType || '').toLowerCase() === 'wishes') active.push('wishes');
        return active;
    };
    const [activeQuickFilters, setActiveQuickFilters] = useState(getActiveQuickFilters());
    useEffect(() => {
        setActiveQuickFilters(getActiveQuickFilters());
    }, [filters]);
    
    const [viewMode, setViewMode] = useState(initialFilters?.contentType === 'Wishes' ? 'wish' : 'creator');
    const [isLoading, setIsLoading] = useState(false);
    const updateContentTypeUrl = (ct) => {
        const url = new URL(window.location.href);
        if (ct) url.searchParams.set('contentType', ct);
        else url.searchParams.delete('contentType');
        url.searchParams.delete('page');
        window.history.replaceState({}, '', url.toString());
    };

    // Listen for Inertia start/finish for loading state
    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            removeStart();
            removeFinish();
        };
    }, []);
    // If not searching, we show the discovery blocks (carousels) and maybe a default grid.
    
    const isSearching = (() => {
        const hasQuery = !!(searchQuery && searchQuery.trim().length > 0);
        const filterKeys = Object.keys(filters || {});
        const hasNonContentTypeFilter = filterKeys.some(k => {
            if (k === 'contentType' || k === 'page') return false;
            const v = filters[k];
            return v !== null && v !== undefined && v !== '';
        });
        return hasQuery || hasNonContentTypeFilter;
    })();
    const results = isSearching ? (searchResults || []) : (viewMode === 'creator' ? featuredCreators : featuredWishes);

    // Debounced search trigger
    const applyFilters = useCallback(
        debounce((newFilters) => {
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
            } else {
                url = route('discover', { page, contentType: contentTypeParam });
            }
            
            const onlyProps = [];
            if (contentTypeParam && !hasSearch && !typeParam) {
                onlyProps.push('filters');
                if (contentTypeParam === 'Creators') {
                    onlyProps.push('featuredCreators','newVerifiedCreators','topEarners');
                } else if (contentTypeParam === 'Wishes') {
                    onlyProps.push('featuredWishes');
                }
            }
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                ...(onlyProps.length > 0 ? { only: onlyProps } : {})
            });
        }, 300),
        []
    );

    useEffect(() => {}, []);

    // Effect to trigger search when filters change

    const handleSearch = (query) => {
        setSearchQuery(query);
        applyFilters({
            type: null,
            search: query,
            page: 1,
            contentType: filters.contentType || null
        });
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
                newFilters = { type: newFilters.type === 'new' ? null : 'new', page: 1 };
                setSearchQuery('');
                break;
            case 'trending':
                newFilters = { type: newFilters.type === 'trending' ? null : 'trending', page: 1 };
                setSearchQuery('');
                break;
            case 'creators':
                newFilters = { ...newFilters, contentType: (newFilters.contentType === 'Creators' ? null : 'Creators'), page: 1 };
                setFilters(newFilters);
                setSearchQuery('');
                setViewMode('creator');
                updateContentTypeUrl(newFilters.contentType || null);
                return;
            case 'wishes':
                newFilters = { ...newFilters, contentType: (newFilters.contentType === 'Wishes' ? null : 'Wishes'), page: 1 };
                setFilters(newFilters);
                setSearchQuery('');
                setViewMode('wish');
                updateContentTypeUrl(newFilters.contentType || null);
                return;
            default:
                break;
        }
        handleFilterUpdate(newFilters);
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
            
            <div className="min-h-screen bg-gray-50 ">
                
                {/* Block 1: Top Bar */}
                <TopBar 
                    onSearch={handleSearch}
                    initialSearch={searchQuery}
                    activeFilters={activeQuickFilters}
                    onQuickFilter={handleQuickFilter}
                />

               

                <div className="container max-w-7xl mx-auto px-4 py-6 relative z-0">
                    <div className={`min-w-0 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        
                        {!isSearching && !filters.type && (
                            <>
                                {(!filters.contentType || filters.contentType === 'All') && (
                                    <>
                                        <FeaturedCarousel 
                                            title="Wishes Trending Now 🎁" 
                                            items={featuredWishes} 
                                            type="wish"
                                            icon={<RiGiftLine />}
                                        />
                                        <div className="mb-8">
                                            <TopSupporters grid={true} />
                                        </div>
                                        <div className="mb-8">
                                            <IntroVideos />
                                        </div>
                                    </>
                                )}
                                
                                {(filters.contentType === 'Creators' || !filters.contentType || filters.contentType === 'All') && (
                                    <div className="space-y-2 mb-8">
                                        <FeaturedCarousel 
                                            title="Trending Creators 🔥" 
                                            items={featuredCreators} 
                                            type="creator"
                                            icon={<RiFireLine />}
                                        />
                                        <FeaturedCarousel 
                                            title="New & Verified 🆕" 
                                            items={newVerifiedCreators} 
                                            type="creator"
                                            icon={<RiCheckboxCircleLine />}
                                        />
                                        
                                        <FeaturedCarousel 
                                            title="Top Earners This Week 💰" 
                                            items={topEarners} 
                                            type="creator"
                                            icon={<RiMoneyPoundCircleLine />}
                                        />
                                    </div>
                                )}

                                {filters.contentType === 'Wishes' && (
                                    <FeaturedCarousel 
                                        title="Wishes Trending Now 🎁" 
                                        items={featuredWishes} 
                                        type="wish"
                                        icon={<RiGiftLine />}
                                    />
                                )}
                            </>
                        )}

                        {isSearching && searchResults ? (
                            <div className="space-y-12">
                                {searchResults.creators && searchResults.creators.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl text-gray-900 font-gulfs uppercase"><span className="text-pink">Creators</span> : Showing  {searchResults.creators.length} Results</h2>
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
                                    <>
                                        <h2 className="text-2xl text-gray-900 font-gulfs uppercase"><span className="text-pink">WishLists</span> : Showing  {searchResults.wishes.length} Results</h2>
                                        <ResultsGrid 
                                            results={searchResults.wishes}
                                            mode="wish"
                                            totalCount={searchResults.wishes.length}
                                            activeFilters={{}}
                                            removeFilter={() => {}}
                                            onLoadMore={handleLoadMore}
                                        />
                                    </>
                                )}

                                
                                
                                {(!searchResults.creators?.length && !searchResults.wishes?.length) && (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <div className="text-gray-400 text-5xl mb-4">🔍</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                                        <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                                    </div>
                                )}
                            </div>
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
