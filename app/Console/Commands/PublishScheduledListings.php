<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Services\UserProfileService;
use App\Support\CatalogueRegistry;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Releases listings whose scheduled publish time has arrived.
 *
 * ⚠️ **This command does not decide whether a listing is visible — TIME does.** The
 * `HasScheduledPublishing` global scope compares `publish_at` to the clock on every
 * query, so a listing goes on sale at its appointed minute whether or not this command
 * ever runs. That is deliberate: a queue worker being down must not mean a creator's
 * product launch silently fails.
 *
 * What this DOES own is the work that has to happen exactly once, at the moment of
 * release: clearing the guest profile cache so the listing is actually seen, and telling
 * the creator. `schedule_released_at` is the claim, so two runners cannot both announce
 * the same listing.
 */
class PublishScheduledListings extends Command
{
    protected $signature = 'listings:publish-scheduled
        {--max=200 : Maximum listings to release in one run}
        {--dry-run : Report only, change nothing}';

    protected $description = 'Announce listings whose scheduled publish time has arrived';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $released = 0;
        $waiting = 0;

        foreach (CatalogueRegistry::TYPES as $type => $config) {
            try {
                [$typeReleased, $typeWaiting] = $this->releaseType($config, $max - $released, $dryRun);
            } catch (Throwable $e) {
                // One type failing must not stop the other five from launching.
                Log::error('listings:publish-scheduled failed for '.$type, ['error' => $e->getMessage()]);
                $this->warn("{$type}: {$e->getMessage()}");

                continue;
            }

            $released += $typeReleased;
            $waiting += $typeWaiting;

            if ($released >= $max) {
                break;
            }
        }

        $this->info(($dryRun ? 'Would release ' : 'Released ').$released.' listing(s)'
            .($waiting > 0 ? ", {$waiting} still waiting on review." : '.'));

        return self::SUCCESS;
    }

    /**
     * @param  array<string,mixed>  $config
     * @return array{0:int,1:int}
     */
    private function releaseType(array $config, int $room, bool $dryRun): array
    {
        if ($room <= 0) {
            return [0, 0];
        }

        $model = $config['model'];

        $due = $model::withScheduled()
            ->whereNotNull('publish_at')
            ->where('publish_at', '<=', now())
            ->whereNull('schedule_released_at')
            ->orderBy('publish_at')
            ->limit($room)
            ->get();

        $released = 0;
        $waiting = 0;

        foreach ($due as $item) {
            // Approval is still the gate it always was. A listing that reached its
            // publish time without being reviewed is not announced here — it goes live
            // the moment an admin approves it, exactly like any other listing.
            if ($config['approval'] && (int) ($item->{$config['approval']} ?? 0) !== 1) {
                $waiting++;

                continue;
            }

            $this->line(sprintf(
                '%s %s "%s" (due %s)',
                $dryRun ? 'Would release' : 'Releasing',
                $config['label'],
                $this->titleOf($item, $config) ?: 'Untitled',
                optional($item->publish_at)->format('Y-m-d H:i')
            ));

            if ($dryRun) {
                $released++;

                continue;
            }

            // The claim IS the update, so a second runner loses the race rather than
            // announcing the same launch twice.
            $claimed = $model::withScheduled()
                ->whereKey($item->getKey())
                ->whereNull('schedule_released_at')
                ->update(['schedule_released_at' => now()]);

            if (! $claimed) {
                continue;
            }

            $released++;
            $this->announce($item, $config);
        }

        return [$released, $waiting];
    }

    /**
     * @param  array<string,mixed>  $config
     */
    private function announce(Model $item, array $config): void
    {
        try {
            $creator = $item->{$config['owner'] === 'creator_id' ? 'creator' : 'user'} ?? null;

            if (! $creator) {
                $creator = User::find($item->{$config['owner']});
            }

            if (! $creator) {
                return;
            }

            // Guests read the profile from cache, so without this the listing is live in
            // the database and invisible on the page it was scheduled for.
            app(UserProfileService::class)->clearUserCaches($creator->username, $creator->id);

            $title = $this->titleOf($item, $config) ?: $config['label'];

            // ⚠️ `queue()` is static, and takes no dedup key — none is needed here,
            // because the `schedule_released_at` claim above already guarantees this
            // runs exactly once per listing.
            //
            // $marketing = false: a creator's own listing going on sale is operational,
            // not promotion. No email — their inbox is not where this belongs.
            NotificationDispatcher::queue(
                $creator,
                'listing_published',
                [
                    'title' => 'Your listing is live',
                    'body' => '"'.$title.'" is now on sale.',
                ],
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                false
            );
        } catch (Throwable $e) {
            // A notification must never be why a launch is recorded as failed — the
            // listing is already on sale by the time this runs.
            Log::error('listings:publish-scheduled could not announce', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @param  array<string,mixed>  $config
     */
    private function titleOf(Model $item, array $config): ?string
    {
        $value = trim((string) ($item->{$config['title']} ?? ''));

        return $value !== '' ? $value : null;
    }
}
