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
            // Generate dynamic Uploadcare image URL with supporter name and amount
            $imageUrl = UploadcareThankYouImageService::generateThankYouImageUrl($this->tipPayment);
            
            // Generate unique image ID to prevent conflicts
            $uniqueImageId = UploadcareThankYouImageService::generateUniqueImageId($this->tipPayment);

            // Generate dynamic thank you post content
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
                'metadata' => json_encode([
                    'auto_generated' => true,
                    'trigger' => 'support_payment',
                    'tip_payment_id' => $this->tipPayment->id,
                    'supporter_name' => $displaySupporterName,
                    'support_amount' => $amount,
                    'support_currency' => $currency,
                    'anonymous_support' => $isAnonymous,
                    'unique_image_id' => $uniqueImageId,
                    'generated_at' => now()->toISOString()
                ])
            ];
            
            // Store the dynamic image URL - this creates the final image with supporter name and amount
            // Format: 6ac0f103-a9f5-4a95-86e0-1381da155432/-/font/bold/40/fff/-/text_box/fill/00000000/-/text/100px50p/0,50p/SupporterName/-/font/bold/40/fbd755/-/text_box/fill/00000000/-/text/100px40p/0,100p/USD%20$50.00/
            $postData['image'] = str_replace('https://ucarecdn.com/', '', $imageUrl); // Store just the UUID and transformations
            
            $post = Post::create($postData);

            if ($post) {
                Log::info('Thank you post created successfully', [
                    'post_id' => $post->id,
                    'post_uuid' => $post->uuid,
                    'tip_payment_id' => $this->tipPayment->id,
                    'supporter_name' => $displaySupporterName,
                    'support_amount' => $currency . ' $' . $amount,
                    'anonymous' => $isAnonymous,
                    'image_url' => $imageUrl,
                    'unique_image_id' => $uniqueImageId,
                    'post_type' => 'support_thanks',
                    'visibility' => 'public'
                ]);
            } else {
                Log::error('Failed to create thank you post', [
                    'tip_payment_id' => $this->tipPayment->id,
                    'supporter_name' => $displaySupporterName,
                    'support_amount' => $currency . ' $' . $amount
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
