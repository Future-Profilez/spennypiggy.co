<?php

namespace App\Jobs;

use App\Models\TipGoalsPayment;
use App\Models\Post;
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
            // Generate Uploadcare image URL
            $imageUrl = UploadcareThankYouImageService::generateThankYouImageUrl($this->tipPayment);
            

            // Generate dynamic thank you post content using OpenAI (with error handling)
            $supporterName = $this->tipPayment->user->name ?? ($this->tipPayment->guest_name ?? 'A supporter');
            $amount = number_format($this->tipPayment->amount, 2);
            $currency = strtoupper($this->tipPayment->currency);
            $isAnonymous = $this->tipPayment->anonymous == 1;
            $displaySupporterName = $isAnonymous ? 'An anonymous supporter' : $supporterName;
            
            // Use simple template content (no expensive OpenAI calls)
            $templates = [
                [
                    'title' => '💝 Amazing Support Received!',
                    'content' => "Just received incredible support of {$currency} {$amount} from {$displaySupporterName}! This means the world to me and helps me keep creating content you love. Thank you for being part of this journey! 🙏 #Grateful #Community"
                ],
                [
                    'title' => '🎉 Thank You for Your Kindness!',
                    'content' => "Wow! {$displaySupporterName} just brightened my day with {$currency} {$amount} support! Your generosity fuels my passion for creating. Every contribution makes a huge difference! ✨ #ThankYou #SupportCreator"
                ],
                [
                    'title' => '🙌 Incredible Generosity!',
                    'content' => "I'm absolutely touched by {$displaySupporterName}'s support of {$currency} {$amount}! This amazing generosity helps me continue doing what I love. Thank you for believing in my work! 💖 #Appreciation #CreatorSupport"
                ]
            ];
            
            // Pick a random template for variety
            $template = $templates[array_rand($templates)];
            $postTitle = $template['title'];
            $postContent = $template['content'];
            

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
