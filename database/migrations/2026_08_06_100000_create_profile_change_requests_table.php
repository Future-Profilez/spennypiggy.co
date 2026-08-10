<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An edit to a profile asset that is ALREADY LIVE to the public.
 *
 * Before this table there was one column per asset, overwritten in place. An
 * approved creator who uploaded a new photo destroyed the approved one — the old
 * uuid was gone from the database — and because the flag dropped to 0 the public
 * saw the generic placeholder rather than the photo an admin had cleared. There
 * was nothing to reject back to.
 *
 * Now the live column is never touched. The public keeps seeing the approved
 * version with NO change to any visibility logic, `profile_status_lock` stays 2,
 * and rejecting is a no-op on `users` rather than a restore of something deleted.
 *
 * ⚠️ A creator whose asset is NOT yet live keeps the old behaviour exactly —
 * writes straight to the column, no row here. There is nothing public to protect,
 * and a first review is not a diff.
 *
 * ⚠️ WEBSITE-OWNED. The website writes these rows (the creator saves, the
 * moderation job flags); the admin app reads and decides them. The admin app
 * carries a guarded declaration migration so its own test database has the table.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('profile_change_requests')) {
            return;
        }

        Schema::create('profile_change_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->unsignedBigInteger('user_id');

            // avatar | cover | bio | socials
            $table->string('asset', 16);

            // pending | approved | rejected | superseded
            $table->string('status', 12)->default('pending');

            // The new value, and a snapshot of what was live when it was submitted.
            //
            // JSON rather than typed columns because the shapes genuinely differ:
            // avatar and cover carry a PAIR (uuid + cdn modifier) that must travel
            // together, and socials is the whole thirteen-platform map INCLUDING
            // explicit nulls — `SocialLinksController` writes every column, so "I
            // removed my Instagram" is a change carried by a null. Typed columns
            // here would be a second copy of a schema that has already grown three
            // migrations of new platforms.
            $table->json('proposed');
            $table->json('previous')->nullable();

            // clean | flagged — written by CheckMediaModeration against THIS row.
            //
            // 🚨 The scan must not write to `users.moderation_reason` for a pending
            // change: CreatorReviewAdvisor reads that column and would recommend
            // rejecting the creator's currently-live, already-approved photo.
            $table->string('scan_state', 12)->nullable();
            $table->string('moderation_reason', 255)->nullable();
            $table->string('moderation_asset', 32)->nullable();

            // What the creator was told on rejection. Closed rows are never deleted
            // — they are the record of that, and the only place an old value lives.
            $table->text('reason')->nullable();

            $table->unsignedBigInteger('decided_by_admin_id')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            // 🚨 "<user_id>:<asset>" while pending, NULL once closed. This IS the
            // concurrency control, not a convenience column. MySQL has no partial
            // unique index, so "one open row per asset, any number of closed ones"
            // is only expressible as a unique index over a column that is set while
            // open and NULL once closed — NULLs in a unique index are distinct.
            //
            // Same rationale as `review_assignments.active_key`. A close MUST null
            // this, or that asset can never be changed again.
            $table->string('active_key', 64)->nullable();
            $table->unique('active_key', 'profile_change_requests_active_key_unique');

            $table->index(['status', 'asset'], 'profile_change_requests_status_asset_idx');
            $table->index(['user_id', 'status'], 'profile_change_requests_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_change_requests');
    }
};
