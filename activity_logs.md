# Activity Log System - Complete Documentation & Implementation Plan

## 1. Overview
The Activity Log system provides a comprehensive audit trail of all significant user and system actions within the SPENNYPIGGY platform. This document outlines the technical implementation, database schema, and usage instructions.

## 2. Database Schema
We utilize the existing `audit_logs` table.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary key (automatically generated). |
| `actor` | String | Format: `user:{id}`, `admin:{id}`, or `system`. |
| `action_type` | String | Standardized identifier (e.g., `WISH_ITEM_CREATED`). |
| `reference_id` | String | UUID/ID of the affected resource. |
| `metadata_json` | JSON | Contextual data (IP, changes, user-agent). |
| `created_at` | Timestamp | Automatically recorded. |

## 3. Implementation Components

### A. Centralized Service: `ActivityLogger`
Located at: `app/Services/ActivityLogger.php`

This service provides a static `log` method to record events consistently across the application.

```php
ActivityLogger::log('ACTION_NAME', $optionalModel, ['extra' => 'data']);
```

### B. Automated Logging: `ActivityObserver`
Located at: `app/Observers/ActivityObserver.php`

A generic observer that automatically logs `created`, `updated`, and `deleted` events for any model it is attached to. It intelligently captures old vs. new values for updates.

### C. Registration: `AppServiceProvider`
Models are registered for observation in the `boot` method:
- `User`
- `WishItem`
- `Post`
- `Shop`
- `Membership`
- `Bills`
- `Task`
- `SocialLinks`

## 4. Manual Event Logging
Some events are not tied to model CRUD operations and are logged manually in controllers:
- `USER_LOGIN` / `USER_LOGOUT`
- `USER_REGISTERED`
- `ACCOUNT_DELETED` (Logged before final purge)

## 5. Metadata Structure
The `metadata_json` field follows this structure:
```json
{
  "ip": "127.0.0.1",
  "user_agent": "Mozilla/5.0...",
  "url": "https://spennypiggy.co/profile/edit",
  "method": "POST",
  "changes": {
    "price": { "old": 100, "new": 150 },
    "status": { "old": "pending", "new": "active" }
  }
}
```

## 6. Setup Instructions
1.  **Service Creation**: Create the `ActivityLogger` service.
2.  **Observer Creation**: Create the `ActivityObserver`.
3.  **Registration**: Add model registration to `AppServiceProvider.php`.
4.  **Controller Integration**: Add explicit log calls in Auth and Profile controllers.
