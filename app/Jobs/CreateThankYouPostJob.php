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
     * Generate HTML-based social image using Node.js script (matches EditProfile design)
     */
    private function generateAndUploadPNGImage($data)
    {
        try {
            Log::info('Generating HTML-based support social image using Node.js', [
                'tip_payment_id' => $this->tipPayment->id
            ]);

            // Build Node.js script payload
            $payload = [
                'creator' => [
                    'name' => $data['creator_name'],
                    'username' => $data['creator_username'],
                    'avatar' => $data['creator_avatar']
                ],
                'supporterName' => $data['supporter_name'],
                'amount' => (float)$data['amount'],
                'currency' => $data['currency'],
                'isAnonymous' => $data['is_anonymous'],
                'message' => $data['message']
            ];

            Log::info('Node.js payload prepared', [
                'payload' => $payload,
                'tip_payment_id' => $this->tipPayment->id
            ]);

            // Execute Node.js script using Symfony Process
            $nodeScriptPath = base_path('resources/node/renderSupportImage.js');
            $payloadJson = json_encode($payload);
            
            if (!file_exists($nodeScriptPath)) {
                throw new \Exception("Node.js script not found at: {$nodeScriptPath}");
            }

            $process = new \Symfony\Component\Process\Process([
                'node',
                $nodeScriptPath,
                $payloadJson
            ]);
            $process->setTimeout(40); // 40 second timeout
            
            Log::info('Executing Node.js script', [
                'command' => $process->getCommandLine(),
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            $process->run();
            
            if (!$process->isSuccessful()) {
                throw new \Exception("Node.js script failed: " . $process->getErrorOutput());
            }
            
            $output = $process->getOutput();
            Log::info('Node.js script output', [
                'output' => $output,
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            // Parse output to find the image path
            if (preg_match('/IMAGE_PATH:(.+)/', $output, $matches)) {
                $imagePath = trim($matches[1]);
                
                if (!file_exists($imagePath)) {
                    throw new \Exception("Generated image file not found: {$imagePath}");
                }
                
                Log::info('Image generated successfully', [
                    'image_path' => $imagePath,
                    'file_size' => filesize($imagePath),
                    'tip_payment_id' => $this->tipPayment->id
                ]);
                
                // Upload to Uploadcare
                $uploadcareApiKey = env('UPLOADCARE_PUBLIC_KEY');
                if (!$uploadcareApiKey) {
                    Log::warning('Uploadcare public key not configured, skipping image upload');
                    @unlink($imagePath);
                    return null;
                }
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, [
                    'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                    'file' => new \CURLFile($imagePath, 'image/png', 'support-social.png')
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                // Clean up temp file
                @unlink($imagePath);
                
                if ($response && $httpCode === 200) {
                    $responseData = json_decode($response, true);
                    if (isset($responseData['file'])) {
                        $imageUuid = $responseData['file'];
                        Log::info('HTML-based support social image generated successfully', [
                            'image_uuid' => $imageUuid,
                            'tip_payment_id' => $this->tipPayment->id
                        ]);
                        return $imageUuid;
                    }
                }
                
                Log::warning('Uploadcare API response', [
                    'response' => $response,
                    'http_code' => $httpCode,
                    'tip_payment_id' => $this->tipPayment->id
                ]);
                
                return null;
                
            } else {
                throw new \Exception('No image path found in Node.js script output');
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to generate HTML-based support social image', [
                'error' => $e->getMessage(),
                'tip_payment_id' => $this->tipPayment->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return null to fall back to text-only post
            return null;
        }
    }
}
