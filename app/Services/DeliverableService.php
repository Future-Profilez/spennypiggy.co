<?php

namespace App\Services;

use App\Models\Deliverable;
use App\Models\DeliverableNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DeliverableService
{
    /**
     * Create a deliverable from Stripe checkout session
     */
    public function createFromCheckoutSession(array $sessionData): ?Deliverable
    {
        try {
            $metadata = $sessionData['metadata'] ?? [];
            
            $deliverable = Deliverable::create([
                'transaction_id' => $sessionData['id'],
                'stripe_session_id' => $sessionData['id'],
                'buyer_id' => $metadata['buyer_id'] ?? null,
                'creator_id' => $metadata['creator_id'] ?? null,
                'product_type' => $metadata['product_type'] ?? 'unknown',
                'product_id' => $metadata['product_id'] ?? null,
                'status' => 'pending',
                'anonymous' => $metadata['anonymous'] ?? false,
                'message' => $metadata['message'] ?? null,
                'metadata' => [
                    'amount' => $sessionData['amount_total'] ?? 0,
                    'currency' => $sessionData['currency'] ?? 'gbp',
                    'customer_email' => $sessionData['customer_details']['email'] ?? null,
                    'payment_intent' => $sessionData['payment_intent'] ?? null,
                    'session_data' => $sessionData
                ]
            ]);

            // Generate deliverable based on product type
            $this->generateDeliverable($deliverable);

            // Send purchase confirmation
            DeliverableNotification::createPurchaseConfirmation($deliverable);

            Log::info('Deliverable created successfully', [
                'deliverable_id' => $deliverable->id,
                'transaction_id' => $deliverable->transaction_id,
                'product_type' => $deliverable->product_type
            ]);

            return $deliverable;

        } catch (\Exception $e) {
            Log::error('Failed to create deliverable from checkout session', [
                'error' => $e->getMessage(),
                'session_id' => $sessionData['id'] ?? 'unknown'
            ]);
            return null;
        }
    }

    /**
     * Generate deliverable based on product type
     */
    public function generateDeliverable(Deliverable $deliverable): void
    {
        switch ($deliverable->product_type) {
            case 'piggy_bank':
                $this->generatePiggyBankDeliverable($deliverable);
                break;
                
            case 'membership':
                $this->generateMembershipDeliverable($deliverable);
                break;
                
            case 'wish_subscription':
                $this->generateWishSubscriptionDeliverable($deliverable);
                break;
                
            case 'bill_subscription':
                $this->generateBillSubscriptionDeliverable($deliverable);
                break;
                
            case 'wish':
                $this->generateWishDeliverable($deliverable);
                break;
                
            case 'shop_item':
                $this->generateShopItemDeliverable($deliverable);
                break;
                
            default:
                Log::warning('Unknown product type for deliverable generation', [
                    'product_type' => $deliverable->product_type,
                    'deliverable_id' => $deliverable->id
                ]);
        }
    }

    /**
     * Generate Piggy Bank deliverable (Instant - 0h)
     * Deliverable: Supporter Certificate (PNG/PDF) + entry on Supporter Wall
     */
    private function generatePiggyBankDeliverable(Deliverable $deliverable): void
    {
        try {
            // Generate supporter certificate
            $certificateUrl = app(CertificateService::class)->generateSupporterCertificate($deliverable);
            
            // Generate receipt
            $receiptUrl = app(ReceiptService::class)->generateReceipt($deliverable);
            
            // Mark as delivered immediately (instant delivery)
            $deliverable->markAsDelivered($certificateUrl, $receiptUrl);
            $deliverable->update(['certificate_url' => $certificateUrl]);
            
            // Add to supporter wall (this would be handled by another service)
            // app(SupporterWallService::class)->addSupporter($deliverable);
            
            // Send delivery notification
            DeliverableNotification::createDeliverableDelivered($deliverable);
            
            Log::info('Piggy Bank deliverable generated', ['deliverable_id' => $deliverable->id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Piggy Bank deliverable', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate Membership deliverable (Instant - 0h)
     * Deliverable: Access Certificate + last approved post
     */
    private function generateMembershipDeliverable(Deliverable $deliverable): void
    {
        try {
            // Generate access certificate
            $certificateUrl = app(CertificateService::class)->generateAccessCertificate($deliverable);
            
            // Generate receipt
            $receiptUrl = app(ReceiptService::class)->generateReceipt($deliverable);
            
            // Grant access entitlement (this would be handled by membership service)
            // app(MembershipService::class)->grantAccess($deliverable);
            
            // Mark as delivered immediately (instant delivery)
            $deliverable->markAsDelivered($certificateUrl, $receiptUrl);
            $deliverable->update(['certificate_url' => $certificateUrl]);
            
            // Send delivery notification
            DeliverableNotification::createDeliverableDelivered($deliverable);
            
            Log::info('Membership deliverable generated', ['deliverable_id' => $deliverable->id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Membership deliverable', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate Wish Subscription deliverable (Instant - 0h)
     * Deliverable: Subscription Certificate + access entitlement
     */
    private function generateWishSubscriptionDeliverable(Deliverable $deliverable): void
    {
        try {
            // Generate subscription certificate
            $certificateUrl = app(CertificateService::class)->generateSubscriptionCertificate($deliverable);
            
            // Generate receipt
            $receiptUrl = app(ReceiptService::class)->generateReceipt($deliverable);
            
            // Unlock wish feed access (this would be handled by wish service)
            // app(WishService::class)->unlockFeedAccess($deliverable);
            
            // Mark as delivered immediately (instant delivery)
            $deliverable->markAsDelivered($certificateUrl, $receiptUrl);
            $deliverable->update(['certificate_url' => $certificateUrl]);
            
            // Send delivery notification
            DeliverableNotification::createDeliverableDelivered($deliverable);
            
            Log::info('Wish Subscription deliverable generated', ['deliverable_id' => $deliverable->id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Wish Subscription deliverable', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate Bill Subscription deliverable (1 day)
     * Deliverable: Monthly Receipt PDF + entitlement window
     */
    private function generateBillSubscriptionDeliverable(Deliverable $deliverable): void
    {
        try {
            // Generate monthly receipt PDF
            $receiptUrl = app(ReceiptService::class)->generateMonthlyReceipt($deliverable);
            
            // Mark as delivered (SLA: 1 day)
            $deliverable->markAsDelivered($receiptUrl, $receiptUrl);
            
            // Send delivery notification
            DeliverableNotification::createDeliverableDelivered($deliverable);
            
            Log::info('Bill Subscription deliverable generated', ['deliverable_id' => $deliverable->id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Bill Subscription deliverable', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
            
            // Send pending notification since this requires creator action
            DeliverableNotification::createDeliverablePending($deliverable);
        }
    }

    /**
     * Generate Wish deliverable (0.5 day - 12 hours)
     * Deliverable: Uploaded artifact (image/text/video/PDF) + receipt PDF
     * Note: This requires creator to upload the artifact
     */
    private function generateWishDeliverable(Deliverable $deliverable): void
    {
        try {
            // Generate receipt
            $receiptUrl = app(ReceiptService::class)->generateReceipt($deliverable);
            $deliverable->update(['receipt_url' => $receiptUrl]);
            
            // Send pending notification to buyer
            DeliverableNotification::createDeliverablePending($deliverable);
            
            // Send notification to creator about pending upload
            DeliverableNotification::createSlaWarning($deliverable);
            
            Log::info('Wish deliverable pending creator upload', ['deliverable_id' => $deliverable->id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Wish deliverable', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate Shop Item deliverable (0.5 day - 12 hours)
     * Deliverable: Uploaded artifact + receipt
     * Note: This requires creator to upload the artifact
     */
    private function generateShopItemDeliverable(Deliverable $deliverable): void
    {
        try {
            // Generate receipt
            $receiptUrl = app(ReceiptService::class)->generateReceipt($deliverable);
            $deliverable->update(['receipt_url' => $receiptUrl]);
            
            // Send pending notification to buyer
            DeliverableNotification::createDeliverablePending($deliverable);
            
            // Send notification to creator about pending upload
            DeliverableNotification::createSlaWarning($deliverable);
            
            Log::info('Shop Item deliverable pending creator upload', ['deliverable_id' => $deliverable->id]);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Shop Item deliverable', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle creator upload for pending deliverables
     */
    public function handleCreatorUpload(Deliverable $deliverable, string $uploadUrl): bool
    {
        try {
            if ($deliverable->status !== 'pending') {
                Log::warning('Attempted to upload to non-pending deliverable', [
                    'deliverable_id' => $deliverable->id,
                    'status' => $deliverable->status
                ]);
                return false;
            }

            // Mark as delivered with the uploaded artifact
            $deliverable->markAsDelivered($uploadUrl);
            
            // Send delivery notification to buyer
            DeliverableNotification::createDeliverableDelivered($deliverable);
            
            Log::info('Creator upload processed successfully', [
                'deliverable_id' => $deliverable->id,
                'upload_url' => $uploadUrl
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to process creator upload', [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Handle refund - revoke deliverable and access
     */
    public function handleRefund(string $transactionId): bool
    {
        try {
            $deliverable = Deliverable::where('transaction_id', $transactionId)->first();
            
            if (!$deliverable) {
                Log::warning('Deliverable not found for refund', ['transaction_id' => $transactionId]);
                return false;
            }

            // Revoke the deliverable
            $deliverable->revoke();
            
            // Remove access/entitlements based on product type
            $this->revokeAccess($deliverable);
            
            // Create refund notification
            $notification = DeliverableNotification::create([
                'deliverable_id' => $deliverable->id,
                'user_id' => $deliverable->buyer_id,
                'notification_type' => 'refund_processed',
                'channel' => 'email',
                'subject' => 'Refund Processed',
                'message' => 'Your refund has been processed and access has been revoked.',
                'metadata' => ['refunded_at' => Carbon::now()]
            ]);
            
            Log::info('Deliverable refund processed', [
                'deliverable_id' => $deliverable->id,
                'transaction_id' => $transactionId
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to process deliverable refund', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Revoke access based on product type
     */
    private function revokeAccess(Deliverable $deliverable): void
    {
        switch ($deliverable->product_type) {
            case 'membership':
                // app(MembershipService::class)->revokeAccess($deliverable);
                break;
                
            case 'wish_subscription':
                // app(WishService::class)->revokeFeedAccess($deliverable);
                break;
                
            case 'piggy_bank':
                // app(SupporterWallService::class)->removeSupporter($deliverable);
                break;
                
            // Other product types don't require access revocation
        }
    }
}