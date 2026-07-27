<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Console\Command;

class BackfillStripeConnectedAt extends Command
{
    protected $signature = 'stripe:backfill-connected-at {--dry-run} {--limit=0} {--overwrite} {--no-stripe-api}';

    protected $description = 'Backfill users.stripe_connected_at for creators who already completed Stripe Connect';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $dryRun = (bool) $this->option('dry-run');
        $overwrite = (bool) $this->option('overwrite');
        $noStripeApi = (bool) $this->option('no-stripe-api');

        $query = User::query()
            ->whereNotNull('account_id')
            ->where('stripe_details_submitted', 1)
            ->orderBy('id');

        if (! $overwrite) {
            $query->whereNull('stripe_connected_at');
        }

        if ($limit > 0) {
            $query->limit($limit);
        }

        $users = $query->get(['id', 'uuid', 'account_id', 'updated_at', 'stripe_connected_at']);

        $updated = 0;
        $usedStripeCreated = 0;
        $setNull = 0;

        foreach ($users as $user) {
            $accountId = (string) $user->account_id;

            $stripeCreatedAt = null;
            if (! $noStripeApi) {
                try {
                    $account = StripeControl::getAccount($accountId);
                    if (isset($account->created)) {
                        $stripeCreatedAt = Carbon::createFromTimestamp((int) $account->created);
                    }
                } catch (\Throwable) {
                    $stripeCreatedAt = null;
                }
            }

            $connectedAt = $stripeCreatedAt;
            if (! $connectedAt) {
                $previous = $user->stripe_connected_at ? Carbon::parse($user->stripe_connected_at)->toDateTimeString() : 'null';
                if ($dryRun) {
                    $this->line($user->id.' '.$accountId.' prev='.$previous.' new=null');
                } else {
                    if ($overwrite && $user->stripe_connected_at !== null) {
                        $user->stripe_connected_at = null;
                        $user->save();
                        $setNull++;
                    }
                }

                continue;
            }
            $usedStripeCreated++;

            $previous = $user->stripe_connected_at ? Carbon::parse($user->stripe_connected_at)->toDateTimeString() : 'null';

            if ($dryRun) {
                $this->line($user->id.' '.$accountId.' prev='.$previous.' new='.($connectedAt?->toDateTimeString() ?? 'null'));

                continue;
            }

            $user->stripe_connected_at = $connectedAt;
            $user->save();
            $updated++;
        }

        $this->info('Matched users: '.$users->count());
        $this->info('Updated users: '.$updated);
        $this->info('Used Stripe account.created: '.$usedStripeCreated);
        $this->info('Set null (Stripe API failed): '.$setNull);

        return self::SUCCESS;
    }
}
