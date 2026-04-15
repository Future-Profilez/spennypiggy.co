import React from 'react';

export default function PostEmptyState({ filter = 'all', onFilterChange = null, username = null }) {
    const getEmptyMessage = () => {
        const messages = {
            all: "No posts to see yet.",
            supporters: "No posts for supporters yet.",
            members: "No posts for members yet.",
            subscribers: "No posts for subscribers yet.",
            shoutouts: "No shoutouts yet."
        };
        
        return messages[filter] || messages.all;
    };

    const getEmptyDescription = () => {
        const descriptions = {
            all: "This creator hasn't shared any content yet. Check back later!",
            supporters: "Support this creator to see exclusive content for supporters.",
            members: "Become a member to see exclusive content for members.",
            subscribers: "Subscribe to see exclusive content for subscribers.",
            shoutouts: "No public shoutouts have been posted yet."
        };
        
        return descriptions[filter] || descriptions.all;
    };

    const getSuggestion = () => {
        if (filter !== 'all' && onFilterChange) {
            return (
                <button 
                    onClick={() => onFilterChange('all')}
                    className="mt-4 text-pink-600 hover:text-pink-700 font-medium underline"
                >
                    View all posts instead
                </button>
            );
        }
        return null;
    };

    return (
        <div className="max-feed m-auto">
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                {/* Empty state icon */}
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg 
                        className="w-12 h-12 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                        />
                    </svg>
                </div>

                {/* Message */}
                <h3 className="text-xl font-semibold text-black mb-2">
                    {getEmptyMessage()}
                </h3>
                
                <p className="text-gray-800 max-w-md mb-4">
                    {getEmptyDescription()}
                </p>

                {/* Suggestion */}
                {getSuggestion()}
                
                {/* Additional context for filtered views */}
                {filter !== 'all' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-[30px]   max-w-md">
                        <p className="text-sm text-gray-700">
                            <strong>Tip:</strong> {filter === 'supporters' && 'Send a tip'} 
                            {filter === 'members' && 'Purchase a membership'} 
                            {filter === 'subscribers' && 'Subscribe to their content'} 
                            {username && ` to ${username}`} to access exclusive content!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}