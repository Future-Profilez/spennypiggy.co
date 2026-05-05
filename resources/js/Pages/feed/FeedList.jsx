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
      const options = { page: newPage, perPage: 5, filter: newFilter };
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
    if (!useApi && newFilter === 'all' && initialPosts?.length) {
      setPosts(initialPosts);
      setHasMore(initialPosts.length >= 5); // Assume more if we got full page
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

  useEffect(() => {
    if (filter !== 'all' || !initialPosts?.length) {
      fetchPosts(filter, 1, false);
    }
  }, []);

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
          <p className="text-red-600 mb-4 font-black">Error: {error}</p>
          <button 
            onClick={() => fetchPosts(filter, 1, false)}
            className="bg-yellow-300 text-black border-2 border-black font-black uppercase tracking-wider px-6 py-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
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
          {hasMore && (
            <div className="text-center py-4">
              {isLoadingMore ? (
                <LoadMoreSkeleton />
              ) : (
                <button
                  onClick={handleLoadMore}
                  className="bg-yellow-300 text-black border-[3px] !text-xs border-black font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]duration-200"
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
    <div className="flex gap-3 mb-3 overflow-auto hideScroll pb-2   px-1">
      {filters.map(({ key, label }) => (
        <button 
          key={key}
          onClick={() => onFilterChange(key)}
          disabled={disabled}
          className={`px-5 py-2 text-sm font-black uppercase tracking-widest border-2 border-black rounded-full transition-all duration-200 whitespace-nowrap ${
            activeFilter === key
              ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-yellow-100 shadow-none hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
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
