# Activity Log System - Complete Implementation Guide

## 1. Executive Summary
The Activity Log system is a platform-wide audit trail designed to record every significant action. It uses a hybrid approach: **Automated Logging** via Model Observers for data changes, and **Explicit Logging** via a Centralized Service for logic-based events (like logins).

---

## 2. Technical Architecture

### A. Database Layer
We use the `audit_logs` table which is optimized for high-volume writes and structured for easy retrieval.

| Field | Purpose |
| :--- | :--- |
| `id` | UUID (Primary Key) |
| `actor` | String identifying the initiator (`user:{id}`, `admin:{id}`, or `system`) |
| `action_type` | Standardized uppercase string (e.g., `WISH_ITEM_CREATED`) |
| `reference_id` | UUID/ID of the entity involved (e.g., the Post ID) |
| `metadata_json` | JSON blob containing diffs, IP, User-Agent, and Request Context |
| `created_at` | High-precision timestamp |

### B. Service Layer: `ActivityLogger.php`
A static utility class that serves as the entry point for all manual logs. It automatically captures the current authenticated user and technical request details.

### C. Automation Layer: `ActivityObserver.php`
A universal Laravel Observer that listens to Eloquent events. When attached to a model, it automatically logs:
- **Created**: The entire initial state.
- **Updated**: A "diff" of only the fields that changed.
- **Deleted**: A final record of the entity before removal.

---

## 3. Comprehensive Action Map
This table lists every action that will be captured and where the implementation resides.

### Authentication & Security
| Action | Implementation Location | Trigger |
| :--- | :--- | :--- |
| `AUTH_REGISTERED` | `RegisteredUserController.php` | Successful account creation |
| `AUTH_LOGIN` | `AuthenticatedSessionController.php` | Successful session start |
| `AUTH_LOGOUT` | `AuthenticatedSessionController.php` | Manual session termination |
| `AUTH_PASSWORD_UPDATED` | `PasswordController.php` | Successful password change |
| `AUTH_2FA_ENABLED/DISABLED` | `ProfileController.php` | Toggle of 2FA status |

### Profile & Account
| Action | Implementation Location | Trigger |
| :--- | :--- | :--- |
| `PROFILE_UPDATED` | `ActivityObserver` (User Model) | Change in name, bio, etc. |
| `SOCIAL_LINKS_UPDATED` | `ActivityObserver` (SocialLinks Model) | Change in social handles |
| `ACCOUNT_DELETED` | `ProfileController.php` | User triggers account deletion |
| `VAT_SETTING_UPDATED` | `AuthenticatedSessionController.php` | Change in VAT percentage |

### Content Management (CRUD)
*All these are handled automatically by registering models with `ActivityObserver` in `AppServiceProvider.php`.*

| Action | Affected Models | Details Logged |
| :--- | :--- | :--- |
| `ITEM_CREATED` | `WishItem`, `Post`, `Shop`, `Membership`, `Bills`, `Task` | Initial attributes |
| `ITEM_UPDATED` | `WishItem`, `Post`, `Shop`, `Membership`, `Bills`, `Task` | Old vs New values |
| `ITEM_DELETED` | `WishItem`, `Post`, `Shop`, `Membership`, `Bills`, `Task` | Last state |

### Financial & System
| Action | Implementation Location | Trigger |
| :--- | :--- | :--- |
| `PAYMENT_SUCCESS` | `StripeWebhookController.php` | Payment intent succeeded |
| `SUBSCRIPTION_CANCELLED`| `StripeController.php` | User cancels recurring payment |
| `ADMIN_USER_SUSPENDED` | `Admin/UserController.php` | Manual admin intervention |

---

## 4. Implementation Steps

### Step 1: Core Service
Create `app/Services/ActivityLogger.php`. This class handles the formatting of the `actor` string and the gathering of `metadata_json` (IP, User-Agent, URL).

### Step 2: Generic Observer
Create `app/Observers/ActivityObserver.php`.
- Logic for `updated` event: Use `$model->getDirty()` and `$model->getOriginal()` to build a clean JSON diff.
- Logic for `created`/`deleted`: Standard log entry with model basename.

### Step 3: Global Registration
Modify `app/Providers/AppServiceProvider.php`.
Inside the `boot()` method, attach the observer to every relevant model:
```php
\App\Models\WishItem::observe(\App\Observers\ActivityObserver::class);
// ... repeat for Post, User, Shop, etc.
```

### Step 4: Manual Integration
Add `ActivityLogger::log(...)` calls to:
1.  **Auth Controllers**: For login, logout, and registration.
2.  **Profile Controller**: For actions that don't trigger model updates (like specific status toggles).
3.  **Webhook Controllers**: For events triggered by Stripe.

---

## 5. Security & Performance
- **Exclusion List**: The observer is configured to ignore sensitive fields like `password`, `remember_token`, and `2fa_key`.
- **Database Indexing**: The `actor` and `action_type` columns are indexed for fast searching in the admin panel.
- **Batch Processing**: For high-volume events (like mass updates), the logger can be extended to use a background job queue.
