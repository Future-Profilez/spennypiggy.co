<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfilePostController extends Controller
{
    protected UserProfileService $profileService;

    public function __construct(UserProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    /**
     * Get paginated and filtered posts for a user profile
     */
    public function index(Request $request, $user): JsonResponse
    {
        // Validate query parameters
        $validated = $request->validate([
            'page' => 'integer|min:1|max:1000',
            'per_page' => 'integer|min:1|max:50',
            'filter' => ['string', Rule::in(['all', 'supporters', 'members', 'subscribers', 'shoutouts'])],
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 10;
        $filter = $validated['filter'] ?? 'all';

        // Resolve user by username or ID
        $profileUser = $this->resolveUser($user);
        
        if (!$profileUser) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Check if user is suspended
        if ($profileUser->suspended_account == 1) {
            return response()->json([
                'success' => false,
                'message' => 'User account is suspended'
            ], 403);
        }

        try {
            $posts = $this->profileService->getUserPosts($profileUser->id, $filter, $perPage, $page);

            return response()->json([
                'success' => true,
                'data' => $posts->items(),
                'pagination' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                    'from' => $posts->firstItem(),
                    'to' => $posts->lastItem(),
                    'has_more_pages' => $posts->hasMorePages(),
                ],
                'filter' => $filter,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching profile posts', [
                'user_id' => $profileUser->id,
                'filter' => $filter,
                'page' => $page,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch posts. Please try again later.'
            ], 500);
        }
    }

    /**
     * Resolve user by username or ID
     */
    private function resolveUser($identifier): ?User
    {
        // Try to find by username first (most common case)
        if (is_string($identifier) && !is_numeric($identifier)) {
            return User::where('username', $identifier)
                ->where('is_uk', 0)
                ->first();
        }

        // Try to find by ID if numeric
        if (is_numeric($identifier)) {
            return User::where('id', $identifier)
                ->where('is_uk', 0)
                ->first();
        }

        return null;
    }
}