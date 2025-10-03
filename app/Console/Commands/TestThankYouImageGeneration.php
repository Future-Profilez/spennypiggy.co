<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UploadcareThankYouImageService;
use App\Models\TipGoalsPayment;
use App\Models\User;

class TestThankYouImageGeneration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:thank-you-image {--supporter_name=TestSupporter} {--amount=25.00} {--currency=USD} {--anonymous=false}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the thank you image generation with dynamic text overlays';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🎨 Testing Thank You Image Generation');
        $this->info('=====================================');

        $supporterName = $this->option('supporter_name');
        $amount = (float) $this->option('amount');
        $currency = strtoupper($this->option('currency'));
        $anonymous = $this->option('anonymous') === 'true';

        // Create a mock TipGoalsPayment for testing
        $mockTipPayment = new \stdClass();
        $mockTipPayment->id = 'test_' . time();
        $mockTipPayment->amount = $amount;
        $mockTipPayment->currency = $currency;
        $mockTipPayment->anonymous = $anonymous;

        // Mock user
        $mockTipPayment->user = new \stdClass();
        $mockTipPayment->user->name = $supporterName;
        $mockTipPayment->guest_name = $supporterName;

        $this->info("Testing with:");
        $this->info("• Supporter Name: " . ($anonymous ? 'Anonymous Supporter' : $supporterName));
        $this->info("• Amount: {$currency} \${$amount}");
        $this->info("• Anonymous: " . ($anonymous ? 'Yes' : 'No'));
        $this->newLine();

        try {
            // Generate preview URL with sample data
            $previewData = [
                'supporter_name' => $anonymous ? 'Anonymous Supporter' : $supporterName,
                'amount' => "{$currency} \${$amount}"
            ];
            
            $previewUrl = UploadcareThankYouImageService::generatePreviewUrl($previewData);
            
            $this->info("✅ Preview URL Generated:");
            $this->line($previewUrl);
            $this->newLine();

            // Test the actual service method structure
            $this->info("🧪 Testing URL Structure:");
            
            // Show the URL components
            $baseUuid = '6ac0f103-a9f5-4a95-86e0-1381da155432';
            $supporterText = $anonymous ? 'Anonymous Supporter' : $supporterName;
            $amountText = "{$currency} \${$amount}";
            
            $this->info("• Base UUID: {$baseUuid}");
            $this->info("• Supporter Text: '{$supporterText}'");
            $this->info("• Amount Text: '{$amountText}'");
            $this->info("• URL Encoded Name: '" . urlencode($supporterText) . "'");
            $this->info("• URL Encoded Amount: '" . urlencode($amountText) . "'");
            $this->newLine();

            // Show the expected transformations
            $this->info("🎯 Expected Uploadcare Transformations:");
            $transformations = [
                "-/font/bold/40/fff/",
                "-/text_box/fill/00000000/",
                "-/text/100px50p/0,50p/" . urlencode($supporterText) . "/",
                "-/font/bold/40/fbd755/",
                "-/text_box/fill/00000000/",
                "-/text/100px40p/0,100p/" . urlencode($amountText) . "/"
            ];
            
            foreach ($transformations as $index => $transformation) {
                $this->info("  " . ($index + 1) . ". {$transformation}");
            }
            $this->newLine();

            // Build the complete URL manually for verification
            $completeUrl = "https://ucarecdn.com/{$baseUuid}/" . implode('', $transformations);
            $this->info("🔗 Complete Image URL:");
            $this->line($completeUrl);
            $this->newLine();

            // Test with a real tip payment if one exists
            $recentTip = TipGoalsPayment::with('user', 'creator')
                ->where('status', 'paid')
                ->latest()
                ->first();

            if ($recentTip) {
                $this->info("📋 Testing with Real Tip Payment Data:");
                $this->info("• Tip ID: {$recentTip->id}");
                $this->info("• Real Amount: {$recentTip->currency} \${$recentTip->amount}");
                $this->info("• Real Supporter: " . ($recentTip->user->name ?? $recentTip->guest_name ?? 'Unknown'));
                $this->info("• Anonymous: " . ($recentTip->anonymous ? 'Yes' : 'No'));
                $this->newLine();

                // Cast to TipGoalsPayment for the service
                $realImageUrl = UploadcareThankYouImageService::generateThankYouImageUrl($recentTip);
                $this->info("✅ Real Image URL Generated:");
                $this->line($realImageUrl);
                $this->newLine();
            } else {
                $this->warn("⚠️  No recent tip payments found for real data testing");
                $this->newLine();
            }

            $this->info("🎉 Test completed successfully!");
            $this->info("You can preview the image by visiting the generated URL above.");
            
            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Test failed with error:");
            $this->error($e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
            return 1;
        }
    }
}