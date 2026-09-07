<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which of a creator's social handles they have chosen to show on their public profile.
 *
 * 🚨 A HANDLE IS COLLECTED TO VERIFY A PERSON, NOT TO PUBLISH THEM. Until now an
 * approved handle appeared on the public profile automatically, with no way to take it
 * off — reported by a creator on 6 Sep 2026 who asked for her socials to be deleted
 * because she did not want her Spenny Piggy page linked to her personal accounts.
 * Deleting them is not available: `SocialLinksController::saveSocialLinks` refuses a row
 * with no handle, `ProfileController::missingForReview` requires one before review, and
 * `CreatorReviewService::whereProfileComplete` (admin) drops a creator with none out of
 * the review queue and the verified badge entirely. So the handle stays on file and the
 * PUBLISHING becomes the creator's decision.
 *
 * 🚨 NULL MEANS NOTHING IS PUBLIC, AND THAT IS THE POINT — every row that already
 * exists reads as hidden the moment this deploys, with no backfill and nothing for a
 * creator to do. A default of "show everything" would have been the old behaviour under
 * a new name, and consent to be published is given, never assumed (the same rule
 * `marketing_emails_enabled` had to be corrected for on 23 Aug 2026).
 *
 * Shape: a JSON array of platform keys, e.g. `["instagram"]`. A KEY LIST, not a map of
 * booleans — "absent" and "false" would otherwise be two spellings of hidden, and the
 * retired platform columns (facebook, youtube, …) would each need an entry they will
 * never use. `App\Support\SocialVisibility` is the only thing that reads or writes it.
 *
 * ⚠️ Guarded both ways — the shared database is written by both apps and this table
 * predates every migration in either repo.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('social_links') || Schema::hasColumn('social_links', 'public_platforms')) {
            return;
        }

        Schema::table('social_links', function (Blueprint $table) {
            $table->json('public_platforms')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('social_links') || ! Schema::hasColumn('social_links', 'public_platforms')) {
            return;
        }

        Schema::table('social_links', function (Blueprint $table) {
            $table->dropColumn('public_platforms');
        });
    }
};
