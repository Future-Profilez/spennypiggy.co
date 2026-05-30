<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\CreatorActivityService;
use App\Models\User;
use App\Models\Post;
use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Shop;
use App\Models\Bills;
use App\Models\Task;
use App\Models\AuditLog;
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
            'contentBreakdown' => $contentBreakdown,
            'blockedPayments' => $blockedPayments,
            'activityTimeline' => $activityTimeline,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
            ],
        ]);
    }

    // /**
    //  * Show audit log history for the authenticated user
    //  */
    // public function logs(Request $request)
    // {
    //     $user = Auth::user();

    //     $query = AuditLog::where('actor', "user:{$user->id}");

    //     if ($request->filled('action_type')) {
    //         $query->where('action_type', $request->input('action_type'));
    //     }

    //     if ($request->filled('date_from')) {
    //         $query->whereDate('created_at', '>=', Carbon::parse($request->input('date_from')));
    //     }

    //     if ($request->filled('date_to')) {
    //         $query->whereDate('created_at', '<=', Carbon::parse($request->input('date_to')));
    //     }

    //     $logs = $query->orderBy('created_at', 'desc')
    //         ->paginate(20)
    //         ->withQueryString();

    //     $actionTypes = AuditLog::where('actor', "user:{$user->id}")
    //         ->select('action_type')
    //         ->distinct()
    //         ->orderBy('action_type')
    //         ->pluck('action_type');

    //     return Inertia::render('Creator/ActivityLogs', [
    //         'logs' => $logs,
    //         'filters' => $request->only(['action_type', 'date_from', 'date_to']),
    //         'actionTypes' => $actionTypes,
    //         'user' => [
    //             'id' => $user->id,
    //             'name' => $user->name,
    //             'username' => $user->username,
    //         ],
    //     ]);
    // }

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
            } elseif (is_string($log->metadata_json) && !empty($log->metadata_json)) {
                $metadata = json_decode($log->metadata_json, true) ?? [];
            }

            // Extract model type from metadata or action_type
            $modelType = $metadata['model_type'] ?? $this->getModelTypeFromAction($log->action_type);

            // Get reference name - pass the raw model type from metadata
            $referenceName = $this->getReferenceName($log->reference_id, $metadata['model_type'] ?? $modelType);

            // Parse changes from metadata
            $changes = $this->parseChanges($metadata);

            return [
                'id' => $log->id,
                'created_at' => $log->created_at,
                'action_type' => $log->action_type,
                'reference_id' => $log->reference_id,
                'reference_name' => $referenceName,
                'model_type' => $metadata['model_type'] ?? $modelType,
                'ip_address' => $metadata['ip_address'] ?? $metadata['ip'] ?? 'N/A',
                'user_agent' => $metadata['user_agent'] ?? null,
                'changes' => $changes,
                'has_changes' => !empty($changes),
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
        ];

        return $mapping[$actionType] ?? null;
    }

    /**
     * Get reference name by ID and model type
     */
    private function getReferenceName($referenceId, $modelType)
    {
        if (!$referenceId) {
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
            ];

            if (isset($modelMap[$cleanModelType])) {
                $model = $modelMap[$cleanModelType]['class']::find($referenceId);
                if ($model) {
                    $field = $modelMap[$cleanModelType]['field'];
                    $fallback = $modelMap[$cleanModelType]['fallback'];

                    // Try to get the name field
                    if ($field && isset($model->$field) && $model->$field) {
                        return (string) $model->$field;
                    } elseif ($fallback && isset($model->$fallback) && $model->$fallback) {
                        return (string) $model->$fallback;
                    }
                }
            }
        } catch (\Exception $e) {
            // Log::debug('Error getting reference name: ' . $e->getMessage());
        }

        return "#{$referenceId}";
    }

    /**
     * Parse changes from metadata in a readable format - IMPROVED VERSION
     */
    private function parseChanges($metadata)
    {
        $changes = [];

        // For UPDATE events
        if (isset($metadata['event']) && $metadata['event'] === 'updated') {

            // Handle diff format
            if (isset($metadata['diff']) && is_array($metadata['diff'])) {
                foreach ($metadata['diff'] as $field => $change) {
                    if (is_array($change) && isset($change['old']) && isset($change['new'])) {
                        $old = $change['old'];
                        $new = $change['new'];

                        if ($old != $new) {
                            $changes[] = [
                                'field' => $field,
                                'label' => $this->formatFieldName($field),
                                'old' => $this->formatValue($old),
                                'new' => $this->formatValue($new),
                                'type' => 'change'
                            ];
                        }
                    }
                }
            }

            // Handle changed_fields format
            if (empty($changes) && isset($metadata['changed_fields']) && is_array($metadata['changed_fields'])) {
                foreach ($metadata['changed_fields'] as $field) {
                    if (isset($metadata['old_values'][$field]) || isset($metadata['new_values'][$field])) {
                        $changes[] = [
                            'field' => $field,
                            'label' => $this->formatFieldName($field),
                            'old' => $this->formatValue($metadata['old_values'][$field] ?? null),
                            'new' => $this->formatValue($metadata['new_values'][$field] ?? null),
                            'type' => 'change'
                        ];
                    }
                }
            }
        }

        // For CREATE events
        elseif (isset($metadata['event']) && $metadata['event'] === 'created') {
            $modelType = $metadata['model_type'] ?? null;
            $title = $this->getCreateTitle($modelType);

            $changes[] = [
                'field' => 'created_message',
                'label' => 'Action',
                'value' => $title,
                'type' => 'info'
            ];

            // Add details if available
            if (isset($metadata['title'])) {
                $changes[] = [
                    'field' => 'title',
                    'label' => 'Title',
                    'value' => $this->formatValue($metadata['title']),
                    'type' => 'info'
                ];
            }

            if (isset($metadata['price'])) {
                $changes[] = [
                    'field' => 'price',
                    'label' => 'Price',
                    'value' => $this->formatCurrency($metadata['price'], $metadata['currency'] ?? null),
                    'type' => 'info'
                ];
            }
        }

        // For DELETE events
        elseif (isset($metadata['event']) && $metadata['event'] === 'deleted') {
            $modelType = $metadata['model_type'] ?? null;
            $deletedName = $metadata['deleted_name'] ?? null;

            $message = $deletedName
                ? "{$this->getModelDisplayName($modelType)} '{$deletedName}' has been deleted"
                : "{$this->getModelDisplayName($modelType)} has been deleted";

            $changes[] = [
                'field' => 'deleted',
                'label' => 'Deleted',
                'value' => $message,
                'type' => 'info'
            ];
        }

        return $changes;
    }

    /**
     * Get title for create events based on model type
     */
    private function getCreateTitle($modelType)
    {
        $titles = [
            'App\\Models\\User' => 'User account created',
            'App\\Models\\Task' => 'New task created',
            'App\\Models\\WishItem' => 'New wishlist item created',
            'App\\Models\\Membership' => 'New membership plan created',
            'App\\Models\\Product' => 'New product created',
            'App\\Models\\Cover' => 'Cover image uploaded',
            'App\\Models\\Post' => 'New post created',
            'App\\Models\\Shop' => 'New shop item created',
            'App\\Models\\Bills' => 'New bill created',
            'App\\Models\\PiggyPot' => 'New piggy pot created',
            'App\\Models\\TipGoal' => 'New tip goal created',
            'App\\Models\\PostLike' => 'Post liked',
            'App\\Models\\PostComment' => 'Comment added',
            'App\\Models\\PostCommentReplies' => 'Reply added',
            'App\\Models\\Follow' => 'Creator followed',
        ];

        // Try to get title from the mapping
        if (isset($titles[$modelType])) {
            return $titles[$modelType];
        }

        // Extract just the class name if it's a full namespace
        $cleanType = class_basename($modelType);

        // Check if we have a title for the clean type
        $cleanTitles = [
            'User' => 'User account created',
            'Task' => 'New task created',
            'WishItem' => 'New wishlist item created',
            'Membership' => 'New membership plan created',
            'Product' => 'New product created',
            'Cover' => 'Cover image uploaded',
            'Post' => 'New post created',
            'Shop' => 'New shop item created',
            'Bills' => 'New bill created',
            'PiggyPot' => 'New piggy pot created',
            'TipGoal' => 'New tip goal created',
            'PostLike' => 'Post liked',
            'PostComment' => 'Comment added',
            'PostCommentReplies' => 'Reply added',
            'Follow' => 'Creator followed',
        ];

        if (isset($cleanTitles[$cleanType])) {
            return $cleanTitles[$cleanType];
        }

        // Default title
        return "New {$cleanType} created";
    }

    /**
     * Format currency values
     */
    private function formatCurrency($amount, $currency = null)
    {
        if ($amount === null || $amount === '') return '—';

        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥',
        ];

        $symbol = $currency ? ($symbols[strtoupper($currency)] ?? $currency . ' ') : '';
        return $symbol . number_format((float)$amount, 2);
    }

    /**
     * Get model display name
     */
    private function getModelDisplayName($modelType)
    {
        $names = [
            'App\\Models\\User' => 'User',
            'App\\Models\\Task' => 'Task',
            'App\\Models\\WishItem' => 'Wishlist Item',
            'App\\Models\\Membership' => 'Membership Plan',
            'App\\Models\\Product' => 'Product',
            'App\\Models\\Cover' => 'Cover Image',
            'App\\Models\\Post' => 'Post',
            'App\\Models\\Shop' => 'Shop Item',
            'App\\Models\\Bills' => 'Bill',
        ];

        return $names[$modelType] ?? class_basename($modelType);
    }

    /**
     * Format field name to be more readable
     */
    private function formatFieldName($field)
    {
        // Special field name mappings
        $specialMappings = [
            // User fields
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

            // WishItem fields
            'wishname' => 'Wish Name',
            'price' => 'Price',
            'currency' => 'Currency',
            'repeat_purchase' => 'Repeat Purchase',
            'tax_amount' => 'Tax Amount',
            'subscription' => 'Subscription',
            'subscription_period' => 'Subscription Period',
            'item_url' => 'Item URL',
            'content_file_name' => 'File Name',

            // Common fields
            'cover' => 'Cover Image',
            'cover_approved' => 'Cover Approval Status',
            'is_approved' => 'Approval Status',
            'approved' => 'Approval Status',
            'created_at' => 'Created Date',
            'updated_at' => 'Updated Date',
            'deleted_at' => 'Deleted Date',
            'title' => 'Title',
            'description' => 'Description',
            'amount' => 'Amount',
            'plan_name' => 'Plan Name',
            'user_id' => 'User ID',
            'ai_generated' => 'AI Generated',
            'content_file' => 'Content File',
            'content_file_size' => 'File Size',
            'content_file_type' => 'File Type',
            'thumbnail' => 'Thumbnail',
            'uuid' => 'UUID',
        ];

        if (isset($specialMappings[$field])) {
            return $specialMappings[$field];
        }

        // Convert snake_case to Title Case with spaces
        return ucwords(str_replace('_', ' ', $field));
    }

    /**
     * Format value for display
     */
    private function formatValue($value)
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_array($value)) {
            return json_encode($value);
        }

        if (is_numeric($value)) {
            return (string) $value;
        }

        return (string) $value;
    }

    /**
     * Get activity status for widget display
     */
    public function getActivityStatus()
    {
        $user = Auth::user();
        $activityStatus = $this->activityService->validateCreatorActivity($user);

        return response()->json($activityStatus);
    }

    /**
     * Force refresh activity cache
     */
    public function refreshActivity()
    {
        $user = Auth::user();

        // Clear activity cache if you implement caching
        // cache()->forget("creator_activity_{$user->id}");

        $activityStatus = $this->activityService->validateCreatorActivity($user);

        return response()->json([
            'success' => true,
            'activityStatus' => $activityStatus,
            'message' => 'Activity status refreshed successfully'
        ]);
    }

    /**
     * Get content breakdown by type
     */
    private function getContentBreakdown($user)
    {
        $sinceDate = Carbon::now()->subDays(28);

        $posts = Post::where('user_id', $user->id)
            ->where('approved', 1)
            ->where('created_at', '>=', $sinceDate)
            ->count();

        $wishes = WishItem::where('user_id', $user->id)
            ->where('is_approved', 1)
            ->where('created_at', '>=', $sinceDate)
            ->count();

        $memberships = Membership::where('user_id', $user->id)
            ->where('approved', 1)
            ->where('created_at', '>=', $sinceDate)
            ->count();

        $shops = Shop::where('user_id', $user->id)
            ->where('approved', 1)
            ->where('created_at', '>=', $sinceDate)
            ->count();

        $bills = Bills::where('user_id', $user->id)
            ->where('approved', 1)
            ->where('created_at', '>=', $sinceDate)
            ->count();

        $tasks = Task::where('creator_id', $user->id)
            ->where('is_approved', 1)
            ->where('created_at', '>=', $sinceDate)
            ->count();

        return [
            'posts' => $posts,
            'wishes' => $wishes,
            'memberships' => $memberships,
            'shops' => $shops,
            'bills' => $bills,
            'tasks' => $tasks,
            'total' => $posts + $wishes + $memberships + $shops + $bills + $tasks,
            'period' => '28 days'
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
        $timeline = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $dayContent = 0;
            $dayContent += Post::where('user_id', $user->id)
                ->where('approved', 1)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dayContent += WishItem::where('user_id', $user->id)
                ->where('is_approved', 1)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dayContent += Membership::where('user_id', $user->id)
                ->where('approved', 1)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dayContent += Shop::where('user_id', $user->id)
                ->where('approved', 1)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dayContent += Bills::where('user_id', $user->id)
                ->where('approved', 1)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dayContent += Task::where('creator_id', $user->id)
                ->where('is_approved', 1)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $timeline[] = [
                'date' => $date->format('Y-m-d'),
                'content_count' => $dayContent,
                'is_weekend' => $date->isWeekend()
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

        if (!$activityStatus['eligible']) {
            $needed = 3 - ($activityStatus['content_count'] ?? 0);

            if ($needed > 0) {
                $suggestions[] = [
                    'type' => 'create_content',
                    'priority' => 'high',
                    'title' => 'Create More Content',
                    'description' => "Add {$needed} more approved content items to reactivate payments",
                    'actions' => [
                        ['label' => 'Create Post', 'url' => route('posts.create')],
                        ['label' => 'Add Wish Item', 'url' => route('wish-items.create')],
                        ['label' => 'Create Membership', 'url' => route('memberships.create')],
                        ['label' => 'Add Shop Item', 'url' => route('shop.create')],
                        ['label' => 'Create Task', 'url' => route('task.create')]
                    ]
                ];
            }
        }

        if ($activityStatus['status'] === 'grace_period_ending') {
            $suggestions[] = [
                'type' => 'prepare_for_requirements',
                'priority' => 'medium',
                'title' => 'Prepare for Requirements',
                'description' => 'Your grace period is ending soon. Make sure you have consistent content creation habits.',
                'actions' => [
                    ['label' => 'View Content Calendar', 'url' => '/creator/calendar'],
                    ['label' => 'Set Reminders', 'url' => '/creator/settings#notifications']
                ]
            ];
        }

        return response()->json([
            'suggestions' => $suggestions,
            'activityStatus' => $activityStatus
        ]);
    }
}
