<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CreatorMetric;
use App\Models\User;
use App\Models\Dispute;
use App\Models\Payment;
use App\Services\Risk\RiskService;
use Illuminate\Http\Request;

class RiskController extends Controller
{
    protected $riskService;

    public function __construct(RiskService $riskService)
    {
        $this->riskService = $riskService;
    }

    /**
     * Override Risk Level for a creator.
     * POST /api/admin/risk/override
     */
    public function override(Request $request)
    {
        $request->validate([
            'creator_id' => 'required',
            'risk_level' => 'required|in:low,medium,high',
            'reserve_percent' => 'nullable|integer|min:0|max:100',
            'payout_delay_days' => 'nullable|integer|min:0',
        ]);

        $creatorId = $request->creator_id;
        $user = null;

        // Resolve User ID/UUID
        if (is_numeric($creatorId)) {
            $user = User::find($creatorId);
            if ($user) $creatorId = $user->uuid;
        } else {
            $user = User::where('uuid', $creatorId)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $metric = CreatorMetric::firstOrCreate(['creator_id' => $creatorId]);
        
        // Defaults based on level if not provided
        $defaults = [
            'low' => ['reserve' => 0, 'delay' => 7],
            'medium' => ['reserve' => 10, 'delay' => 7],
            'high' => ['reserve' => 25, 'delay' => 14],
        ];

        $level = $request->risk_level;
        $reserve = $request->reserve_percent ?? $defaults[$level]['reserve'];
        $delay = $request->payout_delay_days ?? $defaults[$level]['delay'];

        $metric->update([
            'risk_level' => $level,
            'reserve_percent' => $reserve,
            'payout_delay_days' => $delay,
            'is_overridden' => true,
        ]);

        AuditLog::create([
            'actor' => $request->user()->id,
            'action_type' => 'RISK_OVERRIDE',
            'reference_id' => $creatorId,
            'metadata_json' => [
                'level' => $level,
                'reserve' => $reserve,
                'delay' => $delay
            ]
        ]);

        return response()->json([
            'message' => 'Risk level overridden successfully.',
            'metric' => $metric
        ]);
    }

    /**
     * Remove Risk Override and recalculate.
     * POST /api/admin/risk/reset
     */
    public function reset(Request $request)
    {
        $request->validate([
            'creator_id' => 'required',
        ]);

        $creatorId = $request->creator_id;
        $user = null;

        // Resolve User ID/UUID
        if (is_numeric($creatorId)) {
            $user = User::find($creatorId);
            if ($user) $creatorId = $user->uuid;
        } else {
            $user = User::where('uuid', $creatorId)->first();
        }

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $metric = CreatorMetric::firstOrCreate(['creator_id' => $creatorId]);
        
        $metric->update(['is_overridden' => false]);
        
        // Trigger recalculation to restore correct level
        // Pass User object to ensure RiskService uses UUID
        $updatedMetric = $this->riskService->recalculateMetrics($user);
        
        // If request used Integer ID, return the Integer Metric record to satisfy UI
        // The RiskService syncs data to this record, so it has the correct values.
        if (is_numeric($creatorId)) {
             $intMetric = CreatorMetric::where('creator_id', (string)$creatorId)->first();
             if ($intMetric) {
                 $updatedMetric = $intMetric;
             }
        }
 
        AuditLog::create([
            'actor' => $request->user()->id,
            'action_type' => 'RISK_RESET',
            'reference_id' => $creatorId,
            'metadata_json' => []
        ]);

        return response()->json([
            'message' => 'Risk override removed. Metrics recalculated.',
            'metric' => $updatedMetric
        ]);
    }

    /**
     * Get disputes for a specific creator.
     */
    public function disputes(Request $request, $id)
    {
        $user = is_numeric($id) ? User::find($id) : User::where('uuid', $id)->first();
        if (!$user) return response()->json(['data' => []]);

        $disputes = Dispute::where(function($q) use ($user) {
                $q->where('creator_id', $user->id)
                  ->orWhere('creator_id', $user->uuid);
            })
            ->latest()
            ->get();
            
        return response()->json(['data' => $disputes]);
    }

    /**
     * Get reserves for a specific creator.
     */
    public function reserves(Request $request, $id)
    {
        $user = is_numeric($id) ? User::find($id) : User::where('uuid', $id)->first();
        if (!$user) return response()->json(['data' => []]);

        $reserves = Payment::where(function($q) use ($user) {
                $q->where('creator_id', (string)$user->id)
                  ->orWhere('creator_id', $user->uuid);
            })
            ->whereIn('status', ['review_hold', 'disputed'])
            ->latest()
            ->get();
            
        return response()->json(['data' => $reserves]);
    }

    /**
     * Explicit Recalculate Endpoint (GET/POST compatible)
     */
    public function recalculate(Request $request, $id)
    {
        $user = is_numeric($id) ? User::find($id) : User::where('uuid', $id)->first();
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $updatedMetric = $this->riskService->recalculateMetrics($user);
        
        // Return Integer record if Integer ID was requested
        if (is_numeric($id)) {
             $intMetric = CreatorMetric::where('creator_id', (string)$id)->first();
             if ($intMetric) $updatedMetric = $intMetric;
        }

        return response()->json(['metric' => $updatedMetric]);
    }
}
