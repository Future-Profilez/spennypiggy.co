<?php

namespace App\Services;

use App\Support\GeneratedText;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIContentService
{
    private $apiKey;

    private $baseUrl = 'https://api.openai.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('DALLE_SECRET_KEY'); // Using your existing OpenAI API key
    }

    /**
     * Generate dynamic thank you post content using ChatGPT
     *
     * @param  array  $data  - Payment data (creator, supporter, amount, currency, message)
     * @return array - ['title' => string, 'content' => string]
     */
    public function generateThankYouContent($data)
    {
        try {
            Log::info('Generating dynamic thank you content with OpenAI', [
                'creator' => $data['creator_name'],
                'supporter' => $data['supporter_name'],
                'amount' => $data['amount'],
                'currency' => $data['currency'],
            ]);

            // Prepare context for ChatGPT
            $creatorName = $data['creator_name'];
            $supporterName = $data['supporter_name'];
            $amount = $data['amount'];
            $currency = $data['currency'];
            $message = $data['message'] ?? '';
            $isAnonymous = $data['is_anonymous'] ?? false;

            $displaySupporterName = $isAnonymous ? 'an anonymous supporter' : $supporterName;

            // Create prompt for ChatGPT
            $prompt = "Create a heartfelt thank you post for a content creator named '{$creatorName}' who just received {$currency} {$amount} from {$displaySupporterName}. ";

            if (! empty($message)) {
                $prompt .= "The supporter's message was: '{$message}'. ";
            }

            $prompt .= 'Generate both a catchy title (under 60 characters) and engaging content (under 300 characters) for social media. ';
            $prompt .= 'The tone should be grateful, warm, and authentic. Include relevant emojis. ';
            $prompt .= 'Avoid being overly promotional. Focus on gratitude and community building. ';
            $prompt .= 'Return JSON format: {"title": "...", "content": "..."}';

            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->baseUrl, [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a helpful assistant that creates authentic, heartfelt social media posts for content creators thanking their supporters. Always respond in valid JSON format.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'max_tokens' => 200,
                'temperature' => 0.8, // Slightly creative but not too random
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $aiContent = $responseData['choices'][0]['message']['content'];

                Log::info('OpenAI response received', ['content' => $aiContent]);

                // Try to parse JSON response
                $contentData = json_decode($aiContent, true);

                if ($contentData && isset($contentData['title']) && isset($contentData['content'])) {
                    Log::info('Successfully generated dynamic content', [
                        'title' => $contentData['title'],
                        'content_length' => strlen($contentData['content']),
                    ]);

                    // The model is asked for emoji, so this is the path most
                    // likely to produce one that does not survive the write.
                    return [
                        'title' => GeneratedText::title($contentData['title'], 'Thank you'),
                        'content' => GeneratedText::body($contentData['content']),
                    ];
                } else {
                    Log::warning('Failed to parse OpenAI JSON response, falling back to default');

                    return $this->getFallbackContent($data);
                }
            } else {
                Log::error('OpenAI API request failed', [
                    'status' => $response->status(),
                    'error' => $response->body(),
                ]);

                return $this->getFallbackContent($data);
            }

        } catch (\Exception $e) {
            Log::error('Exception in OpenAI content generation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->getFallbackContent($data);
        }
    }

    /**
     * Fallback content in case OpenAI fails
     */
    private function getFallbackContent($data)
    {
        $templates = [
            [
                'title' => '💝 Amazing Support Received!',
                'content' => 'Just received incredible support of {currency} {amount} from {supporter}! This means the world to me and helps me keep creating content you love. Thank you for being part of this journey! 🙏 #Grateful #Community',
            ],
            [
                'title' => '🎉 Thank You for Your Kindness!',
                'content' => 'Wow! {supporter} just brightened my day with {currency} {amount} support! Your generosity fuels my passion for creating. Every contribution, no matter the size, makes a huge difference! ✨ #ThankYou #SupportCreator',
            ],
            [
                'title' => '🙌 Incredible Generosity!',
                'content' => "I'm absolutely touched by {supporter}'s support of {currency} {amount}! This amazing generosity helps me continue doing what I love. Thank you for believing in my work! 💖 #Appreciation #CreatorSupport",
            ],
            [
                'title' => '✨ Heartfelt Thanks!',
                'content' => "Just received wonderful support of {currency} {amount} from {supporter}! Your kindness and support mean everything to me. It's supporters like you who make this creative journey possible! 🌟 #Grateful #Amazing",
            ],
            [
                'title' => '🎊 You Made My Day!',
                'content' => "{supporter} just made my day special with {currency} {amount} support! I'm so grateful for this amazing community and the support you all show. Thank you for helping me pursue my passion! 🥰 #CommunityLove",
            ],
        ];

        // Pick a random template
        $template = $templates[array_rand($templates)];

        $supporterName = $data['supporter_name'];
        $amount = $data['amount'];
        $currency = $data['currency'];
        $isAnonymous = $data['is_anonymous'] ?? false;

        $displaySupporterName = $isAnonymous ? 'an anonymous supporter' : $supporterName;

        // Replace placeholders
        $content = str_replace(
            ['{supporter}', '{amount}', '{currency}'],
            [$displaySupporterName, $amount, $currency],
            $template['content']
        );

        Log::info('Using fallback content template', [
            'title' => $template['title'],
            'template_used' => true,
        ]);

        return [
            'title' => GeneratedText::title($template['title'], 'Thank you'),
            'content' => GeneratedText::body($content),
        ];
    }

    /**
     * Test the OpenAI connection
     */
    public function testConnection()
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($this->baseUrl, [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'user', 'content' => 'Say "OpenAI connection test successful"'],
                ],
                'max_tokens' => 10,
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
