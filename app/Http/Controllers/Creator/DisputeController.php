<?php

namespace App\Http\Controllers\Creator;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Services\Stripe\DisputeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class DisputeController extends Controller
{
    protected $disputeService;

    public function __construct(DisputeService $disputeService)
    {
        $this->disputeService = $disputeService;
    }

    /**
     * List all disputes for the authenticated creator.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $disputes = Dispute::where('creator_id', $user->id)
            ->with('payment')
            ->orderByRaw("FIELD(status, 'needs_response', 'warning_needs_response', 'under_review', 'charge_refunded', 'won', 'lost')")
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Creator/Disputes/Index', [
            'disputes' => $disputes
        ]);
    }

    /**
     * Show details for a specific dispute.
     */
    public function show(Request $request, $id)
    {
        $dispute = Dispute::where('id', $id)
            ->where('creator_id', $request->user()->id)
            ->with('payment')
            ->firstOrFail();

        return Inertia::render('Creator/Disputes/Show', [
            'dispute' => $dispute
        ]);
    }

    /**
     * Submit evidence for a dispute.
     */
    public function submitEvidence(Request $request, $id)
    {
        $request->validate([
            'explanation' => 'required|string|min:20',
            'files.*' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120', // 5MB max
        ]);

        $dispute = Dispute::where('id', $id)
            ->where('creator_id', $request->user()->id)
            ->firstOrFail();

        if ($dispute->evidence_status === 'submitted' || $dispute->status === 'won' || $dispute->status === 'lost') {
            return back()->with('error', 'Evidence already submitted or dispute closed.');
        }

        try {
            $fileIds = [];
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $fileId = $this->disputeService->uploadEvidenceFile($file);
                    $fileIds[] = $fileId;
                }
            }

            $this->disputeService->submitEvidence($dispute, $request->explanation, $fileIds);

            return back()->with('success', 'Evidence submitted successfully to Stripe.');
        } catch (\Exception $e) {
            Log::error('Evidence submission failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Failed to submit evidence. Please try again later.');
        }
    }
}
