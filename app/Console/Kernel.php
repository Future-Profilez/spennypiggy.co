<?php

namespace App\Console;

use App\Jobs\SendMailSubscriptions;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
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
