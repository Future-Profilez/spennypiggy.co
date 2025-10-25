<?php

namespace App\Jobs;

use App\Models\TipGoalsPayment;
use App\Models\Deliverable;
use App\Services\CertificateService;
use App\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TipPaymentMailToUser implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tipPayment;
    public $currency;

    /**
     * Create a new job instance.
     */
    public function __construct(TipGoalsPayment $tipPayment, ?string $currency = null)
    {
        $this->tipPayment = $tipPayment;
        $this->currency = $currency ?? $tipPayment->currency ?? 'USD';
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('TipPaymentMailToUser job started', [
            'tip_payment_id' => $this->tipPayment->id,
            'tip_payment_uuid' => $this->tipPayment->uuid,
            'creator_id' => $this->tipPayment->creator_id,
            'supporter_id' => $this->tipPayment->user_id,
            'amount' => $this->tipPayment->amount,
            'currency' => $this->currency
        ]);

        try {
            // Create deliverable record for supporter access
            $deliverable = $this->createSupporterDeliverable();

            if ($deliverable) {
                // Generate and attach certificate
                $this->generateSupporterCertificate($deliverable);

                // Send email to supporter
                $this->sendSupporterEmail($deliverable);

                Log::info('TipPaymentMailToUser completed successfully', [
                    'tip_payment_id' => $this->tipPayment->id,
                    'deliverable_id' => $deliverable->id,
                    'certificate_url' => $deliverable->certificate_url
                ]);
            } else {
                Log::error('TipPaymentMailToUser: Failed to create deliverable');
            }

        } catch (\Exception $e) {
            Log::error('TipPaymentMailToUser: Job failed with exception', [
                'tip_payment_id' => $this->tipPayment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Create deliverable record for supporter access
     */
    private function createSupporterDeliverable()
    {
        try {
            // Determine customer email and name
            $customerEmail = null;
            $customerName = null;
            $gifterId = null;
            $paymentIntentId = null;

            if ($this->tipPayment->user) {
                $customerEmail = $this->tipPayment->user->email;
                $customerName = $this->tipPayment->user->name;
                $gifterId = $this->tipPayment->user_id;
            } else {
                $customerEmail = $this->tipPayment->guest_email;
                $customerName = $this->tipPayment->guest_name ?? 'Supporter';
            }

            if (empty($customerEmail)) {
                Log::error('TipPaymentMailToUser: No customer email available', [
                    'tip_payment_id' => $this->tipPayment->id
                ]);
                return null;
            }
            
            // Extract payment intent ID from Stripe session for metadata updates
            if ($this->tipPayment->session_id) {
                try {
                    $session = \App\StripeControl::getCheckoutSession($this->tipPayment->session_id);
                    $paymentIntentId = $session->payment_intent ?? null;
                    
                    Log::info('TipPaymentMailToUser: Extracted payment intent from session', [
                        'tip_payment_id' => $this->tipPayment->id,
                        'session_id' => $this->tipPayment->session_id,
                        'payment_intent_id' => $paymentIntentId
                    ]);
                } catch (\Exception $e) {
                    Log::warning('TipPaymentMailToUser: Could not retrieve session for payment intent', [
                        'tip_payment_id' => $this->tipPayment->id,
                        'session_id' => $this->tipPayment->session_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $deliverable = Deliverable::create([
                'uuid' => Str::uuid(),
                'product_id' => 'supporter_access_' . $this->tipPayment->creator_id, // Supporter access to creator
                'item_id' => $this->tipPayment->tip_goal_id, // Reference tip goal if exists
                'price_id' => null,
                'creator_id' => $this->tipPayment->creator_id, // Creator being supported
                'gifter_id' => $gifterId, // Supporter user ID (null for guests)
                'payment_intent_id' => $paymentIntentId, // Extract from Stripe session for metadata updates
                'session_id' => $this->tipPayment->session_id,
                'deliverable_type' => 'access', // Supporter access type
                'product_type' => 'support_payment', // Support/tip payment
                'transaction_amount' => $this->tipPayment->amount, // Amount in original currency
                'deliverable_url' => null, // Will be set to certificate URL
                'customer_email' => $customerEmail,
                'customer_name' => $customerName,
                'payment_status' => $this->tipPayment->status,
                'payment_currency' => $this->tipPayment->currency,
                'anonymous' => $this->tipPayment->anonymous ?? false,
                'message' => $this->tipPayment->message,
                'metadata' => json_encode([
                    'tip_payment_id' => $this->tipPayment->id,
                    'tip_payment_uuid' => $this->tipPayment->uuid,
                    'tip_goal_id' => $this->tipPayment->tip_goal_id,
                    'tip_goal_name' => $this->tipPayment->tipGoal->name ?? null,
                    'creator_name' => $this->tipPayment->creator->name,
                    'creator_username' => $this->tipPayment->creator->username,
                    'supporter_name' => $customerName,
                    'support_amount' => $this->tipPayment->amount,
                    'support_currency' => $this->tipPayment->currency,
                    'supporter_message' => $this->tipPayment->message,
                    'is_anonymous' => $this->tipPayment->anonymous ?? false,
                    'access_type' => 'supporter_posts', // Access to supporter-only posts
                    'access_duration_days' => 30, // 30-day supporter status
                    'certificate' => 'true', // Enable certificate generation
                ]),
                'status' => 'delivered', // Supporter access is immediate
                'delivered_at' => now()
            ]);

            Log::info('TipPaymentMailToUser: Supporter deliverable created', [
                'deliverable_id' => $deliverable->id,
                'tip_payment_id' => $this->tipPayment->id,
                'creator_id' => $this->tipPayment->creator_id,
                'supporter_email' => $customerEmail
            ]);

            return $deliverable;

        } catch (\Exception $e) {
            Log::error('TipPaymentMailToUser: Failed to create supporter deliverable', [
                'tip_payment_id' => $this->tipPayment->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Generate supporter certificate and attach to deliverable
     */
    private function generateSupporterCertificate($deliverable)
    {
        try {
            Log::info('TipPaymentMailToUser: Generating supporter certificate', [
                'deliverable_id' => $deliverable->id,
                'tip_payment_id' => $this->tipPayment->id
            ]);

            $certificateService = new CertificateService();
            $certificateUrl = $certificateService->generateAndUploadSupportCertificate($this->tipPayment);

            if ($certificateUrl) {
                $deliverable->update([
                    'certificate_url' => $certificateUrl,
                    'deliverable_url' => $certificateUrl // Certificate serves as the deliverable
                ]);

                // Also update the tip payment record
                $this->tipPayment->update(['certificate_url' => $certificateUrl]);

                Log::info('TipPaymentMailToUser: Certificate generated and attached', [
                    'deliverable_id' => $deliverable->id,
                    'certificate_url' => $certificateUrl
                ]);

                // Dispatch job to update Stripe payment intent metadata with certificate URL
                if ($deliverable->product_type === 'support_payment') {
                    \App\Jobs\UpdateSupportPaymentStripeMetadata::dispatch($deliverable->id)
                        ->delay(now()->addSeconds(10)); // Small delay to ensure database transaction is complete
                    
                    Log::info('TipPaymentMailToUser: Dispatched UpdateSupportPaymentStripeMetadata job', [
                        'deliverable_id' => $deliverable->id,
                        'certificate_url' => $certificateUrl
                    ]);
                }
            } else {
                Log::error('TipPaymentMailToUser: Certificate generation failed', [
                    'deliverable_id' => $deliverable->id
                ]);
            }

        } catch (\Exception $e) {
            Log::error('TipPaymentMailToUser: Certificate generation exception', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send supporter email notification
     */
    private function sendSupporterEmail($deliverable)
    {
        try {
            Log::info('TipPaymentMailToUser: Sending supporter email', [
                'deliverable_id' => $deliverable->id,
                'customer_email' => $deliverable->customer_email
            ]);

            // Check if user has notifications enabled (for authenticated users)
            $shouldSendEmail = false;
            
            if ($this->tipPayment->user && $this->tipPayment->user->notification_send == 1) {
                $shouldSendEmail = true;
                Log::info('TipPaymentMailToUser: Sending email - user notifications enabled');
            } elseif (!$this->tipPayment->user && !empty($this->tipPayment->guest_email)) {
                $shouldSendEmail = true;
                Log::info('TipPaymentMailToUser: Sending email - guest supporter');
            }

            if (!$shouldSendEmail) {
                Log::info('TipPaymentMailToUser: Email not sent - notifications disabled or no email', [
                    'has_user' => $this->tipPayment->user ? 'yes' : 'no',
                    'notification_send' => $this->tipPayment->user->notification_send ?? 'null'
                ]);
                return;
            }

            // Create data structure compatible with existing tip-granted template
            $emailData = (object) [
                'id' => $this->tipPayment->id,
                'uuid' => $this->tipPayment->uuid,
                'amount_subtotal' => $this->tipPayment->amount,
                'currency' => $this->tipPayment->currency,
                'session_id' => $this->tipPayment->session_id,
                'user_id' => $this->tipPayment->user_id,
                'guest_email' => $this->tipPayment->guest_email,
                'user' => $this->tipPayment->user,
                'owner_id' => $this->tipPayment->creator_id,
                'owner' => $this->tipPayment->creator,
                'anonymous' => $this->tipPayment->anonymous,
                'message' => $this->tipPayment->message,
                'deliverable' => $deliverable,
                'certificate_url' => $deliverable->certificate_url,
                'tip_goal' => $this->tipPayment->tipGoal,
                // Additional fields for compatibility with existing template
                'creator' => $this->tipPayment->creator,  // For tip-granted template compatibility
                'amount' => $this->tipPayment->amount     // For tip-granted template compatibility
            ];

            // Use the existing email service
            EmailService::sendSupportPaymentToUser($emailData, $this->currency);

            Log::info('TipPaymentMailToUser: Email sent successfully', [
                'deliverable_id' => $deliverable->id,
                'customer_email' => $deliverable->customer_email
            ]);

        } catch (\Exception $e) {
            Log::error('TipPaymentMailToUser: Failed to send email', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}