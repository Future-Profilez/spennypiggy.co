<?php

namespace App\Services;

use App\Models\TipGoalsPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UploadcareThankYouImageService
{
    /**
     * Base background image UUID from your provided template
     */
    private const BACKGROUND_UUID = '6ac0f103-a9f5-4a95-86e0-1381da155432';
    
    /**
     * Generate thank you image URL with dynamic supporter name and amount
     */
    public static function generateThankYouImageUrl(TipGoalsPayment $tipPayment): string
    {
        try {
            // Get supporter information
            $supporterName = $tipPayment->anonymous 
                ? 'Anonymous Supporter' 
                : ($tipPayment->user->name ?? $tipPayment->guest_name ?? 'Anonymous Supporter');
            
            // Format amount with currency (no space before $)
            $currency = strtoupper($tipPayment->currency ?? 'USD');
            $amount = number_format($tipPayment->amount, 2);
            $amountText = $currency . ' $' . $amount;
            
            // URL encode for Uploadcare - use + for spaces (standard URL encoding)
            // The + in the URL won't show in the actual image text
            $encodedName = str_replace(' ', '+', $supporterName);
            $encodedAmount = str_replace(' ', '+', $amountText);
            
            // Build the dynamic Uploadcare URL with text overlays
            $baseUrl = "https://ucarecdn.com/" . self::BACKGROUND_UUID;
            
            // Build transformations exactly like your working template
            $transformations = [
                "/-/font/bold/40/fff",                                    // White bold text, 40px
                "/-/text_box/fill/00000000",                              // Transparent text box
                "/-/text/100px50p/0,50p/{$encodedName}",                  // Supporter name at position
                "/-/font/bold/40/fbd755",                                 // Gold color for amount
                "/-/text_box/fill/00000000",                              // Transparent text box
                "/-/text/100px40p/0,100p/{$encodedAmount}",                // Amount text at bottom
                "/-/preview/"                                             // Preview suffix to make URL work
            ];
            
            $imageUrl = $baseUrl . implode('', $transformations);
            
            Log::info('Generated dynamic thank you image', [
                'tip_id' => $tipPayment->id,
                'supporter_name' => $supporterName,
                'amount' => $amountText,
                'anonymous' => $tipPayment->anonymous
            ]);
            
            return $imageUrl;
            
        } catch (\Exception $e) {
            Log::error('Error generating dynamic thank you image URL', [
                'tip_payment_id' => $tipPayment->id,
                'error' => $e->getMessage()
            ]);
            
            // Return fallback - basic image without text
            return "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/-/resize/1200x630/-/quality/smart/";
        }
    }
    
    /**
     * Generate a preview URL for testing with sample data
     */
    public static function generatePreviewUrl(array $data = []): string
    {
        try {
            // Use sample data or provided data
            $sampleName = $data['supporter_name'] ?? 'Sample Supporter';
            $sampleAmount = $data['amount'] ?? 'USD $25.00';
            
            // URL encode for Uploadcare - use + for spaces (standard URL encoding)
            // The + in the URL won't show in the actual image text
            $encodedName = str_replace(' ', '+', $sampleName);
            $encodedAmount = str_replace(' ', '+', $sampleAmount);
            
            // Build URL with sample text overlays
            $baseUrl = "https://ucarecdn.com/" . self::BACKGROUND_UUID;
            
            $transformations = [
                "/-/font/bold/40/fff",
                "/-/text_box/fill/00000000",
                "/-/text/100px50p/0,50p/{$encodedName}",
                "/-/font/bold/40/fbd755",
                "/-/text_box/fill/00000000",
                "/-/text/100px40p/0,100p/{$encodedAmount}",
                "/-/preview/"                                             // Preview suffix to make URL work
            ];
            
            return $baseUrl . implode('', $transformations);
            
        } catch (\Exception $e) {
            Log::error('Error generating preview URL', ['error' => $e->getMessage()]);
            return "https://ucarecdn.com/" . self::BACKGROUND_UUID . "/-/resize/1200x630/-/quality/smart/";
        }
    }
    
    /**
     * Generate a unique image UUID to avoid conflicts with existing posts
     * This creates a unique identifier that can be used as part of the image URL
     */
    public static function generateUniqueImageId(TipGoalsPayment $tipPayment): string
    {
        return 'thankyou_' . $tipPayment->id . '_' . time() . '_' . Str::random(8);
    }
}