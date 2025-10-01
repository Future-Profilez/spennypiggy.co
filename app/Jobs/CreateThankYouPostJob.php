<?php

namespace App\Jobs;

use App\Models\TipGoalsPayment;
use App\Models\Post;
use App\Services\OpenAIContentService;
use App\Services\UploadcareThankYouImageService;
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
            Log::info('Creating support thank you post with Uploadcare image', [
                'tip_payment_id' => $this->tipPayment->id,
                'tip_payment_uuid' => $this->tipPayment->uuid,
                'creator_id' => $this->tipPayment->creator_id,
                'amount' => $this->tipPayment->amount,
                'execution_context' => 'queue_worker'
            ]);

            // Generate dynamic Uploadcare image URL with text overlays
            $imageUrl = UploadcareThankYouImageService::generateThankYouImageUrl($this->tipPayment);
            
            Log::info('Generated Uploadcare thank you image', [
                'tip_payment_id' => $this->tipPayment->id,
                'image_url' => $imageUrl
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
            
            // Add the dynamic Uploadcare image to the post
            $postData['image'] = $imageUrl;
            Log::info('Post will include Uploadcare thank you image', [
                'image_url' => $imageUrl,
                'tip_payment_id' => $this->tipPayment->id
            ]);
            
            $post = Post::create($postData);

            if ($post) {
                Log::info('Thank you post created successfully', [
                    'post_id' => $post->id,
                    'post_uuid' => $post->uuid,
                    'tip_payment_id' => $this->tipPayment->id,
                    'image_url' => $imageUrl
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

}
