<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\CreatorSetupService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Stamp the creators who do not need to be told their setup is finished.
 *
 * 🚨 RUN THIS ONCE, ON THE DEPLOY THAT SHIPS THE CELEBRATION. Without it every approved
 * creator on the platform is handed a full-screen "you're all set" the next time they open
 * their dashboard — including the ones who finished setup months ago and have been selling
 * ever since. A congratulation for something somebody did in July, arriving in September,
 * reads as the platform having lost track of them.
 *
 * ⚠️ IT DELIBERATELY DOES NOT STAMP EVERYONE. A creator who is set up and has published
 * NOTHING is exactly the cohort this feature was built for — approved, able to sell, and
 * selling nothing because nobody ever told them the waiting was over. They are left
 * unstamped on purpose and will see the celebration once. The line is the listings target:
 * at or above it the creator has plainly worked out what to do and needs no prompting.
 *
 * ⚠️ Dry run by default. It writes a column that can never be un-written — the celebration
 * is one-time and stamping it is what spends it — so the destructive direction has to be
 * asked for.
 */
class BackfillSetupCelebrated extends Command
{
    protected $signature = 'setup:backfill-celebrated
                            {--apply : Write the timestamps. Without this nothing is changed.}
                            {--max=1000 : Stop after this many creators.}';

    protected $description = 'Mark established creators as already told their setup is complete.';

    public function handle(CreatorJourneyService $journey, CreatorSetupService $setup): int
    {
        $apply = (bool) $this->option('apply');
        $max = max(1, (int) $this->option('max'));
        $target = max(1, (int) config('creator_setup.listings_target', 3));

        $stamped = 0;
        $skipped = 0;
        $examined = 0;

        User::query()
            // ⚠️ Eager-loaded: `setupComplete()` reads the social handle, and without this
            // every creator in the sweep costs a second query for it.
            ->with('social_links')
            ->where('role', 1)
            ->whereNull('setup_celebrated_at')
            ->orderBy('id')
            ->chunkById(100, function ($creators) use (
                $journey, $setup, $apply, $target, $max, &$stamped, &$skipped, &$examined
            ) {
                foreach ($creators as $creator) {
                    if ($examined >= $max) {
                        return false;
                    }

                    $examined++;

                    // Still mid-setup, or suspended, or otherwise not a creator this applies
                    // to. Their celebration is still ahead of them.
                    if (! $journey->setupComplete($creator)) {
                        continue;
                    }

                    if ($setup->listingCount($creator) < $target) {
                        // The cohort this feature exists for. Left alone on purpose.
                        $skipped++;

                        continue;
                    }

                    $stamped++;

                    if ($apply) {
                        // 🚨 `DB::table`, never `save()`/`saveQuietly()`/`User::query()->update()`
                        // — all three stamp `updated_at`, which keys the public profile cache
                        // and ORDERS the admin creator-review queue. A backfill that re-dated
                        // every established creator would reshuffle that queue in one command.
                        DB::table('users')
                            ->where('id', $creator->getKey())
                            ->whereNull('setup_celebrated_at')
                            ->update(['setup_celebrated_at' => now()]);
                    }
                }

                return true;
            });

        $this->info(sprintf(
            '%s %d creator(s) as already told. %d left to see the celebration. %d examined.',
            $apply ? 'Stamped' : 'Would stamp',
            $stamped,
            $skipped,
            $examined
        ));

        if (! $apply) {
            $this->comment('Dry run — nothing was written. Re-run with --apply.');
        }

        return self::SUCCESS;
    }
}
