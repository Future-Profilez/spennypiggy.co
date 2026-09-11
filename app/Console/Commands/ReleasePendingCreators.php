<?php

namespace App\Console\Commands;

use App\Mail\ProfileApprovalStatusMail;
use App\Models\AuditLog;
use App\Models\SocialLinks;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\UserProfileService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

/**
 * Release creators stuck in pending or legacy rejection states — §21 / D6.
 *
 * 🚨 DRY-RUN BY DEFAULT.
 *
 * Tiers:
 *  - Tier 1 (Safe to release): No reason recorded, submitted and never decided (lock = 1),
 *    asset quality / social handle flag.
 *  - Tier 2 (Hold for client approval): Written policy judgement (e.g. "not a legitimate creator").
 *    Released when --include-tier2 is specified.
 *  - Tier 3 (NEVER RELEASE): Suspended accounts or accounts flagged for fraud/compliance
 *    (suspended_account = 1).
 */
class ReleasePendingCreators extends Command
{
    protected $signature = 'creators:release-pending
        {--apply : Apply changes to the database (dry-run by default)}
        {--include-tier2 : Include Tier 2 creators carrying written policy reasons}
        {--user= : Target a specific creator by ID, username, or UUID}
        {--limit= : Limit the number of creators to release in this run}
        {--no-mail : Suppress the profile approval email}';

    protected $description = 'Release eligible stuck or rejected creators to active (lock = 2) with automated safeguards';

    public function handle(UserProfileService $profiles, CreatorJourneyService $journey): int
    {
        $apply = (bool) $this->option('apply');
        $includeTier2 = (bool) $this->option('include-tier2');
        $noMail = (bool) $this->option('no-mail');
        $limit = $this->option('limit') ? max(1, (int) $this->option('limit')) : null;

        $this->info($apply ? '🚀 RUNNING CREATOR RELEASE (APPLY MODE)' : '🔍 RUNNING CREATOR RELEASE (DRY RUN)');

        // 1. Build candidate query: role 1, lock != 2, not deleted
        $query = User::query()
            ->where('role', 1)
            ->where('profile_status_lock', '!=', 2)
            ->whereNull('deleted_at')
            ->orderBy('id');

        if ($this->option('user')) {
            $identifier = $this->option('user');
            $query->where(function ($q) use ($identifier) {
                $q->where('id', $identifier)
                    ->orWhere('username', $identifier)
                    ->orWhere('uuid', $identifier);
            });
        }

        $allCandidates = $query->get();

        $tier1 = collect();
        $tier2 = collect();
        $tier3 = collect();

        foreach ($allCandidates as $candidate) {
            // Tier 3: Suspended / Fraud — hard blocker, never release
            if ((int) ($candidate->suspended_account ?? 0) === 1) {
                $tier3->push($candidate);

                continue;
            }

            // Check reason for Tier 2 classification
            $reason = trim((string) ($candidate->profile_reject_reason ?? ''));
            if ($reason !== '' && $this->isPolicyJudgement($reason)) {
                $tier2->push($candidate);
            } else {
                $tier1->push($candidate);
            }
        }

        $this->table(
            ['Tier', 'Description', 'Count'],
            [
                ['Tier 1', 'Auto-eligible (no reason, handle/asset issue, or stuck lock 1)', $tier1->count()],
                ['Tier 2', 'Carrying written policy judgement', $tier2->count()],
                ['Tier 3', 'Suspended / Compliance / Fraud (Hard exclusion)', $tier3->count()],
            ]
        );

        $toRelease = collect();
        $toRelease = $toRelease->concat($tier1);

        if ($includeTier2) {
            $this->warn('ℹ️  Including Tier 2 creators as requested (--include-tier2).');
            $toRelease = $toRelease->concat($tier2);
        } else {
            $this->comment('ℹ️  Tier 2 creators held. Use --include-tier2 to release them after client confirmation.');
        }

        if ($limit !== null) {
            $toRelease = $toRelease->take($limit);
        }

        $this->newLine();
        $this->info(sprintf('Total creators scheduled for release: %d', $toRelease->count()));

        if ($toRelease->isEmpty()) {
            $this->info('No eligible creators found for release.');

            return self::SUCCESS;
        }

        $releasedCount = 0;
        $mailsQueued = 0;

        foreach ($toRelease as $user) {
            $reasonText = $user->profile_reject_reason ? mb_strimwidth($user->profile_reject_reason, 0, 40, '…') : 'None';
            $this->line(sprintf(
                '  %s @%s (#%d) - Reason: %s',
                $apply ? '✓ Releasing' : '• Would release',
                $user->username ?? 'unnamed',
                $user->id,
                $reasonText
            ));

            if ($apply) {
                DB::transaction(function () use ($user, $profiles, $journey) {
                    // 1. Update user record
                    $update = [
                        'profile_status_lock' => 2,
                        'profile_reject_reason' => null,
                        'moderation_reason' => null,
                        'moderation_asset' => null,
                    ];

                    if (filled($user->avatar)) {
                        $update['avatar_approved'] = 1;
                    }
                    if (filled($user->bio)) {
                        $update['bio_approved'] = 1;
                        $update['edit_bio_reason'] = null;
                    }
                    if (filled($user->cover)) {
                        $update['cover_approved'] = 1;
                    }

                    DB::table('users')->where('id', $user->id)->update($update);

                    // 2. Approve social links if present
                    SocialLinks::where('user_id', $user->id)
                        ->whereNull('deleted_at')
                        ->update(['status' => SocialLinks::STATUS_APPROVED, 'reason' => null]);

                    // 3. Clear caches
                    if ($user->username) {
                        $profiles->clearUserCaches($user->username, $user->id);
                    }

                    // 4. Record audit log
                    if (Schema::hasTable('audit_logs')) {
                        try {
                            AuditLog::create([
                                'user_id' => $user->id,
                                'action_type' => 'USER_PROFILE_REVIEWED',
                                'entity_type' => 'user_profile',
                                'entity_id' => (string) ($user->uuid ?? $user->id),
                                'reference_id' => (string) ($user->uuid ?? $user->id),
                                'reason_code' => 'BATCH_RELEASE_D6',
                                'new_values' => ['profile_status_lock' => 2],
                            ]);
                        } catch (\Throwable $e) {
                            Log::warning('Release audit log creation failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                        }
                    }

                    // 5. Journey sync
                    try {
                        $journey->syncStep($user->fresh());
                    } catch (\Throwable $e) {
                        Log::warning('Journey sync failed on release', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                    }
                });

                // 6. Queue profile approval email
                if (! $noMail && $user->email && (int) ($user->notification_send ?? 1) !== 0) {
                    try {
                        Mail::to($user->email)->queue(new ProfileApprovalStatusMail($user->fresh(), true));
                        $mailsQueued++;
                    } catch (\Throwable $e) {
                        Log::error('Release email failed to queue', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                    }
                }

                $releasedCount++;
            }
        }

        $this->newLine();
        if ($apply) {
            $this->info(sprintf('🎉 Successfully released %d creator(s). Queued %d approval email(s).', $releasedCount, $mailsQueued));
        } else {
            $this->comment('Dry run complete. No database changes were made. Run with --apply to execute.');
        }

        return self::SUCCESS;
    }

    /**
     * Identify whether a reason represents a written policy judgement.
     */
    private function isPolicyJudgement(string $reason): bool
    {
        $normalized = strtolower($reason);
        $policyKeywords = [
            'not a legitimate',
            'legitimate creator',
            'impersonat',
            'fraud',
            'scam',
            'compliance',
            'terms',
            'identity',
            'fake',
            'policy',
            'unauthorized',
        ];

        foreach ($policyKeywords as $keyword) {
            if (str_contains($normalized, $keyword)) {
                return true;
            }
        }

        // Any custom written note longer than 20 characters that isn't just a generic placeholder
        return mb_strlen($reason) > 20 && ! str_starts_with($normalized, 'profile photo') && ! str_starts_with($normalized, 'social');
    }
}
