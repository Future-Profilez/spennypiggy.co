import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import GuestLayout from "@/Layouts/GuestLayout";
import { Search, Home, Compass, HelpCircle, Star, ArrowRight } from 'lucide-react';

export default function Error404({ auth, popularCreators = [], helpLinks = [], searchSuggestions = [], currentUrl = '' }) {
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
            const modifier = creator.avatar_cdn_modifier || '-/resize/120x120/-/quality/smart/';
            return baseUrl + modifier;
        }
        return '/siteicon.png'; // fallback
    };

    return (
        <GuestLayout auth={auth} className="bg-[#A2E4B8]">
            <Head>
                <title>Page Not Found - SpennyPiggy</title>
                <meta name="description" content="Sorry, this page could not be found. Discover amazing creators, browse wishlists, or explore our help resources on SpennyPiggy." />
            </Head>
            
            <div className="min-h-[90vh] relative flex flex-col items-center justify-center py-12 md:py-18 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="relative w-full max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="mb-4 inline-block">
                            <h1 className="text-7xl md:text-9xl font-gulfs text-black select-none drop-shadow-[4px_4px_0px_rgba(255,255,255,0.3)]">
                                4🤔4
                            </h1>
                        </div>
                        
                        <h2 className="text-3xl md:text-3xl lg:text-4xl font-gulfs whitespace-nowrap text-black uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Oops! Page{" "}
                            <span className="text-gradient-wishlist">
                                Missing
                            </span>
                        </h2>
                        
                        <p className="text-gray-800 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                            While we track down this page, why not explore some amazing creators instead?
                        </p>
                    </div>

                    <div className=" mb-10 w-full max-w-[500px] m-auto">
                        <div className="space-y-6 w-full flex justify-center ">
                            {/* Search bar */}
                            <form onSubmit={handleSearch} className="relative group w-full">
                                <div className="relative flex items-center bg-white border-[3px] border-black rounded-[25px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                    <div className="pl-4">
                                        <Search size={20} className="text-gray-400" strokeWidth={3} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search for creators..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 px-4 py-4 border-none focus:ring-0 text-lg font-bold placeholder-gray-300 uppercase tracking-tight"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-4 bg-black text-white font-black hover:bg-pink-600 transition-colors border-l-[3px] border-black"
                                    >
                                        FIND
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-3 bg-white text-black font-black text-normal py-3 px-8 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
                        >
                            <Home size={20} strokeWidth={3} />
                            <span>BACK TO HOME</span>
                        </Link>
                        <Link
                            href="/discover"
                            className="inline-flex items-center justify-center gap-3 bg-yellow-300 text-black font-black text-normal py-3 px-8 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
                        >
                            <Compass size={20} strokeWidth={3} />
                            <span>DISCOVER CREATORS</span>
                        </Link>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}