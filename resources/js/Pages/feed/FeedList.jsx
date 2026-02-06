import { useState, useEffect, useMemo } from 'react';
import Post from './Post';
import { usePage } from '@inertiajs/react';
import { getProfilePosts, getFilteredPosts, loadMorePosts } from '@/api/profile';
import PostLoadingSkeleton, { LoadMoreSkeleton } from '@/Components/PostLoadingSkeleton';
import PostEmptyState from '@/Components/PostEmptyState';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'supporters', label: 'Supporters' },
  { key: 'members', label: 'Members' },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'shoutouts', label: 'Shoutouts' }
];

export default function FeedList({ user, IsloggedIn, initialFilter = 'all' }) {
  const { posts: initialPosts } = usePage().props;
  
  const [posts, setPosts] = useState(initialPosts || []);
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [useApi, setUseApi] = useState(false); // Track if we should use API vs initial props

  const username = user?.username;

  // Use API for pagination and filtering (except initial load)
  const fetchPosts = async (newFilter = filter, newPage = 1, append = false) => {
    if (!username) return;
    
    setIsLoading(!append);
    setIsLoadingMore(append);
    setError(null);
    
    try {
      const options = { page: newPage, perPage: 10, filter: newFilter };
      const result = await getProfilePosts(username, options);
      
      if (append) {
        setPosts(prev => [...prev, ...result.data]);
      } else {
        setPosts(result.data);
      }
      
      setHasMore(result.pagination.has_more_pages);
      setPage(result.pagination.current_page);
      setUseApi(true);
      
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
      // On error, fall back to empty state
      if (!append) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle filter change
  const handleFilterChange = async (newFilter) => {
    if (newFilter === filter) return;
    
    setFilter(newFilter);
    setPage(1);
    setHasMore(true);
    
    // If we haven't used API yet and it's 'all' filter, use initial props
    if (!useApi && newFilter === 'all' && initialPosts?.length) {
      setPosts(initialPosts);
      setHasMore(initialPosts.length >= 10); // Assume more if we got full page
    } else {
      await fetchPosts(newFilter, 1, false);
    }
  };

  // Handle load more
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    const nextPage = page + 1;
    await fetchPosts(filter, nextPage, true);
  };

  // Initialize with API if not 'all' filter or no initial posts
  useEffect(() => {
    if (filter !== 'all' || !initialPosts?.length) {
      fetchPosts(filter, 1, false);
    }
  }, []);

  // Memoized filtered posts for initial props fallback
  const displayPosts = useMemo(() => {
    return posts || [];
  }, [posts]);

  if (isLoading && !posts.length) {
    return (
      <div className='max-feed m-auto'>
        <PostFilterTabs 
          filters={FILTER_OPTIONS}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
          disabled={isLoading}
        />
        <PostLoadingSkeleton count={3} />
      </div>
    );
  }

  if (error && !posts.length) {
    return (
      <div className='max-feed m-auto'>
        <PostFilterTabs 
          filters={FILTER_OPTIONS}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
        />
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => fetchPosts(filter, 1, false)}
            className="bg-pink-600 text-white px-4 py-2 rounded-xl  hover:bg-pink-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-feed m-auto'>
      {displayPosts && displayPosts.length > 5 && <PostFilterTabs 
        filters={FILTER_OPTIONS}
        activeFilter={filter}
        onFilterChange={handleFilterChange}
        disabled={isLoading}
      />}
      
      {displayPosts.length > 0 ? (
        <>
          {displayPosts.map((post, i) => 
            <Post key={`post-${post.uuid || post.id || i}`} item={post} />
          )}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              {isLoadingMore ? (
                <LoadMoreSkeleton />
              ) : (
                <button
                  onClick={handleLoadMore}
                  className="bg-pink-600 text-white px-6 py-3 rounded-xl  hover:bg-pink-700 font-medium transition-colors duration-200"
                  disabled={isLoadingMore}
                >
                  Load More Posts
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <PostEmptyState 
          filter={filter} 
          onFilterChange={handleFilterChange}
          username={user?.name}
        />
      )}
    </div>
  );
}

// Filter tabs component
function PostFilterTabs({ filters, activeFilter, onFilterChange, disabled = false }) {
  return (
    <div className="flex gap-2 mb-6 overflow-auto hideScroll ">
      {filters.map(({ key, label }) => (
        <button 
          key={key}
          onClick={() => onFilterChange(key)}
          disabled={disabled}
          className={`px-4 py-2 text-sm rounded-[30px] font-medium transition-all duration-200 ${
            activeFilter === key
              ? 'bg-pink-600 text-white shadow-sm'
              : 'bg-gray-700 text-gray-100 hover:bg-white hover:text-black hover:shadow-sm'
          } ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
