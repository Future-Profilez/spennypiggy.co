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
    protected function schedule(Schedule $schedule)
    {
        // Sync subscription status from Stripe every hour
        $schedule->command('subscription:sync')
                 ->hourly()
                 ->withoutOverlapping()
                 ->runInBackground();
                 
        //
        $appUrl = env('APP_URL'); // e.g. https://dev.spennypiggy.co
        // $schedule->job(new SendMailSubscriptions)->everyMinute(); // Runs MyJob every hour
        $schedule->command("app:sync-exchange-rate")->hourly()->withoutOverlapping(4);

        $schedule->command("app:auto-suspend-account")->daily()->withoutOverlapping(4);
        
        // Schedule pending approval notifications based on configuration
        $allConfigs = collect(config('pending-approval'));
        $environmentConfig = $allConfigs->first(fn($config) => in_array($appUrl, $config['domains']));
        
        if ($environmentConfig) {
            $scheduleMethod = $environmentConfig['schedule']; // e.g., 'everyThirtyMinutes' or 'daily'
            $schedule->command('app:notifications-pending-approval')
                     ->{$scheduleMethod}()
                     ->withoutOverlapping(4);
        }

        // Founder Bonus System Jobs
        // Daily job to calculate first 30-day earnings for new creators
        $schedule->job(new CalculateFirstThirtyDayEarnings)
                 ->daily()
                 ->withoutOverlapping(10)
                 ->runInBackground();

        // Monthly job to check founder qualifications (6th of each month)
        $schedule->job(new CheckFounderQualifications)
                 ->monthlyOn(6, '09:00')
                 ->withoutOverlapping(30)
                 ->runInBackground();

        // Monthly job to process founder payouts (7th of each month)
        $schedule->job(new ProcessFounderPayouts)
                 ->monthlyOn(7, '10:00')
                 ->withoutOverlapping(30)
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
