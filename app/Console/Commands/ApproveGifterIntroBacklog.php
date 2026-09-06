<?php

namespace App\Console\Commands;

use App\Models\UserIntro;
use Illuminate\Console\Command;

/**
 * Settle the gifter intros that were uploaded before they stopped being
 * reviewed.
 *
 * 🚨 THE SCREEN WOULD OTHERWISE LIE. From 6 Sep 2026 a gifter's intro is saved
 * approved and the admin console says so — but every gifter row already in the
 * table still reads `approved = 0`, so the list would show "Auto-approved" over
 * a row whose data says pending, and the two would disagree for ever.
 *
 * ⚠️ DRY RUN BY DEFAULT. It only ever moves `approved` 0 → 1, and only for
 * role 0, so a re-run is free.
 *
 * ⚠️ A REJECTED gifter intro (`approved = 2`) is left alone. An admin said no
 * to that video; a backfill must never overturn a decision a person took.
 */
class ApproveGifterIntroBacklog extends Command
{
    protected $signature = 'intros:approve-gifter-backlog {--apply : Write the change (otherwise it only reports)} {--max=5000 : Safety ceiling on rows touched in one run}';

    protected $description = 'Approve the pending intro videos belonging to gifters, who are no longer reviewed';

    public function handle(): int
    {
        $max = max(1, (int) $this->option('max'));

        $query = UserIntro::query()
            ->where('approved', 0)
            ->whereHas('user', fn ($q) => $q->where('role', 0));

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No pending gifter intros — nothing to do.');

            return self::SUCCESS;
        }

        if (! $this->option('apply')) {
            $this->info($total.' pending gifter intro(s) would be approved. Re-run with --apply to write it.');

            return self::SUCCESS;
        }

        /*
         * ⚠️ Through the query builder, so `updated_at` is left alone. An
         * intro's timestamp is what the admin list sorts and ages on, and a
         * backfill must not re-date every gifter's video to today.
         */
        $ids = (clone $query)->limit($max)->pluck('id');

        $changed = UserIntro::whereIn('id', $ids)->toBase()->update(['approved' => 1]);

        $this->info('Approved '.$changed.' gifter intro(s).'.(
            $total > $changed ? ' '.($total - $changed).' left — run again.' : ''
        ));

        return self::SUCCESS;
    }
}
