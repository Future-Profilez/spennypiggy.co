<?php

namespace App\Jobs;

use App\Models\TipGoalsPayment;
use App\Models\Post;
use App\Services\ThankYouImageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateThankYouPostJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tipPayment;

    /**
     * Create a new job instance.
     */
    public function __construct(TipGoalsPayment $tipPayment)
    {
        $this->tipPayment = $tipPayment;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Creating support thank you post with social image', [
                'tip_payment_id' => $this->tipPayment->id,
                'tip_payment_uuid' => $this->tipPayment->uuid,
                'creator_id' => $this->tipPayment->creator_id,
                'amount' => $this->tipPayment->amount
            ]);

            // Generate social thank you image similar to EditProfile component
            $imageUuid = $this->generateSupportSocialImage();
            
            Log::info('Social image generated', [
                'image_uuid' => $imageUuid,
                'tip_payment_id' => $this->tipPayment->id
            ]);

            // Create the thank you post content
            $supporterName = $this->tipPayment->user->name ?? ($this->tipPayment->guest_name ?? 'A supporter');
            $amount = number_format($this->tipPayment->amount, 2);
            $currency = strtoupper($this->tipPayment->currency);
            $isAnonymous = $this->tipPayment->anonymous == 1;
            $displaySupporterName = $isAnonymous ? 'An anonymous supporter' : $supporterName;
            
            // Create post title
            $postTitle = "🎉 Thank You for Your Support! 💝";
            
            // Create post content
            $postContent = "I just received amazing support of {$currency} {$amount} from {$displaySupporterName}! ";
            $postContent .= "This means so much to me and helps me continue creating content for you all. ";
            
            if (!empty($this->tipPayment->message)) {
                $postContent .= "\n\nTheir message: \"{$this->tipPayment->message}\"";
            }
            
            $postContent .= "\n\nThank you for being part of this journey! 🙏 #SupportCreator #ThankYou #Community";

            // Create the post with public visibility and auto-approval
            $post = Post::create([
                'user_id' => $this->tipPayment->creator_id,
                'type' => 'support_thanks', // Custom type for support thank you posts
                'for_module' => 'public', // 'public' for public visibility as per requirements
                'title' => $postTitle,
                'content' => $postContent,
                'image' => $imageUuid, // Store the Uploadcare UUID
                'ai_generated' => false,
                'status' => 1, // Use numeric status (1 = approved)
                'approved' => 1, // Also set the approved field
                'approved_at' => now(), // Set approval timestamp
                'can_delete_until' => now()->addMonth(), // Allow deletion for 1 month
            ]);

            if ($post) {
                Log::info('Thank you post created successfully', [
                    'post_id' => $post->id,
                    'post_uuid' => $post->uuid,
                    'tip_payment_id' => $this->tipPayment->id,
                    'image_uuid' => $imageUuid
                ]);
            } else {
                Log::error('Failed to create thank you post', [
                    'tip_payment_id' => $this->tipPayment->id
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Exception in CreateThankYouPostJob', [
                'tip_payment_id' => $this->tipPayment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Generate social thank you image for support posts
     * Similar to the EditProfile component social image generation
     */
    private function generateSupportSocialImage()
    {
        try {
            Log::info('Generating support social image', [
                'tip_payment_id' => $this->tipPayment->id,
                'creator_id' => $this->tipPayment->creator_id
            ]);

            $creator = $this->tipPayment->creator;
            if (!$creator) {
                Log::warning('Creator not found, skipping image generation');
                return null;
            }

            // Prepare support data for image generation
            $supporterName = $this->tipPayment->user->name ?? ($this->tipPayment->guest_name ?? 'A supporter');
            $amount = number_format($this->tipPayment->amount, 2);
            $currency = strtoupper($this->tipPayment->currency);
            $isAnonymous = $this->tipPayment->anonymous == 1;
            $displaySupporterName = $isAnonymous ? 'Anonymous Supporter' : $supporterName;

            // Generate PNG image directly and upload to Uploadcare
            $imageUuid = $this->generateAndUploadPNGImage([
                'creator_name' => $creator->name,
                'creator_username' => $creator->username,
                'creator_avatar' => $creator->avatar,
                'supporter_name' => $displaySupporterName,
                'amount' => $amount,
                'currency' => $currency,
                'is_anonymous' => $isAnonymous,
                'message' => $this->tipPayment->message
            ]);
            
            if ($imageUuid) {
                Log::info('Support social image generated successfully', [
                    'image_uuid' => $imageUuid,
                    'tip_payment_id' => $this->tipPayment->id
                ]);
                return $imageUuid;
            } else {
                Log::error('Failed to upload support social image');
                return null;
            }

        } catch (\Exception $e) {
            Log::error('Exception in generateSupportSocialImage', [
                'tip_payment_id' => $this->tipPayment->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Generate PNG image and upload to Uploadcare
     */
    private function generateAndUploadPNGImage($data)
    {
        try {
            Log::info('Generating PNG support social image and uploading to Uploadcare', [
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            // Create a PNG image with gradient background (reverting to colorful design)
            $image = imagecreatetruecolor(600, 337);
            
            // Enable alpha blending for transparency
            imagealphablending($image, true);
            imagesavealpha($image, true);
            
            // Create modern gradient background (vibrant pink/magenta)
            for ($y = 0; $y < 337; $y++) {
                $ratio = $y / 337;
                $red = (int)(219 - (50 * $ratio));     // From bright pink to deeper pink
                $green = (int)(39 + (20 * $ratio));    // Slight variation
                $blue = (int)(119 + (30 * $ratio));    // Purple tint increase
                $color = imagecolorallocate($image, $red, $green, $blue);
                imageline($image, 0, $y, 600, $y, $color);
            }
            
            // Add subtle dot pattern overlay
            $dotColor = imagecolorallocatealpha($image, 255, 255, 255, 115); // More visible dots
            for ($x = 20; $x < 600; $x += 35) {
                for ($y = 20; $y < 337; $y += 35) {
                    imagefilledellipse($image, $x, $y, 4, 4, $dotColor);
                }
            }
            
            // Define modern color palette
            $white = imagecolorallocate($image, 255, 255, 255);
            $brightGold = imagecolorallocate($image, 255, 193, 7);     // Modern gold
            $brightGreen = imagecolorallocate($image, 76, 175, 80);    // Modern green
            $lightText = imagecolorallocate($image, 248, 249, 250);    // Slightly off-white for better readability
            
            // Get creator and use passed data
            $creator = $this->tipPayment->creator;
            
            // Add subtle decorative elements in corners
            // Top right sparkle emoji
            imagestring($image, 4, 520, 25, '✨', $brightGold);
            imagestring($image, 3, 500, 45, '🎉', $brightGold);
            
            // Layout positioning
            $avatarX = 170;  // Moved slightly more to center
            $avatarY = 120;
            $textStartX = 280;  // Text starts after avatar
            
            // Check if creator has a valid avatar
            $hasAvatar = !empty($data['creator_avatar']);
            
            // Add creator avatar if available (circular with modern styling)
            if ($hasAvatar) {
                try {
                    // Download and add creator avatar
                    $avatarUrl = "https://ucarecdn.com/{$data['creator_avatar']}/-/crop/1:1/-/preview/120x120/";
                    $avatarData = @file_get_contents($avatarUrl);
                    
                    if ($avatarData) {
                        $avatarImage = @imagecreatefromstring($avatarData);
                        if ($avatarImage) {
                            // Create modern green circle border (thicker)
                            imagefilledellipse($image, $avatarX, $avatarY, 106, 106, $brightGreen);
                            
                            // Resize avatar to 96x96 for better quality
                            $avatarResized = imagecreatetruecolor(96, 96);
                            imagecopyresampled($avatarResized, $avatarImage, 0, 0, 0, 0, 96, 96, imagesx($avatarImage), imagesy($avatarImage));
                            
                            // Create circular mask for avatar
                            $avatarMask = imagecreatetruecolor(96, 96);
                            $transparent = imagecolorallocatealpha($avatarMask, 0, 0, 0, 127);
                            imagefill($avatarMask, 0, 0, $transparent);
                            $circleColor = imagecolorallocate($avatarMask, 255, 255, 255);
                            imagefilledellipse($avatarMask, 48, 48, 96, 96, $circleColor);
                            
                            // Apply mask to avatar
                            imagealphablending($avatarResized, false);
                            imagesavealpha($avatarResized, true);
                            for ($x = 0; $x < 96; $x++) {
                                for ($y = 0; $y < 96; $y++) {
                                    $maskColor = imagecolorat($avatarMask, $x, $y);
                                    if (($maskColor >> 16) & 0xFF < 128) {
                                        imagesetpixel($avatarResized, $x, $y, imagecolorallocatealpha($avatarResized, 0, 0, 0, 127));
                                    }
                                }
                            }
                            
                            // Place circular avatar
                            imagecopy($image, $avatarResized, $avatarX - 48, $avatarY - 48, 0, 0, 96, 96);
                            
                            imagedestroy($avatarImage);
                            imagedestroy($avatarResized);
                            imagedestroy($avatarMask);
                        }
                    }
                } catch (Exception $e) {
                    Log::warning('Could not load creator avatar for support image', [
                        'creator_id' => $creator->id,
                        'avatar_url' => $avatarUrl ?? 'null',
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            // Modern typography and layout
            // Creator name (large, bold, uppercase, better positioned)
            $creatorNameY = 90;
            imagestring($image, 5, $textStartX, $creatorNameY, strtoupper($data['creator_name']), $white);
            
            // Support message (clean, modern)
            imagestring($image, 4, $textStartX, $creatorNameY + 35, 'received support from', $lightText);
            
            // Supporter name (bright green, prominent)
            imagestring($image, 5, $textStartX, $creatorNameY + 65, $data['supporter_name'], $brightGreen);
            
            // Amount (bright gold, large and prominent)
            imagestring($image, 5, $textStartX, $creatorNameY + 100, $data['currency'] . ' ' . $data['amount'], $brightGold);
            
            // Modern thank you message (better positioned)
            $thankYouY = 240;
            imagestring($image, 4, 50, $thankYouY, 'Thank you for supporting my creative journey! 🙏', $white);
            
            // Website link with modern styling
            $linkY = 275;
            $linkHeight = 35;
            $linkBg = imagecolorallocatealpha($image, 0, 0, 0, 60); // Semi-transparent black for modern look
            imagefilledrectangle($image, 40, $linkY, 520, $linkY + $linkHeight, $linkBg);
            
            $websiteText = 'https://spennypiggy.co/' . $data['creator_username'];
            $textWidth = strlen($websiteText) * 8; // Better approximation
            $linkTextX = (600 - $textWidth) / 2; // Center the text
            imagestring($image, 4, $linkTextX, $linkY + 10, $websiteText, $white);
            
            // Save as PNG
            $tempPngFile = tempnam(sys_get_temp_dir(), 'support_social_') . '.png';
            imagepng($image, $tempPngFile, 9); // High compression
            imagedestroy($image);
            
            // Use Uploadcare API to upload the PNG file
            $uploadcareApiKey = env('UPLOADCARE_PUBLIC_KEY');
            if (!$uploadcareApiKey) {
                Log::warning('Uploadcare public key not configured, skipping image upload');
                @unlink($tempPngFile);
                return null;
            }
            
            // Upload using Uploadcare Upload API
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, [
                'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                'file' => new \CURLFile($tempPngFile, 'image/png', 'support-social.png')
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            // Clean up temp files
            @unlink($tempPngFile);
            
            if ($response && $httpCode === 200) {
                $data = json_decode($response, true);
                if (isset($data['file'])) {
                    $imageUuid = $data['file'];
                    Log::info('Support social image uploaded successfully', [
                        'image_uuid' => $imageUuid,
                        'tip_payment_id' => $this->tipPayment->id
                    ]);
                    return $imageUuid;
                }
            }
            
            Log::warning('Uploadcare API response', [
                'response' => $response,
                'http_code' => $httpCode
            ]);
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('Failed to upload SVG to Uploadcare', [
                'error' => $e->getMessage(),
                'tip_payment_id' => $this->tipPayment->id
            ]);
            return null;
        }
    }
}
