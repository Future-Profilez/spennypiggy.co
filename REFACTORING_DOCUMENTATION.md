# UserVerificationStatus Pending Profile Query Refactoring

## Overview

This document describes the refactoring of the pending profile query logic from the `SendPendingApprovalNotifications` command into named scopes on the `UserVerificationStatus` model for better code clarity and reusability.

## Changes Made

### 1. Added Named Scopes to UserVerificationStatus Model

**File:** `app/Models/UserVerificationStatus.php`

Added two named scopes:

#### `pendingCreatorProfiles()` Scope
- **Purpose:** Finds creators (role = 1) who have submitted required profile data but are still pending approval
- **Logic:** 
  - `role = 1` (Creator)
  - `avatar` is not null AND `avatar_approved = 0`
  - `bio` is not null AND `bio_approved = 0`
  - `profile_status_lock = 1` (Pending approval)
  - `is_subscribed = 1` (Has subscription)

#### `pendingGifterProfiles()` Scope
- **Purpose:** Finds gifters (role = 0) who have exceeded the £500 limit, are subscribed, and need profile verification
- **Logic:**
  - `role = 0` (Gifter)
  - `is_500_limit_exceeded = 1` (Has exceeded £500 limit)
  - `is_subscribed = 1` (Has subscription)
  - `profile_status_lock = 1` (Pending approval)

### 2. Refactored Command to Use Named Scopes

**File:** `app/Console/Commands/SendPendingApprovalNotifications.php`

**Before (lines 83-104):**
```php
'conditions_callback' => function ($query) {
    $query->where(function ($q) {
        // Creator condition: role = 1
        $q->whereHas('user', function ($userQuery) {
            $userQuery->where('role', 1)
                ->whereNotNull('avatar')->where('avatar_approved', 0)
                ->whereNotNull('bio')->where('bio_approved', 0)
                ->where('profile_status_lock', 1)
                ->where('is_subscribed', 1);
        });
    })->orWhere(function ($q) {
        // Gifter condition: role = 0
        $q->whereHas('user', function ($userQuery) {
            $userQuery->where('role', 0)
                ->where('is_500_limit_exceeded', 1)
                ->where('is_subscribed', 1)
                ->where('profile_status_lock', 1);
        });
    });
},
```

**After:**
```php
'conditions_callback' => function ($query) {
    $query->where(function ($q) {
        // Using named scopes for cleaner code
        $q->pendingCreatorProfiles();
    })->orWhere(function ($q) {
        $q->pendingGifterProfiles();
    });
},
```

### 3. Added Unit Tests

**File:** `tests/Unit/Models/UserVerificationStatusScopesTest.php`

Created comprehensive unit tests to verify:
- Named scopes exist and return correct Builder instances
- Both scopes can be combined properly
- SQL queries contain expected patterns
- Individual scope functionality (when database is available)
- Combined scope functionality (when database is available)

### 4. Added Performance Indexes

**File:** `database/migrations/2025_01_08_100000_add_performance_indexes_for_pending_profiles.php`

Added targeted database indexes to improve performance of the pending profile queries:

#### Composite Indexes
- **For Creator Profiles:** `(role, avatar_approved, bio_approved, profile_status_lock, is_subscribed)`
- **For Gifter Profiles:** `(role, is_500_limit_exceeded, is_subscribed, profile_status_lock)`
- **For Verification Status:** `(user_id, role)`

#### Individual Indexes
- `avatar_approved`
- `bio_approved`
- `profile_status_lock`
- `is_subscribed`
- `role` (on user_verification_status table)

**Note:** Migration includes safety checks for:
- Column existence before creating indexes
- Index existence before attempting to create/drop
- Environment detection (skips during testing)

## Benefits

1. **Code Clarity:** The complex query logic is now encapsulated in clearly named, reusable scopes
2. **Maintainability:** Changes to pending profile logic only need to be made in one place
3. **Reusability:** These scopes can be used anywhere in the application
4. **Performance:** Targeted database indexes improve query performance
5. **Testing:** Comprehensive unit tests ensure the refactoring maintains identical functionality
6. **Documentation:** Each scope has clear documentation explaining its purpose and logic

## Usage Examples

```php
// Find all pending creator profiles
$pendingCreators = UserVerificationStatus::pendingCreatorProfiles()->get();

// Find all pending gifter profiles  
$pendingGifters = UserVerificationStatus::pendingGifterProfiles()->get();

// Combine both scopes (as used in the command)
$allPending = UserVerificationStatus::where(function ($query) {
    $query->where(function ($q) {
        $q->pendingCreatorProfiles();
    })->orWhere(function ($q) {
        $q->pendingGifterProfiles();
    });
})->get();

// Chain with other conditions
$recentPending = UserVerificationStatus::pendingCreatorProfiles()
    ->where('created_at', '>', Carbon::now()->subDays(7))
    ->get();
```

## SQL Equivalency Verification

The refactoring maintains identical SQL generation to the original logic, ensuring no functional changes while providing the benefits of cleaner, more maintainable code structure.
