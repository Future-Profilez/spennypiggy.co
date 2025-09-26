<?php

namespace App\Jobs;

use App\Models\TipGoalsPayment;
use App\Services\CertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateSupportCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tipPayment;

    /**
     * Create a new job instance.
     */
    public function __construct(TipGoalsPayment $tipPayment)
    {
        $this->tipPayment = $tipPayment;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Generating support certificate for tip payment', [
                'tip_payment_id' => $this->tipPayment->id,
                'tip_payment_uuid' => $this->tipPayment->uuid,
                'creator_id' => $this->tipPayment->creator_id,
                'amount' => $this->tipPayment->amount
            ]);

            $certificateService = new CertificateService();
            $certificateUrl = $certificateService->generateAndUploadSupportCertificate($this->tipPayment);

            if ($certificateUrl) {
                $this->tipPayment->update(['certificate_url' => $certificateUrl]);
                
                Log::info('Support certificate generated and saved', [
                    'tip_payment_id' => $this->tipPayment->id,
                    'certificate_url' => $certificateUrl
                ]);
            } else {
                Log::error('Failed to generate support certificate', [
                    'tip_payment_id' => $this->tipPayment->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Exception in GenerateSupportCertificateJob', [
                'tip_payment_id' => $this->tipPayment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
