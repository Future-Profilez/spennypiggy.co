<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreatorMetric;
use App\Models\PlatformRiskState;
use Illuminate\Http\Request;

class TestRiskController extends Controller
{
    /**
     * Trigger Risk Flags for Testing
     * POST /api/test/risk/on
     */
    public function triggerRisk(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Login required'], 401);

        // 1. Set Creator Metrics (Reserve & Delay)
        $metrics = CreatorMetric::firstOrCreate(['creator_id' => $user->uuid]);
        $metrics->update([
            'reserve_percent' => 10,
            'payout_delay_days' => 7,
            'top_buyer_percent' => 45.0, // Should trigger Growth Pacing banner
        ]);

        return response()->json([
            'message' => 'Risk flags ACTIVATED. Check dashboard.',
            'metrics' => $metrics
        ]);
    }

    /**
     * Clear Risk Flags
     * POST /api/test/risk/off
     */
    public function clearRisk(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Login required'], 401);

        $metrics = CreatorMetric::firstOrCreate(['creator_id' => $user->uuid]);
        $metrics->update([
            'reserve_percent' => 0,
            'payout_delay_days' => 0,
            'top_buyer_percent' => 0,
        ]);

        return response()->json([
            'message' => 'Risk flags CLEARED.',
            'metrics' => $metrics
        ]);
    }

    /**
     * Trigger Platform Freeze (Global)
     * POST /api/test/platform/freeze
     */
    public function triggerFreeze()
    {
        PlatformRiskState::create([
            'state' => 'FREEZE',
            'reason_codes' => ['TEST_FREEZE'],
            'set_by' => 'system',
            'started_at' => now(),
        ]);
        
        return response()->json(['message' => 'Platform set to FREEZE.']);
    }

    /**
     * Trigger Platform Normal (Global)
     * POST /api/test/platform/normal
     */
    public function triggerNormal()
    {
        PlatformRiskState::create([
            'state' => 'NORMAL',
            'reason_codes' => ['TEST_NORMAL'],
            'set_by' => 'system',
            'started_at' => now(),
        ]);
        
        return response()->json(['message' => 'Platform set to NORMAL.']);
    }
}
