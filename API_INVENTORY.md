# SpennnyPiggy API Endpoint Inventory

## Executive Summary
This document provides a comprehensive inventory of all publicly accessible endpoints in the SpennnyPiggy application, focusing on routes from `routes/auth.php` and the `LeaderBoardController`. The analysis was conducted by examining route definitions, controller methods, and actual API responses.

## Methodology
- Route analysis: `php artisan route:list` command execution
- Code review: Direct examination of `routes/auth.php` and `LeaderBoardController.php`
- API testing: Live cURL requests to validate JSON response structures
- Middleware analysis: Route-level security and access controls

## Route Categories

### 1. Public API Endpoints (No Authentication Required)

#### A. Leaderboard Endpoints (LeaderBoardController)

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/leaderboard/{type?}` | GET | None | `wishtenderWishers()` | `{"success": true, "data": [{"rank": int, "name": string, "username": string, "profile_status_lock": int, "role": int, "avatar": string\|false, "coverimg": string\|false, "top": float, "amount": int}], "message": string, "last_page": int, "current_page": int, "total": int, "per_page": int, "stars": int}` |
| `/recent-gifters/{type?}` | GET | None | `recentGifters()` | `{"status": true, "data": [{"name": string, "username": string, "avatar_url": string\|false, "cover_url": string\|false, "role": int, "profile_status_lock": int, "amount": int, "currency": string}]}` |
| `/leaderboard/star/lists` | GET | None | `topGiftersAllTime()` | `{"status": true, "data": [{"name": string, "username": string, "avatar_url": string\|null, "cover_url": string, "role": string, "profile_status_lock": int, "amount": float, "currency": string}]}` |
| `/largest/gifts/alltime` | GET | None | `top10UniqueBiggestGifters()` | `{"status": true, "data": [{"type": string, "name": string, "username": string, "avatar_url": string\|null, "cover_url": string, "role": string, "profile_status_lock": int, "amount": float, "currency": string, "created_at": timestamp}]}` |
| `/first-three-leaderboard/{type?}` | GET | None | `firstThreeWisher()` | `{"success": true, "data": [{"rank": int, "name": string, "username": string, "avatar": string, "coverimg": string, "top": float}], "message": string}` |

#### B. Discovery Endpoints

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/discover` | GET | None | Closure | Inertia page response |
| `/discover/wishes/{order}/{type}/{price}` | GET | None | `discover_all_wishes()` | Not tested - requires parameters |
| `/discover/creators/{order}/{gender}` | GET | None | `discover_all_creators()` | Not tested - requires parameters |
| `/discover/creators/categories` | GET | None | `all_creators_categories()` | Not tested |

#### C. User Profile Endpoints (Public)

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/{username}/{page?}` | GET | None | `getUserProfile()` | Not tested - dynamic route |
| `/sociallinks/{username}` | GET | None | `sociallinks()` | Not tested |
| `/gift-items/{username}` | GET | None | `userGiftItems()` | Not tested |
| `/items/{username}/{category_id?}` | GET | None | `userItems()` | Not tested |
| `/user/category/{username}` | GET | None | `user_category()` | Not tested |

#### D. Static/Info Endpoints

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/how-it-works` | GET | None | Closure | Inertia page response |
| `/terms-and-conditions` | GET | None | Closure | Inertia page response |
| `/promotion-terms` | GET | None | Closure | Inertia page response |

### 2. Guest Middleware Endpoints (Unauthenticated Users Only)

#### A. Authentication Endpoints

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/register` | GET | `guest` | `create()` | Inertia page response |
| `/register` | POST | `guest` | `store()` | Registration response |
| `/login` | GET | `guest` | `create()` | Inertia page response |
| `/verify/login` | GET,POST | `guest,mustHaveToVerify` | `store()` | Login response |
| `/verify-2fa` | POST | `guest,mustHaveToVerify` | `verify2FA()` | 2FA verification response |
| `/verify-user` | POST | `guest` | `verifyUser()` | User verification response |
| `/forgot-password` | POST | `guest` | `store()` | Password reset response |
| `/forgot-password` | GET | `guest` | `create()` | Inertia page response |
| `/forgot-password/{uuid}` | GET | `guest` | `forgotPasswordPage()` | Password reset page |
| `/change-password/{uuid}` | POST | `guest` | `changePassword()` | Password change response |
| `/reset-password/{token}` | GET | `guest` | `create()` | Inertia page response |
| `/reset-password` | POST | `guest` | `store()` | Password reset response |
| `/verify-token/{token}` | GET | `guest` | `authRedirects()` | Token verification response |
| `/update-2fa-key` | GET | `guest` | `update2FaKey()` | 2FA key update response |

### 3. Authenticated Endpoints (Requires Login)

#### A. Core Authentication

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/logout` | GET | `auth` | `destroy()` | Logout response |
| `/verification` | GET | `auth` | `__invoke()` | Email verification prompt |
| `/email/send-verification-email` | GET | `auth` | `sendVerificationEmail()` | Verification email response |

#### B. User Profile Management

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/edit-profile` | POST | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `updateProfile()` | Profile update response |
| `/notification-switch` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `notificationSwitch()` | Notification toggle response |

#### C. Earnings & Analytics (Authenticated - LeaderBoardController)

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/earnings/all-data/{type?}` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `earnings()` | `{"gross": float, "earnings": [{"amount": float, "percent": float, "title": string, "tag": string}]}` |
| `/earnings/graph-data` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `graphData()` | `{"status": true, "data": [{"Wishes": float, "Subscriptions": float, "PiggyBank": float, "Memberships": float, "Bills": float, "Shops": float, "month": string}]}` |
| `/earnings/top-wishes` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `topWishes()` | `{"status": true, "data": [{"uuid": string, "title": string, "amount": float, "media": string}], "auth": object}` |
| `/earnings/top-subscription` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `topSubscription()` | `{"status": true, "data": [{"uuid": string, "title": string, "amount": float, "media": string}]}` |
| `/earnings/top-bill` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `topBill()` | `{"status": true, "data": [{"uuid": string, "title": string, "amount": float, "media": string}]}` |
| `/earnings/top-shop` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `topShop()` | `{"status": true, "data": [{"uuid": string, "title": string, "amount": float, "media": string}]}` |
| `/earnings/top-piggy-bank` | GET | `auth,mustCompletedStripeIdentity,mustHaveToVerify` | `topPiggyBank()` | `{"status": true, "data": [{"uuid": string, "title": string, "amount": float, "media": string}]}` |

### 4. API Routes (Separate from auth.php)

| URL | HTTP Verb | Middleware | Method | JSON Structure |
|-----|-----------|------------|--------|----------------|
| `/api/user` | GET | `auth:sanctum` | Closure | User object |
| `/api/products` | GET | `api,throttle` | `index()` | Stripe API response (requires API key) |
| `/api/create-product` | POST | `api,throttle` | `store()` | Product creation response |
| `/api/products/{id}` | PUT | `api,throttle` | `update()` | Product update response |

## Security Analysis

### Middleware Layers
1. **guest**: Ensures only unauthenticated users can access
2. **auth**: Requires authentication
3. **mustHaveToVerify**: Additional verification requirement
4. **mustCompletedStripeIdentity**: Requires completed Stripe identity verification
5. **mustCompletedCardVerification**: Requires completed card verification
6. **auth:sanctum**: API token authentication
7. **api**: API-specific middleware
8. **throttle**: Rate limiting

### Publicly Accessible Endpoints (Security Concerns)
- Leaderboard data is fully public
- User profile information accessible by username
- Discovery endpoints are public
- No rate limiting on most public endpoints

## Critical Findings

### Missing Security Controls
1. **No rate limiting** on public leaderboard endpoints - potential for abuse
2. **User enumeration** possible via username-based endpoints
3. **Public user data exposure** through profile endpoints

### Data Exposure Analysis
1. **Leaderboard endpoints** expose user payment amounts, usernames, profile data
2. **Profile endpoints** expose user information without access controls
3. **Recent gifters** endpoint reveals payment activity

### Potential Frontend-Backend Misalignment
Based on the extensive route structure, the application appears to have:
1. **Complex middleware dependencies** that may not be properly handled in frontend
2. **Multiple authentication states** (guest, auth, verified, stripe-verified)
3. **Dynamic routing patterns** that may require careful frontend route matching

## Recommendations

### Immediate Actions
1. **Implement rate limiting** on all public endpoints
2. **Review user data exposure** on public profile endpoints
3. **Add input validation** on all parameter-accepting endpoints
4. **Implement proper error handling** for all API responses

### Long-term Improvements
1. **API versioning** for better frontend-backend alignment
2. **Consistent response format** across all endpoints
3. **Documentation generation** from route definitions
4. **Automated security testing** for endpoint access controls

## Conclusion
The SpennnyPiggy application has a comprehensive set of endpoints with complex middleware requirements. While most sensitive operations are properly protected, there are opportunities to improve security on public endpoints and ensure better alignment between frontend expectations and backend implementations.
