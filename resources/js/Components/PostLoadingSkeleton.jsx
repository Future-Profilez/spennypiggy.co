import React from 'react';

export default function PostLoadingSkeleton({ count = 3 }) {
    const skeletonItems = Array.from({ length: count }, (_, index) => (
        <div key={index} className="post-wrap bg-gray-100 bg-light rounded-box   md:rounded-box   p-[15px] xl:p-6 mb-3 mb-md-4 ">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                    {/* Profile image skeleton */}
                    <div className="animate-flash w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                        {/* Name skeleton */}
                        <div className="animate-flash h-4 bg-gray-300 rounded w-24 mb-1"></div>
                        {/* Date skeleton */}
                        <div className="animate-flash h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
                {/* Menu skeleton */}
                <div className="animate-flash w-6 h-6 bg-gray-300 rounded"></div>
            </div>

            {/* Image skeleton */}
            <div className="animate-flash w-full h-64 bg-gray-300 rounded-box   md:rounded-box   mb-3"></div>

            {/* Title skeleton */}
            <div className="animate-flash h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
            
            {/* Content skeleton */}
            <div className="animate-flash space-y-2 mb-4">
                <div className="animate-flash h-4 bg-gray-200 rounded w-full"></div>
                <div className="animate-flash h-4 bg-gray-200 rounded w-2/3"></div>
            </div>

            {/* Interactions skeleton */}
            <div className="flex items-center space-x-4 mb-2">
                <div className="flex items-center space-x-2">
                    <div className="animate-flash w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="animate-flash h-3 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="animate-flash w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="animate-flash h-3 bg-gray-200 rounded w-16"></div>
                </div>
            </div>

            {/* Like/comment count skeleton */}
            <div className="flex space-x-4">
                <div className="animate-flash h-4 bg-gray-200 rounded w-16"></div>
                <div className="animate-flash h-4 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
    ));

    return (
        <div className="w-full m-auto grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {skeletonItems}
        </div>
    );
}

// Simplified skeleton for load more button area
export function LoadMoreSkeleton() {
    return (
        <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="animate-flash ml-2 text-gray-500">Loading more posts...</span>
        </div>
    );
}