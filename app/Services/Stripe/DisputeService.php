<?php

namespace App\Services\Stripe;

use App\Models\Dispute;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class DisputeService
{
    protected $stripe;
    protected $stripeUs;

    public function __construct()
    {
        // Initialize both clients with safety checks
        $ukKey = config('services.stripe.secret');
        if (empty($ukKey)) {
            $ukKey = config('services.stripe.secret');
        }
        
        $usKey = config('services.stripe.secret_us');
        if (empty($usKey)) {
            $usKey = $ukKey;
        }

        // Ensure keys are strings
        $ukKey = is_string($ukKey) ? $ukKey : 'missing_key';
        $usKey = is_string($usKey) ? $usKey : 'missing_key';

        if ($ukKey === 'missing_key') {
            Log::error("Stripe UK Secret Key is missing or invalid in configuration.");
        }
        if ($usKey === 'missing_key') {
            Log::error("Stripe US Secret Key is missing or invalid in configuration.");
        }

        $this->stripe = new StripeClient($ukKey);
        $this->stripeUs = new StripeClient($usKey);
    }

    /**
     * Get the correct Stripe client based on dispute currency
     */
    protected function getClient(Dispute $dispute)
    {
        if (strtoupper($dispute->currency) === 'USD') {
            return $this->stripeUs;
        }
        return $this->stripe;
    }

    /**
     * Submit evidence for a dispute to Stripe.
     */
    public function submitEvidence(Dispute $dispute, string $explanation, ?array $fileIds = [])
    {
        $client = $this->getClient($dispute);
        
        try {
            $creator = $dispute->creator;
            $stripeAccount = $creator ? $creator->account_id : null;

            $evidence = [
                'uncategorized_text' => $explanation,
            ];

            if ($fileIds && count($fileIds) > 0) {
                $evidence['uncategorized_file'] = $fileIds[0];
            }

            // Try with connected account header first
            try {
                $options = [];
                if ($stripeAccount) {
                    $options['stripe_account'] = $stripeAccount;
                }

                $updatedDispute = $client->disputes->update(
                    $dispute->stripe_dispute_id,
                    ['evidence' => $evidence],
                    $options
                );
            } catch (\Exception $e) {
                // If it fails with "No such dispute" and we used a connected account, 
                // it might be a platform-level dispute. Try without stripe_account.
                if (str_contains($e->getMessage(), 'No such dispute') && $stripeAccount) {
                    Log::info("Dispute not found on connected account, retrying on platform account", ['dispute_id' => $dispute->stripe_dispute_id]);
                    $updatedDispute = $client->disputes->update(
                        $dispute->stripe_dispute_id,
                        ['evidence' => $evidence]
                    );
                } else {
                    throw $e;
                }
            }

            // Mark as submitted locally
            $dispute->update([
                'evidence_status' => 'submitted',
                'has_response' => true,
                'evidence_details' => [
                    'explanation' => $explanation,
                    'file_ids' => $fileIds,
                    'submitted_at' => now(),
                    'stripe_account' => $stripeAccount
                ]
            ]);

            return ['success' => true, 'dispute' => $updatedDispute];

        } catch (\Exception $e) {
            Log::error("Failed to submit dispute evidence: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload a file to Stripe for dispute evidence from a local path.
     */
    public function uploadEvidenceFromPath(string $path, string $filename, ?string $stripeAccount = null, string $currency = 'GBP')
    {
        $client = strtoupper($currency) === 'USD' ? $this->stripeUs : $this->stripe;
        
        try {
            $options = [];
            if ($stripeAccount) {
                $options['stripe_account'] = $stripeAccount;
            }

            // Map extension to mime type
            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $mimeType = match($extension) {
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'pdf' => 'application/pdf',
                default => 'image/jpeg'
            };

            // Stripe SDK expects 'file' to be a resource or a CURLFile
            // We'll use a resource and let the SDK handle the rest.
            // However, to ensure Stripe knows the purpose and the connected account context:
            $stripeFile = $client->files->create([
                'purpose' => 'dispute_evidence',
                'file' => fopen($path, 'r'),
            ], $options);

            return $stripeFile->id;
        } catch (\Exception $e) {
            // If upload fails on connected account, try platform account
            if (str_contains($e->getMessage(), 'No such account') || str_contains($e->getMessage(), 'Permission denied')) {
                Log::info("Connected account upload failed, retrying on platform account");
                $stripeFile = $client->files->create([
                    'purpose' => 'dispute_evidence',
                    'file' => fopen($path, 'r'),
                ]);
                return $stripeFile->id;
            }
            
            Log::error("Failed to upload evidence file from path: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Upload a file to Stripe for dispute evidence.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string|null $stripeAccount
     * @return string Stripe File ID
     */
    public function uploadEvidenceFile($file, ?string $stripeAccount = null)
    {
        try {
            $options = [];
            if ($stripeAccount) {
                $options['stripe_account'] = $stripeAccount;
            }

            $stripeFile = $this->stripe->files->create([
                'purpose' => 'dispute_evidence',
                'file' => fopen($file->getRealPath(), 'r'),
            ], $options);

            return $stripeFile->id;
        } catch (\Exception $e) {
            Log::error("Failed to upload evidence file: " . $e->getMessage());
            throw $e;
        }
    }
}
