<?php

namespace App\Console\Commands;

use App\Mail\CommandFailed;
use App\Services\Risk\PayoutService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RunWeeklyPayouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payout:run-weekly {--force : Force run even if not Friday}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Execute the weekly payout run for all eligible creators';

    /**
     * Execute the console command.
     */
    public function handle(PayoutService $payoutService)
    {
        $this->info('Starting Weekly Payout Run...');

        if (!$this->option('force') && !now()->isFriday()) {
            $this->error('Today is not Friday. Use --force to run anyway.');
            return;
        }

        try {
            // 1. Calculate Payouts (Preview)
            $this->info('Calculating payouts...');
            $preview = $payoutService->calculatePayouts();

            $count = $preview['creator_count'];
            $total = $preview['platform_total'];
            
            $this->info("Found {$count} eligible creators. Total Net Payout: {$total}");

            if ($count === 0) {
                $this->info('No payouts to process.');
                return;
            }

            // 2. Execute Payouts
            // In a real scenario, we might want a confirmation step or separate command.
            // But for "Automatic Payout Engine", we execute.
            
            $this->info('Executing payouts...');
            $run = $payoutService->executePayouts($preview);
            
            $this->info("Payout Run Completed. Run ID: {$run->id}");
            
            // Log Success
            Log::info("Weekly Payout Run executed successfully.", ['run_id' => $run->id, 'count' => $count, 'total' => $total]);
            
            $to = config('services.payout_notifications.weekly_job_email');
            if ($to) {
                Mail::to($to)->send(new CommandFailed(
                    '[' . strtoupper(app()->environment()) . '] Weekly Payout Job: SUCCESS (Run ' . $run->id . ')',
                    'Weekly payout job executed successfully at ' . now()->toDateTimeString()
                        . '. Run ID: ' . $run->id
                        . '. Eligible creators: ' . $count
                        . '. Total net payout: ' . $total
                ));
            }

        } catch (\Exception $e) {
            $this->error("Payout Run Failed: " . $e->getMessage());
            Log::error("Weekly Payout Run Failed", ['error' => $e->getMessage()]);
            
            $to = config('services.payout_notifications.weekly_job_email');
            if ($to) {
                Mail::to($to)->send(new CommandFailed(
                    '[' . strtoupper(app()->environment()) . '] Weekly Payout Job: FAILED',
                    'Weekly payout job failed at ' . now()->toDateTimeString() . '. Error: ' . $e->getMessage()
                ));
            }
        }
    }
}
