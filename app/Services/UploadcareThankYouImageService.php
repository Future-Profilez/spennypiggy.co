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
            
            // Log only essential info to reduce costs
            Log::info('Generated Uploadcare image', ['tip_id' => $tipPayment->id]);
            
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
     * Generate a preview URL for testing - just the background image
     */
    public static function generatePreviewUrl(array $data): string
    {
        try {
            // Build URL with just basic transformations
            $baseUrl = "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/";
            
            $transformations = [
                "-/resize/1200x630/",
                "-/quality/smart/",
                "-/format/auto/"
            ];
            
            return $baseUrl . implode('', $transformations);
            
        } catch (\Exception $e) {
            Log::error('Error generating preview URL', ['error' => $e->getMessage()]);
            return "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/-/resize/1200x630/-/quality/smart/";
        }
    }
}