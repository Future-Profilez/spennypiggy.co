<?php

namespace App\Observers;

use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

class ActivityObserver
{
    /**
     * Track newly created models to prevent duplicate update logs
     * Using static property to persist across event calls
     */
    private static $justCreated = [];

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
     * Handle the "created" event
     *
     * @param Model $model
     * @return void
     */
    public function created(Model $model): void
    {
        $modelName = class_basename($model);

        // Only log if model has an ID (saved successfully)
        if (!$model->id) {
            return;
        }

        // Mark that this model was just created to prevent duplicate update logs
        $this->markAsJustCreated($model);

        ActivityLogger::log(
            "{$modelName}_CREATED",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'model_data' => $this->sanitizeData($model->getAttributes()),
                'event' => 'created'
            ]
        );
    }

    /**
     * Handle the "updated" event
     *
     * @param Model $model
     * @return void
     */
    public function updated(Model $model): void
    {
        $modelName = class_basename($model);

        // Skip if this model was just created (prevents duplicate logging)
        if ($this->wasJustCreated($model)) {
            $this->clearJustCreatedFlag($model);
            return;
        }

        // Get only the fields that changed
        $dirty = $model->getDirty();
        $original = $model->getOriginal();

        // If nothing changed, don't log
        if (empty($dirty)) {
            return;
        }

        // Skip auto-updating timestamp fields if they're the only changes
        $timestampFields = ['updated_at', 'created_at'];
        $nonTimestampChanges = array_diff(array_keys($dirty), $timestampFields);

        // If ONLY timestamp fields changed, skip logging
        if (empty($nonTimestampChanges)) {
            return;
        }

        // Build diff (old vs new)
        $diff = [];
        foreach ($dirty as $field => $newValue) {
            // Skip excluded fields
            if (in_array($field, $this->excludedFields)) {
                continue;
            }

            // Skip timestamp fields
            if (in_array($field, $timestampFields)) {
                continue;
            }

            $oldValue = $original[$field] ?? null;

            // Only record if there's an actual change
            if ($oldValue != $newValue) {
                $diff[$field] = [
                    'old' => $this->sanitizeValue($oldValue),
                    'new' => $this->sanitizeValue($newValue)
                ];
            }
        }

        // Only log if there are actual changes
        if (!empty($diff)) {
            ActivityLogger::log(
                "{$modelName}_UPDATED",
                (string) $model->id,
                [
                    'model_type' => get_class($model),
                    'diff' => $diff,
                    'event' => 'updated',
                    'changed_fields' => array_keys($diff)
                ]
            );
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
