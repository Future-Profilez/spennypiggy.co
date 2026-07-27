<?php

namespace App\Http\Controllers\Creator;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Models\SupportTicket;
use App\Services\Stripe\DisputeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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

        $disputes = Dispute::where('creator_id', $user->uuid)
            ->with('payment')
            ->orderByRaw("FIELD(status, 'needs_response', 'warning_needs_response', 'under_review', 'charge_refunded', 'won', 'lost')")
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Attach gifter info to each dispute's payment
        $disputes->getCollection()->transform(function ($dispute) {
            if ($dispute->payment) {
                $gifter = $dispute->payment->getGifter();
                if ($gifter) {
                    $dispute->payment->supporter = [
                        'name' => $gifter->name,
                        'username' => $gifter->username,
                        'avatar' => $gifter->avatar_url,
                    ];
                }
            }

            return $dispute;
        });

        $tickets = SupportTicket::where('creator_id', $user->id)
            ->where('type', 'refund')
            ->with(['supporter'])
            ->orderByRaw("FIELD(status, 'awaiting_creator', 'escalated', 'awaiting_supporter', 'refund_initiated', 'refunded', 'rejected', 'resolved')")
            ->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'tickets_page');

        $queries = SupportTicket::where('creator_id', $user->id)
            ->where('type', 'contact')
            ->with(['supporter'])
            ->orderByRaw("FIELD(status, 'awaiting_creator', 'escalated', 'awaiting_supporter', 'resolved')")
            ->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'queries_page');

        // Calculate counts of only UNRESOLVED tickets and queries for the tab badges
        $unresolvedTicketsCount = SupportTicket::where('creator_id', $user->id)
            ->where('type', 'refund')
            ->whereNotIn('status', ['resolved', 'refunded', 'rejected', 'refund_initiated'])
            ->count();

        $unresolvedQueriesCount = SupportTicket::where('creator_id', $user->id)
            ->where('type', 'contact')
            ->whereNotIn('status', ['resolved', 'refunded', 'rejected'])
            ->count();

        return Inertia::render('Creator/Disputes/Index', [
            'disputes' => $disputes,
            'tickets' => $tickets,
            'queries' => $queries,
            'unresolvedTicketsCount' => $unresolvedTicketsCount,
            'unresolvedQueriesCount' => $unresolvedQueriesCount,
        ]);
    }

    /**
     * Show details for a specific dispute.
     */
    public function show(Request $request, $id)
    {
        $dispute = Dispute::where('id', $id)
            ->where('creator_id', $request->user()->uuid)
            ->with('payment')
            ->firstOrFail();

        if ($dispute->payment) {
            $gifter = $dispute->payment->getGifter();
            if ($gifter) {
                $dispute->payment->supporter = [
                    'name' => $gifter->name,
                    'username' => $gifter->username,
                    'avatar' => $gifter->avatar_url,
                    'email' => $gifter->email,
                ];
            }
        }

        return Inertia::render('Creator/Disputes/Show', [
            'dispute' => $dispute,
        ]);
    }

    /**
     * Submit evidence for a dispute.
     */
    public function submitEvidence(Request $request, $id)
    {
        $request->validate([
            'explanation' => 'required|string|min:20',
            'files' => 'nullable|array',
            'files.*.uuid' => 'required|string',
            'files.*.name' => 'required|string',
        ]);

        $dispute = Dispute::where('id', $id)
            ->where('creator_id', $request->user()->uuid)
            ->with('creator')
            ->firstOrFail();

        if ($dispute->evidence_status === 'submitted' || $dispute->status === 'won' || $dispute->status === 'lost') {
            return back()->with('error', 'Evidence already submitted or dispute closed.');
        }

        try {
            $fileIds = [];
            $stripeAccount = $dispute->creator ? $dispute->creator->account_id : null;

            $uploadedFiles = $request->input('files', []);

            if (is_array($uploadedFiles)) {
                foreach ($uploadedFiles as $fileData) {
                    $uuid = $fileData['uuid'] ?? null;
                    $filename = $fileData['name'] ?? 'evidence.jpg';

                    if (! $uuid) {
                        continue;
                    }

                    // Download from Uploadcare to temp file
                    $extension = pathinfo($filename, PATHINFO_EXTENSION) ?: 'jpg';
                    $tempPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'dispute_'.uniqid().'.'.$extension;

                    try {
                        $response = Http::timeout(30)->get("https://ucarecdn.com/{$uuid}/");

                        if ($response->successful()) {
                            file_put_contents($tempPath, $response->body());

                            // Upload to Stripe with the creator's account ID and dispute currency
                            $fileId = $this->disputeService->uploadEvidenceFromPath($tempPath, $filename, $stripeAccount, $dispute->currency);
                            $fileIds[] = $fileId;
                        } else {
                            Log::error('Failed to download from Uploadcare', [
                                'uuid' => $uuid,
                                'status' => $response->status(),
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error('Error downloading file from Uploadcare', [
                            'uuid' => $uuid,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    // Clean up
                    if (file_exists($tempPath)) {
                        unlink($tempPath);
                    }
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
