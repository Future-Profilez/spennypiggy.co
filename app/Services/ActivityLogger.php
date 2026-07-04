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
        ?string $actorOverride = null,
        array $options = []
    ): ?AuditLog {
        try {
            // Build the actor string
            $actor = $actorOverride ?? self::getCurrentActor();

            // Build metadata with auto-captured context
            $metadata = array_merge(
                self::captureRequestContext(),
                $additionalMetadata
            );

            // Prepare the data for creation
            $data = [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'actor' => $actor,
                'action_type' => strtoupper($actionType),
                'reference_id' => $referenceId,
                'metadata_json' => $metadata,
                'created_at' => now(),
            ];

            $emulationAdminId = self::getEmulationAdminId();
            if ($emulationAdminId !== null) {
                $data['admin_id'] = $emulationAdminId;
            }

            // Add optional fields if provided
            if (!empty($options['entity_type'])) {
                $data['entity_type'] = $options['entity_type'];
            }
            if (!empty($options['entity_id'])) {
                $data['entity_id'] = $options['entity_id'];
            }
            if (!empty($options['case_id'])) {
                $data['case_id'] = $options['case_id'];
            }
            if (!empty($options['correlation_id'])) {
                $data['correlation_id'] = $options['correlation_id'];
            }
            if (!empty($options['reason_code'])) {
                $data['reason_code'] = $options['reason_code'];
            }
            if (!empty($options['old_values'])) {
                $data['old_values'] = $options['old_values'];
            }
            if (!empty($options['new_values'])) {
                $data['new_values'] = $options['new_values'];
            }
            if (!empty($options['evidence_refs'])) {
                $data['evidence_refs'] = $options['evidence_refs'];
            }
            if (!empty($options['payment_refs'])) {
                $data['payment_refs'] = $options['payment_refs'];
            }

            // Create the audit log entry
            $auditLog = AuditLog::create($data);

            return $auditLog;
        } catch (\Exception $e) {
            Log::error('Failed to create activity log: ' . $e->getMessage(), [
                'action_type' => $actionType,
                'reference_id' => $referenceId,
                'exception' => $e,
            ]);
            return null;
        }
    }

    /**
     * Log approval action
     */
    public static function logApproval($model, string $actionType, array $metadata = []): ?AuditLog
    {
        $modelName = class_basename($model);
        $action = str_contains($actionType, 'APPROVE') ? 'APPROVED' : 'REJECTED';

        return self::log(
            "{$modelName}_{$action}",
            (string) $model->id,
            array_merge([
                'model_type' => get_class($model),
                'event' => strtolower($action),
                'approved_by' => Auth::id(),
            ], $metadata)
        );
    }

    /**
     * Log archive/restore action
     */
    public static function logArchive($model, string $action): ?AuditLog
    {
        $modelName = class_basename($model);
        $actionType = $action === 'archive' ? 'ARCHIVED' : 'RESTORED';

        return self::log(
            "{$modelName}_{$actionType}",
            (string) $model->id,
            [
                'model_type' => get_class($model),
                'event' => strtolower($action),
            ]
        );
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

        if ($request->hasSession() && $request->session()->get('emulated_by_admin')) {
            $context['emulated_by_admin'] = true;
            $context['emulation_admin_id'] = $request->session()->get('emulation_admin_id');
            $context['emulation_target_user_id'] = $request->session()->get('emulation_target_user_id');
        }

        return $context;
    }

    /**
     * Get the super admin id for the current emulated session, if present.
     */
    private static function getEmulationAdminId(): ?int
    {
        try {
            $request = Request::instance();

            if (!$request->hasSession() || !$request->session()->get('emulated_by_admin')) {
                return null;
            }

            $adminId = $request->session()->get('emulation_admin_id');
            if (empty($adminId)) {
                return null;
            }

            $actor = self::getCurrentActor();
            if (!str_starts_with($actor, 'user:')) {
                return null;
            }

            $userId = intval(substr($actor, 5));
            $targetUserId = $request->session()->get('emulation_target_user_id');
            if ($targetUserId !== null && intval($targetUserId) !== $userId) {
                return null;
            }

            return (int) $adminId;
        } catch (\Exception $e) {
            return null;
        }
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
                $record = [
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

                $emulationAdminId = self::getEmulationAdminId();
                if ($emulationAdminId !== null) {
                    $record['admin_id'] = $emulationAdminId;
                }

                $records[] = $record;
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

    /**
     * Log payment activity with comprehensive details
     *
     * @param \App\Models\Payment $payment
     * @param string $actionType - e.g., PAYMENT_CREATED, PAYMENT_PROCESSED, PAYMENT_FAILED
     * @param array $details - Additional payment details
     * @return \App\Models\AuditLog|null
     */
    /**
     * Enhanced payment logging with better structure
     */
    public static function logPayment($payment, string $actionType, array $details = []): ?AuditLog
    {
        try {
            $gifter = $payment->getGifter();
            $purchaseDetails = $payment->getPurchaseDetails();

            $options = [
                'entity_type' => 'Payment',
                'entity_id' => $payment->id,
                'reason_code' => $details['reason_code'] ?? null,
                'payment_refs' => [
                    'payment_id' => $payment->id,
                    'stripe_session_id' => $payment->stripe_session_id,
                    'stripe_payment_intent_id' => $payment->stripe_payment_intent_id,
                    'stripe_transfer_id' => $payment->stripe_transfer_id,
                    'gifter_id' => $gifter?->id,
                    'creator_id' => $payment->creator_id,
                    'risk_identity_id' => $payment->risk_identity_id,
                    'item_id' => $purchaseDetails['item_id'] ?? null,
                    'item_name' => $purchaseDetails['item_name'] ?? null,
                ],
            ];

            $metadata = [
                'payment_type' => $purchaseDetails['activity_type'] ?? $details['payment_type'] ?? 'payment',
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'reserve_amount' => $payment->reserve_amount_minor,
                'platform_holds_funds' => $payment->platform_holds_funds,
                'gifter_name' => $gifter?->name,
                'gifter_id' => $gifter?->id,
                'creator_name' => optional($payment->creator)->name,
                'creator_id' => $payment->creator_id,
                'item_name' => $purchaseDetails['item_name'] ?? null,
                'item_id' => $purchaseDetails['item_id'] ?? null,
            ];

            return self::log(
                $actionType,
                (string)$payment->id,
                $metadata,
                null,
                $options
            );
        } catch (\Exception $e) {
            Log::error('Failed to log payment activity: ' . $e->getMessage(), [
                'payment_id' => $payment->id ?? 'unknown',
                'action_type' => $actionType,
            ]);
            return null;
        }
    }

    /**
     * Log payment state change with before/after values
     *
     * @param \App\Models\Payment $payment
     * @param array $oldValues
     * @param array $newValues
     * @param string $reason
     * @return \App\Models\AuditLog|null
     */
    public static function logPaymentStateChange($payment, array $oldValues, array $newValues, string $reason = ''): ?AuditLog
    {
        try {
            $options = [
                'entity_type' => 'Payment',
                'entity_id' => $payment->id,
                'reason_code' => 'STATE_CHANGE',
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'payment_refs' => [
                    'payment_id' => $payment->id,
                    'stripe_payment_intent_id' => $payment->stripe_payment_intent_id,
                    'creator_id' => $payment->creator_id,
                ],
            ];

            $metadata = [
                'transition_reason' => $reason,
                'old_status' => $oldValues['status'] ?? null,
                'new_status' => $newValues['status'] ?? null,
            ];

            return self::log(
                'PAYMENT_STATE_CHANGED',
                (string)$payment->id,
                $metadata,
                null,
                $options
            );
        } catch (\Exception $e) {
            Log::error('Failed to log payment state change: ' . $e->getMessage(), [
                'payment_id' => $payment->id ?? 'unknown',
            ]);
            return null;
        }
    }

    /**
     * Log payment refund with details
     *
     * @param \App\Models\Payment $payment
     * @param float $refundAmount
     * @param string $reason
     * @param array $metadata
     * @return \App\Models\AuditLog|null
     */
    public static function logPaymentRefund($payment, float $refundAmount, string $reason = '', array $metadata = []): ?AuditLog
    {
        return self::logPayment($payment, 'PAYMENT_REFUNDED', array_merge([
            'reason_code' => 'REFUND',
            'additional_metadata' => array_merge([
                'refund_amount' => $refundAmount,
                'refund_reason' => $reason,
                'original_amount' => $payment->amount,
            ], $metadata),
        ], []));
    }

    /**
     * Log payment failure/error
     *
     * @param \App\Models\Payment $payment
     * @param string $errorCode
     * @param string $errorMessage
     * @param array $metadata
     * @return \App\Models\AuditLog|null
     */
    public static function logPaymentError($payment, string $errorCode, string $errorMessage = '', array $metadata = []): ?AuditLog
    {
        return self::logPayment($payment, 'PAYMENT_ERROR', [
            'reason_code' => $errorCode,
            'additional_metadata' => array_merge([
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
            ], $metadata),
        ]);
    }
}
