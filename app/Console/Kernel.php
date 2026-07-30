<?php

namespace App\Console;

use App\Jobs\CalculateFirstThirtyDayEarnings;
use App\Jobs\CheckFounderQualifications;
use App\Jobs\ProcessFounderMonthlyBonuses;
use App\Jobs\ProcessFounderPayouts;
use App\Jobs\SendMailSubscriptions;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

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
                Log::info('Scheduler heartbeat: executing at '.now()->toDateTimeString().' using driver: '.config('cache.default'));

                // Write to default cache for diagnostics
                Cache::put('scheduler_heartbeat', time(), 600);

                // Explicitly write to dynamodb store if available - DISABLED
                if (config('cache.stores.dynamodb')) {
                    // \Illuminate\Support\Facades\Cache::store('dynamodb')->put('scheduler_last_run_dynamodb', now()->toDateTimeString(), 600);
                }
            } catch (\Throwable $e) {
                Log::error('Scheduler heartbeat failed to write cache', [
                    'error' => $e->getMessage(),
                ]);
            }

            /*
             * Queue-worker probe — deliberately OUTSIDE the block above.
             *
             * On the database queue driver, dispatch() writes to `jobs`, so when the DB is
             * unreachable this throw used to be caught by the scheduler's own catch and
             * reported as "Scheduler heartbeat failed to write cache" every single minute —
             * blaming the cache write that had already succeeded, and burying the real cause.
             *
             * It is also re-probed only once the last probe has gone stale rather than every
             * minute: the previous form queued a closure per minute forever, so a stopped
             * worker left a growing pile of identical jobs that all ran (and could time out)
             * the moment it came back.
             */
            try {
                $lastProbe = Cache::get('queue_worker_heartbeat');

                if (! $lastProbe || (time() - (int) $lastProbe) > 300) {
                    // No ->onQueue() here on purpose. Locally the database connection's queue IS
                    // named "default", but on Vapor QUEUE_CONNECTION is sqs and SQS_QUEUE holds a
                    // full queue URL — naming a queue would push the probe to a queue nothing
                    // consumes, so the heartbeat would read as a permanently dead worker in
                    // production. Let each connection use its own configured queue.
                    dispatch(function () {
                        Cache::put('queue_worker_heartbeat', time(), 600);
                    });
                }
            } catch (\Throwable $e) {
                Log::warning('Queue worker heartbeat probe could not be dispatched', [
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
        $schedule->command('app:sync-exchange-rate')->hourly()->withoutOverlapping(4);

        // Verifies the promise the pricing model rests on — that the creator
        // received exactly the listed price. The supporter's price is grossed
        // up from an ESTIMATE of Stripe's fee, and any shortfall against the
        // real fee comes out of the creator's net silently. Nothing compared
        // the two until this ran, so a leak could persist indefinitely.
        $schedule->command('payments:verify-creator-net --days=2')
            ->dailyAt('06:30')
            ->withoutOverlapping();

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

        $schedule->command('app:auto-suspend-account')->daily()->withoutOverlapping(4);

        // Capture each period's standing once a day. Rank movement on the
        // leaderboard is measured against these captures, so a day missed is a
        // day of arrows the board cannot draw.
        $schedule->command('leaderboard:snapshot')
            ->dailyAt('03:15')
            ->withoutOverlapping(30);

        // Founder Bonus System Jobs
        // Daily job to calculate first 30-day earnings for new creators
        $schedule->job(new CalculateFirstThirtyDayEarnings)
            ->daily()
            ->withoutOverlapping(10);

        // Progress alerts: Fast Start countdown, milestone nudges, Founder proximity/countdown
        // Runs before qualification check so founders are nudged before status is finalized
        $schedule->command('bonus:send-progress-alerts')
            ->dailyAt('08:30')
            ->withoutOverlapping();

        // Daily job to check founder qualifications — creators learn the outcome
        // (qualified or missed) within a day of their 30-day window ending
        $schedule->job(new CheckFounderQualifications)
            ->dailyAt('09:00')
            ->withoutOverlapping(30);

        // Daily job to process founder payouts (only picks bonuses whose
        // estimated_payout_date has arrived, so cadence is safe)
        $schedule->job(new ProcessFounderPayouts)
            ->dailyAt('10:00')
            ->withoutOverlapping(30);

        $schedule->job(new ProcessFounderMonthlyBonuses)
            ->monthlyOn(7, '10:05')
            ->withoutOverlapping(30);

        // Risk Engine: Enforce Manual Payouts (Every 10 Minutes)
        $schedule->command('payout:enforce-manual')
            ->everyTenMinutes()
            ->withoutOverlapping();

        // Risk Engine: Monitor Platform State (Every 5 Minutes)
        $schedule->command('risk:monitor-platform')
            ->everyFiveMinutes()
            ->withoutOverlapping();

        // Sold-out waitlist. This sweep is the GUARANTEE, not a backstop: every path
        // that puts stock back bypasses Eloquent events (the refund handler's
        // ->increment(), the creator edit's ->update(), and the admin app, which shares
        // the database and runs none of this code), so a model observer would never
        // have fired. The immediate checkRestock() calls only make it faster.
        $schedule->command('waitlist:notify-restock')
            ->everyTenMinutes()
            ->withoutOverlapping(10);

        $schedule->command('app:send-shop-order-reminder-email')
            ->everyThreeHours()
            ->withoutOverlapping(10);

        // Risk Engine: Weekly Payout Run (Fridays at 10 AM)
        $schedule->command('payout:run-weekly')
            ->weeklyOn(5, '10:00')
            ->withoutOverlapping();

        // Risk Engine: Release held reserves 30 days after each transaction (daily)
        // Visit counters live in the cache between runs; without this the funnel
        // dashboard has no visit data and the counts eventually expire.
        $schedule->command('visits:flush')
            ->everyFiveMinutes()
            ->withoutOverlapping();

        $schedule->command('reserve:release')
            ->dailyAt('10:30')
            ->withoutOverlapping();

        // Catch-all for bank payment capabilities: onboarding payloads and the
        // account.updated self-heal cover new creators, but a missed webhook or
        // an account created down a path that omitted the capabilities payload
        // otherwise stays broken until someone runs the backfill by hand. This
        // guarantees every eligible creator is topped up within a day.
        $schedule->command('stripe:request-bank-capabilities')
            ->dailyAt('07:40')
            ->withoutOverlapping(30);

        // Safety net for dropped payout webhooks: resolve records stuck in_transit.
        $schedule->command('payout:reconcile')
            ->dailyAt('11:30')
            ->withoutOverlapping();

        // Safety net for dropped payment webhooks: replay bank/SEPA/ACH sales whose
        // async_payment_succeeded event never arrived, so no sale is silently lost.
        $schedule->command('payments:sweep-stuck')
            ->dailyAt('12:00')
            ->withoutOverlapping();

        // Abandoned checkout recovery. HOURLY, not daily: the first reminder is worth
        // most about an hour after the tab was closed, and a Stripe Checkout session
        // only lives ~24 hours, so a daily pass would mostly send dead links.
        //
        // Offset to :20 so it never runs alongside payments:sweep-stuck — the sweep
        // replays fulfilment for dropped webhooks, and chasing a supporter before it
        // has run risks telling someone who paid that they did not.
        //
        // On local/testing it runs every minute instead, so a shortened
        // CHECKOUT_RECOVERY_SCHEDULE_MINUTES (e.g. `1,2`) can actually be observed —
        // an hourly tick would make a one-minute schedule untestable.
        $recovery = $schedule->command('checkout:recover')->withoutOverlapping(10);

        app()->environment('local', 'testing')
            ? $recovery->everyMinute()
            : $recovery->hourlyAt(20);

        // Stripe compliance: pause/resume content memberships on the min-3-posts/30-day cadence
        $schedule->command('app:enforce-posting-cadence')
            ->dailyAt('11:00')
            ->withoutOverlapping();

        // Notify supporters before a recurring subscription auto-renews
        $schedule->command('renewals:notify')
            ->dailyAt('09:45')
            ->withoutOverlapping(10);

        // Engagement engine. Spread across the morning so they don't all fan out
        // onto the queue at once. All require queue:work to actually deliver.
        $schedule->command('reactivation:notify')
            ->dailyAt('10:15')
            ->withoutOverlapping(15);

        $schedule->command('milestones:notify')
            ->dailyAt('08:15')
            ->withoutOverlapping(10);

        // Post mentions fire on approval, not on save — the approval happens in
        // the admin app, so this poll is what closes the loop across the two
        // codebases. Frequent, because "you were tagged" is stale within hours.
        $schedule->command('mentions:notify')
            ->everyTenMinutes()
            ->withoutOverlapping(10);

        $schedule->command('whale:retention-alerts')
            ->dailyAt('08:45')
            ->withoutOverlapping(10);

        $schedule->command('bonus:process-fast-start')
            ->dailyAt('09:15')
            ->withoutOverlapping();

        $schedule->command('bonus:reconcile-fast-start')
            ->dailyAt('09:30')
            ->withoutOverlapping();

        // Platform Diagnostics — runs daily, emails alert on failure/warning.
        // Deliberately NOT --deep: the deep checks create a real Stripe Connect account and a
        // real PaymentIntent, and a scheduled job must not mint one of each every night.
        // --prune drops recorded runs past the retention window so the history cannot grow
        // without bound.
        $schedule->command('diagnostics:run --prune')
            ->daily()
            ->withoutOverlapping(10)
            ->runInBackground();

        // Stage syncing moved to the admin app's crm:sync-stages (July 2026
        // rebuild) — this app's version wrote the OLD stage keys, so every run
        // silently reverted the migrated pipeline. Do not re-enable.
        // $schedule->command('crm:sync-creator-stages')
        //          ->everyThirtyMinutes()
        //          ->withoutOverlapping();

        // Web Vitals samples are one row per metric per page view and nothing ever
        // removed one. The dashboard reads 30 days at most, so anything older is a
        // per-visitor record we keep for no reader.
        $schedule->command('web-vitals:prune')
            ->dailyAt('03:45')
            ->withoutOverlapping();

        // Social matching is NOT stage syncing: it only fills the
        // social_match_suggested_* columns the admin dashboard reads, and it
        // never touches crm_stage — so it stays on this app, where the user
        // accounts live.
        $schedule->command('crm:scan-prospect-user-matches')
            ->everyThirtyMinutes()
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
