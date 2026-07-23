<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Bills;
use App\Models\Deliverable;
use App\Models\Membership;
use App\Models\Payment;
use App\Models\PiggyPot;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use App\Services\CreatorActivityService;
use App\Services\PostingCadenceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CreatorActivityController extends Controller
{
    protected $activityService;

    public function __construct(CreatorActivityService $activityService)
    {
        $this->activityService = $activityService;
        $this->middleware('auth');
    }

    /**
     * Show creator activity status dashboard
     */
    public function index()
    {
        $user = Auth::user();
        $activityStatus = $this->activityService->validateCreatorActivity($user);

        // Get detailed content breakdown
        $contentBreakdown = $this->getContentBreakdown($user);

        // Get recent blocked payments from logs (last 30 days)
        $blockedPayments = $this->getRecentBlockedPayments($user);

        // Get activity timeline for the last 30 days
        $activityTimeline = $this->getActivityTimeline($user);

        return Inertia::render('Creator/ActivityStatus', [
            'activityStatus' => $activityStatus,
            'postingCadence' => app(PostingCadenceService::class)->statusFor($user),
            'contentBreakdown' => $contentBreakdown,
            'blockedPayments' => $blockedPayments,
            'activityTimeline' => $activityTimeline,
            // "What do I do about it" — the page previously reported a blocked state with
            // no way to act on it.
            'suggestions' => $this->activityService->getContentSuggestions(
                $activityStatus['breakdown'] ?? $this->activityService->getContentBreakdown($user),
                $user
            ),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Show audit log history for the authenticated user
     */
    public function logs(Request $request)
    {
        $user = Auth::user();

        $query = AuditLog::where('actor', "user:{$user->id}");

        if ($request->filled('action_type')) {
            $query->where('action_type', $request->input('action_type'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', Carbon::parse($request->input('date_from')));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', Carbon::parse($request->input('date_to')));
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Transform logs to include formatted data
        $logs->getCollection()->transform(function ($log) {
            $metadata = [];

            if (is_array($log->metadata_json)) {
                $metadata = $log->metadata_json;
            } elseif (is_string($log->metadata_json) && ! empty($log->metadata_json)) {
                $metadata = json_decode($log->metadata_json, true) ?? [];
            }

            // Extract request context if exists
            $requestContext = $metadata['request_context'] ?? [];

            // Extract model type from metadata or action_type
            $modelType = $metadata['model_type'] ?? $this->getModelTypeFromAction($log->action_type);

            // Get reference name
            $referenceName = $this->getReferenceName($log->reference_id, $metadata['model_type'] ?? $modelType);

            // Parse all changes from metadata
            $changes = $this->parseAllChanges($metadata);

            // Get what changed summary
            $whatChanged = $this->getWhatChangedSummary($metadata, $log->action_type);

            return [
                'id' => $log->id,
                'created_at' => $log->created_at,
                'action_type' => $log->action_type,
                'reference_id' => $log->reference_id,
                'reference_name' => $referenceName,
                'model_type' => $metadata['model_type'] ?? $modelType,
                'ip_address' => $requestContext['ip'] ?? $metadata['ip_address'] ?? $metadata['ip'] ?? 'N/A',
                'user_agent' => $requestContext['user_agent'] ?? $metadata['user_agent'] ?? null,
                'method' => $requestContext['method'] ?? $metadata['method'] ?? null,
                'url' => $requestContext['url'] ?? $metadata['url'] ?? null,
                'changes' => $changes,
                'has_changes' => ! empty($changes),
                'what_changed' => $whatChanged,
                'raw_metadata' => $metadata,
            ];
        });

        $actionTypes = AuditLog::where('actor', "user:{$user->id}")
            ->select('action_type')
            ->distinct()
            ->orderBy('action_type')
            ->pluck('action_type');

        return Inertia::render('Creator/ActivityLogs', [
            'logs' => $logs,
            'filters' => $request->only(['action_type', 'date_from', 'date_to']),
            'actionTypes' => $actionTypes,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
            ],
        ]);
    }

    /**
     * Get model type from action type
     */
    private function getModelTypeFromAction($actionType)
    {
        $mapping = [
            'USER_CREATED' => 'User',
            'USER_UPDATED' => 'User',
            'USER_DELETED' => 'User',
            'TASK_CREATED' => 'Task',
            'TASK_UPDATED' => 'Task',
            'WISHITEM_CREATED' => 'WishlistItem',
            'WISHITEM_UPDATED' => 'WishlistItem',
            'WISHITEM_DELETED' => 'WishlistItem',
            'MEMBERSHIP_CREATED' => 'Membership',
            'MEMBERSHIP_UPDATED' => 'Membership',
            'MEMBERSHIP_DELETED' => 'Membership',
            'BILL_CREATED' => 'Bills',
            'BILL_UPDATED' => 'Bills',
            'BILL_DELETED' => 'Bills',
            'PIGGYPOT_CREATED' => 'PiggyPot',
            'PIGGYPOT_UPDATED' => 'PiggyPot',
            'PIGGYPOT_DELETED' => 'PiggyPot',
            'DELIVERABLE_CREATED' => 'Deliverable',
            'DELIVERABLE_UPDATED' => 'Deliverable',
            'DELIVERABLE_DELETED' => 'Deliverable',
        ];

        return $mapping[$actionType] ?? null;
    }

    /**
     * Get reference name by ID and model type
     */
    private function getReferenceName($referenceId, $modelType)
    {
        if (! $referenceId) {
            return null;
        }

        try {
            // Clean the model type (remove namespace if present)
            $cleanModelType = $modelType;
            if ($modelType && str_contains($modelType, '\\')) {
                $parts = explode('\\', $modelType);
                $cleanModelType = end($parts);
            }

            // Map model types to their classes and name fields
            $modelMap = [
                'User' => ['class' => User::class, 'field' => 'name', 'fallback' => 'email'],
                'Task' => ['class' => Task::class, 'field' => 'title', 'fallback' => 'id'],
                'WishItem' => ['class' => WishItem::class, 'field' => 'wishname', 'fallback' => 'name'],
                'WishlistItem' => ['class' => WishItem::class, 'field' => 'wishname', 'fallback' => 'name'],
                'Membership' => ['class' => Membership::class, 'field' => 'plan_name', 'fallback' => 'name'],
                'Bills' => ['class' => Bills::class, 'field' => 'name', 'fallback' => 'title'],
                'Post' => ['class' => Post::class, 'field' => 'title', 'fallback' => 'content'],
                'Shop' => ['class' => Shop::class, 'field' => 'name', 'fallback' => 'title'],
                'PiggyPot' => ['class' => PiggyPot::class, 'field' => 'title', 'fallback' => 'name'],
                'Deliverable' => ['class' => Deliverable::class, 'field' => 'name', 'fallback' => 'title'],
                'Payment' => ['class' => Payment::class, 'field' => 'id', 'fallback' => 'id'],
            ];

            if (isset($modelMap[$cleanModelType])) {
                $modelClass = $modelMap[$cleanModelType]['class'];
                if (class_exists($modelClass)) {
                    $model = $modelClass::find($referenceId);
                    if ($model) {
                        $field = $modelMap[$cleanModelType]['field'];
                        $fallback = $modelMap[$cleanModelType]['fallback'];

                        if ($field && isset($model->$field) && $model->$field) {
                            return (string) $model->$field;
                        } elseif ($fallback && isset($model->$fallback) && $model->$fallback) {
                            return (string) $model->$fallback;
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // Silently fail
        }

        return "#{$referenceId}";
    }

    /**
     * Format field name to be more readable
     */
    private function formatFieldName($field)
    {
        // Special field name mappings
        $specialMappings = [
            'name' => 'Name',
            'email' => 'Email Address',
            'username' => 'Username',
            'password' => 'Password',
            'role' => 'Role',
            'status' => 'Status',
            'is_active' => 'Active Status',
            'is_verified' => 'Verification Status',
            'profile_picture' => 'Profile Picture',
            'bio' => 'Biography',
            'phone' => 'Phone Number',
            'address' => 'Address',
            'city' => 'City',
            'country' => 'Country',
            'approved' => 'Approval Status',
            'cover_approved' => 'Cover Approval Status',
            'is_approved' => 'Approval Status',
            'wishname' => 'Wish Name',
            'price' => 'Price',
            'currency' => 'Currency',
            'repeat_purchase' => 'Repeat Purchase',
            'tax_amount' => 'Tax Amount',
            'subscription' => 'Subscription',
            'subscription_period' => 'Subscription Period',
            'item_url' => 'Item URL',
            'content_file_name' => 'File Name',
            'title' => 'Title',
            'goal_amount' => 'Goal Amount',
            'current_amount' => 'Current Amount',
            'target_date' => 'Target Date',
            'description' => 'Description',
            'due_date' => 'Due Date',
            'priority' => 'Priority',
            'cover' => 'Cover Image',
            'created_at' => 'Created Date',
            'updated_at' => 'Updated Date',
            'deleted_at' => 'Deleted Date',
            'amount' => 'Amount',
            'plan_name' => 'Plan Name',
            'user_id' => 'User ID',
            'creator_id' => 'Creator ID',
            'ai_generated' => 'AI Generated',
            'content_file' => 'Content File',
            'content_file_size' => 'File Size',
            'content_file_type' => 'File Type',
            'thumbnail' => 'Thumbnail',
            'uuid' => 'UUID',
            'reference_id' => 'Reference ID',
            'action_type' => 'Action Type',
            'ip_address' => 'IP Address',
            'user_agent' => 'User Agent',
            'profile_status_lock' => 'Profile Status Lock',
            'bio_approved' => 'Bio Approval',
            'stripe_product_id' => 'Stripe Product ID',
            'stripe_price_id' => 'Stripe Price ID',
            'price_id' => 'Price ID',
            'product_id' => 'Product ID',
            'category' => 'Category',
            'type' => 'Type',
            'deliverable_content_type' => 'Deliverable Content Type',
            'deliverable_content' => 'Deliverable Content',
            'deliverable_note' => 'Deliverable Note',
            'sla_hours' => 'SLA Hours',
            'is_suspended' => 'Suspended Status',
            'is_approved' => 'Approval Status',
            'media_url' => 'Media URL',
            'perma_link' => 'Permanent Link',
            'duration' => 'Duration',
            'billing_interval' => 'Billing Interval',
            'level' => 'Level',
            'fulfillment_amount' => 'Fulfillment Amount',
            'fulfill_amount' => 'Fulfillment Amount',
            'repeat_purchase_enabled' => 'Repeat Purchase Enabled',
            'allow_repeat_purchase' => 'Allow Repeat Purchase',
            'twitter_response' => 'Twitter Response',
            'instagram_link' => 'Instagram Link',
            'youtube_link' => 'YouTube Link',
            'tiktok_link' => 'TikTok Link',
            'facebook_link' => 'Facebook Link',
            'external_url' => 'External URL',
            'reward_amount' => 'Reward Amount',
            'task_type' => 'Task Type',
            'task_status' => 'Task Status',
            'reviewer_id' => 'Reviewer ID',
            'deliverable_id' => 'Deliverable ID',
            'payment_id' => 'Payment ID',
            'subscription_id' => 'Subscription ID',
            'transaction_id' => 'Transaction ID',
            'receipt_url' => 'Receipt URL',
            'invoice_id' => 'Invoice ID',
        ];

        if (isset($specialMappings[$field])) {
            return $specialMappings[$field];
        }

        return ucwords(str_replace('_', ' ', $field));
    }

    /**
     * Format change value based on field type
     */
    private function formatChangeValue($field, $value)
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        $fieldLower = strtolower($field);

        if (str_contains($fieldLower, 'approved')) {
            if ($value === 2 || $value === '2' || $value === 'rejected') {
                return 'Rejected';
            }
            if ($value === 1 || $value === '1' || $value === 'approved') {
                return 'Approved';
            }
            if ($value === 0 || $value === '0' || $value === 'pending') {
                return 'Pending';
            }
        }

        if (str_contains($fieldLower, 'status')) {
            if ($value === 2 || $value === '2') {
                return 'Inactive';
            }
            if ($value === 1 || $value === '1') {
                return 'Active';
            }
            if ($value === 'completed') {
                return 'Completed';
            }
            if ($value === 'expired') {
                return 'Expired';
            }
            if ($value === 'pending') {
                return 'Pending';
            }
        }

        if (str_contains($fieldLower, 'lock') || str_contains($fieldLower, 'profile_status')) {
            if ($value === 2 || $value === '2') {
                return 'Locked';
            }
            if ($value === 1 || $value === '1') {
                return 'Unlocked';
            }
        }

        if (str_contains($fieldLower, 'stripe')) {
            // Format Stripe IDs - show first part and last part for readability
            if (is_string($value) && strlen($value) > 20) {
                return substr($value, 0, 10).'...'.substr($value, -10);
            }

            return (string) $value;
        }

        if (str_contains($fieldLower, 'price') || str_contains($fieldLower, 'amount')) {
            // Check if it's a numeric value (actual price/amount)
            if (is_numeric($value) && ! str_contains($fieldLower, 'price_id')) {
                return '$'.number_format((float) $value, 2);
            }
            // For price_id and similar fields, truncate if too long
            if (is_string($value) && strlen($value) > 20) {
                return substr($value, 0, 10).'...'.substr($value, -10);
            }
        }

        if (str_contains($fieldLower, 'date') || str_contains($fieldLower, 'created_at') || str_contains($fieldLower, 'updated_at')) {
            if (is_string($value) && strtotime($value)) {
                return Carbon::parse($value)->format('M d, Y H:i:s');
            }
        }

        // Handle URLs and IDs
        if (str_contains($fieldLower, 'url') || str_contains($fieldLower, 'link') || str_contains($fieldLower, 'id')) {
            if (is_string($value) && strlen($value) > 50) {
                return substr($value, 0, 47).'...';
            }
        }

        if (is_string($value) && strlen($value) > 100) {
            return substr($value, 0, 100).'...';
        }

        return (string) $value;
    }

    /**
     * Get title for create events based on model type
     */
    private function getCreateTitle($modelType)
    {
        $cleanType = class_basename($modelType);

        $titles = [
            'User' => 'User account created',
            'Task' => 'New task created',
            'WishItem' => 'New wishlist item created',
            'WishlistItem' => 'New wishlist item created',
            'Membership' => 'New membership plan created',
            'Product' => 'New product created',
            'Cover' => 'Cover image uploaded',
            'Post' => 'New post created',
            'Shop' => 'New shop item created',
            'Bills' => 'New bill created',
            'PiggyPot' => 'New piggy pot created',
            'TipGoal' => 'New tip goal created',
            'Deliverable' => 'New deliverable created',
        ];

        return $titles[$cleanType] ?? "New {$cleanType} created";
    }

    /**
     * Get model display name
     */
    private function getModelDisplayName($modelType)
    {
        $cleanType = class_basename($modelType);

        $names = [
            'User' => 'User Account',
            'Task' => 'Task',
            'WishItem' => 'Wishlist Item',
            'WishlistItem' => 'Wishlist Item',
            'Membership' => 'Membership Plan',
            'Product' => 'Product',
            'Cover' => 'Cover Image',
            'Post' => 'Post',
            'Shop' => 'Shop Item',
            'Bills' => 'Bill',
            'PiggyPot' => 'Piggy Pot',
            'TipGoal' => 'Tip Goal',
            'Deliverable' => 'Deliverable',
            'Payment' => 'Payment',
        ];

        return $names[$cleanType] ?? $cleanType;
    }

    /**
     * Parse all changes from metadata comprehensively
     */
    private function parseAllChanges($metadata)
    {
        $changes = [];
        $event = $metadata['event'] ?? null;

        if ($event === 'created') {
            // Add the summary as the main action
            if (isset($metadata['summary'])) {
                $changes[] = [
                    'field' => 'created',
                    'label' => 'Action',
                    'value' => $metadata['summary'],
                    'type' => 'info',
                    'old_formatted' => null,
                    'new_formatted' => $metadata['summary'],
                ];
            }

            // Add all item details
            if (isset($metadata['item']) && is_array($metadata['item'])) {
                foreach ($metadata['item'] as $key => $value) {
                    if ($key !== 'id' && ! empty($value) && $value !== 'N/A') {
                        $fieldLabel = $this->formatFieldName($key);
                        $formattedValue = $this->formatChangeValue($key, $value);

                        $changes[] = [
                            'field' => $key,
                            'label' => $fieldLabel,
                            'value' => $value,
                            'type' => 'detail',
                            'old_formatted' => null,
                            'new_formatted' => $formattedValue,
                        ];
                    }
                }
            }
        } elseif ($event === 'updated') {
            // Handle diff format
            if (isset($metadata['diff']) && is_array($metadata['diff'])) {
                foreach ($metadata['diff'] as $field => $change) {
                    if (is_array($change) && array_key_exists('old', $change) && array_key_exists('new', $change)) {
                        $old = $change['old'];
                        $new = $change['new'];

                        if ($old != $new) {
                            $changes[] = [
                                'field' => $field,
                                'label' => $this->formatFieldName($field),
                                'old' => $old,
                                'new' => $new,
                                'type' => 'change',
                                'old_formatted' => $this->formatChangeValue($field, $old),
                                'new_formatted' => $this->formatChangeValue($field, $new),
                            ];
                        }
                    }
                }
            }
        } elseif ($event === 'deleted') {
            $itemName = $metadata['item_name'] ?? 'Item';
            $modelType = $metadata['model_type'] ?? null;

            $changes[] = [
                'field' => 'deleted',
                'label' => 'Action',
                'value' => "{$this->getModelDisplayName($modelType)} '{$itemName}' was deleted",
                'type' => 'info',
                'old_formatted' => null,
                'new_formatted' => 'Deleted',
            ];
        }

        return $changes;
    }

    /**
     * Get what changed summary
     */
    private function getWhatChangedSummary($metadata, $actionType)
    {
        $summary = [];

        if (str_contains($actionType, 'UPDATED') && isset($metadata['diff'])) {
            foreach ($metadata['diff'] as $field => $change) {
                $fieldName = $this->formatFieldName($field);
                $old = $this->formatChangeValue($field, $change['old'] ?? null);
                $new = $this->formatChangeValue($field, $change['new'] ?? null);
                $summary[] = "{$fieldName}: {$old} → {$new}";
            }
        } elseif (str_contains($actionType, 'CREATED')) {
            $modelType = $metadata['model_type'] ?? null;
            $summary[] = $this->getCreateTitle($modelType);
        } elseif (str_contains($actionType, 'DELETED')) {
            $summary[] = 'Item was deleted';
        }

        return $summary;
    }

    /**
     * Get activity status for widget display
     */
    public function getActivityStatus()
    {
        $user = Auth::user();
        $activityStatus = $this->activityService->validateCreatorActivity($user);
        $activityStatus['postingCadence'] = app(PostingCadenceService::class)->statusFor($user);

        return response()->json($activityStatus);
    }

    /**
     * Force refresh activity cache
     */
    public function refreshActivity()
    {
        $user = Auth::user();

        $activityStatus = $this->activityService->validateCreatorActivity($user);

        return response()->json([
            'success' => true,
            'activityStatus' => $activityStatus,
            'message' => 'Activity status refreshed successfully',
        ]);
    }

    /**
     * Get content breakdown by type
     */
    private function getContentBreakdown($user)
    {
        // Reuse the service so the page's breakdown can never disagree with the number
        // the payment gate itself uses (it had its own copy, which also counted the
        // automatic support-thank-you posts the gate excludes).
        $breakdown = $this->activityService->getContentBreakdown($user);

        return $breakdown + [
            'total' => array_sum($breakdown),
            'required' => CreatorActivityService::REQUIRED_CONTENT_COUNT,
            'period_days' => CreatorActivityService::ACTIVITY_PERIOD_DAYS,
            'period' => CreatorActivityService::ACTIVITY_PERIOD_DAYS.' days',
        ];
    }

    /**
     * Get recent blocked payments from database
     */
    private function getRecentBlockedPayments($user)
    {
        return $this->activityService->getRecentBlockedPayments($user, 30);
    }

    /**
     * Get activity timeline for the last 30 days
     */
    private function getActivityTimeline($user)
    {
        $days = 30;
        $since = Carbon::now()->subDays($days - 1)->startOfDay();

        /*
         * One grouped query per content type (6 total). This used to loop 30 days and run
         * 6 counts inside the loop — 180 queries on every load of the activity page.
         */
        $sources = [
            [Post::class, 'user_id', 'approved', 1],
            [WishItem::class, 'user_id', 'is_approved', 1],
            [Membership::class, 'user_id', 'approved', 1],
            [Shop::class, 'user_id', 'approved', 1],
            [Bills::class, 'user_id', 'approved', 1],
            [Task::class, 'creator_id', 'is_approved', 1],
        ];

        $counts = [];

        foreach ($sources as [$model, $ownerColumn, $approvedColumn, $approvedValue]) {
            $rows = $model::where($ownerColumn, $user->id)
                ->where($approvedColumn, $approvedValue)
                ->where('created_at', '>=', $since)
                ->selectRaw('DATE(created_at) as day, COUNT(*) as aggregate')
                ->groupBy('day')
                ->pluck('aggregate', 'day');

            foreach ($rows as $day => $count) {
                // MySQL returns DATE() as Y-m-d; sqlite may include a time part.
                $key = substr((string) $day, 0, 10);
                $counts[$key] = ($counts[$key] ?? 0) + (int) $count;
            }
        }

        $timeline = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $key = $date->format('Y-m-d');

            $timeline[] = [
                'date' => $key,
                'content_count' => $counts[$key] ?? 0,
                'is_weekend' => $date->isWeekend(),
            ];
        }

        return $timeline;
    }

    /**
     * Get suggestions for improving activity
     */
    public function getSuggestions()
    {
        $user = Auth::user();
        $activityStatus = $this->activityService->validateCreatorActivity($user);

        $suggestions = [];

        /*
         * The action links used to be built from route('posts.create') / route('wish-items.create')
         * / route('memberships.create') / route('shop.create') — none of those route names exist,
         * so route() threw RouteNotFoundException and this endpoint returned a 500 every time.
         * They now come from CreatorActivityService, which owns the real, reachable URLs.
         */
        $needed = $activityStatus['needed'] ?? 0;

        if (! $activityStatus['eligible'] && $needed > 0) {
            $breakdown = $activityStatus['breakdown'] ?? [];

            $actions = collect($this->activityService->getContentSuggestions($breakdown, $user))
                ->map(fn ($s) => ['label' => $s['title'], 'url' => $s['action_url'], 'icon' => $s['icon'] ?? null])
                ->values()
                ->all();

            $suggestions[] = [
                'type' => 'create_content',
                'priority' => 'high',
                'title' => 'Create More Content',
                'description' => "Add {$needed} more approved content ".($needed === 1 ? 'item' : 'items').' to reactivate payments',
                'actions' => $actions,
            ];
        }

        return response()->json([
            'suggestions' => $suggestions,
            'activityStatus' => $activityStatus,
        ]);
    }
}
