<?php

namespace App\Console\Commands;

use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\PayoutEligibility;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Tell a creator who has earned money that they cannot be paid until they verify.
 *
 * 🚨 THE PAYOUT PAGE ALREADY SAYS THIS EVERY TIME THEY OPEN IT. This command exists for
 * the creator who is not looking — somebody whose first sale settled while they were
 * away, whose money is now sitting in a balance they have never seen a screen about.
 * Without it, a creator can earn for months and only discover the gate when they go
 * hunting for a payment that never arrived.
 *
 * 🚨 ONLY EVER SENT TO A CREATOR WITH MONEY WAITING. Same rule as the panel: a creator
 * who has earned nothing is never asked to photograph a passport, because there is
 * nothing for it to unlock and asking reads as a demand rather than a prompt.
 *
 * ⚠️ Deliberately slow — 7, 30, 60, 90 days from their first settled earning. A sale on
 * Monday and a "verify your identity" mail on Tuesday reads as a chase.
 *
 * ⚠️ NEEDS `queue:work`. The dispatcher makes one synchronous HTTP call per channel.
 */
class RemindUnverifiedPayouts extends Command
{
    protected $signature = 'payouts:remind-unverified {--dry-run : Report and change nothing} {--max=200 : Per-run ceiling}';

    protected $description = 'Remind creators holding unpaid earnings that their identity check is what is stopping payment';

    /** One type, so the ladder can count its own rungs. */
    private const TYPE = 'payout_identity';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $enabled = (bool) config('payout_identity.reminders_enabled', true);
        $gateOn = (bool) config('payout_identity.enabled', true);

        if (! $gateOn) {
            $this->info('The identity payout gate is off, so nothing is being withheld. Nothing to remind about.');

            return self::SUCCESS;
        }

        $ladder = array_values((array) config('payout_identity.reminder_days', [7, 30, 60, 90]));

        if ($ladder === []) {
            $this->warn('No reminder ladder configured.');

            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;

        /*
         * ⚠️ The candidate set is "creator, not suspended, identity incomplete" — the
         * earnings test needs a per-creator query and is done inside the loop, on a
         * set that is already small. Filtering on earnings in SQL would mean either a
         * join that cannot express `PayoutEligibility` or a second definition of it.
         */
        $candidates = User::query()
            ->where('role', 1)
            ->where(function ($q) {
                $q->whereNull('suspended_account')->orWhere('suspended_account', 0);
            })
            ->whereNull('deleted_at')
            ->whereNotNull('email_verified_at')
            ->cursor();

        foreach ($candidates as $creator) {
            if ($sent >= (int) $this->option('max')) {
                break;
            }

            if (! PayoutEligibility::blocksPayout($creator)) {
                continue;
            }

            $firstEarnedAt = $this->firstSettledEarningAt($creator);

            // 🚨 No earnings, no reminder. The whole point of the rule.
            if (! $firstEarnedAt) {
                continue;
            }

            $attempts = $this->attemptsFor($creator->id);
            $waitDays = $ladder[min($attempts, count($ladder) - 1)];

            /*
             * ⚠️ The FIRST rung is measured from the first earning; every later one from
             * the last reminder. Measuring them all from the first earning would fire
             * three of them at once for a creator whose money has been sitting a while.
             */
            $since = $attempts === 0
                ? $firstEarnedAt
                : $this->lastSentAt($creator->id);

            if (! $since || Carbon::parse($since)->gt(now()->subDays($waitDays))) {
                continue;
            }

            // 🚨 The ladder ENDS. Unlike the review nudge, this one is asking for a
            // document, and a creator who has ignored four requests over three months
            // has decided. The payout page keeps telling them for ever; the mail stops.
            if ($attempts >= count($ladder)) {
                continue;
            }

            if ($dryRun || ! $enabled) {
                $sent++;
                $this->info(sprintf(
                    '[report] Creator #%d (%s) — %s, earning since %s — would send reminder %d.',
                    $creator->id,
                    $creator->email,
                    PayoutEligibility::reasonFor($creator),
                    Carbon::parse($firstEarnedAt)->toDateString(),
                    $attempts + 1
                ));

                continue;
            }

            // The claim IS the insert (unique on user+type+key), so two workers racing
            // cannot both send, and the row is what the ladder counts next time.
            if (! NotificationDispatcher::claim($creator->id, self::TYPE, (string) ($attempts + 1))) {
                $skipped++;

                continue;
            }

            try {
                $state = PayoutEligibility::stateFor($creator);
                $copy = PayoutEligibility::copyFor($state);

                NotificationDispatcher::queue(
                    $creator,
                    self::TYPE,
                    [
                        'title' => $copy['title'],
                        'body' => $copy['body'],
                        'url' => route('creator.financial.index'),
                        'module' => 'payouts',
                    ],
                    NotificationDispatcher::ALL_CHANNELS,
                    /*
                     * 🚨 NOT MARKETING. It is money the creator has already earned and
                     * cannot receive; a marketing opt-out must not silence it.
                     */
                    false
                );

                $sent++;
            } catch (\Throwable $e) {
                /*
                 * ⚠️ The claim is NOT released. The ladder is measured in weeks, so
                 * losing one reminder costs a rung; a released claim on a persistently
                 * failing address is retried on every run for ever.
                 */
                Log::error('payouts:remind-unverified — send failed', [
                    'user_id' => $creator->id,
                    'attempt' => $attempts + 1,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info(sprintf('%s: %d, skipped: %d.', $dryRun || ! $enabled ? 'Would send' : 'Sent', $sent, $skipped));

        return self::SUCCESS;
    }

    /**
     * When their first settled income landed.
     *
     * ⚠️ `completed` only. Money still in escrow or still processing is not earnings a
     * creator can be paid, so a reminder about it would be premature.
     */
    private function firstSettledEarningAt(User $creator): ?string
    {
        $row = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->min('transaction_date');

        return $row ? (string) $row : null;
    }

    private function attemptsFor(int $userId): int
    {
        return EngagementNotification::where('user_id', $userId)
            ->where('type', self::TYPE)
            ->count();
    }

    private function lastSentAt(int $userId): ?string
    {
        $at = EngagementNotification::where('user_id', $userId)
            ->where('type', self::TYPE)
            ->max('sent_at');

        return $at ? (string) $at : null;
    }
}
