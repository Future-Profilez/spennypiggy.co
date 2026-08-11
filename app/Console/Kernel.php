<?php

namespace App\Console;

use App\Jobs\CalculateFirstThirtyDayEarnings;
use App\Jobs\CheckFounderQualifications;
use App\Jobs\ProcessFounderMonthlyBonuses;
use App\Jobs\ProcessFounderPayouts;
use App\Jobs\SendMailSubscriptions;
use App\Services\AbandonedCheckoutService;
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
             * Rate-limiting lives on the DISPATCH, not on the probe's own result — see the
             * note inside. An earlier form guarded only on `queue_worker_heartbeat`, which
             * the probe itself writes, so a stopped worker never advanced it and the closure
             * was queued every minute forever: a growing pile of identical jobs that all ran
             * (and could time out) the moment the worker came back.
             */
            try {
                $lastProbe = Cache::get('queue_worker_heartbeat');

                // ⚠️ Rate-limited on when a probe was last SENT, not on when one last RAN.
                //
                // `queue_worker_heartbeat` is written by the probe itself, so it only
                // advances while a worker is alive. Guarding on it alone meant that with
                // `schedule:work` up and `queue:work` down the condition was true every
                // single minute — the closure was queued, never executed, the key never
                // written, and the jobs table gained a row a minute indefinitely. Reported
                // by a developer whose local queue was filling up; it is inert on a machine
                // with a worker, which is why it went unnoticed.
                //
                // Tracking the dispatch separately caps a dead worker at one probe per
                // window (288 a day instead of 1,440) while leaving the healthy path
                // unchanged.
                $lastSend = Cache::get('queue_worker_probe_sent');

                $probeStale = ! $lastProbe || (time() - (int) $lastProbe) > 300;
                $sendStale = ! $lastSend || (time() - (int) $lastSend) > 300;

                if ($probeStale && $sendStale) {
                    // Marked BEFORE dispatching: if the write happened after, a dispatch that
                    // threw would leave no record and the next minute would try again.
                    Cache::put('queue_worker_probe_sent', time(), 600);

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
            // ⚠️ The 5 is the lock expiry in MINUTES, and it is not optional here. Laravel's
            // default is 1440 (a day): this task runs every minute, so a process killed
            // mid-run would leave the mutex held until tomorrow — and the heartbeat is what
            // reports whether the scheduler is alive at all, so its own lock jamming takes
            // the diagnostic dark without a sound.
            //
            // ⚠️ name() is REQUIRED before withoutOverlapping() on a closure task. Laravel's
            // CallbackEvent throws a LogicException without it, and that exception is raised
            // while the schedule is being BUILT — so it does not disable this one entry, it
            // takes down every scheduled task in the application, silently. Verify any change
            // here with `php artisan schedule:list`, which is where it surfaces.
        })->name('scheduler-heartbeat')->everyMinute()->withoutOverlapping(5);

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

        // Reconcile the payment tables against the ledger. A payment that never produced
        // a ledger row is money the creator is not shown and the payout run will not pay,
        // and nothing about it errors — this is the only thing that surfaces it. Runs
        // after the sync so it reports what the sync could not fix.
        $schedule->command('finance:audit-ledger --days=7')
            ->dailyAt('06:45')
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
        //
        // 10:03, not 10:00. Every scheduled command due in one minute runs
        // sequentially inside a SINGLE schedule:run invocation, and on Vapor that
        // invocation dies at `cli-timeout`. Minute :00 already carries six hourly
        // commands plus every */5, */10 and */15 tick, so anything added there is
        // queueing behind all of them. Verified in CloudWatch on 7 Aug 2026: the
        // 10:00 invocation was killed at exactly 120,000 ms on BOTH production and
        // development, and — because output is only flushed when the invocation
        // ends — that minute logged nothing at all.
        $schedule->job(new ProcessFounderPayouts)
            ->dailyAt('10:03')
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

        // Per-listing view counters. One row per listing per day per source, so this
        // grows with the catalogue rather than with traffic — slow, but unbounded
        // without a prune.
        $schedule->command('item-views:prune')
            ->dailyAt('03:50')
            ->withoutOverlapping();

        // Prune membership offer dismissals older than the dismissal window.
        $schedule->command('membership-offer:prune-dismissals')
            ->dailyAt('03:55')
            ->withoutOverlapping();

        // Nudge creators who completed Stripe connect setup but have no listings.
        $schedule->command('creators:nudge-first-listing')
            ->daily()
            ->withoutOverlapping();

        // Recompute where each creator has got to. This must run BEFORE the admin app's
        // onboarding drip (10:00 and 20:00) reads `users.journey_step`, or the drip coaches
        // creators on a step they finished yesterday. Hourly rather than daily because the
        // signals it reads change all day — a listing published at noon should not leave the
        // creator being told to publish one until tomorrow.
        $schedule->command('journey:sync')
            ->hourly()
            ->withoutOverlapping();

        // Start the platform subscription for creators who have made their first sale
        // (client decision, 31 July 2026: nothing is charged before a creator earns).
        //
        // Every fifteen minutes rather than hourly: this is the moment a creator was
        // promised billing would begin, and their dashboard says "free until your first
        // sale" until it runs. A sweep, not a model event — the paths that complete a
        // sale write through query builders and webhooks that fire no Eloquent events.
        //
        // Safe to overlap-guard aggressively: the activation claim is an atomic UPDATE,
        // so a second runner cannot double-bill even if one slips through.
        $schedule->command('subscription:activate-on-sale')
            ->everyFifteenMinutes()
            ->withoutOverlapping(15);

        // The backstop for a card checkout that was started and never resolved.
        //
        // ⚠️ Every ten minutes, not daily. A Stripe Checkout session lives ~24h, so
        // a creator whose redirect was lost has to be found while their session can
        // still be read and their reminder link still works — and until then they
        // cannot sell anything at all. Safe to overlap-guard: the completion and the
        // close are both atomic claims, so a second runner cannot double-apply.
        $schedule->command('subscription:reconcile-checkouts')
            ->everyTenMinutes()
            ->withoutOverlapping(10);

        // One row per refused purchase; nothing else would ever remove one.
        $schedule->command('blocked-payments:prune')
            ->dailyAt('03:55')
            ->withoutOverlapping(30);

        // Delivery log: a row per email, push and bell entry the platform sends,
        // so this table grows faster than any payment table. The same pass
        // settles rows the mail transport never confirmed, which would otherwise
        // read as "still on its way" forever.
        $schedule->command('notification-logs:prune')
            ->dailyAt('03:40')
            ->withoutOverlapping(30);

        // Names settled payments that produced no buyer receipt. This is the
        // check that catches a fulfilment path which silently stops emailing —
        // the failure mode that lost bank-settled wish receipts, where nothing
        // errored and nothing was logged.
        //
        // ⚠️ HOURLY, over the last day only. Most receipts are sent from inside
        // QUEUED jobs, so a stopped `queue:work` means the mail is never
        // attempted and therefore never logged — the log records what the mailer
        // did, not what was intended. The absence is the finding, and this is
        // what reports it. It runs on the SCHEDULER, a different process from
        // the worker, so it still fires when the worker is the thing that died;
        // daily would have let that hide for 24 hours.
        $schedule->command('notifications:audit-missing', ['--days' => 1])
            ->hourlyAt(50)
            ->withoutOverlapping(30);

        // Deeper daily pass: catches anything the hourly window stepped over
        // (a backlog drained late, a worker down overnight).
        $schedule->command('notifications:audit-missing', ['--days' => 7])
            ->dailyAt('06:50')
            ->withoutOverlapping(30);

        // Sold-out waitlist. This sweep is the GUARANTEE, not a backstop: every path
        // that puts stock back bypasses Eloquent events (the refund handler's
        // ->increment(), the creator edit's ->update(), and the admin app, which shares
        // the database and runs none of this code), so a model observer would never
        // have fired. The immediate checkRestock() calls only make it faster.
        $schedule->command('waitlist:notify-restock')
            ->everyTenMinutes()
            ->withoutOverlapping(10);

        // Scheduled posts. ⚠️ This does NOT make a post visible — the model's
        // publish-time scope does that on every query, so a stopped worker cannot
        // silently swallow a creator's whole content calendar. This owns only the
        // once-per-post work: the release stamp, the guest cache clear, and
        // telling the creator (or telling them their slot passed unreviewed).
        $schedule->command('posts:publish-scheduled')
            ->everyFiveMinutes()
            ->withoutOverlapping(10);

        // ⚠️ This does NOT decide visibility — the HasScheduledPublishing global scope
        // compares publish_at to the clock on every query, so a listing goes on sale at
        // its minute whether or not this runs. It owns the once-per-listing work:
        // clearing the guest profile cache and telling the creator.
        $schedule->command('listings:publish-scheduled')
            ->everyFiveMinutes()
            ->withoutOverlapping(10);

        // Piggy Pots close because TIME passed, not because anybody saved a row, so
        // nothing but a sweep can notice. Until this existed, a pot whose deadline
        // was months ago still sat in the creator's featured profile slot and sent
        // every visitor to a purchase refusal. Hourly: a pot is dated to a day, so
        // finer granularity buys nothing.
        $schedule->command('piggy-pots:expire')
            ->hourly()
            ->withoutOverlapping(10);

        $schedule->command('app:send-shop-order-reminder-email')
            ->everyThreeHours()
            ->withoutOverlapping(10);

        // Risk Engine: Weekly Payout Run (Fridays)
        //
        // 10:07, not 10:00 — see the note on ProcessFounderPayouts above. This is
        // the command that exposed the problem: on 7 Aug 2026 the 10:00 invocation
        // was killed at the Lambda timeout on both environments, so the run never
        // started and left no trace, which reads exactly like a scheduler that
        // never fired. It is also the longest-running command in the schedule (a
        // Stripe round trip per creator), so it must not share a minute with the
        // hourly pile-up.
        //
        // Both halves matter: the quiet minute, and cli-timeout in vapor.yml.
        $schedule->command('payout:run-weekly')
            ->weeklyOn(5, '10:07')
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

        /*
        | Move existing subscribers onto a creator's REDUCED platform rate.
        |
        | 🚨 Without this the feature is half-built and fails silently: a Stripe
        | subscription's amount is fixed at signup, so a rate cut agreed with a
        | creator would never reach anyone already subscribed to them. The
        | command is the only thing that repricing happens through.
        |
        | Daily, and deliberately BEFORE the payout window: a supporter's invoice
        | should be raised at the new price the first time it renews after the
        | deal changes, not one cycle later.
        |
        | It can only ever lower a charge — an increase leaves existing
        | subscribers grandfathered (see RepriceSubscriptionsOnFeeChange).
        */
        $schedule->command('subscriptions:reprice-on-fee-change')
            ->dailyAt('06:15')
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
        // ⚠️ The every-minute tick is for OBSERVING a deliberately shortened
        // CHECKOUT_RECOVERY_SCHEDULE_MINUTES (e.g. `1,2`), and it now requires that the
        // schedule actually IS short. It used to fire every minute on any local machine,
        // which meant every developer who had never touched that variable — and whose
        // reminders were an hour away regardless — still ran the command 1,440 times a day
        // for nothing. A fast tick that outlives the reason for it is just noise on
        // somebody else's machine.
        $recoveryIsShort = min(AbandonedCheckoutService::schedule()) < 60;

        $recovery = $schedule->command('checkout:recover')->withoutOverlapping(10);

        app()->environment('local', 'testing') && $recoveryIsShort
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
