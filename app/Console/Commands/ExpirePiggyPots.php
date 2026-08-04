<?php

namespace App\Console\Commands;

use App\Models\PiggyPot;
use App\Services\NotificationDispatcher;
use App\Services\PiggyPotStatusService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Closes Piggy Pots whose deadline has passed.
 *
 * ⚠️ **Nothing has ever flipped a pot to `expired`.** The deadline was enforced
 * only at the moment of purchase, so a pot with a date three months ago sat on
 * the creator's profile in the featured slot, took visitors to a refusal, and
 * reported `active` to every admin screen. This sweep is what makes `status` mean
 * what the rest of the codebase already assumed it meant.
 *
 * A sweep rather than a model event, for the same reason as the restock one: a
 * deadline passes because TIME passed, not because anybody saved a row.
 *
 * ⚠️ Flipping `status` also bumps `updated_at`, which is what the profile cache
 * version is derived from — so the pot disappears for guests on the next request
 * rather than lingering for up to the 300s cache TTL. A purely computed hide
 * would not have that property.
 */
class ExpirePiggyPots extends Command
{
    protected $signature = 'piggy-pots:expire
        {--max=500 : Maximum pots to close in one run}
        {--dry-run : Report only, change nothing}';

    protected $description = 'Close Piggy Pots whose deadline has passed and tell their creators';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $pots = PiggyPotStatusService::dueForExpiry()
            ->with('user')
            ->orderBy('deadline')
            ->limit($max)
            ->get();

        if ($pots->isEmpty()) {
            $this->info('No pots are past their deadline.');

            return self::SUCCESS;
        }

        $closed = 0;

        foreach ($pots as $pot) {
            $this->line(sprintf(
                '%s "%s" (deadline %s)%s',
                $dryRun ? 'Would close' : 'Closing',
                $pot->title,
                optional($pot->deadline)->format('Y-m-d') ?? '—',
                $pot->is_pinned ? ' [pinned]' : ''
            ));

            if ($dryRun) {
                $closed++;

                continue;
            }

            // Claimed with the status still in the WHERE, so a second runner —
            // or the same command started twice — cannot close and notify the
            // same pot twice.
            $claimed = PiggyPot::where('id', $pot->id)
                ->where('status', 'active')
                ->update(['status' => 'expired']);

            if ($claimed === 0) {
                continue;
            }

            $closed++;
            $this->notifyCreator($pot);
        }

        $this->info(($dryRun ? 'Would close ' : 'Closed ').$closed.' pot(s).');

        return self::SUCCESS;
    }

    /**
     * A pinned pot silently vanishing from a creator's own profile is the exact
     * "the money stopped and nobody said" pattern this codebase keeps fixing.
     *
     * Transactional (`$marketing = false`) — it is the platform telling a creator
     * one of their listings has stopped selling, not promotion. Bell + push only:
     * the same message arrives in the pot dashboard, and their inbox is not where
     * operational data about their own listing belongs.
     *
     * Never throws — a notification must not be why a pot fails to close.
     */
    private function notifyCreator(PiggyPot $pot): void
    {
        try {
            $creator = $pot->user;

            if (! $creator) {
                return;
            }

            $pinned = $pot->is_pinned
                ? ' It was your featured pot, so your profile now shows another one.'
                : '';

            NotificationDispatcher::queue(
                $creator,
                'piggy_pot_expired',
                [
                    'title' => 'Your Piggy Pot has closed',
                    'body' => "\"{$pot->title}\" reached its deadline and is no longer on your profile."
                        .$pinned
                        .' Set a new deadline to reopen it.',
                    'module' => 'piggy_pot',
                    'url' => route('piggy-pots.index'),
                ],
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                false
            );
        } catch (\Throwable $e) {
            Log::warning('ExpirePiggyPots: failed to notify creator', [
                'piggy_pot_id' => $pot->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
