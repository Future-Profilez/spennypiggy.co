<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SocialImageGenerator
{
    private int $width = 600;
    private int $height = 337;
    private ?string $fontPath;
    
    public function __construct()
    {
        // Use a system font or include a font file in your project
        $this->fontPath = resource_path('fonts/arial.ttf');
        
        // Fallback to system font if custom font not available
        if (!file_exists($this->fontPath)) {
            $this->fontPath = null; // Will use imagestring instead of imagettftext
        }
    }
    
    /**
     * Generate a thank you social image for tip payments
     */
    public function generateThankYouImage(array $data): ?string
    {
        try {
            if (!extension_loaded('gd')) {
                Log::error('GD extension not available for image generation');
                return null;
            }
            
            // Create image canvas
            $image = imagecreatetruecolor($this->width, $this->height);
            
            // Define colors
            $backgroundColor = imagecolorallocate($image, 155, 0, 57); // #9b0039
            $white = imagecolorallocate($image, 255, 255, 255);
            $yellow = imagecolorallocate($image, 253, 224, 71); // text-yellow-300
            $lightGray = imagecolorallocate($image, 243, 244, 246);
            
            // Fill background with gradient-like effect
            imagefill($image, 0, 0, $backgroundColor);
            
            // Add dot pattern effect (simplified)
            $dotColor = imagecolorallocatealpha($image, 255, 255, 255, 100);
            for ($x = 15; $x < $this->width; $x += 30) {
                for ($y = 15; $y < $this->height; $y += 30) {
                    imagefilledellipse($image, $x, $y, 6, 6, $dotColor);
                }
            }
            
            // Prepare text data
            $supporterName = $data['isAnonymous'] ? 'Anonymous Supporter' : $data['supporterName'];
            $amount = $data['currency'] . ' ' . number_format($data['amount'], 2);
            
            // Add text content
            $this->addCenteredText($image, '🎉 THANK YOU! 🎉', 50, $yellow, 32);
            $this->addCenteredText($image, "Thank you {$supporterName}", 100, $white, 24);
            $this->addCenteredText($image, 'for making my day special with', 140, $white, 20);
            $this->addCenteredText($image, $amount, 180, $yellow, 28);
            
            // Add creator info at bottom
            $creatorText = "From @{$data['creator']['username']}";
            $this->addCenteredText($image, $creatorText, 280, $lightGray, 16);
            
            // Add message if provided (truncated)
            if (!empty($data['message'])) {
                $message = strlen($data['message']) > 50 ? substr($data['message'], 0, 47) . '...' : $data['message'];
                $this->addCenteredText($image, "\"{$message}\"", 220, $white, 18);
            }
            
            // Generate unique filename
            $filename = 'support-social-' . time() . '-' . uniqid() . '.png';
            $tempPath = sys_get_temp_dir() . '/' . $filename;
            
            // Save image
            if (!imagepng($image, $tempPath)) {
                Log::error('Failed to save generated image', ['path' => $tempPath]);
                imagedestroy($image);
                return null;
            }
            
            imagedestroy($image);
            
            Log::info('PHP-based social image generated successfully', [
                'path' => $tempPath,
                'size' => filesize($tempPath)
            ]);
            
            return $tempPath;
            
        } catch (\Exception $e) {
            Log::error('Error generating social image with PHP', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            return null;
        }
    }
    
    /**
     * Add centered text to image
     */
    private function addCenteredText($image, string $text, int $y, $color, int $fontSize): void
    {
        if ($this->fontPath && file_exists($this->fontPath)) {
            // Use TTF font if available
            $bbox = imagettfbbox($fontSize, 0, $this->fontPath, $text);
            $textWidth = $bbox[4] - $bbox[0];
            $x = ($this->width - $textWidth) / 2;
            imagettftext($image, $fontSize, 0, $x, $y, $color, $this->fontPath, $text);
        } else {
            // Fallback to built-in font
            $fontSizeBuiltIn = min(5, max(1, intval($fontSize / 6))); // Convert to built-in font size (1-5)
            $textWidth = strlen($text) * imagefontwidth($fontSizeBuiltIn);
            $x = ($this->width - $textWidth) / 2;
            imagestring($image, $fontSizeBuiltIn, $x, $y, $text, $color);
        }
    }
    
    /**
     * Generate a simple default image when other methods fail
     */
    public function generateDefaultThankYouImage(): ?string
    {
        try {
            $image = imagecreatetruecolor($this->width, $this->height);
            
            // Simple gradient background
            $startColor = imagecolorallocate($image, 155, 0, 57);
            $endColor = imagecolorallocate($image, 200, 50, 100);
            
            // Fill with gradient effect
            for ($y = 0; $y < $this->height; $y++) {
                $ratio = $y / $this->height;
                $r = intval(155 + (200 - 155) * $ratio);
                $g = intval(0 + (50 - 0) * $ratio);
                $b = intval(57 + (100 - 57) * $ratio);
                $color = imagecolorallocate($image, $r, $g, $b);
                imageline($image, 0, $y, $this->width, $y, $color);
            }
            
            $white = imagecolorallocate($image, 255, 255, 255);
            $yellow = imagecolorallocate($image, 253, 224, 71);
            
            // Add simple text
            $this->addCenteredText($image, '🎉 THANK YOU! 🎉', 120, $yellow, 32);
            $this->addCenteredText($image, 'Thank you for your support!', 180, $white, 24);
            
            $filename = 'default-thank-you-' . time() . '.png';
            $tempPath = sys_get_temp_dir() . '/' . $filename;
            
            imagepng($image, $tempPath);
            imagedestroy($image);
            
            return $tempPath;
            
        } catch (\Exception $e) {
            Log::error('Failed to generate default thank you image', ['error' => $e->getMessage()]);
            return null;
        }
    }
}