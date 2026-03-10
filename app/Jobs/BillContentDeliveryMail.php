<?php

namespace App\Jobs;

use App\EmailService;
use App\Models\Deliverable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class BillContentDeliveryMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $billPayment;
    public $currencySymbol;

    /**
     * Create a new job instance.
     */
    public function __construct($billPayment, $currencySymbol)
    {
        $this->billPayment = $billPayment;
        $this->currencySymbol = $currencySymbol;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        \Log::info('BillContentDeliveryMail job started', [
            'bill_payment_id' => $this->billPayment->id,
            'bill_id' => $this->billPayment->bill_id,
            'currency' => $this->currencySymbol
        ]);

        try {
            // Get the bill
            $bill = $this->billPayment->bill;
            
            if (!$bill) {
                \Log::error('BillContentDeliveryMail: Bill not found', [
                    'bill_payment_id' => $this->billPayment->id
                ]);
                return;
            }

            // Check if bill has content to deliver
            if (empty($bill->content_file)) {
                \Log::info('BillContentDeliveryMail: No content file to deliver', [
                    'bill_id' => $bill->id,
                    'bill_name' => $bill->name
                ]);
                return;
            }

            // Determine recipient email
            $recipientEmail = $this->billPayment->guest_email;
            $recipientName = $this->billPayment->name ?? 'Guest';

            if (empty($recipientEmail)) {
                \Log::warning('BillContentDeliveryMail: No recipient email found', [
                    'bill_payment_id' => $this->billPayment->id
                ]);
                return;
            }

            // Generate content URL
            $contentUrl = $this->generateContentUrl($bill->content_file, $bill->content_file_type ?? 'file');
            
            // Find existing deliverable record created by BillsController
            $deliverable = Deliverable::where('session_id', $this->billPayment->session_id)
                ->where('creator_id', $bill->user_id)
                ->where('gifter_id', $this->billPayment->user_id)
                ->first();
            
            if (!$deliverable) {
                \Log::error('BillContentDeliveryMail: Existing deliverable record not found', [
                    'session_id' => $this->billPayment->session_id,
                    'bill_payment_id' => $this->billPayment->id
                ]);
                return;
            }

            // Update existing deliverable with email delivery information
            $deliverable->update([
                'customer_email' => $recipientEmail,
                'customer_name' => $recipientName,
                'deliverable_url' => $contentUrl,
                'metadata' => json_encode(array_merge(
                    json_decode($deliverable->metadata, true) ?? [],
                    [
                        'email_delivered' => true,
                        'email_delivered_at' => now()->toISOString(),
                        'content_url' => $contentUrl
                    ]
                ))
            ]);

            // Dispatch ProcessWishItemDeliverable job for certificate generation
            \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);
            
            \Log::info('BillContentDeliveryMail: ProcessWishItemDeliverable job dispatched for certificate generation', [
                'deliverable_id' => $deliverable->id,
                'bill_payment_id' => $this->billPayment->id
            ]);

            // Send content delivery email
            $this->sendContentDeliveryEmail($bill, $deliverable, $recipientEmail, $recipientName);

            \Log::info('BillContentDeliveryMail: Content delivery completed successfully', [
                'bill_payment_id' => $this->billPayment->id,
                'deliverable_id' => $deliverable->id,
                'recipient_email' => $recipientEmail
            ]);

        } catch (\Exception $e) {
            \Log::error('BillContentDeliveryMail: Job failed', [
                'bill_payment_id' => $this->billPayment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Generate content URL for the file
     */
    private function generateContentUrl($contentFile, $contentType)
    {
        try {
            // Handle Uploadcare URLs
            if (strpos($contentFile, 'ucarecdn.com') !== false) {
                return $contentFile;
            }
            
            // Handle UUID format (Uploadcare)
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $contentFile)) {
                return "https://ucarecdn.com/{$contentFile}/";
            }
            
            // Handle other formats
            return $contentFile;
            
        } catch (\Exception $e) {
            \Log::error('BillContentDeliveryMail: Failed to generate content URL', [
                'content_file' => $contentFile,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Determine deliverable type based on content file type
     */
    private function determineDeliverableType($contentType)
    {
        $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        $videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
        $audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
        
        $contentType = strtolower($contentType);
        
        if (in_array($contentType, $imageTypes)) {
            return 'image';
        } elseif (in_array($contentType, $videoTypes)) {
            return 'video';
        } elseif (in_array($contentType, $audioTypes)) {
            return 'audio';
        } else {
            return 'digital_file';
        }
    }

    /**
     * Send content delivery email
     */
    private function sendContentDeliveryEmail($bill, $deliverable, $recipientEmail, $recipientName)
    {
        try {
            // Prepare email data similar to CheckoutMailToUser
            $emailData = (object) [
                'id' => $this->billPayment->id,
                'session_id' => $this->billPayment->session_id,
                'user' => null, // Bill payments are typically guest payments
                'guest_email' => $recipientEmail,
                'name' => $recipientName,
                'amount_total' => $this->billPayment->amount,
                'currency' => $this->billPayment->currency ?? 'USD',
                'owner' => $bill->user,
                'deliverables' => [$deliverable],
                'bill' => $bill
            ];

            // Add bill and content info to deliverable for email template
            $deliverable->bill = $bill;
            $deliverable->content_info = [
                'file_name' => $bill->content_file_name,
                'file_type' => $bill->content_file_type,
                'file_size' => $bill->content_file_size
            ];

            // Send email using EmailService (similar to CheckoutMailToUser)
            EmailService::billContentDelivery($emailData, $this->currencySymbol);

            \Log::info('BillContentDeliveryMail: Content delivery email sent', [
                'bill_id' => $bill->id,
                'recipient_email' => $recipientEmail,
                'deliverable_id' => $deliverable->id
            ]);

        } catch (\Exception $e) {
            \Log::error('BillContentDeliveryMail: Failed to send content delivery email', [
                'bill_id' => $bill->id,
                'recipient_email' => $recipientEmail,
                'error' => $e->getMessage()
            ]);
        }
    }
}