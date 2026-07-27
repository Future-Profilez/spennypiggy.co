<?php

namespace App\Http\Controllers\Examples;

use App\Helpers\MembershipHelper;
use App\Http\Controllers\Controller;
use App\Services\MembershipAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Example controller showing how to implement membership-protected content
 *
 * This demonstrates the different ways to protect content with the new membership system
 */
class MemberContentController extends Controller
{
    private $membershipService;

    public function __construct(MembershipAccessService $membershipService)
    {
        $this->membershipService = $membershipService;
    }

    /**
     * METHOD 1: Using middleware to protect entire route
     * Route example: Route::get('/creator/{creatorId}/exclusive', [MemberContentController::class, 'exclusiveContent'])->middleware('auth', 'membership:45');
     */
    public function exclusiveContent(Request $request, $creatorId)
    {
        // If we get here, user has valid membership (middleware handled verification)
        $membershipAccess = $request->get('membership_access'); // Added by middleware

        return Inertia::render('ExclusiveContent', [
            'creator_id' => $creatorId,
            'membership_access' => $membershipAccess,
            'exclusive_posts' => $this->getExclusivePosts($creatorId),
            'member_level' => $membershipAccess['membership_level'] ?? 'Unknown',
        ]);
    }

    /**
     * METHOD 2: Using helper functions to check access in controller
     */
    public function creatorContent(Request $request, $creatorId)
    {
        $hasAccess = MembershipHelper::userHasAccess($creatorId);
        $accessSummary = MembershipHelper::getAccessSummary($creatorId);

        // Get all content
        $publicContent = $this->getPublicPosts($creatorId);
        $memberContent = $hasAccess ? $this->getExclusivePosts($creatorId) : [];

        return Inertia::render('CreatorContent', [
            'creator_id' => $creatorId,
            'has_membership_access' => $hasAccess,
            'membership_summary' => $accessSummary,
            'public_content' => $publicContent,
            'member_content' => $memberContent,
            'show_membership_prompt' => ! $hasAccess,
        ]);
    }

    /**
     * METHOD 3: Using service directly for fine-grained control
     */
    public function tieredContent(Request $request, $creatorId)
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        $userId = Auth::id();

        // Check different membership levels
        $bronzeAccess = $this->membershipService->hasActiveMembership($userId, $creatorId, 'bronze');
        $silverAccess = $this->membershipService->hasActiveMembership($userId, $creatorId, 'silver');
        $goldAccess = $this->membershipService->hasActiveMembership($userId, $creatorId, 'gold');
        $lifetimeAccess = $this->membershipService->hasActiveMembership($userId, $creatorId, 'lifetime');

        // Determine highest access level
        $accessLevel = 'none';
        if ($lifetimeAccess['has_access']) {
            $accessLevel = 'lifetime';
        } elseif ($goldAccess['has_access']) {
            $accessLevel = 'gold';
        } elseif ($silverAccess['has_access']) {
            $accessLevel = 'silver';
        } elseif ($bronzeAccess['has_access']) {
            $accessLevel = 'bronze';
        }

        return Inertia::render('TieredContent', [
            'creator_id' => $creatorId,
            'access_level' => $accessLevel,
            'bronze_content' => $bronzeAccess['has_access'] ? $this->getBronzeContent($creatorId) : [],
            'silver_content' => $silverAccess['has_access'] ? $this->getSilverContent($creatorId) : [],
            'gold_content' => $goldAccess['has_access'] ? $this->getGoldContent($creatorId) : [],
            'lifetime_content' => $lifetimeAccess['has_access'] ? $this->getLifetimeContent($creatorId) : [],
        ]);
    }

    /**
     * API endpoint to check membership status
     */
    public function checkMembershipStatus(Request $request, $creatorId)
    {
        if (! Auth::check()) {
            return response()->json([
                'has_access' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $access = $this->membershipService->hasActiveMembership(Auth::id(), $creatorId);

        return response()->json([
            'has_access' => $access['has_access'],
            'membership_level' => $access['membership_level'] ?? null,
            'reason' => $access['reason'],
            'access_method' => $access['access_method'] ?? null,
            'subscription_id' => $access['subscription_id'] ?? null,
        ]);
    }

    /**
     * Get user's active memberships (dashboard/profile use)
     */
    public function userMemberships(Request $request)
    {
        if (! Auth::check()) {
            return response()->json(['memberships' => []], 401);
        }

        $memberships = $this->membershipService->getUserActiveMemberships(Auth::id());

        return response()->json([
            'memberships' => $memberships,
            'total_active' => count($memberships),
        ]);
    }

    // Example content retrieval methods (replace with your actual logic)
    private function getPublicPosts($creatorId)
    {
        return [];
    }

    private function getExclusivePosts($creatorId)
    {
        return [];
    }

    private function getBronzeContent($creatorId)
    {
        return [];
    }

    private function getSilverContent($creatorId)
    {
        return [];
    }

    private function getGoldContent($creatorId)
    {
        return [];
    }

    private function getLifetimeContent($creatorId)
    {
        return [];
    }
}

/*
USAGE EXAMPLES:

1. In routes/web.php:
Route::middleware(['auth', 'membership:45'])->group(function () {
    Route::get('/creator/45/exclusive', [MemberContentController::class, 'exclusiveContent']);
});

Route::middleware(['auth', 'membership:45,gold'])->group(function () {
    Route::get('/creator/45/gold-content', [MemberContentController::class, 'goldOnlyContent']);
});

2. In Blade templates:
@if(MembershipHelper::userHasAccess($creatorId))
    <div class="member-content">
        <!-- Exclusive content here -->
    </div>
@else
    <div class="membership-prompt">
        <p>Subscribe to access exclusive content</p>
    </div>
@endif

3. In controllers:
$hasAccess = MembershipHelper::userHasAccess($creatorId, 'gold');
if (!$hasAccess) {
    return redirect()->route('membership.purchase', ['creatorId' => $creatorId]);
}

4. For API routes:
Route::middleware(['auth', 'membership:45'])->group(function () {
    Route::get('/api/creator/45/exclusive-data', function (Request $request) {
        $membershipAccess = $request->get('membership_access');
        return response()->json([
            'data' => 'exclusive content here',
            'membership_level' => $membershipAccess['membership_level']
        ]);
    });
});
*/
