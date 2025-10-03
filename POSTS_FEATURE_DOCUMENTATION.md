# Profile Posts Pagination and Filtering

## Overview

This feature adds comprehensive pagination and filtering capabilities to user profile posts, allowing users to view posts by category and load more content dynamically.

## Features Implemented

### 1. Backend API

- **New API Endpoint**: `/api/profile/{user}/posts`
- **Filtering Support**: Filter by post types (`all`, `supporters`, `members`, `subscribers`, `shoutouts`)
- **Pagination**: Standard Laravel pagination with configurable page size
- **Access Control**: Maintains existing subscription-based access logic

### 2. Frontend Components

- **Filter Tabs**: Interactive buttons to switch between post categories
- **Load More**: Progressive loading with skeleton states
- **Empty States**: Context-aware empty state messages
- **Error Handling**: Graceful error states with retry functionality

### 3. Performance Optimizations

- **Initial Load**: Uses server-side rendered data for first page
- **API Fallback**: Seamlessly switches to API for filtering and pagination
- **Loading States**: Skeleton components prevent layout shifts
- **Caching Strategy**: Smart caching with real-time data for subscriptions

## API Documentation

### Endpoint

```
GET /api/profile/{user}/posts
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | string/int | Yes | Username or user ID |
| `page` | integer | No | Page number (default: 1, max: 1000) |
| `per_page` | integer | No | Posts per page (default: 10, max: 50) |
| `filter` | string | No | Filter type: `all`, `supporters`, `members`, `subscribers`, `shoutouts` |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "uuid": "post-uuid",
      "title": "Post title",
      "content": "Post content",
      "for_module": "support",
      "is_lock": 0,
      "image_url": "https://...",
      "likes_count": 5,
      "comments_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "name": "Creator Name",
        "username": "creator",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 42,
    "has_more_pages": true,
    "from": 1,
    "to": 10
  },
  "filter": "all"
}
```

### Error Responses

- `404`: User not found
- `403`: User account suspended
- `422`: Invalid parameters
- `500`: Server error

## Filter Types

| Filter | Description | Maps to `for_module` |
|--------|-------------|---------------------|
| `all` | All posts | No filter |
| `supporters` | Support-only posts | `support` |
| `members` | Member-only posts | `membership` |
| `subscribers` | Subscriber-only posts | `subscription` |
| `shoutouts` | Public posts | `public` |

## Access Control

Posts are marked with an `is_lock` property based on the viewer's access level:

- **Owner**: All posts unlocked (`is_lock: 0`)
- **Supporters**: Support posts unlocked if user has made tips
- **Members**: Membership posts unlocked if user has active membership
- **Subscribers**: Subscription posts unlocked if user has active subscription
- **Guests**: Only public posts unlocked

## Frontend Usage

### Basic Implementation

```jsx
import FeedList from '@/Pages/feed/FeedList';

<FeedList 
  user={user}
  IsloggedIn={IsloggedIn}
  initialFilter="all"
/>
```

### API Helper Usage

```javascript
import { getProfilePosts, loadMorePosts } from '@/api/profile';

// Get first page
const result = await getProfilePosts('username', {
  page: 1,
  perPage: 10,
  filter: 'supporters'
});

// Load more posts
const moreResults = await loadMorePosts('username', 2, {
  filter: 'supporters'
});
```

## Component Structure

```
FeedList.jsx
├── PostFilterTabs (filter buttons)
├── PostLoadingSkeleton (loading state)
├── PostEmptyState (empty state)
├── Post components (existing)
└── LoadMoreSkeleton (pagination loading)
```

## Performance Considerations

1. **Hybrid Loading**: First page uses SSR data, subsequent requests use API
2. **Smart Caching**: Only caches static data, keeps subscription checks real-time
3. **Optimized Queries**: Uses Laravel's pagination with proper indexing
4. **Progressive Enhancement**: Works with JavaScript disabled (first page only)

## Testing

### Manual Testing Scenarios

1. **Initial Load**: Verify first page loads with SSR data
2. **Filter Switching**: Test all filter types load correct posts
3. **Pagination**: Verify "Load More" appends posts correctly
4. **Access Control**: Test locked/unlocked states for different user types
5. **Empty States**: Verify appropriate messages for each filter
6. **Error Handling**: Test network errors and invalid requests

### Key Test Cases

- [ ] Page loads with initial posts
- [ ] Filter buttons work correctly
- [ ] Load more appends posts without duplicates
- [ ] Access control respects subscription status
- [ ] Empty states show appropriate messages
- [ ] Loading states prevent layout shifts
- [ ] Error states allow recovery

## Migration Notes

- No database migrations required (uses existing post structure)
- Existing `getUserPosts()` service method signature changed
- New API endpoint added to routes
- Frontend component updated with new props

## Future Enhancements

1. **Infinite Scroll**: Replace load more button with scroll-based loading
2. **Real-time Updates**: WebSocket integration for live post updates
3. **Advanced Filters**: Date ranges, content type, engagement metrics
4. **Search**: Full-text search within user posts
5. **Sorting**: Sort by date, popularity, engagement

## Dependencies

- Laravel 9+ (pagination)
- React 18+ (hooks)
- Axios (HTTP client)
- Tailwind CSS (styling)