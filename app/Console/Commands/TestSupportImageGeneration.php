<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TipGoalsPayment;
use App\Jobs\CreateThankYouPostJob;
use Symfony\Component\Process\Process;

class TestSupportImageGeneration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:support-image {tip_payment_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test support social image generation with latest tip payment or specific ID';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tipPaymentId = $this->argument('tip_payment_id');
        
        if ($tipPaymentId) {
            $tipPayment = TipGoalsPayment::find($tipPaymentId);
        } else {
            // Get the most recent tip payment
            $tipPayment = TipGoalsPayment::with('creator', 'user')
                ->orderBy('created_at', 'desc')
                ->first();
        }

        if (!$tipPayment) {
            $this->error('No tip payment found!');
            return 1;
        }

        $this->info("Testing support image generation for:");
        $this->info("- Tip Payment ID: {$tipPayment->id}");
        $this->info("- Creator: {$tipPayment->creator->name}");
        $this->info("- Supporter: " . ($tipPayment->user->name ?? $tipPayment->guest_name ?? 'Guest'));
        $this->info("- Amount: {$tipPayment->currency} {$tipPayment->amount}");
        $this->info("- Message: " . ($tipPayment->message ?? 'None'));
        $this->line('');

        // First test the Node.js script directly
        $this->info('🧪 Testing Node.js script directly...');
        
        $payload = [
            'creator' => [
                'name' => $tipPayment->creator->name,
                'username' => $tipPayment->creator->username,
                'avatar' => $tipPayment->creator->avatar
            ],
            'supporterName' => $tipPayment->user->name ?? ($tipPayment->guest_name ?? 'Anonymous'),
            'amount' => (float)$tipPayment->amount,
            'currency' => $tipPayment->currency,
            'isAnonymous' => $tipPayment->anonymous == 1,
            'message' => $tipPayment->message
        ];

        $nodeScriptPath = base_path('resources/node/renderSupportImage.js');
        $payloadJson = json_encode($payload);
        
        if (!file_exists($nodeScriptPath)) {
            $this->error("❌ Node.js script not found at: {$nodeScriptPath}");
            return 1;
        }

        $process = new Process([
            'node',
            $nodeScriptPath,
            $payloadJson
        ]);
        $process->setTimeout(40);
        
        $this->info('🚀 Running Node.js script...');
        $process->run();
        
        if (!$process->isSuccessful()) {
            $this->error('❌ Node.js script failed:');
            $this->error($process->getErrorOutput());
            return 1;
        }
        
        $output = $process->getOutput();
        $this->info('✅ Node.js script completed successfully!');
        $this->line('Output:');
        $this->line($output);
        
        // Check if image was generated
        if (preg_match('/IMAGE_PATH:(.+)/', $output, $matches)) {
            $imagePath = trim($matches[1]);
            if (file_exists($imagePath)) {
                $fileSize = filesize($imagePath);
                $this->info("📁 Image file generated: {$imagePath} ({$fileSize} bytes)");
            } else {
                $this->error("❌ Image file not found at: {$imagePath}");
            }
        } else {
            $this->error('❌ No image path found in output');
        }

        $this->line('');

        // Now test the full Laravel job
        // Test OpenAI content generation
        if ($this->confirm('🤖 Do you want to test OpenAI content generation?', true)) {
            $this->info('🎆 Testing OpenAI content generation...');
            
            $contentService = new \App\Services\OpenAIContentService();
            $dynamicContent = $contentService->generateThankYouContent([
                'creator_name' => $tipPayment->creator->name,
                'supporter_name' => $tipPayment->user->name ?? ($tipPayment->guest_name ?? 'Anonymous'),
                'amount' => number_format($tipPayment->amount, 2),
                'currency' => strtoupper($tipPayment->currency),
                'is_anonymous' => $tipPayment->anonymous == 1,
                'message' => $tipPayment->message
            ]);
            
            $this->info('✅ Dynamic content generated:');
            $this->info('Title: ' . $dynamicContent['title']);
            $this->info('Content: ' . $dynamicContent['content']);
            $this->line('');
        }

        if (!$this->confirm('🔄 Do you want to test the full CreateThankYouPostJob?', true)) {
            return 0;
        }

        $this->info('🚀 Dispatching CreateThankYouPostJob...');
        
        try {
            // Dispatch the job synchronously so we can see the output
            $job = new CreateThankYouPostJob($tipPayment);
            $job->handle();
            
            $this->info('✅ Job completed successfully!');
            
        } catch (\Exception $e) {
            $this->error('❌ Job failed:');
            $this->error($e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}