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
        if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
            $schedule->command('app:notifications-pending-approval')->daily()->withoutOverlapping(4);
        } elseif ($appUrl == 'https://spennypiggy.co') {
            $schedule->command('app:notifications-pending-approval')->everyThirtyMinutes()->withoutOverlapping(4);
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
