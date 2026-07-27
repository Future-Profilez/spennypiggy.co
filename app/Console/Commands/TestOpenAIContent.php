<?php

namespace App\Console\Commands;

use App\Services\OpenAIContentService;
use Illuminate\Console\Command;

class TestOpenAIContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:openai-content';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test OpenAI content generation for thank you posts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🤖 Testing OpenAI Content Generation...');
        $this->line('');

        $contentService = new OpenAIContentService;

        // Test connection first
        $this->info('🔌 Testing OpenAI connection...');
        if (! $contentService->testConnection()) {
            $this->error('❌ OpenAI connection failed!');
            $this->error('Please check your DALLE_SECRET_KEY in .env file');

            return 1;
        }
        $this->info('✅ OpenAI connection successful!');
        $this->line('');

        // Test scenarios
        $testScenarios = [
            [
                'creator_name' => 'Emily Johnson',
                'supporter_name' => 'Alex Smith',
                'amount' => '25.00',
                'currency' => 'USD',
                'is_anonymous' => false,
                'message' => 'Love your content! Keep up the great work! 🎉',
            ],
            [
                'creator_name' => 'Michael Chen',
                'supporter_name' => 'Sarah Wilson',
                'amount' => '50.00',
                'currency' => 'GBP',
                'is_anonymous' => false,
                'message' => '',
            ],
            [
                'creator_name' => 'Jessica Brown',
                'supporter_name' => 'Anonymous User',
                'amount' => '10.00',
                'currency' => 'EUR',
                'is_anonymous' => true,
                'message' => 'Thank you for inspiring me daily!',
            ],
        ];

        foreach ($testScenarios as $index => $scenario) {
            $this->info('📝 Test Scenario '.($index + 1).':');
            $this->info("   Creator: {$scenario['creator_name']}");
            $this->info("   Supporter: {$scenario['supporter_name']}");
            $this->info("   Amount: {$scenario['currency']} {$scenario['amount']}");
            $this->info('   Anonymous: '.($scenario['is_anonymous'] ? 'Yes' : 'No'));
            $this->info('   Message: '.($scenario['message'] ?: 'None'));
            $this->line('');

            $this->info('🎨 Generating content...');
            $startTime = microtime(true);

            $content = $contentService->generateThankYouContent($scenario);

            $endTime = microtime(true);
            $duration = round(($endTime - $startTime) * 1000, 2);

            $this->info("✅ Generated in {$duration}ms");
            $this->line('');
            $this->info('📰 Title: '.$content['title']);
            $this->info('📝 Content:');
            $this->line($content['content']);
            $this->line('');
            $this->line(str_repeat('-', 60));
            $this->line('');
        }

        $this->info('🎉 OpenAI Content Generation Test Complete!');
        $this->line('');
        $this->info('💡 Tips:');
        $this->info('- AI-generated content will vary each time');
        $this->info('- If OpenAI fails, fallback templates will be used');
        $this->info('- All activity is logged in storage/logs/laravel.log');

        return 0;
    }
}
