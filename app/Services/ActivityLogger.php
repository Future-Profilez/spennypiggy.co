<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    /**
     * Log an activity with automatic context capturing
     */
    public static function log(
        string $actionType,
        ?string $referenceId = null,
        array $additionalMetadata = [],
        ?string $actorOverride = null
    ): ?AuditLog {
        try {
            // Build the actor string
            $actor = $actorOverride ?? self::getCurrentActor();

            // Build metadata with auto-captured context
            $metadata = array_merge(
                self::captureRequestContext(),
                $additionalMetadata
            );

            // Create the audit log entry
            $auditLog = AuditLog::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'actor' => $actor,
                'action_type' => strtoupper($actionType),
                'reference_id' => $referenceId,
                'metadata_json' => json_encode($metadata),
                'created_at' => now(),
            ]);

            return $auditLog;
        } catch (\Exception $e) {
            Log::error('Failed to create activity log: ' . $e->getMessage(), [
                'action_type' => $actionType,
                'reference_id' => $referenceId,
            ]);
            return null;
        }
    }

    /**
     * Get the current actor string based on authenticated user
     */
    private static function getCurrentActor(): string
    {
        // Check if user is logged in via web guard (most common)
        if (Auth::guard('web')->check()) {
            $user = Auth::guard('web')->user();
            return "user:{$user->id}";
        }

        // Check for API guard
        if (Auth::guard('api')->check()) {
            $user = Auth::guard('api')->user();
            return "user:{$user->id}";
        }

        // Check for admin guard ONLY if it exists
        if (self::guardExists('admin') && Auth::guard('admin')->check()) {
            $admin = Auth::guard('admin')->user();
            return "admin:{$admin->id}";
        }

        // System action or unauthenticated
        return 'system';
    }

    /**
     * Check if a guard exists
     */
    private static function guardExists(string $guard): bool
    {
        try {
            Auth::guard($guard);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Automatically capture request context (IP, User-Agent, URL, etc.)
     */
    private static function captureRequestContext(): array
    {
        $request = Request::instance();

        $context = [
            'timestamp' => now()->toIso8601String(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
        ];

        // Add session ID if available
        if ($request->hasSession()) {
            $context['session_id'] = $request->session()->getId();
        }

        // Add referer if available
        if ($request->headers->has('referer')) {
            $context['referer'] = $request->headers->get('referer');
        }

        return $context;
    }

    /**
     * Log a batch of activities (for performance)
     *
     * @param array $activities - Array of activity data
     * @return bool
     */
    public static function logBatch(array $activities): bool
    {
        try {
            $records = [];
            foreach ($activities as $activity) {
                $records[] = [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'actor' => $activity['actor'] ?? self::getCurrentActor(),
                    'action_type' => strtoupper($activity['action_type']),
                    'reference_id' => $activity['reference_id'] ?? null,
                    'metadata_json' => json_encode(
                        array_merge(
                            self::captureRequestContext(),
                            $activity['metadata'] ?? []
                        )
                    ),
                    'created_at' => now(),
                ];
            }

            AuditLog::insert($records);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to log batch activities: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Log an activity with old/new values diff (useful for updates)
     *
     * @param string $actionType
     * @param mixed $model - The model being changed
     * @param array $oldValues
     * @param array $newValues
     * @param string|null $referenceId
     * @return \App\Models\AuditLog|null
     */
    public static function logDiff(
        string $actionType,
        $model,
        array $oldValues,
        array $newValues,
        ?string $referenceId = null
    ): ?AuditLog {
        $diff = [];
        foreach ($newValues as $key => $value) {
            if (isset($oldValues[$key]) && $oldValues[$key] != $value) {
                $diff[$key] = [
                    'old' => $oldValues[$key],
                    'new' => $value
                ];
            }
        }

        $referenceId = $referenceId ?? ($model->id ?? null);

        return self::log(
            $actionType,
            $referenceId,
            [
                'diff' => $diff,
                'model_type' => get_class($model),
                'old_values' => $oldValues,
                'new_values' => $newValues,
            ]
        );
    }

    /**
     * Check if a specific action was performed by a user
     * (Useful for security checks)
     *
     * @param string $userId
     * @param string $actionType
     * @param int $hours - Check within last X hours
     * @return bool
     */
    public static function hasPerformedAction(string $userId, string $actionType, int $hours = 24): bool
    {
        return AuditLog::where('actor', "user:{$userId}")
            ->where('action_type', $actionType)
            ->where('created_at', '>=', now()->subHours($hours))
            ->exists();
    }

    /**
     * Log system-level activity (no user context)
     *
     * @param string $actionType
     * @param string|null $referenceId
     * @param array $metadata
     * @return \App\Models\AuditLog|null
     */
    public static function logSystem(string $actionType, ?string $referenceId = null, array $metadata = []): ?AuditLog
    {
        return self::log($actionType, $referenceId, $metadata, 'system');
    }

    /**
     * Log admin action with admin context
     *
     * @param int $adminId
     * @param string $actionType
     * @param string|null $referenceId
     * @param array $metadata
     * @return \App\Models\AuditLog|null
     */
    public static function logAdmin(int $adminId, string $actionType, ?string $referenceId = null, array $metadata = []): ?AuditLog
    {
        return self::log($actionType, $referenceId, $metadata, "admin:{$adminId}");
    }

    /**
     * Get recent activities for a specific entity
     *
     * @param string $referenceId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getEntityHistory(string $referenceId, int $limit = 50)
    {
        return AuditLog::where('reference_id', $referenceId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get activities by type
     *
     * @param string $actionType
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getByActionType(string $actionType, int $limit = 100)
    {
        return AuditLog::where('action_type', $actionType)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get user's activity timeline
     *
     * @param string $userId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getUserTimeline(string $userId, int $limit = 100)
    {
        return AuditLog::where('actor', "user:{$userId}")
            ->orWhere('metadata_json->affected_user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Clean old logs (for maintenance)
     *
     * @param int $daysToKeep - Keep logs newer than this many days
     * @return int - Number of records deleted
     */
    public static function cleanOldLogs(int $daysToKeep = 90): int
    {
        $cutoffDate = now()->subDays($daysToKeep);
        return AuditLog::where('created_at', '<', $cutoffDate)->delete();
    }
}
