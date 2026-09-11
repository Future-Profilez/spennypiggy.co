<?php

namespace App\Console\Commands;

use App\Mail\ComeBackAndFinish;
use App\Models\EngagementNotification;
use App\Models\ProfileRejection;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\MarketingConsent;
use App\Support\ProfileAssets;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Invite a REJECTED creator back, naming why and what — every two months ×3, then yearly.
 *
 * 🚨 REASON-GATED, NEVER LOCK-GATED. `profile_status_lock = 0` is the DEFAULT as
 * well as "rejected" (280 creators sat there on 6 Sep 2026, 21 with a reason), so
 * a lock-gated audience mails 259 drafts "come back and fix it" about a rejection
 * that never happened. The audience is exactly: role 1, lock 0, a non-empty
 * `profile_reject_reason` — which `profiles:collapse-rejections` (admin) fills
 * for every per-asset rejection, with a labelled reason or the generic sentence.
 *
 * ⚠️ MARKETING-ADJACENT. Re-engaging a lapsed signup is a reactivation campaign by
 * the client's own brief, so `marketing_suppressions` (keyed on the EMAIL, survives
 * account deletion) is checked as well as the creator-updates switch. Suspended
 * and unverified accounts are never mailed.
 *
 * ⚠️ Needs `queue:work`. Fan-out goes through NotificationDispatcher.
 */
class NudgeRejectedProfiles extends Command
{
    protected $signature = 'profiles:nudge-rejected
        {--max= : Maximum creators to remind in this run (default: config)}
        {--dry-run : Report what would be sent without sending or claiming}';

    protected $description = 'Re-engage creators whose profile was rejected — two-monthly ×3, then yearly';

    /** The dedup ledger type. One row per (creator, attempt number), forever. */
    public const TYPE = 'profile_rejected_nudge';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $enabled = (bool) config('profile_rejection.nudge_enabled', true);
        $max = max(1, (int) ($this->option('max') ?: config('profile_rejection.nudge_max_per_run', 50)));
        $stagger = max(0, (int) config('profile_rejection.nudge_stagger_seconds', 2));
        $firstAfter = max(1, (int) config('profile_rejection.nudge_first_after_days', 60));

        if (! $enabled && ! $dryRun) {
            $this->warn('profile_rejection.nudge_enabled is false — reporting only, nothing will be sent or claimed.');
        }

        $sent = 0;
        $skipped = 0;
        $examined = 0;

        $query = User::query()
            ->where('role', 1)
            ->where('profile_status_lock', 0)
            ->whereNotNull('profile_reject_reason')
            ->whereRaw("TRIM(profile_reject_reason) <> ''")
            ->whereNull('deleted_at')
            ->orderBy('id');

        foreach ($query->cursor() as $user) {
            if ($sent >= $max) {
                break;
            }

            $examined++;

            if (! $this->reachable($user)) {
                $skipped++;

                continue;
            }

            $attempts = $this->attemptsFor($user->id);

            if (! $this->isDue($user, $attempts, $firstAfter)) {
                $skipped++;

                continue;
            }

            $reason = ProfileRejection::latestReasonFor($user) ?? (string) $user->profile_reject_reason;
            $missing = ProfileAssets::missing($user);

            if ($dryRun || ! $enabled) {
                $sent++;
                $this->info(sprintf(
                    '[report] Creator #%d (%s) rejected: "%s" — would send reminder %d.',
                    $user->id,
                    $user->email,
                    mb_strimwidth($reason, 0, 60, '…'),
                    $attempts + 1
                ));

                continue;
            }

            if (! NotificationDispatcher::claim($user->id, self::TYPE, (string) ($attempts + 1))) {
                $skipped++;

                continue;
            }

            try {
                NotificationDispatcher::queue(
                    $user,
                    self::TYPE,
                    $this->payloadFor($user, $reason, $missing, $attempts + 1),
                    $this->channelsFor($user),
                    // Operational framing (their own account state), but the
                    // suppression check above is what keeps it honest as re-engagement.
                    false
                );

                $sent++;
                $this->info(sprintf('Reminded creator #%d (%s) — reminder %d.', $user->id, $user->email, $attempts + 1));

                if ($stagger > 0) {
                    sleep($stagger);
                }
            } catch (\Throwable $e) {
                // Claim deliberately NOT released — the ladder is measured in months.
                Log::error('profiles:nudge-rejected — failed to queue reminder', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $skipped++;
            }
        }

        $this->info(sprintf(
            '%sExamined %d rejected profiles · reminded %d · skipped %d',
            $dryRun || ! $enabled ? '[report] ' : '',
            $examined,
            $sent,
            $skipped
        ));

        return self::SUCCESS;
    }

    private function reachable(User $user): bool
    {
        return $user->email
            && $user->email_verified_at
            && (int) ($user->suspended_account ?? 0) !== 1
            && (int) ($user->notification_send ?? 1) !== 0
            && ! MarketingConsent::isSuppressed($user->email);
    }

    private function attemptsFor(int $userId): int
    {
        return EngagementNotification::where('user_id', $userId)
            ->where('type', self::TYPE)
            ->count();
    }

    /**
     * First send: the rejection must be at least `nudge_first_after_days` old — a
     * creator told no this morning is not lapsed. Later sends: the ladder.
     */
    private function isDue(User $user, int $attempts, int $firstAfter): bool
    {
        if ($attempts === 0) {
            $rejectedAt = $this->rejectedAt($user);

            return $rejectedAt === null || $rejectedAt->lte(now()->subDays($firstAfter));
        }

        $lastSentAt = EngagementNotification::where('user_id', $user->id)
            ->where('type', self::TYPE)
            ->max('sent_at');

        if (! $lastSentAt) {
            return true;
        }

        return Carbon::parse($lastSentAt)->lte(now()->subDays($this->waitDaysAfter($attempts)));
    }

    /** When the current rejection was recorded — history row first, `updated_at` as the fallback. */
    private function rejectedAt(User $user): ?Carbon
    {
        try {
            $at = ProfileRejection::query()->where('user_id', $user->id)->max('created_at');

            if ($at) {
                return Carbon::parse($at);
            }
        } catch (\Throwable) {
            // Table not there yet on this deploy — fall back.
        }

        return $user->updated_at ? Carbon::parse($user->updated_at) : null;
    }

    public function waitDaysAfter(int $attempts): int
    {
        foreach ((array) config('profile_rejection.nudge_ladder', []) as $rung) {
            $ceiling = $rung['after_sends'] ?? null;

            if ($ceiling === null || $attempts < (int) $ceiling) {
                return max(1, (int) ($rung['wait_days'] ?? 365));
            }
        }

        return 365;
    }

    /**
     * @param  array<int, string>  $missing
     * @return array<string, mixed>
     */
    public function payloadFor(User $user, string $reason, array $missing, int $attempt): array
    {
        return [
            'title' => ComeBackAndFinish::subjectLine($attempt),
            'body' => 'Your profile was not approved: '.mb_strimwidth($reason, 0, 120, '…')
                .' Fix it and submit again — nothing was deleted.',
            'url' => '/'.($user->username ?? ''),
            'module' => 'profile',
            'mailable' => ComeBackAndFinish::class,
            'mailable_args' => [
                'userId' => $user->id,
                'creatorName' => $user->name ?: ($user->username ?? 'Creator'),
                'rejectReason' => $reason,
                'missing' => $missing,
                'attempt' => $attempt,
            ],
        ];
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
