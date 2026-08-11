<?php

namespace App\Console\Commands;

use App\Services\SubscriptionActivationService;
use App\Support\SubscriptionPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Starts the platform subscription for creators who have made their first sale.
 *
 * A sweep rather than a model event, for the same reason the sold-out waitlist
 * is a sweep: the signals that create a first sale arrive from many places — a
 * redirect handler, six different webhook paths, the financial-transaction
 * resync — and several of them write with query builders that fire no Eloquent
 * events at all. An observer would sit there watching nothing and the creator
 * would sell for months without ever being billed.
 */
class ActivateSubscriptionsOnFirstSale extends Command
{
    protected $signature = 'subscription:activate-on-sale
        {--max= : Stop after activating this many creators}
        {--user= : Only this creator (id, username or email)}
        {--dry-run : Report what would happen without calling Stripe}';

    protected $description = 'End the free period for creators who have made their first sale';

    public function handle(SubscriptionActivationService $service): int
    {
        if (! SubscriptionPlan::freeUntilFirstSale()) {
            $this->warn('creator_subscription.free_until_first_sale is off — nothing to do.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $query = $service->dueQuery();

        if ($only = $this->option('user')) {
            // Email too — it is the obvious thing to reach for, the announcement
            // command already accepts it, and without it `--user=<email>` silently
            // matched nobody and reported "Examined 0" as though the sweep had
            // correctly found nothing to do.
            $query->where(function ($q) use ($only) {
                $q->where('username', $only)->orWhere('email', $only);
                if (ctype_digit((string) $only)) {
                    $q->orWhere('id', (int) $only);
                }
            });
        }

        $activated = 0;
        $failed = 0;
        $examined = 0;

        // ⚠️ --max caps creators ACTIVATED, not creators examined. Capping the
        // query instead would mean a run whose first N candidates all failed
        // silently reached nobody further down the list, on every run.
        foreach ($query->cursor() as $creator) {
            $examined++;

            if (! $service->shouldActivate($creator)) {
                continue;
            }

            // Hand the resolved row straight to activate() rather than letting it
            // look the same one up again.
            if ($service->activate($creator, $dryRun, $service->pendingSubscription($creator))) {
                $activated++;
                $this->line(($dryRun ? '[dry-run] ' : '')."Activated subscription for {$creator->username} (#{$creator->id})");
            } else {
                $failed++;
                $this->warn("Could not activate subscription for {$creator->username} (#{$creator->id})");
            }

            if ($max !== null && $activated >= $max) {
                $this->info("Reached --max={$max}; stopping.");
                break;
            }
        }

        $this->info(sprintf(
            '%sExamined %d, activated %d, failed %d.',
            $dryRun ? '[dry-run] ' : '',
            $examined,
            $activated,
            $failed,
        ));

        if ($failed > 0 && ! $dryRun) {
            // Every failure here is a creator who has earned money and is not
            // being billed for it. Worth a log line the alerting can find.
            Log::warning('subscription:activate-on-sale finished with failures', [
                'activated' => $activated,
                'failed' => $failed,
            ]);
        }

        return self::SUCCESS;
    }
}
