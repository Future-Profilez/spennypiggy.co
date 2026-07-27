<?php

namespace App\Observers;

use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\SocialLinks;
use App\Models\StripePaymentDetail;
use App\Models\Task;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCategory;
use App\Models\UserIntro;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Services\ActivityLogger;
use App\Services\UserProfileService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ActivityObserver
{
    /**
     * Track processed events to prevent duplicates
     */
    private static $processedEvents = [];

    /**
     * Sensitive fields that should never be logged
     */
    protected $excludedFields = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_key',
        'api_key',
        'secret_key',
        'private_key',
        'token',
        'access_token',
        'refresh_token',
    ];

    /**
     * Models that should NOT be logged
     */
    protected $excludedModels = [
        UserCategory::class,
    ];

    /**
     * Fields that should be ignored for update logs
     */
    protected $ignoredUpdateFields = [
        'updated_at',
        'created_at',
    ];

    /**
     * Handle the "created" event
     */
    public function created(Model $model): void
    {
        $modelName = class_basename($model);

        // Skip excluded models
        if ($this->shouldSkipLogging($model)) {
            return;
        }

        if (! $model->id) {
            return;
        }

        // Create a unique key for this event
        $eventKey = $this->getEventKey($model, 'CREATED');

        // Check if this event was already processed
        if ($this->isEventProcessed($eventKey)) {
            return;
        }

        // Mark event as processed
        $this->markEventProcessed($eventKey);

        // Build rich metadata with model data
        $metadata = $this->buildRichMetadata($model);

        ActivityLogger::log(
            "{$modelName}_CREATED",
            (string) $model->id,
            $metadata
        );

        // Clear caches
        $this->clearEarningsCache($model);
        $this->clearProfileCache($model);
    }

    /**
     * Build rich metadata with full model data for create events
     */
    private function buildRichMetadata(Model $model): array
    {
        $metadata = [
            'model_type' => get_class($model),
            'event' => 'created',
            'created_at' => now()->toIso8601String(),
        ];

        switch (true) {
            case $model instanceof Membership:
                $metadata['item'] = [
                    'id' => $model->id,
                    'name' => $model->level ?? $model->plan_name ?? 'Unnamed Plan',
                    'price' => $model->price,
                    'currency' => $model->currency ?? 'USD',
                    'duration' => $model->duration ?? $model->billing_interval ?? 'N/A',
                    'description' => $model->description ? substr($model->description, 0, 200) : null,
                ];
                $metadata['summary'] = "Created membership plan: {$model->level} for {$model->price} {$model->currency}";
                break;

            case $model instanceof WishItem:
                $metadata['item'] = [
                    'id' => $model->id,
                    'name' => $model->wishname ?? $model->name ?? 'Unnamed Wish',
                    'price' => $model->price,
                    'currency' => $model->currency ?? 'USD',
                    'image' => $model->perma_link ?? null,
                    'url' => $model->item_url ?? null,
                ];
                $metadata['summary'] = "Added wishlist item: {$model->wishname} for {$model->price} {$model->currency}";
                break;

            case $model instanceof Post:
                $metadata['item'] = [
                    'id' => $model->id,
                    'title' => $model->title ?? 'Untitled Post',
                    'content_preview' => $model->content ? substr(strip_tags($model->content), 0, 200) : null,
                    'status' => $model->approved ? 'Approved' : 'Pending',
                ];
                $metadata['summary'] = "Created new post: {$model->title}";
                break;

            case $model instanceof Task:
                $metadata['item'] = [
                    'id' => $model->id,
                    'title' => $model->title ?? 'Untitled Task',
                    'description' => $model->description ? substr($model->description, 0, 200) : null,
                    'amount' => $model->price ?? 0,
                    'currency' => 'USD',
                ];
                $metadata['summary'] = "Created new task: {$model->title}";
                break;

            case $model instanceof Shop:
                $metadata['item'] = [
                    'id' => $model->id,
                    'name' => $model->name ?? 'Unnamed Item',
                    'price' => $model->price,
                    'currency' => $model->currency ?? 'USD',
                    'description' => $model->description ? substr($model->description, 0, 200) : null,
                ];
                $metadata['summary'] = "Added shop item: {$model->name} for {$model->price} {$model->currency}";
                break;

            case $model instanceof Bills:
                $metadata['item'] = [
                    'id' => $model->id,
                    'name' => $model->name ?? 'Unnamed Bill',
                    'amount' => $model->amount ?? $model->price,
                    'currency' => $model->currency ?? 'USD',
                    'due_date' => $model->due_date ?? null,
                ];
                $metadata['summary'] = "Created new bill: {$model->name}";
                break;

            case $model instanceof PiggyPot:
                $metadata['item'] = [
                    'id' => $model->id,
                    'title' => $model->title ?? 'Unnamed Piggy Pot',
                    'goal_amount' => $model->goal_amount,
                    'currency' => $model->currency ?? 'USD',
                    'target_date' => $model->target_date ?? null,
                ];
                $metadata['summary'] = "Created new piggy pot: {$model->title} with goal of {$model->goal_amount} {$model->currency}";
                break;

            case $model instanceof TipGoal:
                $metadata['item'] = [
                    'id' => $model->id,
                    'title' => $model->title ?? 'Unnamed Tip Goal',
                    'goal_amount' => $model->amount,
                    'currency' => $model->currency ?? 'USD',
                ];
                $metadata['summary'] = "Created new tip goal: {$model->title} for {$model->amount} {$model->currency}";
                break;

            case $model instanceof User:
                $metadata['item'] = [
                    'id' => $model->id,
                    'name' => $model->name,
                    'username' => $model->username,
                    'email' => $model->email,
                ];
                $metadata['summary'] = "User account created: {$model->name} (@{$model->username})";
                break;

            default:
                $modelName = class_basename($model);
                $internalModels = ['UserCategory', 'SocialLinks', 'UserIntro'];

                if (in_array($modelName, $internalModels)) {
                    return ['skipped' => true];
                }

                $metadata['item'] = [
                    'id' => $model->id,
                    'name' => $model->name ?? $model->title ?? $model->wishname ?? 'Item',
                ];
                $metadata['summary'] = 'Created new '.class_basename($model);
                break;
        }

        return $metadata;
    }

    /**
     * Check if logging should be skipped for this model
     */
    private function shouldSkipLogging(Model $model): bool
    {
        $modelClass = get_class($model);
        $modelName = class_basename($model);

        if (in_array($modelClass, $this->excludedModels)) {
            return true;
        }

        $internalModels = [
            'UserCategory',
        ];

        if (in_array($modelName, $internalModels)) {
            return true;
        }

        return false;
    }

    /**
     * Handle the "updated" event - REVISED to prevent duplicates
     */
    public function updated(Model $model): void
    {
        $modelName = class_basename($model);

        // Skip excluded models
        if ($this->shouldSkipLogging($model)) {
            return;
        }

        // Get changes
        $dirty = $model->getDirty();
        $original = $model->getOriginal();

        if (empty($dirty)) {
            return;
        }

        // Remove ignored fields (like updated_at)
        $filteredChanges = array_diff_key($dirty, array_flip($this->ignoredUpdateFields));

        // If only ignored fields changed, skip logging
        if (empty($filteredChanges)) {
            return;
        }

        // Build changes array
        $changes = [];
        $hasRealChanges = false;

        foreach ($filteredChanges as $field => $newValue) {
            if (in_array($field, $this->excludedFields)) {
                continue;
            }

            $oldValue = $original[$field] ?? null;

            // Only log if there's an actual change
            if ($oldValue != $newValue) {
                // Check if this is a real change (not just type casting)
                $normalizedOld = is_numeric($oldValue) ? (string) $oldValue : $oldValue;
                $normalizedNew = is_numeric($newValue) ? (string) $newValue : $newValue;

                if ($normalizedOld != $normalizedNew) {
                    $changes[$field] = [
                        'old' => $this->sanitizeValue($oldValue),
                        'new' => $this->sanitizeValue($newValue),
                    ];
                    $hasRealChanges = true;
                }
            }
        }

        // Only log if there are meaningful changes
        if ($hasRealChanges) {
            // Create a unique key for this update event to prevent duplicates
            $eventKey = $this->getEventKey($model, 'UPDATED', $changes);

            // Check if this exact update was already processed
            if ($this->isEventProcessed($eventKey)) {
                return;
            }

            // Mark event as processed
            $this->markEventProcessed($eventKey);

            ActivityLogger::log(
                "{$modelName}_UPDATED",
                (string) $model->id,
                [
                    'model_type' => get_class($model),
                    'diff' => $changes,
                    'event' => 'updated',
                    'changed_fields' => array_keys($changes),
                ]
            );
        }

        // Clear caches
        $this->clearEarningsCache($model);
        $this->clearProfileCache($model);
    }

    /**
     * Handle the "deleted" event
     */
    public function deleted(Model $model): void
    {
        // Skip excluded models
        if ($this->shouldSkipLogging($model)) {
            return;
        }

        $modelName = class_basename($model);

        $eventKey = $this->getEventKey($model, 'DELETED');

        if ($this->isEventProcessed($eventKey)) {
            return;
        }

        $this->markEventProcessed($eventKey);
        $this->clearProfileCache($model);

        $deletedData = $this->sanitizeData($model->getAttributes());

        ActivityLogger::log(
            "{$modelName}_DELETED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'deleted_data' => $deletedData,
                'event' => 'deleted',
                'item_name' => $model->name ?? $model->title ?? $model->wishname ?? null,
            ]
        );
    }

    /**
     * Handle the "restored" event (for soft deletes)
     */
    public function restored(Model $model): void
    {
        if ($this->shouldSkipLogging($model)) {
            return;
        }

        $modelName = class_basename($model);

        $eventKey = $this->getEventKey($model, 'RESTORED');

        if ($this->isEventProcessed($eventKey)) {
            return;
        }

        $this->markEventProcessed($eventKey);

        ActivityLogger::log(
            "{$modelName}_RESTORED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'event' => 'restored',
            ]
        );
    }

    /**
     * Handle the "forceDeleted" event (for soft deletes)
     */
    public function forceDeleted(Model $model): void
    {
        if ($this->shouldSkipLogging($model)) {
            return;
        }

        $modelName = class_basename($model);

        $eventKey = $this->getEventKey($model, 'FORCE_DELETED');

        if ($this->isEventProcessed($eventKey)) {
            return;
        }

        $this->markEventProcessed($eventKey);

        ActivityLogger::log(
            "{$modelName}_FORCE_DELETED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'deleted_data' => $this->sanitizeData($model->getAttributes()),
                'event' => 'force_deleted',
            ]
        );
    }

    /**
     * Get a unique key for an event
     */
    private function getEventKey(Model $model, string $event, array $changes = []): string
    {
        $key = get_class($model).':'.($model->id ?? 'new').':'.$event;

        // For updates, include a hash of the changes to detect duplicate updates
        if ($event === 'UPDATED' && ! empty($changes)) {
            $key .= ':'.md5(json_encode($changes));
        }

        return $key;
    }

    /**
     * Check if an event was already processed
     */
    private function isEventProcessed(string $eventKey): bool
    {
        // Clean up old events (older than 5 seconds)
        foreach (self::$processedEvents as $key => $timestamp) {
            if (time() - $timestamp > 5) {
                unset(self::$processedEvents[$key]);
            }
        }

        return isset(self::$processedEvents[$eventKey]);
    }

    /**
     * Mark an event as processed
     */
    private function markEventProcessed(string $eventKey): void
    {
        self::$processedEvents[$eventKey] = time();
    }

    /**
     * Sanitize entire data array by removing sensitive fields
     */
    private function sanitizeData(array $data): array
    {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (in_array($key, $this->excludedFields)) {
                $sanitized[$key] = '[REDACTED]';
            } else {
                $sanitized[$key] = $this->sanitizeValue($value);
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize individual value (truncate long strings, etc.)
     */
    private function sanitizeValue($value)
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        if (is_string($value) && strlen($value) > 1000) {
            return substr($value, 0, 1000).'... [TRUNCATED]';
        }

        if (is_resource($value)) {
            return '[RESOURCE]';
        }

        return $value;
    }

    /**
     * Clear earnings cache for payment-related models
     */
    private function clearEarningsCache(Model $model): void
    {
        $paymentModels = [
            TipGoalsPayment::class,
            BillPayment::class,
            MembershipPayment::class,
            StripePaymentDetail::class,
            WishItemSubscription::class,
            ShopPayment::class,
        ];

        $shouldProcess = false;
        foreach ($paymentModels as $paymentModel) {
            if ($model instanceof $paymentModel) {
                $shouldProcess = true;
                break;
            }
        }

        if (! $shouldProcess) {
            return;
        }

        $creatorId = null;

        try {
            if ($model instanceof TipGoalsPayment) {
                $creatorId = $model->creator_id;
            } elseif ($model instanceof BillPayment) {
                $creatorId = $model->bill?->user_id;
            } elseif ($model instanceof MembershipPayment) {
                $creatorId = $model->membership?->user_id;
            } elseif ($model instanceof StripePaymentDetail) {
                $creatorId = $model->owner_id;
            } elseif ($model instanceof WishItemSubscription) {
                $creatorId = $model->wish_item?->user_id;
            } elseif ($model instanceof ShopPayment) {
                $creatorId = $model->shop?->user_id;
            }

            if ($creatorId) {
                Cache::forget('user_earnings_v2_'.$creatorId);
                Cache::forget('user_supporters_count_v2_'.$creatorId);
            }
        } catch (\Throwable $e) {
            // Silently fail
        }
    }

    /**
     * Clear profile cache for content-related models
     */
    private function clearProfileCache(Model $model): void
    {
        $user = null;

        try {
            if ($model instanceof User) {
                $user = $model;
            } elseif ($model instanceof WishItem) {
                $user = $model->user;
            } elseif ($model instanceof Membership) {
                $user = $model->user;
            } elseif ($model instanceof Bills) {
                $user = $model->user;
            } elseif ($model instanceof Shop) {
                $user = $model->user;
            } elseif ($model instanceof Post) {
                $user = $model->user;
            } elseif ($model instanceof UserIntro) {
                $user = $model->user;
            } elseif ($model instanceof Task) {
                $user = $model->creator;
            } elseif ($model instanceof PiggyPot) {
                $user = $model->user;
            } elseif ($model instanceof SocialLinks) {
                $user = $model->user;
            } elseif ($model instanceof UserCategory) {
                $user = $model->user;
            }

            if ($user && class_exists(UserProfileService::class)) {
                $profileService = app(UserProfileService::class);
                $profileService->clearUserCaches($user->username, $user->id);
            }
        } catch (\Throwable $e) {
            // Silently fail
        }
    }
}
