import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Error404({ popularCreators = [], helpLinks = [], searchSuggestions = [], currentUrl = '' }) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/discover?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    const handleSuggestionClick = (suggestion) => {
        window.location.href = `/discover?q=${encodeURIComponent(suggestion)}`;
    };

    // Function to get creator avatar URL
    const getCreatorAvatarUrl = (creator) => {
        if (creator.avatar) {
            const baseUrl = `https://ucarecdn.com/${creator.avatar}/`;
            const modifier = creator.avatar_cdn_modifier || '-/resize/80x80/-/quality/smart/';
            return baseUrl + modifier;
        }
        return '/siteicon.png'; // fallback
    };

    return (
        <>
            <Head>
                <title>Page Not Found - SpennyPiggy</title>
                <meta name="description" content="Sorry, this page could not be found. Discover amazing creators, browse wishlists, or explore our help resources on SpennyPiggy." />
            </Head>
            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-8">
                        {/* Large 404 with emoji */}
                        <div className="mb-6">
                            <h1 className="text-8xl md:text-9xl font-bold text-gray-200 select-none">
                                4🤔4
                            </h1>
                        </div>
                        
                        {/* Main heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Oops! This page went on vacation
                        </h2>
                        
                        {/* Subtitle */}
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Don't worry though! While we look for this missing page, 
                            why not explore some amazing creators instead?
                        </p>

                        {/* Current URL display for debugging (only in non-production) */}
                        {process.env.NODE_ENV !== 'production' && currentUrl && (
                            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-[30px] md:rounded-[40px]   max-w-2xl mx-auto">
                                <p className="text-sm text-yellow-800">
                                    <strong>Requested URL:</strong> {currentUrl}
                                </p>
                            </div>
                        )}
                        
                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="mb-8 max-w-md mx-auto">
                            <div className="flex">
                                <input
                                    type="text"
                                    placeholder="Search for creators..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-r-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                                >
                                    🔍
                                </button>
                            </div>
                        </form>
                        
                        {/* Search suggestions */}
                        {searchSuggestions.length > 0 && (
                            <div className="mb-8">
                                <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {searchSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Popular Creators */}
                        {popularCreators.length > 0 && (
                            <div className="bg-white rounded-[30px] md:rounded-[40px]  shadow-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                    ⭐ Popular Creators
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {popularCreators.map(creator => (
                                        <Link
                                            key={creator.id}
                                            href={`/${creator.username}`}
                                            className="block p-3 border border-gray-200 rounded-[30px] md:rounded-[40px]   hover:border-blue-300 hover:shadow-md transition-all duration-200 text-center group"
                                        >
                                            <img
                                                src={getCreatorAvatarUrl(creator)}
                                                alt={`${creator.name}'s avatar`}
                                                className="w-12 h-12 rounded-full mx-auto mb-2 object-cover group-hover:scale-105 transition-transform duration-200"
                                                loading="lazy"
                                            />
                                            <p className="font-medium text-gray-900 text-sm truncate">
                                                {creator.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                @{creator.username}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Help Links */}
                        <div className="bg-white rounded-[30px] md:rounded-[40px]  shadow-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                🛟 Need Help?
                            </h3>
                            <div className="space-y-3">
                                {helpLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className="block p-3 border border-gray-200 rounded-[30px] md:rounded-[40px]   hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                                        target={link.url.startsWith('http') ? '_blank' : '_self'}
                                        rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                                    {link.title}
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    {link.description}
                                                </p>
                                            </div>
                                            <span className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                                                {link.url.startsWith('http') ? '↗' : '→'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="text-center mt-8">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-[30px] md:rounded-[40px]   font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                            >
                                🏠 Back to Home
                            </Link>
                            <Link
                                href="/discover"
                                className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-[30px] md:rounded-[40px]   font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                            >
                                🔍 Discover Creators
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}