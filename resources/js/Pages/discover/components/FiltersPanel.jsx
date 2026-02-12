import React from 'react';
import { RiFilter3Line, RiCloseLine } from 'react-icons/ri';

export default function FiltersPanel({ isOpen, onClose, filters, setFilters, variant = 'drawer' }) {
    const categories = ['Fitness', 'Fashion', 'Gaming', 'Lifestyle', 'Beauty', 'Travel', 'Tech', 'Food'];
    const contentTypes = ['Creators', 'Wishes', 'Bills', 'Tasks'];
    const sortOptions = ['Trending', 'New', 'Top Earners', 'Most Supported', 'Ending Soon', 'Price: Low to High'];

    const handleCheckboxChange = (group, value) => {
        setFilters(prev => {
            const current = prev[group] || [];
            if (current.includes(value)) {
                return { ...prev, [group]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [group]: [...current, value] };
            }
        });
    };

    // Drawer styles (Fixed, Overlay, etc.)
    const drawerClasses = `
        fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:hidden
    `;

    // Sidebar styles (Static, embedded)
    const sidebarClasses = `
        bg-white h-full
    `;

    return (
        <>
            {/* Mobile Overlay (Only for drawer) */}
            {variant === 'drawer' && isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={onClose} />
            )}

            {/* Panel */}
            <div className={variant === 'drawer' ? drawerClasses : sidebarClasses}>
                <div className="p-5">
                    {variant === 'drawer' && (
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <RiFilter3Line /> Filters
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                                <RiCloseLine size={24} />
                            </button>
                        </div>
                    )}

                    {/* Content Type - REMOVED to avoid conflict with main view toggle
                    <div className="mb-8">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Content Type</h3>
                        <div className="space-y-2">
                            {contentTypes.map(type => (
                                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500 transition-colors"
                                        checked={filters.contentType?.includes(type)}
                                        onChange={() => handleCheckboxChange('contentType', type)}
                                    />
                                    <span className="text-gray-700 group-hover:text-pink-600 transition-colors">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    */}

                    {/* Verification */}
                    <div className="mb-8 border-t border-gray-100 pt-6">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="font-semibold text-gray-900">Verified Only</span>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${filters.verified ? 'bg-pink-500' : 'bg-gray-200'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${filters.verified ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={filters.verified || false}
                                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                            />
                        </label>
                    </div>

                    {/* Categories */}
                    <div className="mb-8 border-t border-gray-100 pt-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCheckboxChange('categories', cat)}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                        filters.categories?.includes(cat)
                                            ? 'bg-pink-50 border-pink-200 text-pink-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-8 border-t border-gray-100 pt-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Price Range</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2 text-gray-400">£</span>
                                <input 
                                    type="number" 
                                    placeholder="Min" 
                                    className="w-full pl-6 pr-2 py-2 rounded-[40px]   border border-gray-200 text-sm focus:ring-pink-500 focus:border-pink-500"
                                    value={filters.minPrice || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2 text-gray-400">£</span>
                                <input 
                                    type="number" 
                                    placeholder="Max" 
                                    className="w-full pl-6 pr-2 py-2 rounded-[40px]   border border-gray-200 text-sm focus:ring-pink-500 focus:border-pink-500"
                                    value={filters.maxPrice || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="mb-8 border-t border-gray-100 pt-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Sort By</h3>
                        <select 
                            className="w-full rounded-[40px]   border-gray-200 text-gray-700 focus:ring-pink-500 focus:border-pink-500"
                            value={filters.sortBy || 'Trending'}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        >
                            {sortOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                     <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 md:static md:border-0 md:p-0">
                        <button 
                            onClick={() => setFilters({})}
                            className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Reset all filters
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
