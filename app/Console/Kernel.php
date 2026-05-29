<?php

namespace App\Console;

use App\Jobs\SendMailSubscriptions;
use App\Jobs\CalculateFirstThirtyDayEarnings;
use App\Jobs\CheckFounderQualifications;
use App\Jobs\ProcessFounderPayouts;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // Test Scheduler Timestamp - Moved to TOP to ensure it always runs
        $schedule->call(function () {
            try {
                \Illuminate\Support\Facades\Log::info('Scheduler heartbeat: executing at ' . now()->toDateTimeString() . ' using driver: ' . config('cache.default'));
                
                // Write to default cache for diagnostics
                \Illuminate\Support\Facades\Cache::put('scheduler_heartbeat', time(), 600);
                
                // Dispatch a closure to the queue to verify the queue worker is running
                dispatch(function () {
                    \Illuminate\Support\Facades\Cache::put('queue_worker_heartbeat', time(), 600);
                });
                
                // Explicitly write to dynamodb store if available - DISABLED
                if (config('cache.stores.dynamodb')) {
                    // \Illuminate\Support\Facades\Cache::store('dynamodb')->put('scheduler_last_run_dynamodb', now()->toDateTimeString(), 600);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Scheduler heartbeat failed to write cache', [
                    'error' => $e->getMessage(),
                ]);
            }
        })->everyMinute();

        $appUrl = env('APP_URL'); // e.g. https://dev.spennypiggy.co

        // Sync subscription status from Stripe every 15 minutes
        $schedule->command('subscription:sync')
                 ->everyFifteenMinutes()
                 ->withoutOverlapping();

        // Sync all subscriptions only on dev (too heavy for production scheduler)
        if ($appUrl && str_contains($appUrl, 'dev.spennypiggy.co')) {
            $schedule->command('subscription:sync --all')
                     ->everyFifteenMinutes()
                     ->withoutOverlapping();
        }

        $schedule->command('finance:sync-transactions')
                 ->everyThirtyMinutes()
                 ->withoutOverlapping();

        // Extra sync right before Thursday midnight cutoff (5 mins before Friday)
        $schedule->command('finance:sync-transactions')
                 ->weeklyOn(4, '23:55')
                 ->withoutOverlapping();
                 
        //
        // $schedule->job(new SendMailSubscriptions)->everyMinute(); // Runs MyJob every hour
        $schedule->command("app:sync-exchange-rate")->hourly()->withoutOverlapping(4);

        // Process SLA Refunds
        $schedule->command('app:process-sla-refunds')
                 ->hourly()
                 ->withoutOverlapping();

   

                 
        // Process Task Auto Confirmations
        $schedule->command('app:process-task-auto-confirmations')
                 ->everyFiveMinutes()
                 ->withoutOverlapping();

        $schedule->command('app:process-support-tickets')
                 ->everyFiveMinutes()
                 ->withoutOverlapping();

        $schedule->command("app:auto-suspend-account")->daily()->withoutOverlapping(4);
        
        // Founder Bonus System Jobs
        // Daily job to calculate first 30-day earnings for new creators
        $schedule->job(new CalculateFirstThirtyDayEarnings)
                 ->daily()
                 ->withoutOverlapping(10);

        // Monthly job to check founder qualifications (6th of each month)
        $schedule->job(new CheckFounderQualifications)
                 ->monthlyOn(6, '09:00')
                 ->withoutOverlapping(30);

        // Monthly job to process founder payouts (7th of each month)
        $schedule->job(new ProcessFounderPayouts)
                 ->monthlyOn(7, '10:00')
                 ->withoutOverlapping(30);

        // Risk Engine: Enforce Manual Payouts (Every 10 Minutes)
        $schedule->command('payout:enforce-manual')
                 ->everyTenMinutes()
                 ->withoutOverlapping();

        // Risk Engine: Monitor Platform State (Every 5 Minutes)
        $schedule->command('risk:monitor-platform')
                 ->everyFiveMinutes()
                 ->withoutOverlapping();

        $schedule->command('app:send-shop-order-reminder-email')
                ->everyThreeHours()
                ->withoutOverlapping(10);

        // Risk Engine: Weekly Payout Run (Fridays at 10 AM)
        $schedule->command('payout:run-weekly')
                 ->weeklyOn(5, '10:00')
                 ->withoutOverlapping();

        // Platform Diagnostics — runs daily, emails alert on failure/warning
        $schedule->command('diagnostics:run')
                 ->daily()
                 ->withoutOverlapping(10)
                 ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
