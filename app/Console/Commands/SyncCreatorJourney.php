<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\CreatorJourneyService;
use Illuminate\Console\Command;

class SyncCreatorJourney extends Command
{
    protected $signature = 'journey:sync
        {--user= : Sync a single creator by id}
        {--dry-run : Report what would change without writing}';

    protected $description = 'Recompute where each creator has got to and store it for the admin onboarding drip';

    public function handle(CreatorJourneyService $journey): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $query = User::query()->where('role', 1)->where('suspended_account', 0);

        if ($id = $this->option('user')) {
            $query->whereKey((int) $id);
        }

        $changed = 0;
        $examined = 0;

        // ⚠️ The sweep is the guarantee, not a convenience. The signals a step depends on
        // are written from many places — a listing created in the website, a post approved
        // in the ADMIN app, an identity webhook from Stripe — and several of those bypass
        // Eloquent events entirely. A model observer would sit there firing on nothing.
        foreach ($query->cursor() as $creator) {
            $examined++;

            $from = $creator->journey_step;
            $to = $journey->currentStep($creator);

            if ($from === $to) {
                continue;
            }

            $changed++;
            $this->line(sprintf(
                '%screator #%d: %s → %s',
                $dryRun ? '[dry-run] ' : '',
                $creator->id,
                $from ?? '(unset)',
                $to
            ));

            if (! $dryRun) {
                $journey->syncStep($creator);
            }
        }

        $this->info(sprintf(
            '%sExamined %d creators · %d changed',
            $dryRun ? '[dry-run] ' : '',
            $examined,
            $changed
        ));

        return self::SUCCESS;
    }
}
