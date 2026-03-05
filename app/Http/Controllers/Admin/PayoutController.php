<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\Risk\PayoutService;
use Illuminate\Http\Request;

class PayoutController extends Controller
{
    protected $payoutService;

    public function __construct(PayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
    }

    /**
     * POST /admin/payout/preview
     */
    public function preview(Request $request)
    {
        // Add Authorization here (e.g., Gate::authorize('manage-payouts'))
        
        $runDate = $request->input('run_date'); // Optional override
        
        $result = $this->payoutService->calculatePayouts($runDate);
        
        // Log Access
        AuditLog::create([
            'actor' => $request->user() ? $request->user()->id : 'admin',
            'action_type' => 'PAYOUT_PREVIEW',
            'metadata_json' => ['run_date' => $result['run_date']]
        ]);

        return response()->json($result);
    }

    /**
     * POST /admin/payout/execute
     */
    public function execute(Request $request)
    {
        // Add Authorization here
        
        $previewData = $request->input('preview_data');
        
        if (!$previewData || !isset($previewData['payouts'])) {
            return response()->json(['error' => 'Invalid preview data'], 400);
        }
        
        // Re-calculate to verify? Ideally yes.
        // For simplicity, we trust the preview data passed back OR re-run.
        // Safer: Re-run calculation and compare totals?
        // Or just execute based on current state.
        // Let's re-run calculation to be safe against stale preview.
        
        $currentCalculation = $this->payoutService->calculatePayouts($previewData['run_date']);
        
        // Compare totals (basic check)
        if (abs($currentCalculation['platform_total'] - $previewData['platform_total']) > 100) { // 1 pound tolerance?
            return response()->json(['error' => 'Data changed since preview. Please re-preview.'], 409);
        }
        
        $run = $this->payoutService->executePayouts($currentCalculation);
        
        AuditLog::create([
            'actor' => $request->user() ? $request->user()->id : 'admin',
            'action_type' => 'PAYOUT_EXECUTE',
            'reference_id' => $run->id,
            'metadata_json' => ['total' => $run->totals['platform_total']]
        ]);

        return response()->json(['success' => true, 'run_id' => $run->id]);
    }
}
