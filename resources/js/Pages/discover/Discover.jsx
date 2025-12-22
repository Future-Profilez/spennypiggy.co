import { useState, useEffect, useCallback } from "react";
import { Head, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import TopBar from './components/TopBar';
import FeaturedCarousel from './components/FeaturedCarousel';
import FiltersPanel from './components/FiltersPanel';
import ResultsGrid from './components/ResultsGrid';
import debounce from 'lodash/debounce';
import { RiFireLine, RiCheckboxCircleLine, RiGiftLine, RiMoneyPoundCircleLine } from 'react-icons/ri';
import IntroVideos from './IntrosVideos';

export default function Discover(props) {
    const { auth, featuredCreators, newVerifiedCreators, featuredWishes, topEarners, searchResults, filters: initialFilters } = props;

    // State
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
    const [filters, setFilters] = useState(initialFilters || {});
    
    // Derive active quick filters from actual filters
    const getActiveQuickFilters = () => {
        const active = [];
        if (filters.verified === 'true' || filters.verified === true) active.push('verified');
        if (filters.sortBy === 'New') active.push('new');
        if (filters.sortBy === 'Trending') active.push('trending');
        return active;
    };

    const [activeQuickFilters, setActiveQuickFilters] = useState(getActiveQuickFilters()); 
    const [viewMode, setViewMode] = useState(initialFilters?.contentType === 'Wishes' ? 'wish' : 'creator');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Update active quick filters when filters change
    useEffect(() => {
        setActiveQuickFilters(getActiveQuickFilters());
    }, [filters]);

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
            const type = (newFilters.contentType || 'Creators').toLowerCase();
            const params = { ...newFilters };
            
            // Map contentType to type param
            params.type = type;
            delete params.contentType; 
            
            // Handle categories
            const cats = newFilters.categories;
            let singleCat = null;
            
            if (typeof cats === 'string' && cats && !cats.includes(',')) {
                singleCat = cats;
            } else if (Array.isArray(cats) && cats.length === 1) {
                singleCat = cats[0];
            }
            
            if (singleCat) {
                params.category = singleCat;
                delete params.categories;
            } else {
                 // Multi-category or no category -> ensure category param is null
                 params.category = null;
                 // params.categories stays as query param
            }

            // Use Ziggy to construct URL with path params
            const url = route('discover', params);

            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }, 500),
        []
    );

    useEffect(() => {
        // Construct filter object for backend
        const queryParams = {
            ...filters,
            search: searchQuery,
            contentType: viewMode === 'creator' ? 'Creators' : 'Wishes',
        };
        
        // Only trigger if there are actual changes to avoid initial loop if needed
        // But for now, we rely on user interaction to update state
        // We do NOT call this on mount to avoid double fetch, relying on props.
    }, []);

    // Effect to trigger search when filters change
    const handleFilterUpdate = (newFiltersOrUpdater) => {
        let updatedFilters;
        if (typeof newFiltersOrUpdater === 'function') {
            updatedFilters = newFiltersOrUpdater(filters);
        } else {
            updatedFilters = newFiltersOrUpdater;
        }

        setFilters(updatedFilters);
        
        applyFilters({
            ...updatedFilters,
            search: searchQuery,
            // We ensure contentType matches the current viewMode to avoid conflicts
            // If we want FiltersPanel to change viewMode, we should handle that separately
            contentType: viewMode === 'creator' ? 'Creators' : 'Wishes'
        });
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        applyFilters({
            ...filters,
            search: query,
            contentType: viewMode === 'creator' ? 'Creators' : 'Wishes'
        });
    };
    
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        applyFilters({
            ...filters,
            search: searchQuery,
            contentType: mode === 'creator' ? 'Creators' : 'Wishes'
        });
    }

    const handleQuickFilter = (id) => {
        let newFilters = { ...filters };
        
        switch(id) {
            case 'verified':
                newFilters.verified = !newFilters.verified;
                break;
            case 'new':
                newFilters.sortBy = newFilters.sortBy === 'New' ? 'Trending' : 'New';
                break;
            case 'trending':
                newFilters.sortBy = newFilters.sortBy === 'Trending' ? 'New' : 'Trending';
                break;
            case 'tasks':
                // Switch to wishes and filter by tasks category? 
                // For now, let's just toggle category if in wish mode, or switch mode
                if (viewMode !== 'wish') {
                    // Switch to wish mode first
                    setViewMode('wish');
                    newFilters.contentType = 'Wishes';
                }
                newFilters.categories = newFilters.categories === 'Tasks' ? null : 'Tasks';
                break;
            case 'bills':
                if (viewMode !== 'wish') {
                    setViewMode('wish');
                    newFilters.contentType = 'Wishes';
                }
                newFilters.categories = newFilters.categories === 'Bills' ? null : 'Bills';
                break;
            default:
                break;
        }

        handleFilterUpdate(newFilters);
    };

    return (
        <Authenticated auth={auth?.user || ''} >
            <Head title={"Seek & Search"} />
            
            <div className="min-h-screen bg-gray-50 ">
                
                {/* Block 1: Top Bar */}
                <TopBar 
                    onSearch={handleSearch}
                    onFilterToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    activeFilters={activeQuickFilters}
                    onQuickFilter={handleQuickFilter}
                    initialSearch={searchQuery}
                />

                <div className="container max-w-7xl mx-auto px-4 py-6 flex gap-8 relative z-0">
                    {/* Block 3: Filters Panel (Sidebar on desktop) */}
                    <div className={`
                        hidden md:block w-64 flex-shrink-0 sticky !top-[100px] h-[calc(100vh-6rem)] overflow-y-auto border-r border-gray-100
                    `}>
                        <FiltersPanel 
                            isOpen={true} 
                            filters={filters}
                            setFilters={handleFilterUpdate}
                            variant="sidebar"
                        />
                    </div>
                    
                    {/* Mobile Filter Drawer */}
                    <div className="md:hidden">
                        <FiltersPanel 
                            isOpen={isFilterPanelOpen} 
                            onClose={() => setIsFilterPanelOpen(false)}
                            filters={filters}
                            setFilters={handleFilterUpdate}
                            variant="drawer"
                        />
                    </div>

                    <div className={`flex-1 min-w-0 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {/* Intro Videos strip */}
                        {viewMode === 'creator' && (
                            <div className="mb-8">
                                <IntroVideos />
                            </div>
                        )}
                        {/* Block 2: Featured Strips - Hide when searching to focus on results? Or keep?
                            User said "Search page layout... top carousels... results grid".
                            So we probably keep them unless deep in search. 
                            Let's keep them if no search query, or maybe always?
                            "Seek & Search" usually implies discovery first.
                        */}
                        {!isSearching && (
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
                                    title="Wishes Trending Now 🎁" 
                                    items={featuredWishes} 
                                    type="wish"
                                    icon={<RiGiftLine />}
                                />
                                <FeaturedCarousel 
                                    title="Top Earners This Week 💰" 
                                    items={topEarners} 
                                    type="creator"
                                    icon={<RiMoneyPoundCircleLine />}
                                />
                            </div>
                        )}

                        {/* Block 4 & 5: Results Grid */}
                        <ResultsGrid 
                            results={results}
                            mode={viewMode}
                            setMode={handleViewModeChange}
                            totalCount={results?.length || 0}
                            activeFilters={filters}
                            removeFilter={(key, value) => {
                                const newFilters = { ...filters };
                                if (Array.isArray(newFilters[key])) {
                                    newFilters[key] = newFilters[key].filter(v => v !== value);
                                    if (newFilters[key].length === 0) delete newFilters[key];
                                } else {
                                    // For boolean or single values, we usually toggle off or delete
                                    if (typeof value === 'boolean') {
                                        newFilters[key] = false; // or delete?
                                        delete newFilters[key];
                                    } else {
                                        delete newFilters[key];
                                    }
                                }
                                handleFilterUpdate(newFilters);
                            }}
                        />

                        {/* Block 8: Creators you should support */}
                        <div className="mt-16 mb-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8 border border-pink-100">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Creators You Should Support 🚀</h2>
                                <p className="text-gray-600">Hand-picked based on momentum and verified status</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {(featuredCreators || []).slice(0, 4).map(creator => (
                                    <div key={creator.id} className="bg-white p-4 rounded-xl shadow-sm text-center">
                                        <img 
                                            src={creator.avatar_url} 
                                            className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-pink-50"
                                            alt={creator.name}
                                        />
                                        <h3 className="font-bold text-gray-900">{creator.name}</h3>
                                        <p className="text-xs text-pink-500 font-medium mb-2">Rising Star</p>
                                        <button className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800">
                                            Support
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
