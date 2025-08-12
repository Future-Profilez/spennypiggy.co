<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WishItem;
use App\Models\Bills;
use App\Models\TipGoal;
use App\Models\Shop;
use App\Models\Membership;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SocialEngagementController extends Controller
{
    /**
     * Get trending items across all content types
     * 
     * This replaces the old price-based sorting with social engagement metrics
     */
    public function getTrendingContent(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        
        // Get trending wish items
        $trendingWishes = WishItem::where('trending_status', true)
            ->where('is_approved', 1)
            ->orderBy('rising_score', 'desc')
            ->orderBy('supporter_count', 'desc')
            ->with(['user'])
            ->limit($limit)
            ->get();

        // Get trending bills
        $trendingBills = Bills::where('trending_status', true)
            ->where('status', 1)
            ->orderBy('rising_score', 'desc')
            ->orderBy('supporter_count', 'desc')
            ->with(['user'])
            ->limit($limit)
            ->get();

        // Get trending shops
        $trendingShops = Shop::where('trending_status', true)
            ->orderBy('rising_score', 'desc')
            ->orderBy('supporter_count', 'desc')
            ->with(['user'])
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'trending_wishes' => $trendingWishes,
                'trending_bills' => $trendingBills,
                'trending_shops' => $trendingShops,
            ],
            'meta' => [
                'total_trending_items' => $trendingWishes->count() + $trendingBills->count() + $trendingShops->count(),
                'sorted_by' => 'social_engagement_metrics',
                'deprecated_fields' => 'price, currency, amount fields are deprecated in favor of social metrics'
            ]
        ]);
    }

    /**
     * Get content by engagement level
     * 
     * Replaces old price-range filtering with engagement-level filtering
     */
    public function getByEngagementLevel(Request $request, string $engagementLevel): JsonResponse
    {
        $request->validate([
            'type' => 'nullable|in:wishes,bills,shops,memberships,all',
            'limit' => 'nullable|integer|min:1|max:100'
        ]);

        $validEngagementLevels = ['low', 'medium', 'high', 'viral'];
        if (!in_array($engagementLevel, $validEngagementLevels)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid engagement level. Must be one of: ' . implode(', ', $validEngagementLevels)
            ], 400);
        }

        $type = $request->get('type', 'all');
        $limit = $request->get('limit', 50);
        $results = [];

        if ($type === 'all' || $type === 'wishes') {
            $results['wishes'] = WishItem::where('engagement_level', $engagementLevel)
                ->where('is_approved', 1)
                ->orderBy('supporter_count', 'desc')
                ->orderBy('rising_score', 'desc')
                ->with(['user'])
                ->limit($limit)
                ->get();
        }

        if ($type === 'all' || $type === 'bills') {
            $results['bills'] = Bills::where('engagement_level', $engagementLevel)
                ->where('status', 1)
                ->orderBy('supporter_count', 'desc')
                ->orderBy('rising_score', 'desc')
                ->with(['user'])
                ->limit($limit)
                ->get();
        }

        if ($type === 'all' || $type === 'shops') {
            $results['shops'] = Shop::where('engagement_level', $engagementLevel)
                ->orderBy('supporter_count', 'desc')
                ->orderBy('rising_score', 'desc')
                ->with(['user'])
                ->limit($limit)
                ->get();
        }

        if ($type === 'all' || $type === 'memberships') {
            $results['memberships'] = Membership::where('engagement_level', $engagementLevel)
                ->where('status', 1)
                ->orderBy('supporter_count', 'desc')
                ->orderBy('rising_score', 'desc')
                ->with(['user'])
                ->limit($limit)
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $results,
            'meta' => [
                'engagement_level' => $engagementLevel,
                'type' => $type,
                'sorted_by' => 'supporter_count_desc,rising_score_desc',
                'note' => 'Results sorted by social engagement metrics instead of monetary values'
            ]
        ]);
    }

    /**
     * Get creators with highest growth rates
     * 
     * This provides insight into which creators are gaining momentum
     */
    public function getHighGrowthCreators(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $minGrowthRate = $request->get('min_growth_rate', 10.0);

        // Get creators with highest growth rates across all content types
        $highGrowthWishes = WishItem::where('creator_growth_rate', '>=', $minGrowthRate)
            ->where('is_approved', 1)
            ->orderBy('creator_growth_rate', 'desc')
            ->orderBy('supporter_count', 'desc')
            ->with(['user'])
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'high_growth_wishes' => $highGrowthWishes,
            ],
            'meta' => [
                'min_growth_rate' => $minGrowthRate,
                'sorted_by' => 'creator_growth_rate_desc',
                'total_results' => $highGrowthWishes->count()
            ]
        ]);
    }

    /**
     * Get gift frequency statistics
     * 
     * Shows how often different types of content receive gifts
     */
    public function getGiftFrequencyStats(Request $request): JsonResponse
    {
        $stats = [
            'wishes' => [
                'daily' => WishItem::where('gift_frequency', 'daily')->where('is_approved', 1)->count(),
                'weekly' => WishItem::where('gift_frequency', 'weekly')->where('is_approved', 1)->count(),
                'monthly' => WishItem::where('gift_frequency', 'monthly')->where('is_approved', 1)->count(),
                'rarely' => WishItem::where('gift_frequency', 'rarely')->where('is_approved', 1)->count(),
            ],
            'bills' => [
                'daily' => Bills::where('gift_frequency', 'daily')->where('status', 1)->count(),
                'weekly' => Bills::where('gift_frequency', 'weekly')->where('status', 1)->count(),
                'monthly' => Bills::where('gift_frequency', 'monthly')->where('status', 1)->count(),
                'rarely' => Bills::where('gift_frequency', 'rarely')->where('status', 1)->count(),
            ],
            'shops' => [
                'daily' => Shop::where('gift_frequency', 'daily')->count(),
                'weekly' => Shop::where('gift_frequency', 'weekly')->count(),
                'monthly' => Shop::where('gift_frequency', 'monthly')->count(),
                'rarely' => Shop::where('gift_frequency', 'rarely')->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'meta' => [
                'description' => 'Gift frequency statistics across all content types',
                'note' => 'This replaces monetary-based analytics with social engagement patterns'
            ]
        ]);
    }

    /**
     * Get content by supporter count range
     * 
     * Replaces old price range filtering with supporter count filtering
     */
    public function getBySupporterCount(Request $request): JsonResponse
    {
        $request->validate([
            'min_supporters' => 'nullable|integer|min:0',
            'max_supporters' => 'nullable|integer|min:0',
            'type' => 'nullable|in:wishes,bills,shops,memberships',
            'limit' => 'nullable|integer|min:1|max:100'
        ]);

        $minSupporters = $request->get('min_supporters', 0);
        $maxSupporters = $request->get('max_supporters', null);
        $type = $request->get('type', 'wishes');
        $limit = $request->get('limit', 30);

        $query = match($type) {
            'wishes' => WishItem::where('is_approved', 1),
            'bills' => Bills::where('status', 1),
            'shops' => Shop::query(),
            'memberships' => Membership::where('status', 1),
        };

        $query->where('supporter_count', '>=', $minSupporters);
        
        if ($maxSupporters !== null) {
            $query->where('supporter_count', '<=', $maxSupporters);
        }

        $results = $query
            ->orderBy('supporter_count', 'desc')
            ->orderBy('rising_score', 'desc')
            ->with(['user'])
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $results,
            'meta' => [
                'min_supporters' => $minSupporters,
                'max_supporters' => $maxSupporters,
                'type' => $type,
                'total_results' => $results->count(),
                'note' => 'Filtered by supporter count instead of price range'
            ]
        ]);
    }

    /**
     * Update social engagement metrics for a specific item
     * 
     * This would typically be called by background jobs or webhooks
     * when engagement events occur (likes, shares, follows, etc.)
     */
    public function updateEngagementMetrics(Request $request): JsonResponse
    {
        $request->validate([
            'item_type' => 'required|in:wish_item,bill,shop,membership',
            'item_id' => 'required|integer',
            'supporter_count' => 'nullable|integer|min:0',
            'gift_frequency' => 'nullable|in:daily,weekly,monthly,rarely',
            'creator_growth_rate' => 'nullable|numeric|min:0|max:100',
            'rising_score' => 'nullable|integer|min:0|max:100',
            'engagement_level' => 'nullable|in:low,medium,high,viral',
            'trending_status' => 'nullable|boolean',
        ]);

        $model = match($request->item_type) {
            'wish_item' => WishItem::find($request->item_id),
            'bill' => Bills::find($request->item_id),
            'shop' => Shop::find($request->item_id),
            'membership' => Membership::find($request->item_id),
        };

        if (!$model) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found'
            ], 404);
        }

        // Update only provided fields
        $updateData = array_filter([
            'supporter_count' => $request->supporter_count,
            'gift_frequency' => $request->gift_frequency,
            'creator_growth_rate' => $request->creator_growth_rate,
            'rising_score' => $request->rising_score,
            'engagement_level' => $request->engagement_level,
            'trending_status' => $request->trending_status,
        ], fn($value) => $value !== null);

        $model->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Social engagement metrics updated successfully',
            'data' => $model->fresh(),
            'updated_fields' => array_keys($updateData)
        ]);
    }
}
