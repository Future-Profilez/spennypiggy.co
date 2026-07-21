<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WishItem;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\TipGoalsPayment;
use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Services\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
        $perPage = $validated['per_page'] ?? 5;
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
                'message' => 'User account is suspended due to a policy violation or payout configuration issue'
            ], 403);
        }

        try {
            $isOwner = Auth::check() && Auth::id() === $profileUser->id;

            // If viewing own profile and user is a gifter (role == 0),
            // aggregate posts from creators they have paid (accessible posts).
            if ($isOwner && (int) $profileUser->role === 0 && $filter !== 'shoutouts') {
                // Collect creator IDs by payment/access types
                $subscriptionCreators = WishItem::where('subscription', 1)
                    ->whereHas('wishItemsSubscription', function ($qu) use ($profileUser) {
                        $qu->where('status', 'paid')
                           ->where('stripe_status', 'active')
                           ->where(function ($q) use ($profileUser) {
                               $q->where('user_id', $profileUser->id)
                                 ->orWhere('guest_email', $profileUser->email);
                           })
                           ->where(function ($que) {
                               $que->where(function ($recurring) {
                                   $recurring->where('recurring_for', 'continue')
                                            ->where('upcoming_payment', '>=', Carbon::now());
                               })->orWhere(function ($onetime) {
                                   $onetime->where('recurring_for', 'onetime')
                                          ->where('created_at', '>=', Carbon::now()->subDays(30));
                               });
                           });
                    })
                    ->pluck('user_id')
                    ->toArray();

                $billCreators = Bills::whereHas('payments', function ($qu) use ($profileUser) {
                        $qu->where(function ($que) {
                            $que->where('created_at', '<=', Carbon::now())
                                ->where('upcoming_payment', '>=', Carbon::now());
                        })->where(function ($q) use ($profileUser) {
                            $q->where('user_id', $profileUser->id)
                              ->orWhere('guest_email', $profileUser->email);
                        });
                    })
                    ->pluck('user_id')
                    ->toArray();

                $membershipCreators = Membership::whereHas('payments', function ($q) use ($profileUser) {
                        $q->where(function ($que) {
                            $que->where('created_at', '<=', Carbon::now())
                                ->where('upcoming_payment', '>=', Carbon::now());
                        })->where(function ($q) use ($profileUser) {
                            $q->where('user_id', $profileUser->id)
                              ->orWhere('guest_email', $profileUser->email);
                        });
                    })
                    ->pluck('user_id')
                    ->toArray();

                // Filter memberships to separate non-lifetime vs lifetime if needed
                $nonLifetimeCreators = Membership::whereHas('payments', function ($q) use ($profileUser) {
                        $q->where('recurring_type', '!=', 'lifetime')
                          ->where(function ($que) {
                              $que->where('created_at', '<=', Carbon::now())
                                  ->where('upcoming_payment', '>=', Carbon::now());
                          })
                          ->where(function ($q) use ($profileUser) {
                              $q->where('user_id', $profileUser->id)
                                ->orWhere('guest_email', $profileUser->email);
                          });
                    })
                    ->pluck('user_id')
                    ->toArray();

                $lifetimeCreators = array_diff($membershipCreators, $nonLifetimeCreators);

                // Stripe compliance: a Lifetime membership has no recurring charge to pause, so
                // when the creator stops meeting the posting cadence (content_posting_paused_at set)
                // we pause the lifetime member's access to new member content until they post again.
                if (!empty($lifetimeCreators)) {
                    $pausedCreatorIds = \App\Models\User::whereIn('id', $lifetimeCreators)
                        ->whereNotNull('content_posting_paused_at')
                        ->pluck('id')
                        ->toArray();
                    $lifetimeCreators = array_values(array_diff($lifetimeCreators, $pausedCreatorIds));
                }

                $supportCreators = TipGoalsPayment::where(function ($q) use ($profileUser) {
                        $q->where('user_id', $profileUser->id)
                          ->orWhere('guest_email', $profileUser->email);
                    })
                    ->pluck('creator_id')
                    ->toArray();

                // Map front-end filters to internal modules
                $includeSupport = in_array($filter, ['all', 'supporters'], true);
                $includeMembership = in_array($filter, ['all', 'members'], true);
                $includeSubscription = in_array($filter, ['all', 'subscribers'], true);

                $allCreators = array_unique(array_merge(
                    $supportCreators,
                    $nonLifetimeCreators,
                    $lifetimeCreators,
                    $subscriptionCreators,
                    $billCreators
                ));

                if (empty($allCreators)) {
                    return response()->json([
                        'success' => true,
                        'data' => [],
                        'pagination' => [
                            'current_page' => $page,
                            'last_page' => 1,
                            'per_page' => $perPage,
                            'total' => 0,
                            'from' => null,
                            'to' => null,
                            'has_more_pages' => false,
                        ],
                        'filter' => $filter,
                    ]);
                }

                // Build aggregated posts query
                $postsQuery = Post::whereNotNull('image')
                    ->with('user')
                    ->where('approved', 1)
                    ->where(function ($query) use (
                        $supportCreators,
                        $nonLifetimeCreators,
                        $lifetimeCreators,
                        $subscriptionCreators,
                        $billCreators,
                        $includeSupport,
                        $includeMembership,
                        $includeSubscription
                    ) {
                        if ($includeSupport && !empty($supportCreators)) {
                            $query->orWhere(function ($qu) use ($supportCreators) {
                                $qu->whereIn('user_id', $supportCreators)
                                   ->where('for_module', 'support');
                            });
                        }

                        if ($includeMembership && (!empty($nonLifetimeCreators) || !empty($lifetimeCreators))) {
                            $query->orWhere(function ($qu) use ($nonLifetimeCreators, $lifetimeCreators) {
                                $qu->where(function ($q) use ($nonLifetimeCreators, $lifetimeCreators) {
                                    $q->whereIn('user_id', $nonLifetimeCreators)
                                      ->orWhereIn('user_id', $lifetimeCreators);
                                })
                                ->where('for_module', 'membership');
                            });
                        }

                        if ($includeSubscription && (!empty($subscriptionCreators) || !empty($billCreators))) {
                            $query->orWhere(function ($qu) use ($subscriptionCreators, $billCreators) {
                                $qu->where(function ($q) use ($subscriptionCreators, $billCreators) {
                                    $q->whereIn('user_id', $subscriptionCreators)
                                      ->orWhereIn('user_id', $billCreators);
                                })
                                ->where('for_module', 'subscription');
                            });
                        }
                    })
                    ->orderBy('created_at', 'DESC');

                $posts = $postsQuery->paginate($perPage, ['*'], 'page', $page);

                // Mark all aggregated posts as unlocked for the gifter (self-view)
                $posts->through(function ($post) {
                    $post->is_lock = 0;
                    return $post;
                });

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
            }

            // Default: return creator's own posts list with access checks
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
            Log::error('Error fetching profile posts', [
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
                ->first();
        }

        // Try to find by ID if numeric
        if (is_numeric($identifier)) {
            return User::where('id', $identifier)
                ->first();
        }

        return null;
    }
}