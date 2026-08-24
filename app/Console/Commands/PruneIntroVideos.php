<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserIntro;
use App\Uploadcare;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Free the Uploadcare objects behind intro videos nothing references any more.
 *
 * 🚨 Rejecting or removing an intro only SOFT-DELETES the row — the video file
 * itself has never been deleted from Uploadcare by anything in either app. The
 * delete calls were written and then commented out (`UserIntro.php`), so every
 * rejected and every creator-removed intro has been accumulating on the CDN
 * since launch, billable and unreachable. Measured when this shipped: 16
 * soft-deleted rows plus 1 whose owner account no longer exists.
 *
 * ⚠️ DRY RUN BY DEFAULT. Deleting a CDN object is irreversible — Uploadcare has
 * no undo and we keep no copy — so the command reports until it is given
 * `--force`, the same shape as `identity:prune`.
 *
 * 🚨 It NEVER touches a live intro. The default target is only what is already
 * invisible to everyone: a soft-deleted row, or a row whose owner is gone. An
 * intro belonging to a creator who is simply not approved YET is deliberately
 * left alone — they may still be approved tomorrow, and deleting it would take
 * away work the creator has already done.
 */
class PruneIntroVideos extends Command
{
    protected $signature = 'intros:prune
                            {--force : Actually delete. Without this the command only reports}
                            {--role= : Limit to one kind of owner — creator or gifter}
                            {--keep-rows : Free the CDN object but leave the database row as history}
                            {--details : List every row considered, kept and removed}';

    protected $description = 'Delete Uploadcare intro videos that no screen references any more (soft-deleted or owner-less)';

    /**
     * ⚠️ Anything that is not a bare uuid is not ours to delete — the same
     * guard `identity:prune` uses. A malformed value must never be handed to
     * the delete API on the chance it resolves to somebody else's object.
     */
    private const CDN_UUID = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $keepRows = (bool) $this->option('keep-rows');
        $role = $this->option('role');

        if ($role !== null && ! in_array($role, ['creator', 'gifter'], true)) {
            $this->error('--role must be creator or gifter.');

            return self::FAILURE;
        }

        $rows = UserIntro::withTrashed()->with('user')->get();

        $targets = [];
        $kept = 0;

        foreach ($rows as $intro) {
            $reason = $this->reasonToPrune($intro);

            if ($reason === null) {
                $kept++;

                if ($this->option('details')) {
                    $this->line("  keep    #{$intro->id} ".$this->owner($intro));
                }

                continue;
            }

            // ⚠️ Role scoping reads the OWNER. An orphan has none, so it is only
            // ever in the unscoped run — there is nothing to match it against.
            if ($role !== null) {
                $owner = $intro->user;
                $wanted = $role === 'creator' ? 1 : 0;

                if (! $owner || (int) $owner->role !== $wanted) {
                    $kept++;

                    continue;
                }
            }

            $targets[] = [$intro, $reason];
        }

        $this->info('Intro videos: '.$rows->count().' total, '.count($targets).' prunable, '.$kept.' kept.');

        if ($this->option('details')) {
            foreach ($targets as [$intro, $reason]) {
                $this->line("  prune   #{$intro->id} ".$this->owner($intro)." — {$reason}");
            }
        }

        if (! $targets) {
            return self::SUCCESS;
        }

        if (! $force) {
            $this->warn('Dry run — nothing was deleted. Re-run with --force to delete these from Uploadcare'.($keepRows ? '.' : ' and remove their rows.'));

            return self::SUCCESS;
        }

        $removed = 0;
        $failed = 0;

        foreach ($targets as [$intro, $reason]) {
            $uuid = (string) $intro->uuid;

            if ($uuid !== '' && preg_match(self::CDN_UUID, $uuid) === 1) {
                try {
                    Uploadcare::getApiObj()->file()->deleteFile($uuid);
                } catch (\Throwable $e) {
                    // Already gone is success: the object is not billable or
                    // reachable any more, which is the whole point.
                    if (! str_contains(strtolower($e->getMessage()), 'not found')) {
                        $failed++;

                        // ⚠️ The row is KEPT on failure so the next run retries
                        // it. Dropping it here would strand the object forever
                        // with nothing left pointing at it.
                        Log::warning('[intros:prune] Could not delete an intro video from the CDN; keeping the row so the next run retries it.', [
                            'user_intro_id' => $intro->id,
                            'error' => $e->getMessage(),
                        ]);

                        continue;
                    }
                }
            }

            if (! $keepRows) {
                $intro->forceDelete();
            }

            $removed++;
        }

        $this->info("Deleted {$removed} intro video(s) from Uploadcare".($keepRows ? ' (rows kept).' : ' and removed their rows.'));

        if ($failed) {
            $this->warn("{$failed} could not be deleted and were left for the next run — see the log.");
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Why this intro is safe to prune, or null when it must be left alone.
     *
     * 🚨 The whole safety of the command is this method. Only two states mean
     * "nothing references this any more":
     *   - the row is soft-deleted (an admin rejected it, or the creator removed
     *     it) — no screen in either app reads a trashed row;
     *   - the owner no longer exists.
     *
     * ⚠️ An intro on an unapproved profile is NOT prunable. That creator may be
     * approved tomorrow and the video is work they have already done.
     */
    private function reasonToPrune(UserIntro $intro): ?string
    {
        if ($intro->trashed()) {
            return 'removed or rejected';
        }

        if (! $intro->user instanceof User) {
            return 'owner no longer exists';
        }

        return null;
    }

    private function owner(UserIntro $intro): string
    {
        $user = $intro->user;

        if (! $user) {
            return 'owner gone';
        }

        return '@'.($user->username ?? $user->id).' ('.((int) $user->role === 0 ? 'gifter' : 'creator').')';
    }
}
