<?php

namespace App\Jobs;

use App\Models\TipGoalsPayment;
use App\Models\Post;
use App\Services\ThankYouImageService;
use App\Services\OpenAIContentService;
use App\Services\SocialImageGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

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
                'amount' => $this->tipPayment->amount,
                'execution_context' => 'queue_worker',
                'process_id' => getmypid(),
                'memory_usage' => memory_get_usage(true),
                'uploadcare_key_available' => !empty(config('services.uploadcare.public', env('UPLOADCARE_PUBLIC_KEY')))
            ]);

            // Generate social thank you image similar to EditProfile component
            $imageUuid = $this->generateSupportSocialImage();
            
            Log::info('Social image generated', [
                'image_uuid' => $imageUuid,
                'tip_payment_id' => $this->tipPayment->id
            ]);

            // Generate dynamic thank you post content using OpenAI (with error handling)
            $supporterName = $this->tipPayment->user->name ?? ($this->tipPayment->guest_name ?? 'A supporter');
            $amount = number_format($this->tipPayment->amount, 2);
            $currency = strtoupper($this->tipPayment->currency);
            $isAnonymous = $this->tipPayment->anonymous == 1;
            $displaySupporterName = $isAnonymous ? 'An anonymous supporter' : $supporterName;
            
            // Use OpenAI to generate dynamic content with proper error handling
            $postTitle = "💝 Amazing Support Received!";
            $postContent = "Just received incredible support of {$currency} {$amount} from {$displaySupporterName}! This means the world to me and helps me keep creating content you love. Thank you for being part of this journey! 🙏 #Grateful #Community";
            
            try {
                $contentService = new OpenAIContentService();
                $dynamicContent = $contentService->generateThankYouContent([
                    'creator_name' => $this->tipPayment->creator->name,
                    'supporter_name' => $supporterName,
                    'amount' => $amount,
                    'currency' => $currency,
                    'is_anonymous' => $isAnonymous,
                    'message' => $this->tipPayment->message
                ]);
                
                // Only use AI content if it was successful
                if (!empty($dynamicContent['title']) && !empty($dynamicContent['content'])) {
                    $postTitle = $dynamicContent['title'];
                    $postContent = $dynamicContent['content'];
                    Log::info('AI-generated content used', [
                        'title' => $postTitle,
                        'content_length' => strlen($postContent),
                        'tip_payment_id' => $this->tipPayment->id
                    ]);
                } else {
                    Log::warning('AI content was empty, using fallback', [
                        'tip_payment_id' => $this->tipPayment->id
                    ]);
                }
            } catch (\Exception $aiException) {
                Log::warning('AI content generation failed, using fallback', [
                    'error' => $aiException->getMessage(),
                    'tip_payment_id' => $this->tipPayment->id
                ]);
            }
            
            Log::info('Final content prepared', [
                'title' => $postTitle,
                'content_length' => strlen($postContent),
                'tip_payment_id' => $this->tipPayment->id
            ]);

            // Create the post with public visibility and auto-approval
            $postData = [
                'user_id' => $this->tipPayment->creator_id,
                'type' => 'support_thanks', // Custom type for support thank you posts
                'for_module' => 'public', // 'public' for public visibility as per requirements
                'title' => $postTitle,
                'content' => $postContent,
                'ai_generated' => false,
                'status' => 1, // Use numeric status (1 = approved)
                'approved' => 1, // Also set the approved field
                'approved_at' => now(), // Set approval timestamp
                'can_delete_until' => now()->addMonth(), // Allow deletion for 1 month
            ];
            
            // Only add image if we have a valid UUID (avoid storing null)
            if (!empty($imageUuid) && is_string($imageUuid)) {
                $postData['image'] = $imageUuid;
                Log::info('Post will include image', [
                    'image_uuid' => $imageUuid,
                    'tip_payment_id' => $this->tipPayment->id
                ]);
            } else {
                Log::info('Post created without image (text-only)', [
                    'image_uuid_provided' => var_export($imageUuid, true),
                    'tip_payment_id' => $this->tipPayment->id
                ]);
            }
            
            $post = Post::create($postData);

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
            
            // Check if Node.js is available in queue context
            $nodeCommand = 'node';
            $nodeCheck = shell_exec('which node 2>/dev/null');
            if (empty(trim($nodeCheck))) {
                // Try common Node.js paths
                $possibleNodePaths = [
                    '/usr/local/bin/node',
                    '/usr/bin/node',
                    '/opt/homebrew/bin/node'
                ];
                
                foreach ($possibleNodePaths as $path) {
                    if (file_exists($path)) {
                        $nodeCommand = $path;
                        break;
                    }
                }
                
                if ($nodeCommand === 'node') {
                    Log::error('Node.js not found in queue context', [
                        'checked_paths' => $possibleNodePaths,
                        'tip_payment_id' => $this->tipPayment->id
                    ]);
                    return null;
                }
            }
            
            Log::info('Using Node.js path', [
                'node_command' => $nodeCommand,
                'tip_payment_id' => $this->tipPayment->id
            ]);

            $process = new \Symfony\Component\Process\Process([
                $nodeCommand,
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
                
                // Upload to Uploadcare - try multiple config sources
                $uploadcareApiKey = config('services.uploadcare.public', env('UPLOADCARE_PUBLIC_KEY'));
                if (empty($uploadcareApiKey)) {
                    // Try direct environment access as fallback
                    $uploadcareApiKey = getenv('UPLOADCARE_PUBLIC_KEY') ?: $_ENV['UPLOADCARE_PUBLIC_KEY'] ?? null;
                }
                
                if (!$uploadcareApiKey) {
                    Log::warning('Uploadcare public key not configured, skipping image upload', [
                        'config_value' => config('services.uploadcare.public'),
                        'env_value' => env('UPLOADCARE_PUBLIC_KEY'),
                        'getenv_value' => getenv('UPLOADCARE_PUBLIC_KEY'),
                        'environment' => env('APP_ENV'),
                        'config_cached' => app()->configurationIsCached(),
                        'process_id' => getmypid(),
                        'tip_payment_id' => $this->tipPayment->id
                    ]);
                    @unlink($imagePath);
                    return null;
                }
                
                Log::info('Using Uploadcare API key', [
                    'key_length' => strlen($uploadcareApiKey),
                    'key_prefix' => substr($uploadcareApiKey, 0, 8),
                    'tip_payment_id' => $this->tipPayment->id
                ]);
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, [
                    'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                    'UPLOADCARE_STORE' => '1',
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
            Log::error('Node.js image generation failed, trying PHP fallback', [
                'error' => $e->getMessage(),
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            // Try PHP-based image generation as fallback
            return $this->generatePHPFallbackImage($data);
        }
    }
    
    /**
     * PHP-based image generation fallback for Vapor environment
     */
    private function generatePHPFallbackImage($data)
    {
        try {
            Log::info('Using PHP-based image generation fallback', [
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            $imageGenerator = new SocialImageGenerator();
            $imagePath = $imageGenerator->generateThankYouImage($data);
            
            if (!$imagePath || !file_exists($imagePath)) {
                Log::warning('PHP image generation failed, trying default image');
                $imagePath = $imageGenerator->generateDefaultThankYouImage();
            }
            
            if (!$imagePath || !file_exists($imagePath)) {
                Log::error('All image generation methods failed');
                return null;
            }
            
            // Upload to Uploadcare
            $uploadcareApiKey = config('services.uploadcare.public', env('UPLOADCARE_PUBLIC_KEY'));
            if (empty($uploadcareApiKey)) {
                $uploadcareApiKey = getenv('UPLOADCARE_PUBLIC_KEY') ?: $_ENV['UPLOADCARE_PUBLIC_KEY'] ?? null;
            }
            
            if (!$uploadcareApiKey) {
                Log::warning('Uploadcare public key not configured for PHP fallback');
                @unlink($imagePath);
                return null;
            }
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://upload.uploadcare.com/base/');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, [
                'UPLOADCARE_PUB_KEY' => $uploadcareApiKey,
                'UPLOADCARE_STORE' => '1',
                'file' => new \CURLFile($imagePath, 'image/png', 'support-social-php.png')
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
                    Log::info('PHP fallback social image generated successfully', [
                        'image_uuid' => $imageUuid,
                        'tip_payment_id' => $this->tipPayment->id
                    ]);
                    return $imageUuid;
                }
            }
            
            Log::warning('PHP fallback Uploadcare API response', [
                'response' => $response,
                'http_code' => $httpCode,
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('PHP fallback image generation failed', [
                'error' => $e->getMessage(),
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            // Return null to fall back to text-only post
            return null;
        }
    }
}
