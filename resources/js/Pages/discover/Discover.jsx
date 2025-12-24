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
        if (filters.type === 'verified') active.push('verified');
        if (filters.type === 'new') active.push('new');
        if (filters.type === 'trending') active.push('trending');
        return active;
    };
    const [activeQuickFilters, setActiveQuickFilters] = useState(getActiveQuickFilters());
    useEffect(() => {
        setActiveQuickFilters(getActiveQuickFilters());
    }, [filters]);
    
    const [viewMode, setViewMode] = useState(initialFilters?.contentType === 'Wishes' ? 'wish' : 'creator');
    const [isLoading, setIsLoading] = useState(false);

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
    
    const isSearching = Object.keys(filters).length > 0 || searchQuery;
    const results = isSearching ? (searchResults || []) : (viewMode === 'creator' ? featuredCreators : featuredWishes);

    // Debounced search trigger
    const applyFilters = useCallback(
        debounce((newFilters) => {
            const params = { ...newFilters };
            const hasSearch = params.search && params.search.trim().length > 0;
            const typeParam = params.type || null;
            const page = params.page || 1;
            
            let url;
            if (hasSearch) {
                url = route('discover', { search: params.search, page });
            } else if (typeParam) {
                url = route('discover', { type: typeParam, page });
            } else {
                url = route('discover', { page });
            }
            
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true
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
            page: 1
        });
    };
    
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        applyFilters({
            type: filters.type || null,
            search: searchQuery || '',
            page: 1
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
            page: updatedFilters.page || 1
        });
    };
    
    const handleQuickFilter = (id) => {
        let newFilters = { ...filters };
        switch(id) {
            case 'verified':
                newFilters = { type: newFilters.type === 'verified' ? null : 'verified', page: 1 };
                setSearchQuery('');
                break;
            case 'new':
                newFilters = { type: newFilters.type === 'new' ? null : 'new', page: 1 };
                setSearchQuery('');
                break;
            case 'trending':
                newFilters = { type: newFilters.type === 'trending' ? null : 'trending', page: 1 };
                setSearchQuery('');
                break;
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
                                <FeaturedCarousel 
                                    title="Wishes Trending Now 🎁" 
                                    items={featuredWishes} 
                                    type="wish"
                                    icon={<RiGiftLine />}
                                />
                                
                                <div className="mb-8">
                                    <IntroVideos />
                                </div>
                                
                                
                                <div className="mb-8">
                                    <TopSupporters />
                                </div>

                                {featuredWishes && featuredWishes.length ? (
                                    <div className="mb-8 mt-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h2 className="text-2xl text-gray-900 font-gulfs uppercase">Spotlight Wish 🎯</h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                            {featuredWishes && featuredWishes.map((item, i) => (
                                                <Wishlistbox
                                                key={`wish-item-${item.id}`}
                                                classes=""
                                                imagesize="max-h-[150px]"
                                                currency={global_currency}
                                                IsloggedIn={false}
                                                auth={auth?.user}
                                                itemid={item?.id}
                                                // setuped={AuthUserStripeConnected ==1? true: false}
                                                itm={item}
                                            />
                                            ))}
                                        </div>
                                    </div>
                                ) : ''}

                                {/* <div className="mb-8 rounded-3xl bg-gradient-to-r from-pink-50 via-pink-100 to-pink-50 border border-pink-100 p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Discover & Explore</h2>
                                            <p className="text-gray-700 mt-1">Find creators and wishes you’ll love. Quick filters keep browsing fast.</p>
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                <button
                                                    onClick={() => handleQuickFilter('trending')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl border border-pink-200 hover:border-pink-300 shadow-sm"
                                                >
                                                    <RiFireLine /> Trending
                                                </button>
                                                <button
                                                    onClick={() => handleQuickFilter('new')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl border border-pink-200 hover:border-pink-300 shadow-sm"
                                                >
                                                    🆕 New
                                                </button>
                                                <button
                                                    onClick={() => handleQuickFilter('verified')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl border border-pink-200 hover:border-pink-300 shadow-sm"
                                                >
                                                    ✅ Verified
                                                </button>
                                                <button
                                                    onClick={() => { handleViewModeChange('wish'); handleQuickFilter('trending'); }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl border border-pink-200 hover:border-pink-300 shadow-sm"
                                                >
                                                    <RiGiftLine /> Trending Wishes
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <button
                                                onClick={() => router.get(route('discover'))}
                                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl shadow-sm hover:bg-black"
                                            >
                                                Explore All
                                            </button>
                                        </div>
                                    </div>
                                </div> */}
                                
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
                            </>
                        )}

                        {/* Block 4 & 5: Results Grid */}
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
                            <ResultsGrid 
                                results={results}
                                mode={viewMode}
                                setMode={handleViewModeChange}
                                totalCount={results?.length || 0}
                                activeFilters={{}}
                                removeFilter={() => {}}
                                onLoadMore={handleLoadMore}
                            />
                        )}

                        
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
