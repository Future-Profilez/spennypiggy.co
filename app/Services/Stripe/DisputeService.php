<?php

namespace App\Services\Stripe;

use App\Models\Dispute;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class DisputeService
{
    protected $stripe;

    public function __construct()
    {
        // Assuming Stripe secret is set in config
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Submit evidence for a dispute to Stripe.
     *
     * @param Dispute $dispute
     * @param string $explanation
     * @param array|null $fileIds (Stripe File IDs)
     * @return array
     */
    public function submitEvidence(Dispute $dispute, string $explanation, ?array $fileIds = [])
    {
        try {
            $evidence = [
                'uncategorized_text' => $explanation,
            ];

            if ($fileIds && count($fileIds) > 0) {
                // Attach first file as uncategorized_file for simplicity in this MVP
                // In a full implementation, we might categorize files (receipt, refund_policy, etc.)
                $evidence['uncategorized_file'] = $fileIds[0];
            }

            $updatedDispute = $this->stripe->disputes->update(
                $dispute->stripe_dispute_id,
                ['evidence' => $evidence]
            );

            // Mark as submitted locally
            $dispute->update([
                'evidence_status' => 'submitted',
                'has_response' => true,
                'evidence_details' => [
                    'explanation' => $explanation,
                    'file_ids' => $fileIds,
                    'submitted_at' => now(),
                ]
            ]);

            return ['success' => true, 'dispute' => $updatedDispute];

        } catch (\Exception $e) {
            Log::error("Failed to submit dispute evidence: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload a file to Stripe for dispute evidence.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string Stripe File ID
     */
    public function uploadEvidenceFile($file)
    {
        try {
            $fp = fopen($file->getRealPath(), 'r');
            $stripeFile = $this->stripe->files->create([
                'purpose' => 'dispute_evidence',
                'file' => $fp,
            ]);
            fclose($fp);

            return $stripeFile->id;
        } catch (\Exception $e) {
            Log::error("Failed to upload evidence file: " . $e->getMessage());
            throw $e;
        }
    }
}
