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
            'user' => $user->only(['name', 'username', 'role'])
        ]);
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
