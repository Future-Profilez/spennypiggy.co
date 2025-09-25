<?php

namespace App\Services;

use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Deliverable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CertificateService
{
    /**
     * Generate and upload certificate to Uploadcare
     */
    public function generateAndUploadCertificate(Deliverable $deliverable, $item): ?string
    {
        try {
            Log::info("Starting certificate generation", [
                'deliverable_id' => $deliverable->id,
                'item_type' => get_class($item),
                'item_id' => $item->id
            ]);

            // Generate certificate content
            $certificateContent = $this->generateCertificateContent($deliverable, $item);
            
            // Create temporary file
            $tempFileName = "certificate_{$deliverable->uuid}.svg";
            $tempFilePath = storage_path("app/temp/{$tempFileName}");
            
            // Ensure temp directory exists
            if (!is_dir(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            // Write certificate content as readable SVG to temporary file
            $lines = explode("\n", $certificateContent);
            $svgContent = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            $svgContent .= '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="' . (count($lines) * 25 + 50) . '">' . "\n";
            $svgContent .= '<rect width="100%" height="100%" fill="white"/>' . "\n";
            
            $y = 30;
            foreach ($lines as $line) {
                $svgContent .= '<text x="20" y="' . $y . '" font-family="Courier, monospace" font-size="13" fill="black">' . htmlspecialchars($line) . '</text>' . "\n";
                $y += 20;
            }
            
            $svgContent .= '</svg>';
            file_put_contents($tempFilePath, $svgContent);
            
            // Upload to Uploadcare
            $uploadcareUrl = $this->uploadToUploadcare($tempFilePath, $tempFileName);
            
            // Clean up temporary file
            unlink($tempFilePath);
            
            if ($uploadcareUrl) {
                Log::info("Certificate uploaded successfully", [
                    'deliverable_id' => $deliverable->id,
                    'certificate_url' => $uploadcareUrl
                ]);
                return $uploadcareUrl;
            }
            
            return null;
            
        } catch (\Exception $e) {
            Log::error("Failed to generate/upload certificate", [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
    
    /**
     * Generate certificate content based on item type
     */
    private function generateCertificateContent(Deliverable $deliverable, $item): string
    {
        $timestamp = now()->format('Y-m-d H:i:s T');
        
        if ($item instanceof WishItem) {
            return $this->generateWishItemCertificate($deliverable, $item, $timestamp);
        } elseif ($item instanceof Membership) {
            return $this->generateMembershipCertificate($deliverable, $item, $timestamp);
        }
        
        // Default certificate
        return $this->generateDefaultCertificate($deliverable, $item, $timestamp);
    }
    
    /**
     * Generate wish item certificate
     */
    private function generateWishItemCertificate(Deliverable $deliverable, WishItem $item, string $timestamp): string
    {
        $itemName = $item->wishname ?? 'Digital Content';
        $creatorName = $item->user->name ?? 'Creator';
        $buyerName = $deliverable->customer_name ?? ($deliverable->gifter->name ?? 'Purchaser');
        $metadata = $deliverable->metadata ?? [];
        
        $certificate = "SPENNY PIGGY - CERTIFICATE OF AUTHENTICITY\n\n";
        $certificate .= "================================================================\n\n";
        
        $certificate .= "This certificate validates the authentic purchase and delivery of:\n\n";
        
        $certificate .= "DIGITAL CONTENT: '{$itemName}'\n";
        $certificate .= "CREATED BY: {$creatorName}\n";
        $certificate .= "PURCHASED BY: {$buyerName}\n\n";
        
        // Add purchase details
        if ($deliverable->transaction_amount) {
            $currency = $deliverable->payment_currency ?? 'GBP';
            $certificate .= "PURCHASE AMOUNT: " . strtoupper($currency) . " " . number_format($deliverable->transaction_amount, 2) . "\n";
        }
        
        // Add subscription info if applicable
        if (isset($metadata['product_type']) && str_contains($metadata['product_type'], 'subscription')) {
            $certificate .= "SUBSCRIPTION TYPE: " . ucwords(str_replace('_', ' ', $metadata['product_type'])) . "\n";
        }
        
        $certificate .= "\n================================================================\n\n";
        
        $certificate .= "DELIVERY DETAILS:\n";
        $certificate .= "- Certificate ID: {$deliverable->uuid}\n";
        $certificate .= "- Transaction Date: {$timestamp}\n";
        $certificate .= "- Payment Method: Stripe Secure Payment\n";
        $certificate .= "- Delivery Status: Completed\n\n";
        
        // Add content details
        if (!empty($item->content_file)) {
            $certificate .= "CONTENT DELIVERED:\n";
            $certificate .= "- Content File: {$item->content_file_name}\n";
            $certificate .= "- File Type: " . strtoupper($item->content_file_type ?? 'Digital') . "\n";
            if (!empty($deliverable->deliverable_url)) {
                $certificate .= "- Content Access URL: {$deliverable->deliverable_url}\n";
            }
        } else {
            $certificate .= "CONTENT DELIVERED:\n";
            $certificate .= "- Media Bundle with creator content\n";
            if (!empty($deliverable->deliverable_url)) {
                $certificate .= "- Content Access URL: {$deliverable->deliverable_url}\n";
            }
        }
        
        $certificate .= "\n================================================================\n\n";
        
        $certificate .= "AUTHENTICITY GUARANTEE:\n";
        $certificate .= "This certificate serves as proof of legitimate purchase and content\n";
        $certificate .= "delivery through the Spenny Piggy platform. It validates:\n\n";
        $certificate .= "[X] Authentic creator content\n";
        $certificate .= "[X] Secure payment processing\n";
        $certificate .= "[X] Verified content delivery\n";
        $certificate .= "[X] Platform compliance standards\n\n";
        
        $certificate .= "================================================================\n\n";
        
        $certificate .= "SUPPORT & VERIFICATION:\n";
        $certificate .= "For verification or support, contact us with Certificate ID:\n";
        $certificate .= "{$deliverable->uuid}\n\n";
        $certificate .= "Website: https://spennypiggy.co\n";
        $certificate .= "Support: support@spennypiggy.co\n\n";
        
        $certificate .= "Thank you for supporting creators on Spenny Piggy!\n\n";
        $certificate .= "================================================================\n";
        $certificate .= "Generated by Spenny Piggy Content Delivery System\n";
        $certificate .= "(c) " . date('Y') . " Spenny Piggy - All Rights Reserved\n";
        
        return $certificate;
    }
    
    /**
     * Generate membership certificate
     */
    private function generateMembershipCertificate(Deliverable $deliverable, Membership $membership, string $timestamp): string
    {
        $creatorName = $membership->user->name ?? 'Creator';
        $buyerName = $deliverable->customer_name ?? ($deliverable->gifter->name ?? 'Member');
        $membershipLevel = $membership->level ?? 'Member';
        $metadata = $deliverable->metadata ?? [];
        
        $certificate = "🏆 SPENNY PIGGY - MEMBERSHIP ACCESS CERTIFICATE 🏆\n\n";
        $certificate .= "═══════════════════════════════════════════════════════════════\n\n";
        
        $certificate .= "This certificate validates the successful subscription to:\n\n";
        
        $certificate .= "👑 MEMBERSHIP: '{$creatorName}'s {$membershipLevel} Membership'\n";
        $certificate .= "🎨 CREATOR: {$creatorName}\n";
        $certificate .= "💎 MEMBER: {$buyerName}\n\n";
        
        // Add membership benefits
        $rewards = json_decode($membership->rewards, true) ?? [];
        if (!empty($rewards)) {
            $certificate .= "🎁 MEMBERSHIP BENEFITS INCLUDED:\n";
            foreach ($rewards as $reward) {
                $certificate .= "• {$reward}\n";
            }
        } else {
            $certificate .= "🎁 MEMBERSHIP BENEFITS:\n";
            $certificate .= "• Exclusive membership access\n";
            $certificate .= "• Premium creator content\n";
            $certificate .= "• Member-only perks\n";
        }
        
        $certificate .= "\n═══════════════════════════════════════════════════════════════\n\n";
        
        $certificate .= "📋 MEMBERSHIP DETAILS:\n";
        $certificate .= "• Certificate ID: {$deliverable->uuid}\n";
        $certificate .= "• Subscription Date: {$timestamp}\n";
        $certificate .= "• Payment Method: Stripe Secure Payment\n";
        $certificate .= "• Membership Status: Active\n\n";
        
        $certificate .= "🌐 ACCESS YOUR BENEFITS:\n";
        $certificate .= "Visit: https://spennypiggy.co/{$membership->user->username}/memberships\n";
        if (!empty($deliverable->deliverable_url)) {
            $certificate .= "Direct Access: {$deliverable->deliverable_url}\n";
        }
        $certificate .= "\n";
        
        $certificate .= "═══════════════════════════════════════════════════════════════\n\n";
        
        $certificate .= "🔐 MEMBERSHIP GUARANTEE:\n";
        $certificate .= "This certificate serves as proof of your active membership\n";
        $certificate .= "subscription and entitlement to all associated benefits:\n\n";
        $certificate .= "✅ Verified membership access\n";
        $certificate .= "✅ Secure payment processing\n";
        $certificate .= "✅ Exclusive member benefits\n";
        $certificate .= "✅ Platform compliance standards\n\n";
        
        $certificate .= "═══════════════════════════════════════════════════════════════\n\n";
        
        $certificate .= "📞 SUPPORT & VERIFICATION:\n";
        $certificate .= "For verification or support, contact us with Certificate ID:\n";
        $certificate .= "{$deliverable->uuid}\n\n";
        $certificate .= "🌐 Website: https://spennypiggy.co\n";
        $certificate .= "📧 Support: support@spennypiggy.co\n\n";
        
        $certificate .= "Thank you for supporting creators on Spenny Piggy! 💜\n\n";
        $certificate .= "═══════════════════════════════════════════════════════════════\n";
        $certificate .= "Generated by Spenny Piggy Content Delivery System\n";
        $certificate .= "© " . date('Y') . " Spenny Piggy - All Rights Reserved\n";
        
        return $certificate;
    }
    
    /**
     * Generate default certificate
     */
    private function generateDefaultCertificate(Deliverable $deliverable, $item, string $timestamp): string
    {
        $itemName = $item->name ?? $item->wishname ?? 'Digital Content';
        $buyerName = $deliverable->customer_name ?? ($deliverable->gifter->name ?? 'Purchaser');
        
        $certificate = "📜 SPENNY PIGGY - CERTIFICATE OF AUTHENTICITY 📜\n\n";
        $certificate .= "═══════════════════════════════════════════════════════════════\n\n";
        
        $certificate .= "This certifies the authentic purchase and delivery of:\n\n";
        $certificate .= "📦 CONTENT: '{$itemName}'\n";
        $certificate .= "💖 PURCHASED BY: {$buyerName}\n\n";
        
        $certificate .= "═══════════════════════════════════════════════════════════════\n\n";
        
        $certificate .= "📋 DELIVERY DETAILS:\n";
        $certificate .= "• Certificate ID: {$deliverable->uuid}\n";
        $certificate .= "• Transaction Date: {$timestamp}\n";
        $certificate .= "• Delivery Status: Completed\n";
        if (!empty($deliverable->deliverable_url)) {
            $certificate .= "• Content Access URL: {$deliverable->deliverable_url}\n";
        }
        $certificate .= "\n";
        
        $certificate .= "This certificate validates the authenticity of the digital deliverable.\n\n";
        
        $certificate .= "Generated by Spenny Piggy Content Delivery System\n";
        $certificate .= "© " . date('Y') . " Spenny Piggy - All Rights Reserved\n";
        
        return $certificate;
    }
    
    /**
     * Upload file to Uploadcare
     */
    private function uploadToUploadcare(string $filePath, string $fileName): ?string
    {
        try {
            Log::info("Uploading certificate to Uploadcare", [
                'file_name' => $fileName,
                'file_size' => filesize($filePath)
            ]);

            $uploadcareHost = "https://upload.uploadcare.com/base/";
            
            $response = Http::asMultipart()->post($uploadcareHost, [
                [
                    'name' => 'UPLOADCARE_PUB_KEY',
                    'contents' => env('UPLOADCARE_PUBLIC_KEY'),
                ],
                [
                    'name' => 'UPLOADCARE_STORE',
                    'contents' => '1',
                ],
                [
                    'name' => 'file',
                    'contents' => fopen($filePath, 'r'),
                    'filename' => $fileName,
                ],
            ]);
            
            if ($response->successful()) {
                $responseData = $response->json();
                if (isset($responseData['file'])) {
                    $uuid = $responseData['file'];
                    $uploadcareUrl = "https://ucarecdn.com/{$uuid}/";
                    
                    Log::info("Certificate uploaded to Uploadcare successfully", [
                        'uuid' => $uuid,
                        'url' => $uploadcareUrl
                    ]);
                    
                    return $uploadcareUrl;
                }
            }
            
            Log::error("Uploadcare upload failed", [
                'response_status' => $response->status(),
                'response_body' => $response->body()
            ]);
            
            return null;
            
        } catch (\Exception $e) {
            Log::error("Exception during Uploadcare upload", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
}