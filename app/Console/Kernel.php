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
        // $schedule->job(new SendMailSubscriptions)->everyMinute(); // Runs MyJob every hour
        $schedule->command("app:sync-echange-rate")->everyFiveMinutes()->withoutOverlapping(4);
        $schedule->command("app:auto-suspend-account")->daily()->withoutOverlapping(4);
        $schedule->command('notifications:pending-approval')->everyThirtyMinutes();
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
