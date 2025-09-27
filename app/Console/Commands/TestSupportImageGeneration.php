<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TipGoalsPayment;
use App\Jobs\CreateThankYouPostJob;

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