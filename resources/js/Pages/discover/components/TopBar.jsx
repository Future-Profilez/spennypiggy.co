import { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiFilter3Line, RiTimeLine } from 'react-icons/ri';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import Avatar from '../../../includes/Avatar';
import { trackSearchClick } from "@/includes/Analytics";

export default function TopBar({ onSearch, onFilterToggle, activeFilters, onQuickFilter, initialSearch = '' }) {
    const [query, setQuery] = useState(initialSearch || '');
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
        { id: 'trending', label: 'Trending 🔥' },
        { id: 'new', label: 'New 🆕' },
        { id: 'creators', label: 'Creators' },
        { id: 'wishes', label: 'Wish List' },
        { id: 'bills', label: 'Bills' },
        { id: 'memberships', label: 'Memberships' }
    ];

    return (
        <div className="sticky top-[100px] z-10 bg-[#A2E4B8] backdrop-blur-sm  transition-all">
            <div className="container max-w-7xl mx-auto px-4 py-3">
                {/* Search Bar */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <RiSearchLine className="text-black font-black" size={24} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-[3px] border-black bg-[#fdfbf7] focus:bg-white focus:ring-0 focus:outline-none transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-lg font-black text-black placeholder-gray-600"
                        placeholder="Search creators and wishes..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            onSearch(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    />
                    {isFocused && (recentSearches.length > 0 || query) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[30px] md:rounded-[40px]   shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
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
                                                className="hover:bg-gray-50 px-3 py-2 rounded-[30px] md:rounded-[40px]   cursor-pointer flex items-center gap-2 group"
                                            >
                                                <RiTimeLine className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                                                <span className="text-gray-700 group-hover:text-gray-900">{term}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                                
                                {query && (
                                    <>
                                        <div 
                                            onClick={() => handleSearchSubmit(query)}
                                            className="hover:bg-gray-50 px-3 py-2 rounded-[30px] md:rounded-[40px]   cursor-pointer flex items-center gap-2 text-pink-600 font-medium border-t border-gray-100 mt-1"
                                        >
                                            <RiSearchLine />
                                            Search for "{query}"
                                        </div>
                                        {(suggestions.creators?.length > 0 || suggestions.wishes?.length > 0) && (
                                            <div className="mb-2">
                                                {suggestions.creators?.length > 0 && (
                                                    <>
                                                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider">Creators</div>
                                                        {suggestions.creators.map((item, i) => (
                                                            <Link href={`/${item?.username}`} onClick={() => trackSearchClick(item.id, item.username)} className='w-full block px-3 py-2 hover:bg-gray-200'>
                                                                <Avatar role={item.role}
                                                                    profile_status_lock={item.profile_status_lock == 2 ? true : false}
                                                                    name={item.name} link={item.username || null} src={item.avatar_url}
                                                                    subhead={`@${item.username || "anonymous"}`} username={item.username || ""}
                                                                    // onClick={() => trackSearchClick(item.id, item.username)}
                                                                />
                                                            </Link>

                                                            // <Link 
                                                            //     key={`c-${i}`} 
                                                            //     href={s.url}
                                                            //     className="hover:bg-gray-50 px-3 py-2 rounded-[30px] md:rounded-[40px]   cursor-pointer flex items-center gap-3"
                                                            // >
                                                            //     <img src={s.image || userphoto} className="w-8 h-8 rounded-full object-cover" />
                                                            //     <div>
                                                            //         <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                            //             {s.text}
                                                            //             {s.verified && <span className="text-blue-500 text-xs">✅</span>}
                                                            //         </div>
                                                            //         <div className="text-xs text-gray-500">{s.subtext}</div>
                                                            //     </div>
                                                            // </Link>
                                                        ))}
                                                    </>
                                                )}
                                                
                                                {/* {suggestions.wishes?.length > 0 && (
                                                    <>
                                                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider mt-2">Wishes</div>
                                                        {suggestions.wishes.map((s, i) => (
                                                            <div 
                                                                key={`w-${i}`}
                                                                onClick={() => {
                                                                    setQuery(s.search_term);
                                                                    handleSearchSubmit(s.search_term);
                                                                }}
                                                                className="hover:bg-gray-50 px-3 py-2 rounded-[30px] md:rounded-[40px]   cursor-pointer flex items-center gap-3"
                                                            >
                                                                <img src={s.image || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-[30px] md:rounded-[40px]  object-cover" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{s.text}</div>
                                                                    <div className="text-xs text-gray-500">{s.subtext}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )} */}
                                            </div>
                                        )}
                                    
                                        
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {onQuickFilter && Array.isArray(activeFilters) && (
                    <div className="flex items-center ps-2 gap-3 overflow-x-auto no-scrollbar pb-3 pt-2 px-1">
                        {onFilterToggle && (
                            <button 
                                onClick={onFilterToggle}
                                className="flex-shrink-0 p-2 rounded-xl bg-white border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all" >
                                <RiFilter3Line size={24} className="text-black font-black" />
                            </button>
                        )}
                        {quickFilters.map(filter => (
                            <button key={filter.id} onClick={() => onQuickFilter(filter.id)}
                                className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm md:text-base font-black uppercase tracking-widest transition-all whitespace-nowrap border-[3px] border-black ${
                                    activeFilters.includes(filter.id) ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' : 'bg-[#fdfbf7] text-black shadow-none hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100 hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                }`} > {filter.label} 
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
