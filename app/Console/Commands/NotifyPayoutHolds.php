<?php

namespace App\Console\Commands;

use App\Mail\CreatorAccountNotice;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\RiskMessages;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Tells a creator their payout has been held, and why.
 *
 * 🚨 Nothing told them before this. An admin pauses a creator's payouts —
 * `users.payout_paused_at` plus a written `payout_pause_reason` — and the
 * creator's only signal was the money not arriving on Friday. The 9 Aug
 * messaging brief calls an unexplained held payout "the single scariest
 * message a creator can receive"; not sending one at all is worse than
 * sending a vague one.
 *
 * ⚠️ A SWEEP, NOT A MODEL EVENT. `payout_paused_at` is written by the ADMIN
 * app, which shares this database but none of this code — an observer
 * registered here would sit there firing on nothing, and the feature would
 * silently never work. This is the same lesson the sold-out waitlist already
 * learned; do not "improve" it into an observer.
 *
 * ⚠️ The RESUME is announced too. A creator who was told their money stopped
 * and never told it restarted keeps chasing support for something already
 * fixed.
 */
class NotifyPayoutHolds extends Command
{
    protected $signature = 'payouts:notify-holds
                            {--max=200 : Cap on creators notified in one run}
                            {--dry-run : Report without sending}';

    protected $description = 'Tell creators when their payout is held, and when it is released again';

    /**
     * Claim namespace. The key carries the pause timestamp, so a creator paused
     * again later is legitimately told again, while a creator paused once is
     * told once however often this runs.
     */
    public const TYPE_HELD = 'payout_hold';

    public const TYPE_RELEASED = 'payout_hold_released';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $held = 0;
        $released = 0;

        // --- Currently held ------------------------------------------------
        User::query()
            ->whereNotNull('payout_paused_at')
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->orderBy('id')
            ->chunkById(100, function ($creators) use (&$held, $max, $dryRun) {
                foreach ($creators as $creator) {
                    if ($held >= $max) {
                        return false;
                    }

                    // The claim is keyed on WHEN it was paused, so this is sent
                    // once per hold rather than once per creator ever.
                    $key = 'held:'.$creator->payout_paused_at;

                    if ($dryRun) {
                        $this->line("would notify hold: {$creator->username}");
                        $held++;

                        continue;
                    }

                    if (! NotificationDispatcher::claim($creator->id, self::TYPE_HELD, $key)) {
                        continue;
                    }

                    if ($this->sendHeld($creator)) {
                        $held++;
                    }
                }

                return true;
            });

        // --- Released again -------------------------------------------------
        // Only creators who were actually TOLD about a hold are told about its
        // release; otherwise the first thing a creator ever hears about their
        // payouts is that a problem they never knew about is over.
        User::query()
            ->whereNull('payout_paused_at')
            ->where('role', 1)
            ->whereIn('id', function ($q) {
                $q->select('user_id')
                    ->from('engagement_notifications')
                    ->where('type', self::TYPE_HELD);
            })
            ->orderBy('id')
            ->chunkById(100, function ($creators) use (&$released, $max, $dryRun) {
                foreach ($creators as $creator) {
                    if ($released >= $max) {
                        return false;
                    }

                    $lastHold = \DB::table('engagement_notifications')
                        ->where('user_id', $creator->id)
                        ->where('type', self::TYPE_HELD)
                        ->orderByDesc('id')
                        ->value('dedup_key');

                    if (! $lastHold) {
                        continue;
                    }

                    if ($dryRun) {
                        $this->line("would notify release: {$creator->username}");
                        $released++;

                        continue;
                    }

                    if (! NotificationDispatcher::claim($creator->id, self::TYPE_RELEASED, $lastHold)) {
                        continue;
                    }

                    if ($this->sendReleased($creator)) {
                        $released++;
                    }
                }

                return true;
            });

        $this->info("Payout holds — notified: {$held}, releases: {$released}".($dryRun ? ' (dry run)' : ''));

        return self::SUCCESS;
    }

    protected function sendHeld(User $creator): bool
    {
        try {
            // ⚠️ The reason is required by the message. An admin pausing a
            // payout is asked for one, but a legacy row may not carry it — and
            // a blank line reading "Reason:" is exactly the unexplained hold
            // this exists to prevent, so it falls back to something honest and
            // actionable rather than to nothing.
            $reason = trim((string) ($creator->payout_pause_reason ?? ''));
            if ($reason === '') {
                $reason = 'We need to check something on your account before this goes out. Our team will be in touch, and the chat is the fastest way to reach us.';
            }

            $ui = RiskMessages::get('CREATOR_PAYOUT_HELD', RiskMessages::AUDIENCE_CREATOR, [
                'reason' => $reason,
            ]);

            // $marketing = false: there is no version of "your money is not
            // going out this week" a creator may opt out of.
            NotificationDispatcher::queue(
                $creator,
                self::TYPE_HELD,
                [
                    'title' => $ui['title'],
                    'body' => $ui['next_step'],
                    'mailable' => CreatorAccountNotice::class,
                    // ⚠️ `mailable_args`, not `args` — the dispatcher spreads
                    // this key as NAMED arguments. A wrong key means the mailable
                    // is built with none at all, which is fatal for a required
                    // promoted property.
                    'mailable_args' => ['ui' => $ui, 'firstName' => $this->firstNameOf($creator)],
                ],
                NotificationDispatcher::ALL_CHANNELS,
                false
            );

            return true;
        } catch (\Throwable $e) {
            // Release the claim, or this creator is marked told and never is.
            $this->releaseClaim($creator->id, self::TYPE_HELD, 'held:'.$creator->payout_paused_at);
            Log::warning('Payout hold notice failed', ['user_id' => $creator->id, 'error' => $e->getMessage()]);

            return false;
        }
    }

    protected function sendReleased(User $creator): bool
    {
        try {
            NotificationDispatcher::queue(
                $creator,
                self::TYPE_RELEASED,
                [
                    'title' => 'Your payouts are running again 🐷',
                    'body' => 'Whatever was holding things up is sorted. Your next payout goes out on the usual weekly run.',
                ],
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                false
            );

            return true;
        } catch (\Throwable $e) {
            Log::warning('Payout release notice failed', ['user_id' => $creator->id, 'error' => $e->getMessage()]);

            return false;
        }
    }

    protected function releaseClaim(int $userId, string $type, string $key): void
    {
        try {
            \DB::table('engagement_notifications')
                ->where('user_id', $userId)
                ->where('type', $type)
                ->where('dedup_key', $key)
                ->delete();
        } catch (\Throwable $e) {
            // Nothing useful to do — the next run simply will not retry.
        }
    }

    protected function firstNameOf(User $creator): ?string
    {
        $name = trim((string) ($creator->name ?? ''));

        return $name === '' ? null : explode(' ', $name)[0];
    }
}
