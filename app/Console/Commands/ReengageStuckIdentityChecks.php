<?php

namespace App\Console\Commands;

use App\Mail\IdentityCheckReengage;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\IdentityCheckState;
use App\Support\IdentityFailureReason;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Bring back the creators who reached the ID check and stopped — ONE mail each,
 * worded for why they stopped (client decision, 7 Sep 2026: "ak baar").
 *
 * The audience is the end of the funnel: approved profile, payouts connected,
 * identity not verified. Live on 7 Sep 2026 that was five creators — one who never
 * opened the check, one who opened it and closed it, two whose passport photo
 * Stripe could not read, and one flagged for fraud, who is deliberately NOT here.
 *
 * 🚨 ONE SEND PER CREATOR PER REASON, FOR EVER — the dedup key is the reason. A
 * creator who moves from "never opened" to "abandoned" may hear once more, because
 * that is a different sentence; the same reason twice is never sent. The daily
 * `creators:nudge-journey` already coaches the `identity` step on its own ladder,
 * so this is deliberately NOT scheduled: run it by hand, `--dry-run` first.
 *
 * 🚨 `fraud_suspected` (and `identity_status = 3`) IS EXCLUDED. Inviting that
 * creator to "try again" is wrong twice: it cannot succeed, and it is the case a
 * support ticket exists for (App\Support\CreatorHelpTicket).
 */
class ReengageStuckIdentityChecks extends Command
{
    protected $signature = 'identity:reengage-stuck
        {--max= : Maximum creators to mail in this run (default 50)}
        {--dry-run : Report the audience and the reason each would get, send nothing}';

    protected $description = 'One-off, reason-worded mail to approved creators whose ID check is not finished';

    public const TYPE = 'identity_reengage';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) ($this->option('max') ?: 50));

        $sent = 0;
        $skipped = 0;

        $query = User::query()
            ->where('role', 1)
            ->whereNull('deleted_at')
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 2)
            ->where('stripe_details_submitted', 1)
            ->where('identity_status', '!=', 1)
            ->orderBy('id');

        foreach ($query->cursor() as $user) {
            if ($sent >= $max) {
                break;
            }

            $reason = self::reasonFor($user);

            if ($reason === null || ! $user->email || ! $user->email_verified_at || (int) ($user->notification_send ?? 1) === 0) {
                $skipped++;
                $this->line(sprintf('[skip] #%d %s — %s', $user->id, $user->username, $reason === null ? 'excluded (fraud/unknown)' : 'unreachable'));

                continue;
            }

            if ($dryRun) {
                $sent++;
                $this->info(sprintf('[report] #%d %s — would send "%s"', $user->id, $user->username, $reason));

                continue;
            }

            if (! NotificationDispatcher::claim($user->id, self::TYPE, $reason)) {
                $skipped++;
                $this->line(sprintf('[already sent] #%d %s — %s', $user->id, $user->username, $reason));

                continue;
            }

            try {
                NotificationDispatcher::queue(
                    $user,
                    self::TYPE,
                    [
                        'title' => IdentityCheckReengage::subjectLine($reason),
                        'body' => IdentityCheckReengage::copyFor($reason)['lead'],
                        'url' => '/stripe/identity-verification',
                        'module' => 'profile',
                        'mailable' => IdentityCheckReengage::class,
                        'mailable_args' => [
                            'userId' => $user->id,
                            'creatorName' => $user->name ?: ($user->username ?? 'Creator'),
                            'reason' => $reason,
                        ],
                    ],
                    $this->channelsFor($user),
                    false // their own account state, not marketing
                );

                $sent++;
                $this->info(sprintf('Sent "%s" to #%d %s', $reason, $user->id, $user->username));
            } catch (\Throwable $e) {
                Log::error('identity:reengage-stuck — failed to queue', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                $skipped++;
            }
        }

        $this->info(sprintf('%s%d sent · %d skipped', $dryRun ? '[dry-run] ' : '', $sent, $skipped));

        return self::SUCCESS;
    }

    /**
     * Which of the four sentences this creator needs — or null for the one we never send.
     */
    public static function reasonFor(User $user): ?string
    {
        if ((int) $user->identity_status === 3) {
            return null;
        }

        $error = IdentityFailureReason::explain($user->identity_verification_error);
        $code = $error['code'] ?? null;

        if ($code === 'fraud_suspected' || $code === 'admin_rejected') {
            return null;
        }

        if ($code === 'consent_declined') {
            return 'consent_declined';
        }

        if ((int) $user->identity_status === 2 && IdentityCheckState::isUnfinished($user)) {
            return 'abandoned';
        }

        if ($code === null) {
            return 'never_opened';
        }

        if (in_array($code, ['abandoned', 'session_canceled'], true)) {
            return 'abandoned';
        }

        return 'document_failed';
    }

    /** @return array<int, string> */
    private function channelsFor(User $user): array
    {
        $channels = [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH];

        if ($user->creator_updates_enabled ?? true) {
            $channels[] = NotificationDispatcher::CHANNEL_EMAIL;
        }

        return $channels;
    }
}
