<?php

namespace App\Console\Commands;

use App\Mail\PublishYourFirstItem;
use App\Models\User;
use App\Services\CreatorSetupService;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class NudgeFirstListing extends Command
{
    protected $signature = 'creators:nudge-first-listing
        {--max=100 : Maximum creators to NUDGE in this run}
        {--dry-run : Report what would be sent without sending or claiming}';

    protected $description = 'Nudge creators who connected Stripe but have not published any listing';

    public function handle(CreatorSetupService $setup): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $sent = 0;
        $skipped = 0;
        $examined = 0;

        // ⚠️ `--max` caps creators NUDGED, not creators looked at. Capping the query instead
        // meant a run whose first N candidates were all too recent sent nothing, while
        // creators past day 3 sitting beyond the cap were never reached on any run — a
        // delivery hole that stayed silent and grew with the table. Iterating with a cursor
        // and breaking on sends keeps the memory profile of a limited query without the bug.
        foreach ($setup->candidateQuery()->orderByRaw('COALESCE(stripe_connected_at, created_at) asc')->cursor() as $user) {
            if ($sent >= $max) {
                break;
            }

            $examined++;
            $stage = $this->stageFor($user);

            if ($stage === null) {
                $skipped++;

                continue;
            }

            if ($dryRun) {
                $this->info(sprintf(
                    '[dry-run] Creator #%d (%s) is at stage %d — would send nudge.',
                    $user->id,
                    $user->email,
                    $stage
                ));
                $sent++;

                continue;
            }

            // The claim IS the insert, so two workers racing cannot both send.
            if (! NotificationDispatcher::claim($user->id, 'first_listing', "nudge:{$stage}")) {
                $skipped++;

                continue;
            }

            try {
                NotificationDispatcher::queue(
                    $user,
                    'first_listing',
                    [
                        'title' => PublishYourFirstItem::subjectFor($stage),
                        'body' => 'Put something up for sale so your supporters have something to buy.',
                        'url' => route('dashboard', ['add' => CreatorSetupService::FIRST_LISTING_PARAM]),
                        'module' => 'first_listing',
                        'mailable' => PublishYourFirstItem::class,
                        'mailable_args' => [
                            'userId' => $user->id,
                            'creatorName' => $user->name ?: ($user->username ?? 'Creator'),
                            'stage' => $stage,
                        ],
                    ],
                    $this->channelsFor($user),
                    // Operational: this is the state of the creator's own account, so it is
                    // not routed through the marketing consent gate. The email channel is
                    // still dropped by channelsFor() when they have opted out of creator
                    // updates — see the note there.
                    false
                );

                $sent++;
                $this->info(sprintf('Nudged creator #%d (%s) at stage %d.', $user->id, $user->email, $stage));
            } catch (\Throwable $e) {
                Log::error('creators:nudge-first-listing — failed to send notification', [
                    'user_id' => $user->id,
                    'stage' => $stage,
                    'error' => $e->getMessage(),
                ]);
                $skipped++;
            }
        }

        $this->info(sprintf(
            '%sProcessed %d creators · nudged %d · skipped %d',
            $dryRun ? '[dry-run] ' : '',
            $examined,
            $sent,
            $skipped
        ));

        return self::SUCCESS;
    }

    /**
     * Which nudge is due, or null when none is.
     *
     * Pure and separated from delivery so the module's one real business rule is testable
     * on its own.
     */
    private function stageFor(User $user): ?int
    {
        $connectedAt = Carbon::parse($user->stripe_connected_at ?: $user->created_at);

        // ⚠️ diffInDays() is absolute. A `stripe_connected_at` in the future — clock skew or
        // bad data — would otherwise read as "connected 90 days ago" and fire the final
        // nudge immediately.
        if ($connectedAt->isFuture()) {
            return null;
        }

        $days = (int) $connectedAt->diffInDays(now());

        // Newest threshold first, so a creator past day 10 gets the second nudge rather than
        // the first. Anyone already past the last threshold when the feature shipped gets
        // exactly that one email — the backfill, without which this sends to nobody.
        foreach (array_reverse(CreatorSetupService::STAGES) as $stage) {
            if ($days >= $stage) {
                return $stage;
            }
        }

        return null;
    }

    /**
     * ⚠️ `$marketing = false` bypasses the consent gate entirely, so the preference has to
     * be honoured here or the unsubscribe link in the email is decorative — the creator
     * clicks it, the flag flips, and the next run emails them anyway.
     *
     * Bell and push are kept regardless: this is operational information about their own
     * account, and it is the same split the sold-out waitlist uses.
     *
     * @return array<int, string>
     */
    private function channelsFor(User $user): array
    {
        $channels = [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH];

        // Missing or null always means opted IN, as everywhere else on the platform.
        if ($user->creator_updates_enabled ?? true) {
            $channels[] = NotificationDispatcher::CHANNEL_EMAIL;
        }

        return $channels;
    }
}
