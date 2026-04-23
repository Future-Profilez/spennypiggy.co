# Activity Log System Implementation Guide

This document contains the complete code and instructions for implementing the Activity Log system in SPENNYPIGGY.

## 1. Database Schema
We will use the existing `audit_logs` table. Ensure it has the following columns (handled by existing migrations):
- `id` (UUID)
- `actor` (String: `user:ID`, `admin:ID`, or `system`)
- `action_type` (String)
- `reference_id` (String, nullable)
- `metadata_json` (JSON, nullable)
- `created_at` (Timestamp)

---

## 2. New Files to Create

### A. Centralized Logger Service
**File Path**: `app/Services/ActivityLogger.php`

```php
<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    public static function log(string $action, ?Model $model = null, array $metadata = []): AuditLog
    {
        $user = Auth::user();
        $actor = 'system';

        if ($user) {
            $rolePrefix = match ($user->role) {
                1 => 'user',
                2 => 'admin',
                0 => 'gifter',
                default => 'user'
            };
            $actor = "{$rolePrefix}:{$user->id}";
        }

        $metadata = array_merge([
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'url' => Request::fullUrl(),
            'method' => Request::method(),
        ], $metadata);

        return AuditLog::create([
            'actor' => $actor,
            'action_type' => strtoupper($action),
            'reference_id' => $model ? (string) $model->getKey() : null,
            'metadata_json' => $metadata,
        ]);
    }
}
```

### B. Automated Activity Observer
**File Path**: `app/Observers/ActivityObserver.php`

```php
<?php

namespace App\Observers;

use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

class ActivityObserver
{
    protected array $hiddenFields = ['password', 'remember_token', '2fa_key', 'stripe_id', 'tfa_key'];

    public function created(Model $model): void
    {
        $attributes = $model->makeHidden($this->hiddenFields)->toArray();
        $this->logActivity($model, 'CREATED', ['attributes' => $attributes]);
    }

    public function updated(Model $model): void
    {
        $dirty = $model->getDirty();
        unset($dirty['updated_at']);
        foreach ($this->hiddenFields as $field) { unset($dirty[$field]); }

        if (empty($dirty)) return;

        $changes = [];
        foreach ($dirty as $key => $value) {
            $changes[$key] = ['old' => $model->getOriginal($key), 'new' => $value];
        }

        $this->logActivity($model, 'UPDATED', ['changes' => $changes]);
    }

    public function deleted(Model $model): void
    {
        $this->logActivity($model, 'DELETED');
    }

    protected function logActivity(Model $model, string $event, array $metadata = []): void
    {
        $modelName = strtoupper(class_basename($model));
        ActivityLogger::log("{$modelName}_{$event}", $model, $metadata);
    }
}
```

---

## 3. Files to Update

### A. Register Observers
**File Path**: `app/Providers/AppServiceProvider.php`

Inside the `boot()` method:
```php
public function boot(): void
{
    // ... existing code ...

    // --- Activity Log Registration ---
    $models = [
        \App\Models\User::class,
        \App\Models\WishItem::class,
        \App\Models\Post::class,
        \App\Models\Shop::class,
        \App\Models\Membership::class,
        \App\Models\Bills::class,
    ];

    foreach ($models as $model) {
        $model::observe(\App\Observers\ActivityObserver::class);
    }
}
```

### B. Manual Logging: Authentication
**File Path**: `app/Http/Controllers/Auth/AuthenticatedSessionController.php`

Inside `store()` (Login):
```php
\App\Services\ActivityLogger::log('AUTH_LOGIN', $user);
```

Inside `destroy()` (Logout):
```php
\App\Services\ActivityLogger::log('AUTH_LOGOUT', Auth::user());
```

### C. Manual Logging: Profile & Account
**File Path**: `app/Http/Controllers/ProfileController.php`

Inside `destroy()` (Account Deletion):
```php
\App\Services\ActivityLogger::log('ACCOUNT_DELETED', $user);
```

---

## 4. Summary of Coverage
- **Automatic**: Any Create/Update/Delete on tracked models (User, WishItem, Post, etc.).
- **Manual**: Logins, Logouts, Registration, and critical status changes.
- **Security**: Sensitive fields are automatically excluded from logs.
