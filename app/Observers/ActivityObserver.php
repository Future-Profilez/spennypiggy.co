<?php

namespace App\Observers;

use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

class ActivityObserver
{
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

        ActivityLogger::log(
            "{$modelName}_CREATED",
            (string) $model->id,  // Cast to string to handle UUIDs properly
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

        // Get only the fields that changed
        $dirty = $model->getDirty();
        $original = $model->getOriginal();

        // If nothing changed, don't log
        if (empty($dirty)) {
            return;
        }

        // Build diff (old vs new)
        $diff = [];
        foreach ($dirty as $field => $newValue) {
            // Skip excluded fields
            if (in_array($field, $this->excludedFields)) {
                continue;
            }

            $oldValue = $original[$field] ?? null;

            // Only record if there's an actual change (using strict comparison where appropriate)
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
                (string) $model->id,  // Cast to string for UUIDs
                [
                    'model_type' => get_class($model),
                    'diff' => $diff,
                    'event' => 'updated',
                    'changed_fields' => array_keys($diff)  // Added for quick reference
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
            (string) $model->id,  // Cast to string for UUIDs
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
