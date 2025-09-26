<?php

namespace App\Services;

use App\Models\TipGoalsPayment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ThankYouImageService
{
    /**
     * Generate thank you image using HTML canvas approach
     */
    public function generateThankYouImage(TipGoalsPayment $tipPayment): ?string
    {
        try {
            Log::info("Starting thank you image generation", [
                'tip_payment_id' => $tipPayment->id,
                'creator_name' => $tipPayment->creator->name,
                'supporter_name' => $tipPayment->user->name ?? $tipPayment->guest_name
            ]);

            // Create HTML content for the thank you image
            $html = $this->createThankYouHtml($tipPayment);
            
            // Save as temporary HTML file  
            $tempFileName = "thankyou_{$tipPayment->uuid}.html";
            $tempFilePath = storage_path("app/temp/{$tempFileName}");
            
            // Ensure temp directory exists
            if (!is_dir(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            file_put_contents($tempFilePath, $html);
            
            // For now, return the HTML content - this would be converted to image via frontend
            // The actual image conversion will happen in the frontend using html2canvas
            return $tempFilePath;
            
        } catch (\Exception $e) {
            Log::error("Failed to generate thank you image", [
                'tip_payment_id' => $tipPayment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Create HTML content for thank you image
     */
    private function createThankYouHtml(TipGoalsPayment $tipPayment): string
    {
        $creatorName = $tipPayment->creator->name ?? 'Creator';
        $supporterName = $tipPayment->user->name ?? ($tipPayment->guest_name ?? 'A Supporter');
        $amount = number_format($tipPayment->amount, 2);
        $currency = strtoupper($tipPayment->currency);
        $isAnonymous = $tipPayment->anonymous == 1;
        $displaySupporterName = $isAnonymous ? 'An Anonymous Supporter' : $supporterName;
        
        // Get creator avatar URL
        $creatorAvatarUrl = $tipPayment->creator->avatar ? 
            "https://ucarecdn.com/{$tipPayment->creator->avatar}/-/crop/1:1/-/preview/" :
            asset('assets/siteicon.png');

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        
        body, html {
            margin: 0;
            padding: 0;
            font-family: "Inter", sans-serif;
        }
        
        .thank-you-card {
            width: 600px;
            height: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            overflow: hidden;
            border-radius: 20px;
        }
        
        .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
        }
        
        .content {
            position: relative;
            z-index: 2;
            text-align: center;
            padding: 40px;
        }
        
        .creator-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 4px solid rgba(255,255,255,0.3);
            object-fit: cover;
            margin: 0 auto 20px;
            display: block;
        }
        
        .thank-you-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .creator-name {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 15px;
            opacity: 0.9;
        }
        
        .support-info {
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .amount-highlight {
            font-size: 24px;
            font-weight: 700;
            color: #FFD700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .supporter-name {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 15px;
        }
        
        .decorative-elements {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 30px;
            opacity: 0.6;
        }
        
        .decorative-elements-right {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 25px;
            opacity: 0.6;
        }
        
        .logo-watermark {
            position: absolute;
            bottom: 15px;
            left: 20px;
            font-size: 12px;
            opacity: 0.7;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="thank-you-card" id="thank-you-card">
        <div class="background-pattern"></div>
        
        <div class="decorative-elements">🎉</div>
        <div class="decorative-elements-right">💝</div>
        
        <div class="content">
            <img src="' . $creatorAvatarUrl . '" alt="Creator Avatar" class="creator-avatar" crossorigin="anonymous" />
            
            <div class="thank-you-title">Thank You!</div>
            <div class="creator-name">' . htmlspecialchars($creatorName) . '</div>
            
            <div class="support-info">just received support of</div>
            <div class="amount-highlight">' . $currency . ' ' . $amount . '</div>
            
            <div class="supporter-name">from ' . htmlspecialchars($displaySupporterName) . '</div>
        </div>
        
        <div class="logo-watermark">Spenny Piggy</div>
    </div>
</body>
</html>';
    }

    /**
     * Generate SVG-based thank you image (alternative approach)
     */
    public function generateThankYouSVG(TipGoalsPayment $tipPayment): ?string
    {
        try {
            $creatorName = $tipPayment->creator->name ?? 'Creator';
            $supporterName = $tipPayment->user->name ?? ($tipPayment->guest_name ?? 'A Supporter');
            $amount = number_format($tipPayment->amount, 2);
            $currency = strtoupper($tipPayment->currency);
            $isAnonymous = $tipPayment->anonymous == 1;
            $displaySupporterName = $isAnonymous ? 'An Anonymous Supporter' : $supporterName;

            $svgContent = '<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#667eea"/>
            <stop offset="100%" stop-color="#764ba2"/>
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="600" height="400" fill="url(#bgGradient)" rx="20"/>
    
    <!-- Background circles for decoration -->
    <circle cx="120" cy="320" r="60" fill="rgba(255,255,255,0.1)"/>
    <circle cx="480" cy="80" r="40" fill="rgba(255,255,255,0.1)"/>
    
    <!-- Decorative elements -->
    <text x="30" y="50" font-family="Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.6)">🎉</text>
    <text x="550" y="370" font-family="Arial, sans-serif" font-size="25" fill="rgba(255,255,255,0.6)">💝</text>
    
    <!-- Main content -->
    <text x="300" y="120" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">Thank You!</text>
    <text x="300" y="150" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.9)" text-anchor="middle">' . htmlspecialchars($creatorName) . '</text>
    
    <text x="300" y="190" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">just received support of</text>
    <text x="300" y="230" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#FFD700" text-anchor="middle">' . $currency . ' ' . $amount . '</text>
    
    <text x="300" y="270" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">from ' . htmlspecialchars($displaySupporterName) . '</text>
    
    <!-- Logo watermark -->
    <text x="30" y="380" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)">Spenny Piggy</text>
</svg>';

            // Save SVG file
            $tempFileName = "thankyou_{$tipPayment->uuid}.svg";
            $tempFilePath = storage_path("app/temp/{$tempFileName}");
            
            // Ensure temp directory exists
            if (!is_dir(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            file_put_contents($tempFilePath, $svgContent);
            
            // Upload to Uploadcare
            return $this->uploadToUploadcare($tempFilePath, $tempFileName);
            
        } catch (\Exception $e) {
            Log::error("Failed to generate thank you SVG", [
                'tip_payment_id' => $tipPayment->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Upload file to Uploadcare
     */
    private function uploadToUploadcare(string $filePath, string $fileName): ?string
    {
        try {
            $publicKey = config('services.uploadcare.public_key');
            $secretKey = config('services.uploadcare.secret_key');

            if (!$publicKey || !$secretKey) {
                Log::error("Uploadcare credentials not configured");
                return null;
            }

            $fileHandle = fopen($filePath, 'r');
            if (!$fileHandle) {
                Log::error("Could not open file for upload: {$filePath}");
                return null;
            }

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://upload.uploadcare.com/base/',
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => [
                    'UPLOADCARE_PUB_KEY' => $publicKey,
                    'file' => new \CurlFile($filePath, 'image/svg+xml', $fileName)
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            fclose($fileHandle);

            if ($httpCode === 200 && $response) {
                $result = json_decode($response, true);
                if (isset($result['file'])) {
                    $imageUrl = "https://ucarecdn.com/{$result['file']}/";
                    Log::info("Thank you image uploaded successfully", [
                        'image_url' => $imageUrl
                    ]);
                    return $imageUrl;
                }
            }

            Log::error("Uploadcare upload failed", [
                'http_code' => $httpCode,
                'response' => $response
            ]);
            return null;

        } catch (\Exception $e) {
            Log::error("Exception in uploadToUploadcare", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}