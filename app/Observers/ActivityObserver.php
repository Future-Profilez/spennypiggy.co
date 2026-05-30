<?php

namespace App\Observers;

use App\Models\AuditLog;
use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

class ActivityObserver
{
    // Add this constant for all models
    private static $justCreated = [];
    private static $processedEvents = []; // Add for duplicate prevention

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
        'refresh_token'
    ];

    /**
     * Handle the "created" event - Add duplicate check for all models
     */
    public function created(Model $model): void
    {
        $modelName = class_basename($model);
        $modelKey = $this->getModelKey($model);

        // Check for duplicate entries
        $existingLog = AuditLog::where('action_type', "{$modelName}_CREATED")
            ->where('reference_id', (string) $model->id)
            ->where('created_at', '>=', now()->subMinutes(1))
            ->exists();

        if ($existingLog) {
            return; // Skip duplicate
        }

        if (!$model->id) {
            return;
        }

        // Mark as just created
        $this->markAsJustCreated($model);

        // Log creation
        ActivityLogger::log(
            "{$modelName}_CREATED",
            (string) $model->id,
            $this->buildMetadata($model)
        );

        // Clear caches
        $this->clearEarningsCache($model);
        $this->clearProfileCache($model);
    }

    private function buildMetadata(Model $model): array
    {
        switch (true) {

            case $model instanceof \App\Models\WishItem:
                return [
                    'activity_type' => 'wish_created',
                    'title' => $model->wishname,
                    'price' => $model->price,
                    'currency' => $model->currency,
                    'image' => $model->perma_link,
                ];

            case $model instanceof \App\Models\Membership:
                return [
                    'activity_type' => 'membership_created',
                    'title' => $model->level,
                    'price' => $model->price,
                    'currency' => $model->currency,
                ];

            case $model instanceof \App\Models\Bills:
                return [
                    'activity_type' => 'bill_created',
                    'title' => $model->name,
                    'price' => $model->price,
                    'currency' => $model->currency,
                ];

            case $model instanceof \App\Models\PiggyPot:
                return [
                    'activity_type' => 'piggy_pot_created',
                    'title' => $model->title,
                    'goal_amount' => $model->goal_amount,
                    'currency' => $model->currency,
                ];

            case $model instanceof \App\Models\TipGoal:
                return [
                    'activity_type' => 'tip_goal_created',
                    'title' => $model->title,
                    'goal_amount' => $model->amount,
                    'currency' => $model->currency,
                ];

            case $model instanceof \App\Models\Shop:
                return [
                    'activity_type' => 'shop_created',
                    'title' => $model->name,
                    'price' => $model->price,
                    'currency' => $model->currency,
                ];

            case $model instanceof \App\Models\Post:
                return [
                    'activity_type' => 'post_created',
                    'title' => $model->title,
                ];

            case $model instanceof \App\Models\PostLike:
                return [
                    'activity_type' => 'post_liked',
                    'post_id' => $model->post_id,
                ];

            case $model instanceof \App\Models\PostComment:
                return [
                    'activity_type' => 'comment_added',
                    'comment' => $model->comment,
                ];

            case $model instanceof \App\Models\PostCommentReplies:
                return [
                    'activity_type' => 'reply_added',
                    'reply' => $model->comment,
                ];

            case $model instanceof \App\Models\Follow:
                return [
                    'activity_type' => 'creator_followed',
                    'creator_id' => $model->following_id,
                ];

            case $model instanceof \App\Models\User:
                return [
                    'activity_type' => 'user_updated',
                    'username' => $model->username,
                    'name' => $model->name,
                ];

            default:
                return [
                    'activity_type' => strtolower(class_basename($model)) . '_created'
                ];
        }
    }

    /**
     * Handle the "updated" event - Add better diff handling
     */
    public function updated(Model $model): void
    {
        $modelName = class_basename($model);

        // Skip if just created
        if ($this->wasJustCreated($model)) {
            $this->clearJustCreatedFlag($model);
            return;
        }

        // Get changes
        $dirty = $model->getDirty();
        $original = $model->getOriginal();

        if (empty($dirty)) {
            return;
        }

        // Skip timestamp-only changes
        $timestampFields = ['updated_at', 'created_at'];
        $nonTimestampChanges = array_diff(array_keys($dirty), $timestampFields);

        if (empty($nonTimestampChanges)) {
            return;
        }

        // Build changes array properly
        $changes = [];
        foreach ($dirty as $field => $newValue) {
            if (in_array($field, $this->excludedFields)) {
                continue;
            }

            $oldValue = $original[$field] ?? null;

            if ($oldValue != $newValue) {
                $changes[$field] = [
                    'old' => $this->sanitizeValue($oldValue),
                    'new' => $this->sanitizeValue($newValue)
                ];
            }
        }

        if (!empty($changes)) {
            ActivityLogger::log(
                "{$modelName}_UPDATED",
                (string) $model->id,
                [
                    'model_type' => get_class($model),
                    'diff' => $changes,
                    'event' => 'updated',
                    'changed_fields' => array_keys($changes)
                ]
            );
        }

        // Clear caches
        $this->clearEarningsCache($model);
        $this->clearProfileCache($model);
    }

    /**
     * Handle approval/rejection events
     */
    public function approving(Model $model, string $field = 'approved'): void
    {
        $modelName = class_basename($model);
        $wasApproved = $model->getOriginal($field) ?? false;
        $isApproved = $model->$field ?? false;

        if (!$wasApproved && $isApproved) {
            ActivityLogger::log(
                "{$modelName}_APPROVED",
                (string) $model->id,
                [
                    'model_type' => get_class($model),
                    'event' => 'approved',
                    'field' => $field
                ]
            );
        } elseif ($wasApproved && !$isApproved) {
            ActivityLogger::log(
                "{$modelName}_REJECTED",
                (string) $model->id,
                [
                    'model_type' => get_class($model),
                    'event' => 'rejected',
                    'field' => $field
                ]
            );
        }
    }


    /**
     * Clear the earnings cache for the creator associated with the model
     *
     * @param Model $model
     * @return void
     */
    private function clearEarningsCache(Model $model): void
    {
        $creatorId = null;
        $status = $model->status ?? $model->payment_status ?? null;

        // For created event, we always want to check if it's a paid record
        // For updated event, we only clear if status changed to 'paid'
        if ($status !== null && $status !== 'paid') {
            return;
        }

        try {
            if ($model instanceof \App\Models\TipGoalsPayment) {
                $creatorId = $model->creator_id;
            } elseif ($model instanceof \App\Models\BillPayment) {
                $creatorId = $model->bill?->user_id;
            } elseif ($model instanceof \App\Models\MembershipPayment) {
                $creatorId = $model->membership?->user_id;
            } elseif ($model instanceof \App\Models\StripePaymentDetail) {
                $creatorId = $model->owner_id;
            } elseif ($model instanceof \App\Models\WishItemSubscription) {
                $creatorId = $model->wish_item?->user_id;
            } elseif ($model instanceof \App\Models\ShopPayment) {
                $creatorId = $model->shop?->user_id;
            }

            if ($creatorId) {
                \Illuminate\Support\Facades\Cache::forget('user_earnings_v2_' . $creatorId);
                // Also clear supporters count cache as a new payment usually means a new/active supporter
                \Illuminate\Support\Facades\Cache::forget('user_supporters_count_v2_' . $creatorId);
            }
        } catch (\Throwable $e) {
            // Silently fail to not block the main request
        }
    }

    /**
     * Handle the "deleted" event
     *
     * @param Model $model
     * @return void
     */
    public function deleted(Model $model): void
    {
        $modelName = class_basename($model);

        // Clear profile data cache if content was deleted
        $this->clearProfileCache($model);

        ActivityLogger::log(
            "{$modelName}_DELETED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'deleted_data' => $this->sanitizeData($model->getAttributes()),
                'event' => 'deleted'
            ]
        );
    }

    /**
     * Clear the profile data cache for the associated user
     */
    private function clearProfileCache(Model $model): void
    {
        $user = null;

        try {
            if ($model instanceof \App\Models\User) {
                $user = $model;
            } elseif ($model instanceof \App\Models\WishItem) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\Membership) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\Bills) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\Shop) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\Post) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\UserIntro) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\Task) {
                $user = $model->creator;
            } elseif ($model instanceof \App\Models\PiggyPot) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\SocialLinks) {
                $user = $model->user;
            } elseif ($model instanceof \App\Models\UserCategory) {
                $user = $model->user;
            }

            if ($user) {
                $profileService = app(\App\Services\UserProfileService::class);
                $profileService->clearUserCaches($user->username, $user->id);
            }
        } catch (\Throwable $e) {
            // Silently fail
        }
    }

    /**
     * Handle the "restored" event (for soft deletes)
     *
     * @param Model $model
     * @return void
     */
    public function restored(Model $model): void
    {
        $modelName = class_basename($model);

        ActivityLogger::log(
            "{$modelName}_RESTORED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'event' => 'restored'
            ]
        );
    }

    /**
     * Handle the "forceDeleted" event (for soft deletes)
     *
     * @param Model $model
     * @return void
     */
    public function forceDeleted(Model $model): void
    {
        $modelName = class_basename($model);

        ActivityLogger::log(
            "{$modelName}_FORCE_DELETED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'deleted_data' => $this->sanitizeData($model->getAttributes()),
                'event' => 'force_deleted'
            ]
        );
    }

    /**
     * Generate a unique key for the model
     *
     * @param Model $model
     * @return string
     */
    private function getModelKey(Model $model): string
    {
        return get_class($model) . ':' . ($model->id ?? 'new');
    }

    /**
     * Mark a model as just created to prevent duplicate update logging
     *
     * @param Model $model
     * @return void
     */
    private function markAsJustCreated(Model $model): void
    {
        $key = $this->getModelKey($model);
        self::$justCreated[$key] = true;
    }

    /**
     * Check if the model was just created
     *
     * @param Model $model
     * @return bool
     */
    private function wasJustCreated(Model $model): bool
    {
        $key = $this->getModelKey($model);
        return isset(self::$justCreated[$key]) && self::$justCreated[$key] === true;
    }

    /**
     * Clear the just created flag
     *
     * @param Model $model
     * @return void
     */
    private function clearJustCreatedFlag(Model $model): void
    {
        $key = $this->getModelKey($model);
        unset(self::$justCreated[$key]);
    }

    /**
     * Sanitize entire data array by removing sensitive fields
     *
     * @param array $data
     * @return array
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
     *
     * @param mixed $value
     * @return mixed
     */
    private function sanitizeValue($value)
    {
        // Handle null values
        if ($value === null) {
            return null;
        }

        // Handle arrays and objects (JSON fields)
        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        // Truncate long strings to avoid huge log entries
        if (is_string($value) && strlen($value) > 1000) {
            return substr($value, 0, 1000) . '... [TRUNCATED]';
        }

        // Don't log binary data
        if (is_resource($value)) {
            return '[RESOURCE]';
        }

        return $value;
    }
}
