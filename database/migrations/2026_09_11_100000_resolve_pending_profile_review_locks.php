<?php

use App\Models\SocialLinks;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Empty out `profile_status_lock = 1` for good.
 *
 * 🚨 THE VALUE 1 NO LONGER EXISTS (11 Sep 2026). It meant "the creator pressed Submit
 * and is waiting for an admin", and there is no Submit any more — profiles approve
 * themselves as each asset is saved (`App\Support\ProfileAutoApproval`). Leaving the
 * rows behind would leave every reader of that value alive too: the admin queue, the
 * blocked-submission nudge, the "being verified" banner, `ReviewSubmission`. All of
 * that is deleted in the same change, so the rows have to go with it or those creators
 * are stranded in a state nothing renders and nothing resolves.
 *
 * Each row is resolved on its own merits, never swept to one value:
 *   · every asset approved  → 2 (live). They did the work and were waiting on us.
 *   · anything outstanding  → 0 (drafting). Their next save re-judges it and takes
 *                                 them live on its own.
 *
 * ⚠️ NOBODY IS APPROVED WHO WAS NOT ALREADY CLEARED. Going to 2 requires all three
 * approval flags to be 1 — set by an admin, or by the scan. This migration judges
 * nothing itself; it only stops holding people at a door that has been removed.
 *
 * ⚠️ Suspended accounts are left at 0 rather than published.
 *
 * ⚠️ Written with the query builder so `users.updated_at` is untouched — it keys the
 * public profile cache and orders the admin queue, and a data migration is not an edit
 * anybody made.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $approvedHandles = SocialLinks::query()
            ->whereNull('deleted_at')
            ->where('status', SocialLinks::STATUS_APPROVED)
            ->pluck('user_id')
            ->all();

        // → 2: everything cleared, and only ever for a creator nobody has suspended.
        DB::table('users')
            ->where('profile_status_lock', 1)
            ->where('role', 1)
            ->where(fn ($q) => $q->whereNull('suspended_account')->orWhere('suspended_account', 0))
            ->whereNotNull('avatar')->where('avatar_approved', 1)
            ->whereNotNull('bio')->where('bio_approved', 1)
            ->whereIn('id', $approvedHandles)
            ->update(['profile_status_lock' => 2, 'profile_reject_reason' => null]);

        // → 0: every CREATOR still carrying the lock. Their next save decides.
        //
        // 🚨 `role = 1` IS LOAD-BEARING (added 11 Sep 2026, before this ever ran on
        // production). `profile_status_lock = 1` is still a LIVE state for GIFTERS: it
        // is how a supporter who crosses £500 enters the billing-address check
        // (Helpers.php ~1490, RegisteredUserController::cardVerificationSuccess), and the
        // admin's `/users-address-verification/gifter` queue and its badge read exactly
        // that value. Unscoped, this statement emptied that queue — every gifter
        // mid-verification dropped to lock 0, blocked at checkout and invisible to the
        // only screen that could clear them, with no `down()`. Only the creator meaning
        // of lock 1 was deleted; the gifter meaning was never touched.
        DB::table('users')
            ->where('profile_status_lock', 1)
            ->where('role', 1)
            ->update(['profile_status_lock' => 0]);
    }

    /**
     * ⚠️ IRREVERSIBLE ON PURPOSE. Which rows were at 1 is not recoverable — 0 and 2 are
     * both legitimate destinations and neither records where it came from. Putting
     * everybody back to 1 would invent a submission for creators who never made one and
     * would delist creators who are live. Rolling this back means restoring a backup.
     */
    public function down(): void {}
};
