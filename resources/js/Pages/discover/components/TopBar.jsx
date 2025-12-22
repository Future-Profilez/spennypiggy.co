import React, { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiFilter3Line, RiTimeLine, RiCloseLine } from 'react-icons/ri';
import { Link } from '@inertiajs/react';
import axios from 'axios';

export default function TopBar({ onSearch, onFilterToggle, activeFilters, onQuickFilter }) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [suggestions, setSuggestions] = useState({ creators: [], wishes: [] });
    const inputRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent searches', e);
            }
        }
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setSuggestions({ creators: [], wishes: [] });
            return;
        }

        const timer = setTimeout(() => {
            axios.get(route('discover.suggestions'), { params: { q: query } })
                .then(res => {
                    setSuggestions(res.data);
                })
                .catch(err => console.error(err));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const saveRecentSearch = (term) => {
        if (!term.trim()) return;
        const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(query);
        }
    };

    const clearRecentSearches = (e) => {
        e.stopPropagation();
        setRecentSearches([]);
        localStorage.removeItem('recent_searches');
    };

    const quickFilters = [
        { id: 'verified', label: 'Verified ✅' },
        { id: 'new', label: 'New 🆕' },
        { id: 'trending', label: 'Trending 🔥' },
        { id: 'tasks', label: 'Tasks 💼' },
        { id: 'bills', label: 'Bills 🧾' },
    ];

    return (
        <div className="sticky top-[100px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 pb-2 transition-all">
            <div className="container max-w-7xl mx-auto px-4 py-3">
                {/* Search Bar */}
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <RiSearchLine className="text-gray-400" size={20} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm text-base"
                        placeholder="Search creators, wishes, bills, tasks..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            onSearch(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    />
                    
                    {/* Autocomplete / Recent Searches Dropdown */}
                    {isFocused && (recentSearches.length > 0 || query) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2">
                                {recentSearches.length > 0 && !query && (
                                    <>
                                        <div className="flex items-center justify-between px-3 py-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Searches</div>
                                            <button onClick={clearRecentSearches} className="text-xs text-pink-500 hover:text-pink-700">Clear</button>
                                        </div>
                                        {recentSearches.map((term, index) => (
                                            <div 
                                                key={index}
                                                onClick={() => {
                                                    setQuery(term);
                                                    handleSearchSubmit(term);
                                                }}
                                                className="hover:bg-gray-50 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 group"
                                            >
                                                <RiTimeLine className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                                                <span className="text-gray-700 group-hover:text-gray-900">{term}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                                
                                {query && (
                                    <>
                                        {/* Suggestions */}
                                        {(suggestions.creators?.length > 0 || suggestions.wishes?.length > 0) && (
                                            <div className="mb-2">
                                                {suggestions.creators?.length > 0 && (
                                                    <>
                                                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider">Creators</div>
                                                        {suggestions.creators.map((s, i) => (
                                                            <Link 
                                                                key={`c-${i}`} 
                                                                href={s.url}
                                                                className="hover:bg-gray-50 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-3"
                                                            >
                                                                <img src={s.image || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-full object-cover" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                                        {s.text}
                                                                        {s.verified && <span className="text-blue-500 text-xs">✅</span>}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{s.subtext}</div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </>
                                                )}
                                                
                                                {suggestions.wishes?.length > 0 && (
                                                    <>
                                                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider mt-2">Wishes</div>
                                                        {suggestions.wishes.map((s, i) => (
                                                            <div 
                                                                key={`w-${i}`}
                                                                onClick={() => {
                                                                    setQuery(s.search_term);
                                                                    handleSearchSubmit(s.search_term);
                                                                }}
                                                                className="hover:bg-gray-50 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-3"
                                                            >
                                                                <img src={s.image || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-md object-cover" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{s.text}</div>
                                                                    <div className="text-xs text-gray-500">{s.subtext}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    
                                        <div 
                                            onClick={() => handleSearchSubmit(query)}
                                            className="hover:bg-gray-50 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-pink-600 font-medium border-t border-gray-100 mt-1"
                                        >
                                            <RiSearchLine />
                                            Search for "{query}"
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button 
                        onClick={onFilterToggle}
                        className="flex-shrink-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <RiFilter3Line size={20} />
                    </button>
                    {quickFilters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => onQuickFilter(filter.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                activeFilters.includes(filter.id)
                                    ? 'bg-pink-500 text-white shadow-md transform scale-105'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
