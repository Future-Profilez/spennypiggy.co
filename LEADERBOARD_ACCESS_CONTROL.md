# Leaderboard Access Control Implementation

This document describes the implementation of access control middleware for public leaderboard endpoints with rate limiting to mitigate scraping.

## Overview

The implementation includes:

1. **EnsureLeaderboardAccess middleware** - Controls access to different types of leaderboard endpoints
2. **Route organization** - Separates public and sensitive endpoints with appropriate middleware
3. **Rate limiting** - Prevents scraping of public endpoints
4. **Role-based access** - Protects sensitive financial data

## Middleware: EnsureLeaderboardAccess

**Location**: `app/Http/Middleware/EnsureLeaderboardAccess.php`

### Access Types

The middleware supports different access control levels:

- **`public`** - Allows public access to general leaderboard data, requires auth for financial data
- **`auth`** - Requires authentication for all endpoints
- **`admin`** - Requires admin or super_admin role
- **`creator`** - Requires creator, admin, or super_admin role
- **`owner`** - Requires authentication and ownership verification (enforced at controller level)

### Sensitive Endpoints

These endpoints contain financial data and require authentication:
- `earnings*`
- `top-wishes*`
- `top-subscription*`
- `top-bill*`
- `top-shop*`
- `top-piggy-bank*`
- `graph-data*`

## Route Configuration

### Public Leaderboard Routes (Rate Limited)

**Location**: `routes/auth.php` lines ~462-468

```php
// Public leaderboard routes with rate limiting to prevent scraping
Route::middleware(['throttle:60,1', 'leaderboard.access:public'])->group(function () {
    Route::get('recent-gifters/{type?}', [LeaderBoardController::class, 'recentGifters'])->name('recent-gifters');
    Route::get('leaderboard/star/lists', [LeaderBoardController::class, 'topGiftersAllTime'])->name('leaderboard.stars');
    Route::get('largest/gifts/alltime', [LeaderBoardController::class, 'top10UniqueBiggestGifters'])->name('largest-gifts-alltime');
    Route::get('leaderboard/{type?}', [LeaderBoardController::class, 'wishtenderWishers'])->name('leaderboard');
    Route::get('first-three-leaderboard/{type?}', [LeaderBoardController::class, 'firstThreeWisher'])->name('first-three-wishes');
});
```

**Rate Limiting**: 60 requests per minute per IP address

### Sensitive Earnings Routes (Authenticated)

**Location**: `routes/auth.php` lines ~315-323

```php
// Sensitive earnings routes - require authenticated user accessing their own data
Route::prefix('earnings')->middleware('leaderboard.access:owner')->group(function () {
    Route::get('all-data/{type?}', [LeaderBoardController::class, 'earnings'])->name('earnings');
    Route::get('graph-data/', [LeaderBoardController::class, 'graphData'])->name('graph-data');
    Route::get('top-wishes', [LeaderBoardController::class, 'topWishes'])->name('top-wishes');
    Route::get('top-subscription', [LeaderBoardController::class, 'topSubscription'])->name('top-subscription');
    Route::get('top-bill', [LeaderBoardController::class, 'topBill'])->name('top-bill');
    Route::get('top-shop', [LeaderBoardController::class, 'topShop'])->name('top-shop');
    Route::get('top-piggy-bank', [LeaderBoardController::class, 'topPiggyBank'])->name('top-piggy-bank');
});
```

These routes are already within the `auth` middleware group and additionally protected by the `leaderboard.access:owner` middleware.

## Middleware Registration

**Location**: `app/Http/Kernel.php` line 74

```php
'leaderboard.access' => \App\Http\Middleware\EnsureLeaderboardAccess::class,
```

## Security Features

### 1. Rate Limiting
- **Limit**: 60 requests per minute per IP address
- **Purpose**: Prevent scraping and abuse of public endpoints
- **Implementation**: Laravel's built-in throttle middleware

### 2. Authentication Requirements
- **Public endpoints**: No auth required for general data, auth required for financial data
- **Earnings endpoints**: Authentication required, user can only access their own data
- **Admin endpoints**: Admin/super_admin role required

### 3. Role-based Access Control
- **Admin**: Access to admin-only endpoints
- **Creator**: Access to creator-specific endpoints
- **Owner**: Access to their own financial data

### 4. Sensitive Data Protection
Financial data endpoints are automatically detected and require authentication regardless of the access type specified.

## Usage Examples

### Public Leaderboard Access
```bash
# Anyone can access - no auth required
GET /leaderboard
GET /leaderboard/daily
GET /recent-gifters
GET /leaderboard/star/lists
```

### Authenticated Earnings Access
```bash
# Requires authentication - user sees their own data
GET /earnings/all-data/today
GET /earnings/graph-data
GET /earnings/top-wishes
```

### Rate Limited Requests
After 60 requests per minute from the same IP:
```json
{
  "message": "Too Many Attempts."
}
```

### Unauthorized Access to Financial Data
```json
{
  "status": false,
  "message": "Authentication required to access financial data."
}
```

## Testing

Test the middleware by:

1. **Public access**: Access leaderboard endpoints without authentication
2. **Rate limiting**: Make more than 60 requests per minute from same IP
3. **Auth required**: Try accessing earnings endpoints without authentication
4. **Role validation**: Try accessing admin endpoints with regular user

## Maintenance

### Adding New Sensitive Endpoints
Add patterns to the `$sensitiveEndpoints` array in the middleware:

```php
$sensitiveEndpoints = [
    'earnings*',
    'earnings/*',
    'new-financial-endpoint*',
    // ... existing patterns
];
```

### Adjusting Rate Limits
Modify the throttle parameter in the route group:

```php
// Change from 60,1 to desired limit,timeframe
Route::middleware(['throttle:100,1', 'leaderboard.access:public'])
```

### Role Management
Update role checks in the middleware for new user roles:

```php
if (!in_array($user->role, ['creator', 'admin', 'super_admin', 'new_role'])) {
    // Access denied
}
```

## Benefits

1. **Security**: Protects sensitive financial data from unauthorized access
2. **Performance**: Prevents abuse through rate limiting
3. **Flexibility**: Supports multiple access control levels
4. **Maintainability**: Easy to add new endpoints and modify access rules
5. **User Experience**: Public data remains accessible while protecting privacy

## Implementation Summary

✅ **Created** EnsureLeaderboardAccess middleware with multiple access levels
✅ **Registered** middleware in Laravel kernel
✅ **Applied** rate limiting (60 req/min) to public leaderboard endpoints  
✅ **Protected** sensitive earnings endpoints with authentication
✅ **Organized** routes with clear separation between public and private data
✅ **Documented** implementation for future maintenance
