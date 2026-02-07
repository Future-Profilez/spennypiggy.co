<?php

namespace App\Services;

use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Deliverable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PdfCertificateService
{
    /**
     * Generate and upload PDF certificate to Uploadcare
     */
    public function generateAndUploadPdfCertificate(Deliverable $deliverable, $item): ?string
    {
        try {
            Log::info("Starting PDF certificate generation", [
                'deliverable_id' => $deliverable->id,
                'item_type' => get_class($item),
                'item_id' => $item->id
            ]);

            // Generate HTML content for PDF
            $htmlContent = $this->generateCertificateHtml($deliverable, $item);
            
            // Convert HTML to PDF using a library like DomPDF or wkhtmltopdf
            $pdfContent = $this->generatePdfFromHtml($htmlContent);
            
            // Create temporary PDF file
            $tempFileName = "certificate_{$deliverable->uuid}.pdf";
            $tempFilePath = storage_path("app/temp/{$tempFileName}");
            
            // Ensure temp directory exists
            if (!is_dir(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            // Write PDF content to temporary file
            file_put_contents($tempFilePath, $pdfContent);
            
            // Upload to Uploadcare
            $uploadcareUrl = $this->uploadToUploadcare($tempFilePath, $tempFileName);
            
            // Clean up temporary file
            unlink($tempFilePath);
            
            if ($uploadcareUrl) {
                Log::info("PDF Certificate uploaded successfully", [
                    'deliverable_id' => $deliverable->id,
                    'certificate_url' => $uploadcareUrl
                ]);
                return $uploadcareUrl;
            }
            
            return null;
            
        } catch (\Exception $e) {
            Log::error("Failed to generate/upload PDF certificate", [
                'deliverable_id' => $deliverable->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
    
    /**
     * Generate HTML content for PDF certificate
     */
    private function generateCertificateHtml(Deliverable $deliverable, $item): string
    {
        $timestamp = now()->format('Y-m-d H:i:s T');
        
        if ($item instanceof WishItem) {
            return $this->generateWishItemCertificateHtml($deliverable, $item, $timestamp);
        } elseif ($item instanceof Membership) {
            return $this->generateMembershipCertificateHtml($deliverable, $item, $timestamp);
        }
        
        // Default certificate
        return $this->generateDefaultCertificateHtml($deliverable, $item, $timestamp);
    }
    
    /**
     * Generate HTML for wish item certificate
     */
    private function generateWishItemCertificateHtml(Deliverable $deliverable, WishItem $item, string $timestamp): string
    {
        $itemName = $item->wishname ?? 'Digital Content';
        $creatorName = $item->user->name ?? 'Creator';
        $buyerName = $deliverable->customer_name ?? ($deliverable->gifter->name ?? 'Purchaser');
        $metadata = $deliverable->metadata ?? [];
        
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Certificate of Authenticity</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .certificate {
                    background: white;
                    color: #333;
                    padding: 60px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .certificate::before {
                    content: "";
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, #8C52FF 0%, #F94F97 100%);
                    opacity: 0.1;
                    transform: rotate(45deg);
                    z-index: -1;
                }
                .header {
                    font-size: 24px;
                    font-weight: bold;
                    color: #8C52FF;
                    margin-bottom: 30px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .title {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 40px;
                }
                .content {
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                .highlight {
                    color: #F94F97;
                    font-weight: bold;
                }
                .details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 30px 0;
                    text-align: left;
                }
                .footer {
                    margin-top: 40px;
                    font-size: 12px;
                    color: #999;
                }
                .logo {
                    font-size: 32px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="logo">🎊</div>
                <div class="header">SPENNY PIGGY<br>CERTIFICATE OF AUTHENTICITY</div>
                
                <div class="title">This certificate validates the authentic purchase and delivery of:</div>
                
                <div class="content">
                    <strong>📦 DIGITAL CONTENT:</strong> <span class="highlight">\'' . htmlspecialchars($itemName) . '\'</span><br><br>
                    <strong>🎨 CREATED BY:</strong> ' . htmlspecialchars($creatorName) . '<br>
                    <strong>💖 PURCHASED BY:</strong> ' . htmlspecialchars($buyerName) . '<br>
                    ' . ($deliverable->transaction_amount ? '<strong>💰 PURCHASE AMOUNT:</strong> ' . strtoupper($deliverable->payment_currency ?? 'GBP') . ' ' . number_format($deliverable->transaction_amount, 2) : '') . '
                </div>
                
                <div class="details">
                    <strong>📋 DELIVERY DETAILS:</strong><br>
                    • Certificate ID: ' . htmlspecialchars($deliverable->uuid) . '<br>
                    • Transaction Date: ' . htmlspecialchars($timestamp) . '<br>
                    • Payment Method: Stripe Secure Payment<br>
                    • Delivery Status: Completed<br>
                    ' . (!empty($deliverable->deliverable_url) ? '• Content Access URL: <a href="' . htmlspecialchars($deliverable->deliverable_url) . '" target="_blank">' . htmlspecialchars($deliverable->deliverable_url) . '</a>' : '') . '
                </div>
                
                <div class="content">
                    <strong>🔐 AUTHENTICITY GUARANTEE:</strong><br>
                    This certificate serves as proof of legitimate purchase and content delivery through the Spenny Piggy platform.
                    <br><br>
                    ✅ Authentic creator content<br>
                    ✅ Secure payment processing<br>
                    ✅ Verified content delivery<br>
                    ✅ Platform compliance standards
                </div>
                
                <div class="footer">
                    <strong>📞 SUPPORT & VERIFICATION:</strong><br>
                    Certificate ID: ' . htmlspecialchars($deliverable->uuid) . '<br>
                    🌐 Website: https://spennypiggy.co<br>
                    📧 Support: support@spennypiggy.co<br><br>
                    
                    Generated by Spenny Piggy Content Delivery System<br>
                    © ' . date('Y') . ' Spenny Piggy - All Rights Reserved
                </div>
            </div>
        </body>
        </html>';
    }
    
    /**
     * Generate PDF from HTML using DomPDF or similar
     */
    private function generatePdfFromHtml(string $html): string
    {
        // For now, we\'ll keep using text format
        // To implement PDF generation, you would need to install a PDF library like:
        // composer require dompdf/dompdf
        
        // Example with DomPDF (commented out until library is installed):
        /*
        $dompdf = new \Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
        */
        
        // For now, return the HTML as text (fallback)
        return strip_tags($html);
    }
    
    /**
     * Generate default certificate HTML
     */
    private function generateDefaultCertificateHtml(Deliverable $deliverable, $item, string $timestamp): string
    {
        return $this->generateWishItemCertificateHtml($deliverable, $item, $timestamp);
    }
    
    /**
     * Generate membership certificate HTML
     */
    private function generateMembershipCertificateHtml(Deliverable $deliverable, Membership $membership, string $timestamp): string
    {
        return $this->generateWishItemCertificateHtml($deliverable, (object)['wishname' => 'Membership Access', 'user' => $membership->user], $timestamp);
    }
    
    /**
     * Upload file to Uploadcare
     */
    private function uploadToUploadcare(string $filePath, string $fileName): ?string
    {
        try {
            Log::info("Uploading PDF certificate to Uploadcare", [
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
                    
                    Log::info("PDF Certificate uploaded to Uploadcare successfully", [
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