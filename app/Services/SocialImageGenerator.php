<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SocialImageGenerator
{
    private int $width = 600;

    private int $height = 337;

    private ?string $fontPath;

    public function __construct()
    {
        // Prefer bundled brand font if available
        $preferredPath = resource_path('assets/fonts/legacy/CeraGRMedium.ttf');
        $fallbackPath = resource_path('fonts/arial.ttf');
        $fontCandidate = file_exists($preferredPath)
            ? $preferredPath
            : (file_exists($fallbackPath) ? $fallbackPath : null);

        // Only use TTF path if GD FreeType functions are available
        if ($fontCandidate && \function_exists('imagettfbbox') && \function_exists('imagettftext')) {
            $this->fontPath = $fontCandidate;
        } else {
            $this->fontPath = null; // fallback to built-in fonts
        }
    }

    /**
     * Generate a thank you social image for tip payments
     */
    public function generateThankYouImage(array $data): ?string
    {
        try {
            if (! extension_loaded('gd')) {
                Log::error('GD extension not available for image generation');

                return null;
            }

            // Create image canvas
            $image = imagecreatetruecolor($this->width, $this->height);

            // Define colors
            $backgroundColor = imagecolorallocate($image, 165, 10, 67);
            $white = imagecolorallocate($image, 255, 255, 255);
            $yellow = imagecolorallocate($image, 255, 235, 59);
            $lightGray = imagecolorallocate($image, 200, 200, 200);
            $softWhite = imagecolorallocate($image, 248, 248, 248);

            // Fill background with smooth vertical gradient
            $endR = 195;
            $endG = 35;
            $endB = 95;
            for ($y = 0; $y < $this->height; $y++) {
                $ratio = $y / $this->height;
                $r = (int) (165 + ($endR - 165) * $ratio);
                $g = (int) (10 + ($endG - 10) * $ratio);
                $b = (int) (67 + ($endB - 67) * $ratio);
                $rowColor = imagecolorallocate($image, $r, $g, $b);
                imageline($image, 0, $y, $this->width, $y, $rowColor);
            }

            // Add dot pattern effect (refined)
            $dotColor = imagecolorallocatealpha($image, 255, 255, 255, 110);
            for ($x = 30; $x < $this->width; $x += 40) {
                for ($y = 30; $y < $this->height; $y += 40) {
                    imagefilledellipse($image, $x, $y, 8, 8, $dotColor);
                }
            }

            // Add a subtle radial highlight in the center
            $centerX = (int) ($this->width / 2);
            $centerY = (int) ($this->height / 2);
            for ($radius = 160; $radius > 0; $radius -= 3) {
                $alpha = (int) (127 * (1 - ($radius / 160)) * 0.3);
                $highlight = imagecolorallocatealpha($image, 255, 255, 255, max(85, $alpha));
                imagefilledellipse($image, $centerX, $centerY, $radius * 2.2, $radius * 1.4, $highlight);
            }

            // Prepare text data
            $supporterName = $data['isAnonymous'] ? 'Anonymous Supporter' : $data['supporterName'];
            $amount = $data['currency'].' '.number_format((float) $data['amount'], 2);

            // Add text content with refined styling and positioning
            $strongShadow = imagecolorallocatealpha($image, 0, 0, 0, 100);
            $subtleShadow = imagecolorallocatealpha($image, 0, 0, 0, 120);
            $this->addCenteredTextStyled($image, 'THANK YOU!', 55, $yellow, 44, $strongShadow, true);
            $this->addCenteredTextStyled($image, "Thank you {$supporterName}", 120, $softWhite, 28, $subtleShadow, false);
            $this->addCenteredTextStyled($image, 'for making my day special with', 158, $softWhite, 24, $subtleShadow, false);
            $this->addCenteredTextStyled($image, $amount, 200, $yellow, 38, $strongShadow, true);

            // Add message if provided (truncated)
            if (! empty($data['message'])) {
                $message = strlen($data['message']) > 65 ? substr($data['message'], 0, 62).'...' : $data['message'];
                $this->addCenteredTextStyled($image, "\"{$message}\"", 245, $softWhite, 22, $subtleShadow, false);
            }

            // Add creator info at bottom
            $creatorText = "From @{$data['creator']['username']}";
            $this->addCenteredTextStyled($image, $creatorText, 310, $lightGray, 20, $subtleShadow, false);

            // Generate unique filename
            $filename = 'support-social-'.time().'-'.uniqid().'.png';
            $tempPath = sys_get_temp_dir().'/'.$filename;

            // Save image
            if (! imagepng($image, $tempPath)) {
                Log::error('Failed to save generated image', ['path' => $tempPath]);
                imagedestroy($image);

                return null;
            }

            imagedestroy($image);

            Log::info('PHP-based social image generated successfully', [
                'path' => $tempPath,
                'size' => filesize($tempPath),
            ]);

            return $tempPath;

        } catch (\Exception $e) {
            Log::error('Error generating social image with PHP', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return null;
        }
    }

    /**
     * Add centered text to image
     */
    private function addCenteredText($image, string $text, int $y, $color, int $fontSize): void
    {
        if ($this->fontPath && file_exists($this->fontPath) && \function_exists('imagettfbbox') && \function_exists('imagettftext')) {
            // Use TTF font if available
            $bbox = \imagettfbbox($fontSize, 0, $this->fontPath, $text);
            $textWidth = $bbox[4] - $bbox[0];
            $x = ($this->width - $textWidth) / 2;
            \imagettftext($image, $fontSize, 0, (int) $x, $y, $color, $this->fontPath, $text);
        } else {
            // Fallback to built-in font
            $fontSizeBuiltIn = min(5, max(1, intval($fontSize / 6))); // Convert to built-in font size (1-5)
            $textWidth = strlen($text) * imagefontwidth($fontSizeBuiltIn);
            $x = ($this->width - $textWidth) / 2;
            imagestring($image, $fontSizeBuiltIn, $x, $y, $text, $color);
        }
    }

    /**
     * Add centered text with optional subtle shadow and pseudo-bold
     */
    private function addCenteredTextStyled($image, string $text, int $y, $color, int $fontSize, $shadowColor = null, bool $bold = false): void
    {
        if ($this->fontPath && file_exists($this->fontPath) && \function_exists('imagettfbbox') && \function_exists('imagettftext')) {
            $bbox = \imagettfbbox($fontSize, 0, $this->fontPath, $text);
            $textWidth = $bbox[4] - $bbox[0];
            $x = (int) (($this->width - $textWidth) / 2);

            // Shadow
            if ($shadowColor) {
                \imagettftext($image, $fontSize, 0, $x + 1, $y + 1, $shadowColor, $this->fontPath, $text);
            }

            if ($bold) {
                // Draw multiple passes to simulate bold
                \imagettftext($image, $fontSize, 0, $x, $y, $color, $this->fontPath, $text);
                \imagettftext($image, $fontSize, 0, $x + 1, $y, $color, $this->fontPath, $text);
                \imagettftext($image, $fontSize, 0, $x, $y + 1, $color, $this->fontPath, $text);
            } else {
                \imagettftext($image, $fontSize, 0, $x, $y, $color, $this->fontPath, $text);
            }
        } else {
            $fontSizeBuiltIn = min(5, max(1, intval($fontSize / 6)));
            $textWidth = strlen($text) * imagefontwidth($fontSizeBuiltIn);
            $x = (int) (($this->width - $textWidth) / 2);

            if ($shadowColor) {
                imagestring($image, $fontSizeBuiltIn, $x + 1, $y + 1, $text, $shadowColor);
            }

            if ($bold) {
                imagestring($image, $fontSizeBuiltIn, $x, $y, $text, $color);
                imagestring($image, $fontSizeBuiltIn, $x + 1, $y, $text, $color);
                imagestring($image, $fontSizeBuiltIn, $x, $y + 1, $text, $color);
            } else {
                imagestring($image, $fontSizeBuiltIn, $x, $y, $text, $color);
            }
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

            $filename = 'default-thank-you-'.time().'.png';
            $tempPath = sys_get_temp_dir().'/'.$filename;

            imagepng($image, $tempPath);
            imagedestroy($image);

            return $tempPath;

        } catch (\Exception $e) {
            Log::error('Failed to generate default thank you image', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
