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
                
                // Write to default cache
                \Illuminate\Support\Facades\Cache::put('scheduler_last_run', now()->toDateTimeString(), 600);
                
                // Explicitly write to dynamodb store if available
                if (config('cache.stores.dynamodb')) {
                    \Illuminate\Support\Facades\Cache::store('dynamodb')->put('scheduler_last_run_dynamodb', now()->toDateTimeString(), 600);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Scheduler heartbeat failed to write cache', [
                    'error' => $e->getMessage(),
                ]);
            }
        })->everyMinute();

        // Sync subscription status from Stripe every hour
        $schedule->command('subscription:sync')
                 ->hourly()
                 ->withoutOverlapping();

        // Sync all subscriptions status from Stripe every 12 minutes
        $schedule->command('subscription:sync --all')
                 ->cron('*/12 * * * *')
                 ->withoutOverlapping();
                 
        //
        $appUrl = env('APP_URL'); // e.g. https://dev.spennypiggy.co
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

        $schedule->command("app:auto-suspend-account")->daily()->withoutOverlapping(4);
        
        // Schedule pending approval notifications based on configuration
        $allConfigs = collect(config('pending-approval'));
        $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains']));
        
        if ($environmentConfig) {
            $scheduleMethod = $environmentConfig['schedule']; // e.g., 'everyThirtyMinutes' or 'daily'
            
            if (str_contains($scheduleMethod, ' ') || str_contains($scheduleMethod, '*')) {
                $schedule->command('app:notifications-pending-approval')
                     ->cron($scheduleMethod)
                     ->withoutOverlapping(4);
            } else {
                $schedule->command('app:notifications-pending-approval')
                     ->{$scheduleMethod}()
                     ->withoutOverlapping(4);
            }
        }

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
