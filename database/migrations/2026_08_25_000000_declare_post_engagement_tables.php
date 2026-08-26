<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 🚨 `post_likes`, `post_comments` AND `post_comment_replies` EXIST ONLY ON LIVE
 * DATABASES — NO MIGRATION EVER CREATED THEM.
 *
 * Found by the schema-drift audit of 24 Aug 2026 (`docs/guides/SCHEMA_DRIFT_AUDIT.md`:
 * 26 tables and 56 columns that a build from this repo does not produce) and then
 * hit for real the next day: a test that puts ANY post on a creator's profile 500s
 * with `no such table: post_likes`, because `UserProfileService`'s posts query
 * counts likes as a subquery on every row.
 *
 * That is why the profile feed — the most-viewed authenticated surface in the
 * product — has almost no feature coverage. It is not that nobody wrote the tests;
 * they could not run. Same class as `shops` (17 columns), `wish_items` (2) and
 * `memberships` (12), and the same fix.
 *
 * ⚠️ GUARDED AND ADDITIVE, so it is a no-op on every environment that already has
 * these tables — which is all of them. Nothing here may redefine or drop anything.
 *
 * ⚠️ `down()` IS DELIBERATELY EMPTY. Dropping these would destroy real engagement
 * data on a production table this migration did not create.
 *
 * ⚠️ Types are transcribed from `SHOW COLUMNS` on the live database, never guessed —
 * a type that disagrees with production passes the test suite and fails on deploy.
 * Note `post_comments.status` defaults to 2 and `is_approved` to 0; those are the
 * live defaults, not tidier ones.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('post_likes')) {
            Schema::create('post_likes', function (Blueprint $table) {
                $table->id();
                $table->char('uuid', 36);
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('post_id')->index();
                $table->tinyInteger('status')->default(0);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('post_comments')) {
            Schema::create('post_comments', function (Blueprint $table) {
                $table->id();
                $table->char('uuid', 36);
                $table->unsignedBigInteger('post_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('comment');
                $table->tinyInteger('status')->default(2);
                $table->boolean('is_approved')->default(false);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('post_comment_replies')) {
            Schema::create('post_comment_replies', function (Blueprint $table) {
                $table->id();
                $table->char('uuid', 36);
                $table->unsignedBigInteger('post_comment_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('reply');
                $table->boolean('is_approved')->default(false);
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        // Deliberately empty — see the docblock.
    }
};
