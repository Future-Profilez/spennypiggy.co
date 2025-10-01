<?php

namespace App\Services;

use App\Models\TipGoalsPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UploadcareThankYouImageService
{
    /**
     * Base background image UUID from your provided URL
     */
    private const BACKGROUND_UUID = '410d2e97-f43f-4b00-a93f-d2f8414c98a8';
    
    /**
     * Generate thank you image URL using just the background image
     * Since Uploadcare text overlays are not working as expected, we'll use just the background
     */
    public static function generateThankYouImageUrl(TipGoalsPayment $tipPayment): string
    {
        try {
            // Build URL with just basic transformations
            $baseUrl = "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/";
            
            // Use basic transformations that are guaranteed to work
            $transformations = [
                "-/resize/1200x630/",  // Resize for social media
                "-/quality/smart/",     // Smart quality optimization
                "-/format/auto/"        // Auto format selection
            ];
            
            $transformationString = implode('', $transformations);
            $imageUrl = $baseUrl . $transformationString;
            
            Log::info('Generated Uploadcare background image URL', [
                'tip_payment_id' => $tipPayment->id,
                'image_url' => $imageUrl,
                'supporter' => $tipPayment->user->name ?? ($tipPayment->guest_name ?? 'Anonymous'),
                'amount' => strtoupper($tipPayment->currency) . ' ' . number_format($tipPayment->amount, 2),
                'creator' => $tipPayment->creator->username
            ]);
            
            return $imageUrl;
            
        } catch (\Exception $e) {
            Log::error('Error generating Uploadcare image URL', [
                'tip_payment_id' => $tipPayment->id,
                'error' => $e->getMessage()
            ]);
            
            // Return fallback - just the background image
            return "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/-/resize/1200x630/-/quality/smart/";
        }
    }
    
    /**
     * Generate a preview URL for testing with custom data
     */
    public static function generatePreviewUrl(array $data): string
    {
        try {
            $supporterName = $data['supporter_name'] ?? 'Test Supporter';
            $amount = number_format($data['amount'] ?? 25.00, 2);
            $currency = strtoupper($data['currency'] ?? 'USD');
            $creatorUsername = $data['creator_username'] ?? 'testcreator';
            $message = $data['message'] ?? null;
            $isAnonymous = $data['anonymous'] ?? false;
            
            $displaySupporterName = $isAnonymous ? 'Anonymous Supporter' : $supporterName;
            
            // Build the transformation URL
            $baseUrl = "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/";
            
            $transformations = [
                "-/resize/1200x630/",
                "-/quality/smart/",
                "-/text/" . rawurlencode("THANK YOU!") . "/64/ffffff/",
                "-/text/" . rawurlencode("Thank you " . $displaySupporterName) . "/32/ffffff/",
                "-/text/" . rawurlencode("for your generous support of") . "/24/ffffff/",
                "-/text/" . rawurlencode($currency . " " . $amount) . "/48/ffd700/",
            ];
            
            if ($message) {
                $transformations[] = "-/text/" . rawurlencode('"' . Str::limit($message, 80) . '"') . "/20/e0e0e0/";
            }
            
            $transformations[] = "-/text/" . rawurlencode("@" . $creatorUsername) . "/24/ffffff/";
            $transformations[] = "-/text/" . rawurlencode("spennypiggy.co") . "/16/cccccc/";
            
            return $baseUrl . implode('', $transformations);
            
        } catch (\Exception $e) {
            Log::error('Error generating preview URL', ['error' => $e->getMessage()]);
            return "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/-/resize/1200x630/-/quality/smart/";
        }
    }
}